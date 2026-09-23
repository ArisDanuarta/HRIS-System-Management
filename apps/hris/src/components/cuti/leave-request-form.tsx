"use client";

import React, { useState, useMemo, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Send,
  Info,
  Upload,
  FileText,
  Image as ImageIcon,
  X,
  Paperclip,
  Loader2,
} from "lucide-react";
import { calculateWorkingDays } from "@pspk/shared";
import {
  submitLeaveRequestAction,
  uploadLeaveAttachmentAction,
} from "@/server/actions/leave.actions";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface LeaveTypeItem {
  id: string;
  name: string;
  defaultQuotaDays: number;
  isPaid: boolean;
  requiresAttachment: boolean;
}

interface LeaveBalanceItem {
  leaveTypeId: string;
  quotaDays: number;
  usedDaysNumber: number;
  remainingDays: number;
}

interface LeaveRequestFormProps {
  leaveTypes: LeaveTypeItem[];
  balances: LeaveBalanceItem[];
  holidays: { date: Date | string }[];
}

export function LeaveRequestForm({
  leaveTypes,
  balances,
  holidays,
}: LeaveRequestFormProps) {
  const router = useRouter();

  const [leaveTypeId, setLeaveTypeId] = useState<string>(leaveTypes[0]?.id || "");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  
  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [attachmentKey, setAttachmentKey] = useState<string>("");
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Find selected leave type
  const selectedType = leaveTypes.find((lt) => lt.id === leaveTypeId);

  // Find balance for selected leave type
  const currentBalance = balances.find((b) => b.leaveTypeId === leaveTypeId);
  const remainingQuota = currentBalance
    ? currentBalance.remainingDays
    : selectedType?.defaultQuotaDays || 0;

  // Extract holiday date strings
  const holidayDates = useMemo(
    () => holidays.map((h) => (typeof h.date === "string" ? h.date : h.date.toISOString())),
    [holidays],
  );

  // Compute calculated working days live
  const calculatedDays = useMemo(() => {
    if (!startDate || !endDate) return 0;
    return calculateWorkingDays(startDate, endDate, holidayDates);
  }, [startDate, endDate, holidayDates]);

  const isBalanceExceeded = calculatedDays > remainingQuota;

  const handleUploadFile = async (file: File) => {
    setUploadError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await uploadLeaveAttachmentAction(formData);
      if (res.success && res.key) {
        setAttachmentKey(res.key);
        setUploadedFileName(res.fileName || file.name);
      } else {
        setUploadError(res.message || "Gagal mengunggah berkas lampiran.");
        setSelectedFile(null);
        setAttachmentKey("");
      }
    } catch {
      setUploadError("Terjadi kesalahan sistem saat mengunggah berkas.");
      setSelectedFile(null);
      setAttachmentKey("");
    } finally {
      setIsUploading(false);
    }
  };

  const validateAndProcessFile = (file: File) => {
    setUploadError(null);
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];
    const isAllowedExt = /\.(pdf|jpg|jpeg|png|webp)$/i.test(file.name);

    if (!allowedTypes.includes(file.type) && !isAllowedExt) {
      setUploadError("Format berkas tidak didukung. Harap unggah berkas PDF, JPG, atau PNG.");
      return;
    }

    const maxSizeBytes = 10 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setUploadError("Ukuran berkas melebihi batas maksimal 10 MB.");
      return;
    }

    setSelectedFile(file);
    handleUploadFile(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndProcessFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndProcessFile(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setAttachmentKey("");
    setUploadedFileName(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!startDate || !endDate) {
      setError("Silakan tentukan tanggal mulai dan tanggal akhir cuti.");
      return;
    }

    if (calculatedDays <= 0) {
      setError("Rentang tanggal yang dipilih tidak memuat hari kerja aktif (hanya akhir pekan / hari libur).");
      return;
    }

    if (isBalanceExceeded) {
      setError(
        `Saldo cuti Anda tidak mencukupi. Sisa saldo: ${remainingQuota} hari, dibutuhkan: ${calculatedDays} hari kerja.`,
      );
      return;
    }

    if (isUploading) {
      setError("Berkas lampiran sedang dalam proses pengunggahan. Harap tunggu hingga selesai.");
      return;
    }

    if (selectedType?.requiresAttachment && !attachmentKey) {
      setError(`Jenis cuti ${selectedType.name} mewajibkan pengunggahan berkas lampiran pendukung (surat dokter/keterangan).`);
      return;
    }

    startTransition(async () => {
      const res = await submitLeaveRequestAction({
        leaveTypeId,
        startDate,
        endDate,
        reason,
        attachmentKey: attachmentKey || undefined,
      });

      if (res.success) {
        setSuccess("Permohonan cuti berhasil diajukan! Anda akan dialihkan...");
        setTimeout(() => {
          router.push("/cuti");
        }, 1200);
      } else {
        setError(res.message);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[#dee9fc] shadow-sm p-6 sm:p-8 flex flex-col gap-6 max-w-2xl mx-auto">
      {/* Form Title & Back Link */}
      <div className="flex items-center justify-between pb-4 border-b border-[#dee9fc]">
        <div className="flex items-center gap-3">
          <Link
            href="/cuti"
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-[#102e50] font-heading">
              Formulir Permohonan Cuti
            </h1>
            <p className="text-xs text-slate-500">
              Isi rincian tanggal dan alasan permohonan cuti Anda di bawah ini
            </p>
          </div>
        </div>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs font-medium flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* 1. Select Leave Type */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold text-slate-700">
          Jenis Cuti <span className="text-red-500">*</span>
        </label>
        <select
          value={leaveTypeId}
          onChange={(e) => setLeaveTypeId(e.target.value)}
          className="px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-medium focus:ring-2 focus:ring-[#102e50] focus:outline-none cursor-pointer"
        >
          {leaveTypes.map((lt) => (
            <option key={lt.id} value={lt.id}>
              {lt.name} ({lt.isPaid ? "Berbayar" : "Tanpa Gaji"})
            </option>
          ))}
        </select>

        {/* Quota Information Tag */}
        <div className="flex items-center gap-2 mt-1 text-xs">
          <span className="text-slate-500">Sisa Kuota Anda:</span>
          <span className="font-bold text-[#102e50] px-2 py-0.5 rounded bg-[#eff4ff] border border-[#dee9fc]">
            {remainingQuota} Hari
          </span>
          {selectedType?.requiresAttachment && (
            <span className="text-amber-800 text-[11px] font-semibold">
              • Wajib melampirkan surat keterangan
            </span>
          )}
        </div>
      </div>

      {/* 2. Date Range Picker */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-700">
            Tanggal Mulai <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            required
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs focus:ring-2 focus:ring-[#102e50] focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-700">
            Tanggal Akhir <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            required
            value={endDate}
            min={startDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs focus:ring-2 focus:ring-[#102e50] focus:outline-none"
          />
        </div>
      </div>

      {/* Live Calculation Preview Banner */}
      {startDate && endDate && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-start gap-3 ${
            isBalanceExceeded
              ? "bg-red-50 border-red-200 text-red-900"
              : calculatedDays > 0
              ? "bg-[#eff4ff] border-[#dee9fc] text-[#102e50]"
              : "bg-amber-50 border-amber-200 text-amber-900"
          }`}
        >
          <Info className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1">
            <span className="font-bold">
              Total Durasi: {calculatedDays} Hari Kerja
            </span>
            <p className="text-[11px] leading-relaxed opacity-90">
              Sistem secara otomatis mengecualikan hari Sabtu, Minggu, dan Hari Libur Nasional resmi PSPK.
            </p>
            {isBalanceExceeded && (
              <span className="font-bold text-red-700 text-xs mt-1">
                ⚠️ Jumlah hari kerja yang diajukan ({calculatedDays} hari) melebihi sisa saldo cuti Anda ({remainingQuota} hari).
              </span>
            )}
          </div>
        </div>
      )}

      {/* 3. Reason Textarea */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold text-slate-700">
          Alasan Pengajuan Cuti <span className="text-red-500">*</span>
        </label>
        <textarea
          required
          rows={3}
          placeholder="Jelaskan secara ringkas keperluan cuti Anda..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="p-3.5 rounded-xl border border-slate-300 bg-white text-xs focus:ring-2 focus:ring-[#102e50] focus:outline-none"
        />
      </div>

      {/* 4. Attachment (Optional or Required) */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Paperclip className="w-3.5 h-3.5 text-[#102e50]" />
            <span>Lampiran Surat Keterangan</span>
            {selectedType?.requiresAttachment && <span className="text-red-500">*</span>}
          </label>
          <span className="text-[11px] text-slate-400 font-normal">PDF / JPG / PNG (Maks 10MB)</span>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,image/png,image/jpeg,image/jpg,image/webp"
          onChange={handleFileInputChange}
          className="hidden"
        />

        {selectedFile || attachmentKey ? (
          /* Selected File Card */
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 shadow-2xs">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-white border border-emerald-200 flex items-center justify-center shrink-0 text-emerald-700 shadow-2xs">
                {selectedFile?.type.includes("pdf") || uploadedFileName?.endsWith(".pdf") ? (
                  <FileText className="w-5 h-5" />
                ) : (
                  <ImageIcon className="w-5 h-5" />
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-slate-800 truncate">
                  {selectedFile ? selectedFile.name : uploadedFileName || "Berkas Lampiran"}
                </span>
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  {selectedFile && <span>{formatFileSize(selectedFile.size)}</span>}
                  {isUploading ? (
                    <span className="inline-flex items-center gap-1 text-amber-600 font-medium">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Mengunggah...
                    </span>
                  ) : attachmentKey ? (
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Siap dilampirkan
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0 ml-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:text-[#102e50] hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all cursor-pointer"
              >
                Ganti
              </button>
              <button
                type="button"
                onClick={handleRemoveFile}
                disabled={isUploading}
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all cursor-pointer"
                title="Hapus berkas"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* Dropzone / Upload Placeholder */
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-200 ${
              isDragging
                ? "border-[#102e50] bg-[#eff4ff]"
                : "border-slate-300 hover:border-[#102e50] hover:bg-slate-50/70 bg-slate-50/40"
            }`}
          >
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="w-10 h-10 rounded-full bg-white shadow-2xs border border-slate-200 flex items-center justify-center text-[#102e50]">
                <Upload className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <span className="font-semibold text-[#102e50] hover:underline">
                  Klik untuk memilih berkas
                </span>{" "}
                <span className="text-slate-500">atau seret dan lepas berkas ke sini</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Format didukung: PDF, JPG, PNG (Maksimal 10 MB)
              </p>
            </div>
          </div>
        )}

        {uploadError && (
          <p className="text-xs text-red-600 font-medium flex items-center gap-1.5 mt-0.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{uploadError}</span>
          </p>
        )}

        <p className="text-[11px] text-slate-400">
          {selectedType?.requiresAttachment
            ? "Untuk jenis cuti ini (seperti cuti sakit), wajib melampirkan surat keterangan dokter atau dokumen pendukung."
            : "Opsional. Anda dapat melampirkan surat keterangan dokter atau berkas pendukung bila diperlukan."}
        </p>
      </div>

      {/* Form Action Buttons */}
      <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
        <Link
          href="/cuti"
          className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors"
        >
          Batal
        </Link>
        <button
          type="submit"
          disabled={isPending || isBalanceExceeded || calculatedDays <= 0}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#102e50] text-white hover:bg-[#0c233d] text-xs font-bold shadow-xs hover:shadow-md transition-all disabled:opacity-50 cursor-pointer active:scale-[0.98]"
        >
          <Send className="w-3.5 h-3.5 text-[#ffddb0]" />
          <span>{isPending ? "Mengirim..." : "Ajukan Permohonan Cuti"}</span>
        </button>
      </div>
    </form>
  );
}
