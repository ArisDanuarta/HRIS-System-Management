import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createCredentialAction,
  updateCredentialAction,
  revealCredentialPasswordAction,
  deleteCredentialAction,
} from "./credential.actions";
import { encryptField } from "@pspk/shared";
import type { Credential } from "@pspk/db";

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
  permissions: new Set([
    "sysmgmt.credential.read:all",
    "sysmgmt.credential.manage:all",
    "sysmgmt.credential.reveal:all",
  ]),
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
      credential: {
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

process.env.DATA_ENCRYPTION_KEY = "2f/wOrwtFxfsVuvVnbjAK+T+qtIEEaEZ1KtQSDkVh+U=";

describe("credential.actions.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const sampleCredential: Credential = {
    id: "cred-123",
    title: "Instagram Resmi PSPK",
    category: "SOCIAL_MEDIA",
    url: "https://instagram.com/pspk.id",
    username: "pspk.id",
    email: "humas@pspk.id",
    passwordEnc: "enc:mocked:pw",
    twoFactorType: "AUTHENTICATOR_APP",
    recoveryEmail: "it@pspk.id",
    recoveryPhone: "08123456789",
    picEmployeeId: "emp-1",
    notes: "Kelola bersama tim humas",
    isActive: true,
    lastRotatedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe("createCredentialAction", () => {
    it("harus berhasil membuat kredensial baru dengan password terenkripsi", async () => {
      const { prisma, writeAudit } = await import("@pspk/db");

      vi.mocked(prisma.credential.create).mockResolvedValue(sampleCredential);

      const res = await createCredentialAction({
        title: "Instagram Resmi PSPK",
        category: "SOCIAL_MEDIA",
        url: "instagram.com/pspk.id",
        username: "pspk.id",
        email: "humas@pspk.id",
        password: "SuperSecretPassword123!",
        twoFactorType: "AUTHENTICATOR_APP",
        recoveryEmail: "it@pspk.id",
        recoveryPhone: "08123456789",
        picEmployeeId: "emp-1",
        notes: "Kelola bersama tim humas",
        isActive: true,
      });

      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data.id).toBe("cred-123");
        expect(res.data.title).toBe("Instagram Resmi PSPK");
      }

      // Verifikasi create dipanggil dengan passwordEnc terenkripsi (bukan plaintext)
      const createCall = vi.mocked(prisma.credential.create).mock.calls[0]?.[0];
      expect(createCall?.data.passwordEnc).not.toBe("SuperSecretPassword123!");
      expect(createCall?.data.passwordEnc).toBeDefined();

      // Verifikasi audit log dicatat
      expect(writeAudit).toHaveBeenCalledTimes(1);
      const auditCall = vi.mocked(writeAudit).mock.calls[0]?.[0];
      expect(auditCall?.action).toBe("CREATE");
      expect(auditCall?.entityType).toBe("Credential");
      expect((auditCall?.after as Record<string, unknown>)?.hasPassword).toBe(true);
      // Memastikan plaintext password tidak bocor ke log
      expect(JSON.stringify(auditCall)).not.toContain("SuperSecretPassword123!");
    });

    it("harus menolak input jika username dan email sama-sama kosong", async () => {
      const res = await createCredentialAction({
        title: "Akun Tanpa Identitas",
        category: "OTHER",
        password: "password123",
        username: "",
        email: "",
      });

      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error).toContain("Salah satu dari Username atau Email wajib diisi");
      }
    });
  });

  describe("updateCredentialAction", () => {
    it("harus berhasil memperbarui metadata dan merotasi password baru", async () => {
      const { prisma, writeAudit } = await import("@pspk/db");

      vi.mocked(prisma.credential.findUnique).mockResolvedValue(sampleCredential);
      vi.mocked(prisma.credential.update).mockResolvedValue({
        ...sampleCredential,
        title: "Instagram Resmi PSPK (Updated)",
        passwordEnc: "enc:new:password",
      });

      const res = await updateCredentialAction({
        id: "cred-123",
        title: "Instagram Resmi PSPK (Updated)",
        category: "SOCIAL_MEDIA",
        username: "pspk.id",
        password: "NewPassword2026!",
      });

      expect(res.ok).toBe(true);
      expect(prisma.credential.update).toHaveBeenCalledTimes(1);
      expect(writeAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "UPDATE",
          entityType: "Credential",
          entityId: "cred-123",
        }),
      );
    });
  });

  describe("revealCredentialPasswordAction", () => {
    it("harus berhasil mendekripsi password dan mencatat audit log", async () => {
      const { prisma, writeAudit } = await import("@pspk/db");
      const encryptedSecret = encryptField("RahasiaNegara2026!");

      vi.mocked(prisma.credential.findUnique).mockResolvedValue({
        ...sampleCredential,
        id: "cred-999",
        title: "cPanel Hosting",
        category: "WEBSITE_HOSTING",
        username: "root_pspk",
        email: null,
        passwordEnc: encryptedSecret,
      });

      const res = await revealCredentialPasswordAction({ id: "cred-999" });

      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data.password).toBe("RahasiaNegara2026!");
        expect(res.data.title).toBe("cPanel Hosting");
      }

      // Verifikasi audit log pencatatan buka password
      expect(writeAudit).toHaveBeenCalledTimes(1);
      const auditCall = vi.mocked(writeAudit).mock.calls[0]?.[0];
      expect(auditCall?.action).toBe("REVEAL_PASSWORD");
      expect(auditCall?.entityId).toBe("cred-999");
    });

    it("harus menolak permintaan buka password jika otorisasi user tidak memiliki hak akses reveal", async () => {
      const { getAuthContext } = await import("@pspk/auth");

      // Mock user context tanpa permission reveal
      vi.mocked(getAuthContext).mockResolvedValueOnce({
        userId: "user-staff-1",
        employeeId: "emp-staff-1",
        roles: ["staff"],
        permissions: new Set(["sysmgmt.asset.read:own"]),
      });

      const res = await revealCredentialPasswordAction({ id: "cred-999" });

      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error).toBeDefined();
      }
    });

    it("harus menangani kegagalan dekripsi secara aman jika ciphertext tidak valid", async () => {
      const { prisma } = await import("@pspk/db");

      vi.mocked(prisma.credential.findUnique).mockResolvedValueOnce({
        ...sampleCredential,
        id: "cred-corrupted",
        passwordEnc: "corrupted:invalid:cipher",
      });

      const res = await revealCredentialPasswordAction({ id: "cred-corrupted" });

      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error).toContain("Gagal mendekripsi password");
      }
    });
  });

  describe("deleteCredentialAction", () => {
    it("harus berhasil menghapus kredensial dan mencatat audit log", async () => {
      const { prisma, writeAudit } = await import("@pspk/db");

      vi.mocked(prisma.credential.findUnique).mockResolvedValue({
        ...sampleCredential,
        id: "cred-del-1",
        title: "Twitter Lama",
        category: "SOCIAL_MEDIA",
        username: "pspk_old",
        email: null,
      });

      vi.mocked(prisma.credential.delete).mockResolvedValue(sampleCredential);

      const res = await deleteCredentialAction({ id: "cred-del-1" });

      expect(res.ok).toBe(true);
      expect(prisma.credential.delete).toHaveBeenCalledWith({ where: { id: "cred-del-1" } });
      expect(writeAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "DELETE",
          entityType: "Credential",
          entityId: "cred-del-1",
        }),
      );
    });
  });
});
