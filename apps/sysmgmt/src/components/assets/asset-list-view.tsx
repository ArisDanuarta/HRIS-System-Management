"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { SerializedAsset, AssetStats } from "@/server/queries/asset.queries";
import { AssetFormModal } from "./asset-form-modal";
import { AssetDeleteModal } from "./asset-delete-modal";
import { formatRupiah } from "@pspk/shared";
import {
  Package,
  Laptop,
  CheckCircle2,
  Wrench,
  Search,
  Plus,
  Sliders,
  MapPin,
  Edit2,
  Trash2,
  Layers,
  ChevronLeft,
  ChevronRight,
  User,
  AlertCircle,
} from "lucide-react";

interface AssetListViewProps {
  assetsData: {
    assets: SerializedAsset[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
  stats: AssetStats;
  suggestedTagIt: string;
  suggestedTagNonIt: string;
  canWrite: boolean;
  isAssignmentModuleActive: boolean;
  initialFilters: {
    category: string;
    status: string;
    search: string;
    page: number;
  };
}

export function AssetListView({
  assetsData,
  stats,
  suggestedTagIt,
  suggestedTagNonIt,
  canWrite,
  isAssignmentModuleActive,
  initialFilters,
}: AssetListViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State filter
  const [selectedCategory, setSelectedCategory] = useState(initialFilters.category);
  const [selectedStatus, setSelectedStatus] = useState(initialFilters.status);
  const [searchInput, setSearchInput] = useState(initialFilters.search);

  // State Modal
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<SerializedAsset | null>(null);
  const [deletingAsset, setDeletingAsset] = useState<SerializedAsset | null>(null);

  // Handler update filter URL
  const applyFilters = (newCat?: string, newStat?: string, newSearch?: string, newPage?: number) => {
    const params = new URLSearchParams(searchParams?.toString() || "");

    const cat = newCat !== undefined ? newCat : selectedCategory;
    const stat = newStat !== undefined ? newStat : selectedStatus;
    const q = newSearch !== undefined ? newSearch : searchInput;
    const p = newPage !== undefined ? newPage : 1;

    if (cat && cat !== "ALL") params.set("kategori", cat);
    else params.delete("kategori");

    if (stat && stat !== "ALL") params.set("status", stat);
    else params.delete("status");

    if (q && q.trim().length > 0) params.set("q", q.trim());
    else params.delete("q");

    if (p > 1) params.set("page", String(p));
    else params.delete("page");

    router.push(`/aset?${params.toString()}`);
  };

  const handleCategoryTab = (cat: string) => {
    setSelectedCategory(cat);
    applyFilters(cat, selectedStatus, searchInput, 1);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const stat = e.target.value;
    setSelectedStatus(stat);
    applyFilters(selectedCategory, stat, searchInput, 1);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters(selectedCategory, selectedStatus, searchInput, 1);
  };

  const handleResetFilters = () => {
    setSelectedCategory("ALL");
    setSelectedStatus("ALL");
    setSearchInput("");
    router.push("/aset");
  };

  const openCreateModal = () => {
    setEditingAsset(null);
    setIsFormModalOpen(true);
  };

  const openEditModal = (asset: SerializedAsset) => {
    setEditingAsset(asset);
    setIsFormModalOpen(true);
  };

  const openDeleteModal = (asset: SerializedAsset) => {
    setDeletingAsset(asset);
  };

  const { assets, pagination } = assetsData;

  return (
    <div className="space-y-6">
      {/* 1. Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-xl font-bold text-slate-900 font-serif">Inventaris Aset Lembaga</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#102E50]/10 text-[#102E50] border border-[#102E50]/20 flex items-center gap-1">
              <Layers className="w-3 h-3 text-[#102E50]" />
              Katalog Aset
            </span>
            {isAssignmentModuleActive ? (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Serah Terima Aktif
              </span>
            ) : (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-amber-600" />
                Mode Gudang (Serah Terima Nonaktif)
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">
            Katalog dan pelacakan seluruh perangkat TI, inventaris kantor, spesifikasi perangkat keras,
            serta status fisik penempatan aset PSPK.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/pengguna?tab=modules"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-600 hover:text-[#102E50] text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Tata Kelola Modul</span>
          </Link>

          {canWrite && (
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#102E50] text-white text-xs font-semibold rounded-lg hover:bg-[#1a4473] transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4 text-[#F2AF3E]" />
              <span>Catat Aset Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Kartu Statistik Metrik Aset */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Unit */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Total Unit Terdaftar</span>
            <div className="w-8 h-8 rounded-lg bg-[#102E50]/10 text-[#102E50] flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 font-serif">{stats.total}</span>
            <span className="text-xs text-slate-400">Unit</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>IT: {stats.itTotal}</span>
            <span>Non-IT: {stats.nonItTotal}</span>
          </div>
        </div>

        {/* Tersedia di Gudang */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Tersedia di Gudang</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-700 font-serif">{stats.inStock}</span>
            <span className="text-xs text-emerald-600 font-medium">Siap Digunakan</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-400">
            Kondisi baik & berada di kantor
          </div>
        </div>

        {/* Sedang Dipinjam Staf */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Sedang Dipinjamkan</span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-sky-700 font-serif">{stats.assigned}</span>
            <span className="text-xs text-sky-600 font-medium">Unit</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
            {isAssignmentModuleActive ? (
              <span>Dipegang oleh pegawai</span>
            ) : (
              <span className="text-amber-600 font-medium">Sub-modul dinonaktifkan</span>
            )}
          </div>
        </div>

        {/* Pemeliharaan / Rusak */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Dalam Pemeliharaan</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-700 font-serif">{stats.maintenance}</span>
            <span className="text-xs text-amber-600 font-medium">Perbaikan</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Afkir: {stats.retired}</span>
            <span>Hilang: {stats.lost}</span>
          </div>
        </div>
      </div>

      {/* 3. Filter Bar & Pencarian */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 space-y-3 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Tabs Kategori */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg shrink-0">
            <button
              type="button"
              onClick={() => handleCategoryTab("ALL")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                selectedCategory === "ALL"
                  ? "bg-white text-[#102E50] shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Semua Kategori ({stats.total})
            </button>
            <button
              type="button"
              onClick={() => handleCategoryTab("IT")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                selectedCategory === "IT"
                  ? "bg-white text-[#102E50] shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Laptop className="w-3.5 h-3.5 text-sky-600" />
              Perangkat IT ({stats.itTotal})
            </button>
            <button
              type="button"
              onClick={() => handleCategoryTab("NON_IT")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                selectedCategory === "NON_IT"
                  ? "bg-white text-[#102E50] shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Package className="w-3.5 h-3.5 text-amber-600" />
              Fasilitas Non-IT ({stats.nonItTotal})
            </button>
          </div>

          {/* Form Pencarian & Dropdown Status */}
          <div className="flex items-center gap-2.5 flex-1 max-w-md ml-auto">
            <select
              value={selectedStatus}
              onChange={handleStatusChange}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:ring-2 focus:ring-[#102E50] focus:border-transparent outline-none shrink-0"
            >
              <option value="ALL">Semua Status</option>
              <option value="IN_STOCK">Tersedia (Gudang)</option>
              <option value="ASSIGNED">Sedang Dipinjam</option>
              <option value="MAINTENANCE">Dalam Servis</option>
              <option value="RETIRED">Afkir / Usang</option>
              <option value="LOST">Hilang</option>
            </select>

            <form onSubmit={handleSearchSubmit} className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Cari nama, tag, serial, atau lokasi..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-[#102E50] focus:bg-white focus:border-transparent outline-none transition-colors"
              />
            </form>
          </div>
        </div>
      </div>

      {/* 4. Tabel Direktori Aset */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Tag & Kategori</th>
                <th className="py-3.5 px-4">Nama & Spesifikasi</th>
                <th className="py-3.5 px-4">Jenis</th>
                <th className="py-3.5 px-4">Status Fisik</th>
                {isAssignmentModuleActive ? (
                  <th className="py-3.5 px-4">Pemegang Saat Ini</th>
                ) : (
                  <th className="py-3.5 px-4">Lokasi Fisik</th>
                )}
                <th className="py-3.5 px-4">Harga Beli</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {assets.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-12 px-4 text-center text-slate-400 space-y-3 bg-white"
                  >
                    <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                      <Package className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-medium text-slate-600">Tidak ada data aset ditemukan</p>
                    <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                      Coba sesuaikan kata kunci pencarian atau ubah filter kategori dan status ketersediaan.
                    </p>
                    {(selectedCategory !== "ALL" || selectedStatus !== "ALL" || searchInput) && (
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#102E50] font-semibold bg-[#102E50]/10 rounded-lg hover:bg-[#102E50]/20 transition-colors"
                      >
                        Reset Filter
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                assets.map((asset) => {
                  return (
                    <tr
                      key={asset.id}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      {/* Tag & Kategori */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="space-y-1">
                          <span className="font-mono font-bold text-[11px] text-[#102E50] bg-slate-100 px-2 py-0.5 rounded border border-slate-200 inline-block">
                            {asset.assetTag}
                          </span>
                          <div>
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full inline-block ${
                                asset.category === "IT"
                                  ? "bg-sky-50 text-sky-700 border border-sky-200"
                                  : "bg-amber-50 text-amber-700 border border-amber-200"
                              }`}
                            >
                              {asset.category === "IT" ? "Perangkat IT" : "Non-IT"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Nama & Spesifikasi */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="font-semibold text-slate-900 group-hover:text-[#102E50] transition-colors">
                          {asset.name}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5 flex-wrap">
                          {asset.brand && <span className="font-medium text-slate-600">{asset.brand}</span>}
                          {asset.model && <span>{asset.model}</span>}
                          {asset.serialNumber && (
                            <span className="font-mono text-slate-400 bg-slate-50 px-1.5 py-0.2 rounded border border-slate-200/60">
                              S/N: {asset.serialNumber}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Tipe / Jenis */}
                      <td className="py-3.5 px-4 align-top">
                        <span className="text-slate-700 font-medium">{asset.type}</span>
                      </td>

                      {/* Status Fisik */}
                      <td className="py-3.5 px-4 align-top">
                        {asset.status === "IN_STOCK" && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Tersedia
                          </span>
                        )}
                        {asset.status === "ASSIGNED" && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                            Dipinjam
                          </span>
                        )}
                        {asset.status === "MAINTENANCE" && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Perbaikan
                          </span>
                        )}
                        {asset.status === "RETIRED" && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            Afkir
                          </span>
                        )}
                        {asset.status === "LOST" && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            Hilang
                          </span>
                        )}
                      </td>

                      {/* Pemegang Saat Ini / Lokasi */}
                      {isAssignmentModuleActive ? (
                        <td className="py-3.5 px-4 align-top">
                          {asset.activeAssignment ? (
                            <div className="space-y-0.5">
                              <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                                <div className="w-5 h-5 rounded-full bg-[#102E50] text-[#F2AF3E] text-[10px] font-bold flex items-center justify-center shrink-0">
                                  {asset.activeAssignment.employee.fullName.substring(0, 1)}
                                </div>
                                <span className="truncate max-w-[140px]">
                                  {asset.activeAssignment.employee.fullName}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-400 pl-6.5">
                                {asset.activeAssignment.employee.departmentName || "Staff PSPK"}
                              </div>
                            </div>
                          ) : (
                            <div className="text-slate-400 flex items-center gap-1 text-[11px]">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              <span>{asset.location || "Gudang Kantor"}</span>
                            </div>
                          )}
                        </td>
                      ) : (
                        <td className="py-3.5 px-4 align-top text-slate-600 text-[11px]">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span>{asset.location || "Gudang Kantor"}</span>
                          </div>
                        </td>
                      )}

                      {/* Harga Beli */}
                      <td className="py-3.5 px-4 align-top font-medium text-slate-700">
                        {asset.purchasePrice ? formatRupiah(asset.purchasePrice) : "-"}
                      </td>

                      {/* Aksi */}
                      <td className="py-3.5 px-4 align-top text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {canWrite && (
                            <>
                              <button
                                type="button"
                                onClick={() => openEditModal(asset)}
                                title="Ubah Spesifikasi"
                                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => openDeleteModal(asset)}
                                title="Hapus Aset"
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-slate-200/80 bg-slate-50/50 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Menampilkan {(pagination.page - 1) * pagination.limit + 1} -{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)} dari {pagination.total} aset
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={pagination.page <= 1}
                onClick={() => applyFilters(undefined, undefined, undefined, pagination.page - 1)}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="text-xs font-semibold px-2 text-slate-700">
                Hal {pagination.page} dari {pagination.totalPages}
              </span>

              <button
                type="button"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => applyFilters(undefined, undefined, undefined, pagination.page + 1)}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Form Tambah / Ubah */}
      <AssetFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        asset={editingAsset}
        suggestedTagIt={suggestedTagIt}
        suggestedTagNonIt={suggestedTagNonIt}
      />

      {/* Modal Hapus */}
      <AssetDeleteModal
        isOpen={Boolean(deletingAsset)}
        onClose={() => setDeletingAsset(null)}
        asset={deletingAsset}
      />
    </div>
  );
}
