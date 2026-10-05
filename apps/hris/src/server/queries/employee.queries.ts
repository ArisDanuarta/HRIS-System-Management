import { prisma, EmployeeStatus, EmploymentType, Prisma, DepartmentType } from "@pspk/db";
import { decryptField, maskSensitiveValue } from "@pspk/shared";

export type GetEmployeesParams = {
  search?: string;
  departmentId?: string;
  status?: string;
  type?: string;
  expiringSoonOnly?: boolean;
  page?: number;
  pageSize?: number;
  sortField?: "fullName" | "employeeNo" | "joinDate" | "createdAt";
  sortOrder?: "asc" | "desc";
  // Filter khusus skop tim (Manajer / Lead)
  teamManagerId?: string;
  managerDepartmentId?: string;
  excludeEmployeeId?: string;
};

export async function getEmployeesDirectory(params: GetEmployeesParams) {
  const {
    search,
    departmentId,
    status,
    type,
    expiringSoonOnly = false,
    page = 1,
    pageSize = 10,
    sortField = "createdAt",
    sortOrder = "desc",
    teamManagerId,
    managerDepartmentId,
    excludeEmployeeId,
  } = params;

  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Build where clause using AND array to avoid OR collisions
  const andConditions: Prisma.EmployeeWhereInput[] = [{ deletedAt: null }];

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
    andConditions.push({ OR: teamOr });
  }

  if (search && search.trim() !== "") {
    const q = search.trim();
    andConditions.push({
      OR: [
        { fullName: { contains: q, mode: "insensitive" } },
        { employeeNo: { contains: q, mode: "insensitive" } },
        { workEmail: { contains: q, mode: "insensitive" } },
        { nickname: { contains: q, mode: "insensitive" } },
      ],
    });
  }

  if (departmentId && departmentId !== "ALL") {
    andConditions.push({ currentDepartmentId: departmentId });
  }

  if (status && status !== "ALL") {
    andConditions.push({ status: status as EmployeeStatus });
  }

  if (type && type !== "ALL") {
    andConditions.push({
      contracts: {
        some: {
          type: type as EmploymentType,
          status: "ACTIVE",
        },
      },
    });
  }

  if (expiringSoonOnly) {
    andConditions.push({
      contracts: {
        some: {
          type: "FIXED_TERM",
          status: "ACTIVE",
          endDate: {
            gte: now,
            lte: thirtyDaysFromNow,
          },
        },
      },
    });
  }

  const where: Prisma.EmployeeWhereInput = {
    AND: andConditions,
  };

  // Count total matching
  const total = await prisma.employee.count({ where });

  // Get paginated items
  const employees = await prisma.employee.findMany({
    where,
    skip: (page - 1) * pageSize,
    take: pageSize,
    orderBy: {
      [sortField]: sortOrder,
    },
    include: {
      currentDepartment: { select: { id: true, name: true } },
      currentPosition: { select: { id: true, title: true } },
      manager: { select: { id: true, fullName: true } },
      contracts: {
        where: { status: "ACTIVE" },
        orderBy: { startDate: "desc" },
        take: 1,
        select: {
          id: true,
          type: true,
          employmentTypeId: true,
          employmentTypeMaster: { select: { id: true, name: true, code: true } },
          startDate: true,
          endDate: true,
          baseSalary: true,
          status: true,
        },
      },
    },
  });

  // Base scope conditions for statistics (scoped to team if manager, or all active)
  const baseStatsAnd: Prisma.EmployeeWhereInput[] = [{ deletedAt: null }];
  if (excludeEmployeeId) {
    baseStatsAnd.push({ id: { not: excludeEmployeeId } });
  }
  if (teamManagerId || managerDepartmentId) {
    const teamOr: Prisma.EmployeeWhereInput[] = [];
    if (teamManagerId) teamOr.push({ managerId: teamManagerId });
    if (managerDepartmentId) teamOr.push({ currentDepartmentId: managerDepartmentId });
    baseStatsAnd.push({ OR: teamOr });
  }

  const baseStatsWhere: Prisma.EmployeeWhereInput = {
    AND: baseStatsAnd,
  };

  // Calculate stats respecting the team scope
  const [totalActive, totalProbation, totalContractsExpiring] = await Promise.all([
    prisma.employee.count({
      where: {
        AND: [...baseStatsAnd, { status: "ACTIVE" }],
      },
    }),
    prisma.employee.count({
      where: {
        AND: [...baseStatsAnd, { status: "PROBATION" }],
      },
    }),
    prisma.employmentContract.count({
      where: {
        type: "FIXED_TERM",
        status: "ACTIVE",
        endDate: {
          gte: now,
          lte: thirtyDaysFromNow,
        },
        employee: baseStatsWhere,
      },
    }),
  ]);

  const items = employees.map((emp) => {
    const activeContract = emp.contracts[0] || null;
    let isExpiringSoon = false;
    let daysUntilExpiry: number | null = null;

    if (activeContract?.endDate) {
      const end = new Date(activeContract.endDate);
      const diffMs = end.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays <= 30) {
        isExpiringSoon = true;
        daysUntilExpiry = diffDays;
      }
    }

    return {
      id: emp.id,
      employeeNo: emp.employeeNo,
      fullName: emp.fullName,
      nickname: emp.nickname,
      workEmail: emp.workEmail,
      phone: emp.phone,
      photoKey: emp.photoKey,
      status: emp.status,
      joinDate: emp.joinDate,
      endDate: emp.endDate,
      currentDepartment: emp.currentDepartment,
      currentPosition: emp.currentPosition,
      manager: emp.manager,
      activeContract: activeContract
        ? {
            ...activeContract,
            baseSalary: activeContract.baseSalary ? Number(activeContract.baseSalary) : null,
          }
        : null,
      isExpiringSoon,
      daysUntilExpiry,
    };
  });

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize) || 1,
    stats: {
      totalActive,
      totalProbation,
      totalContractsExpiring,
    },
  };
}

export async function getEmployeeById(id: string) {
  const emp = await prisma.employee.findUnique({
    where: { id },
    include: {
      currentDepartment: true,
      currentPosition: true,
      manager: {
        select: {
          id: true,
          fullName: true,
          employeeNo: true,
          currentPosition: { select: { title: true } },
        },
      },
      directReports: {
        where: { deletedAt: null },
        select: {
          id: true,
          fullName: true,
          employeeNo: true,
          currentPosition: { select: { title: true } },
        },
      },
      contracts: {
        orderBy: { startDate: "desc" },
        include: {
          employmentTypeMaster: true,
        },
      },
      histories: {
        orderBy: { startDate: "desc" },
        include: {
          department: { select: { id: true, name: true } },
          position: { select: { id: true, title: true } },
        },
      },
      user: {
        select: {
          id: true,
          email: true,
          isActive: true,
          roles: {
            include: {
              role: true,
            },
          },
        },
      },
    },
  });

  if (!emp || emp.deletedAt) {
    return null;
  }

  // Safely prepare masked sensitive fields
  let nikMasked = "-";
  let npwpMasked = "-";
  let bankAccountMasked = "-";

  try {
    if (emp.nikEnc) {
      const dec = decryptField(emp.nikEnc);
      nikMasked = maskSensitiveValue(dec, 4);
    }
    if (emp.npwpEnc) {
      const dec = decryptField(emp.npwpEnc);
      npwpMasked = maskSensitiveValue(dec, 4);
    }
    if (emp.bankAccountEnc) {
      const dec = decryptField(emp.bankAccountEnc);
      bankAccountMasked = maskSensitiveValue(dec, 4);
    }
  } catch (err) {
    console.error("Error decrypting for masking:", err);
  }

  return {
    ...emp,
    nikMasked,
    npwpMasked,
    bankAccountMasked,
    hasNik: !!emp.nikEnc,
    hasNpwp: !!emp.npwpEnc,
    hasBankAccount: !!emp.bankAccountEnc,
    contracts: emp.contracts.map((c) => ({
      ...c,
      baseSalary: c.baseSalary ? Number(c.baseSalary) : null,
      hourlyRate: c.hourlyRate ? Number(c.hourlyRate) : null,
      employmentTypeMaster: c.employmentTypeMaster
        ? {
            ...c.employmentTypeMaster,
            defaultHourlyRate: c.employmentTypeMaster.defaultHourlyRate
              ? Number(c.employmentTypeMaster.defaultHourlyRate)
              : null,
            createdAt: c.employmentTypeMaster.createdAt.toISOString(),
            updatedAt: c.employmentTypeMaster.updatedAt.toISOString(),
          }
        : null,
    })),
  };
}

const DEPT_TYPE_ORDER: DepartmentType[] = ["GOVERNANCE", "LEADERSHIP", "INITIATIVE", "SUPPORT"];

function sortByTypeOrder<T extends { name: string; type: DepartmentType }>(list: T[]): T[] {
  return [...list].sort((a, b) => {
    const ai = DEPT_TYPE_ORDER.indexOf(a.type);
    const bi = DEPT_TYPE_ORDER.indexOf(b.type);
    if (ai !== bi) return ai - bi;
    return a.name.localeCompare(b.name, "id-ID");
  });
}

export async function getOrgStructureData() {
  const departments = await prisma.department.findMany({
    orderBy: { name: "asc" },
    include: {
      positions: {
        orderBy: { title: "asc" },
      },
    },
  });

  return sortByTypeOrder(departments);
}

export async function getOrgStructureDetail() {
  const [departments, totalDepartments, totalPositions, mappedEmployeesCount] = await Promise.all([
    prisma.department.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: {
            employees: { where: { deletedAt: null } },
            positions: true,
          },
        },
        positions: {
          orderBy: { title: "asc" },
          include: {
            _count: {
              select: {
                employees: { where: { deletedAt: null } },
              },
            },
          },
        },
      },
    }),
    prisma.department.count(),
    prisma.position.count(),
    prisma.employee.count({
      where: {
        deletedAt: null,
        currentPositionId: { not: null },
      },
    }),
  ]);

  const sortedDepartments = sortByTypeOrder(departments);

  // Statistik per tipe
  const countByType: Record<DepartmentType, number> = {
    GOVERNANCE: 0,
    LEADERSHIP: 0,
    INITIATIVE: 0,
    SUPPORT: 0,
  };
  for (const d of departments) {
    countByType[d.type] = (countByType[d.type] ?? 0) + 1;
  }

  return {
    departments: sortedDepartments,
    stats: {
      totalDepartments,
      totalPositions,
      mappedEmployeesCount,
      byType: countByType,
    },
  };
}

export async function getManagersList() {
  const managers = await prisma.employee.findMany({
    where: {
      status: "ACTIVE",
      deletedAt: null,
    },
    orderBy: { fullName: "asc" },
    select: {
      id: true,
      fullName: true,
      employeeNo: true,
      currentPosition: { select: { title: true } },
      currentDepartment: { select: { name: true } },
    },
  });

  return managers;
}

export async function getAssignableRoles() {
  const roles = await prisma.role.findMany({
    where: {
      key: { in: ["staff", "manager", "admin_hr", "admin_it"] },
    },
    select: {
      id: true,
      key: true,
      name: true,
      description: true,
    },
    orderBy: { name: "asc" },
  });

  return roles;
}

export async function getManagerTeamInfo(employeeId: string) {
  const managerEmployee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: {
      id: true,
      fullName: true,
      employeeNo: true,
      currentDepartmentId: true,
      currentDepartment: { select: { id: true, name: true } },
      currentPosition: { select: { title: true } },
    },
  });
  return managerEmployee;
}
