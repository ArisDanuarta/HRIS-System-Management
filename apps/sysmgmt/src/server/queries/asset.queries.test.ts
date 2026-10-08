import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getAssetsDirectory,
  getAssetById,
  getAssetStats,
  getNextAssetTag,
} from "./asset.queries";

vi.mock("@pspk/db", async () => {
  const actual = await vi.importActual<typeof import("@pspk/db")>("@pspk/db");
  return {
    ...actual,
    prisma: {
      asset: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        count: vi.fn(),
      },
      employee: {
        findMany: vi.fn(),
      },
    },
  };
});

describe("asset.queries.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getAssetsDirectory harus mengembalikan aset dengan serialisasi yang benar", async () => {
    const db = await import("@pspk/db");

    vi.mocked(db.prisma.asset.count).mockResolvedValueOnce(1);
    vi.mocked(db.prisma.asset.findMany).mockResolvedValueOnce([
      {
        id: "asset-1",
        assetTag: "PSPK-IT-2026-0001",
        category: "IT",
        type: "Laptop",
        name: "MacBook Pro M3",
        brand: "Apple",
        model: "14-inch Space Gray",
        serialNumber: "C02XYZ123",
        purchaseDate: new Date("2026-01-15"),
        purchasePrice: new db.Prisma.Decimal(24999000),
        status: "ASSIGNED",
        location: "Kantor Jakarta",
        notes: "Unit staf IT",
        createdAt: new Date("2026-01-15T08:00:00Z"),
        updatedAt: new Date("2026-01-15T08:00:00Z"),
        assignments: [
          {
            id: "ass-1",
            assetId: "asset-1",
            employeeId: "emp-1",
            assignedAt: new Date("2026-01-20"),
            returnedAt: null,
            conditionOut: "Baru / Mulus",
            conditionIn: null,
            notes: null,
            employee: {
              id: "emp-1",
              employeeNo: "PSPK-001",
              fullName: "Aris Danuarta",
              nickname: "Aris",
              workEmail: "aris@pspk.id",
              currentDepartment: { name: "Teknologi & Sistem" },
              currentPosition: { title: "IT Administrator" },
            },
          },
        ],
      } as never,
    ]);

    const result = await getAssetsDirectory({ category: "IT", search: "MacBook" });

    expect(result.pagination.total).toBe(1);
    expect(result.assets).toHaveLength(1);
    expect(result.assets[0]?.assetTag).toBe("PSPK-IT-2026-0001");
    expect(result.assets[0]?.purchasePrice).toBe(24999000);
    expect(result.assets[0]?.activeAssignment?.employee.fullName).toBe("Aris Danuarta");
    expect(result.assets[0]?.activeAssignment?.employee.departmentName).toBe("Teknologi & Sistem");
  });

  it("getAssetStats harus mengembalikan total hitungan kategori dan status", async () => {
    const db = await import("@pspk/db");

    vi.mocked(db.prisma.asset.count)
      .mockResolvedValueOnce(50) // total
      .mockResolvedValueOnce(30) // inStock
      .mockResolvedValueOnce(15) // assigned
      .mockResolvedValueOnce(3) // maintenance
      .mockResolvedValueOnce(2) // retired
      .mockResolvedValueOnce(0) // lost
      .mockResolvedValueOnce(35) // itTotal
      .mockResolvedValueOnce(15); // nonItTotal

    const stats = await getAssetStats();

    expect(stats.total).toBe(50);
    expect(stats.inStock).toBe(30);
    expect(stats.assigned).toBe(15);
    expect(stats.maintenance).toBe(3);
    expect(stats.itTotal).toBe(35);
    expect(stats.nonItTotal).toBe(15);
  });

  it("getNextAssetTag harus menghasilkan tag awal jika belum ada aset", async () => {
    const db = await import("@pspk/db");
    const currentYear = new Date().getFullYear();

    vi.mocked(db.prisma.asset.findMany).mockResolvedValueOnce([]);

    const tag = await getNextAssetTag("IT");
    expect(tag).toBe(`PSPK-IT-${currentYear}-0001`);
  });

  it("getNextAssetTag harus menambah urutan dari tag terakhir", async () => {
    const db = await import("@pspk/db");
    const currentYear = new Date().getFullYear();

    vi.mocked(db.prisma.asset.findMany).mockResolvedValueOnce([
      { assetTag: `PSPK-IT-${currentYear}-0042` } as never,
    ]);

    const tag = await getNextAssetTag("IT");
    expect(tag).toBe(`PSPK-IT-${currentYear}-0043`);
  });

  it("getAssetById harus mengembalikan null jika aset tidak ditemukan", async () => {
    const db = await import("@pspk/db");

    vi.mocked(db.prisma.asset.findUnique).mockResolvedValueOnce(null);

    const asset = await getAssetById("non-existent-id");
    expect(asset).toBeNull();
  });
});
