import { z } from "zod";

export const createDepartmentSchema = z.object({
  name: z
    .string({ required_error: "Nama divisi/departemen wajib diisi" })
    .trim()
    .min(3, "Nama divisi minimal 3 karakter")
    .max(100, "Nama divisi maksimal 100 karakter"),
  parentId: z.string().uuid("ID divisi induk tidak valid").optional().nullable(),
});

export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;

export const updateDepartmentSchema = z.object({
  id: z.string().uuid("ID divisi tidak valid"),
  name: z
    .string({ required_error: "Nama divisi/departemen wajib diisi" })
    .trim()
    .min(3, "Nama divisi minimal 3 karakter")
    .max(100, "Nama divisi maksimal 100 karakter"),
  parentId: z.string().uuid("ID divisi induk tidak valid").optional().nullable(),
});

export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;

export const createPositionSchema = z.object({
  title: z
    .string({ required_error: "Judul jabatan/posisi riset wajib diisi" })
    .trim()
    .min(3, "Judul jabatan minimal 3 karakter")
    .max(100, "Judul jabatan maksimal 100 karakter"),
  departmentId: z.string().uuid("Pilih divisi/departemen yang valid"),
});

export type CreatePositionInput = z.infer<typeof createPositionSchema>;

export const updatePositionSchema = z.object({
  id: z.string().uuid("ID jabatan tidak valid"),
  title: z
    .string({ required_error: "Judul jabatan/posisi riset wajib diisi" })
    .trim()
    .min(3, "Judul jabatan minimal 3 karakter")
    .max(100, "Judul jabatan maksimal 100 karakter"),
  departmentId: z.string().uuid("Pilih divisi/departemen yang valid"),
});

export type UpdatePositionInput = z.infer<typeof updatePositionSchema>;

export const TransferTypeEnum = z.enum([
  "PROMOTION",
  "ROTATION",
  "DEMOTION",
  "ADJUSTMENT",
]);

export type TransferType = z.infer<typeof TransferTypeEnum>;

export const transferEmployeePositionSchema = z.object({
  employeeId: z.string().uuid("ID pegawai tidak valid"),
  departmentId: z.string().uuid("Pilih divisi tujuan"),
  positionId: z.string().uuid("Pilih jabatan/posisi baru"),
  managerId: z.string().uuid("ID atasan tidak valid").optional().nullable(),
  effectiveDate: z
    .string({ required_error: "Tanggal berlaku efektif wajib diisi" })
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD"),
  transferType: TransferTypeEnum,
  skNumber: z.string().max(100, "Nomor SK maksimal 100 karakter").optional().nullable(),
  notes: z.string().max(500, "Catatan maksimal 500 karakter").optional().nullable(),
  documentKey: z.string().optional().nullable(),
});

export type TransferEmployeePositionInput = z.infer<typeof transferEmployeePositionSchema>;
