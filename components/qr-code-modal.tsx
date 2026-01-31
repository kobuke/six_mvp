"use client";

import { useEffect, useRef } from "react";
import { X, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface QRCodeModalProps {
  open: boolean;
  onClose: () => void;
  roomId: string;
}

export function QRCodeModal({ open, onClose, roomId }: QRCodeModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);

  const roomUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/room/${roomId}` 
    : "";

  useEffect(() => {
    if (!open || !canvasRef.current) return;

    // Generate QR code using a simple algorithm
    const generateQR = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Use dynamic import for qrcode library
      const QRCode = (await import("qrcode")).default;
      
      await QRCode.toCanvas(canvas, roomUrl, {
        width: 256,
        margin: 2,
        color: {
          dark: "#ffffff",
          light: "#0a0a0a",
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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-card border border-border rounded-2xl p-6 w-full max-w-sm mx-4 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">部屋を共有</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex flex-col items-center space-y-4">
          {/* QR Code */}
          <div className="bg-background p-4 rounded-xl">
            <canvas ref={canvasRef} className="w-64 h-64" />
          </div>

          {/* Room ID */}
          <div className="text-center space-y-1">
            <p className="text-xs text-muted-foreground">ルームID</p>
            <p className="text-sm font-mono text-foreground break-all">{roomId}</p>
          </div>

          {/* Copy Link Button */}
          <Button
            onClick={copyLink}
            variant="outline"
            className="w-full gap-2"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                コピーしました
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                リンクをコピー
              </>
            )}
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          このQRコードまたはリンクを相手に共有してください
        </p>
      </div>
    </div>
  );
}
