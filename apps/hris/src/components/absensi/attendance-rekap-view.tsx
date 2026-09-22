"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Filter, Edit3, Users, Building, Calendar } from "lucide-react";
import { AttendanceCorrectionModal } from "./attendance-correction-modal";

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
}

export function AttendanceRekapView({
  employees,
  attendances,
  departments,
  currentYear,
  currentMonth,
  selectedDeptId = "ALL",
  searchQuery = "",
}: AttendanceRekapViewProps) {
  const router = useRouter();
  const [search, setSearch] = useState(searchQuery);
  const [dept, setDept] = useState(selectedDeptId);
  const [month, setMonth] = useState(String(currentMonth));
  const [year, setYear] = useState(String(currentYear));

  // Selected employee for correction modal
  const [selectedForCorrection, setSelectedForCorrection] = useState<{
    id: string;
    fullName: string;
    employeeNo: string;
  } | null>(null);

  const handleFilter = () => {
    const params = new URLSearchParams();
    if (month) params.set("month", month);
    if (year) params.set("year", year);
    if (dept && dept !== "ALL") params.set("dept", dept);
    if (search.trim()) params.set("search", search.trim());

    router.push(`/absensi/rekap?${params.toString()}`);
  };

  // Compute attendance stats map per employee for this month
  const statsMap = new Map<
    string,
    { present: number; late: number; leave: number; absent: number; totalDays: number }
  >();

  for (const emp of employees) {
    statsMap.set(emp.id, { present: 0, late: 0, leave: 0, absent: 0, totalDays: 0 });
  }

  for (const a of attendances) {
    const stat = statsMap.get(a.employeeId);
    if (stat) {
      stat.totalDays++;
      if (a.status === "PRESENT") stat.present++;
      else if (a.status === "LATE") stat.late++;
      else if (a.status === "LEAVE") stat.leave++;
      else if (a.status === "ABSENT") stat.absent++;
    }
  }

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

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-[#dee9fc] shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama pegawai atau NIP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleFilter()}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 bg-white text-xs focus:ring-2 focus:ring-[#102e50] focus:outline-none"
          />
        </div>

        {/* Dropdowns: Month, Year, Department */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="px-2.5 py-2 rounded-lg border border-slate-300 bg-white text-xs focus:ring-2 focus:ring-[#102e50] focus:outline-none cursor-pointer"
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
            className="px-2.5 py-2 rounded-lg border border-slate-300 bg-white text-xs focus:ring-2 focus:ring-[#102e50] focus:outline-none cursor-pointer"
          >
            <option value="2026">2026</option>
            <option value="2025">2025</option>
          </select>

          <div className="flex items-center gap-1.5">
            <Building className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={dept}
              onChange={(e) => setDept(e.target.value)}
              className="px-2.5 py-2 rounded-lg border border-slate-300 bg-white text-xs focus:ring-2 focus:ring-[#102e50] focus:outline-none cursor-pointer max-w-[180px] truncate"
            >
              <option value="ALL">Semua Divisi</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleFilter}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#102e50] text-white hover:bg-[#0c233d] font-semibold transition-all shadow-xs cursor-pointer active:scale-[0.98]"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Terapkan</span>
          </button>
        </div>
      </div>

      {/* Rekap Table */}
      <div className="bg-white rounded-xl border border-[#dee9fc] shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#dee9fc] flex items-center justify-between bg-[#eff4ff]/40">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#102e50]" />
            <span className="font-bold text-xs text-[#102e50]">
              Rekapitulasi Kehadiran: {employees.length} Pegawai Terdata
            </span>
          </div>
          <span className="text-[11px] text-[#5b6675]">
            Periode: {months.find((m) => m.value === month)?.label} {year}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[#5b6675] uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Pegawai</th>
                <th className="py-3 px-4">Divisi & Posisi</th>
                <th className="py-3 px-4 text-center">Hadir Tepat</th>
                <th className="py-3 px-4 text-center">Terlambat</th>
                <th className="py-3 px-4 text-center">Cuti</th>
                <th className="py-3 px-4 text-center">Alpa</th>
                <th className="py-3 px-4 text-center">Total Hari</th>
                <th className="py-3 px-4 text-right">Aksi HR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[#121c2a]">
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
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
                    totalDays: 0,
                  };

                  return (
                    <tr key={emp.id} className="hover:bg-[#f8f9ff] transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-[#102e50]">{emp.fullName}</span>
                          <span className="text-[11px] font-mono text-slate-500">{emp.employeeNo}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="flex flex-col">
                          <span>{emp.currentPosition?.title || "Staff"}</span>
                          <span className="text-[11px] text-slate-400">{emp.currentDepartment?.name || "PSPK"}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700">
                          {stat.present}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full font-bold bg-amber-50 text-amber-800">
                          {stat.late}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full font-bold bg-blue-50 text-blue-700">
                          {stat.leave}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full font-bold bg-red-50 text-[#A8281C]">
                          {stat.absent}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                        {stat.totalDays} Hari
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedForCorrection({
                            id: emp.id,
                            fullName: emp.fullName,
                            employeeNo: emp.employeeNo,
                          })}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-300 hover:border-[#102e50] hover:bg-[#eff4ff] text-[#102e50] text-xs font-semibold transition-all cursor-pointer active:scale-[0.98]"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Koreksi</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Render Correction Modal if selected */}
      {selectedForCorrection && (
        <AttendanceCorrectionModal
          isOpen={!!selectedForCorrection}
          onClose={() => setSelectedForCorrection(null)}
          employee={selectedForCorrection}
        />
      )}
    </div>
  );
}
