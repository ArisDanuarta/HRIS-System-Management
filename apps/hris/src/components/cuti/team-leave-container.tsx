"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  LayoutList,
  Calendar as CalendarIcon,
} from "lucide-react";
import { TeamLeaveTimeline } from "./team-leave-timeline";
import { TeamLeaveCalendarView } from "./team-leave-calendar-view";
import type { WorkCalendarLeave, WorkCalendarHoliday } from "@/server/queries/calendar.queries";

interface TeamLeaveContainerProps {
  year: number;
  month: number;
  leaves: WorkCalendarLeave[];
  holidays: WorkCalendarHoliday[];
  departments: string[];
}

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

export function TeamLeaveContainer({
  year,
  month,
  leaves,
  holidays,
  departments,
}: TeamLeaveContainerProps) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"timeline" | "calendar">("timeline");

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month;

  const handlePrevMonth = () => {
    let m = month - 1;
    let y = year;
    if (m < 1) {
      m = 12;
      y--;
    }
    router.push(`/cuti/kalender?year=${y}&month=${m}`);
  };

  const handleNextMonth = () => {
    let m = month + 1;
    let y = year;
    if (m > 12) {
      m = 1;
      y++;
    }
    router.push(`/cuti/kalender?year=${y}&month=${m}`);
  };

  const handleToday = () => {
    router.push(`/cuti/kalender?year=${today.getFullYear()}&month=${today.getMonth() + 1}`);
  };

  return (
    <div className="space-y-4">
      {/* View Switcher & Month Navigation Controls */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: View Mode Toggle */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode("timeline")}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === "timeline"
                ? "bg-[#102e50] text-white shadow-2xs"
                : "text-slate-600 hover:text-[#102e50]"
            }`}
          >
            <LayoutList className="w-3.5 h-3.5 text-[#f2af3e]" />
            <span>Tampilan Timeline Gantt</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode("calendar")}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === "calendar"
                ? "bg-[#102e50] text-white shadow-2xs"
                : "text-slate-600 hover:text-[#102e50]"
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5 text-[#f2af3e]" />
            <span>Tampilan Kalender Bulanan</span>
          </button>
        </div>

        {/* Right: Month Controls */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={handleToday}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              isCurrentMonth
                ? "bg-[#102e50] text-[#f2af3e] border-[#102e50] shadow-xs"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            Bulan Ini
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

          <span className="text-xs font-bold px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-[#102e50] min-w-[130px] text-center tabular-nums">
            {MONTHS[month - 1]} {year}
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

      {/* Render Active View Component */}
      {viewMode === "timeline" ? (
        <TeamLeaveTimeline
          year={year}
          month={month}
          leaves={leaves}
          holidays={holidays}
          departments={departments}
        />
      ) : (
        <TeamLeaveCalendarView
          year={year}
          month={month}
          leaves={leaves}
          holidays={holidays}
          departments={departments}
        />
      )}
    </div>
  );
}
