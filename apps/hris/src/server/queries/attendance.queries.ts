import { prisma } from "@pspk/db";
import { toDateString } from "@pspk/shared";

/**
 * Retrieves today's attendance record for an employee.
 */
export async function getTodayAttendance(employeeId: string) {
  const todayStr = toDateString(new Date());
  const todayDate = new Date(todayStr);

  const attendance = await prisma.attendance.findUnique({
    where: {
      employeeId_date: {
        employeeId,
        date: todayDate,
      },
    },
  });

  return attendance;
}

/**
 * Retrieves personal monthly attendance records and statistics for an employee.
 */
export async function getPersonalMonthlyAttendance(
  employeeId: string,
  year: number,
  month: number, // 1 to 12
) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0); // Last day of month

  const [attendances, employee] = await Promise.all([
    prisma.attendance.findMany({
      where: {
        employeeId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: "desc" },
    }),
    prisma.employee.findUnique({
      where: { id: employeeId },
      select: {
        id: true,
        fullName: true,
        employeeNo: true,
        currentPosition: { select: { title: true } },
        currentDepartment: { select: { name: true } },
      },
    }),
  ]);

  // Aggregate monthly summary
  let presentCount = 0;
  let lateCount = 0;
  let leaveCount = 0;
  let absentCount = 0;
  let totalWorkMinutes = 0;

  for (const a of attendances) {
    if (a.status === "PRESENT") presentCount++;
    else if (a.status === "LATE") lateCount++;
    else if (a.status === "LEAVE") leaveCount++;
    else if (a.status === "ABSENT") absentCount++;

    if (a.checkInAt && a.checkOutAt) {
      const diffMs = a.checkOutAt.getTime() - a.checkInAt.getTime();
      if (diffMs > 0) {
        totalWorkMinutes += Math.round(diffMs / 60000);
      }
    }
  }

  const totalWorkHours = (totalWorkMinutes / 60).toFixed(1);

  return {
    employee,
    attendances,
    stats: {
      presentCount,
      lateCount,
      leaveCount,
      absentCount,
      totalWorkHours,
      recordedDays: attendances.length,
    },
  };
}

/**
 * Retrieves attendance summary and records for HR Rekap view.
 */
export async function getAttendanceRekap(options: {
  year: number;
  month: number;
  departmentId?: string;
  search?: string;
}) {
  const { year, month, departmentId, search } = options;
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  // Build employee filter
  const employeeWhere: Record<string, unknown> = {
    deletedAt: null,
    status: { in: ["ACTIVE", "PROBATION"] },
  };

  if (departmentId && departmentId !== "ALL") {
    employeeWhere.currentDepartmentId = departmentId;
  }

  if (search) {
    employeeWhere.OR = [
      { fullName: { contains: search, mode: "insensitive" } },
      { employeeNo: { contains: search, mode: "insensitive" } },
    ];
  }

  const [employees, attendances, departments] = await Promise.all([
    prisma.employee.findMany({
      where: employeeWhere,
      select: {
        id: true,
        employeeNo: true,
        fullName: true,
        status: true,
        currentPosition: { select: { title: true } },
        currentDepartment: { select: { id: true, name: true } },
      },
      orderBy: { fullName: "asc" },
    }),
    prisma.attendance.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        employeeId: true,
        date: true,
        checkInAt: true,
        checkOutAt: true,
        status: true,
        source: true,
        correctionReason: true,
      },
      orderBy: { date: "desc" },
    }),
    prisma.department.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return {
    employees,
    attendances,
    departments,
    period: {
      year,
      month,
      startDate,
      endDate,
    },
  };
}
