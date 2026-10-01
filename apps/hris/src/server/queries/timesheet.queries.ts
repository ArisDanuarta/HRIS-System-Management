import { prisma, Prisma, TimesheetStatus, ReviewerStatus } from "@pspk/db";

export interface TimesheetReviewerSummary {
  id: string;
  reviewerId: string;
  reviewerName: string;
  reviewerPosition: string;
  reviewerDepartment: string;
  status: ReviewerStatus;
  notes: string | null;
  reviewedAt: string | null;
  actionAt: string | null;
}

export interface TimesheetSubmissionItem {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeNo: string;
  employeeDepartment: string;
  employeePosition: string;
  periodMonth: number;
  periodYear: number;
  title: string;
  spreadsheetUrl: string;
  totalHours: number;
  description: string | null;
  status: TimesheetStatus;
  submittedAt: string;
  approvedAt: string | null;
  payrollPeriodId: string | null;
  reviewers: TimesheetReviewerSummary[];
  // Status penilai spesifik (berguna jika dilihat dari sudut pandang manajer/reviewer tertentu)
  currentUserReviewerStatus?: ReviewerStatus;
  currentUserReviewerNotes?: string | null;
}

/**
 * Mengambil daftar pengajuan timesheet milik staf tertentu (beserta ringkasan statistik)
 */
export async function getTimesheetSubmissionsByEmployee(
  employeeId: string,
  options?: {
    year?: number;
    month?: number;
    status?: string;
  },
) {
  const where: Prisma.TimesheetSubmissionWhereInput = {
    employeeId,
  };

  if (options?.year) {
    where.periodYear = options.year;
  }
  if (options?.month && options.month > 0) {
    where.periodMonth = options.month;
  }
  if (options?.status && options.status !== "ALL") {
    where.status = options.status as TimesheetStatus;
  }

  const submissions = await prisma.timesheetSubmission.findMany({
    where,
    include: {
      employee: {
        select: {
          fullName: true,
          employeeNo: true,
          currentPosition: { select: { title: true } },
          currentDepartment: { select: { name: true } },
        },
      },
      reviewers: {
        include: {
          reviewer: {
            select: {
              fullName: true,
              employeeNo: true,
              currentPosition: { select: { title: true } },
              currentDepartment: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: [{ submittedAt: "desc" }],
  });

  const items: TimesheetSubmissionItem[] = submissions.map((s) => ({
    id: s.id,
    employeeId: s.employeeId,
    employeeName: s.employee.fullName,
    employeeNo: s.employee.employeeNo,
    employeeDepartment: s.employee.currentDepartment?.name || "PSPK",
    employeePosition: s.employee.currentPosition?.title || "Staf Riset",
    periodMonth: s.periodMonth,
    periodYear: s.periodYear,
    title: s.title,
    spreadsheetUrl: s.spreadsheetUrl,
    totalHours: Number(s.totalHours),
    description: s.description,
    status: s.status,
    submittedAt: s.submittedAt.toISOString(),
    approvedAt: s.approvedAt ? s.approvedAt.toISOString() : null,
    payrollPeriodId: s.payrollPeriodId,
    reviewers: s.reviewers.map((r) => ({
      id: r.id,
      reviewerId: r.reviewerId,
      reviewerName: r.reviewer.fullName,
      reviewerPosition: r.reviewer.currentPosition?.title || "Lead Divisi",
      reviewerDepartment: r.reviewer.currentDepartment?.name || "PSPK",
      status: r.status,
      notes: r.notes,
      reviewedAt: r.reviewedAt ? r.reviewedAt.toISOString() : null,
      actionAt: r.actionAt ? r.actionAt.toISOString() : null,
    })),
  }));

  // Hitung ringkasan jam kerja
  const totalHoursApproved = items
    .filter((s) => s.status === "APPROVED")
    .reduce((sum, s) => sum + s.totalHours, 0);

  const totalHoursPending = items
    .filter((s) => s.status === "PENDING" || s.status === "IN_REVIEW")
    .reduce((sum, s) => sum + s.totalHours, 0);

  return {
    items,
    stats: {
      totalSubmissions: items.length,
      totalHoursApproved: Math.round(totalHoursApproved * 100) / 100,
      totalHoursPending: Math.round(totalHoursPending * 100) / 100,
      approvedCount: items.filter((s) => s.status === "APPROVED").length,
      pendingCount: items.filter((s) => s.status === "PENDING" || s.status === "IN_REVIEW").length,
    },
  };
}

/**
 * Mengambil daftar timesheet tim yang memerlukan review atau telah direview oleh manajer tertentu
 */
export async function getTimesheetSubmissionsForReviewer(
  reviewerId: string,
  options?: {
    status?: string;
    search?: string;
    year?: number;
    month?: number;
  },
) {
  const reviewerWhere: Prisma.TimesheetReviewerWhereInput = {
    reviewerId,
  };

  if (options?.status && options.status !== "ALL") {
    reviewerWhere.status = options.status as ReviewerStatus;
  }

  const submissionWhere: Prisma.TimesheetSubmissionWhereInput = {
    reviewers: {
      some: reviewerWhere,
    },
  };

  if (options?.year) {
    submissionWhere.periodYear = options.year;
  }
  if (options?.month && options.month > 0) {
    submissionWhere.periodMonth = options.month;
  }

  if (options?.search && options.search.trim() !== "") {
    const q = options.search.trim();
    submissionWhere.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { employee: { fullName: { contains: q, mode: "insensitive" } } },
      { employee: { employeeNo: { contains: q, mode: "insensitive" } } },
    ];
  }

  const submissions = await prisma.timesheetSubmission.findMany({
    where: submissionWhere,
    include: {
      employee: {
        select: {
          fullName: true,
          employeeNo: true,
          currentPosition: { select: { title: true } },
          currentDepartment: { select: { name: true } },
        },
      },
      reviewers: {
        include: {
          reviewer: {
            select: {
              fullName: true,
              employeeNo: true,
              currentPosition: { select: { title: true } },
              currentDepartment: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: [{ submittedAt: "desc" }],
  });

  const items: TimesheetSubmissionItem[] = submissions.map((s) => {
    const currentReviewerRecord = s.reviewers.find((r) => r.reviewerId === reviewerId);

    return {
      id: s.id,
      employeeId: s.employeeId,
      employeeName: s.employee.fullName,
      employeeNo: s.employee.employeeNo,
      employeeDepartment: s.employee.currentDepartment?.name || "PSPK",
      employeePosition: s.employee.currentPosition?.title || "Staf Riset",
      periodMonth: s.periodMonth,
      periodYear: s.periodYear,
      title: s.title,
      spreadsheetUrl: s.spreadsheetUrl,
      totalHours: Number(s.totalHours),
      description: s.description,
      status: s.status,
      submittedAt: s.submittedAt.toISOString(),
      approvedAt: s.approvedAt ? s.approvedAt.toISOString() : null,
      payrollPeriodId: s.payrollPeriodId,
      currentUserReviewerStatus: currentReviewerRecord?.status,
      currentUserReviewerNotes: currentReviewerRecord?.notes || null,
      reviewers: s.reviewers.map((r) => ({
        id: r.id,
        reviewerId: r.reviewerId,
        reviewerName: r.reviewer.fullName,
        reviewerPosition: r.reviewer.currentPosition?.title || "Lead Divisi",
        reviewerDepartment: r.reviewer.currentDepartment?.name || "PSPK",
        status: r.status,
        notes: r.notes,
        reviewedAt: r.reviewedAt ? r.reviewedAt.toISOString() : null,
        actionAt: r.actionAt ? r.actionAt.toISOString() : null,
      })),
    };
  });

  const pendingForThisReviewer = items.filter(
    (i) => i.currentUserReviewerStatus === "PENDING" || i.currentUserReviewerStatus === "IN_REVIEW",
  ).length;

  const approvedByThisReviewer = items.filter(
    (i) => i.currentUserReviewerStatus === "APPROVED",
  ).length;

  return {
    items,
    stats: {
      totalAssigned: items.length,
      pendingCount: pendingForThisReviewer,
      approvedCount: approvedByThisReviewer,
    },
  };
}

/**
 * Mengambil detail pengajuan timesheet
 */
export async function getTimesheetSubmissionDetail(submissionId: string) {
  const submission = await prisma.timesheetSubmission.findUnique({
    where: { id: submissionId },
    include: {
      employee: {
        select: {
          id: true,
          fullName: true,
          employeeNo: true,
          workEmail: true,
          currentPosition: { select: { title: true } },
          currentDepartment: { select: { name: true } },
          contracts: {
            where: { status: "ACTIVE" },
            select: { wageType: true, hourlyRate: true, type: true },
            take: 1,
          },
        },
      },
      reviewers: {
        include: {
          reviewer: {
            select: {
              id: true,
              fullName: true,
              employeeNo: true,
              currentPosition: { select: { title: true } },
              currentDepartment: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      payrollPeriod: {
        select: { id: true, year: true, month: true, status: true },
      },
    },
  });

  if (!submission) return null;

  return {
    ...submission,
    totalHours: Number(submission.totalHours),
    contract: submission.employee.contracts[0]
      ? {
          wageType: submission.employee.contracts[0].wageType,
          hourlyRate: submission.employee.contracts[0].hourlyRate
            ? Number(submission.employee.contracts[0].hourlyRate)
            : null,
          type: submission.employee.contracts[0].type,
        }
      : null,
    reviewers: submission.reviewers.map((r) => ({
      id: r.id,
      reviewerId: r.reviewerId,
      reviewerName: r.reviewer.fullName,
      reviewerPosition: r.reviewer.currentPosition?.title || "Lead Divisi",
      reviewerDepartment: r.reviewer.currentDepartment?.name || "PSPK",
      status: r.status,
      notes: r.notes,
      reviewedAt: r.reviewedAt ? r.reviewedAt.toISOString() : null,
      actionAt: r.actionAt ? r.actionAt.toISOString() : null,
    })),
  };
}

/**
 * Mengambil daftar atasan / lead / manajer yang dapat dipilih staf sebagai reviewer timesheet
 */
export async function getEligibleReviewers(excludeEmployeeId?: string) {
  const where: Prisma.EmployeeWhereInput = {
    status: "ACTIVE",
  };

  if (excludeEmployeeId) {
    where.id = { not: excludeEmployeeId };
  }

  // Pilih pegawai yang memiliki jabatan Manajer, Direktur, Lead, atau berada di role manager/admin_hr
  const employees = await prisma.employee.findMany({
    where,
    select: {
      id: true,
      fullName: true,
      employeeNo: true,
      currentPosition: {
        select: { title: true },
      },
      currentDepartment: {
        select: { id: true, name: true },
      },
      user: {
        select: {
          roles: {
            select: { role: { select: { key: true } } },
          },
        },
      },
    },
    orderBy: { fullName: "asc" },
  });

  // Urutkan atau tandai yang memiliki role manager atau admin_hr di prioritas atas
  return employees.map((emp) => {
    const roles = emp.user?.roles.map((r) => r.role.key) || [];
    const isLeadOrManager =
      roles.includes("manager") ||
      roles.includes("admin_hr") ||
      roles.includes("super_admin") ||
      (emp.currentPosition?.title || "").toLowerCase().includes("lead") ||
      (emp.currentPosition?.title || "").toLowerCase().includes("manajer") ||
      (emp.currentPosition?.title || "").toLowerCase().includes("direktur") ||
      (emp.currentPosition?.title || "").toLowerCase().includes("kepala");

    return {
      id: emp.id,
      fullName: emp.fullName,
      employeeNo: emp.employeeNo,
      positionTitle: emp.currentPosition?.title || "Pegawai",
      departmentName: emp.currentDepartment?.name || "PSPK",
      isLeadOrManager,
    };
  });
}

export interface PayrollTimesheetBlocker {
  employeeId: string;
  employeeName: string;
  employeeNo: string;
  submissionId?: string;
  submissionTitle?: string;
  totalHours?: number;
  reason: "MISSING_TIMESHEET" | "PENDING_APPROVAL";
  pendingReviewers: string[]; // Daftar nama atasan yang belum ACC
}

/**
 * Validasi timesheet freelance sebelum kalkulasi payroll periode tertentu
 */
export async function getTimesheetValidationForPayroll(year: number, month: number) {
  // 1. Ambil seluruh pegawai aktif yang memiliki kontrak aktif bertipe wageType: HOURLY
  const hourlyEmployees = await prisma.employee.findMany({
    where: {
      status: "ACTIVE",
      contracts: {
        some: {
          status: "ACTIVE",
          wageType: "HOURLY",
        },
      },
    },
    select: {
      id: true,
      fullName: true,
      employeeNo: true,
      contracts: {
        where: { status: "ACTIVE", wageType: "HOURLY" },
        select: { hourlyRate: true },
        take: 1,
      },
    },
    orderBy: { fullName: "asc" },
  });

  if (hourlyEmployees.length === 0) {
    return {
      canProceed: true,
      totalHourlyEmployees: 0,
      approvedTimesheetsCount: 0,
      blockers: [],
    };
  }

  // 2. Ambil seluruh pengajuan timesheet untuk periode bulan & tahun ini
  const submissions = await prisma.timesheetSubmission.findMany({
    where: {
      periodYear: year,
      periodMonth: month,
      employeeId: { in: hourlyEmployees.map((e) => e.id) },
    },
    include: {
      reviewers: {
        include: {
          reviewer: {
            select: { fullName: true },
          },
        },
      },
    },
  });

  const submissionMap = new Map<string, typeof submissions[0]>();
  for (const s of submissions) {
    submissionMap.set(s.employeeId, s);
  }

  const blockers: PayrollTimesheetBlocker[] = [];
  let approvedCount = 0;

  for (const emp of hourlyEmployees) {
    const sub = submissionMap.get(emp.id);

    if (!sub) {
      blockers.push({
        employeeId: emp.id,
        employeeName: emp.fullName,
        employeeNo: emp.employeeNo,
        reason: "MISSING_TIMESHEET",
        pendingReviewers: [],
      });
    } else if (sub.status !== "APPROVED") {
      const pendingNames = sub.reviewers
        .filter((r) => r.status !== "APPROVED")
        .map((r) => r.reviewer.fullName);

      blockers.push({
        employeeId: emp.id,
        employeeName: emp.fullName,
        employeeNo: emp.employeeNo,
        submissionId: sub.id,
        submissionTitle: sub.title,
        totalHours: Number(sub.totalHours),
        reason: "PENDING_APPROVAL",
        pendingReviewers: pendingNames,
      });
    } else {
      approvedCount++;
    }
  }

  return {
    canProceed: blockers.length === 0,
    totalHourlyEmployees: hourlyEmployees.length,
    approvedTimesheetsCount: approvedCount,
    blockers,
  };
}
