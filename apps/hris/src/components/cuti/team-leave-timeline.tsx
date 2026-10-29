"use client";

import React, { useState, useMemo } from "react";
import {
  Calendar,
  Users,
  Search,
  Filter,
  Info,
  X,
  Clock,
  Building,
  HeartPulse,
  Sparkles,
} from "lucide-react";
import { toDateString } from "@pspk/shared";
import type { WorkCalendarLeave, WorkCalendarHoliday } from "@/server/queries/calendar.queries";

interface TeamLeaveTimelineProps {
  year: number;
  month: number;
  leaves: WorkCalendarLeave[];
  holidays: WorkCalendarHoliday[];
  departments: string[];
}

export function TeamLeaveTimeline({
  year,
  month,
  leaves,
  holidays,
  departments,
}: TeamLeaveTimelineProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState<string>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedLeave, setSelectedLeave] = useState<WorkCalendarLeave | null>(null);

  // Month calculations
  const daysInMonth = new Date(year, month, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month;
  const todayDate = today.getDate();

  // Pre-build holiday map for this month
  const holidayMap = useMemo(() => {
    const map = new Map<number, WorkCalendarHoliday>();
    holidays.forEach((h) => {
      const d = new Date(toDateString(h.date));
      if (d.getFullYear() === year && d.getMonth() + 1 === month) {
        map.set(d.getDate(), h);
      }
    });
    return map;
  }, [holidays, year, month]);

  // Filter leaves
  const filteredLeaves = useMemo(() => {
    return leaves.filter((l) => {
      // Search by employee name
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = l.employee.fullName.toLowerCase().includes(q);
        const matchesNo = l.employee.employeeNo.toLowerCase().includes(q);
        if (!matchesName && !matchesNo) return false;
      }

      // Filter by department
      if (selectedDept !== "ALL") {
        if ((l.employee.department || "Lainnya") !== selectedDept) return false;
      }

      // Filter by category
      if (selectedCategory !== "ALL") {
        const lower = l.leaveType.name.toLowerCase();
        if (selectedCategory === "tahunan" && !lower.includes("tahunan")) return false;
        if (selectedCategory === "sakit" && !lower.includes("sakit")) return false;
        if (selectedCategory === "penting" && !lower.includes("penting")) return false;
        if (
          selectedCategory === "khusus" &&
          (lower.includes("tahunan") || lower.includes("sakit") || lower.includes("penting"))
        ) {
          return false;
        }
      }

      return true;
    });
  }, [leaves, searchQuery, selectedDept, selectedCategory]);

  // Group leaves by employee
  const employeeGroups = useMemo(() => {
    const map = new Map<
      string,
      {
        employee: WorkCalendarLeave["employee"];
        leaves: WorkCalendarLeave[];
      }
    >();

    filteredLeaves.forEach((l) => {
      const empId = l.employee.id;
      if (!map.has(empId)) {
        map.set(empId, {
          employee: l.employee,
          leaves: [],
        });
      }
      map.get(empId)!.leaves.push(l);
    });

    return Array.from(map.values()).sort((a, b) =>
      a.employee.fullName.localeCompare(b.employee.fullName),
    );
  }, [filteredLeaves]);

  // High contrast category colors
  const getCategoryTheme = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes("tahunan") || lower.includes("annual")) {
      return {
        bg: "bg-[#102e50] text-white border-[#0c233d]",
        dot: "bg-[#f2af3e]",
        label: "Cuti Tahunan",
      };
    }
    if (lower.includes("sakit") || lower.includes("sick")) {
      return {
        bg: "bg-[#a8281c] text-white border-[#8e2116]",
        dot: "bg-white",
        label: "Cuti Sakit",
      };
    }
    if (lower.includes("penting")) {
      return {
        bg: "bg-[#df632f] text-white border-[#c8511e]",
        dot: "bg-white",
        label: "Cuti Alasan Penting",
      };
    }
    return {
      bg: "bg-[#4338ca] text-white border-[#3730a3]",
      dot: "bg-white",
      label: "Cuti Khusus",
    };
  };

  const getDayOfWeekShort = (dayNum: number) => {
    const d = new Date(year, month - 1, dayNum);
    const day = d.getDay();
    const names = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
    return { name: names[day], isWeekend: day === 0 || day === 6 };
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col">
      {/* 1. Filter Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-200/80 bg-slate-50/60 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search box */}
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama pegawai..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#102e50]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Department Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-[#102e50] cursor-pointer"
            >
              <option value="ALL">Semua Departemen ({departments.length})</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-[#102e50] cursor-pointer"
          >
            <option value="ALL">Semua Kategori Cuti</option>
            <option value="tahunan">Cuti Tahunan</option>
            <option value="sakit">Cuti Sakit</option>
            <option value="penting">Alasan Penting</option>
            <option value="khusus">Cuti Khusus</option>
          </select>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <Users className="w-4 h-4 text-[#102e50]" />
          <span>
            <strong className="text-[#102e50] font-bold">{employeeGroups.length}</strong> pegawai
            cuti terdaftar pada filter ini
          </span>
        </div>
      </div>

      {/* 2. Timeline Grid Area */}
      {employeeGroups.length === 0 ? (
        <div className="p-12 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-[#102e50]/5 border border-[#102e50]/10 text-[#102e50] flex items-center justify-center mb-3">
            <Calendar className="w-6 h-6 text-[#f2af3e]" />
          </div>
          <p className="text-sm font-bold text-[#102e50] font-heading">
            Tidak Ada Jadwal Cuti Terdata
          </p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            Tidak ditemukan karyawan yang mengambil cuti pada bulan atau filter kriteria yang
            dipilih.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto relative">
          <div className="min-w-[980px]">
            {/* Timeline Header Row */}
            <div className="flex border-b border-slate-200 bg-slate-50/80 sticky top-0 z-20 text-[11px] font-semibold text-slate-600 select-none">
              {/* Sticky Employee Column */}
              <div className="w-60 min-w-[240px] px-4 py-3 border-r border-slate-200 bg-slate-50/90 shrink-0 font-bold text-[#102e50] uppercase tracking-wider flex items-center justify-between">
                <span>Nama Pegawai &amp; Posisi</span>
                <span className="text-[10px] text-slate-400 font-normal">Tim</span>
              </div>

              {/* Day Columns Header */}
              <div className="flex-1 grid grid-cols-[repeat(auto-fit,minmax(28px,1fr))] text-center">
                {daysArray.map((day) => {
                  const { name: dayName, isWeekend } = getDayOfWeekShort(day);
                  const isToday = isCurrentMonth && day === todayDate;
                  const holiday = holidayMap.get(day);

                  return (
                    <div
                      key={day}
                      className={`py-2 px-0.5 border-r border-slate-200/70 flex flex-col items-center justify-center transition-colors ${
                        isToday
                          ? "bg-[#102e50] text-[#f2af3e] font-bold shadow-2xs"
                          : holiday
                            ? "bg-[#a8281c]/10 text-[#a8281c] font-bold"
                            : isWeekend
                              ? "bg-slate-100/70 text-slate-400 font-medium"
                              : "text-slate-700 hover:bg-slate-100/50"
                      }`}
                      title={
                        holiday
                          ? `${day}: ${holiday.name} (${holiday.isCollectiveLeave ? "Cuti Bersama" : "Libur Nasional"})`
                          : undefined
                      }
                    >
                      <span className="text-[11px] tabular-nums leading-none">{day}</span>
                      <span
                        className={`text-[9px] uppercase tracking-tighter mt-0.5 ${
                          isToday ? "text-[#f2af3e]" : isWeekend || holiday ? "text-[#a8281c]" : "text-slate-400"
                        }`}
                      >
                        {dayName}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Timeline Employee Rows */}
            <div className="divide-y divide-slate-100 text-xs">
              {employeeGroups.map((group) => {
                const emp = group.employee;

                return (
                  <div
                    key={emp.id}
                    className="flex hover:bg-slate-50/50 transition-colors group relative items-stretch"
                  >
                    {/* Employee Info Column */}
                    <div className="w-60 min-w-[240px] p-3.5 border-r border-slate-200 bg-white group-hover:bg-slate-50/70 shrink-0 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-[#102e50]/5 border border-[#102e50]/15 flex items-center justify-center shrink-0 text-[#102e50] font-bold text-xs uppercase">
                        {emp.fullName.slice(0, 2)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="font-bold text-[#102e50] block truncate">
                          {emp.fullName}
                        </span>
                        <span className="text-[10px] text-slate-400 block truncate">
                          {emp.position || "Staf"} · {emp.department || "PSPK"}
                        </span>
                      </div>
                    </div>

                    {/* Timeline Day Track with Leave Bars */}
                    <div className="flex-1 grid grid-cols-[repeat(auto-fit,minmax(28px,1fr))] relative py-2">
                      {/* Grid background column stripes */}
                      {daysArray.map((day) => {
                        const { isWeekend } = getDayOfWeekShort(day);
                        const isToday = isCurrentMonth && day === todayDate;
                        const holiday = holidayMap.get(day);

                        return (
                          <div
                            key={day}
                            className={`border-r border-slate-100 pointer-events-none h-full ${
                              isToday
                                ? "bg-[#102e50]/5"
                                : holiday
                                  ? "bg-[#a8281c]/5"
                                  : isWeekend
                                    ? "bg-slate-50/60"
                                    : ""
                            }`}
                          />
                        );
                      })}

                      {/* Horizontal Leave Bars */}
                      {group.leaves.map((l) => {
                        const start = new Date(toDateString(l.startDate));
                        const end = new Date(toDateString(l.endDate));

                        // Calculate start and end day in current month
                        let startDay = 1;
                        if (
                          start.getFullYear() === year &&
                          start.getMonth() + 1 === month
                        ) {
                          startDay = start.getDate();
                        }

                        let endDay = daysInMonth;
                        if (
                          end.getFullYear() === year &&
                          end.getMonth() + 1 === month
                        ) {
                          endDay = end.getDate();
                        }

                        // Bounds checking
                        startDay = Math.max(1, Math.min(startDay, daysInMonth));
                        endDay = Math.max(startDay, Math.min(endDay, daysInMonth));

                        // CSS Grid column span (1-based index)
                        const colStart = startDay;
                        const colEnd = endDay + 1;

                        const theme = getCategoryTheme(l.leaveType.name);

                        return (
                          <button
                            key={l.id}
                            type="button"
                            onClick={() => setSelectedLeave(l)}
                            style={{
                              gridColumnStart: colStart,
                              gridColumnEnd: colEnd,
                            }}
                            className={`my-1 mx-0.5 px-2 py-1.5 rounded-lg border text-left shadow-2xs hover:brightness-110 transition-all flex items-center justify-between gap-1 cursor-pointer overflow-hidden z-10 ${theme.bg}`}
                            title={`${emp.fullName}: ${l.leaveType.name} (${l.days} Hari) - Klik untuk detail`}
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span
                                className={`w-1.5 h-1.5 rounded-full shrink-0 ${theme.dot}`}
                              />
                              <span className="text-[11px] font-bold truncate">
                                {l.leaveType.name}
                              </span>
                            </div>
                            <span className="text-[10px] opacity-90 shrink-0 font-semibold tabular-nums">
                              {l.days}h
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 3. Legend Footer */}
      <div className="p-4 border-t border-slate-200/80 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-[#102e50] text-[#f2af3e] flex items-center justify-center text-[9px] font-bold">
              ★
            </span>
            <span className="text-slate-600 font-medium">Hari Ini</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-[#a8281c] border border-[#8e2116]" />
            <span className="text-slate-600 font-medium">Cuti Sakit / Libur Nasional</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-[#102e50] border border-[#0c233d]" />
            <span className="text-slate-600 font-medium">Cuti Tahunan</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-[#df632f] border border-[#c8511e]" />
            <span className="text-slate-600 font-medium">Alasan Penting</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-[#4338ca] border border-[#3730a3]" />
            <span className="text-slate-600 font-medium">Cuti Khusus</span>
          </div>
        </div>

        <span className="text-slate-400 text-[11px] italic hidden md:block">
          * Klik pada bar cuti untuk melihat rincian pengajuan
        </span>
      </div>

      {/* 4. Leave Detail Modal */}
      {selectedLeave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="fixed inset-0" onClick={() => setSelectedLeave(null)} />
          <div className="relative bg-white rounded-2xl max-w-sm w-full border border-slate-200 shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-5 py-4 bg-[#102e50] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#f2af3e]" />
                <h3 className="text-sm font-bold font-heading">Rincian Cuti Pegawai</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLeave(null)}
                className="text-white/60 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-3.5 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider block">
                  Nama Pegawai
                </span>
                <p className="text-sm font-bold text-[#102e50] mt-0.5">
                  {selectedLeave.employee.fullName}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  NIP: {selectedLeave.employee.employeeNo} ·{" "}
                  {selectedLeave.employee.position || "Staf"} ·{" "}
                  {selectedLeave.employee.department || "PSPK"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider block">
                    Kategori Cuti
                  </span>
                  <p className="text-xs font-bold text-slate-800 mt-0.5">
                    {selectedLeave.leaveType.name}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider block">
                    Durasi
                  </span>
                  <p className="text-xs font-bold text-[#102e50] mt-0.5 tabular-nums">
                    {selectedLeave.days} Hari Kerja
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider block">
                  Rentang Tanggal
                </span>
                <p className="text-xs font-semibold text-slate-700 mt-0.5">
                  {toDateString(selectedLeave.startDate)} s/d {toDateString(selectedLeave.endDate)}
                </p>
              </div>

              {selectedLeave.reason && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider block">
                    Keperluan
                  </span>
                  <p className="text-xs text-slate-600 mt-1 bg-slate-50 p-2.5 rounded-lg border border-slate-200 leading-relaxed">
                    {selectedLeave.reason}
                  </p>
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLeave(null)}
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
