"use client";

import React from "react";
import { DocumentVisibility, DocumentStatus } from "@pspk/db";
import {
  Search,
  X,
  RotateCcw,
  SlidersHorizontal,
  FolderOpen,
} from "lucide-react";

interface DocumentCategoryFilterProps {
  categories: { name: string; count: number }[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  searchInput: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  selectedVisibility: string;
  onVisibilityChange: (visibility: string) => void;
  allowedVisibilities: DocumentVisibility[];
  onResetFilters: () => void;
  isFiltering: boolean;
}

export function DocumentCategoryTree({
  categories,
  selectedCategory,
  onSelectCategory,
  searchInput,
  onSearchChange,
  onSearchSubmit,
  selectedStatus,
  onStatusChange,
  selectedVisibility,
  onVisibilityChange,
  allowedVisibilities,
  onResetFilters,
  isFiltering,
}: DocumentCategoryFilterProps) {
  // Standar kategori dasar
  const baseCategories = [
    { id: "ALL", label: "Semua Kategori" },
    { id: "Kebijakan Lembaga", label: "Kebijakan Lembaga" },
    { id: "SOP HR & Kepegawaian", label: "SOP HR & Kepegawaian" },
    { id: "SOP IT & Sistem", label: "SOP IT & Sistem" },
    { id: "SOP Keuangan", label: "SOP Keuangan" },
    { id: "SOP Umum & Operasional", label: "SOP Umum" },
  ];

  // Tambahkan kategori kustom dari database jika ada
  const dynamicCategories = categories
    .filter((cat) => !baseCategories.some((b) => b.id.toLowerCase() === cat.name.toLowerCase()))
    .map((cat) => ({ id: cat.name, label: cat.name }));

  const allCategoryTabs = [...baseCategories, ...dynamicCategories];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-4">
      {/* Baris Atas: Category Pills Navigasi */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-200">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 pl-1 pr-2 shrink-0">
          <FolderOpen className="w-4 h-4 text-slate-500" />
          <span>Kategori:</span>
        </div>
        {allCategoryTabs.map((tab) => {
          const isSelected =
            tab.id === "ALL"
              ? !selectedCategory || selectedCategory === "ALL"
              : selectedCategory.toLowerCase() === tab.id.toLowerCase();

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectCategory(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 shrink-0 ${
                isSelected
                  ? "bg-[#102E50] text-[#F2AF3E] shadow-xs"
                  : "bg-slate-100/80 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Baris Bawah: Form Pencarian & Dropdown Filter */}
      <div className="pt-3 border-t border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search bar */}
        <form onSubmit={onSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari kode (mis. SOP-HR-001), judul dokumen..."
            className="w-full pl-9 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50] transition-all"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                onSearchChange("");
                // trigger submit / update
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </form>

        {/* Filter dropdowns */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium shrink-0">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Penyaring:</span>
          </div>

          {/* Filter Status */}
          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50] transition-all cursor-pointer"
          >
            <option value="ALL">Semua Status</option>
            <option value={DocumentStatus.ACTIVE}>Aktif</option>
            <option value={DocumentStatus.DRAFT}>Draf</option>
            <option value={DocumentStatus.ARCHIVED}>Diarsipkan</option>
          </select>

          {/* Filter Visibilitas */}
          <select
            value={selectedVisibility}
            onChange={(e) => onVisibilityChange(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50] transition-all cursor-pointer"
          >
            <option value="ALL">Semua Akses</option>
            {allowedVisibilities.includes(DocumentVisibility.ALL_STAFF) && (
              <option value={DocumentVisibility.ALL_STAFF}>Semua Staf</option>
            )}
            {allowedVisibilities.includes(DocumentVisibility.MANAGERS) && (
              <option value={DocumentVisibility.MANAGERS}>Khusus Manajer</option>
            )}
            {allowedVisibilities.includes(DocumentVisibility.HR_ONLY) && (
              <option value={DocumentVisibility.HR_ONLY}>Khusus HR</option>
            )}
            {allowedVisibilities.includes(DocumentVisibility.IT_ONLY) && (
              <option value={DocumentVisibility.IT_ONLY}>Khusus IT</option>
            )}
          </select>

          {/* Tombol Reset jika filter aktif */}
          {isFiltering && (
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200/60 rounded-xl hover:bg-rose-100 transition-colors"
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
