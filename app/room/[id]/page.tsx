"use client";

import { useEffect, useState, useRef, use } from "react";
import { createClient } from "@/lib/supabase/client";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Copy, Check, Send, QrCode, Users } from "lucide-react";
import Link from "next/link";
import { QRCodeModal } from "@/components/qr-code-modal";
import { MessageBubble } from "@/components/message-bubble";
import { RoomStatus } from "@/components/room-status";
import { SixLoader, SixLoadingScreen } from "@/components/six-loader";
import { getUserUUID } from "@/lib/crypto";

interface Message {
  id: string;
  room_id: string;
  sender_uuid: string;
  sender_ip: string; // Keep for backwards compatibility
  content: string;
  is_read: boolean;
  read_at: string | null;
  expires_at: string | null;
  created_at: string;
}

interface Room {
  id: string;
  name: string;
  creator_uuid: string;
  guest_uuid: string | null;
  creator_ip: string;
  guest_ip: string | null;
  status: string;
  closes_at: string;
  created_at: string;
}

export default function ChatRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: roomId } = use(params);
  const [room, setRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [userUUID, setUserUUID] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Get or create user UUID from localStorage
  useEffect(() => {
    const uuid = getUserUUID();
    setUserUUID(uuid);
  }, []);

  // Fetch room and messages
  useEffect(() => {
    if (!userUUID) return;

    const fetchRoom = async () => {
      const { data: roomData, error: roomError } = await supabase
        .from("rooms")
        .select("*")
        .eq("id", roomId)
        .single();

      if (roomError || !roomData) {
        setError("この部屋は存在しないか、既に閉鎖されています");
        setIsLoading(false);
        return;
      }

      if (new Date(roomData.closes_at) < new Date()) {
        setError("この部屋は既に閉鎖されています");
        setIsLoading(false);
        return;
      }

      setRoom(roomData);

      const { data: messagesData } = await supabase
        .from("messages")
        .select("*")
        .eq("room_id", roomId)
        .order("created_at", { ascending: true });

      setMessages(messagesData || []);
      setIsLoading(false);
    };

    fetchRoom();

    const messagesChannel = supabase
      .channel(`messages:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setMessages((prev) => [...prev, payload.new as Message]);
          } else if (payload.eventType === "UPDATE") {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === payload.new.id ? (payload.new as Message) : msg
              )
            );
          } else if (payload.eventType === "DELETE") {
            setMessages((prev) =>
              prev.filter((msg) => msg.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    const roomChannel = supabase
      .channel(`room:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "rooms",
          filter: `id=eq.${roomId}`,
        },
        (payload) => {
          setRoom(payload.new as Room);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(roomChannel);
    };
  }, [roomId, supabase, userUUID]);

  // Join room as guest (using UUID)
  useEffect(() => {
    const joinAsGuest = async () => {
      if (!room || !userUUID) return;
      if (room.creator_uuid === userUUID) return;
      if (room.guest_uuid) return;

      try {
        await fetch("/api/rooms", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            room_id: roomId,
            guest_uuid: userUUID,
          }),
        });
      } catch (err) {
        console.error("Failed to join room:", err);
      }
    };

    joinAsGuest();
  }, [room, userUUID, roomId]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !room || isSending || !userUUID) return;

    setIsSending(true);
    const { error } = await supabase.from("messages").insert({
      room_id: roomId,
      sender_uuid: userUUID,
      sender_ip: "uuid-based", // Keep for backwards compatibility
      content: newMessage.trim(),
    });

    if (!error) {
      setNewMessage("");
      inputRef.current?.focus();
    }
    setIsSending(false);
  };

  const markAsRead = async (messageId: string) => {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 6 * 60 * 1000); // 6 minutes

    await supabase
      .from("messages")
      .update({
        is_read: true,
        read_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
      })
      .eq("id", messageId);
  };

  const copyRoomLink = async () => {
    const link = `${window.location.origin}/room/${roomId}`;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isCreator = room?.creator_uuid === userUUID;
  const isOwnMessage = (message: Message) => message.sender_uuid === userUUID;
  const participantCount = room?.guest_uuid ? 2 : 1;

  if (isLoading) {
    return <SixLoadingScreen text="ルームに接続中..." />;
  }

  if (error) {
    return (
      <main className="h-dvh flex flex-col items-center justify-center gap-6 px-4 bg-background bg-grid-six">
        <motion.div
          className="text-center space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-light text-foreground">
            部屋が見つかりません
          </h1>
          <p className="text-muted-foreground">{error}</p>
        </motion.div>
        <Link href="/">
          <Button variant="outline" className="gap-2 border-border hover:border-six-pink/50 hover:bg-six-pink/10">
            <ArrowLeft className="w-4 h-4" />
            ホームに戻る
          </Button>
        </Link>
      </main>
    );
  }

  return (
    <main className="h-dvh flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <motion.header
        className="border-b border-border/50 px-4 py-3 flex items-center justify-between shrink-0 backdrop-blur-sm bg-background/80 safe-top"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-six-pink/10">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-medium">
              Si<span className="text-gradient-six">X</span> Room
            </h1>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span className={participantCount === 2 ? "text-six-pink" : ""}>
                  {participantCount}/2
                </span>
              </span>
              {room && <RoomStatus closesAt={room.closes_at} />}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowQR(true)}
            className="h-9 w-9 hover:bg-six-purple/10"
          >
            <QrCode className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={copyRoomLink}
            className="h-9 w-9 hover:bg-six-pink/10"
          >
            {copied ? (
              <Check className="w-5 h-5 text-six-pink" />
            ) : (
              <Copy className="w-5 h-5" />
            )}
          </Button>
        </div>
      </motion.header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 overscroll-contain">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="space-y-6">
              <div className="mx-auto">
                <SixLoader size="lg" />
              </div>
              <div className="space-y-2">
                <p className="text-muted-foreground">
                  {isCreator
                    ? "相手を待っています..."
                    : "最初のメッセージを送信しましょう"}
                </p>
                {isCreator && !room?.guest_uuid && (
                  <p className="text-xs text-muted-foreground/60">
                    URLまたはQRコードを共有して相手を招待してください
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={isOwnMessage(message)}
                onRead={() => markAsRead(message.id)}
              />
            ))}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <motion.div
        className="border-t border-border/50 p-4 shrink-0 backdrop-blur-sm bg-background/80 safe-bottom"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="flex items-center gap-3"
        >
          <Input
            ref={inputRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="メッセージを入力..."
            className="flex-1 h-12 bg-secondary/50 border-border/50 focus:border-six-pink/50 focus:ring-six-pink/20 transition-all"
          />
          <Button
            type="submit"
            disabled={!newMessage.trim() || isSending}
            className="h-12 w-12 bg-gradient-to-br from-six-pink to-six-purple text-white hover:opacity-90 disabled:opacity-30 transition-all glow-six-pink"
          >
            {isSending ? (
              <SixLoader size="sm" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </form>
      </motion.div>

      {/* QR Code Modal */}
      <QRCodeModal
        open={showQR}
        onClose={() => setShowQR(false)}
        roomId={roomId}
      />
    </main>
  );
}
