"use client";

import React, { useState, useTransition } from "react";
import {
  X,
  Clock,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  Search,
  Check,
} from "lucide-react";
import { submitTimesheetAction } from "@/server/actions/timesheet.actions";

interface EligibleReviewer {
  id: string;
  fullName: string;
  employeeNo: string;
  positionTitle: string;
  departmentName: string;
  isLeadOrManager: boolean;
}

interface TimesheetSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  eligibleReviewers: EligibleReviewer[];
  defaultMonth?: number;
  defaultYear?: number;
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

export function TimesheetSubmissionModal({
  isOpen,
  onClose,
  eligibleReviewers,
  defaultMonth,
  defaultYear,
}: TimesheetSubmissionModalProps) {
  const now = new Date();
  const currentMonth = defaultMonth || now.getMonth() + 1;
  const currentYear = defaultYear || now.getFullYear();

  const [title, setTitle] = useState("");
  const [periodMonth, setPeriodMonth] = useState<number>(currentMonth);
  const [periodYear, setPeriodYear] = useState<number>(currentYear);
  const [spreadsheetUrl, setSpreadsheetUrl] = useState("");
  const [totalHours, setTotalHours] = useState<string>("");
  const [description, setDescription] = useState("");
  const [selectedReviewerIds, setSelectedReviewerIds] = useState<string[]>([]);
  const [reviewerSearch, setReviewerSearch] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  const toggleReviewer = (id: string) => {
    setSelectedReviewerIds((prev) =>
      prev.includes(id) ? prev.filter((rId) => rId !== id) : [...prev, id],
    );
  };

  const filteredReviewers = eligibleReviewers.filter((r) => {
    if (reviewerSearch.trim() === "") return true;
    const q = reviewerSearch.toLowerCase().trim();
    return (
      r.fullName.toLowerCase().includes(q) ||
      r.positionTitle.toLowerCase().includes(q) ||
      r.departmentName.toLowerCase().includes(q)
    );
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const parsedHours = parseFloat(totalHours);
    if (isNaN(parsedHours) || parsedHours <= 0) {
      setError("Jumlah jam kerja harus berupa angka positif.");
      return;
    }

    if (selectedReviewerIds.length === 0) {
      setError("Pilih minimal 1 atasan / lead penilai.");
      return;
    }

    startTransition(async () => {
      const res = await submitTimesheetAction({
        title,
        periodMonth,
        periodYear,
        spreadsheetUrl,
        totalHours: parsedHours,
        reviewerIds: selectedReviewerIds,
        description: description || undefined,
      });

      if (!res.ok) {
        setError(res.error || "Gagal menyimpan pengajuan timesheet.");
      } else {
        setSuccess("Pengajuan timesheet berhasil dikumpulkan! Notifikasi telah dikirim ke atasan penilai.");
        setTimeout(() => {
          onClose();
          // Reset form
          setTitle("");
          setSpreadsheetUrl("");
          setTotalHours("");
          setDescription("");
          setSelectedReviewerIds([]);
        }, 1300);
      }
    });
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
                Ajukan Timesheet Jam Kerja
              </h3>
              <p className="text-xs text-slate-300">
                Kumpulkan lembar waktu Google Spreadsheet untuk diverifikasi oleh Lead / Atasan
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 overflow-y-auto space-y-4 text-xs">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="font-medium leading-relaxed">{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span className="font-medium">{success}</span>
              </div>
            )}

            {/* 1. Judul & Periode */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-800">
                Judul Pengajuan Timesheet <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Timesheet Riset Tata Kelola Guru - September 2026"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 focus:bg-white border border-slate-200 focus:border-[#102E50] rounded-xl font-medium outline-hidden transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-800 mb-1 block">
                  Bulan Periode <span className="text-rose-500">*</span>
                </label>
                <select
                  value={periodMonth}
                  onChange={(e) => setPeriodMonth(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-hidden focus:border-[#102E50]"
                >
                  {MONTH_NAMES.map((name, idx) => (
                    <option key={idx + 1} value={idx + 1}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-semibold text-slate-800 mb-1 block">
                  Tahun Periode <span className="text-rose-500">*</span>
                </label>
                <select
                  value={periodYear}
                  onChange={(e) => setPeriodYear(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-hidden focus:border-[#102E50]"
                >
                  {[2024, 2025, 2026, 2027].map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 2. Link Google Spreadsheet & Total Jam */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-800">
                  Link Google Spreadsheet <span className="text-rose-500">*</span>
                </label>
                {spreadsheetUrl && spreadsheetUrl.startsWith("http") && (
                  <a
                    href={spreadsheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-[#102E50] hover:underline flex items-center gap-1 font-semibold"
                  >
                    <span>Uji Buka Link</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <input
                type="url"
                required
                placeholder="https://docs.google.com/spreadsheets/d/..."
                value={spreadsheetUrl}
                onChange={(e) => setSpreadsheetUrl(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 focus:bg-white border border-slate-200 focus:border-[#102E50] rounded-xl font-mono text-[11px] outline-hidden transition-all placeholder:font-sans"
              />
              <p className="text-[10px] text-slate-400">
                Pastikan akses Google Spreadsheet sudah disetel agar dapat dibuka oleh atasan penilai.
              </p>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-800">
                Total Akumulasi Jam Kerja (Sesuai Timesheet) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.25"
                  min="0.25"
                  max="720"
                  required
                  placeholder="Misal: 45.5"
                  value={totalHours}
                  onChange={(e) => setTotalHours(e.target.value)}
                  className="w-full pl-3.5 pr-14 py-2 bg-slate-50 focus:bg-white border border-slate-200 focus:border-[#102E50] rounded-xl font-semibold text-sm outline-hidden transition-all"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-xs">
                  Jam
                </span>
              </div>
            </div>

            {/* 3. Multi-Select Atasan Penilai (Multi-Lead Reviewer) */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <label className="font-semibold text-slate-800 block">
                    Pilih Atasan Penilai (Lead / Manajer) <span className="text-rose-500">*</span>
                  </label>
                  <p className="text-[10px] text-slate-400">
                    Bisa memilih lebih dari 1 atasan jika Anda terlibat pada proyek dengan lead berbeda.
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#102E50]/10 text-[#102E50]">
                  {selectedReviewerIds.length} Dipilih
                </span>
              </div>

              {/* Reviewer Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari nama atasan atau divisi..."
                  value={reviewerSearch}
                  onChange={(e) => setReviewerSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-hidden focus:border-[#102E50]"
                />
              </div>

              {/* Reviewer List Scrollable */}
              <div className="max-h-40 overflow-y-auto space-y-1.5 border border-slate-200/80 rounded-xl p-2 bg-slate-50/50">
                {filteredReviewers.length === 0 ? (
                  <div className="text-center py-4 text-slate-400 text-xs">
                    Tidak ada atasan yang cocok dengan pencarian
                  </div>
                ) : (
                  filteredReviewers.map((r) => {
                    const isSelected = selectedReviewerIds.includes(r.id);
                    return (
                      <div
                        key={r.id}
                        onClick={() => toggleReviewer(r.id)}
                        className={`p-2 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? "bg-white border-[#102E50] shadow-2xs"
                            : "bg-white/80 border-slate-200/60 hover:bg-white"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className={`w-4 h-4 rounded flex items-center justify-center border transition-colors shrink-0 ${
                              isSelected
                                ? "bg-[#102E50] border-[#102E50] text-white"
                                : "border-slate-300 bg-white"
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3" />}
                          </div>
                          <div className="truncate">
                            <span className="font-semibold text-slate-900 block truncate">
                              {r.fullName}
                            </span>
                            <span className="text-[10px] text-slate-400 block truncate">
                              {r.positionTitle} • {r.departmentName}
                            </span>
                          </div>
                        </div>

                        {r.isLeadOrManager && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                            LEAD
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* 4. Deskripsi / Catatan Tambahan */}
            <div className="space-y-1 pt-2 border-t border-slate-100">
              <label className="font-semibold text-slate-800">
                Ringkasan Capaian / Catatan (Opsional)
              </label>
              <textarea
                rows={3}
                placeholder="Rangkum milestone capaian riset atau tugas yang diselesaikan pada periode ini..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 focus:bg-white border border-slate-200 focus:border-[#102E50] rounded-xl font-medium outline-hidden transition-all text-xs"
              />
            </div>
          </div>

          {/* Footer Modal */}
          <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2 bg-[#102E50] hover:bg-[#1a4473] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <Clock className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  <span>Mengirimkan...</span>
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-3.5 h-3.5 text-[#F2AF3E]" />
                  <span>Kumpulkan Timesheet</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
