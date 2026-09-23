"use client";

import React from "react";
import { formatRupiah, decryptField } from "@pspk/shared";
import {
  FileText,
  Building2,
  Briefcase,
  CreditCard,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

export interface PayslipDetailData {
  id: string;
  grossAmount: number;
  totalDeduction: number;
  netAmount: number;
  status: string;
  employee: {
    id: string;
    employeeNo: string;
    fullName: string;
    bankName: string | null;
    bankAccountEnc: string | null;
    currentDepartment: { id: string; name: string } | null;
    currentPosition: { id: string; title: string } | null;
  };
  lines: {
    id: string;
    label: string;
    type: "EARNING" | "DEDUCTION";
    amount: number;
  }[];
}

interface PayslipDetailModalProps {
  payslip: PayslipDetailData | null;
  periodTitle: string;
  onClose: () => void;
}

export function PayslipDetailModal({ payslip, periodTitle, onClose }: PayslipDetailModalProps) {
  if (!payslip) return null;

  const earnings = payslip.lines.filter((l) => l.type === "EARNING");
  const deductions = payslip.lines.filter((l) => l.type === "DEDUCTION");

  let decryptedBankNo = "-";
  if (payslip.employee.bankAccountEnc) {
    try {
      decryptedBankNo = decryptField(payslip.employee.bankAccountEnc);
    } catch {
      decryptedBankNo = "[Terenkripsi]";
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-150">
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#102E50] text-[#F2AF3E] flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base leading-tight">
                Rincian Slip Gaji Karyawan
              </h3>
              <p className="text-xs text-slate-500">{periodTitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            ✕
          </button>
        </div>

        {/* Profil Karyawan & Rekening */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 mb-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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

            <div className="bg-white px-3 py-2 rounded-lg border border-slate-200 shrink-0 text-right">
              <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">
                Rekening Pembayaran
              </span>
              <div className="text-xs font-semibold text-slate-800 flex items-center justify-end gap-1.5 mt-0.5">
                <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                <span>{payslip.employee.bankName || "BCA"}</span>
                <span className="font-mono text-slate-600 font-normal">({decryptedBankNo})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabel Komponen Gaji: Pendapatan & Potongan */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Kolom Pendapatan (Earnings) */}
          <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
              <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5 uppercase tracking-wider">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                Pendapatan (Earnings)
              </span>
              <span className="text-xs font-bold text-emerald-700 font-mono">
                {formatRupiah(payslip.grossAmount)}
              </span>
            </div>
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {earnings.map((l) => (
                <div key={l.id} className="flex items-center justify-between text-xs py-1 border-b border-slate-50">
                  <span className="text-slate-700">{l.label}</span>
                  <span className="font-mono font-medium text-slate-900">{formatRupiah(l.amount)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Kolom Potongan (Deductions) */}
          <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
              <span className="text-xs font-bold text-rose-800 flex items-center gap-1.5 uppercase tracking-wider">
                <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
                Potongan (Deductions)
              </span>
              <span className="text-xs font-bold text-rose-700 font-mono">
                {formatRupiah(payslip.totalDeduction)}
              </span>
            </div>
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {deductions.length === 0 ? (
                <div className="text-xs text-slate-400 py-2 italic text-center">
                  Tidak ada potongan.
                </div>
              ) : (
                deductions.map((l) => (
                  <div key={l.id} className="flex items-center justify-between text-xs py-1 border-b border-slate-50">
                    <span className="text-slate-700">{l.label}</span>
                    <span className="font-mono font-medium text-rose-700">-{formatRupiah(l.amount)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Ringkasan Take-Home Pay */}
        <div className="bg-slate-900 text-white p-4 rounded-xl flex items-center justify-between shadow-md mb-6">
          <div>
            <span className="text-[11px] text-slate-400 block uppercase tracking-wider font-semibold">
              Gaji Bersih Diterima (Take-Home Pay)
            </span>
            <span className="text-xs text-slate-300">
              Total bruto dikurangi seluruh potongan resmi
            </span>
          </div>
          <div className="text-right">
            <span className="text-xl font-bold font-mono text-[#F2AF3E]">
              {formatRupiah(payslip.netAmount)}
            </span>
          </div>
        </div>

        {/* Tombol Tutup */}
        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-white bg-[#102E50] hover:bg-[#1a4473] rounded-lg transition-colors shadow-xs"
          >
            Tutup Rincian
          </button>
        </div>
      </div>
    </div>
  );
}
