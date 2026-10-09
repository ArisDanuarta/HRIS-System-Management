import { z } from "zod";

export const documentVisibilityEnum = z.enum(["ALL_STAFF", "HR_ONLY", "IT_ONLY", "MANAGERS"]);
export const documentStatusEnum = z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]);

export const DOCUMENT_CATEGORIES = [
  "Kebijakan Lembaga",
  "SOP HR & Kepegawaian",
  "SOP IT & Keamanan",
  "SOP Keuangan & Pengadaan",
  "Standar Operasional Umum",
] as const;

export const createDocumentSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2, "Kode dokumen minimal 2 karakter")
    .max(50, "Kode dokumen maksimal 50 karakter")
    .regex(/^[A-Za-z0-9-_./]+$/, "Kode dokumen hanya boleh berisi huruf, angka, strip, titik, atau garis miring"),
  title: z
    .string()
    .trim()
    .min(3, "Judul dokumen minimal 3 karakter")
    .max(200, "Judul dokumen maksimal 200 karakter"),
  category: z
    .string()
    .trim()
    .min(2, "Kategori dokumen wajib dipilih atau diisi"),
  visibility: documentVisibilityEnum.default("ALL_STAFF"),
  status: documentStatusEnum.default("ACTIVE"),
  effectiveDate: z.string().optional().nullable(),
  changeNote: z.string().trim().optional().nullable(),
});

export const uploadDocumentVersionSchema = z.object({
  documentId: z.string().uuid("ID dokumen tidak valid"),
  changeNote: z
    .string()
    .trim()
    .min(3, "Catatan perubahan versi wajib diisi, minimal 3 karakter"),
  effectiveDate: z.string().optional().nullable(),
});

export const updateDocumentMetadataSchema = z.object({
  id: z.string().uuid("ID dokumen tidak valid"),
  title: z
    .string()
    .trim()
    .min(3, "Judul dokumen minimal 3 karakter")
    .max(200, "Judul dokumen maksimal 200 karakter"),
  category: z
    .string()
    .trim()
    .min(2, "Kategori dokumen wajib diisi"),
  visibility: documentVisibilityEnum,
  status: documentStatusEnum,
});

export const archiveDocumentSchema = z.object({
  id: z.string().uuid("ID dokumen tidak valid"),
  reason: z.string().trim().optional().nullable(),
});

export const deleteDocumentSchema = z.object({
  id: z.string().uuid("ID dokumen tidak valid"),
});

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type UploadDocumentVersionInput = z.infer<typeof uploadDocumentVersionSchema>;
export type UpdateDocumentMetadataInput = z.infer<typeof updateDocumentMetadataSchema>;
export type ArchiveDocumentInput = z.infer<typeof archiveDocumentSchema>;
export type DeleteDocumentInput = z.infer<typeof deleteDocumentSchema>;
