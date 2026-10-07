"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSession, getUserProfile } from "@pspk/auth";
import { writeAudit } from "@pspk/db";
import { encryptField } from "@pspk/shared";
import { getStorageProvider } from "@pspk/storage";
import { getPayrollDb } from "@/server/queries/payroll-settings.queries";

const payrollSettingsSchema = z.object({
  institutionName: z.string().min(2, "Nama lembaga minimal 2 karakter"),
  subHeader: z.string().min(2, "Subjudul kop minimal 2 karakter"),
  addressLine: z.string().optional().nullable(),
  logoKey: z.string().optional().nullable(),
  headerBannerKey: z.string().optional().nullable(),
  borderStyle: z.enum(["NAVY_SOLID", "NAVY_GOLD", "DOUBLE_LINE", "MINIMALIST"]),
  disclaimerText: z.string().min(5, "Teks disclaimer legalitas minimal 5 karakter"),
  senderBankName: z.string().min(2, "Nama bank pengirim wajib diisi"),
  senderBankAccount: z.string().min(4, "Nomor rekening pengirim minimal 4 digit"),
  senderAccountName: z.string().min(2, "Nama pemilik rekening wajib diisi"),
  senderBranch: z.string().optional().nullable(),
  payrollTransferNote: z.string().min(2, "Catatan/berita transfer wajib diisi"),
  authorizedSignerName: z.string().optional().nullable(),
  authorizedSignerTitle: z.string().optional().nullable(),
  signatureKey: z.string().optional().nullable(),
  stampKey: z.string().optional().nullable(),
});

export type PayrollSettingsInput = z.infer<typeof payrollSettingsSchema>;

/**
 * Helper internal untuk memverifikasi hak akses Admin HR atau Super Admin
 */
async function assertHrAdmin() {
  const reqHeaders = await headers();
  const session = await getSession(reqHeaders);

  if (!session?.user) {
    throw new Error("Sesi tidak valid. Silakan login kembali.");
  }

  const userProfile = await getUserProfile(session.user.id);
  const roleKeys = userProfile?.roles.map((r) => r.role.key) || [];

  if (!roleKeys.includes("admin_hr") && !roleKeys.includes("super_admin")) {
    throw new Error("Anda tidak memiliki izin untuk mengelola pengaturan penggajian.");
  }

  return { session, userProfile };
}

/**
 * Server Action: Memperbarui Pengaturan Dokumen & Rekening Bank Penggajian PSPK
 */
export async function updatePayrollSettingsAction(
  input: PayrollSettingsInput,
): Promise<{ ok: boolean; message?: string; error?: string }> {
  try {
    const { session } = await assertHrAdmin();

    const validated = payrollSettingsSchema.safeParse(input);
    if (!validated.success) {
      return {
        ok: false,
        error: validated.error.errors[0]?.message || "Data pengaturan tidak valid.",
      };
    }

    const data = validated.data;
    const db = getPayrollDb();

    const currentSetting = await db.payrollSetting.findFirst({
      where: { isDefault: true },
    });

    let encryptedBankAcc = currentSetting?.senderBankAccountEnc ?? null;

    // Hanya enkripsi ulang jika nomor rekening diubah dan bukan placeholder ter-masking
    const rawAcc = data.senderBankAccount.trim();
    if (
      !rawAcc.startsWith("••••") &&
      !rawAcc.includes("••••") &&
      rawAcc !== "[Tersimpan Terenkripsi]"
    ) {
      encryptedBankAcc = encryptField(rawAcc);
    }

    const updatedSetting = await db.payrollSetting.upsert({
      where: {
        id: currentSetting?.id || "00000000-0000-0000-0000-000000000000",
      },
      update: {
        institutionName: data.institutionName,
        subHeader: data.subHeader,
        addressLine: data.addressLine || null,
        logoKey: data.logoKey || null,
        headerBannerKey: data.headerBannerKey || null,
        borderStyle: data.borderStyle,
        disclaimerText: data.disclaimerText,
        senderBankName: data.senderBankName,
        senderBankAccountEnc: encryptedBankAcc,
        senderAccountName: data.senderAccountName,
        senderBranch: data.senderBranch || null,
        payrollTransferNote: data.payrollTransferNote,
        authorizedSignerName: data.authorizedSignerName || null,
        authorizedSignerTitle: data.authorizedSignerTitle || null,
        signatureKey: data.signatureKey || null,
        stampKey: data.stampKey || null,
        updatedByUserId: session.user.id,
      },
      create: {
        institutionName: data.institutionName,
        subHeader: data.subHeader,
        addressLine: data.addressLine || null,
        logoKey: data.logoKey || null,
        headerBannerKey: data.headerBannerKey || null,
        borderStyle: data.borderStyle,
        disclaimerText: data.disclaimerText,
        senderBankName: data.senderBankName,
        senderBankAccountEnc: encryptedBankAcc,
        senderAccountName: data.senderAccountName,
        senderBranch: data.senderBranch || null,
        payrollTransferNote: data.payrollTransferNote,
        authorizedSignerName: data.authorizedSignerName || null,
        authorizedSignerTitle: data.authorizedSignerTitle || null,
        signatureKey: data.signatureKey || null,
        stampKey: data.stampKey || null,
        isDefault: true,
        updatedByUserId: session.user.id,
      },
    });

    // Catat mutasi ke Audit Log (data sensitif no. rek tidak dicatat unencrypted)
    await writeAudit({
      actorUserId: session.user.id,
      actorEmail: session.user.email,
      app: "hris",
      action: "UPDATE",
      entityType: "PayrollSetting",
      entityId: updatedSetting.id,
      before: currentSetting
        ? {
            institutionName: currentSetting.institutionName,
            borderStyle: currentSetting.borderStyle,
            senderBankName: currentSetting.senderBankName,
            senderAccountName: currentSetting.senderAccountName,
          }
        : undefined,
      after: {
        institutionName: data.institutionName,
        borderStyle: data.borderStyle,
        senderBankName: data.senderBankName,
        senderAccountName: data.senderAccountName,
        hasCustomLogo: Boolean(data.logoKey),
        hasCustomBanner: Boolean(data.headerBannerKey),
      },
    });

    revalidatePath("/payroll/pengaturan");
    revalidatePath("/payroll");
    revalidatePath("/slip-gaji");

    return {
      ok: true,
      message: "Pengaturan dokumen & rekening penggajian berhasil disimpan.",
    };
  } catch (err: unknown) {
    console.error("updatePayrollSettingsAction error:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Terjadi kesalahan internal pada server.",
    };
  }
}

/**
 * Server Action: Mengunggah file logo atau banner kop surat
 */
export async function uploadPayrollBrandingAction(
  formData: FormData,
): Promise<{ ok: boolean; key?: string; url?: string; error?: string }> {
  try {
    await assertHrAdmin();

    const file = formData.get("file") as File | null;
    const target = (formData.get("target") as string) || "logo";

    if (!file || !(file instanceof File)) {
      return { ok: false, error: "File gambar tidak ditemukan." };
    }

    // Validasi ukuran: Maksimal 2MB
    if (file.size > 2 * 1024 * 1024) {
      return { ok: false, error: "Ukuran file terlalu besar. Maksimal 2 MB." };
    }

    // Validasi MIME type gambar
    const allowedTypes = ["image/png", "image/jpeg", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return {
        ok: false,
        error: "Format file tidak didukung. Harap unggah format PNG, JPG, atau WEBP.",
      };
    }

    let ext = "png";
    if (file.type === "image/jpeg") ext = "jpg";
    if (file.type === "image/webp") ext = "webp";

    const timestamp = Date.now();
    const key = `branding/payroll-${target}-${timestamp}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const storage = getStorageProvider();
    await storage.put(key, buffer, {
      contentType: file.type,
    });

    const fileUrl = `/api/documents/${key}`;

    return {
      ok: true,
      key,
      url: fileUrl,
    };
  } catch (err: unknown) {
    console.error("uploadPayrollBrandingAction error:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Gagal mengunggah file gambar.",
    };
  }
}

/**
 * Server Action: Menghapus file logo atau banner kop surat dari pengaturan
 */
export async function deletePayrollBrandingAction(
  target: "logo" | "banner" | "signature" | "stamp",
): Promise<{ ok: boolean; error?: string }> {
  try {
    const { session } = await assertHrAdmin();

    const db = getPayrollDb();
    const current = await db.payrollSetting.findFirst({
      where: { isDefault: true },
    });

    if (current) {
      let dataToUpdate: Record<string, null> = {};
      if (target === "logo") dataToUpdate = { logoKey: null };
      else if (target === "banner") dataToUpdate = { headerBannerKey: null };
      else if (target === "signature") dataToUpdate = { signatureKey: null };
      else if (target === "stamp") dataToUpdate = { stampKey: null };

      await db.payrollSetting.update({
        where: { id: current.id },
        data: {
          ...dataToUpdate,
          updatedByUserId: session.user.id,
        },
      });

      revalidatePath("/payroll/pengaturan");
      revalidatePath("/payroll");
      revalidatePath("/slip-gaji");
    }

    return { ok: true };
  } catch (err: unknown) {
    console.error("deletePayrollBrandingAction error:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Gagal menghapus aset kop surat.",
    };
  }
}
