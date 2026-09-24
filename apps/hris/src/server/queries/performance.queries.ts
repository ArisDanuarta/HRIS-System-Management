import { prisma, Prisma } from "@pspk/db";

export interface PerformancePeriodSummary {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
  totalReviews: number;
  draftCount: number;
  selfReviewCount: number;
  managerReviewCount: number;
  finalizedCount: number;
  averageScore: number | null;
}

export interface PerformanceFilter {
  departmentId?: string;
  status?: string;
  search?: string;
}

/**
 * Mengambil daftar divisi/departemen aktif untuk filter
 */
export async function getPerformanceDepartments() {
  return await prisma.department.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

/**
 * Mengambil daftar seluruh periode evaluasi kinerja beserta statistik ringkas
 */
export async function getPerformancePeriods(): Promise<PerformancePeriodSummary[]> {
  const periods = await prisma.performancePeriod.findMany({
    orderBy: { startDate: "desc" },
    include: {
      reviews: {
        select: {
          id: true,
          status: true,
          finalScore: true,
        },
      },
    },
  });

  return periods.map((p) => {
    const totalReviews = p.reviews.length;
    const draftCount = p.reviews.filter((r) => r.status === "DRAFT").length;
    const selfReviewCount = p.reviews.filter((r) => r.status === "SELF_REVIEW").length;
    const managerReviewCount = p.reviews.filter((r) => r.status === "MANAGER_REVIEW").length;
    const finalized = p.reviews.filter((r) => r.status === "FINALIZED");
    const finalizedCount = finalized.length;

    let averageScore: number | null = null;
    if (finalizedCount > 0) {
      const sum = finalized.reduce((acc, curr) => acc + (curr.finalScore ? Number(curr.finalScore) : 0), 0);
      averageScore = Math.round((sum / finalizedCount) * 10) / 10;
    }

    return {
      id: p.id,
      name: p.name,
      startDate: p.startDate.toISOString().split("T")[0]!,
      endDate: p.endDate.toISOString().split("T")[0]!,
      status: p.status,
      totalReviews,
      draftCount,
      selfReviewCount,
      managerReviewCount,
      finalizedCount,
      averageScore,
    };
  });
}

/**
 * Mengambil periode evaluasi aktif (atau periode tertentu bila ID diberikan)
 */
export async function getActivePerformancePeriod(periodId?: string) {
  if (periodId) {
    const period = await prisma.performancePeriod.findUnique({
      where: { id: periodId },
    });
    if (period) return period;
  }

  // Cari periode berstatus OPEN terdekat
  const openPeriod = await prisma.performancePeriod.findFirst({
    where: { status: "OPEN" },
    orderBy: { startDate: "desc" },
  });

  if (openPeriod) return openPeriod;

  // Fallback ke periode terbaru apa pun
  return prisma.performancePeriod.findFirst({
    orderBy: { startDate: "desc" },
  });
}

/**
 * Menghitung ringkasan metrik statistik lembaga untuk periode tertentu
 */
export async function getPerformanceOverviewStats(periodId: string) {
  const reviews = await prisma.performanceReview.findMany({
    where: { periodId },
    include: {
      employee: {
        select: {
          id: true,
          status: true,
          performanceGoals: {
            where: { periodId },
            select: { weight: true },
          },
        },
      },
    },
  });

  const totalReviews = reviews.length;
  const draftCount = reviews.filter((r) => r.status === "DRAFT").length;
  const selfReviewCount = reviews.filter((r) => r.status === "SELF_REVIEW").length;
  const managerReviewCount = reviews.filter((r) => r.status === "MANAGER_REVIEW").length;
  const finalized = reviews.filter((r) => r.status === "FINALIZED");
  const finalizedCount = finalized.length;

  let averageScore = 0;
  if (finalizedCount > 0) {
    const totalScore = finalized.reduce((acc, curr) => acc + (curr.finalScore ? Number(curr.finalScore) : 0), 0);
    averageScore = Math.round((totalScore / finalizedCount) * 10) / 10;
  }

  // Hitung berapa pegawai yang target bobotnya sudah pas 100%
  const completeGoalsCount = reviews.filter((r) => {
    const totalWeight = r.employee.performanceGoals.reduce((sum, g) => sum + Number(g.weight), 0);
    return Math.abs(totalWeight - 100) < 0.01;
  }).length;

  return {
    totalReviews,
    draftCount,
    selfReviewCount,
    managerReviewCount,
    finalizedCount,
    averageScore,
    completeGoalsCount,
    participationRate: totalReviews > 0 ? Math.round(((totalReviews - draftCount) / totalReviews) * 100) : 0,
    completionRate: totalReviews > 0 ? Math.round((finalizedCount / totalReviews) * 100) : 0,
  };
}

/**
 * Mengambil daftar seluruh review kinerja pegawai untuk periode tertentu
 */
export async function getPerformanceReviewsByPeriod(periodId: string, filter?: PerformanceFilter) {
  const { departmentId, status, search } = filter || {};

  const employeeWhere: Prisma.EmployeeWhereInput = {};

  if (departmentId && departmentId !== "ALL") {
    employeeWhere.currentDepartmentId = departmentId;
  }

  if (search && search.trim() !== "") {
    const q = search.trim();
    employeeWhere.OR = [
      { fullName: { contains: q, mode: "insensitive" } },
      { employeeNo: { contains: q, mode: "insensitive" } },
      { workEmail: { contains: q, mode: "insensitive" } },
    ];
  }

  const where: Prisma.PerformanceReviewWhereInput = {
    periodId,
  };

  if (status && status !== "ALL") {
    where.status = status as Prisma.EnumReviewStatusFilter;
  }

  if (Object.keys(employeeWhere).length > 0) {
    where.employee = { is: employeeWhere };
  }

  const reviews = await prisma.performanceReview.findMany({
    where,
    include: {
      employee: {
        select: {
          id: true,
          employeeNo: true,
          fullName: true,
          workEmail: true,
          currentPosition: {
            select: { id: true, title: true },
          },
          currentDepartment: {
            select: { id: true, name: true },
          },
        },
      },
      reviewer: {
        select: {
          id: true,
          employeeNo: true,
          fullName: true,
          currentPosition: {
            select: { title: true },
          },
        },
      },
      period: {
        select: {
          id: true,
          name: true,
          status: true,
        },
      },
    },
    orderBy: [
      { employee: { fullName: "asc" } },
    ],
  });

  // Ambil goals untuk masing-masing employee pada periodId ini
  const employeeIds = reviews.map((r) => r.employeeId);
  const allGoals = await prisma.performanceGoal.findMany({
    where: {
      periodId,
      employeeId: { in: employeeIds },
    },
    orderBy: { createdAt: "asc" },
  });

  const goalsByEmployee = new Map<string, typeof allGoals>();
  for (const g of allGoals) {
    const list = goalsByEmployee.get(g.employeeId) || [];
    list.push(g);
    goalsByEmployee.set(g.employeeId, list);
  }

  return reviews.map((r) => {
    const empGoals = goalsByEmployee.get(r.employeeId) || [];
    const totalGoalWeight = empGoals.reduce((sum, g) => sum + Number(g.weight), 0);
    const isGoalComplete = Math.abs(totalGoalWeight - 100) < 0.01;

    const selfScore = r.selfScore ? Number(r.selfScore) : null;
    const managerScore = r.managerScore ? Number(r.managerScore) : null;
    const finalScore = r.finalScore ? Number(r.finalScore) : null;

    let predicate = "-";
    if (finalScore !== null) {
      if (finalScore >= 90) predicate = "Sangat Baik";
      else if (finalScore >= 80) predicate = "Baik";
      else if (finalScore >= 70) predicate = "Cukup";
      else predicate = "Perlu Perbaikan";
    }

    return {
      id: r.id,
      employeeId: r.employeeId,
      periodId: r.periodId,
      status: r.status,
      selfScore,
      managerScore,
      finalScore,
      predicate,
      selfComment: r.selfComment,
      managerComment: r.managerComment,
      employee: {
        id: r.employee.id,
        employeeNo: r.employee.employeeNo,
        fullName: r.employee.fullName,
        workEmail: r.employee.workEmail,
        positionTitle: r.employee.currentPosition?.title || "Staff",
        departmentName: r.employee.currentDepartment?.name || "PSPK",
        departmentId: r.employee.currentDepartment?.id || null,
      },
      reviewer: r.reviewer
        ? {
            id: r.reviewer.id,
            employeeNo: r.reviewer.employeeNo,
            fullName: r.reviewer.fullName,
            positionTitle: r.reviewer.currentPosition?.title || "Manajer",
          }
        : null,
      goalsCount: empGoals.length,
      totalGoalWeight,
      isGoalComplete,
      goals: empGoals.map((g) => ({
        id: g.id,
        title: g.title,
        description: g.description,
        weight: Number(g.weight),
        target: g.target,
        unit: g.unit,
        actual: g.actual,
      })),
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    };
  });
}

/**
 * Mengambil detail review satu pegawai untuk modal review
 */
export async function getPerformanceReviewDetail(reviewId: string) {
  const review = await prisma.performanceReview.findUnique({
    where: { id: reviewId },
    include: {
      employee: {
        select: {
          id: true,
          employeeNo: true,
          fullName: true,
          workEmail: true,
          currentPosition: {
            select: { title: true },
          },
          currentDepartment: {
            select: { name: true },
          },
        },
      },
      reviewer: {
        select: {
          id: true,
          employeeNo: true,
          fullName: true,
          currentPosition: {
            select: { title: true },
          },
        },
      },
      period: true,
    },
  });

  if (!review) return null;

  const goals = await prisma.performanceGoal.findMany({
    where: {
      periodId: review.periodId,
      employeeId: review.employeeId,
    },
    orderBy: { createdAt: "asc" },
  });

  const totalGoalWeight = goals.reduce((sum, g) => sum + Number(g.weight), 0);

  return {
    ...review,
    selfScore: review.selfScore ? Number(review.selfScore) : null,
    managerScore: review.managerScore ? Number(review.managerScore) : null,
    finalScore: review.finalScore ? Number(review.finalScore) : null,
    totalGoalWeight,
    goals: goals.map((g) => ({
      ...g,
      weight: Number(g.weight),
    })),
  };
}
