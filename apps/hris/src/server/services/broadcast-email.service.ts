import nodemailer from "nodemailer";
import sanitizeHtml from "sanitize-html";
import { prisma, writeAudit } from "@pspk/db";
import { getAuthContext } from "@pspk/auth";
import {
  SendBroadcastInput,
  SenderPersona,
  ReplyToMode,
} from "../schemas/broadcast.schema";

export interface RecipientInfo {
  id: string;
  fullName: string;
  workEmail: string;
  userId: string | null;
  departmentName?: string | null;
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

  if (!isSuperAdmin && !isAdminHr && !isManager) {
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

  const allowedScopes: Array<"ALL_EMPLOYEES" | "DEPARTMENT" | "TEAM" | "CUSTOM"> = [];
  if (isSuperAdmin || isAdminHr) {
    allowedScopes.push("ALL_EMPLOYEES", "DEPARTMENT", "TEAM", "CUSTOM");
  } else if (isManager) {
    allowedScopes.push("TEAM");
  }

  return {
    userId,
    userEmail: employee?.workEmail || "",
    userName: employee?.fullName || "Pengguna PSPK",
    employeeId: employee?.id || null,
    employeeTitle,
    isSuperAdmin,
    isAdminHr,
    isManager,
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
  // Proteksi keamanan: Manajer hanya boleh mengirim ke timnya sendiri
  if (!senderCtx.isSuperAdmin && !senderCtx.isAdminHr) {
    if (targetScope !== "TEAM") {
      throw new Error(
        "Akses ditolak: Manajer / Lead tim hanya diizinkan mengirim pengumuman ke anggota timnya sendiri.",
      );
    }
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
    .filter((r) => r.workEmail && r.workEmail.includes("@"))
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
    allowedSchemes: ["http", "https", "mailto", "data"],
  });
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

export interface ResolvedSenderIdentity {
  displayName: string;
  displayTitle: string;
  isPersonal: boolean;
  replyToHeader: string;
  replyToEmail: string;
  replyToMode: ReplyToMode;
}

/**
 * Menerjemahkan pilihan persona dan mode balasan menjadi nama tampilan resmi, sub-judul,
 * dan header Reply-To email.
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
        <strong>Diskusi &amp; Pertanyaan:</strong> Anda dapat langsung membalas (*Reply*) email ini dari aplikasi email Anda untuk terhubung langsung dengan <strong>${escapeHtml(replyToMode === "ORGANIZATION_HR" ? "Tim People & Culture (HR) PSPK" : replyToEmail || senderName)}</strong>.
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
 * Eksekusi pengiriman email broadcast individual dengan rate-limiting batching.
 */
export async function executeSendBroadcast(
  userId: string,
  input: SendBroadcastInput,
  reqMeta?: { ip?: string; userAgent?: string },
): Promise<SendBroadcastResult> {
  const senderCtx = await getBroadcastSenderContext(userId);

  const {
    subject,
    contentHtml: rawContentHtml,
    targetScope = "TEAM",
    targetDepartmentId,
    customEmployeeIds = [],
    sendInApp = true,
  } = input;

  // 1. Sanitasi konten HTML
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

  // 3. Simpan rekor EmailBroadcast induk ke database
  const broadcast = await prisma.emailBroadcast.create({
    data: {
      subject,
      contentHtml: sanitizedContent,
      contentText: plainTextContent,
      senderUserId: senderCtx.userId,
      senderEmployeeId: senderCtx.employeeId,
      senderName: senderCtx.userName,
      senderEmail: senderCtx.userEmail,
      replyToEmail: senderCtx.userEmail,
      targetScope,
      targetDepartmentId: targetDepartmentId || null,
      totalRecipients: recipients.length,
      sentCount: 0,
      failedCount: 0,
      sendInApp,
      status: "SENDING",
      recipients: {
        create: recipients.map((r) => ({
          employeeId: r.id,
          email: r.workEmail,
          recipientName: r.fullName,
          status: "PENDING",
        })),
      },
    },
    include: {
      recipients: true,
    },
  });

  // Tentukan badge cakupan
  const scopeBadge =
    targetScope === "ALL_EMPLOYEES"
      ? "PENGUMUMAN ORGANISASI"
      : targetScope === "DEPARTMENT"
        ? "PENGUMUMAN DIVISI"
        : "PENGUMUMAN TIM";

  // 4. Konfigurasi SMTP
  const smtpHost = process.env.SMTP_HOST?.trim();
  const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const smtpUser = process.env.SMTP_USER?.trim();
  const rawSmtpPass = process.env.SMTP_PASS?.trim();
  const smtpPass =
    smtpHost && smtpHost.includes("gmail") && rawSmtpPass
      ? rawSmtpPass.replace(/\s+/g, "")
      : rawSmtpPass;
  const smtpFrom = process.env.SMTP_FROM?.trim() || "PSPK HRIS <no-reply@pspk.id>";

  let sentCount = 0;
  let failedCount = 0;
  let isSimulated = false;

  if (smtpHost && smtpUser && smtpPass) {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    // Kirim secara individual dalam batch ukuran 5 untuk rate-limiting
    const BATCH_SIZE = 5;
    for (let i = 0; i < broadcast.recipients.length; i += BATCH_SIZE) {
      const batch = broadcast.recipients.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map(async (rcpt) => {
          const personalizedHtml = renderBroadcastEmailHtml({
            subject,
            contentHtml: sanitizedContent,
            recipientName: rcpt.recipientName,
            senderName: senderCtx.userName,
            senderTitle: senderCtx.employeeTitle,
            scopeBadge,
          });

          try {
            await transporter.sendMail({
              from: smtpFrom,
              to: rcpt.email,
              replyTo: `"${senderCtx.userName}" <${senderCtx.userEmail}>`,
              subject: `[PSPK HRIS] ${subject}`,
              text: `Halo ${rcpt.recipientName},\n\n${plainTextContent}\n\nPengumuman dari: ${senderCtx.userName} (${senderCtx.employeeTitle})\nBalas email ini untuk berdiskusi dengan pengirim.`,
              html: personalizedHtml,
              headers: {
                "X-Mailer": "PSPK-Broadcast-Mailer",
              },
            });

            await prisma.emailBroadcastRecipient.update({
              where: { id: rcpt.id },
              data: {
                status: "SENT",
                sentAt: new Date(),
              },
            });
            sentCount++;
          } catch (err: unknown) {
            const errorMsg = err instanceof Error ? err.message : "Kesalahan pengiriman SMTP";
            console.error(`Gagal mengirim broadcast ke ${rcpt.email}:`, err);

            await prisma.emailBroadcastRecipient.update({
              where: { id: rcpt.id },
              data: {
                status: "FAILED",
                errorMessage: errorMsg,
              },
            });
            failedCount++;
          }
        }),
      );

      // Jeda 200ms antar batch agar koneksi SMTP tidak diblokir
      if (i + BATCH_SIZE < broadcast.recipients.length) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }
  } else {
    // Mode simulasi jika SMTP belum terkonfigurasi (lingkungan development)
    isSimulated = true;
    console.log(`
================================================================================
📢 [SIMULASI PENGIRIMAN BROADCAST EMAIL PSPK]
--------------------------------------------------------------------------------
Dari (From)      : ${smtpFrom}
Balasan (Reply-To): ${senderCtx.userName} <${senderCtx.userEmail}>
Subjek           : [PSPK HRIS] ${subject}
Cakupan Target   : ${targetScope} (${recipients.length} Orang Penerima)
Daftar Penerima  : ${recipients.map((r) => `${r.fullName} <${r.workEmail}>`).join(", ")}
================================================================================
    `);

    await prisma.emailBroadcastRecipient.updateMany({
      where: { broadcastId: broadcast.id },
      data: {
        status: "SENT",
        sentAt: new Date(),
      },
    });

    sentCount = recipients.length;
  }

  // 5. Kirimkan Notifikasi In-App jika opsi dicentang
  if (sendInApp) {
    const validUserRecipients = recipients.filter((r) => r.userId);
    if (validUserRecipients.length > 0) {
      const snippet =
        plainTextContent.length > 120
          ? `${plainTextContent.slice(0, 117)}...`
          : plainTextContent;

      await prisma.notification.createMany({
        data: validUserRecipients.map((r) => ({
          userId: r.userId!,
          title: `Pengumuman: ${subject}`,
          message: `${senderCtx.userName}: "${snippet}"`,
          type: "INFO",
          category: "SYSTEM",
          link: `/komunikasi/riwayat?id=${broadcast.id}`,
        })),
      });
    }
  }

  // 6. Update status akhir broadcast
  const finalStatus =
    failedCount === 0
      ? "SENT"
      : sentCount > 0
        ? "PARTIALLY_FAILED"
        : "FAILED";

  await prisma.emailBroadcast.update({
    where: { id: broadcast.id },
    data: {
      sentCount,
      failedCount,
      status: finalStatus,
    },
  });

  // 7. Catat Audit Log
  await writeAudit({
    actorUserId: senderCtx.userId,
    actorEmail: senderCtx.userEmail,
    app: "hris",
    action: "BROADCAST_EMAIL",
    entityType: "EmailBroadcast",
    entityId: broadcast.id,
    after: {
      broadcastId: broadcast.id,
      subject,
      targetScope,
      totalRecipients: recipients.length,
      sentCount,
      failedCount,
      isSimulated,
      sendInApp,
    },
    ip: reqMeta?.ip || "127.0.0.1",
    userAgent: reqMeta?.userAgent || "unknown",
  });

  return {
    success: true,
    broadcastId: broadcast.id,
    totalRecipients: recipients.length,
    sentCount,
    failedCount,
    simulated: isSimulated,
    message: isSimulated
      ? `Pengumuman berhasil disimulasikan ke ${sentCount} penerima (SMTP belum dikonfigurasi).`
      : `Pengumuman berhasil dikirimkan ke ${sentCount} dari ${recipients.length} penerima via email.`,
  };
}
