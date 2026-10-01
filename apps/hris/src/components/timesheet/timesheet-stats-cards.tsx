"use client";

import React from "react";
import { Clock, CheckCircle2, FileSpreadsheet, Wallet } from "lucide-react";
import { formatRupiah } from "@pspk/shared";

interface TimesheetStatsCardsProps {
  stats: {
    totalSubmissions: number;
    totalHoursApproved: number;
    totalHoursPending: number;
    approvedCount: number;
    pendingCount: number;
  };
  hourlyRate?: number | null;
}

export function TimesheetStatsCards({ stats, hourlyRate }: TimesheetStatsCardsProps) {
  const estimatedApprovedPay = hourlyRate ? stats.totalHoursApproved * hourlyRate : null;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Jam Kerja Disetujui */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-semibold text-emerald-800">Jam Disetujui (ACC)</span>
          <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-emerald-950 tracking-tight">
          {stats.totalHoursApproved}{" "}
          <span className="text-xs font-normal text-slate-400">Jam</span>
        </div>
        <div className="text-[11px] text-emerald-700 font-medium mt-2">
          {stats.approvedCount} pengajuan lolos verifikasi
        </div>
      </div>

      {/* 2. Jam Kerja Menunggu Review */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-semibold text-amber-800">Menunggu Review</span>
          <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-amber-950 tracking-tight">
          {stats.totalHoursPending}{" "}
          <span className="text-xs font-normal text-slate-400">Jam</span>
        </div>
        <div className="text-[11px] text-amber-700 font-medium mt-2">
          {stats.pendingCount} pengajuan sedang diproses lead
        </div>
      </div>

      {/* 3. Total Berkas Pengajuan */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-semibold text-slate-600">Total Pengajuan</span>
          <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-[#102E50]">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-slate-900 tracking-tight">
          {stats.totalSubmissions}{" "}
          <span className="text-xs font-normal text-slate-400">Periode</span>
        </div>
        <div className="text-[11px] text-slate-500 mt-2">
          Akumulasi riwayat timesheet Anda
        </div>
      </div>

      {/* 4. Estimasi Upah Disetujui / Tarif Jam */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-semibold text-sky-800">Estimasi Upah Disetujui</span>
          <div className="w-8 h-8 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600 border border-sky-100">
            <Wallet className="w-4 h-4" />
          </div>
        </div>
        <div className="text-lg font-bold font-mono text-slate-900 tracking-tight truncate">
          {estimatedApprovedPay !== null ? formatRupiah(estimatedApprovedPay) : "Sesuai Kontrak"}
        </div>
        <div className="text-[11px] text-slate-400 mt-2 truncate">
          {hourlyRate ? `Tarif: ${formatRupiah(hourlyRate)} / jam` : "Tarif per jam belum diatur"}
        </div>
      </div>
    </div>
  );
}
