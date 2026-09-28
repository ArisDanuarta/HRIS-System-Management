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

  // Time & Date state
  const [time, setTime] = useState<string>("");
  const [dateStr, setDateStr] = useState<string>("");
  const [secondaryTime, setSecondaryTime] = useState<string>("");

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

  // Cutoff calculation in head office time (WIB)
  const cutoffTimeWib = workSchedule
    ? (() => {
        const [h, m] = workSchedule.workStartTime.split(":").map((v) => parseInt(v, 10));
        const total = (h || 9) * 60 + (m || 0) + workSchedule.gracePeriodMins;
        const cH = Math.floor(total / 60) % 24;
        const cM = total % 60;
        return `${String(cH).padStart(2, "0")}:${String(cM).padStart(2, "0")}`;
      })()
    : null;

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

  // Live Digital Clock updating every second
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

      // Secondary reference clock:
      // If effective zone is NOT WIB, show synchronous Jakarta (WIB) time
      // If effective zone IS WIB but user local device is NOT WIB, show user local time
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
    }

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, [effectiveTz, detectedTz, isWib, detectedAbbr]);

  const hasCheckedIn = !!todayAttendance?.checkInAt;
  const hasCheckedOut = !!todayAttendance?.checkOutAt;

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
      const res = await checkInAction({ notes: notes || undefined });
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
      const res = await checkOutAction({ notes: notes || undefined });
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
    <div className="bg-white rounded-2xl border border-[#dee9fc] shadow-sm p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 overflow-visible relative">
      {/* Left Column: Live Clock & Status */}
      <div className="flex flex-col gap-2.5">
        {/* Top Header: Date & Dynamic Timezone Picker */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#74777f]">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-[#f2af3e]" />
            <span>{dateStr || "Memuat tanggal..."}</span>
          </div>

          <span className="w-1.5 h-1.5 rounded-full bg-[#f2af3e] hidden sm:inline-block" />

          {/* Timezone Selector Dropdown */}
          <div className="relative inline-block" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setShowTzDropdown(!showTzDropdown)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#eff4ff] hover:bg-[#dee9fc] text-[#102e50] border border-[#dee9fc] font-semibold text-[11px] transition-colors cursor-pointer"
              title="Ubah tampilan zona waktu"
            >
              <Globe className="w-3.5 h-3.5 text-[#f2af3e]" />
              <span>
                {effectiveAbbr}
                {isShowingLocal ? " (Lokal)" : effectiveTz === "Asia/Jakarta" ? " (Pusat)" : ""}
              </span>
              <ChevronDown className="w-3 h-3 text-[#5b6675]" />
            </button>

            {/* Dropdown Menu */}
            {showTzDropdown && (
              <div className="absolute left-0 mt-1.5 w-64 bg-white rounded-xl shadow-xl border border-[#dee9fc] p-1.5 z-50 text-xs font-normal normal-case animate-in fade-in zoom-in-95 duration-150">
                <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#74777f] border-b border-[#dee9fc]/60">
                  Pilih Zona Waktu
                </div>

                <div className="flex flex-col gap-0.5 mt-1">
                  {/* Option 1: Auto Browser Local */}
                  <button
                    type="button"
                    onClick={() => handleSelectTimezone("AUTO")}
                    className={`flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-colors cursor-pointer ${
                      selectedTz === "AUTO"
                        ? "bg-[#eff4ff] text-[#102e50] font-bold"
                        : "hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="font-semibold">Otomatis (Lokal Browser)</span>
                      <span className="text-[11px] text-[#74777f]">
                        {detectedAbbr} • {detectedTz}
                      </span>
                    </div>
                    {selectedTz === "AUTO" && <Check className="w-4 h-4 text-[#102e50]" />}
                  </button>

                  {/* Standard Indonesian Timezones */}
                  {INDONESIA_TIMEZONES.map((tz) => (
                    <button
                      key={tz.key}
                      type="button"
                      onClick={() => handleSelectTimezone(tz.key)}
                      className={`flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-colors cursor-pointer ${
                        selectedTz === tz.key
                          ? "bg-[#eff4ff] text-[#102e50] font-bold"
                          : "hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="font-semibold">{tz.label}</span>
                        <span className="text-[11px] text-[#74777f]">
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

        {/* Hero Clock & Zone Badges */}
        <div className="flex flex-wrap items-baseline gap-3">
          <span className="text-4xl sm:text-5xl font-extrabold text-[#102e50] font-mono tracking-tight">
            {time || "--:--:--"}
          </span>

          <div className="flex flex-wrap items-center gap-2">
            {/* Primary Zone Badge */}
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#eff4ff] text-[#102e50] border border-[#dee9fc]">
              {isShowingLocal
                ? `Waktu Lokal (${effectiveAbbr})`
                : effectiveTz === "Asia/Jakarta"
                  ? "Waktu Kantor Pusat (WIB)"
                  : `Zona ${effectiveAbbr}`}
            </span>

            {/* Synchronized Reference Clock (WIB Head Office or Local User) */}
            {secondaryTime && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-slate-50 text-slate-700 border border-slate-200" title="Waktu tersinkronisasi kantor pusat Jakarta">
                <Clock className="w-3.5 h-3.5 text-[#f2af3e]" />
                <span>
                  {!isWib
                    ? `Kantor Pusat: ${secondaryTime}`
                    : `Lokal Anda: ${secondaryTime}`}
                </span>
              </span>
            )}
          </div>
        </div>

        {/* Attendance Status */}
        <div className="flex flex-wrap items-center gap-2 mt-1">
          <span className="text-xs text-[#5b6675]">Status Presensi Hari Ini:</span>
          {!hasCheckedIn ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              Belum Check-In
            </span>
          ) : !hasCheckedOut ? (
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                todayAttendance?.status === "LATE"
                  ? "bg-amber-50 text-amber-800 border-amber-300"
                  : "bg-emerald-50 text-emerald-800 border-emerald-300"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  todayAttendance?.status === "LATE" ? "bg-amber-500" : "bg-emerald-500 animate-pulse"
                }`}
              />
              <span>
                Hadir ({formatAttendanceTime(todayAttendance?.checkInAt)} {effectiveAbbr}
                {!isWib && (
                  <span className="text-slate-500 font-normal">
                    {" "}• {formatAttendanceTime(todayAttendance?.checkInAt, "Asia/Jakarta")} WIB
                  </span>
                )}
                )
              </span>
              {todayAttendance?.status === "LATE" && " • Terlambat"}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
              <span>
                Selesai Bekerja ({formatAttendanceTime(todayAttendance?.checkInAt)} -{" "}
                {formatAttendanceTime(todayAttendance?.checkOutAt)} {effectiveAbbr})
              </span>
            </span>
          )}
        </div>

        {employeeName && (
          <p className="text-xs text-[#74777f] mt-0.5">
            Presensi tercatat atas nama: <strong className="text-[#102e50]">{employeeName}</strong>
          </p>
        )}

        {/* Dynamic Work Schedule with Timezone Conversion */}
        {workSchedule && (
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-[#5b6675] mt-1 bg-slate-50/80 p-2 rounded-xl border border-slate-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span>
              Jadwal kantor: <strong>{workSchedule.workStartTime} — {workSchedule.workEndTime} WIB</strong>
              {!isWib && localWorkStart && localWorkEnd && (
                <span className="text-[#102e50] font-semibold">
                  {" "}(setara <strong>{localWorkStart} — {localWorkEnd} {effectiveAbbr}</strong> waktu Anda)
                </span>
              )}
              {" "}• Tepat waktu s/d <strong>{cutoffTimeWib} WIB</strong>
              {!isWib && localCutoffTime && (
                <span> ({localCutoffTime} {effectiveAbbr})</span>
              )}
            </span>
          </div>
        )}
      </div>

      {/* Right Column: Action Buttons */}
      <div className="flex flex-col items-stretch sm:items-end gap-3 w-full md:w-auto">
        {/* Feedback Message Alert */}
        {message && (
          <div
            className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
              message.type === "success"
                ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
                : "bg-red-50 text-red-900 border border-red-200"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Optional Notes Input */}
        {showNotesInput && (
          <div className="w-full sm:w-80 flex flex-col gap-1">
            <input
              type="text"
              placeholder="Catatan aktivitas/lokasi (opsional)..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-[#dee9fc] bg-[#f8f9ff] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#102e50]"
            />
          </div>
        )}

        <div className="flex items-center gap-3">
          {!hasCheckedIn ? (
            <>
              <button
                type="button"
                onClick={() => setShowNotesInput(!showNotesInput)}
                className="text-xs text-[#5b6675] hover:text-[#102e50] font-medium underline cursor-pointer"
              >
                {showNotesInput ? "Batal Catatan" : "+ Catatan"}
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleCheckIn}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#102e50] text-white hover:bg-[#0c233d] text-sm font-bold shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50"
              >
                <LogIn className="w-4 h-4 text-[#ffddb0]" />
                <span>{isPending ? "Memproses..." : "Masuk Kerja (Check-In)"}</span>
              </button>
            </>
          ) : !hasCheckedOut ? (
            <>
              <button
                type="button"
                onClick={() => setShowNotesInput(!showNotesInput)}
                className="text-xs text-[#5b6675] hover:text-[#102e50] font-medium underline cursor-pointer"
              >
                {showNotesInput ? "Batal Catatan" : "+ Catatan Pulang"}
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleCheckOut}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#f2af3e] text-[#102e50] hover:bg-[#e09d2c] text-sm font-bold shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50"
              >
                <LogOut className="w-4 h-4 text-[#102e50]" />
                <span>{isPending ? "Memproses..." : "Pulang Kerja (Check-Out)"}</span>
              </button>
            </>
          ) : (
            <div className="p-3 bg-[#eff4ff] border border-[#dee9fc] rounded-xl text-xs text-[#102e50] font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#805600]" />
              <span>Presensi hari ini telah lengkap. Terima kasih atas dedikasi Anda!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
