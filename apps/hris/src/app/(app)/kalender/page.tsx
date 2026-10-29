import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession, getAuthContext } from "@pspk/auth";
import { assertCan, can } from "@pspk/rbac";
import { prisma } from "@pspk/db";
import { getWorkCalendarEvents } from "@/server/queries/calendar.queries";
import { checkGoogleConnected } from "@/server/services/google-calendar.service";
import { WorkCalendarView } from "@/components/kalender/work-calendar-view";
import { GoogleConnectBanner } from "@/components/kalender/google-connect-banner";
import { CalendarDays, Users, Flag, Video, CalendarCheck2 } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Kalender Kerja - HRIS PSPK",
  description: "Kalender kerja, libur nasional, hari peringatan, dan jadwal cuti tim PSPK",
};

interface KalenderPageProps {
  searchParams: Promise<{
    year?: string;
    month?: string;
    connected?: string;
    error?: string;
  }>;
}

const MONTHS = [
  "Januari","Februari","Maret","April","Mei","Juni",
  "Juli","Agustus","September","Oktober","November","Desember",
];

export default async function KalenderPage({ searchParams }: KalenderPageProps) {
  const reqHeaders = await headers();
  const session = await getSession(reqHeaders);
  if (!session?.user) redirect("/login");

  const authCtx = await getAuthContext(session.user.id);
  if (!authCtx) redirect("/login");
  assertCan(authCtx, "hris.calendar.read:own");

  const canSyncHolidays = can(authCtx, "hris.calendar.holiday:sync");
  const isHrOrAdmin = can(authCtx, "hris.calendar.read:all");

  const resolvedParams = await searchParams;
  const now = new Date();
  const year = resolvedParams.year ? parseInt(resolvedParams.year, 10) : now.getFullYear();
  const month = resolvedParams.month ? parseInt(resolvedParams.month, 10) : now.getMonth() + 1;

  // Ambil data divisi pegawai untuk membatasi lingkup cuti tim (khusus staf/manajer)
  const employee = authCtx.employeeId
    ? await prisma.employee.findUnique({
        where: { id: authCtx.employeeId },
        select: {
          id: true,
          currentDepartmentId: true,
          currentDepartment: { select: { name: true } },
        },
      })
    : null;

  const departmentId = employee?.currentDepartmentId ?? null;
  const departmentName = employee?.currentDepartment?.name ?? null;

  // Cek koneksi akun Google & ambil meeting serta cuti (dibatasi divisi bila bukan HR)
  const [googleStatus, calendarData] = await Promise.all([
    checkGoogleConnected(session.user.id),
    getWorkCalendarEvents(year, month, authCtx.employeeId, {
      departmentId,
      isHrOrAdmin,
    }),
  ]);

  const { leaves, holidays, observances, meetings } = calendarData;

  const monthLabel = MONTHS[month - 1];

  return (
    <div className="space-y-6">
      {/* ===== Hero Section ===== */}
      <div className="relative bg-[#102e50] rounded-2xl overflow-hidden shadow-lg">
        {/* Background decorative blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-[#f2af3e]/10 blur-3xl" />
          <div className="absolute -bottom-12 -left-12 w-56 h-56 rounded-full bg-white/5 blur-2xl" />
          <div className="absolute top-1/2 right-1/4 w-40 h-40 rounded-full bg-blue-400/8 blur-2xl" />
        </div>

        <div className="relative z-10 p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            {/* Left: Title & Description */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#f2af3e]/15 border border-[#f2af3e]/30 flex items-center justify-center shrink-0 shadow-inner">
                <CalendarDays className="w-6 h-6 text-[#f2af3e]" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-[#f2af3e]/20 text-[#f2af3e] border border-[#f2af3e]/30">
                    Kalender Kerja
                  </span>
                  <span className="text-[10px] font-semibold text-white/50">
                    {monthLabel} {year}
                  </span>
                  {departmentName && !isHrOrAdmin && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-slate-200 border border-white/15">
                      Divisi: {departmentName}
                    </span>
                  )}
                </div>
                <h1 className="text-2xl md:text-3xl font-bold font-heading text-white tracking-tight leading-tight">
                  Jadwal &amp; Agenda Tim
                </h1>
                <p className="text-sm text-white/60 mt-1 max-w-lg leading-relaxed">
                  {isHrOrAdmin
                    ? "Cuti seluruh tim organisasi, hari libur nasional, hari peringatan, dan agenda rapat dalam satu tampilan terpadu."
                    : `Cuti rekan satu divisi (${departmentName || "Divisi Anda"}), hari libur nasional, hari peringatan, dan agenda rapat dalam satu tampilan terpadu.`}
                </p>
              </div>
            </div>

            {/* Right: Google Status Badge */}
            <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
              {googleStatus.isConnected ? (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-xs text-emerald-300 font-semibold">
                  <CalendarCheck2 className="w-3.5 h-3.5" />
                  <span>Google Calendar Terhubung</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/8 border border-white/15 text-xs text-white/50 font-medium">
                  <CalendarCheck2 className="w-3.5 h-3.5" />
                  <span>Google Calendar belum terhubung</span>
                </div>
              )}
              {canSyncHolidays && (
                <span className="text-[11px] text-white/40 italic">
                  Anda memiliki akses sinkronisasi hari libur
                </span>
              )}
            </div>
          </div>

          {/* Quick Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/10">
            <div className="bg-white/8 hover:bg-white/12 transition-colors rounded-xl p-3.5 border border-white/10">
              <div className="flex items-center gap-2 mb-1.5">
                <Users className="w-3.5 h-3.5 text-[#f2af3e]/80" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">
                  {isHrOrAdmin ? "Cuti Tim (Semua)" : "Cuti Tim Divisi"}
                </span>
              </div>
              <div className="text-2xl font-bold text-white">{leaves.length}</div>
              <div className="text-[11px] text-white/40 mt-0.5">
                {isHrOrAdmin ? "entri bulan ini" : `rekan divisi ${departmentName || ""}`}
              </div>
            </div>

            <div className="bg-white/8 hover:bg-white/12 transition-colors rounded-xl p-3.5 border border-white/10">
              <div className="flex items-center gap-2 mb-1.5">
                <CalendarDays className="w-3.5 h-3.5 text-rose-300/80" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">
                  Hari Libur
                </span>
              </div>
              <div className="text-2xl font-bold text-white">{holidays.length}</div>
              <div className="text-[11px] text-white/40 mt-0.5">libur &amp; cuti bersama</div>
            </div>

            <div className="bg-white/8 hover:bg-white/12 transition-colors rounded-xl p-3.5 border border-white/10">
              <div className="flex items-center gap-2 mb-1.5">
                <Flag className="w-3.5 h-3.5 text-amber-300/80" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">
                  Peringatan
                </span>
              </div>
              <div className="text-2xl font-bold text-white">{observances?.length ?? 0}</div>
              <div className="text-[11px] text-white/40 mt-0.5">hari nasional</div>
            </div>

            <div
              className={`rounded-xl p-3.5 border transition-colors ${
                googleStatus.isConnected
                  ? "bg-indigo-500/15 border-indigo-400/25 hover:bg-indigo-500/20"
                  : "bg-white/5 border-white/8"
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Video
                  className={`w-3.5 h-3.5 ${
                    googleStatus.isConnected ? "text-indigo-300/80" : "text-white/30"
                  }`}
                />
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">
                  Meeting
                </span>
              </div>
              <div
                className={`text-2xl font-bold ${
                  googleStatus.isConnected ? "text-white" : "text-white/30"
                }`}
              >
                {googleStatus.isConnected ? (meetings?.length ?? 0) : "—"}
              </div>
              <div className="text-[11px] text-white/40 mt-0.5">
                {googleStatus.isConnected ? "Google Meet" : "belum terhubung"}
              </div>
            </div>
          </div>
        </div>
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
        departmentName={departmentName}
        isHrOrAdmin={isHrOrAdmin}
      />
    </div>
  );
}
