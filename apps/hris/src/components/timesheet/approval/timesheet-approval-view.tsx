"use client";

import React from "react";
import { Clock, CheckCircle2, AlertTriangle, Users } from "lucide-react";
import { TimesheetApprovalItem } from "./timesheet-approval-modal";
import { TimesheetApprovalTable } from "./timesheet-approval-table";

interface TimesheetApprovalStats {
  totalAssigned: number;
  needsReviewCount: number;
  approvedCount: number;
  rejectedCount: number;
  totalHoursApproved: number;
  totalHoursPending: number;
}

interface TimesheetApprovalViewProps {
  items: TimesheetApprovalItem[];
  stats: TimesheetApprovalStats;
  currentEmployeeId: string;
  initialSubmissionId?: string;
}

export function TimesheetApprovalView({
  items,
  stats,
  currentEmployeeId,
  initialSubmissionId,
}: TimesheetApprovalViewProps) {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-[#102e50] text-[#ffddb0] text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
              Tim & Approval
            </span>
            <span className="text-slate-400 text-xs">•</span>
            <span className="text-slate-500 text-xs font-medium">Verifikasi Jam Kerja</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 font-serif">Persetujuan Timesheet</h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Tinjau lembar waktu Google Spreadsheet karyawan freelance dan berikan persetujuan (ACC)
            jam kerja sebelum periode penggajian diproses oleh HR.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Antrean Butuh Review */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold text-amber-800">Menunggu Review</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.needsReviewCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            {stats.totalHoursPending} jam kerja menanti ACC
          </div>
        </div>

        {/* 2. Disetujui (ACC) */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold text-emerald-800">Sudah Anda ACC</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-700">{stats.approvedCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            {stats.totalHoursApproved} jam kerja disetujui
          </div>
        </div>

        {/* 3. Ditolak / Revisi */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold text-rose-800">Ditolak / Revisi</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 border border-rose-100">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.rejectedCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Perlu perbaikan dari staf</div>
        </div>

        {/* 4. Total Ditugaskan */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold text-slate-700">Total Tugas Review</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 border border-slate-200">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.totalAssigned}</div>
          <div className="text-[11px] text-slate-500 mt-1">Pengajuan tim freelance</div>
        </div>
      </div>

      {/* Table */}
      <TimesheetApprovalTable
        items={items}
        currentEmployeeId={currentEmployeeId}
        initialSubmissionId={initialSubmissionId}
      />
    </div>
  );
}
