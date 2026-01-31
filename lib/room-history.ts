"use client";

export interface RoomHistoryItem {
  roomId: string;
  createdAt: string;
  lastVisitedAt: string;
  isCreator: boolean;
  userColor: string;
}

const STORAGE_KEY = "six_room_history";
const MAX_HISTORY_ITEMS = 10;

export function getRoomHistory(): RoomHistoryItem[] {
  if (typeof window === "undefined") return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const history: RoomHistoryItem[] = JSON.parse(stored);
    // Sort by lastVisitedAt descending
    return history.sort(
      (a, b) => new Date(b.lastVisitedAt).getTime() - new Date(a.lastVisitedAt).getTime()
    );
  } catch {
    return [];
  }
}

export function addToRoomHistory(item: Omit<RoomHistoryItem, "lastVisitedAt">): void {
  if (typeof window === "undefined") return;
  
  try {
    const history = getRoomHistory();
    const existingIndex = history.findIndex((h) => h.roomId === item.roomId);
    
    const newItem: RoomHistoryItem = {
      ...item,
      lastVisitedAt: new Date().toISOString(),
    };
    
    if (existingIndex >= 0) {
      // Update existing item
      history[existingIndex] = { ...history[existingIndex], ...newItem };
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

export function clearRoomHistory(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
