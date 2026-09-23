import nodemailer from "nodemailer";

export interface SendCredentialsEmailParams {
  to: string;
  fullName: string;
  workEmail: string;
  temporaryPassword: string;
  roleName: string;
  loginUrl?: string;
}

export interface EmailSendResult {
  success: boolean;
  simulated: boolean;
  message: string;
  error?: string;
}

/**
 * Mengirimkan informasi akun & kredensial login pertama ke email pribadi karyawan baru.
 * Jika variabel environment SMTP belum dikonfigurasi, pengiriman akan disimulasikan dan dicatat di server log.
 */
export async function sendEmployeeCredentialsEmail(
  params: SendCredentialsEmailParams,
): Promise<EmailSendResult> {
  const { to, fullName, workEmail, temporaryPassword, roleName } = params;
  const loginUrl =
    params.loginUrl ||
    process.env.HRIS_URL ||
    (process.env.NODE_ENV === "production" ? "https://hris.pspk.id/masuk" : "http://localhost:3001/masuk");

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM || "PSPK HRIS <noreply@pspk.id>";

  const emailSubject = `[PSPK HRIS] Informasi Akun & Kredensial Akses Portal Pegawai - ${fullName}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Kredensial Akun Portal PSPK</title>
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 20px; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .header { background-color: #102E50; padding: 28px 24px; text-align: center; border-bottom: 4px solid #F2AF3E; }
        .header h1 { margin: 0; color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: 0.5px; }
        .header p { margin: 6px 0 0 0; color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }
        .content { padding: 32px 28px; }
        .greeting { font-size: 16px; font-weight: 600; color: #102E50; margin-bottom: 12px; }
        .card { background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .card-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #e2e8f0; font-size: 14px; }
        .card-row:last-child { border-bottom: none; }
        .card-label { font-weight: 600; color: #475569; width: 40%; }
        .card-value { font-family: 'SFMono-Regular', Consolas, Monaco, monospace; color: #0f172a; font-weight: 600; width: 60%; word-break: break-all; }
        .password-badge { display: inline-block; background-color: #fef3c7; color: #92400e; padding: 3px 8px; border-radius: 4px; font-size: 14px; border: 1px solid #fde68a; }
        .btn-wrapper { text-align: center; margin: 28px 0; }
        .btn { display: inline-block; background-color: #102E50; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: 600; font-size: 14px; box-shadow: 0 2px 4px rgba(16,46,80,0.2); }
        .warning { background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 4px; font-size: 13px; color: #78350f; margin-top: 20px; }
        .footer { background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Pusat Studi Pendidikan dan Kebijakan</h1>
          <p>Portal Sistem HRIS & Manajemen Organisasi</p>
        </div>
        <div class="content">
          <div class="greeting">Halo ${fullName},</div>
          <p style="font-size: 14px; color: #334155; margin: 0 0 16px 0;">
            Selamat bergabung di tim PSPK! Akun akses resmi Anda ke dalam <strong>Portal HRIS PSPK</strong> telah berhasil dibuat oleh Administrator HR.
          </p>

          <div class="card">
            <div style="font-size: 13px; font-weight: 700; color: #102E50; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
              Informasi Kredensial Login
            </div>
            <div class="card-row">
              <span class="card-label">Email Login Kantor</span>
              <span class="card-value">${workEmail}</span>
            </div>
            <div class="card-row">
              <span class="card-label">Kata Sandi Sementara</span>
              <span class="card-value"><span class="password-badge">${temporaryPassword}</span></span>
            </div>
            <div class="card-row">
              <span class="card-label">Hak Akses (Role)</span>
              <span class="card-value">${roleName}</span>
            </div>
            <div class="card-row">
              <span class="card-label">Halaman Masuk</span>
              <span class="card-value"><a href="${loginUrl}" style="color: #102E50;">${loginUrl}</a></span>
            </div>
          </div>

          <div class="btn-wrapper">
            <a href="${loginUrl}" class="btn" target="_blank">Masuk ke Portal HRIS</a>
          </div>

          <div class="warning">
            <strong>Penting:</strong> Demi keamanan data dan akun Anda, harap segera masuk ke sistem dan perbarui kata sandi Anda melalui menu profil setelah login pertama kali. Jangan membagikan kata sandi ini kepada pihak lain.
          </div>
        </div>
        <div class="footer">
          <p style="margin: 0 0 4px 0;">Email ini dikirim secara otomatis oleh Sistem HRIS PSPK.</p>
          <p style="margin: 0;">&copy; ${new Date().getFullYear()} Yayasan Pusat Studi Pendidikan dan Kebijakan (PSPK).</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
Halo ${fullName},

Selamat bergabung di tim PSPK! Akun akses resmi Anda ke dalam Portal HRIS PSPK telah berhasil dibuat.

Kredensial Login Anda:
- Email Login Kantor: ${workEmail}
- Kata Sandi Sementara: ${temporaryPassword}
- Hak Akses (Role): ${roleName}
- Tautan Masuk: ${loginUrl}

Penting: Demi keamanan data Anda, harap segera masuk dan perbarui kata sandi Anda melalui menu profil setelah login pertama kali.

---
Sistem HRIS PSPK
Pusat Studi Pendidikan dan Kebijakan
  `.trim();

  // Jika SMTP dikonfigurasi, kirim email sungguhan
  if (smtpHost && smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      await transporter.sendMail({
        from: smtpFrom,
        to,
        subject: emailSubject,
        text: textContent,
        html: htmlContent,
      });

      return {
        success: true,
        simulated: false,
        message: `Email kredensial berhasil dikirim ke ${to}`,
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Kesalahan pengiriman SMTP";
      console.error("[EMAIL SERVICE] Gagal mengirim email kredensial via SMTP:", err);
      return {
        success: false,
        simulated: false,
        message: `Gagal mengirim email via SMTP: ${errorMsg}`,
        error: errorMsg,
      };
    }
  }

  // Fallback simulasi jika SMTP belum dikonfigurasi
  console.log(`
================================================================================
📧 [SIMULASI PENGIRIMAN EMAIL KREDENSIAL HRIS PSPK]
--------------------------------------------------------------------------------
Kepada (Email Pribadi) : ${to}
Nama Pegawai           : ${fullName}
Email Login Kantor     : ${workEmail}
Kata Sandi Sementara   : ${temporaryPassword}
Peran Sistem (Role)    : ${roleName}
Tautan Login           : ${loginUrl}
Catatan                : SMTP_HOST belum dikonfigurasi di file .env.
                         Email ini disimulasikan dan kredensial tampil di layar Admin HR.
================================================================================
  `);

  return {
    success: true,
    simulated: true,
    message: `Informasi akun disimulasikan ke log server (SMTP belum dikonfigurasi di server).`,
  };
}
