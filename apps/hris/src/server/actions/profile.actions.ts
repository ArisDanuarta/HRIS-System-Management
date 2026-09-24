"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth, getSession } from "@pspk/auth";
import { prisma, writeAudit } from "@pspk/db";
import { getStorageProvider } from "@pspk/storage";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Kata sandi saat ini wajib diisi"),
    newPassword: z
      .string()
      .min(12, "Kata sandi baru minimal 12 karakter")
      .regex(/[a-z]/, "Harus memuat huruf kecil (a-z)")
      .regex(/[A-Z]/, "Harus memuat huruf besar (A-Z)")
      .regex(/[0-9]/, "Harus memuat angka (0-9)")
      .regex(/[^a-zA-Z0-9]/, "Harus memuat karakter simbol/khusus (!@#$%^&*)"),
    confirmPassword: z.string().min(1, "Konfirmasi kata sandi wajib diisi"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Konfirmasi kata sandi baru tidak cocok",
    path: ["confirmPassword"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

/**
 * Server Action: Mengganti kata sandi akun pengguna
 */
export async function changePasswordAction(data: ChangePasswordInput) {
  try {
    const validated = changePasswordSchema.parse(data);
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
      console.error("Better Auth changePassword error:", authErr);
      const errMsg = authErr instanceof Error ? authErr.message : String(authErr);
      if (
        errMsg.toLowerCase().includes("invalid password") ||
        errMsg.toLowerCase().includes("password is incorrect") ||
        errMsg.toLowerCase().includes("credentials")
      ) {
        return {
          success: false,
          error: "Kata sandi saat ini yang Anda masukkan salah.",
        };
      }
      return {
        success: false,
        error: "Gagal mengganti kata sandi. Pastikan data sudah sesuai ketentuan.",
      };
    }

    // Catat log audit
    await writeAudit({
      actorUserId: session.user.id,
      actorEmail: session.user.email,
      app: "hris",
      action: "UPDATE",
      entityType: "UserPassword",
      entityId: session.user.id,
      after: {
        event: "USER_CHANGE_PASSWORD",
        revokedOtherSessions: true,
      },
    });

    revalidatePath("/profil");

    return {
      success: true,
      message: "Kata sandi Anda berhasil diperbarui. Sesi pada perangkat lain telah diputus.",
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message || "Validasi formulir gagal",
      };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Terjadi kesalahan pada sistem",
    };
  }
}

/**
 * Server Action: Mengunggah dan memperbarui foto avatar profil
 */
export async function uploadAvatarAction(formData: FormData) {
  try {
    const reqHeaders = await headers();
    const session = await getSession(reqHeaders);

    if (!session?.user?.id) {
      return {
        success: false,
        error: "Sesi tidak valid. Silakan masuk kembali.",
      };
    }

    const file = formData.get("file") as File | null;
    if (!file || !(file instanceof File) || file.size === 0) {
      return {
        success: false,
        error: "Berkas foto avatar tidak ditemukan.",
      };
    }

    // Validasi ukuran: max 2MB
    const MAX_SIZE = 2 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return {
        success: false,
        error: "Ukuran berkas maksimal 2 MB.",
      };
    }

    // Validasi tipe berkas
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: "Format berkas harus JPG, PNG, atau WEBP.",
      };
    }

    let ext = "jpg";
    if (file.type === "image/png") ext = "png";
    if (file.type === "image/webp") ext = "webp";

    const timestamp = Date.now();
    const key = `avatars/${session.user.id}-${timestamp}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const storage = getStorageProvider();
    await storage.put(key, buffer, {
      contentType: file.type,
    });

    const avatarUrl = `/api/documents/${key}`;

    // Update foto di tabel core.users
    await prisma.user.update({
      where: { id: session.user.id },
      data: { image: avatarUrl },
    });

    // Update foto di tabel hris.employees bila ada
    await prisma.employee.updateMany({
      where: { userId: session.user.id },
      data: { photoKey: key },
    });

    // Audit log
    await writeAudit({
      actorUserId: session.user.id,
      actorEmail: session.user.email,
      app: "hris",
      action: "UPDATE",
      entityType: "UserAvatar",
      entityId: session.user.id,
      after: {
        avatarUrl,
        photoKey: key,
        sizeBytes: file.size,
      },
    });

    revalidatePath("/profil");
    revalidatePath("/", "layout");

    return {
      success: true,
      avatarUrl,
      message: "Foto profil berhasil diperbarui.",
    };
  } catch (error) {
    console.error("uploadAvatarAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal mengunggah foto avatar",
    };
  }
}
