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
    // Log client error to console in development
    console.error("HRIS Application Error Boundary caught:", error);
  }, [error]);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <ServerErrorView
        error={error}
        reset={reset}
        inShell={true}
        homeUrl="/dashboard"
        title="Terjadi Kesalahan pada Aplikasi HRIS"
        message="Aplikasi mengalami kendala teknis saat memuat data. Anda dapat mencoba memuat ulang halaman ini atau kembali ke beranda."
      />
    </div>
  );
}
