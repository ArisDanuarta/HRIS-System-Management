import React from "react";
import { Metadata } from "next";
import { NotFoundView } from "@pspk/ui";

export const metadata: Metadata = {
  title: "404 — Halaman Tidak Ditemukan | Portal HRIS PSPK",
  description: "Halaman yang Anda tuju tidak ditemukan pada Portal HRIS PSPK.",
};

export default function AppNotFound() {
  return (
    <NotFoundView
      inShell={true}
      currentApp="hris"
      homeUrl="/dashboard"
      homeLabel="Kembali ke Beranda"
      title="Halaman Tidak Ditemukan"
      message="Halaman atau rute yang Anda tuju tidak ditemukan pada sistem. Gunakan menu sidebar untuk berpindah ke modul lainnya."
    />
  );
}
