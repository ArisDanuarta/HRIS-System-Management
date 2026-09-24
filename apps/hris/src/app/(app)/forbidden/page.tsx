import React from "react";
import { Metadata } from "next";
import { ForbiddenView } from "@pspk/ui";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "403 — Akses Dibatasi | Portal HRIS PSPK",
  description: "Anda tidak memiliki izin akses untuk modul ini.",
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
        currentApp="hris"
        homeUrl="/dashboard"
        homeLabel="Kembali ke Beranda"
        title="Anda Tidak Memiliki Akses ke Halaman Ini"
        message={
          from
            ? `Anda mencoba mengakses halaman "${from}" yang memerlukan wewenang khusus.`
            : "Peran atau hak akses akun Anda saat ini tidak memiliki otorisasi untuk melihat atau mengelola modul ini."
        }
        requiredRole={required || "Wewenang Khusus"}
      />
    </div>
  );
}
