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

/**
 * Server Action: Sinkronkan agenda & Google Meet pribadi karyawan dari Google Calendar.
 */
export async function syncMyGoogleCalendarAction() {
  const reqHeaders = await headers();
  const session = await getSession(reqHeaders);

  if (!session?.user) {
    throw new Error("Sesi tidak valid. Silakan masuk kembali ke akun Anda.");
  }

  const authCtx = await getAuthContext(session.user.id);
  if (!authCtx) {
    throw new Error("Konteks otorisasi tidak ditemukan.");
  }

  assertCan(authCtx, "hris.calendar.google:connect");

  if (!authCtx.employeeId) {
    throw new Error(
      "Akun Anda belum terhubung ke data karyawan. Hubungi HR untuk menautkan profil karyawan Anda.",
    );
  }

  const { syncEmployeeGoogleEvents } = await import(
    "@/server/services/google-calendar.service"
  );

  const result = await syncEmployeeGoogleEvents(authCtx.employeeId, session.user.id);

  if (result.success) {
    await writeAudit({
      actorUserId: session.user.id,
      actorEmail: session.user.email,
      app: "hris",
      action: "UPDATE",
      entityType: "CalendarEvent",
      entityId: `employee-calendar-${authCtx.employeeId}`,
      after: {
        count: result.count,
        action: "SYNC_GOOGLE_MEETINGS",
      },
    });
  }

  return result;
}

/**
 * Server Action: Memutuskan hubungan akun Google Calendar & menghapus agenda Google lokal karyawan.
 */
export async function disconnectGoogleCalendarAction() {
  const reqHeaders = await headers();
  const session = await getSession(reqHeaders);

  if (!session?.user) {
    throw new Error("Sesi tidak valid. Silakan masuk kembali ke akun Anda.");
  }

  const authCtx = await getAuthContext(session.user.id);
  if (!authCtx) {
    throw new Error("Konteks otorisasi tidak ditemukan.");
  }

  assertCan(authCtx, "hris.calendar.google:connect");

  const { disconnectGoogleCalendar } = await import(
    "@/server/services/google-calendar.service"
  );

  await disconnectGoogleCalendar(session.user.id, authCtx.employeeId);

  await writeAudit({
    actorUserId: session.user.id,
    actorEmail: session.user.email,
    app: "hris",
    action: "DELETE",
    entityType: "GoogleCalendarConnection",
    entityId: session.user.id,
    after: {
      action: "DISCONNECT_GOOGLE_CALENDAR",
    },
  });

  return {
    success: true,
    message: "Koneksi Google Calendar berhasil diputuskan.",
  };
}
