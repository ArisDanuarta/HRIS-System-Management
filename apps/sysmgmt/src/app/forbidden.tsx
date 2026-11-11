import React from "react";
import { ForbiddenView } from "@pspk/ui";

export default function Forbidden() {
  return (
    <ForbiddenView
      inShell={false}
      currentApp="sysmgmt"
      homeUrl="/dashboard"
      homeLabel="Kembali ke Dashboard Administrator"
      title="Akses Administrator Dibatasi"
      message="Sesi akun Anda tidak memiliki otorisasi untuk mengakses rute atau sumber daya yang diminta pada portal System Management."
      requiredRole="Administrator TI / Super Admin"
    />
  );
}
