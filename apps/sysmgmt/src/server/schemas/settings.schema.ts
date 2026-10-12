import { z } from "zod";

/**
 * Skema Validasi Kategori Dokumen
 */
export const createDocumentCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nama kategori wajib diisi, minimal 2 karakter")
    .max(100, "Nama kategori maksimal 100 karakter"),
  codePrefix: z
    .string()
    .trim()
    .toUpperCase()
    .regex(
      /^[A-Z0-9]+(-[A-Z0-9]+)*-$/,
      "Prefix kode harus berupa huruf kapital/angka dan diakhiri tanda strip, contoh: SOP-HR- atau KBJ-",
    )
    .min(2, "Prefix kode minimal 2 karakter")
    .max(20, "Prefix kode maksimal 20 karakter"),
  description: z.string().trim().max(500, "Deskripsi maksimal 500 karakter").optional().nullable(),
  color: z.string().trim().max(30).default("blue").optional().nullable(),
  isActive: z.boolean().default(true).optional(),
});

export const updateDocumentCategorySchema = createDocumentCategorySchema.extend({
  id: z.string().min(1, "ID kategori wajib diisi"),
});

export const toggleDocumentCategoryStatusSchema = z.object({
  id: z.string().min(1, "ID kategori wajib diisi"),
});

export const deleteDocumentCategorySchema = z.object({
  id: z.string().min(1, "ID kategori wajib diisi"),
});

/**
 * Skema Validasi Master Tipe Aset
 */
export const createAssetTypeSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nama tipe aset wajib diisi, minimal 2 karakter")
    .max(100, "Nama tipe aset maksimal 100 karakter"),
  category: z
    .enum(["IT", "NON_IT"], {
      errorMap: () => ({ message: "Kategori aset harus IT atau NON_IT" }),
    })
    .default("IT"),
  description: z.string().trim().max(500, "Deskripsi maksimal 500 karakter").optional().nullable(),
  isActive: z.boolean().default(true).optional(),
});

export const updateAssetTypeSchema = createAssetTypeSchema.extend({
  id: z.string().min(1, "ID tipe aset wajib diisi"),
});

export const toggleAssetTypeStatusSchema = z.object({
  id: z.string().min(1, "ID tipe aset wajib diisi"),
});

export const deleteAssetTypeSchema = z.object({
  id: z.string().min(1, "ID tipe aset wajib diisi"),
});

/**
 * Skema Validasi Master Lokasi Aset
 */
export const createAssetLocationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nama lokasi wajib diisi, minimal 2 karakter")
    .max(100, "Nama lokasi maksimal 100 karakter"),
  building: z.string().trim().max(100, "Nama gedung maksimal 100 karakter").optional().nullable(),
  floor: z.string().trim().max(50, "Lantai maksimal 50 karakter").optional().nullable(),
  description: z.string().trim().max(500, "Deskripsi maksimal 500 karakter").optional().nullable(),
  isActive: z.boolean().default(true).optional(),
});

export const updateAssetLocationSchema = createAssetLocationSchema.extend({
  id: z.string().min(1, "ID lokasi wajib diisi"),
});

export const toggleAssetLocationStatusSchema = z.object({
  id: z.string().min(1, "ID lokasi wajib diisi"),
});

export const deleteAssetLocationSchema = z.object({
  id: z.string().min(1, "ID lokasi wajib diisi"),
});

/**
 * Skema Validasi Preferensi Sistem Global
 */
export const updateSystemPreferencesSchema = z.object({
  maxUploadMb: z.coerce
    .number()
    .int("Batas ukuran file harus berupa bilangan bulat")
    .min(1, "Batas upload minimal 1 MB")
    .max(100, "Batas upload maksimal 100 MB"),
  auditRetentionDays: z.coerce
    .number()
    .int("Masa retensi audit harus berupa bilangan bulat")
    .min(30, "Masa retensi audit log minimal 30 hari")
    .max(3650, "Masa retensi audit log maksimal 3650 hari (10 tahun)"),
  sessionTimeoutMins: z.coerce
    .number()
    .int("Masa sesi harus berupa bilangan bulat")
    .min(15, "Masa aktif sesi minimal 15 menit")
    .max(10080, "Masa aktif sesi maksimal 10080 menit (7 hari)"),
});

export type CreateDocumentCategoryInput = z.input<typeof createDocumentCategorySchema>;
export type UpdateDocumentCategoryInput = z.input<typeof updateDocumentCategorySchema>;
export type CreateAssetTypeInput = z.input<typeof createAssetTypeSchema>;
export type UpdateAssetTypeInput = z.input<typeof updateAssetTypeSchema>;
export type CreateAssetLocationInput = z.input<typeof createAssetLocationSchema>;
export type UpdateAssetLocationInput = z.input<typeof updateAssetLocationSchema>;
export type UpdateSystemPreferencesInput = z.input<typeof updateSystemPreferencesSchema>;
