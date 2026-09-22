import React from "react";
import Link from "next/link";
import { Search, ExternalLink, ShieldCheck, Users } from "lucide-react";

export function ItDashboard() {
  return (
    <div className="w-full max-w-3xl mx-auto my-8 flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Banner Link to System Management */}
      <div className="p-6 rounded-2xl bg-[#0c233d] text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm border border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#f2af3e] text-[#102e50] flex items-center justify-center font-bold shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white">
              Portal Utama Administrator IT & Sistem
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Kelola akun pengguna, penugasan role, inventaris aset, dan audit trail di aplikasi System Management.
            </p>
          </div>
        </div>

        <a
          href={process.env.NEXT_PUBLIC_SYSMGMT_URL || "http://localhost:3002"}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#f2af3e] text-[#102e50] text-xs font-bold hover:bg-[#ffddb0] transition-all shrink-0 shadow-xs"
        >
          <span>Ke System Management</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Directory Search Shortcut */}
      <div className="p-6 rounded-2xl bg-white border border-[#dee9fc] shadow-xs flex flex-col gap-4">
        <div className="flex items-center gap-2 text-[#102e50]">
          <Users className="w-5 h-5 text-[#102e50]" />
          <h1 className="text-base font-bold font-heading">
            Pencarian Direktori Karyawan
          </h1>
        </div>
        <p className="text-xs text-slate-500">
          Sebagai Administrator IT, Anda memiliki akses baca ke direktori dasar pegawai untuk keperluan verifikasi akun dan penugasan aset perangkat.
        </p>

        <div className="pt-2">
          <Link
            href="/karyawan"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#102e50] text-white text-xs font-semibold hover:bg-[#0c233d] transition-all shadow-xs"
          >
            <Search className="w-4 h-4" />
            <span>Buka Direktori & Pencarian Pegawai</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
