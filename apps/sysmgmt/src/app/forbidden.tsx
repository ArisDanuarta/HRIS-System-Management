import React from "react";
import { ForbiddenView } from "@pspk/ui";

export default function Forbidden() {
  return (
    <ForbiddenView
      inShell={false}
      currentApp="sysmgmt"
      homeUrl="/users"
      homeLabel="Kembali ke Manajemen User"
      title="Akses Administrator Dibatasi"
      message="Sesi akun Anda tidak memiliki otorisasi untuk mengakses rute atau sumber daya yang diminta pada portal System Management."
      requiredRole="Administrator TI / Super Admin"
    />
  );
}
