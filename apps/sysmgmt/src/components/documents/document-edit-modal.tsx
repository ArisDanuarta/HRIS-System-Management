"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { DocumentDetailWithVersions } from "@/server/queries/document.queries";
import { DocumentVisibility, DocumentStatus } from "@pspk/db";
import { updateDocumentMetadataAction } from "@/server/actions/document.actions";
import {
  X,
  Edit3,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from "lucide-react";

interface DocumentEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentDetailWithVersions;
  allowedVisibilities: DocumentVisibility[];
}

const CATEGORY_OPTIONS = [
  "Kebijakan Lembaga",
  "SOP HR & Kepegawaian",
  "SOP IT & Sistem",
  "SOP Keuangan",
  "SOP Umum & Operasional",
];

export function DocumentEditModal({
  isOpen,
  onClose,
  document: doc,
  allowedVisibilities,
}: DocumentEditModalProps) {
  const router = useRouter();

  const [title, setTitle] = useState(doc.title);
  const [category, setCategory] = useState(doc.category);
  const [visibility, setVisibility] = useState<DocumentVisibility>(doc.visibility);
  const [status, setStatus] = useState<DocumentStatus>(doc.status);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !category.trim()) {
      setErrorMessage("Judul dan kategori dokumen wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.set("id", doc.id);
      formData.set("title", title.trim());
      formData.set("category", category.trim());
      formData.set("visibility", visibility);
      formData.set("status", status);

      const res = await updateDocumentMetadataAction(formData);

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
        err instanceof Error ? err.message : "Terjadi kesalahan saat memperbarui metadata.",
      );
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header Modal */}
        <div className="px-6 py-4 bg-slate-50/90 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#102E50]/10 text-[#102E50] flex items-center justify-center">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 font-serif">
                Ubah Metadata Dokumen
              </h2>
              <p className="text-xs text-slate-500">
                Pembaruan klasifikasi dan hak akses {doc.code}.
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
              <span>Metadata dokumen berhasil diperbarui!</span>
            </div>
          )}

          {/* Kode Registrasi (Read-only) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Kode Registrasi Dokumen (Permanen)
            </label>
            <input
              type="text"
              value={doc.code}
              disabled
              className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-500 cursor-not-allowed"
            />
          </div>

          {/* Judul Dokumen */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Judul Lengkap Dokumen <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50]"
              required
            />
          </div>

          {/* Kategori Dokumen */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Kategori Dokumen <span className="text-rose-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50] cursor-pointer"
            >
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Visibilitas & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Hak Akses / Visibilitas
              </label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as DocumentVisibility)}
                disabled={isSubmitting}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50] cursor-pointer"
              >
                {allowedVisibilities.includes(DocumentVisibility.ALL_STAFF) && (
                  <option value={DocumentVisibility.ALL_STAFF}>Semua Staf</option>
                )}
                {allowedVisibilities.includes(DocumentVisibility.MANAGERS) && (
                  <option value={DocumentVisibility.MANAGERS}>Khusus Manajer</option>
                )}
                {allowedVisibilities.includes(DocumentVisibility.HR_ONLY) && (
                  <option value={DocumentVisibility.HR_ONLY}>Khusus HR</option>
                )}
                {allowedVisibilities.includes(DocumentVisibility.IT_ONLY) && (
                  <option value={DocumentVisibility.IT_ONLY}>Khusus IT</option>
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Status Dokumen
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as DocumentStatus)}
                disabled={isSubmitting}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50] cursor-pointer"
              >
                <option value={DocumentStatus.ACTIVE}>Aktif Berlaku</option>
                <option value={DocumentStatus.DRAFT}>Draf Pembahasan</option>
                <option value={DocumentStatus.ARCHIVED}>Diarsipkan</option>
              </select>
            </div>
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
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 bg-[#102E50] text-[#F2AF3E] hover:bg-[#163a63] text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>Simpan Perubahan</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
