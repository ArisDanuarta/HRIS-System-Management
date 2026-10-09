"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  SerializedSoftwareLicense,
  LicenseStats,
  LicensesDirectoryResult,
} from "@/server/queries/license.queries";
import { LicenseTable } from "./license-table";
import {
  KeyRound,
  Plus,
  Search,
  Users,
  AlertTriangle,
  ClockAlert,
  Layers,
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react";

interface LicenseListViewProps {
  licensesData: LicensesDirectoryResult;
  stats: LicenseStats;
  canManage: boolean;
  initialFilters: {
    search: string;
    status: string;
    vendor: string;
    page: number;
  };
  onAddLicense?: () => void;
  onEditLicense?: (license: SerializedSoftwareLicense) => void;
  onDeleteLicense?: (license: SerializedSoftwareLicense) => void;
  onRevealKey?: (license: SerializedSoftwareLicense) => void;
}

export function LicenseListView({
  licensesData,
  stats,
  canManage,
  initialFilters,
  onAddLicense,
  onEditLicense,
  onDeleteLicense,
  onRevealKey,
}: LicenseListViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchInput, setSearchInput] = useState(initialFilters.search);
  const [selectedStatus, setSelectedStatus] = useState(initialFilters.status);
  const [selectedVendor, setSelectedVendor] = useState(initialFilters.vendor);

  const applyFilters = (
    newSearch?: string,
    newStatus?: string,
    newVendor?: string,
    newPage?: number,
  ) => {
    const params = new URLSearchParams(searchParams.toString());

    const s = newSearch !== undefined ? newSearch : searchInput;
    const stat = newStatus !== undefined ? newStatus : selectedStatus;
    const v = newVendor !== undefined ? newVendor : selectedVendor;
    const p = newPage !== undefined ? newPage : 1;

    if (s.trim()) params.set("q", s.trim());
    else params.delete("q");

    if (stat && stat !== "ALL") params.set("status", stat);
    else params.delete("status");

    if (v && v !== "ALL") params.set("vendor", v);
    else params.delete("vendor");

    if (p > 1) params.set("page", p.toString());
    else params.delete("page");

    router.push(`/lisensi?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters(searchInput, selectedStatus, selectedVendor, 1);
  };

  const handleResetFilters = () => {
    setSearchInput("");
    setSelectedStatus("ALL");
    setSelectedVendor("ALL");
    router.push("/lisensi");
  };

  const isFiltering =
    Boolean(searchInput.trim()) ||
    selectedStatus !== "ALL" ||
    selectedVendor !== "ALL";

  return (
    <div className="space-y-6">
      {/* Header Eksekutif */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#102E50] text-[#F2AF3E] flex items-center justify-center shadow-xs">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight font-serif">
                Lisensi Perangkat Lunak
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Katalog langganan tools, utilisasi alokasi kursi staf, masa berlaku, dan kunci lisensi berbayar PSPK.
              </p>
            </div>
          </div>
        </div>

        {canManage && (
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onAddLicense}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#102E50] hover:bg-[#1a4473] text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Lisensi</span>
            </button>
          </div>
        )}
      </div>

      {/* 4 Kartu Metrik Ringkasan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Kartu 1: Total Lisensi */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4.5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Lisensi
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-900 font-serif">
              {stats.totalLicenses}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {stats.totalLicenses - stats.expiredCount} aktif ({stats.expiredCount} kedaluwarsa)
            </p>
          </div>
        </div>

        {/* Kartu 2: Utilisasi Kursi Global */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4.5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Alokasi Kursi (Seats)
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#102E50]/10 text-[#102E50] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 font-serif">
                {stats.totalSeatsUsed}
              </span>
              <span className="text-xs text-slate-400 font-normal">
                / {stats.totalSeatsTotal} kursi
              </span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-md ml-auto">
                {stats.globalUtilizationPercent}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-2 border border-slate-200/60">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(stats.globalUtilizationPercent, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Kartu 3: Kuota Kritis */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4.5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Kuota Kritis
            </span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${stats.criticalUsageCount > 0 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-400"}`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-900 font-serif">
              {stats.criticalUsageCount}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Mendekati atau penuh (&ge; 80% kursi)
            </p>
          </div>
        </div>

        {/* Kartu 4: Peringatan Kedaluwarsa */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4.5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Kedaluwarsa
            </span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${stats.expiringSoonCount + stats.expiredCount > 0 ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-400"}`}>
              <ClockAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-900 font-serif">
              {stats.expiringSoonCount + stats.expiredCount}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {stats.expiringSoonCount} segera berakhir, {stats.expiredCount} expired
            </p>
          </div>
        </div>
      </div>

      {/* Toolbar Filter & Pencarian */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Form Pencarian */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Cari nama software, vendor, atau catatan..."
            className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50] transition-colors"
          />
        </form>

        {/* Penyaring Filter Status & Vendor */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline font-medium">Filter:</span>
          </div>

          {/* Filter Status */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              applyFilters(searchInput, e.target.value, selectedVendor, 1);
            }}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50]"
          >
            <option value="ALL">Semua Status</option>
            <option value="EXPIRING_SOON">Segera Berakhir (&le; 30 Hari)</option>
            <option value="EXPIRED">Sudah Kedaluwarsa</option>
            <option value="FULL">Kuota Penuh (100%)</option>
            <option value="AVAILABLE">Kursi Masih Tersedia</option>
            <option value="PERPETUAL">Langganan Tetap (Lifetime)</option>
          </select>

          {/* Filter Vendor */}
          {licensesData.vendors.length > 0 && (
            <select
              value={selectedVendor}
              onChange={(e) => {
                setSelectedVendor(e.target.value);
                applyFilters(searchInput, selectedStatus, e.target.value, 1);
              }}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50]"
            >
              <option value="ALL">Semua Vendor</option>
              {licensesData.vendors.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          )}

          {/* Tombol Reset Filter */}
          {isFiltering && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 px-2.5 py-2 text-xs font-medium text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition-colors"
              title="Reset seluruh filter pencarian"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabel Lisensi */}
      <LicenseTable
        licenses={licensesData.licenses}
        canManage={canManage}
        onEditLicense={onEditLicense}
        onDeleteLicense={onDeleteLicense}
        onRevealKey={onRevealKey}
        pagination={{
          page: licensesData.page,
          totalPages: licensesData.totalPages,
          total: licensesData.total,
          limit: licensesData.limit,
        }}
        onPageChange={(newPage) => applyFilters(searchInput, selectedStatus, selectedVendor, newPage)}
      />
    </div>
  );
}
