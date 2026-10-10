"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  archiveDocumentAction,
  deleteDocumentAction,
} from "@/server/actions/document.actions";
import {
  X,
  Archive,
  Trash2,
  AlertTriangle,
  Loader2,
  CheckCircle2,
} from "lucide-react";

interface DocumentArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  documentCode: string;
  documentTitle: string;
  mode: "archive" | "delete";
}

export function DocumentArchiveModal({
  isOpen,
  onClose,
  documentId,
  documentCode,
  documentTitle,
  mode,
}: DocumentArchiveModalProps) {
  const router = useRouter();

  const [reason, setReason] = useState("");
  const [confirmCodeInput, setConfirmCodeInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const isDeleteMode = mode === "delete";

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isDeleteMode && confirmCodeInput.trim() !== documentCode.trim()) {
      setErrorMessage(`Ketik kode "${documentCode}" secara tepat untuk mengonfirmasi.`);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = isDeleteMode
        ? await deleteDocumentAction(documentId)
        : await archiveDocumentAction(documentId, reason.trim() || undefined);

      if (!res.success) {
        setErrorMessage(res.message);
        setIsSubmitting(false);
        return;
      }

      setIsSuccess(true);
      setTimeout(() => {
        setIsSubmitting(false);
        setIsSuccess(false);
        onClose();
        if (isDeleteMode) {
          router.push("/dokumen");
        } else {
          router.refresh();
        }
      }, 1000);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Terjadi kesalahan saat memproses permintaan.",
      );
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header Modal */}
        <div className="px-6 py-4 bg-slate-50/90 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                isDeleteMode
                  ? "bg-rose-500/10 text-rose-600"
                  : "bg-amber-500/10 text-amber-600"
              }`}
            >
              {isDeleteMode ? <Trash2 className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 font-serif">
                {isDeleteMode ? "Hapus Dokumen Permanen" : "Arsipkan Dokumen"}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleConfirm} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {isSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {isDeleteMode
                  ? "Dokumen berhasil dihapus permanen!"
                  : "Dokumen berhasil diarsipkan!"}
              </span>
            </div>
          )}

          {/* Info Card Dokumen */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Kode Registrasi:</span>
              <span className="font-mono font-bold text-slate-800">{documentCode}</span>
            </div>
            <p className="font-semibold text-slate-800 line-clamp-1">{documentTitle}</p>
          </div>

          {/* Pesan Konfirmasi */}
          {isDeleteMode ? (
            <div className="space-y-3">
              <p className="text-xs text-rose-600 leading-relaxed font-medium">
                Peringatan: Tindakan ini akan menghapus seluruh data dokumen, semua berkas versi fisik di storage, dan catatan riwayat secara permanen.
              </p>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ketik kode <strong className="font-mono text-rose-600">{documentCode}</strong> untuk konfirmasi:
                </label>
                <input
                  type="text"
                  value={confirmCodeInput}
                  onChange={(e) => setConfirmCodeInput(e.target.value)}
                  placeholder={`Ketik ${documentCode}`}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  required
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                Status dokumen akan dialihkan menjadi <strong>DIARSIPKAN</strong>. Dokumen tidak lagi tampil dalam daftar kebijakan aktif, namun seluruh berkas dan riwayat versi tetap tersimpan secara aman.
              </p>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alasan Pengarsipan (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Contoh: Digantikan oleh SK/SOP versi terbaru tahun 2026..."
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50]"
                />
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={
                isSubmitting ||
                (isDeleteMode && confirmCodeInput.trim() !== documentCode.trim())
              }
              className={`inline-flex items-center gap-2 px-5 py-2 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                isDeleteMode
                  ? "bg-rose-600 hover:bg-rose-700"
                  : "bg-amber-600 hover:bg-amber-700"
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <span>{isDeleteMode ? "Hapus Permanen" : "Konfirmasi Arsip"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
