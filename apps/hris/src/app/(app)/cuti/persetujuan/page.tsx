import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession, getUserProfile } from "@pspk/auth";
import { prisma } from "@pspk/db";
import { getPendingLeaveApprovals, getAllLeaveRequests } from "@/server/queries/leave.queries";
import { LeaveApprovalView } from "@/components/cuti/leave-approval-view";
import { AttendanceLeaveSubnav } from "@/components/shell/attendance-leave-subnav";
import { ShieldCheck, Settings, ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Permohonan Cuti - HRIS PSPK",
  description: "Verifikasi dan persetujuan permohonan cuti staf oleh manajer dan HR",
};

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

  // Fetch pending requests & all requests for history/audit (disesuaikan dengan scope wewenang HR vs Manajer)
  const [pendingRequests, allRequestsResult] = await Promise.all([
    getPendingLeaveApprovals({
      managerId: employee?.id,
      isSuperOrHr,
    }),
    getAllLeaveRequests({
      managerId: employee?.id,
      isSuperOrHr,
      pageSize: 100,
    }),
  ]);

  return (
    <div className="space-y-6 w-full min-w-0 max-w-full">
      {/* Subnavigation Tabs Absensi & Cuti (HR Management) */}
      <AttendanceLeaveSubnav
        activeTab="persetujuan"
        isHrOrAdmin={isSuperOrHr}
        isManager={isManager}
        pendingLeavesCount={pendingRequests.length}
      />

      {/* Navy Hero Section (PSPK Brand Identity) */}
      <div className="bg-[#102e50] rounded-2xl p-5 sm:p-7 text-white relative overflow-hidden shadow-xs w-full min-w-0">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#f2af3e]/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#f2af3e] via-[#df632f] to-[#0874aa]" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/10 border border-white/15 text-[#f2af3e] text-[11px] font-semibold tracking-wide uppercase">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">
                  {isSuperOrHr ? "Manajemen Permohonan Cuti (HR)" : "Verifikasi Cuti Tim"}
                </span>
              </span>
            </div>

            <h1 className="font-heading font-bold text-2xl sm:text-3xl text-white tracking-tight break-words">
              Permohonan Cuti & Izin Pegawai
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed break-words">
              Verifikasi, tinjau kuota cuti terpakai, dan berikan keputusan atas permohonan cuti anggota tim dan seluruh pegawai organisasi.
            </p>
          </div>

          {/* Quick Info & Shortcut Actions */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0 self-stretch sm:self-auto">
            <div className="bg-white/10 backdrop-blur-xs border border-white/15 rounded-xl px-4 py-2.5 text-left md:text-right">
              <span className="text-[10px] uppercase tracking-wider text-[#f2af3e] font-semibold block">
                Menunggu Keputusan
              </span>
              <span className="text-sm sm:text-base font-bold text-white whitespace-nowrap">
                {pendingRequests.length} Permohonan
              </span>
            </div>

            {isSuperOrHr && (
              <Link
                href="/tata-kelola?tab=jenis-cuti"
                className="inline-flex items-center justify-center md:justify-end gap-1.5 text-xs text-slate-300 hover:text-[#f2af3e] transition-colors"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Pengaturan Cuti</span>
                <ArrowUpRight className="w-3 h-3" />
              </Link>
            )}
          </div>
        </div>
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
