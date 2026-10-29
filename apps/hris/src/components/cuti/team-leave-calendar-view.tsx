"use client";

import React, { useState } from "react";
import {
  Calendar,
  Users,
  X,
  ArrowRight,
  Filter,
  CheckCircle2,
  CalendarRange,
  Info,
} from "lucide-react";
import { toDateString } from "@pspk/shared";
import type { WorkCalendarLeave, WorkCalendarHoliday } from "@/server/queries/calendar.queries";

interface TeamLeaveCalendarViewProps {
  year: number;
  month: number;
  leaves: WorkCalendarLeave[];
  holidays: WorkCalendarHoliday[];
  departments: string[];
}

export function TeamLeaveCalendarView({
  year,
  month,
  leaves,
  holidays,
  departments,
}: TeamLeaveCalendarViewProps) {
  const [selectedDept, setSelectedDept] = useState<string>("ALL");
  const [selectedDayData, setSelectedDayData] = useState<{
    day: number;
    dateStr: string;
    holiday: WorkCalendarHoliday | null;
    leaves: WorkCalendarLeave[];
  } | null>(null);

  const [selectedLeaveDetail, setSelectedLeaveDetail] = useState<WorkCalendarLeave | null>(null);

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
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month;
  const todayDay = today.getDate();

  // Filter leaves by department if chosen
  const filteredLeaves = selectedDept === "ALL"
    ? leaves
    : leaves.filter((l) => (l.employee.department || "Lainnya") === selectedDept);

  // Pre-build maps
  const holidayMap = new Map<string, WorkCalendarHoliday>();
  holidays.forEach((h) => holidayMap.set(toDateString(h.date), h));

  const getLeavesForDate = (dateStr: string): WorkCalendarLeave[] => {
    const target = new Date(dateStr).getTime();
    return filteredLeaves.filter((l) => {
      const s = new Date(toDateString(l.startDate)).getTime();
      const e = new Date(toDateString(l.endDate)).getTime();
      return target >= s && target <= e;
    });
  };

  // Build grid days
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const daysArray: (number | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) daysArray.push(null);
  for (let d = 1; d <= daysInMonth; d++) daysArray.push(d);

  // High contrast category chips
  const getCategoryTheme = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes("tahunan") || lower.includes("annual")) {
      return {
        chip: "bg-[#102e50] text-white hover:bg-[#0c233d]",
        dot: "bg-[#f2af3e]",
        label: "Tahunan",
      };
    }
    if (lower.includes("sakit") || lower.includes("sick")) {
      return {
        chip: "bg-[#a8281c] text-white hover:bg-[#8e2116]",
        dot: "bg-white",
        label: "Sakit",
      };
    }
    if (lower.includes("penting")) {
      return {
        chip: "bg-[#df632f] text-white hover:bg-[#c8511e]",
        dot: "bg-white",
        label: "Penting",
      };
    }
    return {
      chip: "bg-[#4338ca] text-white hover:bg-[#3730a3]",
      dot: "bg-white",
      label: "Khusus",
    };
  };

  const formatShortName = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0]!;
    if (parts[0]!.length <= 2 && parts[1]) return `${parts[0]} ${parts[1]}`;
    return parts[0]!;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col">
      {/* Top Filter Bar */}
      <div className="px-5 py-3.5 border-b border-slate-200/80 bg-slate-50/60 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-bold text-[#102e50]">Filter Departemen:</span>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-[#102e50] cursor-pointer"
          >
            <option value="ALL">Semua Departemen ({departments.length})</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>

        <span className="text-[11px] text-slate-400 italic">
          * Klik pada kotak tanggal untuk melihat daftar lengkap yang cuti
        </span>
      </div>

      {/* Month Calendar Grid */}
      <div className="p-4 sm:p-6">
        {/* Day Name Headers (Minggu to Sabtu) */}
        <div className="grid grid-cols-7 gap-1.5 mb-2 text-center text-[11px] font-bold uppercase tracking-wider text-slate-500 select-none">
          <span className="text-[#a8281c]">Min</span>
          <span>Sen</span>
          <span>Sel</span>
          <span>Rab</span>
          <span>Kam</span>
          <span>Jum</span>
          <span className="text-[#a8281c]">Sab</span>
        </div>

        {/* Calendar Day Cells */}
        <div className="grid grid-cols-7 gap-1.5">
          {daysArray.map((day, idx) => {
            if (day === null) {
              return (
                <div key={`empty-${idx}`} className="h-28 sm:h-32 rounded-xl bg-slate-50/40" />
              );
            }

            const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const holiday = holidayMap.get(dateStr);
            const dayLeaves = getLeavesForDate(dateStr);
            const isWeekend = idx % 7 === 0 || idx % 7 === 6;
            const isToday = isCurrentMonth && day === todayDay;
            const hasContent = !!holiday || dayLeaves.length > 0;

            return (
              <div
                key={`day-${day}`}
                onClick={() => {
                  if (hasContent) {
                    setSelectedDayData({
                      day,
                      dateStr,
                      holiday: holiday ?? null,
                      leaves: dayLeaves,
                    });
                  }
                }}
                className={`h-28 sm:h-32 p-1.5 sm:p-2 rounded-xl border flex flex-col transition-all overflow-hidden relative ${
                  hasContent ? "cursor-pointer" : ""
                } ${
                  isToday
                    ? "border-2 border-[#102e50] bg-slate-50/70 shadow-xs ring-2 ring-[#102e50]/10"
                    : holiday
                      ? "bg-[#a8281c]/5 border-[#a8281c]/25 hover:border-[#a8281c]/40"
                      : isWeekend
                        ? "bg-slate-50/70 border-slate-200"
                        : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                {/* Header: Day Number & Holiday Tag */}
                <div className="flex items-center justify-between gap-1 mb-1">
                  <div className="flex items-center gap-1">
                    <span
                      className={`text-xs font-bold leading-none ${
                        isToday
                          ? "w-6 h-6 rounded-full bg-[#102e50] text-[#f2af3e] flex items-center justify-center text-xs shadow-2xs"
                          : isWeekend || holiday
                            ? "text-[#a8281c]"
                            : "text-slate-800"
                      }`}
                    >
                      {day}
                    </span>
                    {isToday && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-[#102e50] text-[#f2af3e] tracking-tight hidden sm:inline">
                        Hari Ini
                      </span>
                    )}
                  </div>

                  {holiday && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#a8281c] text-white truncate max-w-[70px]">
                      {holiday.isCollectiveLeave ? "Cuti Bers." : "Libur"}
                    </span>
                  )}
                </div>

                {/* Holiday Name Label */}
                {holiday && (
                  <p className="text-[10px] text-[#a8281c] font-bold line-clamp-1 leading-tight mb-1">
                    {holiday.name}
                  </p>
                )}

                {/* Leave Chips Container */}
                <div className="flex flex-col gap-0.5 overflow-hidden mt-auto">
                  {dayLeaves.slice(0, 2).map((l) => {
                    const theme = getCategoryTheme(l.leaveType.name);
                    const shortName = formatShortName(l.employee.fullName);

                    return (
                      <div
                        key={l.id}
                        className={`w-full text-left px-1.5 py-0.5 rounded text-[10px] font-bold truncate flex items-center gap-1 shadow-2xs transition-all ${theme.chip}`}
                        title={`${l.employee.fullName} - ${l.leaveType.name} (${l.employee.department || "PSPK"})`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${theme.dot}`} />
                        <span className="truncate">{shortName}</span>
                      </div>
                    );
                  })}

                  {dayLeaves.length > 2 && (
                    <span className="text-[9px] font-bold text-[#102e50] px-1">
                      +{dayLeaves.length - 2} rekan lainnya
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-5 pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center flex-wrap gap-3 sm:gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full bg-[#102e50] text-[#f2af3e] flex items-center justify-center text-[9px] font-bold">
                ★
              </span>
              <span className="text-slate-600 font-medium">Hari Ini</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-[#a8281c]" />
              <span className="text-slate-600 font-medium">Hari Libur / Cuti Sakit</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-[#102e50]" />
              <span className="text-slate-600 font-medium">Cuti Tahunan</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-[#df632f]" />
              <span className="text-slate-600 font-medium">Alasan Penting</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-[#4338ca]" />
              <span className="text-slate-600 font-medium">Cuti Khusus</span>
            </div>
          </div>
        </div>
      </div>

      {/* Day Detail Modal */}
      {selectedDayData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="fixed inset-0" onClick={() => setSelectedDayData(null)} />
          <div className="relative bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-5 py-4 bg-[#102e50] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CalendarRange className="w-4 h-4 text-[#f2af3e]" />
                <div>
                  <h3 className="text-sm font-bold font-heading">
                    {selectedDayData.day} {MONTHS[month - 1]} {year}
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    {[
                      selectedDayData.holiday ? "1 Hari Libur Nasional" : null,
                      selectedDayData.leaves.length > 0
                        ? `${selectedDayData.leaves.length} Karyawan Cuti`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "Hari kerja normal"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedDayData(null)}
                className="text-white/60 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3.5 max-h-96 overflow-y-auto text-xs">
              {/* Holiday Info */}
              {selectedDayData.holiday && (
                <div className="p-3.5 rounded-xl bg-[#a8281c]/10 border border-[#a8281c]/25">
                  <span className="text-[10px] font-bold text-[#a8281c] uppercase tracking-wider block">
                    {selectedDayData.holiday.isCollectiveLeave
                      ? "Cuti Bersama Resmi"
                      : "Hari Libur Nasional"}
                  </span>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">
                    {selectedDayData.holiday.name}
                  </p>
                </div>
              )}

              {/* Leaves List */}
              {selectedDayData.leaves.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider block">
                    Daftar Karyawan Mengambil Cuti ({selectedDayData.leaves.length})
                  </span>

                  {selectedDayData.leaves.map((l) => {
                    const theme = getCategoryTheme(l.leaveType.name);

                    return (
                      <div
                        key={l.id}
                        className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col gap-1.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-bold text-[#102e50] block">
                              {l.employee.fullName}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {l.employee.position || "Staf"} · {l.employee.department || "PSPK"}
                            </span>
                          </div>

                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${theme.chip}`}
                          >
                            {l.leaveType.name}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1.5 border-t border-slate-200/60">
                          <span>
                            {toDateString(l.startDate)} s/d {toDateString(l.endDate)}
                          </span>
                          <span className="font-bold text-[#102e50]">{l.days} Hari Kerja</span>
                        </div>

                        {l.reason && (
                          <p className="text-[11px] text-slate-600 bg-white p-2 rounded border border-slate-200/70">
                            &quot;{l.reason}&quot;
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {!selectedDayData.holiday && selectedDayData.leaves.length === 0 && (
                <p className="text-center py-4 text-slate-500">
                  Tidak ada agenda cuti tim pada tanggal ini.
                </p>
              )}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedDayData(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
