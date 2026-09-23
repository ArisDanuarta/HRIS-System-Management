import React from "react";
import Link from "next/link";
import { ArrowLeft, Building2, Briefcase, Users } from "lucide-react";
import { getOrgStructureDetail } from "@/server/queries/employee.queries";
import { OrganizationManagement } from "@/components/karyawan/organization-management";

export const dynamic = "force-dynamic";

export default async function OrganisasiPage() {
  const { departments, stats } = await getOrgStructureDetail();

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
              Struktur Organisasi & Formasi Jabatan
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#feba48]/20 text-[#805600] border border-[#feba48]/30">
              Admin HR
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Kelola master data divisi/departemen kerja dan daftar formasi jabatan riset di lingkungan PSPK.
          </p>
        </div>
      </div>

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Metric 1: Total Divisi */}
        <div className="bg-white rounded-xl border border-slate-200 p-4.5 shadow-xs flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Divisi
            </span>
            <span className="text-2xl sm:text-3xl font-bold text-[#102E50] font-heading mt-1">
              {stats.totalDepartments}
            </span>
            <span className="text-[11px] text-slate-400 font-medium mt-0.5">
              Departemen operasional & riset
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-[#102E50] flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 2: Formasi Jabatan */}
        <div className="bg-white rounded-xl border border-slate-200 p-4.5 shadow-xs flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Formasi Jabatan
            </span>
            <span className="text-2xl sm:text-3xl font-bold text-[#102E50] font-heading mt-1">
              {stats.totalPositions}
            </span>
            <span className="text-[11px] text-slate-400 font-medium mt-0.5">
              Posisi riset & manajerial
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-[#F2AF3E] flex items-center justify-center">
            <Briefcase className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 3: Pegawai Terpetakan */}
        <div className="bg-white rounded-xl border border-slate-200 p-4.5 shadow-xs flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Pegawai Terpetakan
            </span>
            <span className="text-2xl sm:text-3xl font-bold text-[#102E50] font-heading mt-1">
              {stats.mappedEmployeesCount}
            </span>
            <span className="text-[11px] text-emerald-600 font-medium mt-0.5">
              Telah memiliki divisi & jabatan aktif
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Interactive Organization View */}
      <OrganizationManagement initialDepartments={departments} />
    </div>
  );
}
