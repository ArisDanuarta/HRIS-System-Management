import { prisma } from "@pspk/db";
import { encryptField, decryptField } from "@pspk/shared";
import { revalidatePath } from "next/cache";

export interface SyncGoogleEventsResult {
  success: boolean;
  count: number;
  message: string;
  error?: string;
  syncedAt?: Date;
}

export interface GoogleConnectionStatus {
  isConnected: boolean;
  email?: string;
  lastSyncAt?: Date | null;
}

interface GoogleEventItem {
  id?: string;
  status?: string;
  summary?: string;
  description?: string;
  location?: string;
  hangoutLink?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  conferenceData?: {
    entryPoints?: Array<{
      entryPointType?: string;
      uri?: string;
    }>;
  };
}

interface GoogleEventsListResponse {
  items?: GoogleEventItem[];
  error?: {
    code: number;
    message: string;
  };
}

/**
 * Mengecek apakah pengguna telah menghubungkan akun Google Calendar.
 */
export async function checkGoogleConnected(userId: string): Promise<GoogleConnectionStatus> {
  const account = await prisma.account.findFirst({
    where: {
      userId,
      providerId: "google-calendar",
    },
    select: {
      accountId: true,
      updatedAt: true,
    },
  });

  if (!account) {
    return { isConnected: false };
  }

  // Cek kapan sinkronisasi terakhir event karyawan
  const lastEvent = await prisma.calendarEvent.findFirst({
    where: {
      employee: { userId },
      source: "GOOGLE_CALENDAR",
    },
    orderBy: { lastSyncAt: "desc" },
    select: { lastSyncAt: true },
  });

  return {
    isConnected: true,
    email: account.accountId,
    lastSyncAt: lastEvent?.lastSyncAt ?? account.updatedAt,
  };
}

/**
 * Menyegarkan access token Google jika sudah kedaluwarsa.
 */
export async function refreshGoogleAccessToken(
  accountId: string,
  encryptedRefreshToken: string,
): Promise<string> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("GOOGLE_CLIENT_ID atau GOOGLE_CLIENT_SECRET belum dikonfigurasi.");
  }

  const plainRefreshToken = decryptField(encryptedRefreshToken);

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: plainRefreshToken,
      grant_type: "refresh_token",
    }),
  });

  const tokenData = (await tokenRes.json()) as {
    access_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  };

  if (!tokenRes.ok || !tokenData.access_token) {
    throw new Error(
      tokenData.error_description || tokenData.error || "Gagal menyegarkan access token Google.",
    );
  }

  const newEncryptedAccessToken = encryptField(tokenData.access_token);
  const expiresAt = tokenData.expires_in
    ? new Date(Date.now() + tokenData.expires_in * 1000)
    : new Date(Date.now() + 3600 * 1000);

  await prisma.account.update({
    where: { id: accountId },
    data: {
      accessToken: newEncryptedAccessToken,
      accessTokenExpiresAt: expiresAt,
    },
  });

  return tokenData.access_token;
}

/**
 * Mengekstrak tautan Google Meet dari Google Calendar Event.
 */
function extractMeetUrl(item: GoogleEventItem): string | null {
  if (item.hangoutLink) {
    return item.hangoutLink;
  }

  if (item.conferenceData?.entryPoints) {
    const videoEntry = item.conferenceData.entryPoints.find(
      (ep) => ep.entryPointType === "video" && ep.uri,
    );
    if (videoEntry?.uri) return videoEntry.uri;
  }

  // Regex pencarian tautan meet di dalam deskripsi atau lokasi
  const meetRegex = /https:\/\/meet\.google\.com\/[a-z0-9-]+/i;
  if (item.location) {
    const locMatch = item.location.match(meetRegex);
    if (locMatch) return locMatch[0]!;
  }
  if (item.description) {
    const descMatch = item.description.match(meetRegex);
    if (descMatch) return descMatch[0]!;
  }

  return null;
}

/**
 * Menyinkronkan agenda Google Meet / Google Calendar milik karyawan yang login.
 */
export async function syncEmployeeGoogleEvents(
  employeeId: string,
  userId: string,
): Promise<SyncGoogleEventsResult> {
  const account = await prisma.account.findFirst({
    where: {
      userId,
      providerId: "google-calendar",
    },
  });

  if (!account || !account.accessToken) {
    return {
      success: false,
      count: 0,
      message: "Akun Google Calendar belum dihubungkan.",
      error: "NOT_CONNECTED",
    };
  }

  let accessToken: string;
  try {
    const isExpired =
      account.accessTokenExpiresAt &&
      account.accessTokenExpiresAt.getTime() <= Date.now() + 5 * 60 * 1000;

    if (isExpired && account.refreshToken) {
      accessToken = await refreshGoogleAccessToken(account.id, account.refreshToken);
    } else {
      accessToken = decryptField(account.accessToken);
    }
  } catch (err: unknown) {
    return {
      success: false,
      count: 0,
      message: "Gagal membaca kredensial Google. Silakan hubungkan ulang akun Google Anda.",
      error: err instanceof Error ? err.message : String(err),
    };
  }

  // Tarik event dari 30 hari yang lalu hingga 60 hari ke depan
  const now = new Date();
  const timeMin = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const timeMax = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString();

  const url = new URL("https://www.googleapis.com/calendar/v3/calendars/primary/events");
  url.searchParams.set("timeMin", timeMin);
  url.searchParams.set("timeMax", timeMax);
  url.searchParams.set("singleEvents", "true");
  url.searchParams.set("orderBy", "startTime");
  url.searchParams.set("maxResults", "250");

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });
  } catch (netErr: unknown) {
    return {
      success: false,
      count: 0,
      message: "Gagal terhubung ke Google Calendar API. Periksa koneksi internet Anda.",
      error: netErr instanceof Error ? netErr.message : String(netErr),
    };
  }

  if (res.status === 401) {
    // Coba refresh token sekali lagi jika token baru saja dicabut
    if (account.refreshToken) {
      try {
        accessToken = await refreshGoogleAccessToken(account.id, account.refreshToken);
        res = await fetch(url.toString(), {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/json",
          },
          cache: "no-store",
        });
      } catch {
        return {
          success: false,
          count: 0,
          message: "Koneksi Google telah berakhir atau dicabut. Silakan hubungkan kembali.",
          error: "TOKEN_REVOKED",
        };
      }
    } else {
      return {
        success: false,
        count: 0,
        message: "Akses Google tidak diizinkan. Silakan hubungkan kembali akun Anda.",
        error: "TOKEN_UNAUTHORIZED",
      };
    }
  }

  const data = (await res.json()) as GoogleEventsListResponse;

  if (!res.ok) {
    return {
      success: false,
      count: 0,
      message: data.error?.message || `Gagal mengambil agenda dari Google (${res.status}).`,
      error: data.error?.message || "GOOGLE_API_ERROR",
    };
  }

  const items = data.items || [];
  let syncedCount = 0;
  const activeGoogleIds = new Set<string>();

  for (const item of items) {
    if (!item.id) continue;
    activeGoogleIds.add(item.id);

    if (item.status === "cancelled") {
      await prisma.calendarEvent.deleteMany({
        where: {
          employeeId,
          externalId: item.id,
        },
      });
      continue;
    }

    const startStr = item.start?.dateTime || item.start?.date;
    const endStr = item.end?.dateTime || item.end?.date;
    if (!startStr) continue;

    const startAt = new Date(startStr);
    const endAt = endStr ? new Date(endStr) : new Date(startAt.getTime() + 3600 * 1000);
    const isAllDay = Boolean(item.start?.date && !item.start?.dateTime);
    const meetUrl = extractMeetUrl(item);

    await prisma.calendarEvent.upsert({
      where: {
        employeeId_externalId: {
          employeeId,
          externalId: item.id,
        },
      },
      update: {
        title: item.summary?.trim() || "(Tanpa Judul)",
        description: item.description?.trim() || null,
        startAt,
        endAt,
        isAllDay,
        meetUrl,
        type: "MEETING",
        source: "GOOGLE_CALENDAR",
        lastSyncAt: new Date(),
      },
      create: {
        employeeId,
        externalId: item.id,
        title: item.summary?.trim() || "(Tanpa Judul)",
        description: item.description?.trim() || null,
        startAt,
        endAt,
        isAllDay,
        meetUrl,
        type: "MEETING",
        source: "GOOGLE_CALENDAR",
        lastSyncAt: new Date(),
      },
    });

    syncedCount++;
  }

  // Hapus event lokal yang sudah dihapus di Google Calendar pada rentang waktu ini
  if (items.length > 0) {
    const allLocalEvents = await prisma.calendarEvent.findMany({
      where: {
        employeeId,
        source: "GOOGLE_CALENDAR",
        startAt: { gte: new Date(timeMin) },
        endAt: { lte: new Date(timeMax) },
      },
      select: { id: true, externalId: true },
    });

    const toDeleteIds = allLocalEvents
      .filter((le) => le.externalId && !activeGoogleIds.has(le.externalId))
      .map((le) => le.id);

    if (toDeleteIds.length > 0) {
      await prisma.calendarEvent.deleteMany({
        where: { id: { in: toDeleteIds } },
      });
    }
  }

  revalidatePath("/kalender");

  return {
    success: true,
    count: syncedCount,
    syncedAt: new Date(),
    message: `Berhasil menyinkronkan ${syncedCount} agenda & rapat dari Google Calendar!`,
  };
}

/**
 * Memutuskan sambungan akun Google Calendar dan membersihkan agenda meeting Google milik karyawan.
 */
export async function disconnectGoogleCalendar(
  userId: string,
  employeeId?: string | null,
): Promise<void> {
  // Hapus akun Google Calendar
  await prisma.account.deleteMany({
    where: {
      userId,
      providerId: "google-calendar",
    },
  });

  // Bersihkan event Google Calendar milik karyawan
  if (employeeId) {
    await prisma.calendarEvent.deleteMany({
      where: {
        employeeId,
        source: "GOOGLE_CALENDAR",
      },
    });
  }

  revalidatePath("/kalender");
}
