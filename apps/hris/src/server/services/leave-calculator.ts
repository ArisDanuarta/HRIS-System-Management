/**
 * Pure functions for HRIS Leave calculations.
 * Adheres strictly to AGENTS.md Section 8.2.
 */

/**
 * Formats a Date object or string to YYYY-MM-DD for date-only comparison.
 */
export function toDateString(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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
    const dayOfWeek = current.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
    const isHoliday = holidaySet.has(toDateString(current));

    if (!isWeekend && !isHoliday) {
      workingDays++;
    }

    // Advance 1 day
    current.setDate(current.getDate() + 1);
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
