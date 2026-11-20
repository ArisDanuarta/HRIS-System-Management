import type { ReplyToMode } from "../../server/schemas/broadcast.schema";

export const BULK_CONFIRM_THRESHOLD = 20;

/**
 * Menerjemahkan mode Reply-To menjadi label ringkas yang ramah pengguna di UI form.
 */
export function getReplyToDisplayLabel(
  replyToMode: ReplyToMode,
  customEmail?: string | null,
): string {
  switch (replyToMode) {
    case "ORGANIZATION_HR":
      return "balasan ke hr@pspk.id";
    case "SENDER_PERSONAL":
      return "balasan ke email Anda";
    case "CUSTOM":
      return customEmail?.trim()
        ? `balasan ke ${customEmail.trim()}`
        : "balasan ke alamat kustom";
    case "NO_REPLY":
    default:
      return "tanpa balasan";
  }
}

/**
 * Menentukan apakah pengiriman berstatus massal sehingga memerlukan verifikasi konfirmasi ekstra.
 */
export function isBulkBroadcast(
  targetScope: string,
  recipientCount: number,
): boolean {
  return targetScope === "ALL_EMPLOYEES" || recipientCount >= BULK_CONFIRM_THRESHOLD;
}

/**
 * Mengekstrak cuplikan teks polos (maks 280 karakter) dan menghitung jumlah gambar dari HTML.
 * Bersifat murni (pure function) agar aman dijalankan di client browser maupun lingkungan vitest/SSR.
 */
export function extractContentSummary(html: string): {
  snippet: string;
  imageCount: number;
} {
  if (!html || !html.trim()) {
    return { snippet: "", imageCount: 0 };
  }

  // Hitung jumlah tag img
  const imageMatches = html.match(/<img\b[^>]*>/gi);
  const imageCount = imageMatches ? imageMatches.length : 0;

  // Konversi HTML ke teks polos sederhana
  const plainText = html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*[\/]?>/gi, " ")
    .replace(/<\/p>/gi, " ")
    .replace(/<\/div>/gi, " ")
    .replace(/<[^>]+>/gi, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();

  const snippet =
    plainText.length > 280 ? `${plainText.slice(0, 277)}...` : plainText;

  return { snippet, imageCount };
}

/**
 * Mengganti variabel personalisasi dengan contoh ("Budi Santoso" / "Budi") untuk pratinjau langsung di UI.
 * Bersifat murni (pure function) agar aman dijalankan di client browser maupun lingkungan SSR.
 */
export function interpolatePreviewVariables(text: string): string {
  if (!text) return "";
  return text
    .replace(/\{\{\s*nama\s*\}\}/gi, "Budi Santoso")
    .replace(/\{\{\s*nama_depan\s*\}\}/gi, "Budi");
}
