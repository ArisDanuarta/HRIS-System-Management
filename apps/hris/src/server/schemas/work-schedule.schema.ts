import { z } from "zod";

export const workScheduleSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, "Nama jadwal minimal 3 karakter"),
  workStartTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format jam masuk tidak valid (HH:mm)"),
  workEndTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format jam pulang tidak valid (HH:mm)"),
  gracePeriodMins: z
    .number({ invalid_type_error: "Toleransi keterlambatan harus berupa angka" })
    .min(0, "Toleransi minimal 0 menit")
    .max(120, "Toleransi maksimal 120 menit"),
  workingDays: z
    .array(z.number().min(1).max(7))
    .min(1, "Pilih minimal satu hari kerja aktif"),
  isFlexible: z.boolean().default(false),
  departmentId: z.string().nullable().optional(),
});

export type WorkScheduleInput = z.infer<typeof workScheduleSchema>;
