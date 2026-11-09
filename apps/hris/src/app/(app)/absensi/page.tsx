import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession, getUserProfile } from "@pspk/auth";
import { prisma } from "@pspk/db";
import { TodayAttendanceCard } from "@/components/absensi/today-attendance-card";
import { AttendanceTable } from "@/components/absensi/attendance-table";
import {
  getTodayAttendance,
  getPersonalMonthlyAttendance,
} from "@/server/queries/attendance.queries";
import { getActiveWorkSchedule } from "@/server/services/work-schedule.service";
import { AttendanceLeaveSubnav } from "@/components/shell/attendance-leave-subnav";
import { UnlinkedEmployeeNotice } from "@/components/dashboard/unlinked-employee-notice";
import {
  CalendarCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Calendar,
  Home,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Presensi & Absensi - HRIS PSPK",
  description: "Pencatatan kehadiran harian dan riwayat presensi pegawai PSPK",
};

interface AbsensiPageProps {
  searchParams: Promise<{
    year?: string;
    month?: string;
  }>;
}

export default async function AbsensiPage({ searchParams }: AbsensiPageProps) {
  const reqHeaders = await headers();
  const session = await getSession(reqHeaders);

  if (!session || !session.user) {
    redirect("/login");
  }

  const userProfile = await getUserProfile(session.user.id);
  const employee =
    userProfile?.employee ||
    (await prisma.employee.findFirst({
      where: { deletedAt: null },
      orderBy: { createdAt: "asc" },
    }));

  if (!employee) {
    return <UnlinkedEmployeeNotice roleName="Presensi Pegawai" />;
  }

  const roleKeys = userProfile?.roles.map((r) => r.role.key) || [];
  const isHrOrAdmin = roleKeys.includes("super_admin") || roleKeys.includes("admin_hr");
  const isManager = roleKeys.includes("manager");

  const resolvedParams = await searchParams;
  const now = new Date();
  const rawYear = resolvedParams.year ? parseInt(resolvedParams.year, 10) : now.getFullYear();
  const rawMonth = resolvedParams.month ? parseInt(resolvedParams.month, 10) : now.getMonth() + 1;

  const currentYear = Number.isNaN(rawYear) ? now.getFullYear() : rawYear;
  const currentMonth =
    Number.isNaN(rawMonth) || rawMonth < 1 || rawMonth > 12 ? now.getMonth() + 1 : rawMonth;

  // Month navigation helpers
  const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
  const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
  const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;
  const isCurrentPeriod =
    currentYear === now.getFullYear() && currentMonth === now.getMonth() + 1;

  // Fetch real data from PostgreSQL
  const [todayAttendance, monthlyData, pendingLeavesCount, workSchedule] = await Promise.all([
    getTodayAttendance(employee.id),
    getPersonalMonthlyAttendance(employee.id, currentYear, currentMonth),
    prisma.leaveRequest.count({ where: { status: "PENDING" } }),
    getActiveWorkSchedule(employee.currentDepartmentId),
  ]);

  // Calculate WFH count from status or [WFH] tag in notes
  const wfhCount = monthlyData.attendances.filter(
    (a) => a.status === "WFH" || a.notes?.includes("[WFH]"),
  ).length;

  // Calculate cutoff time dynamically
  const [startH, startM] = workSchedule.workStartTime.split(":").map((v) => parseInt(v, 10));
  const totalMinutes = (startH || 9) * 60 + (startM || 0) + workSchedule.gracePeriodMins;
  const cutoffH = Math.floor(totalMinutes / 60) % 24;
  const cutoffM = totalMinutes % 60;
  const cutoffTime = `${String(cutoffH).padStart(2, "0")}:${String(cutoffM).padStart(2, "0")}`;

  const monthNames = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

  const activeMonthLabel = `${monthNames[currentMonth - 1]} ${currentYear}`;

  return (
    <div className="space-y-6 w-full min-w-0 max-w-full">
      {/* Unified Subnavigation Tabs */}
      <AttendanceLeaveSubnav
        activeTab="absensi"
        isHrOrAdmin={isHrOrAdmin}
        isManager={isManager}
        pendingLeavesCount={pendingLeavesCount}
      />

      {/* Navy Hero Section (PSPK Brand Identity) */}
      <div className="bg-[#102e50] rounded-2xl p-5 sm:p-7 text-white relative overflow-hidden shadow-xs w-full min-w-0">
        {/* Subtle decorative bookmark/dialog accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#f2af3e]/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#f2af3e] via-[#df632f] to-[#0874aa]" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-white/10 border border-white/15 text-[#f2af3e] text-[11px] font-semibold tracking-wide uppercase">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Portal Kehadiran Pegawai PSPK</span>
            </div>
            <h1 className="font-heading font-bold text-2xl sm:text-3xl text-white tracking-tight break-words">
              Presensi & Kehadiran Saya
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed break-words">
              Pencatatan jam kerja real-time, pemantauan ketepatan waktu, dan rekapitulasi
              kehadiran bulanan yang terintegrasi.
            </p>
          </div>

          {/* Month Period Switcher */}
          <div className="flex items-center gap-2 self-stretch sm:self-start md:self-center bg-white/10 backdrop-blur-xs border border-white/15 rounded-xl p-1.5 flex-wrap sm:flex-nowrap justify-between w-full sm:w-auto">
            <div className="flex items-center justify-between gap-1 w-full sm:w-auto flex-1 sm:flex-initial">
              <Link
                href={`/absensi?year=${prevYear}&month=${prevMonth}`}
                className="p-2 rounded-lg text-slate-200 hover:text-white hover:bg-white/10 transition-colors shrink-0"
                title="Bulan Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </Link>

              <div className="px-2 sm:px-3 py-1 text-center min-w-[105px] sm:min-w-[135px] flex-1 sm:flex-initial">
                <span className="text-[10px] uppercase tracking-wider text-[#f2af3e] font-semibold block">
                  Periode Riwayat
                </span>
                <span className="text-xs sm:text-sm font-bold text-white whitespace-nowrap">{activeMonthLabel}</span>
              </div>

              <Link
                href={`/absensi?year=${nextYear}&month=${nextMonth}`}
                className="p-2 rounded-lg text-slate-200 hover:text-white hover:bg-white/10 transition-colors shrink-0"
                title="Bulan Berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {!isCurrentPeriod && (
              <Link
                href="/absensi"
                className="px-2.5 py-1.5 rounded-lg bg-[#f2af3e] text-[#102e50] hover:bg-[#f4b867] text-xs font-bold transition-colors w-full sm:w-auto text-center"
              >
                Bulan Ini
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* 1. Real-Time Check-In / Check-Out Card */}
      <TodayAttendanceCard
        todayAttendance={todayAttendance}
        employeeName={employee.fullName}
        workSchedule={workSchedule}
      />

      {/* 2. Monthly Summary KPI Cards & Policy Guidance */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left (8 cols): 6 KPI Statistics Cards */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 flex flex-col justify-between">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-[#102e50] font-heading">
                Ringkasan Kehadiran — {activeMonthLabel}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Akumulasi catatan kehadiran Anda sepanjang periode berjalan
              </p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#102e50]/5 text-[#102e50] border border-[#102e50]/15">
              {monthlyData.stats.recordedDays} Hari Terekam
            </span>
          </div>

          {/* 6-Card KPI Grid using PSPK Primary & Secondary Palette */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3.5 my-5">
            {/* 1. Tepat Waktu */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-3 sm:p-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 bottom-0 w-1 bg-emerald-600" />
              <div className="flex items-center justify-between text-slate-500 mb-1.5 sm:mb-2">
                <span className="text-[11px] sm:text-xs font-semibold text-[#102e50] truncate">Tepat Waktu</span>
                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-bold text-[#102e50] tabular-nums">
                  {monthlyData.stats.presentCount}
                </span>
                <span className="text-[11px] sm:text-xs text-slate-500">Hari</span>
              </div>
            </div>

            {/* 2. Terlambat */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-3 sm:p-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 bottom-0 w-1 bg-[#df632f]" />
              <div className="flex items-center justify-between text-slate-500 mb-1.5 sm:mb-2">
                <span className="text-[11px] sm:text-xs font-semibold text-[#102e50] truncate">Terlambat</span>
                <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#df632f] shrink-0" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-bold text-[#df632f] tabular-nums">
                  {monthlyData.stats.lateCount}
                </span>
                <span className="text-[11px] sm:text-xs text-slate-500">Hari</span>
              </div>
            </div>

            {/* 3. WFH / Remote */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-3 sm:p-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 bottom-0 w-1 bg-[#0874aa]" />
              <div className="flex items-center justify-between text-slate-500 mb-1.5 sm:mb-2">
                <span className="text-[11px] sm:text-xs font-semibold text-[#102e50] truncate">WFH / Remote</span>
                <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0874aa] shrink-0" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-bold text-[#0874aa] tabular-nums">{wfhCount}</span>
                <span className="text-[11px] sm:text-xs text-slate-500">Hari</span>
              </div>
            </div>

            {/* 4. Izin / Cuti */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-3 sm:p-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 bottom-0 w-1 bg-[#f2af3e]" />
              <div className="flex items-center justify-between text-slate-500 mb-1.5 sm:mb-2">
                <span className="text-[11px] sm:text-xs font-semibold text-[#102e50] truncate">Izin / Cuti</span>
                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#f2af3e] shrink-0" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-bold text-[#102e50] tabular-nums">
                  {monthlyData.stats.leaveCount}
                </span>
                <span className="text-[11px] sm:text-xs text-slate-500">Hari</span>
              </div>
            </div>

            {/* 5. Alpa / Tanpa Keterangan */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-3 sm:p-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 bottom-0 w-1 bg-[#a8281c]" />
              <div className="flex items-center justify-between text-slate-500 mb-1.5 sm:mb-2">
                <span className="text-[11px] sm:text-xs font-semibold text-[#102e50] truncate">Alpa</span>
                <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#a8281c] shrink-0" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-bold text-[#a8281c] tabular-nums">
                  {monthlyData.stats.absentCount}
                </span>
                <span className="text-[11px] sm:text-xs text-slate-500">Hari</span>
              </div>
            </div>

            {/* 6. Total Jam Kerja */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-3 sm:p-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 bottom-0 w-1 bg-[#8e2d3f]" />
              <div className="flex items-center justify-between text-slate-500 mb-1.5 sm:mb-2">
                <span className="text-[11px] sm:text-xs font-semibold text-[#102e50] truncate">Total Durasi</span>
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#8e2d3f] shrink-0" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-bold text-[#102e50] tabular-nums">
                  {monthlyData.stats.totalWorkHours}
                </span>
                <span className="text-[11px] sm:text-xs text-slate-500">Jam</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 flex flex-col sm:flex-row sm:items-center justify-between gap-2 break-words">
            <span>
              Jam operasional standar:{" "}
              <strong className="text-[#102e50]">
                {workSchedule.workStartTime} – {workSchedule.workEndTime} WIB
              </strong>
            </span>
            <span className="text-[#a8281c] font-medium">
              Batas toleransi masuk: <strong>{cutoffTime} WIB</strong> ({workSchedule.gracePeriodMins}{" "}
              menit)
            </span>
          </div>
        </div>

        {/* Right (4 cols): Policy Guidance Card */}
        <div className="lg:col-span-4 bg-white border border-slate-200/90 rounded-2xl p-6 flex flex-col justify-between shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#f2af3e]" />

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#102e50]/5 border border-[#102e50]/10 flex items-center justify-center shrink-0">
                <CalendarCheck className="w-5 h-5 text-[#102e50]" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#102e50] font-heading">
                  Ketentuan Kehadiran Kerja
                </h3>
                <p className="text-xs font-medium text-[#0874aa] mt-0.5">{workSchedule.name}</p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-slate-600 leading-relaxed pt-1">
              <p>
                Pencatatan kehadiran dilakukan setiap hari kerja. Check-in sebelum pukul{" "}
                <strong className="text-[#102e50]">{cutoffTime} WIB</strong> tercatat sebagai{" "}
                <strong className="text-emerald-700">Hadir Tepat Waktu</strong>.
              </p>
              <p>
                Pastikan Anda memilih mode kerja (<strong>WFO</strong> atau <strong>WFH</strong>)
                yang sesuai dan melakukan <strong>Check-Out</strong> saat mengakhiri jam kerja agar
                akumulasi jam kerja bulanan tercatat secara akurat.
              </p>
            </div>
          </div>

          <div className="pt-3.5 border-t border-slate-100 mt-5 flex items-center justify-between text-[11px] text-slate-500">
            <span>Sinkronisasi Waktu Otomatis</span>
            <span className="font-semibold text-[#102e50]">WIB • WITA • WIT</span>
          </div>
        </div>
      </div>

      {/* 3. Monthly Attendance Log Table */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div>
            <h2 className="text-lg font-bold text-[#102e50] font-heading">
              Riwayat Kehadiran Harian
            </h2>
            <p className="text-xs text-slate-500">
              Daftar log presensi masuk dan pulang Anda pada bulan {activeMonthLabel}
            </p>
          </div>
        </div>

        <AttendanceTable attendances={monthlyData.attendances} />
      </div>
    </div>
  );
}