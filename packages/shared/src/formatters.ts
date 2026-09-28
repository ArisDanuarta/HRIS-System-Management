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
    ...options,
  };

  return new Intl.DateTimeFormat("id-ID", defaultOptions).format(d);
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

export function formatRelativeTime(date: Date | string | number | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "-";

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "Baru saja";
  if (diffMin < 60) return `${diffMin} menit lalu`;
  if (diffHour < 24) return `${diffHour} jam lalu`;
  if (diffDay === 1) {
    const timeStr = new Intl.DateTimeFormat("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(d);
    return `Kemarin, ${timeStr}`;
  }
  if (diffDay < 7) return `${diffDay} hari lalu`;

  return formatDateTime(d);
}

/**
 * Known Indonesian Timezone definitions with labels and IANA mappings.
 */
export const INDONESIA_TIMEZONES = [
  { key: "Asia/Jakarta", abbr: "WIB", label: "WIB (Jakarta / Barat)", offsetHours: 7 },
  { key: "Asia/Makassar", abbr: "WITA", label: "WITA (Bali, Makassar / Tengah)", offsetHours: 8 },
  { key: "Asia/Jayapura", abbr: "WIT", label: "WIT (Papua, Maluku / Timur)", offsetHours: 9 },
] as const;

/**
 * Returns standard timezone abbreviation (e.g. WIB, WITA, WIT, GMT+X).
 */
export function getTimezoneAbbr(timeZone: string, date = new Date()): string {
  try {
    const parts = new Intl.DateTimeFormat("id-ID", {
      timeZone,
      timeZoneName: "short",
    }).formatToParts(date);
    const tzPart = parts.find((p) => p.type === "timeZoneName")?.value;
    if (tzPart) return tzPart;
  } catch {
    // Ignore error and fallback
  }

  // Fallback map for common IANA zones
  if (timeZone === "Asia/Jakarta" || timeZone === "Asia/Pontianak") return "WIB";
  if (
    timeZone === "Asia/Makassar" ||
    timeZone === "Asia/Ujung_Pandang" ||
    timeZone === "Asia/Denpasar"
  ) {
    return "WITA";
  }
  if (timeZone === "Asia/Jayapura") return "WIT";
  return timeZone;
}

/**
 * Returns user-friendly timezone label with regional context.
 */
export function getTimezoneLabel(timeZone: string): string {
  const match = INDONESIA_TIMEZONES.find((z) => z.key === timeZone);
  if (match) return match.label;
  const abbr = getTimezoneAbbr(timeZone);
  return `${timeZone} (${abbr})`;
}

/**
 * Returns standard ISO YYYY-MM-DD date in target timezone.
 * Avoids UTC host offset bugs on early morning check-ins.
 */
export function toDateStringInTimezone(
  date: Date | string | number | null | undefined = new Date(),
  timeZone: string = process.env.APP_TIMEZONE || "Asia/Jakarta",
): string {
  if (!date) return "";
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";

  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/**
 * Formats time in a specific timezone with optional seconds.
 */
export function formatTimeInZone(
  date: Date | string | number | null | undefined,
  timeZone: string = process.env.APP_TIMEZONE || "Asia/Jakarta",
  options?: Intl.DateTimeFormatOptions,
): string {
  if (!date) return "--:--";
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "--:--";

  const mergedOptions: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    ...options,
    timeZone: options?.timeZone || timeZone,
  };

  return new Intl.DateTimeFormat("id-ID", mergedOptions).format(d);
}

/**
 * Formats date in a specific timezone.
 */
export function formatDateInZone(
  date: Date | string | number | null | undefined,
  timeZone: string = process.env.APP_TIMEZONE || "Asia/Jakarta",
  options?: Intl.DateTimeFormatOptions,
): string {
  if (!date) return "-";
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "-";

  const mergedOptions: Intl.DateTimeFormatOptions = {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    ...options,
    timeZone: options?.timeZone || timeZone,
  };

  return new Intl.DateTimeFormat("id-ID", mergedOptions).format(d);
}

/**
 * Converts a HH:MM time string from one timezone to another (e.g. "09:00" WIB -> "10:00" WITA).
 */
export function convertTimeStringZone(
  timeStr: string,
  fromZone: string = "Asia/Jakarta",
  toZone: string = "Asia/Jakarta",
): string {
  if (!timeStr || fromZone === toZone) return timeStr;

  const [hStr, mStr] = timeStr.split(":");
  const h = parseInt(hStr || "0", 10);
  const m = parseInt(mStr || "0", 10);
  if (isNaN(h) || isNaN(m)) return timeStr;

  try {
    const now = new Date();
    const getOffset = (tz: string) => {
      const utc = new Date(now.toLocaleString("en-US", { timeZone: "UTC" }));
      const target = new Date(now.toLocaleString("en-US", { timeZone: tz }));
      return Math.round((target.getTime() - utc.getTime()) / 60000);
    };

    const fromOffset = getOffset(fromZone);
    const toOffset = getOffset(toZone);
    const diffMins = toOffset - fromOffset;

    let totalMins = h * 60 + m + diffMins;
    while (totalMins < 0) totalMins += 24 * 60;
    totalMins = totalMins % (24 * 60);

    const outH = Math.floor(totalMins / 60);
    const outM = totalMins % 60;

    return `${String(outH).padStart(2, "0")}:${String(outM).padStart(2, "0")}`;
  } catch {
    return timeStr;
  }
}


