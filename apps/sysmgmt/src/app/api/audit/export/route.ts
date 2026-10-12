import { NextRequest } from "next/server";
import { getSession, getAuthContext } from "@pspk/auth";
import { can } from "@pspk/rbac";
import { prisma, writeAudit } from "@pspk/db";
import { formatDateTime } from "@pspk/shared";

export const dynamic = "force-dynamic";

function escapeCsvField(val: unknown): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request.headers);
    if (!session?.user) {
      return new Response("Unauthorized: Sesi tidak valid", { status: 401 });
    }

    const authCtx = await getAuthContext(session.user.id);
    if (!authCtx) {
      return new Response("Unauthorized: Akses ditolak", { status: 401 });
    }

    const canExport =
      can(authCtx, "sysmgmt.audit.export:all") ||
      can(authCtx, "sysmgmt.audit.read:all");

    if (!canExport) {
      return new Response("Forbidden: Anda tidak memiliki wewenang mengekspor audit log", {
        status: 403,
      });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() || "";
    const app = searchParams.get("app")?.trim() || "ALL";
    const action = searchParams.get("action")?.trim() || "ALL";
    const entityType = searchParams.get("entityType")?.trim() || "ALL";
    const startDate = searchParams.get("startDate")?.trim() || "";
    const endDate = searchParams.get("endDate")?.trim() || "";

    const where: Record<string, unknown> = {};

    if (q) {
      where.OR = [
        { actorEmail: { contains: q, mode: "insensitive" } },
        { entityType: { contains: q, mode: "insensitive" } },
        { entityId: { contains: q, mode: "insensitive" } },
        { ip: { contains: q } },
      ];
    }

    if (app && app !== "ALL") {
      where.app = app;
    }

    if (action && action !== "ALL") {
      where.action = action;
    }

    if (entityType && entityType !== "ALL") {
      where.entityType = entityType;
    }

    if (startDate || endDate) {
      const dateRange: { gte?: Date; lte?: Date } = {};
      if (startDate) {
        const s = new Date(startDate);
        s.setHours(0, 0, 0, 0);
        dateRange.gte = s;
      }
      if (endDate) {
        const e = new Date(endDate);
        e.setHours(23, 59, 59, 999);
        dateRange.lte = e;
      }
      where.occurredAt = dateRange;
    }

    // Ambil maksimal 5000 records untuk keselamatan memori
    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { occurredAt: "desc" },
      take: 5000,
    });

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "unknown";

    // Catat mutasi audit export ke buku besar
    await writeAudit({
      actorUserId: session.user.id,
      actorEmail: session.user.email || "system@pspk.id",
      app: "sysmgmt",
      action: "EXPORT",
      entityType: "AuditLog",
      after: {
        exportType: "CSV",
        totalExported: logs.length,
        filters: { q, app, action, entityType, startDate, endDate },
      },
      ip,
      userAgent,
    });

    // Susun isi berkas CSV dengan UTF-8 BOM
    const headers = [
      "ID Log",
      "Waktu Transaksi (WIB)",
      "Portal / Aplikasi",
      "Aksi",
      "Aktor (Email)",
      "Tipe Entitas",
      "ID Entitas",
      "Alamat IP",
      "User Agent",
    ];

    const rows: string[] = [headers.map(escapeCsvField).join(",")];

    for (const log of logs) {
      rows.push(
        [
          log.id,
          formatDateTime(log.occurredAt),
          log.app.toUpperCase(),
          log.action,
          log.actorEmail,
          log.entityType,
          log.entityId || "-",
          log.ip || "-",
          log.userAgent || "-",
        ]
          .map(escapeCsvField)
          .join(","),
      );
    }

    const csvContent = "\uFEFF" + rows.join("\r\n");
    const filename = `buku-besar-audit-pspk-${new Date().toISOString().split("T")[0]}.csv`;

    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err: unknown) {
    console.error("Export audit log error:", err);
    return new Response("Internal Server Error saat mengekspor audit log", { status: 500 });
  }
}
