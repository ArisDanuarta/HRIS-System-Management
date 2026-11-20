import { NextRequest } from "next/server";
import { headers } from "next/headers";
import path from "node:path";
import crypto from "node:crypto";
import { getSession, getAuthContext } from "@pspk/auth";
import { can } from "@pspk/rbac";
import { getStorageProvider } from "@pspk/storage";
import { prisma, writeAudit } from "@pspk/db";

export const dynamic = "force-dynamic";

export const MAX_ATTACHMENT_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB per file
export const MAX_ATTACHMENTS_COUNT = 3;
export const MAX_TOTAL_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB total

/**
 * Validasi magic bytes PDF: 5 byte pertama harus '%PDF-'
 */
export function isValidPdfMagicBytes(buffer: Buffer): boolean {
  if (buffer.length < 5) return false;
  return (
    buffer[0] === 0x25 && // %
    buffer[1] === 0x50 && // P
    buffer[2] === 0x44 && // D
    buffer[3] === 0x46 && // F
    buffer[4] === 0x2d // -
  );
}

/**
 * Membersihkan nama file: buang path traversal, karakter kontrol, dan batasi 120 karakter.
 */
export function sanitizeAttachmentFileName(rawName: string): string {
  const baseName = path.basename(rawName || "lampiran.pdf");
  const cleaned = baseName
    .replace(/[\r\n\0\t]/g, "")
    .replace(/[^a-zA-Z0-9.\-_\s]/g, "")
    .trim();
  const truncated = cleaned.slice(0, 120);
  return truncated.endsWith(".pdf") ? truncated : `${truncated}.pdf`;
}

export async function POST(request: NextRequest) {
  try {
    const reqHeaders = await headers();
    const session = await getSession(reqHeaders);

    if (!session?.user) {
      return Response.json(
        { error: "Sesi tidak valid atau telah berakhir. Harap login kembali." },
        { status: 401 },
      );
    }

    const authCtx = await getAuthContext(session.user.id);
    if (!authCtx) {
      return Response.json(
        { error: "Akses ditolak: Data otentikasi tidak ditemukan." },
        { status: 403 },
      );
    }

    const canSendBroadcast =
      can(authCtx, "hris.broadcast.send") ||
      authCtx.roles.some((r) => ["super_admin", "admin_hr", "manager"].includes(r));

    if (!canSendBroadcast) {
      return Response.json(
        { error: "Akses ditolak: Anda tidak memiliki izin untuk mengunggah lampiran broadcast." },
        { status: 403 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return Response.json(
        { error: "Berkas PDF tidak ditemukan pada request." },
        { status: 400 },
      );
    }

    // 1. Cek MIME type bawaan
    if (file.type !== "application/pdf") {
      return Response.json(
        { error: "Format berkas tidak didukung. Lampiran broadcast hanya boleh berformat PDF." },
        { status: 400 },
      );
    }

    // 2. Cek ukuran file tunggal (maks 5 MB)
    if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
      return Response.json(
        {
          error: `Ukuran berkas terlalu besar (${(file.size / (1024 * 1024)).toFixed(1)} MB). Batas maksimum per berkas adalah 5 MB.`,
        },
        { status: 400 },
      );
    }

    // 3. Baca buffer dan validasi magic bytes '%PDF-'
    const buffer = Buffer.from(await file.arrayBuffer());
    if (!isValidPdfMagicBytes(buffer)) {
      return Response.json(
        {
          error:
            "Isi berkas tidak valid sebagai dokumen PDF resmi (magic bytes '%PDF-' tidak ditemukan).",
        },
        { status: 400 },
      );
    }

    // 4. Sanitasi nama file dan buat storage key
    const safeFileName = sanitizeAttachmentFileName(file.name);
    const storageKey = `broadcast-attachments/${crypto.randomUUID()}.pdf`;

    const storage = getStorageProvider();
    const result = await storage.put(storageKey, buffer, {
      contentType: "application/pdf",
    });

    // 5. Simpan record attachment ke database
    const attachment = await prisma.emailBroadcastAttachment.create({
      data: {
        uploadedBy: session.user.id,
        key: storageKey,
        fileName: safeFileName,
        mimeType: "application/pdf",
        sizeBytes: result.size,
        sha256: result.sha256,
      },
    });

    // 6. Catat log audit pengunggahan lampiran
    const ip = reqHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const userAgent = reqHeaders.get("user-agent") || "unknown";

    await writeAudit({
      actorUserId: session.user.id,
      actorEmail: session.user.email,
      app: "hris",
      action: "UPLOAD",
      entityType: "BroadcastAttachment",
      entityId: attachment.id,
      after: {
        id: attachment.id,
        key: storageKey,
        fileName: safeFileName,
        sizeBytes: result.size,
        sha256: result.sha256,
      },
      ip,
      userAgent,
    });

    return Response.json({
      success: true,
      attachment: {
        id: attachment.id,
        fileName: attachment.fileName,
        sizeBytes: attachment.sizeBytes,
        key: attachment.key,
        url: `/api/documents/${attachment.key}`,
      },
    });
  } catch (err: unknown) {
    console.error("Gagal mengunggah lampiran PDF broadcast:", err);
    return Response.json(
      { error: "Terjadi kesalahan internal saat memproses pengunggahan lampiran PDF." },
      { status: 500 },
    );
  }
}
