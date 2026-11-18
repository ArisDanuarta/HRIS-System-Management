"use client";

import React, { useState, useTransition } from "react";
import { formatDate } from "@pspk/shared";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  CalendarOff,
  Loader2,
  CalendarDays,
  AlertCircle,
  FileText,
} from "lucide-react";
import {
  EmployeeMonthlyAttendanceOverview,
  EmployeeMonthlyAttendanceRecord,
  MONTH_NAMES_ID,
} from "@/server/queries/attendance.queries";
import { getEmployeeMonthlyAttendanceAction } from "@/server/actions/attendance.actions";

export interface EmployeeAttendanceTabProps {
  employeeId: string;
  employeeName: string;
  initialData: EmployeeMonthlyAttendanceOverview;
}

const DAY_NAMES_ID = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

export function EmployeeAttendanceTab({
  employeeId,
  employeeName,
  initialData,
}: EmployeeAttendanceTabProps) {
  const [data, setData] = useState<EmployeeMonthlyAttendanceOverview>(initialData);
  const [selectedYear, setSelectedYear] = useState<number>(initialData.period.year);
  const [selectedMonth, setSelectedMonth] = useState<number>(initialData.period.month);
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Month navigation handlers
  const handleMonthChange = (newYear: number, newMonth: number) => {
    let targetYear = newYear;
    let targetMonth = newMonth;

    if (newMonth < 1) {
      targetMonth = 12;
      targetYear -= 1;
    } else if (newMonth > 12) {
      targetMonth = 1;
      targetYear += 1;
    }

    setSelectedYear(targetYear);
    setSelectedMonth(targetMonth);
    setErrorMessage(null);

    startTransition(async () => {
      const res = await getEmployeeMonthlyAttendanceAction(employeeId, targetYear, targetMonth);
      if (res.ok && res.data) {
        setData(res.data);
      } else {
        setErrorMessage(res.error || "Gagal memuat rekap absensi untuk bulan yang dipilih.");
      }
    });
  };

  const handleResetToCurrentMonth = () => {
    const now = new Date();
    handleMonthChange(now.getFullYear(), now.getMonth() + 1);
  };

  // Map attendances by dayNumber for calendar grid lookup
  const attendanceMap = new Map<number, EmployeeMonthlyAttendanceRecord>();
  for (const a of data.attendances) {
    attendanceMap.set(a.dayNumber, a);
  }

  // Map holidays by day of month
  const holidayMap = new Map<number, { name: string; isCollectiveLeave: boolean }>();
  for (const h of data.holidays) {
    const hDate = new Date(h.date);
    holidayMap.set(hDate.getUTCDate(), {
      name: h.name,
      isCollectiveLeave: h.isCollectiveLeave,
    });
  }

  // Calculate calendar grid cells
  // First day of month (Monday=0 ... Sunday=6)
  const firstDayOfMonth = new Date(Date.UTC(selectedYear, selectedMonth - 1, 1));
  const rawDayOfWeek = firstDayOfMonth.getUTCDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const startOffset = (rawDayOfWeek + 6) % 7; // Convert to Mon=0 ... Sun=6
  const totalDays = data.period.daysInMonth;

  const today = new Date();
  const isCurrentMonthView =
    today.getFullYear() === selectedYear && today.getMonth() + 1 === selectedMonth;
  const currentDayNumber = today.getDate();

  return (
    <div className="flex flex-col gap-6 w-full min-w-0 max-w-full">
      {/* 1. Bilah Kontrol Periode Bulan/Tahun (Mobile Swipe & Tap Friendly) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#102E50]/10 text-[#102E50] flex items-center justify-center shrink-0">
            <CalendarDays className="w-5 h-5 text-[#102E50]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm sm:text-base text-[#102E50] font-heading">
                Rekapitulasi Presensi & Cuti
              </h3>
              {isPending && <Loader2 className="w-4 h-4 text-[#F2AF3E] animate-spin" />}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Periode {data.period.monthName} {data.period.year} • {data.stats.workingDaysCount} hari
              kerja efektif
            </p>
          </div>
        </div>

        {/* Kontrol Navigasi Bulan */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <div className="inline-flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
            <button
              type="button"
              onClick={() => handleMonthChange(selectedYear, selectedMonth - 1)}
              disabled={isPending}
              aria-label="Bulan Sebelumnya"
              className="p-1.5 rounded-lg hover:bg-white text-slate-600 hover:text-[#102E50] transition-colors cursor-pointer disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Selector Bulan & Tahun */}
            <div className="flex items-center gap-1 px-2 text-xs font-bold text-slate-800">
              <select
                value={selectedMonth}
                onChange={(e) => handleMonthChange(selectedYear, Number(e.target.value))}
                disabled={isPending}
                className="bg-transparent border-none text-xs font-bold text-[#102E50] focus:outline-hidden cursor-pointer"
              >
                {MONTH_NAMES_ID.map((name, idx) => (
                  <option key={name} value={idx + 1}>
                    {name}
                  </option>
                ))}
              </select>

              <select
                value={selectedYear}
                onChange={(e) => handleMonthChange(Number(e.target.value), selectedMonth)}
                disabled={isPending}
                className="bg-transparent border-none text-xs font-bold text-[#102E50] focus:outline-hidden cursor-pointer"
              >
                {Array.from({ length: 7 }, (_, i) => selectedYear - 3 + i).map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => handleMonthChange(selectedYear, selectedMonth + 1)}
              disabled={isPending}
              aria-label="Bulan Berikutnya"
              className="p-1.5 rounded-lg hover:bg-white text-slate-600 hover:text-[#102E50] transition-colors cursor-pointer disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleResetToCurrentMonth}
            disabled={isPending || isCurrentMonthView}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-40 cursor-pointer shadow-2xs"
          >
            Bulan Ini
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-[#A8281C] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 2. Kartu Statistik Kehadiran Bulanan (Grid Responsif 2-col di mobile, 4-col di tablet/desktop) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 w-full">
        {/* Stat 1: Tingkat Kehadiran */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-xs flex flex-col justify-between">
          <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">
            Kehadiran
          </span>
          <div className="mt-1.5">
            <span className="text-xl sm:text-2xl font-bold font-heading text-[#102E50]">
              {data.stats.attendanceRate}%
            </span>
            <span className="text-[10px] text-slate-500 block truncate">
              {data.stats.presentCount + data.stats.wfhCount}/{data.stats.workingDaysCount} hari
            </span>
          </div>
        </div>

        {/* Stat 2: Tepat Waktu */}
        <div className="bg-white rounded-2xl border border-emerald-200/80 bg-emerald-50/30 p-3.5 shadow-xs flex flex-col justify-between">
          <span className="text-[10.5px] font-bold text-emerald-800 uppercase tracking-wider">
            Tepat Waktu
          </span>
          <div className="mt-1.5">
            <span className="text-xl sm:text-2xl font-bold font-heading text-emerald-700">
              {data.stats.presentCount}
            </span>
            <span className="text-[10px] text-emerald-600 block truncate">Hari kerja di kantor</span>
          </div>
        </div>

        {/* Stat 3: Terlambat */}
        <div className="bg-white rounded-2xl border border-amber-200/80 bg-amber-50/30 p-3.5 shadow-xs flex flex-col justify-between">
          <span className="text-[10.5px] font-bold text-amber-800 uppercase tracking-wider">
            Terlambat
          </span>
          <div className="mt-1.5">
            <span className="text-xl sm:text-2xl font-bold font-heading text-amber-700">
              {data.stats.lateCount}
            </span>
            <span className="text-[10px] text-amber-600 block truncate">Melebihi toleransi</span>
          </div>
        </div>

        {/* Stat 4: WFH */}
        <div className="bg-white rounded-2xl border border-blue-200/80 bg-blue-50/30 p-3.5 shadow-xs flex flex-col justify-between">
          <span className="text-[10.5px] font-bold text-blue-800 uppercase tracking-wider">
            WFH / Remote
          </span>
          <div className="mt-1.5">
            <span className="text-xl sm:text-2xl font-bold font-heading text-blue-700">
              {data.stats.wfhCount}
            </span>
            <span className="text-[10px] text-blue-600 block truncate">Bekerja dari rumah</span>
          </div>
        </div>

        {/* Stat 5: Izin / Cuti */}
        <div className="bg-white rounded-2xl border border-purple-200/80 bg-purple-50/30 p-3.5 shadow-xs flex flex-col justify-between">
          <span className="text-[10.5px] font-bold text-purple-800 uppercase tracking-wider">
            Cuti & Izin
          </span>
          <div className="mt-1.5">
            <span className="text-xl sm:text-2xl font-bold font-heading text-purple-700">
              {data.stats.leaveCount}
            </span>
            <span className="text-[10px] text-purple-600 block truncate">Hari cuti terpakai</span>
          </div>
        </div>

        {/* Stat 6: Alpha / Total Jam */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-xs flex flex-col justify-between">
          <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">
            {data.stats.timesheetTotalHours > 0 ? "Jam Timesheet" : "Total Durasi"}
          </span>
          <div className="mt-1.5">
            <span className="text-xl sm:text-2xl font-bold font-heading text-slate-800">
              {data.stats.timesheetTotalHours > 0
                ? `${data.stats.timesheetTotalHours}j`
                : `${data.stats.totalWorkHours}j`}
            </span>
            <span className="text-[10px] text-slate-500 block truncate">
              {data.stats.timesheetTotalHours > 0
                ? "Disetujui manajer"
                : `${data.stats.recordedDays} hari tercatat`}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Grid Kalender Bulanan Presensi (7-Kolom Responsif) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-6 shadow-xs flex flex-col gap-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#102E50]" />
            <h3 className="font-bold text-sm text-[#102E50] font-heading">
              Visual Kalender Presensi ({data.period.monthName} {data.period.year})
            </h3>
          </div>

          {/* Legenda Warna Kalender */}
          <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
              <span>Hadir</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
              <span>Telat</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
              <span>WFH</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0" />
              <span>Cuti</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
              <span>Alpha</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400 shrink-0" />
              <span>Libur</span>
            </div>
          </div>
        </div>

        {/* Header Nama Hari */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-xs font-bold text-slate-400 uppercase tracking-wider pb-1">
          {DAY_NAMES_ID.map((day, idx) => (
            <div
              key={day}
              className={`py-1 ${idx >= 5 ? "text-rose-500 font-extrabold" : "text-slate-600"}`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Grid Sel Kalender (Responsif, Touch-friendly) */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {/* Sel Kosong Bulan Sebelumnya */}
          {Array.from({ length: startOffset }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="min-h-[58px] sm:min-h-[72px] rounded-xl bg-slate-50/50 border border-transparent opacity-40"
            />
          ))}

          {/* Sel Hari Bulan Aktif */}
          {Array.from({ length: totalDays }, (_, i) => i + 1).map((dayNum) => {
            const att = attendanceMap.get(dayNum);
            const holiday = holidayMap.get(dayNum);
            const isToday = isCurrentMonthView && dayNum === currentDayNumber;

            // Day of week (0=Mon, ..., 6=Sun)
            const cellDate = new Date(Date.UTC(selectedYear, selectedMonth - 1, dayNum));
            const dayOfWeek = (cellDate.getUTCDay() + 6) % 7;
            const isWeekend = dayOfWeek >= 5;

            // Style determination
            let cellBg = "bg-white hover:bg-slate-50/80 border-slate-200/70";
            let statusBadge = null;

            if (holiday) {
              cellBg = "bg-red-50/70 border-red-200/80 text-red-900";
              statusBadge = (
                <span className="text-[9.5px] font-bold text-red-700 truncate block">
                  {holiday.name}
                </span>
              );
            } else if (att) {
              if (att.status === "PRESENT") {
                cellBg = "bg-emerald-50/50 border-emerald-200/90 text-emerald-950";
                statusBadge = (
                  <span className="text-[9.5px] font-bold text-emerald-700">Hadir</span>
                );
              } else if (att.status === "LATE") {
                cellBg = "bg-amber-50/50 border-amber-200/90 text-amber-950";
                statusBadge = (
                  <span className="text-[9.5px] font-bold text-amber-700">Telat</span>
                );
              } else if (att.status === "WFH") {
                cellBg = "bg-blue-50/50 border-blue-200/90 text-blue-950";
                statusBadge = (
                  <span className="text-[9.5px] font-bold text-blue-700">WFH</span>
                );
              } else if (att.status === "LEAVE") {
                cellBg = "bg-purple-50/50 border-purple-200/90 text-purple-950";
                statusBadge = (
                  <span className="text-[9.5px] font-bold text-purple-700">Cuti</span>
                );
              } else if (att.status === "ABSENT") {
                cellBg = "bg-rose-50/60 border-rose-200/90 text-rose-950";
                statusBadge = (
                  <span className="text-[9.5px] font-bold text-rose-700">Alpha</span>
                );
              }
            } else if (isWeekend) {
              cellBg = "bg-slate-50/80 border-slate-200/60 text-slate-400";
            }

            return (
              <div
                key={`day-${dayNum}`}
                className={`min-h-[58px] sm:min-h-[72px] p-1.5 sm:p-2 rounded-xl border flex flex-col justify-between transition-all ${cellBg} ${
                  isToday ? "ring-2 ring-[#102E50] ring-offset-1 font-bold shadow-xs" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-mono font-bold ${
                      isWeekend ? "text-rose-600" : isToday ? "text-[#102E50]" : "text-slate-700"
                    }`}
                  >
                    {dayNum}
                  </span>
                  {isToday && (
                    <span className="text-[8.5px] font-extrabold uppercase px-1 rounded bg-[#102E50] text-white">
                      Hari Ini
                    </span>
                  )}
                </div>

                <div className="mt-auto min-w-0">
                  {statusBadge}
                  {att?.checkInAt && (
                    <span className="text-[9px] font-mono text-slate-500 block truncate">
                      {new Date(att.checkInAt).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZone: "Asia/Jakarta",
                      })}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Tabel Log Presensi Harian Lengkap (Mobile-Optimized Horizontal Scroll) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-6 shadow-xs flex flex-col gap-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#102E50]" />
            <h3 className="font-bold text-sm text-[#102E50] font-heading">
              Rincian Log Kehadiran Harian ({data.attendances.length} Rekam)
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Total jam kerja tercatat: <strong>{data.stats.totalWorkHours} Jam</strong>
          </span>
        </div>

        {data.attendances.length === 0 ? (
          <div className="text-center py-10 text-xs text-slate-400 italic bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
            Tidak ada catatan log kehadiran pada bulan {data.period.monthName} {data.period.year}.
          </div>
        ) : (
          <div className="w-full overflow-x-auto scrollbar-none [overscroll-behavior-x:contain]">
            <table className="w-full text-left text-xs border-collapse min-w-[720px]">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200/80 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-3">Tanggal</th>
                  <th className="py-2.5 px-3">Jam Masuk</th>
                  <th className="py-2.5 px-3">Jam Pulang</th>
                  <th className="py-2.5 px-3 text-center">Durasi</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Sumber</th>
                  <th className="py-2.5 px-3">Catatan / Koreksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {data.attendances.map((a) => {
                  const checkInStr = a.checkInAt
                    ? new Date(a.checkInAt).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZone: "Asia/Jakarta",
                      })
                    : "-";
                  const checkOutStr = a.checkOutAt
                    ? new Date(a.checkOutAt).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZone: "Asia/Jakarta",
                      })
                    : "-";

                  return (
                    <tr key={a.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-slate-800 whitespace-nowrap">
                        {formatDate(a.date)}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-700">{checkInStr}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-700">{checkOutStr}</td>
                      <td className="py-2.5 px-3 text-center font-mono font-medium text-slate-600">
                        {a.workDurationFormatted}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            a.status === "PRESENT"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : a.status === "LATE"
                                ? "bg-amber-50 text-amber-800 border-amber-200"
                                : a.status === "WFH"
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : a.status === "LEAVE"
                                    ? "bg-purple-50 text-purple-700 border-purple-200"
                                    : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}
                        >
                          {a.status === "PRESENT"
                            ? "Hadir"
                            : a.status === "LATE"
                              ? "Terlambat"
                              : a.status === "WFH"
                                ? "WFH"
                                : a.status === "LEAVE"
                                  ? "Cuti/Izin"
                                  : a.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-[11px] text-slate-500">
                        {a.source === "WEB"
                          ? "Web Portal"
                          : a.source === "MANUAL_HR"
                            ? "Koreksi HR"
                            : a.source}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 text-[11px] max-w-[220px] truncate">
                        {a.correctionReason
                          ? `Koreksi: ${a.correctionReason}`
                          : a.notes || "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Baris Saldo Cuti & Pengajuan Cuti Bulan Ini */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full min-w-0">
        {/* Tabel Saldo Kuota Cuti Tahunan */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex flex-col gap-3.5">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <CalendarOff className="w-4 h-4 text-[#102E50]" />
              <h3 className="font-bold text-sm text-[#102E50] font-heading">
                Saldo Kuota Cuti Tahun {data.period.year}
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-semibold">
              {data.leaveBalances.length} Jenis Cuti
            </span>
          </div>

          {data.leaveBalances.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-400 italic">
              Tidak ada data kuota cuti untuk tahun ini.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {data.leaveBalances.map((lb) => (
                <div key={lb.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div>
                    <span className="font-semibold text-slate-800 block">
                      {lb.leaveTypeName}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Terpakai: {lb.usedDays} hari dari {lb.quotaDays} hari kuota
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-bold text-sm font-heading text-sky-800 block">
                      {lb.remainingDays} Hari
                    </span>
                    <span className="text-[10px] text-slate-400">Sisa Kuota</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tabel Izin / Cuti yang Diambil Bulan Ini */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex flex-col gap-3.5">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#102E50]" />
              <h3 className="font-bold text-sm text-[#102E50] font-heading">
                Pengambilan Cuti Bulan Ini ({data.period.monthName})
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-semibold">
              {data.approvedLeaves.length} Pengajuan
            </span>
          </div>

          {data.approvedLeaves.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-400 italic">
              Pegawai tidak mengambil izin atau cuti pada bulan ini.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {data.approvedLeaves.map((lv) => (
                <div key={lv.id} className="py-2.5 flex items-start justify-between gap-3">
                  <div>
                    <span className="font-semibold text-slate-800 block">
                      {lv.leaveTypeName} ({lv.days} Hari)
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {formatDate(lv.startDate)} s.d. {formatDate(lv.endDate)}
                    </span>
                    {lv.reason && (
                      <span className="text-[11px] text-slate-400 block italic mt-0.5">
                        &ldquo;{lv.reason}&rdquo;
                      </span>
                    )}
                  </div>
                  <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                    Disetujui
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
