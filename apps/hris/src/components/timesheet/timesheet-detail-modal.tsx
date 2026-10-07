"use client";

import React from "react";
import {
  X,
  FileSpreadsheet,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertTriangle,
  User,
  Calendar,
} from "lucide-react";
import { TimesheetSubmissionItem } from "@/server/queries/timesheet.queries";

interface TimesheetDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: TimesheetSubmissionItem | null;
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

export function TimesheetDetailModal({ isOpen, onClose, submission }: TimesheetDetailModalProps) {
  if (!isOpen || !submission) return null;

  const getStatusBadge = (st: string) => {
    switch (st) {
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Menunggu Review
          </span>
        );
      case "IN_REVIEW":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-500 animate-spin" />
            Sedang Direview Atasan
          </span>
        );
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Disetujui Penuh (ACC)
          </span>
        );
      case "REVISION_REQUESTED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            Perlu Revisi
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
            {st}
          </span>
        );
    }
  };

  const getReviewerStatusBadge = (st: string) => {
    switch (st) {
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Disetujui (ACC)
          </span>
        );
      case "IN_REVIEW":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800">
            <Clock className="w-3 h-3 text-amber-600" />
            Sedang Memeriksa
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800">
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            Minta Revisi
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-600">
            Belum Dibuka
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden transform transition-all">
        {/* Header Modal */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#102E50] to-[#1a4473] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-[#F2AF3E]">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base tracking-tight">
                Detail Pengajuan Timesheet
              </h3>
              <p className="text-xs text-slate-300">
                Periode {MONTH_NAMES[submission.periodMonth - 1]} {submission.periodYear}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal"
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Judul & Status Card */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Judul Tugas / Proyek
              </span>
              <h4 className="text-sm font-bold text-slate-900">{submission.title}</h4>
              <div className="flex items-center gap-2 text-slate-500 mt-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  Diajukan pada:{" "}
                  {new Date(submission.submittedAt).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
            <div className="shrink-0">{getStatusBadge(submission.status)}</div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 bg-white rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 block mb-0.5">Total Jam Kerja</span>
              <span className="text-xl font-bold font-mono text-[#102E50]">
                {submission.totalHours}{" "}
                <span className="text-xs font-normal text-slate-400">Jam</span>
              </span>
            </div>
            <div className="p-3.5 bg-gradient-to-br from-emerald-50/70 via-white to-slate-50/60 rounded-xl border border-emerald-200/80 flex items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                    Google Sheets
                  </span>
                  <span className="text-xs font-semibold text-slate-800 block truncate max-w-[170px]">
                    Lembar Waktu Kerja
                  </span>
                </div>
              </div>
              <a
                href={submission.spreadsheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg font-semibold text-xs inline-flex items-center gap-1.5 transition-all shrink-0 shadow-xs group cursor-pointer"
              >
                <span>Buka</span>
                <ExternalLink className="w-3 h-3 text-white/90 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>
            </div>
          </div>

          {/* Deskripsi */}
          {submission.description && (
            <div className="space-y-1">
              <span className="font-semibold text-slate-700 block">Catatan Staf:</span>
              <p className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 leading-relaxed italic">
                &ldquo;{submission.description}&rdquo;
              </p>
            </div>
          )}

          {/* Progres Review per Atasan (Multi-Reviewer) */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <span className="font-semibold text-slate-800 block">
              Status Persetujuan Atasan Penilai ({submission.reviewers.length} Lead):
            </span>

            <div className="space-y-2">
              {submission.reviewers.map((r) => (
                <div
                  key={r.id}
                  className="p-3.5 rounded-xl border border-slate-200/80 bg-white flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-[#102E50] font-bold text-xs">
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="font-semibold text-slate-900 block">{r.reviewerName}</span>
                        <span className="text-[10px] text-slate-400 block">
                          {r.reviewerPosition} • {r.reviewerDepartment}
                        </span>
                      </div>
                    </div>
                    {getReviewerStatusBadge(r.status)}
                  </div>

                  {/* Catatan / Feedback dari atasan */}
                  {r.notes && (
                    <div className="p-2.5 bg-amber-50/70 border border-amber-200/60 rounded-lg text-amber-900 text-[11px] leading-relaxed">
                      <strong>Catatan Atasan:</strong> {r.notes}
                    </div>
                  )}

                  {/* Tanggal ACC */}
                  {r.actionAt && (
                    <div className="text-[10px] text-slate-400 text-right">
                      Diverifikasi pada: {new Date(r.actionAt).toLocaleString("id-ID")}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200/70 rounded-xl transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
