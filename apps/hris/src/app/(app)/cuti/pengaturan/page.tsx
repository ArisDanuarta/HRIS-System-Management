import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession, getUserProfile } from "@pspk/auth";
import { prisma } from "@pspk/db";
import { getLeaveTypes, getHolidays } from "@/server/queries/leave.queries";
import { LeaveSettingsView } from "@/components/cuti/leave-settings-view";
import { AttendanceLeaveSubnav } from "@/components/shell/attendance-leave-subnav";

export const dynamic = "force-dynamic";

export default async function PengaturanCutiPage() {
  const reqHeaders = await headers();
  const session = await getSession(reqHeaders);

  if (!session || !session.user) {
    redirect("/login");
  }

  const userProfile = await getUserProfile(session.user.id);
  const roleKeys = userProfile?.roles.map((r) => r.role.key) || [];
  const isSuperOrHr = roleKeys.includes("super_admin") || roleKeys.includes("admin_hr");

  if (!isSuperOrHr) {
    redirect("/cuti");
  }

  // Fetch real leave types and holiday list for 2026
  const [leaveTypes, holidays, pendingApprovalsCount] = await Promise.all([
    getLeaveTypes(),
    getHolidays(2026),
    prisma.leaveRequest.count({ where: { status: "PENDING" } }),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading font-bold text-2xl md:text-3xl text-[#102e50] tracking-tight">
          Pengaturan Kuota Cuti & Hari Libur
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Kelola master jenis cuti lembaga, alokasi default hari, serta daftar hari libur nasional resmi.
        </p>
      </div>

      {/* Unified Subnavigation Tabs */}
      <AttendanceLeaveSubnav
        activeTab="pengaturan"
        isHrOrAdmin={isSuperOrHr}
        isManager={false}
        pendingLeavesCount={pendingApprovalsCount}
      />

      {/* Main Settings Component */}
      <LeaveSettingsView
        leaveTypes={leaveTypes}
        holidays={holidays}
      />
    </div>
  );
}
