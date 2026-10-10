"use client";

import React, { useState } from "react";
import { DocumentVersionDetail } from "@/server/queries/document.queries";
import { formatDate, formatDateTime } from "@pspk/shared";
import {
  FileText,
  FileCode,
  FileSpreadsheet,
  File,
  Download,
  ExternalLink,
  Copy,
  Check,
  ShieldCheck,
  Calendar,
  User,
  HardDrive,
  Hash,
} from "lucide-react";

interface DocumentPreviewCardProps {
  version: DocumentVersionDetail | null;
  code: string;
}

function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return "-";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

function getFileIconAndBadge(mimeType: string | null, fileName: string | null) {
  const ext = fileName?.split(".").pop()?.toLowerCase();
  if (mimeType?.includes("pdf") || ext === "pdf") {
    return {
      label: "PDF Document",
      badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
      iconBg: "bg-rose-500/10 text-rose-600",
      icon: FileText,
      canPreview: true,
    };
  }
  if (
    mimeType?.includes("word") ||
    mimeType?.includes("officedocument.wordprocessingml") ||
    ext === "docx" ||
    ext === "doc"
  ) {
    return {
      label: "Microsoft Word (DOCX)",
      badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
      iconBg: "bg-blue-500/10 text-blue-600",
      icon: FileCode,
      canPreview: false,
    };
  }
  if (
    mimeType?.includes("sheet") ||
    mimeType?.includes("excel") ||
    ext === "xlsx" ||
    ext === "xls"
  ) {
    return {
      label: "Excel Spreadsheet (XLSX)",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
      iconBg: "bg-emerald-500/10 text-emerald-600",
      icon: FileSpreadsheet,
      canPreview: false,
    };
  }
  return {
    label: ext ? `${ext.toUpperCase()} File` : "Document File",
    badgeColor: "bg-slate-100 text-slate-700 border-slate-200",
    iconBg: "bg-slate-500/10 text-slate-600",
    icon: File,
    canPreview: false,
  };
}

export function DocumentPreviewCard({ version, code }: DocumentPreviewCardProps) {
  const [copiedHash, setCopiedHash] = useState(false);

  if (!version) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs text-center">
        <div className="w-12 h-12 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-3">
          <FileText className="w-6 h-6" />
        </div>
        <p className="text-xs text-slate-500">Belum ada berkas versi yang diunggah.</p>
      </div>
    );
  }

  const fileMeta = getFileIconAndBadge(version.mimeType, version.fileName);
  const FileIcon = fileMeta.icon;

  const handleCopyHash = () => {
    if (version.sha256) {
      navigator.clipboard.writeText(version.sha256);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    }
  };

  const downloadUrl = `/api/documents/${version.id}/download`;
  const previewUrl = `/api/documents/${version.id}/download?preview=true`;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
      {/* Header Card */}
      <div className="px-5 py-4 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider font-serif">
            Berkas Versi Terkini (v{version.versionNo})
          </span>
        </div>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          Aktif
        </span>
      </div>

      <div className="p-5 space-y-5">
        {/* File Hero Section */}
        <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/60 flex items-start gap-3.5">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${fileMeta.iconBg}`}
          >
            <FileIcon className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h4
              className="text-xs font-bold text-slate-900 break-all leading-snug"
              title={version.fileName}
            >
              {version.fileName}
            </h4>
            <div className="mt-1 flex items-center gap-2 flex-wrap text-[11px] text-slate-500">
              <span className="font-semibold text-slate-700">
                {formatFileSize(version.sizeBytes)}
              </span>
              <span>•</span>
              <span className="text-slate-500">{fileMeta.label}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <a
            href={downloadUrl}
            download
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#102E50] hover:bg-[#1a4473] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Unduh Berkas</span>
          </a>

          {fileMeta.canPreview ? (
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Pratinjau Tab Baru</span>
            </a>
          ) : (
            <a
              href={downloadUrl}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
            >
              <HardDrive className="w-4 h-4" />
              <span>Buka Dokumen</span>
            </a>
          )}
        </div>

        {/* Metadata Details List */}
        <div className="pt-2 border-t border-slate-100 space-y-3 text-xs">
          <div className="flex items-start justify-between gap-3">
            <span className="text-slate-500 flex items-center gap-1.5 shrink-0">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Tanggal Efektif
            </span>
            <span className="font-semibold text-slate-800 text-right">
              {version.effectiveDate ? formatDate(version.effectiveDate) : "-"}
            </span>
          </div>

          <div className="flex items-start justify-between gap-3">
            <span className="text-slate-500 flex items-center gap-1.5 shrink-0">
              <User className="w-3.5 h-3.5 text-slate-400" />
              Pengunggah
            </span>
            <div className="text-right">
              <p className="font-semibold text-slate-800">{version.createdByName}</p>
              <p className="text-[10px] text-slate-400">{version.createdByEmail}</p>
            </div>
          </div>

          <div className="flex items-start justify-between gap-3">
            <span className="text-slate-500 flex items-center gap-1.5 shrink-0">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Waktu Rilis
            </span>
            <span className="text-slate-600 text-right">
              {formatDateTime(version.createdAt)}
            </span>
          </div>

          {/* Checksum SHA-256 Box */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Checksum Integritas (SHA-256)
              </span>
              <button
                type="button"
                onClick={handleCopyHash}
                className="inline-flex items-center gap-1 text-[11px] text-[#102E50] hover:underline font-semibold cursor-pointer"
              >
                {copiedHash ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span className="text-emerald-600">Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Salin Hash</span>
                  </>
                )}
              </button>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900 text-slate-200 font-mono text-[10px] break-all border border-slate-800 leading-relaxed select-all">
              {version.sha256}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Verifikasi SHA-256 membuktikan berkas ini asli dan tidak mengalami modifikasi sejak diunggah.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
