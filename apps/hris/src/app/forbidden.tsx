import React from "react";
import { ForbiddenView } from "@pspk/ui";

export default function Forbidden() {
  return (
    <ForbiddenView
      inShell={false}
      currentApp="hris"
      homeUrl="/dashboard"
      homeLabel="Kembali ke Beranda"
      title="Anda Tidak Memiliki Akses ke Halaman Ini"
      message="Sesi akun Anda tidak memiliki otorisasi untuk mengakses rute atau sumber daya yang diminta."
    />
  );
}
