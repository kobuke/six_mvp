"use client";

import { useEffect, useState, useRef, use } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Copy, Check, Send, QrCode, Clock, Users } from "lucide-react";
import Link from "next/link";
import { QRCodeModal } from "@/components/qr-code-modal";
import { MessageBubble } from "@/components/message-bubble";
import { RoomStatus } from "@/components/room-status";

interface Message {
  id: string;
  room_id: string;
  sender_ip: string;
  content: string;
  is_read: boolean;
  read_at: string | null;
  expires_at: string | null;
  created_at: string;
}

interface Room {
  id: string;
  name: string;
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
  const [clientIp, setClientIp] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch client IP
  useEffect(() => {
    fetch("/api/ip")
      .then((res) => res.json())
      .then((data) => setClientIp(data.ip))
      .catch(() => setClientIp("unknown"));
  }, []);

  // Fetch room and messages
  useEffect(() => {
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

      // Check if room is closed
      if (new Date(roomData.closes_at) < new Date()) {
        setError("この部屋は既に閉鎖されています");
        setIsLoading(false);
        return;
      }

      setRoom(roomData);

      // Fetch messages
      const { data: messagesData } = await supabase
        .from("messages")
        .select("*")
        .eq("room_id", roomId)
        .order("created_at", { ascending: true });

      setMessages(messagesData || []);
      setIsLoading(false);
    };

    fetchRoom();

    // Subscribe to new messages
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

    // Subscribe to room updates
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
  }, [roomId, supabase]);

  // Join room as guest
  useEffect(() => {
    const joinAsGuest = async () => {
      if (!room || !clientIp || clientIp === "unknown") return;
      if (room.creator_ip === clientIp) return;
      if (room.guest_ip) return;

      await supabase
        .from("rooms")
        .update({ guest_ip: clientIp })
        .eq("id", roomId);
    };

    joinAsGuest();
  }, [room, clientIp, roomId, supabase]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !room) return;

    const { error } = await supabase.from("messages").insert({
      room_id: roomId,
      sender_ip: clientIp,
      content: newMessage.trim(),
    });

    if (!error) {
      setNewMessage("");
    }
  };

  const markAsRead = async (messageId: string) => {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 6 * 60 * 1000); // 6 minutes from now

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

  const isCreator = room?.creator_ip === clientIp;
  const participantCount = room?.guest_ip ? 2 : 1;

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">読み込み中...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-6 px-4">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-light text-foreground">部屋が見つかりません</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
        <Link href="/">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            ホームに戻る
          </Button>
        </Link>
      </main>
    );
  }

  return (
    <main className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-medium">
              Si<span className="text-accent">X</span> Room
            </h1>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {participantCount}/2
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
            className="h-9 w-9"
          >
            <QrCode className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={copyRoomLink}
            className="h-9 w-9"
          >
            {copied ? (
              <Check className="w-5 h-5 text-accent" />
            ) : (
              <Copy className="w-5 h-5" />
            )}
          </Button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
                <Clock className="w-8 h-8 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <p className="text-muted-foreground">
                  {isCreator ? "相手を待っています..." : "最初のメッセージを送信しましょう"}
                </p>
                {isCreator && !room?.guest_ip && (
                  <p className="text-xs text-muted-foreground/60">
                    URLまたはQRコードを共有して相手を招待してください
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isOwn={message.sender_ip === clientIp}
              onRead={() => markAsRead(message.id)}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border p-4 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="flex items-center gap-3"
        >
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="メッセージを入力..."
            className="flex-1 h-12 bg-secondary border-border"
          />
          <Button
            type="submit"
            disabled={!newMessage.trim()}
            className="h-12 w-12 bg-foreground text-background hover:bg-foreground/90"
          >
            <Send className="w-5 h-5" />
          </Button>
        </form>
      </div>

      {/* QR Code Modal */}
      <QRCodeModal
        open={showQR}
        onClose={() => setShowQR(false)}
        roomId={roomId}
      />
    </main>
  );
}
