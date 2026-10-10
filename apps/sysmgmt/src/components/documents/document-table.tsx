"use client";

import React from "react";
import Link from "next/link";
import { DocumentDirectoryItem } from "@/server/queries/document.queries";
import { DocumentVisibility, DocumentStatus } from "@pspk/db";
import { formatDate } from "@pspk/shared";
import {
  FileText,
  Download,
  Eye,
  ChevronLeft,
  ChevronRight,
  Users,
  Briefcase,
  UserCheck,
  Cpu,
  CheckCircle2,
  Clock,
  Archive,
  FileCode,
  FileSpreadsheet,
  File,
} from "lucide-react";

interface DocumentTableProps {
  documents: DocumentDirectoryItem[];
  pagination: {
    page: number;
    totalPages: number;
    total: number;
    limit: number;
  };
  onPageChange: (newPage: number) => void;
  canManage?: boolean;
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
      label: "PDF",
      badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
      icon: FileText,
    };
  }
  if (
    mimeType?.includes("word") ||
    mimeType?.includes("officedocument.wordprocessingml") ||
    ext === "docx" ||
    ext === "doc"
  ) {
    return {
      label: "DOCX",
      badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
      icon: FileCode,
    };
  }
  if (
    mimeType?.includes("sheet") ||
    mimeType?.includes("excel") ||
    ext === "xlsx" ||
    ext === "xls"
  ) {
    return {
      label: "XLSX",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
      icon: FileSpreadsheet,
    };
  }
  return {
    label: ext ? ext.toUpperCase() : "FILE",
    badgeColor: "bg-slate-100 text-slate-700 border-slate-200",
    icon: File,
  };
}

export function DocumentTable({
  documents,
  pagination,
  onPageChange,
  canManage: _canManage,
}: DocumentTableProps) {
  if (documents.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center shadow-xs">
        <div className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-4 border border-slate-200">
          <FileText className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-slate-800 font-serif">
          Tidak Ada Dokumen Ditemukan
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Tidak ada dokumen kebijakan atau SOP yang sesuai dengan kriteria pencarian atau penyaring yang dipilih.
        </p>
      </div>
    );
  }

  const startEntry = (pagination.page - 1) * pagination.limit + 1;
  const endEntry = Math.min(pagination.page * pagination.limit, pagination.total);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-3.5 px-4 pl-6">Kode & Judul Dokumen</th>
              <th className="py-3.5 px-4">Versi & Berkas Terkini</th>
              <th className="py-3.5 px-4">Visibilitas Akses</th>
              <th className="py-3.5 px-4">Status & Tanggal Berlaku</th>
              <th className="py-3.5 px-4 pr-6 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {documents.map((doc) => {
              const fileMeta = getFileIconAndBadge(doc.currentMimeType, doc.currentFileName);
              const FileBadgeIcon = fileMeta.icon;

              return (
                <tr
                  key={doc.id}
                  className="hover:bg-slate-50/70 transition-colors group"
                >
                  {/* Kolom 1: Kode & Judul */}
                  <td className="py-4 px-4 pl-6 align-top">
                    <div className="flex flex-col min-w-0 max-w-sm">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-mono font-bold text-[11px] px-2 py-0.5 rounded-md bg-[#102E50]/10 text-[#102E50] border border-[#102E50]/20">
                          {doc.code}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                          {doc.category}
                        </span>
                      </div>
                      <Link
                        href={`/dokumen/${doc.id}`}
                        className="font-bold text-slate-900 text-sm hover:text-[#102E50] transition-colors leading-snug line-clamp-2"
                      >
                        {doc.title}
                      </Link>
                      <span className="text-[11px] text-slate-400 mt-1">
                        Total {doc.totalVersionsCount} revisi versi
                      </span>
                    </div>
                  </td>

                  {/* Kolom 2: Versi & Berkas */}
                  <td className="py-4 px-4 align-top">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                          v{doc.currentVersionNo}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded border flex items-center gap-1 ${fileMeta.badgeColor}`}
                        >
                          <FileBadgeIcon className="w-3 h-3" />
                          {fileMeta.label}
                        </span>
                      </div>
                      {doc.currentFileName && (
                        <span
                          className="text-xs text-slate-600 truncate max-w-[200px] font-medium"
                          title={doc.currentFileName}
                        >
                          {doc.currentFileName}
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400">
                        {formatFileSize(doc.currentFileSize)}
                      </span>
                    </div>
                  </td>

                  {/* Kolom 3: Visibilitas Akses */}
                  <td className="py-4 px-4 align-top">
                    {doc.visibility === DocumentVisibility.ALL_STAFF && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <Users className="w-3.5 h-3.5" />
                        Semua Staf
                      </span>
                    )}
                    {doc.visibility === DocumentVisibility.MANAGERS && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                        <Briefcase className="w-3.5 h-3.5" />
                        Khusus Manajer
                      </span>
                    )}
                    {doc.visibility === DocumentVisibility.HR_ONLY && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        <UserCheck className="w-3.5 h-3.5" />
                        Khusus HR
                      </span>
                    )}
                    {doc.visibility === DocumentVisibility.IT_ONLY && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200">
                        <Cpu className="w-3.5 h-3.5" />
                        Khusus IT
                      </span>
                    )}
                  </td>

                  {/* Kolom 4: Status & Tanggal Berlaku */}
                  <td className="py-4 px-4 align-top">
                    <div className="flex flex-col gap-1">
                      {doc.status === DocumentStatus.ACTIVE && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Aktif Berlaku
                        </span>
                      )}
                      {doc.status === DocumentStatus.DRAFT && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          Draf Pembahasan
                        </span>
                      )}
                      {doc.status === DocumentStatus.ARCHIVED && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                          <Archive className="w-3.5 h-3.5 text-slate-400" />
                          Diarsipkan
                        </span>
                      )}
                      <span className="text-[11px] text-slate-500">
                        {doc.currentEffectiveDate
                          ? `Efektif: ${formatDate(doc.currentEffectiveDate)}`
                          : `Dibuat: ${formatDate(doc.createdAt)}`}
                      </span>
                    </div>
                  </td>

                  {/* Kolom 5: Aksi */}
                  <td className="py-4 px-4 pr-6 align-top text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {doc.currentVersionId && (
                        <a
                          href={`/api/documents/${doc.currentVersionId}/download`}
                          download
                          title="Unduh Berkas Versi Terkini"
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 hover:bg-[#102E50] hover:text-[#F2AF3E] text-slate-600 transition-colors shadow-2xs"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      )}
                      <Link
                        href={`/dokumen/${doc.id}`}
                        title="Buka Detail & Riwayat Versi"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#102E50]/5 hover:bg-[#102E50] text-[#102E50] hover:text-white text-xs font-semibold transition-colors shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Detail</span>
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Paginasi Footer */}
      <div className="px-6 py-3.5 bg-slate-50/70 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <div>
          Menampilkan <span className="font-semibold text-slate-800">{startEntry}</span> -{" "}
          <span className="font-semibold text-slate-800">{endEntry}</span> dari{" "}
          <span className="font-semibold text-slate-800">{pagination.total}</span> dokumen
        </div>

        {pagination.totalPages > 1 && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors shadow-2xs"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Sebelumnya</span>
            </button>
            <span className="px-2 py-1 text-slate-600 font-semibold">
              Hal. {pagination.page} dari {pagination.totalPages}
            </span>
            <button
              type="button"
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors shadow-2xs"
            >
              <span>Selanjutnya</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
