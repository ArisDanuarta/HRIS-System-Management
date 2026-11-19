"use client";

import React, { useMemo, useState } from "react";
import {
  CalendarDays,
  Plane,
  Search,
  X,
  Users,
} from "lucide-react";
import type { TodayOutOfOfficeData } from "@/server/queries/dashboard/out-of-office.queries";
import { EmployeeAvatar } from "@/components/karyawan/employee-avatar";
import { Panel, Pill } from "./dashboard-ui";

interface OutOfOfficePanelProps {
  data: TodayOutOfOfficeData;
  className?: string;
}

export function OutOfOfficePanel({ data, className }: OutOfOfficePanelProps) {
  // Default tab: jika tidak ada cuti tapi ada dinas luar, buka tab dinas terlebih dahulu
  const [activeTab, setActiveTab] = useState<"LEAVE" | "DINAS">(() => {
    if (data.leaves.length === 0 && data.businessTrips.length > 0) {
      return "DINAS";
    }
    return "LEAVE";
  });

  const [searchQuery, setSearchQuery] = useState("");

  const currentList = activeTab === "LEAVE" ? data.leaves : data.businessTrips;

  const filteredList = useMemo(() => {
    if (!searchQuery.trim()) return currentList;
    const q = searchQuery.toLowerCase().trim();
    return currentList.filter(
      (person) =>
        person.fullName.toLowerCase().includes(q) ||
        (person.nickname && person.nickname.toLowerCase().includes(q)) ||
        person.department.toLowerCase().includes(q) ||
        person.position.toLowerCase().includes(q) ||
        person.typeLabel.toLowerCase().includes(q) ||
        person.info.toLowerCase().includes(q),
    );
  }, [currentList, searchQuery]);

  return (
    <Panel
      title="Tidak Hadir"
      icon={Users}
      badge={<Pill tone="slate">{data.totalCount} orang</Pill>}
      action={{ href: "/kalender", label: "Kalender" }}
      padded={false}
      className={className}
    >
      {/* 1. Tab Switcher Header (Segmented Control) */}
      <div className="border-b border-[#dee9fc] bg-slate-50/70 p-2.5">
        <div
          role="tablist"
          aria-label="Filter status di luar kantor"
          className="grid grid-cols-2 gap-2"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "LEAVE"}
            onClick={() => setActiveTab("LEAVE")}
            className={`flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition-all active:scale-[0.98] ${
              activeTab === "LEAVE"
                ? "border border-sky-200 bg-sky-50 text-[#0874aa] shadow-xs"
                : "border border-transparent bg-white text-slate-600 hover:border-slate-200 hover:bg-slate-100/70"
            }`}
          >
            <CalendarDays
              className={`h-4 w-4 shrink-0 ${
                activeTab === "LEAVE" ? "text-[#0874aa]" : "text-slate-400"
              }`}
              aria-hidden="true"
            />
            <span>Cuti</span>
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] font-extrabold tabular-nums ${
                activeTab === "LEAVE"
                  ? "bg-[#0874aa] text-white"
                  : "bg-slate-200/80 text-slate-700"
              }`}
            >
              {data.leaves.length}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "DINAS"}
            onClick={() => setActiveTab("DINAS")}
            className={`flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition-all active:scale-[0.98] ${
              activeTab === "DINAS"
                ? "border border-indigo-200 bg-indigo-50 text-indigo-700 shadow-xs"
                : "border border-transparent bg-white text-slate-600 hover:border-slate-200 hover:bg-slate-100/70"
            }`}
          >
            <Plane
              className={`h-4 w-4 shrink-0 ${
                activeTab === "DINAS" ? "text-indigo-600" : "text-slate-400"
              }`}
              aria-hidden="true"
            />
            <span>Dinas Luar</span>
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] font-extrabold tabular-nums ${
                activeTab === "DINAS"
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-200/80 text-slate-700"
              }`}
            >
              {data.businessTrips.length}
            </span>
          </button>
        </div>

        {/* 2. Quick Search (Muncul jika ada lebih dari 3 staf dalam kategori ini atau pencarian aktif) */}
        {(currentList.length > 3 || searchQuery.length > 0) && (
          <div className="relative mt-2.5">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Cari nama / divisi ${activeTab === "LEAVE" ? "cuti" : "dinas"}...`}
              className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-7 text-xs text-slate-800 placeholder-slate-400 transition-colors focus:border-[#102e50] focus:outline-none focus:ring-1 focus:ring-[#102e50]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Hapus pencarian"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* 3. Daftar Karyawan Out-of-Office */}
      <div className="max-h-[380px] divide-y divide-slate-100 overflow-y-auto">
        {filteredList.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-5 py-8 text-center">
            {searchQuery ? (
              <>
                <Search className="mb-2 h-7 w-7 text-slate-300" aria-hidden="true" />
                <p className="text-xs font-semibold text-slate-700">Tidak ada hasil cocok</p>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  Tidak ditemukan rekan dengan kata kunci &ldquo;{searchQuery}&rdquo;.
                </p>
              </>
            ) : activeTab === "LEAVE" ? (
              <>
                <CalendarDays className="mb-2 h-7 w-7 text-slate-300" aria-hidden="true" />
                <p className="text-xs font-semibold text-slate-700">Semua hadir berkantor</p>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  Tidak ada rekan yang tercatat cuti hari ini.
                </p>
              </>
            ) : (
              <>
                <Plane className="mb-2 h-7 w-7 text-slate-300" aria-hidden="true" />
                <p className="text-xs font-semibold text-slate-700">Tidak ada dinas luar</p>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  Tidak ada rekan yang sedang perjalanan dinas hari ini.
                </p>
              </>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {filteredList.map((person) => (
              <li
                key={`${person.kind}-${person.id}`}
                className="flex items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-[#f8f9ff]"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <EmployeeAvatar
                    photoKey={person.photoKey}
                    name={person.fullName}
                    gender={person.gender}
                    sizeClassName="w-9 h-9"
                    textClassName="text-xs"
                    roundedClassName="rounded-xl"
                  />
                  <div className="min-w-0">
                    <p
                      className="truncate text-xs font-bold text-slate-900"
                      title={person.fullName}
                    >
                      {person.fullName}
                    </p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px]">
                      <span className="truncate font-medium text-slate-600">
                        {person.department}
                      </span>
                      <span className="text-slate-300" aria-hidden="true">
                        •
                      </span>
                      <span className="truncate text-slate-400">{person.position}</span>
                    </div>

                    {/* Sub-keterangan dinas / cuti */}
                    <div className="mt-1 flex items-center gap-1.5">
                      {person.kind === "LEAVE" ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0874aa]">
                          <span>{person.typeLabel}</span>
                          <span className="text-slate-300">•</span>
                          <span className="font-normal text-slate-500">{person.info}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded bg-indigo-50 px-1.5 py-0.5 text-[11px] font-semibold text-indigo-700">
                          <Plane className="h-3 w-3 shrink-0" aria-hidden="true" />
                          <span className="truncate">{person.info}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Panel>
  );
}
