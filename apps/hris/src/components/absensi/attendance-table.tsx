"use client";

import React, { useSyncExternalStore } from "react";
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  XCircle,
  Home,
  Building2,
  ShieldAlert,
} from "lucide-react";
import { getTimezoneAbbr, formatTimeInZone } from "@pspk/shared";

interface AttendanceRecord {
  id: string;
  date: Date;
  checkInAt: Date | null;
  checkOutAt: Date | null;
  status: string;
  source: string;
  notes?: string | null;
  correctionReason?: string | null;
}

interface AttendanceTableProps {
  attendances: AttendanceRecord[];
}

export function AttendanceTable({ attendances }: AttendanceTableProps) {
  const tzAbbr = useSyncExternalStore(
    () => () => {},
    () => {
      try {
        return getTimezoneAbbr(Intl.DateTimeFormat().resolvedOptions().timeZone);
      } catch {
        return "WIB";
      }
    },
    () => "WIB",
  );

  const formatDate = (d: Date) => {
    const dateObj = typeof d === "string" ? new Date(d) : d;
    return dateObj.toLocaleDateString("id-ID", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (d: Date | null | undefined) => {
    if (!d) return "--:--";
    const dateObj = typeof d === "string" ? new Date(d) : d;
    return dateObj.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const calculateDurationInfo = (inAt: Date | null, outAt: Date | null) => {
    if (!inAt || !outAt) return { label: "-", hours: 0, pct: 0 };
    const diffMs = new Date(outAt).getTime() - new Date(inAt).getTime();
    if (diffMs <= 0) return { label: "-", hours: 0, pct: 0 };
    const hours = diffMs / 3600000;
    const pct = Math.min(Math.round((hours / 8) * 100), 100);
    return {
      label: `${hours.toFixed(1)} Jam`,
      hours,
      pct,
    };
  };

  // Extract [WFO]/[WFH] mode and clean note text for tidy display
  const parseNotes = (rawNotes?: string | null, status?: string) => {
    if (!rawNotes) {
      return {
        mode: status === "WFH" ? "WFH" : null,
        cleanText: "",
      };
    }

    let mode: "WFO" | "WFH" | null = null;
    if (rawNotes.includes("[WFH]") || status === "WFH") mode = "WFH";
    else if (rawNotes.includes("[WFO]")) mode = "WFO";

    const cleanText = rawNotes
      .replace(/\[(WFO|WFH|WIB|WITA|WIT)\]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    return { mode, cleanText };
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "PRESENT":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Tepat Waktu</span>
          </span>
        );
      case "LATE":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#df632f]/10 text-[#df632f] border border-[#df632f]/25">
            <AlertTriangle className="w-3.5 h-3.5 text-[#df632f]" />
            <span>Terlambat</span>
          </span>
        );
      case "LEAVE":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#f2af3e]/15 text-[#8e2d3f] border border-[#f2af3e]/40">
            <Calendar className="w-3.5 h-3.5 text-[#df632f]" />
            <span>Izin / Cuti</span>
          </span>
        );
      case "ABSENT":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#a8281c]/10 text-[#a8281c] border border-[#a8281c]/25">
            <XCircle className="w-3.5 h-3.5 text-[#a8281c]" />
            <span>Alpa</span>
          </span>
        );
      case "WFH":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#0874aa]/10 text-[#0874aa] border border-[#0874aa]/25">
            <Home className="w-3.5 h-3.5 text-[#0874aa]" />
            <span>WFH (Remote)</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  if (attendances.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center flex flex-col items-center justify-center shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-[#102e50]/5 text-[#102e50] border border-[#102e50]/10 flex items-center justify-center mb-3">
          <Clock className="w-6 h-6 text-[#f2af3e]" />
        </div>
        <p className="text-sm font-bold text-[#102e50] font-heading">
          Belum Ada Catatan Kehadiran pada Periode Ini
        </p>
        <p className="text-xs text-slate-500 mt-1 max-w-sm leading-relaxed">
          Tidak ditemukan riwayat presensi untuk bulan yang dipilih. Gunakan panel Check-In di atas
          saat memulai jam kerja Anda.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50/90 border-b border-slate-200/80 text-[#102e50] uppercase tracking-wider font-bold text-[11px]">
              <th className="py-3.5 px-5">Tanggal</th>
              <th className="py-3.5 px-4">Jam Masuk ({tzAbbr})</th>
              <th className="py-3.5 px-4">Jam Pulang ({tzAbbr})</th>
              <th className="py-3.5 px-4">Durasi Kerja</th>
              <th className="py-3.5 px-4">Status Kehadiran</th>
              <th className="py-3.5 px-5">Mode & Catatan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {attendances.map((a) => {
              const duration = calculateDurationInfo(a.checkInAt, a.checkOutAt);
              const { mode, cleanText } = parseNotes(a.notes, a.status);

              return (
                <tr key={a.id} className="hover:bg-slate-50/70 transition-colors">
                  {/* Date */}
                  <td className="py-3.5 px-5 font-semibold text-[#102e50] whitespace-nowrap">
                    {formatDate(a.date)}
                  </td>

                  {/* Check-In */}
                  <td className="py-3.5 px-4 font-mono whitespace-nowrap">
                    {a.checkInAt ? (
                      <div className="flex flex-col">
                        <span className="font-bold text-[#102e50]">
                          {formatTime(a.checkInAt)}
                          <span className="text-[10px] text-slate-400 font-sans ml-1 font-medium">
                            {tzAbbr}
                          </span>
                        </span>
                        {tzAbbr !== "WIB" && (
                          <span className="text-[10px] text-slate-400 font-sans">
                            {formatTimeInZone(a.checkInAt, "Asia/Jakarta")} WIB
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-300">--:--</span>
                    )}
                  </td>

                  {/* Check-Out */}
                  <td className="py-3.5 px-4 font-mono whitespace-nowrap">
                    {a.checkOutAt ? (
                      <div className="flex flex-col">
                        <span className="font-bold text-[#102e50]">
                          {formatTime(a.checkOutAt)}
                          <span className="text-[10px] text-slate-400 font-sans ml-1 font-medium">
                            {tzAbbr}
                          </span>
                        </span>
                        {tzAbbr !== "WIB" && (
                          <span className="text-[10px] text-slate-400 font-sans">
                            {formatTimeInZone(a.checkOutAt, "Asia/Jakarta")} WIB
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-300">--:--</span>
                    )}
                  </td>

                  {/* Work Duration with subtle progress bar */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {duration.hours > 0 ? (
                      <div className="flex flex-col gap-1 w-24">
                        <span className="font-semibold text-[#102e50]">{duration.label}</span>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#0874aa] rounded-full"
                            style={{ width: `${duration.pct}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>

                  {/* Status Badge */}
                  <td className="py-3.5 px-4 whitespace-nowrap">{renderStatusBadge(a.status)}</td>

                  {/* Source / Mode / Notes */}
                  <td className="py-3.5 px-5 max-w-xs">
                    <div className="flex items-center gap-2 flex-wrap">
                      {mode && (
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border shrink-0 ${
                            mode === "WFH"
                              ? "bg-[#0874aa]/10 text-[#0874aa] border-[#0874aa]/20"
                              : "bg-[#102e50]/5 text-[#102e50] border-[#102e50]/15"
                          }`}
                        >
                          {mode === "WFH" ? (
                            <Home className="w-3 h-3" />
                          ) : (
                            <Building2 className="w-3 h-3" />
                          )}
                          {mode}
                        </span>
                      )}

                      {a.source === "MANUAL_HR" ? (
                        <span
                          className="inline-flex items-center gap-1 text-[#8e2d3f] font-semibold truncate"
                          title={a.correctionReason || "Koreksi Manual HR"}
                        >
                          <ShieldAlert className="w-3.5 h-3.5 text-[#df632f] shrink-0" />
                          <span className="truncate">
                            Koreksi HR: {a.correctionReason || " disesuaikan"}
                          </span>
                        </span>
                      ) : (
                        <span className="text-slate-600 truncate" title={cleanText || "Presensi Web"}>
                          {cleanText || "Presensi Web"}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}