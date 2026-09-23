"use client";

import React, { useState, useTransition, useId } from "react";
import {
  Clock,
  FileSpreadsheet,
  UploadCloud,
  FileCheck,
  AlertCircle,
  Building2,
  Briefcase,
  Calculator,
  DownloadCloud,
} from "lucide-react";
import { formatRupiah } from "@pspk/shared";
import { updatePayslipTimesheetAction } from "@/server/actions/payroll.actions";

export interface TimesheetModalPayslip {
  id: string;
  totalHours?: number | null;
  hourlyRate?: number | null;
  timesheetKey?: string | null;
  grossAmount: number;
  netAmount: number;
  wageType?: string | null;
  employee: {
    id: string;
    employeeNo: string;
    fullName: string;
    currentDepartment?: { id: string; name: string } | null;
    currentPosition?: { id: string; title: string } | null;
  };
  contract?: {
    wageType: string;
    hourlyRate: number | null;
    baseSalary: number | null;
  } | null;
}

interface TimesheetInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  payslip: TimesheetModalPayslip;
  periodTitle: string;
}

export function TimesheetInputModal({
  isOpen,
  onClose,
  payslip,
  periodTitle,
}: TimesheetInputModalProps) {
  const fileInputId = useId();
  const defaultRate =
    payslip.hourlyRate && payslip.hourlyRate > 0
      ? payslip.hourlyRate
      : payslip.contract?.hourlyRate && payslip.contract.hourlyRate > 0
      ? payslip.contract.hourlyRate
      : 30000;

  const [totalHours, setTotalHours] = useState<string>(
    payslip.totalHours !== null && payslip.totalHours !== undefined
      ? String(payslip.totalHours)
      : "0",
  );
  const [hourlyRate, setHourlyRate] = useState<string>(String(defaultRate));
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  const parsedHours = Math.max(0, parseFloat(totalHours) || 0);
  const parsedRate = Math.max(0, parseFloat(hourlyRate) || 0);
  const calculatedTotalPay = Math.round(parsedHours * parsedRate);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (parsedHours < 0) {
      setError("Total jam kerja tidak boleh bernilai negatif.");
      return;
    }

    if (parsedRate <= 0) {
      setError("Tarif upah per jam harus lebih dari Rp 0.");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("payslipId", payslip.id);
      formData.append("totalHours", String(parsedHours));
      formData.append("hourlyRate", String(parsedRate));
      if (selectedFile) {
        formData.append("timesheetFile", selectedFile);
      }

      const res = await updatePayslipTimesheetAction(formData);
      if (!res.ok) {
        setError(res.error);
      } else {
        setSuccess(res.message);
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-150 my-8">
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base leading-tight">
                Rekonsiliasi Timesheet Jam Kerja PKWT
              </h3>
              <p className="text-xs text-slate-500">{periodTitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg text-sm"
          >
            ✕
          </button>
        </div>

        {/* Profil Karyawan */}
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="font-bold text-slate-900 text-sm block">
                {payslip.employee.fullName}
              </span>
              <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2 mt-0.5">
                <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-[11px]">
                  {payslip.employee.employeeNo}
                </span>
                {payslip.employee.currentDepartment && (
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-slate-400" />
                    {payslip.employee.currentDepartment.name}
                  </span>
                )}
                {payslip.employee.currentPosition && (
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-3 h-3 text-slate-400" />
                    {payslip.employee.currentPosition.title}
                  </span>
                )}
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-200/80 rounded-lg px-2.5 py-1 text-right shrink-0">
              <span className="text-[10px] text-amber-700 font-bold uppercase tracking-wider block">
                Skema Kontrak
              </span>
              <span className="text-xs font-bold text-amber-900">Per Jam (No Work, No Pay)</span>
            </div>
          </div>
        </div>

        {/* Info Kebijakan Pengumpulan Tgl 20 */}
        <div className="bg-blue-50/70 border border-blue-200/70 rounded-xl p-3 mb-5 text-xs text-blue-900 flex items-start gap-2.5">
          <FileSpreadsheet className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold text-blue-950">Aturan Pengumpulan Timesheet: </span>
            Staf PKWT mencatat jam harian di template timesheet, meminta review & ttd persetujuan (acc)
            dari Lead Divisi/Project, lalu mengumpulkan ke HR pada <strong>tanggal 20</strong> setiap bulannya.
          </div>
        </div>

        {/* Notifikasi Pesan */}
        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
            <FileCheck className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{success}</span>
          </div>
        )}

        {/* Form Input Jam Kerja & Upload */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Input Total Jam */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Total Jam Kerja Valid <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  max="744"
                  value={totalHours}
                  onChange={(e) => setTotalHours(e.target.value)}
                  placeholder="Contoh: 120"
                  required
                  className="w-full pl-3 pr-12 py-2 text-sm font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50] text-slate-900"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">
                  Jam
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Sesuai rekap baris di spreadsheet</p>
            </div>

            {/* Input Tarif Per Jam */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Tarif Upah Per Jam (Rp) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="1000"
                  min="1000"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  placeholder="30000"
                  required
                  className="w-full pl-3 pr-12 py-2 text-sm font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50] text-slate-900"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">
                  / jam
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Standar kontrak: Rp 30.000 / jam</p>
            </div>
          </div>

          {/* Kotak Kalkulasi Upah */}
          <div className="bg-slate-900 text-white rounded-xl p-3.5 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
              <span className="flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5 text-[#F2AF3E]" />
                Kalkulasi Upah Timesheet:
              </span>
              <span className="font-mono text-slate-400">
                {parsedHours} jam × {formatRupiah(parsedRate)}
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-slate-400">Total Upah Bruto Terhitung</span>
              <span className="text-xl font-bold font-mono text-[#F2AF3E]">
                {formatRupiah(calculatedTotalPay)}
              </span>
            </div>
          </div>

          {/* Berkas Timesheet Lampiran */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Lampiran Berkas Timesheet yang Telah Di-acc Lead
            </label>

            {payslip.timesheetKey && (
              <div className="mb-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-emerald-800">
                  <FileCheck className="w-4 h-4 text-emerald-600" />
                  <span>Berkas bukti timesheet sebelumnya sudah tersimpan</span>
                </div>
                <a
                  href={`/api/documents/${payslip.timesheetKey}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:text-emerald-900 underline"
                >
                  <DownloadCloud className="w-3.5 h-3.5" />
                  <span>Unduh File</span>
                </a>
              </div>
            )}

            <div className="border-2 border-dashed border-slate-200 hover:border-slate-300 rounded-xl p-3.5 text-center transition-colors bg-slate-50/50">
              <input
                id={fileInputId}
                type="file"
                accept=".pdf,.xlsx,.xls,.csv"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setSelectedFile(e.target.files[0]);
                  }
                }}
                className="hidden"
              />
              <label
                htmlFor={fileInputId}
                className="cursor-pointer flex flex-col items-center justify-center gap-1.5"
              >
                <UploadCloud className="w-6 h-6 text-slate-400" />
                <span className="text-xs font-semibold text-slate-700">
                  {selectedFile
                    ? selectedFile.name
                    : payslip.timesheetKey
                    ? "Unggah berkas baru untuk mengganti lampiran (Opsional)"
                    : "Pilih atau Seret Berkas Timesheet yang Sudah Di-acc (PDF / Excel)"}
                </span>
                <span className="text-[11px] text-slate-400">
                  Format: PDF, XLSX, XLS, CSV (Maksimal 15 MB)
                </span>
              </label>
            </div>
          </div>

          {/* Tombol Aksi */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold bg-[#102E50] text-white hover:bg-[#102E50]/90 rounded-xl transition-colors shadow-2xs disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Menyimpan & Menghitung...</span>
                </>
              ) : (
                <>
                  <Clock className="w-3.5 h-3.5 text-[#F2AF3E]" />
                  <span>Simpan & Hitung Ulang Slip</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
