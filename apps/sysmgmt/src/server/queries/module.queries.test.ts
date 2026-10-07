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
    // Secara default: 4 modul aktif (org_chart, org_struct, performance, timesheet), 2 nonaktif (recruitment, training)
    expect(data.stats.activeCount).toBe(4);
    expect(data.stats.inactiveCount).toBe(2);

    const orgChart = data.modules.find((m) => m.moduleKey === "org_chart");
    expect(orgChart?.isEnabled).toBe(true);
    expect(orgChart?.updatedAt).toBeNull();
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
        key: "module.recruitment.enabled",
        value: "true",
        category: "MODULE",
        description: "Rekrutmen",
        updatedBy: "superadmin@pspk.id",
        createdAt: now,
        updatedAt: now,
      },
    ]);

    const data = await getModuleGovernanceData();

    const orgChart = data.modules.find((m) => m.moduleKey === "org_chart");
    expect(orgChart?.isEnabled).toBe(false);
    expect(orgChart?.updatedBy).toBe("admin@pspk.id");

    const recruitment = data.modules.find((m) => m.moduleKey === "recruitment");
    expect(recruitment?.isEnabled).toBe(true);
    expect(recruitment?.updatedBy).toBe("superadmin@pspk.id");
  });
});
