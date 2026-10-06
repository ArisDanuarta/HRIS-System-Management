import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getSession, getAuthContext } from "@pspk/auth";
import { prisma } from "@pspk/db";
import { encryptField } from "@pspk/shared";
import { syncEmployeeGoogleEvents } from "@/server/services/google-calendar.service";

export const dynamic = "force-dynamic";

/**
 * GET /api/calendar/google/callback
 * Menerima authorization code dari Google OAuth, menukarkannya dengan token,
 * mengenkripsi token dengan DATA_ENCRYPTION_KEY, menyimpannya di model Account,
 * dan melakukan sinkronisasi awal agenda rapat karyawan.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const errorParam = url.searchParams.get("error");

  const kalenderUrl = new URL("/kalender", req.url);

  if (errorParam) {
    kalenderUrl.searchParams.set("error", `google_${errorParam}`);
    return NextResponse.redirect(kalenderUrl);
  }

  if (!code || !state) {
    kalenderUrl.searchParams.set("error", "missing_code_or_state");
    return NextResponse.redirect(kalenderUrl);
  }

  // Verifikasi cookie state anti-CSRF
  const cookieHeader = req.headers.get("cookie") || "";
  const storedStateMatch = cookieHeader.match(/pspk_gcal_oauth_state=([^;]+)/);
  const storedState = storedStateMatch ? storedStateMatch[1] : null;

  if (!storedState || storedState !== state) {
    kalenderUrl.searchParams.set("error", "invalid_state");
    return NextResponse.redirect(kalenderUrl);
  }

  const reqHeaders = await headers();
  const session = await getSession(reqHeaders);
  if (!session?.user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    kalenderUrl.searchParams.set("error", "oauth_not_configured");
    return NextResponse.redirect(kalenderUrl);
  }

  const origin = url.origin;
  const redirectUri =
    process.env.GOOGLE_OAUTH_REDIRECT_URI ||
    `${origin}/api/calendar/google/callback`;

  // Tukarkan authorization code dengan Access & Refresh Token
  let tokenData: {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    id_token?: string;
    scope?: string;
    error?: string;
    error_description?: string;
  };

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
    });

    tokenData = (await tokenRes.json()) as typeof tokenData;
    if (!tokenRes.ok || !tokenData.access_token) {
      kalenderUrl.searchParams.set(
        "error",
        tokenData.error_description || tokenData.error || "token_exchange_failed",
      );
      return NextResponse.redirect(kalenderUrl);
    }
  } catch {
    kalenderUrl.searchParams.set("error", "token_exchange_network_error");
    return NextResponse.redirect(kalenderUrl);
  }

  // Dapatkan email akun Google
  let googleEmail = session.user.email;
  try {
    const userinfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    if (userinfoRes.ok) {
      const userinfo = (await userinfoRes.json()) as { email?: string };
      if (userinfo.email) googleEmail = userinfo.email;
    }
  } catch {
    // Fallback ke email sesi login
  }

  // Enkripsi token sensitif menggunakan AES-256-GCM
  const encryptedAccessToken = encryptField(tokenData.access_token);
  const encryptedRefreshToken = tokenData.refresh_token
    ? encryptField(tokenData.refresh_token)
    : undefined;

  const expiresAt = tokenData.expires_in
    ? new Date(Date.now() + tokenData.expires_in * 1000)
    : new Date(Date.now() + 3600 * 1000);

  // Simpan atau update ke tabel Account
  const existingAccount = await prisma.account.findFirst({
    where: {
      userId: session.user.id,
      providerId: "google-calendar",
    },
  });

  if (existingAccount) {
    await prisma.account.update({
      where: { id: existingAccount.id },
      data: {
        accountId: googleEmail,
        accessToken: encryptedAccessToken,
        ...(encryptedRefreshToken ? { refreshToken: encryptedRefreshToken } : {}),
        accessTokenExpiresAt: expiresAt,
        scope: tokenData.scope,
      },
    });
  } else {
    await prisma.account.create({
      data: {
        userId: session.user.id,
        accountId: googleEmail,
        providerId: "google-calendar",
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        accessTokenExpiresAt: expiresAt,
        scope: tokenData.scope,
      },
    });
  }

  // Lakukan sinkronisasi awal agenda meeting milik karyawan
  const authCtx = await getAuthContext(session.user.id);
  if (authCtx?.employeeId) {
    try {
      await syncEmployeeGoogleEvents(authCtx.employeeId, session.user.id);
    } catch (syncErr) {
      console.error("Gagal melakukan sinkronisasi awal event Google:", syncErr);
    }
  }

  kalenderUrl.searchParams.set("connected", "true");
  const response = NextResponse.redirect(kalenderUrl);
  response.cookies.delete("pspk_gcal_oauth_state");
  return response;
}
