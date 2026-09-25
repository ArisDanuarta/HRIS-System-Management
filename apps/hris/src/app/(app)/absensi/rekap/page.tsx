import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession, getUserProfile } from "@pspk/auth";
import { getAttendanceRekap } from "@/server/queries/attendance.queries";
import { AttendanceRekapView } from "@/components/absensi/attendance-rekap-view";
import { AttendanceLeaveSubnav } from "@/components/shell/attendance-leave-subnav";
import { prisma } from "@pspk/db";
import { FileSpreadsheet } from "lucide-react";

export const dynamic = "force-dynamic";

interface RekapPageProps {
  searchParams: Promise<{
    year?: string;
    month?: string;
    dept?: string;
    q?: string;
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

  const resolvedParams = await searchParams;
  const now = new Date();
  const currentYear = resolvedParams.year ? parseInt(resolvedParams.year, 10) : now.getFullYear();
  const currentMonth = resolvedParams.month ? parseInt(resolvedParams.month, 10) : now.getMonth() + 1;
  const selectedDeptId = resolvedParams.dept || "ALL";
  const searchQuery = resolvedParams.q || "";

  // Query real data from PostgreSQL
  const [rekapData, pendingLeavesCount] = await Promise.all([
    getAttendanceRekap({
      year: currentYear,
      month: currentMonth,
      departmentId: selectedDeptId,
      search: searchQuery,
    }),
    prisma.leaveRequest.count({ where: { status: "PENDING" } }),
  ]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading font-bold text-2xl md:text-3xl text-[#102e50] tracking-tight">
            Rekap Kehadiran Karyawan
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Monitoring kehadiran seluruh pegawai, statistik absensi bulanan, dan koreksi manual HR.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-[#102e50] bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-xs cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Ekspor Data (CSV)
          </button>
        </div>
      </div>

      {/* Unified Subnavigation Tabs */}
      <AttendanceLeaveSubnav
        activeTab="rekap"
        isHrOrAdmin={isHrOrAdmin}
        isManager={isManager}
        pendingLeavesCount={pendingLeavesCount}
      />


      {/* Main Rekap Component with Filtering & Correction Modal */}
      <AttendanceRekapView
        employees={rekapData.employees}
        attendances={rekapData.attendances}
        departments={rekapData.departments}
        currentYear={currentYear}
        currentMonth={currentMonth}
        selectedDeptId={selectedDeptId}
        searchQuery={searchQuery}
      />
    </div>
  );
}
