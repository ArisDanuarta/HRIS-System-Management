"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma, writeAudit } from "@pspk/db";
import { auth, getSession, getAuthContext, hashPassword } from "@pspk/auth";
import { assertCan, ForbiddenError } from "@pspk/rbac";
import { extractClientIp } from "@pspk/shared";
import { generateSecureTemporaryPassword } from "../services/password.service";

async function getActorInfo() {
  const reqHeaders = await headers();
  const session = await getSession(reqHeaders);

  if (!session?.user) {
    throw new Error("Sesi Anda telah kedaluwarsa. Silakan masuk kembali.");
  }

  const authCtx = await getAuthContext(session.user.id);
  if (!authCtx) {
    throw new Error("Pengguna tidak aktif atau hak akses tidak valid.");
  }

  const isSuperAdmin = authCtx.roles.includes("super_admin");
  const isAdminIt = authCtx.roles.includes("admin_it");

  const ip = extractClientIp(reqHeaders);
  const userAgent = reqHeaders.get("user-agent") || "unknown";

  return {
    userId: session.user.id,
    email: session.user.email,
    authCtx,
    isSuperAdmin,
    isAdminIt,
    ip,
    userAgent,
  };
}

/**
 * Server Action: Update User Roles in System Management (RBAC)
 */
export async function updateUserRolesSysAction(input: { userId: string; roleKeys: string[] }) {
  try {
    const actor = await getActorInfo();
    assertCan(actor.authCtx, "sysmgmt.user.manage");

    if (!actor.isSuperAdmin && !actor.isAdminIt) {
      return {
        ok: false as const,
        error:
          "Hanya Super Admin atau Administrator IT yang memiliki wewenang untuk mengubah peran pengguna.",
      };
    }

    if (!input.roleKeys || input.roleKeys.length === 0) {
      return {
        ok: false as const,
        error: "Pengguna wajib memiliki minimal satu peran aktif.",
      };
    }

    // Admin IT cannot grant or revoke super_admin role
    if (!actor.isSuperAdmin) {
      if (input.roleKeys.includes("super_admin")) {
        return {
          ok: false as const,
          error: "Hanya Super Admin yang berhak menugaskan peran Super Admin.",
        };
      }
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: input.userId },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!targetUser) {
      return { ok: false as const, error: "Pengguna tidak ditemukan." };
    }

    const currentRoleKeys = targetUser.roles.map((r) => r.role.key);

    // Admin IT tidak boleh mengubah peran dari akun yang saat ini adalah super_admin
    if (!actor.isSuperAdmin && currentRoleKeys.includes("super_admin")) {
      return {
        ok: false as const,
        error: "Administrator IT tidak dapat mengubah peran pengguna Super Admin.",
      };
    }

    // Proteksi: Super Admin terakhir tidak boleh dicabut rolenya
    if (currentRoleKeys.includes("super_admin") && !input.roleKeys.includes("super_admin")) {
      const activeSuperAdminCount = await prisma.userRole.count({
        where: {
          role: { key: "super_admin" },
          user: { isActive: true },
        },
      });

      if (activeSuperAdminCount <= 1) {
        return {
          ok: false as const,
          error:
            "Tidak dapat mencabut peran Super Admin. Sistem wajib memiliki minimal satu Super Admin aktif.",
        };
      }
    }

    // Ambil valid roles dari DB
    const validRoles = await prisma.role.findMany({
      where: { key: { in: input.roleKeys } },
    });

    if (validRoles.length === 0) {
      return { ok: false as const, error: "Daftar peran yang dipilih tidak valid." };
    }

    await prisma.$transaction(async (tx) => {
      // Hapus roles lama
      await tx.userRole.deleteMany({
        where: { userId: targetUser.id },
      });

      // Tambahkan roles baru
      await tx.userRole.createMany({
        data: validRoles.map((r) => ({
          userId: targetUser.id,
          roleId: r.id,
        })),
      });

      // Audit Log
      await writeAudit(
        {
          actorUserId: actor.userId,
          actorEmail: actor.email,
          app: "sysmgmt",
          action: "UPDATE",
          entityType: "UserRole",
          entityId: targetUser.id,
          before: { roles: currentRoleKeys },
          after: { roles: validRoles.map((r) => r.key) },
          ip: actor.ip,
          userAgent: actor.userAgent,
        },
        tx,
      );
    });

    revalidatePath("/pengguna");

    return {
      ok: true as const,
      message: `Peran untuk ${targetUser.name || targetUser.email} berhasil diperbarui menjadi: ${validRoles.map((r) => r.name).join(", ")}.`,
    };
  } catch (err: unknown) {
    if (err instanceof ForbiddenError) {
      return { ok: false as const, error: err.message };
    }
    console.error("updateUserRolesSysAction error:", err);
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Gagal memperbarui peran pengguna.",
    };
  }
}

/**
 * Server Action: Toggle User Active Status
 */
export async function toggleUserStatusAction(input: { userId: string; isActive: boolean }) {
  try {
    const actor = await getActorInfo();
    assertCan(actor.authCtx, "sysmgmt.user.manage");

    if (!actor.isSuperAdmin && !actor.isAdminIt) {
      return {
        ok: false as const,
        error:
          "Hanya Super Admin atau Administrator IT yang memiliki wewenang untuk mengubah status akun.",
      };
    }

    // Cegah lockout diri sendiri
    if (input.userId === actor.userId) {
      return {
        ok: false as const,
        error: "Anda tidak dapat menonaktifkan akun Anda sendiri.",
      };
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: input.userId },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!targetUser) {
      return { ok: false as const, error: "Pengguna tidak ditemukan." };
    }

    const isTargetSuperAdmin = targetUser.roles.some((r) => r.role.key === "super_admin");

    // Admin IT tidak boleh menonaktifkan Super Admin
    if (!actor.isSuperAdmin && isTargetSuperAdmin) {
      return {
        ok: false as const,
        error: "Administrator IT tidak dapat menonaktifkan akun Super Admin.",
      };
    }

    // Proteksi: Tidak boleh menonaktifkan Super Admin terakhir
    if (isTargetSuperAdmin && !input.isActive) {
      const activeSuperAdminCount = await prisma.userRole.count({
        where: {
          role: { key: "super_admin" },
          user: { isActive: true },
        },
      });

      if (activeSuperAdminCount <= 1) {
        return {
          ok: false as const,
          error: "Tidak dapat menonaktifkan Super Admin terakhir yang masih aktif.",
        };
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: targetUser.id },
        data: { isActive: input.isActive },
      });

      // Audit Log
      await writeAudit(
        {
          actorUserId: actor.userId,
          actorEmail: actor.email,
          app: "sysmgmt",
          action: "UPDATE",
          entityType: "UserStatus",
          entityId: targetUser.id,
          before: { isActive: targetUser.isActive },
          after: { isActive: input.isActive },
          ip: actor.ip,
          userAgent: actor.userAgent,
        },
        tx,
      );
    });

    revalidatePath("/pengguna");

    return {
      ok: true as const,
      message: `Akun ${targetUser.name || targetUser.email} berhasil ${input.isActive ? "diaktifkan" : "dinonaktifkan"}.`,
    };
  } catch (err: unknown) {
    if (err instanceof ForbiddenError) {
      return { ok: false as const, error: err.message };
    }
    console.error("toggleUserStatusAction error:", err);
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Gagal mengubah status akun pengguna.",
    };
  }
}

/**
 * Server Action: Reset User Password
 */
export async function resetUserPasswordAction(input: { userId: string }) {
  try {
    const actor = await getActorInfo();
    assertCan(actor.authCtx, "sysmgmt.user.manage");

    if (!actor.isSuperAdmin && !actor.isAdminIt) {
      return {
        ok: false as const,
        error:
          "Hanya Super Admin atau Administrator IT yang memiliki wewenang untuk mengatur ulang kata sandi pengguna.",
      };
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: input.userId },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!targetUser) {
      return { ok: false as const, error: "Pengguna tidak ditemukan." };
    }

    const isTargetSuperAdmin = targetUser.roles.some((r) => r.role.key === "super_admin");

    // Admin IT tidak boleh mereset kata sandi Super Admin
    if (!actor.isSuperAdmin && isTargetSuperAdmin) {
      return {
        ok: false as const,
        error: "Administrator IT tidak dapat mengatur ulang kata sandi akun Super Admin.",
      };
    }

    const temporaryPassword = generateSecureTemporaryPassword();
    const hashedPassword = await hashPassword(temporaryPassword);

    await prisma.$transaction(async (tx) => {
      // Tandai akun pengguna wajib mengganti kata sandi pada login berikutnya
      await tx.user.update({
        where: { id: targetUser.id },
        data: { mustChangePassword: true },
      });

      // Upsert password di tabel core.accounts
      const existingAcc = await tx.account.findFirst({
        where: { userId: targetUser.id, providerId: "credential" },
      });

      if (!existingAcc) {
        await tx.account.create({
          data: {
            userId: targetUser.id,
            accountId: targetUser.id,
            providerId: "credential",
            password: hashedPassword,
          },
        });
      } else {
        await tx.account.update({
          where: { id: existingAcc.id },
          data: { password: hashedPassword },
        });
      }

      // Hapus seluruh active session user ini agar harus login ulang dengan password baru
      await tx.session.deleteMany({
        where: { userId: targetUser.id },
      });

      // Audit Log (PERINGATAN: Password plaintext tidak boleh dicatat di audit log!)
      await writeAudit(
        {
          actorUserId: actor.userId,
          actorEmail: actor.email,
          app: "sysmgmt",
          action: "UPDATE",
          entityType: "UserPasswordReset",
          entityId: targetUser.id,
          after: {
            targetUserEmail: targetUser.email,
            resetBy: actor.email,
          },
          ip: actor.ip,
          userAgent: actor.userAgent,
        },
        tx,
      );
    });

    revalidatePath("/pengguna");

    return {
      ok: true as const,
      message: `Kata sandi untuk ${targetUser.name || targetUser.email} berhasil diatur ulang.`,
      credentials: {
        email: targetUser.email,
        temporaryPassword,
      },
    };
  } catch (err: unknown) {
    if (err instanceof ForbiddenError) {
      return { ok: false as const, error: err.message };
    }
    console.error("resetUserPasswordAction error:", err);
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Gagal mengatur ulang kata sandi pengguna.",
    };
  }
}

const forceChangePasswordSysSchema = z
  .object({
    currentPassword: z.string().min(1, "Kata sandi sementara wajib diisi"),
    newPassword: z
      .string()
      .min(8, "Kata sandi baru minimal 8 karakter")
      .regex(/[a-z]/, "Wajib mengandung minimal 1 huruf kecil")
      .regex(/[A-Z]/, "Wajib mengandung minimal 1 huruf besar")
      .regex(/[0-9]/, "Wajib mengandung minimal 1 angka"),
    confirmPassword: z.string().min(1, "Konfirmasi kata sandi wajib diisi"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Konfirmasi kata sandi baru tidak cocok",
    path: ["confirmPassword"],
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: "Kata sandi baru tidak boleh sama dengan kata sandi sementara",
    path: ["newPassword"],
  });

export type ForceChangePasswordSysInput = z.infer<typeof forceChangePasswordSysSchema>;

/**
 * Server Action: Wajib ganti kata sandi pada login pertama / setelah reset (System Management)
 */
export async function forceChangePasswordSysAction(data: ForceChangePasswordSysInput) {
  try {
    const validated = forceChangePasswordSysSchema.parse(data);
    const reqHeaders = await headers();
    const session = await getSession(reqHeaders);

    if (!session?.user?.id) {
      return {
        success: false,
        error: "Sesi Anda telah kedaluwarsa. Silakan masuk kembali.",
      };
    }

    try {
      await auth.api.changePassword({
        body: {
          currentPassword: validated.currentPassword,
          newPassword: validated.newPassword,
          revokeOtherSessions: true,
        },
        headers: reqHeaders,
      });
    } catch (authErr: unknown) {
      console.error("Better Auth forceChangePasswordSys error:", authErr);
      const errMsg = authErr instanceof Error ? authErr.message : String(authErr);
      if (
        errMsg.toLowerCase().includes("invalid password") ||
        errMsg.toLowerCase().includes("password is incorrect") ||
        errMsg.toLowerCase().includes("credentials")
      ) {
        return {
          success: false,
          error: "Kata sandi sementara yang Anda masukkan tidak sesuai dengan yang diberikan.",
        };
      }
      return {
        success: false,
        error: "Gagal memperbarui kata sandi. Pastikan data sudah sesuai ketentuan.",
      };
    }

    // Perbarui status mustChangePassword menjadi false dan catat waktu perubahan
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        mustChangePassword: false,
        passwordChangedAt: new Date(),
      },
    });

    const ip = extractClientIp(reqHeaders);
    const userAgent = reqHeaders.get("user-agent") || "unknown";

    // Catat log audit resmi
    await writeAudit({
      actorUserId: session.user.id,
      actorEmail: session.user.email,
      app: "sysmgmt",
      action: "UPDATE",
      entityType: "UserPassword",
      entityId: session.user.id,
      after: {
        event: "FIRST_LOGIN_PASSWORD_INITIALIZED",
        email: session.user.email,
        revokedOtherSessions: true,
      },
      ip,
      userAgent,
    });

    revalidatePath("/", "layout");

    return {
      success: true,
      message: "Kata sandi baru Anda berhasil disimpan. Mengalihkan ke dashboard...",
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message || "Validasi formulir gagal",
      };
    }
    console.error("forceChangePasswordSysAction unexpected error:", error);
    return {
      success: false,
      error: "Terjadi kesalahan internal pada server. Silakan coba beberapa saat lagi.",
    };
  }
}
