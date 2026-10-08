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
 * Seluruh query dijalankan secara paralel via Promise.all untuk performa maksimal.
 */
export async function getSysmgmtDashboardStats(): Promise<SysmgmtDashboardStats> {
  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  try {
    const [
      // 1. User & Sesi
      totalUsers,
      activeUsers,
      activeSessions,
      superAdminCount,
      adminItCount,

      // 2. Aset
      totalAssets,
      assignedAssets,
      inStockAssets,
      maintenanceAssets,
      itAssets,
      nonItAssets,

      // 3. Lisensi
      totalLicenses,
      seatsAgg,
      expiringSoonCount,

      // 4. Dokumen
      totalDocuments,
      activeDocuments,
      draftDocuments,
      archivedDocuments,

      // 5. Audit Log Terbaru
      rawRecentAudits,

      // 6. Tata Kelola Modul
      moduleGovernance,
    ] = await Promise.all([
      // User & Sesi
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.session.count({ where: { expiresAt: { gt: now } } }),
      prisma.userRole.count({
        where: { role: { key: "super_admin" }, user: { isActive: true } },
      }),
      prisma.userRole.count({
        where: { role: { key: "admin_it" }, user: { isActive: true } },
      }),

      // Aset
      prisma.asset.count(),
      prisma.asset.count({ where: { status: "ASSIGNED" } }),
      prisma.asset.count({ where: { status: "IN_STOCK" } }),
      prisma.asset.count({ where: { status: "MAINTENANCE" } }),
      prisma.asset.count({ where: { category: "IT" } }),
      prisma.asset.count({ where: { category: "NON_IT" } }),

      // Lisensi Software
      prisma.softwareLicense.count(),
      prisma.softwareLicense.aggregate({
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

      // Dokumen & SOP
      prisma.document.count(),
      prisma.document.count({ where: { status: "ACTIVE" } }),
      prisma.document.count({ where: { status: "DRAFT" } }),
      prisma.document.count({ where: { status: "ARCHIVED" } }),

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

    // Kalkulasi rasio kursi lisensi terpakai
    const totalSeats = seatsAgg._sum?.seatsTotal ?? 0;
    const usedSeats = seatsAgg._sum?.seatsUsed ?? 0;
    const utilizationPercent =
      totalSeats > 0 ? Math.round((usedSeats / totalSeats) * 100) : 0;

    const inactiveUsers = Math.max(0, totalUsers - activeUsers);

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
