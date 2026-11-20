"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  Search,
  Check,
  X,
  UserX,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { hasDeliverableEmail } from "@/server/schemas/broadcast.schema";

export interface RecipientPickerEmployee {
  id: string;
  fullName: string;
  workEmail: string;
  departmentId: string | null;
  departmentName: string | null;
}

export interface RecipientPickerTeamMember {
  id: string;
  fullName: string;
  workEmail: string;
  positionTitle: string | null;
}

export interface RecipientPickerProps {
  targetScope: "ALL_EMPLOYEES" | "DEPARTMENT" | "TEAM" | "CUSTOM";
  departments: Array<{ id: string; name: string }>;
  employees: RecipientPickerEmployee[];
  teamMembers: RecipientPickerTeamMember[];
  senderEmployeeId: string | null;
  selectedDepartmentIds: string[];
  onChangeDepartmentIds: (ids: string[]) => void;
  selectedEmployeeIds: string[];
  onChangeEmployeeIds: (ids: string[]) => void;
  excludedEmployeeIds: string[];
  onChangeExcludedIds: (ids: string[]) => void;
}

export function RecipientPicker({
  targetScope,
  departments,
  employees,
  teamMembers,
  senderEmployeeId,
  selectedDepartmentIds,
  onChangeDepartmentIds,
  selectedEmployeeIds,
  onChangeEmployeeIds,
  excludedEmployeeIds,
  onChangeExcludedIds,
}: RecipientPickerProps) {
  // State pencarian & filter untuk target CUSTOM
  const [customSearch, setCustomSearch] = useState("");
  const [customDeptFilter, setCustomDeptFilter] = useState<string>("ALL");

  // State untuk panel pengecualian pegawai (Exclusion)
  const [showExclusionPanel, setShowExclusionPanel] = useState(
    excludedEmployeeIds.length > 0,
  );
  const [exclusionSearch, setExclusionSearch] = useState("");

  // Helper filter pegawai yang dapat dikirimi (bukan pengirim sendiri & punya email valid)
  const isDeliverable = useCallback(
    (emp: { id: string; workEmail: string }) =>
      emp.id !== senderEmployeeId && hasDeliverableEmail(emp.workEmail),
    [senderEmployeeId],
  );

  // 1. Departemen Stats (jumlah pegawai deliverable per departemen)
  const departmentCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const d of departments) {
      counts[d.id] = 0;
    }
    for (const e of employees) {
      if (e.departmentId && counts[e.departmentId] !== undefined && isDeliverable(e)) {
        counts[e.departmentId] = (counts[e.departmentId] || 0) + 1;
      }
    }
    return counts;
  }, [departments, employees, isDeliverable]);

  // Toggle pilihan departemen
  const toggleDepartment = (deptId: string) => {
    if (selectedDepartmentIds.includes(deptId)) {
      onChangeDepartmentIds(selectedDepartmentIds.filter((id) => id !== deptId));
    } else {
      onChangeDepartmentIds([...selectedDepartmentIds, deptId]);
    }
  };

  const handleSelectAllDepartments = () => {
    onChangeDepartmentIds(departments.map((d) => d.id));
  };

  const handleClearAllDepartments = () => {
    onChangeDepartmentIds([]);
  };

  // 2. Filter list untuk target CUSTOM
  const filteredCustomEmployees = useMemo(() => {
    const q = customSearch.trim().toLowerCase();
    return employees.filter((emp) => {
      if (!isDeliverable(emp)) return false;
      const matchDept =
        customDeptFilter === "ALL" || emp.departmentId === customDeptFilter;
      const matchSearch =
        q === "" ||
        emp.fullName.toLowerCase().includes(q) ||
        emp.workEmail.toLowerCase().includes(q);
      return matchDept && matchSearch;
    });
  }, [employees, customSearch, customDeptFilter, isDeliverable]);

  const customRenderLimit = 200;
  const displayedCustomEmployees = filteredCustomEmployees.slice(0, customRenderLimit);

  // Pilih / Batal Pilih seluruh hasil pencarian yang sedang tampil
  const handleToggleAllDisplayedCustom = () => {
    const displayedIds = displayedCustomEmployees.map((e) => e.id);
    const allSelected = displayedIds.every((id) => selectedEmployeeIds.includes(id));

    if (allSelected) {
      // Batalkan yang tampil
      onChangeEmployeeIds(
        selectedEmployeeIds.filter((id) => !displayedIds.includes(id)),
      );
    } else {
      // Gabungkan
      const combined = Array.from(new Set([...selectedEmployeeIds, ...displayedIds]));
      onChangeEmployeeIds(combined);
    }
  };

  const toggleCustomEmployee = (empId: string) => {
    if (selectedEmployeeIds.includes(empId)) {
      onChangeEmployeeIds(selectedEmployeeIds.filter((id) => id !== empId));
    } else {
      onChangeEmployeeIds([...selectedEmployeeIds, empId]);
    }
  };

  // 3. Pool kandidat yang dapat dikecualikan (tergantung targetScope)
  const candidateExclusionList = useMemo(() => {
    let pool: Array<{
      id: string;
      fullName: string;
      workEmail: string;
      meta?: string | null;
    }> = [];

    if (targetScope === "TEAM") {
      pool = teamMembers
        .filter(isDeliverable)
        .map((m) => ({
          id: m.id,
          fullName: m.fullName,
          workEmail: m.workEmail,
          meta: m.positionTitle,
        }));
    } else if (targetScope === "DEPARTMENT") {
      pool = employees
        .filter((e) => isDeliverable(e) && selectedDepartmentIds.includes(e.departmentId || ""))
        .map((e) => ({
          id: e.id,
          fullName: e.fullName,
          workEmail: e.workEmail,
          meta: e.departmentName,
        }));
    } else {
      // ALL_EMPLOYEES atau CUSTOM
      pool = employees
        .filter(isDeliverable)
        .map((e) => ({
          id: e.id,
          fullName: e.fullName,
          workEmail: e.workEmail,
          meta: e.departmentName,
        }));
    }

    const q = exclusionSearch.trim().toLowerCase();
    if (!q) return pool;

    return pool.filter(
      (p) =>
        p.fullName.toLowerCase().includes(q) ||
        p.workEmail.toLowerCase().includes(q),
    );
  }, [
    targetScope,
    teamMembers,
    employees,
    selectedDepartmentIds,
    exclusionSearch,
    isDeliverable,
  ]);

  const toggleExcludeEmployee = (empId: string) => {
    if (excludedEmployeeIds.includes(empId)) {
      onChangeExcludedIds(excludedEmployeeIds.filter((id) => id !== empId));
    } else {
      onChangeExcludedIds([...excludedEmployeeIds, empId]);
    }
  };

  const removeExclusionChip = (empId: string) => {
    onChangeExcludedIds(excludedEmployeeIds.filter((id) => id !== empId));
  };

  // Resolve metadata nama untuk exclusion chips
  const excludedDetails = useMemo(() => {
    const map = new Map<string, string>();
    for (const e of employees) {
      map.set(e.id, e.fullName);
    }
    for (const t of teamMembers) {
      map.set(t.id, t.fullName);
    }
    return excludedEmployeeIds.map((id) => ({
      id,
      fullName: map.get(id) || id,
    }));
  }, [excludedEmployeeIds, employees, teamMembers]);

  return (
    <div className="space-y-4">
      {/* 1. SECTION SUB-SELECTOR DEPARTEMEN */}
      {targetScope === "DEPARTMENT" && (
        <div className="p-4 sm:p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-3.5 animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-2.5">
            <div>
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                Pilih Satu atau Beberapa Divisi / Departemen:
              </label>
              <span className="text-xs text-slate-500">
                {selectedDepartmentIds.length} dari {departments.length} divisi dipilih
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAllDepartments}
                className="text-xs font-semibold text-navy-800 hover:text-navy-900 hover:underline cursor-pointer"
              >
                Pilih Semua
              </button>
              <span className="text-slate-300">•</span>
              <button
                type="button"
                onClick={handleClearAllDepartments}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 hover:underline cursor-pointer"
              >
                Batal Semua
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {departments.map((dept) => {
              const isSelected = selectedDepartmentIds.includes(dept.id);
              const count = departmentCounts[dept.id] || 0;
              return (
                <button
                  key={dept.id}
                  type="button"
                  onClick={() => toggleDepartment(dept.id)}
                  className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? "border-navy-900 bg-navy-50/70 text-navy-950 font-semibold ring-1 ring-navy-200 shadow-2xs"
                      : "border-slate-200 bg-white hover:border-slate-300 text-slate-700"
                  }`}
                >
                  <div className="space-y-0.5 pr-2">
                    <span className="block text-xs leading-tight line-clamp-1">
                      {dept.name}
                    </span>
                    <span className="text-xs text-slate-500 font-normal">
                      {count} staf aktif
                    </span>
                  </div>
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-colors ${
                      isSelected
                        ? "bg-navy-900 border-navy-900 text-white"
                        : "border-slate-300 bg-white"
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. SECTION SUB-SELECTOR CUSTOM EMPLOYEES */}
      {targetScope === "CUSTOM" && (
        <div className="p-4 sm:p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-3.5 animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-2.5">
            <div>
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                Pilih Karyawan Penerima:
              </label>
              <span className="text-xs font-semibold text-emerald-700">
                {selectedEmployeeIds.length} karyawan terpilih
              </span>
            </div>
            <button
              type="button"
              onClick={handleToggleAllDisplayedCustom}
              className="text-xs font-semibold text-navy-800 hover:text-navy-900 hover:underline cursor-pointer self-start sm:self-auto"
            >
              {displayedCustomEmployees.every((e) => selectedEmployeeIds.includes(e.id))
                ? "Batal Pilih Hasil Tampil"
                : "Pilih Semua Hasil Tampil"}
            </button>
          </div>

          {/* Kolom Pencarian & Filter Divisi */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={customSearch}
                onChange={(e) => setCustomSearch(e.target.value)}
                placeholder="Cari nama atau email karyawan..."
                className="w-full pl-8.5 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy-600"
              />
              {customSearch && (
                <button
                  type="button"
                  onClick={() => setCustomSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <select
              value={customDeptFilter}
              onChange={(e) => setCustomDeptFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy-600 text-slate-700 font-medium"
            >
              <option value="ALL">Semua Divisi</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* List Karyawan Scrollable */}
          <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl bg-white p-2 divide-y divide-slate-100">
            {displayedCustomEmployees.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                Tidak ada karyawan yang cocok dengan kriteria pencarian.
              </div>
            ) : (
              displayedCustomEmployees.map((emp) => {
                const isChecked = selectedEmployeeIds.includes(emp.id);
                return (
                  <label
                    key={emp.id}
                    className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg cursor-pointer text-xs transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleCustomEmployee(emp.id)}
                        className="rounded border-slate-300 text-navy-900 focus:ring-navy-600"
                      />
                      <div className="min-w-0">
                        <span className="font-semibold text-slate-900 block truncate">
                          {emp.fullName}
                        </span>
                        <span className="text-slate-500 text-xs block truncate">
                          {emp.workEmail}
                        </span>
                      </div>
                    </div>
                    {emp.departmentName && (
                      <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium shrink-0">
                        {emp.departmentName}
                      </span>
                    )}
                  </label>
                );
              })
            )}
          </div>

          {filteredCustomEmployees.length > customRenderLimit && (
            <p className="text-xs text-slate-500 text-center italic">
              Menampilkan {customRenderLimit} hasil teratas dari total{" "}
              {filteredCustomEmployees.length} staf. Persempit kata kunci pencarian jika belum menemukan nama yang dicari.
            </p>
          )}
        </div>
      )}

      {/* 3. SECTION PENGECUALIAN ORANG TERTENTU (EXCLUSION) */}
      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowExclusionPanel(!showExclusionPanel)}
            className="flex items-center gap-2 text-xs font-semibold text-slate-800 hover:text-navy-900 cursor-pointer"
          >
            <UserX className="w-4 h-4 text-slate-500" />
            <span>Kecualikan Orang Tertentu (Opsional)</span>
            {excludedEmployeeIds.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                {excludedEmployeeIds.length} Dikecualikan
              </span>
            )}
            {showExclusionPanel ? (
              <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>

          {excludedEmployeeIds.length > 0 && (
            <button
              type="button"
              onClick={() => onChangeExcludedIds([])}
              className="text-xs text-red-600 hover:underline font-medium cursor-pointer"
            >
              Hapus Semua Pengecualian
            </button>
          )}
        </div>

        {/* Chips Pegawai yang Sedang Dikecualikan */}
        {excludedDetails.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {excludedDetails.map((item) => (
              <span
                key={item.id}
                className="inline-flex items-center gap-1 text-xs font-medium bg-amber-50 text-amber-900 border border-amber-200 rounded-lg px-2.5 py-1 shadow-2xs"
              >
                <span>{item.fullName}</span>
                <button
                  type="button"
                  onClick={() => removeExclusionChip(item.id)}
                  className="text-amber-700 hover:text-amber-950 p-0.5 rounded-full hover:bg-amber-100 cursor-pointer"
                  title="Batalkan pengecualian"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Panel Pencarian Pengecualian */}
        {showExclusionPanel && (
          <div className="space-y-2.5 pt-2 border-t border-slate-200 animate-in fade-in duration-150">
            <p className="text-xs text-slate-600">
              Karyawan yang dipilih di bawah tidak akan menerima email broadcast ini meskipun masuk dalam cakupan target yang dipilih.
            </p>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={exclusionSearch}
                onChange={(e) => setExclusionSearch(e.target.value)}
                placeholder="Cari nama karyawan yang ingin dikecualikan..."
                className="w-full pl-8.5 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy-600"
              />
              {exclusionSearch && (
                <button
                  type="button"
                  onClick={() => setExclusionSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl bg-white p-2 divide-y divide-slate-100">
              {candidateExclusionList.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500">
                  Tidak ada nama karyawan yang cocok dalam cakupan target saat ini.
                </div>
              ) : (
                candidateExclusionList.map((emp) => {
                  const isExcluded = excludedEmployeeIds.includes(emp.id);
                  return (
                    <label
                      key={emp.id}
                      className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg cursor-pointer text-xs transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <input
                          type="checkbox"
                          checked={isExcluded}
                          onChange={() => toggleExcludeEmployee(emp.id)}
                          className="rounded border-amber-400 text-amber-600 focus:ring-amber-500"
                        />
                        <div className="min-w-0">
                          <span className="font-semibold text-slate-900 block truncate">
                            {emp.fullName}
                          </span>
                          <span className="text-slate-500 text-xs block truncate">
                            {emp.workEmail}
                          </span>
                        </div>
                      </div>
                      {emp.meta && (
                        <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium shrink-0">
                          {emp.meta}
                        </span>
                      )}
                    </label>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
