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

export const BROADCAST_CATEGORIES = [
  "UMUM",
  "KEPEGAWAIAN",
  "PAYROLL",
  "ACARA",
  "KEBIJAKAN",
  "DARURAT",
] as const;

export const broadcastCategorySchema = z.enum(BROADCAST_CATEGORIES);
export type BroadcastCategory = z.infer<typeof broadcastCategorySchema>;

export const BROADCAST_CATEGORY_LABELS: Record<BroadcastCategory, string> = {
  UMUM: "Umum",
  KEPEGAWAIAN: "Kepegawaian",
  PAYROLL: "Payroll & Kompensasi",
  ACARA: "Acara & Kegiatan",
  KEBIJAKAN: "Kebijakan & Regulasi",
  DARURAT: "Darurat / Mendesak",
};

export const BROADCAST_PRIORITIES = ["NORMAL", "PENTING"] as const;
export const broadcastPrioritySchema = z.enum(BROADCAST_PRIORITIES);
export type BroadcastPriority = z.infer<typeof broadcastPrioritySchema>;

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
  category: broadcastCategorySchema.optional().nullable(),
  priority: broadcastPrioritySchema.default("NORMAL"),
  requireReadReceipt: z.boolean().default(false),
  targetScope: broadcastScopeSchema.default("TEAM"),
  targetDepartmentId: z.string().trim().optional().nullable(),
  targetDepartmentIds: z.array(z.string().trim()).max(1000).optional().default([]),
  customEmployeeIds: z.array(z.string().trim()).max(1000).optional().default([]),
  excludedEmployeeIds: z.array(z.string().trim()).max(1000).optional().default([]),
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
  attachmentIds: z.array(z.string().trim()).max(3, "Maksimal 3 berkas lampiran PDF.").optional().default([]),
  scheduledAt: z.coerce.date().optional().nullable(),
}).superRefine((data, ctx) => {
  if (data.scheduledAt) {
    const minTime = new Date(Date.now() + 4 * 60 * 1000); // Toleransi toleran 4-5 menit
    const maxTime = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 hari ke depan
    if (data.scheduledAt < minTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["scheduledAt"],
        message: "Waktu jadwal pengiriman minimal 5 menit dari sekarang.",
      });
    }
    if (data.scheduledAt > maxTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["scheduledAt"],
        message: "Waktu jadwal pengiriman maksimal 90 hari ke depan.",
      });
    }
  }
});

export type BroadcastScope = z.infer<typeof broadcastScopeSchema>;
export type SenderPersona = z.infer<typeof senderPersonaSchema>;
export type ReplyToMode = z.infer<typeof replyToModeSchema>;

export type SendBroadcastInput = z.input<typeof sendBroadcastSchema>;
export type SendBroadcastOutput = z.output<typeof sendBroadcastSchema>;

export const sendTestBroadcastSchema = z.object({
  subject: z
    .string()
    .trim()
    .min(3, "Subjek pengumuman minimal 3 karakter.")
    .max(200, "Subjek pengumuman maksimal 200 karakter."),
  contentHtml: z
    .string()
    .trim()
    .min(10, "Isi pesan pengumuman tidak boleh kosong (minimal 10 karakter)."),
  category: broadcastCategorySchema.optional().nullable(),
  priority: broadcastPrioritySchema.default("NORMAL"),
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
  attachmentIds: z.array(z.string().trim()).max(3, "Maksimal 3 berkas lampiran PDF.").optional().default([]),
});

export type SendTestBroadcastInput = z.input<typeof sendTestBroadcastSchema>;
export type SendTestBroadcastOutput = z.output<typeof sendTestBroadcastSchema>;

export const saveBroadcastDraftSchema = z.object({
  id: z.string().trim().optional(),
  title: z
    .string()
    .trim()
    .max(150, "Judul draf maksimal 150 karakter.")
    .optional()
    .default(""),
  subject: z
    .string()
    .trim()
    .max(200, "Subjek pengumuman maksimal 200 karakter.")
    .optional()
    .default(""),
  contentHtml: z
    .string()
    .max(500 * 1024, "Ukuran naskah draf maksimal 500 KB.")
    .optional()
    .default(""),
  category: broadcastCategorySchema.optional().nullable(),
  priority: broadcastPrioritySchema.default("NORMAL"),
  requireReadReceipt: z.boolean().default(false),
  targetScope: broadcastScopeSchema.default("TEAM"),
  targetDepartmentIds: z.array(z.string().trim()).max(1000).optional().default([]),
  customEmployeeIds: z.array(z.string().trim()).max(1000).optional().default([]),
  excludedEmployeeIds: z.array(z.string().trim()).max(1000).optional().default([]),
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
  sendInApp: z.boolean().default(true),
  attachmentIds: z
    .array(z.string().trim())
    .max(3, "Maksimal 3 berkas lampiran PDF.")
    .optional()
    .default([]),
  scheduledAt: z.coerce.date().optional().nullable(),
});

export type SaveBroadcastDraftInput = z.input<typeof saveBroadcastDraftSchema>;
export type SaveBroadcastDraftOutput = z.output<typeof saveBroadcastDraftSchema>;

export const MAX_ATTACHMENT_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB per berkas
export const MAX_ATTACHMENTS_COUNT = 3;
export const MAX_TOTAL_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB total

export interface BroadcastAttachmentItem {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  key: string;
  url?: string;
  createdAt?: Date;
}

export interface BroadcastDraftItem {
  id: string;
  ownerUserId: string;
  title: string;
  subject: string;
  contentHtml: string;
  category?: BroadcastCategory | null;
  priority?: BroadcastPriority;
  requireReadReceipt?: boolean;
  targetScope: BroadcastScope;
  targetDepartmentIds: string[];
  customEmployeeIds: string[];
  excludedEmployeeIds: string[];
  senderPersona: SenderPersona;
  customSenderName: string | null;
  replyToMode: ReplyToMode;
  customReplyToEmail: string | null;
  sendInApp: boolean;
  scheduledAt?: Date | null;
  attachmentIds?: string[];
  attachments?: BroadcastAttachmentItem[];
  createdAt: Date;
  updatedAt: Date;
}

export const saveBroadcastTemplateSchema = z.object({
  id: z.string().trim().optional(),
  name: z
    .string()
    .trim()
    .min(2, "Nama template minimal 2 karakter.")
    .max(100, "Nama template maksimal 100 karakter."),
  category: z
    .string()
    .trim()
    .max(50, "Kategori template maksimal 50 karakter.")
    .optional()
    .nullable(),
  subject: z
    .string()
    .trim()
    .min(3, "Subjek pengumuman minimal 3 karakter.")
    .max(200, "Subjek pengumuman maksimal 200 karakter."),
  contentHtml: z
    .string()
    .min(1, "Isi naskah template tidak boleh kosong.")
    .max(500 * 1024, "Ukuran naskah template maksimal 500 KB."),
  isShared: z.boolean().default(false),
});

export type SaveBroadcastTemplateInput = z.input<typeof saveBroadcastTemplateSchema>;
export type SaveBroadcastTemplateOutput = z.output<typeof saveBroadcastTemplateSchema>;

export interface BroadcastTemplateItem {
  id: string;
  name: string;
  category: string | null;
  subject: string;
  contentHtml: string;
  isShared: boolean;
  createdByUserId: string;
  isOwner: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ResolvedSenderIdentity {
  displayName: string;
  displayTitle: string;
  isPersonal: boolean;
  replyToHeader: string;
  replyToEmail: string;
  replyToMode: ReplyToMode;
}

export interface BroadcastSenderContext {
  userId: string;
  userEmail: string;
  userName: string;
  employeeId: string | null;
  employeeTitle: string;
  isSuperAdmin: boolean;
  isAdminHr: boolean;
  isManager: boolean;
  /** Boleh kirim ke semua/divisi/kustom, dan memakai persona lembaga/HR/kustom. */
  canSendAll: boolean;
  /** Boleh kirim ke tim bawahan sendiri. */
  canSendTeam: boolean;
  allowedScopes: Array<"ALL_EMPLOYEES" | "DEPARTMENT" | "TEAM" | "CUSTOM">;
  teamMembersCount: number;
}

/** Aturan "email bisa dikirimi" yang SAMA dipakai di server dan client. */
export function hasDeliverableEmail(email?: string | null): boolean {
  return !!email && email.includes("@");
}

/** Cegah header injection / tanda kutip merusak header Reply-To. */
function toHeaderName(value: string): string {
  return value.replace(/[\r\n"\\<>]/g, "").trim();
}

/**
 * Menerjemahkan pilihan persona dan mode balasan menjadi nama tampilan resmi, sub-judul,
 * dan header Reply-To email. Bersifat murni (*isomorphic*) sehingga aman dipakai di Server maupun Client React.
 */
export function resolveSenderIdentity(
  senderCtx: BroadcastSenderContext,
  persona: SenderPersona = "ORGANIZATION",
  customSenderName?: string | null,
  replyToMode: ReplyToMode = "NO_REPLY",
  customReplyToEmail?: string | null,
): ResolvedSenderIdentity {
  let displayName = "Pusat Studi Pendidikan dan Kebijakan (PSPK)";
  let displayTitle = "Pengumuman Resmi Institusi";
  let isPersonal = false;

  switch (persona) {
    case "HR_TEAM":
      displayName = "Tim People & Culture (HR) PSPK";
      displayTitle = "Pengumuman Kepegawaian & Operasional";
      break;
    case "PERSONAL":
      displayName = senderCtx.userName;
      displayTitle = senderCtx.employeeTitle;
      isPersonal = true;
      break;
    case "CUSTOM":
      displayName = customSenderName?.trim() || "Pusat Studi Pendidikan dan Kebijakan (PSPK)";
      displayTitle = "Pengumuman Khusus Lembaga";
      break;
    case "ORGANIZATION":
    default:
      displayName = "Pusat Studi Pendidikan dan Kebijakan (PSPK)";
      displayTitle = "Pengumuman Resmi Institusi";
      break;
  }

  // Resolusi alamat Reply-To
  let replyToEmail = "no-reply@pspk.id";
  let replyToHeader = `"PSPK HRIS (No Reply)" <no-reply@pspk.id>`;

  switch (replyToMode) {
    case "ORGANIZATION_HR":
      replyToEmail = "hr@pspk.id";
      replyToHeader = `"Tim People & Culture PSPK" <hr@pspk.id>`;
      break;
    case "SENDER_PERSONAL":
      replyToEmail = senderCtx.userEmail || "no-reply@pspk.id";
      replyToHeader = `"${toHeaderName(senderCtx.userName)}" <${replyToEmail}>`;
      break;
    case "CUSTOM":
      if (customReplyToEmail?.trim()) {
        replyToEmail = customReplyToEmail.trim();
        replyToHeader = `"${toHeaderName(displayName)}" <${replyToEmail}>`;
      }
      break;
    case "NO_REPLY":
    default:
      replyToEmail = "no-reply@pspk.id";
      replyToHeader = `"PSPK HRIS (No Reply)" <no-reply@pspk.id>`;
      break;
  }

  return {
    displayName,
    displayTitle,
    isPersonal,
    replyToHeader,
    replyToEmail,
    replyToMode,
  };
}


