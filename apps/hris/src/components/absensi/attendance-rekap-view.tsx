"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Filter,
  Edit3,
  Users,
  Building,
  Calendar,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  LayoutGrid,
  Table2,
  RotateCcw,
} from "lucide-react";
import { AttendanceCorrectionModal } from "./attendance-correction-modal";
import { exportAttendanceRekapXlsx } from "@/lib/attendance-export";
import { logAttendanceExportAction } from "@/server/actions/attendance.actions";

interface EmployeeRekapItem {
  id: string;
  employeeNo: string;
  fullName: string;
  status: string;
  currentPosition?: { title: string } | null;
  currentDepartment?: { id: string; name: string } | null;
}

interface AttendanceRecordItem {
  id: string;
  employeeId: string;
  date: Date;
  checkInAt: Date | null;
  checkOutAt: Date | null;
  status: string;
  source: string;
  correctionReason?: string | null;
}

interface AttendanceRekapViewProps {
  employees: EmployeeRekapItem[];
  attendances: AttendanceRecordItem[];
  departments: { id: string; name: string }[];
  currentYear: number;
  currentMonth: number;
  selectedDeptId?: string;
  searchQuery?: string;
  isHrOrAdmin?: boolean;
  isTeamView?: boolean;
  departmentName?: string;
}

export function AttendanceRekapView({
  employees,
  attendances,
  departments,
  currentYear,
  currentMonth,
  selectedDeptId = "ALL",
  searchQuery = "",
  isHrOrAdmin = true,
  isTeamView = false,
  departmentName,
}: AttendanceRekapViewProps) {
  const router = useRouter();
  const [search, setSearch] = useState(searchQuery);
  const [dept, setDept] = useState(selectedDeptId);
  const [month, setMonth] = useState(String(currentMonth));
  const [year, setYear] = useState(String(currentYear));
  const [viewMode, setViewMode] = useState<"matrix" | "summary">("matrix");

  // Selected employee & optional target date for correction modal
  const [selectedForCorrection, setSelectedForCorrection] = useState<{
    id: string;
    fullName: string;
    employeeNo: string;
    initialDate?: string;
  } | null>(null);

  const handleFilter = () => {
    const params = new URLSearchParams();
    if (month) params.set("month", month);
    if (year) params.set("year", year);
    if (dept && dept !== "ALL") params.set("dept", dept);
    if (search.trim()) params.set("search", search.trim());

    router.push(`/absensi/rekap?${params.toString()}`);
  };

  const handleResetFilter = () => {
    const now = new Date();
    const defaultM = String(now.getMonth() + 1);
    const defaultY = String(now.getFullYear());
    setSearch("");
    setDept("ALL");
    setMonth(defaultM);
    setYear(defaultY);
    router.push(`/absensi/rekap?month=${defaultM}&year=${defaultY}`);
  };

  // Calculate days in selected month (1..28/29/30/31)
  const daysInMonth = useMemo(() => {
    const count = new Date(currentYear, currentMonth, 0).getDate();
    return Array.from({ length: count }, (_, idx) => {
      const dayNumber = idx + 1;
      const d = new Date(Date.UTC(currentYear, currentMonth - 1, dayNumber));
      const dayOfWeek = d.getUTCDay(); // 0 = Sun, 6 = Sat
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const dateStr = `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(
        dayNumber,
      ).padStart(2, "0")}`;

      const dayShort = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"][dayOfWeek];
      return {
        dayNumber,
        dayShort,
        isWeekend,
        dateStr,
      };
    });
  }, [currentYear, currentMonth]);

  // Compute attendance stats map & daily lookup map per employee
  const { statsMap, dailyMap, orgStats } = useMemo(() => {
    const sMap = new Map<
      string,
      { present: number; late: number; leave: number; absent: number; wfh: number; totalDays: number }
    >();
    const dMap = new Map<string, Map<number, AttendanceRecordItem>>();

    let totalPresent = 0;
    let totalLate = 0;
    let totalLeave = 0;
    let totalAbsent = 0;

    for (const emp of employees) {
      sMap.set(emp.id, { present: 0, late: 0, leave: 0, absent: 0, wfh: 0, totalDays: 0 });
      dMap.set(emp.id, new Map<number, AttendanceRecordItem>());
    }

    for (const a of attendances) {
      const stat = sMap.get(a.employeeId);
      const empDays = dMap.get(a.employeeId);

      const dateObj = typeof a.date === "string" ? new Date(a.date) : a.date;
      const dayNum = dateObj.getUTCDate();

      if (empDays) {
        empDays.set(dayNum, a);
      }

      if (stat) {
        stat.totalDays++;
        if (a.status === "PRESENT") {
          stat.present++;
          totalPresent++;
        } else if (a.status === "LATE") {
          stat.late++;
          totalLate++;
        } else if (a.status === "LEAVE") {
          stat.leave++;
          totalLeave++;
        } else if (a.status === "ABSENT") {
          stat.absent++;
          totalAbsent++;
        } else if (a.status === "WFH") {
          stat.wfh++;
          stat.present++;
          totalPresent++;
        }
      }
    }

    const totalAttended = totalPresent + totalLate;
    const onTimeRate =
      totalAttended > 0 ? Math.round((totalPresent / totalAttended) * 100) : 0;

    return {
      statsMap: sMap,
      dailyMap: dMap,
      orgStats: {
        totalPresent,
        totalLate,
        totalLeave,
        totalAbsent,
        onTimeRate,
      },
    };
  }, [employees, attendances]);

  const months = [
    { value: "1", label: "Januari" },
    { value: "2", label: "Februari" },
    { value: "3", label: "Maret" },
    { value: "4", label: "April" },
    { value: "5", label: "Mei" },
    { value: "6", label: "Juni" },
    { value: "7", label: "Juli" },
    { value: "8", label: "Agustus" },
    { value: "9", label: "September" },
    { value: "10", label: "Oktober" },
    { value: "11", label: "November" },
    { value: "12", label: "Desember" },
  ];

  const activeMonthLabel =
    months.find((m) => Number(m.value) === currentMonth)?.label || `Bulan ${currentMonth}`;

  const handleExportXlsx = () => {
    const selectedDeptName = isTeamView
      ? departmentName || "Divisi Tim"
      : dept === "ALL"
        ? "Semua Divisi"
        : departments.find((d) => d.id === dept)?.name || "Divisi";

    exportAttendanceRekapXlsx({
      employees,
      statsMap,
      year: currentYear,
      month: currentMonth,
      monthLabel: activeMonthLabel,
      departmentName: selectedDeptName,
    });

    logAttendanceExportAction({
      year: currentYear,
      month: currentMonth,
      departmentId: dept !== "ALL" ? dept : undefined,
      totalEmployees: employees.length,
    }).catch(console.error);
  };

  // Render matrix cell badge
  const renderMatrixCell = (record: AttendanceRecordItem | undefined, isWeekend: boolean) => {
    if (!record) {
      return (
        <span
          className={`inline-flex items-center justify-center w-6 h-6 rounded-md text-[10px] font-medium ${
            isWeekend ? "text-slate-300" : "text-slate-300 group-hover:text-slate-400"
          }`}
        >
          ·
        </span>
      );
    }

    switch (record.status) {
      case "PRESENT":
        return (
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            H
          </span>
        );
      case "LATE":
        return (
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-md text-[10px] font-bold bg-[#df632f]/15 text-[#df632f] border border-[#df632f]/30">
            T
          </span>
        );
      case "WFH":
        return (
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-md text-[10px] font-bold bg-[#0874aa]/15 text-[#0874aa] border border-[#0874aa]/30">
            W
          </span>
        );
      case "LEAVE":
        return (
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-md text-[10px] font-bold bg-[#f2af3e]/20 text-[#8e2d3f] border border-[#f2af3e]/40">
            C
          </span>
        );
      case "ABSENT":
        return (
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-md text-[10px] font-bold bg-[#a8281c]/15 text-[#a8281c] border border-[#a8281c]/30">
            A
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600">
            •
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* 1. Aggregate KPI Cards (PSPK Brand Palette) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 bottom-0 w-1 bg-[#102e50]" />
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
            <span>{isTeamView ? "Total Anggota Tim" : "Total Pegawai Terdata"}</span>
            <Users className="w-4 h-4 text-[#102e50]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#102e50] tabular-nums">
              {employees.length}
            </span>
            <span className="text-xs text-slate-500">Pegawai Aktif</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 bottom-0 w-1 bg-emerald-600" />
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
            <span>Hadir Tepat Waktu</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-[#102e50] tabular-nums">
                {orgStats.totalPresent}
              </span>
              <span className="text-xs text-slate-500">Log Hadir</span>
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              {orgStats.onTimeRate}% Ketepatan
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 bottom-0 w-1 bg-[#df632f]" />
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
            <span>Akumulasi Terlambat</span>
            <AlertTriangle className="w-4 h-4 text-[#df632f]" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-[#df632f] tabular-nums">
              {orgStats.totalLate}
            </span>
            <span className="text-xs text-slate-500">Kejadian Bulan Ini</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 bottom-0 w-1 bg-[#f2af3e]" />
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
            <span>Izin / Cuti & Alpa</span>
            <XCircle className="w-4 h-4 text-[#a8281c]" />
          </div>
          <div className="flex items-baseline gap-3">
            <div>
              <span className="text-2xl font-bold text-[#102e50] tabular-nums">
                {orgStats.totalLeave}
              </span>
              <span className="text-xs text-slate-500 ml-1">Cuti</span>
            </div>
            <span className="text-slate-300">•</span>
            <div>
              <span className="text-2xl font-bold text-[#a8281c] tabular-nums">
                {orgStats.totalAbsent}
              </span>
              <span className="text-xs text-slate-500 ml-1">Alpa</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Interactive Filter & Mode Switcher Toolbar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 text-xs">
        {/* Left: Search & Filters */}
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 flex-1">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={
                isTeamView ? "Cari nama anggota tim atau NIP..." : "Cari nama pegawai atau NIP..."
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleFilter()}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white text-xs focus:ring-2 focus:ring-[#102e50] focus:outline-none transition-colors"
            />
          </div>

          {/* Month & Year Selectors */}
          <div className="flex items-center gap-2">
            <div className="relative flex items-center">
              <Calendar className="w-3.5 h-3.5 text-[#f2af3e] absolute left-3 pointer-events-none" />
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-[#102e50] focus:ring-2 focus:ring-[#102e50] focus:outline-none cursor-pointer"
              >
                {months.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-[#102e50] focus:ring-2 focus:ring-[#102e50] focus:outline-none cursor-pointer"
            >
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
            </select>
          </div>

          {/* Department Selector */}
          {isTeamView ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#102e50]/5 border border-[#102e50]/15 text-xs text-[#102e50] font-semibold">
              <Building className="w-3.5 h-3.5 text-[#f2af3e]" />
              <span>{departmentName || "Divisi Saya"}</span>
            </div>
          ) : (
            <div className="relative flex items-center">
              <Building className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
              <select
                value={dept}
                onChange={(e) => setDept(e.target.value)}
                className="pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-[#102e50] focus:ring-2 focus:ring-[#102e50] focus:outline-none cursor-pointer max-w-[200px] truncate"
              >
                <option value="ALL">Semua Divisi</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Filter Action Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleFilter}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#102e50] text-white hover:bg-[#0b223c] font-semibold transition-all shadow-xs cursor-pointer active:scale-[0.98]"
            >
              <Filter className="w-3.5 h-3.5 text-[#f2af3e]" />
              <span>Terapkan</span>
            </button>

            {(searchQuery || selectedDeptId !== "ALL") && (
              <button
                type="button"
                onClick={handleResetFilter}
                className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-[#102e50] hover:bg-slate-50 transition-colors cursor-pointer"
                title="Reset Filter"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Right: View Switcher (Matrix vs Summary) & Export XLSX */}
        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2.5 pt-3 xl:pt-0 border-t xl:border-t-0 border-slate-100">
          <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200/80">
            <button
              type="button"
              onClick={() => setViewMode("matrix")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === "matrix"
                  ? "bg-white text-[#102e50] shadow-xs"
                  : "text-slate-600 hover:text-[#102e50]"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 text-[#0874aa]" />
              <span>Matriks 1–{daysInMonth.length}</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("summary")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === "summary"
                  ? "bg-white text-[#102e50] shadow-xs"
                  : "text-slate-600 hover:text-[#102e50]"
              }`}
            >
              <Table2 className="w-3.5 h-3.5 text-[#f2af3e]" />
              <span>Ringkasan Angka</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleExportXlsx}
            disabled={employees.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#f2af3e] text-[#102e50] hover:bg-[#e5a02d] transition-all cursor-pointer shadow-xs disabled:opacity-50 active:scale-[0.98]"
            title="Unduh rekapitulasi presensi dalam format Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#102e50]" />
            <span>Ekspor Rekap (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* 3. Main Data Container */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Table Header Bar & Legend */}
        <div className="px-5 py-4 border-b border-slate-200/80 flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-[#102e50] font-heading">
              {viewMode === "matrix"
                ? `Matriks Kalender Kehadiran — ${activeMonthLabel} ${currentYear}`
                : `Tabel Ringkasan Kehadiran — ${activeMonthLabel} ${currentYear}`}
            </span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#102e50]/5 text-[#102e50] border border-[#102e50]/15">
              {employees.length} Pegawai
            </span>
          </div>

          {/* Status Legend */}
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-4 h-4 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center justify-center">
                H
              </span>
              <span>Hadir</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-4 h-4 rounded text-[9px] font-bold bg-[#df632f]/15 text-[#df632f] border border-[#df632f]/30 inline-flex items-center justify-center">
                T
              </span>
              <span>Terlambat</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-4 h-4 rounded text-[9px] font-bold bg-[#0874aa]/15 text-[#0874aa] border border-[#0874aa]/30 inline-flex items-center justify-center">
                W
              </span>
              <span>WFH</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-4 h-4 rounded text-[9px] font-bold bg-[#f2af3e]/20 text-[#8e2d3f] border border-[#f2af3e]/40 inline-flex items-center justify-center">
                C
              </span>
              <span>Cuti/Izin</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-4 h-4 rounded text-[9px] font-bold bg-[#a8281c]/15 text-[#a8281c] border border-[#a8281c]/30 inline-flex items-center justify-center">
                A
              </span>
              <span>Alpa</span>
            </span>
          </div>
        </div>

        {/* View Mode 1: 1-31 Day Calendar Matrix */}
        {viewMode === "matrix" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200/80 text-[#102e50] font-bold text-[10px]">
                  <th className="py-3 px-4 sticky left-0 z-20 bg-slate-50 border-r border-slate-200/80 min-w-[200px] uppercase tracking-wider">
                    Nama Pegawai
                  </th>
                  {daysInMonth.map((d) => (
                    <th
                      key={d.dayNumber}
                      className={`py-2 px-1 text-center min-w-[32px] border-r border-slate-100 ${
                        d.isWeekend ? "bg-slate-100/80 text-slate-400" : "text-[#102e50]"
                      }`}
                    >
                      <div className="flex flex-col items-center leading-tight">
                        <span className="text-[9px] font-normal uppercase">{d.dayShort}</span>
                        <span className="text-[11px] font-bold">{d.dayNumber}</span>
                      </div>
                    </th>
                  ))}
                  <th className="py-3 px-3 text-center bg-emerald-50/50 text-emerald-800 border-l border-slate-200/80">
                    H
                  </th>
                  <th className="py-3 px-3 text-center bg-[#df632f]/5 text-[#df632f]">T</th>
                  <th className="py-3 px-3 text-center bg-[#f2af3e]/10 text-[#8e2d3f]">C</th>
                  <th className="py-3 px-3 text-center bg-[#a8281c]/5 text-[#a8281c]">A</th>
                  {isHrOrAdmin && (
                    <th className="py-3 px-4 text-right border-l border-slate-200/80 uppercase tracking-wider">
                      Aksi
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {employees.length === 0 ? (
                  <tr>
                    <td
                      colSpan={daysInMonth.length + (isHrOrAdmin ? 6 : 5)}
                      className="py-12 text-center text-slate-500"
                    >
                      Tidak ada data pegawai yang sesuai dengan filter pencarian.
                    </td>
                  </tr>
                ) : (
                  employees.map((emp) => {
                    const empDays = dailyMap.get(emp.id);
                    const stat = statsMap.get(emp.id) || {
                      present: 0,
                      late: 0,
                      leave: 0,
                      absent: 0,
                      wfh: 0,
                      totalDays: 0,
                    };

                    return (
                      <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* Sticky Employee Name Cell */}
                        <td className="py-3 px-4 sticky left-0 z-10 bg-white border-r border-slate-200/80">
                          <div className="flex flex-col">
                            <span className="font-bold text-[#102e50] truncate max-w-[180px]">
                              {emp.fullName}
                            </span>
                            <span className="text-[10px] text-slate-400 truncate max-w-[180px]">
                              {emp.currentDepartment?.name || "PSPK"} • {emp.employeeNo}
                            </span>
                          </div>
                        </td>

                        {/* Day 1..31 Cells */}
                        {daysInMonth.map((d) => {
                          const rec = empDays?.get(d.dayNumber);
                          return (
                            <td
                              key={d.dayNumber}
                              onClick={() => {
                                if (isHrOrAdmin) {
                                  setSelectedForCorrection({
                                    id: emp.id,
                                    fullName: emp.fullName,
                                    employeeNo: emp.employeeNo,
                                    initialDate: d.dateStr,
                                  });
                                }
                              }}
                              title={
                                isHrOrAdmin
                                  ? `Klik untuk koreksi presensi ${emp.fullName} (${d.dateStr})`
                                  : `${emp.fullName} (${d.dateStr})`
                              }
                              className={`p-1 text-center border-r border-slate-100/80 group ${
                                d.isWeekend ? "bg-slate-50/70" : ""
                              } ${isHrOrAdmin ? "cursor-pointer hover:bg-[#102e50]/5" : ""}`}
                            >
                              {renderMatrixCell(rec, d.isWeekend)}
                            </td>
                          );
                        })}

                        {/* Totals Columns */}
                        <td className="py-3 px-2.5 text-center font-bold text-emerald-700 bg-emerald-50/20 border-l border-slate-200/80 tabular-nums">
                          {stat.present}
                        </td>
                        <td className="py-3 px-2.5 text-center font-bold text-[#df632f] bg-[#df632f]/5 tabular-nums">
                          {stat.late}
                        </td>
                        <td className="py-3 px-2.5 text-center font-bold text-[#8e2d3f] bg-[#f2af3e]/5 tabular-nums">
                          {stat.leave}
                        </td>
                        <td className="py-3 px-2.5 text-center font-bold text-[#a8281c] bg-[#a8281c]/5 tabular-nums">
                          {stat.absent}
                        </td>

                        {isHrOrAdmin && (
                          <td className="py-3 px-4 text-right border-l border-slate-200/80 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedForCorrection({
                                  id: emp.id,
                                  fullName: emp.fullName,
                                  employeeNo: emp.employeeNo,
                                })
                              }
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 hover:border-[#102e50] hover:bg-[#102e50]/5 text-[#102e50] text-[11px] font-semibold transition-all cursor-pointer"
                            >
                              <Edit3 className="w-3 h-3 text-[#f2af3e]" />
                              <span>Koreksi</span>
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* View Mode 2: Clean Summary Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200/80 text-[#102e50] uppercase tracking-wider font-bold text-[11px]">
                  <th className="py-3.5 px-5">Pegawai</th>
                  <th className="py-3.5 px-4">Divisi & Posisi</th>
                  <th className="py-3.5 px-4 text-center">Hadir Tepat</th>
                  <th className="py-3.5 px-4 text-center">Terlambat</th>
                  <th className="py-3.5 px-4 text-center">Izin / Cuti</th>
                  <th className="py-3.5 px-4 text-center">Alpa</th>
                  <th className="py-3.5 px-4 text-center">Total Terekam</th>
                  {isHrOrAdmin && <th className="py-3.5 px-5 text-right">Aksi HR</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {employees.length === 0 ? (
                  <tr>
                    <td colSpan={isHrOrAdmin ? 8 : 7} className="py-12 text-center text-slate-500">
                      Tidak ada data pegawai yang sesuai dengan filter pencarian.
                    </td>
                  </tr>
                ) : (
                  employees.map((emp) => {
                    const stat = statsMap.get(emp.id) || {
                      present: 0,
                      late: 0,
                      leave: 0,
                      absent: 0,
                      wfh: 0,
                      totalDays: 0,
                    };

                    return (
                      <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-5">
                          <div className="flex flex-col">
                            <span className="font-bold text-[#102e50]">{emp.fullName}</span>
                            <span className="text-[11px] font-mono text-slate-400">
                              {emp.employeeNo}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          <div className="flex flex-col">
                            <span className="font-medium text-[#102e50]">
                              {emp.currentPosition?.title || "Staf"}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {emp.currentDepartment?.name || "PSPK"}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex min-w-[28px] justify-center px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 tabular-nums">
                            {stat.present}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex min-w-[28px] justify-center px-2 py-0.5 rounded-full font-bold bg-[#df632f]/10 text-[#df632f] border border-[#df632f]/25 tabular-nums">
                            {stat.late}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex min-w-[28px] justify-center px-2 py-0.5 rounded-full font-bold bg-[#f2af3e]/15 text-[#8e2d3f] border border-[#f2af3e]/40 tabular-nums">
                            {stat.leave}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex min-w-[28px] justify-center px-2 py-0.5 rounded-full font-bold bg-[#a8281c]/10 text-[#a8281c] border border-[#a8281c]/25 tabular-nums">
                            {stat.absent}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-[#102e50] tabular-nums">
                          {stat.totalDays} Hari
                        </td>
                        {isHrOrAdmin && (
                          <td className="py-3.5 px-5 text-right">
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedForCorrection({
                                  id: emp.id,
                                  fullName: emp.fullName,
                                  employeeNo: emp.employeeNo,
                                })
                              }
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-[#102e50] hover:bg-[#102e50]/5 text-[#102e50] text-xs font-semibold transition-all cursor-pointer active:scale-[0.98]"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-[#f2af3e]" />
                              <span>Koreksi</span>
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Render Correction Modal if selected */}
      {selectedForCorrection && (
        <AttendanceCorrectionModal
          isOpen={!!selectedForCorrection}
          onClose={() => setSelectedForCorrection(null)}
          employee={selectedForCorrection}
          initialDate={selectedForCorrection.initialDate}
        />
      )}
    </div>
  );
}