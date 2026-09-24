"use client";

import React, { useState, useTransition } from "react";
import {
  X,
  Award,
  User,
  ShieldCheck,
  FileText,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  Lock,
  RefreshCw,
  Target,
} from "lucide-react";
import { finalizePerformanceReviewAction } from "@/server/actions/performance.actions";

export interface PerformanceGoalItem {
  id: string;
  title: string;
  description: string | null;
  weight: number;
  target: string | null;
  unit: string | null;
  actual: string | null;
}

export interface PerformanceReviewItem {
  id: string;
  employeeId: string;
  periodId: string;
  status: string;
  selfScore: number | null;
  managerScore: number | null;
  finalScore: number | null;
  predicate: string;
  selfComment: string | null;
  managerComment: string | null;
  employee: {
    id: string;
    employeeNo: string;
    fullName: string;
    workEmail: string | null;
    positionTitle: string;
    departmentName: string;
    departmentId: string | null;
  };
  reviewer: {
    id: string;
    employeeNo: string;
    fullName: string;
    positionTitle: string;
  } | null;
  goalsCount: number;
  totalGoalWeight: number;
  isGoalComplete: boolean;
  goals: PerformanceGoalItem[];
}

interface PerformanceDetailModalProps {
  isOpen: boolean;
  review: PerformanceReviewItem | null;
  onClose: () => void;
  onSuccess?: () => void;
}

interface FinalizeFormProps {
  review: PerformanceReviewItem;
  onClose: () => void;
  onSuccess?: () => void;
}

function FinalizeReviewForm({ review, onClose, onSuccess }: FinalizeFormProps) {
  const [finalScoreInput, setFinalScoreInput] = useState<number>(
    review.finalScore || review.managerScore || review.selfScore || 85
  );
  const [managerCommentInput, setManagerCommentInput] = useState<string>(
    review.managerComment || ""
  );

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleFinalize = (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !window.confirm(
        `Kunci dan finalisasi nilai kinerja untuk ${review.employee.fullName}? Hasil tidak dapat diubah kembali setelah dikunci.`
      )
    ) {
      return;
    }

    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const res = await finalizePerformanceReviewAction({
        reviewId: review.id,
        finalScore: Number(finalScoreInput),
        managerComment: managerCommentInput || undefined,
      });

      if (!res.success) {
        setError(res.error || "Gagal memfinalisasi review kinerja.");
      } else {
        setSuccess("Nilai kinerja berhasil difinalisasi dan dikunci resmi.");
        setTimeout(() => {
          onClose();
          if (onSuccess) onSuccess();
        }, 1200);
      }
    });
  };

  return (
    <form onSubmit={handleFinalize} className="space-y-3 pt-2">
      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Skor Akhir Rekomendasi (0–100) <span className="text-rose-500">*</span>
          </label>
          <input
            type="number"
            min={0}
            max={100}
            step="0.1"
            required
            value={finalScoreInput}
            onChange={(e) => setFinalScoreInput(Number(e.target.value))}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-[#102E50] focus:ring-1 focus:ring-[#102E50] outline-hidden font-mono font-bold"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Catatan Tambahan HR / Komite Evaluasi
          </label>
          <input
            type="text"
            placeholder="Contoh: Disetujui sesuai rekomendasi riset semester ini"
            value={managerCommentInput}
            onChange={(e) => setManagerCommentInput(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-[#102E50] focus:ring-1 focus:ring-[#102E50] outline-hidden"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50"
        >
          {isPending ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Mengunci Nilai...</span>
            </>
          ) : (
            <>
              <Lock className="w-3.5 h-3.5 text-emerald-200" />
              <span>Kunci & Finalisasi Nilai</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}

export function PerformanceDetailModal({
  isOpen,
  review,
  onClose,
  onSuccess,
}: PerformanceDetailModalProps) {
  if (!isOpen || !review) return null;

  const isFinalized = review.status === "FINALIZED";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden transform transition-all">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#102E50] to-[#1a4473] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-[#F2AF3E] font-bold text-sm">
              {review.employee.fullName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-base font-bold tracking-tight">
                  {review.employee.fullName}
                </h3>
                <span className="font-mono text-[11px] text-slate-300">
                  ({review.employee.employeeNo})
                </span>
                {isFinalized ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                    <Lock className="w-3 h-3 text-emerald-300" />
                    Final & Terkunci
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-400/20 text-amber-200 border border-amber-400/30">
                    {review.status}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-200">
                {review.employee.positionTitle} • {review.employee.departmentName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body (Scrollable) */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          {/* Atasan Penilai Info Bar */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <User className="w-4 h-4 text-slate-400" />
              <span>
                Atasan Langsung Penilai:{" "}
                <strong className="text-slate-900 font-semibold">
                  {review.reviewer?.fullName || "Belum Ditetapkan"}
                </strong>{" "}
                ({review.reviewer?.positionTitle || "-"})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Kelengkapan Bobot Target:</span>
              <span
                className={`px-2 py-0.5 rounded-md font-semibold font-mono text-[11px] ${
                  review.isGoalComplete
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                    : "bg-amber-100 text-amber-800 border border-amber-200"
                }`}
              >
                {review.totalGoalWeight}% / 100%
              </span>
            </div>
          </div>

          {/* Bagian 1: Sasaran Riset & Target Kerja (OKR/KPI) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-serif font-bold text-slate-900 text-sm flex items-center gap-2">
                <Target className="w-4 h-4 text-[#102E50]" />
                <span>Sasaran Kerja & Target Riset (OKR)</span>
              </h4>
              <span className="text-[11px] text-slate-400">
                {review.goals.length} Sasaran Terdaftar
              </span>
            </div>

            {review.goals.length === 0 ? (
              <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-400">
                Belum ada sasaran kerja spesifik yang didaftarkan untuk periode ini.
              </div>
            ) : (
              <div className="grid gap-2.5">
                {review.goals.map((goal, idx) => (
                  <div
                    key={goal.id || idx}
                    className="p-3.5 bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all space-y-1.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-slate-900 text-xs">
                          {idx + 1}. {goal.title}
                        </div>
                        {goal.description && (
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                            {goal.description}
                          </p>
                        )}
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-blue-50 text-blue-800 border border-blue-200 shrink-0">
                        Bobot {goal.weight}%
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-[11px]">
                      <div className="text-slate-600">
                        <span className="text-slate-400">Target:</span>{" "}
                        <strong className="text-slate-800">{goal.target || "-"}</strong>
                      </div>
                      <div className="text-slate-600">
                        <span className="text-slate-400">Realisasi Aktual:</span>{" "}
                        <strong className="text-emerald-700">{goal.actual || "-"}</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bagian 2: Evaluasi Diri vs Penilaian Atasan (Side-by-Side) */}
          <div className="space-y-3">
            <h4 className="font-serif font-bold text-slate-900 text-sm flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#102E50]" />
              <span>Komparasi Evaluasi Diri vs Penilaian Atasan</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Kolom Kiri: Self Review */}
              <div className="p-4 bg-sky-50/50 rounded-2xl border border-sky-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-semibold text-xs text-sky-900">
                    <FileText className="w-4 h-4 text-sky-600" />
                    <span>Evaluasi Mandiri (Staf)</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block leading-none">Skor Staf</span>
                    <span className="text-lg font-bold font-mono text-sky-900">
                      {review.selfScore !== null ? review.selfScore : "-"}
                      <span className="text-xs font-normal text-slate-400"> / 100</span>
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Refleksi Capaian & Hambatan:
                  </label>
                  <p className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-sky-100 min-h-[72px] leading-relaxed italic">
                    &ldquo;{review.selfComment || "Belum ada catatan refleksi yang diisi oleh pegawai."}&rdquo;
                  </p>
                </div>
              </div>

              {/* Kolom Kanan: Manager Review */}
              <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-semibold text-xs text-amber-900">
                    <Award className="w-4 h-4 text-amber-600" />
                    <span>Penilaian Atasan Langsung</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block leading-none">Skor Atasan</span>
                    <span className="text-lg font-bold font-mono text-amber-900">
                      {review.managerScore !== null ? review.managerScore : "-"}
                      <span className="text-xs font-normal text-slate-400"> / 100</span>
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Catatan & Masukan Pembinaan:
                  </label>
                  <p className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-amber-100 min-h-[72px] leading-relaxed italic">
                    &ldquo;{review.managerComment || "Belum ada catatan evaluasi dari atasan langsung."}&rdquo;
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bagian 3: Finalisasi Nilai Kinerja (Admin HR View) */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-serif font-bold text-slate-900 text-sm flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Hasil Akhir & Penguncian Nilai (HR Lead)</span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  {isFinalized
                    ? "Nilai telah disahkan dan dikunci resmi ke dalam database kinerja organisasi."
                    : "Admin HR dapat mengesahkan skor akhir berbobot untuk dimasukkan ke laporan resmi."}
                </p>
              </div>

              {isFinalized && (
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block leading-none">Skor Resmi</span>
                  <span className="text-xl font-bold font-mono text-emerald-900">
                    {review.finalScore}
                    <span className="text-xs font-normal text-slate-400"> / 100</span>
                  </span>
                  <span className="block text-[11px] font-semibold text-emerald-700">
                    Predikat: {review.predicate}
                  </span>
                </div>
              )}
            </div>

            {!isFinalized && (
              <FinalizeReviewForm
                key={review.id}
                review={review}
                onClose={onClose}
                onSuccess={onSuccess}
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end shrink-0">
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
