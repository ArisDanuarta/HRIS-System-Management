"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  Briefcase,
  Clock,
  CalendarClock,
  Calendar,
  Users,
  Receipt,
  Landmark,
  FileText,
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
import { LeaveSettingsView } from "@/components/cuti/leave-settings-view";
import { SalaryComponentsTable } from "@/components/payroll/salary-components-table";
import { PayrollSettingsView } from "@/components/payroll/payroll-settings-view";
import type { EmploymentTypeDetail } from "@/server/queries/employment-type.queries";
import type { LeaveTypeItem } from "@/components/cuti/leave-settings-view";
import type { ActiveWorkSchedule } from "@/server/services/work-schedule.service";
import type { EmployeeLeaveBalanceOverview } from "@/server/queries/leave.queries";
import type { SalaryComponentItem } from "@/components/payroll/salary-component-modal";
import type { PayrollSettingsData } from "@/server/queries/payroll-settings.queries";

export type TataKelolaTab =
  // Group 1: Organisasi & Struktur
  | "organisasi"
  | "ikatan-kerja"
  // Group 2: Waktu & Aturan Cuti
  | "jadwal-kerja"
  | "jenis-cuti"
  | "hari-libur"
  | "saldo-cuti"
  // Group 3: Penggajian (Payroll)
  | "payroll-komponen"
  | "bank-pengirim"
  | "kop-dokumen"
  // Alias untuk kompatibilitas tautan lama
  | "jadwal-cuti"
  | "dokumen-bank";

export interface TataKelolaViewProps {
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
  employmentTypes: EmploymentTypeDetail[];
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
  salaryComponents: SalaryComponentItem[];
  payrollSettings: PayrollSettingsData;
  canManage: boolean;
}

const normalizeTab = (raw: string | null): TataKelolaTab => {
  if (!raw) return "organisasi";
  if (raw === "jadwal-cuti") return "jenis-cuti";
  if (raw === "dokumen-bank") return "bank-pengirim";

  const validTabs: TataKelolaTab[] = [
    "organisasi",
    "ikatan-kerja",
    "jadwal-kerja",
    "jenis-cuti",
    "hari-libur",
    "saldo-cuti",
    "payroll-komponen",
    "bank-pengirim",
    "kop-dokumen",
  ];

  return validTabs.includes(raw as TataKelolaTab) ? (raw as TataKelolaTab) : "organisasi";
};

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

  const activeTab = normalizeTab(searchParams.get("tab"));

  const handleTabChange = (newTab: TataKelolaTab) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", newTab);
    router.push(`?${params.toString()}`);
  };

  // Helper ekstrak kode singkat bank pengirim (misal: "Bank Negara Indonesia (BNI)" -> "BNI")
  const shortBankName = React.useMemo(() => {
    const raw = payrollSettings.senderBankName || "";
    const match = raw.match(/\(([^)]+)\)/);
    if (match && match[1]) return match[1].trim();
    const firstWord = raw.split(" ")[0];
    return firstWord ? firstWord.slice(0, 8) : "";
  }, [payrollSettings.senderBankName]);

  // Definisi Navigasi Sidebar Kiri yang Terkelompok Rapi
  const navGroups = [
    {
      title: "Organisasi & Jabatan",
      items: [
        {
          id: "organisasi" as TataKelolaTab,
          label: "Struktur Organisasi",
          icon: Building2,
          badge: String(orgStats.totalDepartments),
        },
        {
          id: "ikatan-kerja" as TataKelolaTab,
          label: "Status Kepegawaian",
          icon: Briefcase,
          badge: String(employmentTypes.length),
        },
      ],
    },
    {
      title: "Waktu & Aturan Cuti",
      items: [
        {
          id: "jadwal-kerja" as TataKelolaTab,
          label: "Jam Kerja Kantor",
          icon: Clock,
          badge: undefined,
        },
        {
          id: "jenis-cuti" as TataKelolaTab,
          label: "Master Jenis Cuti",
          icon: CalendarClock,
          badge: String(leaveTypes.length),
        },
        {
          id: "hari-libur" as TataKelolaTab,
          label: "Hari Libur & Cuti Bersama",
          icon: Calendar,
          badge: String(holidays.length),
        },
        {
          id: "saldo-cuti" as TataKelolaTab,
          label: "Saldo Cuti Pegawai",
          icon: Users,
          badge: String(employeeBalances.length),
        },
      ],
    },
    {
      title: "Penggajian (Payroll)",
      items: [
        {
          id: "payroll-komponen" as TataKelolaTab,
          label: "Komponen Gaji",
          icon: Receipt,
          badge: String(salaryComponents.length),
        },
        {
          id: "bank-pengirim" as TataKelolaTab,
          label: "Rekening Bank Lembaga",
          icon: Landmark,
          badge: shortBankName || undefined,
        },
        {
          id: "kop-dokumen" as TataKelolaTab,
          label: "Kop & Format Dokumen",
          icon: FileText,
          badge: undefined,
        },
      ],
    },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-[1440px] w-full min-w-0 mx-auto pb-16 animate-in fade-in duration-200">
      {/* 1. Baris Atas: Breadcrumb & Mode Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#102E50] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Beranda</span>
        </Link>

        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 self-start sm:self-auto">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>{canManage ? "Mode Kelola Master Penuh" : "Akses Hanya Baca"}</span>
        </div>
      </div>

      {/* 2. Header Utama Eksekutif */}
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
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl leading-relaxed">
            Pusat pengaturan data master HR: struktur organisasi divisi, status kepegawaian, jam kerja
            operasional, regulasi cuti tahunan, master komponen gaji, serta rekening resmi penggajian.
          </p>
        </div>
      </div>

      {/* 3. Ringkasan Statistik Global (Non-Klik, Murni Informatif) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full min-w-0">
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/90 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#102E50] flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 text-[#102E50]" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Struktur Organisasi
            </span>
            <span className="text-sm sm:text-base font-bold text-slate-900 truncate block">
              {orgStats.totalDepartments} Divisi
            </span>
            <span className="text-[11px] text-slate-500 truncate block">
              {orgStats.totalPositions} Formasi Jabatan
            </span>
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/90 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <Briefcase className="w-5 h-5 text-amber-700" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Status Pegawai
            </span>
            <span className="text-sm sm:text-base font-bold text-slate-900 truncate block">
              {employmentTypes.length} Tipe Kontrak
            </span>
            <span className="text-[11px] text-emerald-600 font-semibold truncate block">
              {employmentTypes.filter((t) => t.isActive).length} Skema Aktif
            </span>
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/90 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <CalendarClock className="w-5 h-5 text-emerald-700" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Regulasi Cuti & Libur
            </span>
            <span className="text-sm sm:text-base font-bold text-slate-900 truncate block">
              {leaveTypes.length} Jenis Cuti
            </span>
            <span className="text-[11px] text-slate-500 truncate block">
              {holidays.length} Hari Libur Nasional
            </span>
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/90 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
            <Receipt className="w-5 h-5 text-purple-700" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Master Penggajian
            </span>
            <span className="text-sm sm:text-base font-bold text-slate-900 truncate block">
              {salaryComponents.length} Komponen
            </span>
            <span className="text-[11px] text-slate-500 truncate block" title={payrollSettings.senderBankName}>
              Bank: {payrollSettings.senderBankName}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Selector Mobile (< lg): Dropdown Khusus Layar Ponsel */}
      <div className="lg:hidden w-full bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
        <label
          htmlFor="tata-kelola-mobile-select"
          className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider"
        >
          Pilih Kategori Pengaturan
        </label>
        <div className="relative">
          <select
            id="tata-kelola-mobile-select"
            value={activeTab}
            onChange={(e) => handleTabChange(e.target.value as TataKelolaTab)}
            className="w-full appearance-none bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-xs font-bold text-[#102E50] shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#102E50] focus:border-[#102E50] pr-10 cursor-pointer"
          >
            <optgroup label="── ORGANISASI & JABATAN ──">
              <option value="organisasi">🏢 Struktur Organisasi ({orgStats.totalDepartments})</option>
              <option value="ikatan-kerja">💼 Status Kepegawaian ({employmentTypes.length})</option>
            </optgroup>
            <optgroup label="── WAKTU & ATURAN CUTI ──">
              <option value="jadwal-kerja">⏰ Jam Kerja Kantor</option>
              <option value="jenis-cuti">📋 Master Jenis Cuti ({leaveTypes.length})</option>
              <option value="hari-libur">📅 Hari Libur & Cuti Bersama ({holidays.length})</option>
              <option value="saldo-cuti">👥 Saldo Cuti Pegawai ({employeeBalances.length})</option>
            </optgroup>
            <optgroup label="── PENGGAJIAN (PAYROLL) ──">
              <option value="payroll-komponen">🧾 Komponen Gaji ({salaryComponents.length})</option>
              <option value="bank-pengirim">🏛️ Rekening Bank Lembaga ({shortBankName || "Utama"})</option>
              <option value="kop-dokumen">📄 Kop & Format Dokumen</option>
            </optgroup>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-500">
            <SlidersHorizontal className="w-4 h-4 text-[#102E50]" />
          </div>
        </div>
      </div>

      {/* 5. Master-Detail Layout (Desktop Grid 12 Kolom) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Sisi Kiri: Sidebar Navigasi Menu Master Data (4 Kolom Desktop) */}
        <aside className="hidden lg:block lg:col-span-4 xl:col-span-4 lg:sticky lg:top-20 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3 space-y-5">
            {navGroups.map((group) => (
              <div key={group.title} className="space-y-1">
                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {group.title}
                </div>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const isActive = activeTab === item.id;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleTabChange(item.id)}
                        className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left ${
                          isActive
                            ? "bg-[#102E50] text-white shadow-xs font-bold"
                            : "text-slate-600 hover:text-[#102E50] hover:bg-slate-100/70"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon
                            className={`w-4 h-4 shrink-0 ${
                              isActive ? "text-[#F2AF3E]" : "text-slate-400"
                            }`}
                          />
                          <span className="truncate">{item.label}</span>
                        </div>
                        {item.badge && (
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 tabular-nums max-w-[80px] truncate ${
                              isActive
                                ? "bg-white/15 text-white font-bold"
                                : "bg-slate-100 text-slate-500 font-medium"
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Sisi Kanan: Konten Utama Master Data (8 Kolom Desktop) */}
        <main className="lg:col-span-8 xl:col-span-8 min-w-0 bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-7">
          {/* TAB 1: STRUKTUR DIVISI & JABATAN */}
          {activeTab === "organisasi" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900 font-serif">
                    Struktur Divisi & Formasi Jabatan
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Kelola hierarki divisi kerja, klasifikasi unit kerja, serta formasi jabatan resmi PSPK.
                  </p>
                </div>
                <Link
                  href="/karyawan/struktur"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#102E50] bg-[#eff4ff] border border-[#dee9fc] px-3.5 py-2 rounded-xl shadow-2xs hover:bg-[#dee9fc] transition-colors shrink-0 w-fit"
                >
                  <Network className="w-4 h-4 text-[#102E50]" />
                  <span>Lihat Visual Bagan Pohon ↗</span>
                </Link>
              </div>

              <OrganizationManagement initialDepartments={departments} />
            </div>
          )}

          {/* TAB 2: STATUS KEPEGAWAIAN (IKATAN KERJA) */}
          {activeTab === "ikatan-kerja" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-slate-200/80 pb-4">
                <h2 className="text-base font-bold text-slate-900 font-serif">
                  Master Status Kepegawaian & Perjanjian Kontrak
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Konfigurasi jenis perjanjian kerja (PKWTT, PKWT, Freelance, Magang), metode pengupahan
                  (Bulanan vs Per Jam), dan acuan tarif honorarium riset.
                </p>
              </div>

              <EmploymentTypeManagement initialTypes={employmentTypes} />
            </div>
          )}

          {/* TAB 3: JAM KERJA & TOLERANSI MASUK */}
          {activeTab === "jadwal-kerja" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <LeaveSettingsView
                leaveTypes={leaveTypes}
                holidays={holidays}
                workSchedule={workSchedule}
                employeeBalances={employeeBalances}
                defaultLeaveType={defaultLeaveType}
                activeSubTab="schedule"
                hideSubNav={true}
              />
            </div>
          )}

          {/* TAB 4: MASTER JENIS CUTI */}
          {activeTab === "jenis-cuti" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <LeaveSettingsView
                leaveTypes={leaveTypes}
                holidays={holidays}
                workSchedule={workSchedule}
                employeeBalances={employeeBalances}
                defaultLeaveType={defaultLeaveType}
                activeSubTab="types"
                hideSubNav={true}
              />
            </div>
          )}

          {/* TAB 5: HARI LIBUR & CUTI BERSAMA */}
          {activeTab === "hari-libur" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <LeaveSettingsView
                leaveTypes={leaveTypes}
                holidays={holidays}
                workSchedule={workSchedule}
                employeeBalances={employeeBalances}
                defaultLeaveType={defaultLeaveType}
                activeSubTab="holidays"
                hideSubNav={true}
              />
            </div>
          )}

          {/* TAB 6: KUOTA SALDO CUTI PEGAWAI */}
          {activeTab === "saldo-cuti" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <LeaveSettingsView
                leaveTypes={leaveTypes}
                holidays={holidays}
                workSchedule={workSchedule}
                employeeBalances={employeeBalances}
                defaultLeaveType={defaultLeaveType}
                activeSubTab="balances"
                hideSubNav={true}
              />
            </div>
          )}

          {/* TAB 7: KOMPONEN GAJI & TUNJANGAN */}
          {activeTab === "payroll-komponen" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <SalaryComponentsTable components={salaryComponents} isEmbedded={true} />
            </div>
          )}

          {/* TAB 8: REKENING BANK PENGIRIM */}
          {activeTab === "bank-pengirim" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <PayrollSettingsView
                initialSettings={payrollSettings}
                isEmbedded={true}
                activeSubTab="bank"
                hideSubNav={true}
              />
            </div>
          )}

          {/* TAB 9: KOP DOKUMEN & FORMAT SLIP */}
          {activeTab === "kop-dokumen" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <PayrollSettingsView
                initialSettings={payrollSettings}
                isEmbedded={true}
                activeSubTab="document"
                hideSubNav={true}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
