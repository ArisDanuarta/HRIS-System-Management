"use client";

import React, { useRef, useState } from "react";
import {
  UploadCloud,
  FileText,
  CheckCircle,
  AlertCircle,
  Trash2,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { UploadedFileState } from "../types/employee-form.types";

interface DocumentUploadCardProps {
  label: string;
  description?: string;
  required?: boolean;
  accept?: string;
  maxSizeMB?: number;
  value?: UploadedFileState | null;
  onChange: (state: UploadedFileState) => void;
  onClear?: () => void;
  error?: string | null;
  disabled?: boolean;
  className?: string;
}

export function DocumentUploadCard({
  label,
  description,
  required = false,
  accept = "application/pdf,image/jpeg,image/png",
  maxSizeMB = 5,
  value,
  onChange,
  onClear,
  error,
  disabled = false,
  className = "",
}: DocumentUploadCardProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);

  const hasFile = Boolean(
    value?.file || value?.documentKey || value?.fileName || value?.previewUrl,
  );
  const isImage =
    value?.file?.type.startsWith("image/") ||
    (value?.fileName && /\.(jpg|jpeg|png|webp)$/i.test(value.fileName)) ||
    Boolean(value?.previewUrl && !value?.previewUrl.endsWith(".pdf"));

  const formatFileSize = (bytes?: number | null): string => {
    if (!bytes || bytes <= 0) return "";
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleFileProcess = (file: File) => {
    setClientError(null);

    // 1. Validasi Ukuran Berkas
    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      setClientError(`Ukuran berkas melebihi batas maksimal ${maxSizeMB} MB.`);
      return;
    }

    // 2. Validasi Tipe Berkas
    if (accept) {
      const allowedTypes = accept.split(",").map((t) => t.trim().toLowerCase());
      const fileType = file.type.toLowerCase();
      const fileExt = `.${file.name.split(".").pop()?.toLowerCase()}`;

      const isAllowed = allowedTypes.some(
        (allowed) =>
          allowed === fileType ||
          (allowed.startsWith(".") && allowed === fileExt) ||
          (allowed.endsWith("/*") && fileType.startsWith(allowed.replace("/*", ""))),
      );

      if (!isAllowed) {
        setClientError(
          `Format berkas tidak didukung. Harap unggah format ${accept.replace(/application\/|image\//g, "").toUpperCase()}.`,
        );
        return;
      }
    }

    // Buat Object URL untuk preview instan
    let previewUrl: string | null = null;
    if (file.type.startsWith("image/")) {
      previewUrl = URL.createObjectURL(file);
    }

    onChange({
      file,
      fileName: file.name,
      fileSize: file.size,
      previewUrl,
      status: "staged",
      error: null,
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file) handleFileProcess(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file) handleFileProcess(file);
    }
    // Reset value agar dapat memilih file yang sama jika diinginkan
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemove = () => {
    setClientError(null);
    if (value?.previewUrl && value.previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(value.previewUrl);
    }
    if (onClear) {
      onClear();
    } else {
      onChange({
        file: null,
        fileName: null,
        fileSize: null,
        previewUrl: null,
        status: "idle",
        error: null,
      });
    }
  };

  const activeError = error || clientError || value?.error;

  return (
    <div
      className={`w-full min-w-0 max-w-full border rounded-xl transition-all p-3.5 sm:p-4 bg-white flex flex-col gap-2.5 ${
        activeError
          ? "border-red-300 bg-red-50/20 shadow-xs"
          : hasFile
            ? "border-emerald-200/90 bg-emerald-50/10 shadow-xs"
            : "border-slate-200 hover:border-slate-300"
      } ${className}`}
    >
      {/* Header Info */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold text-slate-900 tracking-tight">
              {label}
            </span>
            {required && <span className="text-xs font-bold text-red-500">*</span>}
          </div>
          {description && (
            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed line-clamp-2">
              {description}
            </p>
          )}
        </div>

        {/* Badge Status */}
        <div className="shrink-0">
          {hasFile ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              <CheckCircle className="w-3 h-3 text-emerald-600" />
              <span>Terunggah</span>
            </span>
          ) : required ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
              <span>Wajib</span>
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200/80">
              Opsional
            </span>
          )}
        </div>
      </div>

      {/* Hidden Native Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        disabled={disabled}
        className="sr-only"
        aria-label={label}
      />

      {/* Body: Upload Area or File Preview */}
      {!hasFile ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled) setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if ((e.key === "Enter" || e.key === " ") && !disabled) {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          tabIndex={disabled ? -1 : 0}
          role="button"
          aria-label={`Unggah ${label}`}
          className={`border-2 border-dashed rounded-lg p-3 sm:p-4 text-center cursor-pointer transition-colors flex flex-col items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 ${
            isDragOver
              ? "border-[#102E50] bg-blue-50/50"
              : "border-slate-200 hover:border-[#102E50]/50 hover:bg-slate-50/60 bg-slate-50/30"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
            <UploadCloud className="w-4 h-4 text-slate-600" />
          </div>
          <div className="text-center">
            <p className="text-xs font-semibold text-slate-700">
              Tarik & lepas berkas ke sini, atau{" "}
              <span className="text-[#102E50] underline font-bold">pilih berkas</span>
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Maksimal {maxSizeMB} MB (PDF / JPG / PNG)
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 w-full min-w-0">
          {/* Baris 1: Ikon/Thumbnail Berkas + Nama Berkas + Ukuran */}
          <div className="flex items-center gap-2.5 min-w-0 w-full">
            {isImage && value?.previewUrl ? (
              <div className="w-9 h-9 rounded-md border border-slate-200 overflow-hidden bg-white shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={value.previewUrl}
                  alt={value.fileName || label}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-9 h-9 rounded-md bg-red-50 border border-red-200 flex items-center justify-center text-[#A8281C] shrink-0">
                <FileText className="w-4 h-4" />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <p
                className="text-xs font-semibold text-slate-800 truncate"
                title={value?.fileName || label}
              >
                {value?.fileName || "Berkas terpilih"}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {value?.fileSize ? formatFileSize(value.fileSize) : "Ukuran tidak diketahui"}
              </p>
            </div>
          </div>

          {/* Baris 2: Status Berkas (Kiri) & Tombol Aksi (Kanan) */}
          <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-slate-200/80 w-full">
            <div className="min-w-0">
              {value?.status === "staged" && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200/70">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                  Siap diunggah
                </span>
              )}
              {value?.status === "uploaded" && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/70">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  Tersimpan di vault
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {value?.previewUrl && (
                <a
                  href={value.previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-1.5 py-1 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded text-[11px] font-medium transition-colors flex items-center gap-1"
                  title="Lihat Pratinjau"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Lihat</span>
                </a>
              )}
              <button
                type="button"
                onClick={() => !disabled && fileInputRef.current?.click()}
                disabled={disabled}
                className="px-1.5 py-1 text-slate-600 hover:text-[#102E50] hover:bg-slate-200/60 rounded text-[11px] font-medium transition-colors flex items-center gap-1 cursor-pointer"
                title="Ganti Berkas"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Ganti</span>
              </button>
              <button
                type="button"
                onClick={handleRemove}
                disabled={disabled}
                className="px-1.5 py-1 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded text-[11px] font-medium transition-colors flex items-center gap-1 cursor-pointer"
                title="Hapus Berkas"
              >
                <Trash2 className="w-3 h-3" />
                <span>Hapus</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {activeError && (
        <div className="flex items-center gap-1.5 text-[11px] text-red-600 font-medium">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{activeError}</span>
        </div>
      )}
    </div>
  );
}
