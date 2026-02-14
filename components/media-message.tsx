"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Image as ImageIcon, Play } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface MediaMessageProps {
  messageId: string;
  mediaUrl: string;
  mediaType: "image" | "video";
  isRevealed: boolean;
  isOwn: boolean;
  userColor: string;
  expiresAt?: string;
}

export function MediaMessage({
  messageId,
  mediaUrl,
  mediaType,
  isRevealed: initialRevealed,
  isOwn,
  userColor,
  expiresAt,
}: MediaMessageProps) {
  const [isRevealed, setIsRevealed] = useState(initialRevealed);
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // Countdown for revealed media
  useEffect(() => {
    if (!isRevealed || !expiresAt) return;

    const updateTimeLeft = () => {
      const now = Date.now();
      const expiry = new Date(expiresAt).getTime();
      const remaining = Math.max(0, Math.floor((expiry - now) / 1000));
      setTimeLeft(remaining);
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [isRevealed, expiresAt]);

  const handleReveal = async () => {
    if (isOwn || isRevealed || isLoading) return;

    setIsLoading(true);
    try {
      const supabase = createClient();
      const expiresAtTime = new Date(Date.now() + 6 * 60 * 1000).toISOString();

      await supabase
        .from("messages")
        .update({
          is_media_revealed: true,
          is_read: true,
          read_at: new Date().toISOString(),
          expires_at: expiresAtTime,
        })
        .eq("id", messageId);

      setIsRevealed(true);
    } catch (error) {
      console.error("Failed to reveal media:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="relative w-full max-w-[280px]">
      <AnimatePresence mode="wait">
        {!isRevealed ? (
          <motion.button
            key="hidden"
            onClick={handleReveal}
            disabled={isOwn || isLoading}
            className={`
              relative w-full aspect-[4/3] rounded-xl overflow-hidden
              flex flex-col items-center justify-center gap-3
              transition-all duration-300
              ${isOwn ? "cursor-default" : "cursor-pointer hover:scale-[1.02]"}
            `}
            style={{
              background: `linear-gradient(135deg, ${userColor}20, ${userColor}40)`,
              border: `2px dashed ${userColor}60`,
            }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            whileHover={!isOwn ? { scale: 1.02 } : {}}
            whileTap={!isOwn ? { scale: 0.98 } : {}}
          >
            {/* Blur overlay effect */}
            <div 
              className="absolute inset-0 backdrop-blur-md"
              style={{ backgroundColor: `${userColor}10` }}
            />
            
            <div className="relative z-10 flex flex-col items-center gap-2">
              {mediaType === "image" ? (
                <ImageIcon size={32} style={{ color: userColor }} />
              ) : (
                <Play size={32} style={{ color: userColor }} />
              )}
              
              {isOwn ? (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <EyeOff size={14} />
                  <span>未開封</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-sm" style={{ color: userColor }}>
                  <Eye size={14} />
                  <span>{isLoading ? "開封中..." : "タップして開封"}</span>
                </div>
              )}
            </div>

            {/* Animated border glow */}
            {!isOwn && (
              <motion.div
                className="absolute inset-0 rounded-xl pointer-events-none"
                style={{
                  boxShadow: `0 0 20px ${userColor}40, inset 0 0 20px ${userColor}20`,
                }}
                animate={{
                  boxShadow: [
                    `0 0 20px ${userColor}40, inset 0 0 20px ${userColor}20`,
                    `0 0 30px ${userColor}60, inset 0 0 30px ${userColor}30`,
                    `0 0 20px ${userColor}40, inset 0 0 20px ${userColor}20`,
                  ],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            )}
          </motion.button>
        ) : (
          <motion.div
            key="revealed"
            className="relative w-full rounded-xl overflow-hidden"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            {mediaType === "image" ? (
              <img
                src={mediaUrl}
                alt="Shared media"
                className="w-full h-auto rounded-xl"
                style={{
                  boxShadow: `0 0 20px ${userColor}40`,
                }}
              />
            ) : (
              <video
                src={mediaUrl}
                controls
                autoPlay
                muted
                playsInline
                className="w-full h-auto rounded-xl"
                style={{
                  boxShadow: `0 0 20px ${userColor}40`,
                }}
              />
            )}

            {/* Countdown overlay */}
            {timeLeft !== null && timeLeft > 0 && (
              <motion.div
                className="absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-mono"
                style={{
                  backgroundColor: `${userColor}cc`,
                  color: "#000",
                }}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {formatTime(timeLeft)}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
