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

export const submitStaffSelfReviewSchema = z.object({
  reviewId: z.string().uuid("ID review tidak valid"),
  selfScore: z
    .number({ required_error: "Skor evaluasi mandiri wajib diisi" })
    .min(0, "Skor minimal 0")
    .max(100, "Skor maksimal 100"),
  selfComment: z
    .string({ required_error: "Refleksi capaian & kendala wajib diisi" })
    .trim()
    .min(10, "Refleksi capaian minimal 10 karakter"),
  goalActuals: z
    .array(
      z.object({
        goalId: z.string().uuid("ID target sasaran tidak valid"),
        actual: z.string().trim().optional().nullable(),
      })
    )
    .optional(),
});

export type SubmitStaffSelfReviewInput = z.infer<typeof submitStaffSelfReviewSchema>;

export const createGoalSchema = z.object({
  employeeId: z.string().uuid("ID pegawai tidak valid"),
  periodId: z.string().uuid("ID periode tidak valid"),
  title: z
    .string({ required_error: "Judul sasaran riset wajib diisi" })
    .trim()
    .min(3, "Judul sasaran minimal 3 karakter")
    .max(200, "Judul sasaran maksimal 200 karakter"),
  description: z.string().trim().optional().nullable(),
  weight: z
    .number({ required_error: "Bobot sasaran wajib diisi" })
    .min(1, "Bobot minimal 1%")
    .max(100, "Bobot maksimal 100%"),
  target: z.string().trim().optional().nullable(),
  unit: z.string().trim().optional().nullable(),
});

export type CreateGoalInput = z.infer<typeof createGoalSchema>;

export const deleteGoalSchema = z.object({
  goalId: z.string().uuid("ID sasaran tidak valid"),
});

export type DeleteGoalInput = z.infer<typeof deleteGoalSchema>;

export const updateGoalSchema = z.object({
  goalId: z.string().uuid("ID sasaran tidak valid"),
  title: z
    .string({ required_error: "Judul sasaran riset wajib diisi" })
    .trim()
    .min(3, "Judul sasaran minimal 3 karakter")
    .max(200, "Judul sasaran maksimal 200 karakter"),
  description: z.string().trim().optional().nullable(),
  weight: z
    .number({ required_error: "Bobot sasaran wajib diisi" })
    .min(1, "Bobot minimal 1%")
    .max(100, "Bobot maksimal 100%"),
  target: z.string().trim().optional().nullable(),
  unit: z.string().trim().optional().nullable(),
});

export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;

export const submitManagerReviewSchema = z.object({
  reviewId: z.string().uuid("ID evaluasi kinerja tidak valid"),
  managerScore: z
    .number({ required_error: "Skor atasan langsung wajib diisi" })
    .min(0, "Skor minimal 0")
    .max(100, "Skor maksimal 100"),
  managerComment: z
    .string({ required_error: "Catatan evaluasi & pembinaan atasan wajib diisi" })
    .trim()
    .min(10, "Catatan evaluasi atasan minimal 10 karakter"),
});

export type SubmitManagerReviewInput = z.infer<typeof submitManagerReviewSchema>;

export const requestReviewRevisionSchema = z.object({
  reviewId: z.string().uuid("ID evaluasi kinerja tidak valid"),
  reason: z
    .string({ required_error: "Catatan alasan revisi wajib diisi" })
    .trim()
    .min(5, "Alasan permintaan revisi minimal 5 karakter"),
});

export type RequestReviewRevisionInput = z.infer<typeof requestReviewRevisionSchema>;

export const unlockPerformanceReviewSchema = z.object({
  reviewId: z.string().uuid("ID evaluasi kinerja tidak valid"),
  reason: z
    .string({ required_error: "Alasan pembukaan kunci evaluasi wajib diisi" })
    .trim()
    .min(5, "Alasan pembukaan kunci minimal 5 karakter"),
});

export type UnlockPerformanceReviewInput = z.infer<typeof unlockPerformanceReviewSchema>;


