"use client";

import React, { useState } from "react";
import Link from "next/link";
import { formatDate } from "@pspk/shared";
import {
  Clock,
  UserCheck,
  Calendar,
  Laptop,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Briefcase,
  Building2,
  MapPin,
  FileText,
  Shield,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { calculateProfileCompleteness } from "@/lib/profile-completeness";
import { EmployeeMonthlyAttendanceOverview } from "@/server/queries/attendance.queries";
import { StatusBadge, ContractTypeBadge } from "../status-badge";

export interface EmployeeOverviewTabProps {
  employee: {
    id: string;
    employeeNo: string;
    fullName: string;
    nickname?: string | null;
    gender?: string | null;
    photoKey?: string | null;
    joinDate: Date | string;
    status: string;
    address?: string | null;
    addresses?: Array<{ type: string; street?: string | null }>;
    emergencyContactName?: string | null;
    emergencyContactPhone?: string | null;
    familyMembers?: Array<unknown>;
    educations?: Array<unknown>;
    workExperiences?: Array<unknown>;
    documents?: Array<{ category: string }>;
    hasKtp?: boolean;
    hasNpwp?: boolean;
    hasDiploma?: boolean;
    hasCv?: boolean;
    hasBankAccount?: boolean;
    bankAccountEnc?: string | null;
    bankAccountMasked?: string | null;
    bankName?: string | null;
    currentDepartment?: { id: string; name: string } | null;
    currentPosition?: { id: string; title: string } | null;
    manager?: { id: string; fullName: string; currentPosition?: { title: string } | null } | null;
    workLocation?: { name: string } | null;
    legalEntity?: { name: string } | null;
    contracts: Array<{
      id: string;
      type: string;
      status: string;
      startDate: Date | string;
      endDate?: Date | string | null;
      notes?: string | null;
      employmentTypeMaster?: { name: string; code: string } | null;
    }>;
  };
  attendanceOverview?: EmployeeMonthlyAttendanceOverview | null;
  activeAssetsCount?: number;
  isHrOrAdmin?: boolean;
}

function formatTenure(joinDate: Date | string): string {
  const start = new Date(joinDate);
  const now = new Date();
  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();

  if (now.getDate() < start.getDate()) {
    months--;
  }
  if (months < 0) {
    years--;
    months += 12;
  }

  if (years <= 0 && months <= 0) {
    return "< 1 Bulan";
  }
  if (years <= 0) {
    return `${months} Bulan`;
  }
  if (months === 0) {
    return `${years} Tahun`;
  }
  return `${years} Thn ${months} Bln`;
}

export function EmployeeOverviewTab({
  employee,
  attendanceOverview,
  activeAssetsCount = 0,
  isHrOrAdmin = false,
}: EmployeeOverviewTabProps) {
  const [showChecklistDetails, setShowChecklistDetails] = useState(false);

  // 1. Kalkulasi Kelengkapan Profil
  const completeness = calculateProfileCompleteness(employee);

  // 2. Kontrak Aktif
  const activeContract = employee.contracts?.find((c) => c.status === "ACTIVE") || null;
  let daysUntilExpiry: number | null = null;
  let isExpiringSoon = false;

  if (activeContract?.endDate) {
    const end = new Date(activeContract.endDate);
    const now = new Date();
    const diffMs = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays >= 0 && diffDays <= 45) {
      isExpiringSoon = true;
      daysUntilExpiry = diffDays;
    }
  }

  // 3. Saldo Cuti
  const leaveBalances = attendanceOverview?.leaveBalances || [];
  const totalRemainingDays = leaveBalances.reduce(
    (acc, lb) => acc + Number(lb.remainingDays),
    0,
  );
  const annualLeave = leaveBalances.find(
    (lb) =>
      lb.leaveTypeName.toLowerCase().includes("tahunan") ||
      lb.leaveTypeName.toLowerCase().includes("annual"),
  );

  // Helper untuk mengekstrak nomor kontrak dari catatan [Nomor: ...]
  const extractContractNumber = (notesStr?: string | null) => {
    if (!notesStr) return "-";
    const match = notesStr.match(/\[Nomor:\s*([^\]]+)\]/);
    return match && match[1] ? match[1].trim() : "-";
  };

  return (
    <div className="flex flex-col gap-6 w-full min-w-0">
      {/* 1. Grid 4 Kartu Skor KPI Utama */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        {/* KPI 1: Masa Kerja */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4.5 shadow-xs flex flex-col justify-between hover:border-[#102E50]/30 transition-all">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Masa Kerja
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#102E50]/10 text-[#102E50] flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 text-[#102E50]" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-xl sm:text-2xl font-bold font-heading text-[#102E50]">
              {formatTenure(employee.joinDate)}
            </div>
            <span className="text-[11px] text-slate-500 block mt-0.5 truncate">
              Bergabung sejak {formatDate(employee.joinDate)}
            </span>
          </div>
        </div>

        {/* KPI 2: Kehadiran Bulan Ini */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4.5 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
              Kehadiran ({attendanceOverview?.period.monthName || "Bulan Ini"})
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <UserCheck className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-xl sm:text-2xl font-bold font-heading text-emerald-700">
              {attendanceOverview ? `${attendanceOverview.stats.attendanceRate}%` : "—"}
            </div>
            <span className="text-[11px] text-slate-500 block mt-0.5 truncate">
              {attendanceOverview
                ? `${attendanceOverview.stats.presentCount + attendanceOverview.stats.wfhCount} hadir dari ${attendanceOverview.stats.workingDaysCount} hari kerja`
                : "Belum ada catatan presensi"}
            </span>
          </div>
        </div>

        {/* KPI 3: Sisa Cuti Tahunan */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4.5 shadow-xs flex flex-col justify-between hover:border-sky-300 transition-all">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-sky-800 uppercase tracking-wider">
              Sisa Saldo Cuti
            </span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4 text-sky-600" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-xl sm:text-2xl font-bold font-heading text-sky-800">
              {annualLeave ? `${annualLeave.remainingDays} Hari` : `${totalRemainingDays} Hari`}
            </div>
            <span className="text-[11px] text-slate-500 block mt-0.5 truncate">
              {annualLeave
                ? `Cuti Tahunan (dari ${annualLeave.quotaDays} hari kuota)`
                : "Total saldo cuti aktif"}
            </span>
          </div>
        </div>

        {/* KPI 4: Aset Kantor yang Dibawa */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4.5 shadow-xs flex flex-col justify-between hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
              Aset Dipinjamkan
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
              <Laptop className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-xl sm:text-2xl font-bold font-heading text-slate-800">
              {activeAssetsCount} Unit
            </div>
            <span className="text-[11px] text-slate-500 block mt-0.5 truncate">
              {activeAssetsCount > 0
                ? "Perangkat kantor aktif"
                : "Tidak ada pinjaman aset"}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Kartu Progress Kelengkapan Profil 360° */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                completeness.percentage === 100
                  ? "bg-emerald-100 text-emerald-800"
                  : completeness.percentage >= 70
                    ? "bg-[#102E50]/10 text-[#102E50]"
                    : "bg-amber-100 text-amber-800"
              }`}
            >
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-[#102E50] font-heading">
                  Kelengkapan Berkas & Data Profil
                </h3>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                    completeness.percentage === 100
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : completeness.percentage >= 70
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : "bg-amber-50 text-amber-800 border-amber-200"
                  }`}
                >
                  {completeness.percentage}% Lengkap
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {completeness.completedCount} dari {completeness.totalCount} komponen data
                pendaftaran telah terisi dan terverifikasi di sistem.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowChecklistDetails(!showChecklistDetails)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#102E50] bg-slate-100 hover:bg-slate-200/80 transition-colors cursor-pointer self-start sm:self-auto shrink-0"
          >
            <span>{showChecklistDetails ? "Sembunyikan Rincian" : "Lihat Checklist"}</span>
            {showChecklistDetails ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Progress Bar Visual */}
        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              completeness.percentage === 100
                ? "bg-emerald-600"
                : completeness.percentage >= 70
                  ? "bg-gradient-to-r from-[#102E50] to-[#F2AF3E]"
                  : "bg-amber-500"
            }`}
            style={{ width: `${completeness.percentage}%` }}
          />
        </div>

        {/* Collapsible Rincian Checklist */}
        {showChecklistDetails && (
          <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 animate-in fade-in duration-200">
            {completeness.items.map((item) => (
              <div
                key={item.key}
                className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs transition-all ${
                  item.isComplete
                    ? "bg-slate-50/70 border-slate-200/80 text-slate-700"
                    : "bg-amber-50/50 border-amber-200/70 text-amber-900"
                }`}
              >
                {item.isComplete ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div className="flex flex-col min-w-0">
                  <span className="font-semibold">{item.label}</span>
                  <span className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                    {item.description}
                  </span>
                  {!item.isComplete && (
                    <span className="text-[10px] font-bold text-amber-700 mt-1 uppercase tracking-wide">
                      Belum dilengkapi
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Grid Penempatan Organisasi & Kontrak Kerja */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        {/* Kolom Kiri: Penempatan Organisasi */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col gap-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Building2 className="w-4 h-4 text-[#102E50]" />
            <h3 className="font-bold text-sm text-[#102E50] font-heading">
              Penempatan Organisasi
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3.5 gap-x-3 text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5">Departemen / Divisi</span>
              <span className="font-semibold text-slate-800">
                {employee.currentDepartment?.name || "Belum ditentukan"}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">Jabatan / Posisi</span>
              <span className="font-semibold text-slate-800">
                {employee.currentPosition?.title || "Belum ditentukan"}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">Atasan Langsung</span>
              {employee.manager ? (
                <Link
                  href={`/karyawan/${employee.manager.id}`}
                  className="font-semibold text-[#102E50] hover:underline inline-flex items-center gap-1 truncate"
                >
                  <span>{employee.manager.fullName}</span>
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </Link>
              ) : (
                <span className="text-slate-400 italic">Direksi / Mandiri</span>
              )}
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">Status Kepegawaian</span>
              <StatusBadge status={employee.status} size="sm" />
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">Lokasi Kerja</span>
              <div className="flex items-center gap-1 text-slate-700 font-medium">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">
                  {employee.workLocation?.name || "Kantor Pusat PSPK"}
                </span>
              </div>
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">Entitas Hukum / TKU</span>
              <span className="font-semibold text-slate-800 truncate">
                {employee.legalEntity?.name || "Pusat Studi Pendidikan dan Kebijakan"}
              </span>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Status Kontrak & Kompensasi */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col gap-4 justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-[#102E50]" />
                <h3 className="font-bold text-sm text-[#102E50] font-heading">
                  Ikatan Kerja & Kontrak Aktif
                </h3>
              </div>
              {activeContract && (
                <ContractTypeBadge
                  type={activeContract.type}
                  label={activeContract.employmentTypeMaster?.name}
                />
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3.5 gap-x-3 text-xs mt-3.5">
              <div>
                <span className="text-slate-400 block mb-0.5">Nomor Kontrak Kerja</span>
                <span className="font-mono font-semibold text-slate-800">
                  {extractContractNumber(activeContract?.notes)}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Status Kontrak</span>
                <span className="font-semibold text-slate-800">
                  {activeContract ? activeContract.status : "Belum Ada Kontrak"}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Tanggal Mulai Berlaku</span>
                <span className="font-semibold text-slate-800 font-mono">
                  {activeContract?.startDate ? formatDate(activeContract.startDate) : "-"}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Tanggal Berakhir Kontrak</span>
                <span className="font-semibold text-slate-800 font-mono">
                  {activeContract?.endDate ? formatDate(activeContract.endDate) : "PKWTT / Tetap"}
                </span>
              </div>
            </div>

            {/* Alert jika Kontrak Mendekati Jatuh Tempo */}
            {isExpiringSoon && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2.5 text-xs text-amber-900 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Kontrak kerja aktif ini akan berakhir dalam{" "}
                  <strong>{daysUntilExpiry} hari</strong> lagi. Segera persiapkan evaluasi
                  perpanjangan atau pembaruan SK.
                </span>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Total riwayat kontrak: <strong>{employee.contracts.length} Dokumen</strong>
            </span>
            <Link
              href={`/karyawan/${employee.id}?tab=kontrak`}
              className="text-[#102E50] font-semibold hover:underline inline-flex items-center gap-1"
            >
              <span>Lihat Rincian Kontrak</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* 4. Baris Pintasan Cepat (Quick Shortcuts Hub) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Link
          href={`/karyawan/${employee.id}?tab=biodata`}
          className="p-3.5 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 hover:border-[#102E50]/40 transition-all shadow-2xs flex items-center gap-3 group"
        >
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-slate-800 group-hover:text-[#102E50]">
              Biodata & Keluarga
            </span>
            <span className="text-[11px] text-slate-400 truncate">
              Alamat, riwayat studi & karir
            </span>
          </div>
        </Link>

        <Link
          href={`/karyawan/${employee.id}?tab=absensi`}
          className="p-3.5 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 hover:border-emerald-300 transition-all shadow-2xs flex items-center gap-3 group"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-700">
              Absensi & Cuti
            </span>
            <span className="text-[11px] text-slate-400 truncate">
              Log harian & sisa kuota cuti
            </span>
          </div>
        </Link>

        <Link
          href={`/karyawan/${employee.id}?tab=dokumen`}
          className="p-3.5 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 hover:border-amber-300 transition-all shadow-2xs flex items-center gap-3 group"
        >
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <FileText className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-slate-800 group-hover:text-amber-700">
              Dokumen Digital
            </span>
            <span className="text-[11px] text-slate-400 truncate">
              {employee.documents?.length || 0} berkas terunggah
            </span>
          </div>
        </Link>

        {isHrOrAdmin && (
          <Link
            href={`/karyawan/${employee.id}?tab=sensitif`}
            className="p-3.5 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 hover:border-purple-300 transition-all shadow-2xs flex items-center gap-3 group"
          >
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Shield className="w-4 h-4 text-purple-600" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-slate-800 group-hover:text-purple-700">
                Data Sensitif & Bank
              </span>
              <span className="text-[11px] text-slate-400 truncate">
                NIK, NPWP, Payroll Bank
              </span>
            </div>
          </Link>
        )}
      </div>
    </div>
  );
}
