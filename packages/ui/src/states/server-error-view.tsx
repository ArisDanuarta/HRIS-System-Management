"use client";

import React from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export interface ServerErrorViewProps {
  error?: Error & { digest?: string };
  reset?: () => void;
  title?: string;
  message?: string;
  homeUrl?: string;
  inShell?: boolean;
}

export function ServerErrorView({
  error,
  reset,
  title = "Terjadi Kesalahan pada Sistem",
  message = "Sistem mengalami kendala saat memproses permintaan Anda. Silakan coba muat ulang atau kembali ke beranda.",
  homeUrl = "/",
  inShell = true,
}: ServerErrorViewProps) {
  return (
    <div
      className={`flex items-center justify-center p-6 ${
        inShell ? "min-h-[calc(100vh-140px)]" : "min-h-screen bg-slate-50"
      }`}
    >
      <div className="max-w-lg w-full text-center space-y-6 bg-white p-8 sm:p-12 rounded-3xl border border-slate-200/80 shadow-xs relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-amber-50/50 to-rose-50/30 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        {/* Icon & Status Badge */}
        <div className="relative z-10 flex flex-col items-center space-y-3">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-700 border border-amber-200/90 shadow-2xs">
              <AlertTriangle className="w-10 h-10 stroke-[1.5]" />
            </div>
            <span className="absolute -bottom-2 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-500/15 text-amber-800 border border-amber-500/30 shadow-2xs">
              500
            </span>
          </div>

          <div className="pt-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800/80">
              Pemberitahuan Sistem
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

          {error?.digest && (
            <p className="text-[11px] font-mono text-slate-400 pt-1">
              Kode Referensi Masalah: {error.digest}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="relative z-10 pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          {reset && (
            <button
              type="button"
              onClick={() => reset()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-[#102E50] hover:bg-[#1a4473] transition-colors shadow-xs cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Coba Muat Ulang</span>
            </button>
          )}

          <a
            href={homeUrl}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-2xs"
          >
            <Home className="w-4 h-4" />
            <span>Kembali ke Beranda</span>
          </a>
        </div>
      </div>
    </div>
  );
}
