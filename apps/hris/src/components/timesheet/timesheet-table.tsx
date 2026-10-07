"use client";

import React, { useState, useMemo, useTransition } from "react";
import {
  Search,
  Filter,
  FileSpreadsheet,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Trash2,
  RefreshCw,
  Layers,
} from "lucide-react";
import { TimesheetSubmissionItem } from "@/server/queries/timesheet.queries";
import { TimesheetDetailModal } from "./timesheet-detail-modal";
import { cancelTimesheetSubmissionAction } from "@/server/actions/timesheet.actions";

interface TimesheetTableProps {
  submissions: TimesheetSubmissionItem[];
}

const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export function TimesheetTable({ submissions }: TimesheetTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedSubmission, setSelectedSubmission] = useState<TimesheetSubmissionItem | null>(
    null,
  );
  const [detailOpen, setDetailOpen] = useState(false);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((s) => {
      // 1. Search
      if (search.trim() !== "") {
        const q = search.toLowerCase().trim();
        const matchTitle = s.title.toLowerCase().includes(q);
        const matchReviewer = s.reviewers.some((r) => r.reviewerName.toLowerCase().includes(q));
        if (!matchTitle && !matchReviewer) return false;
      }

      // 2. Status
      if (statusFilter !== "ALL" && s.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [submissions, search, statusFilter]);

  const handleCancel = (submission: TimesheetSubmissionItem) => {
    if (
      !window.confirm(
        `Batalkan pengajuan timesheet "${submission.title}"? Data yang dibatalkan tidak dapat dikembalikan.`,
      )
    ) {
      return;
    }

    setCancelingId(submission.id);
    startTransition(async () => {
      const res = await cancelTimesheetSubmissionAction(submission.id);
      setCancelingId(null);
      if (!res.ok) {
        alert(res.error || "Gagal membatalkan timesheet.");
      }
    });
  };

  const getStatusBadge = (st: string) => {
    switch (st) {
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Menunggu Review
          </span>
        );
      case "IN_REVIEW":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-500 animate-spin" />
            Sedang Direview
          </span>
        );
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Disetujui (ACC)
          </span>
        );
      case "REVISION_REQUESTED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-200">
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            Perlu Revisi
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-600">{st}</span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari judul timesheet atau nama atasan penilai..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-[#102E50] rounded-xl text-xs font-medium outline-hidden transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              aria-label="Filter Status Timesheet"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 outline-hidden cursor-pointer"
            >
              <option value="ALL">Semua Status</option>
              <option value="PENDING">Menunggu Review</option>
              <option value="IN_REVIEW">Sedang Direview</option>
              <option value="APPROVED">Disetujui Penuh (ACC)</option>
              <option value="REVISION_REQUESTED">Perlu Revisi</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Periode & Judul Tugas</th>
                <th className="py-3 px-4 text-center">Jam Kerja</th>
                <th className="py-3 px-4 text-center">Google Spreadsheet</th>
                <th className="py-3 px-4">Atasan Penilai</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <Layers className="w-5 h-5" />
                      </div>
                      <p className="font-medium text-slate-600">Belum ada pengajuan timesheet</p>
                      <p className="text-[11px] text-slate-400">
                        Klik tombol &ldquo;Ajukan Timesheet Baru&rdquo; untuk mengirimkan laporan
                        jam kerja Google Spreadsheet Anda.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSubmissions.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60 transition-colors group">
                    {/* 1. Periode & Judul */}
                    <td className="py-3 px-4">
                      <div>
                        <span className="font-bold text-slate-900 block group-hover:text-[#102E50] transition-colors">
                          {s.title}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {MONTH_NAMES[s.periodMonth - 1]} {s.periodYear}
                        </span>
                      </div>
                    </td>

                    {/* 2. Total Jam */}
                    <td className="py-3 px-4 text-center">
                      <span className="font-mono font-bold text-slate-900 text-sm bg-slate-100/80 px-2.5 py-1 rounded-lg border border-slate-200/60">
                        {s.totalHours}{" "}
                        <span className="text-[10px] font-normal text-slate-500">Jam</span>
                      </span>
                    </td>

                    {/* 3. Link Spreadsheet */}
                    <td className="py-3 px-4 text-center">
                      <a
                        href={s.spreadsheetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200/80 rounded-lg hover:bg-emerald-100 hover:border-emerald-300 transition-all font-semibold text-[11px] group cursor-pointer shadow-2xs"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Buka Spreadsheet</span>
                        <ExternalLink className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </a>
                    </td>

                    {/* 4. Atasan Penilai (Pills Status) */}
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1.5 max-w-xs">
                        {s.reviewers.map((r) => (
                          <span
                            key={r.id}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                              r.status === "APPROVED"
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : r.status === "IN_REVIEW"
                                  ? "bg-amber-50 text-amber-800 border-amber-200"
                                  : r.status === "REJECTED"
                                    ? "bg-rose-50 text-rose-800 border-rose-200"
                                    : "bg-slate-100 text-slate-600 border-slate-200"
                            }`}
                          >
                            {r.status === "APPROVED" ? (
                              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                            ) : r.status === "IN_REVIEW" ? (
                              <Clock className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                            ) : null}
                            <span className="truncate max-w-[120px]">{r.reviewerName}</span>
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* 5. Status Keseluruhan */}
                    <td className="py-3 px-4 text-center">{getStatusBadge(s.status)}</td>

                    {/* 6. Aksi */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSubmission(s);
                            setDetailOpen(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-[#102E50] hover:bg-slate-100 rounded-lg transition-colors"
                          title="Lihat Detail Timesheet"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {(s.status === "PENDING" || s.status === "REVISION_REQUESTED") && (
                          <button
                            type="button"
                            onClick={() => handleCancel(s)}
                            disabled={isPending && cancelingId === s.id}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Batalkan Pengajuan"
                          >
                            {isPending && cancelingId === s.id ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      <TimesheetDetailModal
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        submission={selectedSubmission}
      />
    </div>
  );
}
