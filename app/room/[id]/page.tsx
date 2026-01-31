"use client";

import { useEffect, useState, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Copy, Check, Send, QrCode, Users, ImagePlus, X, Pencil } from "lucide-react";
import Link from "next/link";
import { QRCodeModal } from "@/components/qr-code-modal";
import { MessageBubble } from "@/components/message-bubble";
import { RoomStatus } from "@/components/room-status";
import { SixLoader, SixLoadingScreen } from "@/components/six-loader";
import { getUserUUID } from "@/lib/crypto";
import { addToRoomHistory, updateLastMessageAt, updateRoomName } from "@/lib/room-history";
import { NotificationPermissionDialog, sendNotification } from "@/components/notification-permission-dialog";
import { TypingIndicator } from "@/components/typing-indicator";
import { GuestColorPickerModal } from "@/components/guest-color-picker-modal";
import { SIX_COLORS } from "@/components/color-picker";

interface Message {
  id: string;
  room_id: string;
  sender_uuid: string;
  sender_ip: string;
  content: string;
  is_read: boolean;
  read_at: string | null;
  expires_at: string | null;
  created_at: string;
  media_url?: string;
  media_type?: "image" | "video";
  is_media_revealed?: boolean;
}

interface Room {
  id: string;
  name: string;
  creator_uuid: string;
  guest_uuid: string | null;
  creator_ip: string;
  guest_ip: string | null;
  creator_color: string;
  guest_color: string | null;
  status: string;
  closes_at: string;
  created_at: string;
}

export default function ChatRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: roomId } = use(params);
  const router = useRouter();
  const [room, setRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [userUUID, setUserUUID] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isRoomFull, setIsRoomFull] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [partnerColor, setPartnerColor] = useState<string | null>(null);
  const [showNotificationDialog, setShowNotificationDialog] = useState(false);
  const [showGuestColorPicker, setShowGuestColorPicker] = useState(false);
  const [isJoiningAsGuest, setIsJoiningAsGuest] = useState(false);
  const [lastActivityAt, setLastActivityAt] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingBroadcastRef = useRef<number>(0);
  const supabase = createClient();

  // Get user's color based on their role in the room
  const getUserColor = () => {
    if (!room || !userUUID) return SIX_COLORS[0].hex;
    if (room.creator_uuid === userUUID) return room.creator_color || SIX_COLORS[0].hex;
    return room.guest_color || SIX_COLORS[1].hex;
  };

  // Get color for a message sender
  const getMessageColor = (message: Message) => {
    if (!room) return SIX_COLORS[0].hex;
    if (message.sender_uuid === room.creator_uuid) return room.creator_color || SIX_COLORS[0].hex;
    return room.guest_color || SIX_COLORS[1].hex;
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Get or create user UUID from localStorage
  useEffect(() => {
    const uuid = getUserUUID();
    setUserUUID(uuid);
  }, []);

  // Check notification permission on first visit
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    
    const hasAsked = localStorage.getItem("six_notification_asked");
    if (!hasAsked && Notification.permission === "default") {
      // Show dialog after a short delay
      const timer = setTimeout(() => {
        setShowNotificationDialog(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Fetch room and messages
  useEffect(() => {
    if (!userUUID) return;

    const fetchRoom = async () => {
      try {
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

        // Check if room is full (2 participants already)
        const isCreator = roomData.creator_uuid === userUUID;
        const isGuest = roomData.guest_uuid === userUUID;
        const isFull = roomData.guest_uuid && !isCreator && !isGuest;
        
        if (isFull) {
          setIsRoomFull(true);
          setIsLoading(false);
          // Redirect to home after 6 seconds
          setTimeout(() => {
            router.push("/");
          }, 6000);
          return;
        }

        // If not creator and not yet registered as guest, show color picker
        if (!isCreator && !isGuest) {
          setIsJoiningAsGuest(true);
          setShowGuestColorPicker(true);
          setRoom(roomData);
          setIsLoading(false);
          return;
        }

        setRoom(roomData);

        // Add to room history
        const userColor = isCreator ? roomData.creator_color : roomData.guest_color;
        addToRoomHistory({
          roomId: roomData.id,
          createdAt: roomData.created_at,
          isCreator,
          userColor: userColor || SIX_COLORS[0].hex,
          roomName: roomData.name || undefined,
        });

        const { data: messagesData } = await supabase
          .from("messages")
          .select("*")
          .eq("room_id", roomId)
          .order("created_at", { ascending: true });

        // Filter out already-expired messages on initial load
        const now = new Date();
        const validMessages = (messagesData || []).filter((msg: Message) => {
          if (!msg.expires_at) return true;
          const expiresAt = new Date(msg.expires_at);
          return expiresAt > now;
        });

        setMessages(validMessages);
        
        // Set last activity time (last message or room creation time)
        if (validMessages.length > 0) {
          const lastMsg = validMessages[validMessages.length - 1];
          setLastActivityAt(lastMsg.created_at);
        } else {
          setLastActivityAt(roomData.created_at);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching room:", error);
        setError("部屋の読み込みに失敗しました");
        setIsLoading(false);
      }
    };

    fetchRoom();
  }, [roomId, userUUID, supabase]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !room || isSending || !userUUID) return;

    setIsSending(true);
    const { error } = await supabase.from("messages").insert({
      room_id: roomId,
      sender_uuid: userUUID,
      sender_ip: "uuid-based",
      content: newMessage.trim(),
    });

    if (!error) {
      setNewMessage("");
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "48px";
        textareaRef.current.focus();
      }
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

  // Broadcast typing status
  const broadcastTyping = () => {
    const now = Date.now();
    // Throttle broadcasts to once per 500ms
    if (now - lastTypingBroadcastRef.current < 500) return;
    lastTypingBroadcastRef.current = now;

    supabase.channel(`typing:${roomId}`).send({
      type: "broadcast",
      event: "typing",
      payload: {
        user_uuid: userUUID,
        color: getUserColor(),
      },
    });
  };

  // Auto-resize textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    broadcastTyping();
    
    // Auto-resize
    const textarea = e.target;
    textarea.style.height = "auto";
    const maxHeight = 5 * 24; // 5 lines * ~24px line height
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Send only on Cmd+Enter (Mac) or Ctrl+Enter (Windows/Linux)
    // Plain Enter always creates a new line on all devices
    const isCtrlOrCmd = e.ctrlKey || e.metaKey;
    const isEnter = e.key === "Enter";
    
    // Cmd/Ctrl+Enter sends message
    if (isEnter && isCtrlOrCmd && !e.shiftKey) {
      e.preventDefault();
      if (selectedFile) {
        uploadAndSendMedia();
      } else {
        sendMessage();
      }
    }
    // Plain Enter or Shift+Enter always creates a new line (default behavior)
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.type.startsWith("image/") || file.type.startsWith("video/"))) {
      setSelectedFile(file);
      setNewMessage(""); // Clear text when media is selected
    }
  };

  const uploadAndSendMedia = async () => {
    if (!selectedFile || !room || isUploading || !userUUID) return;

    setIsUploading(true);
    try {
      // Upload to blob storage
      const formData = new FormData();
      formData.append("file", selectedFile);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error("Upload failed");
      }

      const { url } = await uploadRes.json();

      // Send message with media URL
      const messageType = selectedFile.type.startsWith("image/") ? "image" : "video";
      const { error } = await supabase.from("messages").insert({
        room_id: roomId,
        sender_uuid: userUUID,
        sender_ip: "uuid-based",
        content: url,
        media_type: messageType,
        media_url: url,
      });

      if (!error) {
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("アップロードに失敗しました");
    } finally {
      setIsUploading(false);
    }
  };

  const handleGuestColorSelected = async (color: string) => {
    try {
      // Join room as guest with selected color
      const response = await fetch("/api/rooms", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          room_id: roomId,
          guest_uuid: userUUID,
          guest_color: color,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        if (error.code === "ROOM_FULL") {
          setIsRoomFull(true);
          setShowGuestColorPicker(false);
          setTimeout(() => router.push("/"), 6000);
          return;
        }
        throw new Error("Failed to join room");
      }

      const updatedRoom = await response.json();
      setRoom(updatedRoom);
      setShowGuestColorPicker(false);
      setIsJoiningAsGuest(false);

      // Add to room history
      addToRoomHistory({
        roomId: updatedRoom.id,
        createdAt: updatedRoom.created_at,
        isCreator: false,
        userColor: color,
        roomName: updatedRoom.name || undefined,
      });

      // Now load messages
      const { data: messagesData } = await supabase
        .from("messages")
        .select("*")
        .eq("room_id", roomId)
        .order("created_at", { ascending: true });

      const now = new Date();
      const validMessages = (messagesData || []).filter((msg: Message) => {
        if (!msg.expires_at) return true;
        const expiresAt = new Date(msg.expires_at);
        return expiresAt > now;
      });

      setMessages(validMessages);
      
      // Set last activity time
      if (validMessages.length > 0) {
        const lastMsg = validMessages[validMessages.length - 1];
        setLastActivityAt(lastMsg.created_at);
      } else {
        setLastActivityAt(updatedRoom.created_at);
      }
    } catch (error) {
      console.error("Failed to join room:", error);
      setError("部屋への参加に失敗しました");
      setShowGuestColorPicker(false);
    }
  };

  const handleNameEdit = () => {
    if (!room) return;
    setEditedName(room.name || "SiX Room");
    setIsEditingName(true);
  };

  const handleNameSave = async () => {
    if (!editedName.trim() || !room) {
      setIsEditingName(false);
      return;
    }

    try {
      await supabase
        .from("rooms")
        .update({ name: editedName.trim() })
        .eq("id", roomId);

      // Update room name in localStorage history
      updateRoomName(roomId, editedName.trim());

      setIsEditingName(false);
    } catch (error) {
      console.error("Failed to update room name:", error);
      setIsEditingName(false);
    }
  };

  const isCreator = room?.creator_uuid === userUUID;
  const isOwnMessage = (message: Message) => message.sender_uuid === userUUID;
  const participantCount = room?.guest_uuid ? 2 : 1;
  const userColor = getUserColor();

  if (isLoading) {
    return (
      <main className="h-dvh flex items-center justify-center bg-background bg-grid-six">
        <SixLoader size="lg" />
      </main>
    );
  }

  // Show guest color picker modal if joining as guest
  if (isJoiningAsGuest && showGuestColorPicker) {
    return (
      <main className="h-dvh flex items-center justify-center bg-background bg-grid-six">
        <GuestColorPickerModal
          open={showGuestColorPicker}
          onColorSelected={handleGuestColorSelected}
        />
      </main>
    );
  }

  if (isRoomFull) {
    return (
      <main className="h-dvh flex flex-col items-center justify-center gap-6 px-4 bg-background bg-grid-six">
        <motion.div
          className="text-center space-y-4"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="w-20 h-20 mx-auto rounded-full bg-destructive/20 flex items-center justify-center">
            <Users className="w-10 h-10 text-destructive" />
          </div>
          <h1 className="text-2xl font-light text-foreground">
            Full Room
          </h1>
          <p className="text-muted-foreground">
            この部屋にはもう入れません
          </p>
          <p className="text-xs text-muted-foreground/60">
            6秒後にトップへ戻ります...
          </p>
        </motion.div>
      </main>
    );
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
          <div className="flex-1 min-w-0">
            {isEditingName ? (
              <Input
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onBlur={handleNameSave}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleNameSave();
                  if (e.key === "Escape") setIsEditingName(false);
                }}
                className="h-7 text-lg font-medium px-2 -ml-2"
                autoFocus
                maxLength={30}
              />
            ) : (
              <button
                onClick={handleNameEdit}
                className="text-lg font-medium hover:opacity-70 transition-opacity text-left flex items-center gap-1.5 group"
              >
                <span className="border-b border-dashed border-muted-foreground/40">
                  {room?.name || "SiX Room"}
                </span>
                <Pencil className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            )}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span className={participantCount === 2 ? "text-six-pink" : ""}>
                  {participantCount}/2
                </span>
              </span>
              {room && lastActivityAt && <RoomStatus lastActivityAt={lastActivityAt} />}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* User color indicator */}
          <div
            className="w-3 h-3 rounded-full"
            style={{
              backgroundColor: userColor,
              boxShadow: `0 0 8px ${userColor}`,
            }}
          />
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
              <div className="w-full flex justify-center">
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
        ) : null}
        <AnimatePresence mode="popLayout">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isOwn={isOwnMessage(message)}
              userColor={getMessageColor(message)}
              onRead={() => markAsRead(message.id)}
            />
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Typing Indicator */}
      <AnimatePresence>
        {isPartnerTyping && partnerColor && (
          <div className="px-4 shrink-0">
            <TypingIndicator color={partnerColor} />
          </div>
        )}
      </AnimatePresence>

      {/* Selected File Preview */}
      <AnimatePresence>
        {selectedFile && (
          <motion.div
            className="px-4 pb-2 shrink-0"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <div
              className="relative inline-flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{
                backgroundColor: `${userColor}20`,
                border: `1px solid ${userColor}40`,
              }}
            >
              <span className="text-sm truncate max-w-[200px]">{selectedFile.name}</span>
              <button
                onClick={() => setSelectedFile(null)}
                className="p-1 rounded-full hover:bg-black/20 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <motion.div
        className="border-t border-border/50 p-4 pb-6 mb-4 shrink-0 backdrop-blur-sm bg-background/80 safe-bottom"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        layout
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (selectedFile) {
              uploadAndSendMedia();
            } else {
              sendMessage();
            }
          }}
          className="flex items-end gap-3"
        >
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {/* Media button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            className="h-12 w-12 shrink-0 hover:bg-six-purple/10"
            style={{
              color: userColor,
            }}
          >
            <ImagePlus className="w-5 h-5" />
          </Button>

          <motion.div className="flex-1" layout transition={{ duration: 0.15 }}>
            <Textarea
              ref={textareaRef}
              value={newMessage}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="メッセージを入力..."
              disabled={!!selectedFile}
              rows={1}
              className="min-h-[48px] max-h-[120px] resize-none bg-secondary/50 border-border/50 focus:border-six-pink/50 focus:ring-six-pink/20 transition-all disabled:opacity-50 py-3"
              style={{ height: "48px" }}
            />
          </motion.div>
          <Button
            type="submit"
            disabled={(!newMessage.trim() && !selectedFile) || isSending || isUploading}
            className="h-12 w-12 text-white hover:opacity-90 disabled:opacity-30 transition-all shrink-0"
            style={{
              background: `linear-gradient(135deg, ${userColor}, ${userColor}cc)`,
              boxShadow: `0 0 15px ${userColor}40`,
            }}
          >
            {isSending || isUploading ? (
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

      {/* Notification Permission Dialog */}
      <NotificationPermissionDialog
        open={showNotificationDialog}
        onClose={() => setShowNotificationDialog(false)}
      />
    </main>
  );
}
