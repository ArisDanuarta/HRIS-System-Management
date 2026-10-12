import { prisma } from "@pspk/db";
import { maskSensitiveData } from "../../lib/audit-masking";

export interface SerializedAuditLog {
  id: string;
  occurredAt: Date;
  actorUserId: string | null;
  actorEmail: string;
  app: string;
  action: string;
  entityType: string;
  entityId: string | null;
  before: unknown | null;
  after: unknown | null;
  ip: string | null;
  userAgent: string | null;
  requestId: string | null;
}

export interface AuditLogFilters {
  q?: string;
  app?: string;
  action?: string;
  entityType?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export interface AuditDirectoryResult {
  logs: SerializedAuditLog[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
}

export interface AuditStats {
  totalLogs: number;
  last24hCount: number;
  uniqueActorsCount: number;
  actionBreakdown: { action: string; count: number }[];
}

export interface AuditFilterOptions {
  apps: string[];
  actions: string[];
  entityTypes: string[];
}

/**
 * Mengambil daftar catatan audit log dengan filter multi-dimensi dan paginasi.
 * Seluruh payload before/after disamarkan (masking) untuk keamanan.
 */
export async function getAuditLogs(
  filters: AuditLogFilters = {},
): Promise<AuditDirectoryResult> {
  const page = Math.max(1, filters.page || 1);
  const pageSize = Math.min(100, Math.max(5, filters.pageSize || 25));
  const skip = (page - 1) * pageSize;

  const where: Record<string, unknown> = {};

  if (filters.q && filters.q.trim()) {
    const search = filters.q.trim();
    where.OR = [
      { actorEmail: { contains: search, mode: "insensitive" } },
      { entityType: { contains: search, mode: "insensitive" } },
      { entityId: { contains: search, mode: "insensitive" } },
      { ip: { contains: search } },
    ];
  }

  if (filters.app && filters.app !== "ALL") {
    where.app = filters.app;
  }

  if (filters.action && filters.action !== "ALL") {
    where.action = filters.action;
  }

  if (filters.entityType && filters.entityType !== "ALL") {
    where.entityType = filters.entityType;
  }

  if (filters.startDate || filters.endDate) {
    const dateRange: { gte?: Date; lte?: Date } = {};
    if (filters.startDate) {
      const s = new Date(filters.startDate);
      s.setHours(0, 0, 0, 0);
      dateRange.gte = s;
    }
    if (filters.endDate) {
      const e = new Date(filters.endDate);
      e.setHours(23, 59, 59, 999);
      dateRange.lte = e;
    }
    where.occurredAt = dateRange;
  }

  const [totalCount, rawLogs] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { occurredAt: "desc" },
      skip,
      take: pageSize,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const logs: SerializedAuditLog[] = rawLogs.map((log) => ({
    id: log.id,
    occurredAt: log.occurredAt,
    actorUserId: log.actorUserId,
    actorEmail: log.actorEmail,
    app: log.app,
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId,
    before: maskSensitiveData(log.before),
    after: maskSensitiveData(log.after),
    ip: log.ip,
    userAgent: log.userAgent,
    requestId: log.requestId,
  }));

  return {
    logs,
    totalCount,
    currentPage: page,
    pageSize,
    totalPages,
  };
}

/**
 * Mengambil ringkasan statistik buku besar audit log.
 */
export async function getAuditStats(): Promise<AuditStats> {
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [totalLogs, last24hCount, uniqueActorsGroup, actionGroup] = await Promise.all([
    prisma.auditLog.count(),
    prisma.auditLog.count({
      where: { occurredAt: { gte: twentyFourHoursAgo } },
    }),
    prisma.auditLog.groupBy({
      by: ["actorEmail"],
      where: { occurredAt: { gte: thirtyDaysAgo } },
      _count: { actorEmail: true },
    }),
    prisma.auditLog.groupBy({
      by: ["action"],
      _count: { action: true },
      orderBy: { _count: { action: "desc" } },
      take: 8,
    }),
  ]);

  const actionBreakdown = actionGroup.map((item) => ({
    action: item.action,
    count: item._count.action,
  }));

  return {
    totalLogs,
    last24hCount,
    uniqueActorsCount: uniqueActorsGroup.length,
    actionBreakdown,
  };
}

/**
 * Mengambil opsi filter dinamis dari rekaman riwayat log audit.
 */
export async function getAuditFilterOptions(): Promise<AuditFilterOptions> {
  const [appGroups, actionGroups, entityGroups] = await Promise.all([
    prisma.auditLog.groupBy({
      by: ["app"],
      orderBy: { app: "asc" },
    }),
    prisma.auditLog.groupBy({
      by: ["action"],
      orderBy: { action: "asc" },
    }),
    prisma.auditLog.groupBy({
      by: ["entityType"],
      orderBy: { entityType: "asc" },
      take: 30,
    }),
  ]);

  // Standar default jika database masih sedikit
  const defaultApps = ["sysmgmt", "hris", "system"];
  const defaultActions = ["CREATE", "UPDATE", "DELETE", "LOGIN", "LOGOUT", "EXPORT"];

  const apps = Array.from(new Set([...defaultApps, ...appGroups.map((g) => g.app)])).filter(Boolean);
  const actions = Array.from(new Set([...defaultActions, ...actionGroups.map((g) => g.action)])).filter(Boolean);
  const entityTypes = entityGroups.map((g) => g.entityType).filter(Boolean);

  return {
    apps,
    actions,
    entityTypes,
  };
}
