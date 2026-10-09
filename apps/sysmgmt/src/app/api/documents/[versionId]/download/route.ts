import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { getSession } from "@pspk/auth";
import { prisma, writeAudit } from "@pspk/db";
import { getStorageProvider } from "@pspk/storage";
import { canUserViewDocument } from "@/server/queries/document.queries";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ versionId: string }> },
) {
  try {
    const reqHeaders = await headers();
    const session = await getSession(reqHeaders);

    if (!session?.user) {
      return new Response("Unauthorized: Sesi tidak valid atau telah berakhir.", {
        status: 401,
      });
    }

    const resolvedParams = await params;
    const versionId = resolvedParams.versionId;

    if (!versionId) {
      return new Response("Bad Request: ID versi dokumen tidak valid.", { status: 400 });
    }

    // Ambil data versi dokumen dan induk dokumen
    const version = await prisma.documentVersion.findUnique({
      where: { id: versionId },
      include: {
        document: true,
      },
    });

    if (!version || !version.document) {
      return new Response("Not Found: Dokumen atau versi tidak ditemukan.", { status: 404 });
    }

    // Ambil peran pengguna
    const userRoles = await prisma.userRole.findMany({
      where: { userId: session.user.id },
      include: { role: true },
    });
    const roleKeys = userRoles.map((ur) => ur.role.key);

    // Verifikasi izin visibilitas peran
    const isAllowed = canUserViewDocument(roleKeys, version.document.visibility);
    if (!isAllowed) {
      return new Response(
        "Forbidden: Anda tidak memiliki wewenang untuk mengakses berkas dengan visibilitas ini.",
        { status: 403 },
      );
    }

    const storage = getStorageProvider();
    const exists = await storage.exists(version.fileKey);
    if (!exists) {
      return new Response("Not Found: Berkas dokumen fisik tidak ditemukan di sistem penyimpanan.", {
        status: 404,
      });
    }

    const file = await storage.get(version.fileKey);

    // Konversi node stream ke Web ReadableStream
    const webStream = new ReadableStream({
      start(controller) {
        file.stream.on("data", (chunk) => controller.enqueue(chunk));
        file.stream.on("end", () => controller.close());
        file.stream.on("error", (err) => controller.error(err));
      },
    });

    // Cek apakah mode inline preview diminta (?preview=true)
    const { searchParams } = new URL(request.url);
    const isPreview = searchParams.get("preview") === "true";
    const dispositionType = isPreview ? "inline" : "attachment";

    // Catat audit log pengunduhan / akses berkas
    const ip = reqHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const userAgent = reqHeaders.get("user-agent") || "unknown";

    await writeAudit({
      actorUserId: session.user.id,
      actorEmail: session.user.email || "system@pspk.id",
      app: "sysmgmt",
      action: isPreview ? "VIEW" : "EXPORT",
      entityType: "DocumentVersion",
      entityId: version.id,
      after: {
        documentId: version.document.id,
        documentCode: version.document.code,
        versionNo: version.versionNo,
        fileName: version.fileName,
        sizeBytes: version.sizeBytes,
        mode: isPreview ? "preview" : "download",
      },
      ip,
      userAgent,
    });

    const safeFileName = encodeURIComponent(version.fileName).replace(/['()]/g, escape);

    return new Response(webStream, {
      status: 200,
      headers: {
        "Content-Type": version.mimeType || "application/octet-stream",
        "Content-Length": String(file.size),
        "Content-Disposition": `${dispositionType}; filename="${version.fileName}"; filename*=UTF-8''${safeFileName}`,
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    });
  } catch (err: unknown) {
    console.error("GET /api/documents/[versionId]/download error:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
