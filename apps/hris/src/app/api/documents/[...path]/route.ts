import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { getSession, getAuthContext } from "@pspk/auth";
import type { AuthContext } from "@pspk/rbac";
import { prisma, writeAudit } from "@pspk/db";
import { getStorageProvider } from "@pspk/storage";

export const dynamic = "force-dynamic";

/**
 * Validates whether the authenticated user has authorization to access the requested document key.
 * Prevents Insecure Direct Object References (IDOR/BOLA).
 */
async function checkDocumentAccess(
  key: string,
  authCtx: AuthContext,
): Promise<boolean> {
  const isSuperAdmin = authCtx.roles.includes("super_admin");
  const isAdminHr = authCtx.roles.includes("admin_hr");
  const isFinance = authCtx.roles.includes("finance");

  // Super Admin & Admin HR have full access across all employee documents
  if (isSuperAdmin || isAdminHr) {
    return true;
  }

  // 1. Dokumen Pegawai: documents/{employeeId}/...
  if (key.startsWith("documents/")) {
    const parts = key.split("/");
    const targetEmployeeId = parts[1];
    if (!targetEmployeeId) return false;

    // Pemilik dokumen
    if (authCtx.employeeId && authCtx.employeeId === targetEmployeeId) {
      return true;
    }

    // Cek record di tabel employee_documents
    const doc = await prisma.employeeDocument.findFirst({
      where: { fileKey: key },
      select: { employeeId: true },
    });
    if (doc && authCtx.employeeId && doc.employeeId === authCtx.employeeId) {
      return true;
    }

    return false;
  }

  // 2. Lampiran Cuti / Surat Dokter: cuti/lampiran/{employeeId}_{timestamp}_{safeFileName}
  if (key.startsWith("cuti/lampiran/")) {
    const fileNamePart = key.slice("cuti/lampiran/".length);
    const targetEmployeeId = fileNamePart.split("_")[0];

    // Pemilik lampiran cuti
    if (authCtx.employeeId && targetEmployeeId && authCtx.employeeId === targetEmployeeId) {
      return true;
    }

    // Cek record di tabel leave_requests
    const leaveReq = await prisma.leaveRequest.findFirst({
      where: { attachmentKey: key },
      select: { employeeId: true },
    });
    const effectiveEmployeeId = leaveReq?.employeeId || targetEmployeeId;

    if (authCtx.employeeId && effectiveEmployeeId && authCtx.employeeId === effectiveEmployeeId) {
      return true;
    }

    // Atasan langsung / Manajer dari pegawai yang mengajukan cuti
    if (authCtx.employeeId && effectiveEmployeeId) {
      const isSubordinate = await prisma.employee.findFirst({
        where: {
          id: effectiveEmployeeId,
          managerId: authCtx.employeeId,
        },
        select: { id: true },
      });
      if (isSubordinate) {
        return true;
      }
    }

    return false;
  }

  // 3. SK Mutasi / Riwayat Karir: sk-mutasi/{employeeId}_{timestamp}_{safeFileName}
  if (key.startsWith("sk-mutasi/")) {
    const fileNamePart = key.slice("sk-mutasi/".length);
    const targetEmployeeId = fileNamePart.split("_")[0];

    if (authCtx.employeeId && targetEmployeeId && authCtx.employeeId === targetEmployeeId) {
      return true;
    }

    const career = await prisma.employmentHistory.findFirst({
      where: { documentKey: key },
      select: { employeeId: true },
    });
    if (career && authCtx.employeeId && career.employeeId === authCtx.employeeId) {
      return true;
    }

    const contract = await prisma.employmentContract.findFirst({
      where: { documentKey: key },
      select: { employeeId: true },
    });
    if (contract && authCtx.employeeId && contract.employeeId === authCtx.employeeId) {
      return true;
    }

    return false;
  }

  // 4. Timesheet / Presensi Payroll: timesheets/{payslipId}_{timestamp}_{safeFileName}
  if (key.startsWith("timesheets/")) {
    if (isFinance) return true;

    const fileNamePart = key.slice("timesheets/".length);
    const payslipId = fileNamePart.split("_")[0];
    if (!payslipId) return false;

    const payslip = await prisma.payslip.findUnique({
      where: { id: payslipId },
      select: { employeeId: true },
    });

    if (payslip && authCtx.employeeId && payslip.employeeId === authCtx.employeeId) {
      return true;
    }

    return false;
  }

  // Default fallback: tolak jika bukan pemilik atau Super Admin / Admin HR
  return false;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    const resolvedParams = await params;
    const key = (resolvedParams.path || []).join("/");

    if (!key || key.includes("..") || key.startsWith("/") || key.includes("\\") || key.includes("\0")) {
      return new Response("Invalid file path", { status: 400 });
    }

    // Avatar foto profil dan branding aset payroll bersifat publik untuk rendering antarmuka UI.
    const isPublicAsset = key.startsWith("avatars/") || key.startsWith("branding/");

    const reqHeaders = await headers();
    let session = null;

    if (!isPublicAsset) {
      session = await getSession(reqHeaders);

      if (!session?.user) {
        return new Response("Unauthorized: Sesi tidak valid atau telah berakhir.", { status: 401 });
      }

      const authCtx = await getAuthContext(session.user.id);
      if (!authCtx) {
        return new Response("Forbidden: Pengguna tidak aktif atau hak akses tidak valid.", {
          status: 403,
        });
      }

      const isAllowed = await checkDocumentAccess(key, authCtx);
      if (!isAllowed) {
        return new Response(
          "Forbidden: Anda tidak memiliki hak akses untuk membuka atau mengunduh dokumen ini.",
          { status: 403 },
        );
      }
    }

    const storage = getStorageProvider();
    const exists = await storage.exists(key);
    if (!exists) {
      return new Response("File not found", { status: 404 });
    }

    const file = await storage.get(key);

    // Convert node Readable to Web ReadableStream
    const webStream = new ReadableStream({
      start(controller) {
        file.stream.on("data", (chunk) => controller.enqueue(chunk));
        file.stream.on("end", () => controller.close());
        file.stream.on("error", (err) => controller.error(err));
      },
    });

    const lowerKey = key.toLowerCase();
    let contentType = file.contentType;
    if (!contentType) {
      if (lowerKey.endsWith(".pdf")) contentType = "application/pdf";
      else if (lowerKey.endsWith(".png")) contentType = "image/png";
      else if (lowerKey.endsWith(".jpg") || lowerKey.endsWith(".jpeg")) contentType = "image/jpeg";
      else if (lowerKey.endsWith(".webp")) contentType = "image/webp";
      else if (lowerKey.endsWith(".csv")) contentType = "text/csv";
      else contentType = "application/octet-stream";
    }

    const { searchParams } = new URL(request.url);
    const isDownload = searchParams.get("download") === "true";
    const customFilename = searchParams.get("filename");
    const rawFilename = customFilename || key.split("/").pop() || "document";
    const disposition = isDownload ? "attachment" : "inline";

    // Proteksi Response Header Splitting & CRLF Injection
    const sanitizedAsciiFilename =
      rawFilename
        .replace(/[\r\n]/g, "")
        .replace(/[^\x20-\x7E]/g, "_")
        .replace(/["\\]/g, "_")
        .trim() || "document";

    const sanitizedUtf8Filename = rawFilename.replace(/[\r\n]/g, "").trim() || "document";
    const encodedFilename = encodeURIComponent(sanitizedUtf8Filename).replace(/['()]/g, escape);

    // Catat audit log untuk dokumen non-publik
    if (!isPublicAsset && session?.user) {
      const ip = reqHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
      const userAgent = reqHeaders.get("user-agent") || "unknown";

      await writeAudit({
        actorUserId: session.user.id,
        actorEmail: session.user.email || "system@pspk.id",
        app: "hris",
        action: isDownload ? "EXPORT" : "VIEW",
        entityType: "Document",
        entityId: key,
        after: {
          key,
          mode: isDownload ? "download" : "preview",
          sizeBytes: file.size,
        },
        ip,
        userAgent,
      });
    }

    return new Response(webStream, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(file.size),
        "Content-Disposition": `${disposition}; filename="${sanitizedAsciiFilename}"; filename*=UTF-8''${encodedFilename}`,
        "Cache-Control": isPublicAsset
          ? "public, max-age=86400"
          : "private, no-cache, no-store, must-revalidate",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err: unknown) {
    console.error("GET /api/documents error:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
