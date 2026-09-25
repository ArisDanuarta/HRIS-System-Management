import React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession, getUserProfile } from "@pspk/auth";
import { prisma } from "@pspk/db";
import { getEmployeeLeaveBalances, getPersonalLeaveRequests } from "@/server/queries/leave.queries";
import { LeaveBalanceCards } from "@/components/cuti/leave-balance-cards";
import { LeaveRequestTable } from "@/components/cuti/leave-request-table";
import { AttendanceLeaveSubnav } from "@/components/shell/attendance-leave-subnav";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CutiPage() {
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

  // Fetch balances and personal leave requests
  const [balances, requests, pendingApprovalsCount] = await Promise.all([
    getEmployeeLeaveBalances(employee.id, 2026),
    getPersonalLeaveRequests(employee.id),
    prisma.leaveRequest.count({ where: { status: "PENDING" } }),
  ]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading font-bold text-2xl md:text-3xl text-[#102e50] tracking-tight">
            Cuti & Izin Karyawan
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Informasi saldo hak cuti tahun 2026 dan riwayat permohonan izin kerja Anda.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/cuti/ajukan"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#102e50] text-white text-sm font-semibold rounded-lg hover:bg-[#0c233d] transition-all shadow-sm hover:shadow active:scale-[0.99]"
          >
            <Plus className="w-4 h-4 text-[#f2af3e]" />
            Ajukan Cuti Baru
          </Link>
        </div>
      </div>

      {/* Unified Subnavigation Tabs */}
      <AttendanceLeaveSubnav
        activeTab="cuti"
        isHrOrAdmin={isHrOrAdmin}
        isManager={isManager}
        pendingLeavesCount={pendingApprovalsCount}
      />

      {/* Real Leave Balance Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[#102e50] font-heading">
            Saldo Kuota Cuti Tahun 2026
          </h2>
          <span className="text-xs text-gray-500">Periode: 01 Jan 2026 — 31 Des 2026</span>
        </div>

        <LeaveBalanceCards balances={balances} />
      </div>

      {/* Real Leave Requests History Table */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[#102e50] font-heading">
            Riwayat Permohonan Cuti
          </h2>
          <span className="text-xs text-gray-500">
            Total {requests.length} pengajuan tercatat
          </span>
        </div>

        <LeaveRequestTable requests={requests} />
      </div>
    </div>
  );
}
