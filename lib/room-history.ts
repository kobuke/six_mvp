"use client";

export interface RoomHistoryItem {
  roomId: string;
  createdAt: string;
  lastVisitedAt: string;
  isCreator: boolean;
  userColor: string;
  lastMessageAt?: string; // 最後のメッセージの時刻
  roomName?: string; // ルーム名
}

const STORAGE_KEY = "six_room_history";
const MAX_HISTORY_ITEMS = 10;
const ROOM_EXPIRY_HOURS = 6; // 6時間で自動削除

export function getRoomHistory(): RoomHistoryItem[] {
  if (typeof window === "undefined") return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const history: RoomHistoryItem[] = JSON.parse(stored);
    const now = new Date();
    const expiryMs = ROOM_EXPIRY_HOURS * 60 * 60 * 1000; // 6時間をミリ秒に変換
    
    // 最後のメッセージから6時間以上経過したルームを除外
    const validHistory = history.filter((item) => {
      const lastActivityTime = item.lastMessageAt || item.lastVisitedAt;
      const timeSinceLastActivity = now.getTime() - new Date(lastActivityTime).getTime();
      return timeSinceLastActivity < expiryMs;
    });
    
    // 履歴に変更があれば保存
    if (validHistory.length !== history.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(validHistory));
    }
    
    // Sort by lastVisitedAt descending
    return validHistory.sort(
      (a, b) => new Date(b.lastVisitedAt).getTime() - new Date(a.lastVisitedAt).getTime()
    );
  } catch {
    return [];
  }
}

export function addToRoomHistory(item: Omit<RoomHistoryItem, "lastVisitedAt" | "lastMessageAt">): void {
  if (typeof window === "undefined") return;
  
  try {
    const history = getRoomHistory();
    const existingIndex = history.findIndex((h) => h.roomId === item.roomId);
    
    const newItem: RoomHistoryItem = {
      ...item,
      lastVisitedAt: new Date().toISOString(),
    };
    
    if (existingIndex >= 0) {
      // Update existing item, preserve lastMessageAt if exists
      history[existingIndex] = { 
        ...history[existingIndex], 
        ...newItem,
        // Update roomName if provided, otherwise keep existing
        roomName: item.roomName || history[existingIndex].roomName,
      };
    } else {
      // Add new item
      history.unshift(newItem);
    }
    
    // Keep only the latest MAX_HISTORY_ITEMS
    const trimmed = history.slice(0, MAX_HISTORY_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // Ignore storage errors
  }
}

export function removeFromRoomHistory(roomId: string): void {
  if (typeof window === "undefined") return;
  
  try {
    const history = getRoomHistory();
    const filtered = history.filter((h) => h.roomId !== roomId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch {
    // Ignore storage errors
  }
}

export function updateRoomColor(roomId: string, color: string): void {
  if (typeof window === "undefined") return;
  
  try {
    const history = getRoomHistory();
    const index = history.findIndex((h) => h.roomId === roomId);
    
    if (index >= 0) {
      history[index].userColor = color;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    }
  } catch {
    // Ignore storage errors
  }
}

export function updateLastMessageAt(roomId: string, timestamp?: string): void {
  if (typeof window === "undefined") return;
  
  try {
    const history = getRoomHistory();
    const index = history.findIndex((h) => h.roomId === roomId);
    
    if (index >= 0) {
      history[index].lastMessageAt = timestamp || new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    }
  } catch {
    // Ignore storage errors
  }
}

export function updateRoomName(roomId: string, name: string): void {
  if (typeof window === "undefined") return;
  
  try {
    const history = getRoomHistory();
    const index = history.findIndex((h) => h.roomId === roomId);
    
    if (index >= 0) {
      history[index].roomName = name;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    }
  } catch {
    // Ignore storage errors
  }
}

export function clearRoomHistory(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
