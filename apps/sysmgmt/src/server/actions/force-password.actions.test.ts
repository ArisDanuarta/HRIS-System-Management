import { describe, it, expect, vi, beforeEach } from "vitest";
import { forceChangePasswordSysAction } from "./user.actions";
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
  getAuthContext: vi.fn(),
  hashPassword: vi.fn(),
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

describe("forceChangePasswordSysAction tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockAdminSession: MockSession = {
    user: {
      id: "admin-test-1",
      name: "Admin IT PSPK",
      email: "admin.it@pspk.id",
      emailVerified: true,
      mustChangePassword: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    session: {
      id: "sess-admin-1",
      userId: "admin-test-1",
      token: "tok-admin-1",
      expiresAt: new Date(Date.now() + 86400000),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };

  it("harus menolak jika sesi telah kedaluwarsa atau tidak ada", async () => {
    vi.mocked(getSession).mockResolvedValueOnce(null);

    const res = await forceChangePasswordSysAction({
      currentPassword: "TempPassword123!",
      newPassword: "NewSysPassword2026!",
      confirmPassword: "NewSysPassword2026!",
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain("Sesi Anda telah kedaluwarsa");
  });

  it("harus menolak jika kata sandi baru sama dengan kata sandi sementara", async () => {
    vi.mocked(getSession).mockResolvedValueOnce(mockAdminSession);

    const res = await forceChangePasswordSysAction({
      currentPassword: "TempPassword123!",
      newPassword: "TempPassword123!",
      confirmPassword: "TempPassword123!",
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain("Kata sandi baru tidak boleh sama dengan kata sandi sementara");
  });

  it("harus sukses memperbarui status dan menulis audit log sysmgmt", async () => {
    vi.mocked(getSession).mockResolvedValueOnce(mockAdminSession);
    vi.mocked(auth.api.changePassword).mockResolvedValueOnce({} as never);
    vi.mocked(prisma.user.update).mockResolvedValueOnce({} as never);
    vi.mocked(writeAudit).mockResolvedValueOnce({} as never);

    const res = await forceChangePasswordSysAction({
      currentPassword: "TempPassword123!",
      newPassword: "ValidSysPassword2026!",
      confirmPassword: "ValidSysPassword2026!",
    });

    expect(res.success).toBe(true);
    expect(res.message).toContain("berhasil disimpan");

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "admin-test-1" },
      data: expect.objectContaining({
        mustChangePassword: false,
        passwordChangedAt: expect.any(Date),
      }),
    });

    expect(writeAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: "admin-test-1",
        actorEmail: "admin.it@pspk.id",
        app: "sysmgmt",
        action: "UPDATE",
        entityType: "UserPassword",
      }),
    );
  });
});
