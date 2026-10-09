import { prisma, Prisma, DocumentVisibility, DocumentStatus } from "@pspk/db";

export interface DocumentDirectoryItem {
  id: string;
  code: string;
  title: string;
  category: string;
  visibility: DocumentVisibility;
  status: DocumentStatus;
  createdAt: Date;
  updatedAt: Date;
  currentVersionNo: number;
  currentFileName: string | null;
  currentFileSize: number | null;
  currentMimeType: string | null;
  currentEffectiveDate: Date | null;
  totalVersionsCount: number;
}

export interface DocumentDirectoryResult {
  documents: DocumentDirectoryItem[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface DocumentVersionDetail {
  id: string;
  documentId: string;
  versionNo: number;
  fileKey: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
  changeNote: string | null;
  effectiveDate: Date | null;
  createdById: string;
  createdByName: string;
  createdByEmail: string;
  createdAt: Date;
  isCurrent: boolean;
}

export interface DocumentDetailWithVersions {
  id: string;
  code: string;
  title: string;
  category: string;
  visibility: DocumentVisibility;
  status: DocumentStatus;
  ownerId: string | null;
  currentVersionId: string | null;
  createdAt: Date;
  updatedAt: Date;
  versions: DocumentVersionDetail[];
  currentVersion: DocumentVersionDetail | null;
}

export interface DocumentStats {
  totalDocuments: number;
  activeDocuments: number;
  kebijakanCount: number;
  sopCount: number;
  restrictedCount: number;
  categories: { name: string; count: number }[];
}

/**
 * Memeriksa apakah pengguna dengan peran tertentu berhak melihat dokumen berdasarkan visibilitasnya.
 */
export function canUserViewDocument(userRoles: string[], visibility: DocumentVisibility): boolean {
  if (userRoles.includes("super_admin")) return true;
  if (visibility === DocumentVisibility.ALL_STAFF) return true;

  if (visibility === DocumentVisibility.MANAGERS) {
    return userRoles.some((r) =>
      ["manager", "admin_hr", "admin_it", "super_admin"].includes(r),
    );
  }

  if (visibility === DocumentVisibility.HR_ONLY) {
    return userRoles.some((r) => ["admin_hr", "super_admin"].includes(r));
  }

  if (visibility === DocumentVisibility.IT_ONLY) {
    return userRoles.some((r) => ["admin_it", "super_admin"].includes(r));
  }

  return false;
}

/**
 * Menghasilkan daftar DocumentVisibility yang diizinkan untuk kumpulan role pengguna.
 */
export function getAllowedVisibilitiesForRoles(userRoles: string[]): DocumentVisibility[] {
  if (userRoles.includes("super_admin")) {
    return [
      DocumentVisibility.ALL_STAFF,
      DocumentVisibility.MANAGERS,
      DocumentVisibility.HR_ONLY,
      DocumentVisibility.IT_ONLY,
    ];
  }

  const allowed: DocumentVisibility[] = [DocumentVisibility.ALL_STAFF];

  const isManager = userRoles.includes("manager");
  const isHr = userRoles.includes("admin_hr");
  const isIt = userRoles.includes("admin_it");

  if (isManager || isHr || isIt) {
    allowed.push(DocumentVisibility.MANAGERS);
  }

  if (isHr) {
    allowed.push(DocumentVisibility.HR_ONLY);
  }

  if (isIt) {
    allowed.push(DocumentVisibility.IT_ONLY);
  }

  return allowed;
}

/**
 * Query direktori dokumen dan SOP dengan filter multi-dimensi dan proteksi visibilitas peran.
 */
export async function getDocumentsDirectory(
  params: {
    q?: string;
    category?: string;
    status?: string;
    visibility?: string;
    page?: number;
    pageSize?: number;
    sortBy?: "code" | "title" | "updatedAt";
    sortOrder?: "asc" | "desc";
  },
  userRoles: string[] = ["super_admin"],
): Promise<DocumentDirectoryResult> {
  const page = Math.max(1, params.page || 1);
  const pageSize = Math.max(1, Math.min(100, params.pageSize || 10));
  const skip = (page - 1) * pageSize;

  const allowedVisibilities = getAllowedVisibilitiesForRoles(userRoles);

  // Bangun klausa where
  const where: Prisma.DocumentWhereInput = {};

  // 1. Visibilitas Guard
  if (params.visibility && params.visibility !== "ALL") {
    const requestedVis = params.visibility as DocumentVisibility;
    if (allowedVisibilities.includes(requestedVis)) {
      where.visibility = requestedVis;
    } else {
      // Jika meminta visibilitas yang tidak berhak diakses, paksa kondisi kosong
      where.visibility = { in: [] };
    }
  } else {
    where.visibility = { in: allowedVisibilities };
  }

  // 2. Filter Status
  if (params.status && params.status !== "ALL") {
    where.status = params.status as DocumentStatus;
  }

  // 3. Filter Kategori
  if (params.category && params.category !== "ALL") {
    where.category = params.category;
  }

  // 4. Pencarian teks bebas
  if (params.q?.trim()) {
    const query = params.q.trim();
    where.OR = [
      { code: { contains: query, mode: "insensitive" } },
      { title: { contains: query, mode: "insensitive" } },
      { category: { contains: query, mode: "insensitive" } },
    ];
  }

  // Sorting
  const sortBy = params.sortBy || "updatedAt";
  const sortOrder = params.sortOrder || "desc";
  const orderBy = { [sortBy]: sortOrder };

  const [totalCount, rawDocs] = await Promise.all([
    prisma.document.count({ where }),
    prisma.document.findMany({
      where,
      orderBy,
      skip,
      take: pageSize,
      include: {
        versions: {
          orderBy: { versionNo: "desc" },
          take: 1,
          select: {
            versionNo: true,
            fileName: true,
            sizeBytes: true,
            mimeType: true,
            effectiveDate: true,
          },
        },
        _count: {
          select: { versions: true },
        },
      },
    }),
  ]);

  const documents: DocumentDirectoryItem[] = rawDocs.map((doc) => {
    const latestVersion = doc.versions[0] || null;
    return {
      id: doc.id,
      code: doc.code,
      title: doc.title,
      category: doc.category,
      visibility: doc.visibility,
      status: doc.status,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      currentVersionNo: latestVersion ? latestVersion.versionNo : 1,
      currentFileName: latestVersion ? latestVersion.fileName : null,
      currentFileSize: latestVersion ? latestVersion.sizeBytes : null,
      currentMimeType: latestVersion ? latestVersion.mimeType : null,
      currentEffectiveDate: latestVersion?.effectiveDate || null,
      totalVersionsCount: doc._count.versions,
    };
  });

  return {
    documents,
    totalCount,
    totalPages: Math.ceil(totalCount / pageSize),
    currentPage: page,
    pageSize,
  };
}

/**
 * Mengambil detail dokumen lengkap beserta seluruh riwayat versinya.
 */
export async function getDocumentById(
  id: string,
  userRoles: string[] = ["super_admin"],
): Promise<DocumentDetailWithVersions | null> {
  const doc = await prisma.document.findUnique({
    where: { id },
    include: {
      versions: {
        orderBy: { versionNo: "desc" },
      },
    },
  });

  if (!doc) return null;

  // Cek hak akses visibilitas
  if (!canUserViewDocument(userRoles, doc.visibility)) {
    return null;
  }

  // Ambil nama pembuat untuk masing-masing versi
  const userIds = Array.from(new Set(doc.versions.map((v) => v.createdById)));
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u]));

  const versions: DocumentVersionDetail[] = doc.versions.map((v) => {
    const creator = userMap.get(v.createdById);
    return {
      id: v.id,
      documentId: v.documentId,
      versionNo: v.versionNo,
      fileKey: v.fileKey,
      fileName: v.fileName,
      mimeType: v.mimeType,
      sizeBytes: v.sizeBytes,
      sha256: v.sha256,
      changeNote: v.changeNote,
      effectiveDate: v.effectiveDate,
      createdById: v.createdById,
      createdByName: creator?.name || "Petugas Sistem",
      createdByEmail: creator?.email || "system@pspk.id",
      createdAt: v.createdAt,
      isCurrent: doc.currentVersionId === v.id || v.versionNo === doc.versions[0]?.versionNo,
    };
  });

  const currentVersion =
    versions.find((v) => v.id === doc.currentVersionId) || versions[0] || null;

  return {
    id: doc.id,
    code: doc.code,
    title: doc.title,
    category: doc.category,
    visibility: doc.visibility,
    status: doc.status,
    ownerId: doc.ownerId,
    currentVersionId: doc.currentVersionId,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    versions,
    currentVersion,
  };
}

/**
 * Menghitung statistik metrik dokumen & SOP.
 */
export async function getDocumentStats(
  userRoles: string[] = ["super_admin"],
): Promise<DocumentStats> {
  const allowedVisibilities = getAllowedVisibilitiesForRoles(userRoles);

  const [totalDocuments, activeDocuments, allDocs] = await Promise.all([
    prisma.document.count({
      where: { visibility: { in: allowedVisibilities } },
    }),
    prisma.document.count({
      where: {
        status: DocumentStatus.ACTIVE,
        visibility: { in: allowedVisibilities },
      },
    }),
    prisma.document.findMany({
      where: { visibility: { in: allowedVisibilities } },
      select: { category: true, visibility: true },
    }),
  ]);

  let kebijakanCount = 0;
  let sopCount = 0;
  let restrictedCount = 0;
  const categoryMap = new Map<string, number>();

  for (const doc of allDocs) {
    if (doc.category.toLowerCase().includes("kebijakan")) {
      kebijakanCount++;
    }
    if (doc.category.toLowerCase().includes("sop")) {
      sopCount++;
    }
    if (doc.visibility !== DocumentVisibility.ALL_STAFF) {
      restrictedCount++;
    }

    const currentCount = categoryMap.get(doc.category) || 0;
    categoryMap.set(doc.category, currentCount + 1);
  }

  const categories = Array.from(categoryMap.entries()).map(([name, count]) => ({
    name,
    count,
  }));

  return {
    totalDocuments,
    activeDocuments,
    kebijakanCount,
    sopCount,
    restrictedCount,
    categories,
  };
}

/**
 * Memberikan saran kode dokumen otomatis berikutnya berdasarkan kategori.
 */
export async function getNextDocumentCode(category: string): Promise<string> {
  const cleanCat = (category || "").toLowerCase();
  let prefix = "SOP-";

  if (cleanCat.includes("hr") || cleanCat.includes("pegawai") || cleanCat.includes("sdm")) {
    prefix = "SOP-HR-";
  } else if (cleanCat.includes("it") || cleanCat.includes("sistem") || cleanCat.includes("keamanan")) {
    prefix = "SOP-IT-";
  } else if (cleanCat.includes("keuangan") || cleanCat.includes("finansial") || cleanCat.includes("anggaran")) {
    prefix = "SOP-KEU-";
  } else if (cleanCat.includes("kebijakan")) {
    prefix = "KBJ-";
  } else if (cleanCat.includes("umum") || cleanCat.includes("operasional")) {
    prefix = "SOP-UMUM-";
  }

  const existingDocs = await prisma.document.findMany({
    where: { code: { startsWith: prefix } },
    select: { code: true },
  });

  let maxNum = 0;
  for (const doc of existingDocs) {
    const numPart = doc.code.replace(prefix, "").trim();
    const parsed = parseInt(numPart, 10);
    if (!isNaN(parsed) && parsed > maxNum) {
      maxNum = parsed;
    }
  }

  const nextNum = maxNum + 1;
  const padded = String(nextNum).padStart(3, "0");
  return `${prefix}${padded}`;
}
