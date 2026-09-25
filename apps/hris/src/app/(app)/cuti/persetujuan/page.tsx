import React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession, getUserProfile } from "@pspk/auth";
import { prisma } from "@pspk/db";
import { getPendingLeaveApprovals, getAllLeaveRequests } from "@/server/queries/leave.queries";
import { LeaveApprovalView } from "@/components/cuti/leave-approval-view";
import { AttendanceLeaveSubnav } from "@/components/shell/attendance-leave-subnav";

export const dynamic = "force-dynamic";

export default async function PersetujuanCutiPage() {
  const reqHeaders = await headers();
  const session = await getSession(reqHeaders);

  if (!session || !session.user) {
    redirect("/login");
  }

  const userProfile = await getUserProfile(session.user.id);
  const roleKeys = userProfile?.roles.map((r) => r.role.key) || [];
  const isSuperOrHr = roleKeys.includes("super_admin") || roleKeys.includes("admin_hr");
  const isManager = roleKeys.includes("manager");

  if (!isSuperOrHr && !isManager) {
    redirect("/cuti");
  }

  const employee =
    userProfile?.employee ||
    (await prisma.employee.findFirst({
      where: { deletedAt: null },
      orderBy: { createdAt: "asc" },
    }));

  // Fetch pending requests & all requests for history/audit
  const [pendingRequests, allRequestsResult] = await Promise.all([
    getPendingLeaveApprovals({
      managerId: employee?.id,
      isSuperOrHr,
    }),
    getAllLeaveRequests({
      pageSize: 100,
    }),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading font-bold text-2xl md:text-3xl text-[#102e50] tracking-tight">
          Persetujuan Cuti & Izin Kerja
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Verifikasi dan berikan keputusan atas permohonan cuti anggota tim dan seluruh pegawai
          organisasi.
        </p>
      </div>

      {/* Unified Subnavigation Tabs */}
      <AttendanceLeaveSubnav
        activeTab="persetujuan"
        isHrOrAdmin={isSuperOrHr}
        isManager={isManager}
        pendingLeavesCount={pendingRequests.length}
      />

      {/* Main Interactive Approval Component */}
      <LeaveApprovalView
        pendingRequests={pendingRequests}
        allRequests={allRequestsResult.requests}
        isSuperOrHr={isSuperOrHr}
      />
    </div>
  );
}
