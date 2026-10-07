"use client";

import { useState, useTransition } from "react";
import {
  X,
  Award,
  User,
  ShieldCheck,
  FileText,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Lock,
  RefreshCw,
  Target,
  Unlock,
  RotateCcw,
  Star,
  Send,
} from "lucide-react";
import {
  finalizePerformanceReviewAction,
  submitManagerReviewAction,
  requestReviewRevisionAction,
  unlockPerformanceReviewAction,
} from "@/server/actions/performance.actions";
import { calculateRecommendedFinalScore, calculatePerformancePredicate } from "@pspk/shared";

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
  isManager?: boolean;
  /** ID karyawan yang sedang login (untuk mengecek apakah dia atasan dari review ini) */
  currentEmployeeId?: string;
  isHrOrAdmin?: boolean;
}

/* =========================================================================
 * FINALIZE FORM (Admin HR — Kunci Final)
 * ========================================================================= */
interface FinalizeFormProps {
  review: PerformanceReviewItem;
  onClose: () => void;
  onSuccess?: () => void;
}

function FinalizeReviewForm({ review, onClose, onSuccess }: FinalizeFormProps) {
  const recommendedScore = calculateRecommendedFinalScore(review.selfScore, review.managerScore);
  const [finalScoreInput, setFinalScoreInput] = useState<number>(recommendedScore);
  const [managerCommentInput, setManagerCommentInput] = useState<string>(
    review.managerComment || "",
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const predicate = calculatePerformancePredicate(finalScoreInput);

  const handleFinalize = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !window.confirm(
        `Kunci dan finalisasi nilai kinerja untuk ${review.employee.fullName}? Hasil tidak dapat diubah kembali setelah dikunci.`,
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

      {/* Rekomendasi otomatis skor */}
      <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center gap-2.5">
        <Star className="w-4 h-4 shrink-0 text-blue-500" />
        <span>
          Rekomendasi skor (berdasarkan nilai atasan langsung):{" "}
          <strong className="font-mono">{recommendedScore}</strong>
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Skor Akhir Resmi (0–100) <span className="text-rose-500">*</span>
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
          <p
            className={`mt-1 text-[11px] font-semibold px-2 py-0.5 rounded border inline-block ${predicate.badgeClass}`}
          >
            {predicate.predicate} (Grade {predicate.grade})
          </p>
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

/* =========================================================================
 * MANAGER REVIEW FORM (Atasan Langsung — Isi Penilaian)
 * ========================================================================= */
interface ManagerReviewFormProps {
  review: PerformanceReviewItem;
  onClose: () => void;
  onSuccess?: () => void;
}

function ManagerReviewForm({ review, onClose, onSuccess }: ManagerReviewFormProps) {
  const [scoreInput, setScoreInput] = useState<number>(
    review.managerScore ?? review.selfScore ?? 85,
  );
  const [commentInput, setCommentInput] = useState<string>(review.managerComment || "");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const predicate = calculatePerformancePredicate(scoreInput);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim() || commentInput.trim().length < 10) {
      setError("Catatan evaluasi atasan wajib diisi (minimal 10 karakter).");
      return;
    }
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await submitManagerReviewAction({
        reviewId: review.id,
        managerScore: Number(scoreInput),
        managerComment: commentInput.trim(),
      });
      if (!res.success) {
        setError(res.error || "Gagal menyimpan penilaian atasan.");
      } else {
        setSuccess("Penilaian atasan berhasil disimpan. Menunggu verifikasi & pengesahan HR.");
        setTimeout(() => {
          onClose();
          if (onSuccess) onSuccess();
        }, 1500);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 pt-2">
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

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Skor Penilaian Atasan (0–100) <span className="text-rose-500">*</span>
        </label>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min={0}
            max={100}
            step="0.1"
            required
            value={scoreInput}
            onChange={(e) => setScoreInput(Number(e.target.value))}
            className="w-32 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-[#102E50] focus:ring-1 focus:ring-[#102E50] outline-hidden font-mono font-bold"
          />
          <span
            className={`text-[11px] font-semibold px-2.5 py-1 rounded border ${predicate.badgeClass}`}
          >
            {predicate.predicate} (Grade {predicate.grade})
          </span>
        </div>
        <p className="text-[11px] text-slate-400 mt-1">{predicate.description}</p>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Catatan Evaluasi & Masukan Pembinaan <span className="text-rose-500">*</span>
        </label>
        <textarea
          required
          rows={4}
          placeholder="Contoh: Kinerja sangat solid pada proyek analisis kebijakan Q3. Perlu meningkatkan konsistensi pelaporan bulanan. Direkomendasikan untuk mengikuti pelatihan metodologi riset lanjutan."
          value={commentInput}
          onChange={(e) => setCommentInput(e.target.value)}
          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-[#102E50] focus:ring-1 focus:ring-[#102E50] outline-hidden resize-none leading-relaxed"
        />
        <p className="text-[11px] text-slate-400 mt-0.5">
          Minimal 10 karakter · {commentInput.length} karakter terisi
        </p>
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#102E50] hover:bg-[#1a4473] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50"
        >
          {isPending ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Menyimpan...</span>
            </>
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              <span>Simpan Penilaian Atasan</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}

/* =========================================================================
 * REQUEST REVISION FORM (Atasan / HR — Minta Revisi)
 * ========================================================================= */
interface RevisionFormProps {
  review: PerformanceReviewItem;
  onClose: () => void;
  onSuccess?: () => void;
}

function RequestRevisionForm({ review, onClose, onSuccess }: RevisionFormProps) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || reason.trim().length < 5) {
      setError("Alasan permintaan revisi wajib diisi (minimal 5 karakter).");
      return;
    }
    if (
      !window.confirm(
        `Kembalikan evaluasi ${review.employee.fullName} ke status DRAFT? Nilai yang sudah diisi akan dihapus.`,
      )
    ) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await requestReviewRevisionAction({ reviewId: review.id, reason: reason.trim() });
      if (!res.success) {
        setError(res.error || "Gagal meminta revisi evaluasi.");
      } else {
        onClose();
        if (onSuccess) onSuccess();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 pt-2">
      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs">
        <strong>Peringatan:</strong> Mengembalikan ke DRAFT akan menghapus nilai evaluasi mandiri
        dan nilai atasan yang sudah diisi. Staf perlu mengisi ulang dari awal.
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Alasan Permintaan Revisi <span className="text-rose-500">*</span>
        </label>
        <textarea
          required
          rows={3}
          placeholder="Contoh: Sasaran kerja belum lengkap, perlu menambah target kuantitatif pada OKR riset..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-hidden resize-none"
        />
      </div>
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50"
        >
          {isPending ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Memproses...</span>
            </>
          ) : (
            <>
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Minta Revisi (Kembali ke Draft)</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}

/* =========================================================================
 * MAIN MODAL
 * ========================================================================= */
export function PerformanceDetailModal({
  isOpen,
  review,
  onClose,
  onSuccess,
  isManager = false,
  currentEmployeeId,
  isHrOrAdmin = false,
}: PerformanceDetailModalProps) {
  const [activePanel, setActivePanel] = useState<
    "detail" | "manager-review" | "revision" | "unlock"
  >("detail");

  const handleClose = () => {
    setActivePanel("detail");
    onClose();
  };

  if (!isOpen || !review) return null;

  const isFinalized = review.status === "FINALIZED";
  const isReviewer = currentEmployeeId && review.reviewer?.id === currentEmployeeId;
  const canSubmitManagerReview = (isReviewer || isHrOrAdmin) && review.status === "SELF_REVIEW";
  const canRequestRevision =
    (isReviewer || isHrOrAdmin) &&
    (review.status === "SELF_REVIEW" || review.status === "MANAGER_REVIEW");
  const canFinalize = isHrOrAdmin && review.status === "MANAGER_REVIEW";
  const canUnlock = isHrOrAdmin && isFinalized;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden transform transition-all">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#102E50] to-[#1a4473] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-[#F2AF3E] font-bold text-sm">
              {review.employee.fullName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
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
            onClick={handleClose}
            className="p-1 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Tabs (untuk aksi yang tersedia) */}
        {(canSubmitManagerReview || canRequestRevision || canFinalize || canUnlock) && (
          <div className="border-b border-slate-200 bg-slate-50/60 px-6 flex items-center gap-1 pt-2 shrink-0 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActivePanel("detail")}
              className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors whitespace-nowrap ${
                activePanel === "detail"
                  ? "text-[#102E50] border-b-2 border-[#102E50] bg-white"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              📋 Detail Evaluasi
            </button>

            {canSubmitManagerReview && (
              <button
                type="button"
                onClick={() => setActivePanel("manager-review")}
                className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors whitespace-nowrap ${
                  activePanel === "manager-review"
                    ? "text-[#102E50] border-b-2 border-[#102E50] bg-white"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                ⭐ Isi Penilaian Atasan
              </button>
            )}

            {canFinalize && (
              <button
                type="button"
                onClick={() => setActivePanel("detail")}
                className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors whitespace-nowrap text-emerald-700 hover:text-emerald-900`}
              >
                🔒 Panel Finalisasi tersedia ↓
              </button>
            )}

            {canRequestRevision && (
              <button
                type="button"
                onClick={() => setActivePanel("revision")}
                className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors whitespace-nowrap ${
                  activePanel === "revision"
                    ? "text-amber-800 border-b-2 border-amber-600 bg-white"
                    : "text-slate-500 hover:text-amber-700"
                }`}
              >
                🔄 Minta Revisi
              </button>
            )}

            {canUnlock && (
              <button
                type="button"
                onClick={() => setActivePanel("unlock")}
                className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors whitespace-nowrap ${
                  activePanel === "unlock"
                    ? "text-rose-800 border-b-2 border-rose-600 bg-white"
                    : "text-slate-500 hover:text-rose-700"
                }`}
              >
                🔓 Buka Kunci
              </button>
            )}
          </div>
        )}

        {/* Body (Scrollable) */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          {/* Panel: Manager Review Form */}
          {activePanel === "manager-review" && canSubmitManagerReview && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-600" />
                <h4 className="font-serif font-bold text-slate-900 text-sm">
                  Penilaian Atasan Langsung
                </h4>
              </div>
              <ManagerReviewForm review={review} onClose={handleClose} onSuccess={onSuccess} />
            </div>
          )}

          {/* Panel: Request Revision */}
          {activePanel === "revision" && canRequestRevision && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-amber-600" />
                <h4 className="font-serif font-bold text-slate-900 text-sm">
                  Permintaan Revisi Evaluasi
                </h4>
              </div>
              <RequestRevisionForm review={review} onClose={handleClose} onSuccess={onSuccess} />
            </div>
          )}

          {/* Panel: Unlock (Admin HR only) */}
          {activePanel === "unlock" && canUnlock && (
            <UnlockPanel review={review} onClose={handleClose} onSuccess={onSuccess} />
          )}

          {/* Panel: Detail (default) */}
          {activePanel === "detail" && (
            <>
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

                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-[11px]">
                          <div className="text-slate-600">
                            <span className="text-slate-400">Target:</span>{" "}
                            <strong className="text-slate-800">{goal.target || "-"}</strong>
                          </div>
                          <div className="text-slate-600">
                            <span className="text-slate-400">Satuan:</span>{" "}
                            <strong className="text-slate-700">{goal.unit || "-"}</strong>
                          </div>
                          <div className="text-slate-600">
                            <span className="text-slate-400">Realisasi:</span>{" "}
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
                        <span className="text-[10px] text-slate-400 block leading-none">
                          Skor Staf
                        </span>
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
                        &ldquo;
                        {review.selfComment ||
                          "Belum ada catatan refleksi yang diisi oleh pegawai."}
                        &rdquo;
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
                        <span className="text-[10px] text-slate-400 block leading-none">
                          Skor Atasan
                        </span>
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
                        &ldquo;
                        {review.managerComment ||
                          "Belum ada catatan evaluasi dari atasan langsung."}
                        &rdquo;
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bagian 3: Finalisasi / Status Panel */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-serif font-bold text-slate-900 text-sm flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>
                        {isManager && !isHrOrAdmin
                          ? "Status & Validasi Nilai Kinerja"
                          : "Hasil Akhir & Penguncian Nilai (HR Lead)"}
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      {isFinalized
                        ? "Nilai telah disahkan dan dikunci resmi ke dalam database kinerja organisasi."
                        : isManager && !isHrOrAdmin
                          ? "Pengesahan resmi dan penguncian evaluasi akhir dilakukan oleh Divisi HR."
                          : "Admin HR dapat mengesahkan skor akhir untuk dimasukkan ke laporan resmi."}
                    </p>
                  </div>
                  {isFinalized && (
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block leading-none">
                        Skor Resmi
                      </span>
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

                {!isFinalized && canFinalize && (
                  <FinalizeReviewForm
                    key={review.id}
                    review={review}
                    onClose={handleClose}
                    onSuccess={onSuccess}
                  />
                )}

                {!isFinalized && !canFinalize && (
                  <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-900 text-xs flex items-center gap-2.5">
                    <Clock className="w-4 h-4 shrink-0 text-amber-600" />
                    <span>
                      {review.status === "DRAFT"
                        ? "Pegawai masih menyusun target dan sasaran kerja (DRAFT)."
                        : review.status === "SELF_REVIEW"
                          ? "Staf telah mengajukan evaluasi mandiri. Menunggu penilaian atasan langsung."
                          : review.status === "MANAGER_REVIEW"
                            ? "Penilaian atasan telah tercatat. Menunggu verifikasi komite dan pengesahan resmi oleh HR."
                            : "Status evaluasi tidak dikenal."}
                    </span>
                  </div>
                )}

                {isFinalized && canUnlock && (
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setActivePanel("unlock")}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 border border-rose-200 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      Buka Kunci untuk Koreksi
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200/70 rounded-xl transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
 * UNLOCK PANEL (Admin HR — Buka Kunci yang sudah FINALIZED)
 * ========================================================================= */
function UnlockPanel({
  review,
  onClose,
  onSuccess,
}: {
  review: PerformanceReviewItem;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || reason.trim().length < 5) {
      setError("Alasan pembukaan kunci wajib diisi (minimal 5 karakter).");
      return;
    }
    if (
      !window.confirm(
        `Buka kunci evaluasi ${review.employee.fullName}? Skor final akan dihapus dan status kembali ke MANAGER_REVIEW.`,
      )
    ) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await unlockPerformanceReviewAction({
        reviewId: review.id,
        reason: reason.trim(),
      });
      if (!res.success) {
        setError(res.error || "Gagal membuka kunci evaluasi.");
      } else {
        onClose();
        if (onSuccess) onSuccess();
      }
    });
  };

  return (
    <form onSubmit={handleUnlock} className="space-y-3">
      <div className="flex items-center gap-2">
        <Unlock className="w-4 h-4 text-rose-600" />
        <h4 className="font-serif font-bold text-slate-900 text-sm">
          Buka Kunci Evaluasi yang Disahkan
        </h4>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs">
        <strong>Tindakan Berisiko:</strong> Membuka kunci akan menghapus skor final (
        {review.finalScore}) dan mengembalikan evaluasi ke status MANAGER_REVIEW. Hanya lakukan jika
        ada koreksi yang benar-benar perlu.
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Alasan Pembukaan Kunci <span className="text-rose-500">*</span>
        </label>
        <textarea
          required
          rows={3}
          placeholder="Contoh: Terdapat kesalahan entri skor atasan, perlu dikoreksi sesuai penilaian komite akhir..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full px-3 py-2 text-xs rounded-xl border border-rose-200 focus:border-rose-400 focus:ring-1 focus:ring-rose-400 outline-hidden resize-none"
        />
      </div>

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50"
        >
          {isPending ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Membuka Kunci...</span>
            </>
          ) : (
            <>
              <Unlock className="w-3.5 h-3.5" />
              <span>Buka Kunci Evaluasi</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
