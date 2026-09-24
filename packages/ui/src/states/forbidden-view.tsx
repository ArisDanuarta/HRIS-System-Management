"use client";

import React from "react";
import { ShieldAlert, Home, ArrowLeft, Lock, HelpCircle } from "lucide-react";

export interface ForbiddenViewProps {
  title?: string;
  message?: string;
  requiredRole?: string;
  currentUserRole?: string;
  homeUrl?: string;
  homeLabel?: string;
  inShell?: boolean;
  currentApp?: "hris" | "sysmgmt";
}

export function ForbiddenView({
  title = "Anda Tidak Memiliki Akses ke Halaman Ini",
  message = "Peran atau hak akses akun Anda saat ini tidak memiliki otorisasi untuk melihat atau mengelola modul ini.",
  requiredRole,
  currentUserRole,
  homeUrl = "/",
  homeLabel = "Kembali ke Beranda",
  inShell = true,
  currentApp = "hris",
}: ForbiddenViewProps) {
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
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-rose-50/50 to-amber-50/30 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        {/* Icon & Status Badge */}
        <div className="relative z-10 flex flex-col items-center space-y-3">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-rose-50 flex items-center justify-center text-[#A8281C] border border-rose-200/90 shadow-2xs">
              <ShieldAlert className="w-10 h-10 stroke-[1.5]" />
            </div>
            <span className="absolute -bottom-2 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#A8281C]/10 text-[#A8281C] border border-[#A8281C]/25 shadow-2xs">
              403
            </span>
          </div>

          <div className="pt-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700/80">
              {portalName} • Akses Dibatasi
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

        {/* Role information box if available */}
        {(requiredRole || currentUserRole) && (
          <div className="relative z-10 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs text-left space-y-1.5">
            {currentUserRole && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Peran Akun Anda:</span>
                <span className="font-semibold text-slate-800 px-2 py-0.5 rounded-md bg-white border border-slate-200">
                  {currentUserRole}
                </span>
              </div>
            )}
            {requiredRole && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Kebutuhan Otorisasi:</span>
                <span className="font-semibold text-rose-700 px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200">
                  {requiredRole}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="relative z-10 pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-2xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali Sebelumnya</span>
          </button>

          <a
            href={homeUrl}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-[#102E50] hover:bg-[#1a4473] transition-colors shadow-xs"
          >
            <Home className="w-4 h-4" />
            <span>{homeLabel}</span>
          </a>
        </div>

        {/* Contact Admin Hint */}
        <div className="relative z-10 pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-400">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Hubungi Administrator TI / HR jika Anda memerlukan akses wewenang ini.</span>
        </div>
      </div>
    </div>
  );
}
