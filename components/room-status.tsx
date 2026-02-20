"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Clock } from "lucide-react";

interface RoomStatusProps {
  closesAt: string;
}

export function RoomStatus({ closesAt }: RoomStatusProps) {
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date().getTime();
      const closes = new Date(closesAt).getTime();
      const remaining = Math.max(0, closes - now);

      if (remaining <= 0) {
        setTimeLeft("Closed");
        setIsUrgent(true);
        return;
      }

      const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
      const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

      // Urgent if less than 1 day remaining
      setIsUrgent(days < 1);

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h left`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m left`);
      } else {
        setTimeLeft(`${minutes}m left`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000);

    return () => clearInterval(interval);
  }, [closesAt]);

  return (
    <motion.span
      className={`flex items-center gap-1 font-mono text-[10px] tabular-nums ${isUrgent ? "text-six-pink" : "text-muted-foreground"
        }`}
      animate={isUrgent ? { opacity: [1, 0.5, 1] } : {}}
      transition={{ duration: 1.5, repeat: Infinity }}
    >
      <Clock className="w-3 h-3" />
      {timeLeft}
    </motion.span>
  );
}
