"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface SixLoaderProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function SixLoader({ size = "md", className = "" }: SixLoaderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  // Pre-calculated positions to avoid hydration mismatch
  const positions = [
    { x: radius, y: 0 },           // 0°
    { x: radius * 0.5, y: radius * 0.866 },  // 60°
    { x: -radius * 0.5, y: radius * 0.866 }, // 120°
    { x: -radius, y: 0 },          // 180°
    { x: -radius * 0.5, y: -radius * 0.866 }, // 240°
    { x: radius * 0.5, y: -radius * 0.866 },  // 300°
  ];

  if (!mounted) {
    return (
      <div
        className={`relative flex items-center justify-center ${className}`}
        style={{ width: container, height: container }}
      />
    );
  }

  return (
    <div
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: container, height: container }}
    >
      {dotColors.map((color, index) => {
        const angle = (index / 6) * 360;
        const delay = index * 0.12;
        const pos = positions[index];

        return (
          <motion.div
            key={index}
            className="absolute rounded-full"
            style={{
              width: dot,
              height: dot,
              backgroundColor: color,
              boxShadow: `0 0 ${dot * 2}px ${color}`,
              left: "50%",
              top: "50%",
              x: pos.x,
              y: pos.y,
              translateX: "-50%",
              translateY: "-50%",
            }}
            animate={{
              rotate: [0, 360],
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
          />
        );
      })}
    </div>
  );
}

// Full page loading screen
export function SixLoadingScreen({ text = "Loading..." }: { text?: string }) {
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
