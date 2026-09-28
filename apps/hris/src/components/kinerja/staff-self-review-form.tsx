"use client";

import React, { useState, useTransition } from "react";
import {
  Award,
  Send,
  Target,
  FileText,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  Info,
  Plus,
  Trash2,
  X,
  RefreshCw,
  Scale,
} from "lucide-react";
import {
  submitStaffSelfReviewAction,
  createGoalAction,
  deleteGoalAction,
} from "@/server/actions/performance.actions";
import { StaffPerformanceGoal } from "@/server/queries/performance.queries";

interface StaffSelfReviewFormProps {
  reviewId: string;
  employeeId: string;
  periodId: string;
  initialSelfScore: number | null;
  initialSelfComment: string | null;
  goals: StaffPerformanceGoal[];
  totalGoalWeight?: number;
  periodName: string;
  reviewerName: string | null;
}

interface AddGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string;
  periodId: string;
  currentTotalWeight: number;
}

function AddGoalModal({
  isOpen,
  onClose,
  employeeId,
  periodId,
  currentTotalWeight,
}: AddGoalModalProps) {
  const remainingWeight = Math.max(0, 100 - currentTotalWeight);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [weight, setWeight] = useState<number>(remainingWeight > 0 ? remainingWeight : 20);
  const [target, setTarget] = useState("");
  const [unit, setUnit] = useState("Dokumen");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  const handleSubmitGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Judul sasaran riset wajib diisi.");
      return;
    }
    if (weight <= 0 || weight > 100) {
      setError("Bobot harus antara 1% sampai 100%.");
      return;
    }
    if (currentTotalWeight + weight > 100) {
      setError(
        `Total bobot melebihi 100%. Saat ini sudah ${currentTotalWeight}%, Anda hanya dapat menambah maksimal ${remainingWeight}%.`
      );
      return;
    }

    setError(null);
    startTransition(async () => {
      const res = await createGoalAction({
        employeeId,
        periodId,
        title: title.trim(),
        description: description.trim() || undefined,
        weight: Number(weight),
        target: target.trim() || undefined,
        unit: unit.trim() || undefined,
      });

      if (!res.success) {
        setError(res.error || "Gagal menambahkan sasaran.");
      } else {
        onClose();
        setTitle("");
        setDescription("");
        setTarget("");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#102E50] flex items-center justify-center font-bold">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-sm font-bold text-slate-900">
                Tambah Sasaran Riset / Target Kerja
              </h3>
              <p className="text-[11px] text-slate-500">
                Alokasi bobot saat ini: {currentTotalWeight}% / 100% (Tersisa: {remainingWeight}%)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmitGoal} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Judul Sasaran Riset / OKR <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Penyusunan Naskah Kebijakan Kurikulum Daerah 3T"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-[#102E50] focus:ring-1 focus:ring-[#102E50] outline-hidden text-slate-900"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Deskripsi Ruang Lingkup & Metodologi
            </label>
            <textarea
              rows={2}
              placeholder="Contoh: Pengumpulan data empiris lapangan, wawancara pemangku kepentingan, dan perumusan rekomendasi advokasi"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-[#102E50] focus:ring-1 focus:ring-[#102E50] outline-hidden text-slate-900 leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Bobot (%) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                max={remainingWeight > 0 ? remainingWeight : 100}
                required
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-[#102E50] focus:ring-1 focus:ring-[#102E50] outline-hidden font-mono font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Target Capaian
              </label>
              <input
                type="text"
                placeholder="Misal: 2"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-[#102E50] focus:ring-1 focus:ring-[#102E50] outline-hidden text-slate-900"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Satuan Output
              </label>
              <input
                type="text"
                placeholder="Misal: Naskah / Policy Brief"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-[#102E50] focus:ring-1 focus:ring-[#102E50] outline-hidden text-slate-900"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2 bg-[#102E50] hover:bg-[#1a4473] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Simpan Sasaran</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function StaffSelfReviewForm({
  reviewId,
  employeeId,
  periodId,
  initialSelfScore,
  initialSelfComment,
  goals,
  totalGoalWeight = 0,
  periodName,
  reviewerName,
}: StaffSelfReviewFormProps) {
  const [selfScore, setSelfScore] = useState<number>(initialSelfScore ?? 85);
  const [selfComment, setSelfComment] = useState<string>(initialSelfComment ?? "");
  const [goalActuals, setGoalActuals] = useState<Record<string, string>>(() => {
    const initialMap: Record<string, string> = {};
    for (const g of goals) {
      if (g.actual) initialMap[g.id] = g.actual;
    }
    return initialMap;
  });

  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deletingGoalId, setDeletingGoalId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Hitung bobot aktual dari daftar goals
  const calculatedTotalWeight = goals.reduce((sum, g) => sum + Number(g.weight), 0);
  const isGoalWeightValid = Math.abs(calculatedTotalWeight - 100) < 0.01;

  const handleActualChange = (goalId: string, val: string) => {
    setGoalActuals((prev) => ({ ...prev, [goalId]: val }));
  };

  const handleDeleteGoal = (goalId: string, title: string) => {
    if (!window.confirm(`Hapus sasaran riset "${title}"?`)) return;

    setDeletingGoalId(goalId);
    startTransition(async () => {
      const res = await deleteGoalAction({ goalId });
      setDeletingGoalId(null);
      if (!res.success) {
        setError(res.error || "Gagal menghapus sasaran.");
      }
    });
  };

  // Helper predikat evaluasi mandiri
  const getScorePredicate = (score: number) => {
    if (score >= 90) return { label: "Sangat Baik (Melampaui Target)", color: "text-emerald-700 bg-emerald-50 border-emerald-200" };
    if (score >= 80) return { label: "Baik (Sesuai Ekspektasi)", color: "text-blue-700 bg-blue-50 border-blue-200" };
    if (score >= 70) return { label: "Cukup (Perlu Penguatan)", color: "text-amber-700 bg-amber-50 border-amber-200" };
    return { label: "Perlu Peningkatan Signifikan", color: "text-rose-700 bg-rose-50 border-rose-200" };
  };

  const predicateInfo = getScorePredicate(selfScore);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (goals.length === 0) {
      setError("Harap tambahkan minimal 1 target sasaran riset kerja sebelum mengirim evaluasi.");
      return;
    }
    if (!selfComment.trim() || selfComment.trim().length < 10) {
      setError("Catatan refleksi mandiri wajib diisi minimal 10 karakter.");
      return;
    }
    setError(null);
    setShowConfirm(true);
  };

  const handleConfirmSubmit = () => {
    setError(null);
    setShowConfirm(false);

    startTransition(async () => {
      const payload = {
        reviewId,
        selfScore: Number(selfScore),
        selfComment: selfComment.trim(),
        goalActuals: Object.entries(goalActuals).map(([goalId, actual]) => ({
          goalId,
          actual: actual.trim(),
        })),
      };

      const res = await submitStaffSelfReviewAction(payload);
      if (!res.success) {
        setError(res.error || "Gagal mengirim evaluasi mandiri. Silakan coba kembali.");
      } else {
        setSuccess("Evaluasi mandiri berhasil dikirim ke atasan langsung Anda.");
      }
    });
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3 shadow-xs animate-in fade-in">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <div>
              <p className="font-bold">Perhatian</p>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-3 shadow-xs animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
            <div>
              <p className="font-bold">Berhasil Dikirim!</p>
              <p className="mt-0.5">{success}</p>
            </div>
          </div>
        )}

        {/* SECTION 1: REALISASI SASARAN RISET & TARGET KERJA */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#102E50] flex items-center justify-center font-bold">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-serif text-sm font-bold text-slate-900">
                  1. Sasaran Riset & Target Kerja (OKR/KPI)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Daftarkan target kerja riset Anda dan cantumkan realisasi capaian yang berhasil Anda tuntaskan.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${
                  isGoalWeightValid
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : calculatedTotalWeight > 100
                    ? "bg-rose-50 text-rose-800 border-rose-200"
                    : "bg-amber-50 text-amber-800 border-amber-200"
                }`}
              >
                <Scale className="w-3.5 h-3.5" />
                <span>Bobot: {calculatedTotalWeight}% / 100%</span>
              </span>

              <button
                type="button"
                onClick={() => setIsAddGoalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#102E50] hover:bg-[#1a4473] text-white text-xs font-semibold rounded-xl shadow-2xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Sasaran Riset</span>
              </button>
            </div>
          </div>

          {goals.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#102E50] flex items-center justify-center mx-auto border border-blue-200">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-serif text-sm font-bold text-slate-800">
                  Belum Ada Sasaran Riset Terdaftar
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
                  Susun sasaran riset dan target kerja (OKR) Anda pada periode ini. Klik tombol di bawah untuk mendaftarkan target riset pertama Anda.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddGoalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#102E50] hover:bg-[#1a4473] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Sasaran Riset Pertama</span>
              </button>
            </div>
          ) : (
            <div className="grid gap-3.5">
              {goals.map((goal, idx) => (
                <div
                  key={goal.id}
                  className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/40 hover:bg-white hover:border-slate-300 transition-all space-y-2.5 relative group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-400">
                          #{idx + 1}
                        </span>
                        <h4 className="font-semibold text-xs text-slate-900">
                          {goal.title}
                        </h4>
                      </div>
                      {goal.description && (
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed pl-5">
                          {goal.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] font-bold font-mono px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200">
                        Bobot {goal.weight}%
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteGoal(goal.id, goal.title)}
                        disabled={deletingGoalId === goal.id}
                        title="Hapus sasaran ini"
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="pl-5 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="text-[11px] bg-white p-2.5 rounded-lg border border-slate-200/80">
                      <span className="text-slate-400 block font-medium">Target Ditetapkan:</span>
                      <span className="font-semibold text-slate-800 mt-0.5 block">
                        {goal.target || "-"} {goal.unit ? `(${goal.unit})` : ""}
                      </span>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                        Realisasi Aktual Anda:
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: 100% selesai, 1 naskah riset dipublikasi"
                        value={goalActuals[goal.id] || ""}
                        onChange={(e) => handleActualChange(goal.id, e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:border-[#102E50] focus:ring-1 focus:ring-[#102E50] outline-hidden bg-white text-slate-900"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION 2: SKOR PENILAIAN MANDIRI */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-[#805600] flex items-center justify-center font-bold">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-serif text-sm font-bold text-slate-900">
                  2. Skor Penilaian Diri (0–100)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Berikan estimasi penilaian objektif atas kedisiplinan, kualitas riset, dan dampak kerja Anda.
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-2xl font-bold font-mono text-[#102E50]">
                {selfScore}
              </span>
              <span className="text-xs text-slate-400"> / 100</span>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5">
                <span>Geser untuk menyesuaikan skor:</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${predicateInfo.color}`}>
                  {predicateInfo.label}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={selfScore}
                onChange={(e) => setSelfScore(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#102E50]"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                <span>0 (Kurang)</span>
                <span>50</span>
                <span>75 (Standar)</span>
                <span>85 (Baik)</span>
                <span>100 (Istimewa)</span>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: REFLEKSI KUALITATIF */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-sm font-bold text-slate-900">
                3. Refleksi Capaian & Catatan Pembelajaran
              </h3>
              <p className="text-[11px] text-slate-500">
                Uraikan keberhasilan terbesar, kendala operasional/metodologi, serta dukungan yang Anda perlukan.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Narasi Evaluasi Diri <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={selfComment}
              onChange={(e) => setSelfComment(e.target.value)}
              placeholder="Contoh: Pada periode riset ini, penyusunan Policy Brief Kurikulum selesai tepat waktu. Kendala utama ada pada akses data lapangan di daerah 3T. Dukungan yang diharapkan adalah pelatihan analisis data kuantitatif lanjutan."
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-[#102E50] focus:ring-1 focus:ring-[#102E50] outline-hidden leading-relaxed text-slate-900"
            />
            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
              <span>Minimal 10 karakter</span>
              <span>{selfComment.length} karakter</span>
            </div>
          </div>
        </div>

        {/* ACTION BAR */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <HelpCircle className="w-4 h-4 text-slate-400 shrink-0" />
            <span>
              Evaluasi akan diteruskan ke atasan langsung:{" "}
              <strong className="text-slate-800">{reviewerName || "Atasan Terdaftar"}</strong>
            </span>
          </div>

          <button
            type="submit"
            disabled={isPending || goals.length === 0}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#102E50] hover:bg-[#1a4473] text-white text-xs font-semibold rounded-xl shadow-sm transition-all disabled:opacity-50 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Kirim Evaluasi Mandiri</span>
          </button>
        </div>

        {/* CONFIRMATION MODAL */}
        {showConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-[#805600] flex items-center justify-center mx-auto border border-amber-200">
                <Sparkles className="w-6 h-6" />
              </div>

              <div className="text-center space-y-1.5">
                <h3 className="font-serif text-base font-bold text-slate-900">
                  Kirim Evaluasi Mandiri?
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Anda mengajukan skor mandiri sebesar{" "}
                  <strong className="text-[#102E50] font-mono font-bold text-sm">
                    {selfScore}/100
                  </strong>{" "}
                  untuk {goals.length} target sasaran. Setelah dikirim, lembar evaluasi akan terkunci dan diteruskan ke atasan Anda (
                  <strong>{reviewerName || "Atasan"}</strong>) untuk ditinjau.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowConfirm(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Periksa Kembali
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSubmit}
                  disabled={isPending}
                  className="px-5 py-2 bg-[#102E50] hover:bg-[#1a4473] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {isPending ? "Mengirim..." : "Ya, Kirim Sekarang"}
                </button>
              </div>
            </div>
          </div>
        )}
      </form>

      {/* MODAL TAMBAH SASARAN */}
      <AddGoalModal
        isOpen={isAddGoalOpen}
        onClose={() => setIsAddGoalOpen(false)}
        employeeId={employeeId}
        periodId={periodId}
        currentTotalWeight={calculatedTotalWeight}
      />
    </>
  );
}
