"use client";

import { CalendarCheck2 } from "lucide-react";

interface GoogleConnectBannerProps {
  /** Jika true, banner ditampilkan. Jika false, komponen tidak render apapun. */
  show: boolean;
}

/**
 * Banner ajakan connect Google Calendar.
 * Fase A: Tombol belum aktif (placeholder).
 * Fase C: Tombol akan diarahkan ke /api/calendar/google/connect.
 */
export function GoogleConnectBanner({ show }: GoogleConnectBannerProps) {
  if (!show) return null;

  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 shadow-xs">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-white shadow-xs border border-blue-200 flex items-center justify-center shrink-0">
          <CalendarCheck2 className="w-4.5 h-4.5 text-blue-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[#102e50]">
            Ingin melihat Google Meet & event dari akun @pspk.id?
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Hubungkan akun Google untuk menampilkan meeting langsung di kalender ini.
          </p>
        </div>
      </div>
      <a
        href="/api/calendar/google/connect"
        title="Hubungkan akun Google @pspk.id untuk sinkronisasi Google Meet"
        className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 text-xs font-semibold shadow-2xs transition-all cursor-pointer active:scale-95"
      >
        {/* Google logo SVG inline */}
        <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Hubungkan Google Calendar
      </a>
    </div>
  );
}
