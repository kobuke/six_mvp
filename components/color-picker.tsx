"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";

// SIX brand colors - 6 neon colors
export const SIX_COLORS = [
  { id: "toxic-pink", hex: "#ff2d92", name: "Toxic Pink" },
  { id: "neon-purple", hex: "#d426ff", name: "Neon Purple" },
  { id: "cyber-blue", hex: "#00d4ff", name: "Cyber Blue" },
  { id: "acid-green", hex: "#39ff14", name: "Acid Green" },
  { id: "sunset-orange", hex: "#ff6b35", name: "Sunset Orange" },
  { id: "electric-yellow", hex: "#ffff00", name: "Electric Yellow" },
] as const;

export type SixColor = (typeof SIX_COLORS)[number]["hex"];

interface ColorPickerProps {
  selectedColor: string;
  onColorSelect: (color: string) => void;
  disabledColor?: string;
  size?: "sm" | "md" | "lg";
}

export function ColorPicker({
  selectedColor,
  onColorSelect,
  disabledColor,
  size = "md",
}: ColorPickerProps) {
  const sizeConfig = {
    sm: { dot: "w-8 h-8", icon: 12 },
    md: { dot: "w-12 h-12", icon: 16 },
    lg: { dot: "w-16 h-16", icon: 20 },
  };

  const { dot, icon } = sizeConfig[size];

  return (
    <div className="flex flex-wrap justify-center gap-3">
      {SIX_COLORS.map((color) => {
        const isSelected = selectedColor === color.hex;
        const isDisabled = disabledColor === color.hex;

        return (
          <motion.button
            key={color.id}
            type="button"
            disabled={isDisabled}
            onClick={() => onColorSelect(color.hex)}
            className={`
              ${dot} rounded-full relative flex items-center justify-center
              transition-all duration-200
              ${isDisabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer hover:scale-110"}
              ${isSelected ? "ring-2 ring-white ring-offset-2 ring-offset-black" : ""}
            `}
            style={{
              backgroundColor: color.hex,
              boxShadow: isSelected ? `0 0 20px ${color.hex}` : `0 0 10px ${color.hex}50`,
            }}
            whileHover={!isDisabled ? { scale: 1.1 } : {}}
            whileTap={!isDisabled ? { scale: 0.95 } : {}}
            title={isDisabled ? "Selected by partner" : color.name}
          >
            {isSelected && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-black"
              >
                <Check size={icon} strokeWidth={3} />
              </motion.div>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
