"use client";

import React, { useState, useMemo, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  Calendar,
  HeartPulse,
  Clock,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Send,
  Upload,
  FileText,
  Image as ImageIcon,
  X,
  Paperclip,
  Loader2,
  FileCheck2,
  Check,
  Building,
  UserCheck,
  ShieldAlert,
} from "lucide-react";
import { calculateWorkingDays, toDateString } from "@pspk/shared";
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

interface EmployeeInfo {
  fullName: string;
  employeeNo: string;
  department: string | null;
  position: string | null;
}

interface LeaveRequestFormProps {
  leaveTypes: LeaveTypeItem[];
  balances: LeaveBalanceItem[];
  holidays: { date: Date | string; name?: string }[];
  employeeInfo?: EmployeeInfo;
}

type WizardStep = 1 | 2 | 3 | 4;

export function LeaveRequestForm({
  leaveTypes,
  balances,
  holidays,
  employeeInfo,
}: LeaveRequestFormProps) {
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
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

  const [stepError, setStepError] = useState<string | null>(null);
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
  const holidayDates = useMemo(() => holidays.map((h) => toDateString(h.date)), [holidays]);

  // Compute calculated working days live
  const calculatedDays = useMemo(() => {
    if (!startDate || !endDate) return 0;
    return calculateWorkingDays(startDate, endDate, holidayDates);
  }, [startDate, endDate, holidayDates]);

  // Find holidays that fall within the chosen date range
  const holidaysInRange = useMemo(() => {
    if (!startDate || !endDate) return [];
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    return holidays.filter((h) => {
      const d = new Date(toDateString(h.date)).getTime();
      return d >= start && d <= end;
    });
  }, [startDate, endDate, holidays]);

  const isBalanceExceeded = calculatedDays > remainingQuota;

  const getLeaveIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes("tahunan") || lower.includes("annual")) {
      return <Calendar className="w-5 h-5 text-[#102e50]" />;
    }
    if (lower.includes("sakit") || lower.includes("sick")) {
      return <HeartPulse className="w-5 h-5 text-[#a8281c]" />;
    }
    if (lower.includes("penting")) {
      return <Clock className="w-5 h-5 text-[#df632f]" />;
    }
    return <Sparkles className="w-5 h-5 text-[#8e2d3f]" />;
  };

  const getThemeColors = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes("tahunan")) {
      return {
        badge: "bg-[#102e50]/10 text-[#102e50] border-[#102e50]/20",
        activeBorder: "border-[#102e50] bg-[#102e50]/5 ring-2 ring-[#102e50]/15",
      };
    }
    if (lower.includes("sakit")) {
      return {
        badge: "bg-[#a8281c]/10 text-[#a8281c] border-[#a8281c]/20",
        activeBorder: "border-[#a8281c] bg-[#a8281c]/5 ring-2 ring-[#a8281c]/15",
      };
    }
    if (lower.includes("penting")) {
      return {
        badge: "bg-[#df632f]/10 text-[#df632f] border-[#df632f]/20",
        activeBorder: "border-[#df632f] bg-[#df632f]/5 ring-2 ring-[#df632f]/15",
      };
    }
    return {
      badge: "bg-[#8e2d3f]/10 text-[#8e2d3f] border-[#8e2d3f]/20",
      activeBorder: "border-[#8e2d3f] bg-[#8e2d3f]/5 ring-2 ring-[#8e2d3f]/15",
    };
  };

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
    const allowedTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png", "image/webp"];
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

  // Validation before going to next step
  const handleNextStep = () => {
    setStepError(null);

    if (currentStep === 1) {
      if (!leaveTypeId) {
        setStepError("Silakan pilih salah satu jenis cuti.");
        return;
      }
      if (remainingQuota <= 0) {
        setStepError(
          `Sisa kuota untuk jenis cuti ${selectedType?.name} telah habis (0 hari). Pilih jenis cuti lain.`,
        );
        return;
      }
      setCurrentStep(2);
      return;
    }

    if (currentStep === 2) {
      if (!startDate || !endDate) {
        setStepError("Tentukan tanggal mulai dan tanggal akhir cuti.");
        return;
      }
      if (new Date(startDate) > new Date(endDate)) {
        setStepError("Tanggal mulai tidak boleh lebih lambat dari tanggal akhir.");
        return;
      }
      if (calculatedDays <= 0) {
        setStepError(
          "Rentang tanggal yang dipilih tidak memuat hari kerja aktif (seluruhnya akhir pekan / libur nasional).",
        );
        return;
      }
      if (isBalanceExceeded) {
        setStepError(
          `Jumlah hari kerja yang diajukan (${calculatedDays} hari) melebihi sisa kuota Anda (${remainingQuota} hari).`,
        );
        return;
      }
      setCurrentStep(3);
      return;
    }

    if (currentStep === 3) {
      if (!reason.trim()) {
        setStepError("Alasan pengajuan cuti wajib diisi.");
        return;
      }
      if (isUploading) {
        setStepError("Berkas sedang diunggah. Harap tunggu hingga proses selesai.");
        return;
      }
      if (selectedType?.requiresAttachment && !attachmentKey) {
        setStepError(
          `Jenis cuti ${selectedType.name} mewajibkan pengunggahan surat keterangan / berkas lampiran.`,
        );
        return;
      }
      setCurrentStep(4);
      return;
    }
  };

  const handlePrevStep = () => {
    setStepError(null);
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as WizardStep);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (isBalanceExceeded || calculatedDays <= 0) {
      setError("Permohonan tidak dapat diproses karena kendala validasi kuota atau tanggal.");
      return;
    }

    if (selectedType?.requiresAttachment && !attachmentKey) {
      setError("Dokumen lampiran wajib disertakan untuk jenis cuti ini.");
      return;
    }

    startTransition(async () => {
      const res = await submitLeaveRequestAction({
        leaveTypeId,
        startDate,
        endDate,
        reason: reason.trim(),
        attachmentKey: attachmentKey || undefined,
      });

      if (res.success) {
        setSuccess("Permohonan cuti berhasil diajukan! Anda akan dialihkan ke halaman cuti...");
        setTimeout(() => {
          router.push("/cuti");
        }, 1200);
      } else {
        setError(res.message);
      }
    });
  };

  // Steps definition for header
  const stepsList = [
    { num: 1, label: "Kategori Cuti" },
    { num: 2, label: "Jadwal & Durasi" },
    { num: 3, label: "Alasan & Berkas" },
    { num: 4, label: "Konfirmasi" },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
      {/* 1. Modern Multi-Step Progress Header */}
      <div className="px-6 py-5 border-b border-slate-200/80 bg-slate-50/60">
        <div className="flex items-center justify-between max-w-xl mx-auto relative">
          {/* Connecting line */}
          <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-200 -z-0" />
          <div
            className="absolute top-4 left-6 h-0.5 bg-[#102e50] transition-all duration-300 -z-0"
            style={{ width: `${((currentStep - 1) / (stepsList.length - 1)) * 100}%` }}
          />

          {stepsList.map((st) => {
            const isCompleted = currentStep > st.num;
            const isCurrent = currentStep === st.num;

            return (
              <div key={st.num} className="flex flex-col items-center gap-1.5 relative z-10">
                <button
                  type="button"
                  disabled={st.num > currentStep}
                  onClick={() => {
                    if (st.num < currentStep) {
                      setStepError(null);
                      setCurrentStep(st.num as WizardStep);
                    }
                  }}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isCompleted
                      ? "bg-[#102e50] text-[#f2af3e] shadow-xs cursor-pointer"
                      : isCurrent
                        ? "bg-[#102e50] text-white ring-4 ring-[#102e50]/15 shadow-xs"
                        : "bg-white text-slate-400 border border-slate-300 cursor-not-allowed"
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4 stroke-[2.5]" /> : st.num}
                </button>
                <span
                  className={`text-[11px] font-semibold whitespace-nowrap hidden sm:block ${
                    isCurrent ? "text-[#102e50]" : isCompleted ? "text-slate-700" : "text-slate-400"
                  }`}
                >
                  {st.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Step Form Body */}
      <div className="p-6 sm:p-8">
        {/* Step-level Error Alert */}
        {stepError && (
          <div className="mb-6 p-4 rounded-xl bg-[#a8281c]/10 border border-[#a8281c]/25 text-[#a8281c] text-xs font-medium flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-[#a8281c] shrink-0" />
            <span>{stepError}</span>
          </div>
        )}

        {/* Global Action Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-[#a8281c]/10 border border-[#a8281c]/25 text-[#a8281c] text-xs font-medium flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-[#a8281c] shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Global Action Success Alert */}
        {success && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* ================= STEP 1: PILIH JENIS CUTI & CEK KUOTA ================= */}
        {currentStep === 1 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div>
              <h2 className="text-base font-bold text-[#102e50] font-heading">
                Pilih Kategori Cuti
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Pilih jenis permohonan yang sesuai. Sisa saldo kuota aktif Anda tercantum pada tiap
                kartu.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {leaveTypes.map((lt) => {
                const bal = balances.find((b) => b.leaveTypeId === lt.id);
                const remaining = bal ? bal.remainingDays : lt.defaultQuotaDays;
                const isSelected = leaveTypeId === lt.id;
                const theme = getThemeColors(lt.name);

                return (
                  <div
                    key={lt.id}
                    onClick={() => {
                      setLeaveTypeId(lt.id);
                      setStepError(null);
                    }}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between relative ${
                      isSelected
                        ? theme.activeBorder
                        : "border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50"
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                          {getLeaveIcon(lt.name)}
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap justify-end">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              lt.isPaid
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-slate-100 text-slate-600 border border-slate-200"
                            }`}
                          >
                            {lt.isPaid ? "Berbayar" : "Tanpa Gaji"}
                          </span>
                          {lt.requiresAttachment && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#df632f]/10 text-[#df632f] border border-[#df632f]/25">
                              Wajib Surat
                            </span>
                          )}
                        </div>
                      </div>

                      <h3 className="text-sm font-bold text-[#102e50] font-heading">{lt.name}</h3>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium">Sisa Kuota Aktif</span>
                      <span
                        className={`font-bold tabular-nums px-2 py-0.5 rounded ${
                          remaining > 0
                            ? "text-[#102e50] bg-slate-100"
                            : "text-[#a8281c] bg-[#a8281c]/10"
                        }`}
                      >
                        {remaining} Hari
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= STEP 2: RENTANG TANGGAL & DURASI HARI ================= */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h2 className="text-base font-bold text-[#102e50] font-heading">
                Tentukan Tanggal &amp; Durasi
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Pilih tanggal mulai dan akhir. Hari Sabtu, Minggu, serta Libur Nasional otomatis
                dikecualikan.
              </p>
            </div>

            {/* Selected type pill */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                  {selectedType && getLeaveIcon(selectedType.name)}
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider block">
                    Kategori Cuti Terpilih
                  </span>
                  <span className="text-xs font-bold text-[#102e50] font-heading">
                    {selectedType?.name}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-medium block">Sisa Saldo</span>
                <span className="text-xs font-bold text-[#102e50] tabular-nums">
                  {remainingQuota} Hari
                </span>
              </div>
            </div>

            {/* Date Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#102e50]">
                  Tanggal Mulai <span className="text-[#a8281c]">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setStepError(null);
                  }}
                  className="px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-800 font-medium focus:ring-2 focus:ring-[#102e50] focus:border-transparent focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#102e50]">
                  Tanggal Akhir <span className="text-[#a8281c]">*</span>
                </label>
                <input
                  type="date"
                  required
                  min={startDate}
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setStepError(null);
                  }}
                  className="px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-800 font-medium focus:ring-2 focus:ring-[#102e50] focus:border-transparent focus:outline-none"
                />
              </div>
            </div>

            {/* Dynamic Working Days Calculation Banner */}
            {startDate && endDate && (
              <div
                className={`p-4 rounded-xl border text-xs flex flex-col gap-2.5 ${
                  isBalanceExceeded
                    ? "bg-[#a8281c]/5 border-[#a8281c]/25 text-[#a8281c]"
                    : calculatedDays > 0
                      ? "bg-slate-50 border-slate-200 text-slate-800"
                      : "bg-[#df632f]/10 border-[#df632f]/25 text-[#df632f]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#102e50]" />
                    <span className="font-bold text-[#102e50] font-heading">
                      Total Durasi Efektif: {calculatedDays} Hari Kerja
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500">
                    Sisa Kuota Setelah Pengajuan: {Math.max(0, remainingQuota - calculatedDays)} Hari
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Sistem mengecualikan hari Sabtu, Minggu, dan Hari Libur Nasional secara otomatis
                  sehingga tidak memotong saldo cuti Anda secara berlebih.
                </p>

                {/* Holidays in range info */}
                {holidaysInRange.length > 0 && (
                  <div className="pt-2 border-t border-slate-200/80">
                    <span className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Hari Libur Nasional yang terlewati (tidak memotong saldo):
                    </span>
                    <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-500">
                      {holidaysInRange.map((h, i) => (
                        <li key={i}>
                          {toDateString(h.date)}: {h.name || "Libur Nasional"}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {isBalanceExceeded && (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#a8281c] pt-1">
                    <ShieldAlert className="w-4 h-4" />
                    <span>
                      Saldo cuti Anda ({remainingQuota} hari) tidak mencukupi untuk durasi{" "}
                      {calculatedDays} hari kerja yang diajukan.
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ================= STEP 3: ALASAN & DOKUMEN LAMPIRAN ================= */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h2 className="text-base font-bold text-[#102e50] font-heading">
                Alasan &amp; Berkas Pendukung
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Berikan penjelasan singkat mengenai keperluan cuti dan lampirkan dokumen pendukung
                bila diwajibkan.
              </p>
            </div>

            {/* Reason Textarea */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#102e50]">
                Keperluan / Alasan Cuti <span className="text-[#a8281c]">*</span>
              </label>
              <textarea
                required
                rows={4}
                placeholder="Contoh: Mengambil hak cuti tahunan keluarga / istirahat pemulihan kesehatan..."
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  setStepError(null);
                }}
                className="p-3.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-[#102e50] focus:border-transparent focus:outline-none leading-relaxed"
              />
              <span className="text-[10px] text-slate-400 text-right">
                Minimal jelaskan secara ringkas keperluan izin kerja Anda.
              </span>
            </div>

            {/* File Upload Dropzone */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#102e50] flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5 text-[#102e50]" />
                  <span>Dokumen Pendukung / Surat Keterangan</span>
                  {selectedType?.requiresAttachment ? (
                    <span className="text-[#a8281c] font-bold">* (Wajib)</span>
                  ) : (
                    <span className="text-slate-400 font-normal">(Opsional)</span>
                  )}
                </label>
                <span className="text-[10px] text-slate-400 font-medium">
                  PDF / JPG / PNG (Maks 10 MB)
                </span>
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
                    <div className="w-10 h-10 rounded-lg bg-white border border-emerald-200 flex items-center justify-center shrink-0 text-emerald-700">
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
                          <span className="inline-flex items-center gap-1 text-[#df632f] font-medium">
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
                      className="p-1.5 text-slate-400 hover:text-[#a8281c] hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all cursor-pointer"
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
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                    isDragging
                      ? "border-[#102e50] bg-slate-50"
                      : "border-slate-300 hover:border-[#102e50] hover:bg-slate-50/70 bg-slate-50/30"
                  }`}
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-white shadow-xs border border-slate-200 flex items-center justify-center text-[#102e50]">
                      <Upload className="w-4 h-4" />
                    </div>
                    <div className="text-xs">
                      <span className="font-semibold text-[#102e50] hover:underline">
                        Klik untuk memilih dokumen
                      </span>{" "}
                      <span className="text-slate-500">atau seret dan lepas berkas ke sini</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Format yang didukung: PDF, JPG, PNG (Maksimal 10 MB)
                    </p>
                  </div>
                </div>
              )}

              {uploadError && (
                <p className="text-xs text-[#a8281c] font-medium flex items-center gap-1.5 mt-0.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{uploadError}</span>
                </p>
              )}

              {selectedType?.requiresAttachment && (
                <div className="p-3 rounded-lg bg-[#df632f]/10 border border-[#df632f]/25 text-[11px] text-[#df632f] flex items-center gap-2 mt-1">
                  <FileCheck2 className="w-4 h-4 shrink-0" />
                  <span>
                    Untuk jenis cuti ini, surat keterangan dokter atau dokumen pendukung resmi wajib
                    disertakan sebelum pengajuan dapat diproses.
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= STEP 4: RINGKASAN & KONFIRMASI ================= */}
        {currentStep === 4 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h2 className="text-base font-bold text-[#102e50] font-heading">
                Tinjauan &amp; Konfirmasi Permohonan
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Periksa kembali data pengajuan cuti Anda sebelum mengirimkannya untuk diverifikasi
                oleh atasan.
              </p>
            </div>

            {/* Summary Ticket Card */}
            <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              {/* Ticket Header: Employee Info */}
              <div className="bg-[#102e50] text-white p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0 text-[#f2af3e]">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-300 uppercase tracking-wider font-semibold block">
                      Pemohon Cuti
                    </span>
                    <h3 className="text-sm font-bold text-white font-heading">
                      {employeeInfo?.fullName || "Pegawai PSPK"}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <Building className="w-3.5 h-3.5 text-[#f2af3e]" />
                  <span>
                    {employeeInfo?.department || "Organisasi PSPK"} ·{" "}
                    {employeeInfo?.position || "Staf"}
                  </span>
                </div>
              </div>

              {/* Ticket Body: Details */}
              <div className="p-5 sm:p-6 bg-white space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider block">
                      Kategori Cuti
                    </span>
                    <span className="font-bold text-[#102e50] text-sm mt-0.5 block">
                      {selectedType?.name} ({selectedType?.isPaid ? "Berbayar" : "Tanpa Gaji"})
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider block">
                      Durasi Efektif
                    </span>
                    <span className="font-bold text-[#102e50] text-sm mt-0.5 block tabular-nums">
                      {calculatedDays} Hari Kerja
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider block">
                      Rentang Tanggal
                    </span>
                    <span className="font-bold text-slate-800 text-xs mt-0.5 block">
                      {startDate} s/d {endDate}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider block">
                      Dampak Saldo Kuota
                    </span>
                    <span className="font-semibold text-slate-700 text-xs mt-0.5 block">
                      {remainingQuota} Hari - {calculatedDays} Hari ={" "}
                      <strong className="text-[#102e50]">
                        {remainingQuota - calculatedDays} Hari Tersisa
                      </strong>
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider block">
                    Alasan / Keperluan
                  </span>
                  <p className="text-slate-700 text-xs mt-1 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                    {reason}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider block mb-1">
                    Dokumen Lampiran
                  </span>
                  {attachmentKey ? (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                      <Paperclip className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{uploadedFileName || "Surat Keterangan Terlampir"}</span>
                    </div>
                  ) : (
                    <span className="text-slate-400 text-xs italic">
                      Tidak ada dokumen lampiran yang diunggah
                    </span>
                  )}
                </div>
              </div>

              {/* Notice footer */}
              <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#102e50] shrink-0" />
                <span>
                  Permohonan ini akan secara otomatis diteruskan kepada atasan langsung Anda untuk
                  proses evaluasi & persetujuan.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 3. Wizard Navigation Buttons */}
        <div className="mt-8 pt-5 border-t border-slate-200 flex items-center justify-between gap-3">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handlePrevStep}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Sebelumnya</span>
            </button>
          ) : (
            <Link
              href="/cuti"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold transition-colors"
            >
              Batal
            </Link>
          )}

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#102e50] hover:bg-[#0c233d] text-white text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-[0.98]"
            >
              <span>Lanjut ke Langkah {currentStep + 1}</span>
              <ArrowRight className="w-4 h-4 text-[#f2af3e]" />
            </button>
          ) : (
            <button
              type="button"
              disabled={isPending || isBalanceExceeded || calculatedDays <= 0}
              onClick={handleSubmit}
              className="inline-flex items-center gap-2 px-7 py-2.5 rounded-xl bg-[#102e50] hover:bg-[#0c233d] text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50 cursor-pointer active:scale-[0.98]"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#f2af3e]" />
                  <span>Mengirim Permohonan...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 text-[#f2af3e]" />
                  <span>Kirim Permohonan Cuti</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
