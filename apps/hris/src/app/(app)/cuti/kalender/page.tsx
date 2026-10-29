import React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession, getUserProfile } from "@pspk/auth";
import { prisma } from "@pspk/db";
import { getWorkCalendarEvents } from "@/server/queries/calendar.queries";
import { AttendanceLeaveSubnav } from "@/components/shell/attendance-leave-subnav";
import { TeamLeaveContainer } from "@/components/cuti/team-leave-container";
import { toDateString } from "@pspk/shared";
import {
  CalendarDays,
  Users,
  CalendarCheck2,
  Clock,
  Plus,
  ShieldCheck,
  UserX,
} from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Kalender & Timeline Cuti Tim - HRIS PSPK",
  description:
    "Visibilitas jadwal cuti kerja dan kehadiran seluruh tim PSPK dalam satu tampilan terpadu",
};

interface KalenderPageProps {
  searchParams: Promise<{
    year?: string;
    month?: string;
  }>;
}

const MONTHS = [
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

export default async function KalenderCutiTimPage({ searchParams }: KalenderPageProps) {
  const reqHeaders = await headers();
  const session = await getSession(reqHeaders);

  if (!session || !session.user) {
    redirect("/login");
  }

  const userProfile = await getUserProfile(session.user.id);
  const roleKeys = userProfile?.roles.map((r) => r.role.key) || [];
  const isHrOrAdmin = roleKeys.includes("super_admin") || roleKeys.includes("admin_hr");
  const isManager = roleKeys.includes("manager");

  const resolved = await searchParams;
  const now = new Date();
  const year = resolved.year ? parseInt(resolved.year, 10) : now.getFullYear();
  const month = resolved.month ? parseInt(resolved.month, 10) : now.getMonth() + 1;

  // Fetch approved leaves, holidays, and departments
  const [calendarData, deptRecords, pendingApprovalsCount] = await Promise.all([
    getWorkCalendarEvents(year, month),
    prisma.department.findMany({
      select: { name: true },
      orderBy: { name: "asc" },
    }),
    prisma.leaveRequest.count({ where: { status: "PENDING" } }),
  ]);

  const { leaves, holidays } = calendarData;

  // Extract unique departments
  const deptSet = new Set<string>();
  deptRecords.forEach((d) => deptSet.add(d.name));
  leaves.forEach((l) => {
    if (l.employee.department) deptSet.add(l.employee.department);
  });
  const departments = Array.from(deptSet).sort();

  // Compute Quick Overview Metrics
  const today = new Date();
  const todayStr = toDateString(today);

  // 7 days ahead
  const next7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const next7DaysStr = toDateString(next7Days);

  const leavesToday = leaves.filter((l) => {
    const s = toDateString(l.startDate);
    const e = toDateString(l.endDate);
    return s <= todayStr && e >= todayStr;
  });

  const leavesThisWeek = leaves.filter((l) => {
    const s = toDateString(l.startDate);
    return s > todayStr && s <= next7DaysStr;
  });

  const totalLeaveDaysThisMonth = leaves.reduce((acc, l) => acc + Number(l.days), 0);

  return (
    <div className="space-y-6">
      {/* Unified Subnavigation Tabs */}
      <AttendanceLeaveSubnav
        activeTab="kalender"
        isHrOrAdmin={isHrOrAdmin}
        isManager={isManager}
        pendingLeavesCount={pendingApprovalsCount}
      />

      {/* Navy Hero Header (PSPK Brand Identity) */}
      <div className="bg-[#102e50] rounded-2xl p-6 sm:p-7 text-white relative overflow-hidden shadow-xs">
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#f2af3e] via-[#df632f] to-[#0874aa]" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-white/10 border border-white/15 text-[#f2af3e] text-[11px] font-semibold tracking-wide uppercase">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Visibilitas Jadwal &amp; Kehadiran Tim</span>
            </div>
            <h1 className="font-heading font-bold text-2xl sm:text-3xl text-white tracking-tight">
              Kalender &amp; Timeline Cuti Tim
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Pantau jadwal cuti seluruh rekan kerja pada bulan {MONTHS[month - 1]} {year} untuk
              memastikan kelancaran kolaborasi dan operasional PSPK.
            </p>
          </div>

          {/* Quick Action Button */}
          <div className="flex items-center gap-2.5 self-start lg:self-center shrink-0">
            <Link
              href="/cuti/ajukan"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#f2af3e] hover:bg-[#e5a02d] text-[#102e50] text-xs font-bold rounded-xl transition-all shadow-xs active:scale-[0.99]"
            >
              <Plus className="w-4 h-4 text-[#102e50] stroke-[2.5]" />
              <span>Ajukan Cuti Baru</span>
            </Link>
          </div>
        </div>

        {/* Quick Insights Stats Row */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-5 border-t border-white/10">
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
            <div className="w-9 h-9 rounded-lg bg-[#a8281c]/30 text-rose-200 flex items-center justify-center shrink-0">
              <UserX className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] text-slate-300 block">Sedang Cuti Hari Ini</span>
              <span className="text-base font-bold text-white tabular-nums">
                {leavesToday.length} Pegawai
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
            <div className="w-9 h-9 rounded-lg bg-[#df632f]/30 text-[#f2af3e] flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] text-slate-300 block">Akan Cuti 7 Hari ke Depan</span>
              <span className="text-base font-bold text-white tabular-nums">
                {leavesThisWeek.length} Pegawai
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
            <div className="w-9 h-9 rounded-lg bg-[#0874aa]/30 text-[#f4b867] flex items-center justify-center shrink-0">
              <CalendarCheck2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] text-slate-300 block">
                Total Hari Cuti ({MONTHS[month - 1]})
              </span>
              <span className="text-base font-bold text-white tabular-nums">
                {totalLeaveDaysThisMonth} Hari Kerja Terjadwal
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Interactive Container (Timeline vs Month Calendar) */}
      <TeamLeaveContainer
        year={year}
        month={month}
        leaves={leaves}
        holidays={holidays}
        departments={departments}
      />
    </div>
  );
}
