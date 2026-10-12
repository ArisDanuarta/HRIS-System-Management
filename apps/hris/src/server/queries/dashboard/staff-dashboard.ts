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
    wageType?: string | null;
    totalHours?: number | null;
    hourlyRate?: number | null;
  } | null;
  manager?: {
    id: string;
    fullName: string;
    nickname?: string | null;
    employeeNo: string;
    workEmail: string;
    phone?: string | null;
    photoKey?: string | null;
    status: string;
    position: string | null;
    department: string | null;
  } | null;
  publishedDocuments: {
    id: string;
    code: string;
    title: string;
    category: string;
    categoryColor?: string | null;
    updatedAt: Date;
    currentVersion?: {
      id: string;
      versionNo: number;
      fileName: string;
      fileKey: string;
      sizeBytes: number;
      mimeType: string;
    } | null;
  }[];
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

  const allowedVisibilities = ctx.roles.some((r) =>
    ["manager", "admin_hr", "super_admin"].includes(r),
  )
    ? ["ALL_STAFF", "MANAGERS"]
    : ["ALL_STAFF"];

  // Fetch all staff dashboard metrics in parallel
  const [
    todayAttendance,
    leaveBalances,
    pendingLeavesCount,
    recentLeaves,
    latestPayslip,
    workSchedule,
    employeeInfo,
    rawDocuments,
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
            nickname: true,
            employeeNo: true,
            workEmail: true,
            phone: true,
            photoKey: true,
            status: true,
            currentPosition: {
              select: { title: true },
            },
            currentDepartment: {
              select: { name: true },
            },
          },
        },
      },
    }),
    prisma.document.findMany({
      where: {
        status: "ACTIVE",
        visibility: {
          in: allowedVisibilities as ("ALL_STAFF" | "MANAGERS")[],
        },
      },
      include: {
        categoryRel: {
          select: {
            name: true,
            color: true,
          },
        },
        versions: {
          orderBy: { versionNo: "desc" },
          take: 1,
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
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
          wageType: latestPayslip.wageType,
          totalHours: latestPayslip.totalHours ? Number(latestPayslip.totalHours) : null,
          hourlyRate: latestPayslip.hourlyRate ? Number(latestPayslip.hourlyRate) : null,
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
          nickname: employeeInfo.manager.nickname ?? null,
          employeeNo: employeeInfo.manager.employeeNo,
          workEmail: employeeInfo.manager.workEmail,
          phone: employeeInfo.manager.phone ?? null,
          photoKey: employeeInfo.manager.photoKey ?? null,
          status: employeeInfo.manager.status,
          position: employeeInfo.manager.currentPosition?.title ?? null,
          department: employeeInfo.manager.currentDepartment?.name ?? null,
        }
      : null,
    publishedDocuments: rawDocuments.map((doc) => {
      const latestVer = doc.versions[0] || null;
      return {
        id: doc.id,
        code: doc.code,
        title: doc.title,
        category: doc.categoryRel?.name || doc.category,
        categoryColor: doc.categoryRel?.color || "blue",
        updatedAt: doc.updatedAt,
        currentVersion: latestVer
          ? {
              id: latestVer.id,
              versionNo: latestVer.versionNo,
              fileName: latestVer.fileName,
              fileKey: latestVer.fileKey,
              sizeBytes: latestVer.sizeBytes,
              mimeType: latestVer.mimeType,
            }
          : null,
      };
    }),
  };
}
