import {
  prisma,
  BroadcastScope,
  BroadcastStatus,
  BroadcastDeliveryStatus,
} from "@pspk/db";
import { getAuthContext } from "@pspk/auth";
import { can } from "@pspk/rbac";
import {
  BroadcastCategory,
  BroadcastPriority,
  BROADCAST_CATEGORIES,
} from "../schemas/broadcast.schema";

export interface BroadcastHistoryItem {
  id: string;
  subject: string;
  contentSnippet: string;
  contentHtml: string;
  category?: BroadcastCategory | null;
  priority?: BroadcastPriority;
  requireReadReceipt?: boolean;
  readCount?: number;
  senderUserId: string;
  senderName: string;
  senderEmail: string;
  replyToEmail: string;
  targetScope: BroadcastScope;
  targetDepartmentName: string | null;
  targetDepartmentIds?: string[];
  customEmployeeIds?: string[];
  excludedEmployeeIds?: string[];
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  sendInApp: boolean;
  status: BroadcastStatus;
  createdAt: Date;
  scheduledAt?: Date | null;
  canCancelSchedule?: boolean;
  attachmentCount?: number;
}

export interface BroadcastRecipientDetail {
  id: string;
  recipientName: string;
  email: string;
  status: BroadcastDeliveryStatus;
  errorMessage: string | null;
  sentAt: Date | null;
  readAt?: Date | null;
}

export interface BroadcastDetailItem extends BroadcastHistoryItem {
  recipients: BroadcastRecipientDetail[];
  canResend: boolean;
  canCancelSchedule?: boolean;
  excludedCount?: number;
  excludedEmployeeNames?: string[];
  attachments?: Array<{
    id: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    key: string;
    url: string;
    createdAt: Date;
  }>;
}

export interface BroadcastHistoryStats {
  totalBroadcasts: number;
  totalEmailsSent: number;
  totalEmailsFailed: number;
  successRate: number;
}

export interface GetBroadcastHistoryParams {
  search?: string;
  scope?: string;
  status?: string;
  category?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Mengambil daftar riwayat pengumuman broadcast dengan penyaringan hak akses RBAC.
 */
export async function getBroadcastHistory(
  userId: string,
  params?: GetBroadcastHistoryParams,
): Promise<{
  items: BroadcastHistoryItem[];
  total: number;
  page: number;
  totalPages: number;
  stats: BroadcastHistoryStats;
  canCreate: boolean;
}> {
  const authCtx = await getAuthContext(userId);
  if (!authCtx) {
    throw new Error("Konteks otentikasi pengguna tidak valid.");
  }

  const isSuperAdmin = authCtx.roles.includes("super_admin");
  const isAdminHr = authCtx.roles.includes("admin_hr");
  const isManager = authCtx.roles.includes("manager");
  const canCreate = isSuperAdmin || isAdminHr || isManager;

  const page = Math.max(1, params?.page || 1);
  const pageSize = Math.max(1, Math.min(50, params?.pageSize || 15));
  const skip = (page - 1) * pageSize;

  // Filter pencarian teks (maksimal 100 karakter)
  const rawSearch = (params?.search || "").trim();
  const search = rawSearch.length > 100 ? rawSearch.slice(0, 100) : rawSearch;
  const searchFilter = search
    ? {
        OR: [
          { subject: { contains: search, mode: "insensitive" as const } },
          { senderName: { contains: search, mode: "insensitive" as const } },
          { contentText: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  // Filter cakupan (hanya terima nilai BroadcastScope yang valid)
  const validScopes = Object.values(BroadcastScope) as string[];
  const scopeFilter =
    params?.scope && params.scope !== "ALL" && validScopes.includes(params.scope)
      ? { targetScope: params.scope as BroadcastScope }
      : {};

  // Filter status pengiriman (hanya terima nilai BroadcastStatus yang valid)
  const validStatuses = Object.values(BroadcastStatus) as string[];
  const statusFilter =
    params?.status && params.status !== "ALL" && validStatuses.includes(params.status)
      ? { status: params.status as BroadcastStatus }
      : {};

  // Filter kategori
  const categoryFilter =
    params?.category &&
    params.category !== "ALL" &&
    (BROADCAST_CATEGORIES as readonly string[]).includes(params.category)
      ? { category: params.category }
      : {};

  // Otorisasi cakupan data:
  // - Super Admin & Admin HR: dapat melihat seluruh riwayat broadcast institusi
  // - Manajer: melihat broadcast yang dikirim dirinya sendiri atau ditujukan ke timnya
  // - Staf: melihat broadcast di mana dia terdaftar sebagai penerima
  let roleWhere = {};
  if (isSuperAdmin || isAdminHr) {
    roleWhere = {};
  } else if (isManager) {
    roleWhere = {
      OR: [
        { senderUserId: userId },
        { recipients: { some: { employee: { userId } } } },
      ],
    };
  } else {
    // Staf biasa
    roleWhere = {
      recipients: { some: { employee: { userId } } },
    };
  }

  const whereClause = {
    ...searchFilter,
    ...scopeFilter,
    ...statusFilter,
    ...categoryFilter,
    ...roleWhere,
  };

  const [rawItems, total, allStats] = await Promise.all([
    prisma.emailBroadcast.findMany({
      where: whereClause,
      include: {
        targetDepartment: {
          select: { name: true },
        },
        _count: {
          select: { attachments: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.emailBroadcast.count({ where: whereClause }),
    prisma.emailBroadcast.aggregate({
      where: roleWhere,
      _count: { id: true },
      _sum: {
        sentCount: true,
        failedCount: true,
        totalRecipients: true,
      },
    }),
  ]);

  const allDeptIds = Array.from(
    new Set(rawItems.flatMap((b) => b.targetDepartmentIds || [])),
  );
  const deptMap = new Map<string, string>();
  if (allDeptIds.length > 0) {
    const depts = await prisma.department.findMany({
      where: { id: { in: allDeptIds } },
      select: { id: true, name: true },
    });
    depts.forEach((d) => deptMap.set(d.id, d.name));
  }

  const broadcastIds = rawItems.map((b) => b.id);
  const readCountMap = new Map<string, number>();
  if (broadcastIds.length > 0) {
    const readCounts = await prisma.emailBroadcastRecipient.groupBy({
      by: ["broadcastId"],
      where: {
        broadcastId: { in: broadcastIds },
        readAt: { not: null },
      },
      _count: { id: true },
    });
    readCounts.forEach((rc) => readCountMap.set(rc.broadcastId, rc._count.id));
  }

  const items: BroadcastHistoryItem[] = rawItems.map((b) => {
    let targetDepartmentName = b.targetDepartment?.name || null;
    if (b.targetDepartmentIds && b.targetDepartmentIds.length > 0) {
      const names = b.targetDepartmentIds
        .map((id) => deptMap.get(id))
        .filter(Boolean) as string[];
      if (names.length === 1) {
        targetDepartmentName = names[0] || null;
      } else if (names.length === 2) {
        targetDepartmentName = `${names[0]}, ${names[1]}`;
      } else if (names.length > 2) {
        targetDepartmentName = `${names[0]} +${names.length - 1} lainnya`;
      }
    }

    return {
      id: b.id,
      subject: b.subject,
      contentSnippet:
        b.contentText.length > 140
          ? `${b.contentText.slice(0, 137)}...`
          : b.contentText,
      contentHtml: b.contentHtml,
      category: (b.category as BroadcastCategory) || null,
      priority: (b.priority as BroadcastPriority) || "NORMAL",
      requireReadReceipt: b.requireReadReceipt || false,
      readCount: readCountMap.get(b.id) || 0,
      senderUserId: b.senderUserId,
      senderName: b.senderName,
      senderEmail: b.senderEmail,
      replyToEmail: b.replyToEmail,
      targetScope: b.targetScope,
      targetDepartmentName,
      targetDepartmentIds: b.targetDepartmentIds || [],
      customEmployeeIds: b.customEmployeeIds || [],
      excludedEmployeeIds: b.excludedEmployeeIds || [],
      totalRecipients: b.totalRecipients,
      sentCount: b.sentCount,
      failedCount: b.failedCount,
      sendInApp: b.sendInApp,
      status: b.status,
      createdAt: b.createdAt,
      scheduledAt: b.scheduledAt,
      canCancelSchedule:
        b.status === "SCHEDULED" &&
        (b.senderUserId === userId || isSuperAdmin || isAdminHr),
      attachmentCount: b._count?.attachments || 0,
    };
  });

  const totalBroadcasts = allStats._count.id || 0;
  const totalEmailsSent = allStats._sum.sentCount || 0;
  const totalEmailsFailed = allStats._sum.failedCount || 0;
  const totalAttempted = totalEmailsSent + totalEmailsFailed;
  const successRate =
    totalAttempted > 0
      ? Math.round((totalEmailsSent / totalAttempted) * 100)
      : 100;

  return {
    items,
    total,
    page,
    totalPages: Math.ceil(total / pageSize) || 1,
    stats: {
      totalBroadcasts,
      totalEmailsSent,
      totalEmailsFailed,
      successRate,
    },
    canCreate,
  };
}

/**
 * Mengambil rincian satu pengumuman broadcast beserta daftar log penerimanya.
 */
export async function getBroadcastDetail(
  userId: string,
  broadcastId: string,
): Promise<BroadcastDetailItem | null> {
  const authCtx = await getAuthContext(userId);
  if (!authCtx) {
    throw new Error("Konteks otentikasi tidak ditemukan.");
  }

  const broadcast = await prisma.emailBroadcast.findUnique({
    where: { id: broadcastId },
    include: {
      targetDepartment: {
        select: { name: true },
      },
      attachments: {
        orderBy: { createdAt: "asc" },
      },
      recipients: {
        orderBy: [{ status: "asc" }, { recipientName: "asc" }],
      },
    },
  });

  if (!broadcast) return null;

  // Verifikasi izin akses ke dokumen detail
  const isSuperAdmin = authCtx.roles.includes("super_admin");
  const isAdminHr = authCtx.roles.includes("admin_hr");
  const isAuthor = broadcast.senderUserId === userId;

  if (!isSuperAdmin && !isAdminHr && !isAuthor) {
    const recipientRecord = await prisma.emailBroadcastRecipient.findFirst({
      where: { broadcastId, employee: { userId } },
      select: { id: true },
    });

    if (!recipientRecord) {
      throw new Error(
        "Akses ditolak: Anda tidak memiliki izin untuk melihat pengumuman ini.",
      );
    }
  }

  const canSendAll = isSuperAdmin || isAdminHr || can(authCtx, "hris.broadcast.send:all");
  const canCancelSchedule =
    broadcast.status === "SCHEDULED" && (isAuthor || canSendAll);
  const canResend =
    (isAuthor || canSendAll) &&
    broadcast.failedCount > 0 &&
    broadcast.status !== "QUEUED" &&
    broadcast.status !== "SENDING";

  let targetDepartmentName = broadcast.targetDepartment?.name || null;
  if (broadcast.targetDepartmentIds && broadcast.targetDepartmentIds.length > 0) {
    const depts = await prisma.department.findMany({
      where: { id: { in: broadcast.targetDepartmentIds } },
      select: { name: true },
    });
    const names = depts.map((d) => d.name);
    if (names.length === 1) {
      targetDepartmentName = names[0] || null;
    } else if (names.length === 2) {
      targetDepartmentName = `${names[0]}, ${names[1]}`;
    } else if (names.length > 2) {
      targetDepartmentName = `${names[0]} +${names.length - 1} lainnya`;
    }
  }

  let excludedEmployeeNames: string[] = [];
  if (broadcast.excludedEmployeeIds && broadcast.excludedEmployeeIds.length > 0) {
    const excludedEmployees = await prisma.employee.findMany({
      where: { id: { in: broadcast.excludedEmployeeIds } },
      select: { fullName: true },
    });
    excludedEmployeeNames = excludedEmployees.map((e) => e.fullName);
  }

  return {
    id: broadcast.id,
    subject: broadcast.subject,
    contentSnippet: broadcast.contentText,
    contentHtml: broadcast.contentHtml,
    category: (broadcast.category as BroadcastCategory) || null,
    priority: (broadcast.priority as BroadcastPriority) || "NORMAL",
    requireReadReceipt: broadcast.requireReadReceipt || false,
    readCount: broadcast.recipients.filter((r) => r.readAt !== null).length,
    senderUserId: broadcast.senderUserId,
    senderName: broadcast.senderName,
    senderEmail: broadcast.senderEmail,
    replyToEmail: broadcast.replyToEmail,
    targetScope: broadcast.targetScope,
    targetDepartmentName,
    targetDepartmentIds: broadcast.targetDepartmentIds || [],
    customEmployeeIds: broadcast.customEmployeeIds || [],
    excludedEmployeeIds: broadcast.excludedEmployeeIds || [],
    excludedCount: broadcast.excludedEmployeeIds ? broadcast.excludedEmployeeIds.length : 0,
    excludedEmployeeNames,
    totalRecipients: broadcast.totalRecipients,
    sentCount: broadcast.sentCount,
    failedCount: broadcast.failedCount,
    sendInApp: broadcast.sendInApp,
    status: broadcast.status,
    createdAt: broadcast.createdAt,
    scheduledAt: broadcast.scheduledAt,
    canResend,
    canCancelSchedule,
    attachments: (broadcast.attachments || []).map((a) => ({
      id: a.id,
      fileName: a.fileName,
      mimeType: a.mimeType,
      sizeBytes: a.sizeBytes,
      key: a.key,
      url: `/api/documents/${a.key}`,
      createdAt: a.createdAt,
    })),
    recipients: broadcast.recipients.map((r) => ({
      id: r.id,
      recipientName: r.recipientName,
      email: r.email,
      status: r.status,
      errorMessage: r.errorMessage,
      sentAt: r.sentAt,
      readAt: r.readAt,
    })),
  };
}
