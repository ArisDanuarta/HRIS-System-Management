import { prisma, Prisma } from "@pspk/db";
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
  const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

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
 * Retrieves attendance summary and records for HR / Team Rekap view.
 */
export async function getAttendanceRekap(options: {
  year: number;
  month: number;
  departmentId?: string;
  search?: string;
  teamManagerId?: string;
  managerDepartmentId?: string;
  excludeEmployeeId?: string;
}) {
  const {
    year,
    month,
    departmentId,
    search,
    teamManagerId,
    managerDepartmentId,
    excludeEmployeeId,
  } = options;
  const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

  // Build employee filter using AND array for clean composition
  const andConditions: Prisma.EmployeeWhereInput[] = [
    { deletedAt: null },
    { status: { in: ["ACTIVE", "PROBATION"] } },
  ];

  if (excludeEmployeeId) {
    andConditions.push({ id: { not: excludeEmployeeId } });
  }

  // Filter scope tim (karyawan bawahan langsung atasan ATAU yang berada di divisi yang dipimpin)
  if (teamManagerId || managerDepartmentId) {
    const teamOr: Prisma.EmployeeWhereInput[] = [];
    if (teamManagerId) {
      teamOr.push({ managerId: teamManagerId });
    }
    if (managerDepartmentId) {
      teamOr.push({ currentDepartmentId: managerDepartmentId });
    }
    if (teamOr.length > 0) {
      andConditions.push({ OR: teamOr });
    }
  } else if (departmentId && departmentId !== "ALL") {
    andConditions.push({ currentDepartmentId: departmentId });
  }

  if (search && search.trim() !== "") {
    const q = search.trim();
    andConditions.push({
      OR: [
        { fullName: { contains: q, mode: "insensitive" } },
        { employeeNo: { contains: q, mode: "insensitive" } },
      ],
    });
  }

  const employeeWhere: Prisma.EmployeeWhereInput = { AND: andConditions };

  const employees = await prisma.employee.findMany({
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
  });

  const employeeIds = employees.map((e) => e.id);

  const [attendances, departments] = await Promise.all([
    prisma.attendance.findMany({
      where: {
        employeeId: { in: employeeIds },
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
