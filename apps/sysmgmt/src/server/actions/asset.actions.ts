"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma, writeAudit, getModuleFlags, isModuleActive } from "@pspk/db";
import { getSession, getAuthContext } from "@pspk/auth";
import { assertCan } from "@pspk/rbac";
import { extractClientIp } from "@pspk/shared";
import {
  createAssetSchema,
  updateAssetSchema,
  deleteAssetSchema,
  checkoutAssetSchema,
  checkinAssetSchema,
  CreateAssetInput,
  UpdateAssetInput,
  DeleteAssetInput,
  CheckoutAssetInput,
  CheckinAssetInput,
} from "../schemas/asset.schema";

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

  // Wajib memiliki izin tulis aset
  assertCan(authCtx, "sysmgmt.asset.write:all");

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
 * Server Action: Menambahkan data aset baru ke katalog inventaris.
 */
export async function createAssetAction(rawInput: CreateAssetInput) {
  try {
    const actor = await getActorInfo();
    const parsed = createAssetSchema.parse(rawInput);

    // Cek duplikasi tag aset
    const existing = await prisma.asset.findUnique({
      where: { assetTag: parsed.assetTag },
    });

    if (existing) {
      return {
        ok: false as const,
        error: `Tag aset "${parsed.assetTag}" sudah digunakan oleh barang lain. Silakan gunakan tag unik.`,
      };
    }

    const created = await prisma.asset.create({
      data: {
        category: parsed.category,
        type: parsed.type,
        name: parsed.name,
        brand: parsed.brand || null,
        model: parsed.model || null,
        serialNumber: parsed.serialNumber || null,
        assetTag: parsed.assetTag,
        purchaseDate: parsed.purchaseDate ? new Date(parsed.purchaseDate) : null,
        purchasePrice: parsed.purchasePrice !== undefined && parsed.purchasePrice !== null ? parsed.purchasePrice : null,
        status: parsed.status || "IN_STOCK",
        location: parsed.location || null,
        notes: parsed.notes || null,
      },
    });

    await writeAudit({
      actorUserId: actor.userId,
      actorEmail: actor.email,
      app: "sysmgmt",
      action: "CREATE",
      entityType: "Asset",
      entityId: created.id,
      after: {
        assetTag: created.assetTag,
        name: created.name,
        category: created.category,
        status: created.status,
      },
      ip: actor.ip,
      userAgent: actor.userAgent,
    });

    revalidatePath("/aset");
    revalidatePath("/dashboard");

    return {
      ok: true as const,
      data: { id: created.id, assetTag: created.assetTag },
      message: `Aset "${created.name}" (${created.assetTag}) berhasil ditambahkan ke inventaris.`,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan saat menambahkan aset.";
    return { ok: false as const, error: message };
  }
}

/**
 * Server Action: Memperbarui data aset yang sudah ada.
 */
export async function updateAssetAction(rawInput: UpdateAssetInput) {
  try {
    const actor = await getActorInfo();
    const parsed = updateAssetSchema.parse(rawInput);

    const existing = await prisma.asset.findUnique({
      where: { id: parsed.id },
    });

    if (!existing) {
      return { ok: false as const, error: "Data aset tidak ditemukan." };
    }

    // Jika tag aset diubah, cek keunikan
    if (parsed.assetTag !== existing.assetTag) {
      const duplicateTag = await prisma.asset.findUnique({
        where: { assetTag: parsed.assetTag },
      });
      if (duplicateTag) {
        return {
          ok: false as const,
          error: `Tag aset "${parsed.assetTag}" sudah digunakan oleh barang lain.`,
        };
      }
    }

    const updated = await prisma.asset.update({
      where: { id: parsed.id },
      data: {
        category: parsed.category,
        type: parsed.type,
        name: parsed.name,
        brand: parsed.brand || null,
        model: parsed.model || null,
        serialNumber: parsed.serialNumber || null,
        assetTag: parsed.assetTag,
        purchaseDate: parsed.purchaseDate ? new Date(parsed.purchaseDate) : null,
        purchasePrice: parsed.purchasePrice !== undefined && parsed.purchasePrice !== null ? parsed.purchasePrice : null,
        status: parsed.status,
        location: parsed.location || null,
        notes: parsed.notes || null,
      },
    });

    await writeAudit({
      actorUserId: actor.userId,
      actorEmail: actor.email,
      app: "sysmgmt",
      action: "UPDATE",
      entityType: "Asset",
      entityId: updated.id,
      before: {
        name: existing.name,
        assetTag: existing.assetTag,
        status: existing.status,
        location: existing.location,
      },
      after: {
        name: updated.name,
        assetTag: updated.assetTag,
        status: updated.status,
        location: updated.location,
      },
      ip: actor.ip,
      userAgent: actor.userAgent,
    });

    revalidatePath("/aset");
    revalidatePath(`/aset/${parsed.id}`);
    revalidatePath("/dashboard");

    return {
      ok: true as const,
      data: { id: updated.id, assetTag: updated.assetTag },
      message: `Data aset "${updated.name}" berhasil diperbarui.`,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan saat memperbarui aset.";
    return { ok: false as const, error: message };
  }
}

/**
 * Server Action: Menghapus data aset dari katalog inventaris.
 */
export async function deleteAssetAction(rawInput: DeleteAssetInput) {
  try {
    const actor = await getActorInfo();
    const parsed = deleteAssetSchema.parse(rawInput);

    const existing = await prisma.asset.findUnique({
      where: { id: parsed.id },
      include: {
        assignments: {
          where: { returnedAt: null },
        },
      },
    });

    if (!existing) {
      return { ok: false as const, error: "Data aset tidak ditemukan." };
    }

    // Cegah penghapusan jika sedang dipinjamkan
    if (existing.assignments.length > 0) {
      return {
        ok: false as const,
        error: "Aset sedang dipinjamkan kepada karyawan. Harap selesaikan proses serah terima kembali (check-in) terlebih dahulu sebelum menghapus.",
      };
    }

    await prisma.asset.delete({
      where: { id: parsed.id },
    });

    await writeAudit({
      actorUserId: actor.userId,
      actorEmail: actor.email,
      app: "sysmgmt",
      action: "DELETE",
      entityType: "Asset",
      entityId: existing.id,
      before: {
        name: existing.name,
        assetTag: existing.assetTag,
        serialNumber: existing.serialNumber,
      },
      ip: actor.ip,
      userAgent: actor.userAgent,
    });

    revalidatePath("/aset");
    revalidatePath("/dashboard");

    return {
      ok: true as const,
      message: `Aset "${existing.name}" (${existing.assetTag}) berhasil dihapus.`,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan saat menghapus aset.";
    return { ok: false as const, error: message };
  }
}

/**
 * Server Action: Melakukan serah terima aset ke pegawai (Checkout).
 * Memeriksa keteraktifan sub-fitur `module.asset_assignment.enabled`.
 */
export async function checkoutAssetAction(rawInput: CheckoutAssetInput) {
  try {
    const actor = await getActorInfo();

    // Verifikasi keteraktifan feature flag sub-fitur serah terima
    const flags = await getModuleFlags(prisma);
    if (!isModuleActive(flags, "asset_assignment")) {
      return {
        ok: false as const,
        error: "Sub-modul Serah Terima Aset sedang dinonaktifkan di Tata Kelola Modul.",
      };
    }

    const parsed = checkoutAssetSchema.parse(rawInput);

    // Ambil aset
    const asset = await prisma.asset.findUnique({
      where: { id: parsed.assetId },
      include: {
        assignments: {
          where: { returnedAt: null },
        },
      },
    });

    if (!asset) {
      return { ok: false as const, error: "Aset tidak ditemukan." };
    }

    if (asset.assignments.length > 0 || asset.status === "ASSIGNED") {
      return {
        ok: false as const,
        error: `Aset "${asset.name}" (${asset.assetTag}) sedang dipinjamkan kepada staf lain.`,
      };
    }

    // Ambil pegawai penerima
    const employee = await prisma.employee.findUnique({
      where: { id: parsed.employeeId },
      select: { id: true, fullName: true, status: true },
    });

    if (!employee || employee.status !== "ACTIVE") {
      return {
        ok: false as const,
        error: "Pegawai penerima tidak ditemukan atau statusnya tidak aktif.",
      };
    }

    const assignedDate = parsed.assignedAt ? new Date(parsed.assignedAt) : new Date();

    const result = await prisma.$transaction(async (tx) => {
      // 1. Buat record peminjaman
      const assignment = await tx.assetAssignment.create({
        data: {
          assetId: asset.id,
          employeeId: employee.id,
          assignedAt: assignedDate,
          conditionOut: parsed.conditionOut || "Baik / Normal",
          notes: parsed.notes || null,
        },
      });

      // 2. Update status aset ke ASSIGNED
      await tx.asset.update({
        where: { id: asset.id },
        data: { status: "ASSIGNED" },
      });

      return assignment;
    });

    await writeAudit({
      actorUserId: actor.userId,
      actorEmail: actor.email,
      app: "sysmgmt",
      action: "CHECKOUT",
      entityType: "AssetAssignment",
      entityId: result.id,
      before: { assetStatus: asset.status },
      after: {
        assetId: asset.id,
        assetTag: asset.assetTag,
        employeeId: employee.id,
        employeeName: employee.fullName,
        conditionOut: parsed.conditionOut || "Baik / Normal",
      },
      ip: actor.ip,
      userAgent: actor.userAgent,
    });

    revalidatePath("/aset");
    revalidatePath(`/aset/${asset.id}`);
    revalidatePath("/dashboard");

    return {
      ok: true as const,
      data: { assignmentId: result.id },
      message: `Aset "${asset.name}" berhasil diserahkan kepada ${employee.fullName}.`,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan saat serah terima aset.";
    return { ok: false as const, error: message };
  }
}

/**
 * Server Action: Menerima pengembalian aset dari staf (Checkin).
 * Memeriksa keteraktifan sub-fitur `module.asset_assignment.enabled`.
 */
export async function checkinAssetAction(rawInput: CheckinAssetInput) {
  try {
    const actor = await getActorInfo();

    const flags = await getModuleFlags(prisma);
    if (!isModuleActive(flags, "asset_assignment")) {
      return {
        ok: false as const,
        error: "Sub-modul Serah Terima Aset sedang dinonaktifkan di Tata Kelola Modul.",
      };
    }

    const parsed = checkinAssetSchema.parse(rawInput);

    const assignment = await prisma.assetAssignment.findUnique({
      where: { id: parsed.assignmentId },
      include: {
        asset: true,
        employee: { select: { fullName: true } },
      },
    });

    if (!assignment) {
      return { ok: false as const, error: "Data serah terima tidak ditemukan." };
    }

    if (assignment.returnedAt !== null) {
      return { ok: false as const, error: "Aset ini sudah tercatat telah dikembalikan sebelumnya." };
    }

    const returnDate = parsed.returnedAt ? new Date(parsed.returnedAt) : new Date();

    await prisma.$transaction(async (tx) => {
      // 1. Tutup assignment dengan returnedAt & conditionIn
      await tx.assetAssignment.update({
        where: { id: assignment.id },
        data: {
          returnedAt: returnDate,
          conditionIn: parsed.conditionIn || "Baik / Lengkap",
          notes: parsed.notes ? `${assignment.notes ? assignment.notes + " | " : ""}${parsed.notes}` : assignment.notes,
        },
      });

      // 2. Update status aset (IN_STOCK / MAINTENANCE / RETIRED)
      await tx.asset.update({
        where: { id: assignment.assetId },
        data: { status: parsed.nextStatus },
      });
    });

    await writeAudit({
      actorUserId: actor.userId,
      actorEmail: actor.email,
      app: "sysmgmt",
      action: "CHECKIN",
      entityType: "AssetAssignment",
      entityId: assignment.id,
      before: {
        assetStatus: assignment.asset.status,
        returnedAt: null,
      },
      after: {
        returnedAt: returnDate,
        conditionIn: parsed.conditionIn || "Baik / Lengkap",
        nextStatus: parsed.nextStatus,
        employeeName: assignment.employee.fullName,
      },
      ip: actor.ip,
      userAgent: actor.userAgent,
    });

    revalidatePath("/aset");
    revalidatePath(`/aset/${assignment.assetId}`);
    revalidatePath("/dashboard");

    return {
      ok: true as const,
      message: `Pengembalian aset "${assignment.asset.name}" dari ${assignment.employee.fullName} berhasil dicatat. Status aset kini: ${parsed.nextStatus}.`,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan saat mencatat pengembalian aset.";
    return { ok: false as const, error: message };
  }
}
