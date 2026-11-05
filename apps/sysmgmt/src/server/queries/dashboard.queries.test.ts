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
        groupBy: vi.fn(),
      },
      session: {
        count: vi.fn(),
      },
      userRole: {
        count: vi.fn(),
        findMany: vi.fn(),
      },
      asset: {
        count: vi.fn(),
        groupBy: vi.fn(),
      },
      softwareLicense: {
        count: vi.fn(),
        aggregate: vi.fn(),
      },
      document: {
        count: vi.fn(),
        groupBy: vi.fn(),
      },
      credential: {
        count: vi.fn(),
        findMany: vi.fn(),
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

    // Mock User groupBy: total 15, active 12, inactive 3
    vi.mocked(db.prisma.user.groupBy).mockResolvedValueOnce([
      { isActive: true, _count: { id: 12 } },
      { isActive: false, _count: { id: 3 } },
    ] as never);

    // Mock Sessions: 8 active sessions
    vi.mocked(db.prisma.session.count).mockResolvedValueOnce(8);

    // Mock UserRoles: 2 super admin, 3 admin it
    vi.mocked(db.prisma.userRole.findMany).mockResolvedValueOnce([
      { role: { key: "super_admin" } },
      { role: { key: "super_admin" } },
      { role: { key: "admin_it" } },
      { role: { key: "admin_it" } },
      { role: { key: "admin_it" } },
    ] as never);

    // Mock Assets: total 50, assigned 35, in_stock 10, maintenance 5, IT 40, non-IT 10
    vi.mocked(db.prisma.asset.groupBy)
      .mockResolvedValueOnce([
        { status: "ASSIGNED", _count: { id: 35 } },
        { status: "IN_STOCK", _count: { id: 10 } },
        { status: "MAINTENANCE", _count: { id: 5 } },
      ] as never)
      .mockResolvedValueOnce([
        { category: "IT", _count: { id: 40 } },
        { category: "NON_IT", _count: { id: 10 } },
      ] as never);

    // Mock Licenses: total 10, seats total 100, used 75 (75%), expiring 2
    vi.mocked(db.prisma.softwareLicense.aggregate).mockResolvedValueOnce({
      _count: { id: 10 },
      _sum: {
        seatsTotal: 100,
        seatsUsed: 75,
      },
      _avg: {},
      _max: {},
      _min: {},
    });

    vi.mocked(db.prisma.softwareLicense.count).mockResolvedValueOnce(2); // expiringSoon

    // Mock Documents: total 20, active 15, draft 3, archived 2
    vi.mocked(db.prisma.document.groupBy).mockResolvedValueOnce([
      { status: "ACTIVE", _count: { id: 15 } },
      { status: "DRAFT", _count: { id: 3 } },
      { status: "ARCHIVED", _count: { id: 2 } },
    ] as never);

    // Mock Credentials: total 25, active 20, needs rotation 5, 2FA protected 16 (80%)
    vi.mocked(db.prisma.credential.count).mockResolvedValueOnce(25); // total

    const credItems = [];
    for (let i = 0; i < 20; i++) {
      credItems.push({
        lastRotatedAt: i < 5 ? null : new Date("2026-10-01"), // 5 need rotation
        twoFactorType: i < 16 ? "AUTHENTICATOR_APP" : "NONE", // 16 protected
      });
    }
    vi.mocked(db.prisma.credential.findMany).mockResolvedValueOnce(credItems as never);

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

    // Verifikasi Credential Stats
    expect(stats.credentialStats.totalCredentials).toBe(25);
    expect(stats.credentialStats.activeCount).toBe(20);
    expect(stats.credentialStats.needsRotationCount).toBe(5);
    expect(stats.credentialStats.twoFactorProtectedCount).toBe(16);
    expect(stats.credentialStats.twoFactorAdoptionRate).toBe(80);

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

    // All aggregations return empty/0
    vi.mocked(db.prisma.user.groupBy).mockResolvedValue([]);
    vi.mocked(db.prisma.session.count).mockResolvedValue(0);
    vi.mocked(db.prisma.userRole.findMany).mockResolvedValue([]);
    vi.mocked(db.prisma.asset.groupBy).mockResolvedValue([]);
    vi.mocked(db.prisma.softwareLicense.count).mockResolvedValue(0);
    vi.mocked(db.prisma.softwareLicense.aggregate).mockResolvedValue({
      _sum: {
        seatsTotal: null,
        seatsUsed: null,
      },
      _avg: {},
      _count: { id: 0 },
      _max: {},
      _min: {},
    });
    vi.mocked(db.prisma.document.groupBy).mockResolvedValue([]);
    vi.mocked(db.prisma.credential.count).mockResolvedValue(0);
    vi.mocked(db.prisma.credential.findMany).mockResolvedValue([]);
    vi.mocked(db.prisma.auditLog.findMany).mockResolvedValue([]);

    const stats = await getSysmgmtDashboardStats();

    expect(stats.userStats.totalUsers).toBe(0);
    expect(stats.userStats.activeUsers).toBe(0);
    expect(stats.userStats.inactiveUsers).toBe(0);
    expect(stats.assetStats.totalAssets).toBe(0);
    expect(stats.licenseStats.totalSeats).toBe(0);
    expect(stats.licenseStats.usedSeats).toBe(0);
    expect(stats.licenseStats.utilizationPercent).toBe(0); // Harus 0, BUKAN NaN
    expect(stats.credentialStats.totalCredentials).toBe(0);
    expect(stats.credentialStats.twoFactorAdoptionRate).toBe(0);
    expect(stats.recentAudits).toHaveLength(0);
    expect(stats.systemHealth.isDatabaseConnected).toBe(true);
  });

  it("harus mengembalikan fallback aman jika terjadi kegagalan koneksi database", async () => {
    const db = await import("@pspk/db");

    // Simulasikan database melempar error
    vi.mocked(db.prisma.user.groupBy).mockRejectedValueOnce(
      new Error("Koneksi database PostgreSQL terputus"),
    );

    const stats = await getSysmgmtDashboardStats();

    expect(stats.systemHealth.isDatabaseConnected).toBe(false);
    expect(stats.userStats.totalUsers).toBe(0);
    expect(stats.assetStats.totalAssets).toBe(0);
    expect(stats.recentAudits).toEqual([]);
  });
});
