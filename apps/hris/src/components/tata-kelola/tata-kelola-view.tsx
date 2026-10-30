"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  Briefcase,
  CalendarClock,
  Receipt,
  Landmark,
  ShieldCheck,
  SlidersHorizontal,
  ArrowLeft,
  Network,
} from "lucide-react";
import {
  OrganizationManagement,
  type DepartmentItem,
} from "@/components/karyawan/organization-management";
import { EmploymentTypeManagement } from "@/components/karyawan/employment-type-management";
import type { EmploymentTypeDetail } from "@/server/queries/employment-type.queries";
import type { LeaveTypeItem } from "@/components/cuti/leave-settings-view";
import type { ActiveWorkSchedule } from "@/server/services/work-schedule.service";
import type { EmployeeLeaveBalanceOverview } from "@/server/queries/leave.queries";
import type { SalaryComponentItem } from "@/components/payroll/salary-component-modal";
import type { PayrollSettingsData } from "@/server/queries/payroll-settings.queries";

export type TataKelolaTab =
  | "organisasi"
  | "ikatan-kerja"
  | "jadwal-cuti"
  | "payroll-komponen"
  | "dokumen-bank";

export interface TataKelolaViewProps {
  // Data Tab 1: Struktur Organisasi
  departments: DepartmentItem[];
  orgStats: {
    totalDepartments: number;
    totalPositions: number;
    mappedEmployeesCount: number;
    byType?: {
      GOVERNANCE: number;
      LEADERSHIP: number;
      INITIATIVE: number;
      SUPPORT: number;
    };
  };

  // Data Tab 2: Tipe Ikatan Kerja
  employmentTypes: EmploymentTypeDetail[];

  // Data Tab 3: Jam Kerja & Cuti
  leaveTypes: LeaveTypeItem[];
  holidays: Array<{
    id: string;
    date: Date;
    name: string;
    isCollectiveLeave: boolean;
  }>;
  workSchedule?: ActiveWorkSchedule;
  employeeBalances: EmployeeLeaveBalanceOverview[];
  defaultLeaveType?: { id: string; name: string } | null;

  // Data Tab 4: Komponen Penggajian
  salaryComponents: SalaryComponentItem[];

  // Data Tab 5: Kop Surat & Rekening Penggajian
  payrollSettings: PayrollSettingsData;

  // State
  canManage: boolean;
}

export function TataKelolaView({
  departments,
  orgStats,
  employmentTypes,
  leaveTypes,
  holidays,
  workSchedule,
  employeeBalances,
  defaultLeaveType,
  salaryComponents,
  payrollSettings,
  canManage,
}: TataKelolaViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabParam = searchParams.get("tab") as TataKelolaTab | null;
  const validTabs: TataKelolaTab[] = [
    "organisasi",
    "ikatan-kerja",
    "jadwal-cuti",
    "payroll-komponen",
    "dokumen-bank",
  ];

  const currentTab: TataKelolaTab =
    tabParam && validTabs.includes(tabParam) ? tabParam : "organisasi";

  const [activeTab, setActiveTab] = useState<TataKelolaTab>(currentTab);

  const handleTabChange = (newTab: TataKelolaTab) => {
    setActiveTab(newTab);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", newTab);
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto pb-16 animate-in fade-in duration-200">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#102E50] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Beranda</span>
        </Link>

        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>{canManage ? "Mode Pengelola Master Penuh" : "Akses Hanya Baca"}</span>
        </div>
      </div>

      {/* Header Utama Eksekutif */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#102E50] font-heading tracking-tight flex items-center gap-2.5">
              <SlidersHorizontal className="w-6 h-6 text-[#102E50]" />
              <span>Tata Kelola & Master HR</span>
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#feba48]/20 text-[#805600] border border-[#feba48]/30">
              Admin HR
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl">
            Pusat konfigurasi terpadu tata kelola kepegawaian PSPK: struktur formasi divisi, jenis
            ikatan kerja, regulasi jam operasional & cuti, master komponen gaji, serta rekening bank
            resmi pengirim penggajian.
          </p>
        </div>
      </div>

      {/* 4 Kartu Metrik Ringkasan Tata Kelola */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Struktur & Jabatan */}
        <div
          onClick={() => handleTabChange("organisasi")}
          className={`p-4 rounded-xl border bg-white shadow-2xs transition cursor-pointer hover:shadow-xs hover:border-[#102E50]/40 ${
            activeTab === "organisasi" ? "border-[#102E50] ring-1 ring-[#102E50]/20" : "border-slate-200"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#102E50] flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Struktur Divisi
              </div>
              <div className="text-lg font-bold text-slate-900 mt-0.5">
                {orgStats.totalDepartments} Divisi
              </div>
            </div>
          </div>
          <div className="text-[11px] text-slate-500 mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
            <span>Formasi Jabatan</span>
            <span className="font-semibold text-slate-700">{orgStats.totalPositions} Posisi</span>
          </div>
        </div>

        {/* Card 2: Tipe Ikatan Kerja */}
        <div
          onClick={() => handleTabChange("ikatan-kerja")}
          className={`p-4 rounded-xl border bg-white shadow-2xs transition cursor-pointer hover:shadow-xs hover:border-[#102E50]/40 ${
            activeTab === "ikatan-kerja" ? "border-[#102E50] ring-1 ring-[#102E50]/20" : "border-slate-200"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Ikatan Kerja
              </div>
              <div className="text-lg font-bold text-slate-900 mt-0.5">
                {employmentTypes.length} Tipe Kontrak
              </div>
            </div>
          </div>
          <div className="text-[11px] text-slate-500 mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
            <span>Skema Aktif</span>
            <span className="font-semibold text-emerald-600">
              {employmentTypes.filter((t) => t.isActive).length} Aktif
            </span>
          </div>
        </div>

        {/* Card 3: Kebijakan Cuti & Jam Kerja */}
        <div
          onClick={() => handleTabChange("jadwal-cuti")}
          className={`p-4 rounded-xl border bg-white shadow-2xs transition cursor-pointer hover:shadow-xs hover:border-[#102E50]/40 ${
            activeTab === "jadwal-cuti" ? "border-[#102E50] ring-1 ring-[#102E50]/20" : "border-slate-200"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <CalendarClock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Jadwal & Cuti
              </div>
              <div className="text-lg font-bold text-slate-900 mt-0.5">
                {leaveTypes.length} Jenis Cuti
              </div>
            </div>
          </div>
          <div className="text-[11px] text-slate-500 mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
            <span>Hari Libur Nasional</span>
            <span className="font-semibold text-slate-700">{holidays.length} Hari</span>
          </div>
        </div>

        {/* Card 4: Komponen Payroll & Bank */}
        <div
          onClick={() => handleTabChange("payroll-komponen")}
          className={`p-4 rounded-xl border bg-white shadow-2xs transition cursor-pointer hover:shadow-xs hover:border-[#102E50]/40 ${
            activeTab === "payroll-komponen" || activeTab === "dokumen-bank"
              ? "border-[#102E50] ring-1 ring-[#102E50]/20"
              : "border-slate-200"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Gaji & Rekening
              </div>
              <div className="text-lg font-bold text-slate-900 mt-0.5">
                {salaryComponents.length} Komponen
              </div>
            </div>
          </div>
          <div className="text-[11px] text-slate-500 mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
            <span>Bank Pengirim</span>
            <span className="font-semibold text-slate-700 truncate max-w-[130px]" title={payrollSettings.senderBankName}>
              {payrollSettings.senderBankName}
            </span>
          </div>
        </div>
      </div>

      {/* Navigasi 5 Tab Terpusat */}
      <div className="flex border-b border-slate-200 overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => handleTabChange("organisasi")}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold transition-all border-b-2 -mb-px whitespace-nowrap ${
            activeTab === "organisasi"
              ? "border-[#102E50] text-[#102E50] bg-slate-50/70"
              : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
          }`}
        >
          <Building2 className="w-4 h-4 shrink-0" />
          <span>Struktur Divisi & Jabatan</span>
          <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600 font-mono">
            {orgStats.totalDepartments}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("ikatan-kerja")}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold transition-all border-b-2 -mb-px whitespace-nowrap ${
            activeTab === "ikatan-kerja"
              ? "border-[#102E50] text-[#102E50] bg-slate-50/70"
              : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
          }`}
        >
          <Briefcase className="w-4 h-4 shrink-0" />
          <span>Tipe Ikatan Kerja</span>
          <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800 font-mono font-bold">
            {employmentTypes.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("jadwal-cuti")}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold transition-all border-b-2 -mb-px whitespace-nowrap ${
            activeTab === "jadwal-cuti"
              ? "border-[#102E50] text-[#102E50] bg-slate-50/70"
              : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
          }`}
        >
          <CalendarClock className="w-4 h-4 shrink-0" />
          <span>Jam Kerja, Cuti & Libur</span>
          <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-mono">
            {leaveTypes.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("payroll-komponen")}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold transition-all border-b-2 -mb-px whitespace-nowrap ${
            activeTab === "payroll-komponen"
              ? "border-[#102E50] text-[#102E50] bg-slate-50/70"
              : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
          }`}
        >
          <Receipt className="w-4 h-4 shrink-0" />
          <span>Komponen Gaji & Tunjangan</span>
          <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-purple-100 text-purple-800 font-mono">
            {salaryComponents.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("dokumen-bank")}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold transition-all border-b-2 -mb-px whitespace-nowrap ${
            activeTab === "dokumen-bank"
              ? "border-[#102E50] text-[#102E50] bg-slate-50/70"
              : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
          }`}
        >
          <Landmark className="w-4 h-4 shrink-0" />
          <span>Kop Dokumen & Rekening Bank</span>
        </button>
      </div>

      {/* Kontainer Isi Tab Terpilih */}
      <div className="mt-4">
        {activeTab === "organisasi" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Quick Link & Context Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4.5 rounded-xl border border-slate-200 shadow-2xs">
              <div>
                <h2 className="text-base font-bold text-slate-900 font-serif">
                  Struktur Divisi & Formasi Jabatan
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Kelola hierarki divisi kerja, unit kerja (Governance, Leadership, Initiative, Support), serta formasi jabatan resmi PSPK.
                </p>
              </div>
              <Link
                href="/karyawan/struktur"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#102E50] bg-[#eff4ff] border border-[#dee9fc] px-3.5 py-2 rounded-lg shadow-2xs hover:bg-[#dee9fc] transition-colors shrink-0 w-fit"
              >
                <Network className="w-4 h-4 text-[#102E50]" />
                <span>Lihat Visual Bagan Pohon ↗</span>
              </Link>
            </div>

            <OrganizationManagement initialDepartments={departments} />
          </div>
        )}

        {activeTab === "ikatan-kerja" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header Konteks Ikatan Kerja */}
            <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-2xs">
              <h2 className="text-base font-bold text-slate-900 font-serif">
                Master Tipe Ikatan Kerja & Perjanjian Kontrak
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Konfigurasi master kategori perjanjian kerja (PKWTT, PKWT, Freelance, Magang), metode pengupahan (Bulanan vs Per Jam), dan tarif acuan honorarium riset.
              </p>
            </div>

            <EmploymentTypeManagement initialTypes={employmentTypes} />
          </div>
        )}

        {activeTab === "jadwal-cuti" && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-2">
            <h2 className="text-base font-bold text-slate-900">Jam Kerja Operasional, Master Cuti & Libur Nasional</h2>
            <p className="text-xs text-slate-500">
              Jadwal aktif: {workSchedule?.name || "Reguler"}, {leaveTypes.length} jenis cuti, {holidays.length} hari libur, {employeeBalances.length} catatan saldo pegawai (tipe default: {defaultLeaveType?.name || "-"}).
            </p>
          </div>
        )}

        {activeTab === "payroll-komponen" && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-2">
            <h2 className="text-base font-bold text-slate-900">Master Komponen Gaji & Tunjangan</h2>
            <p className="text-xs text-slate-500">
              Terdapat {salaryComponents.length} komponen penggajian standar yang terdaftar di sistem.
            </p>
          </div>
        )}

        {activeTab === "dokumen-bank" && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-2">
            <h2 className="text-base font-bold text-slate-900">Kop Dokumen & Rekening Bank Pengirim</h2>
            <p className="text-xs text-slate-500">
              Rekening resmi operasional penggajian: {payrollSettings.senderBankName} atas nama {payrollSettings.senderAccountName}.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
