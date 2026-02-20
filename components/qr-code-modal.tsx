"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QRCodeModalProps {
  open: boolean;
  onClose: () => void;
  roomId: string;
  encryptionKey?: string;
}

export function QRCodeModal({ open, onClose, roomId, encryptionKey }: QRCodeModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);

  const roomUrl = typeof window !== "undefined"
    ? `${window.location.origin}/room/${roomId}${encryptionKey ? `#${encryptionKey}` : ""}`
    : "";

  useEffect(() => {
    if (!open || !canvasRef.current) return;

    const generateQR = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const QRCode = (await import("qrcode")).default;

      await QRCode.toCanvas(canvas, roomUrl, {
        width: 256,
        margin: 2,
        color: {
          dark: "#ff2d92", // toxic pink
          light: "#000000",
        },
      });
    };

    generateQR();
  }, [open, roomUrl]);

  const copyLink = async () => {
    await navigator.clipboard.writeText(roomUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-background/90 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="relative bg-card/50 border border-border/50 rounded-2xl p-6 w-full max-w-sm mx-4 space-y-6 backdrop-blur-xl"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gradient-six">Share Room</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8 hover:bg-six-pink/10"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="flex flex-col items-center space-y-4">
              {/* QR Code with glow */}
              <motion.div
                className="bg-black p-4 rounded-xl border border-six-pink/20"
                animate={{
                  boxShadow: [
                    "0 0 20px hsl(330 100% 60% / 0.2)",
                    "0 0 40px hsl(330 100% 60% / 0.3)",
                    "0 0 20px hsl(330 100% 60% / 0.2)",
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <canvas ref={canvasRef} className="w-64 h-64" />
              </motion.div>

              {/* Room ID */}
              <div className="text-center space-y-1">
                <p className="text-xs text-muted-foreground">Room ID</p>
                <p className="text-sm font-mono text-six-purple break-all">{roomId}</p>
              </div>

              {/* Copy Link Button */}
              <Button
                onClick={copyLink}
                variant="outline"
                className="w-full gap-2 border-border/50 hover:border-six-pink/50 hover:bg-six-pink/10"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-six-pink" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Link
                  </>
                )}
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              Share this QR code or link with the other person
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
