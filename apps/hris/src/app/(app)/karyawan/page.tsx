import React from "react";
import Link from "next/link";
import { Plus, Upload, Users, UserCheck, Clock } from "lucide-react";
import { getEmployeesDirectory, getOrgStructureData } from "@/server/queries/employee.queries";
import { EmployeeTable } from "@/components/karyawan/employee-table";
import { EmployeeFilterBar } from "@/components/karyawan/employee-filter-bar";
import { ExpiringContractAlert } from "@/components/karyawan/expiring-contract-alert";

export const dynamic = "force-dynamic";

interface KaryawanPageProps {
  searchParams: Promise<{
    search?: string;
    dept?: string;
    status?: string;
    type?: string;
    expiring?: string;
    page?: string;
  }>;
}

export default async function KaryawanPage({ searchParams }: KaryawanPageProps) {
  const resolvedParams = await searchParams;
  const page = parseInt(resolvedParams.page || "1", 10);
  const search = resolvedParams.search || "";
  const departmentId = resolvedParams.dept || "ALL";
  const status = resolvedParams.status || "ALL";
  const type = resolvedParams.type || "ALL";
  const expiringSoonOnly = resolvedParams.expiring === "true";

  // Parallel data fetching via Server Component
  const [directoryData, departments] = await Promise.all([
    getEmployeesDirectory({
      search,
      departmentId,
      status,
      type,
      expiringSoonOnly,
      page,
      pageSize: 10,
    }),
    getOrgStructureData(),
  ]);

  return (
    <div className="flex flex-col gap-6 max-w-[1400px] mx-auto pb-12">
      {/* Header & Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#102E50] font-heading tracking-tight">
              Direktori Pegawai
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#feba48]/20 text-[#805600] border border-[#feba48]/30">
              Admin HR
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Kelola data induk karyawan, penempatan tim riset, kontrak kerja, dan hierarki organisasi PSPK.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/karyawan/impor"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 transition-all cursor-pointer active:scale-[0.98] shadow-xs"
          >
            <Upload className="w-4 h-4 text-slate-500" />
            <span>Impor Excel</span>
          </Link>

          <Link
            href="/karyawan/baru"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#102E50] text-white hover:bg-[#0c233d] transition-all cursor-pointer active:scale-[0.98] shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Pegawai</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Metric 1: Total Active */}
        <div className="bg-white rounded-xl border border-slate-200 p-4.5 shadow-xs flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Pegawai Aktif
            </span>
            <span className="text-2xl sm:text-3xl font-bold text-[#102E50] font-heading mt-1">
              {directoryData.stats.totalActive}
            </span>
            <span className="text-[11px] text-emerald-600 font-medium mt-0.5">
              Terdaftar dalam sistem
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 2: Probation */}
        <div className="bg-white rounded-xl border border-slate-200 p-4.5 shadow-xs flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Masa Percobaan
            </span>
            <span className="text-2xl sm:text-3xl font-bold text-[#805600] font-heading mt-1">
              {directoryData.stats.totalProbation}
            </span>
            <span className="text-[11px] text-amber-600 font-medium mt-0.5">
              Evaluasi kinerja berjalan
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-[#805600] flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 3: Expiring Soon */}
        <div className="bg-white rounded-xl border border-slate-200 p-4.5 shadow-xs flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Kontrak Habis ≤ 30 Hari
            </span>
            <span className="text-2xl sm:text-3xl font-bold text-[#A8281C] font-heading mt-1">
              {directoryData.stats.totalContractsExpiring}
            </span>
            <span className="text-[11px] text-[#A8281C] font-medium mt-0.5">
              Perlu tinjauan perpanjangan
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-red-50 text-[#A8281C] flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Expiring PKWT Alert Banner */}
      <ExpiringContractAlert count={directoryData.stats.totalContractsExpiring} />

      {/* Filter Bar */}
      <EmployeeFilterBar
        departments={departments}
        currentSearch={search}
        currentDepartmentId={departmentId}
        currentStatus={status}
        currentType={type}
      />

      {/* Employee Data Table */}
      <EmployeeTable
        items={directoryData.items}
        total={directoryData.total}
        page={directoryData.page}
        pageSize={directoryData.pageSize}
        totalPages={directoryData.totalPages}
      />
    </div>
  );
}
