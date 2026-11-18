import * as archiverModule from "archiver";
import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";

interface ZipOptions {
  zlib?: { level: number };
}

interface ZipArchiveInstance {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on(event: string, listener: (...args: any[]) => void): this;
  append(source: Buffer | Readable | string, data: { name: string }): this;
  finalize(): Promise<void>;
}

function createZipArchive(options?: ZipOptions): ZipArchiveInstance {
  // Dukungan untuk archiver v8.x (ZipArchive class)
  if ("ZipArchive" in archiverModule && typeof archiverModule.ZipArchive === "function") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new (archiverModule as any).ZipArchive(options);
  }

  // Dukungan untuk archiver v7.x (callable function)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fn = (archiverModule as any).default || archiverModule;
  if (typeof fn === "function") {
    return fn("zip", options);
  }

  throw new Error("Gagal menginisialisasi pustaka archiver");
}

// Helper untuk membaca Readable stream ke Buffer
export async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

// Helper untuk menemukan lokasi berkas gambar statis
function resolveImagePath(filename: string): string | null {
  const candidates = [
    path.join(process.cwd(), "apps/hris/public/images", filename),
    path.join(process.cwd(), "public/images", filename),
    path.join(__dirname, "../../../../../apps/hris/public/images", filename),
    path.join(__dirname, "../../../../public/images", filename),
  ];
  for (const c of candidates) {
    if (fs.existsSync(/*turbopackIgnore: true*/ c)) return c;
  }
  return null;
}

export interface ZipDocumentItem {
  id?: string;
  category: string;
  title?: string;
  fileName: string;
  fileKey: string;
}

export interface EmployeeZipExportOptions {
  employee: {
    id: string;
    employeeNo: string;
    fullName: string;
    gender?: string | null;
    photoKey?: string | null;
    documents?: ZipDocumentItem[];
  };
  pdfBuffer: Buffer;
  storageProvider?: {
    get(key: string): Promise<{ stream: Readable }>;
  };
}

/**
 * Menghasilkan Paket Arsip ZIP Kepegawaian Lengkap
 * Berisi PDF Profil Resmi di root dan seluruh berkas fisik asli di Dokumen_Lampiran/
 */
export async function createEmployeeProfileZip(
  options: EmployeeZipExportOptions,
): Promise<Buffer> {
  const { employee, pdfBuffer, storageProvider } = options;
  const sanitizedName = employee.fullName.replace(/[^a-zA-Z0-9_-]/g, "_");

  const archive = createZipArchive({
    zlib: { level: 6 },
  });

  const zipBuffers: Buffer[] = [];
  archive.on("data", (chunk: Buffer) => zipBuffers.push(chunk));

  // 1. Lampirkan PDF Profil Utama ke Root Berkas ZIP
  const mainPdfFileName = `${employee.employeeNo}_${sanitizedName}_Profil_Resmi.pdf`;
  archive.append(pdfBuffer, { name: mainPdfFileName });

  // 2. Lampirkan Foto Profil Resmi
  let photoAttached = false;
  if (employee.photoKey && storageProvider) {
    try {
      const photoRes = await storageProvider.get(employee.photoKey);
      if (photoRes && photoRes.stream) {
        const photoData = await streamToBuffer(photoRes.stream);
        const ext = path.extname(employee.photoKey) || ".jpg";
        archive.append(photoData, {
          name: `Dokumen_Lampiran/00_Foto_Profil_${sanitizedName}${ext}`,
        });
        photoAttached = true;
      }
    } catch (err) {
      console.warn("Gagal mengambil foto profil asli dari storage untuk ZIP:", err);
    }
  }

  // Jika foto dari storage belum terlampir, lampirkan foto fallback gender dari disk
  if (!photoAttached) {
    const isFemale =
      employee.gender?.toUpperCase() === "FEMALE" ||
      employee.gender?.toLowerCase() === "perempuan" ||
      employee.gender?.toLowerCase() === "wanita";
    const avatarPath = resolveImagePath(isFemale ? "Avatar_Wanita.jpg" : "Avatar_Pria.jpg");
    if (avatarPath && fs.existsSync(/*turbopackIgnore: true*/ avatarPath)) {
      try {
        const avatarBuffer = fs.readFileSync(/*turbopackIgnore: true*/ avatarPath);
        archive.append(avatarBuffer, {
          name: `Dokumen_Lampiran/00_Avatar_Resmi_${isFemale ? "Wanita" : "Pria"}.jpg`,
        });
      } catch (err) {
        console.warn("Gagal menyertakan avatar fallback ke ZIP:", err);
      }
    }
  }

  // 3. Lampirkan Seluruh Berkas Dokumen Fisik Asli
  const docs = employee.documents || [];
  if (docs.length > 0 && storageProvider) {
    for (let i = 0; i < docs.length; i++) {
      const docItem = docs[i];
      if (!docItem?.fileKey) continue;

      try {
        const fileRes = await storageProvider.get(docItem.fileKey);
        if (fileRes && fileRes.stream) {
          const fileData = await streamToBuffer(fileRes.stream);
          const indexPrefix = String(i + 1).padStart(2, "0");
          const safeCategory = (docItem.category || "DOKUMEN").replace(/[^a-zA-Z0-9_-]/g, "_");
          const safeFileName = docItem.fileName.replace(/[^a-zA-Z0-9_.-]/g, "_");
          const zipPath = `Dokumen_Lampiran/${indexPrefix}_${safeCategory}_${safeFileName}`;

          archive.append(fileData, { name: zipPath });
        }
      } catch (err) {
        console.warn(
          `Gagal menyertakan dokumen lampiran ${docItem.fileKey} ke paket ZIP:`,
          err,
        );
      }
    }
  }

  await archive.finalize();

  return Buffer.concat(zipBuffers);
}
