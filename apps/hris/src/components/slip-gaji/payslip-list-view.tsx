"use client";

import React, { useState, useTransition } from "react";
import {
  FileText,
  TrendingUp,
  Receipt,
  Eye,
  Filter,
  RefreshCw,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { formatRupiah, formatDate } from "@pspk/shared";
import {
  MyPayslipsSummary,
  MyPayslipDetail,
} from "@/server/queries/payslip.queries";
import { getMyPayslipDetailAction } from "@/server/actions/payslip.actions";
import { PayslipPrintableModal } from "./payslip-printable-modal";

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

interface PayslipListViewProps {
  summary: MyPayslipsSummary;
  employeeName: string;
}

export function PayslipListView({ summary, employeeName }: PayslipListViewProps) {
  const [selectedYear, setSelectedYear] = useState<string>("ALL");
  const [selectedKind, setSelectedKind] = useState<string>("ALL");
  const [activeModalPayslip, setActiveModalPayslip] = useState<MyPayslipDetail | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingPayslipId, setLoadingPayslipId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Filter client-side untuk respon instan tanpa lag
  const filteredPayslips = summary.payslips.filter((p) => {
    if (selectedYear !== "ALL" && p.year !== Number(selectedYear)) {
      return false;
    }
    if (selectedKind !== "ALL" && p.kind !== selectedKind) {
      return false;
    }
    return true;
  });

  const handleOpenPayslip = (payslipId: string) => {
    setLoadingPayslipId(payslipId);
    setErrorMessage(null);

    startTransition(async () => {
      const res = await getMyPayslipDetailAction(payslipId);
      setLoadingPayslipId(null);

      if (res.ok && res.data) {
        setActiveModalPayslip(res.data);
        setIsModalOpen(true);
      } else {
        setErrorMessage(res.error || "Gagal memuat rincian slip gaji.");
      }
    });
  };

  const currentYear = new Date().getFullYear();

  return (
    <div className="flex flex-col gap-6 max-w-[1440px] mx-auto pb-16 w-full animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#dee9fc]">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#74777f] mb-1">
            <span>Portal Karyawan Mandiri</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#f2af3e]" />
            <span>Dokumen Finansial</span>
          </div>
          <h1 className="text-2xl sm:text-3xl text-[#102E50] font-heading font-bold tracking-tight">
            Slip Gaji Saya
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Arsip resmi bukti pembayaran gaji atas nama <strong className="text-slate-700">{employeeName}</strong>, tunjangan kerja, dan potongan yang telah diterbitkan oleh Divisi HR & Keuangan.
          </p>
        </div>
      </div>

      {/* Error Alert (jika ada kegagalan) */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-xs font-bold hover:underline"
          >
            Tutup
          </button>
        </div>
      )}

      {/* 3 Hero Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Metric 1: Slip Gaji Terakhir */}
        <div className="bg-white rounded-2xl border border-[#dee9fc] p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Slip Gaji Terakhir
              </span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#102E50] flex items-center justify-center border border-blue-100">
                <Receipt className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              {summary.latestPayslip ? (
                <>
                  <span className="text-2xl sm:text-3xl font-extrabold text-[#102E50] font-mono block leading-none">
                    {formatRupiah(summary.latestPayslip.netAmount)}
                  </span>
                  <span className="text-xs text-slate-600 font-medium mt-1.5 block">
                    Periode {MONTH_NAMES[summary.latestPayslip.month]} {summary.latestPayslip.year} ({summary.latestPayslip.kind === "THR" ? "THR" : "Reguler"})
                  </span>
                </>
              ) : (
                <>
                  <span className="text-lg font-bold text-slate-400 block">
                    Belum Ada Slip
                  </span>
                  <span className="text-xs text-slate-400 mt-1 block">
                    Menunggu publikasi dari tim keuangan
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              {summary.latestPayslip?.publishedAt
                ? `Cair: ${formatDate(summary.latestPayslip.publishedAt)}`
                : "Status: Menunggu rilis"}
            </span>
            {summary.latestPayslip && (
              <button
                type="button"
                onClick={() => handleOpenPayslip(summary.latestPayslip!.id)}
                className="text-xs font-semibold text-[#102E50] hover:underline cursor-pointer"
              >
                Lihat Rincian →
              </button>
            )}
          </div>
        </div>

        {/* Metric 2: Akumulasi Bersih YTD */}
        <div className="bg-white rounded-2xl border border-[#dee9fc] p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Bersih {currentYear} (YTD)
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#102E50] font-mono block leading-none">
                {formatRupiah(summary.ytdTotalNet)}
              </span>
              <span className="text-xs text-slate-600 font-medium mt-1.5 block">
                Akumulasi seluruh slip terbit tahun {currentYear}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
            Penghasilan bersih setelah seluruh potongan pajak & BPJS
          </div>
        </div>

        {/* Metric 3: Total Arsip Slip */}
        <div className="bg-white rounded-2xl border border-[#dee9fc] p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Dokumen Tersedia
              </span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-100">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#102E50] font-mono block leading-none">
                {summary.totalCount} <span className="text-base font-normal font-sans text-slate-500">Bulan</span>
              </span>
              <span className="text-xs text-slate-600 font-medium mt-1.5 block">
                Arsip slip siap cetak / unduh PDF
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
            Dokumen resmi berformat kop surat PSPK
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Filter Riwayat
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Filter Tahun */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Tahun:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#102E50] cursor-pointer"
            >
              <option value="ALL">Semua Tahun</option>
              {summary.availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Jenis */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Jenis:</span>
            <select
              value={selectedKind}
              onChange={(e) => setSelectedKind(e.target.value)}
              className="text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#102E50] cursor-pointer"
            >
              <option value="ALL">Semua Jenis</option>
              <option value="REGULAR">Gaji Bulanan Reguler</option>
              <option value="THR">Tunjangan Hari Raya (THR)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table: Riwayat Slip Gaji */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#102E50] font-serif">
            Daftar Arsip Slip Gaji
          </h2>
          <span className="text-xs text-slate-500">
            Menampilkan {filteredPayslips.length} dari {summary.totalCount} dokumen
          </span>
        </div>

        {filteredPayslips.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Periode</th>
                  <th className="py-3.5 px-4">Jenis</th>
                  <th className="py-3.5 px-4">Tanggal Terbit</th>
                  <th className="py-3.5 px-4 text-right">Penerimaan Bruto</th>
                  <th className="py-3.5 px-4 text-right">Total Potongan</th>
                  <th className="py-3.5 px-4 text-right">Gaji Bersih (THP)</th>
                  <th className="py-3.5 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayslips.map((p) => {
                  const monthName = MONTH_NAMES[p.month] || `Bulan ${p.month}`;
                  const isLoading = loadingPayslipId === p.id;

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      {/* Periode */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#102E50]">
                          {monthName} {p.year}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          ID: #{p.id.slice(0, 8).toUpperCase()}
                        </div>
                      </td>

                      {/* Jenis Slip */}
                      <td className="py-3.5 px-4">
                        {p.kind === "THR" ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            THR
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            Gaji Reguler
                          </span>
                        )}
                      </td>

                      {/* Tanggal Terbit */}
                      <td className="py-3.5 px-4 text-slate-600 text-xs">
                        {p.publishedAt ? formatDate(p.publishedAt) : "-"}
                      </td>

                      {/* Bruto */}
                      <td className="py-3.5 px-4 text-right font-mono text-slate-700">
                        {formatRupiah(p.grossAmount)}
                      </td>

                      {/* Potongan */}
                      <td className="py-3.5 px-4 text-right font-mono text-rose-600">
                        -{formatRupiah(p.totalDeduction)}
                      </td>

                      {/* Gaji Bersih */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-[#102E50] text-sm sm:text-base">
                        {formatRupiah(p.netAmount)}
                      </td>

                      {/* Aksi */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            disabled={isLoading || isPending}
                            onClick={() => handleOpenPayslip(p.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#102E50] text-white hover:bg-[#0c233d] transition-all text-xs font-semibold shadow-2xs cursor-pointer active:scale-[0.98] disabled:opacity-50"
                          >
                            {isLoading ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Eye className="w-3.5 h-3.5 text-[#ffddb0]" />
                            )}
                            <span>Lihat Slip</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* Empty State */
          <div className="py-16 px-6 text-center flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
              <FileText className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-slate-700">
              Belum Ada Slip Gaji Diterbitkan
            </h3>
            <p className="text-xs text-slate-500 max-w-md mt-1 leading-relaxed">
              {selectedYear !== "ALL" || selectedKind !== "ALL"
                ? "Tidak ada slip gaji yang cocok dengan filter yang Anda pilih. Silakan atur kembali filter tahun atau jenis slip."
                : "Dokumen slip gaji Anda akan otomatis muncul di sini setelah resmi dihitung dan dipublikasikan oleh Divisi HR & Keuangan PSPK."}
            </p>
          </div>
        )}
      </div>

      {/* Information Callout */}
      <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200/80 flex items-start gap-3 text-xs text-blue-900 leading-relaxed">
        <HelpCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Pertanyaan seputar komponen slip gaji?</span>{" "}
          Jika terdapat ketidaksesuaian nominal tunjangan, potongan absensi, atau kendala transfer rekening bank, silakan hubungi Tim Administrasi HR & Keuangan PSPK untuk verifikasi lebih lanjut.
        </div>
      </div>

      {/* Printable Modal Dialog */}
      <PayslipPrintableModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        payslip={activeModalPayslip}
      />
    </div>
  );
}
