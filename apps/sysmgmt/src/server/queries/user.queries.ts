import { prisma, Prisma } from "@pspk/db";

export interface GetUsersFilter {
  search?: string;
  roleKey?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export async function getAllUsers(filter?: GetUsersFilter) {
  const { search, roleKey, status, page, pageSize } = filter || {};

  const where: Prisma.UserWhereInput = {};

  if (search && search.trim() !== "") {
    const q = search.trim();
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { employee: { fullName: { contains: q, mode: "insensitive" } } },
      { employee: { employeeNo: { contains: q, mode: "insensitive" } } },
    ];
  }

  if (status === "active") {
    where.isActive = true;
  } else if (status === "inactive") {
    where.isActive = false;
  }

  if (roleKey && roleKey !== "ALL") {
    where.roles = {
      some: {
        role: {
          key: roleKey,
        },
      },
    };
  }

  const isPaginated = typeof page === "number" || typeof pageSize === "number";
  const currentPage = page ? Math.max(1, page) : 1;
  const limit = pageSize ? Math.max(1, pageSize) : 10;
  const skip = isPaginated ? (currentPage - 1) * limit : undefined;
  const take = isPaginated ? limit : undefined;

  const users = await prisma.user.findMany({
    where,
    skip,
    take,
    include: {
      roles: {
        include: {
          role: true,
        },
      },
      employee: {
        select: {
          id: true,
          employeeNo: true,
          fullName: true,
          status: true,
          currentDepartment: { select: { id: true, name: true } },
          currentPosition: { select: { id: true, title: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return users;
}

export async function getUserStats() {
  const [
    totalUsers,
    activeUsers,
    superAdminCount,
    adminHrCount,
    adminItCount,
    managerCount,
    staffCount,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.userRole.count({ where: { role: { key: "super_admin" }, user: { isActive: true } } }),
    prisma.userRole.count({ where: { role: { key: "admin_hr" } } }),
    prisma.userRole.count({ where: { role: { key: "admin_it" } } }),
    prisma.userRole.count({ where: { role: { key: "manager" } } }),
    prisma.userRole.count({ where: { role: { key: "staff" } } }),
  ]);

  return {
    totalUsers,
    activeUsers,
    superAdminCount,
    adminHrCount,
    adminItCount,
    managerCount,
    staffCount,
  };
}

export async function getAllSystemRoles() {
  const roles = await prisma.role.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      key: true,
      name: true,
      description: true,
      isSystem: true,
    },
  });

  return roles;
}
