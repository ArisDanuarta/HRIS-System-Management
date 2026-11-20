import nodemailer, { type Transporter } from "nodemailer";
import sanitizeHtml from "sanitize-html";
import { prisma, writeAudit, BroadcastStatus } from "@pspk/db";
import { getAuthContext } from "@pspk/auth";
import { can } from "@pspk/rbac";
import { getStorageProvider } from "@pspk/storage";
import {
  SendBroadcastInput,
  SendTestBroadcastInput,
  ReplyToMode,
  BroadcastCategory,
  BroadcastPriority,
  BROADCAST_CATEGORY_LABELS,
  BroadcastSenderContext,
  resolveSenderIdentity,
  hasDeliverableEmail,
  MAX_ATTACHMENTS_COUNT,
  MAX_TOTAL_ATTACHMENT_SIZE_BYTES,
} from "../schemas/broadcast.schema";

export type { BroadcastSenderContext };

export interface RecipientInfo {
  id: string;
  fullName: string;
  workEmail: string;
  userId: string | null;
  departmentName?: string | null;
}

export interface EnqueueBroadcastResult {
  success: boolean;
  broadcastId: string;
  totalRecipients: number;
  message: string;
  scheduled?: boolean;
  scheduledAt?: Date | null;
}

export interface ProcessBroadcastResult {
  processed: boolean;
  broadcastId: string;
  sentCount: number;
  failedCount: number;
  finalStatus?: BroadcastStatus;
  simulated?: boolean;
  reason?: string;
}

export interface SendBroadcastResult {
  success: boolean;
  broadcastId: string;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  simulated: boolean;
  message: string;
}

export interface SendTestBroadcastResult {
  success: boolean;
  message: string;
  simulated?: boolean;
}

export interface ResendFailedBroadcastResult {
  success: boolean;
  broadcastId: string;
  retriedCount: number;
  message: string;
}

/**
 * Mengidentifikasi konteks otorisasi pengirim, peran, dan cakupan (scope) target yang diizinkan.
 */
export async function getBroadcastSenderContext(
  userId: string,
): Promise<BroadcastSenderContext> {
  const authCtx = await getAuthContext(userId);
  if (!authCtx) {
    throw new Error("Konteks otentikasi pengguna tidak ditemukan.");
  }

  const isSuperAdmin = authCtx.roles.includes("super_admin");
  const isAdminHr = authCtx.roles.includes("admin_hr");
  const isManager = authCtx.roles.includes("manager");

  // Berbasis permission; role bawaan tetap jadi fallback selama transisi.
  const canSendAll =
    isSuperAdmin || isAdminHr || can(authCtx, "hris.broadcast.send:all");
  const canSendTeam =
    canSendAll || isManager || can(authCtx, "hris.broadcast.send:team");

  if (!canSendTeam) {
    throw new Error(
      "Akses ditolak: Anda tidak memiliki izin untuk mengakses modul broadcast pengumuman.",
    );
  }

  // Cari data profil pegawai pengirim
  const employee = await prisma.employee.findFirst({
    where: { userId },
    select: {
      id: true,
      fullName: true,
      workEmail: true,
      currentPosition: {
        select: { title: true, isUnitHead: true },
      },
      currentDepartment: {
        select: { id: true, name: true },
      },
    },
  });

  const employeeTitle =
    employee?.currentPosition?.title ||
    (isSuperAdmin
      ? "Super Administrator"
      : isAdminHr
        ? "Administrator HR"
        : isManager
          ? "Manajer Tim"
          : "Staf Lembaga");

  // Hitung jumlah anggota tim bawahan (jika manajer)
  let teamMembersCount = 0;
  if (employee?.id) {
    teamMembersCount = await prisma.employee.count({
      where: {
        status: "ACTIVE",
        managerId: employee.id,
      },
    });
  }

  const allowedScopes: BroadcastSenderContext["allowedScopes"] = canSendAll
    ? ["ALL_EMPLOYEES", "DEPARTMENT", "TEAM", "CUSTOM"]
    : ["TEAM"];

  return {
    userId,
    userEmail: employee?.workEmail || "",
    userName: employee?.fullName || "Pengguna PSPK",
    employeeId: employee?.id || null,
    employeeTitle,
    isSuperAdmin,
    isAdminHr,
    isManager,
    canSendAll,
    canSendTeam,
    allowedScopes,
    teamMembersCount,
  };
}

/**
 * Menyaring daftar penerima email berdasarkan peran dan cakupan (scope) yang dipilih.
 */
export async function getBroadcastRecipients(
  senderCtx: BroadcastSenderContext,
  targetScope: "ALL_EMPLOYEES" | "DEPARTMENT" | "TEAM" | "CUSTOM",
  departmentIdOrOptions?:
    | string
    | null
    | {
        departmentIds?: string[];
        excludedEmployeeIds?: string[];
      },
  customEmployeeIds?: string[],
  options?: {
    departmentIds?: string[];
    excludedEmployeeIds?: string[];
  },
): Promise<RecipientInfo[]> {
  // Proteksi: yang tidak punya hak "all" hanya boleh ke timnya sendiri
  if (!senderCtx.canSendAll && targetScope !== "TEAM") {
    throw new Error(
      "Akses ditolak: Anda hanya diizinkan mengirim pengumuman ke anggota timnya sendiri.",
    );
  }

  const isThirdArgOptions =
    typeof departmentIdOrOptions === "object" && departmentIdOrOptions !== null;
  const resolvedOptions = isThirdArgOptions ? departmentIdOrOptions : options;
  const resolvedDepartmentId = isThirdArgOptions ? null : departmentIdOrOptions;

  const effectiveDeptIds =
    resolvedOptions?.departmentIds && resolvedOptions.departmentIds.length > 0
      ? resolvedOptions.departmentIds
      : resolvedDepartmentId
        ? [resolvedDepartmentId]
        : [];

  const rawExcludedIds = resolvedOptions?.excludedEmployeeIds || [];
  const excludedIds = rawExcludedIds.filter((id) => Boolean(id && id.trim()));
  const notInExcluded = excludedIds.length > 0 ? { notIn: excludedIds } : undefined;

  let recipients: Array<{
    id: string;
    fullName: string;
    workEmail: string;
    userId: string | null;
    currentDepartment?: { name: string } | null;
  }> = [];

  if (targetScope === "TEAM") {
    if (!senderCtx.employeeId) {
      throw new Error("Akun Anda tidak terhubung dengan profil pegawai manajer.");
    }

    // Ambil bawahan langsung (dengan proteksi pengecualian bila ada)
    recipients = await prisma.employee.findMany({
      where: {
        status: "ACTIVE",
        managerId: senderCtx.employeeId,
        ...(notInExcluded ? { id: notInExcluded } : {}),
      },
      select: {
        id: true,
        fullName: true,
        workEmail: true,
        userId: true,
        currentDepartment: { select: { name: true } },
      },
      orderBy: { fullName: "asc" },
    });
  } else if (targetScope === "DEPARTMENT") {
    if (effectiveDeptIds.length === 0) {
      throw new Error("Departemen tujuan wajib dipilih.");
    }

    recipients = await prisma.employee.findMany({
      where: {
        status: "ACTIVE",
        currentDepartmentId: { in: effectiveDeptIds },
        ...(notInExcluded ? { id: notInExcluded } : {}),
      },
      select: {
        id: true,
        fullName: true,
        workEmail: true,
        userId: true,
        currentDepartment: { select: { name: true } },
      },
      orderBy: { fullName: "asc" },
    });
  } else if (targetScope === "CUSTOM") {
    if (!customEmployeeIds || customEmployeeIds.length === 0) {
      throw new Error("Daftar pegawai tujuan kustom tidak boleh kosong.");
    }

    recipients = await prisma.employee.findMany({
      where: {
        status: "ACTIVE",
        id: {
          in: customEmployeeIds,
          ...(notInExcluded ? { notIn: excludedIds } : {}),
        },
      },
      select: {
        id: true,
        fullName: true,
        workEmail: true,
        userId: true,
        currentDepartment: { select: { name: true } },
      },
      orderBy: { fullName: "asc" },
    });
  } else {
    // ALL_EMPLOYEES (Hanya Super Admin & Admin HR)
    recipients = await prisma.employee.findMany({
      where: {
        status: "ACTIVE",
        ...(notInExcluded ? { id: notInExcluded } : {}),
      },
      select: {
        id: true,
        fullName: true,
        workEmail: true,
        userId: true,
        currentDepartment: { select: { name: true } },
      },
      orderBy: { fullName: "asc" },
    });
  }

  // Filter email valid dan kecualikan pengirim sendiri serta daftar yang dikecualikan
  return recipients
    .filter((r) => hasDeliverableEmail(r.workEmail))
    .filter((r) => !senderCtx.employeeId || r.id !== senderCtx.employeeId)
    .filter((r) => !excludedIds.includes(r.id))
    .map((r) => ({
      id: r.id,
      fullName: r.fullName,
      workEmail: r.workEmail,
      userId: r.userId,
      departmentName: r.currentDepartment?.name || null,
    }));
}

/**
 * Membersihkan konten HTML dari script/XSS berbahaya.
 */
export function sanitizeBroadcastContent(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "p",
      "h2",
      "h3",
      "strong",
      "b",
      "em",
      "i",
      "u",
      "s",
      "strike",
      "ul",
      "ol",
      "li",
      "blockquote",
      "a",
      "img",
      "br",
      "div",
      "span",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel", "class"],
      img: ["src", "alt", "class", "style", "width", "height"],
      div: ["class", "style"],
      p: ["class", "style"],
      span: ["class", "style"],
      blockquote: ["class", "style"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesByTag: { img: ["http", "https"] },
    allowProtocolRelative: false,
  });
}

/**
 * Klien email tidak bisa memuat URL relatif. Ubah hanya saat render email,
 * data di DB tetap relatif supaya halaman in-app tetap jalan.
 */
export function absolutizeImageUrls(html: string): string {
  const base = (
    process.env.HRIS_URL ||
    process.env.NEXT_PUBLIC_HRIS_URL ||
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.BETTER_AUTH_URL ||
    ""
  ).replace(/\/+$/, "");

  if (!base) return html;

  return html.replace(
    /(<img\b[^>]*?\ssrc=")(\/api\/documents\/[^"]+)(")/gi,
    (_m, pre: string, path: string, post: string) => `${pre}${base}${path}${post}`,
  );
}

/**
 * Mengganti variabel personalisasi seperti {{nama}} dan {{nama_depan}} per penerima.
 */
export function replacePersonalizationVariables(
  text: string,
  recipient: { recipientName?: string | null; fullName?: string | null },
): string {
  const rawName = recipient.recipientName || recipient.fullName || "";
  const fullName = rawName.trim() || "Rekan PSPK";
  const firstName = fullName.split(/\s+/)[0] || fullName;

  return text
    .replace(/\{\{\s*nama\s*\}\}/gi, escapeHtml(fullName))
    .replace(/\{\{\s*nama_depan\s*\}\}/gi, escapeHtml(firstName));
}

export { interpolatePreviewVariables } from "../../components/broadcast/broadcast-form-utils";

/**
 * Menghasilkan teks polos tanpa tag HTML untuk fallback email klien lama.
 */
export function htmlToPlainText(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<br\s*[\/]?>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<\/li>/gi, "\n")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<[^>]+>/gi, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n\s+\n/g, "\n\n")
    .trim();
}

export {
  resolveSenderIdentity,
  type ResolvedSenderIdentity,
} from "../schemas/broadcast.schema";

/**
 * Menyusun template HTML email resmi PSPK yang responsif dan kompatibel dengan Gmail/Outlook.
 */
export function renderBroadcastEmailHtml(params: {
  subject: string;
  contentHtml: string;
  recipientName: string;
  senderName: string;
  senderTitle: string;
  scopeBadge: string;
  isPersonal?: boolean;
  replyToMode?: ReplyToMode;
  replyToEmail?: string;
  category?: string | null;
  priority?: string;
  requireReadReceipt?: boolean;
  broadcastId?: string;
  sendInApp?: boolean;
  attachments?: Array<{ fileName: string; sizeBytes: number }>;
  year?: number;
}): string {
  const {
    subject,
    contentHtml,
    recipientName,
    senderName,
    senderTitle,
    scopeBadge,
    isPersonal = true,
    replyToMode = "NO_REPLY",
    replyToEmail,
    category,
    priority = "NORMAL",
    requireReadReceipt = false,
    broadcastId,
    sendInApp = false,
    attachments = [],
    year = new Date().getFullYear(),
  } = params;

  const isNoReply = replyToMode === "NO_REPLY";
  const isPriorityImportant = priority === "PENTING";
  const categoryLabel = category && category in BROADCAST_CATEGORY_LABELS
    ? BROADCAST_CATEGORY_LABELS[category as BroadcastCategory]
    : category || null;

  const hrisBaseUrl = (process.env.HRIS_URL || "http://localhost:3001").replace(/\/$/, "");
  const readerPortalUrl = broadcastId ? `${hrisBaseUrl}/pengumuman/${broadcastId}` : null;

  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(subject)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; color: #1e293b; margin: 0; padding: 24px 12px; line-height: 1.6; }
    .email-container { max-width: 620px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .email-header { background-color: #102E50; padding: 28px 24px; text-align: center; border-bottom: 4px solid #F2AF3E; }
    .email-header h1 { margin: 0; color: #ffffff; font-size: 18px; font-weight: 700; letter-spacing: 0.5px; }
    .email-header p { margin: 6px 0 0 0; color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 1.2px; font-weight: 600; }
    .email-body { padding: 32px 28px; }
    .badge-bar { margin-bottom: 20px; }
    .badge { display: inline-block; background-color: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; font-size: 11px; font-weight: 700; text-transform: uppercase; padding: 4px 10px; border-radius: 9999px; letter-spacing: 0.5px; margin-right: 6px; margin-bottom: 6px; }
    .badge-priority { background-color: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
    .badge-category { background-color: #f8fafc; color: #334155; border: 1px solid #cbd5e1; }
    .sender-card { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; margin-bottom: 24px; font-size: 13px; color: #475569; }
    .sender-name { font-weight: 700; color: #0f172a; }
    .greeting { font-size: 15px; font-weight: 600; color: #102E50; margin-bottom: 16px; }
    .content-area { font-size: 14px; color: #334155; line-height: 1.7; }
    .content-area h2 { font-size: 17px; color: #102E50; margin-top: 20px; margin-bottom: 8px; font-weight: 700; }
    .content-area h3 { font-size: 15px; color: #1e293b; margin-top: 16px; margin-bottom: 6px; font-weight: 600; }
    .content-area ul, .content-area ol { padding-left: 20px; margin: 12px 0; }
    .content-area li { margin-bottom: 4px; }
    .content-area blockquote { border-left: 3px solid #F2AF3E; background-color: #fffdf7; margin: 16px 0; padding: 10px 14px; color: #475569; font-style: italic; border-radius: 0 6px 6px 0; }
    .content-area a { color: #102E50; text-decoration: underline; font-weight: 600; }
    .content-area img { max-width: 100%; height: auto; border-radius: 8px; margin: 16px 0; border: 1px solid #e2e8f0; }
    .portal-cta-box { margin-top: 26px; padding: 16px 20px; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; text-align: center; }
    .portal-cta-btn { display: inline-block; background-color: #102E50; color: #ffffff !important; text-decoration: none !important; font-size: 12.5px; font-weight: 700; padding: 9px 18px; border-radius: 6px; border: 1px solid #0c233d; margin-top: 8px; }
    .reply-box { margin-top: 32px; padding: 14px 16px; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; font-size: 12.5px; color: #166534; line-height: 1.5; }
    .reply-box-noreply { background-color: #f8fafc; border: 1px solid #cbd5e1; color: #475569; }
    .email-footer { background-color: #f8fafc; padding: 22px 24px; text-align: center; font-size: 11.5px; color: #64748b; border-top: 1px solid #e2e8f0; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <h1>Pusat Studi Pendidikan dan Kebijakan</h1>
      <p>Portal Sistem HRIS &amp; Manajemen Organisasi</p>
    </div>
    <div class="email-body">
      <div class="badge-bar">
        <span class="badge">${escapeHtml(scopeBadge)}</span>
        ${isPriorityImportant ? `<span class="badge badge-priority">⚠️ PENTING</span>` : ""}
        ${categoryLabel ? `<span class="badge badge-category">${escapeHtml(categoryLabel)}</span>` : ""}
      </div>

      <div class="sender-card">
        ${
          isPersonal
            ? `Pengumuman diterbitkan oleh: <span class="sender-name">${escapeHtml(senderName)}</span> (${escapeHtml(senderTitle)})`
            : `Diterbitkan secara resmi oleh: <span class="sender-name">${escapeHtml(senderName)}</span> &bull; <em>${escapeHtml(senderTitle)}</em>`
        }
      </div>

      <div class="greeting">Halo ${escapeHtml(recipientName)},</div>

      <div class="content-area">
        ${contentHtml}
      </div>

      ${
        attachments && attachments.length > 0
          ? `<div style="margin-top: 24px; padding: 14px 16px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
        <div style="font-size: 13px; font-weight: 700; color: #102E50; margin-bottom: 8px;">📎 Lampiran Dokumen (${attachments.length} berkas):</div>
        <ul style="margin: 0; padding-left: 20px; font-size: 12.5px; color: #475569;">
          ${attachments
            .map(
              (a) =>
                `<li style="margin-bottom: 4px;"><strong>${escapeHtml(a.fileName)}</strong> (${(a.sizeBytes / 1024).toFixed(0)} KB)</li>`,
            )
            .join("")}
        </ul>
      </div>`
          : ""
      }

      ${
        sendInApp && readerPortalUrl
          ? `<div class="portal-cta-box">
        <p style="margin: 0; font-size: 12.5px; color: #166534; font-weight: 500;">
          ${
            requireReadReceipt
              ? "Pengumuman ini memerlukan konfirmasi pembacaan dari Anda di Portal HRIS."
              : "Pengumuman ini juga dapat Anda akses dan arsipkan melalui Portal HRIS."
          }
        </p>
        <a href="${escapeHtml(readerPortalUrl)}" class="portal-cta-btn">
          ${requireReadReceipt ? "Buka &amp; Konfirmasi Dibaca &rarr;" : "Baca di Portal HRIS &rarr;"}
        </a>
      </div>`
          : ""
      }

      ${
        isNoReply
          ? `<div class="reply-box reply-box-noreply">
        <strong>Pemberitahuan:</strong> Email ini bersifat pengumuman satu arah resmi dari <strong>${escapeHtml(senderName)}</strong>. Mohon tidak membalas langsung ke alamat email ini.
      </div>`
          : `<div class="reply-box">
        <strong>Diskusi &amp; Pertanyaan:</strong> Anda dapat langsung membalas (*Reply*) email ini dari aplikasi email Anda untuk terhubung langsung dengan <strong>${escapeHtml(replyToMode === "ORGANIZATION_HR" ? "Tim People & Culture (HR) PSPK" : replyToEmail || senderName)}</strong>${replyToEmail && replyToEmail !== "no-reply@pspk.id" ? ` (${escapeHtml(replyToEmail)})` : ""}.
      </div>`
      }
    </div>
    <div class="email-footer">
      <p style="margin: 0 0 6px 0;">Email ini dikirimkan secara resmi melalui Sistem HRIS PSPK menggunakan akun <strong>no-reply@pspk.id</strong>.</p>
      <p style="margin: 0;">&copy; ${year} Yayasan Pusat Studi Pendidikan dan Kebijakan (PSPK). Hak Cipta Dilindungi.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Membuat instance transporter SMTP jika variabel lingkungan SMTP disetel,
 * atau mengembalikan null jika berada dalam mode simulasi.
 */
export function createTransporter(): Transporter | null {
  const smtpHost = process.env.SMTP_HOST?.trim();
  const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const smtpUser = process.env.SMTP_USER?.trim();
  const rawSmtpPass = process.env.SMTP_PASS?.trim();
  const smtpPass =
    smtpHost && smtpHost.includes("gmail") && rawSmtpPass
      ? rawSmtpPass.replace(/\s+/g, "")
      : rawSmtpPass;

  if (!smtpHost || !smtpUser || !smtpPass) {
    return null;
  }

  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });
}

/**
 * Menyusun data email siap kirim (HTML terpersonalisasi, teks polos, headers) untuk satu penerima.
 */
export function buildEmailForRecipient(
  broadcast: {
    id?: string;
    subject: string;
    contentHtml: string;
    contentText: string;
    senderName: string;
    senderDisplayTitle?: string | null;
    replyToEmail: string;
    replyToMode?: string | null;
    targetScope: string;
    category?: string | null;
    priority?: string;
    requireReadReceipt?: boolean;
    sendInApp?: boolean;
  },
  recipient: {
    recipientName: string;
    email: string;
  },
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType?: string;
  }>,
  attachmentsMetadata?: Array<{
    fileName: string;
    sizeBytes: number;
  }>,
) {
  const smtpFrom = process.env.SMTP_FROM?.trim() || "PSPK HRIS <no-reply@pspk.id>";
  const emailContentHtml = absolutizeImageUrls(broadcast.contentHtml);
  const personalizedSubject = replacePersonalizationVariables(broadcast.subject, recipient);
  const personalizedContentHtml = replacePersonalizationVariables(emailContentHtml, recipient);
  const personalizedContentText = replacePersonalizationVariables(broadcast.contentText, recipient);

  const scopeBadge =
    broadcast.targetScope === "ALL_EMPLOYEES"
      ? "PENGUMUMAN ORGANISASI"
      : broadcast.targetScope === "DEPARTMENT"
        ? "PENGUMUMAN DIVISI"
        : broadcast.targetScope === "CUSTOM"
          ? "PEGAWAI TERPILIH"
          : "PENGUMUMAN TIM";

  const isPersonal = broadcast.replyToMode === "SENDER_PERSONAL";
  const mode = (broadcast.replyToMode as ReplyToMode) || "NO_REPLY";
  const isPriorityImportant = broadcast.priority === "PENTING";

  let replyToHeader = `"PSPK HRIS (No Reply)" <no-reply@pspk.id>`;
  if (mode === "ORGANIZATION_HR") {
    replyToHeader = `"Tim People & Culture PSPK" <hr@pspk.id>`;
  } else if (mode === "SENDER_PERSONAL" || mode === "CUSTOM") {
    replyToHeader = `"${broadcast.senderName}" <${broadcast.replyToEmail || "no-reply@pspk.id"}>`;
  }

  const plainTextAttachments =
    attachmentsMetadata && attachmentsMetadata.length > 0
      ? `\n\nLampiran Dokumen (${attachmentsMetadata.length} berkas):\n` +
        attachmentsMetadata
          .map((a) => `- ${a.fileName} (${(a.sizeBytes / 1024).toFixed(0)} KB)`)
          .join("\n")
      : "";

  const personalizedHtml = renderBroadcastEmailHtml({
    subject: personalizedSubject,
    contentHtml: personalizedContentHtml,
    recipientName: recipient.recipientName,
    senderName: broadcast.senderName,
    senderTitle: broadcast.senderDisplayTitle || "Staf Lembaga",
    scopeBadge,
    isPersonal,
    replyToMode: mode,
    replyToEmail: broadcast.replyToEmail,
    category: broadcast.category,
    priority: broadcast.priority,
    requireReadReceipt: broadcast.requireReadReceipt,
    broadcastId: broadcast.id,
    sendInApp: broadcast.sendInApp,
    attachments: attachmentsMetadata,
  });

  const plainTextFooter =
    mode === "NO_REPLY"
      ? `Pengumuman resmi dari: ${broadcast.senderName}\nEmail ini bersifat satu arah.`
      : `Pengumuman dari: ${broadcast.senderName} (${broadcast.senderDisplayTitle || "Pengirim"})\nBalas email ini untuk berdiskusi dengan pengirim.`;

  const finalSubject = isPriorityImportant
    ? `[PENTING] [PSPK HRIS] ${personalizedSubject}`
    : `[PSPK HRIS] ${personalizedSubject}`;

  return {
    from: smtpFrom,
    to: recipient.email,
    replyTo: replyToHeader,
    subject: finalSubject,
    text: `Halo ${recipient.recipientName},\n\n${personalizedContentText}${plainTextAttachments}\n\n${plainTextFooter}`,
    html: personalizedHtml,
    attachments: attachments && attachments.length > 0 ? attachments : undefined,
    headers: {
      "X-Mailer": "PSPK-Broadcast-Mailer",
      ...(isPriorityImportant
        ? {
            "X-Priority": "1",
            Importance: "high",
          }
        : {}),
    },
  };
}

/**
 * 1. Enqueue Broadcast: Memvalidasi, membuat record EmailBroadcast berstatus QUEUED,
 * dan mendaftarkan recipient PENDING. Tidak mengirim email secara sinkron.
 */
export async function enqueueBroadcast(
  userId: string,
  input: SendBroadcastInput,
  reqMeta?: { ip?: string; userAgent?: string },
): Promise<EnqueueBroadcastResult> {
  const senderCtx = await getBroadcastSenderContext(userId);

  const {
    subject,
    contentHtml: rawContentHtml,
    category,
    priority = "NORMAL",
    requireReadReceipt = false,
    targetScope = "TEAM",
    targetDepartmentId,
    targetDepartmentIds = [],
    customEmployeeIds = [],
    excludedEmployeeIds = [],
    sendInApp = true,
    senderPersona = "ORGANIZATION",
    customSenderName,
    replyToMode = "NO_REPLY",
    customReplyToEmail,
    attachmentIds = [],
    scheduledAt: rawScheduledAt,
  } = input;

  if (category === "DARURAT" && !senderCtx.canSendAll) {
    throw new Error(
      "Akses ditolak: Kategori Darurat hanya dapat dikirimkan oleh Admin HR atau Direksi.",
    );
  }

  const isScheduled = !!rawScheduledAt;
  let scheduledDate: Date | null = null;

  if (isScheduled) {
    scheduledDate = new Date(rawScheduledAt!);
    const minTime = new Date(Date.now() + 4 * 60 * 1000);
    const maxTime = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
    if (scheduledDate < minTime) {
      throw new Error("Waktu jadwal pengiriman minimal 5 menit dari sekarang.");
    }
    if (scheduledDate > maxTime) {
      throw new Error("Waktu jadwal pengiriman maksimal 90 hari ke depan.");
    }
  }

  if (attachmentIds && attachmentIds.length > 0) {
    if (attachmentIds.length > MAX_ATTACHMENTS_COUNT) {
      throw new Error(`Maksimal ${MAX_ATTACHMENTS_COUNT} berkas lampiran PDF.`);
    }

    const attachments = await prisma.emailBroadcastAttachment.findMany({
      where: { id: { in: attachmentIds } },
    });

    if (attachments.length !== attachmentIds.length) {
      throw new Error("Satu atau lebih berkas lampiran tidak ditemukan.");
    }

    for (const att of attachments) {
      if (att.uploadedBy !== senderCtx.userId) {
        throw new Error(
          "Akses ditolak: Anda tidak memiliki izin untuk menggunakan berkas lampiran milik pengguna lain.",
        );
      }
      if (att.broadcastId) {
        throw new Error(
          `Berkas lampiran "${att.fileName}" sudah pernah digunakan pada pengumuman lain.`,
        );
      }
    }

    const totalAttachmentBytes = attachments.reduce((sum, a) => sum + a.sizeBytes, 0);
    if (totalAttachmentBytes > MAX_TOTAL_ATTACHMENT_SIZE_BYTES) {
      throw new Error(
        `Total ukuran lampiran melebihi batas 10 MB (${(totalAttachmentBytes / (1024 * 1024)).toFixed(1)} MB).`,
      );
    }
  }

  // Normalisasi departemen tujuan: prioritas targetDepartmentIds jika ada, atau fallback ke targetDepartmentId
  const effectiveDepartmentIds =
    targetDepartmentIds && targetDepartmentIds.length > 0
      ? targetDepartmentIds
      : targetDepartmentId
        ? [targetDepartmentId]
        : [];
  const primaryDepartmentId = effectiveDepartmentIds[0] || null;

  // Otorisasi persona & reply-to: hanya pemegang hak "all" yang boleh
  // memakai identitas lembaga/HR/kustom dan reply-to bebas.
  if (!senderCtx.canSendAll) {
    if (senderPersona !== "PERSONAL") {
      throw new Error(
        "Akses ditolak: Anda hanya dapat menerbitkan pengumuman atas nama pribadi.",
      );
    }
    if (replyToMode === "ORGANIZATION_HR" || replyToMode === "CUSTOM") {
      throw new Error(
        "Akses ditolak: Anda hanya dapat memilih balasan satu arah atau email pribadi.",
      );
    }
  }

  // Resolusi identitas persona pengirim & mode balasan
  const resolvedSender = resolveSenderIdentity(
    senderCtx,
    senderPersona,
    customSenderName,
    replyToMode,
    customReplyToEmail,
  );

  // 1. Sanitasi konten HTML dan plaintext
  const sanitizedContent = sanitizeBroadcastContent(rawContentHtml);
  const plainTextContent = htmlToPlainText(sanitizedContent);

  // 2. Ambil daftar target penerima
  const recipients = await getBroadcastRecipients(
    senderCtx,
    targetScope,
    primaryDepartmentId,
    customEmployeeIds,
    {
      departmentIds: effectiveDepartmentIds,
      excludedEmployeeIds,
    },
  );

  if (recipients.length === 0) {
    throw new Error(
      "Tidak ada karyawan aktif yang ditemukan untuk target penerima yang dipilih.",
    );
  }

  // 3. Simpan record EmailBroadcast induk ke database dengan status QUEUED
  const broadcast = await prisma.emailBroadcast.create({
    data: {
      subject,
      contentHtml: sanitizedContent,
      contentText: plainTextContent,
      category: category || null,
      priority: priority || "NORMAL",
      requireReadReceipt: Boolean(requireReadReceipt),
      senderUserId: senderCtx.userId,
      senderEmployeeId: senderCtx.employeeId,
      senderName: resolvedSender.displayName,
      senderEmail: "no-reply@pspk.id",
      replyToEmail: resolvedSender.replyToEmail,
      targetScope,
      targetDepartmentId: primaryDepartmentId,
      targetDepartmentIds: effectiveDepartmentIds,
      customEmployeeIds,
      excludedEmployeeIds,
      totalRecipients: recipients.length,
      sentCount: 0,
      failedCount: 0,
      sendInApp,
      status: isScheduled ? "SCHEDULED" : "QUEUED",
      scheduledAt: scheduledDate,
      senderPersona,
      replyToMode: resolvedSender.replyToMode,
      senderDisplayTitle: resolvedSender.displayTitle,
      ...(!isScheduled
        ? {
            recipients: {
              create: recipients.map((r) => ({
                employeeId: r.id,
                email: r.workEmail,
                recipientName: r.fullName,
                status: "PENDING",
                attempts: 0,
              })),
            },
          }
        : {}),
    },
  });

  // Hubungkan berkas lampiran yang diunggah ke broadcast ini
  if (attachmentIds && attachmentIds.length > 0) {
    await prisma.emailBroadcastAttachment.updateMany({
      where: { id: { in: attachmentIds }, uploadedBy: senderCtx.userId },
      data: { broadcastId: broadcast.id, draftId: null },
    });
  }

  // 4. Catat Audit Log Pengantrean / Penjadwalan
  await writeAudit({
    actorUserId: senderCtx.userId,
    actorEmail: senderCtx.userEmail,
    app: "hris",
    action: isScheduled ? "BROADCAST_EMAIL_SCHEDULED" : "BROADCAST_EMAIL_QUEUED",
    entityType: "EmailBroadcast",
    entityId: broadcast.id,
    after: {
      broadcastId: broadcast.id,
      subject,
      category: category || null,
      priority: priority || "NORMAL",
      requireReadReceipt: Boolean(requireReadReceipt),
      targetScope,
      targetDepartmentIds: effectiveDepartmentIds,
      customEmployeeIdsCount: customEmployeeIds.length,
      excludedEmployeeIdsCount: excludedEmployeeIds.length,
      attachmentCount: attachmentIds.length,
      senderPersona,
      senderDisplayName: resolvedSender.displayName,
      replyToMode: resolvedSender.replyToMode,
      replyToEmail: resolvedSender.replyToEmail,
      totalRecipients: recipients.length,
      sendInApp,
      scheduledAt: scheduledDate ? scheduledDate.toISOString() : null,
    },
    ip: reqMeta?.ip || "127.0.0.1",
    userAgent: reqMeta?.userAgent || "unknown",
  });

  return {
    success: true,
    broadcastId: broadcast.id,
    totalRecipients: recipients.length,
    scheduled: isScheduled,
    scheduledAt: scheduledDate || undefined,
    message: isScheduled
      ? `Pengumuman berhasil dijadwalkan untuk dikirim pada ${scheduledDate?.toLocaleString("id-ID")}.`
      : `Pengumuman masuk antrean dan sedang diproses ke ${recipients.length} penerima.`,
  };
}

/**
 * 2. Process Broadcast: Prosesor antrean idempoten dengan heartbeat lease lock,
 * batching teratur, recovery crash worker, dan agregasi status akhir.
 */
export async function processBroadcast(
  broadcastId: string,
): Promise<ProcessBroadcastResult> {
  const broadcast = await prisma.emailBroadcast.findUnique({
    where: { id: broadcastId },
  });

  if (!broadcast) {
    return {
      processed: false,
      broadcastId,
      sentCount: 0,
      failedCount: 0,
      reason: "BROADCAST_NOT_FOUND",
    };
  }

  // Jika sudah berstatus terminal (selesai/batal), tidak perlu diproses ulang
  if (
    broadcast.status === "SENT" ||
    broadcast.status === "FAILED" ||
    broadcast.status === "PARTIALLY_FAILED" ||
    broadcast.status === "CANCELED"
  ) {
    return {
      processed: false,
      broadcastId,
      sentCount: broadcast.sentCount,
      failedCount: broadcast.failedCount,
      finalStatus: broadcast.status,
      reason: "ALREADY_FINISHED",
    };
  }

  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

  // 1. Claim Lease: update atomik status ke SENDING dan perbarui lockedAt
  const claimResult = await prisma.emailBroadcast.updateMany({
    where: {
      id: broadcastId,
      status: { in: ["QUEUED", "SENDING"] },
      OR: [{ lockedAt: null }, { lockedAt: { lt: fiveMinutesAgo } }],
    },
    data: {
      status: "SENDING",
      lockedAt: now,
      startedAt: broadcast.startedAt || now,
    },
  });

  if (claimResult.count === 0) {
    return {
      processed: false,
      broadcastId,
      sentCount: broadcast.sentCount,
      failedCount: broadcast.failedCount,
      reason: "COULD_NOT_CLAIM_LEASE",
    };
  }

  // 2. Recovery crash: kembalikan recipient SENDING yang kedaluwarsa ke PENDING
  await prisma.emailBroadcastRecipient.updateMany({
    where: {
      broadcastId,
      status: "SENDING",
      lastAttemptAt: { lt: fiveMinutesAgo },
    },
    data: {
      status: "PENDING",
    },
  });

  // 3. Notifikasi In-App: buat sekali saja di awal pemrosesan jika belum pernah dikirim
  if (broadcast.sendInApp && !broadcast.inAppDispatchedAt) {
    const recipientsWithUser = await prisma.emailBroadcastRecipient.findMany({
      where: { broadcastId, employee: { userId: { not: null } } },
      select: { recipientName: true, employee: { select: { userId: true } } },
    });

    const validRecipients = recipientsWithUser.filter((r) => Boolean(r.employee?.userId));

    if (validRecipients.length > 0) {
      const snippet =
        broadcast.contentText.length > 120
          ? `${broadcast.contentText.slice(0, 117)}...`
          : broadcast.contentText;

      await prisma.notification.createMany({
        data: validRecipients.map((r) => {
          const personalizedSubj = replacePersonalizationVariables(broadcast.subject, {
            recipientName: r.recipientName,
          });
          const notifTitlePrefix = broadcast.priority === "PENTING" ? "[PENTING] " : "";
          const notifType = broadcast.requireReadReceipt ? "ACTION_REQUIRED" : "INFO";
          return {
            userId: r.employee!.userId!,
            title: `${notifTitlePrefix}Pengumuman: ${personalizedSubj}`,
            message: `${broadcast.senderName}: "${snippet}"`,
            type: notifType,
            category: "SYSTEM",
            link: `/pengumuman/${broadcastId}`,
          };
        }),
      });
    }

    await prisma.emailBroadcast.update({
      where: { id: broadcastId },
      data: { inAppDispatchedAt: new Date() },
    });
  }

  // 4. Pengiriman batch email
  const batchSize = process.env.BROADCAST_BATCH_SIZE
    ? Math.max(1, parseInt(process.env.BROADCAST_BATCH_SIZE, 10))
    : 5;
  const batchDelayMs = process.env.BROADCAST_BATCH_DELAY_MS
    ? Math.max(0, parseInt(process.env.BROADCAST_BATCH_DELAY_MS, 10))
    : 200;

  const transporter = createTransporter();
  const isSimulated = !transporter;

  // Muat berkas lampiran sekali ke dalam memori (caching buffer) selama proses berlangsung
  const rawAttachments = await prisma.emailBroadcastAttachment.findMany({
    where: { broadcastId },
    orderBy: { createdAt: "asc" },
  });
  const attachments = rawAttachments || [];

  const storage = getStorageProvider();
  const attachmentBuffers: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }> = [];

  for (const att of attachments) {
    try {
      const content = await storage.getBuffer(att.key);
      attachmentBuffers.push({
        filename: att.fileName,
        content,
        contentType: att.mimeType || "application/pdf",
      });
    } catch (err) {
      console.error(`Gagal memuat buffer lampiran ${att.fileName} (${att.key}):`, err);
    }
  }

  const attachmentsMetadata = attachments.map((a) => ({
    fileName: a.fileName,
    sizeBytes: a.sizeBytes,
  }));

  while (true) {
    const pendingRecipients = await prisma.emailBroadcastRecipient.findMany({
      where: { broadcastId, status: "PENDING" },
      take: batchSize,
      orderBy: { id: "asc" },
    });

    if (pendingRecipients.length === 0) {
      break;
    }

    const pendingIds = pendingRecipients.map((r) => r.id);

    // Tandai recipient chunk ini sebagai SENDING secara atomik
    await prisma.emailBroadcastRecipient.updateMany({
      where: { id: { in: pendingIds }, status: "PENDING" },
      data: {
        status: "SENDING",
        lastAttemptAt: new Date(),
        attempts: { increment: 1 },
      },
    });

    if (isSimulated) {
      // Mode simulasi development
      await prisma.emailBroadcastRecipient.updateMany({
        where: { id: { in: pendingIds } },
        data: {
          status: "SENT",
          sentAt: new Date(),
        },
      });
    } else {
      // Mode SMTP produksi
      await Promise.all(
        pendingRecipients.map(async (rcpt) => {
          try {
            const emailOptions = buildEmailForRecipient(
              broadcast,
              rcpt,
              attachmentBuffers,
              attachmentsMetadata,
            );
            await transporter.sendMail(emailOptions);

            await prisma.emailBroadcastRecipient.update({
              where: { id: rcpt.id },
              data: {
                status: "SENT",
                sentAt: new Date(),
              },
            });
          } catch (err: unknown) {
            const errorMsg =
              err instanceof Error ? err.message : "Kesalahan pengiriman SMTP";
            console.error(`Gagal mengirim broadcast ke ${rcpt.email}:`, err);

            await prisma.emailBroadcastRecipient.update({
              where: { id: rcpt.id },
              data: {
                status: "FAILED",
                errorMessage: errorMsg,
              },
            });
          }
        }),
      );
    }

    // Perbarui heartbeat lease lockedAt dan hitung progres sementara
    const countsProgress = await prisma.emailBroadcastRecipient.groupBy({
      by: ["status"],
      where: { broadcastId },
      _count: { id: true },
    });

    let partialSent = 0;
    let partialFailed = 0;
    for (const c of countsProgress) {
      if (c.status === "SENT") partialSent = c._count.id;
      if (c.status === "FAILED") partialFailed = c._count.id;
    }

    await prisma.emailBroadcast.update({
      where: { id: broadcastId },
      data: {
        lockedAt: new Date(),
        sentCount: partialSent,
        failedCount: partialFailed,
      },
    });

    if (batchDelayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, batchDelayMs));
    }
  }

  // 5. Agregasi status akhir langsung dari tabel recipient
  const finalCounts = await prisma.emailBroadcastRecipient.groupBy({
    by: ["status"],
    where: { broadcastId },
    _count: { id: true },
  });

  let totalSent = 0;
  let totalFailed = 0;
  for (const c of finalCounts) {
    if (c.status === "SENT") totalSent = c._count.id;
    if (c.status === "FAILED") totalFailed = c._count.id;
  }

  const finalStatus: BroadcastStatus =
    totalFailed === 0
      ? "SENT"
      : totalSent > 0
        ? "PARTIALLY_FAILED"
        : "FAILED";

  await prisma.emailBroadcast.update({
    where: { id: broadcastId },
    data: {
      status: finalStatus,
      sentCount: totalSent,
      failedCount: totalFailed,
      finishedAt: new Date(),
      lockedAt: null,
    },
  });

  // 6. Tulis Audit Log Penyelesaian
  await writeAudit({
    actorUserId: broadcast.senderUserId,
    actorEmail: broadcast.senderEmail,
    app: "hris",
    action: "BROADCAST_EMAIL_COMPLETED",
    entityType: "EmailBroadcast",
    entityId: broadcastId,
    after: {
      broadcastId,
      finalStatus,
      totalRecipients: broadcast.totalRecipients,
      sentCount: totalSent,
      failedCount: totalFailed,
      isSimulated,
    },
  });

  return {
    processed: true,
    broadcastId,
    sentCount: totalSent,
    failedCount: totalFailed,
    finalStatus,
    simulated: isSimulated,
  };
}

/**
 * Eksekusi pengiriman sinkron (wrapper untuk kompatibilitas pengujian lama & CLI).
 */
export async function executeSendBroadcast(
  userId: string,
  input: SendBroadcastInput,
  reqMeta?: { ip?: string; userAgent?: string },
): Promise<SendBroadcastResult> {
  const enqueueRes = await enqueueBroadcast(userId, input, reqMeta);
  const processRes = await processBroadcast(enqueueRes.broadcastId);

  return {
    success: true,
    broadcastId: enqueueRes.broadcastId,
    totalRecipients: enqueueRes.totalRecipients,
    sentCount: processRes.sentCount,
    failedCount: processRes.failedCount,
    simulated: processRes.simulated || false,
    message: processRes.simulated
      ? `Pengumuman berhasil disimulasikan ke ${processRes.sentCount} penerima (SMTP belum dikonfigurasi).`
      : `Pengumuman berhasil dikirimkan ke ${processRes.sentCount} dari ${enqueueRes.totalRecipients} penerima via email.`,
  };
}

/**
 * 3. Send Test Broadcast: Mengirimkan email uji hanya ke alamat email kerja pengirim sendiri.
 * Tidak membuat record EmailBroadcast dan tidak mendispatch notifikasi in-app.
 * Dibatasi maksimal 5 kali pengiriman email uji per pengguna per 10 menit.
 */
export async function sendTestBroadcast(
  userId: string,
  input: SendTestBroadcastInput,
  reqMeta?: { ip?: string; userAgent?: string },
): Promise<SendTestBroadcastResult> {
  const senderCtx = await getBroadcastSenderContext(userId);

  if (!hasDeliverableEmail(senderCtx.userEmail)) {
    throw new Error(
      "Akun Anda belum memiliki alamat email kerja yang valid untuk menerima email uji.",
    );
  }

  // Rate Limiting: Maksimal 5 email uji per pengguna dalam kurun waktu 10 menit
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
  const recentTestCount = await prisma.auditLog.count({
    where: {
      action: "BROADCAST_EMAIL_TEST",
      actorUserId: userId,
      occurredAt: { gte: tenMinutesAgo },
    },
  });

  if (recentTestCount >= 5) {
    throw new Error(
      "Terlalu sering mengirim email uji. Batas maksimal adalah 5 kali per 10 menit. Silakan coba lagi beberapa saat lagi.",
    );
  }

  const {
    subject,
    contentHtml: rawContentHtml,
    category,
    priority = "NORMAL",
    senderPersona = "ORGANIZATION",
    customSenderName,
    replyToMode = "NO_REPLY",
    customReplyToEmail,
    attachmentIds = [],
  } = input;

  let testAttachments: Array<{
    fileName: string;
    sizeBytes: number;
    key: string;
    mimeType: string;
  }> = [];

  if (attachmentIds && attachmentIds.length > 0) {
    if (attachmentIds.length > MAX_ATTACHMENTS_COUNT) {
      throw new Error(`Maksimal ${MAX_ATTACHMENTS_COUNT} berkas lampiran PDF.`);
    }

    const attachments = await prisma.emailBroadcastAttachment.findMany({
      where: { id: { in: attachmentIds } },
    });

    if (attachments.length !== attachmentIds.length) {
      throw new Error("Satu atau lebih berkas lampiran tidak ditemukan.");
    }

    for (const att of attachments) {
      if (att.uploadedBy !== senderCtx.userId) {
        throw new Error(
          "Akses ditolak: Anda tidak memiliki izin untuk menggunakan berkas lampiran milik pengguna lain.",
        );
      }
      if (att.broadcastId) {
        throw new Error(
          `Berkas lampiran "${att.fileName}" sudah pernah digunakan pada pengumuman lain.`,
        );
      }
    }

    const totalAttachmentBytes = attachments.reduce((sum, a) => sum + a.sizeBytes, 0);
    if (totalAttachmentBytes > MAX_TOTAL_ATTACHMENT_SIZE_BYTES) {
      throw new Error(
        `Total ukuran lampiran melebihi batas 10 MB (${(totalAttachmentBytes / (1024 * 1024)).toFixed(1)} MB).`,
      );
    }

    testAttachments = attachments;
  }

  // Otorisasi persona & reply-to: hanya pemegang hak "all" yang boleh
  // memakai identitas lembaga/HR/kustom dan reply-to bebas.
  if (!senderCtx.canSendAll) {
    if (senderPersona !== "PERSONAL") {
      throw new Error(
        "Akses ditolak: Anda hanya dapat menerbitkan pengumuman atas nama pribadi.",
      );
    }
    if (replyToMode === "ORGANIZATION_HR" || replyToMode === "CUSTOM") {
      throw new Error(
        "Akses ditolak: Anda hanya dapat memilih balasan satu arah atau email pribadi.",
      );
    }
  }

  // Resolusi identitas persona pengirim & mode balasan
  const resolvedSender = resolveSenderIdentity(
    senderCtx,
    senderPersona,
    customSenderName,
    replyToMode,
    customReplyToEmail,
  );

  // Sanitasi konten dan konversi plaintext
  const sanitizedContent = sanitizeBroadcastContent(rawContentHtml);
  const plainTextContent = htmlToPlainText(sanitizedContent);
  const absolutizedHtml = absolutizeImageUrls(sanitizedContent);

  const testRecipient = { recipientName: senderCtx.userName };
  const personalizedSubj = replacePersonalizationVariables(subject, testRecipient);
  const personalizedPlainText = replacePersonalizationVariables(plainTextContent, testRecipient);
  const personalizedAbsolutizedHtml = replacePersonalizationVariables(absolutizedHtml, testRecipient);

  // Banner penanda email uji
  const testBanner = `
    <div style="background-color: #FEF3C7; border: 1px solid #F59E0B; color: #92400E; padding: 12px 16px; border-radius: 8px; margin-bottom: 24px; font-size: 13px; line-height: 1.5; font-family: sans-serif;">
      <strong style="color: #B45309;">⚠️ INI ADALAH EMAIL UJI (TEST EMAIL)</strong><br />
      Pesan ini hanya dikirimkan ke alamat email kerja Anda (<strong>${escapeHtml(senderCtx.userEmail)}</strong>) untuk pengecekan tata letak dan keterbacaan. Pesan ini <em>tidak disebarkan</em> ke karyawan lain.
    </div>
  `.trim();

  const emailContentHtml = `${testBanner}${personalizedAbsolutizedHtml}`;

  // Memuat buffer berkas lampiran jika dilampirkan pada email uji
  const testAttachmentBuffers: Array<{
    filename: string;
    content: Buffer;
    contentType?: string;
  }> = [];

  const storage = getStorageProvider();
  for (const att of testAttachments) {
    try {
      const buf = await storage.getBuffer(att.key);
      testAttachmentBuffers.push({
        filename: att.fileName,
        content: buf,
        contentType: att.mimeType || "application/pdf",
      });
    } catch (err) {
      console.error(`Gagal memuat buffer lampiran test ${att.fileName}:`, err);
    }
  }

  const testAttachmentsMetadata = testAttachments.map((a) => ({
    fileName: a.fileName,
    sizeBytes: a.sizeBytes,
  }));

  const plainTextAttachments =
    testAttachmentsMetadata.length > 0
      ? `\n\nLampiran Dokumen (${testAttachmentsMetadata.length} berkas):\n` +
        testAttachmentsMetadata
          .map((a) => `- ${a.fileName} (${(a.sizeBytes / 1024).toFixed(0)} KB)`)
          .join("\n")
      : "";

  const isPriorityImportant = priority === "PENTING";

  const personalizedHtml = renderBroadcastEmailHtml({
    subject: isPriorityImportant ? `[TES] [PENTING] ${personalizedSubj}` : `[TES] ${personalizedSubj}`,
    contentHtml: emailContentHtml,
    recipientName: senderCtx.userName,
    senderName: resolvedSender.displayName,
    senderTitle: resolvedSender.displayTitle,
    scopeBadge: "EMAIL UJI",
    isPersonal: resolvedSender.isPersonal,
    replyToMode: resolvedSender.replyToMode,
    replyToEmail: resolvedSender.replyToEmail,
    category,
    priority,
    attachments: testAttachmentsMetadata,
  });

  const transporter = createTransporter();
  const isSimulated = !transporter;
  const smtpFrom = process.env.SMTP_FROM?.trim() || "PSPK HRIS <no-reply@pspk.id>";

  if (transporter) {
    const testEmailSubject = isPriorityImportant
      ? `[TES] [PENTING] [PSPK HRIS] ${personalizedSubj}`
      : `[TES] [PSPK HRIS] ${personalizedSubj}`;

    await transporter.sendMail({
      from: smtpFrom,
      to: senderCtx.userEmail,
      replyTo: resolvedSender.replyToHeader,
      subject: testEmailSubject,
      text: `[EMAIL UJI]\n\nHalo ${senderCtx.userName},\n\nIni adalah email uji pengumuman. Pesan ini hanya dikirimkan ke Anda.\n\n${personalizedPlainText}${plainTextAttachments}\n\nPengumuman dari: ${resolvedSender.displayName}`,
      html: personalizedHtml,
      attachments: testAttachmentBuffers.length > 0 ? testAttachmentBuffers : undefined,
      headers: {
        "X-Mailer": "PSPK-Broadcast-Mailer",
        ...(isPriorityImportant
          ? {
              "X-Priority": "1",
              Importance: "high",
            }
          : {}),
      },
    });
  }

  // Catat Audit Log Email Uji
  await writeAudit({
    actorUserId: userId,
    actorEmail: senderCtx.userEmail,
    app: "hris",
    action: "BROADCAST_EMAIL_TEST",
    entityType: "EmailBroadcast",
    entityId: "test-broadcast",
    after: {
      subject,
      category: category || null,
      priority,
      targetEmail: senderCtx.userEmail,
      senderPersona,
      senderDisplayName: resolvedSender.displayName,
      replyToMode: resolvedSender.replyToMode,
      isSimulated,
    },
    ip: reqMeta?.ip || "127.0.0.1",
    userAgent: reqMeta?.userAgent || "unknown",
  });

  return {
    success: true,
    simulated: isSimulated,
    message: isSimulated
      ? `SMTP belum dikonfigurasi. Pengiriman email uji ke ${senderCtx.userEmail} disimulasikan berhasil.`
      : `Email uji berhasil dikirim ke alamat email Anda (${senderCtx.userEmail}). Silakan periksa kotak masuk atau spam.`,
  };
}

/**
 * 4. Resend Failed Recipients: Memasukkan kembali penerima yang gagal (FAILED) ke dalam antrean (PENDING).
 * Hanya memproses penerima yang berstatus FAILED dan memvalidasi keaktifan pegawai terkait.
 */
export async function resendFailedRecipients(
  userId: string,
  broadcastId: string,
  reqMeta?: { ip?: string; userAgent?: string },
): Promise<ResendFailedBroadcastResult> {
  const broadcast = await prisma.emailBroadcast.findUnique({
    where: { id: broadcastId },
    include: {
      recipients: {
        where: { status: "FAILED" },
        include: {
          employee: {
            select: { id: true, status: true, workEmail: true },
          },
        },
      },
    },
  });

  if (!broadcast) {
    throw new Error("Pengumuman tidak ditemukan.");
  }

  if (broadcast.status === "QUEUED" || broadcast.status === "SENDING") {
    throw new Error("Pengumuman masih dalam proses pengiriman antrean.");
  }

  // Otorisasi: Penulis pengumuman atau pemegang hak canSendAll (Super Admin & Admin HR)
  const authCtx = await getAuthContext(userId);
  if (!authCtx) {
    throw new Error("Konteks otentikasi tidak ditemukan.");
  }

  const isSuperAdmin = authCtx.roles.includes("super_admin");
  const isAdminHr = authCtx.roles.includes("admin_hr");
  const isAuthor = broadcast.senderUserId === userId;
  const canSendAll = isSuperAdmin || isAdminHr || can(authCtx, "hris.broadcast.send:all");

  if (!isAuthor && !canSendAll) {
    throw new Error("Akses ditolak: Anda tidak memiliki izin untuk mengirim ulang pengumuman ini.");
  }

  const failedRecipients = broadcast.recipients;
  if (failedRecipients.length === 0) {
    throw new Error("Tidak ada penerima berstatus gagal pada pengumuman ini.");
  }

  // Validasi keaktifan pegawai dan ketersediaan email kerja
  const validToRetryIds: string[] = [];
  const invalidIds: string[] = [];

  for (const r of failedRecipients) {
    if (r.employee && r.employee.status === "ACTIVE" && hasDeliverableEmail(r.employee.workEmail)) {
      validToRetryIds.push(r.id);
    } else {
      invalidIds.push(r.id);
    }
  }

  // Tandai yang tidak valid tetap FAILED dengan pesan spesifik
  if (invalidIds.length > 0) {
    await prisma.emailBroadcastRecipient.updateMany({
      where: { id: { in: invalidIds } },
      data: {
        status: "FAILED",
        errorMessage: "Karyawan sudah tidak aktif atau email kerja tidak valid.",
      },
    });
  }

  if (validToRetryIds.length === 0) {
    throw new Error(
      "Semua penerima yang gagal sudah tidak aktif atau tidak memiliki email kerja yang valid.",
    );
  }

  // Setel penerima yang valid kembali ke PENDING dan hapus pesan error sebelumnya
  await prisma.emailBroadcastRecipient.updateMany({
    where: { id: { in: validToRetryIds } },
    data: {
      status: "PENDING",
      errorMessage: null,
    },
  });

  // Setel status broadcast induk kembali ke QUEUED agar dapat diproses oleh worker
  await prisma.emailBroadcast.update({
    where: { id: broadcastId },
    data: {
      status: "QUEUED",
      lockedAt: null,
    },
  });

  // Catat Audit Log Pengiriman Ulang
  await writeAudit({
    actorUserId: userId,
    actorEmail: authCtx.employeeId || broadcast.senderEmail,
    app: "hris",
    action: "BROADCAST_EMAIL_RESEND",
    entityType: "EmailBroadcast",
    entityId: broadcastId,
    after: {
      broadcastId,
      subject: broadcast.subject,
      retriedCount: validToRetryIds.length,
      invalidSkippedCount: invalidIds.length,
    },
    ip: reqMeta?.ip || "127.0.0.1",
    userAgent: reqMeta?.userAgent || "unknown",
  });

  return {
    success: true,
    broadcastId,
    retriedCount: validToRetryIds.length,
    message: `${validToRetryIds.length} penerima yang gagal berhasil dimasukkan kembali ke antrean pengiriman.`,
  };
}

/**
 * 5. Menghapus berkas lampiran PDF yang belum terhubung dengan broadcast terkirim.
 */
export async function deleteBroadcastAttachment(
  userId: string,
  attachmentId: string,
): Promise<{ success: boolean }> {
  const attachment = await prisma.emailBroadcastAttachment.findUnique({
    where: { id: attachmentId },
  });

  if (!attachment) {
    throw new Error("Berkas lampiran tidak ditemukan.");
  }

  if (attachment.uploadedBy !== userId) {
    throw new Error("Akses ditolak: Anda bukan pemilik berkas lampiran ini.");
  }

  if (attachment.broadcastId) {
    throw new Error("Berkas lampiran yang sudah terkirim pada pengumuman tidak dapat dihapus.");
  }

  const storage = getStorageProvider();
  try {
    await storage.delete(attachment.key);
  } catch (err) {
    console.error("Gagal menghapus file dari storage:", err);
  }

  await prisma.emailBroadcastAttachment.delete({
    where: { id: attachmentId },
  });

  return { success: true };
}

export interface DispatchScheduledResult {
  dispatchedCount: number;
  failedCount: number;
  details: Array<{
    id: string;
    subject: string;
    status: "DISPATCHED" | "FAILED" | "SKIPPED";
    reason?: string;
  }>;
}

/**
 * 6. Memproses pengumuman yang dijadwalkan (SCHEDULED) saat waktu kirimnya tiba.
 * Diperiksa secara periodik melalui cron endpoint.
 */
export async function dispatchScheduledBroadcasts(): Promise<DispatchScheduledResult> {
  const now = new Date();

  // Cari kandidat yang berstatus SCHEDULED dan scheduledAt <= now
  const candidates = await prisma.emailBroadcast.findMany({
    where: {
      status: "SCHEDULED",
      scheduledAt: { lte: now },
    },
    take: 10,
    orderBy: { scheduledAt: "asc" },
  });

  const details: DispatchScheduledResult["details"] = [];
  let dispatchedCount = 0;
  let failedCount = 0;

  for (const b of candidates) {
    // 1. Klaim atomik: ubah SCHEDULED -> QUEUED
    const claim = await prisma.emailBroadcast.updateMany({
      where: { id: b.id, status: "SCHEDULED" },
      data: { status: "QUEUED" },
    });

    if (claim.count === 0) {
      // Telah diklaim oleh worker/cron lain secara paralel
      details.push({
        id: b.id,
        subject: b.subject,
        status: "SKIPPED",
        reason: "Sudah diklaim oleh worker lain.",
      });
      continue;
    }

    // 2. Evaluasi ulang hak otorisasi pengirim saat jadwal tiba
    let senderCtx: BroadcastSenderContext;
    try {
      senderCtx = await getBroadcastSenderContext(b.senderUserId);
    } catch {
      await prisma.emailBroadcast.update({
        where: { id: b.id },
        data: { status: "FAILED" },
      });
      await writeAudit({
        actorUserId: b.senderUserId,
        actorEmail: b.senderEmail,
        app: "hris",
        action: "BROADCAST_SCHEDULE_FAILED",
        entityType: "EmailBroadcast",
        entityId: b.id,
        after: {
          broadcastId: b.id,
          reason: "Akun pengirim tidak lagi aktif atau tidak ditemukan saat jadwal tiba.",
        },
      });
      failedCount++;
      details.push({
        id: b.id,
        subject: b.subject,
        status: "FAILED",
        reason: "Akun pengirim tidak aktif.",
      });
      continue;
    }

    // Cek apakah pengirim masih memiliki izin scope pengumuman
    const scopeAllowed =
      (b.targetScope === "TEAM" && senderCtx.canSendTeam) ||
      (["ALL_EMPLOYEES", "DEPARTMENT", "CUSTOM"].includes(b.targetScope) &&
        senderCtx.canSendAll);

    // Cek apakah persona masih diizinkan
    const personaAllowed =
      senderCtx.canSendAll || b.senderPersona === "PERSONAL";

    if (!scopeAllowed || !personaAllowed) {
      await prisma.emailBroadcast.update({
        where: { id: b.id },
        data: { status: "FAILED" },
      });
      await writeAudit({
        actorUserId: b.senderUserId,
        actorEmail: b.senderEmail,
        app: "hris",
        action: "BROADCAST_SCHEDULE_FAILED",
        entityType: "EmailBroadcast",
        entityId: b.id,
        after: {
          broadcastId: b.id,
          reason: "Izin pengirim telah dicabut atau tidak lagi mencakup target pengumuman.",
        },
      });
      failedCount++;
      details.push({
        id: b.id,
        subject: b.subject,
        status: "FAILED",
        reason: "Hak otorisasi pengirim tidak lagi valid.",
      });
      continue;
    }

    // 3. Resolve penerima secara dinamis saat jadwal tiba (memperhitungkan karyawan baru / yang resign)
    const effectiveDepartmentIds =
      b.targetDepartmentIds && b.targetDepartmentIds.length > 0
        ? b.targetDepartmentIds
        : b.targetDepartmentId
          ? [b.targetDepartmentId]
          : [];

    const recipients = await getBroadcastRecipients(
      senderCtx,
      b.targetScope,
      effectiveDepartmentIds[0] || null,
      b.customEmployeeIds,
      {
        departmentIds: effectiveDepartmentIds,
        excludedEmployeeIds: b.excludedEmployeeIds,
      },
    );

    if (recipients.length === 0) {
      await prisma.emailBroadcast.update({
        where: { id: b.id },
        data: { status: "FAILED", totalRecipients: 0 },
      });
      await writeAudit({
        actorUserId: b.senderUserId,
        actorEmail: b.senderEmail,
        app: "hris",
        action: "BROADCAST_SCHEDULE_FAILED",
        entityType: "EmailBroadcast",
        entityId: b.id,
        after: {
          broadcastId: b.id,
          reason: "Tidak ada penerima aktif yang memenuhi syarat saat jadwal pengiriman tiba.",
        },
      });
      failedCount++;
      details.push({
        id: b.id,
        subject: b.subject,
        status: "FAILED",
        reason: "Tidak ada penerima aktif yang valid.",
      });
      continue;
    }

    // 4. Buat record EmailBroadcastRecipient
    await prisma.emailBroadcastRecipient.createMany({
      data: recipients.map((r) => ({
        broadcastId: b.id,
        employeeId: r.id,
        email: r.workEmail,
        recipientName: r.fullName,
        status: "PENDING",
        attempts: 0,
      })),
    });

    await prisma.emailBroadcast.update({
      where: { id: b.id },
      data: { totalRecipients: recipients.length },
    });

    // 5. Eksekusi pengiriman antrean
    try {
      await processBroadcast(b.id);
      dispatchedCount++;
      details.push({
        id: b.id,
        subject: b.subject,
        status: "DISPATCHED",
      });
    } catch (err: unknown) {
      console.error(`Gagal memproses broadcast terjadwal ${b.id}:`, err);
      failedCount++;
      details.push({
        id: b.id,
        subject: b.subject,
        status: "FAILED",
        reason:
          err instanceof Error ? err.message : "Kesalahan pemrosesan email",
      });
    }
  }

  return {
    dispatchedCount,
    failedCount,
    details,
  };
}

/**
 * 7. Membatalkan jadwal pengumuman yang masih berstatus SCHEDULED.
 */
export async function cancelScheduledBroadcast(
  userId: string,
  broadcastId: string,
  reqMeta?: { ip?: string; userAgent?: string },
): Promise<{ success: boolean; message: string }> {
  const broadcast = await prisma.emailBroadcast.findUnique({
    where: { id: broadcastId },
  });

  if (!broadcast) {
    throw new Error("Pengumuman tidak ditemukan.");
  }

  const authCtx = await getAuthContext(userId);
  if (!authCtx) {
    throw new Error("Sesi pengguna tidak valid.");
  }

  const isSuperAdmin = authCtx.roles.includes("super_admin");
  const isAdminHr = authCtx.roles.includes("admin_hr");
  const canSendAll =
    isSuperAdmin || isAdminHr || can(authCtx, "hris.broadcast.send:all");
  const isAuthor = broadcast.senderUserId === userId;

  if (!isAuthor && !canSendAll) {
    throw new Error(
      "Akses ditolak: Anda tidak memiliki izin untuk membatalkan pengumuman ini.",
    );
  }

  if (broadcast.status !== "SCHEDULED") {
    throw new Error(
      "Hanya pengumuman berstatus terjadwal yang dapat dibatalkan.",
    );
  }

  const claim = await prisma.emailBroadcast.updateMany({
    where: { id: broadcastId, status: "SCHEDULED" },
    data: { status: "CANCELED" },
  });

  if (claim.count === 0) {
    throw new Error(
      "Pengumuman sudah tidak dalam status terjadwal atau telah dibatalkan oleh pengguna lain.",
    );
  }

  const actorUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  await writeAudit({
    actorUserId: userId,
    actorEmail: actorUser?.email || broadcast.senderEmail || "unknown",
    app: "hris",
    action: "BROADCAST_EMAIL_CANCELED",
    entityType: "EmailBroadcast",
    entityId: broadcastId,
    after: {
      broadcastId,
      subject: broadcast.subject,
      status: "CANCELED",
      canceledAt: new Date().toISOString(),
    },
    ip: reqMeta?.ip || "127.0.0.1",
    userAgent: reqMeta?.userAgent || "unknown",
  });

  return {
    success: true,
    message: "Jadwal pengiriman pengumuman berhasil dibatalkan.",
  };
}

/**
 * 8. Menandai bahwa penerima telah membaca pengumuman broadcast tertentu di portal HRIS.
 */
export async function markBroadcastAsRead(
  userId: string,
  broadcastId: string,
  reqMeta?: { ip?: string; userAgent?: string },
): Promise<{ success: boolean; readAt: Date }> {
  const broadcast = await prisma.emailBroadcast.findUnique({
    where: { id: broadcastId },
    select: { id: true, subject: true },
  });

  if (!broadcast) {
    throw new Error("Pengumuman tidak ditemukan.");
  }

  const [employee, user] = await Promise.all([
    prisma.employee.findFirst({
      where: { userId },
      select: { id: true, workEmail: true },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    }),
  ]);

  const recipient = await prisma.emailBroadcastRecipient.findFirst({
    where: {
      broadcastId,
      OR: [
        ...(employee ? [{ employeeId: employee.id }] : []),
        ...(employee?.workEmail ? [{ email: employee.workEmail }] : []),
        ...(user?.email ? [{ email: user.email }] : []),
      ],
    },
  });

  if (!recipient) {
    throw new Error("Anda tidak terdaftar sebagai penerima pengumuman ini.");
  }

  // Idempoten: jika sudah pernah tercatat dibaca, kembalikan readAt lama
  if (recipient.readAt) {
    return {
      success: true,
      readAt: recipient.readAt,
    };
  }

  const now = new Date();
  const updated = await prisma.emailBroadcastRecipient.update({
    where: { id: recipient.id },
    data: { readAt: now },
  });

  await writeAudit({
    actorUserId: userId,
    actorEmail: user?.email || recipient.email,
    app: "hris",
    action: "BROADCAST_READ",
    entityType: "EmailBroadcastRecipient",
    entityId: recipient.id,
    after: {
      broadcastId,
      recipientId: recipient.id,
      readAt: now.toISOString(),
    },
    ip: reqMeta?.ip || "127.0.0.1",
    userAgent: reqMeta?.userAgent || "unknown",
  });

  return {
    success: true,
    readAt: updated.readAt || now,
  };
}

/**
 * 9. Mengirimkan notifikasi in-app pengingat kepada penerima yang belum membaca pengumuman.
 */
export async function remindUnreadRecipients(
  userId: string,
  broadcastId: string,
  reqMeta?: { ip?: string; userAgent?: string },
): Promise<{ success: boolean; remindedCount: number; message: string }> {
  const broadcast = await prisma.emailBroadcast.findUnique({
    where: { id: broadcastId },
    include: {
      recipients: {
        where: {
          status: "SENT",
          readAt: null,
        },
        include: {
          employee: {
            select: { userId: true },
          },
        },
      },
    },
  });

  if (!broadcast) {
    throw new Error("Pengumuman tidak ditemukan.");
  }

  const authCtx = await getAuthContext(userId);
  if (!authCtx) {
    throw new Error("Sesi pengguna tidak valid.");
  }

  const isSuperAdmin = authCtx.roles.includes("super_admin");
  const isAdminHr = authCtx.roles.includes("admin_hr");
  const canSendAll = isSuperAdmin || isAdminHr || can(authCtx, "hris.broadcast.send:all");
  const isAuthor = broadcast.senderUserId === userId;

  if (!isAuthor && !canSendAll) {
    throw new Error(
      "Akses ditolak: Hanya pengirim pengumuman atau Admin HR yang dapat mengirim pengingat.",
    );
  }

  const unreadRecipientsWithUser = broadcast.recipients.filter(
    (r) => Boolean(r.employee?.userId),
  );

  if (unreadRecipientsWithUser.length === 0) {
    return {
      success: true,
      remindedCount: 0,
      message:
        "Seluruh penerima pengumuman ini telah membaca atau tidak memiliki akun portal HRIS aktif.",
    };
  }

  const actorUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  const notifType = broadcast.requireReadReceipt ? "ACTION_REQUIRED" : "INFO";

  await prisma.notification.createMany({
    data: unreadRecipientsWithUser.map((r) => ({
      userId: r.employee!.userId!,
      title: `Pengingat: ${broadcast.subject}`,
      message: `${broadcast.senderName}: Mohon periksa pengumuman ini. Anda belum membaca/mengonfirmasi pembacaan.`,
      type: notifType,
      category: "SYSTEM",
      link: `/pengumuman/${broadcastId}`,
    })),
  });

  await writeAudit({
    actorUserId: userId,
    actorEmail: actorUser?.email || broadcast.senderEmail || "unknown",
    app: "hris",
    action: "BROADCAST_REMIND_UNREAD",
    entityType: "EmailBroadcast",
    entityId: broadcastId,
    after: {
      broadcastId,
      remindedCount: unreadRecipientsWithUser.length,
      timestamp: new Date().toISOString(),
    },
    ip: reqMeta?.ip || "127.0.0.1",
    userAgent: reqMeta?.userAgent || "unknown",
  });

  return {
    success: true,
    remindedCount: unreadRecipientsWithUser.length,
    message: `Pengingat in-app berhasil dikirimkan ke ${unreadRecipientsWithUser.length} penerima yang belum membaca.`,
  };
}
