import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getLicensesDirectory,
  getLicenseStats,
  getLicenseById,
} from "./license.queries";

vi.mock("@pspk/db", async () => {
  const actual = await vi.importActual<typeof import("@pspk/db")>("@pspk/db");
  return {
    ...actual,
    prisma: {
      softwareLicense: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        count: vi.fn(),
      },
    },
  };
});

describe("license.queries.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const mockLicenses = [
    {
      id: "lic-1",
      name: "Google Workspace Enterprise",
      vendor: "Google Cloud",
      licenseKeyEnc: "enc:mock:key1",
      seatsTotal: 100,
      seatsUsed: 85,
      purchaseDate: new Date("2026-01-01"),
      expiresAt: new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000), // H+15 (Expiring soon)
      notes: "Email & Storage",
      createdAt: new Date("2026-01-01T08:00:00Z"),
      updatedAt: new Date("2026-01-01T08:00:00Z"),
    },
    {
      id: "lic-2",
      name: "Zoom One Pro",
      vendor: "Zoom Video",
      licenseKeyEnc: null,
      seatsTotal: 10,
      seatsUsed: 10,
      purchaseDate: new Date("2025-06-01"),
      expiresAt: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000), // H-5 (Expired)
      notes: "Video conference",
      createdAt: new Date("2025-06-01T08:00:00Z"),
      updatedAt: new Date("2025-06-01T08:00:00Z"),
    },
    {
      id: "lic-3",
      name: "Figma Organization",
      vendor: "Figma Inc",
      licenseKeyEnc: "enc:mock:key3",
      seatsTotal: 20,
      seatsUsed: 5,
      purchaseDate: new Date("2026-02-01"),
      expiresAt: new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000), // H+90 (Active)
      notes: "Design team",
      createdAt: new Date("2026-02-01T08:00:00Z"),
      updatedAt: new Date("2026-02-01T08:00:00Z"),
    },
    {
      id: "lic-4",
      name: "JetBrains All Products Pack",
      vendor: "JetBrains",
      licenseKeyEnc: null,
      seatsTotal: 5,
      seatsUsed: 2,
      purchaseDate: new Date("2026-01-10"),
      expiresAt: null, // Perpetual / tanpa kedaluwarsa
      notes: "Developer licenses",
      createdAt: new Date("2026-01-10T08:00:00Z"),
      updatedAt: new Date("2026-01-10T08:00:00Z"),
    },
  ];

  it("getLicensesDirectory harus menghitung metrik utilisasi dan status kedaluwarsa dengan tepat", async () => {
    const db = await import("@pspk/db");
    vi.mocked(db.prisma.softwareLicense.findMany).mockResolvedValueOnce(mockLicenses);

    const result = await getLicensesDirectory();

    expect(result.total).toBe(4);
    expect(result.licenses).toHaveLength(4);

    // Cek lic-1: Google Workspace (85% utilization, H+15 expiring soon, has key)
    const lic1 = result.licenses.find((l) => l.id === "lic-1");
    expect(lic1).toBeDefined();
    expect(lic1?.utilizationPercent).toBe(85);
    expect(lic1?.hasLicenseKey).toBe(true);
    expect(lic1?.isExpiringSoon).toBe(true);
    expect(lic1?.isExpired).toBe(false);

    // Cek lic-2: Zoom (100% full, expired H-5, no key)
    const lic2 = result.licenses.find((l) => l.id === "lic-2");
    expect(lic2).toBeDefined();
    expect(lic2?.utilizationPercent).toBe(100);
    expect(lic2?.hasLicenseKey).toBe(false);
    expect(lic2?.isExpired).toBe(true);
    expect(lic2?.isExpiringSoon).toBe(false);

    // Cek lic-4: JetBrains (perpetual, daysRemaining null)
    const lic4 = result.licenses.find((l) => l.id === "lic-4");
    expect(lic4).toBeDefined();
    expect(lic4?.expiresAt).toBeNull();
    expect(lic4?.daysRemaining).toBeNull();
    expect(lic4?.isExpired).toBe(false);

    // Cek kumpulan vendor
    expect(result.vendors).toEqual(["Figma Inc", "Google Cloud", "JetBrains", "Zoom Video"]);
  });

  it("getLicensesDirectory menyaring status EXPIRING_SOON, EXPIRED, FULL, dan PERPETUAL", async () => {
    const db = await import("@pspk/db");

    // Saring EXPIRING_SOON
    vi.mocked(db.prisma.softwareLicense.findMany).mockResolvedValueOnce(mockLicenses);
    const expiringSoon = await getLicensesDirectory({ status: "EXPIRING_SOON" });
    expect(expiringSoon.total).toBe(1);
    expect(expiringSoon.licenses[0]?.id).toBe("lic-1");

    // Saring EXPIRED
    vi.mocked(db.prisma.softwareLicense.findMany).mockResolvedValueOnce(mockLicenses);
    const expired = await getLicensesDirectory({ status: "EXPIRED" });
    expect(expired.total).toBe(1);
    expect(expired.licenses[0]?.id).toBe("lic-2");

    // Saring FULL
    vi.mocked(db.prisma.softwareLicense.findMany).mockResolvedValueOnce(mockLicenses);
    const full = await getLicensesDirectory({ status: "FULL" });
    expect(full.total).toBe(1);
    expect(full.licenses[0]?.id).toBe("lic-2");

    // Saring PERPETUAL
    vi.mocked(db.prisma.softwareLicense.findMany).mockResolvedValueOnce(mockLicenses);
    const perpetual = await getLicensesDirectory({ status: "PERPETUAL" });
    expect(perpetual.total).toBe(1);
    expect(perpetual.licenses[0]?.id).toBe("lic-4");
  });

  it("getLicenseStats harus menghitung statistik global dengan akurat", async () => {
    const db = await import("@pspk/db");
    vi.mocked(db.prisma.softwareLicense.findMany).mockResolvedValueOnce(mockLicenses);

    const stats = await getLicenseStats();

    expect(stats.totalLicenses).toBe(4);
    // Total seats total = 100 + 10 + 20 + 5 = 135
    expect(stats.totalSeatsTotal).toBe(135);
    // Total seats used = 85 + 10 + 5 + 2 = 102
    expect(stats.totalSeatsUsed).toBe(102);
    // Global utilization = round(102/135 * 100) = 76%
    expect(stats.globalUtilizationPercent).toBe(76);
    expect(stats.expiringSoonCount).toBe(1);
    expect(stats.expiredCount).toBe(1);
    // Critical usage >= 80%: Google (85%) dan Zoom (100%) = 2
    expect(stats.criticalUsageCount).toBe(2);
  });

  it("getLicenseById mengembalikan satu lisensi atau null jika tidak ditemukan", async () => {
    const db = await import("@pspk/db");
    vi.mocked(db.prisma.softwareLicense.findUnique).mockResolvedValueOnce(mockLicenses[0]!);

    const single = await getLicenseById("lic-1");
    expect(single).not.toBeNull();
    expect(single?.name).toBe("Google Workspace Enterprise");
    expect(single?.hasLicenseKey).toBe(true);

    vi.mocked(db.prisma.softwareLicense.findUnique).mockResolvedValueOnce(null);
    const notFound = await getLicenseById("non-existent");
    expect(notFound).toBeNull();
  });
});
