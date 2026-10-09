import { prisma, Prisma } from "@pspk/db";

export interface LicenseFilterParams {
  search?: string;
  status?: "ALL" | "EXPIRING_SOON" | "EXPIRED" | "FULL" | "AVAILABLE" | "PERPETUAL";
  vendor?: string;
  page?: number;
  limit?: number;
  sortBy?: "name" | "expiresAt" | "utilization" | "createdAt";
  sortOrder?: "asc" | "desc";
}

export interface SerializedSoftwareLicense {
  id: string;
  name: string;
  vendor: string | null;
  hasLicenseKey: boolean;
  seatsTotal: number;
  seatsUsed: number;
  utilizationPercent: number;
  purchaseDate: Date | null;
  expiresAt: Date | null;
  daysRemaining: number | null;
  isExpired: boolean;
  isExpiringSoon: boolean;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface LicenseStats {
  totalLicenses: number;
  totalSeatsTotal: number;
  totalSeatsUsed: number;
  globalUtilizationPercent: number;
  expiringSoonCount: number;
  expiredCount: number;
  criticalUsageCount: number;
}

export interface LicensesDirectoryResult {
  licenses: SerializedSoftwareLicense[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  vendors: string[];
}

function calculateLicenseMeta(item: {
  seatsTotal: number;
  seatsUsed: number;
  expiresAt: Date | null;
}) {
  const seatsTotal = Math.max(item.seatsTotal, 1);
  const seatsUsed = Math.max(item.seatsUsed, 0);
  const utilizationPercent = Math.round((seatsUsed / seatsTotal) * 100);

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  let daysRemaining: number | null = null;
  let isExpired = false;
  let isExpiringSoon = false;

  if (item.expiresAt) {
    const expDate = new Date(item.expiresAt);
    const expDay = new Date(expDate.getFullYear(), expDate.getMonth(), expDate.getDate());
    const diffMs = expDay.getTime() - today.getTime();
    daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    isExpired = daysRemaining < 0;
    isExpiringSoon = daysRemaining >= 0 && daysRemaining <= 30;
  }

  return {
    utilizationPercent,
    daysRemaining,
    isExpired,
    isExpiringSoon,
  };
}

export async function getLicensesDirectory(
  params: LicenseFilterParams = {},
): Promise<LicensesDirectoryResult> {
  const {
    search,
    status = "ALL",
    vendor,
    page = 1,
    limit = 10,
    sortBy = "name",
    sortOrder = "asc",
  } = params;

  const where: Prisma.SoftwareLicenseWhereInput = {};

  if (search && search.trim()) {
    const q = search.trim();
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { vendor: { contains: q, mode: "insensitive" } },
      { notes: { contains: q, mode: "insensitive" } },
    ];
  }

  if (vendor && vendor !== "ALL") {
    where.vendor = vendor;
  }

  const orderByField = sortBy === "utilization" ? "seatsUsed" : sortBy;

  const allRecords = await prisma.softwareLicense.findMany({
    where,
    orderBy: { [orderByField]: sortOrder },
  });

  const serialized: SerializedSoftwareLicense[] = allRecords.map((item) => {
    const meta = calculateLicenseMeta(item);
    return {
      id: item.id,
      name: item.name,
      vendor: item.vendor,
      hasLicenseKey: Boolean(item.licenseKeyEnc),
      seatsTotal: item.seatsTotal,
      seatsUsed: item.seatsUsed,
      utilizationPercent: meta.utilizationPercent,
      purchaseDate: item.purchaseDate,
      expiresAt: item.expiresAt,
      daysRemaining: meta.daysRemaining,
      isExpired: meta.isExpired,
      isExpiringSoon: meta.isExpiringSoon,
      notes: item.notes,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  });

  // Filter status
  let filtered = serialized;
  if (status === "EXPIRING_SOON") {
    filtered = serialized.filter((l) => l.isExpiringSoon);
  } else if (status === "EXPIRED") {
    filtered = serialized.filter((l) => l.isExpired);
  } else if (status === "FULL") {
    filtered = serialized.filter((l) => l.seatsUsed >= l.seatsTotal);
  } else if (status === "AVAILABLE") {
    filtered = serialized.filter((l) => l.seatsUsed < l.seatsTotal);
  } else if (status === "PERPETUAL") {
    filtered = serialized.filter((l) => l.expiresAt === null);
  }

  // Sort by utilization jika diminta
  if (sortBy === "utilization") {
    filtered.sort((a, b) =>
      sortOrder === "desc"
        ? b.utilizationPercent - a.utilizationPercent
        : a.utilizationPercent - b.utilizationPercent,
    );
  }

  // Kumpulan vendor unik
  const vendors = Array.from(
    new Set(allRecords.map((r) => r.vendor).filter((v): v is string => Boolean(v))),
  ).sort();

  const total = filtered.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const safePage = Math.max(1, Math.min(page, totalPages));
  const paginated = filtered.slice((safePage - 1) * limit, safePage * limit);

  return {
    licenses: paginated,
    total,
    page: safePage,
    limit,
    totalPages,
    vendors,
  };
}

export async function getLicenseStats(): Promise<LicenseStats> {
  const licenses = await prisma.softwareLicense.findMany();

  const totalLicenses = licenses.length;
  let totalSeatsTotal = 0;
  let totalSeatsUsed = 0;
  let expiringSoonCount = 0;
  let expiredCount = 0;
  let criticalUsageCount = 0;

  for (const item of licenses) {
    totalSeatsTotal += item.seatsTotal;
    totalSeatsUsed += item.seatsUsed;

    const meta = calculateLicenseMeta(item);
    if (meta.isExpired) {
      expiredCount += 1;
    } else if (meta.isExpiringSoon) {
      expiringSoonCount += 1;
    }

    if (meta.utilizationPercent >= 80) {
      criticalUsageCount += 1;
    }
  }

  const globalUtilizationPercent =
    totalSeatsTotal > 0 ? Math.round((totalSeatsUsed / totalSeatsTotal) * 100) : 0;

  return {
    totalLicenses,
    totalSeatsTotal,
    totalSeatsUsed,
    globalUtilizationPercent,
    expiringSoonCount,
    expiredCount,
    criticalUsageCount,
  };
}

export async function getLicenseById(id: string): Promise<SerializedSoftwareLicense | null> {
  const item = await prisma.softwareLicense.findUnique({
    where: { id },
  });

  if (!item) return null;

  const meta = calculateLicenseMeta(item);
  return {
    id: item.id,
    name: item.name,
    vendor: item.vendor,
    hasLicenseKey: Boolean(item.licenseKeyEnc),
    seatsTotal: item.seatsTotal,
    seatsUsed: item.seatsUsed,
    utilizationPercent: meta.utilizationPercent,
    purchaseDate: item.purchaseDate,
    expiresAt: item.expiresAt,
    daysRemaining: meta.daysRemaining,
    isExpired: meta.isExpired,
    isExpiringSoon: meta.isExpiringSoon,
    notes: item.notes,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}
