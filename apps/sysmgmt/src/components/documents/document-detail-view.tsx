"use client";

import React, { useState } from "react";
import Link from "next/link";
import { DocumentDetailWithVersions } from "@/server/queries/document.queries";
import { DocumentVisibility, DocumentStatus } from "@pspk/db";
import { formatDate, formatDateTime } from "@pspk/shared";
import { DocumentPreviewCard } from "./document-preview-card";
import { DocumentVersionTimeline } from "./document-version-timeline";
import {
  ArrowLeft,
  Download,
  Plus,
  Edit3,
  Archive,
  Trash2,
  Users,
  Briefcase,
  UserCheck,
  Cpu,
  CheckCircle2,
  Clock,
  Layers,
  Calendar,
  Building2,
  ShieldCheck,
  FileUp,
} from "lucide-react";

interface DocumentDetailViewProps {
  document: DocumentDetailWithVersions;
  canManage: boolean;
  canDelete: boolean;
}

export function DocumentDetailView({
  document: doc,
  canManage,
  canDelete,
}: DocumentDetailViewProps) {
  // Modal states (untuk Sub-Tahap 4D)
  const [isNewVersionModalOpen, setIsNewVersionModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);

  const downloadActiveUrl = doc.currentVersion
    ? `/api/documents/${doc.currentVersion.id}/download`
    : null;

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Tombol Kembali */}
      <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
        <Link
          href="/dokumen"
          className="inline-flex items-center gap-1.5 font-semibold text-slate-600 hover:text-[#102E50] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Direktori Dokumen</span>
        </Link>

        <div className="flex items-center gap-1.5">
          <span>Repositori Dokumen</span>
          <span>/</span>
          <span className="font-mono font-semibold text-slate-800">{doc.code}</span>
        </div>
      </div>

      {/* Header Utama Detail Dokumen */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col lg:flex-row lg:items-start justify-between gap-6">
        <div className="space-y-3 max-w-3xl">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-lg bg-[#102E50] text-[#F2AF3E] shadow-2xs">
              {doc.code}
            </span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {doc.category}
            </span>

            {/* Status Badge */}
            {doc.status === DocumentStatus.ACTIVE && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Aktif Berlaku
              </span>
            )}
            {doc.status === DocumentStatus.DRAFT && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                <Clock className="w-3.5 h-3.5" />
                Draf Pembahasan
              </span>
            )}
            {doc.status === DocumentStatus.ARCHIVED && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                <Archive className="w-3.5 h-3.5" />
                Diarsipkan
              </span>
            )}

            {/* Visibility Badge */}
            {doc.visibility === DocumentVisibility.ALL_STAFF && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Users className="w-3.5 h-3.5" />
                Semua Staf
              </span>
            )}
            {doc.visibility === DocumentVisibility.MANAGERS && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                <Briefcase className="w-3.5 h-3.5" />
                Khusus Manajer
              </span>
            )}
            {doc.visibility === DocumentVisibility.HR_ONLY && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                <UserCheck className="w-3.5 h-3.5" />
                Khusus HR
              </span>
            )}
            {doc.visibility === DocumentVisibility.IT_ONLY && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200">
                <Cpu className="w-3.5 h-3.5" />
                Khusus IT
              </span>
            )}
          </div>

          <h1 className="text-2xl font-black text-slate-900 font-serif leading-tight">
            {doc.title}
          </h1>

          <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap pt-1">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              Versi Aktif:{" "}
              <strong className="text-slate-700 font-semibold">
                v{doc.currentVersion ? doc.currentVersion.versionNo : 1}
              </strong>{" "}
              ({doc.versions.length} riwayat versi)
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Pembaruan Terakhir: {formatDate(doc.updatedAt)}
            </span>
          </div>
        </div>

        {/* Action Buttons Top */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {downloadActiveUrl && (
            <a
              href={downloadActiveUrl}
              download
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition-colors shadow-2xs"
            >
              <Download className="w-4 h-4" />
              <span>Unduh Berkas</span>
            </a>
          )}

          {canManage && (
            <>
              <button
                type="button"
                onClick={() => setIsNewVersionModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#102E50] text-[#F2AF3E] hover:bg-[#1a4473] text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Unggah Versi Baru</span>
              </button>

              <button
                type="button"
                onClick={() => setIsEditModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-xl transition-colors cursor-pointer shadow-2xs"
                title="Ubah Metadata Dokumen"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Ubah</span>
              </button>

              <button
                type="button"
                onClick={() => setIsArchiveModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-xl transition-colors cursor-pointer shadow-2xs"
                title="Arsipkan Dokumen"
              >
                <Archive className="w-3.5 h-3.5" />
                <span>Arsip</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Grid Konten Detail: Kiri (Timeline Versi) & Kanan (Preview Berkas & Metadata) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Kolom Kiri: Riwayat Kronologis Seluruh Versi */}
        <div className="lg:col-span-8 space-y-6">
          <DocumentVersionTimeline
            versions={doc.versions}
            currentVersionId={doc.currentVersionId}
            canManage={canManage}
            onUploadNewVersion={() => setIsNewVersionModalOpen(true)}
          />
        </div>

        {/* Kolom Kanan: Preview Berkas Aktif & Informasi Tambahan */}
        <div className="lg:col-span-4 space-y-6">
          <DocumentPreviewCard version={doc.currentVersion} code={doc.code} />

          {/* Card Info Tambahan Lembaga */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Building2 className="w-4 h-4 text-slate-500" />
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-serif">
                Informasi Tata Kelola
              </h4>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Nomor Registrasi:</span>
                <span className="font-mono font-semibold text-slate-800">{doc.code}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Klasifikasi:</span>
                <span className="font-medium text-slate-700">{doc.category}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Hak Akses:</span>
                <span className="font-semibold text-slate-800">{doc.visibility}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Dibuat Pertama Kali:</span>
                <span className="text-slate-700">{formatDateTime(doc.createdAt)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Revisi Terakhir:</span>
                <span className="text-slate-700">{formatDateTime(doc.updatedAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Placeholder dialogs untuk Sub-Tahap 4D */}
      {(isNewVersionModalOpen || isEditModalOpen || isArchiveModalOpen) && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="w-12 h-12 rounded-xl bg-[#102E50]/10 text-[#102E50] flex items-center justify-center mb-4">
              <FileUp className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 font-serif mb-1">
              {isNewVersionModalOpen && "Unggah Versi Baru (Tahap 4D)"}
              {isEditModalOpen && "Ubah Metadata Dokumen (Tahap 4D)"}
              {isArchiveModalOpen && "Arsipkan Dokumen (Tahap 4D)"}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-6">
              Formulir interaktif ini disiapkan pada Sub-Tahap 4D. Backend actions, file storage put, dan auto-versioning sudah 100% siap.
            </p>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsNewVersionModalOpen(false);
                  setIsEditModalOpen(false);
                  setIsArchiveModalOpen(false);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
