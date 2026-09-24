"use client";

import React, { useEffect } from "react";
import { ServerErrorView } from "@pspk/ui";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("System Management Error Boundary caught:", error);
  }, [error]);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <ServerErrorView
        error={error}
        reset={reset}
        inShell={true}
        homeUrl="/users"
        title="Terjadi Kesalahan pada System Management"
        message="Aplikasi mengalami kendala teknis saat memuat konfigurasi sistem. Silakan coba muat ulang halaman ini atau kembali ke menu pengguna."
      />
    </div>
  );
}
