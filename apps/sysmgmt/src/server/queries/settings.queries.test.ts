import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getDocumentCategories,
  getAssetTypes,
  getAssetLocations,
  getSystemPreferences,
  getSettingsStats,
} from "./settings.queries";

vi.mock("@pspk/db", async () => {
  const actual = await vi.importActual<typeof import("@pspk/db")>("@pspk/db");
  return {
    ...actual,
    prisma: {
      documentCategory: {
        findMany: vi.fn(),
        count: vi.fn(),
      },
      assetType: {
        findMany: vi.fn(),
        count: vi.fn(),
      },
      assetLocation: {
        findMany: vi.fn(),
        count: vi.fn(),
      },
      systemSetting: {
        findMany: vi.fn(),
        count: vi.fn(),
      },
    },
  };
});

describe("settings.queries.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getDocumentCategories", () => {
    it("harus mengembalikan daftar kategori aktif secara default beserta jumlah dokumen", async () => {
      const { prisma } = await import("@pspk/db");
      const mockCategories = [
        {
          id: "cat-1",
          name: "Kebijakan Lembaga",
          codePrefix: "KBJ-",
          description: "Regulasi",
          color: "amber",
          isActive: true,
          _count: { documents: 4 },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(prisma.documentCategory.findMany).mockResolvedValueOnce(mockCategories as never);

      const result = await getDocumentCategories();

      expect(result).toHaveLength(1);
      expect(result[0]?.name).toBe("Kebijakan Lembaga");
      expect(result[0]?.codePrefix).toBe("KBJ-");
      expect(result[0]?.documentCount).toBe(4);
      expect(prisma.documentCategory.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { name: "asc" },
        include: { _count: { select: { documents: true } } },
      });
    });

    it("harus menyertakan kategori nonaktif jika includeInactive bernilai true", async () => {
      const { prisma } = await import("@pspk/db");
      vi.mocked(prisma.documentCategory.findMany).mockResolvedValueOnce([]);

      await getDocumentCategories({ includeInactive: true });

      expect(prisma.documentCategory.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { name: "asc" },
        include: { _count: { select: { documents: true } } },
      });
    });
  });

  describe("getAssetTypes", () => {
    it("harus menyaring tipe aset berdasarkan kategori IT", async () => {
      const { prisma } = await import("@pspk/db");
      const mockTypes = [
        {
          id: "type-1",
          name: "Laptop",
          category: "IT",
          description: "Laptop riset",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(prisma.assetType.findMany).mockResolvedValueOnce(mockTypes as never);

      const result = await getAssetTypes({ category: "IT" });

      expect(result).toHaveLength(1);
      expect(result[0]?.name).toBe("Laptop");
      expect(result[0]?.category).toBe("IT");
      expect(prisma.assetType.findMany).toHaveBeenCalledWith({
        where: { category: "IT", isActive: true },
        orderBy: { name: "asc" },
      });
    });
  });

  describe("getAssetLocations", () => {
    it("harus mengembalikan daftar lokasi ruangan kantor aktif", async () => {
      const { prisma } = await import("@pspk/db");
      const mockLocations = [
        {
          id: "loc-1",
          name: "Ruang Rapat Riset",
          building: "Gedung Edukasi",
          floor: "Lt. 3",
          description: "Rapat 12 orang",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(prisma.assetLocation.findMany).mockResolvedValueOnce(mockLocations as never);

      const result = await getAssetLocations();

      expect(result).toHaveLength(1);
      expect(result[0]?.name).toBe("Ruang Rapat Riset");
      expect(result[0]?.floor).toBe("Lt. 3");
    });
  });

  describe("getSystemPreferences", () => {
    it("harus mengembalikan nilai default yang aman saat tabel preferensi kosong", async () => {
      const { prisma } = await import("@pspk/db");
      vi.mocked(prisma.systemSetting.findMany).mockResolvedValueOnce([]);

      const result = await getSystemPreferences();

      expect(result.maxUploadMb).toBe(25);
      expect(result.auditRetentionDays).toBe(365);
      expect(result.sessionTimeoutMins).toBe(1440);
    });

    it("harus mengurai nilai pengaturan dari database dengan benar", async () => {
      const { prisma } = await import("@pspk/db");
      vi.mocked(prisma.systemSetting.findMany).mockResolvedValueOnce([
        {
          id: "pref-1",
          key: "system.max_upload_mb",
          value: "50",
          category: "PREFERENCE",
          description: "Upload limit",
          updatedBy: "admin",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "pref-2",
          key: "system.audit_retention_days",
          value: "730",
          category: "PREFERENCE",
          description: "Audit retention",
          updatedBy: "admin",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ] as never);

      const result = await getSystemPreferences();

      expect(result.maxUploadMb).toBe(50);
      expect(result.auditRetentionDays).toBe(730);
      expect(result.sessionTimeoutMins).toBe(1440); // default fallback
    });
  });

  describe("getSettingsStats", () => {
    it("harus menghitung metrik ringkasan master data dengan tepat", async () => {
      const { prisma } = await import("@pspk/db");

      vi.mocked(prisma.documentCategory.count)
        .mockResolvedValueOnce(5) // total
        .mockResolvedValueOnce(4); // active
      vi.mocked(prisma.assetType.count)
        .mockResolvedValueOnce(8) // total
        .mockResolvedValueOnce(4) // it
        .mockResolvedValueOnce(4); // non-it
      vi.mocked(prisma.assetLocation.count)
        .mockResolvedValueOnce(5) // total
        .mockResolvedValueOnce(5); // active

      const stats = await getSettingsStats();

      expect(stats.totalCategories).toBe(5);
      expect(stats.activeCategories).toBe(4);
      expect(stats.totalAssetTypes).toBe(8);
      expect(stats.itAssetTypes).toBe(4);
      expect(stats.nonItAssetTypes).toBe(4);
      expect(stats.totalLocations).toBe(5);
      expect(stats.activeLocations).toBe(5);
    });
  });
});
