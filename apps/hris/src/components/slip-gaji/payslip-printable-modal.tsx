"use client";

import React, { useEffect, useSyncExternalStore, useCallback } from "react";
import { createPortal } from "react-dom";
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

const emptySubscribe = () => () => {};

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
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  const handlePrint = useCallback(() => {
    const sheetEl = document.getElementById("printable-payslip-sheet");
    if (!sheetEl) {
      window.print();
      return;
    }

    // Hapus iframe cetak sebelumnya jika ada
    const existingIframe = document.getElementById("payslip-print-iframe");
    if (existingIframe) {
      existingIframe.remove();
    }

    const iframe = document.createElement("iframe");
    iframe.id = "payslip-print-iframe";
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "none";
    iframe.style.visibility = "hidden";
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow?.document;
    if (!iframeDoc) {
      window.print();
      return;
    }

    // Salin seluruh stylesheet dari dokumen utama agar Tailwind & brand font identik
    const styles = Array.from(
      document.querySelectorAll("link[rel='stylesheet'], style"),
    )
      .map((el) => el.outerHTML)
      .join("\n");

    const employeeName = payslip?.employee.fullName || "Karyawan";

    iframeDoc.open();
    iframeDoc.write(`
      <!DOCTYPE html>
      <html lang="id">
        <head>
          <meta charset="utf-8" />
          <title>Slip Gaji — ${employeeName}</title>
          ${styles}
          <style>
            @page {
              size: A4 portrait;
              margin: 8mm 10mm;
            }
            *, *::before, *::after {
              box-sizing: border-box;
            }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              color: #121c2a !important;
              width: 100% !important;
              height: auto !important;
              overflow: visible !important;
              font-family: var(--font-rubik), ui-sans-serif, system-ui, sans-serif !important;
            }
            #print-container {
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
            }
            #printable-payslip-sheet {
              display: block !important;
              position: static !important;
              width: 100% !important;
              max-width: 100% !important;
              max-height: none !important;
              height: auto !important;
              overflow: visible !important;
              padding: 0 !important;
              margin: 0 !important;
              border: none !important;
              box-shadow: none !important;
              background: #ffffff !important;
              color: #121c2a !important;
              font-size: 11px !important;
              line-height: 1.35 !important;
              print-color-adjust: exact !important;
              -webkit-print-color-adjust: exact !important;
            }
            #printable-payslip-sheet > * + * {
              margin-top: 8px !important;
              margin-bottom: 0 !important;
            }
            #printable-payslip-sheet * {
              print-color-adjust: exact !important;
              -webkit-print-color-adjust: exact !important;
            }
            .no-print {
              display: none !important;
            }
          </style>
        </head>
        <body>
          <div id="print-container">
            ${sheetEl.outerHTML}
          </div>
        </body>
      </html>
    `);
    iframeDoc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    }, 200);
  }, [payslip]);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("payslip-modal-open");
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "p") {
          e.preventDefault();
          handlePrint();
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.classList.remove("payslip-modal-open");
        window.removeEventListener("keydown", handleKeyDown);
      };
    } else {
      document.body.classList.remove("payslip-modal-open");
    }
  }, [isOpen, onClose, handlePrint]);

  return createPortal(
    <div id="payslip-modal-portal">
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
        {/* Backdrop */}
        <div
          className="fixed inset-0 no-print"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Modal Dialog Card */}
        <div className="relative bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 flex flex-col overflow-hidden z-10 animate-in zoom-in-95 duration-200 my-8 modal-card">
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
                <div className="relative min-w-[100px] min-h-[48px] flex items-center justify-center mb-1">
                  {/* Stempel Resmi Lembaga jika ada */}
                  {settings.stampUrl && (
                    <div className="absolute -left-4 -top-2 opacity-85 pointer-events-none select-none z-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={settings.stampUrl}
                        alt="Stempel Lembaga"
                        className="w-14 h-14 object-contain drop-shadow-sm"
                      />
                    </div>
                  )}
                  {/* Tanda Tangan jika ada */}
                  {settings.signatureUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={settings.signatureUrl}
                      alt="Tanda Tangan"
                      className="w-24 h-12 object-contain relative z-10"
                    />
                  ) : !settings.stampUrl ? (
                    <div className="w-20 h-10 border border-dashed border-slate-300 rounded flex items-center justify-center bg-slate-50/50">
                      <span className="text-[9px] font-serif italic text-slate-400">
                        Tervalidasi Digital
                      </span>
                    </div>
                  ) : (
                    <div className="h-10 w-20" />
                  )}
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
  </div>,
  document.body
);
}
