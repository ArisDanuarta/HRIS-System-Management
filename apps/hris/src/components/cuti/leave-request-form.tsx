"use client";

import React, { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Send,
  Info,
} from "lucide-react";
import { calculateWorkingDays } from "@pspk/shared";
import { submitLeaveRequestAction } from "@/server/actions/leave.actions";

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
  const [attachmentKey, setAttachmentKey] = useState<string>("");
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

    if (selectedType?.requiresAttachment && !attachmentKey) {
      setError(`Jenis cuti ${selectedType.name} mewajibkan pengunggahan berkas lampiran pendukung.`);
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
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
          <span>Lampiran Surat Keterangan {selectedType?.requiresAttachment && <span className="text-red-500">*</span>}</span>
          <span className="text-[11px] text-slate-400 font-normal">PDF / JPG / PNG (Maks 10MB)</span>
        </label>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Kunci dokumen / nama berkas lampiran..."
            value={attachmentKey}
            onChange={(e) => setAttachmentKey(e.target.value)}
            className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs focus:ring-2 focus:ring-[#102e50] focus:outline-none"
          />
        </div>
        <p className="text-[11px] text-slate-400">
          Untuk cuti sakit wajib melampirkan surat keterangan dokter.
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
