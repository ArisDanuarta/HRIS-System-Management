import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import { LocalDiskStorage } from "./local";

const TEST_DIR = path.resolve("./.data/test_uploads");

describe("LocalDiskStorage", () => {
  let storage: LocalDiskStorage;

  beforeEach(async () => {
    storage = new LocalDiskStorage(TEST_DIR);
    await fs.mkdir(TEST_DIR, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(TEST_DIR, { recursive: true, force: true });
  });

  it("stores and retrieves files properly", async () => {
    const key = "hris/contracts/emp-1/doc-1.txt";
    const content = Buffer.from("Kontrak Kerja PSPK", "utf-8");

    const result = await storage.put(key, content, { contentType: "text/plain" });
    expect(result.key).toBe(key);
    expect(result.size).toBe(content.length);
    expect(result.sha256).toBeDefined();

    const exists = await storage.exists(key);
    expect(exists).toBe(true);

    const got = await storage.get(key);
    expect(got.size).toBe(content.length);
    expect(got.contentType).toBe("text/plain");

    // Read full stream content
    const chunks: Buffer[] = [];
    for await (const chunk of got.stream) {
      chunks.push(Buffer.from(chunk));
    }
    const retrieved = Buffer.concat(chunks).toString("utf-8");
    expect(retrieved).toBe("Kontrak Kerja PSPK");

    await storage.delete(key);
    expect(await storage.exists(key)).toBe(false);
  });

  it("strictly blocks path traversal attempts", async () => {
    const dangerousKeys = [
      "../outside.txt",
      "hris/../../etc/passwd",
      "/etc/passwd",
      "hris/../../../secret.env",
    ];

    for (const key of dangerousKeys) {
      await expect(
        storage.put(key, Buffer.from("malicious"), { contentType: "text/plain" }),
      ).rejects.toThrow();
    }
  });
});
