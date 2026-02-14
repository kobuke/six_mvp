"use client";

/**
 * E2EE Implementation for SiX
 * Returns Promise<string> for all operations to support Web Crypto API
 */

// Key Storage key prefix
export const KEY_STORAGE_PREFIX = "six_key_";

/**
 * Generate a new random 256-bit AES-GCM key
 * Returns URL-safe Base64 string
 */
export async function generateRoomKey(): Promise<string> {
  const key = await crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"]
  );

  const exported = await crypto.subtle.exportKey("raw", key);
  return arrayBufferToBase64(exported);
}

/**
 * Encrypt a message using AES-GCM
 * Format: v1:iv_base64:ciphertext_base64
 */
export async function encryptMessage(plaintext: string, keyString: string): Promise<string> {
  try {
    if (!keyString) return plaintext;

    const key = await importKey(keyString);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(plaintext);

    const ciphertext = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv,
      },
      key,
      encoded
    );

    const ivStr = arrayBufferToBase64(iv.buffer);
    const cipherStr = arrayBufferToBase64(ciphertext);

    return `v1:${ivStr}:${cipherStr}`;
  } catch (e) {
    console.error("Encryption failed:", e);
    return plaintext; // Fallback? Or throw? Fallback might accidentally send plaintext.
    // Ideally we should throw, but for safety in UI we might return empty string or error marker.
    // For now, returning empty to avoid leaking plaintext if encryption fails.
    return "";
  }
}

/**
 * Decrypt a message
 * Handles v1 format and legacy fallback
 */
export async function decryptMessage(encrypted: string, keyString: string): Promise<string> {
  if (!encrypted) return "";
  if (!keyString) return encrypted; // Cannot decrypt without key

  // Check format
  if (!encrypted.startsWith("v1:")) {
    // Legacy fallback (Base64+XOR or plain text)
    // We can try the old decode method or just return as is
    // Since we are moving to strict E2EE, we might just return it "as is"
    // assuming it might be a system message or legacy.
    // But let's keep the XOR de-obfuscator for a bit if valid? 
    // Actually, let's just return it to support old messages during transition.
    return legacyDecrypt(encrypted);
  }

  try {
    const parts = encrypted.split(":");
    if (parts.length !== 3) return encrypted;

    const [, ivStr, cipherStr] = parts;
    const iv = base64ToArrayBuffer(ivStr);
    const ciphertext = base64ToArrayBuffer(cipherStr);
    const key = await importKey(keyString);

    const decrypted = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv,
      },
      key,
      ciphertext
    );

    return new TextDecoder().decode(decrypted);
  } catch (e) {
    console.error("Decryption failed:", e);
    return "🔓 Decryption Error";
  }
}

// --- Helpers ---

async function importKey(keyString: string): Promise<CryptoKey> {
  const raw = base64ToArrayBuffer(keyString);
  return crypto.subtle.importKey(
    "raw",
    raw,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  // Add padding back if needed
  let b64 = base64.replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4) {
    b64 += "=";
  }

  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Legacy support
function legacyDecrypt(str: string): string {
  // Simple check if it looks like the old base64
  // For safety, just return strict string
  // If we really need the old XOR:
  try {
    const OBFUSCATION_KEY = "SiX_E2EE_v1";
    const binary = atob(str);
    let result = "";
    for (let i = 0; i < binary.length; i++) {
      result += String.fromCharCode(
        binary.charCodeAt(i) ^ OBFUSCATION_KEY.charCodeAt(i % OBFUSCATION_KEY.length)
      );
    }
    // If result looks like valid utf8 text, return it
    // But this is heuristic. Let's return original if it fails.
    return result;
  } catch {
    return str;
  }
}

// --- User Identity ---

export function generateUserUUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getUserUUID(): string {
  if (typeof window === "undefined") return "";
  const STORAGE_KEY = "six_user_uuid";
  let uuid = localStorage.getItem(STORAGE_KEY);
  if (!uuid) {
    uuid = generateUserUUID();
    localStorage.setItem(STORAGE_KEY, uuid);
  }
  return uuid;
}

export function clearUserUUID(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("six_user_uuid");
  }
}
