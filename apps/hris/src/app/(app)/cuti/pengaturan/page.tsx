import React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession, getUserProfile } from "@pspk/auth";
import { prisma } from "@pspk/db";
import { getLeaveTypes, getHolidays } from "@/server/queries/leave.queries";
import { LeaveSettingsView } from "@/components/cuti/leave-settings-view";
import { ArrowLeft, Calendar, CheckSquare, CalendarDays, Settings } from "lucide-react";

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
          Pengaturan Kuota Cuti & Hari Libur
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Kelola master jenis cuti lembaga, alokasi default hari, serta daftar hari libur nasional resmi.
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
          className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-md text-gray-600 hover:text-[#102e50] hover:bg-slate-100 transition-colors"
        >
          <CheckSquare className="w-3.5 h-3.5 text-[#102e50]" />
          Persetujuan Cuti
          {pendingApprovalsCount > 0 && (
            <span className="bg-[#ba1a1a] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
              {pendingApprovalsCount}
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

        <Link
          href="/cuti/pengaturan"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-md bg-[#102e50] text-white"
        >
          <Settings className="w-3.5 h-3.5" />
          Pengaturan Kuota & Libur
        </Link>
      </div>

      {/* Main Settings Component */}
      <LeaveSettingsView
        leaveTypes={leaveTypes}
        holidays={holidays}
      />
    </div>
  );
}
