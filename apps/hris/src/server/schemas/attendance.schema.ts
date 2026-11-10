import { z } from "zod";

export const attendanceStatusEnum = z.enum([
  "PRESENT",
  "LATE",
  "ABSENT",
  "LEAVE",
  "HOLIDAY",
  "WFH",
]);

export const checkInSchema = z.object({
  notes: z.string().max(255).optional(),
});

export const checkOutSchema = z.object({
  notes: z.string().max(255).optional(),
});

export const correctAttendanceSchema = z.object({
  attendanceId: z.string().min(1).optional(),
  employeeId: z.string().min(1, { message: "ID Pegawai wajib diisi" }),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Format tanggal harus YYYY-MM-DD" }),
  checkInAt: z.string().optional().nullable(),
  checkOutAt: z.string().optional().nullable(),
  status: attendanceStatusEnum,
  correctionReason: z
    .string()
    .min(5, { message: "Alasan koreksi wajib diisi minimal 5 karakter untuk audit" }),
});

export type CheckInInput = z.infer<typeof checkInSchema>;
export type CheckOutInput = z.infer<typeof checkOutSchema>;
export type CorrectAttendanceInput = z.infer<typeof correctAttendanceSchema>;

export const bulkFillCheckOutSchema = z.object({
  year: z.number().int().min(2020, { message: "Tahun tidak valid" }),
  month: z.number().int().min(1).max(12, { message: "Bulan harus antara 1 sampai 12" }),
  departmentId: z.string().optional(),
  checkOutTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
      message: "Format jam check-out harus HH:mm (contoh: 17:00)",
    })
    .default("17:00"),
  reason: z
    .string()
    .min(3, { message: "Alasan penyesuaian wajib diisi minimal 3 karakter" })
    .default("Penyesuaian massal check-out oleh HR"),
});

export type BulkFillCheckOutInput = z.infer<typeof bulkFillCheckOutSchema>;
