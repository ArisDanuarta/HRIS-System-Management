import nodemailer from "nodemailer";
import sanitizeHtml from "sanitize-html";
import { prisma, writeAudit, BroadcastStatus } from "@pspk/db";
import { getAuthContext } from "@pspk/auth";
import { can } from "@pspk/rbac";
import {
  SendBroadcastInput,
  ReplyToMode,
  BroadcastSenderContext,
  resolveSenderIdentity,
  hasDeliverableEmail,
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
  departmentId?: string | null,
  customEmployeeIds?: string[],
): Promise<RecipientInfo[]> {
  // Proteksi: yang tidak punya hak "all" hanya boleh ke timnya sendiri
  if (!senderCtx.canSendAll && targetScope !== "TEAM") {
    throw new Error(
      "Akses ditolak: Anda hanya diizinkan mengirim pengumuman ke anggota timnya sendiri.",
    );
  }

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

    // Ambil bawahan langsung
    recipients = await prisma.employee.findMany({
      where: {
        status: "ACTIVE",
        managerId: senderCtx.employeeId,
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
    if (!departmentId) {
      throw new Error("Departemen tujuan wajib dipilih.");
    }

    recipients = await prisma.employee.findMany({
      where: {
        status: "ACTIVE",
        currentDepartmentId: departmentId,
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
        id: { in: customEmployeeIds },
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

  // Filter email valid dan kecualikan pengirim sendiri dari daftar penerima
  return recipients
    .filter((r) => hasDeliverableEmail(r.workEmail))
    .filter((r) => !senderCtx.employeeId || r.id !== senderCtx.employeeId)
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
    year = new Date().getFullYear(),
  } = params;

  const isNoReply = replyToMode === "NO_REPLY";

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
    .badge-bar { margin-bottom: 20px; display: inline-block; }
    .badge { background-color: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; font-size: 11px; font-weight: 700; text-transform: uppercase; padding: 4px 10px; border-radius: 9999px; letter-spacing: 0.5px; }
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

function escapeHtml(str: string): string {
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
export function createTransporter(): nodemailer.Transporter | null {
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
    subject: string;
    contentHtml: string;
    contentText: string;
    senderName: string;
    senderDisplayTitle?: string | null;
    replyToEmail: string;
    replyToMode?: string | null;
    targetScope: string;
  },
  recipient: {
    recipientName: string;
    email: string;
  },
) {
  const smtpFrom = process.env.SMTP_FROM?.trim() || "PSPK HRIS <no-reply@pspk.id>";
  const emailContentHtml = absolutizeImageUrls(broadcast.contentHtml);
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

  let replyToHeader = `"PSPK HRIS (No Reply)" <no-reply@pspk.id>`;
  if (mode === "ORGANIZATION_HR") {
    replyToHeader = `"Tim People & Culture PSPK" <hr@pspk.id>`;
  } else if (mode === "SENDER_PERSONAL" || mode === "CUSTOM") {
    replyToHeader = `"${broadcast.senderName}" <${broadcast.replyToEmail || "no-reply@pspk.id"}>`;
  }

  const personalizedHtml = renderBroadcastEmailHtml({
    subject: broadcast.subject,
    contentHtml: emailContentHtml,
    recipientName: recipient.recipientName,
    senderName: broadcast.senderName,
    senderTitle: broadcast.senderDisplayTitle || "Staf Lembaga",
    scopeBadge,
    isPersonal,
    replyToMode: mode,
    replyToEmail: broadcast.replyToEmail,
  });

  const plainTextFooter =
    mode === "NO_REPLY"
      ? `Pengumuman resmi dari: ${broadcast.senderName}\nEmail ini bersifat satu arah.`
      : `Pengumuman dari: ${broadcast.senderName} (${broadcast.senderDisplayTitle || "Pengirim"})\nBalas email ini untuk berdiskusi dengan pengirim.`;

  return {
    from: smtpFrom,
    to: recipient.email,
    replyTo: replyToHeader,
    subject: `[PSPK HRIS] ${broadcast.subject}`,
    text: `Halo ${recipient.recipientName},\n\n${broadcast.contentText}\n\n${plainTextFooter}`,
    html: personalizedHtml,
    headers: {
      "X-Mailer": "PSPK-Broadcast-Mailer",
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
    targetScope = "TEAM",
    targetDepartmentId,
    customEmployeeIds = [],
    sendInApp = true,
    senderPersona = "ORGANIZATION",
    customSenderName,
    replyToMode = "NO_REPLY",
    customReplyToEmail,
  } = input;

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
    targetDepartmentId,
    customEmployeeIds,
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
      senderUserId: senderCtx.userId,
      senderEmployeeId: senderCtx.employeeId,
      senderName: resolvedSender.displayName,
      senderEmail: "no-reply@pspk.id",
      replyToEmail: resolvedSender.replyToEmail,
      targetScope,
      targetDepartmentId: targetDepartmentId || null,
      totalRecipients: recipients.length,
      sentCount: 0,
      failedCount: 0,
      sendInApp,
      status: "QUEUED",
      senderPersona,
      replyToMode: resolvedSender.replyToMode,
      senderDisplayTitle: resolvedSender.displayTitle,
      recipients: {
        create: recipients.map((r) => ({
          employeeId: r.id,
          email: r.workEmail,
          recipientName: r.fullName,
          status: "PENDING",
          attempts: 0,
        })),
      },
    },
  });

  // 4. Catat Audit Log Pengantrean
  await writeAudit({
    actorUserId: senderCtx.userId,
    actorEmail: senderCtx.userEmail,
    app: "hris",
    action: "BROADCAST_EMAIL_QUEUED",
    entityType: "EmailBroadcast",
    entityId: broadcast.id,
    after: {
      broadcastId: broadcast.id,
      subject,
      targetScope,
      senderPersona,
      senderDisplayName: resolvedSender.displayName,
      replyToMode: resolvedSender.replyToMode,
      replyToEmail: resolvedSender.replyToEmail,
      totalRecipients: recipients.length,
      sendInApp,
    },
    ip: reqMeta?.ip || "127.0.0.1",
    userAgent: reqMeta?.userAgent || "unknown",
  });

  return {
    success: true,
    broadcastId: broadcast.id,
    totalRecipients: recipients.length,
    message: `Pengumuman masuk antrean dan sedang diproses ke ${recipients.length} penerima.`,
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
      select: { employee: { select: { userId: true } } },
    });

    const userIds = recipientsWithUser
      .map((r) => r.employee?.userId)
      .filter((uid): uid is string => Boolean(uid));

    if (userIds.length > 0) {
      const snippet =
        broadcast.contentText.length > 120
          ? `${broadcast.contentText.slice(0, 117)}...`
          : broadcast.contentText;

      await prisma.notification.createMany({
        data: userIds.map((userId) => ({
          userId,
          title: `Pengumuman: ${broadcast.subject}`,
          message: `${broadcast.senderName}: "${snippet}"`,
          type: "INFO",
          category: "SYSTEM",
          link: "/notifikasi",
        })),
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
            const emailOptions = buildEmailForRecipient(broadcast, rcpt);
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
