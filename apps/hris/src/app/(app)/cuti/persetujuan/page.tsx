import React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession, getUserProfile } from "@pspk/auth";
import { prisma } from "@pspk/db";
import { getPendingLeaveApprovals, getAllLeaveRequests } from "@/server/queries/leave.queries";
import { LeaveApprovalView } from "@/components/cuti/leave-approval-view";
import { ArrowLeft, CheckSquare, CalendarDays, Settings, Calendar } from "lucide-react";

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
        <div className="flex items-center gap-2 mb-1">
          <Link
            href="/cuti"
            className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-[#102e50] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Kembali ke Cuti Saya
          </Link>
        </div>
        <h1 className="font-heading font-bold text-2xl md:text-3xl text-[#102e50] tracking-tight">
          Persetujuan Cuti & Izin Kerja
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Verifikasi dan berikan keputusan atas permohonan cuti anggota tim dan seluruh pegawai
          organisasi.
        </p>
      </div>

      {/* Subnavigation Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2 overflow-x-auto">
        <Link
          href="/cuti"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-md text-gray-600 hover:text-[#102e50] hover:bg-slate-100 transition-colors"
        >
          <Calendar className="w-3.5 h-3.5 text-[#102e50]" />
          Cuti Saya
        </Link>

        <Link
          href="/cuti/persetujuan"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-md bg-[#102e50] text-white"
        >
          <CheckSquare className="w-3.5 h-3.5" />
          Persetujuan Cuti
          {pendingRequests.length > 0 && (
            <span className="bg-[#ba1a1a] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
              {pendingRequests.length}
            </span>
          )}
        </Link>

        <Link
          href="/cuti/kalender"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-md text-gray-600 hover:text-[#102e50] hover:bg-slate-100 transition-colors"
        >
          <CalendarDays className="w-3.5 h-3.5 text-[#102e50]" />
          Kalender Cuti
        </Link>

        {isSuperOrHr && (
          <Link
            href="/cuti/pengaturan"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-md text-gray-600 hover:text-[#102e50] hover:bg-slate-100 transition-colors"
          >
            <Settings className="w-3.5 h-3.5 text-[#102e50]" />
            Pengaturan Kuota & Libur
          </Link>
        )}
      </div>

      {/* Main Interactive Approval Component */}
      <LeaveApprovalView
        pendingRequests={pendingRequests}
        allRequests={allRequestsResult.requests}
        isSuperOrHr={isSuperOrHr}
      />
    </div>
  );
}
