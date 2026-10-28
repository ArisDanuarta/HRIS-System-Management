import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession, getUserProfile } from "@pspk/auth";
import { getAttendanceRekap } from "@/server/queries/attendance.queries";
import { getManagerTeamInfo } from "@/server/queries/employee.queries";
import { AttendanceRekapView } from "@/components/absensi/attendance-rekap-view";
import { AttendanceLeaveSubnav } from "@/components/shell/attendance-leave-subnav";
import { prisma } from "@pspk/db";
import { Building2, ShieldCheck, Users } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Rekapitulasi Presensi - HRIS PSPK",
  description: "Laporan rekapitulasi kehadiran bulanan pegawai di lingkungan PSPK",
};

interface RekapPageProps {
  searchParams: Promise<{
    year?: string;
    month?: string;
    dept?: string;
    q?: string;
    search?: string;
  }>;
}

export default async function AttendanceRekapPage({ searchParams }: RekapPageProps) {
  const reqHeaders = await headers();
  const session = await getSession(reqHeaders);

  if (!session || !session.user) {
    redirect("/login");
  }

  const userProfile = await getUserProfile(session.user.id);
  const roleKeys = userProfile?.roles.map((r) => r.role.key) || [];
  const isAuthorized =
    roleKeys.includes("super_admin") ||
    roleKeys.includes("admin_hr") ||
    roleKeys.includes("manager");

  if (!isAuthorized) {
    redirect("/absensi");
  }

  const isHrOrAdmin = roleKeys.includes("super_admin") || roleKeys.includes("admin_hr");
  const isManager = roleKeys.includes("manager");
  const isTeamView = isManager && !isHrOrAdmin;

  const currentEmployee = userProfile?.employee || null;
  const managerTeamInfo =
    isTeamView && currentEmployee ? await getManagerTeamInfo(currentEmployee.id) : null;

  const resolvedParams = await searchParams;
  const now = new Date();
  const rawYear = resolvedParams.year ? parseInt(resolvedParams.year, 10) : now.getFullYear();
  const rawMonth = resolvedParams.month ? parseInt(resolvedParams.month, 10) : now.getMonth() + 1;

  const currentYear = Number.isNaN(rawYear) ? now.getFullYear() : rawYear;
  const currentMonth =
    Number.isNaN(rawMonth) || rawMonth < 1 || rawMonth > 12 ? now.getMonth() + 1 : rawMonth;

  const selectedDeptId = isTeamView ? "ALL" : resolvedParams.dept || "ALL";
  const searchQuery = resolvedParams.q || resolvedParams.search || "";

  // Query real data from PostgreSQL
  const [rekapData, pendingLeavesCount] = await Promise.all([
    getAttendanceRekap({
      year: currentYear,
      month: currentMonth,
      departmentId: selectedDeptId,
      search: searchQuery,
      teamManagerId: isTeamView && currentEmployee ? currentEmployee.id : undefined,
      managerDepartmentId:
        isTeamView && managerTeamInfo?.currentDepartmentId
          ? managerTeamInfo.currentDepartmentId
          : undefined,
      excludeEmployeeId: isTeamView && currentEmployee ? currentEmployee.id : undefined,
    }),
    prisma.leaveRequest.count({
      where:
        isTeamView && currentEmployee
          ? {
              status: "PENDING",
              employee: {
                OR: [
                  { managerId: currentEmployee.id },
                  ...(managerTeamInfo?.currentDepartmentId
                    ? [{ currentDepartmentId: managerTeamInfo.currentDepartmentId }]
                    : []),
                ],
                id: { not: currentEmployee.id },
              },
            }
          : { status: "PENDING" },
    }),
  ]);

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

  return (
    <div className="space-y-6">
      {/* Unified Subnavigation Tabs */}
      <AttendanceLeaveSubnav
        activeTab="rekap"
        isHrOrAdmin={isHrOrAdmin}
        isManager={isManager}
        pendingLeavesCount={pendingLeavesCount}
      />

      {/* Navy Hero Section (PSPK Brand Identity) */}
      <div className="bg-[#102e50] rounded-2xl p-6 sm:p-7 text-white relative overflow-hidden shadow-xs">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#f2af3e]/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#f2af3e] via-[#df632f] to-[#0874aa]" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/10 border border-white/15 text-[#f2af3e] text-[11px] font-semibold tracking-wide uppercase">
                {isTeamView ? (
                  <>
                    <Users className="w-3.5 h-3.5" />
                    <span>Monitoring Presensi Tim</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Manajemen Presensi Lembaga (HR)</span>
                  </>
                )}
              </span>

              {isTeamView && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#0874aa]/30 border border-[#0874aa]/50 text-white text-[11px] font-semibold">
                  <Building2 className="w-3 h-3 text-[#f2af3e]" />
                  <span>{managerTeamInfo?.currentDepartment?.name || "Divisi Saya"}</span>
                </span>
              )}
            </div>

            <h1 className="font-heading font-bold text-2xl sm:text-3xl text-white tracking-tight">
              {isTeamView ? "Rekapitulasi Kehadiran Tim" : "Rekapitulasi Kehadiran Pegawai"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              {isTeamView
                ? `Pemantauan matriks harian dan ringkasan kehadiran anggota tim ${
                    managerTeamInfo?.currentDepartment?.name
                      ? `pada ${managerTeamInfo.currentDepartment.name}`
                      : ""
                  }.`
                : "Pemantauan matriks presensi bulanan seluruh pegawai PSPK, evaluasi ketepatan waktu, dan koreksi teraudit."}
            </p>
          </div>

          {/* Active Period Summary Box */}
          <div className="self-start md:self-center bg-white/10 backdrop-blur-xs border border-white/15 rounded-xl px-4 py-2.5 text-left md:text-right shrink-0">
            <span className="text-[10px] uppercase tracking-wider text-[#f2af3e] font-semibold block">
              Periode Laporan Aktif
            </span>
            <span className="text-sm sm:text-base font-bold text-white">
              {monthNames[currentMonth - 1]} {currentYear}
            </span>
          </div>
        </div>
      </div>

      {/* Main Rekap Component with KPI Cards, Matrix 1-31 & Correction Modal */}
      <AttendanceRekapView
        employees={rekapData.employees}
        attendances={rekapData.attendances}
        departments={rekapData.departments}
        currentYear={currentYear}
        currentMonth={currentMonth}
        selectedDeptId={selectedDeptId}
        searchQuery={searchQuery}
        isHrOrAdmin={isHrOrAdmin}
        isTeamView={isTeamView}
        departmentName={managerTeamInfo?.currentDepartment?.name}
      />
    </div>
  );
}