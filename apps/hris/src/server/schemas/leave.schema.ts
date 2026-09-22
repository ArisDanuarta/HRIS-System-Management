import { z } from "zod";

export const leaveStatusEnum = z.enum([
  "DRAFT",
  "PENDING",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
]);

export const createLeaveRequestSchema = z.object({
  leaveTypeId: z.string().uuid({ message: "Pilih jenis cuti yang valid" }),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Tanggal mulai harus YYYY-MM-DD" }),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Tanggal akhir harus YYYY-MM-DD" }),
  reason: z.string().min(3, { message: "Alasan pengajuan cuti minimal 3 karakter" }).max(500),
  attachmentKey: z.string().optional().nullable(),
});

export const approveLeaveRequestSchema = z.object({
  leaveRequestId: z.string().uuid({ message: "ID Permohonan cuti tidak valid" }),
  decisionNote: z.string().max(500).optional(),
});

export const rejectLeaveRequestSchema = z.object({
  leaveRequestId: z.string().uuid({ message: "ID Permohonan cuti tidak valid" }),
  decisionNote: z.string().min(3, { message: "Catatan penolakan cuti wajib diisi minimal 3 karakter" }).max(500),
});

export const cancelLeaveRequestSchema = z.object({
  leaveRequestId: z.string().uuid({ message: "ID Permohonan cuti tidak valid" }),
  cancellationReason: z.string().max(500).optional(),
});

export const createHolidaySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Tanggal libur harus YYYY-MM-DD" }),
  name: z.string().min(3, { message: "Nama hari libur minimal 3 karakter" }).max(100),
  isCollectiveLeave: z.boolean().default(false),
});

export const updateLeaveTypeSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2, { message: "Nama jenis cuti minimal 2 karakter" }),
  defaultQuotaDays: z.number().int().min(0, { message: "Kuota default tidak boleh negatif" }),
  isPaid: z.boolean(),
  requiresAttachment: z.boolean(),
  isActive: z.boolean(),
});

export type CreateLeaveRequestInput = z.infer<typeof createLeaveRequestSchema>;
export type ApproveLeaveRequestInput = z.infer<typeof approveLeaveRequestSchema>;
export type RejectLeaveRequestInput = z.infer<typeof rejectLeaveRequestSchema>;
export type CancelLeaveRequestInput = z.infer<typeof cancelLeaveRequestSchema>;
export type CreateHolidayInput = z.infer<typeof createHolidaySchema>;
export type UpdateLeaveTypeInput = z.infer<typeof updateLeaveTypeSchema>;
