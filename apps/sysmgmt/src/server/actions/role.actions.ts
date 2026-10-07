"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma, writeAudit } from "@pspk/db";
import { getSession, getAuthContext } from "@pspk/auth";
import { assertCan, ForbiddenError, SYSTEM_ROLES } from "@pspk/rbac";
import { extractClientIp } from "@pspk/shared";

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

  // Wajib memiliki hak akses mengelola peran
  assertCan(authCtx, "sysmgmt.role.manage");

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
 * Server Action: Update Wewenang (Daftar Permissions) untuk Satu Peran Tertentu
 */
export async function updateRolePermissionsAction(input: {
  roleKey: string;
  permissionKeys: string[];
}) {
  try {
    const actor = await getActorInfo();

    // Proteksi: Super Admin tidak boleh dibatasi wewenangnya
    if (input.roleKey === "super_admin") {
      return {
        ok: false as const,
        error: "Wewenang peran Super Admin bersifat permanen (akses penuh) dan tidak dapat dikurangi.",
      };
    }

    const targetRole = await prisma.role.findUnique({
      where: { key: input.roleKey },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!targetRole) {
      return { ok: false as const, error: "Peran target tidak ditemukan." };
    }

    const currentKeys = targetRole.permissions.map((rp) => rp.permission.key);

    // Ambil record valid dari tabel core.permissions
    const validPermissions = await prisma.permission.findMany({
      where: { key: { in: input.permissionKeys } },
    });

    await prisma.$transaction(async (tx) => {
      // Hapus seluruh relasi permission lama untuk peran ini
      await tx.rolePermission.deleteMany({
        where: { roleId: targetRole.id },
      });

      // Tambahkan relasi permission baru
      if (validPermissions.length > 0) {
        await tx.rolePermission.createMany({
          data: validPermissions.map((p) => ({
            roleId: targetRole.id,
            permissionId: p.id,
          })),
        });
      }

      // Catat Audit Log
      await writeAudit(
        {
          actorUserId: actor.userId,
          actorEmail: actor.email,
          app: "sysmgmt",
          action: "PERMISSION_CHANGE",
          entityType: "RolePermission",
          entityId: targetRole.id,
          before: {
            roleKey: targetRole.key,
            roleName: targetRole.name,
            permissionCount: currentKeys.length,
            permissions: currentKeys,
          },
          after: {
            roleKey: targetRole.key,
            roleName: targetRole.name,
            permissionCount: validPermissions.length,
            permissions: validPermissions.map((p) => p.key),
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
      message: `Wewenang peran "${targetRole.name}" berhasil diperbarui (${validPermissions.length} izin aktif).`,
    };
  } catch (err: unknown) {
    if (err instanceof ForbiddenError) {
      return { ok: false as const, error: err.message };
    }
    console.error("updateRolePermissionsAction error:", err);
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Gagal memperbarui wewenang peran.",
    };
  }
}

/**
 * Server Action: Batch Update Matriks Wewenang (Menyimpan perubahan beberapa peran sekaligus)
 */
export async function batchUpdateRoleMatrixAction(input: {
  updates: Array<{ roleKey: string; permissionKeys: string[] }>;
}) {
  try {
    const actor = await getActorInfo();

    if (!input.updates || input.updates.length === 0) {
      return { ok: false as const, error: "Tidak ada data perubahan yang dikirim." };
    }

    // Filter keluar super_admin jika tidak sengaja terkirim
    const actionableUpdates = input.updates.filter((u) => u.roleKey !== "super_admin");

    if (actionableUpdates.length === 0) {
      return {
        ok: false as const,
        error: "Perubahan tidak dapat diterapkan pada peran Super Admin.",
      };
    }

    // Kumpulkan seluruh permission keys yang dibutuhkan
    const allRequestedKeys = Array.from(
      new Set(actionableUpdates.flatMap((u) => u.permissionKeys)),
    );

    const [validPermissions, allRoles] = await Promise.all([
      prisma.permission.findMany({
        where: { key: { in: allRequestedKeys } },
      }),
      prisma.role.findMany({
        where: { key: { in: actionableUpdates.map((u) => u.roleKey) } },
        include: {
          permissions: {
            include: { permission: true },
          },
        },
      }),
    ]);

    const permMap = new Map(validPermissions.map((p) => [p.key, p.id]));
    const roleMap = new Map(allRoles.map((r) => [r.key, r]));

    const updatedRoleNames: string[] = [];

    await prisma.$transaction(async (tx) => {
      for (const update of actionableUpdates) {
        const role = roleMap.get(update.roleKey);
        if (!role) continue;

        const currentKeys = role.permissions.map((rp) => rp.permission.key);
        const validIdsForThisRole = update.permissionKeys
          .map((k) => permMap.get(k))
          .filter((id): id is string => Boolean(id));

        // Hapus lama & tambah baru
        await tx.rolePermission.deleteMany({
          where: { roleId: role.id },
        });

        if (validIdsForThisRole.length > 0) {
          await tx.rolePermission.createMany({
            data: validIdsForThisRole.map((permId) => ({
              roleId: role.id,
              permissionId: permId,
            })),
          });
        }

        // Audit Log per peran yang diubah
        await writeAudit(
          {
            actorUserId: actor.userId,
            actorEmail: actor.email,
            app: "sysmgmt",
            action: "PERMISSION_CHANGE",
            entityType: "RolePermission",
            entityId: role.id,
            before: {
              roleKey: role.key,
              roleName: role.name,
              permissionCount: currentKeys.length,
              permissions: currentKeys,
            },
            after: {
              roleKey: role.key,
              roleName: role.name,
              permissionCount: validIdsForThisRole.length,
              permissions: update.permissionKeys,
            },
            ip: actor.ip,
            userAgent: actor.userAgent,
          },
          tx,
        );

        updatedRoleNames.push(role.name);
      }
    });

    revalidatePath("/pengguna");

    return {
      ok: true as const,
      message: `Berhasil menyimpan perubahan wewenang untuk peran: ${updatedRoleNames.join(", ")}.`,
    };
  } catch (err: unknown) {
    if (err instanceof ForbiddenError) {
      return { ok: false as const, error: err.message };
    }
    console.error("batchUpdateRoleMatrixAction error:", err);
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Gagal menyimpan perubahan matriks peran.",
    };
  }
}

/**
 * Server Action: Reset Wewenang Peran ke Standar Awal Sistem PSPK
 */
export async function resetRolePermissionsToDefaultAction(input?: {
  roleKey?: string;
}) {
  try {
    const actor = await getActorInfo();

    const rolesToReset = input?.roleKey
      ? SYSTEM_ROLES.filter((r) => r.key === input.roleKey && r.key !== "super_admin")
      : SYSTEM_ROLES.filter((r) => r.key !== "super_admin");

    if (rolesToReset.length === 0) {
      return {
        ok: false as const,
        error: "Tidak ada peran yang dapat di-reset (Peran Super Admin terkunci otomatis).",
      };
    }

    const allDbPermissions = await prisma.permission.findMany();
    const permMap = new Map(allDbPermissions.map((p) => [p.key, p.id]));

    await prisma.$transaction(async (tx) => {
      for (const roleDef of rolesToReset) {
        const role = await tx.role.findUnique({
          where: { key: roleDef.key },
          include: {
            permissions: { include: { permission: true } },
          },
        });

        if (!role) continue;

        const beforeKeys = role.permissions.map((rp) => rp.permission.key);

        // Hapus lama
        await tx.rolePermission.deleteMany({
          where: { roleId: role.id },
        });

        // Masukkan kembali default permissions dari SYSTEM_ROLES
        const targetPermIds = roleDef.permissions
          .map((k) => permMap.get(k))
          .filter((id): id is string => Boolean(id));

        if (targetPermIds.length > 0) {
          await tx.rolePermission.createMany({
            data: targetPermIds.map((permId) => ({
              roleId: role.id,
              permissionId: permId,
            })),
          });
        }

        // Audit Log
        await writeAudit(
          {
            actorUserId: actor.userId,
            actorEmail: actor.email,
            app: "sysmgmt",
            action: "PERMISSION_CHANGE",
            entityType: "RolePermissionReset",
            entityId: role.id,
            before: {
              roleKey: role.key,
              permissionCount: beforeKeys.length,
              permissions: beforeKeys,
            },
            after: {
              roleKey: role.key,
              permissionCount: targetPermIds.length,
              permissions: roleDef.permissions,
            },
            ip: actor.ip,
            userAgent: actor.userAgent,
          },
          tx,
        );
      }
    });

    revalidatePath("/pengguna");

    return {
      ok: true as const,
      message: input?.roleKey
        ? `Wewenang peran ${rolesToReset[0]?.name} berhasil dikembalikan ke standar awal sistem.`
        : "Seluruh wewenang peran operasional berhasil dikembalikan ke standar awal sistem PSPK.",
    };
  } catch (err: unknown) {
    if (err instanceof ForbiddenError) {
      return { ok: false as const, error: err.message };
    }
    console.error("resetRolePermissionsToDefaultAction error:", err);
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Gagal mengembalikan wewenang ke default.",
    };
  }
}

/**
 * Server Action: Update Teks Keterangan / Deskripsi Izin Tertentu
 */
export async function updatePermissionDescriptionAction(input: {
  permissionKey: string;
  description: string;
}) {
  try {
    const actor = await getActorInfo();

    const cleanDesc = input.description.trim();
    if (!cleanDesc) {
      return {
        ok: false as const,
        error: "Keterangan deskripsi wewenang tidak boleh kosong.",
      };
    }

    const permission = await prisma.permission.findUnique({
      where: { key: input.permissionKey },
    });

    if (!permission) {
      return { ok: false as const, error: "Izin tidak ditemukan di database." };
    }

    const beforeDesc = permission.description;

    await prisma.$transaction(async (tx) => {
      await tx.permission.update({
        where: { id: permission.id },
        data: { description: cleanDesc },
      });

      // Audit Log
      await writeAudit(
        {
          actorUserId: actor.userId,
          actorEmail: actor.email,
          app: "sysmgmt",
          action: "UPDATE",
          entityType: "PermissionDescription",
          entityId: permission.id,
          before: { key: permission.key, description: beforeDesc },
          after: { key: permission.key, description: cleanDesc },
          ip: actor.ip,
          userAgent: actor.userAgent,
        },
        tx,
      );
    });

    revalidatePath("/pengguna");

    return {
      ok: true as const,
      message: `Keterangan wewenang untuk "${permission.key}" berhasil diperbarui.`,
    };
  } catch (err: unknown) {
    if (err instanceof ForbiddenError) {
      return { ok: false as const, error: err.message };
    }
    console.error("updatePermissionDescriptionAction error:", err);
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Gagal memperbarui keterangan izin.",
    };
  }
}
