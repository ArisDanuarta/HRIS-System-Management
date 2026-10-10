"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  DocumentDirectoryResult,
  DocumentStats,
} from "@/server/queries/document.queries";
import { DocumentVisibility } from "@pspk/db";
import { DocumentStatsCards } from "./document-stats-cards";
import { DocumentCategoryTree } from "./document-category-tree";
import { DocumentTable } from "./document-table";
import {
  FolderArchive,
  Plus,
  FileUp,
} from "lucide-react";

interface DocumentListViewProps {
  documentsData: DocumentDirectoryResult;
  stats: DocumentStats;
  canManage: boolean;
  allowedVisibilities: DocumentVisibility[];
  initialFilters: {
    search: string;
    category: string;
    status: string;
    visibility: string;
    page: number;
  };
}

export function DocumentListView({
  documentsData,
  stats,
  canManage,
  allowedVisibilities,
  initialFilters,
}: DocumentListViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchInput, setSearchInput] = useState(initialFilters.search);
  const [selectedCategory, setSelectedCategory] = useState(initialFilters.category);
  const [selectedStatus, setSelectedStatus] = useState(initialFilters.status);
  const [selectedVisibility, setSelectedVisibility] = useState(initialFilters.visibility);

  // Modal dialog states (untuk Sub-Tahap 4D)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const applyFilters = (
    newSearch?: string,
    newCategory?: string,
    newStatus?: string,
    newVisibility?: string,
    newPage?: number,
  ) => {
    const params = new URLSearchParams(searchParams.toString());

    const s = newSearch !== undefined ? newSearch : searchInput;
    const cat = newCategory !== undefined ? newCategory : selectedCategory;
    const stat = newStatus !== undefined ? newStatus : selectedStatus;
    const vis = newVisibility !== undefined ? newVisibility : selectedVisibility;
    const p = newPage !== undefined ? newPage : 1;

    if (s.trim()) params.set("q", s.trim());
    else params.delete("q");

    if (cat && cat !== "ALL") params.set("category", cat);
    else params.delete("category");

    if (stat && stat !== "ALL") params.set("status", stat);
    else params.delete("status");

    if (vis && vis !== "ALL") params.set("visibility", vis);
    else params.delete("visibility");

    if (p > 1) params.set("page", p.toString());
    else params.delete("page");

    router.push(`/dokumen?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters(searchInput, selectedCategory, selectedStatus, selectedVisibility, 1);
  };

  const handleSelectCategory = (cat: string) => {
    setSelectedCategory(cat);
    applyFilters(searchInput, cat, selectedStatus, selectedVisibility, 1);
  };

  const handleStatusChange = (stat: string) => {
    setSelectedStatus(stat);
    applyFilters(searchInput, selectedCategory, stat, selectedVisibility, 1);
  };

  const handleVisibilityChange = (vis: string) => {
    setSelectedVisibility(vis);
    applyFilters(searchInput, selectedCategory, selectedStatus, vis, 1);
  };

  const handleResetFilters = () => {
    setSearchInput("");
    setSelectedCategory("ALL");
    setSelectedStatus("ALL");
    setSelectedVisibility("ALL");
    router.push("/dokumen");
  };

  const handlePageChange = (newPage: number) => {
    applyFilters(searchInput, selectedCategory, selectedStatus, selectedVisibility, newPage);
  };

  const isFiltering =
    Boolean(searchInput.trim()) ||
    (selectedCategory !== "ALL" && selectedCategory !== "") ||
    selectedStatus !== "ALL" ||
    selectedVisibility !== "ALL";

  return (
    <div className="space-y-6">
      {/* Header Eksekutif Modul */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#102E50] text-[#F2AF3E] flex items-center justify-center shadow-xs">
              <FolderArchive className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 font-serif tracking-tight">
                Dokumen Kebijakan & SOP Lembaga
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Pusat repositori resmi kebijakan, standar operasional prosedur, dan tata kelola PSPK.
              </p>
            </div>
          </div>
        </div>

        {canManage && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#102E50] text-[#F2AF3E] hover:bg-[#163a63] text-xs font-semibold rounded-xl shadow-xs transition-all duration-150 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Unggah Dokumen Baru</span>
            </button>
          </div>
        )}
      </div>

      {/* 4 Kartu Metrik Ringkasan */}
      <DocumentStatsCards
        stats={stats}
        selectedCategory={selectedCategory}
        onSelectCategory={handleSelectCategory}
      />

      {/* Kategori Tree & Bilah Filter Toolbar */}
      <DocumentCategoryTree
        categories={stats.categories}
        selectedCategory={selectedCategory}
        onSelectCategory={handleSelectCategory}
        searchInput={searchInput}
        onSearchChange={setSearchInput}
        onSearchSubmit={handleSearchSubmit}
        selectedStatus={selectedStatus}
        onStatusChange={handleStatusChange}
        selectedVisibility={selectedVisibility}
        onVisibilityChange={handleVisibilityChange}
        allowedVisibilities={allowedVisibilities}
        onResetFilters={handleResetFilters}
        isFiltering={isFiltering}
      />

      {/* Tabel Data Dokumen */}
      <DocumentTable
        documents={documentsData.documents}
        pagination={{
          page: documentsData.currentPage,
          totalPages: documentsData.totalPages,
          total: documentsData.totalCount,
          limit: documentsData.pageSize,
        }}
        onPageChange={handlePageChange}
        canManage={canManage}
      />

      {/* Placeholder info jika modal create dipicu sebelum Tahap 4D */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="w-12 h-12 rounded-xl bg-[#102E50]/10 text-[#102E50] flex items-center justify-center mb-4">
              <FileUp className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 font-serif mb-1">
              Unggah Dokumen Baru (Tahap 4D)
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-6">
              Modal formulir lengkap pengunggahan dokumen dan berkas versi awal (v1) disiapkan pada Sub-Tahap 4D. Backend actions dan endpoint storage sudah 100% siap.
            </p>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
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
