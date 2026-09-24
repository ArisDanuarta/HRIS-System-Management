"use client";

import React from "react";
import { Compass, Home, ArrowLeft, Search } from "lucide-react";

export interface NotFoundViewProps {
  title?: string;
  message?: string;
  homeUrl?: string;
  homeLabel?: string;
  inShell?: boolean;
  currentApp?: "hris" | "sysmgmt";
}

export function NotFoundView({
  title = "Halaman Tidak Ditemukan",
  message = "Tautan yang Anda tuju mungkin sudah dipindahkan, dihapus, atau belum tersedia pada sistem.",
  homeUrl = "/",
  homeLabel = "Kembali ke Beranda",
  inShell = true,
  currentApp = "hris",
}: NotFoundViewProps) {
  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = homeUrl;
    }
  };

  const portalName = currentApp === "hris" ? "Portal HRIS" : "System Management";

  return (
    <div
      className={`flex items-center justify-center p-6 ${
        inShell ? "min-h-[calc(100vh-140px)]" : "min-h-screen bg-slate-50"
      }`}
    >
      <div className="max-w-lg w-full text-center space-y-6 bg-white p-8 sm:p-12 rounded-3xl border border-slate-200/80 shadow-xs relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-amber-50/50 to-blue-50/30 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        {/* Icon & Status Badge */}
        <div className="relative z-10 flex flex-col items-center space-y-3">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center text-[#102E50] border border-slate-200/90 shadow-2xs">
              <Compass className="w-10 h-10 stroke-[1.5]" />
            </div>
            <span className="absolute -bottom-2 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#F2AF3E]/20 text-[#805600] border border-[#F2AF3E]/40 shadow-2xs">
              404
            </span>
          </div>

          <div className="pt-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {portalName} • Navigasi
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-[#102E50] tracking-tight">
            {title}
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
            {message}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="relative z-10 pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-2xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Halaman Sebelumnya</span>
          </button>

          <a
            href={homeUrl}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-[#102E50] hover:bg-[#1a4473] transition-colors shadow-xs"
          >
            <Home className="w-4 h-4" />
            <span>{homeLabel}</span>
          </a>
        </div>

        {/* Helpful hint */}
        <div className="relative z-10 pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-400">
          <Search className="w-3.5 h-3.5" />
          <span>Pastikan penulisan alamat URL atau gunakan menu navigasi utama.</span>
        </div>
      </div>
    </div>
  );
}
