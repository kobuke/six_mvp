"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ColorPicker, SIX_COLORS } from "@/components/color-picker";
import { SixLoader } from "@/components/six-loader";

interface GuestColorPickerModalProps {
  open: boolean;
  onColorSelected: (color: string) => Promise<void>;
}

export function GuestColorPickerModal({
  open,
  onColorSelected,
}: GuestColorPickerModalProps) {
  const [selectedColor, setSelectedColor] = useState<string>(SIX_COLORS[0].hex);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onColorSelected(selectedColor);
    } catch (error) {
      console.error("Failed to set color:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              className="bg-background border border-border/50 rounded-3xl shadow-2xl max-w-md w-full p-8 space-y-8"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
            >
              {/* Header */}
              <header className="text-center space-y-2">
                <h2 className="text-2xl font-light">
                  Si<span className="text-gradient-six">X</span> へようこそ
                </h2>
                <p className="text-sm text-muted-foreground">
                  あなたのメッセージカラーを選んでください
                </p>
              </header>

              {/* Color Picker */}
              <div className="py-4">
                <ColorPicker
                  selectedColor={selectedColor}
                  onColorSelect={(color) => setSelectedColor(color)}
                  size="lg"
                />
              </div>

              {/* Selected Color Preview */}
              <div className="text-center">
                <div
                  className="inline-block px-4 py-2 rounded-2xl text-sm"
                  style={{
                    backgroundColor: `${selectedColor}20`,
                    border: `1px solid ${selectedColor}40`,
                    color: selectedColor,
                  }}
                >
                  プレビュー: あなたのメッセージ
                </div>
              </div>

              {/* Actions */}
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full h-14 text-lg font-medium text-white"
                style={{
                  background: `linear-gradient(135deg, ${selectedColor}, ${selectedColor}cc)`,
                  boxShadow: `0 0 20px ${selectedColor}40`,
                }}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-3">
                    <SixLoader size="sm" />
                    参加中...
                  </span>
                ) : (
                  "このカラーで参加"
                )}
              </Button>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
