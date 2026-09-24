import { z } from "zod";

export const createPerformancePeriodSchema = z.object({
  name: z
    .string({ required_error: "Nama periode evaluasi wajib diisi" })
    .trim()
    .min(3, "Nama periode minimal 3 karakter")
    .max(150, "Nama periode maksimal 150 karakter"),
  startDate: z
    .string({ required_error: "Tanggal mulai wajib diisi" })
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal mulai harus YYYY-MM-DD"),
  endDate: z
    .string({ required_error: "Tanggal selesai wajib diisi" })
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal selesai harus YYYY-MM-DD"),
  status: z.enum(["OPEN", "CLOSED"]).default("OPEN"),
}).refine(
  (data) => new Date(data.endDate) >= new Date(data.startDate),
  {
    message: "Tanggal selesai tidak boleh sebelum tanggal mulai",
    path: ["endDate"],
  }
);

export type CreatePerformancePeriodInput = z.infer<typeof createPerformancePeriodSchema>;

export const updatePerformancePeriodStatusSchema = z.object({
  id: z.string().uuid("ID periode tidak valid"),
  status: z.enum(["OPEN", "CLOSED"], {
    required_error: "Status periode wajib dipilih",
  }),
});

export type UpdatePerformancePeriodStatusInput = z.infer<
  typeof updatePerformancePeriodStatusSchema
>;

export const finalizePerformanceReviewSchema = z.object({
  reviewId: z.string().uuid("ID review tidak valid"),
  finalScore: z
    .number({ required_error: "Skor akhir wajib diisi" })
    .min(0, "Skor minimal 0")
    .max(100, "Skor maksimal 100"),
  managerComment: z.string().optional(),
  hrNote: z.string().optional(),
});

export type FinalizePerformanceReviewInput = z.infer<
  typeof finalizePerformanceReviewSchema
>;

export const performanceGoalItemSchema = z.object({
  id: z.string().uuid().optional(),
  title: z
    .string({ required_error: "Judul target sasaran wajib diisi" })
    .trim()
    .min(3, "Judul target minimal 3 karakter"),
  description: z.string().optional().nullable(),
  weight: z
    .number({ required_error: "Bobot sasaran wajib diisi" })
    .min(1, "Bobot minimal 1%")
    .max(100, "Bobot maksimal 100%"),
  target: z.string().optional().nullable(),
  unit: z.string().optional().nullable(),
  actual: z.string().optional().nullable(),
});

export const savePerformanceGoalsSchema = z.object({
  employeeId: z.string().uuid("ID pegawai tidak valid"),
  periodId: z.string().uuid("ID periode tidak valid"),
  goals: z
    .array(performanceGoalItemSchema)
    .min(1, "Minimal harus ada 1 target sasaran"),
});

export type SavePerformanceGoalsInput = z.infer<typeof savePerformanceGoalsSchema>;
