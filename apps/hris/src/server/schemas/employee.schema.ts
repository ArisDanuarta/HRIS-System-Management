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

export const EmploymentTypeEnum = z.enum(["PERMANENT", "FIXED_TERM", "PART_TIME_PROJECT"]);

export const AccountRoleEnum = z.enum(["staff", "manager", "admin_hr", "admin_it"]);

export const PtkpStatusEnum = z.enum([
  "TK_0",
  "TK_1",
  "TK_2",
  "TK_3",
  "K_0",
  "K_1",
  "K_2",
  "K_3",
]);

export const TaxMethodEnum = z.enum(["GROSS", "GROSS_UP", "NETT"]);

export const employeeFamilyMemberInputSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Nama anggota keluarga wajib diisi"),
  relation: z.string().min(1, "Pilih hubungan keluarga"),
  birthDate: z.string().optional().nullable().or(z.literal("")),
  phone: z.string().optional().nullable().or(z.literal("")),
  isDependent: z.boolean().optional().default(false),
  notes: z.string().optional().nullable().or(z.literal("")),
});

export const employeeEducationInputSchema = z.object({
  id: z.string().optional(),
  level: z.string().min(1, "Pilih jenjang pendidikan"),
  institution: z.string().min(1, "Nama institusi/kampus wajib diisi"),
  major: z.string().optional().nullable().or(z.literal("")),
  graduationYear: z.coerce.number().optional().nullable(),
  gpa: z.string().optional().nullable().or(z.literal("")),
});

export const employeeTrainingInputSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Nama pelatihan/sertifikasi wajib diisi"),
  participationType: z.string().optional().nullable().or(z.literal("")),
  startDate: z.string().optional().nullable().or(z.literal("")),
  endDate: z.string().optional().nullable().or(z.literal("")),
  duration: z.string().optional().nullable().or(z.literal("")),
  location: z.string().optional().nullable().or(z.literal("")),
  organizer: z.string().optional().nullable().or(z.literal("")),
});

export const employeeWorkExperienceInputSchema = z.object({
  id: z.string().optional(),
  companyName: z.string().min(1, "Nama perusahaan wajib diisi"),
  jobTitle: z.string().min(1, "Jabatan wajib diisi"),
  startDate: z.string().min(1, "Tanggal mulai kerja wajib diisi"),
  endDate: z.string().optional().nullable().or(z.literal("")),
  reasonForLeaving: z.string().optional().nullable().or(z.literal("")),
  description: z.string().optional().nullable().or(z.literal("")),
});

export const baseEmployeeSchema = z.object({
  fullName: z.string().min(3, "Nama lengkap minimal 3 karakter"),
  nickname: z.string().optional(),
  workEmail: z
    .string()
    .email("Format email kantor tidak valid")
    .refine((val) => val.toLowerCase().trim().endsWith("@pspk.id"), {
      message: "Email kantor wajib menggunakan domain resmi @pspk.id (contoh: nama@pspk.id)",
    }),
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
  currentDepartmentId: z.string().min(1, "Pilih divisi/departemen yang valid"),
  currentPositionId: z.string().min(1, "Pilih jabatan/posisi yang valid"),
  managerId: z.string().min(1).optional().or(z.literal("")).nullable(),
  joinDate: z.string().min(1, "Tanggal mulai bergabung wajib diisi"),
  status: EmployeeStatusEnum.default("ACTIVE"),
  employmentType: EmploymentTypeEnum.default("PERMANENT"),
  employmentTypeId: z.string().min(1).optional().or(z.literal("")),
  wageType: z.enum(["MONTHLY", "HOURLY"]).optional().default("MONTHLY"),
  hourlyRate: z.coerce.number().min(0, "Tarif per jam tidak boleh negatif").optional().nullable(),
  contractStartDate: z.string().min(1, "Tanggal mulai kontrak kerja wajib diisi"),
  contractEndDate: z.string().optional().or(z.literal("")),
  baseSalary: z.coerce.number().min(0, "Gaji pokok tidak boleh negatif").optional().nullable(),
  allowancePosition: z.coerce.number().min(0, "Tunjangan jabatan tidak boleh negatif").optional().default(0),
  allowanceTransport: z.coerce.number().min(0, "Tunjangan transportasi tidak boleh negatif").optional().default(0),
  allowanceCommunication: z.coerce.number().min(0, "Tunjangan komunikasi tidak boleh negatif").optional().default(0),
  allowanceOther: z.coerce.number().min(0, "Tunjangan lainnya tidak boleh negatif").optional().default(0),
  allowanceOtherNote: z.string().optional().or(z.literal("")),
  contractNotes: z.string().optional(),
  contractNumber: z
    .string()
    .max(100, "Nomor kontrak maksimal 100 karakter")
    .optional()
    .nullable()
    .or(z.literal("")),
  contractDocumentKey: z.string().optional().nullable().or(z.literal("")),
  nik: z.string().max(20, "NIK maksimal 20 digit").optional().or(z.literal("")),
  npwp: z.string().max(25, "NPWP maksimal 25 digit").optional().or(z.literal("")),
  ptkpStatus: PtkpStatusEnum.default("TK_0"),
  taxMethod: TaxMethodEnum.default("GROSS"),
  bankName: z.string().optional(),
  bankAccount: z.string().optional(),
  bankAccountName: z.string().optional(),
  passportKitas: z.string().max(50).optional().or(z.literal("")),
  bpjsKesehatanNo: z.string().max(25).optional().or(z.literal("")),
  bpjsKetenagakerjaanNo: z.string().max(25).optional().or(z.literal("")),
  citizenship: z.enum(["WNI", "WNA"]).optional().default("WNI"),
  religion: z.string().optional().or(z.literal("")),
  bloodType: z.string().optional().or(z.literal("")),
  motherName: z.string().optional().or(z.literal("")),
  landlinePhone: z.string().optional().or(z.literal("")),
  emergencyContactRelation: z.string().optional().or(z.literal("")),
  workLocationId: z.string().optional().or(z.literal("")),
  legalEntityId: z.string().optional().or(z.literal("")),
  probationEndDate: z.string().optional().or(z.literal("")),
  endDate: z.string().optional().or(z.literal("")),
  addressKtp: z
    .object({
      street: z.string().default(""),
      kelurahan: z.string().optional(),
      kecamatan: z.string().optional(),
      city: z.string().optional(),
      province: z.string().optional(),
      postalCode: z.string().optional(),
    })
    .optional(),
  addressDomicile: z
    .object({
      street: z.string().default(""),
      kelurahan: z.string().optional(),
      kecamatan: z.string().optional(),
      city: z.string().optional(),
      province: z.string().optional(),
      postalCode: z.string().optional(),
    })
    .optional(),
  familyMembers: z.array(z.any()).optional(),
  educations: z.array(z.any()).optional(),
  trainings: z.array(z.any()).optional(),
  workExperiences: z.array(z.any()).optional(),
  createUserAccount: z.boolean().optional().default(true),
  accountRole: AccountRoleEnum.optional().default("staff"),
});

export const createEmployeeSchema = baseEmployeeSchema.superRefine((data, ctx) => {
  if (data.createUserAccount) {
    if (!data.personalEmail || data.personalEmail.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["personalEmail"],
        message: "Email pribadi wajib diisi untuk pengiriman kredensial login akun pegawai.",
      });
    } else if (data.personalEmail.toLowerCase().trim().endsWith("@pspk.id")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["personalEmail"],
        message: "Email pribadi harus merupakan email pribadi (bukan email kantor @pspk.id).",
      });
    }
  }
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;

export const updateEmployeeSchema = baseEmployeeSchema.extend({
  id: z.string().min(1, "ID pegawai tidak valid"),
});

export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;

export const unmaskFieldSchema = z.object({
  employeeId: z.string().min(1, "ID pegawai tidak valid"),
  field: z.enum(["nik", "npwp", "bankAccount", "passportKitas", "bpjsKes", "bpjsTk"], {
    errorMap: () => ({ message: "Field sensitif tidak valid" }),
  }),
});

export type UnmaskFieldInput = z.infer<typeof unmaskFieldSchema>;

export const attachContractDocumentSchema = z.object({
  contractId: z.string().min(1, "ID kontrak tidak valid"),
  employeeId: z.string().min(1, "ID pegawai tidak valid"),
  documentKey: z.string().min(1, "Kunci berkas dokumen wajib diunggah"),
  notes: z.string().max(500, "Catatan maksimal 500 karakter").optional().nullable(),
});

export type AttachContractDocumentInput = z.infer<typeof attachContractDocumentSchema>;
