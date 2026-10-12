import { prisma, AssetCategory } from "@pspk/db";

export interface SerializedDocumentCategory {
  id: string;
  name: string;
  codePrefix: string;
  description: string | null;
  color: string | null;
  isActive: boolean;
  documentCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SerializedAssetType {
  id: string;
  name: string;
  category: AssetCategory;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SerializedAssetLocation {
  id: string;
  name: string;
  building: string | null;
  floor: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SystemPreferencesData {
  maxUploadMb: number;
  auditRetentionDays: number;
  sessionTimeoutMins: number;
}

export interface SettingsStats {
  totalCategories: number;
  activeCategories: number;
  totalAssetTypes: number;
  itAssetTypes: number;
  nonItAssetTypes: number;
  totalLocations: number;
  activeLocations: number;
}

/**
 * Mengambil daftar seluruh kategori dokumen beserta jumlah dokumen terkait.
 */
export async function getDocumentCategories(options?: {
  includeInactive?: boolean;
}): Promise<SerializedDocumentCategory[]> {
  try {
    const whereClause = options?.includeInactive ? {} : { isActive: true };

    const rawCategories = await prisma.documentCategory.findMany({
      where: whereClause,
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { documents: true },
        },
      },
    });

    return rawCategories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      codePrefix: cat.codePrefix,
      description: cat.description,
      color: cat.color,
      isActive: cat.isActive,
      documentCount: cat._count.documents,
      createdAt: cat.createdAt,
      updatedAt: cat.updatedAt,
    }));
  } catch (error) {
    console.error("Gagal memuat kategori dokumen:", error);
    return [];
  }
}

/**
 * Mengambil daftar seluruh tipe inventaris aset (IT & Non-IT).
 */
export async function getAssetTypes(options?: {
  category?: AssetCategory;
  includeInactive?: boolean;
}): Promise<SerializedAssetType[]> {
  try {
    const whereClause: { category?: AssetCategory; isActive?: boolean } = {};

    if (options?.category) {
      whereClause.category = options.category;
    }

    if (!options?.includeInactive) {
      whereClause.isActive = true;
    }

    const rawTypes = await prisma.assetType.findMany({
      where: whereClause,
      orderBy: { name: "asc" },
    });

    return rawTypes.map((t) => ({
      id: t.id,
      name: t.name,
      category: t.category,
      description: t.description,
      isActive: t.isActive,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }));
  } catch (error) {
    console.error("Gagal memuat tipe aset:", error);
    return [];
  }
}

/**
 * Mengambil daftar seluruh lokasi fisik / ruangan kantor.
 */
export async function getAssetLocations(options?: {
  includeInactive?: boolean;
}): Promise<SerializedAssetLocation[]> {
  try {
    const whereClause = options?.includeInactive ? {} : { isActive: true };

    const rawLocations = await prisma.assetLocation.findMany({
      where: whereClause,
      orderBy: { name: "asc" },
    });

    return rawLocations.map((loc) => ({
      id: loc.id,
      name: loc.name,
      building: loc.building,
      floor: loc.floor,
      description: loc.description,
      isActive: loc.isActive,
      createdAt: loc.createdAt,
      updatedAt: loc.updatedAt,
    }));
  } catch (error) {
    console.error("Gagal memuat lokasi aset:", error);
    return [];
  }
}

/**
 * Mengambil preferensi konfigurasi sistem global dengan fallback aman.
 */
export async function getSystemPreferences(): Promise<SystemPreferencesData> {
  const defaultPrefs: SystemPreferencesData = {
    maxUploadMb: 25,
    auditRetentionDays: 365,
    sessionTimeoutMins: 1440,
  };

  try {
    const settings = await prisma.systemSetting.findMany({
      where: { category: "PREFERENCE" },
    });

    const settingsMap = new Map<string, string>();
    for (const s of settings) {
      settingsMap.set(s.key, s.value);
    }

    const maxUploadStr = settingsMap.get("system.max_upload_mb");
    const auditRetentionStr = settingsMap.get("system.audit_retention_days");
    const sessionTimeoutStr = settingsMap.get("system.session_timeout_mins");

    return {
      maxUploadMb: maxUploadStr ? parseInt(maxUploadStr, 10) || defaultPrefs.maxUploadMb : defaultPrefs.maxUploadMb,
      auditRetentionDays: auditRetentionStr
        ? parseInt(auditRetentionStr, 10) || defaultPrefs.auditRetentionDays
        : defaultPrefs.auditRetentionDays,
      sessionTimeoutMins: sessionTimeoutStr
        ? parseInt(sessionTimeoutStr, 10) || defaultPrefs.sessionTimeoutMins
        : defaultPrefs.sessionTimeoutMins,
    };
  } catch (error) {
    console.error("Gagal memuat preferensi sistem, menggunakan nilai standar:", error);
    return defaultPrefs;
  }
}

/**
 * Mengambil ringkasan metrik statistik pengaturan dan master data.
 */
export async function getSettingsStats(): Promise<SettingsStats> {
  try {
    const [
      totalCategories,
      activeCategories,
      totalAssetTypes,
      itAssetTypes,
      nonItAssetTypes,
      totalLocations,
      activeLocations,
    ] = await Promise.all([
      prisma.documentCategory.count(),
      prisma.documentCategory.count({ where: { isActive: true } }),
      prisma.assetType.count(),
      prisma.assetType.count({ where: { category: "IT" } }),
      prisma.assetType.count({ where: { category: "NON_IT" } }),
      prisma.assetLocation.count(),
      prisma.assetLocation.count({ where: { isActive: true } }),
    ]);

    return {
      totalCategories,
      activeCategories,
      totalAssetTypes,
      itAssetTypes,
      nonItAssetTypes,
      totalLocations,
      activeLocations,
    };
  } catch (error) {
    console.error("Gagal memuat statistik pengaturan:", error);
    return {
      totalCategories: 0,
      activeCategories: 0,
      totalAssetTypes: 0,
      itAssetTypes: 0,
      nonItAssetTypes: 0,
      totalLocations: 0,
      activeLocations: 0,
    };
  }
}
