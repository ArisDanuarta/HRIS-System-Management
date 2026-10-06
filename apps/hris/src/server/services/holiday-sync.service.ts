import { prisma } from "@pspk/db";
import { revalidatePath } from "next/cache";

export interface HolidayItemParsed {
  date: string; // YYYY-MM-DD
  name: string;
  isCollectiveLeave: boolean;
}

export interface HolidaySyncResult {
  success: boolean;
  year: number;
  synced: number;
  skipped: number;
  holidays: HolidayItemParsed[];
  message: string;
  source: "google_calendar" | "fallback_database";
  error?: string;
}

// Kalender publik Google untuk hari libur resmi Indonesia
const GOOGLE_CALENDAR_ID_ID = "id.indonesian#holiday@group.v.calendar.google.com";
const GOOGLE_CALENDAR_ID_EN = "en.indonesian#holiday@group.v.calendar.google.com";

interface GoogleCalendarEventItem {
  id?: string;
  summary?: string;
  description?: string;
  start?: { date?: string; dateTime?: string };
  end?: { date?: string; dateTime?: string };
}

interface GoogleCalendarEventsResponse {
  items?: GoogleCalendarEventItem[];
  error?: {
    code: number;
    message: string;
  };
}

/**
 * Sinkronisasi Hari Libur Nasional & Cuti Bersama Indonesia dari Google Calendar Public API.
 * Menggunakan Google Calendar API Key (tanpa login akun pengguna).
 */
export async function syncIndonesianHolidays(
  year: number,
  apiKeyOverride?: string,
): Promise<HolidaySyncResult> {
  const apiKey = apiKeyOverride || process.env.GOOGLE_CALENDAR_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      year,
      synced: 0,
      skipped: 0,
      holidays: [],
      source: "fallback_database",
      message:
        "GOOGLE_CALENDAR_API_KEY belum dikonfigurasi di environment (.env). Silakan atur Google Calendar API Key terlebih dahulu.",
      error: "MISSING_API_KEY",
    };
  }

  const timeMin = `${year}-01-01T00:00:00Z`;
  const timeMax = `${year}-12-31T23:59:59Z`;

  // Coba kalender berbahasa Indonesia terlebih dahulu, fallback ke kalender versi Inggris jika gagal
  const calendarIds = [GOOGLE_CALENDAR_ID_ID, GOOGLE_CALENDAR_ID_EN];
  let items: GoogleCalendarEventItem[] = [];
  let lastError: string | null = null;

  for (const calId of calendarIds) {
    try {
      const url = new URL(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}/events`,
      );
      url.searchParams.set("key", apiKey);
      url.searchParams.set("timeMin", timeMin);
      url.searchParams.set("timeMax", timeMax);
      url.searchParams.set("singleEvents", "true");
      url.searchParams.set("orderBy", "startTime");

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });

      const data = (await response.json()) as GoogleCalendarEventsResponse;

      if (!response.ok) {
        lastError = data.error?.message || `HTTP ${response.status} ${response.statusText}`;
        continue;
      }

      if (Array.isArray(data.items) && data.items.length > 0) {
        items = data.items;
        break;
      }
    } catch (err: unknown) {
      lastError = err instanceof Error ? err.message : String(err);
    }
  }

  if (items.length === 0) {
    return {
      success: false,
      year,
      synced: 0,
      skipped: 0,
      holidays: [],
      source: "google_calendar",
      message:
        lastError ||
        `Tidak ada data hari libur nasional ditemukan dari Google Calendar untuk tahun ${year}.`,
      error: lastError || "NO_EVENTS_FOUND",
    };
  }

  const parsedHolidays: HolidayItemParsed[] = [];

  for (const item of items) {
    const rawDateStr = item.start?.date || item.start?.dateTime?.slice(0, 10);
    if (!rawDateStr) continue;

    const summary = (item.summary || "Hari Libur Nasional").trim();
    const isCollectiveLeave =
      summary.toLowerCase().includes("cuti bersama") ||
      Boolean(item.description?.toLowerCase().includes("cuti bersama"));

    // Google Calendar 'end.date' untuk all-day events bersifat exclusive.
    // Tangani event yang berlangsung beberapa hari beruntun.
    const startObj = new Date(`${rawDateStr}T00:00:00Z`);
    const rawEndDate = item.end?.date || item.end?.dateTime?.slice(0, 10);
    const endObj = rawEndDate ? new Date(`${rawEndDate}T00:00:00Z`) : startObj;

    const currentCursor = new Date(startObj);
    const maxEnd = endObj.getTime() > startObj.getTime() ? endObj : new Date(startObj.getTime() + 86400000);

    while (currentCursor < maxEnd) {
      const yearVal = currentCursor.getUTCFullYear();
      const monthVal = String(currentCursor.getUTCMonth() + 1).padStart(2, "0");
      const dayVal = String(currentCursor.getUTCDate()).padStart(2, "0");
      const dateKey = `${yearVal}-${monthVal}-${dayVal}`;

      // Hanya simpan jika masuk tahun yang diminta
      if (yearVal === year) {
        parsedHolidays.push({
          date: dateKey,
          name: summary,
          isCollectiveLeave,
        });
      }

      currentCursor.setUTCDate(currentCursor.getUTCDate() + 1);
    }
  }

  // Upsert ke database PostgreSQL tabel Holiday
  let syncedCount = 0;
  for (const h of parsedHolidays) {
    const [yStr, mStr, dStr] = h.date.split("-");
    const yNum = Number(yStr);
    const mNum = Number(mStr);
    const dNum = Number(dStr);
    const holidayDate = new Date(Date.UTC(yNum, mNum - 1, dNum, 0, 0, 0, 0));

    await prisma.holiday.upsert({
      where: { date: holidayDate },
      update: {
        name: h.name,
        isCollectiveLeave: h.isCollectiveLeave,
      },
      create: {
        date: holidayDate,
        name: h.name,
        isCollectiveLeave: h.isCollectiveLeave,
      },
    });
    syncedCount++;
  }

  // Revalidasi cache rute
  revalidatePath("/kalender");
  revalidatePath("/cuti/kalender");
  revalidatePath("/cuti/pengaturan");
  revalidatePath("/cuti/ajukan");

  return {
    success: true,
    year,
    synced: syncedCount,
    skipped: 0,
    holidays: parsedHolidays,
    source: "google_calendar",
    message: `Berhasil menyinkronkan ${syncedCount} hari libur nasional & cuti bersama tahun ${year} dari Google Calendar!`,
  };
}
