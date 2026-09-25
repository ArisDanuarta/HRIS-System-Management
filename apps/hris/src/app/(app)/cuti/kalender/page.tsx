import React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession, getUserProfile } from "@pspk/auth";
import { prisma } from "@pspk/db";
import { getLeaveCalendarEvents } from "@/server/queries/leave.queries";
import { LeaveCalendarView } from "@/components/cuti/leave-calendar-view";
import { AttendanceLeaveSubnav } from "@/components/shell/attendance-leave-subnav";

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
        <h1 className="font-heading font-bold text-2xl md:text-3xl text-[#102e50] tracking-tight">
          Kalender Cuti & Hari Libur Bersama
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Visibilitas jadwal cuti rekan kerja, cuti bersama, dan hari libur nasional resmi.
        </p>
      </div>

      {/* Unified Subnavigation Tabs */}
      <AttendanceLeaveSubnav
        activeTab="kalender"
        isHrOrAdmin={isSuperOrHr}
        isManager={isManager}
        pendingLeavesCount={pendingApprovalsCount}
      />

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
