import { prisma } from "@pspk/db";

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  category: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

/**
 * Mengambil daftar notifikasi milik pengguna tertentu
 */
export async function getUserNotifications(
  userId: string,
  options?: { unreadOnly?: boolean; category?: string; limit?: number }
): Promise<NotificationItem[]> {
  const { unreadOnly, category, limit = 50 } = options || {};

  const where: {
    userId: string;
    isRead?: boolean;
    category?: string;
  } = { userId };

  if (unreadOnly) {
    where.isRead = false;
  }

  if (category && category !== "ALL") {
    where.category = category;
  }

  const notifications = await prisma.notification.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return notifications.map((n) => ({
    id: n.id,
    userId: n.userId,
    title: n.title,
    message: n.message,
    type: n.type,
    category: n.category,
    link: n.link,
    isRead: n.isRead,
    createdAt: n.createdAt.toISOString(),
  }));
}

/**
 * Mengambil jumlah notifikasi yang belum dibaca oleh pengguna
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  return await prisma.notification.count({
    where: {
      userId,
      isRead: false,
    },
  });
}
