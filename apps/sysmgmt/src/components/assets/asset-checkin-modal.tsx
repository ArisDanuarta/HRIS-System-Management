"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { SerializedAsset } from "@/server/queries/asset.queries";
import { checkinAssetAction } from "@/server/actions/asset.actions";
import { formatDate } from "@pspk/shared";
import {
  X,
  RotateCcw,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Calendar,
  User,
} from "lucide-react";

interface AssetCheckinModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: SerializedAsset | null;
}

function AssetCheckinInnerModal({
  onClose,
  asset,
}: {
  onClose: () => void;
  asset: SerializedAsset;
}) {
  const router = useRouter();
  const activeAssignment = asset.activeAssignment;

  const [returnedAt, setReturnedAt] = useState(() => new Date().toISOString().split("T")[0] || "");
  const [conditionIn, setConditionIn] = useState("Baik / Lengkap & Berfungsi Normal");
  const [nextStatus, setNextStatus] = useState<"IN_STOCK" | "MAINTENANCE" | "RETIRED">("IN_STOCK");
  const [notes, setNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!activeAssignment) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 max-w-md w-full text-center">
          <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-900 mb-1">Tidak Ada Data Peminjaman</h3>
          <p className="text-xs text-slate-500 mb-4">
            Aset ini tidak memiliki catatan peminjaman aktif yang dapat dikembalikan.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-xs font-semibold rounded-lg text-slate-700 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const res = await checkinAssetAction({
        assignmentId: activeAssignment.id,
        assetId: asset.id,
        returnedAt,
        conditionIn: conditionIn.trim(),
        nextStatus,
        notes: notes.trim() || null,
      });

      if (!res.ok) {
        setErrorMsg(res.error || "Gagal mencatat pengembalian aset.");
        setIsSubmitting(false);
        return;
      }

      router.refresh();
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Terjadi kesalahan sistem.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 font-serif">
                Terima Pengembalian Aset (Check-in)
              </h3>
              <p className="text-xs text-slate-500">
                Pencatatan serah terima kembali barang ke inventaris lembaga
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Informasi Peminjam Saat Ini */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs space-y-2">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
              <span className="text-slate-500">Unit Barang:</span>
              <span className="font-semibold text-slate-900">
                {asset.name} ({asset.assetTag})
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <User className="w-4 h-4 text-[#102E50]" />
              <span className="font-semibold">{activeAssignment.employee.fullName}</span>
              <span className="text-slate-400">({activeAssignment.employee.departmentName || "Staff"})</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
              <div>
                <span className="text-slate-400 block">Tanggal Dipinjam:</span>
                <span className="font-medium text-slate-700">
                  {formatDate(activeAssignment.assignedAt)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Kondisi Saat Keluar:</span>
                <span className="font-medium text-slate-700">
                  {activeAssignment.conditionOut || "Baik"}
                </span>
              </div>
            </div>
          </div>

          {/* Tanggal Pengembalian */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Tanggal Diterima Kembali <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="date"
                required
                value={returnedAt}
                onChange={(e) => setReturnedAt(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-[#102E50] focus:border-transparent outline-none"
              />
              <Calendar className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* Kondisi Fisik Saat Masuk */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Kondisi Fisik Saat Diterima Kembali <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={conditionIn}
              onChange={(e) => setConditionIn(e.target.value)}
              placeholder="mis. Lengkap dengan charger & tas, layar mulus"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-[#102E50] focus:border-transparent outline-none"
            />
          </div>

          {/* Status Kelanjutan Aset */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Status Fisik Lanjutan Barang <span className="text-rose-500">*</span>
            </label>
            <select
              value={nextStatus}
              onChange={(e) =>
                setNextStatus(e.target.value as "IN_STOCK" | "MAINTENANCE" | "RETIRED")
              }
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-[#102E50] focus:border-transparent outline-none"
            >
              <option value="IN_STOCK">
                Tersedia di Gudang (Siap Dipinjamkan Lagi / IN_STOCK)
              </option>
              <option value="MAINTENANCE">
                Perlu Servis / Pemeliharaan IT (MAINTENANCE)
              </option>
              <option value="RETIRED">
                Afkir / Rusak Permanen & Tidak Dipakai (RETIRED)
              </option>
            </select>
            <p className="text-[11px] text-slate-400 mt-1">
              Barang yang dalam kondisi baik akan langsung kembali berstatus siap pinjam di gudang.
            </p>
          </div>

          {/* Catatan Pengembalian */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Catatan Pengembalian
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan tambahan saat penerimaan barang kembali..."
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-[#102E50] focus:border-transparent outline-none resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-200/80 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                  <span>Simpan Pengembalian</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function AssetCheckinModal(props: AssetCheckinModalProps) {
  if (!props.isOpen || !props.asset) return null;
  return <AssetCheckinInnerModal key={props.asset.id} {...props} asset={props.asset} />;
}
