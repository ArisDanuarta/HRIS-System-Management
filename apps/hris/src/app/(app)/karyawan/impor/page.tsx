import React from "react";
import Link from "next/link";
import { ArrowLeft, FileSpreadsheet } from "lucide-react";
import { ExcelImporter } from "@/components/karyawan/excel-importer";

export const dynamic = "force-dynamic";

export default function ImporKaryawanPage() {
  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-16">
      {/* Back Link */}
      <Link
        href="/karyawan"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#102E50] transition-colors w-fit"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Kembali ke Direktori Pegawai</span>
      </Link>

      {/* Page Title */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#102E50]/10 text-[#102E50] flex items-center justify-center shrink-0">
          <FileSpreadsheet className="w-5 h-5" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold text-[#102E50] font-heading tracking-tight">
            Impor Massal Data Pegawai
          </h1>
          <span className="text-xs text-slate-500">
            Unggah berkas spreadsheet (.csv) untuk mendaftarkan banyak pegawai secara otomatis ke dalam database.
          </span>
        </div>
      </div>

      {/* Importer Component */}
      <ExcelImporter />
    </div>
  );
}
