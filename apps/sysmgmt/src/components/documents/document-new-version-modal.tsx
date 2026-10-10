"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { uploadDocumentVersionAction } from "@/server/actions/document.actions";
import {
  X,
  UploadCloud,
  FileText,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Layers,
} from "lucide-react";

interface DocumentNewVersionModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  documentCode: string;
  documentTitle: string;
  currentLatestVersionNo: number;
}

export function DocumentNewVersionModal({
  isOpen,
  onClose,
  documentId,
  documentCode,
  documentTitle,
  currentLatestVersionNo,
}: DocumentNewVersionModalProps) {
  const router = useRouter();

  const nextVersionNo = currentLatestVersionNo + 1;
  const [effectiveDate, setEffectiveDate] = useState(
    () => new Date().toISOString().split("T")[0] || "",
  );
  const [changeNote, setChangeNote] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 25 * 1024 * 1024) {
        setErrorMessage("Ukuran berkas melebihi batas maksimal 25 MB.");
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setErrorMessage(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMessage("Silakan pilih berkas versi baru yang hendak diunggah.");
      return;
    }
    if (!changeNote.trim()) {
      setErrorMessage("Catatan perubahan / revisi pasal wajib diisi untuk setiap versi baru.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.set("documentId", documentId);
      formData.set("effectiveDate", effectiveDate);
      formData.set("changeNote", changeNote.trim());
      formData.set("file", selectedFile);

      const res = await uploadDocumentVersionAction(formData);

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
        router.refresh();
      }, 1000);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Terjadi kesalahan saat mengunggah versi baru.",
      );
      setIsSubmitting(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header Modal */}
        <div className="px-6 py-4 bg-slate-50/90 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#102E50]/10 text-[#102E50] flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 font-serif">
                Unggah Versi Baru (v{nextVersionNo}.0)
              </h2>
              <p className="text-xs text-slate-500">
                Pembaruan iterasi dokumen {documentCode}.
              </p>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {isSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Versi baru berhasil diterbitkan!</span>
            </div>
          )}

          {/* Info Banner Dokumen Induk */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Dokumen Induk:</span>
              <span className="font-mono font-bold text-[#102E50]">{documentCode}</span>
            </div>
            <p className="font-semibold text-slate-800 line-clamp-1">{documentTitle}</p>
            <div className="pt-1 text-[11px] text-slate-500 flex items-center gap-2">
              <span>Versi Aktif Saat Ini: <strong>v{currentLatestVersionNo}</strong></span>
              <span>→</span>
              <span className="text-emerald-700 font-bold">Target Baru: v{nextVersionNo}.0</span>
            </div>
          </div>

          {/* Tanggal Efektif */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tanggal Efektif Berlaku Versi Baru <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50]"
              required
            />
          </div>

          {/* Catatan Perubahan (Required) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Catatan Perubahan / Poin Revisi <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={changeNote}
              onChange={(e) => setChangeNote(e.target.value)}
              placeholder="Jelaskan alasan pembaruan, pasal/poin yang diamandemen, atau pejabat yang mengesahkan revisi ini..."
              disabled={isSubmitting}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50]"
              required
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Catatan perubahan akan tercantum pada timeline riwayat versi untuk kebutuhan audit.
            </p>
          </div>

          {/* Dropzone Berkas Revisi Baru */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Berkas Versi Baru <span className="text-rose-500">*</span>
            </label>

            {!selectedFile ? (
              <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 hover:border-[#102E50] rounded-2xl bg-slate-50/60 hover:bg-slate-50 transition-colors cursor-pointer group">
                <div className="w-10 h-10 rounded-xl bg-[#102E50]/5 text-[#102E50] group-hover:scale-110 flex items-center justify-center mb-2 transition-transform">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold text-slate-700">
                  Pilih berkas baru (PDF, DOCX, XLSX)
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5">Maksimal 25 MB</span>
                <input
                  type="file"
                  accept=".pdf,.docx,.doc,.xlsx,.xls,.png,.jpg,.jpeg"
                  onChange={handleFileChange}
                  disabled={isSubmitting}
                  className="hidden"
                  required
                />
              </label>
            ) : (
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-[#102E50]/10 text-[#102E50] flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  disabled={isSubmitting}
                  className="text-xs font-semibold text-rose-600 hover:underline cursor-pointer"
                >
                  Ganti
                </button>
              </div>
            )}
          </div>

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
              disabled={isSubmitting || !selectedFile || !changeNote.trim()}
              className="inline-flex items-center gap-2 px-5 py-2 bg-[#102E50] text-[#F2AF3E] hover:bg-[#163a63] text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Mengunggah Versi Baru...</span>
                </>
              ) : (
                <span>Terbitkan v{nextVersionNo}.0</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
