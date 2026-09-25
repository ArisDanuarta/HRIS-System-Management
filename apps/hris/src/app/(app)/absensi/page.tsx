import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession, getUserProfile } from "@pspk/auth";
import { prisma } from "@pspk/db";
import { TodayAttendanceCard } from "@/components/absensi/today-attendance-card";
import { AttendanceTable } from "@/components/absensi/attendance-table";
import { getTodayAttendance, getPersonalMonthlyAttendance } from "@/server/queries/attendance.queries";
import { getActiveWorkSchedule } from "@/server/services/work-schedule.service";
import { AttendanceLeaveSubnav } from "@/components/shell/attendance-leave-subnav";
import {
  CalendarCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Calendar,
} from "lucide-react";

export const dynamic = "force-dynamic";

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
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-gray-200">
        <p className="text-gray-600">Profil pegawai tidak ditemukan untuk akun ini.</p>
      </div>
    );
  }

  const roleKeys = userProfile?.roles.map((r) => r.role.key) || [];
  const isHrOrAdmin = roleKeys.includes("super_admin") || roleKeys.includes("admin_hr");
  const isManager = roleKeys.includes("manager");

  const resolvedParams = await searchParams;
  const now = new Date();
  const currentYear = resolvedParams.year ? parseInt(resolvedParams.year, 10) : now.getFullYear();
  const currentMonth = resolvedParams.month ? parseInt(resolvedParams.month, 10) : now.getMonth() + 1;

  // Fetch real data from PostgreSQL
  const [todayAttendance, monthlyData, pendingLeavesCount, workSchedule] = await Promise.all([
    getTodayAttendance(employee.id),
    getPersonalMonthlyAttendance(employee.id, currentYear, currentMonth),
    prisma.leaveRequest.count({ where: { status: "PENDING" } }),
    getActiveWorkSchedule(),
  ]);

  // Calculate cutoff time dynamically
  const [startH, startM] = workSchedule.workStartTime.split(":").map((v) => parseInt(v, 10));
  const totalMinutes = (startH || 9) * 60 + (startM || 0) + workSchedule.gracePeriodMins;
  const cutoffH = Math.floor(totalMinutes / 60) % 24;
  const cutoffM = totalMinutes % 60;
  const cutoffTime = `${String(cutoffH).padStart(2, "0")}:${String(cutoffM).padStart(2, "0")}`;

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-heading font-bold text-2xl md:text-3xl text-[#102e50] tracking-tight">
            Presensi & Kehadiran Saya
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Pencatatan jam masuk, pulang, dan riwayat presensi harian secara real-time.
          </p>
        </div>
      </div>

      {/* Unified Subnavigation Tabs */}
      <AttendanceLeaveSubnav
        activeTab="absensi"
        isHrOrAdmin={isHrOrAdmin}
        isManager={isManager}
        pendingLeavesCount={pendingLeavesCount}
      />

      {/* Main Grid: Today Check-In Card & Monthly Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Live Check-in / Check-out Card */}
        <div className="lg:col-span-5">
          <TodayAttendanceCard
            todayAttendance={todayAttendance}
            employeeName={employee.fullName}
            workSchedule={workSchedule}
          />
        </div>

        {/* Right Column: Month Statistics & Quick Information */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="bg-white rounded-xl border border-gray-200/80 shadow-xs p-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-[#102e50]">
                  Ringkasan Bulan {monthNames[currentMonth - 1]} {currentYear}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Akumulasi kehadiran Anda pada periode berjalan
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                {monthlyData.stats.recordedDays} Hari Terekam
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5">
              <div className="bg-emerald-50/60 border border-emerald-100/80 rounded-xl p-3.5">
                <div className="flex items-center gap-2 text-emerald-700 mb-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-xs font-semibold">Tepat Waktu</span>
                </div>
                <div className="text-2xl font-bold text-emerald-800">
                  {monthlyData.stats.presentCount}
                  <span className="text-xs font-normal text-emerald-600 ml-1">Hari</span>
                </div>
              </div>

              <div className="bg-amber-50/60 border border-amber-100/80 rounded-xl p-3.5">
                <div className="flex items-center gap-2 text-amber-700 mb-1">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-xs font-semibold">Terlambat</span>
                </div>
                <div className="text-2xl font-bold text-amber-800">
                  {monthlyData.stats.lateCount}
                  <span className="text-xs font-normal text-amber-600 ml-1">Hari</span>
                </div>
              </div>

              <div className="bg-blue-50/60 border border-blue-100/80 rounded-xl p-3.5">
                <div className="flex items-center gap-2 text-blue-700 mb-1">
                  <Calendar className="w-4 h-4" />
                  <span className="text-xs font-semibold">Izin / Cuti</span>
                </div>
                <div className="text-2xl font-bold text-blue-800">
                  {monthlyData.stats.leaveCount}
                  <span className="text-xs font-normal text-blue-600 ml-1">Hari</span>
                </div>
              </div>

              <div className="bg-indigo-50/60 border border-indigo-100/80 rounded-xl p-3.5">
                <div className="flex items-center gap-2 text-indigo-700 mb-1">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs font-semibold">Total Jam</span>
                </div>
                <div className="text-2xl font-bold text-indigo-900">
                  {monthlyData.stats.totalWorkHours}
                  <span className="text-xs font-normal text-indigo-600 ml-1">Jam</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-gray-100 text-xs text-gray-500 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
              <span>
                Jam kerja normal lembaga: <strong>{workSchedule.workStartTime} — {workSchedule.workEndTime} WIB</strong>
              </span>
              <span className="text-[#a8281c] font-medium">
                Batas tepat waktu: <strong>{cutoffTime} WIB</strong> (Toleransi {workSchedule.gracePeriodMins} mnt)
              </span>
            </div>
          </div>

          {/* Quick Notice Card */}
          <div className="bg-[#eff4ff] border border-[#adc8f2]/60 rounded-xl p-4 flex items-start gap-3 text-xs text-[#102e50]">
            <CalendarCheck className="w-5 h-5 text-[#102e50] shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Ketentuan Kehadiran Kerja — {workSchedule.name}</p>
              <p className="mt-0.5 text-gray-600 leading-relaxed">
                Check-in sebelum pukul <strong>{cutoffTime} WIB</strong> diakui hadir <strong>Tepat Waktu</strong>. Check-in setelah waktu tersebut tercatat otomatis sebagai keterlambatan. Pastikan melakukan check-out saat menyelesaikan hari kerja untuk perhitungan akurat.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Attendance Log Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#102e50] font-heading">
            Riwayat Kehadiran Harian
          </h2>
          <div className="text-xs text-gray-500">
            Menampilkan periode {monthNames[currentMonth - 1]} {currentYear}
          </div>
        </div>

        <AttendanceTable attendances={monthlyData.attendances} />
      </div>
    </div>
  );
}
