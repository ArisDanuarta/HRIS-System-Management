"use client";

import React, { useState, useEffect } from "react";
import { Download, X, WifiOff, CheckCircle2 } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function PwaInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [showOnlineAlert, setShowOnlineAlert] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Registrasi Service Worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          // Service worker terdaftar
          if (reg.installing) {
            console.log("[PWA] Service worker sedang dipasang...");
          }
        })
        .catch((err) => {
          console.warn("[PWA] Registrasi service worker gagal:", err);
        });
    }

    // 2. Deteksi Dukungan Instalasi PWA (beforeinstallprompt)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Cek apakah pengguna sebelumnya memilih "Nanti Saja" dalam 7 hari terakhir
      const dismissedUntil = localStorage.getItem("pspk_pwa_install_dismissed_until");
      if (!dismissedUntil || Date.now() > Number(dismissedUntil)) {
        setShowInstallBanner(true);
      }
    };

    const handleAppInstalled = () => {
      setShowInstallBanner(false);
      setDeferredPrompt(null);
      localStorage.removeItem("pspk_pwa_install_dismissed_until");
    };

    // 3. Deteksi Status Konektivitas Internet
    const handleOnline = () => {
      setIsOnline(true);
      setShowOnlineAlert(true);
      const timer = setTimeout(() => setShowOnlineAlert(false), 3000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOnlineAlert(false);
    };

    // Set initial online status
    setIsOnline(navigator.onLine);

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    setShowInstallBanner(false);
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  const handleDismissBanner = () => {
    setShowInstallBanner(false);
    // Sembunyikan banner instalasi selama 7 hari
    const sevenDaysLater = Date.now() + 7 * 24 * 60 * 60 * 1000;
    localStorage.setItem("pspk_pwa_install_dismissed_until", String(sevenDaysLater));
  };

  return (
    <>
      {/* Offline Warning Bar */}
      {!isOnline && (
        <aside
          role="status"
          aria-live="polite"
          className="fixed top-0 left-0 right-0 z-50 bg-[#a8281c] text-white text-[11px] sm:text-xs font-semibold py-1.5 px-4 text-center shadow-md flex items-center justify-center gap-2 animate-in slide-in-from-top duration-200"
        >
          <WifiOff className="w-3.5 h-3.5 shrink-0" />
          <span>Koneksi internet terputus. Beberapa fitur kepegawaian membutuhkan koneksi aktif.</span>
        </aside>
      )}

      {/* Online Restored Bar (Muncul sesaat) */}
      {isOnline && showOnlineAlert && (
        <aside
          role="status"
          aria-live="polite"
          className="fixed top-0 left-0 right-0 z-50 bg-[#1e7e34] text-white text-[11px] sm:text-xs font-semibold py-1.5 px-4 text-center shadow-md flex items-center justify-center gap-2 animate-in slide-in-from-top duration-200"
        >
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span>Terhubung kembali ke internet.</span>
        </aside>
      )}

      {/* In-App Install Prompt Banner */}
      {showInstallBanner && deferredPrompt && (
        <aside
          aria-label="Pemberitahuan Pemasangan Aplikasi"
          className="fixed bottom-18 md:bottom-6 right-4 left-4 sm:left-auto sm:max-w-md z-40 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-2xl p-4 animate-in fade-in slide-in-from-bottom-4 duration-300"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#102e50] text-[#f2af3e] flex items-center justify-center shrink-0 shadow-xs">
              <Download className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs sm:text-sm font-bold text-[#102e50]">
                Pasang Aplikasi HRIS PSPK
              </h4>
              <p className="text-[11px] sm:text-xs text-slate-600 mt-0.5 leading-snug">
                Pasang di layar utama ponsel untuk akses presensi harian dan pengajuan cuti instan.
              </p>
              <div className="flex items-center gap-2 mt-3">
                <button
                  type="button"
                  onClick={handleInstallClick}
                  className="px-3.5 py-1.5 rounded-lg bg-[#102e50] text-white text-xs font-bold hover:bg-[#0c233d] transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  Pasang Sekarang
                </button>
                <button
                  type="button"
                  onClick={handleDismissBanner}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Nanti Saja
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDismissBanner}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Tutup pemberitahuan"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </aside>
      )}
    </>
  );
}
