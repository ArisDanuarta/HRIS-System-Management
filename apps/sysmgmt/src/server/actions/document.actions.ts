"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import crypto from "node:crypto";
import { prisma, writeAudit, DocumentVisibility, DocumentStatus } from "@pspk/db";
import { getSession, getAuthContext } from "@pspk/auth";
import { can, AuthContext } from "@pspk/rbac";
import { getStorageProvider } from "@pspk/storage";
import {
  createDocumentSchema,
  uploadDocumentVersionSchema,
  updateDocumentMetadataSchema,
  archiveDocumentSchema,
  deleteDocumentSchema,
} from "../schemas/document.schema";

const MAX_DOCUMENT_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "image/png",
  "image/jpeg",
  "text/plain",
];

async function getAuthenticatedUser(): Promise<{
  userId: string;
  userEmail: string;
  userName: string;
  ip: string;
  userAgent: string;
  authCtx: AuthContext;
}> {
  const reqHeaders = await headers();
  const session = await getSession(reqHeaders);

  if (!session?.user) {
    throw new Error("Sesi Anda telah berakhir. Silakan masuk kembali.");
  }

  const authCtx = await getAuthContext(session.user.id);
  if (!authCtx) {
    throw new Error("Pengguna tidak aktif atau hak akses tidak valid.");
  }

  const ip = reqHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
  const userAgent = reqHeaders.get("user-agent") || "unknown";

  return {
    userId: session.user.id,
    userEmail: session.user.email || "system@pspk.id",
    userName: session.user.name || "Administrator",
    ip,
    userAgent,
    authCtx,
  };
}

function getSafeFileExtension(fileName: string, mimeType: string): string {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".pdf")) return "pdf";
  if (lower.endsWith(".docx")) return "docx";
  if (lower.endsWith(".doc")) return "doc";
  if (lower.endsWith(".xlsx")) return "xlsx";
  if (lower.endsWith(".xls")) return "xls";
  if (lower.endsWith(".png")) return "png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "jpg";

  if (mimeType === "application/pdf") return "pdf";
  if (mimeType.includes("wordprocessingml") || mimeType.includes("msword")) return "docx";
  if (mimeType.includes("spreadsheetml") || mimeType.includes("ms-excel")) return "xlsx";
  return "bin";
}

/**
 * Server Action: Unggah Dokumen Baru (membuat Document dan Versi v1).
 */
export async function createDocumentAction(formData: FormData) {
  try {
    const { userId, userEmail, userName, ip, userAgent, authCtx } = await getAuthenticatedUser();

    // Verifikasi Hak Kelola Dokumen
    const hasManageAll = can(authCtx, "sysmgmt.document.manage:all");
    const hasManageHr = can(authCtx, "sysmgmt.document.manage:hr");

    if (!hasManageAll && !hasManageHr) {
      return {
        success: false,
        message: "Anda tidak memiliki wewenang untuk mengunggah dokumen baru.",
      };
    }

    const rawCode = (formData.get("code") as string)?.trim().toUpperCase();
    const rawTitle = (formData.get("title") as string)?.trim();
    const rawCategory = (formData.get("category") as string)?.trim();
    const rawVisibility = formData.get("visibility") as DocumentVisibility;
    const rawStatus = (formData.get("status") as DocumentStatus) || DocumentStatus.ACTIVE;
    const rawEffectiveDate = formData.get("effectiveDate") as string | null;
    const rawChangeNote =
      (formData.get("changeNote") as string)?.trim() || "Rilis versi awal dokumen";
    const file = formData.get("file") as File | null;

    // Jika Admin HR tanpa manage:all, tidak boleh membuat dokumen IT_ONLY
    if (!hasManageAll && rawVisibility === DocumentVisibility.IT_ONLY) {
      return {
        success: false,
        message: "Admin HR tidak memiliki wewenang untuk membuat dokumen kategori IT Only.",
      };
    }

    const parsed = createDocumentSchema.safeParse({
      code: rawCode,
      title: rawTitle,
      category: rawCategory,
      visibility: rawVisibility,
      status: rawStatus,
      effectiveDate: rawEffectiveDate || null,
      changeNote: rawChangeNote,
    });

    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues[0]?.message || "Input dokumen tidak valid.",
      };
    }

    if (!file || !(file instanceof File) || file.size === 0) {
      return {
        success: false,
        message: "Silakan pilih berkas dokumen yang hendak diunggah.",
      };
    }

    if (file.size > MAX_DOCUMENT_FILE_SIZE) {
      return {
        success: false,
        message: "Ukuran berkas melebihi batas maksimal 25 MB.",
      };
    }

    if (file.type && !ALLOWED_MIME_TYPES.includes(file.type)) {
      return {
        success: false,
        message:
          "Format berkas tidak didukung. Harap unggah dokumen PDF, DOCX, atau XLSX resmi.",
      };
    }

    // Cek duplikasi kode dokumen
    const existing = await prisma.document.findUnique({
      where: { code: parsed.data.code },
      select: { id: true },
    });
    if (existing) {
      return {
        success: false,
        message: `Kode dokumen "${parsed.data.code}" sudah digunakan oleh dokumen lain.`,
      };
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const sha256 = crypto.createHash("sha256").update(buffer).digest("hex");
    const ext = getSafeFileExtension(file.name, file.type || "application/pdf");
    const sanitizedCode = parsed.data.code.toLowerCase().replace(/[^a-z0-9_-]/g, "_");
    const randomHex = crypto.randomUUID().slice(0, 8);
    const fileKey = `sysmgmt/documents/${sanitizedCode}/v1-${Date.now()}-${randomHex}.${ext}`;

    // Simpan ke storage provider
    const storage = getStorageProvider();
    await storage.put(fileKey, buffer, {
      contentType: file.type || "application/octet-stream",
    });

    const effectiveDateObj = parsed.data.effectiveDate
      ? new Date(parsed.data.effectiveDate)
      : new Date();

    // Transaksi database: Buat Document + Versi 1
    const result = await prisma.$transaction(async (tx) => {
      const doc = await tx.document.create({
        data: {
          code: parsed.data.code,
          title: parsed.data.title,
          category: parsed.data.category,
          visibility: parsed.data.visibility,
          status: parsed.data.status,
          ownerId: userId,
        },
      });

      const version = await tx.documentVersion.create({
        data: {
          documentId: doc.id,
          versionNo: 1,
          fileKey,
          fileName: file.name,
          mimeType: file.type || "application/octet-stream",
          sizeBytes: file.size,
          sha256,
          changeNote: parsed.data.changeNote,
          effectiveDate: effectiveDateObj,
          createdById: userId,
        },
      });

      const updatedDoc = await tx.document.update({
        where: { id: doc.id },
        data: { currentVersionId: version.id },
      });

      return { doc: updatedDoc, version };
    });

    // Audit log
    await writeAudit({
      actorUserId: userId,
      actorEmail: userEmail,
      app: "sysmgmt",
      action: "CREATE",
      entityType: "Document",
      entityId: result.doc.id,
      after: {
        code: result.doc.code,
        title: result.doc.title,
        category: result.doc.category,
        visibility: result.doc.visibility,
        versionNo: 1,
        fileName: file.name,
        sizeBytes: file.size,
        sha256,
        uploader: userName,
      },
      ip,
      userAgent,
    });

    revalidatePath("/dokumen");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: `Dokumen "${result.doc.code}" berhasil diterbitkan (Versi 1).`,
      documentId: result.doc.id,
    };
  } catch (err: unknown) {
    console.error("createDocumentAction error:", err);
    return {
      success: false,
      message: err instanceof Error ? err.message : "Terjadi kesalahan saat mengunggah dokumen.",
    };
  }
}

/**
 * Server Action: Unggah Versi Baru Dokumen (vCurrent + 1).
 */
export async function uploadDocumentVersionAction(formData: FormData) {
  try {
    const { userId, userEmail, userName, ip, userAgent, authCtx } = await getAuthenticatedUser();

    const hasManageAll = can(authCtx, "sysmgmt.document.manage:all");
    const hasManageHr = can(authCtx, "sysmgmt.document.manage:hr");

    if (!hasManageAll && !hasManageHr) {
      return {
        success: false,
        message: "Anda tidak memiliki wewenang untuk memperbarui versi dokumen.",
      };
    }

    const documentId = formData.get("documentId") as string;
    const rawChangeNote = (formData.get("changeNote") as string)?.trim();
    const rawEffectiveDate = formData.get("effectiveDate") as string | null;
    const file = formData.get("file") as File | null;

    const parsed = uploadDocumentVersionSchema.safeParse({
      documentId,
      changeNote: rawChangeNote,
      effectiveDate: rawEffectiveDate || null,
    });

    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues[0]?.message || "Input pembaruan versi tidak valid.",
      };
    }

    const doc = await prisma.document.findUnique({
      where: { id: parsed.data.documentId },
      include: {
        versions: {
          orderBy: { versionNo: "desc" },
          take: 1,
        },
      },
    });

    if (!doc) {
      return { success: false, message: "Dokumen tidak ditemukan." };
    }

    if (!hasManageAll && doc.visibility === DocumentVisibility.IT_ONLY) {
      return {
        success: false,
        message: "Hanya Admin IT yang berwenang memperbarui dokumen IT Only.",
      };
    }

    if (!file || !(file instanceof File) || file.size === 0) {
      return { success: false, message: "Silakan pilih berkas versi baru." };
    }

    if (file.size > MAX_DOCUMENT_FILE_SIZE) {
      return { success: false, message: "Ukuran berkas melebihi batas 25 MB." };
    }

    if (file.type && !ALLOWED_MIME_TYPES.includes(file.type)) {
      return {
        success: false,
        message: "Format berkas tidak didukung. Harap unggah PDF, DOCX, atau XLSX.",
      };
    }

    const currentLatestVersionNo = doc.versions[0]?.versionNo || 1;
    const nextVersionNo = currentLatestVersionNo + 1;

    const buffer = Buffer.from(await file.arrayBuffer());
    const sha256 = crypto.createHash("sha256").update(buffer).digest("hex");
    const ext = getSafeFileExtension(file.name, file.type || "application/pdf");
    const sanitizedCode = doc.code.toLowerCase().replace(/[^a-z0-9_-]/g, "_");
    const randomHex = crypto.randomUUID().slice(0, 8);
    const fileKey = `sysmgmt/documents/${sanitizedCode}/v${nextVersionNo}-${Date.now()}-${randomHex}.${ext}`;

    const storage = getStorageProvider();
    await storage.put(fileKey, buffer, {
      contentType: file.type || "application/octet-stream",
    });

    const effectiveDateObj = parsed.data.effectiveDate
      ? new Date(parsed.data.effectiveDate)
      : new Date();

    const result = await prisma.$transaction(async (tx) => {
      const version = await tx.documentVersion.create({
        data: {
          documentId: doc.id,
          versionNo: nextVersionNo,
          fileKey,
          fileName: file.name,
          mimeType: file.type || "application/octet-stream",
          sizeBytes: file.size,
          sha256,
          changeNote: parsed.data.changeNote,
          effectiveDate: effectiveDateObj,
          createdById: userId,
        },
      });

      await tx.document.update({
        where: { id: doc.id },
        data: {
          currentVersionId: version.id,
          updatedAt: new Date(),
        },
      });

      return version;
    });

    await writeAudit({
      actorUserId: userId,
      actorEmail: userEmail,
      app: "sysmgmt",
      action: "CREATE",
      entityType: "DocumentVersion",
      entityId: result.id,
      after: {
        documentId: doc.id,
        code: doc.code,
        versionNo: nextVersionNo,
        fileName: file.name,
        sizeBytes: file.size,
        sha256,
        changeNote: parsed.data.changeNote,
        uploader: userName,
      },
      ip,
      userAgent,
    });

    revalidatePath(`/dokumen`);
    revalidatePath(`/dokumen/${doc.id}`);
    revalidatePath(`/dashboard`);

    return {
      success: true,
      message: `Versi baru v${nextVersionNo} untuk dokumen "${doc.code}" berhasil diterbitkan.`,
      versionId: result.id,
    };
  } catch (err: unknown) {
    console.error("uploadDocumentVersionAction error:", err);
    return {
      success: false,
      message: err instanceof Error ? err.message : "Gagal menerbitkan versi baru dokumen.",
    };
  }
}

/**
 * Server Action: Ubah Metadata Dokumen (Judul, Kategori, Visibilitas, Status).
 */
export async function updateDocumentMetadataAction(formData: FormData) {
  try {
    const { userId, userEmail, userName, ip, userAgent, authCtx } = await getAuthenticatedUser();

    const hasManageAll = can(authCtx, "sysmgmt.document.manage:all");
    const hasManageHr = can(authCtx, "sysmgmt.document.manage:hr");

    if (!hasManageAll && !hasManageHr) {
      return {
        success: false,
        message: "Anda tidak memiliki wewenang untuk mengubah data dokumen.",
      };
    }

    const id = formData.get("id") as string;
    const title = (formData.get("title") as string)?.trim();
    const category = (formData.get("category") as string)?.trim();
    const visibility = formData.get("visibility") as DocumentVisibility;
    const status = formData.get("status") as DocumentStatus;

    const parsed = updateDocumentMetadataSchema.safeParse({
      id,
      title,
      category,
      visibility,
      status,
    });

    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues[0]?.message || "Input metadata tidak valid.",
      };
    }

    const doc = await prisma.document.findUnique({
      where: { id: parsed.data.id },
      select: { id: true, code: true, visibility: true },
    });

    if (!doc) {
      return { success: false, message: "Dokumen tidak ditemukan." };
    }

    if (!hasManageAll && doc.visibility === DocumentVisibility.IT_ONLY) {
      return {
        success: false,
        message: "Hanya Admin IT yang berwenang mengubah dokumen IT Only.",
      };
    }

    const updated = await prisma.document.update({
      where: { id: parsed.data.id },
      data: {
        title: parsed.data.title,
        category: parsed.data.category,
        visibility: parsed.data.visibility,
        status: parsed.data.status,
      },
    });

    await writeAudit({
      actorUserId: userId,
      actorEmail: userEmail,
      app: "sysmgmt",
      action: "UPDATE",
      entityType: "Document",
      entityId: updated.id,
      after: {
        code: updated.code,
        title: updated.title,
        category: updated.category,
        visibility: updated.visibility,
        status: updated.status,
        updater: userName,
      },
      ip,
      userAgent,
    });

    revalidatePath(`/dokumen`);
    revalidatePath(`/dokumen/${updated.id}`);
    revalidatePath(`/dashboard`);

    return {
      success: true,
      message: `Metadata dokumen "${updated.code}" berhasil diperbarui.`,
    };
  } catch (err: unknown) {
    console.error("updateDocumentMetadataAction error:", err);
    return {
      success: false,
      message: err instanceof Error ? err.message : "Gagal memperbarui metadata dokumen.",
    };
  }
}

/**
 * Server Action: Arsipkan Dokumen.
 */
export async function archiveDocumentAction(id: string, reason?: string) {
  try {
    const { userId, userEmail, userName, ip, userAgent, authCtx } = await getAuthenticatedUser();

    const hasManageAll = can(authCtx, "sysmgmt.document.manage:all");
    const hasManageHr = can(authCtx, "sysmgmt.document.manage:hr");

    if (!hasManageAll && !hasManageHr) {
      return {
        success: false,
        message: "Anda tidak memiliki wewenang untuk mengarsipkan dokumen.",
      };
    }

    const parsed = archiveDocumentSchema.safeParse({ id, reason });
    if (!parsed.success) {
      return { success: false, message: "ID dokumen tidak valid." };
    }

    const doc = await prisma.document.findUnique({
      where: { id: parsed.data.id },
      select: { id: true, code: true, visibility: true, status: true },
    });

    if (!doc) {
      return { success: false, message: "Dokumen tidak ditemukan." };
    }

    if (!hasManageAll && doc.visibility === DocumentVisibility.IT_ONLY) {
      return {
        success: false,
        message: "Hanya Admin IT yang dapat mengarsipkan dokumen IT Only.",
      };
    }

    await prisma.document.update({
      where: { id: parsed.data.id },
      data: { status: DocumentStatus.ARCHIVED },
    });

    await writeAudit({
      actorUserId: userId,
      actorEmail: userEmail,
      app: "sysmgmt",
      action: "UPDATE",
      entityType: "Document",
      entityId: doc.id,
      before: { status: doc.status },
      after: {
        code: doc.code,
        previousStatus: doc.status,
        newStatus: "ARCHIVED",
        reason: parsed.data.reason || "Pengarsipan manual oleh administrator",
        archivedBy: userName,
      },
      ip,
      userAgent,
    });

    revalidatePath(`/dokumen`);
    revalidatePath(`/dokumen/${doc.id}`);
    revalidatePath(`/dashboard`);

    return {
      success: true,
      message: `Dokumen "${doc.code}" berhasil diarsipkan.`,
    };
  } catch (err: unknown) {
    console.error("archiveDocumentAction error:", err);
    return {
      success: false,
      message: err instanceof Error ? err.message : "Gagal mengarsipkan dokumen.",
    };
  }
}

/**
 * Server Action: Hapus Dokumen Permanen (Khusus Super Admin / Admin IT).
 */
export async function deleteDocumentAction(id: string) {
  try {
    const { userId, userEmail, userName, ip, userAgent, authCtx } = await getAuthenticatedUser();

    if (!can(authCtx, "sysmgmt.document.manage:all")) {
      return {
        success: false,
        message: "Hanya Super Admin atau Admin IT yang memiliki izin menghapus dokumen secara permanen.",
      };
    }

    const parsed = deleteDocumentSchema.safeParse({ id });
    if (!parsed.success) {
      return { success: false, message: "ID dokumen tidak valid." };
    }

    const doc = await prisma.document.findUnique({
      where: { id: parsed.data.id },
      include: { versions: { select: { fileKey: true } } },
    });

    if (!doc) {
      return { success: false, message: "Dokumen tidak ditemukan." };
    }

    // Bersihkan file fisik di storage
    const storage = getStorageProvider();
    for (const v of doc.versions || []) {
      try {
        await storage.delete(v.fileKey);
      } catch (storageErr) {
        console.warn(`Gagal menghapus berkas storage: ${v.fileKey}`, storageErr);
      }
    }

    await prisma.document.delete({
      where: { id: parsed.data.id },
    });

    await writeAudit({
      actorUserId: userId,
      actorEmail: userEmail,
      app: "sysmgmt",
      action: "DELETE",
      entityType: "Document",
      entityId: doc.id,
      after: {
        code: doc.code,
        title: doc.title,
        deletedBy: userName,
      },
      ip,
      userAgent,
    });

    revalidatePath("/dokumen");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: `Dokumen "${doc.code}" berhasil dihapus secara permanen.`,
    };
  } catch (err: unknown) {
    console.error("deleteDocumentAction error:", err);
    return {
      success: false,
      message: err instanceof Error ? err.message : "Gagal menghapus dokumen.",
    };
  }
}
