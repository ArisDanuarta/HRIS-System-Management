import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ArrowLeft, Building2 } from "lucide-react";
import { getSession, getUserProfile } from "@pspk/auth";
import { getOrgChartData } from "@/server/queries/org-chart.queries";
import { OrgChartView } from "@/components/karyawan/org-chart-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Bagan Struktur Organisasi — HRIS PSPK",
  description: "Visualisasi peta hierarki kepemimpinan, rantai koordinasi, dan struktur tim di lingkungan PSPK.",
};

export default async function StrukturOrganisasiPage() {
  const reqHeaders = await headers();
  const session = await getSession(reqHeaders);

  if (!session || !session.user) {
    redirect("/login");
  }

  const userProfile = await getUserProfile(session.user.id);
  const roleKeys = userProfile?.roles.map((r) => r.role.key) || [];
  const isHrOrAdmin = roleKeys.includes("super_admin") || roleKeys.includes("admin_hr");

  const chartData = await getOrgChartData();

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto pb-16">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Link
          href="/karyawan"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#102E50] transition-colors w-fit"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Direktori Karyawan</span>
        </Link>

        <div className="flex items-center gap-2">
          {isHrOrAdmin && (
            <Link
              href="/karyawan/organisasi"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#102E50] bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs hover:bg-slate-50 transition-colors"
            >
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Kelola Divisi & Jabatan ↗</span>
            </Link>
          )}
        </div>
      </div>

      {/* Header & Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#102E50] font-heading tracking-tight">
              Bagan Struktur Organisasi
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#102E50]/10 text-[#102E50] border border-[#102E50]/20">
              Peta Tim & Koordinasi PSPK
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Visualisasi pohon hierarki berjenjang, rantai koordinasi vertikal, dan formasi kepemimpinan seluruh unit kerja PSPK.
          </p>
        </div>
      </div>

      {/* Interactive Org Chart */}
      <OrgChartView data={chartData} isHrOrAdmin={isHrOrAdmin} />
    </div>
  );
}
