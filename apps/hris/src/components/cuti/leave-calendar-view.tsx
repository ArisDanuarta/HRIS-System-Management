"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  X,
  Users,
  ArrowRight,
} from "lucide-react";
import { toDateString } from "@pspk/shared";
import {
  LeaveDetailModal,
  type CalendarLeaveDetail,
} from "./leave-detail-modal";

interface HolidayEvent {
  id: string;
  date: Date;
  name: string;
  isCollectiveLeave: boolean;
}

interface LeaveCalendarViewProps {
  year: number;
  month: number; // 1 to 12
  approvedLeaves: CalendarLeaveDetail[];
  holidays: HolidayEvent[];
}

export function LeaveCalendarView({
  year,
  month,
  approvedLeaves,
  holidays,
}: LeaveCalendarViewProps) {
  const router = useRouter();
  const [currentYear, setCurrentYear] = useState(year);
  const [currentMonth, setCurrentMonth] = useState(month);
  const [selectedLeave, setSelectedLeave] = useState<CalendarLeaveDetail | null>(null);
  const [selectedDayLeaves, setSelectedDayLeaves] = useState<{
    day: number;
    dateStr: string;
    leaves: CalendarLeaveDetail[];
  } | null>(null);

  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];

  // Accurate client-side date for "Hari Ini"
  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth() + 1;
  const todayDay = today.getDate();
  const isCurrentMonthActive = currentYear === todayYear && currentMonth === todayMonth;

  const handlePrevMonth = () => {
    let nextM = currentMonth - 1;
    let nextY = currentYear;
    if (nextM < 1) {
      nextM = 12;
      nextY--;
    }
    setCurrentMonth(nextM);
    setCurrentYear(nextY);
    router.push(`/cuti/kalender?year=${nextY}&month=${nextM}`);
  };

  const handleNextMonth = () => {
    let nextM = currentMonth + 1;
    let nextY = currentYear;
    if (nextM > 12) {
      nextM = 1;
      nextY++;
    }
    setCurrentMonth(nextM);
    setCurrentYear(nextY);
    router.push(`/cuti/kalender?year=${nextY}&month=${nextM}`);
  };

  const handleToday = () => {
    setCurrentMonth(todayMonth);
    setCurrentYear(todayYear);
    router.push(`/cuti/kalender?year=${todayYear}&month=${todayMonth}`);
  };

  // Build calendar grid days
  const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1).getDay(); // 0 is Sun
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();

  const daysArray: (number | null)[] = [];
  // Pad blank days before day 1
  for (let i = 0; i < firstDayOfMonth; i++) {
    daysArray.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    daysArray.push(d);
  }

  // Pre-calculate maps
  const holidayMap = new Map<string, HolidayEvent>();
  for (const h of holidays) {
    holidayMap.set(toDateString(h.date), h);
  }

  const getLeavesForDate = (dateStr: string) => {
    const target = new Date(dateStr).getTime();
    return approvedLeaves.filter((l) => {
      const s = new Date(toDateString(l.startDate)).getTime();
      const e = new Date(toDateString(l.endDate)).getTime();
      return target >= s && target <= e;
    });
  };

  // Smart short name parser to avoid cutting names like "I Made Aris" into just "I"
  const formatShortName = (fullName: string) => {
    if (!fullName) return "";
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0]!;
    // If the first part is a single letter or short title (e.g. "I", "Ni", "A.")
    if (parts[0]!.length <= 2 && parts[1]) {
      return `${parts[0]} ${parts[1]}`;
    }
    return parts[0]!;
  };

  // Dynamic pill styling based on leave category
  const getLeavePillConfig = (typeName: string) => {
    const lower = typeName.toLowerCase();
    if (lower.includes("sakit")) {
      return {
        bg: "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 hover:border-rose-300",
        label: "Sakit",
        dot: "bg-rose-500",
      };
    }
    if (lower.includes("tahunan")) {
      return {
        bg: "bg-[#eff4ff] text-[#102e50] border-[#dee9fc] hover:bg-blue-100 hover:border-blue-300",
        label: "Tahunan",
        dot: "bg-blue-600",
      };
    }
    if (lower.includes("melahirkan")) {
      return {
        bg: "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 hover:border-purple-300",
        label: "Melahirkan",
        dot: "bg-purple-600",
      };
    }
    return {
      bg: "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100 hover:border-amber-300",
      label: "Penting",
      dot: "bg-amber-600",
    };
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-[#dee9fc] shadow-xs overflow-hidden flex flex-col">
        {/* Month Header Controller */}
        <div className="p-6 border-b border-[#dee9fc] bg-[#eff4ff]/50 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white shadow-xs text-[#102e50] flex items-center justify-center">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#102e50] font-heading">
                {months[currentMonth - 1]} {currentYear}
              </h2>
              <p className="text-xs text-[#5b6675]">
                Kalender Cuti Bersama, Hari Libur Nasional & Jadwal Cuti Staf
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToday}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                isCurrentMonthActive
                  ? "bg-[#102e50] text-[#f2af3e] border-[#102e50] shadow-xs"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
              title="Lompat ke Hari Ini"
            >
              Hari Ini
            </button>
            <div className="h-5 w-px bg-slate-200 mx-0.5" />
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              title="Bulan Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold px-3 py-1.5 bg-white border border-[#dee9fc] rounded-lg text-[#102e50]">
              {months[currentMonth - 1]}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              title="Bulan Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="p-6">
          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold uppercase tracking-wider text-[#5b6675]">
            <span className="text-[#a8281c]">Min</span>
            <span>Sen</span>
            <span>Sel</span>
            <span>Rab</span>
            <span>Kam</span>
            <span>Jum</span>
            <span className="text-[#a8281c]">Sab</span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-2">
            {daysArray.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} className="h-32 rounded-xl bg-slate-50/50" />;
              }

              const dateStr = `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const holiday = holidayMap.get(dateStr);
              const leaves = getLeavesForDate(dateStr);
              const isWeekend = idx % 7 === 0 || idx % 7 === 6;
              const isToday =
                currentYear === todayYear &&
                currentMonth === todayMonth &&
                day === todayDay;

              return (
                <div
                  key={`day-${day}`}
                  className={`h-32 p-2 rounded-xl border flex flex-col justify-between transition-all overflow-hidden relative ${
                    isToday
                      ? "border-2 border-[#102e50] bg-gradient-to-b from-[#eff4ff]/70 to-white shadow-sm ring-2 ring-[#102e50]/20"
                      : holiday
                      ? "bg-red-50/70 border-red-200"
                      : isWeekend
                      ? "bg-slate-50/80 border-slate-200"
                      : "bg-white border-slate-200 hover:border-[#102e50]/50"
                  }`}
                >
                  {/* Day Header */}
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-xs font-bold transition-all ${
                          isToday
                            ? "w-6 h-6 rounded-full bg-[#102e50] text-[#f2af3e] flex items-center justify-center font-bold text-xs shadow-xs"
                            : isWeekend || holiday
                            ? "text-[#a8281c]"
                            : "text-slate-800"
                        }`}
                      >
                        {day}
                      </span>
                      {isToday && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#102e50] text-[#f2af3e] tracking-tight shrink-0 shadow-2xs">
                          Hari Ini
                        </span>
                      )}
                    </div>
                    {holiday && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-[#a8281c] truncate max-w-[80px]">
                        {holiday.isCollectiveLeave ? "Cuti Bersama" : "Libur"}
                      </span>
                    )}
                  </div>

                  {/* Holiday Name */}
                  {holiday && (
                    <p className="text-[10px] text-red-900 font-semibold line-clamp-2 leading-tight mb-1">
                      {holiday.name}
                    </p>
                  )}

                  {/* Leaves on this day */}
                  <div className="flex flex-col gap-1 overflow-y-auto max-h-16 mt-auto">
                    {leaves.slice(0, 2).map((l) => {
                      const conf = getLeavePillConfig(l.leaveType.name);
                      const shortName = formatShortName(l.employee.fullName);

                      return (
                        <button
                          key={l.id}
                          type="button"
                          onClick={() => setSelectedLeave(l)}
                          className={`w-full text-left px-1.5 py-0.5 rounded border text-[10px] font-semibold truncate transition-all cursor-pointer flex items-center gap-1 active:scale-[0.98] ${conf.bg}`}
                          title={`${l.employee.fullName} - ${l.leaveType.name}. Klik untuk rincian.`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${conf.dot}`} />
                          <span className="truncate">
                            {shortName} ({conf.label})
                          </span>
                        </button>
                      );
                    })}

                    {leaves.length > 2 && (
                      <button
                        type="button"
                        onClick={() => setSelectedDayLeaves({ day, dateStr, leaves })}
                        className="text-[10px] font-bold text-[#102e50] hover:underline text-left px-1 py-0.5 cursor-pointer block"
                      >
                        +{leaves.length - 2} lainnya
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-6 pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center flex-wrap gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-full bg-[#102e50] border border-[#102e50] text-[#f2af3e] flex items-center justify-center text-[8px] font-bold">
                  ★
                </span>
                <span className="text-slate-700 font-medium">Hari Ini</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-red-100 border border-red-300" />
                <span className="text-slate-600">Hari Libur / Cuti Bersama</span>
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
                <span className="text-slate-600">Cuti Khusus / Penting</span>
              </div>
            </div>
            <span className="text-slate-400 text-[11px] italic">
              * Klik pada entri cuti/sakit untuk membuka dialog rincian lengkap
            </span>
          </div>
        </div>
      </div>

      {/* Modal Detail Cuti / Izin / Sakit */}
      <LeaveDetailModal
        leave={selectedLeave}
        onClose={() => setSelectedLeave(null)}
      />

      {/* Modal Daftar Cuti jika lebih dari 2 pada 1 tanggal */}
      {selectedDayLeaves && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="fixed inset-0" onClick={() => setSelectedDayLeaves(null)} />
          <div className="relative bg-white rounded-2xl max-w-md w-full border border-[#dee9fc] shadow-2xl overflow-hidden flex flex-col z-10 animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-gradient-to-r from-[#eff4ff] to-white border-b border-[#dee9fc] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#102e50] text-[#f2af3e] flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#102e50] font-heading">
                    Ketidakhadiran Tanggal {selectedDayLeaves.day} {months[currentMonth - 1]} {currentYear}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Total {selectedDayLeaves.leaves.length} pegawai cuti/izin
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDayLeaves(null)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
              {selectedDayLeaves.leaves.map((l) => {
                const conf = getLeavePillConfig(l.leaveType.name);
                return (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => {
                      setSelectedLeave(l);
                      setSelectedDayLeaves(null);
                    }}
                    className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-[#102e50] hover:bg-[#f8fafd] transition-all flex items-center justify-between gap-3 group cursor-pointer"
                  >
                    <div>
                      <div className="font-bold text-xs text-[#102e50]">
                        {l.employee.fullName}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-semibold border ${conf.bg}`}>
                          {l.leaveType.name}
                        </span>
                        <span>•</span>
                        <span>{l.days} Hari Kerja</span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#102e50] group-hover:translate-x-0.5 transition-all shrink-0" />
                  </button>
                );
              })}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedDayLeaves(null)}
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
