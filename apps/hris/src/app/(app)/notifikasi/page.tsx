import React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { getSession } from "@pspk/auth";
import {
  getUserNotifications,
  getUnreadNotificationCount,
} from "@/server/queries/notification.queries";
import { NotificationCenterView } from "@/components/notifications/notification-center-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pusat Notifikasi — Portal HRIS PSPK",
  description:
    "Pantau seluruh notifikasi pengajuan baru, status persetujuan, dan pengingat operasional penting di PSPK.",
};

export default async function NotifikasiPage() {
  const reqHeaders = await headers();
  const session = await getSession(reqHeaders);

  if (!session || !session.user) {
    redirect("/login");
  }

  const [notifications, unreadCount] = await Promise.all([
    getUserNotifications(session.user.id, { limit: 100 }),
    getUnreadNotificationCount(session.user.id),
  ]);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <NotificationCenterView
        initialNotifications={notifications}
        initialUnreadCount={unreadCount}
      />
    </div>
  );
}
