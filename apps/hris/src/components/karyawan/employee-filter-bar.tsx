"use client";

import React, { useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, RotateCcw, Filter } from "lucide-react";

interface DepartmentOption {
  id: string;
  name: string;
}

interface EmployeeFilterBarProps {
  departments: DepartmentOption[];
  currentSearch?: string;
  currentDepartmentId?: string;
  currentStatus?: string;
  currentType?: string;
}

export function EmployeeFilterBar({
  departments,
  currentSearch = "",
  currentDepartmentId = "ALL",
  currentStatus = "ALL",
  currentType = "ALL",
}: EmployeeFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [searchTerm, setSearchTerm] = React.useState(currentSearch);

  const applyFilters = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (!value || value === "ALL") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    // Reset to page 1 when filtering
    params.delete("page");

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters({ search: searchTerm.trim() });
  };

  const handleReset = () => {
    setSearchTerm("");
    startTransition(() => {
      router.push(pathname);
    });
  };

  const hasActiveFilters =
    Boolean(searchParams.get("search")) ||
    Boolean(searchParams.get("dept")) ||
    Boolean(searchParams.get("status")) ||
    Boolean(searchParams.get("type")) ||
    Boolean(searchParams.get("expiring"));

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-xs flex flex-col gap-3">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari berdasarkan nama, NIP, atau email pegawai..."
            className="w-full pl-10 pr-20 py-2 text-sm bg-slate-50/70 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#102E50] focus:border-transparent transition-all"
          />
          <button
            type="submit"
            disabled={isPending}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 bg-[#102E50] text-white text-xs font-semibold rounded-md hover:bg-[#0c233d] transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50"
          >
            {isPending ? "Mencari..." : "Cari"}
          </button>
        </form>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold pl-1 pr-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Filter:</span>
          </div>

          {/* Department Filter */}
          <select
            value={currentDepartmentId || "ALL"}
            onChange={(e) => applyFilters({ dept: e.target.value })}
            className="text-xs bg-slate-50/70 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#102E50] font-medium"
          >
            <option value="ALL">Semua Divisi / Departemen</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={currentStatus || "ALL"}
            onChange={(e) => applyFilters({ status: e.target.value })}
            className="text-xs bg-slate-50/70 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#102E50] font-medium"
          >
            <option value="ALL">Semua Status</option>
            <option value="ACTIVE">Aktif</option>
            <option value="PROBATION">Masa Percobaan</option>
            <option value="ON_LEAVE">Sedang Cuti</option>
            <option value="RESIGNED">Mengundurkan Diri</option>
            <option value="TERMINATED">Nonaktif / Berhenti</option>
          </select>

          {/* Contract Type Filter */}
          <select
            value={currentType || "ALL"}
            onChange={(e) => applyFilters({ type: e.target.value })}
            className="text-xs bg-slate-50/70 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#102E50] font-medium"
          >
            <option value="ALL">Semua Tipe Kontrak</option>
            <option value="PERMANENT">Pegawai Tetap</option>
            <option value="FIXED_TERM">PKWT Riset</option>
            <option value="PART_TIME_PROJECT">Proyek / Paruh Waktu</option>
          </select>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1 px-2.5 py-2 text-xs font-semibold text-[#A8281C] hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
              title="Reset semua filter"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
