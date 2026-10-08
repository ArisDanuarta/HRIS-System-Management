"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { SerializedAsset } from "@/server/queries/asset.queries";
import { deleteAssetAction } from "@/server/actions/asset.actions";
import { Trash2, AlertTriangle, Loader2, X } from "lucide-react";

interface AssetDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: SerializedAsset | null;
}

export function AssetDeleteModal({ isOpen, onClose, asset }: AssetDeleteModalProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !asset) return null;

  const handleDelete = async () => {
    setErrorMsg(null);
    setIsDeleting(true);

    try {
      const res = await deleteAssetAction({ id: asset.id });
      if (!res.ok) {
        setErrorMsg(res.error || "Gagal menghapus data aset.");
        setIsDeleting(false);
        return;
      }

      router.refresh();
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Terjadi kesalahan sistem.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200">
              <Trash2 className="w-5 h-5" />
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <h3 className="text-base font-bold text-slate-900 font-serif mb-1.5">
            Hapus Aset dari Inventaris?
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed mb-4">
            Tindakan ini akan menghapus data aset secara permanen dari sistem. Pastikan barang
            tersebut memang tidak lagi terdaftar dalam inventaris lembaga.
          </p>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 mb-4 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-400">Tag Aset:</span>
              <span className="font-mono font-bold text-[#102E50]">{asset.assetTag}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Nama Aset:</span>
              <span className="font-semibold text-slate-800">{asset.name}</span>
            </div>
            {asset.serialNumber && (
              <div className="flex justify-between">
                <span className="text-slate-400">Nomor Seri:</span>
                <span className="font-mono text-slate-600">{asset.serialNumber}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-400">Status Fisik:</span>
              <span className="font-semibold text-slate-700">{asset.status}</span>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-rose-700 text-xs mb-4">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 text-white text-xs font-semibold rounded-lg hover:bg-rose-700 transition-colors disabled:opacity-50 shadow-xs"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Menghapus...</span>
                </>
              ) : (
                <span>Ya, Hapus Aset</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
