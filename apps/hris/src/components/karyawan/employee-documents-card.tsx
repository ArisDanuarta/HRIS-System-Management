"use client";

import React, { useState, useTransition, useRef } from "react";
import {
  FileText,
  FileCheck,
  File,
  UploadCloud,
  Download,
  Eye,
  Trash2,
  Plus,
  CheckCircle2,
  AlertCircle,
  X,
  Calendar,
  ExternalLink,
} from "lucide-react";
import {
  uploadEmployeeDocumentAction,
  deleteEmployeeDocumentAction,
  DocumentCategory,
} from "@/server/actions/document.actions";

export interface EmployeeDocumentItem {
  id: string;
  category: string;
  title: string;
  fileName: string;
  fileKey: string;
  fileSize: number;
  mimeType: string;
  createdAt: Date | string;
}

interface EmployeeDocumentsCardProps {
  employeeId: string;
  employeeName: string;
  documents: EmployeeDocumentItem[];
  canUpload?: boolean;
  canDelete?: boolean;
  isHrOrAdmin?: boolean;
}

const CATEGORY_META: Record<
  string,
  { label: string; badgeClass: string; group: "identity" | "academic" | "contract" | "certificate" | "other" }
> = {
  KTP: {
    label: "KTP (Identitas)",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
    group: "identity",
  },
  NPWP: {
    label: "NPWP (Perpajakan)",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    group: "identity",
  },
  DIPLOMA: {
    label: "Ijazah & Transkrip",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
    group: "academic",
  },
  CV: {
    label: "CV & Resume",
    badgeClass: "bg-teal-50 text-teal-700 border-teal-200",
    group: "academic",
  },
  CONTRACT: {
    label: "Kontrak Kerja Fisik",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
    group: "contract",
  },
  CERTIFICATE: {
    label: "Sertifikat Riset/Pelatihan",
    badgeClass: "bg-cyan-50 text-cyan-800 border-cyan-200",
    group: "certificate",
  },
  OTHER: {
    label: "Dokumen Lainnya",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
    group: "other",
  },
};

export function EmployeeDocumentsCard({
  employeeId,
  employeeName,
  documents: initialDocuments,
  canUpload = true,
  canDelete = true,
  isHrOrAdmin = false,
}: EmployeeDocumentsCardProps) {
  const [documents, setDocuments] = useState<EmployeeDocumentItem[]>(initialDocuments);
  const [activeGroup, setActiveGroup] = useState<"ALL" | "identity" | "academic" | "contract" | "certificate" | "other">("ALL");

  // Upload Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadCategory, setUploadCategory] = useState<DocumentCategory>("KTP");
  const [uploadTitle, setUploadTitle] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preview Modal State
  const [previewDoc, setPreviewDoc] = useState<EmployeeDocumentItem | null>(null);

  // Delete Modal State
  const [deleteTarget, setDeleteTarget] = useState<EmployeeDocumentItem | null>(null);

  // Feedback Notification
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDate = (d: Date | string) => {
    const dateObj = typeof d === "string" ? new Date(d) : d;
    return dateObj.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const filteredDocuments = documents.filter((doc) => {
    if (activeGroup === "ALL") return true;
    const meta = CATEGORY_META[doc.category];
    return meta?.group === activeGroup;
  });

  // Handle Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file) {
        setSelectedFile(file);
        if (!uploadTitle) {
          // Suggest title from filename without extension
          const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
          setUploadTitle(nameWithoutExt);
        }
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file) {
        setSelectedFile(file);
        if (!uploadTitle) {
          const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
          setUploadTitle(nameWithoutExt);
        }
      }
    }
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setFeedback({ type: "error", text: "Silakan pilih berkas dokumen terlebih dahulu." });
      return;
    }

    setFeedback(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.append("employeeId", employeeId);
      formData.append("category", uploadCategory);
      formData.append("title", uploadTitle);
      formData.append("file", selectedFile);

      const res = await uploadEmployeeDocumentAction(formData);
      if (res.success && res.data) {
        setDocuments((prev) => [res.data as EmployeeDocumentItem, ...prev]);
        setFeedback({ type: "success", text: res.message });
        setIsUploadModalOpen(false);
        setUploadTitle("");
        setSelectedFile(null);
      } else {
        setFeedback({ type: "error", text: res.message });
      }
    });
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;

    setFeedback(null);
    startTransition(async () => {
      const res = await deleteEmployeeDocumentAction({ documentId: deleteTarget.id });
      if (res.success) {
        setDocuments((prev) => prev.filter((d) => d.id !== deleteTarget.id));
        setFeedback({ type: "success", text: res.message });
        setDeleteTarget(null);
      } else {
        setFeedback({ type: "error", text: res.message });
      }
    });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs flex flex-col gap-6">
      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between gap-2.5 ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
              : "bg-red-50 text-red-900 border border-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header & Upload Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-base font-bold text-[#102E50] font-heading flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#102E50]" />
            <span>Vault Dokumen & Berkas Digital Pegawai</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono">
              {documents.length} Berkas
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Arsip digital resmi kepegawaian (KTP, NPWP, Ijazah, Kontrak Kerja Fisik, dan Berkas Penugasan Riset).
          </p>
        </div>

        {canUpload && (
          <button
            type="button"
            onClick={() => {
              setIsUploadModalOpen(true);
              setUploadTitle("");
              setSelectedFile(null);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#102E50] text-[#ffddb0] hover:bg-[#0c233d] text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-[0.98] shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Unggah Dokumen Baru</span>
          </button>
        )}
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setActiveGroup("ALL")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeGroup === "ALL"
              ? "bg-[#102E50] text-[#ffddb0] shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Semua ({documents.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveGroup("identity")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeGroup === "identity"
              ? "bg-[#102E50] text-[#ffddb0] shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Identitas (KTP/NPWP)
        </button>
        <button
          type="button"
          onClick={() => setActiveGroup("academic")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeGroup === "academic"
              ? "bg-[#102E50] text-[#ffddb0] shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Ijazah & CV
        </button>
        <button
          type="button"
          onClick={() => setActiveGroup("contract")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeGroup === "contract"
              ? "bg-[#102E50] text-[#ffddb0] shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Kontrak Fisik
        </button>
        <button
          type="button"
          onClick={() => setActiveGroup("certificate")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeGroup === "certificate"
              ? "bg-[#102E50] text-[#ffddb0] shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Sertifikat
        </button>
      </div>

      {/* Documents Grid */}
      {filteredDocuments.length === 0 ? (
        <div className="py-12 px-4 rounded-xl border border-dashed border-slate-300 text-center flex flex-col items-center justify-center gap-3 bg-slate-50/50">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-700">Belum Ada Dokumen di Kategori Ini</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Dokumen resmi yang diunggah akan tersimpan dengan aman di vault terenkripsi.
            </p>
          </div>
          {canUpload && (
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 hover:border-[#102E50] text-[#102E50] text-xs font-semibold transition-colors cursor-pointer bg-white"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Unggah Sekarang</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDocuments.map((doc) => {
            const meta = CATEGORY_META[doc.category] || {
              label: doc.category,
              badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
            };
            const isPdf = doc.mimeType.includes("pdf") || doc.fileName.toLowerCase().endsWith(".pdf");
            const isImage = doc.mimeType.startsWith("image/");

            return (
              <div
                key={doc.id}
                className="p-4 rounded-xl border border-slate-200/90 hover:border-[#102E50]/40 transition-all bg-white hover:shadow-sm flex flex-col justify-between gap-3 group"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                      isPdf
                        ? "bg-red-50 text-red-700 border-red-200"
                        : isImage
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : "bg-slate-50 text-slate-700 border-slate-200"
                    }`}
                  >
                    {isPdf ? (
                      <FileText className="w-5 h-5" />
                    ) : isImage ? (
                      <FileCheck className="w-5 h-5" />
                    ) : (
                      <File className="w-5 h-5" />
                    )}
                  </div>

                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${meta.badgeClass}`}
                      >
                        {meta.label}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {formatFileSize(doc.fileSize)}
                      </span>
                    </div>

                    <h4
                      className="text-xs font-bold text-[#102E50] mt-1.5 truncate group-hover:text-blue-900"
                      title={doc.title}
                    >
                      {doc.title}
                    </h4>
                    <p className="text-[11px] font-mono text-slate-500 truncate" title={doc.fileName}>
                      {doc.fileName}
                    </p>

                    <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(doc.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPreviewDoc(doc)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 hover:border-[#102E50] text-[#102E50] font-semibold text-[11px] transition-colors cursor-pointer bg-slate-50/50 hover:bg-slate-100"
                    >
                      <Eye className="w-3 h-3 text-[#102E50]" />
                      <span>Lihat</span>
                    </button>
                    <a
                      href={`/api/documents/${doc.fileKey}`}
                      download={doc.fileName}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 hover:border-slate-400 text-slate-700 font-semibold text-[11px] transition-colors cursor-pointer bg-white hover:bg-slate-50"
                      title="Unduh berkas ke komputer"
                    >
                      <Download className="w-3 h-3 text-slate-600" />
                      <span>Unduh</span>
                    </a>
                  </div>

                  {canDelete && (isHrOrAdmin || doc.category !== "CONTRACT") && (
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(doc)}
                      className="inline-flex items-center gap-1 p-1 rounded-lg text-slate-400 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                      title="Hapus berkas dari arsip pegawai"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {doc.category === "CONTRACT" && !isHrOrAdmin && (
                    <span
                      className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-medium border border-amber-200"
                      title="Dokumen resmi dikelola oleh Admin HR"
                    >
                      Resmi HR
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Unggah Dokumen Baru */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-[#dee9fc] shadow-2xl p-6 flex flex-col gap-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#102E50]/10 text-[#102E50] flex items-center justify-center">
                  <UploadCloud className="w-4 h-4 text-[#102E50]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#102E50] font-heading">
                    Unggah Dokumen ke Vault Pegawai
                  </h3>
                  <p className="text-[11px] text-slate-500">Pegawai: {employeeName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="flex flex-col gap-4 text-xs">
              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-700">Kategori Dokumen *</label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value as DocumentCategory)}
                  className="px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-[#102E50] focus:outline-none"
                >
                  <option value="KTP">KTP (Kartu Tanda Penduduk)</option>
                  <option value="NPWP">NPWP (Nomor Pokok Wajib Pajak)</option>
                  <option value="DIPLOMA">Ijazah & Transkrip Akademik</option>
                  <option value="CV">Curriculum Vitae (CV) & Resume</option>
                  {isHrOrAdmin && (
                    <option value="CONTRACT">Salinan Kontrak Kerja Fisik (SK)</option>
                  )}
                  <option value="CERTIFICATE">Sertifikat Pelatihan / Lisensi Riset</option>
                  <option value="OTHER">Dokumen Pendukung Lainnya</option>
                </select>
                {!isHrOrAdmin && (
                  <p className="text-[11px] text-slate-500 italic mt-0.5">
                    * Dokumen Kontrak Kerja fisik dikelola dan diunggah secara resmi oleh Admin HR.
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-700">Judul / Keterangan Dokumen *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Ijazah S2 Kebijakan Publik UI..."
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-[#102E50] focus:outline-none"
                />
              </div>

              {/* Drag and Drop Zone */}
              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-700">Pilih Berkas File *</label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-6 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center gap-2 text-center ${
                    isDragOver
                      ? "border-[#102E50] bg-blue-50/50"
                      : selectedFile
                      ? "border-emerald-300 bg-emerald-50/30"
                      : "border-slate-300 hover:border-slate-400 bg-slate-50/50"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.webp"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {selectedFile ? (
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                        <FileCheck className="w-5 h-5 text-emerald-700" />
                      </div>
                      <span className="font-bold text-slate-800 text-xs mt-1 truncate max-w-xs">
                        {selectedFile.name}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500">
                        {formatFileSize(selectedFile.size)} • {selectedFile.type || "file"}
                      </span>
                      <span className="text-[10px] text-blue-800 font-semibold underline mt-1">
                        Klik untuk mengganti berkas
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-xl bg-[#102E50]/10 text-[#102E50] flex items-center justify-center">
                        <UploadCloud className="w-5 h-5 text-[#102E50]" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-700">Tarik & Jatuhkan berkas ke sini</span>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          atau klik untuk menjelajah dari penyimpanan komputer
                        </p>
                      </div>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-200/70 text-slate-600">
                        Format: PDF, PNG, JPG, WebP (Maks. 25 MB)
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending || !selectedFile || uploadTitle.trim().length < 3}
                  className="px-5 py-2 rounded-xl bg-[#102E50] text-[#ffddb0] font-bold hover:bg-[#0c233d] transition-all shadow-xs cursor-pointer active:scale-[0.98] disabled:opacity-50"
                >
                  {isPending ? "Mengunggah..." : "Simpan Dokumen"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Pratinjau Dokumen */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-4xl w-full border border-slate-300 shadow-2xl p-5 flex flex-col gap-3 animate-in zoom-in-95 duration-150 max-h-[92vh]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#102E50] flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-[#102E50] font-heading truncate">
                    {previewDoc.title}
                  </h3>
                  <p className="text-[11px] font-mono text-slate-500 truncate">
                    {previewDoc.fileName} • {formatFileSize(previewDoc.fileSize)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={`/api/documents/${previewDoc.fileKey}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-[#102E50] text-[#102E50] text-xs font-semibold transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Tab Baru</span>
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Preview Frame */}
            <div className="flex-1 overflow-auto rounded-xl bg-slate-100 p-2 flex items-center justify-center min-h-[50vh]">
              {previewDoc.mimeType.startsWith("image/") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`/api/documents/${previewDoc.fileKey}`}
                  alt={previewDoc.title}
                  className="max-h-[68vh] object-contain rounded-lg shadow-sm"
                />
              ) : previewDoc.mimeType.includes("pdf") || previewDoc.fileName.toLowerCase().endsWith(".pdf") ? (
                <iframe
                  src={`/api/documents/${previewDoc.fileKey}`}
                  title={previewDoc.title}
                  className="w-full h-[68vh] rounded-lg border border-slate-200 bg-white"
                />
              ) : (
                <div className="text-center p-8 flex flex-col items-center gap-3">
                  <File className="w-12 h-12 text-slate-400" />
                  <p className="text-xs text-slate-600">
                    Format berkas ini tidak dapat dipratinjau langsung di dalam browser.
                  </p>
                  <a
                    href={`/api/documents/${previewDoc.fileKey}`}
                    download={previewDoc.fileName}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#102E50] text-white text-xs font-bold"
                  >
                    <Download className="w-4 h-4" />
                    <span>Unduh Berkas</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Konfirmasi Hapus Dokumen */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full border border-red-200 shadow-2xl p-6 flex flex-col gap-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-700 flex items-center justify-center shrink-0 border border-red-200">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#102E50] font-heading">
                  Hapus Dokumen Arsip
                </h3>
                <p className="text-xs text-slate-500">
                  Tindakan ini permanen dan akan dicatat di audit log.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-red-50/50 border border-red-100 text-xs flex flex-col gap-1 text-slate-700">
              <p>
                Apakah Anda yakin ingin menghapus berkas{" "}
                <strong className="text-red-900">&ldquo;{deleteTarget.title}&rdquo;</strong> ({deleteTarget.fileName}) dari arsip {employeeName}?
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleDeleteConfirm}
                className="px-5 py-2 rounded-xl bg-red-700 text-white text-xs font-bold hover:bg-red-800 transition-all shadow-xs cursor-pointer active:scale-[0.98] disabled:opacity-50"
              >
                {isPending ? "Menghapus..." : "Ya, Hapus Dokumen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
