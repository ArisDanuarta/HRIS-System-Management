import { prisma } from "@pspk/db";
import {
  toDateString,
  getIndonesianObservancesForMonth,
  type ComputedObservance,
} from "@pspk/shared";

export type WorkCalendarObservance = ComputedObservance;

export interface WorkCalendarLeave {
  id: string;
  startDate: Date;
  endDate: Date;
  days: number;
  reason: string | null;
  status: string;
  employee: {
    id: string;
    fullName: string;
    employeeNo: string;
    department: string | null;
    position: string | null;
  };
  leaveType: {
    name: string;
    isPaid: boolean;
  };
}

export interface WorkCalendarHoliday {
  id: string;
  date: Date;
  name: string;
  isCollectiveLeave: boolean;
}

export interface WorkCalendarMeeting {
  id: string;
  title: string;
  description: string | null;
  startAt: Date;
  endAt: Date;
  isAllDay: boolean;
  meetUrl: string | null;
  source: string;
}

export interface WorkCalendarResult {
  leaves: WorkCalendarLeave[];
  holidays: WorkCalendarHoliday[];
  observances: WorkCalendarObservance[];
  meetings: WorkCalendarMeeting[];
  period: { year: number; month: number; startDate: Date; endDate: Date };
}

/**
 * Retrieves all calendar events (approved leaves + holidays + personal meetings) for a given month.
 * Fase A: cuti tim + hari libur nasional dari DB.
 * Fase C: ditambahkan Google Calendar events (meeting) per employee.
 */
export async function getWorkCalendarEvents(
  year: number,
  month: number,
  employeeId?: string | null,
): Promise<WorkCalendarResult> {
  const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

  const [approvedLeaves, holidays, meetings] = await Promise.all([
    // Semua cuti yang disetujui dalam bulan ini (seluruh tim — terlihat oleh semua karyawan)
    prisma.leaveRequest.findMany({
      where: {
        status: "APPROVED",
        startDate: { lte: endDate },
        endDate: { gte: startDate },
      },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            employeeNo: true,
            currentDepartment: { select: { name: true } },
            currentPosition: { select: { title: true } },
          },
        },
        leaveType: { select: { name: true, isPaid: true } },
      },
      orderBy: { startDate: "asc" },
    }),

    // Hari libur nasional & cuti bersama
    prisma.holiday.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
      },
      orderBy: { date: "asc" },
    }),

    // Meeting Google Meet pribadi karyawan (hanya milik sendiri)
    employeeId
      ? prisma.calendarEvent.findMany({
          where: {
            employeeId,
            type: "MEETING",
            startAt: { lte: endDate },
            endAt: { gte: startDate },
          },
          orderBy: { startAt: "asc" },
        })
      : Promise.resolve([]),
  ]);

  return {
    leaves: approvedLeaves.map((l) => ({
      id: l.id,
      startDate: l.startDate,
      endDate: l.endDate,
      days: Number(l.days),
      reason: l.reason,
      status: l.status,
      employee: {
        id: l.employee.id,
        fullName: l.employee.fullName,
        employeeNo: l.employee.employeeNo,
        department: l.employee.currentDepartment?.name ?? null,
        position: l.employee.currentPosition?.title ?? null,
      },
      leaveType: {
        name: l.leaveType.name,
        isPaid: l.leaveType.isPaid,
      },
    })),
    holidays,
    observances: getIndonesianObservancesForMonth(year, month),
    meetings: meetings.map((m) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      startAt: m.startAt,
      endAt: m.endAt,
      isAllDay: m.isAllDay,
      meetUrl: m.meetUrl,
      source: m.source,
    })),
    period: { year, month, startDate, endDate },
  };
}

/**
 * Helper: Check apakah suatu tanggal (string YYYY-MM-DD) jatuh dalam rentang leave.
 */
export function isLeaveOnDate(
  leave: { startDate: Date; endDate: Date },
  dateStr: string,
): boolean {
  const target = new Date(dateStr).getTime();
  const s = new Date(toDateString(leave.startDate)).getTime();
  const e = new Date(toDateString(leave.endDate)).getTime();
  return target >= s && target <= e;
}
