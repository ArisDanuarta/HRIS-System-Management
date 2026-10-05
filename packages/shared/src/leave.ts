import { toDateStringInTimezone } from "./formatters";

/**
 * Pure functions for HRIS Leave calculations.
 * Adheres strictly to AGENTS.md Section 8.2.
 */

/**
 * Formats a Date object or string to YYYY-MM-DD for date-only comparison.
 * If input is already YYYY-MM-DD string, preserves it.
 * Defaults to operational timezone (Asia/Jakarta) to prevent UTC midnight date shift.
 */
export function toDateString(
  date: Date | string,
  timeZone: string = process.env.APP_TIMEZONE || "Asia/Jakarta",
): string {
  if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date;
  }
  const d = typeof date === "string" ? new Date(date) : date;
  return toDateStringInTimezone(d, timeZone);
}

/**
 * Calculates working days between startDate and endDate (inclusive).
 * Automatically excludes:
 * - Saturdays (day 6) and Sundays (day 0)
 * - Any date present in the holidays array
 *
 * @param startDate - Range start date
 * @param endDate - Range end date
 * @param holidays - Array of holiday dates (Date or YYYY-MM-DD strings)
 * @returns Number of business working days
 */
export function calculateWorkingDays(
  startDate: Date | string,
  endDate: Date | string,
  holidays: (Date | string)[] = [],
): number {
  const start = new Date(toDateString(startDate));
  const end = new Date(toDateString(endDate));

  if (end < start) {
    return 0;
  }

  // Pre-calculate holiday date strings set for O(1) lookups
  const holidaySet = new Set(holidays.map((h) => toDateString(h)));

  let workingDays = 0;
  const current = new Date(start);

  while (current <= end) {
    const dayOfWeek = current.getUTCDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
    const isHoliday = holidaySet.has(toDateString(current));

    if (!isWeekend && !isHoliday) {
      workingDays++;
    }

    // Advance 1 day in UTC
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return workingDays;
}

/**
 * Checks if two date ranges overlap (inclusive).
 * Range A: [startA, endA]
 * Range B: [startB, endB]
 */
export function isDateOverlapping(
  startA: Date | string,
  endA: Date | string,
  startB: Date | string,
  endB: Date | string,
): boolean {
  const sA = new Date(toDateString(startA)).getTime();
  const eA = new Date(toDateString(endA)).getTime();
  const sB = new Date(toDateString(startB)).getTime();
  const eB = new Date(toDateString(endB)).getTime();

  return sA <= eB && eA >= sB;
}

/**
 * Validates if an employee has enough remaining leave balance for a request.
 */
export function hasSufficientLeaveBalance(
  quotaDays: number,
  usedDays: number,
  requestedDays: number,
): boolean {
  if (requestedDays <= 0) return false;
  const remaining = quotaDays - usedDays;
  return remaining >= requestedDays;
}

/**
 * Calculates new leave quota after administrative adjustment.
 * Ensures quota never falls below days already used.
 */
export function calculateAdjustedLeaveQuota(
  currentQuota: number,
  currentUsed: number,
  mode: "ADD" | "DEDUCT" | "SET",
  amount: number,
): number {
  const roundedAmount = Math.max(0, Math.round(amount));
  const minAllowed = Math.ceil(Math.max(0, currentUsed));

  if (mode === "ADD") {
    return currentQuota + roundedAmount;
  }
  if (mode === "DEDUCT") {
    return Math.max(minAllowed, currentQuota - roundedAmount);
  }
  if (mode === "SET") {
    return Math.max(minAllowed, roundedAmount);
  }
  return currentQuota;
}

/**
 * Calculates the balance impact and description for an administrative leave override.
 */
export function getLeaveOverrideImpact(
  currentStatus: string,
  targetStatus: string,
  days: number,
): {
  balanceDelta: number;
  requiresAttendanceClear: boolean;
  requiresAttendanceMark: boolean;
  description: string;
} {
  const numDays = Math.max(0, days);
  const wasApproved = currentStatus === "APPROVED";
  const willBeApproved = targetStatus === "APPROVED";

  if (wasApproved && !willBeApproved) {
    return {
      balanceDelta: numDays,
      requiresAttendanceClear: true,
      requiresAttendanceMark: false,
      description: `Saldo cuti pegawai akan dikembalikan sebesar +${numDays} hari, dan catatan presensi cuti akan dihapus.`,
    };
  }

  if (!wasApproved && willBeApproved) {
    return {
      balanceDelta: -numDays,
      requiresAttendanceClear: false,
      requiresAttendanceMark: true,
      description: `Saldo cuti pegawai akan dipotong sebesar -${numDays} hari, dan jadwal kerja akan ditandai sebagai LEAVE.`,
    };
  }

  return {
    balanceDelta: 0,
    requiresAttendanceClear: false,
    requiresAttendanceMark: false,
    description: "Perubahan status ini tidak memengaruhi saldo cuti pegawai.",
  };
}


