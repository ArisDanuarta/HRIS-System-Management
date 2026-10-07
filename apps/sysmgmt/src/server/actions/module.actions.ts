"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import {
  prisma,
  writeAudit,
  SYSTEM_MODULE_DEFINITIONS,
} from "@pspk/db";
import { getSession, getAuthContext } from "@pspk/auth";
import { assertCan, ForbiddenError } from "@pspk/rbac";
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

  // Wajib memiliki hak akses mengelola peran/sistem
  assertCan(authCtx, "sysmgmt.role.manage");

  const ip = extractClientIp(reqHeaders);
  const userAgent = reqHeaders.get("user-agent") || "unknown";

  return {
    userId: session.user.id,
    email: session.user.email,
    authCtx,
    ip,
    userAgent,
  };
}

/**
 * Server Action: Mengaktifkan atau menonaktifkan status modul sistem.
 */
export async function toggleModuleAction(input: {
  moduleKey: string;
  enabled: boolean;
}) {
  try {
    const actor = await getActorInfo();

    const moduleKey = input.moduleKey?.trim();
    if (!moduleKey) {
      return {
        ok: false as const,
        error: "Kunci modul tidak boleh kosong.",
      };
    }

    if (typeof input.enabled !== "boolean") {
      return {
        ok: false as const,
        error: "Status aktif modul harus berupa boolean (true/false).",
      };
    }

    const enabled = input.enabled;

    // Cari definisi modul yang cocok
    const def = SYSTEM_MODULE_DEFINITIONS.find(
      (m) => m.moduleKey === moduleKey || m.key === moduleKey,
    );

    if (!def) {
      return {
        ok: false as const,
        error: `Modul dengan kunci "${moduleKey}" tidak terdaftar dalam sistem.`,
      };
    }

    // Ambil status sebelum mutasi
    const beforeSetting = await prisma.systemSetting.findUnique({
      where: { key: def.key },
    });
    const prevEnabled = beforeSetting
      ? beforeSetting.value === "true"
      : def.defaultEnabled;

    if (prevEnabled === enabled) {
      return {
        ok: true as const,
        message: `Modul "${def.name}" sudah berstatus ${enabled ? "aktif" : "nonaktif"}.`,
      };
    }

    // Eksekusi pembaruan dan audit log dalam transaksi atomik
    await prisma.$transaction(async (tx) => {
      await tx.systemSetting.upsert({
        where: { key: def.key },
        update: {
          value: String(enabled),
          updatedBy: actor.email,
        },
        create: {
          key: def.key,
          value: String(enabled),
          category: "MODULE",
          description: def.description,
          updatedBy: actor.email,
        },
      });

      await writeAudit(
        {
          actorUserId: actor.userId,
          actorEmail: actor.email,
          app: "sysmgmt",
          action: "UPDATE",
          entityType: "SystemModuleSetting",
          entityId: def.key,
          before: {
            key: def.key,
            moduleKey: def.moduleKey,
            name: def.name,
            enabled: prevEnabled,
          },
          after: {
            key: def.key,
            moduleKey: def.moduleKey,
            name: def.name,
            enabled,
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
      message: `Modul "${def.name}" berhasil ${enabled ? "diaktifkan" : "dinonaktifkan"}.`,
    };
  } catch (err: unknown) {
    if (err instanceof ForbiddenError) {
      return { ok: false as const, error: err.message };
    }
    console.error("toggleModuleAction error:", err);
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Gagal mengubah status modul sistem.",
    };
  }
}

/**
 * Server Action: Mengembalikan seluruh konfigurasi modul sistem ke standar bawaan.
 */
export async function resetAllModulesToDefaultAction() {
  try {
    const actor = await getActorInfo();

    await prisma.$transaction(async (tx) => {
      for (const def of SYSTEM_MODULE_DEFINITIONS) {
        await tx.systemSetting.upsert({
          where: { key: def.key },
          update: {
            value: String(def.defaultEnabled),
            updatedBy: actor.email,
          },
          create: {
            key: def.key,
            value: String(def.defaultEnabled),
            category: "MODULE",
            description: def.description,
            updatedBy: actor.email,
          },
        });
      }

      await writeAudit(
        {
          actorUserId: actor.userId,
          actorEmail: actor.email,
          app: "sysmgmt",
          action: "UPDATE",
          entityType: "SystemModuleSetting",
          entityId: "ALL_MODULES",
          before: { note: "Kustomisasi modul sebelumnya" },
          after: {
            note: "Direset ke default sistem",
            modules: SYSTEM_MODULE_DEFINITIONS.map((m) => ({
              key: m.key,
              enabled: m.defaultEnabled,
            })),
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
      message: "Seluruh modul sistem berhasil dikembalikan ke pengaturan default.",
    };
  } catch (err: unknown) {
    if (err instanceof ForbiddenError) {
      return { ok: false as const, error: err.message };
    }
    console.error("resetAllModulesToDefaultAction error:", err);
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Gagal mengembalikan modul ke default.",
    };
  }
}
