import crypto from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96-bit IV recommended for GCM
const TAG_LENGTH = 16; // 128-bit auth tag

function getEncryptionKey(): Buffer {
  const keyBase64 = process.env.DATA_ENCRYPTION_KEY;
  if (!keyBase64) {
    throw new Error("DATA_ENCRYPTION_KEY environment variable is not defined");
  }

  const keyBuffer = Buffer.from(keyBase64, "base64");
  if (keyBuffer.length !== 32) {
    throw new Error("DATA_ENCRYPTION_KEY must be a 32-byte base64-encoded string");
  }

  return keyBuffer;
}

/**
 * Encrypts sensitive plain text string using AES-256-GCM.
 * Output format: iv:tag:ciphertext (all in hex)
 */
export function encryptField(plainText: string): string {
  if (!plainText) return plainText;

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plainText, "utf8", "hex");
  encrypted += cipher.final("hex");

  const tag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted}`;
}

/**
 * Decrypts sensitive text encrypted with encryptField().
 */
export function decryptField(encryptedPayload: string): string {
  if (!encryptedPayload) return encryptedPayload;

  const parts = encryptedPayload.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted format. Expected iv:tag:ciphertext");
  }

  const [ivHex, tagHex, cipherHex] = parts;
  if (!ivHex || !tagHex || !cipherHex) {
    throw new Error("Missing iv, tag, or ciphertext component");
  }

  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

  decipher.setAuthTag(tag);

  let decrypted = decipher.update(cipherHex, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Masks sensitive values for display (e.g. ••••••••3412)
 */
export function maskSensitiveValue(value: string | null | undefined, visibleTailChars = 4): string {
  if (!value) return "-";
  if (value.length <= visibleTailChars) return "••••";
  const tail = value.slice(-visibleTailChars);
  const maskedLength = Math.max(value.length - visibleTailChars, 4);
  return "•".repeat(maskedLength) + tail;
}
