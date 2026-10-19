import { z } from "zod";

export const DepartmentTypeEnum = z.enum(["GOVERNANCE", "LEADERSHIP", "INITIATIVE", "SUPPORT"]);
export type DepartmentType = z.infer<typeof DepartmentTypeEnum>;

export const DEPT_TYPE_LABEL: Record<DepartmentType, string> = {
  GOVERNANCE: "Tata Kelola",
  LEADERSHIP: "Kepemimpinan",
  INITIATIVE: "Inisiatif",
  SUPPORT: "Fungsi Pendukung",
};

export const TYPE_ORDER: DepartmentType[] = ["GOVERNANCE", "LEADERSHIP", "INITIATIVE", "SUPPORT"];

export const createDepartmentSchema = z.object({
  name: z
    .string({ required_error: "Nama divisi/departemen wajib diisi" })
    .trim()
    .min(3, "Nama divisi minimal 3 karakter")
    .max(100, "Nama divisi maksimal 100 karakter"),
  type: DepartmentTypeEnum.default("INITIATIVE"),
  parentId: z.string().min(1, "ID divisi induk tidak valid").optional().nullable(),
});

export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;

export const updateDepartmentSchema = z.object({
  id: z.string().min(1, "ID divisi tidak valid"),
  name: z
    .string({ required_error: "Nama divisi/departemen wajib diisi" })
    .trim()
    .min(3, "Nama divisi minimal 3 karakter")
    .max(100, "Nama divisi maksimal 100 karakter"),
  type: DepartmentTypeEnum,
  parentId: z.string().min(1, "ID divisi induk tidak valid").optional().nullable(),
});

export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;

export const createPositionSchema = z.object({
  title: z
    .string({ required_error: "Judul jabatan/posisi riset wajib diisi" })
    .trim()
    .min(3, "Judul jabatan minimal 3 karakter")
    .max(100, "Judul jabatan maksimal 100 karakter"),
  departmentId: z.string().min(1, "Pilih divisi/departemen yang valid"),
  isUnitHead: z.boolean().default(false),
});

export type CreatePositionInput = z.infer<typeof createPositionSchema>;

export const updatePositionSchema = z.object({
  id: z.string().min(1, "ID jabatan tidak valid"),
  title: z
    .string({ required_error: "Judul jabatan/posisi riset wajib diisi" })
    .trim()
    .min(3, "Judul jabatan minimal 3 karakter")
    .max(100, "Judul jabatan maksimal 100 karakter"),
  departmentId: z.string().min(1, "Pilih divisi/departemen yang valid"),
  isUnitHead: z.boolean().default(false),
});

export type UpdatePositionInput = z.infer<typeof updatePositionSchema>;

export const TransferTypeEnum = z.enum(["PROMOTION", "ROTATION", "DEMOTION", "ADJUSTMENT"]);

export type TransferType = z.infer<typeof TransferTypeEnum>;

export const EmploymentTypeEnum = z.enum(["PERMANENT", "FIXED_TERM", "PART_TIME_PROJECT"]);
export type EmploymentType = z.infer<typeof EmploymentTypeEnum>;

export const transferEmployeePositionSchema = z.object({
  employeeId: z.string().min(1, "ID pegawai tidak valid"),
  departmentId: z.string().min(1, "Pilih divisi tujuan"),
  positionId: z.string().min(1, "Pilih jabatan/posisi baru"),
  managerId: z.string().min(1, "ID atasan tidak valid").optional().nullable(),
  effectiveDate: z
    .string({ required_error: "Tanggal berlaku efektif wajib diisi" })
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD"),
  transferType: TransferTypeEnum,
  employmentType: EmploymentTypeEnum.optional().nullable(),
  employmentTypeId: z.string().optional().nullable(),
  contractEndDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal berakhir kontrak harus YYYY-MM-DD")
    .optional()
    .nullable()
    .or(z.literal("")),
  newBaseSalary: z.coerce.number().min(0, "Gaji tidak boleh bernilai negatif").optional().nullable(),
  skNumber: z.string().max(100, "Nomor SK/Kontrak maksimal 100 karakter").optional().nullable(),
  notes: z.string().max(500, "Catatan maksimal 500 karakter").optional().nullable(),
  documentKey: z.string().optional().nullable(),
});

export type TransferEmployeePositionInput = z.infer<typeof transferEmployeePositionSchema>;
