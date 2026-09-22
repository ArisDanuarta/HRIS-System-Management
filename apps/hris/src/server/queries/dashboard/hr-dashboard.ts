import { prisma } from "@pspk/db";
import { AuthContext, assertCan } from "@pspk/rbac";

export interface HrDashboardData {
  totalActiveEmployees: number;
  presentTodayCount: number;
  attendancePercentage: number;
  pendingLeavesCount: number;
  expiringContractsCount: number;
  expiringContracts: {
    id: string;
    employeeId: string;
    employeeName: string;
    employeeNo: string;
    position: string;
    department: string;
    endDate: Date;
    type: string;
  }[];
  trendDays: {
    dateStr: string;
    dayLabel: string;
    present: number;
    late: number;
    leave: number;
    absent: number;
  }[];
  contractStats: {
    PERMANENT: number;
    FIXED_TERM: number;
    PART_TIME_PROJECT: number;
  };
  pendingLeavesLong: {
    id: string;
    employeeId: string;
    employeeName: string;
    employeeNo: string;
    leaveTypeName: string;
    createdAt: Date;
    days: number;
  }[];
  onLeaveTodayList: {
    id: string;
    employeeId: string;
    employeeName: string;
    employeeNo: string;
    position: string;
    department: string;
    leaveTypeName: string;
  }[];
}

export async function getHrDashboard(ctx: AuthContext): Promise<HrDashboardData> {
  // Layer 2 server authorization check
  assertCan(ctx, "hris.employee.read:all");
  assertCan(ctx, "hris.attendance.read:all");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const thirtyDaysFromNow = new Date(today);
  thirtyDaysFromNow.setDate(today.getDate() + 30);

  // Past 7 working days range
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const [
    totalActiveEmployees,
    todayAttendances,
    pendingLeavesCount,
    expiringContracts,
    last7DaysAttendances,
    contractsByType,
    pendingLeavesLong,
    onLeaveTodayList,
  ] = await Promise.all([
    // 1. Total Active Employees
    prisma.employee.count({
      where: { status: "ACTIVE", deletedAt: null },
    }),

    // 2. Today attendances
    prisma.attendance.findMany({
      where: { date: today },
    }),

    // 3. Pending leave requests across entire organization
    prisma.leaveRequest.count({
      where: { status: "PENDING" },
    }),

    // 4. Contracts expiring in <= 30 days
    prisma.employmentContract.findMany({
      where: {
        status: "ACTIVE",
        endDate: {
          lte: thirtyDaysFromNow,
          gte: today,
        },
      },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            employeeNo: true,
            currentPosition: { select: { title: true } },
            currentDepartment: { select: { name: true } },
          },
        },
      },
      orderBy: { endDate: "asc" },
      take: 5,
    }),

    // 5. 7 days attendances for chart
    prisma.attendance.findMany({
      where: {
        date: {
          gte: sevenDaysAgo,
          lte: today,
        },
      },
      select: {
        date: true,
        status: true,
      },
    }),

    // 6. Contracts by type (Permanent, Fixed term, Project)
    prisma.employmentContract.groupBy({
      by: ["type"],
      where: { status: "ACTIVE" },
      _count: { id: true },
    }),

    // 7. Action items: pending leaves older than 2 days
    prisma.leaveRequest.findMany({
      where: {
        status: "PENDING",
        createdAt: {
          lte: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
      },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            employeeNo: true,
          },
        },
        leaveType: { select: { name: true } },
      },
      orderBy: { createdAt: "asc" },
      take: 5,
    }),

    // 8. On leave today
    prisma.leaveRequest.findMany({
      where: {
        status: "APPROVED",
        startDate: { lte: today },
        endDate: { gte: today },
      },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            employeeNo: true,
            currentPosition: { select: { title: true } },
            currentDepartment: { select: { name: true } },
          },
        },
        leaveType: { select: { name: true } },
      },
      take: 6,
    }),
  ]);

  // Calculations
  const presentTodayCount = todayAttendances.filter((a) =>
    ["PRESENT", "LATE", "WFH"].includes(a.status),
  ).length;

  const attendancePercentage =
    totalActiveEmployees > 0
      ? Math.round((presentTodayCount / totalActiveEmployees) * 100)
      : 0;

  // Process 7-day attendance trend
  const trendDays: {
    dateStr: string;
    dayLabel: string;
    present: number;
    late: number;
    leave: number;
    absent: number;
  }[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split("T")[0]!;
    const dayLabel = d.toLocaleDateString("id-ID", { weekday: "short", day: "numeric" });

    const dayRecords = last7DaysAttendances.filter((r) => {
      const recDate = new Date(r.date).toISOString().split("T")[0];
      return recDate === dateStr;
    });

    const present = dayRecords.filter((r) => r.status === "PRESENT" || r.status === "WFH").length;
    const late = dayRecords.filter((r) => r.status === "LATE").length;
    const leave = dayRecords.filter((r) => r.status === "LEAVE").length;
    const absent = dayRecords.filter((r) => r.status === "ABSENT").length;

    trendDays.push({
      dateStr,
      dayLabel,
      present,
      late,
      leave,
      absent,
    });
  }

  // Contract composition
  const contractStats = {
    PERMANENT: contractsByType.find((c) => c.type === "PERMANENT")?._count.id || 0,
    FIXED_TERM: contractsByType.find((c) => c.type === "FIXED_TERM")?._count.id || 0,
    PART_TIME_PROJECT:
      contractsByType.find((c) => c.type === "PART_TIME_PROJECT")?._count.id || 0,
  };

  return {
    totalActiveEmployees,
    presentTodayCount,
    attendancePercentage,
    pendingLeavesCount,
    expiringContractsCount: expiringContracts.length,
    expiringContracts: expiringContracts.map((c) => ({
      id: c.id,
      employeeId: c.employee.id,
      employeeName: c.employee.fullName,
      employeeNo: c.employee.employeeNo,
      position: c.employee.currentPosition?.title || "-",
      department: c.employee.currentDepartment?.name || "-",
      endDate: c.endDate!,
      type: c.type,
    })),
    trendDays,
    contractStats,
    pendingLeavesLong: pendingLeavesLong.map((pl) => ({
      id: pl.id,
      employeeId: pl.employee.id,
      employeeName: pl.employee.fullName,
      employeeNo: pl.employee.employeeNo,
      leaveTypeName: pl.leaveType.name,
      createdAt: pl.createdAt,
      days: Number(pl.days),
    })),
    onLeaveTodayList: onLeaveTodayList.map((ol) => ({
      id: ol.id,
      employeeId: ol.employee.id,
      employeeName: ol.employee.fullName,
      employeeNo: ol.employee.employeeNo,
      position: ol.employee.currentPosition?.title || "-",
      department: ol.employee.currentDepartment?.name || "-",
      leaveTypeName: ol.leaveType.name,
    })),
  };
}
