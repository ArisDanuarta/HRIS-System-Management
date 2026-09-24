import React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession, getUserProfile } from "@pspk/auth";
import {
  getPerformancePeriods,
  getActivePerformancePeriod,
  getPerformanceOverviewStats,
  getPerformanceReviewsByPeriod,
  getPerformanceDepartments,
} from "@/server/queries/performance.queries";
import { PerformanceClientWrapper } from "@/components/kinerja/performance-client-wrapper";
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

  const userProfile = await getUserProfile(session.user.id);
  const roleKeys = userProfile?.roles.map((r) => r.role.key) || [];

  const isSuperAdmin = roleKeys.includes("super_admin");
  const isAdminHr = roleKeys.includes("admin_hr");

  // Proteksi Akses Wewenang Admin HR & Super Admin
  if (!isSuperAdmin && !isAdminHr) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto shadow-sm mt-8">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-200">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-2">
          Hak Akses Terbatas (Separation of Duties)
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed mb-6">
          Manajemen siklus evaluasi kinerja dan rekapitulasi penilaian lembaga hanya dapat diakses
          oleh Tim Administrator HR dan Pimpinan PSPK. Untuk melihat sasaran dan evaluasi diri Anda,
          silakan akses menu Kinerja Saya.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#102E50] text-white text-xs font-semibold rounded-xl hover:bg-[#1a4473] transition-colors"
        >
          Kembali ke Beranda
        </Link>
      </div>
    );
  }

  const resolvedParams = await searchParams;
  const periods = await getPerformancePeriods();
  const activePeriodRaw = await getActivePerformancePeriod(resolvedParams?.periodId);
  const departments = await getPerformanceDepartments();

  // Jika belum ada periode sama sekali
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
