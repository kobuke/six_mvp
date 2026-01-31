"use client";

import { useEffect, useState } from "react";
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

export function MessageBubble({ message, isOwn, onRead }: MessageBubbleProps) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isExpired, setIsExpired] = useState(false);

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
        setIsExpired(true);
        setTimeLeft(0);
      } else {
        setTimeLeft(remaining);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [message.expires_at]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatCreatedAt = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Don't render expired messages
  if (isExpired) {
    return null;
  }

  const isUrgent = timeLeft !== null && timeLeft <= 60; // Last minute

  return (
    <div
      className={cn(
        "flex animate-fade-in",
        isOwn ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2.5 space-y-1",
          isOwn
            ? "bg-foreground text-background rounded-br-md"
            : "bg-secondary text-foreground rounded-bl-md"
        )}
      >
        <p className="text-sm leading-relaxed break-words">{message.content}</p>
        <div
          className={cn(
            "flex items-center gap-2 text-[10px]",
            isOwn ? "text-background/60 justify-end" : "text-muted-foreground"
          )}
        >
          <span>{formatCreatedAt(message.created_at)}</span>
          
          {/* Show countdown if message has been read */}
          {timeLeft !== null && (
            <span
              className={cn(
                "flex items-center gap-0.5",
                isUrgent && "text-destructive animate-pulse-warning"
              )}
            >
              <Clock className="w-3 h-3" />
              {formatTime(timeLeft)}
            </span>
          )}
          
          {/* Show read status for own messages */}
          {isOwn && (
            <span>
              {message.is_read ? "既読" : "未読"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
