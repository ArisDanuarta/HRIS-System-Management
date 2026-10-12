"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma, writeAudit } from "@pspk/db";
import { getSession, getAuthContext } from "@pspk/auth";
import { assertCan } from "@pspk/rbac";
import { extractClientIp } from "@pspk/shared";
import {
  createDocumentCategorySchema,
  updateDocumentCategorySchema,
  deleteDocumentCategorySchema,
  toggleDocumentCategoryStatusSchema,
  createAssetTypeSchema,
  updateAssetTypeSchema,
  deleteAssetTypeSchema,
  toggleAssetTypeStatusSchema,
  createAssetLocationSchema,
  updateAssetLocationSchema,
  deleteAssetLocationSchema,
  toggleAssetLocationStatusSchema,
  updateSystemPreferencesSchema,
  CreateDocumentCategoryInput,
  UpdateDocumentCategoryInput,
  CreateAssetTypeInput,
  UpdateAssetTypeInput,
  CreateAssetLocationInput,
  UpdateAssetLocationInput,
  UpdateSystemPreferencesInput,
} from "../schemas/settings.schema";

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

  assertCan(authCtx, "sysmgmt.settings.manage");

  const ip = extractClientIp(reqHeaders);
  const userAgent = reqHeaders.get("user-agent") || "unknown";

  return {
    userId: session.user.id,
    email: session.user.email,
    ip,
    userAgent,
  };
}

// ==========================================
// 1. ACTION KATEGORI DOKUMEN
// ==========================================

export async function createDocumentCategoryAction(rawInput: CreateDocumentCategoryInput) {
  try {
    const actor = await getActorInfo();
    const parsed = createDocumentCategorySchema.safeParse(rawInput);

    if (!parsed.success) {
      return {
        ok: false as const,
        error: parsed.error.issues[0]?.message || "Data kategori dokumen tidak valid.",
      };
    }

    const { name, codePrefix, description, color, isActive } = parsed.data;

    // Cek duplikasi nama
    const existingName = await prisma.documentCategory.findUnique({ where: { name } });
    if (existingName) {
      return { ok: false as const, error: `Kategori dengan nama "${name}" sudah terdaftar.` };
    }

    // Cek duplikasi prefix
    const existingPrefix = await prisma.documentCategory.findUnique({ where: { codePrefix } });
    if (existingPrefix) {
      return { ok: false as const, error: `Prefix kode "${codePrefix}" sudah digunakan oleh kategori lain.` };
    }

    const category = await prisma.documentCategory.create({
      data: {
        name,
        codePrefix,
        description: description ?? null,
        color: color ?? "blue",
        isActive: isActive ?? true,
      },
    });

    await writeAudit({
      actorUserId: actor.userId,
      actorEmail: actor.email,
      app: "sysmgmt",
      action: "CREATE",
      entityType: "DocumentCategory",
      entityId: category.id,
      after: {
        id: category.id,
        name: category.name,
        codePrefix: category.codePrefix,
        color: category.color,
        isActive: category.isActive,
      },
      ip: actor.ip,
      userAgent: actor.userAgent,
    });

    revalidatePath("/pengaturan");
    revalidatePath("/dokumen");

    return { ok: true as const, data: category };
  } catch (error) {
    console.error("Gagal membuat kategori dokumen:", error);
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Terjadi kesalahan sistem saat membuat kategori.",
    };
  }
}

export async function updateDocumentCategoryAction(rawInput: UpdateDocumentCategoryInput) {
  try {
    const actor = await getActorInfo();
    const parsed = updateDocumentCategorySchema.safeParse(rawInput);

    if (!parsed.success) {
      return {
        ok: false as const,
        error: parsed.error.issues[0]?.message || "Data kategori dokumen tidak valid.",
      };
    }

    const { id, name, codePrefix, description, color, isActive } = parsed.data;

    const existing = await prisma.documentCategory.findUnique({ where: { id } });
    if (!existing) {
      return { ok: false as const, error: "Kategori dokumen tidak ditemukan." };
    }

    // Cek duplikasi nama jika berubah
    if (name !== existing.name) {
      const duplicateName = await prisma.documentCategory.findUnique({ where: { name } });
      if (duplicateName) {
        return { ok: false as const, error: `Kategori dengan nama "${name}" sudah terdaftar.` };
      }
    }

    // Cek duplikasi prefix jika berubah
    if (codePrefix !== existing.codePrefix) {
      const duplicatePrefix = await prisma.documentCategory.findUnique({ where: { codePrefix } });
      if (duplicatePrefix) {
        return { ok: false as const, error: `Prefix kode "${codePrefix}" sudah digunakan oleh kategori lain.` };
      }
    }

    const updated = await prisma.documentCategory.update({
      where: { id },
      data: {
        name,
        codePrefix,
        description: description ?? null,
        color: color ?? existing.color,
        isActive: isActive !== undefined ? isActive : existing.isActive,
      },
    });

    await writeAudit({
      actorUserId: actor.userId,
      actorEmail: actor.email,
      app: "sysmgmt",
      action: "UPDATE",
      entityType: "DocumentCategory",
      entityId: id,
      before: {
        name: existing.name,
        codePrefix: existing.codePrefix,
        color: existing.color,
        isActive: existing.isActive,
      },
      after: {
        name: updated.name,
        codePrefix: updated.codePrefix,
        color: updated.color,
        isActive: updated.isActive,
      },
      ip: actor.ip,
      userAgent: actor.userAgent,
    });

    revalidatePath("/pengaturan");
    revalidatePath("/dokumen");

    return { ok: true as const, data: updated };
  } catch (error) {
    console.error("Gagal memperbarui kategori dokumen:", error);
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Terjadi kesalahan sistem saat memperbarui kategori.",
    };
  }
}

export async function toggleDocumentCategoryStatusAction(input: { id: string }) {
  try {
    const actor = await getActorInfo();
    const parsed = toggleDocumentCategoryStatusSchema.safeParse(input);

    if (!parsed.success) {
      return { ok: false as const, error: "ID kategori dokumen wajib disertakan." };
    }

    const existing = await prisma.documentCategory.findUnique({ where: { id: parsed.data.id } });
    if (!existing) {
      return { ok: false as const, error: "Kategori dokumen tidak ditemukan." };
    }

    const updated = await prisma.documentCategory.update({
      where: { id: existing.id },
      data: { isActive: !existing.isActive },
    });

    await writeAudit({
      actorUserId: actor.userId,
      actorEmail: actor.email,
      app: "sysmgmt",
      action: "UPDATE",
      entityType: "DocumentCategory",
      entityId: existing.id,
      before: { isActive: existing.isActive },
      after: { isActive: updated.isActive },
      ip: actor.ip,
      userAgent: actor.userAgent,
    });

    revalidatePath("/pengaturan");
    revalidatePath("/dokumen");

    return { ok: true as const, data: updated };
  } catch (error) {
    console.error("Gagal mengubah status kategori:", error);
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Terjadi kesalahan sistem saat mengubah status kategori.",
    };
  }
}

export async function deleteDocumentCategoryAction(input: { id: string }) {
  try {
    const actor = await getActorInfo();
    const parsed = deleteDocumentCategorySchema.safeParse(input);

    if (!parsed.success) {
      return { ok: false as const, error: "ID kategori dokumen wajib disertakan." };
    }

    const existing = await prisma.documentCategory.findUnique({
      where: { id: parsed.data.id },
      include: {
        _count: {
          select: { documents: true },
        },
      },
    });

    if (!existing) {
      return { ok: false as const, error: "Kategori dokumen tidak ditemukan." };
    }

    // Cek keterikatan dokumen
    const legacyDocCount = await prisma.document.count({
      where: {
        OR: [{ categoryId: existing.id }, { category: existing.name }],
      },
    });

    if (existing._count.documents > 0 || legacyDocCount > 0) {
      const count = Math.max(existing._count.documents, legacyDocCount);
      return {
        ok: false as const,
        error: `Kategori "${existing.name}" tidak dapat dihapus karena masih digunakan oleh ${count} dokumen. Anda dapat menonaktifkannya agar tidak muncul di form dokumen baru.`,
      };
    }

    await prisma.documentCategory.delete({ where: { id: existing.id } });

    await writeAudit({
      actorUserId: actor.userId,
      actorEmail: actor.email,
      app: "sysmgmt",
      action: "DELETE",
      entityType: "DocumentCategory",
      entityId: existing.id,
      before: {
        id: existing.id,
        name: existing.name,
        codePrefix: existing.codePrefix,
      },
      ip: actor.ip,
      userAgent: actor.userAgent,
    });

    revalidatePath("/pengaturan");
    revalidatePath("/dokumen");

    return { ok: true as const, id: existing.id };
  } catch (error) {
    console.error("Gagal menghapus kategori dokumen:", error);
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Terjadi kesalahan sistem saat menghapus kategori dokumen.",
    };
  }
}

// ==========================================
// 2. ACTION MASTER TIPE ASET
// ==========================================

export async function createAssetTypeAction(rawInput: CreateAssetTypeInput) {
  try {
    const actor = await getActorInfo();
    const parsed = createAssetTypeSchema.safeParse(rawInput);

    if (!parsed.success) {
      return {
        ok: false as const,
        error: parsed.error.issues[0]?.message || "Data tipe aset tidak valid.",
      };
    }

    const { name, category, description, isActive } = parsed.data;

    const existing = await prisma.assetType.findUnique({ where: { name } });
    if (existing) {
      return { ok: false as const, error: `Tipe aset "${name}" sudah terdaftar.` };
    }

    const created = await prisma.assetType.create({
      data: {
        name,
        category,
        description: description ?? null,
        isActive: isActive ?? true,
      },
    });

    await writeAudit({
      actorUserId: actor.userId,
      actorEmail: actor.email,
      app: "sysmgmt",
      action: "CREATE",
      entityType: "AssetType",
      entityId: created.id,
      after: {
        id: created.id,
        name: created.name,
        category: created.category,
        isActive: created.isActive,
      },
      ip: actor.ip,
      userAgent: actor.userAgent,
    });

    revalidatePath("/pengaturan");
    revalidatePath("/aset");

    return { ok: true as const, data: created };
  } catch (error) {
    console.error("Gagal membuat tipe aset:", error);
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Terjadi kesalahan sistem saat membuat tipe aset.",
    };
  }
}

export async function updateAssetTypeAction(rawInput: UpdateAssetTypeInput) {
  try {
    const actor = await getActorInfo();
    const parsed = updateAssetTypeSchema.safeParse(rawInput);

    if (!parsed.success) {
      return {
        ok: false as const,
        error: parsed.error.issues[0]?.message || "Data tipe aset tidak valid.",
      };
    }

    const { id, name, category, description, isActive } = parsed.data;

    const existing = await prisma.assetType.findUnique({ where: { id } });
    if (!existing) {
      return { ok: false as const, error: "Tipe aset tidak ditemukan." };
    }

    if (name !== existing.name) {
      const duplicate = await prisma.assetType.findUnique({ where: { name } });
      if (duplicate) {
        return { ok: false as const, error: `Tipe aset "${name}" sudah terdaftar.` };
      }
    }

    const updated = await prisma.assetType.update({
      where: { id },
      data: {
        name,
        category,
        description: description ?? null,
        isActive: isActive !== undefined ? isActive : existing.isActive,
      },
    });

    await writeAudit({
      actorUserId: actor.userId,
      actorEmail: actor.email,
      app: "sysmgmt",
      action: "UPDATE",
      entityType: "AssetType",
      entityId: id,
      before: {
        name: existing.name,
        category: existing.category,
        isActive: existing.isActive,
      },
      after: {
        name: updated.name,
        category: updated.category,
        isActive: updated.isActive,
      },
      ip: actor.ip,
      userAgent: actor.userAgent,
    });

    revalidatePath("/pengaturan");
    revalidatePath("/aset");

    return { ok: true as const, data: updated };
  } catch (error) {
    console.error("Gagal memperbarui tipe aset:", error);
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Terjadi kesalahan sistem saat memperbarui tipe aset.",
    };
  }
}

export async function toggleAssetTypeStatusAction(input: { id: string }) {
  try {
    const actor = await getActorInfo();
    const parsed = toggleAssetTypeStatusSchema.safeParse(input);

    if (!parsed.success) {
      return { ok: false as const, error: "ID tipe aset wajib disertakan." };
    }

    const existing = await prisma.assetType.findUnique({ where: { id: parsed.data.id } });
    if (!existing) {
      return { ok: false as const, error: "Tipe aset tidak ditemukan." };
    }

    const updated = await prisma.assetType.update({
      where: { id: existing.id },
      data: { isActive: !existing.isActive },
    });

    await writeAudit({
      actorUserId: actor.userId,
      actorEmail: actor.email,
      app: "sysmgmt",
      action: "UPDATE",
      entityType: "AssetType",
      entityId: existing.id,
      before: { isActive: existing.isActive },
      after: { isActive: updated.isActive },
      ip: actor.ip,
      userAgent: actor.userAgent,
    });

    revalidatePath("/pengaturan");
    revalidatePath("/aset");

    return { ok: true as const, data: updated };
  } catch (error) {
    console.error("Gagal mengubah status tipe aset:", error);
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Terjadi kesalahan sistem saat mengubah status tipe aset.",
    };
  }
}

export async function deleteAssetTypeAction(input: { id: string }) {
  try {
    const actor = await getActorInfo();
    const parsed = deleteAssetTypeSchema.safeParse(input);

    if (!parsed.success) {
      return { ok: false as const, error: "ID tipe aset wajib disertakan." };
    }

    const existing = await prisma.assetType.findUnique({ where: { id: parsed.data.id } });
    if (!existing) {
      return { ok: false as const, error: "Tipe aset tidak ditemukan." };
    }

    const assetCount = await prisma.asset.count({
      where: { type: existing.name },
    });

    if (assetCount > 0) {
      return {
        ok: false as const,
        error: `Tipe aset "${existing.name}" tidak dapat dihapus karena tercatat pada ${assetCount} inventaris aset aktif. Anda dapat menonaktifkannya.`,
      };
    }

    await prisma.assetType.delete({ where: { id: existing.id } });

    await writeAudit({
      actorUserId: actor.userId,
      actorEmail: actor.email,
      app: "sysmgmt",
      action: "DELETE",
      entityType: "AssetType",
      entityId: existing.id,
      before: { id: existing.id, name: existing.name, category: existing.category },
      ip: actor.ip,
      userAgent: actor.userAgent,
    });

    revalidatePath("/pengaturan");
    revalidatePath("/aset");

    return { ok: true as const, id: existing.id };
  } catch (error) {
    console.error("Gagal menghapus tipe aset:", error);
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Terjadi kesalahan sistem saat menghapus tipe aset.",
    };
  }
}

// ==========================================
// 3. ACTION MASTER LOKASI ASET
// ==========================================

export async function createAssetLocationAction(rawInput: CreateAssetLocationInput) {
  try {
    const actor = await getActorInfo();
    const parsed = createAssetLocationSchema.safeParse(rawInput);

    if (!parsed.success) {
      return {
        ok: false as const,
        error: parsed.error.issues[0]?.message || "Data lokasi aset tidak valid.",
      };
    }

    const { name, building, floor, description, isActive } = parsed.data;

    const existing = await prisma.assetLocation.findUnique({ where: { name } });
    if (existing) {
      return { ok: false as const, error: `Lokasi/ruangan "${name}" sudah terdaftar.` };
    }

    const created = await prisma.assetLocation.create({
      data: {
        name,
        building: building ?? null,
        floor: floor ?? null,
        description: description ?? null,
        isActive: isActive ?? true,
      },
    });

    await writeAudit({
      actorUserId: actor.userId,
      actorEmail: actor.email,
      app: "sysmgmt",
      action: "CREATE",
      entityType: "AssetLocation",
      entityId: created.id,
      after: {
        id: created.id,
        name: created.name,
        building: created.building,
        floor: created.floor,
        isActive: created.isActive,
      },
      ip: actor.ip,
      userAgent: actor.userAgent,
    });

    revalidatePath("/pengaturan");
    revalidatePath("/aset");

    return { ok: true as const, data: created };
  } catch (error) {
    console.error("Gagal membuat lokasi aset:", error);
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Terjadi kesalahan sistem saat membuat lokasi aset.",
    };
  }
}

export async function updateAssetLocationAction(rawInput: UpdateAssetLocationInput) {
  try {
    const actor = await getActorInfo();
    const parsed = updateAssetLocationSchema.safeParse(rawInput);

    if (!parsed.success) {
      return {
        ok: false as const,
        error: parsed.error.issues[0]?.message || "Data lokasi aset tidak valid.",
      };
    }

    const { id, name, building, floor, description, isActive } = parsed.data;

    const existing = await prisma.assetLocation.findUnique({ where: { id } });
    if (!existing) {
      return { ok: false as const, error: "Lokasi aset tidak ditemukan." };
    }

    if (name !== existing.name) {
      const duplicate = await prisma.assetLocation.findUnique({ where: { name } });
      if (duplicate) {
        return { ok: false as const, error: `Lokasi/ruangan "${name}" sudah terdaftar.` };
      }
    }

    const updated = await prisma.assetLocation.update({
      where: { id },
      data: {
        name,
        building: building ?? null,
        floor: floor ?? null,
        description: description ?? null,
        isActive: isActive !== undefined ? isActive : existing.isActive,
      },
    });

    await writeAudit({
      actorUserId: actor.userId,
      actorEmail: actor.email,
      app: "sysmgmt",
      action: "UPDATE",
      entityType: "AssetLocation",
      entityId: id,
      before: {
        name: existing.name,
        building: existing.building,
        isActive: existing.isActive,
      },
      after: {
        name: updated.name,
        building: updated.building,
        isActive: updated.isActive,
      },
      ip: actor.ip,
      userAgent: actor.userAgent,
    });

    revalidatePath("/pengaturan");
    revalidatePath("/aset");

    return { ok: true as const, data: updated };
  } catch (error) {
    console.error("Gagal memperbarui lokasi aset:", error);
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Terjadi kesalahan sistem saat memperbarui lokasi aset.",
    };
  }
}

export async function toggleAssetLocationStatusAction(input: { id: string }) {
  try {
    const actor = await getActorInfo();
    const parsed = toggleAssetLocationStatusSchema.safeParse(input);

    if (!parsed.success) {
      return { ok: false as const, error: "ID lokasi aset wajib disertakan." };
    }

    const existing = await prisma.assetLocation.findUnique({ where: { id: parsed.data.id } });
    if (!existing) {
      return { ok: false as const, error: "Lokasi aset tidak ditemukan." };
    }

    const updated = await prisma.assetLocation.update({
      where: { id: existing.id },
      data: { isActive: !existing.isActive },
    });

    await writeAudit({
      actorUserId: actor.userId,
      actorEmail: actor.email,
      app: "sysmgmt",
      action: "UPDATE",
      entityType: "AssetLocation",
      entityId: existing.id,
      before: { isActive: existing.isActive },
      after: { isActive: updated.isActive },
      ip: actor.ip,
      userAgent: actor.userAgent,
    });

    revalidatePath("/pengaturan");
    revalidatePath("/aset");

    return { ok: true as const, data: updated };
  } catch (error) {
    console.error("Gagal mengubah status lokasi aset:", error);
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Terjadi kesalahan sistem saat mengubah status lokasi aset.",
    };
  }
}

export async function deleteAssetLocationAction(input: { id: string }) {
  try {
    const actor = await getActorInfo();
    const parsed = deleteAssetLocationSchema.safeParse(input);

    if (!parsed.success) {
      return { ok: false as const, error: "ID lokasi aset wajib disertakan." };
    }

    const existing = await prisma.assetLocation.findUnique({ where: { id: parsed.data.id } });
    if (!existing) {
      return { ok: false as const, error: "Lokasi aset tidak ditemukan." };
    }

    const assetCount = await prisma.asset.count({
      where: { location: existing.name },
    });

    if (assetCount > 0) {
      return {
        ok: false as const,
        error: `Lokasi "${existing.name}" tidak dapat dihapus karena tercatat pada ${assetCount} inventaris aset. Anda dapat menonaktifkannya.`,
      };
    }

    await prisma.assetLocation.delete({ where: { id: existing.id } });

    await writeAudit({
      actorUserId: actor.userId,
      actorEmail: actor.email,
      app: "sysmgmt",
      action: "DELETE",
      entityType: "AssetLocation",
      entityId: existing.id,
      before: { id: existing.id, name: existing.name, building: existing.building },
      ip: actor.ip,
      userAgent: actor.userAgent,
    });

    revalidatePath("/pengaturan");
    revalidatePath("/aset");

    return { ok: true as const, id: existing.id };
  } catch (error) {
    console.error("Gagal menghapus lokasi aset:", error);
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Terjadi kesalahan sistem saat menghapus lokasi aset.",
    };
  }
}

// ==========================================
// 4. ACTION PREFERENSI SISTEM GLOBAL
// ==========================================

export async function updateSystemPreferencesAction(rawInput: UpdateSystemPreferencesInput) {
  try {
    const actor = await getActorInfo();
    const parsed = updateSystemPreferencesSchema.safeParse(rawInput);

    if (!parsed.success) {
      return {
        ok: false as const,
        error: parsed.error.issues[0]?.message || "Nilai preferensi sistem tidak valid.",
      };
    }

    const { maxUploadMb, auditRetentionDays, sessionTimeoutMins } = parsed.data;

    // Ambil preferensi lama
    const oldSettings = await prisma.systemSetting.findMany({
      where: {
        key: {
          in: ["system.max_upload_mb", "system.audit_retention_days", "system.session_timeout_mins"],
        },
      },
    });

    const oldMap = new Map<string, string>();
    for (const s of oldSettings) {
      oldMap.set(s.key, s.value);
    }

    await prisma.$transaction([
      prisma.systemSetting.upsert({
        where: { key: "system.max_upload_mb" },
        update: { value: String(maxUploadMb), updatedBy: actor.email },
        create: {
          key: "system.max_upload_mb",
          value: String(maxUploadMb),
          category: "PREFERENCE",
          description: "Batas ukuran maksimal berkas yang diunggah (MB)",
          updatedBy: actor.email,
        },
      }),
      prisma.systemSetting.upsert({
        where: { key: "system.audit_retention_days" },
        update: { value: String(auditRetentionDays), updatedBy: actor.email },
        create: {
          key: "system.audit_retention_days",
          value: String(auditRetentionDays),
          category: "PREFERENCE",
          description: "Masa retensi penyimpanan log audit sistem (Hari)",
          updatedBy: actor.email,
        },
      }),
      prisma.systemSetting.upsert({
        where: { key: "system.session_timeout_mins" },
        update: { value: String(sessionTimeoutMins), updatedBy: actor.email },
        create: {
          key: "system.session_timeout_mins",
          value: String(sessionTimeoutMins),
          category: "PREFERENCE",
          description: "Masa aktif kedaluwarsa sesi login pengguna (Menit)",
          updatedBy: actor.email,
        },
      }),
    ]);

    await writeAudit({
      actorUserId: actor.userId,
      actorEmail: actor.email,
      app: "sysmgmt",
      action: "UPDATE",
      entityType: "SystemSetting",
      entityId: "SYSTEM_PREFERENCES",
      before: {
        maxUploadMb: oldMap.get("system.max_upload_mb") ?? "25",
        auditRetentionDays: oldMap.get("system.audit_retention_days") ?? "365",
        sessionTimeoutMins: oldMap.get("system.session_timeout_mins") ?? "1440",
      },
      after: {
        maxUploadMb: String(maxUploadMb),
        auditRetentionDays: String(auditRetentionDays),
        sessionTimeoutMins: String(sessionTimeoutMins),
      },
      ip: actor.ip,
      userAgent: actor.userAgent,
    });

    revalidatePath("/pengaturan");

    return {
      ok: true as const,
      data: { maxUploadMb, auditRetentionDays, sessionTimeoutMins },
    };
  } catch (error) {
    console.error("Gagal memperbarui preferensi sistem:", error);
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Terjadi kesalahan sistem saat memperbarui preferensi.",
    };
  }
}
