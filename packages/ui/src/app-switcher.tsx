"use client";

import React, { useState, useRef, useEffect } from "react";
import { ArrowLeftRight, Check, ExternalLink, Lock, ShieldCheck } from "lucide-react";

export interface AppSwitcherProps {
  currentApp?: "hris" | "sysmgmt";
  hrisUrl?: string;
  sysmgmtUrl?: string;
  canAccessSysmgmt?: boolean;
  canAccessHris?: boolean;
  userRoleName?: string;
}

export function AppSwitcher({
  currentApp = "hris",
  hrisUrl = "http://localhost:3001",
  sysmgmtUrl = "http://localhost:3002",
  canAccessSysmgmt = true,
  canAccessHris = true,
  userRoleName,
}: AppSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isHris = currentApp === "hris";

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Pindah Aplikasi PSPK"
        className="flex items-center gap-2 bg-[#eff4ff] hover:bg-[#e4edff] px-2.5 sm:px-3 py-1.5 rounded-xl border border-[#dee9fc] transition-all cursor-pointer text-left shadow-2xs group focus:outline-none focus:ring-2 focus:ring-[#102e50]/20"
        title="Beralih Portal Sistem PSPK"
      >
        <div className="p-1 rounded-lg bg-[#102e50] text-white shadow-2xs group-hover:scale-105 transition-transform">
          <ArrowLeftRight className="w-3.5 h-3.5" />
        </div>

        <div className="flex items-center gap-1.5">
          <span className="font-bold text-xs text-[#102e50]">
            {isHris ? "Portal HRIS" : "System Management"}
          </span>
          <span className="bg-[#ffddb0] text-[#805600] text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider hidden sm:inline-block">
            Aktif
          </span>
        </div>

        <svg
          className={`w-3.5 h-3.5 text-[#5b6675] transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl bg-white shadow-2xl border border-slate-200/90 p-2 z-50 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
          {/* Header */}
          <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Portal Ekosistem PSPK
            </span>
            {userRoleName && (
              <span className="text-[10px] font-semibold text-slate-400">
                {userRoleName}
              </span>
            )}
          </div>

          <div className="py-2 space-y-1.5">
            {/* 1. Portal HRIS */}
            {isHris ? (
              <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200/60 flex items-start gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#f2af3e] mt-1 shrink-0 ring-2 ring-amber-100" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#102e50]">Portal HRIS</span>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.2 rounded">
                      Sedang Aktif
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    Data Pegawai, Presensi, Cuti, Penggajian & Kinerja
                  </p>
                </div>
              </div>
            ) : canAccessHris ? (
              <a
                href={hrisUrl}
                onClick={() => setIsOpen(false)}
                className="p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200/80 transition-all flex items-start gap-2.5 group cursor-pointer"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-[#f2af3e] mt-1 shrink-0 group-hover:ring-2 group-hover:ring-amber-200" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-800 group-hover:text-[#102e50]">
                      Portal HRIS
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#102e50] transition-colors" />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    Beralih ke pengelolaan SDM & Kepegawaian
                  </p>
                </div>
              </a>
            ) : null}

            {/* 2. System Management */}
            {!isHris ? (
              <div className="p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-200/60 flex items-start gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 mt-1 shrink-0 ring-2 ring-blue-100" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#102e50]">System Management</span>
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-1.5 py-0.2 rounded">
                      Sedang Aktif
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    Hak Akses RBAC, Aset TI, Dokumen & Log Audit
                  </p>
                </div>
              </div>
            ) : canAccessSysmgmt ? (
              <a
                href={sysmgmtUrl}
                onClick={() => setIsOpen(false)}
                className="p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200/80 transition-all flex items-start gap-2.5 group cursor-pointer"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 mt-1 shrink-0 group-hover:ring-2 group-hover:ring-blue-200" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-800 group-hover:text-[#102e50]">
                      System Management
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#102e50] transition-colors" />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    Beralih ke kontrol hak akses, aset TI & audit sistem
                  </p>
                </div>
              </a>
            ) : (
              /* User cannot access Sysmgmt: Display disabled with lock */
              <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/60 flex items-start gap-2.5 opacity-80 cursor-not-allowed">
                <div className="mt-0.5 p-1 rounded-md bg-slate-200 text-slate-500 shrink-0">
                  <Lock className="w-3 h-3" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-600">
                      System Management
                    </span>
                    <span className="text-[9px] font-bold text-amber-900 bg-amber-100/90 border border-amber-200 px-1.5 py-0.2 rounded">
                      Khusus Admin TI
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                    Dibutuhkan wewenang peran Administrator TI / Super Admin
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer note */}
          <div className="mt-1 pt-2 border-t border-slate-100 px-3 py-1 flex items-center gap-1.5 text-[10px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Satu akun untuk seluruh ekosistem digital PSPK.</span>
          </div>
        </div>
      )}
    </div>
  );
}
