"use client";

import React, { useState, useEffect, useTransition } from "react";
import { LogIn, LogOut, CheckCircle2, AlertCircle, Calendar } from "lucide-react";
import { checkInAction, checkOutAction } from "@/server/actions/attendance.actions";

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
  };
}

export function TodayAttendanceCard({
  todayAttendance,
  employeeName,
  workSchedule,
}: TodayAttendanceCardProps) {
  const [time, setTime] = useState<string>("");
  const [dateStr, setDateStr] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [showNotesInput, setShowNotesInput] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const cutoffTime = workSchedule
    ? (() => {
        const [h, m] = workSchedule.workStartTime.split(":").map((v) => parseInt(v, 10));
        const total = (h || 9) * 60 + (m || 0) + workSchedule.gracePeriodMins;
        const cH = Math.floor(total / 60) % 24;
        const cM = total % 60;
        return `${String(cH).padStart(2, "0")}:${String(cM).padStart(2, "0")}`;
      })()
    : null;

  // Keep live digital clock updating every second
  useEffect(() => {
    function updateClock() {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }),
      );
      setDateStr(
        now.toLocaleDateString("id-ID", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
      );
    }
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const hasCheckedIn = !!todayAttendance?.checkInAt;
  const hasCheckedOut = !!todayAttendance?.checkOutAt;

  const formatTime = (d: Date | null | undefined) => {
    if (!d) return "--:--";
    const dateObj = typeof d === "string" ? new Date(d) : d;
    return dateObj.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
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
    <div className="bg-white rounded-2xl border border-[#dee9fc] shadow-sm p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 overflow-hidden relative">
      {/* Left: Live Clock & Status */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#74777f]">
          <Calendar className="w-4 h-4 text-[#f2af3e]" />
          <span>{dateStr || "Memuat tanggal..."}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#f2af3e]" />
          <span className="text-[#102e50]">WIB (Jakarta)</span>
        </div>

        <div className="flex items-baseline gap-3">
          <span className="text-4xl sm:text-5xl font-extrabold text-[#102e50] font-mono tracking-tight">
            {time || "--:--:--"}
          </span>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#eff4ff] text-[#102e50] border border-[#dee9fc]">
            Waktu Server
          </span>
        </div>

        <div className="flex items-center gap-2 mt-1">
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
              Hadir ({formatTime(todayAttendance?.checkInAt)} WIB)
              {todayAttendance?.status === "LATE" && " • Terlambat"}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
              Selesai Bekerja ({formatTime(todayAttendance?.checkInAt)} - {formatTime(todayAttendance?.checkOutAt)})
            </span>
          )}
        </div>

        {employeeName && (
          <p className="text-xs text-[#74777f] mt-1">
            Presensi tercatat atas nama: <strong className="text-[#102e50]">{employeeName}</strong>
          </p>
        )}

        {workSchedule && (
          <div className="flex items-center gap-1.5 text-[11px] text-[#5b6675] mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>
              Jadwal kantor: <strong>{workSchedule.workStartTime} — {workSchedule.workEndTime} WIB</strong> (Tepat waktu s/d <strong>{cutoffTime} WIB</strong>)
            </span>
          </div>
        )}
      </div>

      {/* Right: Action Buttons */}
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
