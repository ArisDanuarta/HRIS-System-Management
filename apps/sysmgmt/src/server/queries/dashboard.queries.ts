import { prisma } from "@pspk/db";
import { getModuleGovernanceData } from "./module.queries";

export interface SysmgmtDashboardStats {
  userStats: {
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    activeSessions: number;
    superAdminCount: number;
    adminItCount: number;
  };
  assetStats: {
    totalAssets: number;
    assignedAssets: number;
    inStockAssets: number;
    maintenanceAssets: number;
    itAssets: number;
    nonItAssets: number;
  };
  licenseStats: {
    totalLicenses: number;
    totalSeats: number;
    usedSeats: number;
    utilizationPercent: number;
    expiringSoonCount: number;
  };
  documentStats: {
    totalDocuments: number;
    activeDocuments: number;
    draftDocuments: number;
    archivedDocuments: number;
  };
  credentialStats: {
    totalCredentials: number;
    activeCount: number;
    needsRotationCount: number;
    twoFactorProtectedCount: number;
    twoFactorAdoptionRate: number;
  };
  recentAudits: Array<{
    id: string;
    occurredAt: string;
    actorUserId: string | null;
    actorEmail: string;
    app: string;
    action: string;
    entityType: string;
    entityId: string | null;
    ip: string | null;
  }>;
  systemHealth: {
    isDatabaseConnected: boolean;
    activeModulesCount: number;
    totalModulesCount: number;
    checkedAt: string;
  };
}

/**
 * Mengambil metrik agregat lengkap untuk Dashboard Utama System Management.
 * Seluruh query dioptimalkan dengan agregasi basis data (groupBy & aggregate)
 * untuk menghindari ledakan subquery paralel berlebih.
 */
export async function getSysmgmtDashboardStats(): Promise<SysmgmtDashboardStats> {
  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  try {
    const [
      // 1. User & Sesi
      userStatusGroups,
      activeSessions,
      adminRoles,

      // 2. Aset (Agregasi database per status dan kategori)
      assetStatusGroups,
      assetCategoryGroups,

      // 3. Lisensi (Agregasi total dan pemakaian kursi + lisensi segera kedaluwarsa)
      licenseAgg,
      expiringSoonCount,

      // 4. Dokumen (Agregasi database per status dokumen)
      docStatusGroups,

      // 5. Kredensial (Agregasi database kredensial dan akun aktif)
      totalCredentials,
      activeCredentialsData,

      // 6. Log Audit Terbaru
      rawRecentAudits,

      // 7. Tata Kelola Modul
      moduleGovernance,
    ] = await Promise.all([
      // User: status aktif vs nonaktif
      prisma.user.groupBy({
        by: ["isActive"],
        _count: { id: true },
      }),
      prisma.session.count({ where: { expiresAt: { gt: now } } }),
      prisma.userRole.findMany({
        where: {
          role: { key: { in: ["super_admin", "admin_it"] } },
          user: { isActive: true },
        },
        select: {
          role: { select: { key: true } },
        },
      }),

      // Aset: groupBy status & category
      prisma.asset.groupBy({
        by: ["status"],
        _count: { id: true },
      }),
      prisma.asset.groupBy({
        by: ["category"],
        _count: { id: true },
      }),

      // Lisensi Software: aggregate count + sum kursi dalam 1 kueri
      prisma.softwareLicense.aggregate({
        _count: { id: true },
        _sum: {
          seatsTotal: true,
          seatsUsed: true,
        },
      }),
      prisma.softwareLicense.count({
        where: {
          expiresAt: {
            gte: now,
            lte: in30Days,
          },
        },
      }),

      // Dokumen & SOP: groupBy status
      prisma.document.groupBy({
        by: ["status"],
        _count: { id: true },
      }),

      // Kredensial & Akun: total hitungan & data kredensial aktif
      prisma.credential.count(),
      prisma.credential.findMany({
        where: { isActive: true },
        select: {
          lastRotatedAt: true,
          twoFactorType: true,
        },
      }),

      // Log Audit Terkini (Maksimal 8)
      prisma.auditLog.findMany({
        take: 8,
        orderBy: { occurredAt: "desc" },
        select: {
          id: true,
          occurredAt: true,
          actorUserId: true,
          actorEmail: true,
          app: true,
          action: true,
          entityType: true,
          entityId: true,
          ip: true,
        },
      }),

      // Modul
      getModuleGovernanceData(),
    ]);

    // Kalkulasi User Stats
    let totalUsers = 0;
    let activeUsers = 0;
    let inactiveUsers = 0;
    for (const ug of userStatusGroups) {
      const count = ug._count.id;
      totalUsers += count;
      if (ug.isActive) activeUsers = count;
      else inactiveUsers = count;
    }

    let superAdminCount = 0;
    let adminItCount = 0;
    for (const ur of adminRoles) {
      if (ur.role.key === "super_admin") superAdminCount++;
      else if (ur.role.key === "admin_it") adminItCount++;
    }

    // Kalkulasi Asset Stats
    let totalAssets = 0;
    let assignedAssets = 0;
    let inStockAssets = 0;
    let maintenanceAssets = 0;
    for (const ag of assetStatusGroups) {
      const count = ag._count.id;
      totalAssets += count;
      if (ag.status === "ASSIGNED") assignedAssets = count;
      else if (ag.status === "IN_STOCK") inStockAssets = count;
      else if (ag.status === "MAINTENANCE") maintenanceAssets = count;
    }

    let itAssets = 0;
    let nonItAssets = 0;
    for (const cg of assetCategoryGroups) {
      const count = cg._count.id;
      if (cg.category === "IT") itAssets = count;
      else if (cg.category === "NON_IT") nonItAssets = count;
    }

    // Kalkulasi rasio kursi lisensi terpakai
    const totalLicenses = licenseAgg._count?.id ?? 0;
    const totalSeats = licenseAgg._sum?.seatsTotal ?? 0;
    const usedSeats = licenseAgg._sum?.seatsUsed ?? 0;
    const utilizationPercent =
      totalSeats > 0 ? Math.round((usedSeats / totalSeats) * 100) : 0;

    // Kalkulasi Document Stats
    let totalDocuments = 0;
    let activeDocuments = 0;
    let draftDocuments = 0;
    let archivedDocuments = 0;
    for (const dg of docStatusGroups) {
      const count = dg._count.id;
      totalDocuments += count;
      if (dg.status === "ACTIVE") activeDocuments = count;
      else if (dg.status === "DRAFT") draftDocuments = count;
      else if (dg.status === "ARCHIVED") archivedDocuments = count;
    }

    // Kalkulasi Credential Stats
    const activeCredentials = activeCredentialsData.length;
    let needsRotationCount = 0;
    let twoFactorProtectedCount = 0;
    for (const cred of activeCredentialsData) {
      if (!cred.lastRotatedAt || cred.lastRotatedAt <= ninetyDaysAgo) {
        needsRotationCount++;
      }
      if (cred.twoFactorType !== "NONE") {
        twoFactorProtectedCount++;
      }
    }

    const twoFactorAdoptionRate =
      activeCredentials > 0
        ? Math.round((twoFactorProtectedCount / activeCredentials) * 100)
        : 0;

    const recentAudits = rawRecentAudits.map((a) => ({
      id: a.id,
      occurredAt: a.occurredAt.toISOString(),
      actorUserId: a.actorUserId,
      actorEmail: a.actorEmail,
      app: a.app,
      action: a.action,
      entityType: a.entityType,
      entityId: a.entityId,
      ip: a.ip,
    }));

    return {
      userStats: {
        totalUsers,
        activeUsers,
        inactiveUsers,
        activeSessions,
        superAdminCount,
        adminItCount,
      },
      assetStats: {
        totalAssets,
        assignedAssets,
        inStockAssets,
        maintenanceAssets,
        itAssets,
        nonItAssets,
      },
      licenseStats: {
        totalLicenses,
        totalSeats,
        usedSeats,
        utilizationPercent,
        expiringSoonCount,
      },
      documentStats: {
        totalDocuments,
        activeDocuments,
        draftDocuments,
        archivedDocuments,
      },
      credentialStats: {
        totalCredentials,
        activeCount: activeCredentials,
        needsRotationCount,
        twoFactorProtectedCount,
        twoFactorAdoptionRate,
      },
      recentAudits,
      systemHealth: {
        isDatabaseConnected: true,
        activeModulesCount: moduleGovernance.stats.activeCount,
        totalModulesCount: moduleGovernance.stats.total,
        checkedAt: now.toISOString(),
      },
    };
  } catch (error) {
    console.error("Gagal memuat statistik dashboard System Management:", error);
    // Safe fallback jika terjadi kendala pada kueri
    return {
      userStats: {
        totalUsers: 0,
        activeUsers: 0,
        inactiveUsers: 0,
        activeSessions: 0,
        superAdminCount: 0,
        adminItCount: 0,
      },
      assetStats: {
        totalAssets: 0,
        assignedAssets: 0,
        inStockAssets: 0,
        maintenanceAssets: 0,
        itAssets: 0,
        nonItAssets: 0,
      },
      licenseStats: {
        totalLicenses: 0,
        totalSeats: 0,
        usedSeats: 0,
        utilizationPercent: 0,
        expiringSoonCount: 0,
      },
      documentStats: {
        totalDocuments: 0,
        activeDocuments: 0,
        draftDocuments: 0,
        archivedDocuments: 0,
      },
      credentialStats: {
        totalCredentials: 0,
        activeCount: 0,
        needsRotationCount: 0,
        twoFactorProtectedCount: 0,
        twoFactorAdoptionRate: 0,
      },
      recentAudits: [],
      systemHealth: {
        isDatabaseConnected: false,
        activeModulesCount: 0,
        totalModulesCount: 0,
        checkedAt: now.toISOString(),
      },
    };
  }
}
