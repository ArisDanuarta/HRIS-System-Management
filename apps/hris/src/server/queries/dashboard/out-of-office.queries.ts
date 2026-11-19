import { prisma } from "@pspk/db";
import { toDateString } from "@pspk/shared";

export interface OutOfOfficePerson {
  id: string;
  employeeId: string;
  fullName: string;
  nickname?: string | null;
  employeeNo: string;
  photoKey?: string | null;
  gender?: string | null;
  department: string;
  position: string;
  kind: "LEAVE" | "BUSINESS_TRIP";
  typeLabel: string;
  info: string;
  startDate?: Date;
  endDate?: Date;
  checkInAt?: Date | null;
}

export interface TodayOutOfOfficeData {
  leaves: OutOfOfficePerson[];
  businessTrips: OutOfOfficePerson[];
  totalCount: number;
}

/**
 * Membersihkan tag `[DINAS]` atau `[BUSINESS_TRIP]` dan mengambil kota/agenda dinas dari notes
 */
export function extractBusinessTripInfo(notes?: string | null): string {
  if (!notes) return "Dinas Luar Kantor";
  const cleaned = notes.replace(/\[DINAS\]|\[BUSINESS_TRIP\]/gi, "").trim();
  return cleaned.length > 0 ? cleaned : "Dinas Luar Kantor";
}

/**
 * Format rentang tanggal cuti ramah pengguna (UTC aware agar tanggal tidak bergeser)
 */
export function formatLeaveRange(startDate: Date, endDate: Date): string {
  const sStr = toDateString(startDate);
  const eStr = toDateString(endDate);

  const startDay = startDate.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });

  if (sStr === eStr) {
    return startDay;
  }

  const endDay = endDate.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

  return `${startDay} – ${endDay}`;
}

/**
 * Mengambil daftar seluruh karyawan aktif PSPK yang sedang cuti (APPROVED)
 * dan sedang perjalanan dinas (BUSINESS_TRIP) pada tanggal target (default: hari ini).
 * Memanfaatkan indeks komposit:
 * - `Attendance`: @@index([date, status])
 * - `LeaveRequest`: @@index([status]), @@index([startDate, endDate])
 */
export async function getTodayOutOfOfficeData(targetDate?: Date): Promise<TodayOutOfOfficeData> {
  const dateObj = targetDate ?? new Date();
  const todayStr = toDateString(dateObj);
  const today = new Date(todayStr);

  const [activeLeaves, activeBusinessTrips] = await Promise.all([
    prisma.leaveRequest.findMany({
      where: {
        status: "APPROVED",
        startDate: { lte: today },
        endDate: { gte: today },
        employee: {
          status: { in: ["ACTIVE", "PROBATION"] },
          deletedAt: null,
        },
      },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            nickname: true,
            employeeNo: true,
            photoKey: true,
            gender: true,
            currentPosition: { select: { title: true } },
            currentDepartment: { select: { name: true } },
          },
        },
        leaveType: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { startDate: "asc" },
        { employee: { fullName: "asc" } },
      ],
    }),
    prisma.attendance.findMany({
      where: {
        date: today,
        status: "BUSINESS_TRIP",
        employee: {
          status: { in: ["ACTIVE", "PROBATION"] },
          deletedAt: null,
        },
      },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            nickname: true,
            employeeNo: true,
            photoKey: true,
            gender: true,
            currentPosition: { select: { title: true } },
            currentDepartment: { select: { name: true } },
          },
        },
      },
      orderBy: {
        employee: { fullName: "asc" },
      },
    }),
  ]);

  const leaves: OutOfOfficePerson[] = activeLeaves.map((item) => ({
    id: item.id,
    employeeId: item.employee.id,
    fullName: item.employee.fullName,
    nickname: item.employee.nickname,
    employeeNo: item.employee.employeeNo,
    photoKey: item.employee.photoKey,
    gender: item.employee.gender,
    department: item.employee.currentDepartment?.name || "Lintas Inisiatif",
    position: item.employee.currentPosition?.title || "Staf",
    kind: "LEAVE",
    typeLabel: item.leaveType.name,
    info: formatLeaveRange(item.startDate, item.endDate),
    startDate: item.startDate,
    endDate: item.endDate,
  }));

  const businessTrips: OutOfOfficePerson[] = activeBusinessTrips.map((item) => ({
    id: item.id,
    employeeId: item.employee.id,
    fullName: item.employee.fullName,
    nickname: item.employee.nickname,
    employeeNo: item.employee.employeeNo,
    photoKey: item.employee.photoKey,
    gender: item.employee.gender,
    department: item.employee.currentDepartment?.name || "Lintas Inisiatif",
    position: item.employee.currentPosition?.title || "Staf",
    kind: "BUSINESS_TRIP",
    typeLabel: "Perjalanan Dinas",
    info: extractBusinessTripInfo(item.notes),
    checkInAt: item.checkInAt,
  }));

  return {
    leaves,
    businessTrips,
    totalCount: leaves.length + businessTrips.length,
  };
}
