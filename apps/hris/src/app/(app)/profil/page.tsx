import React from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession } from "@pspk/auth";
import { getCurrentUserProfile } from "@/server/queries/profile.queries";
import { ProfileView } from "@/components/profil/profile-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Profil Saya & Keamanan — HRIS PSPK",
  description: "Kelola data kepegawaian, foto profil, kata sandi, dan riwayat sesi login aktif.",
};

export default async function ProfilPage() {
  const reqHeaders = await headers();
  const session = await getSession(reqHeaders);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const currentToken = session.session?.token;
  const profile = await getCurrentUserProfile(session.user.id, currentToken);

  if (!profile) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-red-200 text-red-700 max-w-lg mx-auto mt-12">
        <h2 className="text-lg font-bold">Data Pengguna Tidak Ditemukan</h2>
        <p className="text-sm mt-1 text-red-600">
          Tidak dapat memuat data profil akun Anda. Silakan coba masuk kembali.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <ProfileView profile={profile} />
    </div>
  );
}
