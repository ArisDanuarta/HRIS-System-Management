import { prisma } from "@pspk/db";
import { AuthContext, assertCan } from "@pspk/rbac";

export interface ManagerDashboardData {
  totalTeamMembers: number;
  teamPresentCount: number;
  pendingLeavesCount: number;
  pendingLeaveRequests: {
    id: string;
    employeeId: string;
    employeeName: string;
    employeeNo: string;
    positionTitle: string;
    leaveTypeName: string;
    isPaid: boolean;
    startDate: Date;
    endDate: Date;
    days: number;
    reason: string | null;
    createdAt: Date;
  }[];
  weekTeamLeaves: {
    id: string;
    employeeId: string;
    employeeName: string;
    leaveTypeName: string;
    startDate: Date;
    endDate: Date;
  }[];
  startOfWeek: Date;
  endOfWeek: Date;
  managerOwn: {
    todayAttendance: {
      id: string;
      checkInAt: Date | null;
      checkOutAt: Date | null;
      status: string;
      notes?: string | null;
    } | null;
    leaveBalances: {
      id: string;
      leaveTypeId: string;
      year: number;
      quotaDays: number;
      usedDaysNumber: number;
      remainingDays: number;
      usagePercentage: number;
      leaveType: {
        name: string;
        isPaid: boolean;
        requiresAttachment: boolean;
      };
    }[];
  };
}

export async function getManagerDashboard(ctx: AuthContext): Promise<ManagerDashboardData> {
  assertCan(ctx, "hris.leave.read:team", { managerEmployeeId: ctx.employeeId });

  if (!ctx.employeeId) {
    throw new Error("Profil manajer tidak ditemukan untuk akun ini.");
  }

  const managerId = ctx.employeeId;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const currentYear = today.getFullYear();

  // Find direct subordinates
  const subordinates = await prisma.employee.findMany({
    where: {
      managerId,
      status: "ACTIVE",
      deletedAt: null,
    },
    select: {
      id: true,
      fullName: true,
      employeeNo: true,
      currentPosition: { select: { title: true } },
      currentDepartment: { select: { name: true } },
    },
  });

  const subordinateIds = subordinates.map((s) => s.id);

  // Week range for calendar (Monday to Friday of current week)
  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() + mondayOffset);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 4);
  endOfWeek.setHours(23, 59, 59, 999);

  const [
    todayTeamAttendances,
    pendingLeaveRequests,
    weekTeamLeaves,
    managerAttendance,
    managerBalances,
  ] = await Promise.all([
    // Today's attendance for team
    subordinateIds.length > 0
      ? prisma.attendance.findMany({
          where: {
            employeeId: { in: subordinateIds },
            date: today,
          },
        })
      : [],

    // Actionable pending leave requests from team
    subordinateIds.length > 0
      ? prisma.leaveRequest.findMany({
          where: {
            employeeId: { in: subordinateIds },
            status: "PENDING",
          },
          include: {
            employee: {
              select: {
                id: true,
                fullName: true,
                employeeNo: true,
                currentPosition: { select: { title: true } },
              },
            },
            leaveType: {
              select: {
                name: true,
                isPaid: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        })
      : [],

    // Approved leaves for team during this week (for team calendar)
    subordinateIds.length > 0
      ? prisma.leaveRequest.findMany({
          where: {
            employeeId: { in: subordinateIds },
            status: "APPROVED",
            startDate: { lte: endOfWeek },
            endDate: { gte: startOfWeek },
          },
          include: {
            employee: { select: { id: true, fullName: true } },
            leaveType: { select: { name: true } },
          },
        })
      : [],

    // Manager's own attendance
    prisma.attendance.findFirst({
      where: {
        employeeId: managerId,
        date: today,
      },
    }),

    // Manager's own leave balances
    prisma.leaveBalance.findMany({
      where: {
        employeeId: managerId,
        year: currentYear,
      },
      include: {
        leaveType: true,
      },
      orderBy: { quotaDays: "desc" },
    }),
  ]);

  const teamPresentCount = todayTeamAttendances.filter((a) =>
    ["PRESENT", "LATE", "WFH"].includes(a.status),
  ).length;

  const formattedManagerBalances = managerBalances.map((b) => {
    const quotaDays = b.quotaDays;
    const usedDaysNumber = Number(b.usedDays);
    const remainingDays = Math.max(0, quotaDays - usedDaysNumber);
    const usagePercentage = quotaDays > 0 ? Math.round((usedDaysNumber / quotaDays) * 100) : 0;
    return {
      id: b.id,
      leaveTypeId: b.leaveTypeId,
      year: b.year,
      quotaDays,
      usedDaysNumber,
      remainingDays,
      usagePercentage,
      leaveType: {
        name: b.leaveType.name,
        isPaid: b.leaveType.isPaid,
        requiresAttachment: b.leaveType.requiresAttachment,
      },
    };
  });

  return {
    totalTeamMembers: subordinates.length,
    teamPresentCount,
    pendingLeavesCount: pendingLeaveRequests.length,
    pendingLeaveRequests: pendingLeaveRequests.map((r) => ({
      id: r.id,
      employeeId: r.employeeId,
      employeeName: r.employee.fullName,
      employeeNo: r.employee.employeeNo,
      positionTitle: r.employee.currentPosition?.title || "Staff",
      leaveTypeName: r.leaveType.name,
      isPaid: r.leaveType.isPaid,
      startDate: r.startDate,
      endDate: r.endDate,
      days: Number(r.days),
      reason: r.reason,
      createdAt: r.createdAt,
    })),
    weekTeamLeaves: weekTeamLeaves.map((wl) => ({
      id: wl.id,
      employeeId: wl.employee.id,
      employeeName: wl.employee.fullName,
      leaveTypeName: wl.leaveType.name,
      startDate: wl.startDate,
      endDate: wl.endDate,
    })),
    startOfWeek,
    endOfWeek,
    managerOwn: {
      todayAttendance: managerAttendance
        ? {
            id: managerAttendance.id,
            checkInAt: managerAttendance.checkInAt,
            checkOutAt: managerAttendance.checkOutAt,
            status: managerAttendance.status,
            notes: managerAttendance.notes,
          }
        : null,
      leaveBalances: formattedManagerBalances,
    },
  };
}
