import React from "react";
import Link from "next/link";
import { ArrowLeft, Briefcase, Building2, CheckCircle2, Clock, Plus } from "lucide-react";
import { getEmploymentTypes } from "@/server/queries/employment-type.queries";
import { EmploymentTypeManagement } from "@/components/karyawan/employment-type-management";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Pengaturan Tipe Ikatan Kerja — HRIS PSPK",
  description: "Kelola master tipe perjanjian kerja, skema penggajian, dan tarif acuan",
};

export default async function IkatanKerjaPage() {
  const employmentTypes = await getEmploymentTypes();

  const hourlyTypesCount = employmentTypes.filter((t) => t.wageType === "HOURLY").length;
  const monthlyTypesCount = employmentTypes.filter((t) => t.wageType === "MONTHLY").length;
  const activeTypesCount = employmentTypes.filter((t) => t.isActive).length;

  return (
    <div className="flex flex-col gap-6 max-w-[1400px] mx-auto pb-16">
      {/* Navigation Breadcrumb & Quick Jump */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Link
          href="/karyawan"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#102E50] transition-colors w-fit"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Direktori Pegawai</span>
        </Link>

        <Link
          href="/karyawan/organisasi"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#102E50] bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs hover:bg-slate-50 transition-colors"
        >
          <Building2 className="w-3.5 h-3.5 text-slate-500" />
          <span>Ke Struktur Divisi & Formasi Jabatan</span>
        </Link>
      </div>

      {/* Header & Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#102E50] font-heading tracking-tight">
              Pengaturan Tipe Ikatan Kerja
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#feba48]/20 text-[#805600] border border-[#feba48]/30">
              Admin HR
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Kelola master tipe perjanjian kerja (Pegawai Tetap, PKWT Riset, Freelance Upah Per Jam, Magang), skema kompensasi, dan tarif acuan organisasi PSPK.
          </p>
        </div>
      </div>

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4.5 shadow-xs flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Ikatan Kerja
            </span>
            <span className="text-2xl sm:text-3xl font-bold text-[#102E50] font-heading mt-1">
              {employmentTypes.length}
            </span>
            <span className="text-[11px] text-emerald-600 font-medium mt-0.5">
              {activeTypesCount} tipe berstatus aktif
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-[#102E50] flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4.5 shadow-xs flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Skema Per Jam (Timesheet)
            </span>
            <span className="text-2xl sm:text-3xl font-bold text-amber-700 font-heading mt-1">
              {hourlyTypesCount}
            </span>
            <span className="text-[11px] text-amber-600/90 font-medium mt-0.5">
              Upah durasi kerja (No Work No Pay)
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4.5 shadow-xs flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Skema Gaji Bulanan
            </span>
            <span className="text-2xl sm:text-3xl font-bold text-slate-800 font-heading mt-1">
              {monthlyTypesCount}
            </span>
            <span className="text-[11px] text-slate-400 font-medium mt-0.5">
              Gaji pokok bulanan tetap
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <Briefcase className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Interactive Table */}
      <EmploymentTypeManagement initialTypes={employmentTypes} />
    </div>
  );
}
