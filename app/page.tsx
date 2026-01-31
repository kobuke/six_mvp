"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, ArrowRight } from "lucide-react";
import { SixLoader } from "@/components/six-loader";
import { ColorPicker, SIX_COLORS } from "@/components/color-picker";
import { RoomHistoryList } from "@/components/room-history-list";
import { getUserUUID } from "@/lib/crypto";

type Step = "lobby" | "create" | "join";

export default function HomePage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("lobby");
  const [isCreating, setIsCreating] = useState(false);
  const [roomCode, setRoomCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [userUUID, setUserUUID] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState(SIX_COLORS[0].hex);

  // Get or create user UUID on mount
  useEffect(() => {
    const uuid = getUserUUID();
    setUserUUID(uuid);
  }, []);

  const createRoom = async () => {
    if (!userUUID) return;
    
    setIsCreating(true);
    try {
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
    // Store selected color for join
    sessionStorage.setItem("six_join_color", selectedColor);
    router.push(`/room/${roomCode.trim()}`);
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
                  6分で消える、6日で閉じる
                </p>
              </header>

              {/* Action Buttons */}
              <div className="space-y-4">
                <Button
                  onClick={() => setStep("create")}
                  className="w-full h-16 text-lg font-medium bg-gradient-to-r from-six-pink to-six-purple text-white hover:opacity-90 transition-all animate-glow-pulse"
                >
                  <Plus className="mr-2" size={20} />
                  新しい部屋を作る
                </Button>

                <Button
                  onClick={() => setStep("join")}
                  variant="outline"
                  className="w-full h-14 text-base border-border/50 hover:border-six-purple/50 hover:bg-six-purple/10 transition-all"
                >
                  <ArrowRight className="mr-2" size={18} />
                  ルームIDで参加
                </Button>
              </div>

              {/* Room History */}
              <RoomHistoryList onRoomSelect={() => {}} />

              {/* Footer */}
              <footer className="text-center">
                <p className="text-xs text-muted-foreground/60">
                  痕跡を残さない、二人だけの特別な空間
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
                <h2 className="text-2xl font-light">カラーを選択</h2>
                <p className="text-sm text-muted-foreground">
                  あなたのメッセージカラーを選んでください
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
                  プレビュー: あなたのメッセージ
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
                      作成中...
                    </span>
                  ) : (
                    "部屋を作成"
                  )}
                </Button>

                <Button
                  onClick={() => setStep("lobby")}
                  variant="ghost"
                  className="w-full text-muted-foreground hover:text-foreground"
                >
                  戻る
                </Button>
              </div>
            </motion.div>
          )}

          {step === "join" && (
            <motion.div
              key="join"
              className="space-y-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Header */}
              <header className="text-center space-y-2">
                <h2 className="text-2xl font-light">ルームに参加</h2>
                <p className="text-sm text-muted-foreground">
                  ルームIDを入力してカラーを選択
                </p>
              </header>

              {/* Room ID Input */}
              <Input
                type="text"
                placeholder="ルームIDを入力"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && roomCode.trim() && joinRoom()}
                className="h-14 text-center text-lg bg-secondary/30 border-border/50 placeholder:text-muted-foreground/50 focus:border-six-purple/50 focus:ring-six-purple/20 font-mono"
                autoFocus
              />

              {/* Color Picker */}
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground text-center">
                  あなたのカラーを選択
                </p>
                <ColorPicker
                  selectedColor={selectedColor}
                  onColorSelect={(color) => setSelectedColor(color)}
                  size="md"
                />
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <Button
                  onClick={joinRoom}
                  disabled={!roomCode.trim() || isJoining}
                  className="w-full h-14 text-lg font-medium"
                  style={{
                    background: roomCode.trim() 
                      ? `linear-gradient(135deg, ${selectedColor}, ${selectedColor}cc)` 
                      : undefined,
                    boxShadow: roomCode.trim() ? `0 0 20px ${selectedColor}40` : undefined,
                  }}
                >
                  {isJoining ? (
                    <span className="flex items-center gap-3">
                      <SixLoader size="sm" />
                      参加中...
                    </span>
                  ) : (
                    "参加する"
                  )}
                </Button>

                <Button
                  onClick={() => setStep("lobby")}
                  variant="ghost"
                  className="w-full text-muted-foreground hover:text-foreground"
                >
                  戻る
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
