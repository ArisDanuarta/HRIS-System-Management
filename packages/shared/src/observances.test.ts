import { describe, it, expect } from "vitest";
import {
  INDONESIAN_NATIONAL_OBSERVANCES,
  getIndonesianObservancesForMonth,
  getIndonesianObservancesForDate,
} from "./observances";

describe("Indonesian National Observances (Hari Peringatan Nasional)", () => {
  it("should contain comprehensive curated observances", () => {
    expect(INDONESIAN_NATIONAL_OBSERVANCES.length).toBeGreaterThanOrEqual(40);
  });

  it("should contain crucial education observances (Hardiknas & HGN)", () => {
    const hardiknas = INDONESIAN_NATIONAL_OBSERVANCES.find((o) => o.month === 5 && o.day === 2);
    expect(hardiknas).toBeDefined();
    expect(hardiknas?.name).toContain("Hari Pendidikan Nasional");
    expect(hardiknas?.category).toBe("education");

    const hgn = INDONESIAN_NATIONAL_OBSERVANCES.find((o) => o.month === 11 && o.day === 25);
    expect(hgn).toBeDefined();
    expect(hgn?.name).toContain("Hari Guru Nasional");
    expect(hgn?.category).toBe("education");
  });

  it("should fetch observances for a specific month (e.g. Mei 2026)", () => {
    const mayObservances = getIndonesianObservancesForMonth(2026, 5);
    expect(mayObservances.length).toBeGreaterThan(0);

    const dates = mayObservances.map((o) => o.dateStr);
    expect(dates).toContain("2026-05-02"); // Hardiknas
    expect(dates).toContain("2026-05-20"); // Harkitnas
  });

  it("should fetch observances for a specific date (e.g. 28 Oktober 2026)", () => {
    const sumpahPemuda = getIndonesianObservancesForDate(2026, 10, 28);
    expect(sumpahPemuda.length).toBe(1);
    expect(sumpahPemuda[0]?.name).toBe("Hari Sumpah Pemuda");
    expect(sumpahPemuda[0]?.dateStr).toBe("2026-10-28");
  });

  it("should return empty array for dates without observances", () => {
    // 31 Februari
    const empty = getIndonesianObservancesForDate(2026, 2, 31);
    expect(empty).toEqual([]);
  });
});
