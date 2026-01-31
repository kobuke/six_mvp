"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Clock } from "lucide-react";

interface RoomStatusProps {
  lastActivityAt: string; // 最後のメッセージまたはアクティビティの時刻
}

export function RoomStatus({ lastActivityAt }: RoomStatusProps) {
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date().getTime();
      const lastActivity = new Date(lastActivityAt).getTime();
      const diffMs = now - lastActivity;
      
      // 6時間 = 21600000ms
      const sixHoursMs = 6 * 60 * 60 * 1000;
      const remainingMs = sixHoursMs - diffMs;

      if (remainingMs <= 0) {
        setTimeLeft("期限切れ");
        setIsUrgent(true);
        return;
      }

      const remainingMins = Math.floor(remainingMs / (1000 * 60));
      const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));

      // 6分以内は緊急
      setIsUrgent(remainingMins <= 6);

      // 残り6分以内：分単位で表示
      if (remainingMins <= 6) {
        setTimeLeft(`あと${remainingMins}min`);
      } else {
        // 残り6時間〜6分：1時間単位で表示
        setTimeLeft(`あと${remainingHours}時間`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000);

    return () => clearInterval(interval);
  }, [lastActivityAt]);

  return (
    <motion.span
      className={`flex items-center gap-1 font-mono text-[10px] tabular-nums ${
        isUrgent ? "text-six-pink" : "text-muted-foreground"
      }`}
      animate={isUrgent ? { opacity: [1, 0.5, 1] } : {}}
      transition={{ duration: 1.5, repeat: Infinity }}
    >
      <Clock className="w-3 h-3" />
      {timeLeft}
    </motion.span>
  );
}
