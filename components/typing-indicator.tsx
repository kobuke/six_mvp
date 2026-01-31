"use client";

import { motion } from "framer-motion";

interface TypingIndicatorProps {
  color: string;
}

export function TypingIndicator({ color }: TypingIndicatorProps) {
  return (
    <motion.div
      className="flex items-center gap-2 py-2"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
    >
      <div className="flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: color }}
            animate={{
              y: [0, -4, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.15,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
      <span
        className="text-xs font-medium"
        style={{ color }}
      >
        Typing...
      </span>
    </motion.div>
  );
}
