/**
 * Pure functions for HRIS Leave calculations.
 * Re-exported from @pspk/shared for single source of truth.
 * Adheres strictly to AGENTS.md Section 8.2.
 */

export {
  toDateString,
  calculateWorkingDays,
  isDateOverlapping,
  hasSufficientLeaveBalance,
} from "@pspk/shared";
