"use server";

import { headers } from "next/headers";
import { getSession, getAuthContext } from "@pspk/auth";
import { assertCan } from "@pspk/rbac";
import { writeAudit } from "@pspk/db";
import { syncIndonesianHolidays } from "@/server/services/holiday-sync.service";

/**
 * Server Action: Sinkronkan Hari Libur Nasional & Cuti Bersama dari Google Calendar.
 * Dapat dipicu oleh Admin HR atau Super Admin.
 */
export async function syncHolidaysAction(year: number) {
  const reqHeaders = await headers();
  const session = await getSession(reqHeaders);

  if (!session?.user) {
    throw new Error("Sesi tidak valid. Silakan masuk kembali ke akun Anda.");
  }

  const authCtx = await getAuthContext(session.user.id);
  if (!authCtx) {
    throw new Error("Konteks otorisasi tidak ditemukan.");
  }

  assertCan(authCtx, "hris.calendar.holiday:sync");

  const result = await syncIndonesianHolidays(year);

  if (result.success) {
    await writeAudit({
      actorUserId: session.user.id,
      actorEmail: session.user.email,
      app: "hris",
      action: "UPDATE",
      entityType: "Holiday",
      entityId: `holidays-${year}`,
      after: {
        year,
        synced: result.synced,
        action: "SYNC_HOLIDAYS_GOOGLE",
      },
    });
  }

  return result;
}
