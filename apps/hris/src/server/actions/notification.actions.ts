"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getSession } from "@pspk/auth";
import {
  getUserNotifications,
  getUnreadNotificationCount,
} from "../queries/notification.queries";
import {
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../services/notification.service";

async function getAuthUserId() {
  const reqHeaders = await headers();
  const session = await getSession(reqHeaders);
  if (!session?.user?.id) {
    throw new Error("Sesi tidak valid");
  }
  return session.user.id;
}

/**
 * Server Action: Ambil data notifikasi untuk navbar topbar
 */
export async function getNavbarNotificationsAction() {
  try {
    const userId = await getAuthUserId();
    const [count, recent] = await Promise.all([
      getUnreadNotificationCount(userId),
      getUserNotifications(userId, { limit: 5 }),
    ]);

    return {
      success: true,
      data: { count, recent },
    };
  } catch (error) {
    return {
      success: false,
      data: { count: 0, recent: [] },
      error: error instanceof Error ? error.message : "Gagal mengambil notifikasi",
    };
  }
}

/**
 * Server Action: Tandai satu notifikasi sebagai telah dibaca
 */
export async function markNotificationAsReadAction(notificationId: string) {
  try {
    const userId = await getAuthUserId();
    await markNotificationAsRead(notificationId, userId);
    revalidatePath("/notifikasi");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal memperbarui notifikasi",
    };
  }
}

/**
 * Server Action: Tandai semua notifikasi pengguna sebagai telah dibaca
 */
export async function markAllNotificationsAsReadAction() {
  try {
    const userId = await getAuthUserId();
    await markAllNotificationsAsRead(userId);
    revalidatePath("/notifikasi");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal memperbarui notifikasi",
    };
  }
}
