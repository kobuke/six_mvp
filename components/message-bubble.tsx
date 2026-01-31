"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";

interface Message {
  id: string;
  content: string;
  is_read: boolean;
  read_at: string | null;
  expires_at: string | null;
  created_at: string;
}

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  onRead: () => void;
}

// Ash particle component for dissolution effect
function AshParticle({ index, color }: { index: number; color: string }) {
  const randomX = useMemo(() => (Math.random() - 0.5) * 100, []);
  const randomY = useMemo(() => -Math.random() * 80 - 20, []);
  const randomRotate = useMemo(() => (Math.random() - 0.5) * 360, []);
  const randomScale = useMemo(() => 0.3 + Math.random() * 0.7, []);
  const randomDelay = useMemo(() => index * 0.02, [index]);

  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        width: 4 + Math.random() * 4,
        height: 4 + Math.random() * 4,
        backgroundColor: color,
        left: `${10 + (index % 10) * 8}%`,
        top: `${20 + Math.floor(index / 10) * 20}%`,
      }}
      initial={{ opacity: 1, x: 0, y: 0, scale: 1, rotate: 0 }}
      animate={{
        opacity: 0,
        x: randomX,
        y: randomY,
        scale: randomScale,
        rotate: randomRotate,
      }}
      transition={{
        duration: 1.2,
        delay: randomDelay,
        ease: "easeOut",
      }}
    />
  );
}

export function MessageBubble({ message, isOwn, onRead }: MessageBubbleProps) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isDissolving, setIsDissolving] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  // Mark as read when viewing other's messages
  useEffect(() => {
    if (!isOwn && !message.is_read) {
      onRead();
    }
  }, [isOwn, message.is_read, onRead]);

  // Countdown timer for read messages
  useEffect(() => {
    if (!message.expires_at) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const expires = new Date(message.expires_at!).getTime();
      const remaining = Math.max(0, Math.floor((expires - now) / 1000));

      if (remaining <= 0) {
        setIsDissolving(true);
        setTimeout(() => setIsVisible(false), 1500);
        setTimeLeft(0);
      } else {
        setTimeLeft(remaining);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [message.expires_at]);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }, []);

  const formatCreatedAt = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  // Don't render if fully dissolved
  if (!isVisible) {
    return null;
  }

  const isUrgent = timeLeft !== null && timeLeft <= 60;
  const isCritical = timeLeft !== null && timeLeft <= 10;
  const bubbleColor = isOwn ? "#1a1a1a" : "#1f1f1f";
  const ashColor = isOwn ? "#666" : "#888";

  // Generate ash particles
  const ashParticles = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => (
        <AshParticle key={i} index={i} color={ashColor} />
      )),
    [ashColor]
  );

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={message.id}
        className={cn("flex relative", isOwn ? "justify-end" : "justify-start")}
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{
          opacity: isDissolving ? 0 : 1,
          y: isDissolving ? -10 : 0,
          scale: isDissolving ? 0.95 : 1,
          filter: isDissolving ? "blur(2px)" : "blur(0px)",
        }}
        exit={{ opacity: 0, y: -20, scale: 0.9 }}
        transition={{
          duration: isDissolving ? 1.2 : 0.3,
          ease: isDissolving ? "easeOut" : "easeOut",
        }}
      >
        {/* Ash particles overlay during dissolution */}
        {isDissolving && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {ashParticles}
          </div>
        )}

        <div
          className={cn(
            "max-w-[80%] rounded-2xl px-4 py-2.5 space-y-1 relative overflow-hidden",
            isOwn
              ? "bg-gradient-to-br from-foreground to-foreground/90 text-background rounded-br-md"
              : "bg-gradient-to-br from-secondary to-secondary/80 text-foreground rounded-bl-md",
            isDissolving && "opacity-50"
          )}
        >
          {/* Urgent glow effect */}
          {isUrgent && !isDissolving && (
            <motion.div
              className="absolute inset-0 rounded-2xl pointer-events-none"
              style={{
                boxShadow: isCritical
                  ? "inset 0 0 20px rgba(255, 45, 146, 0.4), 0 0 20px rgba(255, 45, 146, 0.2)"
                  : "inset 0 0 15px rgba(212, 38, 255, 0.3)",
              }}
              animate={{
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: isCritical ? 0.5 : 1,
                repeat: Infinity,
              }}
            />
          )}

          <p className="text-sm leading-relaxed break-words relative z-10">
            {message.content}
          </p>

          <div
            className={cn(
              "flex items-center gap-2 text-[10px] relative z-10",
              isOwn ? "text-background/60 justify-end" : "text-muted-foreground"
            )}
          >
            <span className="font-mono">{formatCreatedAt(message.created_at)}</span>

            {/* Countdown timer with futuristic styling */}
            {timeLeft !== null && (
              <motion.span
                className={cn(
                  "flex items-center gap-0.5 font-mono tabular-nums tracking-wider",
                  isCritical && "text-six-pink",
                  isUrgent && !isCritical && "text-six-purple"
                )}
                animate={
                  isUrgent
                    ? {
                        opacity: [1, 0.4, 1],
                        scale: isCritical ? [1, 1.1, 1] : [1, 1.05, 1],
                      }
                    : {}
                }
                transition={{
                  duration: isCritical ? 0.3 : 0.8,
                  repeat: Infinity,
                }}
              >
                <Clock className="w-3 h-3" />
                {formatTime(timeLeft)}
              </motion.span>
            )}

            {/* Read status for own messages */}
            {isOwn && (
              <span className="font-sans">
                {message.is_read ? "既読" : "未読"}
              </span>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
