import { z } from "zod";

export const broadcastScopeSchema = z.enum([
  "ALL_EMPLOYEES",
  "DEPARTMENT",
  "TEAM",
  "CUSTOM",
]);

export const sendBroadcastSchema = z.object({
  subject: z
    .string()
    .trim()
    .min(3, "Subjek pengumuman minimal 3 karakter.")
    .max(200, "Subjek pengumuman maksimal 200 karakter."),
  contentHtml: z
    .string()
    .trim()
    .min(10, "Isi pesan pengumuman tidak boleh kosong (minimal 10 karakter)."),
  targetScope: broadcastScopeSchema.default("TEAM"),
  targetDepartmentId: z.string().trim().optional().nullable(),
  customEmployeeIds: z.array(z.string().trim()).optional().default([]),
  sendInApp: z.boolean().default(true),
});

export type SendBroadcastInput = z.infer<typeof sendBroadcastSchema>;
