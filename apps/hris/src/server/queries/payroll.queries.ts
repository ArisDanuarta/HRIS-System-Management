import { prisma, Prisma } from "@pspk/db";

export interface GetPayrollPeriodsFilter {
  year?: number;
  status?: string;
  kind?: string;
}

/**
 * Mengambil daftar seluruh periode penggajian
 */
export async function getPayrollPeriods(filter?: GetPayrollPeriodsFilter) {
  const { year, status, kind } = filter || {};

  const where: Prisma.PayrollPeriodWhereInput = {};

  if (year) {
    where.year = year;
  }

  if (status && status !== "ALL") {
    where.status = status as Prisma.EnumPayrollStatusFilter;
  }

  if (kind && kind !== "ALL") {
    where.kind = kind as Prisma.EnumPayrollKindFilter;
  }

  const periods = await prisma.payrollPeriod.findMany({
    where,
    include: {
      payslips: {
        select: {
          id: true,
          grossAmount: true,
          totalDeduction: true,
          netAmount: true,
          status: true,
        },
      },
    },
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });

  return periods.map((p) => {
    const totalEmployees = p.payslips.length;
    const totalGross = p.payslips.reduce((acc, curr) => acc + Number(curr.grossAmount), 0);
    const totalDeduction = p.payslips.reduce(
      (acc, curr) => acc + Number(curr.totalDeduction),
      0,
    );
    const totalNet = p.payslips.reduce((acc, curr) => acc + Number(curr.netAmount), 0);

    return {
      id: p.id,
      year: p.year,
      month: p.month,
      kind: p.kind,
      status: p.status,
      cutoffDate: p.cutoffDate ? p.cutoffDate.toISOString() : null,
      lockedAt: p.lockedAt ? p.lockedAt.toISOString() : null,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      totalEmployees,
      totalGross,
      totalDeduction,
      totalNet,
    };
  });
}

/**
 * Mengambil satu periode payroll beserta detail seluruh slip gaji pegawai
 */
export async function getPayrollPeriodById(periodId: string) {
  const period = await prisma.payrollPeriod.findUnique({
    where: { id: periodId },
    include: {
      payslips: {
        include: {
          employee: {
            select: {
              id: true,
              employeeNo: true,
              fullName: true,
              bankName: true,
              bankAccountEnc: true,
              currentDepartment: { select: { id: true, name: true } },
              currentPosition: { select: { id: true, title: true } },
            },
          },
          lines: {
            orderBy: [{ type: "asc" }, { amount: "desc" }],
          },
        },
        orderBy: {
          employee: {
            fullName: "asc",
          },
        },
      },
    },
  });

  if (!period) return null;

  const totalEmployees = period.payslips.length;
  const totalGross = period.payslips.reduce((acc, curr) => acc + Number(curr.grossAmount), 0);
  const totalDeduction = period.payslips.reduce(
    (acc, curr) => acc + Number(curr.totalDeduction),
    0,
  );
  const totalNet = period.payslips.reduce((acc, curr) => acc + Number(curr.netAmount), 0);

  const formattedPayslips = period.payslips.map((p) => ({
    id: p.id,
    periodId: p.periodId,
    employeeId: p.employeeId,
    status: p.status,
    publishedAt: p.publishedAt ? p.publishedAt.toISOString() : null,
    pdfKey: p.pdfKey,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    grossAmount: Number(p.grossAmount),
    totalDeduction: Number(p.totalDeduction),
    netAmount: Number(p.netAmount),
    employee: p.employee,
    lines: p.lines.map((l) => ({
      id: l.id,
      payslipId: l.payslipId,
      componentId: l.componentId,
      label: l.label,
      type: l.type,
      amount: Number(l.amount),
    })),
  }));

  return {
    id: period.id,
    year: period.year,
    month: period.month,
    kind: period.kind,
    status: period.status,
    cutoffDate: period.cutoffDate ? period.cutoffDate.toISOString() : null,
    lockedAt: period.lockedAt ? period.lockedAt.toISOString() : null,
    createdAt: period.createdAt.toISOString(),
    updatedAt: period.updatedAt.toISOString(),
    totalEmployees,
    totalGross,
    totalDeduction,
    totalNet,
    payslips: formattedPayslips,
  };
}

/**
 * Mengambil ringkasan statistik metrik payroll lembaga
 */
export async function getPayrollStats() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const [totalPeriods, activePeriod, allComponentsCount, totalActiveEmployees] = await Promise.all([
    prisma.payrollPeriod.count(),
    prisma.payrollPeriod.findFirst({
      where: {
        year: currentYear,
        month: currentMonth,
        kind: "REGULAR",
      },
      include: {
        payslips: true,
      },
    }),
    prisma.salaryComponent.count({ where: { isActive: true } }),
    prisma.employee.count({ where: { status: "ACTIVE", deletedAt: null } }),
  ]);

  let currentPeriodNet = 0;
  let currentPeriodEmployeesProcessed = 0;

  if (activePeriod) {
    currentPeriodEmployeesProcessed = activePeriod.payslips.length;
    currentPeriodNet = activePeriod.payslips.reduce(
      (acc, curr) => acc + Number(curr.netAmount),
      0,
    );
  }

  return {
    totalPeriods,
    activePeriod: activePeriod
      ? {
          id: activePeriod.id,
          year: activePeriod.year,
          month: activePeriod.month,
          kind: activePeriod.kind,
          status: activePeriod.status,
        }
      : null,
    allComponentsCount,
    totalActiveEmployees,
    currentPeriodNet,
    currentPeriodEmployeesProcessed,
  };
}

/**
 * Mengambil daftar seluruh master komponen gaji
 */
export async function getSalaryComponents() {
  const components = await prisma.salaryComponent.findMany({
    orderBy: [{ type: "asc" }, { name: "asc" }],
    include: {
      _count: {
        select: {
          employeeComponents: true,
          payslipLines: true,
        },
      },
    },
  });

  return components.map((c) => ({
    id: c.id,
    code: c.code,
    name: c.name,
    type: c.type,
    calcType: c.calcType,
    defaultValue: c.defaultValue ? Number(c.defaultValue) : 0,
    isActive: c.isActive,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    _count: c._count,
  }));
}

/**
 * Mengambil detail satu slip gaji dengan rincian barisnya
 */
export async function getPayslipById(payslipId: string) {
  const p = await prisma.payslip.findUnique({
    where: { id: payslipId },
    include: {
      period: true,
      employee: {
        select: {
          id: true,
          employeeNo: true,
          fullName: true,
          bankName: true,
          bankAccountEnc: true,
          currentDepartment: { select: { id: true, name: true } },
          currentPosition: { select: { id: true, title: true } },
        },
      },
      lines: {
        orderBy: [{ type: "asc" }, { amount: "desc" }],
      },
    },
  });

  if (!p) return null;

  return {
    id: p.id,
    periodId: p.periodId,
    employeeId: p.employeeId,
    status: p.status,
    publishedAt: p.publishedAt ? p.publishedAt.toISOString() : null,
    pdfKey: p.pdfKey,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    grossAmount: Number(p.grossAmount),
    totalDeduction: Number(p.totalDeduction),
    netAmount: Number(p.netAmount),
    period: {
      id: p.period.id,
      year: p.period.year,
      month: p.period.month,
      kind: p.period.kind,
      status: p.period.status,
    },
    employee: p.employee,
    lines: p.lines.map((l) => ({
      id: l.id,
      payslipId: l.payslipId,
      componentId: l.componentId,
      label: l.label,
      type: l.type,
      amount: Number(l.amount),
    })),
  };
}
