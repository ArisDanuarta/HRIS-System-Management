"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma, writeAudit } from "@pspk/db";
import { getSession, getAuthContext } from "@pspk/auth";
import { assertCan } from "@pspk/rbac";
import { extractClientIp, encryptField, decryptField } from "@pspk/shared";
import {
  createCredentialSchema,
  updateCredentialSchema,
  revealCredentialPasswordSchema,
  deleteCredentialSchema,
  CreateCredentialInput,
  UpdateCredentialInput,
  RevealCredentialPasswordInput,
  DeleteCredentialInput,
} from "../schemas/credential.schema";

function formatCredentialErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof z.ZodError) {
    return err.issues[0]?.message || err.errors[0]?.message || "Input data kredensial tidak valid.";
  }
  return err instanceof Error ? err.message : fallback;
}

async function getCredentialActorInfo(
  permission:
    | "sysmgmt.credential.read:all"
    | "sysmgmt.credential.manage:all"
    | "sysmgmt.credential.reveal:all" = "sysmgmt.credential.manage:all",
) {
  const reqHeaders = await headers();
  const session = await getSession(reqHeaders);

  if (!session?.user) {
    throw new Error("Sesi tidak valid atau telah kedaluwarsa. Silakan masuk kembali.");
  }

  const authCtx = await getAuthContext(session.user.id);
  if (!authCtx) {
    throw new Error("Konteks otorisasi pengguna tidak ditemukan.");
  }

  assertCan(authCtx, permission);

  return {
    userId: session.user.id,
    email: session.user.email || "unknown@pspk.id",
    name: session.user.name || "Administrator",
    ip: extractClientIp(reqHeaders),
    userAgent: reqHeaders.get("user-agent") || undefined,
  };
}

export async function createCredentialAction(rawInput: CreateCredentialInput) {
  try {
    const actor = await getCredentialActorInfo("sysmgmt.credential.manage:all");
    const parsed = createCredentialSchema.parse(rawInput);

    const passwordEnc = encryptField(parsed.password.trim());

    const created = await prisma.credential.create({
      data: {
        title: parsed.title,
        category: parsed.category,
        url: parsed.url || null,
        username: parsed.username || null,
        email: parsed.email || null,
        passwordEnc,
        twoFactorType: parsed.twoFactorType,
        recoveryEmail: parsed.recoveryEmail || null,
        recoveryPhone: parsed.recoveryPhone || null,
        picEmployeeId: parsed.picEmployeeId || null,
        notes: parsed.notes || null,
        isActive: parsed.isActive,
        lastRotatedAt: new Date(),
      },
    });

    // Catat Audit Log (password plaintext DILARANG KERAS masuk log)
    await writeAudit({
      actorUserId: actor.userId,
      actorEmail: actor.email,
      app: "sysmgmt",
      action: "CREATE",
      entityType: "Credential",
      entityId: created.id,
      after: {
        title: created.title,
        category: created.category,
        url: created.url,
        username: created.username,
        email: created.email,
        twoFactorType: created.twoFactorType,
        picEmployeeId: created.picEmployeeId,
        isActive: created.isActive,
        hasPassword: true,
      },
      ip: actor.ip,
      userAgent: actor.userAgent,
    });

    revalidatePath("/kredensial");
    revalidatePath("/dashboard");

    return {
      ok: true as const,
      data: {
        id: created.id,
        title: created.title,
      },
    };
  } catch (error) {
    return {
      ok: false as const,
      error: formatCredentialErrorMessage(error, "Gagal menambahkan akun kredensial."),
    };
  }
}

export async function updateCredentialAction(rawInput: UpdateCredentialInput) {
  try {
    const actor = await getCredentialActorInfo("sysmgmt.credential.manage:all");
    const parsed = updateCredentialSchema.parse(rawInput);

    const existing = await prisma.credential.findUnique({
      where: { id: parsed.id },
    });

    if (!existing) {
      return {
        ok: false as const,
        error: "Data akun kredensial tidak ditemukan.",
      };
    }

    let passwordEnc = existing.passwordEnc;
    let lastRotatedAt = existing.lastRotatedAt;
    let passwordRotated = false;

    if (parsed.password && parsed.password.trim().length > 0) {
      passwordEnc = encryptField(parsed.password.trim());
      lastRotatedAt = new Date();
      passwordRotated = true;
    }

    const updated = await prisma.credential.update({
      where: { id: parsed.id },
      data: {
        title: parsed.title,
        category: parsed.category,
        url: parsed.url || null,
        username: parsed.username || null,
        email: parsed.email || null,
        passwordEnc,
        twoFactorType: parsed.twoFactorType,
        recoveryEmail: parsed.recoveryEmail || null,
        recoveryPhone: parsed.recoveryPhone || null,
        picEmployeeId: parsed.picEmployeeId || null,
        notes: parsed.notes || null,
        isActive: parsed.isActive,
        lastRotatedAt,
      },
    });

    // Catat Audit Log
    await writeAudit({
      actorUserId: actor.userId,
      actorEmail: actor.email,
      app: "sysmgmt",
      action: "UPDATE",
      entityType: "Credential",
      entityId: updated.id,
      before: {
        title: existing.title,
        category: existing.category,
        url: existing.url,
        username: existing.username,
        email: existing.email,
        twoFactorType: existing.twoFactorType,
        picEmployeeId: existing.picEmployeeId,
        isActive: existing.isActive,
      },
      after: {
        title: updated.title,
        category: updated.category,
        url: updated.url,
        username: updated.username,
        email: updated.email,
        twoFactorType: updated.twoFactorType,
        picEmployeeId: updated.picEmployeeId,
        isActive: updated.isActive,
        passwordRotated,
      },
      ip: actor.ip,
      userAgent: actor.userAgent,
    });

    revalidatePath("/kredensial");
    revalidatePath("/dashboard");

    return {
      ok: true as const,
      data: {
        id: updated.id,
        title: updated.title,
      },
    };
  } catch (error) {
    return {
      ok: false as const,
      error: formatCredentialErrorMessage(error, "Gagal memperbarui akun kredensial."),
    };
  }
}

export async function revealCredentialPasswordAction(rawInput: RevealCredentialPasswordInput) {
  try {
    const actor = await getCredentialActorInfo("sysmgmt.credential.reveal:all");
    const parsed = revealCredentialPasswordSchema.parse(rawInput);

    const credential = await prisma.credential.findUnique({
      where: { id: parsed.id },
      select: {
        id: true,
        title: true,
        category: true,
        username: true,
        email: true,
        passwordEnc: true,
      },
    });

    if (!credential) {
      return {
        ok: false as const,
        error: "Data akun kredensial tidak ditemukan.",
      };
    }

    if (!credential.passwordEnc) {
      return {
        ok: false as const,
        error: "Akun ini belum memiliki password yang tersimpan.",
      };
    }

    let plainPassword = "";
    try {
      plainPassword = decryptField(credential.passwordEnc);
    } catch {
      return {
        ok: false as const,
        error: "Gagal mendekripsi password. Kunci enkripsi server tidak cocok.",
      };
    }

    // WAJIB: Catat Audit Log khusus pengungkapan password kredensial
    await writeAudit({
      actorUserId: actor.userId,
      actorEmail: actor.email,
      app: "sysmgmt",
      action: "REVEAL_PASSWORD",
      entityType: "Credential",
      entityId: credential.id,
      after: {
        title: credential.title,
        category: credential.category,
        username: credential.username,
        revealedAt: new Date().toISOString(),
      },
      ip: actor.ip,
      userAgent: actor.userAgent,
    });

    return {
      ok: true as const,
      data: {
        id: credential.id,
        title: credential.title,
        username: credential.username || credential.email || "-",
        password: plainPassword,
      },
    };
  } catch (error) {
    return {
      ok: false as const,
      error: formatCredentialErrorMessage(error, "Gagal mengungkap password kredensial."),
    };
  }
}

export async function deleteCredentialAction(rawInput: DeleteCredentialInput) {
  try {
    const actor = await getCredentialActorInfo("sysmgmt.credential.manage:all");
    const parsed = deleteCredentialSchema.parse(rawInput);

    const existing = await prisma.credential.findUnique({
      where: { id: parsed.id },
      select: { id: true, title: true, category: true, username: true, email: true },
    });

    if (!existing) {
      return {
        ok: false as const,
        error: "Data akun kredensial tidak ditemukan atau telah dihapus sebelumnya.",
      };
    }

    await prisma.credential.delete({
      where: { id: parsed.id },
    });

    // Catat Audit Log
    await writeAudit({
      actorUserId: actor.userId,
      actorEmail: actor.email,
      app: "sysmgmt",
      action: "DELETE",
      entityType: "Credential",
      entityId: parsed.id,
      before: {
        title: existing.title,
        category: existing.category,
        username: existing.username,
        email: existing.email,
      },
      ip: actor.ip,
      userAgent: actor.userAgent,
    });

    revalidatePath("/kredensial");
    revalidatePath("/dashboard");

    return {
      ok: true as const,
      data: {
        id: parsed.id,
        title: existing.title,
      },
    };
  } catch (error) {
    return {
      ok: false as const,
      error: formatCredentialErrorMessage(error, "Gagal menghapus akun kredensial."),
    };
  }
}
