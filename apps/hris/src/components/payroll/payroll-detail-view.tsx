"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { formatRupiah, formatDate } from "@pspk/shared";
import {
  Calendar,
  Users,
  CreditCard,
  Download,
  Play,
  RotateCcw,
  CheckCircle2,
  TrendingUp,
  Lock,
  Search,
  Building2,
  Briefcase,
  AlertCircle,
  Eye,
  RefreshCw,
  FileSpreadsheet,
  ChevronLeft,
} from "lucide-react";
import {
  calculatePayrollAction,
  approvePayrollAction,
  publishPayrollAction,
  lockPayrollAction,
  exportPayrollBankCsvAction,
} from "@/server/actions/payroll.actions";
import { PayslipDetailModal, PayslipDetailData } from "./payslip-detail-modal";

interface PeriodDetail {
  id: string;
  year: number;
  month: number;
  kind: "REGULAR" | "THR";
  status: "DRAFT" | "CALCULATED" | "APPROVED" | "PUBLISHED" | "LOCKED";
  cutoffDate: Date | string | null;
  lockedAt: Date | string | null;
  totalEmployees: number;
  totalGross: number;
  totalDeduction: number;
  totalNet: number;
  payslips: PayslipDetailData[];
}

interface PayrollDetailViewProps {
  period: PeriodDetail;
}

export function PayrollDetailView({ period }: PayrollDetailViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDeptFilter, setSelectedDeptFilter] = useState("ALL");
  const [selectedPayslip, setSelectedPayslip] = useState<PayslipDetailData | null>(null);

  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const monthNames = [
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
  const periodTitle = `${period.kind === "THR" ? "THR" : "Gaji Reguler"} — ${monthNames[period.month - 1]} ${period.year}`;

  // Filter daftar departemen unik
  const departments = Array.from(
    new Set(
      period.payslips
        .map((p) => p.employee.currentDepartment?.name)
        .filter(Boolean) as string[],
    ),
  );

  // Filter slip
  const filteredPayslips = period.payslips.filter((p) => {
    const q = searchTerm.toLowerCase().trim();
    const matchSearch =
      q === "" ||
      p.employee.fullName.toLowerCase().includes(q) ||
      p.employee.employeeNo.toLowerCase().includes(q);

    const matchDept =
      selectedDeptFilter === "ALL" ||
      p.employee.currentDepartment?.name === selectedDeptFilter;

    return matchSearch && matchDept;
  });

  // Action Handlers
  const handleCalculate = () => {
    setActionError(null);
    setActionSuccess(null);
    startTransition(async () => {
      const res = await calculatePayrollAction({ periodId: period.id });
      if (!res.ok) setActionError(res.error);
      else setActionSuccess(res.message);
    });
  };

  const handleApprove = () => {
    setActionError(null);
    setActionSuccess(null);
    startTransition(async () => {
      const res = await approvePayrollAction({ periodId: period.id });
      if (!res.ok) setActionError(res.error);
      else setActionSuccess(res.message);
    });
  };

  const handlePublish = () => {
    setActionError(null);
    setActionSuccess(null);
    startTransition(async () => {
      const res = await publishPayrollAction({ periodId: period.id });
      if (!res.ok) setActionError(res.error);
      else setActionSuccess(res.message);
    });
  };

  const handleLock = () => {
    setActionError(null);
    setActionSuccess(null);
    startTransition(async () => {
      const res = await lockPayrollAction({ periodId: period.id });
      if (!res.ok) setActionError(res.error);
      else setActionSuccess(res.message);
    });
  };

  const handleExportCsv = async () => {
    setActionError(null);
    startTransition(async () => {
      const res = await exportPayrollBankCsvAction({ periodId: period.id });
      if (!res.ok) {
        setActionError(res.error);
        return;
      }

      // Download file di browser
      const blob = new Blob([res.csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", res.filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  // Stepper tahap siklus
  const steps = [
    { key: "DRAFT", label: "1. Draf Awal" },
    { key: "CALCULATED", label: "2. Kalkulasi" },
    { key: "APPROVED", label: "3. Disetujui HR" },
    { key: "PUBLISHED", label: "4. Dipublikasi" },
    { key: "LOCKED", label: "5. Terkunci" },
  ];

  const stepIndex = steps.findIndex((s) => s.key === period.status);

  return (
    <div className="space-y-6">
      {/* Tombol Kembali & Header Periode */}
      <div>
        <Link
          href="/payroll"
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-[#102E50] mb-2 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Kembali ke Daftar Periode</span>
        </Link>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-slate-900 font-serif leading-tight">
                {periodTitle}
              </h1>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-mono">
                {period.kind}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
              <span>Cut-Off: {period.cutoffDate ? formatDate(period.cutoffDate) : "Akhir Bulan"}</span>
              <span>•</span>
              <span>Total Diproses: {period.totalEmployees} Pegawai</span>
            </p>
          </div>

          {/* Tombol Aksi Siklus */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Tombol Ekspor Rekap Bank */}
            {period.status !== "DRAFT" && (
              <button
                type="button"
                disabled={isPending}
                onClick={handleExportCsv}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition-colors"
                title="Unduh rekap data transfer perbankan dalam format CSV"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Ekspor Rekap Bank (CSV)</span>
              </button>
            )}

            {/* Aksi 1: Kalkulasi Massal (Saat DRAFT atau CALCULATED) */}
            {(period.status === "DRAFT" || period.status === "CALCULATED") && (
              <button
                type="button"
                disabled={isPending}
                onClick={handleCalculate}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#102E50] hover:bg-[#1a4473] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors disabled:opacity-50"
              >
                {isPending ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : period.status === "DRAFT" ? (
                  <Play className="w-3.5 h-3.5 text-[#F2AF3E]" />
                ) : (
                  <RotateCcw className="w-3.5 h-3.5 text-[#F2AF3E]" />
                )}
                <span>{period.status === "DRAFT" ? "Kalkulasi Payroll Massal" : "Hitung Ulang"}</span>
              </button>
            )}

            {/* Aksi 2: Setujui Payroll (Saat CALCULATED) */}
            {period.status === "CALCULATED" && (
              <button
                type="button"
                disabled={isPending}
                onClick={handleApprove}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Setujui Payroll (Approve)</span>
              </button>
            )}

            {/* Aksi 3: Publikasikan Slip (Saat APPROVED) */}
            {period.status === "APPROVED" && (
              <button
                type="button"
                disabled={isPending}
                onClick={handlePublish}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors disabled:opacity-50"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Publikasikan Slip Gaji (Publish)</span>
              </button>
            )}

            {/* Aksi 4: Kunci Periode Permanen (Saat PUBLISHED) */}
            {period.status === "PUBLISHED" && (
              <button
                type="button"
                disabled={isPending}
                onClick={handleLock}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors disabled:opacity-50"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Kunci Periode Permanen (Lock)</span>
              </button>
            )}

            {period.status === "LOCKED" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-xs font-semibold">
                <Lock className="w-3.5 h-3.5" />
                Terkunci Permanen
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Pesan Feedback */}
      {actionError && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
          <span>{actionError}</span>
        </div>
      )}

      {actionSuccess && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Stepper Status Alur Siklus */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between">
          {steps.map((step, idx) => {
            const isCompleted = idx < stepIndex;
            const isCurrent = idx === stepIndex;

            return (
              <div key={step.key} className="flex-1 flex items-center">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isCompleted
                        ? "bg-emerald-600 text-white"
                        : isCurrent
                        ? "bg-[#102E50] text-[#F2AF3E] ring-4 ring-[#102E50]/15"
                        : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {isCompleted ? "✓" : idx + 1}
                  </div>
                  <span
                    className={`text-[11px] font-semibold mt-1.5 ${
                      isCurrent
                        ? "text-[#102E50] font-bold"
                        : isCompleted
                        ? "text-emerald-700"
                        : "text-slate-400"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div
                    className={`h-0.5 w-full mx-2 ${
                      idx < stepIndex ? "bg-emerald-600" : "bg-slate-200"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Metrik Rekapitulasi Periode */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Users className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-medium">Pegawai Diproses</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{period.totalEmployees} Orang</div>
          <div className="text-[11px] text-slate-400 mt-1">Status kepegawaian aktif</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 text-emerald-700 mb-1">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-medium">Total Bruto (Gross)</span>
          </div>
          <div className="text-xl font-bold text-emerald-900 font-mono">
            {formatRupiah(period.totalGross)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Gaji pokok + tunjangan</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 text-rose-700 mb-1">
            <CreditCard className="w-4 h-4 text-rose-600" />
            <span className="text-xs font-medium">Total Potongan</span>
          </div>
          <div className="text-xl font-bold text-rose-900 font-mono">
            {formatRupiah(period.totalDeduction)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">BPJS & estimasi PPh 21</div>
        </div>

        <div className="bg-[#102E50] text-white p-4 rounded-xl shadow-xs">
          <div className="flex items-center gap-2 text-[#adc8f2] mb-1">
            <CreditCard className="w-4 h-4 text-[#F2AF3E]" />
            <span className="text-xs font-semibold">Total Netto Dibayarkan</span>
          </div>
          <div className="text-xl font-bold text-[#F2AF3E] font-mono">
            {formatRupiah(period.totalNet)}
          </div>
          <div className="text-[11px] text-slate-300 mt-1">Total beban transfer lembaga</div>
        </div>
      </div>

      {/* Tabel Daftar Slip Pegawai */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama pegawai atau NIP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50]"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-500 whitespace-nowrap">Divisi:</label>
            <select
              value={selectedDeptFilter}
              onChange={(e) => setSelectedDeptFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-800 font-medium focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50]"
            >
              <option value="ALL">Semua Divisi</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Pegawai</th>
                  <th className="py-3 px-4">Divisi & Jabatan</th>
                  <th className="py-3 px-4 text-right">Gaji Bruto</th>
                  <th className="py-3 px-4 text-right">Potongan</th>
                  <th className="py-3 px-4 text-right">Gaji Bersih (Netto)</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayslips.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      {period.status === "DRAFT" ? (
                        <div>
                          <Play className="w-8 h-8 mx-auto mb-2 text-slate-300 stroke-1" />
                          <p className="font-semibold text-slate-600">
                            Periode masih dalam status Draf Awal.
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            Klik tombol &quot;Kalkulasi Payroll Massal&quot; di atas untuk
                            menghitung slip seluruh pegawai aktif.
                          </p>
                        </div>
                      ) : (
                        "Tidak ada slip gaji yang sesuai dengan pencarian."
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredPayslips.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition-colors group">
                      {/* Pegawai */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 text-xs">
                          {p.employee.fullName}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500">
                          {p.employee.employeeNo}
                        </div>
                      </td>

                      {/* Divisi & Jabatan */}
                      <td className="py-3 px-4">
                        <div className="text-xs text-slate-700">
                          {p.employee.currentDepartment?.name || "-"}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {p.employee.currentPosition?.title || "-"}
                        </div>
                      </td>

                      {/* Gaji Bruto */}
                      <td className="py-3 px-4 text-right font-mono text-xs text-emerald-800 font-medium">
                        {formatRupiah(p.grossAmount)}
                      </td>

                      {/* Potongan */}
                      <td className="py-3 px-4 text-right font-mono text-xs text-rose-700 font-medium">
                        -{formatRupiah(p.totalDeduction)}
                      </td>

                      {/* Gaji Bersih */}
                      <td className="py-3 px-4 text-right font-mono text-xs font-bold text-slate-900">
                        {formatRupiah(p.netAmount)}
                      </td>

                      {/* Aksi */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedPayslip(p)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-slate-200 text-slate-700 hover:text-[#102E50] hover:bg-slate-50 rounded-lg text-xs font-medium transition-colors shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          <span>Rincian Slip</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Detail Slip */}
      <PayslipDetailModal
        payslip={selectedPayslip}
        periodTitle={periodTitle}
        onClose={() => setSelectedPayslip(null)}
      />
    </div>
  );
}
