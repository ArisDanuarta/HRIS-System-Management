import fs from "node:fs/promises";
import { createReadStream, createWriteStream, existsSync } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { Readable, pipeline } from "node:stream";
import { promisify } from "node:util";
import { GetResult, PutOptions, PutResult, StorageProvider } from "./types";

const streamPipeline = promisify(pipeline);

function getWorkspaceRoot(): string {
  let curr = process.cwd();
  while (curr !== path.dirname(curr)) {
    if (existsSync(path.join(curr, "turbo.json"))) {
      return curr;
    }
    curr = path.dirname(curr);
  }
  return process.cwd();
}

export class LocalDiskStorage implements StorageProvider {
  private baseDir: string;

  constructor(baseDir?: string) {
    if (baseDir) {
      this.baseDir = path.resolve(baseDir);
    } else {
      const rawDir = process.env.STORAGE_LOCAL_DIR || "./.data/uploads";
      this.baseDir = path.isAbsolute(rawDir) ? rawDir : path.resolve(getWorkspaceRoot(), rawDir);
    }
  }

  /**
   * Sanitizes key to strictly prevent path traversal vulnerabilities.
   */
  private resolveSafePath(key: string, writeMode = false): string {
    if (!key || key.includes("..") || path.isAbsolute(key)) {
      throw new Error(`Potensi path traversal terdeteksi pada key: ${key}`);
    }

    const normalizedKey = path.normalize(key);
    const fullPath = path.resolve(this.baseDir, normalizedKey);

    // If reading and file does not exist in baseDir, check legacy directory apps/hris/.data/uploads
    if (!writeMode && !existsSync(fullPath)) {
      const legacyPath = path.resolve(getWorkspaceRoot(), "apps/hris/.data/uploads", normalizedKey);
      if (existsSync(legacyPath)) {
        return legacyPath;
      }
    }

    // Ensure resolved path is strictly within baseDir
    if (!fullPath.startsWith(this.baseDir + path.sep) && fullPath !== this.baseDir) {
      throw new Error(`Akses di luar root direktori penyimpanan dilarang: ${key}`);
    }

    return fullPath;
  }

  async put(key: string, body: Buffer | Readable, opts: PutOptions): Promise<PutResult> {
    const fullPath = this.resolveSafePath(key, true);
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
