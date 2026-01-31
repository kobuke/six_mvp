"use client";

/**
 * E2EE Foundation for SiX
 * 
 * This module provides encryption/decryption wrappers that are designed
 * to be easily upgraded to full Web Crypto API based E2EE in the future.
 * 
 * Current implementation: Base64 obfuscation with simple XOR
 * Future upgrade path: AES-GCM with ECDH key exchange
 */

// Simple obfuscation key (will be replaced with proper key exchange in E2EE)
const OBFUSCATION_KEY = "SiX_E2EE_v1";

/**
 * XOR a string with the obfuscation key
 */
function xorWithKey(input: string, key: string): string {
  let result = "";
  for (let i = 0; i < input.length; i++) {
    result += String.fromCharCode(
      input.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    );
  }
  return result;
}

/**
 * Encode a string to Base64 (browser-safe for Unicode)
 */
function toBase64(str: string): string {
  // Handle Unicode by encoding to UTF-8 first
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

/**
 * Decode a Base64 string (browser-safe for Unicode)
 */
function fromBase64(base64: string): string {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

/**
 * Encrypt a message (currently Base64 + XOR obfuscation)
 * 
 * @param plaintext - The message to encrypt
 * @returns The encrypted cipher text
 * 
 * Future: Replace with Web Crypto API AES-GCM encryption
 */
export function encryptMessage(plaintext: string): string {
  try {
    const xored = xorWithKey(plaintext, OBFUSCATION_KEY);
    return toBase64(xored);
  } catch {
    // Fallback to plain Base64 if XOR fails
    return toBase64(plaintext);
  }
}

/**
 * Decrypt a message (currently Base64 + XOR de-obfuscation)
 * 
 * @param ciphertext - The encrypted message
 * @returns The decrypted plain text
 * 
 * Future: Replace with Web Crypto API AES-GCM decryption
 */
export function decryptMessage(ciphertext: string): string {
  try {
    const decoded = fromBase64(ciphertext);
    return xorWithKey(decoded, OBFUSCATION_KEY);
  } catch {
    // Fallback: try plain Base64 decode
    try {
      return fromBase64(ciphertext);
    } catch {
      // If all fails, return as-is (for backwards compatibility)
      return ciphertext;
    }
  }
}

/**
 * Generate a new user UUID for anonymous identification
 * Uses crypto.randomUUID() which is available in all modern browsers
 */
export function generateUserUUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Get or create user UUID from localStorage
 * This is the primary user identification method for SiX
 */
export function getUserUUID(): string {
  if (typeof window === "undefined") {
    return "";
  }

  const STORAGE_KEY = "six_user_uuid";
  let uuid = localStorage.getItem(STORAGE_KEY);

  if (!uuid) {
    uuid = generateUserUUID();
    localStorage.setItem(STORAGE_KEY, uuid);
  }

  return uuid;
}

/**
 * Clear user UUID (for testing/debugging purposes)
 */
export function clearUserUUID(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("six_user_uuid");
  }
}

// ============================================
// Future E2EE Implementation Notes:
// ============================================
// 
// 1. Key Generation (ECDH):
//    const keyPair = await crypto.subtle.generateKey(
//      { name: "ECDH", namedCurve: "P-256" },
//      true,
//      ["deriveKey"]
//    );
//
// 2. Key Exchange:
//    - Export public key and share via signaling
//    - Derive shared secret using ECDH
//
// 3. Message Encryption (AES-GCM):
//    const iv = crypto.getRandomValues(new Uint8Array(12));
//    const encrypted = await crypto.subtle.encrypt(
//      { name: "AES-GCM", iv },
//      sharedKey,
//      encoder.encode(plaintext)
//    );
//
// 4. The encryption format will be:
//    [1 byte version][12 bytes IV][encrypted data][16 bytes auth tag]
