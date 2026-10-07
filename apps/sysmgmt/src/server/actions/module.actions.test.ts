import { describe, it, expect, vi, beforeEach } from "vitest";
import { toggleModuleAction, resetAllModulesToDefaultAction } from "./module.actions";

// Mock dependencies
vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers({ "user-agent": "Vitest-Agent" })),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const mockSession = {
  user: {
    id: "user-superadmin-1",
    email: "superadmin@pspk.id",
    name: "Super Administrator PSPK",
  },
};

const mockAuthCtx = {
  userId: "user-superadmin-1",
  employeeId: null,
  roles: ["super_admin"],
  permissions: new Set(["sysmgmt.role.manage:all"]),
};

vi.mock("@pspk/auth", () => ({
  getSession: vi.fn().mockImplementation(() => Promise.resolve(mockSession)),
  getAuthContext: vi.fn().mockImplementation(() => Promise.resolve(mockAuthCtx)),
}));

const mockTx = {
  systemSetting: {
    upsert: vi.fn().mockResolvedValue({}),
  },
};

vi.mock("@pspk/db", async () => {
  const actual = await vi.importActual<typeof import("@pspk/db")>("@pspk/db");
  return {
    ...actual,
    prisma: {
      systemSetting: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
      },
      $transaction: vi.fn(async (callback) => callback(mockTx)),
    },
    writeAudit: vi.fn().mockResolvedValue({}),
  };
});

describe("module.actions.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("harus menolak eksekusi jika pengguna tidak memiliki wewenang", async () => {
    const authModule = await import("@pspk/auth");
    vi.mocked(authModule.getAuthContext).mockResolvedValueOnce({
      userId: "user-staff-1",
      employeeId: null,
      roles: ["staff"],
      permissions: new Set(["hris.employee.read:own"]),
    });

    const res = await toggleModuleAction({
      moduleKey: "org_chart",
      enabled: false,
    });

    expect(res.ok).toBe(false);
    expect(res.error).toContain("Anda tidak memiliki izin");
  });

  it("harus menolak kunci modul yang tidak terdaftar dalam sistem", async () => {
    const res = await toggleModuleAction({
      moduleKey: "invalid_nonexistent_module",
      enabled: true,
    });

    expect(res.ok).toBe(false);
    expect(res.error).toContain("tidak terdaftar");
  });

  it("harus berhasil menonaktifkan modul yang sah dan memanggil transaksi serta audit log", async () => {
    const dbModule = await import("@pspk/db");
    vi.mocked(dbModule.prisma.systemSetting.findUnique).mockResolvedValueOnce({
      id: "set-1",
      key: "module.org_chart.enabled",
      value: "true",
      category: "MODULE",
      description: "Bagan Organisasi",
      updatedBy: "admin@pspk.id",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await toggleModuleAction({
      moduleKey: "org_chart",
      enabled: false,
    });

    expect(res.ok).toBe(true);
    expect(res.message).toContain("dinonaktifkan");
    expect(dbModule.prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(mockTx.systemSetting.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { key: "module.org_chart.enabled" },
        update: expect.objectContaining({ value: "false" }),
      }),
    );
    expect(dbModule.writeAudit).toHaveBeenCalledTimes(1);
  });

  it("harus mengembalikan sukses tanpa transaksi berulang jika status sudah sama", async () => {
    const dbModule = await import("@pspk/db");
    vi.mocked(dbModule.prisma.systemSetting.findUnique).mockResolvedValueOnce({
      id: "set-1",
      key: "module.org_chart.enabled",
      value: "false",
      category: "MODULE",
      description: "Bagan Organisasi",
      updatedBy: "admin@pspk.id",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await toggleModuleAction({
      moduleKey: "org_chart",
      enabled: false,
    });

    expect(res.ok).toBe(true);
    expect(res.message).toContain("sudah berstatus nonaktif");
    expect(dbModule.prisma.$transaction).not.toHaveBeenCalled();
  });

  it("harus berhasil mereset seluruh modul ke konfigurasi default", async () => {
    const dbModule = await import("@pspk/db");
    const res = await resetAllModulesToDefaultAction();

    expect(res.ok).toBe(true);
    expect(res.message).toContain("berhasil dikembalikan ke pengaturan default");
    expect(dbModule.prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(dbModule.writeAudit).toHaveBeenCalledTimes(1);
  });
});
