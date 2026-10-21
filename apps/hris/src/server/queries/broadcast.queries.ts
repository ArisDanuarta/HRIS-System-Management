import {
  prisma,
  BroadcastScope,
  BroadcastStatus,
  BroadcastDeliveryStatus,
} from "@pspk/db";
import { getAuthContext } from "@pspk/auth";

export interface BroadcastHistoryItem {
  id: string;
  subject: string;
  contentSnippet: string;
  contentHtml: string;
  senderUserId: string;
  senderName: string;
  senderEmail: string;
  replyToEmail: string;
  targetScope: BroadcastScope;
  targetDepartmentName: string | null;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  sendInApp: boolean;
  status: BroadcastStatus;
  createdAt: Date;
}

export interface BroadcastRecipientDetail {
  id: string;
  recipientName: string;
  email: string;
  status: BroadcastDeliveryStatus;
  errorMessage: string | null;
  sentAt: Date | null;
}

export interface BroadcastDetailItem extends BroadcastHistoryItem {
  recipients: BroadcastRecipientDetail[];
}

export interface BroadcastHistoryStats {
  totalBroadcasts: number;
  totalEmailsSent: number;
  totalEmailsFailed: number;
  successRate: number;
}

/**
 * Mengambil daftar riwayat pengumuman broadcast dengan penyaringan hak akses RBAC.
 */
export async function getBroadcastHistory(
  userId: string,
  params?: {
    search?: string;
    scope?: string;
    page?: number;
    pageSize?: number;
  },
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

  // Filter pencarian teks
  const searchFilter = params?.search?.trim()
    ? {
        OR: [
          { subject: { contains: params.search.trim(), mode: "insensitive" as const } },
          { senderName: { contains: params.search.trim(), mode: "insensitive" as const } },
          { contentText: { contains: params.search.trim(), mode: "insensitive" as const } },
        ],
      }
    : {};

  // Filter cakupan
  const scopeFilter =
    params?.scope && params.scope !== "ALL"
      ? { targetScope: params.scope as BroadcastScope }
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
    ...roleWhere,
  };

  const [rawItems, total, allStats] = await Promise.all([
    prisma.emailBroadcast.findMany({
      where: whereClause,
      include: {
        targetDepartment: {
          select: { name: true },
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

  const items: BroadcastHistoryItem[] = rawItems.map((b) => ({
    id: b.id,
    subject: b.subject,
    contentSnippet:
      b.contentText.length > 140
        ? `${b.contentText.slice(0, 137)}...`
        : b.contentText,
    contentHtml: b.contentHtml,
    senderUserId: b.senderUserId,
    senderName: b.senderName,
    senderEmail: b.senderEmail,
    replyToEmail: b.replyToEmail,
    targetScope: b.targetScope,
    targetDepartmentName: b.targetDepartment?.name || null,
    totalRecipients: b.totalRecipients,
    sentCount: b.sentCount,
    failedCount: b.failedCount,
    sendInApp: b.sendInApp,
    status: b.status,
    createdAt: b.createdAt,
  }));

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
  const isRecipient = broadcast.recipients.some((r) => r.email === authCtx.userId); // fallback

  if (!isSuperAdmin && !isAdminHr && !isAuthor && !isRecipient) {
    // Cek apakah user adalah penerima terdaftar
    const recipientRecord = await prisma.emailBroadcastRecipient.findFirst({
      where: {
        broadcastId,
        employee: { userId },
      },
    });

    if (!recipientRecord) {
      throw new Error("Akses ditolak: Anda tidak memiliki izin untuk melihat pengumuman ini.");
    }
  }

  return {
    id: broadcast.id,
    subject: broadcast.subject,
    contentSnippet: broadcast.contentText,
    contentHtml: broadcast.contentHtml,
    senderUserId: broadcast.senderUserId,
    senderName: broadcast.senderName,
    senderEmail: broadcast.senderEmail,
    replyToEmail: broadcast.replyToEmail,
    targetScope: broadcast.targetScope,
    targetDepartmentName: broadcast.targetDepartment?.name || null,
    totalRecipients: broadcast.totalRecipients,
    sentCount: broadcast.sentCount,
    failedCount: broadcast.failedCount,
    sendInApp: broadcast.sendInApp,
    status: broadcast.status,
    createdAt: broadcast.createdAt,
    recipients: broadcast.recipients.map((r) => ({
      id: r.id,
      recipientName: r.recipientName,
      email: r.email,
      status: r.status,
      errorMessage: r.errorMessage,
      sentAt: r.sentAt,
    })),
  };
}
