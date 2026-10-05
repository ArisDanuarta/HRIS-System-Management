"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import crypto from "node:crypto";
import { getSession, getAuthContext } from "@pspk/auth";
import { can, AuthContext } from "@pspk/rbac";
import { prisma, writeAudit } from "@pspk/db";
import { getStorageProvider } from "@pspk/storage";

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

const VALID_CATEGORIES = [
  "KTP",
  "NPWP",
  "DIPLOMA",
  "CV",
  "CONTRACT",
  "CERTIFICATE",
  "OTHER",
] as const;

export type DocumentCategory = typeof VALID_CATEGORIES[number];

async function getAuthenticatedUser(): Promise<{
  userId: string;
  userEmail: string;
  employeeId?: string;
  authCtx: AuthContext;
}> {
  const reqHeaders = await headers();
  const session = await getSession(reqHeaders);

  if (!session?.user) {
    throw new Error("Sesi Anda telah kedaluwarsa. Silakan masuk kembali.");
  }

  const authCtx = await getAuthContext(session.user.id);
  if (!authCtx) {
    throw new Error("Pengguna tidak aktif atau hak akses tidak valid.");
  }

  const employee = await prisma.employee.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  return {
    userId: session.user.id,
    userEmail: session.user.email || "system@pspk.id",
    employeeId: employee?.id,
    authCtx,
  };
}

/**
 * Server Action: Upload employee document to vault
 */
export async function uploadEmployeeDocumentAction(formData: FormData) {
  try {
    const { userId, userEmail, employeeId: actorEmployeeId, authCtx } = await getAuthenticatedUser();

    const employeeId = formData.get("employeeId") as string;
    const category = formData.get("category") as DocumentCategory;
    const title = (formData.get("title") as string)?.trim();
    const file = formData.get("file") as File | null;

    if (!employeeId) {
      return { success: false, message: "ID pegawai tidak valid." };
    }

    if (!VALID_CATEGORIES.includes(category)) {
      return { success: false, message: "Kategori dokumen tidak dikenali." };
    }

    if (!title || title.length < 3) {
      return { success: false, message: "Judul dokumen minimal 3 karakter." };
    }

    if (!file || !(file instanceof File) || file.size === 0) {
      return { success: false, message: "Silakan pilih berkas dokumen yang valid." };
    }

    if (file.size > MAX_FILE_SIZE) {
      return { success: false, message: "Ukuran berkas melebihi batas maksimal 25 MB." };
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return {
        success: false,
        message: "Format berkas tidak didukung. Harap unggah PDF, PNG, JPG, atau WebP.",
      };
    }

    // Role check: Admin HR / Super Admin can upload for any employee; employee can upload for self
    const isSuperOrHr =
      can(authCtx, "hris.employee.update:all") ||
      authCtx.roles.some((r) => r === "super_admin" || r === "admin_hr");
    const isSelf = actorEmployeeId === employeeId;

    if (!isSuperOrHr && !isSelf) {
      return {
        success: false,
        message: "Anda tidak memiliki izin untuk mengunggah dokumen untuk pegawai ini.",
      };
    }

    // Business rule: Contract documents can ONLY be uploaded by Admin HR / Super Admin
    if (category === "CONTRACT" && !isSuperOrHr) {
      return {
        success: false,
        message: "Dokumen Kontrak Kerja hanya dapat diunggah dan dikelola oleh Admin HR.",
      };
    }

    // Verify employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { id: true, fullName: true, employeeNo: true },
    });

    if (!employee) {
      return { success: false, message: "Data pegawai tidak ditemukan." };
    }

    // Determine extension
    let ext = "pdf";
    if (file.type === "image/jpeg") ext = "jpg";
    else if (file.type === "image/png") ext = "png";
    else if (file.type === "image/webp") ext = "webp";

    const timestamp = Date.now();
    const randomHex = crypto.randomUUID().slice(0, 8);
    const fileKey = `documents/${employeeId}/${category.toLowerCase()}-${timestamp}-${randomHex}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    const storage = getStorageProvider();
    await storage.put(fileKey, buffer, {
      contentType: file.type,
    });

    const doc = await prisma.employeeDocument.create({
      data: {
        employeeId,
        category,
        title,
        fileName: file.name,
        fileKey,
        fileSize: file.size,
        mimeType: file.type,
        uploadedById: userId,
      },
    });

    // Write audit log
    await writeAudit({
      actorUserId: userId,
      actorEmail: userEmail,
      app: "hris",
      action: "UPLOAD_DOCUMENT",
      entityType: "EmployeeDocument",
      entityId: doc.id,
      after: {
        employeeId,
        employeeName: employee.fullName,
        category,
        title,
        fileName: file.name,
        fileSize: file.size,
        fileKey,
      },
    });

    revalidatePath(`/karyawan/${employeeId}`);
    revalidatePath("/profil");

    return {
      success: true,
      message: `Dokumen "${title}" berhasil diunggah ke arsip pegawai.`,
      data: doc,
    };
  } catch (err) {
    console.error("uploadEmployeeDocumentAction error:", err);
    return {
      success: false,
      message: err instanceof Error ? err.message : "Gagal mengunggah dokumen.",
    };
  }
}

/**
 * Server Action: Delete employee document from vault (Admin HR / Super Admin only)
 */
export async function deleteEmployeeDocumentAction({ documentId }: { documentId: string }) {
  try {
    const { userId, userEmail, employeeId: actorEmployeeId, authCtx } = await getAuthenticatedUser();

    const isSuperOrHr =
      can(authCtx, "hris.employee.update:all") ||
      authCtx.roles.some((r) => r === "super_admin" || r === "admin_hr");

    const doc = await prisma.employeeDocument.findUnique({
      where: { id: documentId },
      include: {
        employee: { select: { fullName: true } },
      },
    });

    if (!doc) {
      return { success: false, message: "Dokumen tidak ditemukan atau sudah dihapus." };
    }

    const isSelf = actorEmployeeId === doc.employeeId;

    // Dokumen Kontrak Kerja hanya dapat dihapus oleh Admin HR / Super Admin
    if (doc.category === "CONTRACT" && !isSuperOrHr) {
      return {
        success: false,
        message: "Dokumen Kontrak Kerja hanya dapat dikelola atau dihapus oleh Admin HR.",
      };
    }

    // Dokumen selain kontrak dapat dihapus oleh Admin HR atau oleh pegawai itu sendiri
    if (!isSuperOrHr && !isSelf) {
      return {
        success: false,
        message: "Anda tidak memiliki izin untuk menghapus dokumen ini.",
      };
    }

    // Delete from storage
    try {
      const storage = getStorageProvider();
      await storage.delete(doc.fileKey);
    } catch (storageErr) {
      console.warn("Storage deletion warning (file may not exist):", storageErr);
    }

    // Delete database record
    await prisma.employeeDocument.delete({
      where: { id: documentId },
    });

    // Write audit log
    await writeAudit({
      actorUserId: userId,
      actorEmail: userEmail,
      app: "hris",
      action: "DELETE_DOCUMENT",
      entityType: "EmployeeDocument",
      entityId: doc.id,
      before: {
        employeeId: doc.employeeId,
        employeeName: doc.employee.fullName,
        category: doc.category,
        title: doc.title,
        fileName: doc.fileName,
        fileKey: doc.fileKey,
      },
    });

    revalidatePath(`/karyawan/${doc.employeeId}`);
    revalidatePath("/profil");

    return {
      success: true,
      message: `Dokumen "${doc.title}" berhasil dihapus dari arsip kepegawaian.`,
    };
  } catch (err) {
    console.error("deleteEmployeeDocumentAction error:", err);
    return {
      success: false,
      message: err instanceof Error ? err.message : "Gagal menghapus dokumen.",
    };
  }
}
