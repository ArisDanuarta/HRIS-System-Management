"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma, writeAudit } from "@pspk/db";
import { getSession, getAuthContext } from "@pspk/auth";
import { assertCan } from "@pspk/rbac";
import { extractClientIp, encryptField, decryptField } from "@pspk/shared";
import {
  createLicenseSchema,
  updateLicenseSchema,
  revealLicenseKeySchema,
  deleteLicenseSchema,
  CreateLicenseInput,
  UpdateLicenseInput,
  RevealLicenseKeyInput,
  DeleteLicenseInput,
} from "../schemas/license.schema";

async function getLicenseActorInfo(permission: "sysmgmt.license.read:all" | "sysmgmt.license.manage:all" = "sysmgmt.license.manage:all") {
  const reqHeaders = await headers();
  const session = await getSession(reqHeaders);

  if (!session?.user) {
    throw new Error("Sesi Anda telah kedaluwarsa. Silakan masuk kembali.");
  }

  const authCtx = await getAuthContext(session.user.id);
  if (!authCtx) {
    throw new Error("Pengguna tidak aktif atau hak akses tidak valid.");
  }

  // Validasi RBAC di sisi server
  assertCan(authCtx, permission);

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
 * Server Action: Menambahkan data lisensi software baru.
 */
export async function createLicenseAction(rawInput: CreateLicenseInput) {
  try {
    const actor = await getLicenseActorInfo("sysmgmt.license.manage:all");
    const parsed = createLicenseSchema.parse(rawInput);

    // Enkripsi kunci lisensi jika diinput
    let licenseKeyEnc: string | null = null;
    if (parsed.licenseKey && parsed.licenseKey.trim().length > 0) {
      licenseKeyEnc = encryptField(parsed.licenseKey.trim());
    }

    const created = await prisma.softwareLicense.create({
      data: {
        name: parsed.name,
        vendor: parsed.vendor || null,
        licenseKeyEnc,
        seatsTotal: parsed.seatsTotal,
        seatsUsed: parsed.seatsUsed,
        purchaseDate: parsed.purchaseDate ? new Date(parsed.purchaseDate) : null,
        expiresAt: parsed.expiresAt ? new Date(parsed.expiresAt) : null,
        notes: parsed.notes || null,
      },
    });

    // Catat Audit Log (kunci lisensi plain text DILARANG masuk log)
    await writeAudit({
      actorUserId: actor.userId,
      actorEmail: actor.email,
      app: "sysmgmt",
      action: "CREATE",
      entityType: "SoftwareLicense",
      entityId: created.id,
      after: {
        name: created.name,
        vendor: created.vendor,
        seatsTotal: created.seatsTotal,
        seatsUsed: created.seatsUsed,
        purchaseDate: created.purchaseDate,
        expiresAt: created.expiresAt,
        hasKey: Boolean(created.licenseKeyEnc),
      },
      ip: actor.ip,
      userAgent: actor.userAgent,
    });

    revalidatePath("/lisensi");
    revalidatePath("/dashboard");

    return {
      ok: true as const,
      data: {
        id: created.id,
        name: created.name,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal menambahkan lisensi software";
    return {
      ok: false as const,
      error: message,
    };
  }
}

/**
 * Server Action: Memperbarui data lisensi software yang ada.
 */
export async function updateLicenseAction(rawInput: UpdateLicenseInput) {
  try {
    const actor = await getLicenseActorInfo("sysmgmt.license.manage:all");
    const parsed = updateLicenseSchema.parse(rawInput);

    const existing = await prisma.softwareLicense.findUnique({
      where: { id: parsed.id },
    });

    if (!existing) {
      return {
        ok: false as const,
        error: "Data lisensi software tidak ditemukan di sistem.",
      };
    }

    // Penanganan pembaruan kunci terenkripsi
    let licenseKeyEnc = existing.licenseKeyEnc;
    if (parsed.clearLicenseKey) {
      licenseKeyEnc = null;
    } else if (parsed.licenseKey && parsed.licenseKey.trim().length > 0) {
      licenseKeyEnc = encryptField(parsed.licenseKey.trim());
    }

    const updated = await prisma.softwareLicense.update({
      where: { id: parsed.id },
      data: {
        name: parsed.name,
        vendor: parsed.vendor || null,
        licenseKeyEnc,
        seatsTotal: parsed.seatsTotal,
        seatsUsed: parsed.seatsUsed,
        purchaseDate: parsed.purchaseDate ? new Date(parsed.purchaseDate) : null,
        expiresAt: parsed.expiresAt ? new Date(parsed.expiresAt) : null,
        notes: parsed.notes || null,
      },
    });

    // Catat Audit Log
    await writeAudit({
      actorUserId: actor.userId,
      actorEmail: actor.email,
      app: "sysmgmt",
      action: "UPDATE",
      entityType: "SoftwareLicense",
      entityId: updated.id,
      before: {
        name: existing.name,
        vendor: existing.vendor,
        seatsTotal: existing.seatsTotal,
        seatsUsed: existing.seatsUsed,
        purchaseDate: existing.purchaseDate,
        expiresAt: existing.expiresAt,
        hasKey: Boolean(existing.licenseKeyEnc),
      },
      after: {
        name: updated.name,
        vendor: updated.vendor,
        seatsTotal: updated.seatsTotal,
        seatsUsed: updated.seatsUsed,
        purchaseDate: updated.purchaseDate,
        expiresAt: updated.expiresAt,
        hasKey: Boolean(updated.licenseKeyEnc),
      },
      ip: actor.ip,
      userAgent: actor.userAgent,
    });

    revalidatePath("/lisensi");
    revalidatePath("/dashboard");

    return {
      ok: true as const,
      data: {
        id: updated.id,
        name: updated.name,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal memperbarui data lisensi software";
    return {
      ok: false as const,
      error: message,
    };
  }
}

/**
 * Server Action: Membuka kunci lisensi terenkripsi (Audited dengan event VIEW_SENSITIVE).
 */
export async function revealLicenseKeyAction(rawInput: RevealLicenseKeyInput) {
  try {
    const actor = await getLicenseActorInfo("sysmgmt.license.manage:all");
    const parsed = revealLicenseKeySchema.parse(rawInput);

    const license = await prisma.softwareLicense.findUnique({
      where: { id: parsed.id },
    });

    if (!license) {
      return {
        ok: false as const,
        error: "Data lisensi tidak ditemukan di sistem.",
      };
    }

    if (!license.licenseKeyEnc) {
      return {
        ok: false as const,
        error: "Lisensi ini tidak memiliki kunci produk yang tersimpan.",
      };
    }

    // Dekripsi kunci menggunakan AES-256-GCM
    let plainKey = "";
    try {
      plainKey = decryptField(license.licenseKeyEnc);
    } catch (err) {
      console.error("Gagal mendekripsi kunci lisensi:", err);
      return {
        ok: false as const,
        error: "Gagal mendekripsi kunci lisensi. Kunci enkripsi sistem mungkin telah berubah atau data rusak.",
      };
    }

    // Wajib Audit Log: Kejadian pembukaan data sensitif dicatat
    await writeAudit({
      actorUserId: actor.userId,
      actorEmail: actor.email,
      app: "sysmgmt",
      action: "VIEW_SENSITIVE",
      entityType: "SoftwareLicense",
      entityId: license.id,
      after: {
        licenseName: license.name,
        vendor: license.vendor,
        reason: parsed.reason || "Melihat kunci lisensi produk",
        unmaskedAt: new Date().toISOString(),
      },
      ip: actor.ip,
      userAgent: actor.userAgent,
    });

    return {
      ok: true as const,
      data: {
        id: license.id,
        name: license.name,
        key: plainKey,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal membuka kunci lisensi";
    return {
      ok: false as const,
      error: message,
    };
  }
}

/**
 * Server Action: Menghapus data lisensi software.
 */
export async function deleteLicenseAction(rawInput: DeleteLicenseInput) {
  try {
    const actor = await getLicenseActorInfo("sysmgmt.license.manage:all");
    const parsed = deleteLicenseSchema.parse(rawInput);

    const existing = await prisma.softwareLicense.findUnique({
      where: { id: parsed.id },
    });

    if (!existing) {
      return {
        ok: false as const,
        error: "Data lisensi software tidak ditemukan atau sudah dihapus.",
      };
    }

    await prisma.softwareLicense.delete({
      where: { id: parsed.id },
    });

    await writeAudit({
      actorUserId: actor.userId,
      actorEmail: actor.email,
      app: "sysmgmt",
      action: "DELETE",
      entityType: "SoftwareLicense",
      entityId: existing.id,
      before: {
        name: existing.name,
        vendor: existing.vendor,
        seatsTotal: existing.seatsTotal,
        seatsUsed: existing.seatsUsed,
        hasKey: Boolean(existing.licenseKeyEnc),
      },
      ip: actor.ip,
      userAgent: actor.userAgent,
    });

    revalidatePath("/lisensi");
    revalidatePath("/dashboard");

    return {
      ok: true as const,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal menghapus data lisensi";
    return {
      ok: false as const,
      error: message,
    };
  }
}
