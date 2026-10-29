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
import { UnlinkedEmployeeNotice } from "@/components/dashboard/unlinked-employee-notice";
import {
  Plus,
  CalendarRange,
  ShieldCheck,
  CalendarCheck2,
  Clock,
  CheckCircle2,
} from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Manajemen Cuti - HRIS PSPK",
  description: "Pengajuan dan informasi kuota cuti pegawai di lingkungan PSPK",
};

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
    return <UnlinkedEmployeeNotice roleName="Cuti Pegawai" />;
  }

  const roleKeys = userProfile?.roles.map((r) => r.role.key) || [];
  const isHrOrAdmin = roleKeys.includes("super_admin") || roleKeys.includes("admin_hr");
  const isManager = roleKeys.includes("manager");

  const currentYear = new Date().getFullYear();

  // Fetch balances and personal leave requests
  const [balances, requests, pendingApprovalsCount] = await Promise.all([
    getEmployeeLeaveBalances(employee.id, currentYear),
    getPersonalLeaveRequests(employee.id),
    prisma.leaveRequest.count({ where: { status: "PENDING" } }),
  ]);

  // Compute aggregate summary metrics
  const totalRemainingDays = balances.reduce((acc, b) => acc + b.remainingDays, 0);
  const totalUsedDays = balances.reduce((acc, b) => acc + b.usedDaysNumber, 0);
  const myPendingRequestsCount = requests.filter((r) => r.status === "PENDING").length;

  return (
    <div className="space-y-6">
      {/* Unified Subnavigation Tabs */}
      <AttendanceLeaveSubnav
        activeTab="cuti"
        isHrOrAdmin={isHrOrAdmin}
        isManager={isManager}
        pendingLeavesCount={pendingApprovalsCount}
      />

      {/* Navy Hero Section (PSPK Brand Identity) */}
      <div className="bg-[#102e50] rounded-2xl p-6 sm:p-7 text-white relative overflow-hidden shadow-xs">
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#f2af3e] via-[#df632f] to-[#0874aa]" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-white/10 border border-white/15 text-[#f2af3e] text-[11px] font-semibold tracking-wide uppercase">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Manajemen Hak Cuti & Izin PSPK</span>
            </div>
            <h1 className="font-heading font-bold text-2xl sm:text-3xl text-white tracking-tight">
              Cuti & Izin Kerja Saya
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Pantau ketersediaan kuota cuti tahun {currentYear}, ajukan permohonan izin kerja baru,
              dan lihat jadwal cuti rekan satu tim.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center shrink-0">
            <Link
              href="/kalender"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white border border-white/20 text-xs font-semibold rounded-xl transition-colors"
            >
              <CalendarRange className="w-4 h-4 text-[#f2af3e]" />
              <span>Kalender Kerja</span>
            </Link>

            <Link
              href="/cuti/ajukan"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#f2af3e] hover:bg-[#e5a02d] text-[#102e50] text-xs font-bold rounded-xl transition-all shadow-xs active:scale-[0.99]"
            >
              <Plus className="w-4 h-4 text-[#102e50] stroke-[2.5]" />
              <span>Ajukan Cuti Baru</span>
            </Link>
          </div>
        </div>

        {/* Hero Aggregate Quick Stats Bar */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-5 border-t border-white/10">
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
            <div className="w-9 h-9 rounded-lg bg-[#f2af3e]/20 text-[#f2af3e] flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] text-slate-300 block">Total Sisa Saldo Aktif</span>
              <span className="text-base font-bold text-white tabular-nums">
                {totalRemainingDays} Hari Tersedia
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
            <div className="w-9 h-9 rounded-lg bg-[#0874aa]/30 text-[#f4b867] flex items-center justify-center shrink-0">
              <CalendarCheck2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] text-slate-300 block">
                Total Cuti Terpakai ({currentYear})
              </span>
              <span className="text-base font-bold text-white tabular-nums">
                {totalUsedDays} Hari Kerja
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
            <div className="w-9 h-9 rounded-lg bg-[#df632f]/30 text-[#f2af3e] flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] text-slate-300 block">Permohonan Menunggu Review</span>
              <span className="text-base font-bold text-white tabular-nums">
                {myPendingRequestsCount} Pengajuan
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 1. Leave Balance Cards Section */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div>
            <h2 className="text-lg font-bold text-[#102e50] font-heading">
              Rincian Kuota Cuti Tahun {currentYear}
            </h2>
            <p className="text-xs text-slate-500">
              Masa berlaku kuota: 01 Januari {currentYear} – 31 Desember {currentYear}
            </p>
          </div>
        </div>

        <LeaveBalanceCards balances={balances} />
      </div>

      {/* 2. Personal Leave Requests History Table */}
      <div className="space-y-3 pt-2">
        <div>
          <h2 className="text-lg font-bold text-[#102e50] font-heading">
            Riwayat Permohonan Cuti & Izin
          </h2>
          <p className="text-xs text-slate-500">
            Daftar seluruh pengajuan cuti beserta status evaluasi dari atasan langsung dan HR
          </p>
        </div>

        <LeaveRequestTable requests={requests} />
      </div>
    </div>
  );
}