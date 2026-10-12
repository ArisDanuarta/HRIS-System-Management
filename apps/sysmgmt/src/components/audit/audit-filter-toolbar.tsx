"use client";

import React, { useState } from "react";
import { AuditFilterOptions } from "@/server/queries/audit.queries";
import {
  Search,
  Filter,
  RotateCcw,
  Download,
  Calendar,
  Layers,
  Activity,
  Globe,
} from "lucide-react";

interface AuditFilterToolbarProps {
  filterOptions: AuditFilterOptions;
  currentFilters: {
    q: string;
    app: string;
    action: string;
    entityType: string;
    startDate: string;
    endDate: string;
  };
  onApplyFilters: (newFilters: {
    q: string;
    app: string;
    action: string;
    entityType: string;
    startDate: string;
    endDate: string;
  }) => void;
  onResetFilters: () => void;
  isFiltered: boolean;
  canExport: boolean;
}

export function AuditFilterToolbar({
  filterOptions,
  currentFilters,
  onApplyFilters,
  onResetFilters,
  isFiltered,
  canExport,
}: AuditFilterToolbarProps) {
  const [searchInput, setSearchInput] = useState(currentFilters.q);
  const [app, setApp] = useState(currentFilters.app);
  const [action, setAction] = useState(currentFilters.action);
  const [entityType, setEntityType] = useState(currentFilters.entityType);
  const [startDate, setStartDate] = useState(currentFilters.startDate);
  const [endDate, setEndDate] = useState(currentFilters.endDate);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onApplyFilters({
      q: searchInput,
      app,
      action,
      entityType,
      startDate,
      endDate,
    });
  };

  const handleSelectChange = (
    field: "app" | "action" | "entityType" | "startDate" | "endDate",
    value: string,
  ) => {
    const next = {
      q: searchInput,
      app: field === "app" ? value : app,
      action: field === "action" ? value : action,
      entityType: field === "entityType" ? value : entityType,
      startDate: field === "startDate" ? value : startDate,
      endDate: field === "endDate" ? value : endDate,
    };

    if (field === "app") setApp(value);
    if (field === "action") setAction(value);
    if (field === "entityType") setEntityType(value);
    if (field === "startDate") setStartDate(value);
    if (field === "endDate") setEndDate(value);

    onApplyFilters(next);
  };

  const handleExportCsv = () => {
    const params = new URLSearchParams();
    if (currentFilters.q) params.set("q", currentFilters.q);
    if (currentFilters.app && currentFilters.app !== "ALL") params.set("app", currentFilters.app);
    if (currentFilters.action && currentFilters.action !== "ALL") params.set("action", currentFilters.action);
    if (currentFilters.entityType && currentFilters.entityType !== "ALL")
      params.set("entityType", currentFilters.entityType);
    if (currentFilters.startDate) params.set("startDate", currentFilters.startDate);
    if (currentFilters.endDate) params.set("endDate", currentFilters.endDate);

    window.open(`/api/audit/export?${params.toString()}`, "_blank");
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
      {/* Baris 1: Search Bar & Tombol Aksi */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Form Cari */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Cari email aktor, IP, entitas, atau ID..."
            className="w-full pl-9 pr-20 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50]"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-[#102E50] text-white text-[11px] font-semibold rounded-lg hover:bg-[#1a4473] transition-colors"
          >
            Cari
          </button>
        </form>

        {/* Tombol Reset & Ekspor */}
        <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
          {isFiltered && (
            <button
              type="button"
              onClick={() => {
                setSearchInput("");
                setApp("ALL");
                setAction("ALL");
                setEntityType("ALL");
                setStartDate("");
                setEndDate("");
                onResetFilters();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100/80 border border-rose-200 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filter</span>
            </button>
          )}

          {canExport && (
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 transition-colors shadow-2xs"
              title="Unduh rekaman log audit dalam format file CSV (.csv)"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Ekspor Log (.CSV)</span>
            </button>
          )}
        </div>
      </div>

      {/* Baris 2: Dropdown Filter Multi-Dimensi */}
      <div className="pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 text-xs">
        {/* Filter Portal */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Portal Aplikasi
          </label>
          <select
            value={app}
            onChange={(e) => handleSelectChange("app", e.target.value)}
            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#102E50]"
          >
            <option value="ALL">Semua Portal</option>
            {filterOptions.apps.map((a) => (
              <option key={a} value={a}>
                {a.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        {/* Filter Aksi */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Tipe Aksi
          </label>
          <select
            value={action}
            onChange={(e) => handleSelectChange("action", e.target.value)}
            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#102E50]"
          >
            <option value="ALL">Semua Aksi</option>
            {filterOptions.actions.map((act) => (
              <option key={act} value={act}>
                {act}
              </option>
            ))}
          </select>
        </div>

        {/* Filter Entitas */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Entitas Target
          </label>
          <select
            value={entityType}
            onChange={(e) => handleSelectChange("entityType", e.target.value)}
            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#102E50]"
          >
            <option value="ALL">Semua Entitas</option>
            {filterOptions.entityTypes.map((ent) => (
              <option key={ent} value={ent}>
                {ent}
              </option>
            ))}
          </select>
        </div>

        {/* Filter Tanggal Mulai */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Dari Tanggal
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => handleSelectChange("startDate", e.target.value)}
            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#102E50]"
          />
        </div>

        {/* Filter Tanggal Akhir */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Sampai Tanggal
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => handleSelectChange("endDate", e.target.value)}
            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#102E50]"
          />
        </div>
      </div>
    </div>
  );
}
