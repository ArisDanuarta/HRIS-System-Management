import { describe, it, expect, vi, beforeEach } from "vitest";
import { getSysmgmtDashboardStats } from "./dashboard.queries";

vi.mock("./module.queries", () => ({
  getModuleGovernanceData: vi.fn().mockResolvedValue({
    modules: [],
    stats: {
      total: 6,
      activeCount: 4,
      inactiveCount: 2,
    },
  }),
}));

vi.mock("@pspk/db", async () => {
  const actual = await vi.importActual<typeof import("@pspk/db")>("@pspk/db");
  return {
    ...actual,
    prisma: {
      user: {
        count: vi.fn(),
      },
      session: {
        count: vi.fn(),
      },
      userRole: {
        count: vi.fn(),
      },
      asset: {
        count: vi.fn(),
      },
      softwareLicense: {
        count: vi.fn(),
        aggregate: vi.fn(),
      },
      document: {
        count: vi.fn(),
      },
      auditLog: {
        findMany: vi.fn(),
      },
    },
  };
});

describe("dashboard.queries.ts - getSysmgmtDashboardStats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("harus menghitung statistik agregat dengan benar saat database terisi", async () => {
    const db = await import("@pspk/db");
    const now = new Date("2026-10-08T12:00:00Z");

    // Mock User counts: total 15, active 12
    vi.mocked(db.prisma.user.count)
      .mockResolvedValueOnce(15) // totalUsers
      .mockResolvedValueOnce(12); // activeUsers

    // Mock Sessions: 8 active sessions
    vi.mocked(db.prisma.session.count).mockResolvedValueOnce(8);

    // Mock UserRoles: 2 super admin, 3 admin it
    vi.mocked(db.prisma.userRole.count)
      .mockResolvedValueOnce(2) // super_admin
      .mockResolvedValueOnce(3); // admin_it

    // Mock Assets: total 50, assigned 35, in_stock 10, maintenance 5, IT 40, non-IT 10
    vi.mocked(db.prisma.asset.count)
      .mockResolvedValueOnce(50) // totalAssets
      .mockResolvedValueOnce(35) // assigned
      .mockResolvedValueOnce(10) // in_stock
      .mockResolvedValueOnce(5) // maintenance
      .mockResolvedValueOnce(40) // it
      .mockResolvedValueOnce(10); // non-it

    // Mock Licenses: total 10, seats total 100, used 75 (75%), expiring 2
    vi.mocked(db.prisma.softwareLicense.count)
      .mockResolvedValueOnce(10) // totalLicenses
      .mockResolvedValueOnce(2); // expiringSoon

    vi.mocked(db.prisma.softwareLicense.aggregate).mockResolvedValueOnce({
      _sum: {
        seatsTotal: 100,
        seatsUsed: 75,
      },
      _avg: {},
      _count: {},
      _max: {},
      _min: {},
    });

    // Mock Documents: total 20, active 15, draft 3, archived 2
    vi.mocked(db.prisma.document.count)
      .mockResolvedValueOnce(20) // total
      .mockResolvedValueOnce(15) // active
      .mockResolvedValueOnce(3) // draft
      .mockResolvedValueOnce(2); // archived

    // Mock Audit Log
    vi.mocked(db.prisma.auditLog.findMany).mockResolvedValueOnce([
      {
        id: "audit-1",
        occurredAt: now,
        actorUserId: "user-1",
        actorEmail: "superadmin@pspk.id",
        app: "sysmgmt",
        action: "UPDATE",
        entityType: "UserRole",
        entityId: "user-2",
        before: null,
        after: null,
        ip: "127.0.0.1",
        userAgent: "Mozilla/5.0",
        requestId: "req-123",
      },
    ]);

    const stats = await getSysmgmtDashboardStats();

    // Verifikasi User Stats
    expect(stats.userStats.totalUsers).toBe(15);
    expect(stats.userStats.activeUsers).toBe(12);
    expect(stats.userStats.inactiveUsers).toBe(3);
    expect(stats.userStats.activeSessions).toBe(8);
    expect(stats.userStats.superAdminCount).toBe(2);
    expect(stats.userStats.adminItCount).toBe(3);

    // Verifikasi Asset Stats
    expect(stats.assetStats.totalAssets).toBe(50);
    expect(stats.assetStats.assignedAssets).toBe(35);
    expect(stats.assetStats.inStockAssets).toBe(10);
    expect(stats.assetStats.maintenanceAssets).toBe(5);
    expect(stats.assetStats.itAssets).toBe(40);
    expect(stats.assetStats.nonItAssets).toBe(10);

    // Verifikasi License Stats
    expect(stats.licenseStats.totalLicenses).toBe(10);
    expect(stats.licenseStats.totalSeats).toBe(100);
    expect(stats.licenseStats.usedSeats).toBe(75);
    expect(stats.licenseStats.utilizationPercent).toBe(75);
    expect(stats.licenseStats.expiringSoonCount).toBe(2);

    // Verifikasi Document Stats
    expect(stats.documentStats.totalDocuments).toBe(20);
    expect(stats.documentStats.activeDocuments).toBe(15);
    expect(stats.documentStats.draftDocuments).toBe(3);
    expect(stats.documentStats.archivedDocuments).toBe(2);

    // Verifikasi Recent Audits
    expect(stats.recentAudits).toHaveLength(1);
    expect(stats.recentAudits[0]?.actorEmail).toBe("superadmin@pspk.id");
    expect(stats.recentAudits[0]?.occurredAt).toBe(now.toISOString());

    // Verifikasi System Health
    expect(stats.systemHealth.isDatabaseConnected).toBe(true);
    expect(stats.systemHealth.activeModulesCount).toBe(4);
    expect(stats.systemHealth.totalModulesCount).toBe(6);
  });

  it("harus menangani kondisi clean slate (data nol) tanpa menghasilkan pembagian dengan nol (NaN)", async () => {
    const db = await import("@pspk/db");

    // All counts return 0
    vi.mocked(db.prisma.user.count).mockResolvedValue(0);
    vi.mocked(db.prisma.session.count).mockResolvedValue(0);
    vi.mocked(db.prisma.userRole.count).mockResolvedValue(0);
    vi.mocked(db.prisma.asset.count).mockResolvedValue(0);
    vi.mocked(db.prisma.softwareLicense.count).mockResolvedValue(0);
    vi.mocked(db.prisma.softwareLicense.aggregate).mockResolvedValue({
      _sum: {
        seatsTotal: null,
        seatsUsed: null,
      },
      _avg: {},
      _count: {},
      _max: {},
      _min: {},
    });
    vi.mocked(db.prisma.document.count).mockResolvedValue(0);
    vi.mocked(db.prisma.auditLog.findMany).mockResolvedValue([]);

    const stats = await getSysmgmtDashboardStats();

    expect(stats.userStats.totalUsers).toBe(0);
    expect(stats.userStats.activeUsers).toBe(0);
    expect(stats.userStats.inactiveUsers).toBe(0);
    expect(stats.assetStats.totalAssets).toBe(0);
    expect(stats.licenseStats.totalSeats).toBe(0);
    expect(stats.licenseStats.usedSeats).toBe(0);
    expect(stats.licenseStats.utilizationPercent).toBe(0); // Harus 0, BUKAN NaN
    expect(stats.recentAudits).toHaveLength(0);
    expect(stats.systemHealth.isDatabaseConnected).toBe(true);
  });

  it("harus mengembalikan fallback aman jika terjadi kegagalan koneksi database", async () => {
    const db = await import("@pspk/db");

    // Simulasikan database melempar error
    vi.mocked(db.prisma.user.count).mockRejectedValueOnce(
      new Error("Koneksi database PostgreSQL terputus"),
    );

    const stats = await getSysmgmtDashboardStats();

    expect(stats.systemHealth.isDatabaseConnected).toBe(false);
    expect(stats.userStats.totalUsers).toBe(0);
    expect(stats.assetStats.totalAssets).toBe(0);
    expect(stats.recentAudits).toEqual([]);
  });
});
