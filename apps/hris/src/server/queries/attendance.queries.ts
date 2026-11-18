import { prisma, Prisma, AttendanceStatus, AttendanceSource } from "@pspk/db";
import { toDateString } from "@pspk/shared";
import { getEmployeeLeaveBalances } from "./leave.queries";

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
 * Retrieves attendance summary and records for HR / Team Rekap view with pagination.
 */
export async function getAttendanceRekap(options: {
  year: number;
  month: number;
  departmentId?: string;
  search?: string;
  teamManagerId?: string;
  managerDepartmentId?: string;
  excludeEmployeeId?: string;
  page?: number;
  pageSize?: number;
}) {
  const {
    year,
    month,
    departmentId,
    search,
    teamManagerId,
    managerDepartmentId,
    excludeEmployeeId,
    page,
    pageSize,
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

  // Paginasi: default 10 pegawai per halaman jika ditentukan atau saat pagination aktif
  const isPaginated = typeof page === "number" || typeof pageSize === "number";
  const currentPage = page ? Math.max(1, page) : 1;
  const limit = pageSize ? Math.max(1, pageSize) : 10;
  const skip = isPaginated ? (currentPage - 1) * limit : undefined;
  const take = isPaginated ? limit : undefined;

  // Eksekusi kueri secara paralel: total pegawai, ringkasan agregasi presensi di level database, dan daftar pegawai
  const [totalEmployees, attendanceStatusGroups, employees, departments] = await Promise.all([
    prisma.employee.count({ where: employeeWhere }),
    prisma.attendance.groupBy({
      by: ["status"],
      where: {
        employee: employeeWhere,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: { id: true },
    }),
    prisma.employee.findMany({
      where: employeeWhere,
      skip,
      take,
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
    prisma.department.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const totalPages = isPaginated ? Math.ceil(totalEmployees / limit) || 1 : 1;

  // Hitung metrik KPI organisasi dari hasil agregasi database tanpa memuat ribuan baris log
  let totalPresent = 0;
  let totalLate = 0;
  let totalLeave = 0;
  let totalAbsent = 0;

  for (const group of attendanceStatusGroups) {
    const count = group._count.id;
    if (group.status === "PRESENT") totalPresent += count;
    else if (group.status === "LATE") totalLate += count;
    else if (group.status === "LEAVE") totalLeave += count;
    else if (group.status === "ABSENT") totalAbsent += count;
    else if (group.status === "WFH") totalPresent += count;
  }

  const totalAttended = totalPresent + totalLate;
  const onTimeRate = totalAttended > 0 ? Math.round((totalPresent / totalAttended) * 100) : 0;

  const employeeIds = employees.map((e) => e.id);

  // Ambil hanya presensi pegawai yang tampil di halaman aktif
  const attendances =
    employeeIds.length > 0
      ? await prisma.attendance.findMany({
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
        })
      : [];

  return {
    employees,
    attendances,
    departments,
    pagination: {
      total: totalEmployees,
      page: currentPage,
      limit,
      totalPages,
    },
    orgOverallStats: {
      totalPresent,
      totalLate,
      totalLeave,
      totalAbsent,
      onTimeRate,
    },
    period: {
      year,
      month,
      startDate,
      endDate,
    },
  };
}

export const MONTH_NAMES_ID = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export interface EmployeeMonthlyAttendanceRecord {
  id: string;
  date: Date;
  dateString: string;
  dayNumber: number;
  dayOfWeek: number; // 0=Sun, 1=Mon, ..., 6=Sat
  checkInAt: Date | null;
  checkOutAt: Date | null;
  status: AttendanceStatus;
  source: AttendanceSource;
  notes: string | null;
  correctionReason: string | null;
  workMinutes: number;
  workDurationFormatted: string;
}

export interface EmployeeMonthlyAttendanceOverview {
  period: {
    year: number;
    month: number;
    monthName: string;
    daysInMonth: number;
    startDate: Date;
    endDate: Date;
  };
  stats: {
    workingDaysCount: number;
    presentCount: number;
    lateCount: number;
    wfhCount: number;
    leaveCount: number;
    absentCount: number;
    holidayCount: number;
    recordedDays: number;
    totalWorkMinutes: number;
    totalWorkHours: string;
    timesheetTotalHours: number;
    attendanceRate: number;
  };
  attendances: EmployeeMonthlyAttendanceRecord[];
  holidays: Array<{
    id: string;
    date: Date;
    dateString: string;
    name: string;
    isCollectiveLeave: boolean;
  }>;
  approvedLeaves: Array<{
    id: string;
    leaveTypeName: string;
    isPaid: boolean;
    startDate: Date;
    endDate: Date;
    days: number;
    reason: string | null;
  }>;
  leaveBalances: Array<{
    id: string;
    leaveTypeId: string;
    leaveTypeName: string;
    year: number;
    quotaDays: number;
    usedDays: number;
    remainingDays: number;
    usagePercentage: number;
    isPaid: boolean;
  }>;
}

/**
 * Mengambil ringkasan kehadiran 360°, log harian, hari libur, pengajuan cuti,
 * dan saldo cuti tahunan seorang pegawai untuk bulan dan tahun yang ditentukan.
 */
export async function getEmployeeMonthlyAttendanceOverview(
  employeeId: string,
  year: number,
  month: number, // 1 to 12
): Promise<EmployeeMonthlyAttendanceOverview> {
  const safeYear = Math.max(2000, Math.min(2100, year || new Date().getFullYear()));
  const safeMonth = Math.max(1, Math.min(12, month || new Date().getMonth() + 1));

  const startDate = new Date(Date.UTC(safeYear, safeMonth - 1, 1, 0, 0, 0, 0));
  const endDate = new Date(Date.UTC(safeYear, safeMonth, 0, 23, 59, 59, 999));
  const daysInMonth = new Date(safeYear, safeMonth, 0).getDate();

  // Eksekusi paralel query kehadiran, libur, cuti, timesheet, dan saldo cuti
  const [
    rawAttendances,
    rawHolidays,
    rawLeaves,
    rawTimesheets,
    leaveBalances,
    workSchedule,
  ] = await Promise.all([
    prisma.attendance.findMany({
      where: {
        employeeId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: "asc" },
    }),
    prisma.holiday.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: "asc" },
    }),
    prisma.leaveRequest.findMany({
      where: {
        employeeId,
        status: "APPROVED",
        startDate: { lte: endDate },
        endDate: { gte: startDate },
      },
      include: {
        leaveType: { select: { name: true, isPaid: true } },
      },
      orderBy: { startDate: "asc" },
    }),
    prisma.timesheetSubmission.findMany({
      where: {
        employeeId,
        periodYear: safeYear,
        periodMonth: safeMonth,
        status: "APPROVED",
      },
      select: { totalHours: true },
    }),
    getEmployeeLeaveBalances(employeeId, safeYear),
    prisma.workScheduleSetting.findFirst({
      where: { isDefault: true },
      select: { workingDays: true },
    }),
  ]);

  const workingDayIndices = workSchedule?.workingDays || [1, 2, 3, 4, 5]; // 1=Mon, ..., 5=Fri
  const holidayDateStrings = new Set(
    rawHolidays.map((h) => toDateString(h.date)),
  );

  // Hitung jumlah hari kerja efektif pada bulan tersebut
  let workingDaysCount = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const dayDate = new Date(safeYear, safeMonth - 1, d);
    const dayOfWeek = dayDate.getDay(); // 0=Sun, 1=Mon, ...
    const dateStr = toDateString(dayDate);

    if (workingDayIndices.includes(dayOfWeek) && !holidayDateStrings.has(dateStr)) {
      workingDaysCount++;
    }
  }

  // Agregasi statistik kehadiran
  let presentCount = 0;
  let lateCount = 0;
  let wfhCount = 0;
  let leaveCount = 0;
  let absentCount = 0;
  let holidayCount = 0;
  let totalWorkMinutes = 0;

  const attendances: EmployeeMonthlyAttendanceRecord[] = rawAttendances.map((a) => {
    if (a.status === "PRESENT") presentCount++;
    else if (a.status === "LATE") lateCount++;
    else if (a.status === "WFH") wfhCount++;
    else if (a.status === "LEAVE") leaveCount++;
    else if (a.status === "ABSENT") absentCount++;
    else if (a.status === "HOLIDAY") holidayCount++;

    let workMinutes = 0;
    let workDurationFormatted = "-";

    if (a.checkInAt && a.checkOutAt) {
      const diffMs = a.checkOutAt.getTime() - a.checkInAt.getTime();
      if (diffMs > 0) {
        workMinutes = Math.round(diffMs / 60000);
        totalWorkMinutes += workMinutes;
        const hours = Math.floor(workMinutes / 60);
        const mins = workMinutes % 60;
        workDurationFormatted = `${hours}j ${mins}m`;
      }
    }

    const aDate = new Date(a.date);
    return {
      id: a.id,
      date: a.date,
      dateString: toDateString(a.date),
      dayNumber: aDate.getUTCDate(),
      dayOfWeek: aDate.getUTCDay(),
      checkInAt: a.checkInAt,
      checkOutAt: a.checkOutAt,
      status: a.status,
      source: a.source,
      notes: a.notes,
      correctionReason: a.correctionReason,
      workMinutes,
      workDurationFormatted,
    };
  });

  const timesheetTotalHours = rawTimesheets.reduce(
    (acc, ts) => acc + Number(ts.totalHours),
    0,
  );

  const totalEffectiveAttended = presentCount + lateCount + wfhCount;
  const attendanceRate =
    workingDaysCount > 0
      ? Math.min(100, Math.round((totalEffectiveAttended / workingDaysCount) * 100))
      : 0;

  const totalWorkHours = (totalWorkMinutes / 60).toFixed(1);

  return {
    period: {
      year: safeYear,
      month: safeMonth,
      monthName: MONTH_NAMES_ID[safeMonth - 1] || "",
      daysInMonth,
      startDate,
      endDate,
    },
    stats: {
      workingDaysCount,
      presentCount,
      lateCount,
      wfhCount,
      leaveCount,
      absentCount,
      holidayCount,
      recordedDays: attendances.length,
      totalWorkMinutes,
      totalWorkHours,
      timesheetTotalHours,
      attendanceRate,
    },
    attendances,
    holidays: rawHolidays.map((h) => ({
      id: h.id,
      date: h.date,
      dateString: toDateString(h.date),
      name: h.name,
      isCollectiveLeave: h.isCollectiveLeave,
    })),
    approvedLeaves: rawLeaves.map((l) => ({
      id: l.id,
      leaveTypeName: l.leaveType.name,
      isPaid: l.leaveType.isPaid,
      startDate: l.startDate,
      endDate: l.endDate,
      days: Number(l.days),
      reason: l.reason,
    })),
    leaveBalances: leaveBalances.map((lb) => ({
      id: lb.id,
      leaveTypeId: lb.leaveTypeId,
      leaveTypeName: lb.leaveType.name,
      year: lb.year,
      quotaDays: lb.quotaDays,
      usedDays: lb.usedDays,
      remainingDays: lb.remainingDays,
      usagePercentage: lb.usagePercentage,
      isPaid: lb.leaveType.isPaid,
    })),
  };
}
