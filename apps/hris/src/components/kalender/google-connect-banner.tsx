"use client";

import { CalendarCheck2 } from "lucide-react";

interface GoogleConnectBannerProps {
  /** Jika true, banner ditampilkan. Jika false, komponen tidak render apapun. */
  show: boolean;
}

/**
 * Banner ajakan connect Google Calendar — versi premium.
 * Fase A: Tombol belum aktif (placeholder).
 * Fase C: Tombol akan diarahkan ke /api/calendar/google/connect.
 */
export function GoogleConnectBanner({ show }: GoogleConnectBannerProps) {
  if (!show) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-blue-200/80 bg-gradient-to-br from-blue-50 via-indigo-50/60 to-white shadow-sm">
      {/* Decorative blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-blue-200/30 blur-2xl" />
        <div className="absolute -bottom-6 -left-6 w-32 h-32 rounded-full bg-indigo-200/20 blur-xl" />
      </div>

      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 p-5 sm:p-6">
        {/* Left content */}
        <div className="flex items-start gap-4">
          {/* Google icon cluster */}
          <div className="relative shrink-0">
            <div className="w-11 h-11 rounded-2xl bg-white shadow-md border border-blue-100 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            </div>
            <div className="absolute -bottom-1 -right-1 w-4.5 h-4.5 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center">
              <CalendarCheck2 className="w-2.5 h-2.5 text-white" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                Integrasi Opsional
              </span>
            </div>
            <p className="text-sm font-semibold text-[#102e50] leading-snug">
              Tampilkan Google Meet &amp; event dari akun @pspk.id
            </p>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              Hubungkan akun Google Workspace untuk melihat jadwal rapat dan agenda Google Meet langsung di kalender ini.
            </p>
          </div>
        </div>

        {/* Right: CTA Button */}
        <a
          href="/api/calendar/google/connect"
          title="Hubungkan akun Google @pspk.id untuk sinkronisasi Google Meet"
          className="shrink-0 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-[#102e50] hover:bg-[#1a4473] text-white text-xs font-semibold shadow-sm transition-all cursor-pointer active:scale-95 group"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          <span>Hubungkan Google Calendar</span>
        </a>
      </div>
    </div>
  );
}
