"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { toDateString } from "@pspk/shared";

interface CalendarLeaveEvent {
  id: string;
  startDate: Date;
  endDate: Date;
  employee: {
    fullName: string;
    employeeNo: string;
  };
  leaveType: {
    name: string;
  };
}

interface HolidayEvent {
  id: string;
  date: Date;
  name: string;
  isCollectiveLeave: boolean;
}

interface LeaveCalendarViewProps {
  year: number;
  month: number; // 1 to 12
  approvedLeaves: CalendarLeaveEvent[];
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

  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];

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

  return (
    <div className="bg-white rounded-2xl border border-[#dee9fc] shadow-sm overflow-hidden flex flex-col">
      {/* Month Header Controller */}
      <div className="p-6 border-b border-[#dee9fc] bg-[#eff4ff]/50 flex items-center justify-between">
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
            onClick={handlePrevMonth}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            title="Bulan Sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold px-3 py-1 bg-white border border-[#dee9fc] rounded-lg text-[#102e50]">
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
              return <div key={`empty-${idx}`} className="h-28 rounded-xl bg-slate-50/50" />;
            }

            const dateStr = `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const holiday = holidayMap.get(dateStr);
            const leaves = getLeavesForDate(dateStr);
            const isWeekend = idx % 7 === 0 || idx % 7 === 6;

            return (
              <div
                key={`day-${day}`}
                className={`h-28 p-2 rounded-xl border flex flex-col justify-between transition-all overflow-hidden ${
                  holiday
                    ? "bg-red-50/70 border-red-200"
                    : isWeekend
                    ? "bg-slate-50/80 border-slate-200"
                    : "bg-white border-slate-200 hover:border-[#102e50]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold ${
                      isWeekend || holiday ? "text-[#a8281c]" : "text-slate-800"
                    }`}
                  >
                    {day}
                  </span>
                  {holiday && (
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-red-100 text-[#a8281c] truncate max-w-[80px]">
                      {holiday.isCollectiveLeave ? "Cuti Bersama" : "Libur"}
                    </span>
                  )}
                </div>

                {/* Holiday Name */}
                {holiday && (
                  <p className="text-[10px] text-red-900 font-semibold line-clamp-2 leading-tight">
                    {holiday.name}
                  </p>
                )}

                {/* Leaves on this day */}
                <div className="flex flex-col gap-1 overflow-y-auto max-h-14">
                  {leaves.map((l) => (
                    <div
                      key={l.id}
                      className="px-1.5 py-0.5 rounded bg-[#eff4ff] text-[#102e50] border border-[#dee9fc] text-[10px] font-semibold truncate"
                      title={`${l.employee.fullName} - ${l.leaveType.name}`}
                    >
                      {l.employee.fullName.split(" ")[0]} ({l.leaveType.name.split(" ")[1] || "Cuti"})
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-red-100 border border-red-300" />
              <span className="text-slate-600">Hari Libur Nasional / Cuti Bersama</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-[#eff4ff] border border-[#dee9fc]" />
              <span className="text-slate-600">Pegawai Sedang Cuti</span>
            </div>
          </div>
          <span className="text-slate-400 text-[11px]">
            Kalender terintegrasi otomatis dengan sistem presensi harian
          </span>
        </div>
      </div>
    </div>
  );
}
