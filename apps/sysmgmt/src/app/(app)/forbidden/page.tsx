import React from "react";
import { Metadata } from "next";
import { ForbiddenView } from "@pspk/ui";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "403 - Akses Ditolak | System Management PSPK",
  description: "Anda tidak memiliki wewenang administrator untuk modul ini.",
};

interface ForbiddenPageProps {
  searchParams: Promise<{
    required?: string;
    from?: string;
  }>;
}

export default async function ForbiddenPage({ searchParams }: ForbiddenPageProps) {
  const { required, from } = await searchParams;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <ForbiddenView
        inShell={true}
        currentApp="sysmgmt"
        homeUrl="/pengguna"
        homeLabel="Kembali ke Manajemen Pengguna"
        title="Akses Administrator Dibatasi"
        message={
          from
            ? `Anda mencoba membuka modul "${from}" yang memerlukan hak akses khusus administrator.`
            : "Akun Anda saat ini tidak memiliki otorisasi untuk membuka modul konfigurasi atau audit pada System Management."
        }
        requiredRole={required || "Administrator TI / Super Admin"}
      />
    </div>
  );
}
