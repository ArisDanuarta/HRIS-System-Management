/**
 * Logika bisnis murni untuk Modul Evaluasi Kinerja (Performance Review) PSPK.
 */

export type PerformanceGrade = "A" | "B" | "C" | "D" | "-";

export interface PerformancePredicateResult {
  predicate: string;
  grade: PerformanceGrade;
  badgeClass: string;
  description: string;
}

/**
 * Menghitung predikat dan grade kinerja berdasarkan skor (skala 0 - 100)
 */
export function calculatePerformancePredicate(
  score: number | null | undefined,
): PerformancePredicateResult {
  if (score === null || score === undefined || isNaN(score)) {
    return {
      predicate: "-",
      grade: "-",
      badgeClass: "bg-slate-100 text-slate-600 border-slate-200",
      description: "Belum dinilai",
    };
  }

  const num = Number(score);

  if (num >= 90) {
    return {
      predicate: "Sangat Baik",
      grade: "A",
      badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-300 ring-1 ring-emerald-400/20",
      description: "Melampaui seluruh target & ekspektasi riset dengan kontribusi luar biasa",
    };
  }

  if (num >= 80) {
    return {
      predicate: "Baik",
      grade: "B",
      badgeClass: "bg-blue-50 text-blue-800 border-blue-300 ring-1 ring-blue-400/20",
      description: "Memenuhi seluruh target sasaran riset sesuai standar mutu PSPK",
    };
  }

  if (num >= 70) {
    return {
      predicate: "Cukup",
      grade: "C",
      badgeClass: "bg-amber-50 text-amber-800 border-amber-300 ring-1 ring-amber-400/20",
      description: "Memenuhi sebagian besar sasaran, namun memerlukan penguatan",
    };
  }

  return {
    predicate: "Perlu Perbaikan",
    grade: "D",
    badgeClass: "bg-rose-50 text-rose-800 border-rose-300 ring-1 ring-rose-400/20",
    description: "Capaian di bawah ekspektasi, memerlukan rencana pembinaan intensif",
  };
}

/**
 * Rekomendasi skor akhir:
 * Nilai Atasan Langsung menjadi bobot utama (100% Manager Score),
 * dengan fallback ke nilai staf jika atasan belum mengisi, atau default 85 jika keduanya kosong.
 */
export function calculateRecommendedFinalScore(
  selfScore: number | null | undefined,
  managerScore: number | null | undefined,
): number {
  if (managerScore !== null && managerScore !== undefined && !isNaN(managerScore)) {
    return Number(managerScore);
  }
  if (selfScore !== null && selfScore !== undefined && !isNaN(selfScore)) {
    return Number(selfScore);
  }
  return 85;
}

/**
 * Validasi akumulasi bobot target/sasaran riset (wajib total 100%)
 */
export function validateGoalWeights(goals: Array<{ weight: number }>): {
  totalWeight: number;
  isValid: boolean;
  remainingWeight: number;
} {
  const totalWeight = goals.reduce((sum, g) => sum + (Number(g.weight) || 0), 0);
  const roundedTotal = Math.round(totalWeight * 100) / 100;
  const remainingWeight = Math.max(0, Math.round((100 - roundedTotal) * 100) / 100);
  const isValid = Math.abs(roundedTotal - 100) < 0.01;

  return {
    totalWeight: roundedTotal,
    isValid,
    remainingWeight,
  };
}
