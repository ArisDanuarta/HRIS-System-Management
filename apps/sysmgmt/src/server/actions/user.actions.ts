"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma, writeAudit } from "@pspk/db";
import { getSession, getAuthContext, hashPassword } from "@pspk/auth";
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

  const ip = reqHeaders.get("x-forwarded-for") || reqHeaders.get("x-real-ip") || "127.0.0.1";
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
export async function updateUserRolesSysAction(input: {
  userId: string;
  roleKeys: string[];
}) {
  try {
    const actor = await getActorInfo();

    if (!actor.isSuperAdmin && !actor.isAdminIt) {
      return {
        ok: false as const,
        error: "Hanya Super Admin atau Administrator IT yang memiliki wewenang untuk mengubah peran pengguna.",
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
          error: "Tidak dapat mencabut peran Super Admin. Sistem wajib memiliki minimal satu Super Admin aktif.",
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
export async function toggleUserStatusAction(input: {
  userId: string;
  isActive: boolean;
}) {
  try {
    const actor = await getActorInfo();

    if (!actor.isSuperAdmin && !actor.isAdminIt) {
      return {
        ok: false as const,
        error: "Hanya Super Admin atau Administrator IT yang memiliki wewenang untuk mengubah status akun.",
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

    if (!actor.isSuperAdmin && !actor.isAdminIt) {
      return {
        ok: false as const,
        error: "Hanya Super Admin atau Administrator IT yang memiliki wewenang untuk mengatur ulang kata sandi pengguna.",
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
    console.error("resetUserPasswordAction error:", err);
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Gagal mengatur ulang kata sandi pengguna.",
    };
  }
}
