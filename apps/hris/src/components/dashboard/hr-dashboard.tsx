"use client";

import React from "react";
import Link from "next/link";
import {
  Users,
  Upload,
  UserPlus,
  UserCheck,
  Clock,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  CalendarDays,
  CalendarCheck,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";
import { HrDashboardData } from "@/server/queries/dashboard/hr-dashboard";

interface HrDashboardProps {
  data: HrDashboardData;
  isSuperAdmin?: boolean;
}

export function HrDashboard({ data, isSuperAdmin = false }: HrDashboardProps) {
  const formatDate = (d: Date) => {
    const dateObj = typeof d === "string" ? new Date(d) : d;
    return dateObj.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Find max attendance value for 7-day bar chart scaling
  const maxDayCount = Math.max(
    ...data.trendDays.map((d) => d.present + d.late + d.leave + d.absent),
    data.totalActiveEmployees,
    1,
  );

  const totalContracts =
    data.contractStats.PERMANENT +
    data.contractStats.FIXED_TERM +
    data.contractStats.PART_TIME_PROJECT;

  const permanentPct =
    totalContracts > 0 ? Math.round((data.contractStats.PERMANENT / totalContracts) * 100) : 0;
  const fixedTermPct =
    totalContracts > 0 ? Math.round((data.contractStats.FIXED_TERM / totalContracts) * 100) : 0;
  const projectPct =
    totalContracts > 0 ? Math.round((data.contractStats.PART_TIME_PROJECT / totalContracts) * 100) : 0;

  return (
    <div className="flex flex-col gap-6 max-w-[1440px] mx-auto pb-12 w-full animate-in fade-in duration-200">
      {/* Super Admin Top Banner (Only if logged in as Super Admin) */}
      {isSuperAdmin && (
        <div className="p-4 rounded-xl bg-[#0c233d] text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#f2af3e] text-[#102e50] flex items-center justify-center shrink-0 font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white flex items-center gap-2">
                <span>Pusat Kendali Super Administrator PSPK</span>
                <span className="text-[10px] bg-[#f2af3e] text-[#102e50] font-bold px-2 py-0.2 rounded">
                  Akses Penuh
                </span>
              </p>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Kelola hak akses RBAC, pengguna sistem, inventaris aset, dan audit trail di portal System Management.
              </p>
            </div>
          </div>
          <a
            href={process.env.NEXT_PUBLIC_SYSMGMT_URL || "http://localhost:3002"}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all shrink-0 border border-white/20"
          >
            <span>Buka System Management</span>
            <ExternalLink className="w-3.5 h-3.5 text-[#ffddb0]" />
          </a>
        </div>
      )}

      {/* Header & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-[#dee9fc]">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#74777f] mb-1">
            <span>Portal HRIS Lembaga</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#f2af3e]" />
            <span>Tahun Operasional 2026</span>
          </div>
          <h1 className="text-2xl sm:text-3xl text-[#102e50] font-heading font-bold tracking-tight">
            Dashboard Eksekutif HR
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Pusat pemantauan data kepegawaian, distribusi riset, dan operasional seluruh SDM PSPK.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/karyawan/impor"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-[#dee9fc] text-[#102e50] hover:bg-[#eff4ff] text-xs sm:text-sm font-semibold transition-all shadow-xs cursor-pointer active:scale-[0.98]"
          >
            <Upload className="w-4 h-4 text-[#102e50]" />
            <span>Impor Data Excel</span>
          </Link>
          <Link
            href="/karyawan/baru"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#102e50] text-white hover:bg-[#0c233d] text-xs sm:text-sm font-semibold transition-all shadow-sm hover:shadow-md cursor-pointer active:scale-[0.98]"
          >
            <UserPlus className="w-4 h-4 text-[#ffddb0]" />
            <span>+ Tambah Pegawai Baru</span>
          </Link>
        </div>
      </div>

      {/* 4 Organisasi Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Pegawai Aktif */}
        <div className="bg-white p-5 rounded-xl border border-[#dee9fc] shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-medium text-slate-500">Pegawai Aktif</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl sm:text-4xl font-extrabold text-[#102e50] font-heading leading-none">
                  {data.totalActiveEmployees}
                </span>
                <span className="text-xs font-medium text-slate-500">Orang</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#eff4ff] text-[#102e50] flex items-center justify-center">
              <Users className="w-5 h-5 text-[#102e50]" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-emerald-700 font-semibold">Organisasi Keseluruhan</span>
            <Link href="/karyawan" className="text-[#102e50] font-bold hover:underline inline-flex items-center gap-1">
              <span>Direktori</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Card 2: Hadir Hari Ini */}
        <div className="bg-white p-5 rounded-xl border border-[#dee9fc] shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-medium text-slate-500">Hadir Hari Ini</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl sm:text-4xl font-extrabold text-emerald-700 font-heading leading-none">
                  {data.presentTodayCount}
                </span>
                <span className="text-xs font-medium text-slate-500">
                  / {data.totalActiveEmployees}
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-emerald-700 font-bold">{data.attendancePercentage}% Presensi</span>
            <Link href="/absensi/rekap" className="text-emerald-800 font-bold hover:underline inline-flex items-center gap-1">
              <span>Rekap</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Card 3: Cuti Menunggu Persetujuan */}
        <div className="bg-white p-5 rounded-xl border border-[#dee9fc] shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-medium text-slate-500">Cuti Menunggu</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span
                  className={`text-3xl sm:text-4xl font-extrabold font-heading leading-none ${
                    data.pendingLeavesCount > 0 ? "text-amber-600" : "text-[#102e50]"
                  }`}
                >
                  {data.pendingLeavesCount}
                </span>
                <span className="text-xs font-medium text-slate-500">Pengajuan</span>
              </div>
            </div>
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                data.pendingLeavesCount > 0
                  ? "bg-amber-50 text-amber-700"
                  : "bg-slate-50 text-slate-400"
              }`}
            >
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-[#805600] font-medium">Seluruh Departemen</span>
            <Link href="/cuti/persetujuan" className="text-amber-700 font-bold hover:underline inline-flex items-center gap-1">
              <span>Evaluasi</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Card 4: Kontrak Berakhir <= 30 Hari */}
        <div className="bg-white p-5 rounded-xl border border-[#dee9fc] shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-medium text-slate-500">Kontrak ≤ 30 Hari</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl sm:text-4xl font-extrabold text-[#ba1a1a] font-heading leading-none">
                  {data.expiringContractsCount}
                </span>
                <span className="text-xs font-medium text-slate-500">Kontrak</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-red-50 text-[#ba1a1a] flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-[#ba1a1a]" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-[#ba1a1a] font-semibold">Perlu Tinjauan PKWT</span>
            <Link href="/karyawan?expiring=true" className="text-[#ba1a1a] font-bold hover:underline inline-flex items-center gap-1">
              <span>Tinjau</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Main Grid: Charts & Action Center */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri: Charts (2 cols) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Grafik 1: Tren Kehadiran 7 Hari Terakhir */}
          <div className="bg-white rounded-xl border border-[#dee9fc] shadow-xs p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-[#102e50] font-heading">
                  Tren Presensi 7 Hari Terakhir
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Distribusi kehadiran harian pegawai aktif PSPK
                </p>
              </div>

              {/* Legenda */}
              <div className="flex items-center gap-3 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#102e50]" />
                  <span className="text-slate-600">Hadir / WFH</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#f2af3e]" />
                  <span className="text-slate-600">Terlambat</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-blue-400" />
                  <span className="text-slate-600">Cuti</span>
                </div>
              </div>
            </div>

            {/* Bar Chart Visual */}
            <div className="flex items-end justify-between gap-3 h-48 pt-6 px-2">
              {data.trendDays.map((day) => {
                const presentHeight = (day.present / maxDayCount) * 100;
                const lateHeight = (day.late / maxDayCount) * 100;
                const leaveHeight = (day.leave / maxDayCount) * 100;

                return (
                  <div key={day.dateStr} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                    <div className="w-full max-w-[36px] flex flex-col-reverse items-center gap-0.5 h-full justify-start">
                      {/* Bar 1: Hadir */}
                      <div
                        className="w-full bg-[#102e50] rounded-t-sm transition-all duration-300 hover:opacity-85"
                        style={{ height: `${Math.max(presentHeight, 2)}%` }}
                        title={`Hadir: ${day.present} orang`}
                      />
                      {/* Bar 2: Late */}
                      {day.late > 0 && (
                        <div
                          className="w-full bg-[#f2af3e] transition-all duration-300 hover:opacity-85"
                          style={{ height: `${lateHeight}%` }}
                          title={`Terlambat: ${day.late} orang`}
                        />
                      )}
                      {/* Bar 3: Leave */}
                      {day.leave > 0 && (
                        <div
                          className="w-full bg-blue-400 transition-all duration-300 hover:opacity-85"
                          style={{ height: `${leaveHeight}%` }}
                          title={`Cuti: ${day.leave} orang`}
                        />
                      )}
                    </div>
                    <span className="text-[11px] font-semibold text-slate-600 truncate">
                      {day.dayLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Grafik 2: Komposisi Tipe Kepegawaian */}
          <div className="bg-white rounded-xl border border-[#dee9fc] shadow-xs p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-[#102e50] font-heading">
                Komposisi Tipe Kepegawaian & Ikatan Kerja
              </h2>
              <span className="text-[11px] text-slate-500">{totalContracts} Kontrak Aktif</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Tetap (PKWTT)</span>
                  <span className="text-xs font-extrabold text-[#102e50]">{permanentPct}%</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-extrabold text-[#102e50]">
                    {data.contractStats.PERMANENT}
                  </span>
                  <span className="text-xs text-slate-500">Pegawai</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-[#102e50] rounded-full" style={{ width: `${permanentPct}%` }} />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Fixed-Term (PKWT)</span>
                  <span className="text-xs font-extrabold text-[#805600]">{fixedTermPct}%</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-extrabold text-[#805600]">
                    {data.contractStats.FIXED_TERM}
                  </span>
                  <span className="text-xs text-slate-500">Pegawai</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-[#f2af3e] rounded-full" style={{ width: `${fixedTermPct}%` }} />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Paruh Waktu / Proyek</span>
                  <span className="text-xs font-extrabold text-blue-700">{projectPct}%</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-extrabold text-blue-700">
                    {data.contractStats.PART_TIME_PROJECT}
                  </span>
                  <span className="text-xs text-slate-500">Pegawai</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${projectPct}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Perlu Tindakan & Sedang Cuti Hari Ini (1 col) */}
        <div className="flex flex-col gap-6">
          {/* Action Center: Perlu Tindakan Segera */}
          <div className="bg-white rounded-xl border border-[#dee9fc] shadow-xs p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between pb-3 border-b border-[#dee9fc]">
              <div className="flex items-center gap-2 text-[#102e50]">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <h2 className="text-sm font-bold font-heading">Perlu Tindakan HR</h2>
              </div>
              <span className="text-[11px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                Prioritas
              </span>
            </div>

            <div className="flex flex-col divide-y divide-slate-100 text-xs">
              {/* Expiring contracts notices */}
              {data.expiringContracts.map((c) => (
                <div key={c.id} className="py-2.5 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">{c.employeeName}</span>
                    <span className="text-[10px] font-bold text-red-700 bg-red-50 px-1.5 py-0.5 rounded">
                      Habis {formatDate(c.endDate)}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    {c.position} • {c.department}
                  </span>
                </div>
              ))}

              {/* Long pending leaves notices */}
              {data.pendingLeavesLong.map((pl) => (
                <div key={pl.id} className="py-2.5 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">{pl.employeeName}</span>
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                      Pending &gt; 2 hari
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    {pl.leaveTypeName} ({pl.days} hari)
                  </span>
                </div>
              ))}

              {data.expiringContracts.length === 0 && data.pendingLeavesLong.length === 0 && (
                <div className="py-4 text-center text-slate-400 italic">
                  Tidak ada tindakan mendesak saat ini. Semua operasional berjalan normal.
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <Link href="/karyawan?expiring=true" className="text-[#102e50] font-bold hover:underline">
                Kelola Kontrak
              </Link>
              <Link href="/cuti/persetujuan" className="text-[#805600] font-bold hover:underline">
                Persetujuan Cuti
              </Link>
            </div>
          </div>

          {/* Sedang Cuti Hari Ini */}
          <div className="bg-white rounded-xl border border-[#dee9fc] shadow-xs p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between pb-3 border-b border-[#dee9fc]">
              <div className="flex items-center gap-2 text-[#102e50]">
                <CalendarDays className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold font-heading">Sedang Cuti Hari Ini</h2>
              </div>
              <span className="text-[11px] text-slate-400 font-semibold">
                {data.onLeaveTodayList.length} Pegawai
              </span>
            </div>

            <div className="flex flex-col divide-y divide-slate-100 text-xs">
              {data.onLeaveTodayList.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-4 text-center">
                  Tidak ada karyawan yang tercatat cuti hari ini.
                </p>
              ) : (
                data.onLeaveTodayList.map((ol) => (
                  <div key={ol.id} className="py-2.5 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-800">{ol.employeeName}</span>
                      <span className="text-[11px] text-slate-400">{ol.department}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-100">
                      {ol.leaveTypeName}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
