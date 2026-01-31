"use client";

import { motion } from "framer-motion";

interface SixLoaderProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function SixLoader({ size = "md", className = "" }: SixLoaderProps) {
  const sizeConfig = {
    sm: { container: 24, dot: 4, radius: 8 },
    md: { container: 48, dot: 6, radius: 16 },
    lg: { container: 72, dot: 8, radius: 24 },
  };

  const { container, dot, radius } = sizeConfig[size];

  // 6 dots with gradient colors from toxic pink to neon purple
  const dotColors = [
    "#ff2d92", // toxic pink
    "#ff1493", // deep pink
    "#e91e8c", // magenta pink
    "#d426ff", // neon purple
    "#b444ff", // bright purple
    "#9d4edd", // soft purple
  ];

  return (
    <div
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: container, height: container }}
    >
      {dotColors.map((color, index) => {
        const angle = (index / 6) * 360;
        const delay = index * 0.12;

        return (
          <motion.div
            key={index}
            className="absolute rounded-full"
            style={{
              width: dot,
              height: dot,
              backgroundColor: color,
              boxShadow: `0 0 ${dot * 2}px ${color}`,
            }}
            animate={{
              rotate: [angle, angle + 360],
              scale: [1, 1.2, 0.8, 1],
              opacity: [0.6, 1, 0.6],
            }}
            transition={{
              rotate: {
                duration: 1.8,
                repeat: Infinity,
                ease: "linear",
              },
              scale: {
                duration: 1.2,
                repeat: Infinity,
                ease: "easeInOut",
                delay,
              },
              opacity: {
                duration: 1.2,
                repeat: Infinity,
                ease: "easeInOut",
                delay,
              },
            }}
            initial={{
              x: Math.cos((angle * Math.PI) / 180) * radius,
              y: Math.sin((angle * Math.PI) / 180) * radius,
            }}
            custom={index}
          />
        );
      })}
    </div>
  );
}

// Full page loading screen
export function SixLoadingScreen({ text = "読み込み中..." }: { text?: string }) {
  return (
    <main className="h-dvh flex flex-col items-center justify-center bg-background gap-6">
      <SixLoader size="lg" />
      <motion.p
        className="text-muted-foreground text-sm font-mono"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {text}
      </motion.p>
    </main>
  );
}
