import { z } from "zod";

export const EmployeeStatusEnum = z.enum([
  "ACTIVE",
  "PROBATION",
  "ON_LEAVE",
  "RESIGNED",
  "TERMINATED",
]);

export const GenderEnum = z.enum(["MALE", "FEMALE"]);

export const MaritalStatusEnum = z.enum(["SINGLE", "MARRIED", "DIVORCED", "WIDOWED"]);

export const EmploymentTypeEnum = z.enum([
  "PERMANENT",
  "FIXED_TERM",
  "PART_TIME_PROJECT",
]);

export const createEmployeeSchema = z.object({
  fullName: z.string().min(3, "Nama lengkap minimal 3 karakter"),
  nickname: z.string().optional(),
  workEmail: z.string().email("Format email kantor tidak valid"),
  personalEmail: z.string().email("Format email pribadi tidak valid").optional().or(z.literal("")),
  phone: z.string().optional(),
  birthDate: z.string().optional(),
  birthPlace: z.string().optional(),
  gender: GenderEnum.optional(),
  maritalStatus: MaritalStatusEnum.optional(),
  address: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  employeeNo: z.string().min(3, "Nomor Induk Pegawai (NIP) wajib diisi"),
  currentDepartmentId: z.string().uuid("Pilih divisi/departemen yang valid"),
  currentPositionId: z.string().uuid("Pilih jabatan/posisi yang valid"),
  managerId: z.string().uuid().optional().or(z.literal("")).nullable(),
  joinDate: z.string().min(1, "Tanggal mulai bergabung wajib diisi"),
  status: EmployeeStatusEnum.default("ACTIVE"),
  employmentType: EmploymentTypeEnum.default("PERMANENT"),
  contractStartDate: z.string().min(1, "Tanggal mulai kontrak kerja wajib diisi"),
  contractEndDate: z.string().optional().or(z.literal("")),
  baseSalary: z.coerce.number().min(0, "Gaji pokok tidak boleh negatif").optional(),
  contractNotes: z.string().optional(),
  nik: z.string().max(20, "NIK maksimal 20 digit").optional().or(z.literal("")),
  npwp: z.string().max(25, "NPWP maksimal 25 digit").optional().or(z.literal("")),
  bankName: z.string().optional(),
  bankAccount: z.string().optional(),
  bankAccountName: z.string().optional(),
  createUserAccount: z.boolean().optional().default(false),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;

export const updateEmployeeSchema = createEmployeeSchema.extend({
  id: z.string().uuid("ID pegawai tidak valid"),
});

export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;

export const unmaskFieldSchema = z.object({
  employeeId: z.string().uuid("ID pegawai tidak valid"),
  field: z.enum(["nik", "npwp", "bankAccount"], {
    errorMap: () => ({ message: "Field sensitif tidak valid" }),
  }),
});

export type UnmaskFieldInput = z.infer<typeof unmaskFieldSchema>;
