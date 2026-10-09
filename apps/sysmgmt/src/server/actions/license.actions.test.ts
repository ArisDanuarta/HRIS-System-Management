import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createLicenseAction,
  updateLicenseAction,
  revealLicenseKeyAction,
  deleteLicenseAction,
} from "./license.actions";

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
  permissions: new Set(["sysmgmt.license.manage:all", "sysmgmt.license.read:all"]),
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
      softwareLicense: {
        findUnique: vi.fn(),
        findMany: vi.fn().mockResolvedValue([]),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
    },
    writeAudit: vi.fn().mockResolvedValue(undefined),
  };
});

// Setup mock encryption key for @pspk/shared
process.env.DATA_ENCRYPTION_KEY = "2f/wOrwtFxfsVuvVnbjAK+T+qtIEEaEZ1KtQSDkVh+U=";

describe("license.actions.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createLicenseAction", () => {
    it("harus membuat lisensi baru dan mengenkripsi kunci produk jika ada", async () => {
      const db = await import("@pspk/db");

      vi.mocked(db.prisma.softwareLicense.create).mockResolvedValueOnce({
        id: "lic-created-1",
        name: "Google Workspace Enterprise",
        vendor: "Google Cloud",
        licenseKeyEnc: "enc:test:key",
        seatsTotal: 50,
        seatsUsed: 10,
        purchaseDate: new Date("2026-01-01"),
        expiresAt: new Date("2027-01-01"),
        notes: "Organisasi",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await createLicenseAction({
        name: "Google Workspace Enterprise",
        vendor: "Google Cloud",
        licenseKey: "PROD-KEY-1234-5678",
        seatsTotal: 50,
        seatsUsed: 10,
        purchaseDate: "2026-01-01",
        expiresAt: "2027-01-01",
        notes: "Organisasi",
      });

      expect(res.ok).toBe(true);
      expect(res.data?.id).toBe("lic-created-1");

      // Verifikasi create dipanggil dengan licenseKeyEnc terisi
      const createCall = vi.mocked(db.prisma.softwareLicense.create).mock.calls[0]![0];
      expect(createCall.data.licenseKeyEnc).not.toBeNull();
      expect(createCall.data.licenseKeyEnc).not.toBe("PROD-KEY-1234-5678"); // Harus terenkripsi

      // Verifikasi audit log dicatat dan TIDAK berisi plain key
      expect(db.writeAudit).toHaveBeenCalledTimes(1);
      const auditArg = vi.mocked(db.writeAudit).mock.calls[0]![0];
      expect(auditArg.action).toBe("CREATE");
      expect(auditArg.entityType).toBe("SoftwareLicense");
      expect(JSON.stringify(auditArg.after)).not.toContain("PROD-KEY-1234-5678");
    });
  });

  describe("updateLicenseAction", () => {
    it("harus memperbarui data lisensi dan mengupdate kunci jika diberikan", async () => {
      const db = await import("@pspk/db");

      vi.mocked(db.prisma.softwareLicense.findUnique).mockResolvedValueOnce({
        id: "lic-1",
        name: "Figma Old",
        vendor: "Figma",
        licenseKeyEnc: "old:enc:key",
        seatsTotal: 10,
        seatsUsed: 5,
        purchaseDate: null,
        expiresAt: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(db.prisma.softwareLicense.update).mockResolvedValueOnce({
        id: "lic-1",
        name: "Figma Organization",
        vendor: "Figma Inc",
        licenseKeyEnc: "new:enc:key",
        seatsTotal: 15,
        seatsUsed: 5,
        purchaseDate: null,
        expiresAt: null,
        notes: "Diperbarui",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await updateLicenseAction({
        id: "lic-1",
        name: "Figma Organization",
        vendor: "Figma Inc",
        licenseKey: "NEW-KEY-9999",
        seatsTotal: 15,
        seatsUsed: 5,
        notes: "Diperbarui",
      });

      expect(res.ok).toBe(true);
      expect(db.prisma.softwareLicense.update).toHaveBeenCalledTimes(1);
      expect(db.writeAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "UPDATE",
          entityType: "SoftwareLicense",
        }),
      );
    });
  });

  describe("revealLicenseKeyAction", () => {
    it("harus mendekripsi kunci lisensi dan mencatat audit log VIEW_SENSITIVE", async () => {
      const db = await import("@pspk/db");
      const { encryptField } = await import("@pspk/shared");

      const plainSecret = "SECRET-PRODUCT-KEY-XYZ";
      const encryptedSecret = encryptField(plainSecret);

      vi.mocked(db.prisma.softwareLicense.findUnique).mockResolvedValueOnce({
        id: "lic-secret",
        name: "Zoom Pro Enterprise",
        vendor: "Zoom",
        licenseKeyEnc: encryptedSecret,
        seatsTotal: 25,
        seatsUsed: 20,
        purchaseDate: null,
        expiresAt: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await revealLicenseKeyAction({
        id: "lic-secret",
        reason: "Verifikasi serial lisensi",
      });

      expect(res.ok).toBe(true);
      expect(res.data?.key).toBe(plainSecret);

      // Verifikasi pencatatan audit VIEW_SENSITIVE
      expect(db.writeAudit).toHaveBeenCalledTimes(1);
      const auditCall = vi.mocked(db.writeAudit).mock.calls[0]![0];
      expect(auditCall.action).toBe("VIEW_SENSITIVE");
      expect(auditCall.entityType).toBe("SoftwareLicense");
      expect(auditCall.entityId).toBe("lic-secret");
      // Memastikan audit log TIDAK menyimpan teks plain secret
      expect(JSON.stringify(auditCall)).not.toContain(plainSecret);
    });

    it("harus menolak jika lisensi tidak memiliki kunci tersimpan", async () => {
      const db = await import("@pspk/db");

      vi.mocked(db.prisma.softwareLicense.findUnique).mockResolvedValueOnce({
        id: "lic-no-key",
        name: "Free Tool",
        vendor: "Free",
        licenseKeyEnc: null,
        seatsTotal: 5,
        seatsUsed: 1,
        purchaseDate: null,
        expiresAt: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await revealLicenseKeyAction({
        id: "lic-no-key",
      });

      expect(res.ok).toBe(false);
      expect(res.error).toContain("tidak memiliki kunci");
      expect(db.writeAudit).not.toHaveBeenCalled();
    });
  });

  describe("deleteLicenseAction", () => {
    it("harus menghapus lisensi dan mencatat audit log DELETE", async () => {
      const db = await import("@pspk/db");

      vi.mocked(db.prisma.softwareLicense.findUnique).mockResolvedValueOnce({
        id: "lic-del",
        name: "Old Software",
        vendor: "Old Vendor",
        licenseKeyEnc: null,
        seatsTotal: 10,
        seatsUsed: 0,
        purchaseDate: null,
        expiresAt: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(db.prisma.softwareLicense.delete).mockResolvedValueOnce({} as any);

      const res = await deleteLicenseAction({ id: "lic-del" });

      expect(res.ok).toBe(true);
      expect(db.prisma.softwareLicense.delete).toHaveBeenCalledWith({
        where: { id: "lic-del" },
      });
      expect(db.writeAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "DELETE",
          entityType: "SoftwareLicense",
        }),
      );
    });
  });
});
