"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { SerializedAssetType } from "@/server/queries/settings.queries";
import {
  createAssetTypeAction,
  updateAssetTypeAction,
} from "@/server/actions/settings.actions";
import { Layers, Loader2, X, AlertTriangle, Monitor, Package } from "lucide-react";

interface SettingsAssetTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: SerializedAssetType | null;
  defaultCategory?: "IT" | "NON_IT";
}

function AssetTypeFormInner({
  onClose,
  initialData,
  defaultCategory = "IT",
}: {
  onClose: () => void;
  initialData?: SerializedAssetType | null;
  defaultCategory?: "IT" | "NON_IT";
}) {
  const router = useRouter();
  const isEditing = Boolean(initialData);

  const [name, setName] = useState(initialData?.name || "");
  const [category, setCategory] = useState<"IT" | "NON_IT">(
    initialData ? initialData.category : defaultCategory,
  );
  const [description, setDescription] = useState(initialData?.description || "");
  const [isActive, setIsActive] = useState(initialData ? initialData.isActive : true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanName = name.trim();
    if (!cleanName) {
      setErrorMsg("Nama tipe aset wajib diisi.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditing && initialData) {
        const res = await updateAssetTypeAction({
          id: initialData.id,
          name: cleanName,
          category,
          description: description.trim() || null,
          isActive,
        });

        if (!res.ok) {
          setErrorMsg(res.error);
          setIsSubmitting(false);
          return;
        }
      } else {
        const res = await createAssetTypeAction({
          name: cleanName,
          category,
          description: description.trim() || null,
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
      console.error("Gagal menyimpan tipe aset:", err);
      setErrorMsg(err instanceof Error ? err.message : "Terjadi kesalahan sistem.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#102E50]/10 text-[#102E50] flex items-center justify-center font-bold">
              <Layers className="w-5 h-5 text-[#102E50]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                {isEditing ? "Ubah Tipe Inventaris" : "Tambah Tipe Inventaris Baru"}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Klasifikasi aset fisik lembaga</p>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMsg}</div>
            </div>
          )}

          {/* Klasifikasi Kategori */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Kelompok Klasifikasi <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCategory("IT")}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-semibold transition ${
                  category === "IT"
                    ? "border-blue-500 bg-blue-50/80 text-blue-900 ring-2 ring-blue-500/20"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Monitor className="w-4 h-4 text-blue-600" />
                <span>Perangkat TI</span>
              </button>
              <button
                type="button"
                onClick={() => setCategory("NON_IT")}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-semibold transition ${
                  category === "NON_IT"
                    ? "border-emerald-500 bg-emerald-50/80 text-emerald-900 ring-2 ring-emerald-500/20"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Package className="w-4 h-4 text-emerald-600" />
                <span>Fasilitas Non-TI</span>
              </button>
            </div>
          </div>

          {/* Nama Tipe Aset */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Nama Tipe Aset <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Laptop, Monitor Eksternal, Meja Kerja"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#102E50] focus:border-transparent transition"
            />
          </div>

          {/* Deskripsi */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Deskripsi / Keterangan
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Catatan spesifikasi umum atau panduan alokasi barang..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#102E50] focus:border-transparent transition"
            />
          </div>

          {/* Status Aktif */}
          <div>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded text-[#102E50] border-slate-300 focus:ring-[#102E50]"
              />
              <span className="text-xs font-medium text-slate-700">
                Aktifkan tipe aset ini pada form inventaris
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
              <span>{isEditing ? "Simpan Perubahan" : "Buat Tipe Aset"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function SettingsAssetTypeModal({
  isOpen,
  onClose,
  initialData,
  defaultCategory,
}: SettingsAssetTypeModalProps) {
  if (!isOpen) return null;
  return (
    <AssetTypeFormInner
      onClose={onClose}
      initialData={initialData}
      defaultCategory={defaultCategory}
    />
  );
}
