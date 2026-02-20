"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { SixLoader } from "@/components/six-loader";
import { ColorPicker, SIX_COLORS } from "@/components/color-picker";
import { RoomHistoryList } from "@/components/room-history-list";
import { getUserUUID, generateRoomKey } from "@/lib/crypto";
import { createClient } from "@/lib/supabase/client";
import { useSpring, useTransform } from "framer-motion";

type Step = "lobby" | "create";

export default function HomePage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("lobby");
  const [isCreating, setIsCreating] = useState(false);
  const [userUUID, setUserUUID] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>(SIX_COLORS[0].hex);
  const [roomCount, setRoomCount] = useState<number | null>(null);

  // Animation for room count
  const countSpring = useSpring(0, { stiffness: 50, damping: 20 });
  const countDisplay = useTransform(countSpring, (current) => Math.round(current).toLocaleString());

  // Get or create user UUID on mount & Fetch room count
  useEffect(() => {
    const uuid = getUserUUID();
    setUserUUID(uuid);

    const fetchStats = async () => {
      const supabase = createClient();
      const { data } = await supabase.from("room_stats").select("total_created").single();
      if (data?.total_created !== undefined) {
        setRoomCount(data.total_created);
      }
    };
    fetchStats();
  }, []);

  // Update spring when roomCount changes
  useEffect(() => {
    if (roomCount !== null) {
      countSpring.set(roomCount);
    }
  }, [roomCount, countSpring]);

  const createRoom = async () => {
    if (!userUUID) return;

    setIsCreating(true);
    try {
      const key = await generateRoomKey();

      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creator_uuid: userUUID,
          creator_color: selectedColor,
        }),
      });
      const data = await response.json();
      if (data.roomId) {
        // Redirect with encryption key in hash
        router.push(`/room/${data.roomId}#${key}`);
      }
    } catch (error) {
      console.error("Failed to create room:", error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <main className="h-dvh flex flex-col items-center justify-center px-4 overflow-hidden">
      {/* Animated background grid */}
      <div className="fixed inset-0 bg-grid-six pointer-events-none" />

      {/* Gradient orbs */}
      <motion.div
        className="fixed top-1/4 -left-32 w-64 h-64 bg-six-pink/10 rounded-full blur-3xl"
        animate={{
          x: [0, 20, 0],
          y: [0, -20, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      <motion.div
        className="fixed bottom-1/4 -right-32 w-64 h-64 bg-six-purple/10 rounded-full blur-3xl"
        animate={{
          x: [0, -20, 0],
          y: [0, 20, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 8, repeat: Infinity, delay: 2 }}
      />

      <div className="relative z-10 w-full max-w-md">
        <AnimatePresence mode="wait">
          {step === "lobby" && (
            <motion.div
              key="lobby"
              className="space-y-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Logo & Tagline */}
              <header className="text-center space-y-3">
                <h1 className="text-7xl font-light tracking-tight text-foreground">
                  Si<span className="text-gradient-six">X</span>
                </h1>
                <p className="text-muted-foreground text-lg font-light tracking-wide">
                  Gone in 6 min, closed in 6 hours
                </p>
              </header>

              {/* Action Buttons */}
              <div className="space-y-4">
                {roomCount !== null && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-center"
                  >
                    <p className="text-sm text-muted-foreground/80 font-light">
                      <motion.span className="text-lg font-medium text-foreground mx-1">{countDisplay}</motion.span> secret rooms created so far
                    </p>
                  </motion.div>
                )}

                <Button
                  onClick={() => setStep("create")}
                  className="w-full h-16 text-lg font-medium bg-gradient-to-r from-six-pink to-six-purple text-white hover:opacity-90 transition-all animate-glow-pulse"
                >
                  <Plus className="mr-2" size={20} />
                  Create a New Room
                </Button>
              </div>

              {/* Room History */}
              <RoomHistoryList onRoomSelect={() => { }} />

              {/* Footer */}
              <footer className="text-center">
                <p className="text-xs text-muted-foreground/60">
                  Invite via URL or QR code for a private space just for two
                </p>
              </footer>
            </motion.div>
          )}

          {step === "create" && (
            <motion.div
              key="create"
              className="space-y-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Header */}
              <header className="text-center space-y-2">
                <h2 className="text-2xl font-light">Choose Your Color</h2>
                <p className="text-sm text-muted-foreground">
                  Pick a color for your messages
                </p>
              </header>

              {/* Color Picker */}
              <div className="py-4">
                <ColorPicker
                  selectedColor={selectedColor}
                  onColorSelect={(color) => setSelectedColor(color)}
                  size="lg"
                />
              </div>

              {/* Selected Color Preview */}
              <div className="text-center">
                <div
                  className="inline-block px-4 py-2 rounded-2xl text-sm"
                  style={{
                    backgroundColor: `${selectedColor}20`,
                    border: `1px solid ${selectedColor}40`,
                    color: selectedColor,
                  }}
                >
                  Preview: Your message
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <Button
                  onClick={createRoom}
                  disabled={isCreating}
                  className="w-full h-14 text-lg font-medium"
                  style={{
                    background: `linear-gradient(135deg, ${selectedColor}, ${selectedColor}cc)`,
                    boxShadow: `0 0 20px ${selectedColor}40`,
                  }}
                >
                  {isCreating ? (
                    <span className="flex items-center gap-3">
                      <SixLoader size="sm" />
                      Creating...
                    </span>
                  ) : (
                    "Create Room"
                  )}
                </Button>

                <Button
                  onClick={() => setStep("lobby")}
                  variant="ghost"
                  className="w-full text-muted-foreground hover:text-foreground"
                >
                  Back
                </Button>
              </div>
            </motion.div>
          )}


        </AnimatePresence>
      </div>
    </main>
  );
}
