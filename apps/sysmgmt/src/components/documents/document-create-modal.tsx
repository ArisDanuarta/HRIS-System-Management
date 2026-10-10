"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DocumentVisibility, DocumentStatus } from "@pspk/db";
import {
  createDocumentAction,
  getNextDocumentCodeAction,
} from "@/server/actions/document.actions";
import {
  X,
  UploadCloud,
  FileText,
  FileCode,
  FileSpreadsheet,
  File,
  AlertCircle,
  Loader2,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

interface DocumentCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  allowedVisibilities: DocumentVisibility[];
}

const CATEGORY_OPTIONS = [
  "Kebijakan Lembaga",
  "SOP HR & Kepegawaian",
  "SOP IT & Sistem",
  "SOP Keuangan",
  "SOP Umum & Operasional",
];

export function DocumentCreateModal({
  isOpen,
  onClose,
  allowedVisibilities,
}: DocumentCreateModalProps) {
  const router = useRouter();

  const [category, setCategory] = useState("SOP HR & Kepegawaian");
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [visibility, setVisibility] = useState<DocumentVisibility>(DocumentVisibility.ALL_STAFF);
  const [status, setStatus] = useState<DocumentStatus>(DocumentStatus.ACTIVE);
  const [effectiveDate, setEffectiveDate] = useState(
    () => new Date().toISOString().split("T")[0] || "",
  );
  const [changeNote, setChangeNote] = useState("Rilis versi awal dokumen resmi lembaga");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [isLoadingCode, setIsLoadingCode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Ambil saran kode otomatis saat kategori berubah
  useEffect(() => {
    if (isOpen && category && !code) {
      handleSuggestCode(category);
    }
  }, [isOpen, category]);

  if (!isOpen) return null;

  const handleSuggestCode = async (cat: string) => {
    setIsLoadingCode(true);
    try {
      const suggested = await getNextDocumentCodeAction(cat);
      setCode(suggested);
    } catch {
      // Abaikan jika gagal mengambil saran kode
    } finally {
      setIsLoadingCode(false);
    }
  };

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
      setErrorMessage("Silakan pilih berkas dokumen yang hendak diunggah.");
      return;
    }
    if (!code.trim() || !title.trim()) {
      setErrorMessage("Kode dan judul dokumen wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.set("code", code.trim().toUpperCase());
      formData.set("title", title.trim());
      formData.set("category", category.trim());
      formData.set("visibility", visibility);
      formData.set("status", status);
      formData.set("effectiveDate", effectiveDate);
      formData.set("changeNote", changeNote.trim());
      formData.set("file", selectedFile);

      const res = await createDocumentAction(formData);

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
        err instanceof Error ? err.message : "Terjadi kesalahan saat mengunggah dokumen.",
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
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header Modal */}
        <div className="px-6 py-4 bg-slate-50/90 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 font-serif">
              Unggah Dokumen / SOP Baru
            </h2>
            <p className="text-xs text-slate-500">
              Daftarkan kebijakan atau SOP ke repositori lembaga beserta berkas versi awal (v1).
            </p>
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
              <span>Dokumen berhasil diterbitkan ke repositori!</span>
            </div>
          )}

          {/* Baris 1: Kategori & Kode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kategori Dokumen <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  handleSuggestCode(e.target.value);
                }}
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

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Kode Registrasi <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => handleSuggestCode(category)}
                  disabled={isLoadingCode || isSubmitting}
                  className="text-[11px] font-semibold text-[#102E50] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-[#F2AF3E]" />
                  <span>Saran Otomatis</span>
                </button>
              </div>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Contoh: SOP-HR-001"
                disabled={isSubmitting}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 uppercase focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50]"
                required
              />
            </div>
          </div>

          {/* Baris 2: Judul Dokumen */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Judul Lengkap Dokumen <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Standar Operasional Prosedur Pengajuan & Persetujuan Cuti Staf"
              disabled={isSubmitting}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50]"
              required
            />
          </div>

          {/* Baris 3: Visibilitas, Status & Tanggal Berlaku */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tanggal Efektif Berlaku
              </label>
              <input
                type="date"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50]"
              />
            </div>
          </div>

          {/* Baris 4: Catatan Rilis Awal */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Catatan Rilis / Keterangan Awal
            </label>
            <textarea
              rows={2}
              value={changeNote}
              onChange={(e) => setChangeNote(e.target.value)}
              placeholder="Catatan latar belakang rilis dokumen awal..."
              disabled={isSubmitting}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50]"
            />
          </div>

          {/* Baris 5: Dropzone Berkas File v1 */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Unggah Berkas Fisik (Versi Awal v1) <span className="text-rose-500">*</span>
            </label>

            {!selectedFile ? (
              <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 hover:border-[#102E50] rounded-2xl bg-slate-50/60 hover:bg-slate-50 transition-colors cursor-pointer group">
                <div className="w-10 h-10 rounded-xl bg-[#102E50]/5 text-[#102E50] group-hover:scale-110 flex items-center justify-center mb-2 transition-transform">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold text-slate-700">
                  Klik untuk memilih atau seret berkas ke sini
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5">
                  Mendukung PDF, DOCX, XLSX (Maks. 25 MB)
                </span>
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

          {/* Footer Action */}
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
              disabled={isSubmitting || !selectedFile}
              className="inline-flex items-center gap-2 px-5 py-2 bg-[#102E50] text-[#F2AF3E] hover:bg-[#163a63] text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Mengunggah...</span>
                </>
              ) : (
                <span>Terbitkan Dokumen</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
