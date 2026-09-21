import { LocalDiskStorage } from "./local";
import { StorageProvider } from "./types";

export * from "./types";
export * from "./local";

let defaultStorageProvider: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (defaultStorageProvider) return defaultStorageProvider;

  const driver = process.env.STORAGE_DRIVER || "local";
  if (driver === "local") {
    defaultStorageProvider = new LocalDiskStorage();
    return defaultStorageProvider;
  }

  // Extensible for S3 / MinIO later
  throw new Error(`Unsupported STORAGE_DRIVER: ${driver}`);
}
