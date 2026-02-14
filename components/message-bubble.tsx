"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Clock, Eye, EyeOff, ImageIcon, Play } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Message {
  id: string;
  content: string;
  is_read: boolean;
  read_at: string | null;
  expires_at: string | null;
  created_at: string;
  media_url?: string;
  media_type?: "image" | "video";
  is_media_revealed?: boolean;
}

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  userColor: string;
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

// Media preview component with Tap-to-Reveal
function MediaPreview({
  message,
  isOwn,
  userColor,
}: {
  message: Message;
  isOwn: boolean;
  userColor: string;
}) {
  const [isRevealed, setIsRevealed] = useState(message.is_media_revealed || false);
  const [isLoading, setIsLoading] = useState(false);

  const handleReveal = async () => {
    if (isOwn || isRevealed || isLoading) return;

    setIsLoading(true);
    try {
      const supabase = createClient();
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 6 * 60 * 1000);

      await supabase
        .from("messages")
        .update({
          is_media_revealed: true,
          is_read: true,
          read_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
        })
        .eq("id", message.id);

      setIsRevealed(true);
    } catch (error) {
      console.error("Failed to reveal media:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Update local state when message updates
  useEffect(() => {
    setIsRevealed(message.is_media_revealed || false);
  }, [message.is_media_revealed]);

  if (!isRevealed) {
    return (
      <motion.button
        onClick={handleReveal}
        disabled={isOwn || isLoading}
        className={cn(
          "relative w-full aspect-[4/3] rounded-xl overflow-hidden",
          "flex flex-col items-center justify-center gap-3",
          "transition-all duration-300",
          isOwn ? "cursor-default" : "cursor-pointer hover:scale-[1.02]"
        )}
        style={{
          background: `linear-gradient(135deg, ${userColor}20, ${userColor}40)`,
          border: `2px dashed ${userColor}60`,
        }}
        whileHover={!isOwn ? { scale: 1.02 } : {}}
        whileTap={!isOwn ? { scale: 0.98 } : {}}
      >
        {/* Blur overlay */}
        <div
          className="absolute inset-0 backdrop-blur-md"
          style={{ backgroundColor: `${userColor}10` }}
        />

        <div className="relative z-10 flex flex-col items-center gap-2">
          {message.media_type === "video" ? (
            <Play size={32} style={{ color: userColor }} />
          ) : (
            <ImageIcon size={32} style={{ color: userColor }} />
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
    );
  }

  return (
    <div className="w-full rounded-xl overflow-hidden">
      {message.media_type === "video" ? (
        <video
          src={message.media_url}
          controls
          autoPlay
          muted
          playsInline
          className="w-full h-auto rounded-xl"
          style={{
            boxShadow: `0 0 20px ${userColor}40`,
          }}
        />
      ) : (
        <img
          src={message.media_url}
          alt="Shared media"
          className="w-full h-auto rounded-xl"
          style={{
            boxShadow: `0 0 20px ${userColor}40`,
          }}
        />
      )}
    </div>
  );
}

export function MessageBubble({ message, isOwn, userColor, onRead }: MessageBubbleProps) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isDissolving, setIsDissolving] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const isMediaMessage = !!message.media_url;

  // Mark as read when viewing other's text messages
  useEffect(() => {
    if (!isOwn && !message.is_read && !isMediaMessage) {
      onRead();
    }
  }, [isOwn, message.is_read, isMediaMessage, onRead]);

  // Countdown timer for read messages
  useEffect(() => {
    if (!message.expires_at) {
      setTimeLeft(null);
      return;
    }

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
  }, [message.expires_at, message.id]);

  const formatTime = useCallback((seconds: number) => {
    // 360秒〜61秒：分単位で表示
    if (seconds > 60) {
      const mins = Math.ceil(seconds / 60); // 切り上げで「残り○分」を表示
      return `残り${mins}分`;
    }
    // 60秒以下：秒単位で表示
    return `${seconds}s`;
  }, []);

  const formatCreatedAt = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  const isUrgent = timeLeft !== null && timeLeft <= 60;
  const isCritical = timeLeft !== null && timeLeft <= 10;

  // Generate ash particles with user color
  const ashParticles = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => (
        <AshParticle key={i} index={i} color={userColor} />
      )),
    [userColor]
  );

  // Don't render if fully dissolved - but do this with display: none to avoid hook order issues
  if (!isVisible) {
    return <div style={{ display: "none" }} />;
  }

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
            "max-w-[80%] rounded-2xl px-4 py-2.5 space-y-2 relative overflow-hidden",
            isOwn ? "rounded-br-md" : "rounded-bl-md",
            isDissolving && "opacity-50"
          )}
          style={{
            background: isOwn
              ? `linear-gradient(135deg, ${userColor}30, ${userColor}15)`
              : `linear-gradient(135deg, ${userColor}20, ${userColor}10)`,
            borderLeft: isOwn ? "none" : `3px solid ${userColor}`,
            borderRight: isOwn ? `3px solid ${userColor}` : "none",
          }}
        >
          {/* Urgent glow effect */}
          {isUrgent && !isDissolving && (
            <motion.div
              className="absolute inset-0 rounded-2xl pointer-events-none"
              style={{
                boxShadow: isCritical
                  ? `inset 0 0 20px ${userColor}60, 0 0 20px ${userColor}40`
                  : `inset 0 0 15px ${userColor}40`,
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

          {/* Media content */}
          {isMediaMessage ? (
            <MediaPreview message={message} isOwn={isOwn} userColor={userColor} />
          ) : (
            <p className="text-sm leading-relaxed break-words relative z-10 text-foreground whitespace-pre-wrap">
              {message.content}
            </p>
          )}

          <div
            className={cn(
              "flex items-center gap-2 text-[10px] relative z-10 text-muted-foreground",
              isOwn ? "justify-end" : "justify-start"
            )}
          >
            <span className="font-mono">{formatCreatedAt(message.created_at)}</span>

            {/* Countdown timer with futuristic styling */}
            {timeLeft !== null && (
              <motion.span
                className={cn(
                  "flex items-center gap-0.5 font-mono tabular-nums tracking-wider"
                )}
                style={{
                  color: isCritical ? "#ff2d92" : isUrgent ? userColor : undefined,
                }}
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
                {message.is_read || message.is_media_revealed ? "既読" : "未読"}
              </span>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
