/**
 * Currency and date formatting utilities for PSPK Platform (id-ID locale)
 */

export function formatRupiah(amount: number | string | bigint | null | undefined): string {
  if (amount === null || amount === undefined || amount === "") {
    return "Rp 0";
  }

  const numericValue = typeof amount === "string" ? parseFloat(amount) : Number(amount);
  if (isNaN(numericValue)) {
    return "Rp 0";
  }

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numericValue);
}

export function formatDate(
  date: Date | string | number | null | undefined,
  options?: Intl.DateTimeFormatOptions,
): string {
  if (!date) return "-";
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "-";

  const defaultOptions: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: process.env.APP_TIMEZONE || "Asia/Jakarta",
  };

  return new Intl.DateTimeFormat("id-ID", options || defaultOptions).format(d);
}

export function formatDateTime(date: Date | string | number | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: process.env.APP_TIMEZONE || "Asia/Jakarta",
  }).format(d);
}
