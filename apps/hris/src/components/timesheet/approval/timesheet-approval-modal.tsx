"use client";

import React, { useState, useTransition } from "react";
import {
  X,
  Clock,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Users,
  Eye,
  MessageSquare,
  AlertCircle,
} from "lucide-react";
import { formatDate } from "@pspk/shared";
import {
  startTimesheetReviewAction,
  submitReviewDecisionAction,
} from "@/server/actions/timesheet.actions";

export interface ReviewerInfo {
  id: string;
  reviewerId: string;
  reviewerName: string;
  reviewerPosition: string;
  reviewerDepartment: string;
  status: "PENDING" | "IN_REVIEW" | "APPROVED" | "REJECTED";
  notes?: string | null;
  reviewedAt?: string | null;
  actionAt?: string | null;
}

export interface TimesheetApprovalItem {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeNo: string;
  employeeDepartment: string;
  employeePosition: string;
  periodMonth: number;
  periodYear: number;
  title: string;
  spreadsheetUrl: string;
  totalHours: number;
  description?: string | null;
  status: "PENDING" | "IN_REVIEW" | "APPROVED" | "REVISION_REQUESTED" | "REJECTED";
  submittedAt: string;
  approvedAt?: string | null;
  reviewers: ReviewerInfo[];
}

interface TimesheetApprovalModalProps {
  submission: TimesheetApprovalItem | null;
  currentEmployeeId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const MONTH_NAMES = [
  "",
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

export function TimesheetApprovalModal({
  submission,
  currentEmployeeId,
  isOpen,
  onClose,
  onSuccess,
}: TimesheetApprovalModalProps) {
  const [isPending, startTransition] = useTransition();
  const [notes, setNotes] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);

  if (!isOpen || !submission) return null;

  // Temukan record review untuk atasan yang sedang login
  const myReview = submission.reviewers.find((r) => r.reviewerId === currentEmployeeId);
  const otherReviewers = submission.reviewers.filter((r) => r.reviewerId !== currentEmployeeId);

  const handleStartReview = () => {
    setActionError(null);
    setActionSuccess(null);
    startTransition(async () => {
      const res = await startTimesheetReviewAction(submission.id);
      if (!res.ok) {
        setActionError(res.error);
      } else {
        setActionSuccess("Status review telah diperbarui. Pegawai mendapat notifikasi lembar kerja sedang diperiksa.");
        if (onSuccess) onSuccess();
      }
    });
  };

  const handleDecision = (decision: "APPROVE" | "REJECT") => {
    setActionError(null);
    setActionSuccess(null);

    if (decision === "REJECT" && (!notes || notes.trim().length < 5)) {
      setActionError("Sertakan catatan minimal 5 karakter untuk alasan penolakan/perbaikan.");
      return;
    }

    startTransition(async () => {
      const res = await submitReviewDecisionAction({
        submissionId: submission.id,
        decision,
        notes: notes.trim() || undefined,
      });

      if (!res.ok) {
        setActionError(res.error);
      } else {
        setShowRejectConfirm(false);
        setActionSuccess(
          decision === "APPROVE"
            ? "Persetujuan (ACC) berhasil disimpan! Pegawai telah dinotifikasi."
            : "Penolakan berhasil disimpan. Catatan telah diteruskan ke pegawai.",
        );
        if (onSuccess) onSuccess();
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    });
  };

  const isAlreadyDecided = myReview?.status === "APPROVED" || myReview?.status === "REJECTED";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-[#102e50] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
              <FileSpreadsheet className="w-5 h-5 text-[#feba48]" />
            </div>
            <div>
              <h2 className="text-base font-bold">Review Timesheet Jam Kerja</h2>
              <p className="text-xs text-slate-300">
                Verifikasi jam kerja freelance & persetujuan atasan proyek
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {actionError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{actionError}</span>
            </div>
          )}

          {actionSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{actionSuccess}</span>
            </div>
          )}

          {/* Profil Karyawan & Periode */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 flex items-start justify-between gap-4">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Pegawai Freelance
              </span>
              <p className="font-bold text-slate-900 text-base">{submission.employeeName}</p>
              <p className="text-xs text-slate-600 mt-0.5">
                NIP: {submission.employeeNo} • {submission.employeePosition} • {submission.employeeDepartment}
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Periode & Jam Kerja
              </span>
              <p className="text-xs font-medium text-slate-700 mt-0.5">
                {MONTH_NAMES[submission.periodMonth]} {submission.periodYear}
              </p>
              <div className="inline-flex items-center gap-1.5 bg-[#102e50] text-[#ffddb0] px-2.5 py-1 rounded-lg text-xs font-bold mt-1">
                <Clock className="w-3.5 h-3.5 text-[#feba48]" />
                {submission.totalHours} Jam Kerja
              </div>
            </div>
          </div>

          {/* Judul & Deskripsi Tugas */}
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Judul Pengajuan / Proyek
            </h3>
            <p className="font-medium text-slate-900 text-sm">{submission.title}</p>
            {submission.description ? (
              <p className="text-xs text-slate-600 mt-1 bg-white p-3 rounded-lg border border-slate-200">
                {submission.description}
              </p>
            ) : (
              <p className="text-xs text-slate-400 italic mt-1">Tidak ada catatan tambahan dari staf.</p>
            )}
          </div>

          {/* Link Google Spreadsheet Banner */}
          <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Dokumen Lembar Waktu (Google Spreadsheet)</p>
                <p className="text-[11px] text-slate-600 truncate max-w-sm sm:max-w-md">
                  {submission.spreadsheetUrl}
                </p>
              </div>
            </div>
            <a
              href={submission.spreadsheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer"
            >
              <span>Buka Sheet</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Tombol Mulai Review jika status reviewer masih PENDING */}
          {myReview && myReview.status === "PENDING" && (
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-blue-900">
                <Eye className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  Status review Anda masih <strong>Belum Diperiksa</strong>. Klik tombol berikut untuk menandai bahwa Anda sedang mengecek spreadsheet ini.
                </span>
              </div>
              <button
                type="button"
                onClick={handleStartReview}
                disabled={isPending}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors shrink-0 cursor-pointer disabled:opacity-60"
              >
                Mulai Review
              </button>
            </div>
          )}

          {/* Daftar Reviewer Lain (Multi-Lead Status) */}
          {submission.reviewers.length > 1 && (
            <div className="border-t border-slate-200 pt-4">
              <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-slate-700">
                <Users className="w-4 h-4 text-slate-500" />
                <span>Status Rekan Atasan Penilai Lainnya ({submission.reviewers.length} Penilai)</span>
              </div>
              <div className="space-y-2">
                {otherReviewers.map((r) => (
                  <div
                    key={r.id}
                    className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-semibold text-slate-900">{r.reviewerName}</span>
                      <span className="text-slate-500 text-[11px] ml-1.5">({r.reviewerPosition})</span>
                      {r.notes && (
                        <p className="text-[11px] text-slate-600 italic mt-0.5">Catatan: &ldquo;{r.notes}&rdquo;</p>
                      )}
                    </div>
                    <div className="shrink-0">
                      {r.status === "APPROVED" && (
                        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[11px] font-semibold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Disetujui (ACC)
                        </span>
                      )}
                      {r.status === "IN_REVIEW" && (
                        <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-[11px] font-semibold">
                          <Eye className="w-3 h-3 text-blue-600" />
                          Sedang Dicek
                        </span>
                      )}
                      {r.status === "PENDING" && (
                        <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[11px] font-semibold">
                          <Clock className="w-3 h-3 text-amber-600" />
                          Menunggu
                        </span>
                      )}
                      {r.status === "REJECTED" && (
                        <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 px-2 py-0.5 rounded text-[11px] font-semibold">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          Ditolak
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bagian Keputusan / Form Atasan Aktif */}
          <div className="border-t border-slate-200 pt-4">
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="reviewer-notes" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                <span>Catatan Evaluasi / Umpan Balik (Opsional jika ACC, Wajib jika Tolak)</span>
              </label>
              {myReview?.status === "APPROVED" && (
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Anda Sudah Menyetujui (ACC)
                </span>
              )}
              {myReview?.status === "REJECTED" && (
                <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  Anda Telah Menolak
                </span>
              )}
            </div>

            <textarea
              id="reviewer-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isPending || isAlreadyDecided}
              placeholder={
                isAlreadyDecided
                  ? myReview?.notes || "Tidak ada catatan evaluasi."
                  : "Tuliskan catatan apresiasi, klarifikasi pekerjaan, atau alasan penolakan..."
              }
              className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:outline-hidden focus:ring-2 focus:ring-[#102e50]/20 focus:border-[#102e50] disabled:bg-slate-100 disabled:text-slate-500"
            />

            {/* Konfirmasi Penolakan Modal Sederhana */}
            {showRejectConfirm && (
              <div className="mt-3 p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-2 text-xs">
                <div className="flex items-center gap-2 text-rose-800 font-bold">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  <span>Konfirmasi Penolakan Timesheet</span>
                </div>
                <p className="text-slate-600">
                  Apakah Anda yakin ingin menolak pengajuan ini? Staf freelance akan menerima notifikasi beserta catatan alasan Anda.
                </p>
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowRejectConfirm(false)}
                    disabled={isPending}
                    className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-xs font-medium cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDecision("REJECT")}
                    disabled={isPending}
                    className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-60"
                  >
                    {isPending ? "Memproses..." : "Ya, Tolak Pengajuan"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <p className="text-[11px] text-slate-500">
            Diajukan pada {formatDate(submission.submittedAt)}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
            >
              Tutup
            </button>

            {!isAlreadyDecided && !showRejectConfirm && (
              <>
                <button
                  type="button"
                  onClick={() => setShowRejectConfirm(true)}
                  disabled={isPending}
                  className="px-4 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors cursor-pointer disabled:opacity-60"
                >
                  Tolak / Perlu Revisi
                </button>

                <button
                  type="button"
                  onClick={() => handleDecision("APPROVE")}
                  disabled={isPending}
                  className="px-5 py-2 text-xs font-bold text-[#102e50] bg-[#feba48] hover:bg-[#e59d28] rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-60 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#102e50]" />
                  <span>{isPending ? "Memproses..." : "Setujui Timesheet (ACC)"}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
