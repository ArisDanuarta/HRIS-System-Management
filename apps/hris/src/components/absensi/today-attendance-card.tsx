"use client";

import React, { useState, useEffect, useTransition, useRef, useSyncExternalStore } from "react";
import {
  LogIn,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Globe,
  Clock,
  ChevronDown,
  Check,
  FileText,
  X,
  Building2,
  Home,
} from "lucide-react";
import { checkInAction, checkOutAction } from "@/server/actions/attendance.actions";
import {
  getTimezoneAbbr,
  formatTimeInZone,
  formatDateInZone,
  convertTimeStringZone,
  INDONESIA_TIMEZONES,
} from "@pspk/shared";

interface TodayAttendanceCardProps {
  todayAttendance: {
    id: string;
    checkInAt: Date | null;
    checkOutAt: Date | null;
    status: string;
    notes?: string | null;
  } | null;
  employeeName?: string;
  workSchedule?: {
    workStartTime: string;
    workEndTime: string;
    gracePeriodMins: number;
    name?: string;
  };
}

const STORAGE_KEY = "pspk_preferred_timezone";

export function TodayAttendanceCard({
  todayAttendance,
  employeeName,
  workSchedule,
}: TodayAttendanceCardProps) {
  // Detected timezone from browser environment via useSyncExternalStore
  const detectedTz = useSyncExternalStore(
    () => () => {},
    () => {
      try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Jakarta";
      } catch {
        return "Asia/Jakarta";
      }
    },
    () => "Asia/Jakarta",
  );

  // User selected timezone ("AUTO" or specific IANA string) synced with localStorage
  const selectedTz = useSyncExternalStore(
    (callback) => {
      if (typeof window === "undefined") return () => {};
      window.addEventListener("storage", callback);
      return () => window.removeEventListener("storage", callback);
    },
    () => {
      try {
        return localStorage.getItem(STORAGE_KEY) || "AUTO";
      } catch {
        return "AUTO";
      }
    },
    () => "AUTO",
  );

  const [showTzDropdown, setShowTzDropdown] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Time, Date & Shift Progress state
  const [time, setTime] = useState<string>("");
  const [dateStr, setDateStr] = useState<string>("");
  const [secondaryTime, setSecondaryTime] = useState<string>("");
  const [shiftProgress, setShiftProgress] = useState<number>(0);

  // Form & Action state
  const [workMode, setWorkMode] = useState<"WFO" | "WFH">("WFO");
  const [notes, setNotes] = useState<string>("");
  const [showNotesInput, setShowNotesInput] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowTzDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Effective timezone currently applied
  const effectiveTz = selectedTz === "AUTO" ? detectedTz : selectedTz;
  const effectiveAbbr = getTimezoneAbbr(effectiveTz);
  const detectedAbbr = getTimezoneAbbr(detectedTz);
  const isWib = effectiveTz === "Asia/Jakarta" || effectiveAbbr === "WIB";
  const isShowingLocal = effectiveTz === detectedTz;

  const handleSelectTimezone = (tz: string) => {
    try {
      if (tz === "AUTO") {
        localStorage.removeItem(STORAGE_KEY);
      } else {
        localStorage.setItem(STORAGE_KEY, tz);
      }
      window.dispatchEvent(new Event("storage"));
    } catch {
      // Ignore storage errors
    }
    setShowTzDropdown(false);
  };

  // Cutoff & Shift Marker calculation in head office time (WIB)
  const scheduleMetrics = workSchedule
    ? (() => {
        const [startH, startM] = workSchedule.workStartTime.split(":").map((v) => parseInt(v, 10));
        const [endH, endM] = workSchedule.workEndTime.split(":").map((v) => parseInt(v, 10));
        const startMins = (startH || 9) * 60 + (startM || 0);
        const endMins = (endH || 17) * 60 + (endM || 0);
        const cutoffMins = startMins + (workSchedule.gracePeriodMins || 0);

        const cH = Math.floor(cutoffMins / 60) % 24;
        const cM = cutoffMins % 60;
        const cutoffTimeWib = `${String(cH).padStart(2, "0")}:${String(cM).padStart(2, "0")}`;

        const totalDuration = Math.max(endMins - startMins, 1);
        const gracePercentage = Math.min(
          Math.max(((cutoffMins - startMins) / totalDuration) * 100, 0),
          100,
        );

        return {
          startMins,
          endMins,
          cutoffTimeWib,
          gracePercentage,
        };
      })()
    : null;

  const cutoffTimeWib = scheduleMetrics?.cutoffTimeWib || null;

  // Local converted schedule times (if user timezone differs from WIB)
  const localWorkStart = workSchedule
    ? convertTimeStringZone(workSchedule.workStartTime, "Asia/Jakarta", effectiveTz)
    : null;
  const localWorkEnd = workSchedule
    ? convertTimeStringZone(workSchedule.workEndTime, "Asia/Jakarta", effectiveTz)
    : null;
  const localCutoffTime = cutoffTimeWib
    ? convertTimeStringZone(cutoffTimeWib, "Asia/Jakarta", effectiveTz)
    : null;

  // Live Digital Clock & Shift Progress updating every second
  useEffect(() => {
    function updateClock() {
      const now = new Date();

      // Primary display in effective timezone
      setTime(
        formatTimeInZone(now, effectiveTz, {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }),
      );

      setDateStr(
        formatDateInZone(now, effectiveTz, {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
      );

      // Secondary reference clock
      if (!isWib) {
        const wib = formatTimeInZone(now, "Asia/Jakarta", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        });
        setSecondaryTime(`${wib} WIB`);
      } else if (detectedTz !== "Asia/Jakarta" && detectedAbbr !== "WIB") {
        const local = formatTimeInZone(now, detectedTz, {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        });
        setSecondaryTime(`${local} ${detectedAbbr}`);
      } else {
        setSecondaryTime("");
      }

      // Shift progress calculation against Head Office (WIB) schedule
      if (scheduleMetrics) {
        const wibParts = new Intl.DateTimeFormat("en-US", {
          timeZone: "Asia/Jakarta",
          hour: "numeric",
          minute: "numeric",
          hourCycle: "h23",
        }).formatToParts(now);

        const curH = parseInt(wibParts.find((p) => p.type === "hour")?.value ?? "0", 10);
        const curM = parseInt(wibParts.find((p) => p.type === "minute")?.value ?? "0", 10);
        const curTotalMins = curH * 60 + curM;

        if (curTotalMins <= scheduleMetrics.startMins) {
          setShiftProgress(0);
        } else if (curTotalMins >= scheduleMetrics.endMins) {
          setShiftProgress(100);
        } else {
          const pct =
            ((curTotalMins - scheduleMetrics.startMins) /
              (scheduleMetrics.endMins - scheduleMetrics.startMins)) *
            100;
          setShiftProgress(Math.min(Math.max(pct, 0), 100));
        }
      }
    }

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, [effectiveTz, detectedTz, isWib, detectedAbbr, scheduleMetrics]);

  const hasCheckedIn = !!todayAttendance?.checkInAt;
  const hasCheckedOut = !!todayAttendance?.checkOutAt;

  // Detect recorded work mode from existing notes if already checked in
  const recordedMode = todayAttendance?.notes?.includes("[WFH]")
    ? "WFH"
    : todayAttendance?.notes?.includes("[WFO]")
      ? "WFO"
      : todayAttendance?.status === "WFH"
        ? "WFH"
        : null;

  // Time formatters for attendance logs
  const formatAttendanceTime = (d: Date | null | undefined, tz: string = effectiveTz) => {
    if (!d) return "--:--";
    return formatTimeInZone(d, tz, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const handleCheckIn = () => {
    setMessage(null);
    startTransition(async () => {
      const modeTag = `[${workMode}]`;
      const tzTag = `[${effectiveAbbr}]`;
      const cleanNote = notes.trim();
      const combinedNotes = cleanNote ? `${modeTag} ${cleanNote} ${tzTag}` : `${modeTag} ${tzTag}`;

      const res = await checkInAction({ notes: combinedNotes });
      if (res.success) {
        setMessage({ type: "success", text: res.message });
        setShowNotesInput(false);
        setNotes("");
      } else {
        setMessage({ type: "error", text: res.message });
      }
    });
  };

  const handleCheckOut = () => {
    setMessage(null);
    startTransition(async () => {
      const tzTag = `[${effectiveAbbr}]`;
      const cleanNote = notes.trim();
      const combinedNotes = cleanNote ? `${cleanNote} ${tzTag}` : tzTag;

      const res = await checkOutAction({ notes: combinedNotes });
      if (res.success) {
        setMessage({ type: "success", text: res.message });
        setShowNotesInput(false);
        setNotes("");
      } else {
        setMessage({ type: "error", text: res.message });
      }
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs relative overflow-visible transition-all">
      {/* PSPK Brand Signature Top Bar (Navy, Golden Yellow, Crimson Red, Warm Grey) */}
      <div className="flex h-1.5 w-full rounded-t-2xl overflow-hidden">
        <div className="w-1/2 bg-[#102e50]" />
        <div className="w-1/4 bg-[#f2af3e]" />
        <div className="w-1/6 bg-[#a8281c]" />
        <div className="flex-1 bg-slate-300" />
      </div>

      <div className="p-6 sm:p-8">
        {/* Top Meta Bar: Date, Timezone Selector & Status Pill */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            <div className="inline-flex items-center gap-2 font-semibold text-[#102e50]">
              <Calendar className="w-4 h-4 text-[#f2af3e]" />
              <span>{dateStr || "Memuat tanggal..."}</span>
            </div>

            <span className="text-slate-300 hidden sm:inline">|</span>

            {/* Timezone Selector Dropdown */}
            <div className="relative inline-block" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setShowTzDropdown(!showTzDropdown)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-[#102e50] border border-slate-200/80 font-medium text-xs transition-colors cursor-pointer"
                title="Ubah tampilan zona waktu"
              >
                <Globe className="w-3.5 h-3.5 text-[#0874aa]" />
                <span>
                  {effectiveAbbr}
                  {isShowingLocal ? " (Lokal)" : effectiveTz === "Asia/Jakarta" ? " (Pusat)" : ""}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showTzDropdown && (
                <div className="absolute left-0 mt-1.5 w-64 bg-white rounded-xl shadow-lg border border-slate-200 p-1.5 z-50 text-xs font-normal normal-case animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                    Pilih Zona Waktu
                  </div>

                  <div className="flex flex-col gap-0.5 mt-1">
                    <button
                      type="button"
                      onClick={() => handleSelectTimezone("AUTO")}
                      className={`flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-colors cursor-pointer ${
                        selectedTz === "AUTO"
                          ? "bg-[#102e50]/5 text-[#102e50] font-semibold"
                          : "hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <div className="flex flex-col">
                        <span>Otomatis (Lokal Browser)</span>
                        <span className="text-[11px] text-slate-400">
                          {detectedAbbr} • {detectedTz}
                        </span>
                      </div>
                      {selectedTz === "AUTO" && <Check className="w-4 h-4 text-[#102e50]" />}
                    </button>

                    {INDONESIA_TIMEZONES.map((tz) => (
                      <button
                        key={tz.key}
                        type="button"
                        onClick={() => handleSelectTimezone(tz.key)}
                        className={`flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-colors cursor-pointer ${
                          selectedTz === tz.key
                            ? "bg-[#102e50]/5 text-[#102e50] font-semibold"
                            : "hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <div className="flex flex-col">
                          <span>{tz.label}</span>
                          <span className="text-[11px] text-slate-400">
                            UTC+{tz.offsetHours} • {tz.abbr}
                          </span>
                        </div>
                        {selectedTz === tz.key && <Check className="w-4 h-4 text-[#102e50]" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Status Badge */}
          <div className="flex items-center gap-2">
            {recordedMode && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#102e50]/5 text-[#102e50] border border-[#102e50]/15">
                {recordedMode === "WFH" ? (
                  <Home className="w-3 h-3 text-[#0874aa]" />
                ) : (
                  <Building2 className="w-3 h-3 text-[#102e50]" />
                )}
                {recordedMode}
              </span>
            )}

            {!hasCheckedIn ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                Belum Check-In
              </span>
            ) : !hasCheckedOut ? (
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border ${
                  todayAttendance?.status === "LATE"
                    ? "bg-[#f4b867]/20 text-[#8e2d3f] border-[#f2af3e]/50"
                    : "bg-emerald-50 text-emerald-800 border-emerald-200"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full animate-pulse ${
                    todayAttendance?.status === "LATE" ? "bg-[#df632f]" : "bg-emerald-600"
                  }`}
                />
                <span>
                  Sedang Bertugas ({formatAttendanceTime(todayAttendance?.checkInAt)}{" "}
                  {effectiveAbbr})
                </span>
                {todayAttendance?.status === "LATE" && " • Terlambat"}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-[#0874aa]/10 text-[#0874aa] border border-[#0874aa]/25">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#0874aa]" />
                <span>Selesai Bertugas</span>
              </span>
            )}
          </div>
        </div>

        {/* Main Content Grid: Left (Clock & Shift Visual) | Right (Check-In/Out Controls) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6 items-center">
          {/* Left Column (7 cols): Live Clock & Visual Shift Timeline */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="text-4xl sm:text-5xl font-bold text-[#102e50] font-mono tracking-tight tabular-nums">
                  {time || "--:--:--"}
                </span>
                <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-[#102e50] text-white">
                  {effectiveAbbr}
                </span>

                {secondaryTime && (
                  <span
                    className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md bg-slate-50 text-slate-600 border border-slate-200/80"
                    title="Waktu referensi sinkronisasi"
                  >
                    <Clock className="w-3.5 h-3.5 text-[#f2af3e]" />
                    <span>
                      {!isWib ? `Kantor Pusat: ${secondaryTime}` : `Lokal Anda: ${secondaryTime}`}
                    </span>
                  </span>
                )}
              </div>

              {employeeName && (
                <p className="text-xs text-slate-500">
                  Pegawai bertugas:{" "}
                  <strong className="text-[#102e50] font-semibold">{employeeName}</strong>
                </p>
              )}
            </div>

            {/* Visual Shift Timeline & Check-In/Out Summary Boxes */}
            <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/70 space-y-3.5">
              {workSchedule && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#102e50]">
                      {workSchedule.name || "Jadwal Kerja Reguler"}
                    </span>
                    <span className="text-slate-500 text-[11px]">
                      Batas Tepat Waktu:{" "}
                      <strong className="text-[#a8281c]">
                        {cutoffTimeWib} WIB
                        {!isWib && localCutoffTime ? ` (${localCutoffTime} ${effectiveAbbr})` : ""}
                      </strong>
                    </span>
                  </div>

                  {/* Shift Progress Bar */}
                  <div className="relative h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        hasCheckedOut
                          ? "bg-[#0874aa]"
                          : hasCheckedIn
                            ? "bg-[#102e50]"
                            : "bg-[#f2af3e]"
                      }`}
                      style={{ width: `${shiftProgress}%` }}
                    />
                    {/* Grace Period Marker */}
                    {scheduleMetrics && scheduleMetrics.gracePercentage > 0 && (
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-[#a8281c]"
                        style={{ left: `${scheduleMetrics.gracePercentage}%` }}
                        title={`Batas toleransi masuk: ${cutoffTimeWib} WIB`}
                      />
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                    <span>
                      Masuk: <strong className="text-[#102e50]">{workSchedule.workStartTime} WIB</strong>
                      {!isWib && localWorkStart ? ` (${localWorkStart} ${effectiveAbbr})` : ""}
                    </span>
                    <span>
                      Pulang: <strong className="text-[#102e50]">{workSchedule.workEndTime} WIB</strong>
                      {!isWib && localWorkEnd ? ` (${localWorkEnd} ${effectiveAbbr})` : ""}
                    </span>
                  </div>
                </div>
              )}

              {/* Recorded Check-In & Check-Out Stamp Row */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/70">
                <div className="bg-white rounded-lg p-2.5 border border-slate-200/60 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block">
                      Jam Masuk
                    </span>
                    <span className="text-sm font-bold font-mono text-[#102e50]">
                      {todayAttendance?.checkInAt
                        ? `${formatAttendanceTime(todayAttendance.checkInAt)} ${effectiveAbbr}`
                        : "--:--"}
                    </span>
                  </div>
                  <LogIn
                    className={`w-4 h-4 ${
                      hasCheckedIn ? "text-emerald-600" : "text-slate-300"
                    }`}
                  />
                </div>

                <div className="bg-white rounded-lg p-2.5 border border-slate-200/60 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block">
                      Jam Pulang
                    </span>
                    <span className="text-sm font-bold font-mono text-[#102e50]">
                      {todayAttendance?.checkOutAt
                        ? `${formatAttendanceTime(todayAttendance.checkOutAt)} ${effectiveAbbr}`
                        : "--:--"}
                    </span>
                  </div>
                  <LogOut
                    className={`w-4 h-4 ${
                      hasCheckedOut ? "text-[#0874aa]" : "text-slate-300"
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (5 cols): Dedicated Action Control Box */}
          <div className="lg:col-span-5 flex flex-col justify-center gap-3.5 lg:border-l lg:border-slate-100 lg:pl-8">
            {/* Feedback Message Alert */}
            {message && (
              <div
                className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                  message.type === "success"
                    ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
                    : "bg-[#a8281c]/10 text-[#a8281c] border border-[#a8281c]/20"
                }`}
              >
                {message.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-[#a8281c] shrink-0" />
                )}
                <span>{message.text}</span>
              </div>
            )}

            {!hasCheckedIn ? (
              <>
                {/* Work Mode Radio Selector (WFO vs WFH) */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Mode Kehadiran Hari Ini
                  </label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200/70">
                    <button
                      type="button"
                      onClick={() => setWorkMode("WFO")}
                      className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        workMode === "WFO"
                          ? "bg-white text-[#102e50] shadow-xs border border-slate-200/60"
                          : "text-slate-600 hover:text-[#102e50]"
                      }`}
                    >
                      <Building2
                        className={`w-3.5 h-3.5 ${
                          workMode === "WFO" ? "text-[#102e50]" : "text-slate-400"
                        }`}
                      />
                      <span>WFO (Kantor)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setWorkMode("WFH")}
                      className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        workMode === "WFH"
                          ? "bg-white text-[#102e50] shadow-xs border border-slate-200/60"
                          : "text-slate-600 hover:text-[#102e50]"
                      }`}
                    >
                      <Home
                        className={`w-3.5 h-3.5 ${
                          workMode === "WFH" ? "text-[#0874aa]" : "text-slate-400"
                        }`}
                      />
                      <span>WFH / Remote</span>
                    </button>
                  </div>
                </div>

                {/* Optional Notes Input */}
                {showNotesInput && (
                  <div className="relative animate-in fade-in duration-150">
                    <input
                      type="text"
                      placeholder="Catatan agenda atau lokasi tugas (opsional)..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full pl-3 pr-8 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#102e50]"
                    />
                    {notes && (
                      <button
                        type="button"
                        onClick={() => setNotes("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}

                {/* Check-In Buttons */}
                <div className="flex items-center gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowNotesInput(!showNotesInput)}
                    className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                      showNotesInput || notes
                        ? "bg-[#102e50]/5 text-[#102e50] border-[#102e50]/30"
                        : "bg-white text-slate-600 hover:text-[#102e50] border-slate-200 hover:bg-slate-50"
                    }`}
                    title="Tambah catatan lokasi atau aktivitas"
                  >
                    <FileText className="w-4 h-4 text-slate-500" />
                    <span>{showNotesInput ? "Tutup" : notes ? "Catatan Terisi" : "+ Catatan"}</span>
                  </button>

                  <button
                    type="button"
                    disabled={isPending}
                    onClick={handleCheckIn}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#102e50] text-white hover:bg-[#0b223c] text-sm font-bold shadow-xs hover:shadow-md transition-all cursor-pointer active:scale-[0.99] disabled:opacity-50"
                  >
                    <LogIn className="w-4 h-4 text-[#f2af3e] shrink-0" />
                    <span>{isPending ? "Memproses..." : "Masuk Kerja (Check-In)"}</span>
                  </button>
                </div>
              </>
            ) : !hasCheckedOut ? (
              <>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs text-slate-600 leading-relaxed">
                  Anda tercatat hadir pukul{" "}
                  <strong className="text-[#102e50]">
                    {formatAttendanceTime(todayAttendance?.checkInAt)} {effectiveAbbr}
                  </strong>
                  . Jangan lupa melakukan <strong>Check-Out</strong> setelah menyelesaikan
                  aktivitas kerja hari ini.
                </div>

                {showNotesInput && (
                  <div className="relative animate-in fade-in duration-150">
                    <input
                      type="text"
                      placeholder="Catatan penyelesaian tugas hari ini (opsional)..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full pl-3 pr-8 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#102e50]"
                    />
                    {notes && (
                      <button
                        type="button"
                        onClick={() => setNotes("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowNotesInput(!showNotesInput)}
                    className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                      showNotesInput || notes
                        ? "bg-[#102e50]/5 text-[#102e50] border-[#102e50]/30"
                        : "bg-white text-slate-600 hover:text-[#102e50] border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <FileText className="w-4 h-4 text-slate-500" />
                    <span>{showNotesInput ? "Tutup" : notes ? "Catatan Terisi" : "+ Catatan"}</span>
                  </button>

                  <button
                    type="button"
                    disabled={isPending}
                    onClick={handleCheckOut}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#f2af3e] text-[#102e50] hover:bg-[#e5a02d] text-sm font-bold shadow-xs hover:shadow-md transition-all cursor-pointer active:scale-[0.99] disabled:opacity-50"
                  >
                    <LogOut className="w-4 h-4 text-[#102e50] shrink-0" />
                    <span>{isPending ? "Memproses..." : "Pulang Kerja (Check-Out)"}</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-[#102e50] space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-emerald-700">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Presensi Hari Ini Lengkap</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Terima kasih atas dedikasi Anda hari ini. Jam kerja terekam dari{" "}
                  <strong className="text-[#102e50]">
                    {formatAttendanceTime(todayAttendance?.checkInAt)}
                  </strong>{" "}
                  hingga{" "}
                  <strong className="text-[#102e50]">
                    {formatAttendanceTime(todayAttendance?.checkOutAt)} {effectiveAbbr}
                  </strong>
                  .
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}