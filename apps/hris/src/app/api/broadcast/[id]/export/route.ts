import { NextRequest, NextResponse } from "next/server";
import { getSession, getAuthContext } from "@pspk/auth";
import { can } from "@pspk/rbac";
import { prisma, writeAudit } from "@pspk/db";

/**
 * Sanitasi nilai sel CSV untuk mencegah kerentanan CSV Injection (Formula Injection)
 * saat berkas dibuka di Microsoft Excel / Google Sheets / LibreOffice.
 */
export function escapeCsvField(value: unknown): string {
  if (value === null || value === undefined) return "";
  let str = String(value);

  // CSV Injection protection: formula trigger character di Excel/Spreadsheet
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  // Jika sel mengandung tanda kutip, koma, atau baris baru, bungkus dengan tanda kutip ganda
  if (/[",\n\r]/.test(str)) {
    str = `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession(request.headers);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Sesi tidak valid atau telah berakhir." },
        { status: 401 },
      );
    }

    const { id: broadcastId } = await params;
    if (!broadcastId) {
      return NextResponse.json(
        { error: "ID pengumuman tidak valid." },
        { status: 400 },
      );
    }

    const authCtx = await getAuthContext(session.user.id);
    if (!authCtx) {
      return NextResponse.json(
        { error: "Konteks otentikasi tidak ditemukan." },
        { status: 401 },
      );
    }

    const broadcast = await prisma.emailBroadcast.findUnique({
      where: { id: broadcastId },
      include: {
        recipients: {
          include: {
            employee: {
              select: {
                currentDepartment: {
                  select: { name: true },
                },
              },
            },
          },
          orderBy: [{ status: "asc" }, { recipientName: "asc" }],
        },
      },
    });

    if (!broadcast) {
      return NextResponse.json(
        { error: "Pengumuman tidak ditemukan." },
        { status: 404 },
      );
    }

    // Otorisasi: hanya pembuat pengumuman atau pengguna dengan hak broadcast.send:all (Admin HR / Super Admin)
    const isSuperAdmin = authCtx.roles.includes("super_admin");
    const isAdminHr = authCtx.roles.includes("admin_hr");
    const canSendAll = isSuperAdmin || isAdminHr || can(authCtx, "hris.broadcast.send:all");
    const isAuthor = broadcast.senderUserId === session.user.id;

    if (!isAuthor && !canSendAll) {
      return NextResponse.json(
        { error: "Akses ditolak: Anda tidak memiliki izin untuk mengekspor data penerima pengumuman ini." },
        { status: 403 },
      );
    }

    // Susun baris CSV
    const headers = [
      "Nama",
      "Email",
      "Departemen",
      "Status",
      "Waktu Kirim",
      "Percobaan",
      "Pesan Error",
      "Dibaca Pada",
    ];

    const rows: string[] = [];
    rows.push(headers.map(escapeCsvField).join(","));

    for (const r of broadcast.recipients) {
      const deptName = r.employee?.currentDepartment?.name || "-";
      const sentTimeStr = r.sentAt ? r.sentAt.toISOString() : "";
      const readTimeStr = r.readAt ? r.readAt.toISOString() : "";
      const errorStr = r.errorMessage || "";

      const row = [
        r.recipientName,
        r.email,
        deptName,
        r.status,
        sentTimeStr,
        r.attempts,
        errorStr,
        readTimeStr,
      ];

      rows.push(row.map(escapeCsvField).join(","));
    }

    // Sisipkan UTF-8 Byte Order Mark (BOM) agar Microsoft Excel membaca encoding UTF-8 dengan sempurna
    const csvContent = "\uFEFF" + rows.join("\r\n");

    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const yyyymmdd = `${yyyy}${mm}${dd}`;
    const filename = `broadcast-${broadcast.id}-${yyyymmdd}.csv`;

    // Catat Audit Log Ekspor CSV
    await writeAudit({
      actorUserId: session.user.id,
      actorEmail: session.user.email || "unknown",
      app: "hris",
      action: "BROADCAST_EXPORT",
      entityType: "EmailBroadcast",
      entityId: broadcast.id,
      after: {
        broadcastId: broadcast.id,
        recipientCount: broadcast.recipients.length,
        filename,
      },
      ip: request.headers.get("x-forwarded-for") || "127.0.0.1",
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error: unknown) {
    console.error("Gagal mengekspor CSV broadcast:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal pada server saat mengekspor data." },
      { status: 500 },
    );
  }
}
