"use client";

import React from "react";
import {
  Laptop,
  Smartphone,
  Globe,
  Clock,
  ShieldAlert,
  ShieldCheck,
  Calendar,
  Layers,
} from "lucide-react";
import { formatDateTime, formatRelativeTime } from "@pspk/shared";
import type { UserSessionItem } from "@/server/queries/profile.queries";

interface SessionHistoryTabProps {
  sessions: UserSessionItem[];
}

function parseUserAgent(uaString: string | null) {
  if (!uaString) {
    return {
      browser: "Peramban Web",
      os: "Sistem Tidak Dikenal",
      isMobile: false,
    };
  }

  const isMobile = /mobile|iphone|ipad|android/i.test(uaString);

  // OS Detection
  let os = "Perangkat Web";
  if (/macintosh|mac os x/i.test(uaString)) {
    os = "macOS";
  } else if (/windows/i.test(uaString)) {
    os = "Windows";
  } else if (/android/i.test(uaString)) {
    os = "Android";
  } else if (/iphone|ipad|ipod/i.test(uaString)) {
    os = "iOS";
  } else if (/linux/i.test(uaString)) {
    os = "Linux";
  }

  // Browser Detection
  let browser = "Web Browser";
  if (/edg/i.test(uaString)) {
    browser = "Microsoft Edge";
  } else if (/chrome|crios/i.test(uaString) && !/opr|opera/i.test(uaString)) {
    browser = "Google Chrome";
  } else if (/safari/i.test(uaString) && !/chrome|crios/i.test(uaString)) {
    browser = "Apple Safari";
  } else if (/firefox|fxios/i.test(uaString)) {
    browser = "Mozilla Firefox";
  } else if (/opr|opera/i.test(uaString)) {
    browser = "Opera";
  }

  return { browser, os, isMobile };
}

export function SessionHistoryTab({ sessions }: SessionHistoryTabProps) {
  return (
    <div className="space-y-6">
      {/* 1. PENJELASAN KEAMANAN SESI */}
      <div className="p-4.5 rounded-2xl bg-blue-50/70 border border-blue-200 text-blue-950 flex items-start gap-3.5">
        <ShieldCheck className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed space-y-1">
          <p className="font-bold text-sm text-[#102e50]">Pengelolaan Sesi Terpusat PSPK</p>
          <p className="text-blue-900">
            Daftar di bawah mencatat seluruh perangkat atau peramban yang sedang terhubung ke akun Anda.
            Jika Anda mencurigai adanya perangkat yang tidak dikenali, segera ganti kata sandi Anda di tab{" "}
            <span className="font-semibold text-[#102e50]">Keamanan & Kata Sandi</span>. Sistem akan
            secara otomatis memutuskan (*revoke*) semua sesi lain dan hanya menyisakan sesi yang sedang Anda gunakan saat ini.
          </p>
        </div>
      </div>

      {/* 2. DAFTAR SESI AKTIF */}
      <div className="bg-white rounded-2xl border border-[#dee9fc] shadow-xs overflow-hidden">
        <div className="px-6 py-4.5 bg-gradient-to-r from-[#eff4ff]/80 to-white border-b border-[#dee9fc] flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#102e50] text-[#f2af3e] flex items-center justify-center shadow-xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#102e50] font-heading leading-tight">
                Perangkat & Sesi Terkoneksi
              </h3>
              <p className="text-xs text-[#74777f] mt-0.5">
                Total {sessions.length} sesi aktif terdata pada server otentikasi
              </p>
            </div>
          </div>
        </div>

        <div className="divide-y divide-[#dee9fc]/70">
          {sessions.length === 0 ? (
            <div className="p-8 text-center text-sm text-[#74777f]">
              Tidak ada data riwayat sesi aktif yang ditemukan.
            </div>
          ) : (
            sessions.map((session) => {
              const { browser, os, isMobile } = parseUserAgent(session.userAgent);

              return (
                <div
                  key={session.id}
                  className={`p-5 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    session.isCurrent ? "bg-[#f4f8ff]/50" : "hover:bg-slate-50/60"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Device Icon */}
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
                        session.isCurrent
                          ? "bg-[#102e50] text-[#f2af3e] border-[#102e50]"
                          : "bg-slate-100 text-slate-600 border-slate-200"
                      }`}
                    >
                      {isMobile ? (
                        <Smartphone className="w-5 h-5" />
                      ) : os === "macOS" || os === "Windows" || os === "Linux" ? (
                        <Laptop className="w-5 h-5" />
                      ) : (
                        <Globe className="w-5 h-5" />
                      )}
                    </div>

                    {/* Device / Browser Specs */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-[#102e50]">
                          {browser} pada {os}
                        </span>
                        {session.isCurrent ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                            Sesi Perangkat Ini
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            Perangkat Terhubung
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-[#74777f] flex-wrap">
                        <span className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                          IP: {session.ipAddress || "Lokal / Akses Internal"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          Masuk: {formatRelativeTime(session.createdAt)} ({formatDateTime(session.createdAt)})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Expiration Details */}
                  <div className="flex items-center gap-2 md:text-right shrink-0">
                    <div className="text-xs text-[#74777f] space-y-0.5">
                      <span className="block font-medium text-slate-500">Masa Aktif Hingga</span>
                      <span className="font-semibold text-slate-700 flex items-center gap-1 md:justify-end">
                        <Calendar className="w-3 h-3 text-[#102e50]" />
                        {formatDateTime(session.expiresAt)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 3. REKOMENDASI PENGAMANAN AKUN */}
      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 text-xs flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            Ingin mengeluarkan semua perangkat selain perangkat ini sekaligus? Cukup lakukan pergantian kata sandi akun.
          </span>
        </div>
      </div>
    </div>
  );
}
