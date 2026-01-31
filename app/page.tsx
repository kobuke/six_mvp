"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Clock, Lock, MessageSquare, Sparkles } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [roomCode, setRoomCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  const createRoom = async () => {
    setIsCreating(true);
    try {
      const response = await fetch("/api/rooms", {
        method: "POST",
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

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      {/* Background grid pattern */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" />
      
      <div className="relative z-10 w-full max-w-md space-y-12">
        {/* Logo & Tagline */}
        <header className="text-center space-y-4">
          <h1 className="text-6xl font-light tracking-tight text-foreground">
            Si<span className="text-accent">X</span>
          </h1>
          <p className="text-muted-foreground text-lg font-light tracking-wide">
            6分で消える、6日で閉じる
          </p>
        </header>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-2">
            <div className="mx-auto w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
              <Clock className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">6分で消滅</p>
          </div>
          <div className="space-y-2">
            <div className="mx-auto w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
              <Lock className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">6日で閉鎖</p>
          </div>
          <div className="space-y-2">
            <div className="mx-auto w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">1対1限定</p>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-6">
          <Button
            onClick={createRoom}
            disabled={isCreating}
            className="w-full h-14 text-lg font-medium bg-foreground text-background hover:bg-foreground/90 transition-all"
          >
            {isCreating ? (
              <span className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 animate-pulse" />
                部屋を作成中...
              </span>
            ) : (
              "新しい部屋を作る"
            )}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
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
              className="h-14 text-center text-lg bg-secondary border-border placeholder:text-muted-foreground/50"
            />
            <Button
              onClick={joinRoom}
              disabled={!roomCode.trim() || isJoining}
              variant="outline"
              className="w-full h-12 border-border hover:bg-secondary"
            >
              {isJoining ? "参加中..." : "部屋に参加"}
            </Button>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center">
          <p className="text-xs text-muted-foreground/60">
            痕跡を残さない、二人だけの特別な空間
          </p>
        </footer>
      </div>
    </main>
  );
}
