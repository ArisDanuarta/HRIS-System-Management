import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { getSession, getAuthContext } from "@pspk/auth";
import { can } from "@pspk/rbac";
import { getStorageProvider } from "@pspk/storage";
import { writeAudit } from "@pspk/db";

export const dynamic = "force-dynamic";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const MAX_IMAGE_SIZE_BYTES = 3 * 1024 * 1024; // 3 MB

/**
 * Validasi biner magic bytes untuk gambar JPG, PNG, GIF, dan WebP (AUDIT-03).
 */
export function isValidImageMagicBytes(buffer: Buffer, mimeType: string): boolean {
  if (buffer.length < 12) return false;

  // JPEG: FF D8 FF
  if (mimeType === "image/jpeg") {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (mimeType === "image/png") {
    return (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    );
  }

  // GIF: GIF87a atau GIF89a (47 49 46 38 37/39 61)
  if (mimeType === "image/gif") {
    return (
      buffer[0] === 0x47 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x38 &&
      (buffer[4] === 0x37 || buffer[4] === 0x39) &&
      buffer[5] === 0x61
    );
  }

  // WebP: RIFF....WEBP (52 49 46 46 .... 57 45 42 50)
  if (mimeType === "image/webp") {
    return (
      buffer[0] === 0x52 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x46 &&
      buffer[8] === 0x57 &&
      buffer[9] === 0x45 &&
      buffer[10] === 0x42 &&
      buffer[11] === 0x50
    );
  }

  return false;
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

    // Hanya Super Admin, Admin HR, dan Manajer (pemilik hak send broadcast) yang diizinkan mengunggah gambar broadcast
    const canSendBroadcast =
      can(authCtx, "hris.broadcast.send") ||
      authCtx.roles.some((r) => ["super_admin", "admin_hr", "manager"].includes(r));

    if (!canSendBroadcast) {
      return Response.json(
        { error: "Akses ditolak: Anda tidak memiliki izin untuk mengunggah aset gambar broadcast." },
        { status: 403 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return Response.json(
        { error: "Berkas gambar tidak ditemukan pada request." },
        { status: 400 },
      );
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return Response.json(
        {
          error:
            "Format berkas tidak didukung. Harap unggah gambar berformat JPG, PNG, WebP, atau GIF.",
        },
        { status: 400 },
      );
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      return Response.json(
        {
          error: `Ukuran gambar terlalu besar (${(file.size / (1024 * 1024)).toFixed(1)} MB). Batas maksimum adalah 3 MB.`,
        },
        { status: 400 },
      );
    }

    // Buat ekstensi berkas yang aman
    const rawExt = file.name.split(".").pop()?.toLowerCase();
    const ext = rawExt && ["jpg", "jpeg", "png", "webp", "gif"].includes(rawExt) ? rawExt : "jpg";
    const storageKey = `broadcast-images/${crypto.randomUUID()}.${ext}`;

    const storage = getStorageProvider();
    const buffer = Buffer.from(await file.arrayBuffer());

    if (!isValidImageMagicBytes(buffer, file.type)) {
      return Response.json(
        {
          error:
            "Isi berkas tidak valid sebagai gambar resmi (verifikasi signature/magic bytes biner gagal).",
        },
        { status: 400 },
      );
    }

    const result = await storage.put(storageKey, buffer, {
      contentType: file.type,
    });

    // Catat log audit pengunggahan aset
    const ip = reqHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const userAgent = reqHeaders.get("user-agent") || "unknown";

    await writeAudit({
      actorUserId: session.user.id,
      actorEmail: session.user.email,
      app: "hris",
      action: "UPLOAD",
      entityType: "BroadcastImage",
      entityId: storageKey,
      after: {
        key: storageKey,
        originalName: file.name,
        sizeBytes: result.size,
        mimeType: file.type,
        sha256: result.sha256,
      },
      ip,
      userAgent,
    });

    const publicUrl = `/api/documents/${storageKey}`;

    return Response.json({
      success: true,
      url: publicUrl,
      key: storageKey,
      size: result.size,
      name: file.name,
    });
  } catch (err: unknown) {
    console.error("Gagal mengunggah gambar broadcast:", err);
    return Response.json(
      { error: "Terjadi kesalahan internal saat memproses pengunggahan gambar." },
      { status: 500 },
    );
  }
}
