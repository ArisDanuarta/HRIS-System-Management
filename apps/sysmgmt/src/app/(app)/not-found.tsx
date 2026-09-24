import React from "react";
import { Metadata } from "next";
import { NotFoundView } from "@pspk/ui";

export const metadata: Metadata = {
  title: "404 — Halaman Tidak Ditemukan | System Management PSPK",
  description: "Halaman yang Anda tuju tidak ditemukan pada System Management PSPK.",
};

export default function AppNotFound() {
  return (
    <NotFoundView
      inShell={true}
      currentApp="sysmgmt"
      homeUrl="/users"
      homeLabel="Kembali ke Manajemen User"
      title="Halaman Tidak Ditemukan"
      message="Rute atau halaman yang Anda cari tidak ditemukan pada portal System Management."
    />
  );
}
