import { prisma } from "@pspk/db";
import { AuthContext, assertCan } from "@pspk/rbac";
import { toDateString } from "@pspk/shared";
import { getActiveWorkSchedule } from "../../services/work-schedule.service";

export interface StaffDashboardData {
  todayAttendance: {
    id: string;
    checkInAt: Date | null;
    checkOutAt: Date | null;
    status: string;
    notes?: string | null;
  } | null;
  workSchedule?: {
    workStartTime: string;
    workEndTime: string;
    gracePeriodMins: number;
    name: string;
  };
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
  pendingLeavesCount: number;
  recentLeaves: {
    id: string;
    startDate: Date;
    endDate: Date;
    days: number;
    status: string;
    reason?: string | null;
    leaveType: {
      name: string;
    };
    createdAt: Date;
  }[];
  latestPayslip: {
    id: string;
    year: number;
    month: number;
    kind: string;
    netAmount: number;
    publishedAt: Date | null;
  } | null;
  manager?: {
    id: string;
    fullName: string;
    employeeNo: string;
    position: string | null;
  } | null;
}

export async function getStaffDashboard(ctx: AuthContext): Promise<StaffDashboardData> {
  // Layer 2 server authorization check
  assertCan(ctx, "hris.attendance.read:own", { ownerEmployeeId: ctx.employeeId });

  if (!ctx.employeeId) {
    throw new Error("Profil karyawan tidak ditemukan untuk akun ini.");
  }

  const employeeId = ctx.employeeId;
  const todayDateStr = toDateString(new Date());
  const todayDate = new Date(todayDateStr);
  const currentYear = new Date().getFullYear();

  // Fetch all staff dashboard metrics in parallel
  const [
    todayAttendance,
    leaveBalances,
    pendingLeavesCount,
    recentLeaves,
    latestPayslip,
    workSchedule,
    employeeInfo,
  ] = await Promise.all([
    prisma.attendance.findFirst({
      where: {
        employeeId,
        date: todayDate,
      },
    }),
    prisma.leaveBalance.findMany({
      where: {
        employeeId,
        year: currentYear,
      },
      include: {
        leaveType: true,
      },
      orderBy: { quotaDays: "desc" },
    }),
    prisma.leaveRequest.count({
      where: {
        employeeId,
        status: "PENDING",
      },
    }),
    prisma.leaveRequest.findMany({
      where: {
        employeeId,
      },
      include: {
        leaveType: true,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.payslip.findFirst({
      where: {
        employeeId,
        status: "PUBLISHED",
      },
      include: {
        period: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    getActiveWorkSchedule(),
    prisma.employee.findUnique({
      where: { id: employeeId },
      select: {
        manager: {
          select: {
            id: true,
            fullName: true,
            employeeNo: true,
            currentPosition: {
              select: { title: true },
            },
          },
        },
      },
    }),
  ]);

  // Format balances for UI
  const formattedBalances = leaveBalances.map((b) => {
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
    todayAttendance: todayAttendance
      ? {
          id: todayAttendance.id,
          checkInAt: todayAttendance.checkInAt,
          checkOutAt: todayAttendance.checkOutAt,
          status: todayAttendance.status,
          notes: todayAttendance.notes,
        }
      : null,
    leaveBalances: formattedBalances,
    pendingLeavesCount,
    recentLeaves: recentLeaves.map((r) => ({
      id: r.id,
      startDate: r.startDate,
      endDate: r.endDate,
      days: Number(r.days),
      status: r.status,
      reason: r.reason,
      leaveType: {
        name: r.leaveType.name,
      },
      createdAt: r.createdAt,
    })),
    latestPayslip: latestPayslip
      ? {
          id: latestPayslip.id,
          year: latestPayslip.period.year,
          month: latestPayslip.period.month,
          kind: latestPayslip.period.kind,
          netAmount: Number(latestPayslip.netAmount),
          publishedAt: latestPayslip.publishedAt,
        }
      : null,
    workSchedule: {
      workStartTime: workSchedule.workStartTime,
      workEndTime: workSchedule.workEndTime,
      gracePeriodMins: workSchedule.gracePeriodMins,
      name: workSchedule.name,
    },
    manager: employeeInfo?.manager
      ? {
          id: employeeInfo.manager.id,
          fullName: employeeInfo.manager.fullName,
          employeeNo: employeeInfo.manager.employeeNo,
          position: employeeInfo.manager.currentPosition?.title ?? null,
        }
      : null,
  };
}
