import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getOrgStructureDetail } from "@/server/queries/employee.queries";
import { getEmploymentTypes } from "@/server/queries/employment-type.queries";
import { OrganizationPageView } from "@/components/karyawan/organization-page-view";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Struktur Organisasi & Kepegawaian — HRIS PSPK",
  description: "Kelola divisi, formasi jabatan, dan master tipe ikatan kerja",
};

export default async function OrganisasiPage() {
  const [{ departments, stats }, employmentTypes] = await Promise.all([
    getOrgStructureDetail(),
    getEmploymentTypes(),
  ]);

  return (
    <div className="flex flex-col gap-6 max-w-[1400px] mx-auto pb-16">
      {/* Navigation Breadcrumb */}
      <Link
        href="/karyawan"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#102E50] transition-colors w-fit"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Kembali ke Direktori Pegawai</span>
      </Link>

      {/* Header & Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#102E50] font-heading tracking-tight">
              Struktur Organisasi & Kepegawaian
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#feba48]/20 text-[#805600] border border-[#feba48]/30">
              Admin HR
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Kelola master data divisi/departemen kerja, daftar formasi jabatan riset, serta master tipe ikatan kerja di lingkungan PSPK.
          </p>
        </div>
      </div>

      {/* Main Interactive Tabbed View */}
      <OrganizationPageView
        departments={departments}
        stats={stats}
        employmentTypes={employmentTypes}
      />
    </div>
  );
}

