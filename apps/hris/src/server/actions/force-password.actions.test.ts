import { describe, it, expect, vi, beforeEach } from "vitest";
import { forceChangePasswordAction } from "./profile.actions";
import { auth, getSession } from "@pspk/auth";
import { prisma, writeAudit } from "@pspk/db";

// Mock @pspk/auth
vi.mock("@pspk/auth", () => ({
  auth: {
    api: {
      changePassword: vi.fn(),
    },
  },
  getSession: vi.fn(),
}));

// Mock @pspk/db
vi.mock("@pspk/db", () => ({
  prisma: {
    user: {
      update: vi.fn(),
    },
  },
  writeAudit: vi.fn(),
}));

// Mock next/headers
vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

// Mock next/cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

type MockSession = Awaited<ReturnType<typeof getSession>>;

describe("forceChangePasswordAction tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockSession: MockSession = {
    user: {
      id: "user-test-1",
      name: "Staf Baru",
      email: "staf.baru@pspk.id",
      emailVerified: true,
      mustChangePassword: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    session: {
      id: "sess-test-1",
      userId: "user-test-1",
      token: "tok-test-1",
      expiresAt: new Date(Date.now() + 86400000),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };

  it("harus menolak jika sesi telah kedaluwarsa atau tidak ada", async () => {
    vi.mocked(getSession).mockResolvedValueOnce(null);

    const res = await forceChangePasswordAction({
      currentPassword: "TempPassword123!",
      newPassword: "NewSecretPassword2026!",
      confirmPassword: "NewSecretPassword2026!",
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain("Sesi Anda telah kedaluwarsa");
  });

  it("harus menolak jika konfirmasi kata sandi tidak cocok", async () => {
    vi.mocked(getSession).mockResolvedValueOnce(mockSession);

    const res = await forceChangePasswordAction({
      currentPassword: "TempPassword123!",
      newPassword: "NewSecretPassword2026!",
      confirmPassword: "DifferentPassword2026!",
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain("Konfirmasi kata sandi baru tidak cocok");
  });

  it("harus menolak jika kata sandi baru sama dengan kata sandi sementara (aturan anti-reuse)", async () => {
    vi.mocked(getSession).mockResolvedValueOnce(mockSession);

    const res = await forceChangePasswordAction({
      currentPassword: "TempPassword123!",
      newPassword: "TempPassword123!",
      confirmPassword: "TempPassword123!",
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain("Kata sandi baru tidak boleh sama dengan kata sandi sementara");
  });

  it("harus menolak jika kata sandi baru kurang dari 8 karakter", async () => {
    vi.mocked(getSession).mockResolvedValueOnce(mockSession);

    const res = await forceChangePasswordAction({
      currentPassword: "TempPassword123!",
      newPassword: "Pass1!",
      confirmPassword: "Pass1!",
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain("minimal 8 karakter");
  });

  it("harus menolak jika kata sandi baru tidak memiliki angka", async () => {
    vi.mocked(getSession).mockResolvedValueOnce(mockSession);

    const res = await forceChangePasswordAction({
      currentPassword: "TempPassword123!",
      newPassword: "NoNumbersPassword!",
      confirmPassword: "NoNumbersPassword!",
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain("minimal 1 angka");
  });

  it("harus memproses dan memperbarui status mustChangePassword saat data valid", async () => {
    vi.mocked(getSession).mockResolvedValueOnce(mockSession);
    vi.mocked(auth.api.changePassword).mockResolvedValueOnce({} as never);
    vi.mocked(prisma.user.update).mockResolvedValueOnce({} as never);
    vi.mocked(writeAudit).mockResolvedValueOnce({} as never);

    const res = await forceChangePasswordAction({
      currentPassword: "TempPassword123!",
      newPassword: "ValidNewPassword2026!",
      confirmPassword: "ValidNewPassword2026!",
    });

    expect(res.success).toBe(true);
    expect(res.message).toContain("berhasil disimpan");

    // Pastikan API changePassword dipanggil dengan kata sandi yang sesuai
    expect(auth.api.changePassword).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          currentPassword: "TempPassword123!",
          newPassword: "ValidNewPassword2026!",
          revokeOtherSessions: true,
        }),
      }),
    );

    // Pastikan user diupdate dengan mustChangePassword = false
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-test-1" },
      data: expect.objectContaining({
        mustChangePassword: false,
        passwordChangedAt: expect.any(Date),
      }),
    });

    // Pastikan Audit Log ditulis
    expect(writeAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: "user-test-1",
        actorEmail: "staf.baru@pspk.id",
        app: "hris",
        action: "UPDATE",
        entityType: "UserPassword",
        entityId: "user-test-1",
        after: expect.objectContaining({
          event: "FIRST_LOGIN_PASSWORD_INITIALIZED",
        }),
      }),
    );
  });

  it("harus memberikan pesan kesalahan ramah jika Better Auth melempar error password salah", async () => {
    vi.mocked(getSession).mockResolvedValueOnce(mockSession);
    vi.mocked(auth.api.changePassword).mockRejectedValueOnce(
      new Error("Invalid password provided"),
    );

    const res = await forceChangePasswordAction({
      currentPassword: "WrongTempPassword123!",
      newPassword: "ValidNewPassword2026!",
      confirmPassword: "ValidNewPassword2026!",
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain("Kata sandi sementara yang Anda masukkan tidak sesuai");
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});
