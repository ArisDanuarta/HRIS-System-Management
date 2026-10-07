import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession, getAuthContext } from "@pspk/auth";
import { assertCan, can } from "@pspk/rbac";
import { getWorkCalendarEvents } from "@/server/queries/calendar.queries";
import { checkGoogleConnected } from "@/server/services/google-calendar.service";
import { WorkCalendarView } from "@/components/kalender/work-calendar-view";
import { GoogleConnectBanner } from "@/components/kalender/google-connect-banner";

export const dynamic = "force-dynamic";

interface KalenderPageProps {
  searchParams: Promise<{
    year?: string;
    month?: string;
    connected?: string;
    error?: string;
  }>;
}

export default async function KalenderPage({ searchParams }: KalenderPageProps) {
  const reqHeaders = await headers();
  const session = await getSession(reqHeaders);
  if (!session?.user) redirect("/login");

  const authCtx = await getAuthContext(session.user.id);
  if (!authCtx) redirect("/login");
  assertCan(authCtx, "hris.calendar.read:own");

  const canSyncHolidays = can(authCtx, "hris.calendar.holiday:sync");

  const resolvedParams = await searchParams;
  const now = new Date();
  const year = resolvedParams.year ? parseInt(resolvedParams.year, 10) : now.getFullYear();
  const month = resolvedParams.month ? parseInt(resolvedParams.month, 10) : now.getMonth() + 1;

  // Cek koneksi akun Google & ambil meeting milik karyawan yang login
  const [googleStatus, calendarData] = await Promise.all([
    checkGoogleConnected(session.user.id),
    getWorkCalendarEvents(year, month, authCtx.employeeId),
  ]);

  const { leaves, holidays, observances, meetings } = calendarData;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading font-bold text-2xl md:text-3xl text-[#102e50] tracking-tight">
          Kalender Kerja
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Jadwal kerja, cuti tim, hari libur nasional, hari peringatan, dan meeting Google Meet
          dalam satu tampilan.
        </p>
      </div>

      {/* Banner ajakan hubungkan akun Google (muncul jika belum terhubung) */}
      <GoogleConnectBanner show={!googleStatus.isConnected} />

      <WorkCalendarView
        year={year}
        month={month}
        leaves={leaves}
        holidays={holidays}
        observances={observances}
        meetings={meetings}
        googleConnected={googleStatus.isConnected}
        connectedGoogleEmail={googleStatus.email}
        canSyncHolidays={canSyncHolidays}
        initialConnectedNotice={resolvedParams.connected === "true"}
        initialErrorNotice={resolvedParams.error}
      />
    </div>
  );
}
