"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import {
  X,
  Printer,
  FileText,
  Lock,
  CheckCircle2,
  Clock,
  Building2,
} from "lucide-react";
import { formatRupiah, formatDate, angkaTerbilang } from "@pspk/shared";
import { MyPayslipDetail } from "@/server/queries/payslip.queries";

const MONTH_NAMES = [
  "",
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

interface PayslipPrintableModalProps {
  isOpen: boolean;
  onClose: () => void;
  payslip: MyPayslipDetail | null;
}

export function PayslipPrintableModal({
  isOpen,
  onClose,
  payslip,
}: PayslipPrintableModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !payslip) return null;

  const monthLabel = MONTH_NAMES[payslip.month] || `Bulan ${payslip.month}`;
  const periodTitle = `${monthLabel} ${payslip.year}`;
  const kindLabel =
    payslip.kind === "THR"
      ? "Tunjangan Hari Raya (THR)"
      : "Gaji Bulanan Reguler";

  const settings = payslip.institutionSettings;

  const getBorderClass = (style?: string) => {
    switch (style) {
      case "NAVY_GOLD":
        return "border-b-2 border-[#102E50] pb-4 relative after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:right-0 after:h-[2px] after:bg-[#F2AF3E]";
      case "DOUBLE_LINE":
        return "border-b-4 border-double border-[#102E50] pb-4";
      case "MINIMALIST":
        return "border-b border-slate-200 pb-4";
      case "NAVY_SOLID":
      default:
        return "border-b-2 border-[#102E50] pb-4";
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      {/* Print stylesheet */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-payslip-sheet,
          #printable-payslip-sheet * {
            visibility: visible;
          }
          #printable-payslip-sheet {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 24px;
            box-shadow: none;
            border: none;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Backdrop */}
      <div
        className="fixed inset-0 no-print"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div className="relative bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 flex flex-col overflow-hidden z-10 animate-in zoom-in-95 duration-200 my-8">
        {/* Top Action Bar (No-Print) */}
        <div className="px-6 py-4 bg-[#102E50] text-white flex items-center justify-between shrink-0 no-print">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-[#F2AF3E]">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-sm sm:text-base font-bold tracking-tight text-white">
                Rincian Slip Gaji Elektronik
              </h3>
              <p className="text-[11px] text-[#adc8f2]">
                Periode {periodTitle} • {kindLabel}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F2AF3E] text-[#102E50] text-xs font-bold hover:bg-[#e09e2e] transition-colors cursor-pointer shadow-xs active:scale-[0.98]"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Payslip Document Sheet */}
        <div
          id="printable-payslip-sheet"
          className="p-6 sm:p-8 space-y-6 overflow-y-auto max-h-[calc(90vh-120px)] bg-white text-slate-800 text-xs sm:text-sm"
        >
          {/* PSPK Letterhead / Kop Surat Dinamis */}
          {settings?.headerBannerUrl ? (
            <div className="relative w-full h-20 sm:h-24 rounded-xl overflow-hidden border border-slate-200 mb-4">
              <Image
                src={settings.headerBannerUrl}
                alt="Banner Kop Surat Lembaga"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          ) : (
            <div className={`flex items-start justify-between ${getBorderClass(settings?.borderStyle)}`}>
              <div className="flex items-center gap-3">
                {settings?.logoUrl ? (
                  <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center shadow-xs shrink-0 relative overflow-hidden">
                    <Image
                      src={settings.logoUrl}
                      alt="Logo Lembaga"
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-[#102E50] text-[#F2AF3E] font-bold font-serif text-xl flex items-center justify-center shadow-xs shrink-0">
                    P
                  </div>
                )}
                <div>
                  <h1 className="text-base sm:text-lg font-bold text-[#102E50] font-serif tracking-tight leading-none uppercase">
                    {settings?.institutionName || "Pusat Studi Pendidikan & Kebijakan"}
                  </h1>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {settings?.subHeader || "HR & Finance Division • Sistem Penggajian Elektronik"}
                  </p>
                  {settings?.addressLine && (
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {settings.addressLine}
                    </p>
                  )}
                </div>
              </div>

              <div className="text-right">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
                  <Lock className="w-3 h-3 text-rose-600" />
                  Rahasia / Confidential
                </span>
                <p className="text-[11px] text-slate-400 mt-1">
                  Ref: #{payslip.id.slice(0, 8).toUpperCase()}
                </p>
              </div>
            </div>
          )}

          {/* Title Banner */}
          <div className="text-center py-2 bg-slate-50 rounded-lg border border-slate-200">
            <h2 className="text-sm font-bold text-[#102E50] font-serif uppercase tracking-wider">
              Slip Gaji Karyawan — {periodTitle}
            </h2>
            <p className="text-xs text-slate-600 font-medium">
              Jenis: {kindLabel}
            </p>
          </div>

          {/* Employee & Bank Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#f8fafd] p-4 rounded-xl border border-[#dee9fc]">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Nama Karyawan:</span>
                <span className="font-bold text-[#102E50]">
                  {payslip.employee.fullName}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">NIP:</span>
                <span className="font-mono font-semibold text-slate-700">
                  {payslip.employee.employeeNo}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Posisi / Jabatan:</span>
                <span className="font-semibold text-slate-700">
                  {payslip.employee.positionTitle}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Divisi Kerja:</span>
                <span className="font-semibold text-slate-700">
                  {payslip.employee.departmentName}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Skema Kontrak:</span>
                <span className="font-semibold text-slate-700">
                  {payslip.wageType === "HOURLY" ? (
                    <span className="inline-flex items-center gap-1 text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-semibold text-[11px]">
                      <Clock className="w-3 h-3 text-amber-600" />
                      PKWT Per Jam
                    </span>
                  ) : (
                    "Bulanan Tetap"
                  )}
                </span>
              </div>
            </div>

            <div className="space-y-1.5 sm:border-l sm:border-slate-200 sm:pl-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Bank Pembayaran:</span>
                <span className="font-semibold text-slate-700">
                  {payslip.employee.bankName}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">No. Rekening:</span>
                <span className="font-mono font-semibold text-slate-700">
                  {payslip.employee.bankAccountMasked}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Tanggal Terbit:</span>
                <span className="font-semibold text-slate-700">
                  {formatDate(payslip.publishedAt)}
                </span>
              </div>
              {payslip.wageType === "HOURLY" ? (
                <>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Total Jam Disetujui:</span>
                    <span className="font-mono font-bold text-[#102E50]">
                      {payslip.totalHours ?? 0} Jam
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Tarif Satuan Kontrak:</span>
                    <span className="font-mono font-semibold text-slate-700">
                      {payslip.hourlyRate ? `${formatRupiah(payslip.hourlyRate)} / jam` : "-"}
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Status Dokumen:</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Resmi Terbit (PUBLISHED)
                  </span>
                </div>
              )}

              {/* Info Bank Penyalur PSPK */}
              {settings?.senderBankName && (
                <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-200/60 text-slate-700">
                  <div className="flex items-center gap-1 text-slate-500">
                    <Building2 className="w-3 h-3 text-emerald-600" />
                    <span className="font-medium">Penyalur Resmi:</span>
                  </div>
                  <span className="font-semibold text-emerald-800 text-[11px]">
                    {settings.senderBankName} ({settings.senderAccountMasked})
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Timesheet Work Hours Callout (Khusus PKWT Per Jam) */}
          {payslip.wageType === "HOURLY" && (
            <div className="p-3.5 bg-amber-50/90 rounded-xl border border-amber-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-start sm:items-center gap-2.5 text-amber-900">
                <div className="w-6 h-6 rounded-lg bg-amber-200/70 text-amber-800 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="font-bold text-amber-950 block sm:inline mr-1">
                    Dasar Perhitungan Timesheet HR:
                  </span>
                  <span className="text-amber-900">
                    Total jam kerja disetujui sebanyak{" "}
                    <strong className="font-mono text-[#102E50] font-bold">{payslip.totalHours ?? 0} Jam</strong>{" "}
                    × tarif kontrak{" "}
                    <strong className="font-mono text-[#102E50] font-bold">
                      {payslip.hourlyRate ? `${formatRupiah(payslip.hourlyRate)}/jam` : "-"}
                    </strong>
                  </span>
                </div>
              </div>
              {payslip.totalHours && payslip.hourlyRate && (
                <div className="text-right shrink-0 bg-white/80 px-2.5 py-1 rounded-md border border-amber-200">
                  <span className="text-[10px] text-slate-500 block uppercase font-medium">Subtotal Jam</span>
                  <span className="font-mono font-bold text-sm text-[#102E50]">
                    {formatRupiah(payslip.totalHours * payslip.hourlyRate)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Breakdown Table: Earnings vs Deductions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Column 1: Penerimaan (Earnings) */}
            <div className="flex flex-col border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
              <div className="px-4 py-2.5 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between">
                <span className="font-bold text-emerald-900 text-xs uppercase tracking-wider">
                  A. Penerimaan (Earnings)
                </span>
              </div>
              <div className="divide-y divide-slate-100 p-2 grow">
                {payslip.earnings.length > 0 ? (
                  payslip.earnings.map((e) => (
                    <div
                      key={e.id}
                      className="flex items-center justify-between py-2 px-2 text-xs"
                    >
                      <span className="text-slate-700">{e.label}</span>
                      <span className="font-semibold font-mono text-slate-900">
                        {formatRupiah(e.amount)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-xs text-slate-400 italic">
                    Tidak ada komponen pendapatan khusus
                  </div>
                )}
              </div>
              <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs font-bold text-slate-900">
                <span>Total Penerimaan Bruto</span>
                <span className="font-mono text-sm text-[#102E50]">
                  {formatRupiah(payslip.grossAmount)}
                </span>
              </div>
            </div>

            {/* Column 2: Potongan (Deductions) */}
            <div className="flex flex-col border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
              <div className="px-4 py-2.5 bg-rose-50 border-b border-rose-100 flex items-center justify-between">
                <span className="font-bold text-rose-900 text-xs uppercase tracking-wider">
                  B. Potongan (Deductions)
                </span>
              </div>
              <div className="divide-y divide-slate-100 p-2 grow">
                {payslip.deductions.length > 0 ? (
                  payslip.deductions.map((d) => (
                    <div
                      key={d.id}
                      className="flex items-center justify-between py-2 px-2 text-xs"
                    >
                      <span className="text-slate-700">{d.label}</span>
                      <span className="font-semibold font-mono text-rose-700">
                        -{formatRupiah(d.amount)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-xs text-slate-400 italic">
                    Tidak ada potongan periode ini
                  </div>
                )}
              </div>
              <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs font-bold text-slate-900">
                <span>Total Potongan</span>
                <span className="font-mono text-sm text-rose-700">
                  -{formatRupiah(payslip.totalDeduction)}
                </span>
              </div>
            </div>
          </div>

          {/* Grand Total Box: Take Home Pay */}
          <div className="p-5 rounded-2xl bg-[#102E50] text-white shadow-md border border-[#1a4473] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#F2AF3E]">
                Penghasilan Bersih Diterima (Take Home Pay)
              </span>
              <p className="text-xs text-slate-300 italic">
                Terbilang: &ldquo;{angkaTerbilang(payslip.netAmount)}&rdquo;
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-[#ffddb0]">
                {formatRupiah(payslip.netAmount)}
              </span>
            </div>
          </div>

          {/* Pejabat Penandatangan Resmi (Jika Ada) */}
          {settings?.authorizedSignerName && (
            <div className="flex justify-end pt-2 pb-1 text-right">
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-slate-400 block mb-1">
                  Disahkan Secara Elektronik:
                </span>
                <div className="w-20 h-10 border border-dashed border-slate-300 rounded flex items-center justify-center bg-slate-50/50 mb-1">
                  <span className="text-[9px] font-serif italic text-slate-400">
                    Tervalidasi Digital
                  </span>
                </div>
                <span className="font-bold text-[#102E50] text-xs">
                  {settings.authorizedSignerName}
                </span>
                <span className="text-[10px] text-slate-500">
                  {settings.authorizedSignerTitle || "HR & Finance"}
                </span>
              </div>
            </div>
          )}

          {/* Legal / Institutional Disclaimer */}
          <div className="border-t border-slate-200 pt-4 text-center space-y-1">
            <p className="text-[11px] text-slate-500 font-medium">
              {settings?.disclaimerText ||
                "Dokumen ini diterbitkan secara elektronik oleh Divisi SDM & Keuangan Pusat Studi Pendidikan dan Kebijakan (PSPK). Sah tanpa tanda tangan basah."}
            </p>
            <p className="text-[10px] text-slate-400">
              Informasi slip gaji ini bersifat rahasia dan hanya ditujukan untuk pemilik akun kepegawaian bersangkutan.
            </p>
          </div>
        </div>

        {/* Modal Footer (No-Print) */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0 no-print">
          <p className="text-xs text-slate-500">
            Tekan <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono">ESC</kbd> untuk menutup
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#102E50] text-white hover:bg-[#0c233d] transition-all cursor-pointer shadow-xs active:scale-[0.98]"
            >
              <Printer className="w-3.5 h-3.5 text-[#F2AF3E]" />
              <span>Cetak Slip Gaji</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
