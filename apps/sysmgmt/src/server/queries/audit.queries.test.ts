import { describe, it, expect, vi, beforeEach } from "vitest";
import { getAuditLogs, getAuditStats, getAuditFilterOptions } from "./audit.queries";
import { isSensitiveKey, maskSensitiveData } from "../../lib/audit-masking";
import { prisma } from "@pspk/db";

// Mocking prisma client
vi.mock("@pspk/db", () => ({
  prisma: {
    auditLog: {
      findMany: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
  },
}));

describe("audit-masking.ts - Masking Data Sensitif", () => {
  it("harus mendeteksi kunci sensitif dengan benar", () => {
    expect(isSensitiveKey("password")).toBe(true);
    expect(isSensitiveKey("user_token")).toBe(true);
    expect(isSensitiveKey("apiKey")).toBe(true);
    expect(isSensitiveKey("nik")).toBe(true);
    expect(isSensitiveKey("nomor_rekening")).toBe(true);
    expect(isSensitiveKey("gajiPokok")).toBe(true);
    expect(isSensitiveKey("title")).toBe(false);
    expect(isSensitiveKey("name")).toBe(false);
  });

  it("harus menyamarkan nilai sensitif dalam payload bersarang", () => {
    const rawPayload = {
      username: "aris",
      password: "SuperSecretPassword123!",
      employee: {
        nik: "1234567890123456",
        name: "Aris Danuarta",
        bankAccount: "987654321",
        salary: 15000000,
      },
      metadata: {
        ip: "192.168.1.1",
        auth_secret: "jwt-secret-xyz",
      },
    };

    const masked = maskSensitiveData(rawPayload) as typeof rawPayload;

    expect(masked.username).toBe("aris");
    expect(masked.password).toBe("[disembunyikan]");
    expect(masked.employee.name).toBe("Aris Danuarta");
    expect(masked.employee.nik).toBe("[disembunyikan]");
    expect(masked.employee.bankAccount).toBe("[disembunyikan]");
    expect(masked.employee.salary).toBe("[disembunyikan]");
    expect(masked.metadata.ip).toBe("192.168.1.1");
    expect((masked.metadata as Record<string, unknown>).auth_secret).toBe("[disembunyikan]");
  });
});

describe("audit.queries.ts - getAuditLogs & Stats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("harus mengambil daftar audit log dengan paginasi dan melakukan masking", async () => {
    const mockLogs = [
      {
        id: "log-1",
        occurredAt: new Date("2026-10-12T08:00:00Z"),
        actorUserId: "user-1",
        actorEmail: "admin@pspk.id",
        app: "sysmgmt",
        action: "UPDATE",
        entityType: "User",
        entityId: "target-user-1",
        before: { name: "Lama", password: "oldPassword" },
        after: { name: "Baru", password: "newPassword" },
        ip: "127.0.0.1",
        userAgent: "Mozilla/5.0",
        requestId: "req-1",
      },
    ];

    vi.mocked(prisma.auditLog.count).mockResolvedValue(1);
    vi.mocked(prisma.auditLog.findMany).mockResolvedValue(mockLogs as never);

    const result = await getAuditLogs({ page: 1, pageSize: 10 });

    expect(result.totalCount).toBe(1);
    expect(result.currentPage).toBe(1);
    expect(result.logs.length).toBe(1);
    expect(result.logs[0]?.actorEmail).toBe("admin@pspk.id");
    expect((result.logs[0]?.after as Record<string, unknown>).password).toBe("[disembunyikan]");
  });

  it("harus menyusun query filter tanggal dan keyword pencarian", async () => {
    vi.mocked(prisma.auditLog.count).mockResolvedValue(0);
    vi.mocked(prisma.auditLog.findMany).mockResolvedValue([]);

    await getAuditLogs({
      q: "superadmin",
      app: "sysmgmt",
      action: "DELETE",
      startDate: "2026-10-01",
      endDate: "2026-10-12",
    });

    expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          app: "sysmgmt",
          action: "DELETE",
          OR: expect.any(Array),
          occurredAt: expect.objectContaining({
            gte: expect.any(Date),
            lte: expect.any(Date),
          }),
        }),
      }),
    );
  });

  it("harus mengembalikan statistik audit log lengkap", async () => {
    vi.mocked(prisma.auditLog.count)
      .mockResolvedValueOnce(50) // totalLogs
      .mockResolvedValueOnce(12); // last24hCount

    vi.mocked(prisma.auditLog.groupBy)
      .mockResolvedValueOnce([
        { actorEmail: "a@pspk.id", _count: { actorEmail: 5 } },
        { actorEmail: "b@pspk.id", _count: { actorEmail: 3 } },
      ] as never)
      .mockResolvedValueOnce([
        { action: "UPDATE", _count: { action: 25 } },
        { action: "CREATE", _count: { action: 15 } },
      ] as never);

    const stats = await getAuditStats();

    expect(stats.totalLogs).toBe(50);
    expect(stats.last24hCount).toBe(12);
    expect(stats.uniqueActorsCount).toBe(2);
    expect(stats.actionBreakdown.length).toBe(2);
  });

  it("harus mengembalikan opsi filter dinamis", async () => {
    vi.mocked(prisma.auditLog.groupBy)
      .mockResolvedValueOnce([{ app: "sysmgmt" }, { app: "hris" }] as never)
      .mockResolvedValueOnce([{ action: "CREATE" }, { action: "LOGIN" }] as never)
      .mockResolvedValueOnce([{ entityType: "Document" }, { entityType: "Asset" }] as never);

    const options = await getAuditFilterOptions();

    expect(options.apps).toContain("sysmgmt");
    expect(options.actions).toContain("CREATE");
    expect(options.entityTypes).toContain("Document");
  });
});
