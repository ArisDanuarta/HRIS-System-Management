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
  allowedScopes: Array<"ALL_EMPLOYEES" | "DEPARTMENT" | "TEAM" | "CUSTOM">;
  teamMembersCount: number;
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
      replyToHeader = `"${senderCtx.userName}" <${replyToEmail}>`;
      break;
    case "CUSTOM":
      if (customReplyToEmail?.trim()) {
        replyToEmail = customReplyToEmail.trim();
        replyToHeader = `"${displayName}" <${replyToEmail}>`;
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


