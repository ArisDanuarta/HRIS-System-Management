import React from "react";
import { Metadata } from "next";
import { NotFoundView } from "@pspk/ui";

export const metadata: Metadata = {
  title: "404 — Halaman Tidak Ditemukan | System Management PSPK",
  description: "Halaman yang Anda tuju tidak ditemukan pada System Management PSPK.",
};

export default function GlobalNotFound() {
  return (
    <NotFoundView
      inShell={false}
      currentApp="sysmgmt"
      homeUrl="/login"
      homeLabel="Ke Halaman Masuk"
      title="Halaman Tidak Ditemukan"
      message="Alamat URL yang Anda tuju tidak ditemukan pada portal System Management PSPK."
    />
  );
}
