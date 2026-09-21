import fs from "node:fs/promises";
import { createReadStream, createWriteStream, existsSync } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { Readable, pipeline } from "node:stream";
import { promisify } from "node:util";
import { GetResult, PutOptions, PutResult, StorageProvider } from "./types";

const streamPipeline = promisify(pipeline);

export class LocalDiskStorage implements StorageProvider {
  private baseDir: string;

  constructor(baseDir?: string) {
    this.baseDir = path.resolve(baseDir || process.env.STORAGE_LOCAL_DIR || "./.data/uploads");
  }

  /**
   * Sanitizes key to strictly prevent path traversal vulnerabilities.
   */
  private resolveSafePath(key: string): string {
    if (!key || key.includes("..") || path.isAbsolute(key)) {
      throw new Error(`Potensi path traversal terdeteksi pada key: ${key}`);
    }

    const normalizedKey = path.normalize(key);
    const fullPath = path.resolve(this.baseDir, normalizedKey);

    // Ensure resolved path is strictly within baseDir
    if (!fullPath.startsWith(this.baseDir + path.sep) && fullPath !== this.baseDir) {
      throw new Error(`Akses di luar root direktori penyimpanan dilarang: ${key}`);
    }

    return fullPath;
  }

  async put(key: string, body: Buffer | Readable, opts: PutOptions): Promise<PutResult> {
    const fullPath = this.resolveSafePath(key);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });

    const hash = crypto.createHash("sha256");
    let size = 0;

    if (Buffer.isBuffer(body)) {
      hash.update(body);
      size = body.length;
      await fs.writeFile(fullPath, body);
    } else {
      const writeStream = createWriteStream(fullPath);
      body.on("data", (chunk) => {
        hash.update(chunk);
        size += chunk.length;
      });
      await streamPipeline(body, writeStream);
    }

    // Save simple metadata sidecar (.meta.json)
    const metaPath = `${fullPath}.meta.json`;
    await fs.writeFile(
      metaPath,
      JSON.stringify({
        contentType: opts.contentType,
        size,
        updatedAt: new Date().toISOString(),
      }),
    );

    return {
      key,
      size,
      sha256: hash.digest("hex"),
    };
  }

  async get(key: string): Promise<GetResult> {
    const fullPath = this.resolveSafePath(key);
    const metaPath = `${fullPath}.meta.json`;

    const stat = await fs.stat(fullPath);
    let contentType: string | undefined;

    if (existsSync(metaPath)) {
      try {
        const metaRaw = await fs.readFile(metaPath, "utf-8");
        const meta = JSON.parse(metaRaw);
        contentType = meta.contentType;
      } catch {
        // Fallback to undefined if metadata read fails
      }
    }

    const stream = createReadStream(fullPath);

    return {
      stream,
      size: stat.size,
      contentType,
    };
  }

  async delete(key: string): Promise<void> {
    const fullPath = this.resolveSafePath(key);
    const metaPath = `${fullPath}.meta.json`;

    if (existsSync(fullPath)) {
      await fs.unlink(fullPath);
    }
    if (existsSync(metaPath)) {
      await fs.unlink(metaPath);
    }
  }

  async exists(key: string): Promise<boolean> {
    const fullPath = this.resolveSafePath(key);
    return existsSync(fullPath);
  }
}
