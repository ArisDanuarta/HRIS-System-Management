"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  CalendarRange,
  X,
  Users,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Video,
  ExternalLink,
  Unlink,
  Clock,
  Flag,
} from "lucide-react";
import { toDateString } from "@pspk/shared";
import type {
  WorkCalendarLeave,
  WorkCalendarHoliday,
  WorkCalendarMeeting,
  WorkCalendarObservance,
} from "@/server/queries/calendar.queries";
import {
  syncHolidaysAction,
  syncMyGoogleCalendarAction,
  disconnectGoogleCalendarAction,
} from "@/server/actions/calendar.actions";

// ----------- Tipe Filter -----------
type CalendarFilter = "all" | "leave" | "holiday" | "observance" | "meeting";

// ----------- Props -----------
interface WorkCalendarViewProps {
  year: number;
  month: number;
  leaves: WorkCalendarLeave[];
  holidays: WorkCalendarHoliday[];
  observances?: WorkCalendarObservance[];
  meetings?: WorkCalendarMeeting[];
  googleConnected?: boolean;
  connectedGoogleEmail?: string;
  canSyncHolidays?: boolean;
  initialConnectedNotice?: boolean;
  initialErrorNotice?: string;
}

// ----------- Komponen Utama -----------
export function WorkCalendarView({
  year,
  month,
  leaves,
  holidays,
  observances = [],
  meetings = [],
  googleConnected = false,
  connectedGoogleEmail,
  canSyncHolidays = false,
  initialConnectedNotice = false,
  initialErrorNotice,
}: WorkCalendarViewProps) {
  const router = useRouter();
  const [currentYear, setCurrentYear] = useState(year);
  const [currentMonth, setCurrentMonth] = useState(month);
  const [activeFilter, setActiveFilter] = useState<CalendarFilter>("all");
  const [selectedDayData, setSelectedDayData] = useState<{
    day: number;
    dateStr: string;
    leaves: WorkCalendarLeave[];
    holiday: WorkCalendarHoliday | null;
    observances: WorkCalendarObservance[];
    meetings: WorkCalendarMeeting[];
  } | null>(null);
  const [selectedLeaveDetail, setSelectedLeaveDetail] = useState<WorkCalendarLeave | null>(null);
  const [selectedMeetingDetail, setSelectedMeetingDetail] = useState<WorkCalendarMeeting | null>(null);
  const [selectedObservanceDetail, setSelectedObservanceDetail] = useState<WorkCalendarObservance | null>(null);
  const [isSyncingHolidays, setIsSyncingHolidays] = useState(false);
  const [isSyncingGoogle, setIsSyncingGoogle] = useState(false);
  const [isDisconnectingGoogle, setIsDisconnectingGoogle] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(() => {
    if (initialConnectedNotice) {
      return {
        type: "success",
        message: "Akun Google Calendar berhasil terhubung! Agenda rapat Anda telah disinkronkan.",
      };
    }
    if (initialErrorNotice) {
      const errorMsg =
        initialErrorNotice === "oauth_not_configured"
          ? "Google OAuth belum dikonfigurasi di server. Hubungi IT Administrator."
          : `Gagal menghubungkan Google: ${initialErrorNotice}`;
      return {
        type: "error",
        message: errorMsg,
      };
    }
    return null;
  });

  const MONTHS = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth() + 1;
  const todayDay = today.getDate();
  const isCurrentMonthActive = currentYear === todayYear && currentMonth === todayMonth;

  // --- Navigasi bulan ---
  const handlePrevMonth = () => {
    let m = currentMonth - 1;
    let y = currentYear;
    if (m < 1) {
      m = 12;
      y--;
    }
    setCurrentMonth(m);
    setCurrentYear(y);
    router.push(`/kalender?year=${y}&month=${m}`);
  };

  const handleNextMonth = () => {
    let m = currentMonth + 1;
    let y = currentYear;
    if (m > 12) {
      m = 1;
      y++;
    }
    setCurrentMonth(m);
    setCurrentYear(y);
    router.push(`/kalender?year=${y}&month=${m}`);
  };

  const handleToday = () => {
    setCurrentMonth(todayMonth);
    setCurrentYear(todayYear);
    router.push(`/kalender?year=${todayYear}&month=${todayMonth}`);
  };

  // --- Sync Libur Nasional (Google Calendar) ---
  const handleSyncHolidays = async () => {
    try {
      setIsSyncingHolidays(true);
      setSyncFeedback(null);
      const res = await syncHolidaysAction(currentYear);
      if (res.success) {
        setSyncFeedback({
          type: "success",
          message: res.message,
        });
        router.refresh();
      } else {
        setSyncFeedback({
          type: "error",
          message: res.message,
        });
      }
    } catch (err: unknown) {
      setSyncFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Gagal menyinkronkan hari libur nasional.",
      });
    } finally {
      setIsSyncingHolidays(false);
    }
  };

  // --- Sync Google Calendar Pribadi ---
  const handleSyncMyGoogleCalendar = async () => {
    try {
      setIsSyncingGoogle(true);
      setSyncFeedback(null);
      const res = await syncMyGoogleCalendarAction();
      if (res.success) {
        setSyncFeedback({
          type: "success",
          message: res.message,
        });
        router.refresh();
      } else {
        setSyncFeedback({
          type: "error",
          message: res.message,
        });
      }
    } catch (err: unknown) {
      setSyncFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Gagal menyinkronkan agenda Google Calendar.",
      });
    } finally {
      setIsSyncingGoogle(false);
    }
  };

  // --- Putuskan Koneksi Google Calendar ---
  const handleDisconnectGoogle = async () => {
    if (!window.confirm("Apakah Anda yakin ingin memutuskan sambungan akun Google Calendar? Agenda rapat dari Google akan dihapus dari kalender HRIS.")) {
      return;
    }
    try {
      setIsDisconnectingGoogle(true);
      setSyncFeedback(null);
      const res = await disconnectGoogleCalendarAction();
      if (res.success) {
        setSyncFeedback({
          type: "success",
          message: res.message,
        });
        router.refresh();
      }
    } catch (err: unknown) {
      setSyncFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Gagal memutuskan sambungan Google Calendar.",
      });
    } finally {
      setIsDisconnectingGoogle(false);
    }
  };

  // --- Build grid ---
  const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const daysArray: (number | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) daysArray.push(null);
  for (let d = 1; d <= daysInMonth; d++) daysArray.push(d);

  // --- Pre-build map ---
  const holidayMap = new Map<string, WorkCalendarHoliday>();
  for (const h of holidays) holidayMap.set(toDateString(h.date), h);

  const observanceMap = new Map<string, WorkCalendarObservance[]>();
  for (const obs of observances) {
    const list = observanceMap.get(obs.dateStr) || [];
    list.push(obs);
    observanceMap.set(obs.dateStr, list);
  }

  const getLeavesForDate = (dateStr: string): WorkCalendarLeave[] => {
    const target = new Date(dateStr).getTime();
    return leaves.filter((l) => {
      const s = new Date(toDateString(l.startDate)).getTime();
      const e = new Date(toDateString(l.endDate)).getTime();
      return target >= s && target <= e;
    });
  };

  const getMeetingsForDate = (dateStr: string): WorkCalendarMeeting[] => {
    const target = new Date(dateStr).getTime();
    return meetings.filter((m) => {
      const s = new Date(toDateString(m.startAt)).getTime();
      const e = new Date(toDateString(m.endAt)).getTime();
      return target >= s && target <= e;
    });
  };

  // --- Filter ---
  const filterItems = [
    { id: "all" as CalendarFilter, label: "Semua Event" },
    { id: "leave" as CalendarFilter, label: "Cuti Tim" },
    { id: "holiday" as CalendarFilter, label: "Hari Libur" },
    { id: "observance" as CalendarFilter, label: `Peringatan (${observances.length})` },
    ...(googleConnected
      ? [{ id: "meeting" as CalendarFilter, label: `Meeting Saya (${meetings.length})` }]
      : []),
  ];

  // --- Nama pendek ---
  const formatShortName = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0]!;
    if (parts[0]!.length <= 2 && parts[1]) return `${parts[0]} ${parts[1]}`;
    return parts[0]!;
  };

  // --- Format jam ---
  const formatMeetingTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jakarta",
    });
  };

  // --- Chip style per tipe cuti ---
  const getLeavePillConfig = (typeName: string) => {
    const lower = typeName.toLowerCase();
    if (lower.includes("sakit"))
      return { bg: "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100", dot: "bg-rose-500", label: "Sakit" };
    if (lower.includes("tahunan"))
      return { bg: "bg-[#eff4ff] text-[#102e50] border-[#dee9fc] hover:bg-blue-100", dot: "bg-blue-600", label: "Tahunan" };
    if (lower.includes("melahirkan"))
      return { bg: "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100", dot: "bg-purple-600", label: "Melahirkan" };
    return { bg: "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100", dot: "bg-amber-600", label: "Penting" };
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-[#dee9fc] shadow-xs overflow-hidden flex flex-col">
        {/* === Header Kalender === */}
        <div className="p-5 md:p-6 border-b border-[#dee9fc] bg-gradient-to-r from-[#eff4ff]/60 to-white flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white shadow-xs border border-[#dee9fc] text-[#102e50] flex items-center justify-center shrink-0">
              <CalendarRange className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#102e50] font-heading leading-tight">
                {MONTHS[currentMonth - 1]} {currentYear}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-xs text-[#5b6675]">
                  Cuti tim, hari libur nasional
                  {googleConnected ? " & meeting Google Meet" : " · meeting Google (opsional)"}
                </p>
                {googleConnected && connectedGoogleEmail && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                    {connectedGoogleEmail}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Kontrol navigasi bulan & sinkronisasi Google */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {googleConnected && (
              <>
                <button
                  type="button"
                  onClick={handleSyncMyGoogleCalendar}
                  disabled={isSyncingGoogle}
                  className="px-2.5 py-1.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100 text-xs font-semibold transition-all cursor-pointer disabled:opacity-60 flex items-center gap-1.5"
                  title="Sinkronkan agenda meeting Google Meet terbaru"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingGoogle ? "animate-spin text-blue-600" : ""}`} />
                  <span className="hidden md:inline">Sync Meeting</span>
                </button>
                <button
                  type="button"
                  onClick={handleDisconnectGoogle}
                  disabled={isDisconnectingGoogle}
                  className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-red-700 hover:bg-red-50 hover:border-red-200 text-xs transition-colors cursor-pointer"
                  title="Putuskan sambungan Google Calendar"
                >
                  <Unlink className="w-4 h-4" />
                </button>
                <div className="h-5 w-px bg-slate-200 mx-0.5" />
              </>
            )}

            <button
              type="button"
              onClick={handleToday}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                isCurrentMonthActive
                  ? "bg-[#102e50] text-[#f2af3e] border-[#102e50] shadow-xs"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              Hari Ini
            </button>
            <div className="h-5 w-px bg-slate-200 mx-0.5" />
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              title="Bulan sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold px-3 py-1.5 bg-white border border-[#dee9fc] rounded-lg text-[#102e50] min-w-[80px] text-center">
              {MONTHS[currentMonth - 1]}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              title="Bulan berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* === Filter Bar === */}
        <div className="px-5 md:px-6 py-3 border-b border-slate-100 flex items-center gap-2 flex-wrap">
          {filterItems.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setActiveFilter(f.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer active:scale-95 ${
                activeFilter === f.id
                  ? "bg-[#102e50] text-white border-[#102e50] shadow-xs"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-800"
              }`}
            >
              {f.label}
            </button>
          ))}

          {canSyncHolidays && (
            <button
              type="button"
              onClick={handleSyncHolidays}
              disabled={isSyncingHolidays}
              className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs font-semibold shadow-2xs transition-all cursor-pointer disabled:opacity-60 active:scale-95"
              title={`Sinkronkan libur nasional ${currentYear} dari Google Calendar`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingHolidays ? "animate-spin text-emerald-700" : "text-emerald-700"}`} />
              {isSyncingHolidays ? "Menyinkronkan..." : "Sync Libur Nasional"}
            </button>
          )}

          {!canSyncHolidays && (
            <span className="ml-auto text-[11px] text-slate-400 italic hidden sm:block">
              Klik tanggal untuk detail
            </span>
          )}
        </div>

        {/* Feedback Alert */}
        {syncFeedback && (
          <div
            className={`px-5 py-2.5 border-b text-xs flex items-center justify-between transition-all ${
              syncFeedback.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-red-50 text-red-800 border-red-200"
            }`}
          >
            <div className="flex items-center gap-2">
              {syncFeedback.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>{syncFeedback.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setSyncFeedback(null)}
              className="p-1 hover:bg-black/5 rounded cursor-pointer text-slate-500 hover:text-slate-800"
              title="Tutup pesan"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* === Grid Kalender === */}
        <div className="p-4 md:p-6">
          {/* Header hari */}
          <div className="grid grid-cols-7 gap-1.5 mb-2 text-center text-[11px] font-bold uppercase tracking-wider text-[#5b6675]">
            <span className="text-[#a8281c]">Min</span>
            <span>Sen</span>
            <span>Sel</span>
            <span>Rab</span>
            <span>Kam</span>
            <span>Jum</span>
            <span className="text-[#a8281c]">Sab</span>
          </div>

          {/* Grid hari */}
          <div className="grid grid-cols-7 gap-1.5">
            {daysArray.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} className="h-28 md:h-32 rounded-xl bg-slate-50/40" />;
              }

              const dateStr = `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const holiday = holidayMap.get(dateStr);
              const dayObservances = observanceMap.get(dateStr) || [];
              const dayLeaves = getLeavesForDate(dateStr);
              const dayMeetings = getMeetingsForDate(dateStr);
              const isWeekend = idx % 7 === 0 || idx % 7 === 6;
              const isToday = currentYear === todayYear && currentMonth === todayMonth && day === todayDay;

              // Terapkan filter aktif
              const showHoliday = (activeFilter === "all" || activeFilter === "holiday") && !!holiday;
              const showObservances = (activeFilter === "all" || activeFilter === "observance") ? dayObservances : [];
              const filteredLeaves = activeFilter === "all" || activeFilter === "leave" ? dayLeaves : [];
              const filteredMeetings = activeFilter === "all" || activeFilter === "meeting" ? dayMeetings : [];

              const hasContent =
                showHoliday ||
                dayObservances.length > 0 ||
                filteredLeaves.length > 0 ||
                filteredMeetings.length > 0;

              return (
                <div
                  key={`day-${day}`}
                  onClick={() => {
                    if (hasContent) {
                      setSelectedDayData({
                        day,
                        dateStr,
                        leaves: dayLeaves,
                        holiday: holiday ?? null,
                        observances: dayObservances,
                        meetings: dayMeetings,
                      });
                    }
                  }}
                  className={`h-28 md:h-32 p-1.5 md:p-2 rounded-xl border flex flex-col transition-all overflow-hidden relative ${
                    hasContent ? "cursor-pointer" : ""
                  } ${
                    isToday
                      ? "border-2 border-[#102e50] bg-gradient-to-b from-[#eff4ff]/70 to-white shadow-sm ring-2 ring-[#102e50]/10"
                      : holiday
                      ? "bg-red-50/70 border-red-200 hover:border-red-300"
                      : dayObservances.length > 0
                      ? "bg-amber-50/30 border-amber-200/90 hover:border-amber-400/80"
                      : isWeekend
                      ? "bg-slate-50/70 border-slate-200"
                      : "bg-white border-slate-200 hover:border-[#102e50]/40"
                  }`}
                >
                  {/* Day number & status tags */}
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <div className="flex items-center gap-1">
                      <span
                        className={`text-xs font-bold ${
                          isToday
                            ? "w-6 h-6 rounded-full bg-[#102e50] text-[#f2af3e] flex items-center justify-center text-xs shadow-xs"
                            : isWeekend || holiday
                            ? "text-[#a8281c]"
                            : "text-slate-800"
                        }`}
                      >
                        {day}
                      </span>
                      {isToday && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#102e50] text-[#f2af3e] tracking-tight shadow-2xs">
                          Hari Ini
                        </span>
                      )}
                      {dayObservances.length > 0 && !holiday && (
                        <span
                          className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"
                          title={`Hari Peringatan: ${dayObservances.map((o) => o.name).join(", ")}`}
                        />
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {showHoliday && (
                        <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-red-100 text-[#a8281c] truncate max-w-[60px] md:max-w-[75px]">
                          {holiday!.isCollectiveLeave ? "Cuti Bers." : "Libur"}
                        </span>
                      )}
                      {showObservances.length > 0 && !holiday && (
                        <span className="text-[8px] md:text-[9px] font-bold px-1 py-0.5 rounded bg-amber-100/90 text-amber-900 border border-amber-300/80 truncate flex items-center gap-0.5">
                          <Flag className="w-2 h-2 text-amber-700 shrink-0" />
                          <span className="hidden sm:inline">Peringatan</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Nama hari libur */}
                  {showHoliday && (
                    <p className="text-[10px] text-red-900 font-semibold line-clamp-1 leading-tight mb-1">
                      {holiday!.name}
                    </p>
                  )}

                  {/* Chip Hari Peringatan Nasional */}
                  {showObservances.length > 0 && (
                    <div className="mb-0.5">
                      {showObservances.slice(0, 1).map((obs) => (
                        <div
                          key={obs.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedObservanceDetail(obs);
                          }}
                          className="w-full text-left px-1.5 py-0.5 rounded border border-amber-300 bg-amber-50/90 hover:bg-amber-100 text-amber-950 text-[10px] font-semibold truncate flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                          title={`Hari Peringatan Nasional: ${obs.name} — Klik untuk rincian`}
                        >
                          <Flag className="w-2.5 h-2.5 text-amber-700 shrink-0" />
                          <span className="truncate">{obs.shortName || obs.name}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Chip meeting & cuti */}
                  <div className="flex flex-col gap-0.5 overflow-hidden mt-auto">
                    {/* Chip Meeting Google Meet */}
                    {filteredMeetings.slice(0, 1).map((m) => (
                      <div
                        key={m.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMeetingDetail(m);
                        }}
                        className="w-full text-left px-1.5 py-0.5 rounded border border-indigo-200 bg-indigo-50/90 hover:bg-indigo-100 text-indigo-900 text-[10px] font-semibold truncate flex items-center gap-1 transition-colors"
                        title={`Rapat: ${m.title} (${m.isAllDay ? "Sepanjang hari" : formatMeetingTime(m.startAt)})`}
                      >
                        <Video className="w-2.5 h-2.5 text-indigo-600 shrink-0" />
                        <span className="truncate">
                          {!m.isAllDay && <span className="opacity-75 font-normal mr-0.5">{formatMeetingTime(m.startAt)}</span>}
                          {m.title}
                        </span>
                      </div>
                    ))}

                    {/* Chip Cuti Rekan Kerja */}
                    {filteredLeaves.slice(0, filteredMeetings.length > 0 ? 1 : 2).map((l) => {
                      const conf = getLeavePillConfig(l.leaveType.name);
                      const shortName = formatShortName(l.employee.fullName);
                      return (
                        <div
                          key={l.id}
                          className={`w-full text-left px-1.5 py-0.5 rounded border text-[10px] font-semibold truncate flex items-center gap-1 ${conf.bg}`}
                          title={`${l.employee.fullName} — ${l.leaveType.name}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${conf.dot}`} />
                          <span className="truncate">{shortName}</span>
                        </div>
                      );
                    })}

                    {filteredLeaves.length + filteredMeetings.length + (showObservances.length > 1 ? showObservances.length - 1 : 0) > 2 && (
                      <span className="text-[9px] font-bold text-[#102e50] px-1">
                        +{filteredLeaves.length + filteredMeetings.length + (showObservances.length > 1 ? showObservances.length - 1 : 0) - 2} lainnya
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* === Legenda === */}
          <div className="mt-5 pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center flex-wrap gap-3 md:gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-full bg-[#102e50] flex items-center justify-center text-[#f2af3e] text-[8px] font-bold">★</span>
                <span className="text-slate-600">Hari Ini</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-red-100 border border-red-300" />
                <span className="text-slate-600">Libur / Cuti Bersama</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-amber-100 border border-amber-300" />
                <span className="text-slate-600">Peringatan Nasional (Hari Kerja)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-indigo-100 border border-indigo-300" />
                <span className="text-slate-600">Google Meet (Pribadi)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-[#eff4ff] border border-[#dee9fc]" />
                <span className="text-slate-600">Cuti Tahunan</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-rose-50 border border-rose-200" />
                <span className="text-slate-600">Izin Sakit</span>
              </div>
            </div>
            <span className="text-slate-400 text-[11px] italic hidden md:block">
              * Klik tanggal untuk detail agenda
            </span>
          </div>
        </div>
      </div>

      {/* === Modal Detail Hari === */}
      {selectedDayData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="fixed inset-0" onClick={() => setSelectedDayData(null)} />
          <div className="relative bg-white rounded-2xl max-w-md w-full border border-[#dee9fc] shadow-2xl overflow-hidden flex flex-col z-10 animate-in zoom-in-95 duration-150">
            {/* Header modal */}
            <div className="px-5 py-4 bg-gradient-to-r from-[#eff4ff] to-white border-b border-[#dee9fc] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#102e50] text-[#f2af3e] flex items-center justify-center shrink-0">
                  <CalendarRange className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#102e50] font-heading">
                    {selectedDayData.day} {MONTHS[currentMonth - 1]} {currentYear}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {[
                      selectedDayData.holiday ? "1 hari libur" : null,
                      selectedDayData.observances.length > 0
                        ? `${selectedDayData.observances.length} peringatan nasional`
                        : null,
                      selectedDayData.meetings.length > 0 ? `${selectedDayData.meetings.length} meeting` : null,
                      selectedDayData.leaves.length > 0 ? `${selectedDayData.leaves.length} cuti tim` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "Hari kerja normal"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDayData(null)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
              {/* Hari libur */}
              {selectedDayData.holiday && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#a8281c] uppercase tracking-wide">
                      {selectedDayData.holiday.isCollectiveLeave ? "Cuti Bersama" : "Hari Libur Nasional"}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">{selectedDayData.holiday.name}</p>
                </div>
              )}

              {/* Hari Peringatan Nasional */}
              {selectedDayData.observances.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[11px] font-bold text-amber-900 uppercase tracking-wide flex items-center gap-1.5">
                    <Flag className="w-3.5 h-3.5 text-amber-700" />
                    Hari Peringatan Nasional ({selectedDayData.observances.length})
                  </p>
                  {selectedDayData.observances.map((obs) => (
                    <div
                      key={obs.id}
                      className="p-3.5 rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50/40 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-200/90 text-amber-950 mb-1">
                            {obs.categoryLabel}
                          </span>
                          <h4 className="text-sm font-bold text-slate-900 leading-snug">{obs.name}</h4>
                        </div>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed bg-white/80 p-2.5 rounded-lg border border-amber-200/60">
                        {obs.description}
                      </p>
                      <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-amber-200/60 text-slate-600">
                        <span className="font-medium text-amber-950">Status Operasional:</span>
                        <span className="font-semibold px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                          {selectedDayData.holiday
                            ? "Bertepatan Hari Libur Nasional"
                            : "Hari Kerja Normal (Bukan Tanggal Merah)"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Rapat Google Meet Pribadi */}
              {selectedDayData.meetings.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[11px] font-bold text-indigo-700 uppercase tracking-wide flex items-center gap-1.5">
                    <Video className="w-3.5 h-3.5" />
                    Meeting Google Meet ({selectedDayData.meetings.length})
                  </p>
                  {selectedDayData.meetings.map((m) => (
                    <div
                      key={m.id}
                      className="p-3 rounded-xl border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 transition-all flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-indigo-950 truncate">{m.title}</p>
                        <p className="text-[11px] text-indigo-700 mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {m.isAllDay ? "Sepanjang hari" : `${formatMeetingTime(m.startAt)} – ${formatMeetingTime(m.endAt)} WIB`}
                        </p>
                      </div>
                      {m.meetUrl && (
                        <a
                          href={m.meetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 px-3 py-1.5 rounded-lg bg-[#102e50] hover:bg-[#1a4473] text-[#f2af3e] text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors"
                        >
                          <Video className="w-3.5 h-3.5" />
                          Gabung
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Daftar cuti rekan kerja */}
              {selectedDayData.leaves.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    Cuti Tim ({selectedDayData.leaves.length})
                  </p>
                  {selectedDayData.leaves.map((l) => {
                    const conf = getLeavePillConfig(l.leaveType.name);
                    return (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => {
                          setSelectedLeaveDetail(l);
                          setSelectedDayData(null);
                        }}
                        className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-[#102e50] hover:bg-[#f8fafd] transition-all flex items-center justify-between gap-3 group cursor-pointer"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#102e50] truncate">{l.employee.fullName}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${conf.bg}`}>
                              {l.leaveType.name}
                            </span>
                            <span className="text-[11px] text-slate-500">·</span>
                            <span className="text-[11px] text-slate-500">{l.days} Hari</span>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#102e50] group-hover:translate-x-0.5 transition-all shrink-0" />
                      </button>
                    );
                  })}
                </div>
              )}

              {!selectedDayData.holiday &&
                selectedDayData.observances.length === 0 &&
                selectedDayData.leaves.length === 0 &&
                selectedDayData.meetings.length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-4">Tidak ada event atau peringatan pada hari ini.</p>
                )}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedDayData(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-300 transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* === Modal Detail Hari Peringatan Nasional (Klik Langsung Chip) === */}
      {selectedObservanceDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="fixed inset-0" onClick={() => setSelectedObservanceDetail(null)} />
          <div className="relative bg-white rounded-2xl max-w-md w-full border border-amber-200 shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-150">
            <div className="px-5 py-4 bg-gradient-to-r from-amber-50 to-orange-50/50 border-b border-amber-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#102e50] text-[#f2af3e] flex items-center justify-center shrink-0">
                  <Flag className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">
                    Hari Peringatan Nasional
                  </span>
                  <h3 className="text-sm font-bold text-[#102e50] font-heading">
                    {selectedObservanceDetail.day} {MONTHS[selectedObservanceDetail.month - 1]} {selectedObservanceDetail.year}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedObservanceDetail(null)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3.5">
              <div>
                <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 mb-1.5">
                  {selectedObservanceDetail.categoryLabel}
                </span>
                <h4 className="text-base font-bold text-slate-900 leading-snug">
                  {selectedObservanceDetail.name}
                </h4>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Makna & Sejarah Peringatan</p>
                <p className="text-xs text-slate-700 leading-relaxed bg-amber-50/40 p-3 rounded-xl border border-amber-200/80">
                  {selectedObservanceDetail.description}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">Status Operasional Lembaga:</span>
                <span className="font-bold text-slate-800 px-2.5 py-1 rounded-lg bg-white border border-slate-200">
                  Hari Kerja Normal
                </span>
              </div>
            </div>
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedObservanceDetail(null)}
                className="px-4 py-1.5 rounded-lg bg-[#102e50] text-[#f2af3e] text-xs font-bold hover:bg-[#1a4473] transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* === Modal Detail Meeting Google Meet === */}
      {selectedMeetingDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="fixed inset-0" onClick={() => setSelectedMeetingDetail(null)} />
          <div className="relative bg-white rounded-2xl max-w-sm w-full border border-indigo-200 shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-150">
            <div className="px-5 py-4 bg-gradient-to-r from-indigo-50 to-white border-b border-indigo-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#102e50] text-[#f2af3e] flex items-center justify-center">
                  <Video className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-sm font-bold text-[#102e50] font-heading">Detail Meeting</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMeetingDetail(null)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <div>
                <p className="text-xs text-slate-500">Judul Agenda</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedMeetingDetail.title}</p>
              </div>

              <div>
                <p className="text-xs text-slate-500">Waktu Pelaksanaan</p>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">
                  {toDateString(selectedMeetingDetail.startAt)} ·{" "}
                  {selectedMeetingDetail.isAllDay
                    ? "Sepanjang hari"
                    : `${formatMeetingTime(selectedMeetingDetail.startAt)} – ${formatMeetingTime(selectedMeetingDetail.endAt)} WIB`}
                </p>
              </div>

              {selectedMeetingDetail.description && (
                <div>
                  <p className="text-xs text-slate-500">Deskripsi / Agenda</p>
                  <p className="text-xs text-slate-700 mt-0.5 whitespace-pre-wrap line-clamp-4 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    {selectedMeetingDetail.description}
                  </p>
                </div>
              )}

              <div className="pt-2">
                {selectedMeetingDetail.meetUrl ? (
                  <a
                    href={selectedMeetingDetail.meetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#102e50] hover:bg-[#1a4473] text-[#f2af3e] text-xs font-bold shadow-xs transition-colors"
                  >
                    <Video className="w-4 h-4" />
                    Buka Google Meet
                    <ExternalLink className="w-3.5 h-3.5 ml-1 opacity-75" />
                  </a>
                ) : (
                  <p className="text-xs text-slate-400 italic text-center py-1">
                    Event ini tidak menyertakan tautan Google Meet langsung.
                  </p>
                )}
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
              <span>Sumber: Google Calendar</span>
              <button
                type="button"
                onClick={() => setSelectedMeetingDetail(null)}
                className="px-3 py-1 rounded-lg bg-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-300 transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* === Modal Detail Cuti Karyawan === */}
      {selectedLeaveDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="fixed inset-0" onClick={() => setSelectedLeaveDetail(null)} />
          <div className="relative bg-white rounded-2xl max-w-sm w-full border border-[#dee9fc] shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-150">
            <div className="px-5 py-4 bg-gradient-to-r from-[#eff4ff] to-white border-b border-[#dee9fc] flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#102e50] font-heading">Rincian Cuti</h3>
              <button
                type="button"
                onClick={() => setSelectedLeaveDetail(null)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              {(() => {
                const conf = getLeavePillConfig(selectedLeaveDetail.leaveType.name);
                return (
                  <>
                    <div>
                      <p className="text-xs text-slate-500">Karyawan</p>
                      <p className="text-sm font-bold text-[#102e50] mt-0.5">{selectedLeaveDetail.employee.fullName}</p>
                      {selectedLeaveDetail.employee.position && (
                        <p className="text-xs text-slate-500">
                          {selectedLeaveDetail.employee.position} · {selectedLeaveDetail.employee.department ?? ""}
                        </p>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-slate-500">Jenis Cuti</p>
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-semibold border ${conf.bg}`}>
                          {selectedLeaveDetail.leaveType.name}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Durasi</p>
                        <p className="text-sm font-bold text-slate-800 mt-0.5">{selectedLeaveDetail.days} Hari Kerja</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Tanggal</p>
                      <p className="text-sm font-semibold text-slate-800 mt-0.5">
                        {toDateString(selectedLeaveDetail.startDate)}
                        {toDateString(selectedLeaveDetail.startDate) !== toDateString(selectedLeaveDetail.endDate) &&
                          ` – ${toDateString(selectedLeaveDetail.endDate)}`}
                      </p>
                    </div>
                    {selectedLeaveDetail.reason && (
                      <div>
                        <p className="text-xs text-slate-500">Keterangan</p>
                        <p className="text-sm text-slate-700 mt-0.5">{selectedLeaveDetail.reason}</p>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLeaveDetail(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-300 transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
