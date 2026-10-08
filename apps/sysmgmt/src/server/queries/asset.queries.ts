import { prisma, AssetCategory, AssetStatus } from "@pspk/db";

export interface AssetFilterParams {
  category?: "IT" | "NON_IT" | "ALL";
  status?: AssetStatus | "ALL";
  search?: string;
  page?: number;
  limit?: number;
}

export interface SerializedAssetAssignment {
  id: string;
  assetId: string;
  employeeId: string;
  assignedAt: Date;
  returnedAt: Date | null;
  conditionOut: string | null;
  conditionIn: string | null;
  notes: string | null;
  employee: {
    id: string;
    employeeNo: string;
    fullName: string;
    nickname: string | null;
    workEmail: string;
    departmentName: string | null;
    positionTitle: string | null;
  };
}

export interface SerializedAsset {
  id: string;
  assetTag: string;
  category: AssetCategory;
  type: string;
  name: string;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  purchaseDate: Date | null;
  purchasePrice: number | null;
  status: AssetStatus;
  location: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  activeAssignment?: SerializedAssetAssignment | null;
  assignments?: SerializedAssetAssignment[];
}

export interface AssetStats {
  total: number;
  inStock: number;
  assigned: number;
  maintenance: number;
  retired: number;
  lost: number;
  itTotal: number;
  nonItTotal: number;
}

/**
 * Mengambil daftar inventaris aset dengan filter kategori, status, pencarian, dan pagination.
 */
export async function getAssetsDirectory(params?: AssetFilterParams) {
  const page = Math.max(1, params?.page || 1);
  const limit = Math.min(100, Math.max(1, params?.limit || 50));
  const skip = (page - 1) * limit;

  const whereClause: Record<string, unknown> = {};

  if (params?.category && params.category !== "ALL") {
    whereClause.category = params.category as AssetCategory;
  }

  if (params?.status && params.status !== "ALL") {
    whereClause.status = params.status as AssetStatus;
  }

  if (params?.search && params.search.trim().length > 0) {
    const q = params.search.trim();
    whereClause.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { assetTag: { contains: q, mode: "insensitive" } },
      { serialNumber: { contains: q, mode: "insensitive" } },
      { brand: { contains: q, mode: "insensitive" } },
      { model: { contains: q, mode: "insensitive" } },
      { location: { contains: q, mode: "insensitive" } },
      { type: { contains: q, mode: "insensitive" } },
    ];
  }

  const [totalCount, rawAssets] = await Promise.all([
    prisma.asset.count({ where: whereClause }),
    prisma.asset.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        assignments: {
          where: { returnedAt: null },
          take: 1,
          include: {
            employee: {
              select: {
                id: true,
                employeeNo: true,
                fullName: true,
                nickname: true,
                workEmail: true,
                currentDepartment: { select: { name: true } },
                currentPosition: { select: { title: true } },
              },
            },
          },
        },
      },
    }),
  ]);

  const assets: SerializedAsset[] = rawAssets.map((item) => {
    const activeAss = item.assignments?.[0];
    const serializedActiveAss: SerializedAssetAssignment | null = activeAss
      ? {
          id: activeAss.id,
          assetId: activeAss.assetId,
          employeeId: activeAss.employeeId,
          assignedAt: activeAss.assignedAt,
          returnedAt: activeAss.returnedAt,
          conditionOut: activeAss.conditionOut,
          conditionIn: activeAss.conditionIn,
          notes: activeAss.notes,
          employee: {
            id: activeAss.employee.id,
            employeeNo: activeAss.employee.employeeNo,
            fullName: activeAss.employee.fullName,
            nickname: activeAss.employee.nickname,
            workEmail: activeAss.employee.workEmail,
            departmentName: activeAss.employee.currentDepartment?.name ?? null,
            positionTitle: activeAss.employee.currentPosition?.title ?? null,
          },
        }
      : null;

    return {
      id: item.id,
      assetTag: item.assetTag,
      category: item.category,
      type: item.type,
      name: item.name,
      brand: item.brand,
      model: item.model,
      serialNumber: item.serialNumber,
      purchaseDate: item.purchaseDate,
      purchasePrice: item.purchasePrice ? Number(item.purchasePrice) : null,
      status: item.status,
      location: item.location,
      notes: item.notes,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      activeAssignment: serializedActiveAss,
    };
  });

  return {
    assets,
    pagination: {
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit) || 1,
    },
  };
}

/**
 * Mengambil detail aset tunggal berdasarkan ID beserta riwayat penugasan lengkap.
 */
export async function getAssetById(id: string): Promise<SerializedAsset | null> {
  const item = await prisma.asset.findUnique({
    where: { id },
    include: {
      assignments: {
        orderBy: { assignedAt: "desc" },
        include: {
          employee: {
            select: {
              id: true,
              employeeNo: true,
              fullName: true,
              nickname: true,
              workEmail: true,
              currentDepartment: { select: { name: true } },
              currentPosition: { select: { title: true } },
            },
          },
        },
      },
    },
  });

  if (!item) return null;

  const serializedAssignments: SerializedAssetAssignment[] = item.assignments.map((ass) => ({
    id: ass.id,
    assetId: ass.assetId,
    employeeId: ass.employeeId,
    assignedAt: ass.assignedAt,
    returnedAt: ass.returnedAt,
    conditionOut: ass.conditionOut,
    conditionIn: ass.conditionIn,
    notes: ass.notes,
    employee: {
      id: ass.employee.id,
      employeeNo: ass.employee.employeeNo,
      fullName: ass.employee.fullName,
      nickname: ass.employee.nickname,
      workEmail: ass.employee.workEmail,
      departmentName: ass.employee.currentDepartment?.name ?? null,
      positionTitle: ass.employee.currentPosition?.title ?? null,
    },
  }));

  const activeAssignment = serializedAssignments.find((a) => a.returnedAt === null) || null;

  return {
    id: item.id,
    assetTag: item.assetTag,
    category: item.category,
    type: item.type,
    name: item.name,
    brand: item.brand,
    model: item.model,
    serialNumber: item.serialNumber,
    purchaseDate: item.purchaseDate,
    purchasePrice: item.purchasePrice ? Number(item.purchasePrice) : null,
    status: item.status,
    location: item.location,
    notes: item.notes,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    activeAssignment,
    assignments: serializedAssignments,
  };
}

/**
 * Mengambil ringkasan metrik statistik inventaris aset.
 */
export async function getAssetStats(): Promise<AssetStats> {
  const [total, inStock, assigned, maintenance, retired, lost, itTotal, nonItTotal] =
    await Promise.all([
      prisma.asset.count(),
      prisma.asset.count({ where: { status: "IN_STOCK" } }),
      prisma.asset.count({ where: { status: "ASSIGNED" } }),
      prisma.asset.count({ where: { status: "MAINTENANCE" } }),
      prisma.asset.count({ where: { status: "RETIRED" } }),
      prisma.asset.count({ where: { status: "LOST" } }),
      prisma.asset.count({ where: { category: "IT" } }),
      prisma.asset.count({ where: { category: "NON_IT" } }),
    ]);

  return {
    total,
    inStock,
    assigned,
    maintenance,
    retired,
    lost,
    itTotal,
    nonItTotal,
  };
}

/**
 * Generator tag aset otomatis terstandarisasi PSPK:
 * Format: PSPK-IT-YYYY-XXXX atau PSPK-NONIT-YYYY-XXXX
 */
export async function getNextAssetTag(category: "IT" | "NON_IT"): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `PSPK-${category}-${year}-`;

  // Cari aset dengan prefix tahun & kategori ini
  const existingAssets = await prisma.asset.findMany({
    where: {
      assetTag: { startsWith: prefix },
    },
    select: { assetTag: true },
    orderBy: { assetTag: "desc" },
    take: 1,
  });

  if (existingAssets.length === 0) {
    return `${prefix}0001`;
  }

  const latestTag = existingAssets[0]?.assetTag ?? "";
  const match = latestTag.match(/-(\d+)$/);
  const nextNum = match && match[1] ? parseInt(match[1], 10) + 1 : 1;
  const padded = String(nextNum).padStart(4, "0");

  return `${prefix}${padded}`;
}

/**
 * Mengambil daftar staf aktif untuk keperluan dropdown serah terima aset.
 */
export async function getActiveEmployeesForAssignment() {
  const employees = await prisma.employee.findMany({
    where: {
      status: "ACTIVE",
      deletedAt: null,
    },
    orderBy: { fullName: "asc" },
    select: {
      id: true,
      employeeNo: true,
      fullName: true,
      nickname: true,
      workEmail: true,
      currentDepartment: { select: { id: true, name: true } },
      currentPosition: { select: { id: true, title: true } },
    },
  });

  return employees.map((emp) => ({
    id: emp.id,
    employeeNo: emp.employeeNo,
    fullName: emp.fullName,
    nickname: emp.nickname,
    workEmail: emp.workEmail,
    departmentName: emp.currentDepartment?.name ?? "-",
    positionTitle: emp.currentPosition?.title ?? "-",
  }));
}
