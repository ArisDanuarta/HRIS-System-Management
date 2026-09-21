import { describe, it, expect } from "vitest";
import { formatRupiah, formatDate } from "./formatters";

describe("formatRupiah", () => {
  it("formats positive numbers correctly", () => {
    const formatted = formatRupiah(8500000);
    expect(formatted).toMatch(/Rp\s*8\.500\.000/);
  });

  it("handles 0, null, and undefined safely", () => {
    expect(formatRupiah(0)).toMatch(/Rp\s*0/);
    expect(formatRupiah(null)).toBe("Rp 0");
    expect(formatRupiah(undefined)).toBe("Rp 0");
    expect(formatRupiah("")).toBe("Rp 0");
  });
});

describe("formatDate", () => {
  it("formats Date object with Indonesian month names", () => {
    const date = new Date("2026-09-21T00:00:00Z");
    const formatted = formatDate(date);
    expect(formatted).toContain("2026");
    expect(formatted).toMatch(/September|Sep/i);
  });

  it("returns '-' for null or invalid date", () => {
    expect(formatDate(null)).toBe("-");
    expect(formatDate(undefined)).toBe("-");
    expect(formatDate("invalid-date")).toBe("-");
  });
});
