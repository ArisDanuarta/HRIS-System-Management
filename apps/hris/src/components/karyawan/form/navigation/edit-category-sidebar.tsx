"use client";

import React from "react";
import {
  User,
  GraduationCap,
  Briefcase,
  FileText,
  Receipt,
  FolderArchive,
  KeyRound,
} from "lucide-react";
import { useEmployeeForm } from "../employee-form.context";
import { EditCategoryKey } from "../types";

interface CategoryItem {
  key: EditCategoryKey;
  label: string;
  icon: React.ElementType;
}

const CATEGORIES: CategoryItem[] = [
  { key: "identitas", label: "Identitas & Kontak", icon: User },
  { key: "riwayat", label: "Keluarga & Riwayat", icon: GraduationCap },
  { key: "penempatan", label: "Penempatan & Kontrak", icon: Briefcase },
  { key: "kompensasi", label: "Kompensasi & Pajak", icon: Receipt },
  { key: "pajak_bank", label: "Pajak, BPJS & Bank", icon: FileText },
  { key: "berkas", label: "Dokumen Pegawai", icon: FolderArchive },
  { key: "akun", label: "Akun Pengguna Sistem", icon: KeyRound },
];

export function EditCategorySidebar() {
  const { activeCategory, setActiveCategory, dirtyCategories } = useEmployeeForm();

  return (
    <>
      {/* Mobile Horizontal Pills (< 1024px) */}
      <div className="lg:hidden w-full overflow-x-auto scrollbar-none pb-1 [overscroll-behavior-x:contain]">
        <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-slate-200 shadow-2xs w-max">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.key;
            const isDirty = dirtyCategories.has(cat.key);

            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setActiveCategory(cat.key)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#102E50] text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-[#F2AF3E]" : "text-slate-400"}`} />
                <span>{cat.label}</span>
                {isDirty && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isActive ? "bg-[#F2AF3E]" : "bg-amber-500 animate-pulse"
                    }`}
                    title="Ada perubahan belum disimpan"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop Sticky Vertical Sidebar (>= 1024px) */}
      <aside className="hidden lg:flex w-64 xl:w-72 shrink-0 flex-col gap-3 sticky top-20">
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          {/* Header strip */}
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Kategori Data Pegawai
            </span>
          </div>

          <nav className="p-2 flex flex-col gap-1">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.key;
              const isDirty = dirtyCategories.has(cat.key);

              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setActiveCategory(cat.key)}
                  className={`w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-all cursor-pointer ${
                    isActive
                      ? "bg-[#102E50] text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? "text-[#F2AF3E]" : "text-slate-400"
                      }`}
                    />
                    <span className="truncate">{cat.label}</span>
                  </div>

                  {isDirty && (
                    <span
                      className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                        isActive
                          ? "bg-amber-400/20 text-amber-200 border border-amber-300/30"
                          : "bg-amber-100 text-amber-800 border border-amber-200"
                      }`}
                    >
                      Diubah
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
}
