"use client";

import React from "react";
import { DocumentVersionDetail } from "@/server/queries/document.queries";
import { formatDate, formatDateTime } from "@pspk/shared";
import {
  History,
  Download,
  Calendar,
  User,
  CheckCircle2,
  FileText,
  FileCode,
  FileSpreadsheet,
  File,
  Plus,
  MessageSquareText,
  Clock,
  ShieldCheck,
} from "lucide-react";

interface DocumentVersionTimelineProps {
  versions: DocumentVersionDetail[];
  currentVersionId: string | null;
  canManage: boolean;
  onUploadNewVersion?: () => void;
}

function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return "-";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

function getFileIcon(mimeType: string | null, fileName: string | null) {
  const ext = fileName?.split(".").pop()?.toLowerCase();
  if (mimeType?.includes("pdf") || ext === "pdf") return FileText;
  if (
    mimeType?.includes("word") ||
    mimeType?.includes("officedocument.wordprocessingml") ||
    ext === "docx" ||
    ext === "doc"
  )
    return FileCode;
  if (
    mimeType?.includes("sheet") ||
    mimeType?.includes("excel") ||
    ext === "xlsx" ||
    ext === "xls"
  )
    return FileSpreadsheet;
  return File;
}

export function DocumentVersionTimeline({
  versions,
  currentVersionId,
  canManage,
  onUploadNewVersion,
}: DocumentVersionTimelineProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
      {/* Header Panel */}
      <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#102E50]/10 text-[#102E50] flex items-center justify-center">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 font-serif">
              Riwayat Versi & Log Perubahan
            </h3>
            <p className="text-[11px] text-slate-500">
              Arsip kronologis seluruh iterasi berkas kebijakan dan SOP lembaga.
            </p>
          </div>
        </div>

        {canManage && onUploadNewVersion && (
          <button
            type="button"
            onClick={onUploadNewVersion}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#102E50] text-[#F2AF3E] hover:bg-[#1a4473] text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Unggah Versi Baru</span>
          </button>
        )}
      </div>

      <div className="p-6">
        {versions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-xs text-slate-400">Belum ada data versi tercatat.</p>
          </div>
        ) : (
          <div className="relative pl-6 space-y-8 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
            {versions.map((ver, idx) => {
              const isCurrent =
                ver.isCurrent || (idx === 0 && !versions.some((v) => v.isCurrent));
              const FileIconComponent = getFileIcon(ver.mimeType, ver.fileName);
              const downloadUrl = `/api/documents/${ver.id}/download`;

              return (
                <div key={ver.id} className="relative group">
                  {/* Bullet Node Timeline */}
                  <div
                    className={`absolute -left-6 top-1 w-6 h-6 rounded-full flex items-center justify-center -translate-x-1/2 ring-4 ring-white transition-all ${
                      isCurrent
                        ? "bg-[#102E50] text-[#F2AF3E] shadow-sm ring-emerald-100"
                        : "bg-slate-300 text-white"
                    }`}
                  >
                    {isCurrent ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <span className="text-[10px] font-bold font-mono">
                        {ver.versionNo}
                      </span>
                    )}
                  </div>

                  {/* Konten Kotak Versi */}
                  <div
                    className={`rounded-2xl border p-5 transition-all ${
                      isCurrent
                        ? "bg-slate-50/50 border-[#102E50]/20 shadow-xs ring-1 ring-[#102E50]/5"
                        : "bg-white border-slate-200/80 hover:border-slate-300"
                    }`}
                  >
                    {/* Header Versi */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-bold text-sm text-slate-900 font-serif">
                          Versi {ver.versionNo}.0
                        </span>
                        {isCurrent ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Versi Aktif Saat Ini
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            Versi Terdahulu (Arsip)
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {ver.effectiveDate
                            ? `Efektif: ${formatDate(ver.effectiveDate)}`
                            : `Rilis: ${formatDate(ver.createdAt)}`}
                        </span>
                      </div>
                    </div>

                    {/* Catatan Perubahan (Change Notes) */}
                    <div className="my-3.5 p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/50 text-xs">
                      <div className="flex items-center gap-1.5 text-amber-800 font-semibold mb-1">
                        <MessageSquareText className="w-3.5 h-3.5 text-amber-600" />
                        <span>Catatan Perubahan / Revisi:</span>
                      </div>
                      <p className="text-slate-700 leading-relaxed pl-5 whitespace-pre-wrap">
                        {ver.changeNote || "Tidak ada catatan revisi khusus yang dicantumkan."}
                      </p>
                    </div>

                    {/* Informasi Berkas & Aksi Download */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                          <FileIconComponent className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p
                            className="font-medium text-slate-800 truncate text-xs"
                            title={ver.fileName}
                          >
                            {ver.fileName}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {formatFileSize(ver.sizeBytes)} • Diunggah oleh{" "}
                            <span className="text-slate-600 font-medium">
                              {ver.createdByName}
                            </span>
                          </p>
                        </div>
                      </div>

                      <a
                        href={downloadUrl}
                        download
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-[#102E50] text-slate-700 hover:text-[#F2AF3E] font-semibold text-xs transition-colors shrink-0 shadow-2xs"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Unduh v{ver.versionNo}</span>
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
