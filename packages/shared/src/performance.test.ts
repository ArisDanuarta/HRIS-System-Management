import { describe, it, expect } from "vitest";
import {
  calculatePerformancePredicate,
  calculateRecommendedFinalScore,
  validateGoalWeights,
} from "./performance";

describe("calculatePerformancePredicate", () => {
  it("harus mengembalikan '-' jika skor null, undefined, atau NaN", () => {
    expect(calculatePerformancePredicate(null).predicate).toBe("-");
    expect(calculatePerformancePredicate(undefined).predicate).toBe("-");
    expect(calculatePerformancePredicate(NaN).predicate).toBe("-");
  });

  it("harus mengembalikan 'Sangat Baik' (Grade A) untuk skor >= 90", () => {
    const res90 = calculatePerformancePredicate(90);
    expect(res90.predicate).toBe("Sangat Baik");
    expect(res90.grade).toBe("A");

    const res100 = calculatePerformancePredicate(100);
    expect(res100.predicate).toBe("Sangat Baik");
    expect(res100.grade).toBe("A");

    const res95 = calculatePerformancePredicate(95.5);
    expect(res95.predicate).toBe("Sangat Baik");
    expect(res95.grade).toBe("A");
  });

  it("harus mengembalikan 'Baik' (Grade B) untuk 80 <= skor < 90", () => {
    const res80 = calculatePerformancePredicate(80);
    expect(res80.predicate).toBe("Baik");
    expect(res80.grade).toBe("B");

    const res89 = calculatePerformancePredicate(89.9);
    expect(res89.predicate).toBe("Baik");
    expect(res89.grade).toBe("B");
  });

  it("harus mengembalikan 'Cukup' (Grade C) untuk 70 <= skor < 80", () => {
    const res70 = calculatePerformancePredicate(70);
    expect(res70.predicate).toBe("Cukup");
    expect(res70.grade).toBe("C");

    const res79 = calculatePerformancePredicate(79.5);
    expect(res79.predicate).toBe("Cukup");
    expect(res79.grade).toBe("C");
  });

  it("harus mengembalikan 'Perlu Perbaikan' (Grade D) untuk skor < 70", () => {
    const res69 = calculatePerformancePredicate(69.9);
    expect(res69.predicate).toBe("Perlu Perbaikan");
    expect(res69.grade).toBe("D");

    const res0 = calculatePerformancePredicate(0);
    expect(res0.predicate).toBe("Perlu Perbaikan");
    expect(res0.grade).toBe("D");
  });
});

describe("calculateRecommendedFinalScore", () => {
  it("harus memprioritaskan skor atasan langsung (100% Manager Score)", () => {
    expect(calculateRecommendedFinalScore(80, 92)).toBe(92);
    expect(calculateRecommendedFinalScore(95, 88)).toBe(88);
  });

  it("harus menggunakan skor mandiri staf jika skor atasan belum diisi", () => {
    expect(calculateRecommendedFinalScore(84, null)).toBe(84);
    expect(calculateRecommendedFinalScore(78, undefined)).toBe(78);
  });

  it("harus mengembalikan 85 jika kedua skor kosong", () => {
    expect(calculateRecommendedFinalScore(null, null)).toBe(85);
  });
});

describe("validateGoalWeights", () => {
  it("harus valid jika total tepat 100%", () => {
    const goals = [{ weight: 40 }, { weight: 30 }, { weight: 30 }];
    const res = validateGoalWeights(goals);
    expect(res.isValid).toBe(true);
    expect(res.totalWeight).toBe(100);
    expect(res.remainingWeight).toBe(0);
  });

  it("harus tidak valid jika total kurang dari 100%", () => {
    const goals = [{ weight: 30 }, { weight: 20 }];
    const res = validateGoalWeights(goals);
    expect(res.isValid).toBe(false);
    expect(res.totalWeight).toBe(50);
    expect(res.remainingWeight).toBe(50);
  });

  it("harus tidak valid jika total lebih dari 100%", () => {
    const goals = [{ weight: 60 }, { weight: 50 }];
    const res = validateGoalWeights(goals);
    expect(res.isValid).toBe(false);
    expect(res.totalWeight).toBe(110);
    expect(res.remainingWeight).toBe(0);
  });
});
