"use client";

import React from "react";
import {
  User,
  Mail,
  Phone,
  Shield,
  Calendar,
  Building2,
  Briefcase,
  Clock,
  IdCard,
  Info,
  CheckCircle2,
  BadgeCheck,
  Award,
} from "lucide-react";
import { formatDate } from "@pspk/shared";
import type { UserProfileData } from "@/server/queries/profile.queries";

interface ProfileInfoTabProps {
  profile: UserProfileData;
}

function calculateTenure(hireDateStr: string | null): string {
  if (!hireDateStr) return "-";
  const hireDate = new Date(hireDateStr);
  if (isNaN(hireDate.getTime())) return "-";
  const now = new Date();

  let years = now.getFullYear() - hireDate.getFullYear();
  let months = now.getMonth() - hireDate.getMonth();

  if (months < 0) {
    years--;
    months += 12;
  }

  if (years === 0 && months === 0) {
    return "Kurang dari 1 bulan";
  }

  const parts: string[] = [];
  if (years > 0) parts.push(`${years} Tahun`);
  if (months > 0) parts.push(`${months} Bulan`);
  return parts.join(" ");
}

function getEmploymentTypeLabel(type?: string): string {
  switch (type?.toUpperCase()) {
    case "PERMANENT":
      return "Karyawan Tetap (PKWTT)";
    case "CONTRACT":
    case "FIXED_TERM":
      return "Karyawan Kontrak (PKWT)";
    case "INTERN":
      return "Magang (Internship)";
    case "PROBATION":
      return "Masa Percobaan";
    case "CONSULTANT":
      return "Konsultan Ahli";
    case "PART_TIME_PROJECT":
      return "Proyek / Paruh Waktu";
    default:
      return type || "Karyawan";
  }
}

function getRoleBadgeStyle(roleKey: string) {
  switch (roleKey) {
    case "super_admin":
      return {
        bg: "bg-purple-50 text-purple-700 border-purple-200",
        dot: "bg-purple-500",
      };
    case "admin_hr":
      return {
        bg: "bg-blue-50 text-blue-700 border-blue-200",
        dot: "bg-blue-600",
      };
    case "manager":
      return {
        bg: "bg-amber-50 text-amber-700 border-amber-200",
        dot: "bg-amber-500",
      };
    default:
      return {
        bg: "bg-slate-50 text-slate-700 border-slate-200",
        dot: "bg-emerald-500",
      };
  }
}

export function ProfileInfoTab({ profile }: ProfileInfoTabProps) {
  const employee = profile.employee;

  return (
    <div className="space-y-6">
      {/* 1. DATA KEPEGAWAIAN RESMI (JIKA ADA RECORD EMPLOYEE) */}
      {employee ? (
        <div className="bg-white rounded-2xl border border-[#dee9fc] shadow-xs overflow-hidden">
          <div className="px-6 py-4.5 bg-gradient-to-r from-[#eff4ff]/80 to-white border-b border-[#dee9fc] flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#102e50] text-[#f2af3e] flex items-center justify-center shadow-xs">
                <IdCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#102e50] font-heading leading-tight">
                  Data Kepegawaian & Penugasan Riset
                </h3>
                <p className="text-xs text-[#74777f] mt-0.5">
                  Informasi resmi status kerja dan penempatan di PSPK
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                {employee.status === "ACTIVE" ? "Aktif Bekerja" : employee.status}
              </span>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* NIP */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-[#74777f] uppercase tracking-wider flex items-center gap-1.5">
                  <BadgeCheck className="w-3.5 h-3.5 text-[#102e50]" />
                  Nomor Induk Pegawai (NIP)
                </span>
                <div className="px-3.5 py-2.5 rounded-xl bg-[#f8fafd] border border-[#dee9fc]/60 text-sm font-bold text-[#102e50] font-mono">
                  {employee.employeeNo}
                </div>
              </div>

              {/* Nama Lengkap */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-[#74777f] uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#102e50]" />
                  Nama Lengkap (Sesuai SK/KTP)
                </span>
                <div className="px-3.5 py-2.5 rounded-xl bg-[#f8fafd] border border-[#dee9fc]/60 text-sm font-semibold text-[#121c2a]">
                  {employee.fullName}
                  {employee.nickname && (
                    <span className="text-xs text-[#74777f] font-normal ml-1.5">
                      ({employee.nickname})
                    </span>
                  )}
                </div>
              </div>

              {/* Email Kerja */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-[#74777f] uppercase tracking-wider flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#102e50]" />
                  Email Kerja Resmi
                </span>
                <div className="px-3.5 py-2.5 rounded-xl bg-[#f8fafd] border border-[#dee9fc]/60 text-sm font-semibold text-[#121c2a] truncate">
                  {employee.workEmail}
                </div>
              </div>

              {/* Divisi / Departemen */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-[#74777f] uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-[#102e50]" />
                  Divisi / Departemen
                </span>
                <div className="px-3.5 py-2.5 rounded-xl bg-[#f8fafd] border border-[#dee9fc]/60 text-sm font-semibold text-[#121c2a]">
                  {employee.department || "Belum Ditetapkan"}
                </div>
              </div>

              {/* Jabatan / Posisi */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-[#74777f] uppercase tracking-wider flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-[#102e50]" />
                  Jabatan / Posisi
                </span>
                <div className="px-3.5 py-2.5 rounded-xl bg-[#f8fafd] border border-[#dee9fc]/60 text-sm font-semibold text-[#121c2a]">
                  {employee.position || "Belum Ditetapkan"}
                </div>
              </div>

              {/* Tipe Karyawan */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-[#74777f] uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-[#102e50]" />
                  Status Ikatan Kerja
                </span>
                <div className="px-3.5 py-2.5 rounded-xl bg-[#f8fafd] border border-[#dee9fc]/60 text-sm font-semibold text-[#121c2a]">
                  {getEmploymentTypeLabel(employee.employmentType ?? undefined)}
                </div>
              </div>

              {/* No. Telepon */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-[#74777f] uppercase tracking-wider flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#102e50]" />
                  No. Telepon / WhatsApp
                </span>
                <div className="px-3.5 py-2.5 rounded-xl bg-[#f8fafd] border border-[#dee9fc]/60 text-sm font-semibold text-[#121c2a]">
                  {employee.phone || (
                    <span className="text-[#74777f] italic font-normal">Belum dilengkapi</span>
                  )}
                </div>
              </div>

              {/* Tanggal Bergabung */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-[#74777f] uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#102e50]" />
                  Tanggal Bergabung (Join Date)
                </span>
                <div className="px-3.5 py-2.5 rounded-xl bg-[#f8fafd] border border-[#dee9fc]/60 text-sm font-semibold text-[#121c2a]">
                  {employee.joinDate ? formatDate(employee.joinDate) : "-"}
                </div>
              </div>

              {/* Masa Kerja */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-[#74777f] uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#102e50]" />
                  Masa Kerja Terhitung
                </span>
                <div className="px-3.5 py-2.5 rounded-xl bg-[#eff4ff]/60 border border-[#dee9fc] text-sm font-bold text-[#102e50]">
                  {calculateTenure(employee.joinDate)}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* JIKA AKUN TIDAK MEMILIKI RECORD KEPEGAWAIAN (MIS. SUPER ADMIN MURNI) */
        <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200 text-amber-900 flex items-start gap-4">
          <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold text-sm text-amber-950">
              Akun Pengelola Tanpa Profil Kepegawaian Internal
            </p>
            <p className="text-amber-800 leading-relaxed">
              Akun ini terdaftar sebagai akun sistem dengan hak akses fungsional langsung.
              Jika Anda merupakan staf atau peneliti aktif PSPK yang memerlukan integrasi data absensi,
              cuti, dan penggajian, silakan hubungi Tim HR untuk melakukan penautan akun pegawai.
            </p>
          </div>
        </div>
      )}

      {/* 2. DATA AKUN & HAK AKSES SISTEM */}
      <div className="bg-white rounded-2xl border border-[#dee9fc] shadow-xs overflow-hidden">
        <div className="px-6 py-4.5 bg-gradient-to-r from-[#eff4ff]/80 to-white border-b border-[#dee9fc] flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#102e50] text-[#f2af3e] flex items-center justify-center shadow-xs">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#102e50] font-heading leading-tight">
                Identitas Akun & Hak Akses Sistem
              </h3>
              <p className="text-xs text-[#74777f] mt-0.5">
                Kredensial otentikasi terpusat dan wewenang pengguna pada platform PSPK
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                profile.isActive
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-rose-50 text-rose-700 border border-rose-200"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {profile.isActive ? "Akun Aktif" : "Akun Ditangguhkan"}
            </span>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Nama Akun */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-[#74777f] uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#102e50]" />
                Nama Tampilan Akun
              </span>
              <div className="px-3.5 py-2.5 rounded-xl bg-[#f8fafd] border border-[#dee9fc]/60 text-sm font-semibold text-[#121c2a]">
                {profile.name}
              </div>
            </div>

            {/* Email Akun */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-[#74777f] uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#102e50]" />
                Email Masuk (Login)
              </span>
              <div className="px-3.5 py-2.5 rounded-xl bg-[#f8fafd] border border-[#dee9fc]/60 text-sm font-semibold text-[#121c2a] truncate">
                {profile.email}
              </div>
            </div>

            {/* Tanggal Pendaftaran Akun */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-[#74777f] uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#102e50]" />
                Akun Terdaftar Sejak
              </span>
              <div className="px-3.5 py-2.5 rounded-xl bg-[#f8fafd] border border-[#dee9fc]/60 text-sm font-semibold text-[#121c2a]">
                {formatDate(profile.createdAt)}
              </div>
            </div>

            {/* Daftar Peran Sistem PSPK */}
            <div className="space-y-1.5 md:col-span-2 lg:col-span-3">
              <span className="text-xs font-semibold text-[#74777f] uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-[#102e50]" />
                Peran & Otorisasi RBAC PSPK
              </span>
              <div className="p-3 rounded-xl bg-[#f8fafd] border border-[#dee9fc]/60 flex flex-wrap items-center gap-2">
                {profile.roles.length > 0 ? (
                  profile.roles.map((r) => {
                    const style = getRoleBadgeStyle(r.key);
                    return (
                      <span
                        key={r.key}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border ${style.bg}`}
                      >
                        <span className={`w-2 h-2 rounded-full ${style.dot}`} />
                        {r.name}
                        <span className="text-[10px] font-mono opacity-70">({r.key})</span>
                      </span>
                    );
                  })
                ) : (
                  <span className="text-xs text-[#74777f] italic">
                    Belum ada peran khusus yang dialokasikan
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. PANDUAN PEMBARUAN DATA RESMI */}
      <div className="p-4.5 rounded-2xl bg-[#eff4ff]/60 border border-[#dee9fc] flex items-start gap-3.5 text-[#43474e]">
        <Info className="w-5 h-5 text-[#102e50] shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed space-y-1">
          <p className="font-bold text-[#102e50]">Pembaruan Data Resmi Kepegawaian</p>
          <p className="text-[#43474e]">
            Data kepegawaian resmi seperti NIP, Departemen/Divisi Riset, Posisi, Nomor Rekening Gaji,
            dan Tipe Perjanjian Kerja diatur terpusat oleh Departemen HR untuk memastikan akurasi data
            administrasi dan kepatuhan perpajakan/BPJS. Silakan hubungi bagian HR untuk pengajuan pembaruan data resmi.
          </p>
        </div>
      </div>
    </div>
  );
}
