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
} from "lucide-react";
import { toDateString } from "@pspk/shared";
import type { WorkCalendarLeave, WorkCalendarHoliday } from "@/server/queries/calendar.queries";

// ----------- Tipe Filter -----------
type CalendarFilter = "all" | "leave" | "holiday";

// ----------- Props -----------
interface WorkCalendarViewProps {
  year: number;
  month: number;
  leaves: WorkCalendarLeave[];
  holidays: WorkCalendarHoliday[];
  googleConnected?: boolean; // Fase C: apakah user sudah connect Google
}

// ----------- Komponen Utama -----------
export function WorkCalendarView({
  year,
  month,
  leaves,
  holidays,
  googleConnected = false,
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
  } | null>(null);
  const [selectedLeaveDetail, setSelectedLeaveDetail] = useState<WorkCalendarLeave | null>(null);

  const MONTHS = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
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
    if (m < 1) { m = 12; y--; }
    setCurrentMonth(m); setCurrentYear(y);
    router.push(`/kalender?year=${y}&month=${m}`);
  };

  const handleNextMonth = () => {
    let m = currentMonth + 1;
    let y = currentYear;
    if (m > 12) { m = 1; y++; }
    setCurrentMonth(m); setCurrentYear(y);
    router.push(`/kalender?year=${y}&month=${m}`);
  };

  const handleToday = () => {
    setCurrentMonth(todayMonth); setCurrentYear(todayYear);
    router.push(`/kalender?year=${todayYear}&month=${todayMonth}`);
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

  const getLeavesForDate = (dateStr: string): WorkCalendarLeave[] => {
    const target = new Date(dateStr).getTime();
    return leaves.filter((l) => {
      const s = new Date(toDateString(l.startDate)).getTime();
      const e = new Date(toDateString(l.endDate)).getTime();
      return target >= s && target <= e;
    });
  };

  // --- Filter ---
  const filterItems = [
    { id: "all" as CalendarFilter, label: "Semua" },
    { id: "leave" as CalendarFilter, label: "Cuti Tim" },
    { id: "holiday" as CalendarFilter, label: "Hari Libur" },
  ];

  // --- Nama pendek ---
  const formatShortName = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0]!;
    if (parts[0]!.length <= 2 && parts[1]) return `${parts[0]} ${parts[1]}`;
    return parts[0]!;
  };

  // --- Chip style per tipe cuti ---
  const getLeavePillConfig = (typeName: string) => {
    const lower = typeName.toLowerCase();
    if (lower.includes("sakit")) return { bg: "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100", dot: "bg-rose-500", label: "Sakit" };
    if (lower.includes("tahunan")) return { bg: "bg-[#eff4ff] text-[#102e50] border-[#dee9fc] hover:bg-blue-100", dot: "bg-blue-600", label: "Tahunan" };
    if (lower.includes("melahirkan")) return { bg: "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100", dot: "bg-purple-600", label: "Melahirkan" };
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
              <p className="text-xs text-[#5b6675] mt-0.5">
                Cuti tim, hari libur nasional{!googleConnected ? " · " : " & "}{!googleConnected ? <span className="text-blue-500 font-medium">meeting Google (segera)</span> : "meeting Google Meet"}
              </p>
            </div>
          </div>

          {/* Kontrol navigasi bulan */}
          <div className="flex items-center gap-2">
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
          <span className="ml-auto text-[11px] text-slate-400 italic hidden sm:block">
            Klik tanggal untuk detail
          </span>
        </div>

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
              const dayLeaves = getLeavesForDate(dateStr);
              const isWeekend = idx % 7 === 0 || idx % 7 === 6;
              const isToday = currentYear === todayYear && currentMonth === todayMonth && day === todayDay;

              // Terapkan filter aktif
              const showHoliday = (activeFilter === "all" || activeFilter === "holiday") && !!holiday;
              const filteredLeaves = (activeFilter === "all" || activeFilter === "leave") ? dayLeaves : [];

              const hasContent = showHoliday || filteredLeaves.length > 0;

              return (
                <div
                  key={`day-${day}`}
                  onClick={() => {
                    if (hasContent) {
                      setSelectedDayData({ day, dateStr, leaves: dayLeaves, holiday: holiday ?? null });
                    }
                  }}
                  className={`h-28 md:h-32 p-1.5 md:p-2 rounded-xl border flex flex-col transition-all overflow-hidden relative ${
                    hasContent ? "cursor-pointer" : ""
                  } ${
                    isToday
                      ? "border-2 border-[#102e50] bg-gradient-to-b from-[#eff4ff]/70 to-white shadow-sm ring-2 ring-[#102e50]/10"
                      : holiday
                      ? "bg-red-50/70 border-red-200 hover:border-red-300"
                      : isWeekend
                      ? "bg-slate-50/70 border-slate-200"
                      : "bg-white border-slate-200 hover:border-[#102e50]/40"
                  }`}
                >
                  {/* Day number */}
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
                    </div>
                    {showHoliday && (
                      <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-red-100 text-[#a8281c] truncate max-w-[60px] md:max-w-[75px]">
                        {holiday!.isCollectiveLeave ? "Cuti Bers." : "Libur"}
                      </span>
                    )}
                  </div>

                  {/* Nama hari libur */}
                  {showHoliday && (
                    <p className="text-[10px] text-red-900 font-semibold line-clamp-2 leading-tight mb-1">
                      {holiday!.name}
                    </p>
                  )}

                  {/* Chip cuti karyawan */}
                  <div className="flex flex-col gap-0.5 overflow-hidden mt-auto">
                    {filteredLeaves.slice(0, 2).map((l) => {
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
                    {filteredLeaves.length > 2 && (
                      <span className="text-[10px] font-bold text-[#102e50] px-1">
                        +{filteredLeaves.length - 2} lainnya
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
                <span className="w-3 h-3 rounded bg-[#eff4ff] border border-[#dee9fc]" />
                <span className="text-slate-600">Cuti Tahunan</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-rose-50 border border-rose-200" />
                <span className="text-slate-600">Izin Sakit</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-amber-50 border border-amber-200" />
                <span className="text-slate-600">Cuti Khusus</span>
              </div>
            </div>
            <span className="text-slate-400 text-[11px] italic hidden md:block">
              * Klik tanggal untuk melihat detail lengkap
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
                      selectedDayData.leaves.length > 0 ? `${selectedDayData.leaves.length} karyawan cuti` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "Hari kerja biasa"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDayData(null)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
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

              {/* Daftar cuti karyawan */}
              {selectedDayData.leaves.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    Karyawan Cuti ({selectedDayData.leaves.length})
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

              {!selectedDayData.holiday && selectedDayData.leaves.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-4">Tidak ada event pada hari ini.</p>
              )}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedDayData(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-300 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* === Modal Detail Cuti Karyawan (terklik dari modal hari) === */}
      {selectedLeaveDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="fixed inset-0" onClick={() => setSelectedLeaveDetail(null)} />
          <div className="relative bg-white rounded-2xl max-w-sm w-full border border-[#dee9fc] shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-150">
            <div className="px-5 py-4 bg-gradient-to-r from-[#eff4ff] to-white border-b border-[#dee9fc] flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#102e50] font-heading">Rincian Cuti</h3>
              <button
                type="button"
                onClick={() => setSelectedLeaveDetail(null)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors"
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
                        <p className="text-xs text-slate-500">{selectedLeaveDetail.employee.position} · {selectedLeaveDetail.employee.department ?? ""}</p>
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
                className="px-4 py-1.5 rounded-lg bg-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-300 transition-colors"
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
