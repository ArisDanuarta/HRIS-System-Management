"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { SerializedAssetLocation } from "@/server/queries/settings.queries";
import {
  createAssetLocationAction,
  updateAssetLocationAction,
} from "@/server/actions/settings.actions";
import { MapPin, Loader2, X, AlertTriangle } from "lucide-react";

interface SettingsAssetLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: SerializedAssetLocation | null;
}

function AssetLocationFormInner({
  onClose,
  initialData,
}: {
  onClose: () => void;
  initialData?: SerializedAssetLocation | null;
}) {
  const router = useRouter();
  const isEditing = Boolean(initialData);

  const [name, setName] = useState(initialData?.name || "");
  const [building, setBuilding] = useState(initialData?.building || "Gedung Edukasi");
  const [floor, setFloor] = useState(initialData?.floor || "Lt. 3");
  const [description, setDescription] = useState(initialData?.description || "");
  const [isActive, setIsActive] = useState(initialData ? initialData.isActive : true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanName = name.trim();
    if (!cleanName) {
      setErrorMsg("Nama ruangan / lokasi wajib diisi.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditing && initialData) {
        const res = await updateAssetLocationAction({
          id: initialData.id,
          name: cleanName,
          building: building.trim() || null,
          floor: floor.trim() || null,
          description: description.trim() || null,
          isActive,
        });

        if (!res.ok) {
          setErrorMsg(res.error);
          setIsSubmitting(false);
          return;
        }
      } else {
        const res = await createAssetLocationAction({
          name: cleanName,
          building: building.trim() || null,
          floor: floor.trim() || null,
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
      console.error("Gagal menyimpan lokasi aset:", err);
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
              <MapPin className="w-5 h-5 text-[#102E50]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                {isEditing ? "Ubah Lokasi Ruangan" : "Tambah Lokasi Ruangan Baru"}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Penempatan fisik inventaris kantor</p>
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

          {/* Nama Lokasi */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Nama Lokasi / Ruangan <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Ruang Kerja Utama Lt. 3, Gudang Logistik"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#102E50] focus:border-transparent transition"
            />
          </div>

          {/* Gedung & Lantai */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Nama Gedung</label>
              <input
                type="text"
                value={building}
                onChange={(e) => setBuilding(e.target.value)}
                placeholder="Gedung Edukasi"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#102E50] focus:border-transparent transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Lantai</label>
              <input
                type="text"
                value={floor}
                onChange={(e) => setFloor(e.target.value)}
                placeholder="Lt. 3 / Lt. Dasar"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#102E50] focus:border-transparent transition"
              />
            </div>
          </div>

          {/* Deskripsi */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Deskripsi / Kapasitas
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Catatan peruntukan ruangan, fasilitas, atau penanggung jawab..."
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
                Aktifkan lokasi ini pada dropdown penempatan aset
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
              <span>{isEditing ? "Simpan Perubahan" : "Buat Lokasi"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function SettingsAssetLocationModal({
  isOpen,
  onClose,
  initialData,
}: SettingsAssetLocationModalProps) {
  if (!isOpen) return null;
  return <AssetLocationFormInner onClose={onClose} initialData={initialData} />;
}
