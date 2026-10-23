import { z } from "zod";

export const broadcastScopeSchema = z.enum([
  "ALL_EMPLOYEES",
  "DEPARTMENT",
  "TEAM",
  "CUSTOM",
]);

export const senderPersonaSchema = z.enum([
  "ORGANIZATION",
  "HR_TEAM",
  "PERSONAL",
  "CUSTOM",
]);

export const replyToModeSchema = z.enum([
  "NO_REPLY",
  "ORGANIZATION_HR",
  "SENDER_PERSONAL",
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
  senderPersona: senderPersonaSchema.default("ORGANIZATION"),
  customSenderName: z
    .string()
    .trim()
    .max(100, "Nama pengirim kustom maksimal 100 karakter.")
    .optional()
    .nullable(),
  replyToMode: replyToModeSchema.default("NO_REPLY"),
  customReplyToEmail: z
    .string()
    .trim()
    .email("Format alamat email balasan kustom tidak valid.")
    .optional()
    .nullable()
    .or(z.literal("")),
});

export type BroadcastScope = z.infer<typeof broadcastScopeSchema>;
export type SenderPersona = z.infer<typeof senderPersonaSchema>;
export type ReplyToMode = z.infer<typeof replyToModeSchema>;

export type SendBroadcastInput = z.input<typeof sendBroadcastSchema>;
export type SendBroadcastOutput = z.output<typeof sendBroadcastSchema>;

