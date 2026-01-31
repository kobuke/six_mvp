"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Trash2, Clock, ArrowRight } from "lucide-react";
import { getRoomHistory, removeFromRoomHistory, type RoomHistoryItem } from "@/lib/room-history";
import { createClient } from "@/lib/supabase/client";

interface RoomHistoryListProps {
  onRoomSelect?: () => void;
}

export function RoomHistoryList({ onRoomSelect }: RoomHistoryListProps) {
  const router = useRouter();
  const [history, setHistory] = useState<RoomHistoryItem[]>([]);
  const [roomStatuses, setRoomStatuses] = useState<Record<string, "active" | "closed" | "unknown">>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      const items = getRoomHistory();
      setHistory(items);

      if (items.length > 0) {
        // Check room statuses
        const supabase = createClient();
        const { data: rooms } = await supabase
          .from("rooms")
          .select("id, status, closes_at")
          .in("id", items.map((i) => i.roomId));

        const statuses: Record<string, "active" | "closed" | "unknown"> = {};
        items.forEach((item) => {
          const room = rooms?.find((r) => r.id === item.roomId);
          if (!room) {
            statuses[item.roomId] = "unknown";
          } else if (room.status === "closed" || new Date(room.closes_at) < new Date()) {
            statuses[item.roomId] = "closed";
          } else {
            statuses[item.roomId] = "active";
          }
        });
        setRoomStatuses(statuses);
      }

      setIsLoading(false);
    };

    loadHistory();
  }, []);

  const handleRoomClick = (roomId: string) => {
    const status = roomStatuses[roomId];
    if (status === "closed") return;
    
    onRoomSelect?.();
    router.push(`/room/${roomId}`);
  };

  const handleRemove = (e: React.MouseEvent, roomId: string) => {
    e.stopPropagation();
    removeFromRoomHistory(roomId);
    setHistory((prev) => prev.filter((h) => h.roomId !== roomId));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "たった今";
    if (diffMins < 60) return `${diffMins}分前`;
    if (diffHours < 24) return `${diffHours}時間前`;
    if (diffDays < 7) return `${diffDays}日前`;
    return date.toLocaleDateString("ja-JP", { month: "short", day: "numeric" });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-pulse text-muted-foreground text-sm">読み込み中...</div>
      </div>
    );
  }

  if (history.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
        <Clock size={14} />
        最近のルーム
      </h3>
      
      <AnimatePresence>
        {history.map((item, index) => {
          const status = roomStatuses[item.roomId] || "unknown";
          const isClosed = status === "closed";

          return (
            <motion.button
              key={item.roomId}
              onClick={() => handleRoomClick(item.roomId)}
              disabled={isClosed}
              className={`
                w-full p-3 rounded-xl text-left
                flex items-center justify-between gap-3
                transition-all duration-200
                ${isClosed 
                  ? "opacity-50 cursor-not-allowed bg-muted/20" 
                  : "bg-muted/30 hover:bg-muted/50 cursor-pointer"
                }
              `}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ delay: index * 0.05 }}
              style={{
                borderLeft: `3px solid ${item.userColor}`,
              }}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: `${item.userColor}20`,
                    boxShadow: isClosed ? "none" : `0 0 10px ${item.userColor}40`,
                  }}
                >
                  <MessageSquare size={18} style={{ color: item.userColor }} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">
                      {item.isCreator ? "作成したルーム" : "参加したルーム"}
                    </span>
                    {isClosed && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-destructive/20 text-destructive">
                        終了
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {formatDate(item.lastVisitedAt)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!isClosed && (
                  <ArrowRight size={16} className="text-muted-foreground" />
                )}
                <button
                  onClick={(e) => handleRemove(e, item.roomId)}
                  className="p-1.5 rounded-lg hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </motion.button>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
