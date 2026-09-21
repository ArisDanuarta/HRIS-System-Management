import { describe, it, expect, beforeAll } from "vitest";
import { encryptField, decryptField, maskSensitiveValue } from "./crypto";

describe("encryptField & decryptField", () => {
  beforeAll(() => {
    process.env.DATA_ENCRYPTION_KEY = "2f/wOrwtFxfsVuvVnbjAK+T+qtIEEaEZ1KtQSDkVh+U=";
  });

  it("encrypts and decrypts text accurately", () => {
    const original = "3171012345678901"; // NIK example
    const encrypted = encryptField(original);

    expect(encrypted).not.toBe(original);
    expect(encrypted.split(":")).toHaveLength(3); // iv:tag:ciphertext

    const decrypted = decryptField(encrypted);
    expect(decrypted).toBe(original);
  });

  it("masks sensitive value properly", () => {
    expect(maskSensitiveValue("3171012345678901")).toBe("••••••••••••8901");
    expect(maskSensitiveValue("123")).toBe("••••");
    expect(maskSensitiveValue(null)).toBe("-");
  });
});
