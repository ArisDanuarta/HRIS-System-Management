import { prisma, Prisma, CredentialCategory, TwoFactorType } from "@pspk/db";

export interface CredentialFilterParams {
  search?: string;
  category?: "ALL" | CredentialCategory;
  twoFactor?: "ALL" | "WITH_2FA" | "WITHOUT_2FA" | TwoFactorType;
  status?: "ALL" | "ACTIVE" | "INACTIVE";
  needsRotationOnly?: boolean;
  page?: number;
  limit?: number;
  sortBy?: "title" | "category" | "lastRotatedAt" | "createdAt";
  sortOrder?: "asc" | "desc";
}

export interface SerializedCredential {
  id: string;
  title: string;
  category: CredentialCategory;
  url: string | null;
  username: string | null;
  email: string | null;
  hasPassword: boolean;
  twoFactorType: TwoFactorType;
  recoveryEmail: string | null;
  recoveryPhone: string | null;
  picEmployeeId: string | null;
  picEmployee: {
    id: string;
    fullName: string;
    employeeNo: string;
    departmentName: string | null;
    positionTitle: string | null;
  } | null;
  notes: string | null;
  isActive: boolean;
  lastRotatedAt: Date | null;
  daysSinceRotation: number | null;
  needsRotation: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CredentialStats {
  totalCredentials: number;
  activeCount: number;
  socialMediaCount: number;
  websiteHostingCount: number;
  saasToolsCount: number;
  twoFactorProtectedCount: number;
  twoFactorAdoptionRate: number;
  needsRotationCount: number;
}

export interface CredentialsDirectoryResult {
  credentials: SerializedCredential[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  categories: { category: CredentialCategory; count: number }[];
}

export interface ActiveEmployeePicOption {
  id: string;
  fullName: string;
  employeeNo: string;
  departmentName: string | null;
  positionTitle: string | null;
}

function calculateRotationMeta(lastRotatedAt: Date | null) {
  if (!lastRotatedAt) {
    return { daysSinceRotation: null, needsRotation: true };
  }
  const now = new Date();
  const diffMs = now.getTime() - new Date(lastRotatedAt).getTime();
  const daysSinceRotation = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  const needsRotation = daysSinceRotation >= 90;
  return { daysSinceRotation, needsRotation };
}

export async function getCredentialsDirectory(
  params: CredentialFilterParams = {},
): Promise<CredentialsDirectoryResult> {
  const {
    search,
    category = "ALL",
    twoFactor = "ALL",
    status = "ALL",
    needsRotationOnly = false,
    page = 1,
    limit = 15,
    sortBy = "title",
    sortOrder = "asc",
  } = params;

  const where: Prisma.CredentialWhereInput = {};

  // 1. Text Search
  if (search && search.trim()) {
    const q = search.trim();
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { username: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { url: { contains: q, mode: "insensitive" } },
      { notes: { contains: q, mode: "insensitive" } },
      { picEmployee: { fullName: { contains: q, mode: "insensitive" } } },
    ];
  }

  // 2. Category Filter
  if (category && category !== "ALL") {
    where.category = category;
  }

  // 3. Two Factor Filter
  if (twoFactor && twoFactor !== "ALL") {
    if (twoFactor === "WITH_2FA") {
      where.twoFactorType = { not: "NONE" };
    } else if (twoFactor === "WITHOUT_2FA") {
      where.twoFactorType = "NONE";
    } else {
      where.twoFactorType = twoFactor;
    }
  }

  // 4. Status Filter
  if (status === "ACTIVE") {
    where.isActive = true;
  } else if (status === "INACTIVE") {
    where.isActive = false;
  }

  // 5. Rotation filter (older than 90 days or null)
  if (needsRotationOnly) {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    where.OR = [
      { lastRotatedAt: null },
      { lastRotatedAt: { lte: ninetyDaysAgo } },
    ];
  }

  // Ordering
  const orderBy: Prisma.CredentialOrderByWithRelationInput = {};
  if (sortBy === "title") orderBy.title = sortOrder;
  else if (sortBy === "category") orderBy.category = sortOrder;
  else if (sortBy === "lastRotatedAt") orderBy.lastRotatedAt = sortOrder;
  else if (sortBy === "createdAt") orderBy.createdAt = sortOrder;
  else orderBy.title = "asc";

  const safePage = Math.max(1, page);
  const safeLimit = Math.min(100, Math.max(1, limit));
  const skip = (safePage - 1) * safeLimit;

  const [rawItems, total, categoryGroup] = await Promise.all([
    prisma.credential.findMany({
      where,
      select: {
        id: true,
        title: true,
        category: true,
        url: true,
        username: true,
        email: true,
        passwordEnc: true,
        twoFactorType: true,
        recoveryEmail: true,
        recoveryPhone: true,
        picEmployeeId: true,
        notes: true,
        isActive: true,
        lastRotatedAt: true,
        createdAt: true,
        updatedAt: true,
        picEmployee: {
          select: {
            id: true,
            fullName: true,
            employeeNo: true,
            currentDepartment: { select: { name: true } },
            currentPosition: { select: { title: true } },
          },
        },
      },
      orderBy,
      skip,
      take: safeLimit,
    }),
    prisma.credential.count({ where }),
    prisma.credential.groupBy({
      by: ["category"],
      _count: { id: true },
    }),
  ]);

  const credentials: SerializedCredential[] = rawItems.map((item) => {
    const { daysSinceRotation, needsRotation } = calculateRotationMeta(item.lastRotatedAt);
    return {
      id: item.id,
      title: item.title,
      category: item.category,
      url: item.url,
      username: item.username,
      email: item.email,
      hasPassword: Boolean(item.passwordEnc),
      twoFactorType: item.twoFactorType,
      recoveryEmail: item.recoveryEmail,
      recoveryPhone: item.recoveryPhone,
      picEmployeeId: item.picEmployeeId,
      picEmployee: item.picEmployee
        ? {
            id: item.picEmployee.id,
            fullName: item.picEmployee.fullName,
            employeeNo: item.picEmployee.employeeNo,
            departmentName: item.picEmployee.currentDepartment?.name ?? null,
            positionTitle: item.picEmployee.currentPosition?.title ?? null,
          }
        : null,
      notes: item.notes,
      isActive: item.isActive,
      lastRotatedAt: item.lastRotatedAt,
      daysSinceRotation,
      needsRotation,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  });

  const categories = categoryGroup.map((g) => ({
    category: g.category,
    count: g._count.id,
  }));

  return {
    credentials,
    total,
    page: safePage,
    limit: safeLimit,
    totalPages: Math.ceil(total / safeLimit) || 1,
    categories,
  };
}

export async function getCredentialStats(): Promise<CredentialStats> {
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const [
    totalCredentials,
    activeCount,
    socialMediaCount,
    websiteHostingCount,
    saasToolsCount,
    twoFactorProtectedCount,
    needsRotationCount,
  ] = await Promise.all([
    prisma.credential.count(),
    prisma.credential.count({ where: { isActive: true } }),
    prisma.credential.count({ where: { category: "SOCIAL_MEDIA", isActive: true } }),
    prisma.credential.count({ where: { category: "WEBSITE_HOSTING", isActive: true } }),
    prisma.credential.count({ where: { category: "SAAS_TOOL", isActive: true } }),
    prisma.credential.count({ where: { twoFactorType: { not: "NONE" }, isActive: true } }),
    prisma.credential.count({
      where: {
        isActive: true,
        OR: [{ lastRotatedAt: null }, { lastRotatedAt: { lte: ninetyDaysAgo } }],
      },
    }),
  ]);

  const twoFactorAdoptionRate =
    activeCount > 0 ? Math.round((twoFactorProtectedCount / activeCount) * 100) : 0;

  return {
    totalCredentials,
    activeCount,
    socialMediaCount,
    websiteHostingCount,
    saasToolsCount,
    twoFactorProtectedCount,
    twoFactorAdoptionRate,
    needsRotationCount,
  };
}

export async function getActiveEmployeesForPic(): Promise<ActiveEmployeePicOption[]> {
  const employees = await prisma.employee.findMany({
    where: {
      status: "ACTIVE",
      deletedAt: null,
    },
    select: {
      id: true,
      fullName: true,
      employeeNo: true,
      currentDepartment: { select: { name: true } },
      currentPosition: { select: { title: true } },
    },
    orderBy: { fullName: "asc" },
  });

  return employees.map((e) => ({
    id: e.id,
    fullName: e.fullName,
    employeeNo: e.employeeNo,
    departmentName: e.currentDepartment?.name ?? null,
    positionTitle: e.currentPosition?.title ?? null,
  }));
}

