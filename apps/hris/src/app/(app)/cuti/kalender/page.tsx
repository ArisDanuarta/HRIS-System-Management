import React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession, getUserProfile } from "@pspk/auth";
import { prisma } from "@pspk/db";
import { getLeaveCalendarEvents } from "@/server/queries/leave.queries";
import { LeaveCalendarView } from "@/components/cuti/leave-calendar-view";
import { ArrowLeft, Calendar, CheckSquare, CalendarDays, Settings } from "lucide-react";

export const dynamic = "force-dynamic";

interface KalenderPageProps {
  searchParams: Promise<{
    year?: string;
    month?: string;
  }>;
}

export default async function KalenderCutiPage({ searchParams }: KalenderPageProps) {
  const reqHeaders = await headers();
  const session = await getSession(reqHeaders);

  if (!session || !session.user) {
    redirect("/login");
  }

  const userProfile = await getUserProfile(session.user.id);
  const roleKeys = userProfile?.roles.map((r) => r.role.key) || [];
  const isSuperOrHr = roleKeys.includes("super_admin") || roleKeys.includes("admin_hr");
  const isManager = roleKeys.includes("manager");

  const resolvedParams = await searchParams;
  const now = new Date();
  const currentYear = resolvedParams.year ? parseInt(resolvedParams.year, 10) : now.getFullYear();
  const currentMonth = resolvedParams.month ? parseInt(resolvedParams.month, 10) : now.getMonth() + 1;

  // Fetch approved leaves and official holidays for the selected calendar month
  const [calendarEvents, pendingApprovalsCount] = await Promise.all([
    getLeaveCalendarEvents(currentYear, currentMonth),
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
          Kalender Cuti & Hari Libur Bersama
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Visibilitas jadwal cuti rekan kerja, cuti bersama, dan hari libur nasional resmi.
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

        {(isSuperOrHr || isManager) && (
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
        )}

        <Link
          href="/cuti/kalender"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-md bg-[#102e50] text-white"
        >
          <CalendarDays className="w-3.5 h-3.5" />
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

      {/* Main Calendar View */}
      <LeaveCalendarView
        year={currentYear}
        month={currentMonth}
        approvedLeaves={calendarEvents.approvedLeaves}
        holidays={calendarEvents.holidays}
      />
    </div>
  );
}
