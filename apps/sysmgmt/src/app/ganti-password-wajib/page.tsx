import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession, getUserProfile } from "@pspk/auth";
import { GantiPasswordWajibSysClient } from "./ganti-password-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Perbarui Kata Sandi Wajib - System Management PSPK",
  description: "Pengamanan akun dan perubahan kata sandi bagi administrator PSPK",
  robots: { index: false, follow: false },
};

export default async function GantiPasswordWajibSysPage() {
  const reqHeaders = await headers();
  const session = await getSession(reqHeaders);

  // Jika belum login, arahkan ke halaman login
  if (!session || !session.user) {
    redirect("/login");
  }

  const userProfile = await getUserProfile(session.user.id);

  // Jika akun tidak berstatus wajib ganti password, kembalikan ke dashboard
  if (!userProfile?.mustChangePassword) {
    redirect("/dashboard");
  }

  const displayName =
    userProfile.employee?.fullName || session.user.name || "Administrator PSPK";

  return (
    <GantiPasswordWajibSysClient
      userEmail={session.user.email}
      userName={displayName}
    />
  );
}

