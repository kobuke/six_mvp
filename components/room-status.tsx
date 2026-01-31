"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

interface RoomStatusProps {
  closesAt: string;
}

export function RoomStatus({ closesAt }: RoomStatusProps) {
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date().getTime();
      const closes = new Date(closesAt).getTime();
      const remaining = Math.max(0, closes - now);

      if (remaining <= 0) {
        setTimeLeft("閉鎖済み");
        return;
      }

      const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
      const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setTimeLeft(`残り${days}日${hours}時間`);
      } else if (hours > 0) {
        setTimeLeft(`残り${hours}時間${minutes}分`);
      } else {
        setTimeLeft(`残り${minutes}分`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [closesAt]);

  return (
    <span className="flex items-center gap-1">
      <Clock className="w-3 h-3" />
      {timeLeft}
    </span>
  );
}
