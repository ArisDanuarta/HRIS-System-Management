import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createDocumentCategoryAction,
  updateDocumentCategoryAction,
  toggleDocumentCategoryStatusAction,
  deleteDocumentCategoryAction,
  createAssetTypeAction,
  deleteAssetTypeAction,
  createAssetLocationAction,
  deleteAssetLocationAction,
  updateSystemPreferencesAction,
} from "./settings.actions";

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
  permissions: new Set(["sysmgmt.settings.manage:all"]),
};

vi.mock("@pspk/auth", () => ({
  getSession: vi.fn().mockImplementation(() => Promise.resolve(mockSession)),
  getAuthContext: vi.fn().mockImplementation(() => Promise.resolve(mockAuthCtx)),
}));

vi.mock("@pspk/db", async () => {
  const actual = await vi.importActual<typeof import("@pspk/db")>("@pspk/db");
  return {
    ...actual,
    prisma: {
      documentCategory: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      document: {
        count: vi.fn(),
      },
      assetType: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      assetLocation: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      asset: {
        count: vi.fn(),
      },
      systemSetting: {
        findMany: vi.fn(),
        upsert: vi.fn(),
      },
      $transaction: vi.fn(async (callback) => {
        if (Array.isArray(callback)) {
          return Promise.all(callback);
        }
        return callback();
      }),
    },
    writeAudit: vi.fn().mockResolvedValue({}),
  };
});

describe("settings.actions.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Kategori Dokumen Actions", () => {
    it("harus menolak pembuatan kategori jika prefix kode tidak berakhiran tanda strip", async () => {
      const res = await createDocumentCategoryAction({
        name: "SOP Legal",
        codePrefix: "SOP-LEGAL", // Salah: tidak ada tanda strip di akhir
      });

      expect(res.ok).toBe(false);
      expect(res.error).toContain("diakhiri tanda strip");
    });

    it("harus menolak jika nama kategori sudah terdaftar sebelumnya", async () => {
      const { prisma } = await import("@pspk/db");
      vi.mocked(prisma.documentCategory.findUnique).mockResolvedValueOnce({
        id: "cat-1",
        name: "Kebijakan Lembaga",
      } as never);

      const res = await createDocumentCategoryAction({
        name: "Kebijakan Lembaga",
        codePrefix: "KBJ-",
      });

      expect(res.ok).toBe(false);
      expect(res.error).toContain("sudah terdaftar");
    });

    it("harus berhasil membuat kategori dan mencatat audit log", async () => {
      const { prisma, writeAudit } = await import("@pspk/db");

      vi.mocked(prisma.documentCategory.findUnique)
        .mockResolvedValueOnce(null) // cek nama
        .mockResolvedValueOnce(null); // cek prefix

      vi.mocked(prisma.documentCategory.create).mockResolvedValueOnce({
        id: "cat-new",
        name: "SOP Advokasi",
        codePrefix: "SOP-ADV-",
        description: "Pedoman riset advokasi",
        color: "indigo",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never);

      const res = await createDocumentCategoryAction({
        name: "SOP Advokasi",
        codePrefix: "SOP-ADV-",
        description: "Pedoman riset advokasi",
        color: "indigo",
      });

      expect(res.ok).toBe(true);
      expect(res.data?.id).toBe("cat-new");
      expect(writeAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "CREATE",
          entityType: "DocumentCategory",
          entityId: "cat-new",
        }),
      );
    });

    it("harus mencegah penghapusan kategori jika masih memiliki dokumen terhubung", async () => {
      const { prisma } = await import("@pspk/db");

      vi.mocked(prisma.documentCategory.findUnique).mockResolvedValueOnce({
        id: "cat-1",
        name: "Kebijakan Lembaga",
        _count: { documents: 3 },
      } as never);

      vi.mocked(prisma.document.count).mockResolvedValueOnce(3);

      const res = await deleteDocumentCategoryAction({ id: "cat-1" });

      expect(res.ok).toBe(false);
      expect(res.error).toContain("tidak dapat dihapus karena masih digunakan");
      expect(prisma.documentCategory.delete).not.toHaveBeenCalled();
    });

    it("harus berhasil memperbarui kategori dokumen", async () => {
      const { prisma, writeAudit } = await import("@pspk/db");

      vi.mocked(prisma.documentCategory.findUnique).mockResolvedValueOnce({
        id: "cat-1",
        name: "Kebijakan Lama",
        codePrefix: "KBJ-",
        color: "amber",
        isActive: true,
      } as never);

      vi.mocked(prisma.documentCategory.update).mockResolvedValueOnce({
        id: "cat-1",
        name: "Kebijakan Baru",
        codePrefix: "KBJ-",
        color: "amber",
        isActive: true,
      } as never);

      const res = await updateDocumentCategoryAction({
        id: "cat-1",
        name: "Kebijakan Baru",
        codePrefix: "KBJ-",
      });

      expect(res.ok).toBe(true);
      expect(res.data?.name).toBe("Kebijakan Baru");
      expect(writeAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "UPDATE",
          entityType: "DocumentCategory",
        }),
      );
    });

    it("harus berhasil mengubah status aktif kategori dokumen", async () => {
      const { prisma, writeAudit } = await import("@pspk/db");

      vi.mocked(prisma.documentCategory.findUnique).mockResolvedValueOnce({
        id: "cat-1",
        isActive: true,
      } as never);

      vi.mocked(prisma.documentCategory.update).mockResolvedValueOnce({
        id: "cat-1",
        isActive: false,
      } as never);

      const res = await toggleDocumentCategoryStatusAction({ id: "cat-1" });

      expect(res.ok).toBe(true);
      expect(res.data?.isActive).toBe(false);
      expect(writeAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "UPDATE",
          entityType: "DocumentCategory",
        }),
      );
    });

    it("harus berhasil menghapus kategori jika tidak memiliki dokumen", async () => {
      const { prisma, writeAudit } = await import("@pspk/db");

      vi.mocked(prisma.documentCategory.findUnique).mockResolvedValueOnce({
        id: "cat-empty",
        name: "Kategori Kosong",
        codePrefix: "EMP-",
        _count: { documents: 0 },
      } as never);

      vi.mocked(prisma.document.count).mockResolvedValueOnce(0);
      vi.mocked(prisma.documentCategory.delete).mockResolvedValueOnce({} as never);

      const res = await deleteDocumentCategoryAction({ id: "cat-empty" });

      expect(res.ok).toBe(true);
      expect(res.id).toBe("cat-empty");
      expect(writeAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "DELETE",
          entityType: "DocumentCategory",
        }),
      );
    });
  });

  describe("Master Tipe Aset Actions", () => {
    it("harus berhasil membuat tipe aset baru", async () => {
      const { prisma, writeAudit } = await import("@pspk/db");

      vi.mocked(prisma.assetType.findUnique).mockResolvedValueOnce(null);
      vi.mocked(prisma.assetType.create).mockResolvedValueOnce({
        id: "type-tablet",
        name: "Tablet Riset",
        category: "IT",
        description: null,
        isActive: true,
      } as never);

      const res = await createAssetTypeAction({
        name: "Tablet Riset",
        category: "IT",
      });

      expect(res.ok).toBe(true);
      expect(res.data?.name).toBe("Tablet Riset");
      expect(writeAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "CREATE",
          entityType: "AssetType",
        }),
      );
    });

    it("harus mencegah penghapusan tipe aset jika masih tercatat pada inventaris aset", async () => {
      const { prisma } = await import("@pspk/db");

      vi.mocked(prisma.assetType.findUnique).mockResolvedValueOnce({
        id: "type-laptop",
        name: "Laptop",
        category: "IT",
      } as never);

      vi.mocked(prisma.asset.count).mockResolvedValueOnce(12);

      const res = await deleteAssetTypeAction({ id: "type-laptop" });

      expect(res.ok).toBe(false);
      expect(res.error).toContain("tidak dapat dihapus karena tercatat pada 12 inventaris");
    });
  });

  describe("Master Lokasi Aset Actions", () => {
    it("harus berhasil membuat lokasi aset baru", async () => {
      const { prisma, writeAudit } = await import("@pspk/db");

      vi.mocked(prisma.assetLocation.findUnique).mockResolvedValueOnce(null);
      vi.mocked(prisma.assetLocation.create).mockResolvedValueOnce({
        id: "loc-new",
        name: "Ruang Studio Podcast",
        building: "Gedung Edukasi",
        floor: "Lt. 2",
        description: "Studio rekaman audio & video",
        isActive: true,
      } as never);

      const res = await createAssetLocationAction({
        name: "Ruang Studio Podcast",
        building: "Gedung Edukasi",
        floor: "Lt. 2",
        description: "Studio rekaman audio & video",
      });

      expect(res.ok).toBe(true);
      expect(res.data?.name).toBe("Ruang Studio Podcast");
      expect(writeAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "CREATE",
          entityType: "AssetLocation",
        }),
      );
    });

    it("harus mencegah penghapusan lokasi jika masih digunakan oleh aset", async () => {
      const { prisma } = await import("@pspk/db");

      vi.mocked(prisma.assetLocation.findUnique).mockResolvedValueOnce({
        id: "loc-1",
        name: "Ruang Server & IT",
      } as never);

      vi.mocked(prisma.asset.count).mockResolvedValueOnce(5);

      const res = await deleteAssetLocationAction({ id: "loc-1" });

      expect(res.ok).toBe(false);
      expect(res.error).toContain("tidak dapat dihapus karena tercatat pada 5 inventaris");
    });
  });

  describe("Preferensi Sistem Actions", () => {
    it("harus menolak input preferensi jika di luar batas rentang valid", async () => {
      const res = await updateSystemPreferencesAction({
        maxUploadMb: 150, // Maksimal 100 MB
        auditRetentionDays: 365,
        sessionTimeoutMins: 1440,
      });

      expect(res.ok).toBe(false);
      expect(res.error).toContain("maksimal 100 MB");
    });

    it("harus berhasil memperbarui preferensi sistem dan mencatat audit log", async () => {
      const { prisma, writeAudit } = await import("@pspk/db");

      vi.mocked(prisma.systemSetting.findMany).mockResolvedValueOnce([
        { key: "system.max_upload_mb", value: "25" },
        { key: "system.audit_retention_days", value: "365" },
        { key: "system.session_timeout_mins", value: "1440" },
      ] as never);

      const res = await updateSystemPreferencesAction({
        maxUploadMb: 50,
        auditRetentionDays: 730,
        sessionTimeoutMins: 2880,
      });

      expect(res.ok).toBe(true);
      expect(res.data?.maxUploadMb).toBe(50);
      expect(writeAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "UPDATE",
          entityType: "SystemSetting",
          entityId: "SYSTEM_PREFERENCES",
        }),
      );
    });
  });
});
