import { Readable } from "node:stream";

export interface PutOptions {
  contentType: string;
}

export interface PutResult {
  key: string;
  size: number;
  sha256: string;
}

export interface GetResult {
  stream: Readable;
  size: number;
  contentType?: string;
}

export interface StorageProvider {
  put(key: string, body: Buffer | Readable, opts: PutOptions): Promise<PutResult>;
  get(key: string): Promise<GetResult>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}
