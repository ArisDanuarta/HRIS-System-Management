"use client";

import React from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Receipt,
  ArrowRight,
  BookOpen,
  CalendarCheck,
  ShieldCheck,
  Plus,
} from "lucide-react";
import { StaffDashboardData } from "@/server/queries/dashboard/staff-dashboard";
import { TodayAttendanceCard } from "@/components/absensi/today-attendance-card";
import { LeaveBalanceCards } from "@/components/cuti/leave-balance-cards";

interface StaffDashboardProps {
  data: StaffDashboardData;
  employeeName: string;
}

export function StaffDashboard({ data, employeeName }: StaffDashboardProps) {
  const formatDate = (d: Date) => {
    const dateObj = typeof d === "string" ? new Date(d) : d;
    return dateObj.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const annualLeave = data.leaveBalances.find((b) =>
    b.leaveType.name.toLowerCase().includes("tahunan"),
  );

  return (
    <div className="flex flex-col gap-6 max-w-[1440px] mx-auto pb-12 w-full animate-in fade-in duration-200">
      {/* Top Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#dee9fc]">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#74777f] mb-1">
            <span>Portal Karyawan Mandiri</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#f2af3e]" />
            <span>PSPK</span>
          </div>
          <h1 className="text-2xl sm:text-3xl text-[#102e50] font-heading font-bold tracking-tight">
            Halo, {employeeName}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Kelola kehadiran harian, kuota cuti kerja, serta informasi kepegawaian pribadi Anda.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/cuti/ajukan"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#102e50] text-white hover:bg-[#0c233d] text-xs sm:text-sm font-semibold transition-all shadow-xs cursor-pointer active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 text-[#ffddb0]" />
            <span>Ajukan Cuti Baru</span>
          </Link>
        </div>
      </div>

      {/* Widget 1: Kartu Absensi Hari Ini (Interactive check-in/out) */}
      <TodayAttendanceCard
        todayAttendance={data.todayAttendance}
        employeeName={employeeName}
      />

      {/* 3 Personal Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Metric 1: Sisa Cuti Tahunan */}
        <div className="bg-white rounded-xl border border-[#dee9fc] p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Sisa Cuti Tahunan
              </span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl sm:text-4xl font-extrabold text-[#102e50] font-heading leading-none">
                  {annualLeave ? annualLeave.remainingDays : 0}
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  / {annualLeave ? annualLeave.quotaDays : 12} Hari
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#eff4ff] text-[#102e50] flex items-center justify-center">
              <CalendarCheck className="w-5 h-5 text-[#102e50]" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Terpakai: {annualLeave ? annualLeave.usedDaysNumber : 0} hari
            </span>
            <Link
              href="/cuti"
              className="text-[#102e50] font-bold hover:underline inline-flex items-center gap-1"
            >
              <span>Detail</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Metric 2: Cuti Menunggu Persetujuan */}
        <div className="bg-white rounded-xl border border-[#dee9fc] p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Cuti Menunggu
              </span>
              <div className="flex items-baseline gap-2 mt-2">
                <span
                  className={`text-3xl sm:text-4xl font-extrabold font-heading leading-none ${
                    data.pendingLeavesCount > 0 ? "text-amber-600" : "text-[#102e50]"
                  }`}
                >
                  {data.pendingLeavesCount}
                </span>
                <span className="text-xs font-semibold text-slate-500">Permohonan</span>
              </div>
            </div>
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                data.pendingLeavesCount > 0
                  ? "bg-amber-50 text-amber-600"
                  : "bg-slate-50 text-slate-400"
              }`}
            >
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              {data.pendingLeavesCount > 0 ? "Menunggu respon atasan" : "Tidak ada antrean"}
            </span>
            <Link
              href="/cuti"
              className="text-[#102e50] font-bold hover:underline inline-flex items-center gap-1"
            >
              <span>Riwayat Cuti</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Metric 3: Slip Gaji Terbaru */}
        <div className="bg-white rounded-xl border border-[#dee9fc] p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Slip Gaji Terbaru
              </span>
              <div className="mt-2">
                {data.latestPayslip ? (
                  <span className="text-sm font-bold text-slate-800">
                    Periode {data.latestPayslip.month}/{data.latestPayslip.year}
                  </span>
                ) : (
                  <span className="text-xs text-slate-400 italic">
                    Belum ada slip terbit (Fase 4)
                  </span>
                )}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-500 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-slate-600" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400 text-[11px]">Dikelola oleh Keuangan</span>
            {data.latestPayslip ? (
              <Link href="/payroll" className="text-[#102e50] font-bold hover:underline">
                Lihat Slip
              </Link>
            ) : (
              <span className="text-slate-400 text-[11px]">Siap Fase 4</span>
            )}
          </div>
        </div>
      </div>

      {/* Widget 2: Rincian Kuota Saldo Cuti */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#102e50] font-heading uppercase tracking-wider">
            Hak Cuti & Kuota Tahun Berjalan
          </h2>
          <Link href="/cuti" className="text-xs font-semibold text-[#102e50] hover:underline">
            Lihat Semua Jenis
          </Link>
        </div>
        <LeaveBalanceCards balances={data.leaveBalances} />
      </div>

      {/* 2 Column Layout: Recent Leave Requests (Left) & SOP Guidelines (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: 5 Recent Leave Requests (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#dee9fc] shadow-xs flex flex-col overflow-hidden">
          <div className="p-5 border-b border-[#dee9fc] flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#102e50] font-heading">
                Pengajuan Cuti Terakhir
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Status riwayat permohonan cuti dan izin kerja pribadi Anda
              </p>
            </div>
            <Link
              href="/cuti"
              className="text-xs font-semibold text-[#102e50] hover:text-[#f2af3e] transition-colors inline-flex items-center gap-1"
            >
              <span>Semua Riwayat</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 overflow-x-auto">
            {data.recentLeaves.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center gap-2 text-slate-400">
                <FileText className="w-8 h-8 text-slate-300" />
                <p className="text-xs">Belum ada riwayat permohonan cuti yang diajukan.</p>
                <Link
                  href="/cuti/ajukan"
                  className="mt-1 text-xs font-bold text-[#102e50] hover:underline"
                >
                  + Ajukan Cuti Sekarang
                </Link>
              </div>
            ) : (
              data.recentLeaves.map((leave) => (
                <div
                  key={leave.id}
                  className="p-4 flex items-center justify-between gap-4 hover:bg-[#f8f9ff] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-slate-800 truncate">
                          {leave.leaveType.name}
                        </span>
                        <span className="text-[11px] font-bold text-[#102e50] bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                          {leave.days} Hari
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 mt-0.5">
                        {formatDate(leave.startDate)} s/d {formatDate(leave.endDate)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        leave.status === "APPROVED"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : leave.status === "PENDING"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-red-50 text-red-700 border border-red-200"
                      }`}
                    >
                      {leave.status === "APPROVED"
                        ? "Disetujui"
                        : leave.status === "PENDING"
                        ? "Menunggu"
                        : "Ditolak"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: SOP & Documents (1 col) */}
        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-xl border border-[#dee9fc] shadow-xs p-5 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-[#102e50] pb-2 border-b border-slate-100">
              <BookOpen className="w-4 h-4 text-[#f2af3e]" />
              <h3 className="text-xs font-bold uppercase tracking-wider">
                Dokumen & Panduan Staf
              </h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Akses cepat ketentuan kerja, pedoman cuti, dan standar operasional prosedur PSPK:
            </p>

            <div className="flex flex-col divide-y divide-slate-100 text-xs">
              <div className="py-2.5 flex items-center justify-between">
                <span className="font-semibold text-slate-700">Panduan Presensi & Cuti</span>
                <span className="text-[10px] px-2 py-0.5 bg-slate-100 rounded text-slate-600">SOP</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="font-semibold text-slate-700">Tata Kelola Riset & Etik</span>
                <span className="text-[10px] px-2 py-0.5 bg-slate-100 rounded text-slate-600">SOP</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="font-semibold text-slate-700">Kalender Kerja Lembaga 2026</span>
                <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-700 rounded font-bold">Resmi</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <div className="p-3 bg-[#eff4ff] rounded-lg text-xs text-[#102e50] flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-[#f2af3e] shrink-0 mt-0.5" />
                <span>
                  Pengajuan cuti wajib diajukan minimal <strong>3 hari kerja</strong> sebelum jadwal pelaksanaan.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
