import { describe, it, expect } from "vitest";
import {
  calculateWorkingDays,
  isDateOverlapping,
  hasSufficientLeaveBalance,
  toDateString,
} from "./leave";

describe("Leave Calculations (AGENTS.md Section 8.2)", () => {
  describe("toDateString", () => {
    it("formats Date object to YYYY-MM-DD", () => {
      const d = new Date("2026-09-22T10:00:00Z");
      expect(toDateString(d)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe("calculateWorkingDays", () => {
    it("returns 0 if end date is before start date", () => {
      expect(calculateWorkingDays("2026-09-25", "2026-09-20")).toBe(0);
    });

    it("calculates single working day correctly", () => {
      // 2026-09-22 is Tuesday
      expect(calculateWorkingDays("2026-09-22", "2026-09-22")).toBe(1);
    });

    it("returns 0 if date range is entirely on weekend", () => {
      // 2026-09-26 is Saturday, 2026-09-27 is Sunday
      expect(calculateWorkingDays("2026-09-26", "2026-09-27")).toBe(0);
    });

    it("excludes weekends across full week (Monday to Sunday)", () => {
      // 2026-09-21 (Monday) to 2026-09-27 (Sunday) -> 5 working days
      expect(calculateWorkingDays("2026-09-21", "2026-09-27")).toBe(5);
    });

    it("excludes holidays on weekdays", () => {
      // 2026-09-21 (Mon) to 2026-09-25 (Fri) = 5 days
      // Suppose 2026-09-23 is a holiday
      const holidays = ["2026-09-23"];
      expect(calculateWorkingDays("2026-09-21", "2026-09-25", holidays)).toBe(4);
    });

    it("does not double-count if a holiday falls on a weekend", () => {
      // 2026-09-21 (Mon) to 2026-09-27 (Sun)
      // Suppose 2026-09-26 (Saturday) is marked as holiday
      const holidays = ["2026-09-26"];
      expect(calculateWorkingDays("2026-09-21", "2026-09-27", holidays)).toBe(5);
    });
  });

  describe("isDateOverlapping", () => {
    it("detects exact same date range overlap", () => {
      expect(
        isDateOverlapping("2026-09-20", "2026-09-25", "2026-09-20", "2026-09-25"),
      ).toBe(true);
    });

    it("detects partial overlap at start", () => {
      expect(
        isDateOverlapping("2026-09-18", "2026-09-22", "2026-09-20", "2026-09-25"),
      ).toBe(true);
    });

    it("detects partial overlap at end", () => {
      expect(
        isDateOverlapping("2026-09-24", "2026-09-28", "2026-09-20", "2026-09-25"),
      ).toBe(true);
    });

    it("detects enclosure overlap (A inside B)", () => {
      expect(
        isDateOverlapping("2026-09-22", "2026-09-23", "2026-09-20", "2026-09-25"),
      ).toBe(true);
    });

    it("returns false for non-overlapping consecutive ranges", () => {
      // Range A: Sept 20 to Sept 22. Range B: Sept 23 to Sept 25.
      expect(
        isDateOverlapping("2026-09-20", "2026-09-22", "2026-09-23", "2026-09-25"),
      ).toBe(false);
    });
  });

  describe("hasSufficientLeaveBalance", () => {
    it("returns true when quota has exact or more days available", () => {
      expect(hasSufficientLeaveBalance(12, 0, 3)).toBe(true);
      expect(hasSufficientLeaveBalance(12, 9, 3)).toBe(true);
    });

    it("returns false when requested days exceed remaining quota", () => {
      expect(hasSufficientLeaveBalance(12, 10, 3)).toBe(false);
      expect(hasSufficientLeaveBalance(12, 12, 1)).toBe(false);
    });

    it("returns false for zero or negative requested days", () => {
      expect(hasSufficientLeaveBalance(12, 0, 0)).toBe(false);
      expect(hasSufficientLeaveBalance(12, 0, -1)).toBe(false);
    });
  });
});
