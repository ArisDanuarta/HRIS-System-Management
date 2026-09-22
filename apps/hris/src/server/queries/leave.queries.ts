import { prisma, LeaveStatus } from "@pspk/db";

/**
 * Retrieves leave balances for an employee in a given year.
 */
export async function getEmployeeLeaveBalances(employeeId: string, year: number = 2026) {
  const balances = await prisma.leaveBalance.findMany({
    where: {
      employeeId,
      year,
    },
    include: {
      leaveType: true,
    },
    orderBy: {
      leaveType: { name: "asc" },
    },
  });

  return balances.map((b) => {
    const used = Number(b.usedDays);
    const quota = b.quotaDays;
    const remaining = Math.max(0, quota - used);
    return {
      ...b,
      usedDaysNumber: used,
      remainingDays: remaining,
      usagePercentage: quota > 0 ? Math.round((used / quota) * 100) : 0,
    };
  });
}

/**
 * Retrieves personal leave requests for an employee.
 */
export async function getPersonalLeaveRequests(employeeId: string, status?: LeaveStatus) {
  const where: Record<string, unknown> = { employeeId };
  if (status) where.status = status;

  const requests = await prisma.leaveRequest.findMany({
    where,
    include: {
      leaveType: { select: { name: true, isPaid: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return requests;
}

/**
 * Retrieves leave requests pending approval for a manager or Admin HR.
 */
export async function getPendingLeaveApprovals(options?: {
  managerId?: string;
  isSuperOrHr?: boolean;
}) {
  const where: Record<string, unknown> = {
    status: "PENDING",
  };

  // If not HR, only show requests from direct reports
  if (!options?.isSuperOrHr && options?.managerId) {
    where.employee = {
      managerId: options.managerId,
    };
  }

  const pendingRequests = await prisma.leaveRequest.findMany({
    where,
    include: {
      employee: {
        select: {
          id: true,
          fullName: true,
          employeeNo: true,
          workEmail: true,
          currentDepartment: { select: { name: true } },
          currentPosition: { select: { title: true } },
        },
      },
      leaveType: { select: { id: true, name: true, isPaid: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return pendingRequests;
}

/**
 * Retrieves all leave requests for HR management table with filtering.
 */
export async function getAllLeaveRequests(options?: {
  status?: LeaveStatus | "ALL";
  departmentId?: string;
  page?: number;
  pageSize?: number;
}) {
  const { status = "ALL", departmentId, page = 1, pageSize = 20 } = options || {};

  const where: Record<string, unknown> = {};

  if (status && status !== "ALL") {
    where.status = status;
  }

  if (departmentId && departmentId !== "ALL") {
    where.employee = {
      currentDepartmentId: departmentId,
    };
  }

  const [totalCount, requests] = await Promise.all([
    prisma.leaveRequest.count({ where }),
    prisma.leaveRequest.findMany({
      where,
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
        leaveType: { select: { id: true, name: true, isPaid: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    requests,
    pagination: {
      totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
    },
  };
}

/**
 * Retrieves approved leaves and holidays for a given month calendar.
 */
export async function getLeaveCalendarEvents(year: number, month: number) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  const [approvedLeaves, holidays] = await Promise.all([
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
        leaveType: { select: { name: true } },
      },
      orderBy: { startDate: "asc" },
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
  ]);

  return {
    approvedLeaves,
    holidays,
    period: { year, month, startDate, endDate },
  };
}

/**
 * Retrieves all leave types configured in the system.
 */
export async function getLeaveTypes() {
  return prisma.leaveType.findMany({
    orderBy: { name: "asc" },
  });
}

/**
 * Retrieves all holidays for a given year.
 */
export async function getHolidays(year: number = 2026) {
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);

  return prisma.holiday.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { date: "asc" },
  });
}
