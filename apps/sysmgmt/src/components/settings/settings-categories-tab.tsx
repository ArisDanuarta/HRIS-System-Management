"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SerializedDocumentCategory } from "@/server/queries/settings.queries";
import { toggleDocumentCategoryStatusAction } from "@/server/actions/settings.actions";
import { SettingsCategoryModal } from "./settings-category-modal";
import { SettingsDeleteCategoryModal } from "./settings-delete-category-modal";
import {
  FolderKanban,
  Plus,
  Search,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  FileText,
  Loader2,
} from "lucide-react";

interface SettingsCategoriesTabProps {
  categories: SerializedDocumentCategory[];
  canManage: boolean;
}

const COLOR_CLASSES: Record<string, { bg: string; text: string; border: string }> = {
  blue: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  indigo: { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  amber: { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200" },
  slate: { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200" },
  rose: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
  purple: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  cyan: { bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-200" },
};

export function SettingsCategoriesTab({ categories, canManage }: SettingsCategoriesTabProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<SerializedDocumentCategory | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<SerializedDocumentCategory | null>(null);

  const [togglingId, setTogglingId] = useState<string | null>(null);

  const filteredCategories = categories.filter((cat) => {
    const matchesSearch =
      cat.name.toLowerCase().includes(search.toLowerCase()) ||
      cat.codePrefix.toLowerCase().includes(search.toLowerCase()) ||
      (cat.description && cat.description.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterStatus === "ACTIVE") return cat.isActive;
    if (filterStatus === "INACTIVE") return !cat.isActive;
    return true;
  });

  const handleToggle = async (cat: SerializedDocumentCategory) => {
    if (!canManage) return;
    setTogglingId(cat.id);
    try {
      await toggleDocumentCategoryStatusAction({ id: cat.id });
      router.refresh();
    } catch (err) {
      console.error("Gagal toggle status kategori:", err);
    } finally {
      setTogglingId(null);
    }
  };

  const handleOpenEdit = (cat: SerializedDocumentCategory) => {
    setSelectedCategory(cat);
    setModalOpen(true);
  };

  const handleOpenAdd = () => {
    setSelectedCategory(null);
    setModalOpen(true);
  };

  const handleOpenDelete = (cat: SerializedDocumentCategory) => {
    setCategoryToDelete(cat);
    setDeleteModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama atau prefix kode..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#102E50] focus:border-transparent transition"
            />
          </div>
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setFilterStatus("ALL")}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                filterStatus === "ALL" ? "bg-white text-slate-900 shadow-2xs font-bold" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Semua ({categories.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus("ACTIVE")}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                filterStatus === "ACTIVE"
                  ? "bg-white text-emerald-700 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Aktif ({categories.filter((c) => c.isActive).length})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus("INACTIVE")}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                filterStatus === "INACTIVE"
                  ? "bg-white text-slate-700 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Nonaktif ({categories.filter((c) => !c.isActive).length})
            </button>
          </div>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#102E50] text-white text-xs font-semibold hover:bg-[#102E50]/90 transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Kategori Baru</span>
          </button>
        )}
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Kategori & Deskripsi</th>
                <th className="py-3 px-4">Prefix Kode Dokumen</th>
                <th className="py-3 px-4">Lencana Badge</th>
                <th className="py-3 px-4 text-center">Dokumen Terkait</th>
                <th className="py-3 px-4 text-center">Status</th>
                {canManage && <th className="py-3 px-4 text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? 6 : 5} className="py-12 text-center text-slate-400">
                    <FolderKanban className="w-8 h-8 mx-auto text-slate-300 mb-2 stroke-[1.5]" />
                    <p className="font-semibold text-slate-600">Tidak ada kategori dokumen ditemukan</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {search ? "Coba sesuaikan kata kunci pencarian Anda" : "Klik tombol di atas untuk mendaftarkan kategori baru"}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredCategories.map((cat) => {
                  const colorScheme = COLOR_CLASSES[cat.color || "blue"] || COLOR_CLASSES.blue;
                  const isToggling = togglingId === cat.id;

                  return (
                    <tr key={cat.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Nama & Deskripsi */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800 leading-snug">{cat.name}</div>
                        {cat.description ? (
                          <div className="text-[11px] text-slate-500 mt-0.5 max-w-sm line-clamp-1">
                            {cat.description}
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-400 italic mt-0.5">Tanpa deskripsi tambahan</div>
                        )}
                      </td>

                      {/* Prefix Kode */}
                      <td className="py-3.5 px-4">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200/80 font-mono font-bold text-[#102E50] text-[11px]">
                          <span>{cat.codePrefix}</span>
                          <span className="text-slate-400 font-normal">###</span>
                        </div>
                      </td>

                      {/* Lencana */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${colorScheme?.bg} ${colorScheme?.text} ${colorScheme?.border}`}
                        >
                          {cat.name}
                        </span>
                      </td>

                      {/* Dokumen Terkait */}
                      <td className="py-3.5 px-4 text-center">
                        {cat.documentCount > 0 ? (
                          <Link
                            href={`/dokumen?category=${encodeURIComponent(cat.name)}`}
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 text-[11px] font-semibold transition"
                            title="Buka dokumen dengan kategori ini"
                          >
                            <FileText className="w-3 h-3 text-blue-600" />
                            <span>{cat.documentCount} Berkas</span>
                          </Link>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-normal">0 Berkas</span>
                        )}
                      </td>

                      {/* Status Toggle */}
                      <td className="py-3.5 px-4 text-center">
                        {canManage ? (
                          <button
                            type="button"
                            disabled={isToggling}
                            onClick={() => handleToggle(cat)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition ${
                              cat.isActive
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
                            }`}
                          >
                            {isToggling ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : cat.isActive ? (
                              <ToggleRight className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <ToggleLeft className="w-4 h-4 text-slate-400" />
                            )}
                            <span>{cat.isActive ? "Aktif" : "Nonaktif"}</span>
                          </button>
                        ) : (
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              cat.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {cat.isActive ? "Aktif" : "Nonaktif"}
                          </span>
                        )}
                      </td>

                      {/* Aksi */}
                      {canManage && (
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(cat)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
                              title="Ubah metadata kategori"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenDelete(cat)}
                              className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition"
                              title="Hapus kategori"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <SettingsCategoryModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialData={selectedCategory}
      />

      <SettingsDeleteCategoryModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        category={categoryToDelete}
      />
    </div>
  );
}
