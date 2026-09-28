import React from "react";
import { headers, cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession, getUserProfile, getAuthContext } from "@pspk/auth";
import {
  getPerformancePeriods,
  getActivePerformancePeriod,
  getPerformanceOverviewStats,
  getPerformanceReviewsByPeriod,
  getPerformanceDepartments,
  getStaffPerformanceReview,
  getStaffPerformancePeriods,
} from "@/server/queries/performance.queries";
import { PerformanceClientWrapper } from "@/components/kinerja/performance-client-wrapper";
import { StaffPerformanceView } from "@/components/kinerja/staff-performance-view";
import { UnlinkedEmployeeNotice } from "@/components/dashboard/unlinked-employee-notice";
import { ShieldAlert, Calendar } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Kinerja & Riset — HRIS PSPK",
  description: "Kelola siklus evaluasi sasaran riset kebijakan, OKR, dan review kinerja pegawai PSPK",
};

interface PageProps {
  searchParams: Promise<{ periodId?: string }>;
}

export default async function PerformancePage({ searchParams }: PageProps) {
  const reqHeaders = await headers();
  const session = await getSession(reqHeaders);

  if (!session?.user) {
    redirect("/login");
  }

  const [ctx, userProfile] = await Promise.all([
    getAuthContext(session.user.id),
    getUserProfile(session.user.id),
  ]);

  if (!ctx) {
    redirect("/login");
  }

  const roleKeys = ctx.roles;
  const isSuperAdmin = roleKeys.includes("super_admin");
  const isAdminHr = roleKeys.includes("admin_hr");
  const isManager = roleKeys.includes("manager");

  // Periksa preview cookie untuk Super Admin
  const cookieStore = await cookies();
  const rawPreviewCookie = cookieStore.get("pspk_role_view")?.value;
  const activePreviewRole =
    isSuperAdmin &&
    (rawPreviewCookie === "admin_hr" || rawPreviewCookie === "manager" || rawPreviewCookie === "staff")
      ? rawPreviewCookie
      : null;

  const resolvedParams = await searchParams;

  // JALUR 1: ROLE STAF (atau Super Admin dalam mode preview Staf / Manajer personal view)
  const isStaffView =
    activePreviewRole === "staff" ||
    (!isSuperAdmin && !isAdminHr);

  if (isStaffView) {
    if (!ctx.employeeId || !userProfile?.employee) {
      return <UnlinkedEmployeeNotice roleName="Staff / Karyawan" />;
    }

    const [staffReview, staffPeriods] = await Promise.all([
      getStaffPerformanceReview(ctx.employeeId, resolvedParams?.periodId),
      getStaffPerformancePeriods(ctx.employeeId),
    ]);

    return (
      <StaffPerformanceView
        review={staffReview}
        periods={staffPeriods}
        employeeName={userProfile.employee.fullName}
        positionTitle={userProfile.employee.currentPosition?.title}
        departmentName={userProfile.employee.currentDepartment?.name}
        employeeNo={userProfile.employee.employeeNo}
        selectedPeriodId={resolvedParams?.periodId}
      />
    );
  }

  // JALUR 2: ADMIN HR & SUPER ADMIN (Dashboard Evaluasi Organisasi)
  const periods = await getPerformancePeriods();
  const activePeriodRaw = await getActivePerformancePeriod(resolvedParams?.periodId);
  const departments = await getPerformanceDepartments();

  // Jika belum ada periode sama sekali di level organisasi
  if (!activePeriodRaw) {
    return (
      <div className="space-y-6">
        <div className="pb-4 border-b border-slate-200">
          <h1 className="text-xl font-bold text-slate-900 font-serif">Kinerja & Riset</h1>
          <p className="text-xs text-slate-500">
            Kelola formula sasaran riset kebijakan (*OKR/KPI*), evaluasi staf, dan rekap penilaian kinerja organisasi.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto shadow-sm">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-200">
            <Calendar className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">
            Belum Ada Periode Evaluasi Kinerja
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed mb-6">
            Mulai siklus evaluasi pertama untuk menetapkan sasaran riset (OKR) dan menginisiasi lembar penilaian staf PSPK.
          </p>
        </div>
      </div>
    );
  }

  const activePeriod = {
    id: activePeriodRaw.id,
    name: activePeriodRaw.name,
    startDate: activePeriodRaw.startDate.toISOString().split("T")[0]!,
    endDate: activePeriodRaw.endDate.toISOString().split("T")[0]!,
    status: activePeriodRaw.status,
  };

  const [stats, reviews] = await Promise.all([
    getPerformanceOverviewStats(activePeriodRaw.id),
    getPerformanceReviewsByPeriod(activePeriodRaw.id),
  ]);

  return (
    <PerformanceClientWrapper
      periods={periods}
      activePeriod={activePeriod}
      stats={stats}
      reviews={reviews}
      departments={departments}
    />
  );
}
