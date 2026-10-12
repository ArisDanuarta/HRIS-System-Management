"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { SerializedDocumentCategory } from "@/server/queries/settings.queries";
import {
  createDocumentCategoryAction,
  updateDocumentCategoryAction,
} from "@/server/actions/settings.actions";
import {
  FolderKanban,
  Loader2,
  X,
  AlertTriangle,
  Sparkles,
} from "lucide-react";

interface SettingsCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: SerializedDocumentCategory | null;
}

const COLOR_OPTIONS = [
  { key: "blue", label: "Biru", bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-300" },
  { key: "indigo", label: "Indigo", bg: "bg-indigo-100", text: "text-indigo-700", border: "border-indigo-300" },
  { key: "emerald", label: "Hijau", bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-300" },
  { key: "amber", label: "Kuning", bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-300" },
  { key: "slate", label: "Abu-abu", bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-300" },
  { key: "rose", label: "Merah", bg: "bg-rose-100", text: "text-rose-700", border: "border-rose-300" },
  { key: "purple", label: "Ungu", bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-300" },
  { key: "cyan", label: "Cyan", bg: "bg-cyan-100", text: "text-cyan-700", border: "border-cyan-300" },
];

function CategoryFormInner({
  onClose,
  initialData,
}: {
  onClose: () => void;
  initialData?: SerializedDocumentCategory | null;
}) {
  const router = useRouter();
  const isEditing = Boolean(initialData);

  const [name, setName] = useState(initialData?.name || "");
  const [codePrefix, setCodePrefix] = useState(initialData?.codePrefix || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [color, setColor] = useState(initialData?.color || "blue");
  const [isActive, setIsActive] = useState(initialData ? initialData.isActive : true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanName = name.trim();
    let cleanPrefix = codePrefix.trim().toUpperCase();

    if (!cleanName) {
      setErrorMsg("Nama kategori wajib diisi.");
      return;
    }

    if (!cleanPrefix) {
      setErrorMsg("Prefix kode dokumen wajib diisi.");
      return;
    }

    // Auto-append trailing hyphen jika user lupa
    if (!cleanPrefix.endsWith("-")) {
      cleanPrefix = `${cleanPrefix}-`;
    }

    setIsSubmitting(true);

    try {
      if (isEditing && initialData) {
        const res = await updateDocumentCategoryAction({
          id: initialData.id,
          name: cleanName,
          codePrefix: cleanPrefix,
          description: description.trim() || null,
          color,
          isActive,
        });

        if (!res.ok) {
          setErrorMsg(res.error);
          setIsSubmitting(false);
          return;
        }
      } else {
        const res = await createDocumentCategoryAction({
          name: cleanName,
          codePrefix: cleanPrefix,
          description: description.trim() || null,
          color,
          isActive,
        });

        if (!res.ok) {
          setErrorMsg(res.error);
          setIsSubmitting(false);
          return;
        }
      }

      router.refresh();
      onClose();
    } catch (err) {
      console.error("Gagal menyimpan kategori dokumen:", err);
      setErrorMsg(err instanceof Error ? err.message : "Terjadi kesalahan sistem.");
      setIsSubmitting(false);
    }
  };

  const selectedColorOption = COLOR_OPTIONS.find((c) => c.key === color) || COLOR_OPTIONS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#102E50]/10 text-[#102E50] flex items-center justify-center font-bold">
              <FolderKanban className="w-5 h-5 text-[#102E50]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                {isEditing ? "Ubah Kategori Dokumen" : "Tambah Kategori Dokumen Baru"}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {isEditing
                  ? "Perbarui metadata atau skema penomoran kode kategori"
                  : "Daftarkan kategori dokumen resmi baru untuk repositori lembaga"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMsg}</div>
            </div>
          )}

          {/* Nama Kategori */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Nama Kategori <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: SOP Riset Kebijakan, Surat Keputusan"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#102E50] focus:border-transparent transition"
            />
          </div>

          {/* Prefix Kode Dokumen */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Prefix Kode Dokumen <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={codePrefix}
                onChange={(e) => setCodePrefix(e.target.value.toUpperCase())}
                placeholder="Contoh: SOP-RST-, KBJ-, SOP-HR-"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold text-[#102E50] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#102E50] focus:border-transparent transition uppercase"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500 inline" />
              Kode dokumen baru akan otomatis memakai format:{" "}
              <span className="font-mono font-bold text-slate-700">
                {codePrefix.trim() ? (codePrefix.endsWith("-") ? codePrefix : `${codePrefix}-`) : "SOP-"}001
              </span>
            </p>
          </div>

          {/* Pilihan Warna Badge */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Warna Lencana (Badge Color)
            </label>
            <div className="grid grid-cols-4 gap-2">
              {COLOR_OPTIONS.map((c) => {
                const isSelected = color === c.key;
                return (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => setColor(c.key)}
                    className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-medium border transition-all ${
                      isSelected
                        ? "border-[#102E50] bg-slate-100 ring-2 ring-[#102E50]/20 font-bold"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <span className={`w-3 h-3 rounded-full ${c.bg} border ${c.border}`} />
                    <span className="text-slate-700 text-[11px]">{c.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-[11px] text-slate-500">Pratinjau tampilan:</span>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${selectedColorOption?.bg} ${selectedColorOption?.text} ${selectedColorOption?.border}`}
              >
                {name.trim() || "Nama Kategori"}
              </span>
            </div>
          </div>

          {/* Deskripsi */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Deskripsi / Ruang Lingkup
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Catatan mengenai jenis kebijakan atau prosedur yang dicakup oleh kategori ini..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#102E50] focus:border-transparent transition"
            />
          </div>

          {/* Status Aktif */}
          <div className="pt-2">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded text-[#102E50] border-slate-300 focus:ring-[#102E50]"
              />
              <span className="text-xs font-medium text-slate-700">
                Aktifkan kategori ini untuk formulir pembuatan dokumen baru
              </span>
            </label>
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-[#102E50] text-white text-xs font-semibold hover:bg-[#102E50]/90 transition flex items-center gap-2 disabled:opacity-50 shadow-xs"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isEditing ? "Simpan Perubahan" : "Buat Kategori"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function SettingsCategoryModal({ isOpen, onClose, initialData }: SettingsCategoryModalProps) {
  if (!isOpen) return null;
  return <CategoryFormInner onClose={onClose} initialData={initialData} />;
}
