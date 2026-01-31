"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Bell, X } from "lucide-react";

interface NotificationPermissionDialogProps {
  open: boolean;
  onClose: () => void;
}

export function NotificationPermissionDialog({
  open,
  onClose,
}: NotificationPermissionDialogProps) {
  const handleAllow = async () => {
    localStorage.setItem("six_notification_asked", "true");
    
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        // Show a test notification
        new Notification("SiX", {
          body: "通知が有効になりました",
          icon: "/icon-192.png",
        });
      }
    } catch (error) {
      console.error("Notification permission error:", error);
    }
    
    onClose();
  };

  const handleDeny = () => {
    localStorage.setItem("six_notification_asked", "true");
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleDeny}
          />

          {/* Dialog */}
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="relative w-full max-w-sm bg-background border border-border/50 rounded-2xl overflow-hidden"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              {/* Close button */}
              <button
                onClick={handleDeny}
                className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-muted/50 transition-colors z-10"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>

              {/* Header with 6 motif */}
              <div className="relative px-6 pt-8 pb-4">
                {/* Glowing 6 background */}
                <div className="absolute inset-0 flex items-center justify-center opacity-10">
                  <span className="text-[120px] font-bold text-gradient-six select-none">
                    6
                  </span>
                </div>

                {/* Icon */}
                <div className="relative flex justify-center mb-4">
                  <motion.div
                    className="w-16 h-16 rounded-full bg-gradient-to-br from-six-pink to-six-purple flex items-center justify-center"
                    animate={{
                      boxShadow: [
                        "0 0 20px rgba(236, 72, 153, 0.3)",
                        "0 0 40px rgba(168, 85, 247, 0.5)",
                        "0 0 20px rgba(236, 72, 153, 0.3)",
                      ],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <Bell className="w-7 h-7 text-white" />
                  </motion.div>
                </div>

                {/* Content */}
                <div className="relative text-center space-y-2">
                  <h3 className="text-lg font-medium">
                    メッセージを逃さないために
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    6分で消えるメッセージ。<br />
                    通知を許可すると、相手からの<br />
                    メッセージを見逃しません。
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="px-6 pb-6 space-y-3">
                <Button
                  onClick={handleAllow}
                  className="w-full h-12 text-white font-medium bg-gradient-to-r from-six-pink to-six-purple hover:opacity-90 transition-opacity"
                >
                  通知を許可する
                </Button>
                <Button
                  onClick={handleDeny}
                  variant="ghost"
                  className="w-full h-10 text-muted-foreground hover:text-foreground"
                >
                  あとで
                </Button>
              </div>

              {/* Bottom accent line */}
              <div className="h-1 bg-gradient-to-r from-six-pink via-six-purple to-six-blue" />
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Helper function to send notification
export function sendNotification(title: string, body: string) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  if (document.hasFocus()) return; // Don't notify if already focused

  new Notification(title, {
    body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
  });
}
