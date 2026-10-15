import { describe, it, expect, vi, beforeEach } from "vitest";
import { getModuleGovernanceData } from "./module.queries";

vi.mock("@pspk/db", async () => {
  const actual = await vi.importActual<typeof import("@pspk/db")>("@pspk/db");
  return {
    ...actual,
    prisma: {
      systemSetting: {
        findMany: vi.fn(),
      },
    },
  };
});

describe("module.queries.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("harus menyusun data tata kelola modul dengan fallback default saat database kosong", async () => {
    const dbModule = await import("@pspk/db");
    vi.mocked(dbModule.prisma.systemSetting.findMany).mockResolvedValueOnce([]);

    const data = await getModuleGovernanceData();

    expect(data.modules.length).toBe(6);
    expect(data.stats.total).toBe(6);
    // Secara default: seluruh 6 modul aktif (org_chart, org_struct, performance, timesheet, asset_management, asset_assignment)
    expect(data.stats.activeCount).toBe(6);
    expect(data.stats.inactiveCount).toBe(0);

    const orgChart = data.modules.find((m) => m.moduleKey === "org_chart");
    expect(orgChart?.isEnabled).toBe(true);
    expect(orgChart?.updatedAt).toBeNull();

    const assetMgmt = data.modules.find((m) => m.moduleKey === "asset_management");
    expect(assetMgmt?.isEnabled).toBe(true);

    const assetAss = data.modules.find((m) => m.moduleKey === "asset_assignment");
    expect(assetAss?.isEnabled).toBe(true);
  });

  it("harus menimpa status modul sesuai record di database", async () => {
    const dbModule = await import("@pspk/db");
    const now = new Date();
    vi.mocked(dbModule.prisma.systemSetting.findMany).mockResolvedValueOnce([
      {
        id: "s-1",
        key: "module.org_chart.enabled",
        value: "false",
        category: "MODULE",
        description: "Bagan",
        updatedBy: "admin@pspk.id",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "s-2",
        key: "module.performance.enabled",
        value: "false",
        category: "MODULE",
        description: "Kinerja",
        updatedBy: "superadmin@pspk.id",
        createdAt: now,
        updatedAt: now,
      },
    ]);

    const data = await getModuleGovernanceData();

    const orgChart = data.modules.find((m) => m.moduleKey === "org_chart");
    expect(orgChart?.isEnabled).toBe(false);
    expect(orgChart?.updatedBy).toBe("admin@pspk.id");

    const performance = data.modules.find((m) => m.moduleKey === "performance");
    expect(performance?.isEnabled).toBe(false);
    expect(performance?.updatedBy).toBe("superadmin@pspk.id");
  });
});
