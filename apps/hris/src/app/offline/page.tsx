"use client";

import React from "react";
import Image from "next/image";
import { WifiOff, RotateCcw, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function OfflinePage() {
  const handleRetry = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] flex flex-col items-center justify-center p-4 text-[#121c2a] selection:bg-[#f2af3e]/30">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200/90 shadow-xl p-6 sm:p-8 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
        {/* Brand Header */}
        <div className="h-10 px-3 py-1 bg-white border border-slate-200 rounded-xl shadow-2xs flex items-center justify-center mb-6">
          <Image
            src="/images/logo_pspk_horizontal.png"
            alt="Logo PSPK"
            width={485}
            height={80}
            className="h-6 w-auto object-contain"
            style={{ width: "auto" }}
            priority
          />
        </div>

        {/* Offline Icon Illustration */}
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-5 shadow-xs">
          <WifiOff className="w-8 h-8" />
        </div>

        {/* Text Details */}
        <h1
          className="text-xl sm:text-2xl font-bold text-[#102e50] tracking-tight mb-2"
          style={{ fontFamily: 'var(--font-lora, Lora, Georgia, serif)' }}
        >
          Koneksi Internet Terputus
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mb-6 leading-relaxed">
          HRIS PSPK saat ini tidak dapat terhubung ke server. Fitur presensi harian dan pengajuan cuti membutuhkan koneksi internet aktif demi keakuratan data lembaga.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full">
          <button
            type="button"
            onClick={handleRetry}
            className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#102e50] text-white text-xs sm:text-sm font-semibold hover:bg-[#0c233d] transition-colors shadow-xs cursor-pointer active:scale-[0.99]"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Coba Muat Ulang</span>
          </button>
          <Link
            href="/"
            className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs sm:text-sm font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Ke Beranda</span>
          </Link>
        </div>

        {/* Status Hint */}
        <div className="mt-6 pt-4 border-t border-slate-100 w-full text-[11px] text-slate-400">
          Periksa kembali koneksi Wi-Fi atau paket data seluler pada perangkat Anda.
        </div>
      </div>
    </div>
  );
}

