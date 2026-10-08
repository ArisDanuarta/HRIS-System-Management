import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createAssetAction,
  updateAssetAction,
  deleteAssetAction,
  checkoutAssetAction,
  checkinAssetAction,
  importAssetsBatchAction,
} from "./asset.actions";

// Mock next/headers & next/cache
vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers({ "user-agent": "Vitest-Agent" })),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const mockSession = {
  user: {
    id: "user-admin-1",
    email: "itadmin@pspk.id",
    name: "Admin IT PSPK",
  },
};

const mockAuthCtx = {
  userId: "user-admin-1",
  employeeId: null,
  roles: ["admin_it"],
  permissions: new Set(["sysmgmt.asset.write:all", "sysmgmt.asset.read:all"]),
};

vi.mock("@pspk/auth", () => ({
  getSession: vi.fn().mockImplementation(() => Promise.resolve(mockSession)),
  getAuthContext: vi.fn().mockImplementation(() => Promise.resolve(mockAuthCtx)),
}));

const mockTx = {
  assetAssignment: {
    create: vi.fn(),
    update: vi.fn(),
  },
  asset: {
    create: vi.fn(),
    update: vi.fn(),
  },
};

vi.mock("@pspk/db", async () => {
  const actual = await vi.importActual<typeof import("@pspk/db")>("@pspk/db");
  return {
    ...actual,
    prisma: {
      asset: {
        findUnique: vi.fn(),
        findMany: vi.fn().mockResolvedValue([]),
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      employee: {
        findUnique: vi.fn(),
      },
      assetAssignment: {
        findUnique: vi.fn(),
      },
      systemSetting: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      $transaction: vi.fn(async (callback) => callback(mockTx)),
    },
    writeAudit: vi.fn().mockResolvedValue({}),
    getModuleFlags: vi.fn().mockResolvedValue({
      asset_assignment: true,
      "module.asset_assignment.enabled": true,
    }),
    isModuleActive: vi.fn((flags, key) => flags[key] !== false),
  };
});

describe("asset.actions.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createAssetAction", () => {
    it("harus menolak pembuatan aset jika assetTag sudah digunakan", async () => {
      const db = await import("@pspk/db");

      vi.mocked(db.prisma.asset.findUnique).mockResolvedValueOnce({
        id: "existing-asset",
        assetTag: "PSPK-IT-2026-0001",
      } as never);

      const result = await createAssetAction({
        category: "IT",
        type: "Laptop",
        name: "MacBook Pro",
        assetTag: "PSPK-IT-2026-0001",
      });

      expect(result.ok).toBe(false);
      expect(result.error).toContain("sudah digunakan");
    });

    it("harus berhasil membuat aset baru dan mencatat audit log", async () => {
      const db = await import("@pspk/db");

      vi.mocked(db.prisma.asset.findUnique).mockResolvedValueOnce(null);
      vi.mocked(db.prisma.asset.create).mockResolvedValueOnce({
        id: "new-asset-id",
        assetTag: "PSPK-IT-2026-0002",
        name: "Dell UltraSharp 27",
        category: "IT",
        type: "Monitor",
        status: "IN_STOCK",
      } as never);

      const result = await createAssetAction({
        category: "IT",
        type: "Monitor",
        name: "Dell UltraSharp 27",
        assetTag: "PSPK-IT-2026-0002",
        purchasePrice: 5500000,
      });

      expect(result.ok).toBe(true);
      expect(result.data?.id).toBe("new-asset-id");
      expect(db.writeAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "CREATE",
          entityType: "Asset",
          entityId: "new-asset-id",
        }),
      );
    });
  });

  describe("updateAssetAction", () => {
    it("harus berhasil memperbarui data aset dan mencatat audit log", async () => {
      const db = await import("@pspk/db");

      vi.mocked(db.prisma.asset.findUnique).mockResolvedValueOnce({
        id: "asset-update-1",
        assetTag: "PSPK-IT-2026-0001",
        name: "Laptop Lama",
        category: "IT",
        type: "Laptop",
        status: "IN_STOCK",
      } as never);

      vi.mocked(db.prisma.asset.update).mockResolvedValueOnce({
        id: "asset-update-1",
        assetTag: "PSPK-IT-2026-0001",
        name: "Laptop Baru",
        category: "IT",
        type: "Laptop",
        status: "IN_STOCK",
      } as never);

      const result = await updateAssetAction({
        id: "asset-update-1",
        category: "IT",
        type: "Laptop",
        name: "Laptop Baru",
        assetTag: "PSPK-IT-2026-0001",
      });

      expect(result.ok).toBe(true);
      expect(result.data?.id).toBe("asset-update-1");
      expect(db.writeAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "UPDATE",
          entityType: "Asset",
          entityId: "asset-update-1",
        }),
      );
    });
  });

  describe("deleteAssetAction", () => {
    it("harus menolak penghapusan jika aset sedang dipinjamkan", async () => {
      const db = await import("@pspk/db");

      vi.mocked(db.prisma.asset.findUnique).mockResolvedValueOnce({
        id: "assigned-asset-id",
        name: "ThinkPad X1",
        assetTag: "PSPK-IT-2026-0005",
        assignments: [{ id: "active-ass-1", returnedAt: null }],
      } as never);

      const result = await deleteAssetAction({ id: "assigned-asset-id" });

      expect(result.ok).toBe(false);
      expect(result.error).toContain("sedang dipinjamkan kepada karyawan");
    });

    it("harus berhasil menghapus aset jika tidak sedang dipinjamkan", async () => {
      const db = await import("@pspk/db");

      vi.mocked(db.prisma.asset.findUnique).mockResolvedValueOnce({
        id: "idle-asset-id",
        name: "Kursi Ergonomis",
        assetTag: "PSPK-NONIT-2026-0001",
        assignments: [],
      } as never);

      vi.mocked(db.prisma.asset.delete).mockResolvedValueOnce({} as never);

      const result = await deleteAssetAction({ id: "idle-asset-id" });

      expect(result.ok).toBe(true);
      expect(db.prisma.asset.delete).toHaveBeenCalledWith({
        where: { id: "idle-asset-id" },
      });
      expect(db.writeAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "DELETE",
          entityType: "Asset",
        }),
      );
    });
  });

  describe("checkoutAssetAction & checkinAssetAction (Feature Flag Modular)", () => {
    it("harus menolak checkout jika sub-modul serah terima sedang di-OFF-kan", async () => {
      const db = await import("@pspk/db");

      vi.mocked(db.isModuleActive).mockReturnValueOnce(false);

      const result = await checkoutAssetAction({
        assetId: "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
        employeeId: "e1f2a3b4-c5d6-7e8f-9a0b-1c2d3e4f5a6b",
      });

      expect(result.ok).toBe(false);
      expect(result.error).toContain("sedang dinonaktifkan di Tata Kelola Modul");
    });

    it("harus berhasil checkout aset saat sub-modul aktif", async () => {
      const db = await import("@pspk/db");

      vi.mocked(db.isModuleActive).mockReturnValueOnce(true);
      vi.mocked(db.prisma.asset.findUnique).mockResolvedValueOnce({
        id: "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
        name: "MacBook Pro M3",
        assetTag: "PSPK-IT-2026-0001",
        status: "IN_STOCK",
        assignments: [],
      } as never);

      vi.mocked(db.prisma.employee.findUnique).mockResolvedValueOnce({
        id: "e1f2a3b4-c5d6-7e8f-9a0b-1c2d3e4f5a6b",
        fullName: "Budi Santoso",
        status: "ACTIVE",
      } as never);

      mockTx.assetAssignment.create.mockResolvedValueOnce({
        id: "ass-created-id",
      });

      const result = await checkoutAssetAction({
        assetId: "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
        employeeId: "e1f2a3b4-c5d6-7e8f-9a0b-1c2d3e4f5a6b",
        conditionOut: "Bagus, lengkap charger",
      });

      expect(result.ok).toBe(true);
      expect(mockTx.assetAssignment.create).toHaveBeenCalled();
      expect(mockTx.asset.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: "ASSIGNED" },
        }),
      );
    });

    it("harus berhasil checkin aset kembali ke gudang saat sub-modul aktif", async () => {
      const db = await import("@pspk/db");

      vi.mocked(db.isModuleActive).mockReturnValueOnce(true);
      vi.mocked(db.prisma.assetAssignment.findUnique).mockResolvedValueOnce({
        id: "ass-1234-5678",
        assetId: "asset-123",
        returnedAt: null,
        asset: { id: "asset-123", name: "Lenovo ThinkPad", status: "ASSIGNED" },
        employee: { fullName: "Siti Rahma" },
      } as never);

      const result = await checkinAssetAction({
        assignmentId: "33333333-3333-3333-3333-333333333333",
        assetId: "44444444-4444-4444-4444-444444444444",
        nextStatus: "IN_STOCK",
        conditionIn: "Mulus tanpa goresan",
      });

      expect(result.ok).toBe(true);
      expect(mockTx.assetAssignment.update).toHaveBeenCalled();
      expect(mockTx.asset.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: "IN_STOCK" },
        }),
      );
    });
  });

  describe("importAssetsBatchAction", () => {
    it("harus menolak jika baris data kosong", async () => {
      const result = await importAssetsBatchAction({
        rows: [],
      });

      expect(result.ok).toBe(false);
    });

    it("harus mendeteksi tag duplikat di database dan menandainya di failedRows", async () => {
      const db = await import("@pspk/db");

      vi.mocked(db.prisma.asset.findMany).mockResolvedValueOnce([
        { assetTag: "PSPK-IT-2026-0001" },
      ] as never);

      const result = await importAssetsBatchAction({
        rows: [
          {
            assetTag: "PSPK-IT-2026-0001",
            name: "MacBook Air M2",
            category: "IT",
            type: "Laptop",
            location: "Gudang IT",
          },
        ],
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.importedCount).toBe(0);
        expect(result.failedRows).toHaveLength(1);
        expect(result.failedRows[0]?.reason).toContain("sudah terdaftar di database");
      }
    });

    it("harus mendeteksi tag duplikat di dalam batch yang sama", async () => {
      const db = await import("@pspk/db");

      vi.mocked(db.prisma.asset.findMany).mockResolvedValueOnce([] as never);

      const result = await importAssetsBatchAction({
        rows: [
          {
            assetTag: "PSPK-IT-2026-9999",
            name: "Monitor Dell A",
            category: "IT",
            type: "Monitor",
            location: "Lantai 2",
          },
          {
            assetTag: "PSPK-IT-2026-9999",
            name: "Monitor Dell B",
            category: "IT",
            type: "Monitor",
            location: "Lantai 2",
          },
        ],
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.importedCount).toBe(1);
        expect(result.failedRows).toHaveLength(1);
        expect(result.failedRows[0]?.reason).toContain("duplikat di dalam berkas impor");
      }
    });

    it("harus berhasil auto-generate tag dan menyimpan aset via $transaction", async () => {
      const db = await import("@pspk/db");

      vi.mocked(db.prisma.asset.findMany).mockResolvedValueOnce([] as never);
      vi.mocked(db.prisma.asset.findFirst).mockResolvedValueOnce(null); // latest IT tag
      vi.mocked(db.prisma.asset.findFirst).mockResolvedValueOnce(null); // latest Non-IT tag

      const result = await importAssetsBatchAction({
        rows: [
          {
            name: "Meja Kerja Stramm",
            category: "NON_IT",
            type: "Meja Kerja",
            location: "Area Riset",
            purchasePrice: 4500000,
          },
          {
            name: "Lenovo ThinkPad T14",
            category: "IT",
            type: "Laptop",
            location: "Gudang IT",
            serialNumber: "SN12345678",
          },
        ],
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.importedCount).toBe(2);
        expect(result.failedRows).toHaveLength(0);
        expect(mockTx.asset.create).toHaveBeenCalledTimes(2);
        expect(db.writeAudit).toHaveBeenCalledWith(
          expect.objectContaining({
            action: "IMPORT",
            entityType: "Asset",
          }),
        );
      }
    });
  });
});
