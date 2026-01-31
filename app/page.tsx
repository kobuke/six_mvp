"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Clock, Lock, MessageSquare } from "lucide-react";
import { SixLoader } from "@/components/six-loader";
import { getOrCreateUserUUID } from "@/lib/crypto";

export default function HomePage() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [roomCode, setRoomCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [userUUID, setUserUUID] = useState<string>("");

  // Get or create user UUID on mount
  useEffect(() => {
    const uuid = getOrCreateUserUUID();
    setUserUUID(uuid);
  }, []);

  const createRoom = async () => {
    if (!userUUID) return;
    
    setIsCreating(true);
    try {
      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creator_uuid: userUUID }),
      });
      const data = await response.json();
      if (data.roomId) {
        router.push(`/room/${data.roomId}`);
      }
    } catch (error) {
      console.error("Failed to create room:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const joinRoom = async () => {
    if (!roomCode.trim()) return;
    setIsJoining(true);
    router.push(`/room/${roomCode.trim()}`);
  };

  const features = [
    { icon: Clock, label: "6分で消滅", delay: 0.1 },
    { icon: Lock, label: "6日で閉鎖", delay: 0.2 },
    { icon: MessageSquare, label: "1対1限定", delay: 0.3 },
  ];

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

      <div className="relative z-10 w-full max-w-md space-y-12">
        {/* Logo & Tagline */}
        <motion.header
          className="text-center space-y-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-7xl font-light tracking-tight text-foreground">
            Si<span className="text-gradient-six">X</span>
          </h1>
          <p className="text-muted-foreground text-lg font-light tracking-wide">
            6分で消える、6日で閉じる
          </p>
        </motion.header>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 text-center">
          {features.map(({ icon: Icon, label, delay }) => (
            <motion.div
              key={label}
              className="space-y-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay }}
            >
              <motion.div
                className="mx-auto w-12 h-12 rounded-full bg-secondary/50 border border-border/50 flex items-center justify-center"
                whileHover={{
                  scale: 1.1,
                  boxShadow: "0 0 20px hsl(var(--six-pink) / 0.3)",
                }}
              >
                <Icon className="w-5 h-5 text-muted-foreground" />
              </motion.div>
              <p className="text-xs text-muted-foreground">{label}</p>
            </motion.div>
          ))}
        </div>

        {/* Actions */}
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <Button
            onClick={createRoom}
            disabled={isCreating}
            className="w-full h-14 text-lg font-medium bg-gradient-to-r from-six-pink to-six-purple text-white hover:opacity-90 transition-all animate-glow-pulse"
          >
            {isCreating ? (
              <span className="flex items-center gap-3">
                <SixLoader size="sm" />
                部屋を作成中...
              </span>
            ) : (
              "新しい部屋を作る"
            )}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/50" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-4 text-muted-foreground">または</span>
            </div>
          </div>

          <div className="space-y-3">
            <Input
              type="text"
              placeholder="ルームIDを入力"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && joinRoom()}
              className="h-14 text-center text-lg bg-secondary/30 border-border/50 placeholder:text-muted-foreground/50 focus:border-six-purple/50 focus:ring-six-purple/20 font-mono"
            />
            <Button
              onClick={joinRoom}
              disabled={!roomCode.trim() || isJoining}
              variant="outline"
              className="w-full h-12 border-border/50 hover:border-six-purple/50 hover:bg-six-purple/10 transition-all"
            >
              {isJoining ? (
                <span className="flex items-center gap-3">
                  <SixLoader size="sm" />
                  参加中...
                </span>
              ) : (
                "部屋に参加"
              )}
            </Button>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.footer
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.6 }}
        >
          <p className="text-xs text-muted-foreground/60">
            痕跡を残さない、二人だけの特別な空間
          </p>
        </motion.footer>
      </div>
    </main>
  );
}
