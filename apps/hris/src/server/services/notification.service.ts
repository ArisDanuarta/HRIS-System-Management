import { prisma } from "@pspk/db";

export interface CreateNotificationInput {
  userId: string;
  title: string;
  message: string;
  type?: "INFO" | "SUCCESS" | "WARNING" | "ACTION_REQUIRED";
  category: "LEAVE" | "ATTENDANCE" | "PAYROLL" | "CONTRACT" | "PERFORMANCE" | "SYSTEM";
  link?: string;
}

/**
 * Membuat notifikasi baru untuk satu pengguna spesifik
 */
export async function createNotification(input: CreateNotificationInput) {
  return await prisma.notification.create({
    data: {
      userId: input.userId,
      title: input.title,
      message: input.message,
      type: input.type || "INFO",
      category: input.category,
      link: input.link || null,
      isRead: false,
    },
  });
}

/**
 * Mengirimkan notifikasi massal ke seluruh pengguna yang memiliki peran tertentu (misal: semua "admin_hr")
 */
export async function createNotificationForRole(
  roleKey: string,
  input: Omit<CreateNotificationInput, "userId">
) {
  // Cari seluruh user yang memiliki role ini
  const userRoles = await prisma.userRole.findMany({
    where: {
      role: { key: roleKey },
    },
    select: { userId: true },
  });

  const userIds = [...new Set(userRoles.map((ur) => ur.userId))];

  if (userIds.length === 0) return [];

  return await prisma.notification.createMany({
    data: userIds.map((userId) => ({
      userId,
      title: input.title,
      message: input.message,
      type: input.type || "INFO",
      category: input.category,
      link: input.link || null,
      isRead: false,
    })),
  });
}

/**
 * Mengirimkan notifikasi ke manajer/atasan langsung dari seorang pegawai
 */
export async function createNotificationForEmployeeManager(
  employeeId: string,
  input: Omit<CreateNotificationInput, "userId">
) {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: {
      manager: {
        select: { userId: true },
      },
    },
  });

  if (employee?.manager?.userId) {
    return await createNotification({
      ...input,
      userId: employee.manager.userId,
    });
  }

  return null;
}

/**
 * Tandai satu notifikasi telah dibaca
 */
export async function markNotificationAsRead(id: string, userId: string) {
  return await prisma.notification.updateMany({
    where: { id, userId },
    data: { isRead: true },
  });
}

/**
 * Tandai seluruh notifikasi seorang pengguna telah dibaca
 */
export async function markAllNotificationsAsRead(userId: string) {
  return await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
}
