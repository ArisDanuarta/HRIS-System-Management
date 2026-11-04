"use client";

import React, { useState } from "react";
import { PspkLockup, PspkLoader } from "@pspk/ui";
import { WifiOff, RotateCcw, ArrowLeft, AlertCircle, CheckCircle2 } from "lucide-react";

export default function OfflinePage() {
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryStatus, setRetryStatus] = useState<"idle" | "checking" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRetry = async () => {
    if (isRetrying) return;
    setIsRetrying(true);
    setRetryStatus("checking");
    setErrorMessage(null);

    try {
      // Pengecekan aktif ke endpoint health dengan bypass cache
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(`/api/health?t=${Date.now()}`, {
        cache: "no-store",
        signal: controller.signal,
      }).catch((err) => {
        throw err;
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        setRetryStatus("success");
        // Berikan jeda visual singkat agar animasi transisi terasa halus sebelum navigasi
        setTimeout(() => {
          if (typeof window !== "undefined") {
            window.location.href = "/";
          }
        }, 600);
        return;
      }

      setRetryStatus("error");
      setErrorMessage("Server belum siap menerima koneksi. Coba beberapa saat lagi.");
      setIsRetrying(false);
    } catch {
      setRetryStatus("error");
      setErrorMessage(
        "Masih belum dapat terhubung ke server. Periksa kembali koneksi Wi-Fi atau data seluler Anda.",
      );
      setIsRetrying(false);
    }
  };

  const handleGoHome = () => {
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] flex flex-col items-center justify-center p-4 text-[#121c2a] selection:bg-[#f2af3e]/30 relative">
      {/* Loading Overlay Kustom Logo Animasi PSPK saat memeriksa koneksi */}
      {isRetrying && (
        <PspkLoader
          fullScreen={true}
          variant="loop"
          background="rgba(248, 249, 255, 0.92)"
          className="backdrop-blur-sm z-50 animate-in fade-in duration-200"
          label={
            retryStatus === "success"
              ? "Terhubung kembali! Mengalihkan ke beranda..."
              : "Memeriksa koneksi internet dan server PSPK..."
          }
        />
      )}

      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200/90 shadow-xl p-6 sm:p-8 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
        {/* Brand Header */}
        <div className="h-11 px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl shadow-2xs flex items-center justify-center mb-6">
          <PspkLockup variant="horizontal" size={26} animate={false} />
        </div>

        {/* Offline Icon Illustration */}
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-5 shadow-xs">
          <WifiOff className="w-8 h-8" />
        </div>

        {/* Text Details */}
        <h1
          className="text-xl sm:text-2xl font-bold text-[#102e50] tracking-tight mb-2"
          style={{ fontFamily: "var(--font-lora, Lora, Georgia, serif)" }}
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
            disabled={isRetrying}
            className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#102e50] text-white text-xs sm:text-sm font-semibold hover:bg-[#0c233d] transition-all shadow-xs cursor-pointer active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <RotateCcw className={`w-4 h-4 ${isRetrying ? "animate-spin" : ""}`} />
            <span>{isRetrying ? "Memeriksa Koneksi..." : "Coba Muat Ulang"}</span>
          </button>
          <button
            type="button"
            onClick={handleGoHome}
            disabled={isRetrying}
            className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs sm:text-sm font-semibold hover:bg-slate-50 transition-colors cursor-pointer active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Ke Beranda</span>
          </button>
        </div>

        {/* Umpan Balik Status Pengecekan Jaringan */}
        {retryStatus === "error" && errorMessage && (
          <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200/90 text-xs text-amber-800 flex items-start sm:items-center gap-2 w-full text-left sm:text-center animate-in fade-in slide-in-from-top-1 duration-200">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
            <span className="flex-1">{errorMessage}</span>
          </div>
        )}

        {retryStatus === "success" && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-center gap-2 w-full animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Terhubung kembali! Mengalihkan ke beranda...</span>
          </div>
        )}

        {/* Status Hint */}
        <div className="mt-6 pt-4 border-t border-slate-100 w-full text-[11px] text-slate-400">
          Periksa kembali koneksi Wi-Fi atau paket data seluler pada perangkat Anda.
        </div>
      </div>
    </div>
  );
}

