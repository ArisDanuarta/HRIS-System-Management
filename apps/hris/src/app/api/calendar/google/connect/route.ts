import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getSession } from "@pspk/auth";
import crypto from "node:crypto";

export const dynamic = "force-dynamic";

/**
 * GET /api/calendar/google/connect
 * Mengarahkan karyawan ke Google OAuth Consent Screen untuk menghubungkan akun Google Calendar & Meet.
 */
export async function GET(req: Request) {
  const reqHeaders = await headers();
  const session = await getSession(reqHeaders);

  if (!session?.user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.redirect(
      new URL("/kalender?error=oauth_not_configured", req.url),
    );
  }

  const origin = new URL(req.url).origin;
  const redirectUri =
    process.env.GOOGLE_OAUTH_REDIRECT_URI ||
    `${origin}/api/calendar/google/callback`;

  // Token state anti-CSRF
  const stateToken = crypto.randomBytes(24).toString("hex");

  const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  googleAuthUrl.searchParams.set("client_id", clientId);
  googleAuthUrl.searchParams.set("redirect_uri", redirectUri);
  googleAuthUrl.searchParams.set("response_type", "code");
  googleAuthUrl.searchParams.set(
    "scope",
    "openid email https://www.googleapis.com/auth/calendar.events.readonly",
  );
  googleAuthUrl.searchParams.set("access_type", "offline");
  googleAuthUrl.searchParams.set("prompt", "consent");
  googleAuthUrl.searchParams.set("state", stateToken);

  const response = NextResponse.redirect(googleAuthUrl.toString());
  response.cookies.set("pspk_gcal_oauth_state", stateToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60, // 10 menit
  });

  return response;
}
