import { headers } from "next/headers";
import { getSession, getAuthContext } from "@pspk/auth";
import { can } from "@pspk/rbac";
import { writeAudit } from "@pspk/db";
import { syncIndonesianHolidays } from "@/server/services/holiday-sync.service";

export const dynamic = "force-dynamic";

/**
 * POST /api/calendar/holidays/sync
 * Endpoint untuk sinkronisasi otomatis libur nasional.
 * Mendukung 2 mode otorisasi:
 * 1. Webhook Cron: Header `x-cron-secret` sama dengan env `CRON_SECRET`
 * 2. User Sesi: Admin HR atau Super Admin dengan permission `hris.calendar.holiday:sync`
 */
export async function POST(req: Request) {
  const reqHeaders = await headers();
  const cronSecretHeader = reqHeaders.get("x-cron-secret");
  const authHeader = reqHeaders.get("authorization");
  const expectedCronSecret = process.env.CRON_SECRET;

  const isCronAuthorized =
    Boolean(expectedCronSecret) &&
    (cronSecretHeader === expectedCronSecret || authHeader === `Bearer ${expectedCronSecret}`);

  let actorUserId: string | null = null;
  let actorEmail = "system@cron.internal";

  if (!isCronAuthorized) {
    const session = await getSession(reqHeaders);
    if (!session?.user) {
      return Response.json({ error: "Akses ditolak: Autentikasi diperlukan." }, { status: 401 });
    }

    const authCtx = await getAuthContext(session.user.id);
    if (!authCtx || !can(authCtx, "hris.calendar.holiday:sync")) {
      return Response.json(
        { error: "Akses ditolak: Anda tidak memiliki izin hris.calendar.holiday:sync" },
        { status: 403 },
      );
    }

    actorUserId = session.user.id;
    actorEmail = session.user.email;
  }

  let year = new Date().getFullYear();
  try {
    const body = (await req.json()) as { year?: number };
    if (body?.year && typeof body.year === "number") {
      year = body.year;
    }
  } catch {
    // Body kosong atau bukan JSON, gunakan tahun berjalan
  }

  const result = await syncIndonesianHolidays(year);

  if (result.success) {
    await writeAudit({
      actorUserId,
      actorEmail,
      app: "hris",
      action: "UPDATE",
      entityType: "Holiday",
      entityId: `holidays-${year}`,
      after: {
        year,
        synced: result.synced,
        trigger: isCronAuthorized ? "CRON_JOB" : "API_HR",
      },
    });
  }

  return Response.json(result, {
    status: result.success ? 200 : 400,
  });
}
