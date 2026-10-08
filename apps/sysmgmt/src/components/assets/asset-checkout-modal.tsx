"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { SerializedAsset, ActiveEmployeeOption } from "@/server/queries/asset.queries";
import { checkoutAssetAction } from "@/server/actions/asset.actions";
import {
  X,
  UserCheck,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Calendar,
} from "lucide-react";

interface AssetCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: SerializedAsset | null;
  employees: ActiveEmployeeOption[];
}

function AssetCheckoutInnerModal({
  onClose,
  asset,
  employees,
}: {
  onClose: () => void;
  asset: SerializedAsset;
  employees: ActiveEmployeeOption[];
}) {
  const router = useRouter();

  const [employeeId, setEmployeeId] = useState(employees[0]?.id || "");
  const [assignedAt, setAssignedAt] = useState(() => new Date().toISOString().split("T")[0] || "");
  const [conditionOut, setConditionOut] = useState("Baik / Lengkap & Berfungsi Normal");
  const [notes, setNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!employeeId) {
      setErrorMsg("Pegawai penerima wajib dipilih.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await checkoutAssetAction({
        assetId: asset.id,
        employeeId,
        assignedAt,
        conditionOut: conditionOut.trim(),
        notes: notes.trim() || null,
      });

      if (!res.ok) {
        setErrorMsg(res.error || "Gagal melakukan serah terima aset.");
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

  const selectedEmployee = employees.find((e) => e.id === employeeId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-200">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 font-serif">
                Serah Terima Aset (Checkout)
              </h3>
              <p className="text-xs text-slate-500">
                Pinjamkan unit {asset.name} ({asset.assetTag}) kepada staf
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

          {/* Ringkasan Aset yang Diserahkan */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Unit Barang:</span>
              <span className="font-semibold text-slate-900">{asset.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Tag & Kategori:</span>
              <span className="font-mono font-bold text-[#102E50]">
                {asset.assetTag} ({asset.category})
              </span>
            </div>
            {asset.serialNumber && (
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Nomor Seri:</span>
                <span className="font-mono text-slate-600">{asset.serialNumber}</span>
              </div>
            )}
          </div>

          {/* Pilihan Pegawai Penerima */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Pilih Pegawai Penerima <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-[#102E50] focus:border-transparent outline-none"
            >
              {employees.length === 0 ? (
                <option value="">Tidak ada pegawai aktif ditemukan</option>
              ) : (
                employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.fullName} ({emp.employeeNo}) — {emp.departmentName}
                  </option>
                ))
              )}
            </select>
            {selectedEmployee && (
              <p className="text-[11px] text-slate-500 mt-1">
                Posisi: <span className="font-medium text-slate-700">{selectedEmployee.positionTitle}</span> |
                Email: <span className="font-medium text-slate-700">{selectedEmployee.workEmail}</span>
              </p>
            )}
          </div>

          {/* Tanggal Serah Terima */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Tanggal Penyerahan Barang <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="date"
                required
                value={assignedAt}
                onChange={(e) => setAssignedAt(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-[#102E50] focus:border-transparent outline-none"
              />
              <Calendar className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* Kondisi Fisik Saat Diserahkan */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Kondisi Fisik Saat Diserahkan <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={conditionOut}
              onChange={(e) => setConditionOut(e.target.value)}
              placeholder="mis. Baik / Normal / Mulus tanpa goresan"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-[#102E50] focus:border-transparent outline-none"
            />
          </div>

          {/* Catatan / Kelengkapan Tambahan */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Catatan Kelengkapan & Aksesori
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="mis. Disertai charger bawaan 67W, tas laptop, dan dongle HDMI."
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
              disabled={isSubmitting || !employeeId}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-600 text-white text-xs font-semibold rounded-lg hover:bg-sky-700 transition-colors disabled:opacity-50 shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                  <span>Serahkan Aset</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function AssetCheckoutModal(props: AssetCheckoutModalProps) {
  if (!props.isOpen || !props.asset) return null;
  return <AssetCheckoutInnerModal key={props.asset.id} {...props} asset={props.asset} />;
}
