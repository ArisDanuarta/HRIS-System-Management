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
  attendanceId: z.string().uuid().optional(),
  employeeId: z.string().uuid({ message: "ID Pegawai wajib diisi" }),
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
