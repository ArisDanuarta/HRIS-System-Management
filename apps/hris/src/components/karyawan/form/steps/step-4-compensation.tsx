"use client";

import React from "react";
import {
  Receipt,
  CreditCard,
  Calculator,
  HeartPulse,
} from "lucide-react";
import { useEmployeeForm } from "../employee-form.context";
import { FormSection } from "../../components/FormSection";
import { DocumentUploadCard } from "../../components/DocumentUploadCard";
import { formatRupiah } from "@pspk/shared";
import { getPtkpExplanation } from "@/lib/tax-explanation";
import { PtkpStatus, TaxMethod } from "@pspk/db";

export function Step4Compensation() {
  const {
    formData,
    updateField,
    docNpwp,
    setDocNpwp,
    docBankBook,
    setDocBankBook,
    docBpjsKes,
    setDocBpjsKes,
    docBpjsTk,
    setDocBpjsTk,
  } = useEmployeeForm();

  // Calculations
  const baseSalaryNum =
    formData.wageType === "HOURLY" ? 0 : Number(formData.baseSalary) || 0;
  const posAllowance = Number(formData.allowancePosition) || 0;
  const transAllowance = Number(formData.allowanceTransport) || 0;
  const commAllowance = Number(formData.allowanceCommunication) || 0;
  const otherAllowance = Number(formData.allowanceOther) || 0;

  const totalAllowances = posAllowance + transAllowance + commAllowance + otherAllowance;
  const totalGrossMonthly = baseSalaryNum + totalAllowances;

  // BPJS estimates
  const estBpjsKes = Math.round(baseSalaryNum * 0.01);
  const estBpjsTk = Math.round(baseSalaryNum * 0.02);
  const totalDeductions = estBpjsKes + estBpjsTk;
  const estThp = Math.max(0, totalGrossMonthly - totalDeductions);

  const ptkpInfo = getPtkpExplanation(formData.ptkpStatus);

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-200">
      {/* 4.1 Struktur Kompensasi & Simulasi THP */}
      <FormSection
        id="seksi-kompensasi"
        title="4.1 Struktur Kompensasi, Tunjangan & Simulasi THP"
        subtitle="Rincian gaji pokok, tunjangan jabatan/operasional, serta estimasi penerimaan bersih bulanan"
        icon={Receipt}
        defaultOpen={true}
      >
        <div className="flex flex-col gap-5">
          {/* Main Compensation Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            {formData.wageType === "HOURLY" ? (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="hourlyRate" className="font-bold text-slate-700">
                  Tarif Upah Per Jam (Rp) <span className="text-[#A8281C]">*</span>
                </label>
                <input
                  id="hourlyRate"
                  type="number"
                  value={formData.hourlyRate}
                  onChange={(e) => updateField("hourlyRate", e.target.value)}
                  placeholder="30000"
                  className="h-10 px-3 rounded-lg border border-slate-200 bg-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50]"
                />
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="baseSalary" className="font-bold text-slate-700">
                  Gaji Pokok Bulanan (Rp) <span className="text-[#A8281C]">*</span>
                </label>
                <input
                  id="baseSalary"
                  type="number"
                  value={formData.baseSalary}
                  onChange={(e) => updateField("baseSalary", e.target.value)}
                  placeholder="8000000"
                  className="h-10 px-3 rounded-lg border border-slate-200 bg-white font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50]"
                />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="allowancePosition" className="font-bold text-slate-700">
                Tunjangan Jabatan (Rp)
              </label>
              <input
                id="allowancePosition"
                type="number"
                value={formData.allowancePosition}
                onChange={(e) => updateField("allowancePosition", e.target.value)}
                placeholder="0"
                className="h-10 px-3 rounded-lg border border-slate-200 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="allowanceTransport" className="font-bold text-slate-700">
                Tunjangan Transport (Rp)
              </label>
              <input
                id="allowanceTransport"
                type="number"
                value={formData.allowanceTransport}
                onChange={(e) => updateField("allowanceTransport", e.target.value)}
                placeholder="0"
                className="h-10 px-3 rounded-lg border border-slate-200 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="allowanceCommunication" className="font-bold text-slate-700">
                Tunjangan Komunikasi (Rp)
              </label>
              <input
                id="allowanceCommunication"
                type="number"
                value={formData.allowanceCommunication}
                onChange={(e) => updateField("allowanceCommunication", e.target.value)}
                placeholder="0"
                className="h-10 px-3 rounded-lg border border-slate-200 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="allowanceOther" className="font-bold text-slate-700">
                Tunjangan Lain-lain (Rp)
              </label>
              <input
                id="allowanceOther"
                type="number"
                value={formData.allowanceOther}
                onChange={(e) => updateField("allowanceOther", e.target.value)}
                placeholder="0"
                className="h-10 px-3 rounded-lg border border-slate-200 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="allowanceOtherNote" className="font-bold text-slate-700">
                Keterangan Tunjangan Lain
              </label>
              <input
                id="allowanceOtherNote"
                type="text"
                value={formData.allowanceOtherNote}
                onChange={(e) => updateField("allowanceOtherNote", e.target.value)}
                placeholder="Misal: Tunjangan Kehadiran Khusus"
                className="h-10 px-3 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50]"
              />
            </div>
          </div>

          {/* Real-time Compensation Summary Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Total Gaji Bruto
              </span>
              <span className="text-base font-bold font-mono text-[#102E50]">
                {formatRupiah(totalGrossMonthly)}
              </span>
              <span className="text-[10px] text-slate-500">
                Gaji Pokok + {totalAllowances > 0 ? formatRupiah(totalAllowances) : "0"} Tunjangan
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">
                Estimasi Potongan BPJS (3%)
              </span>
              <span className="text-base font-bold font-mono text-rose-600">
                - {formatRupiah(totalDeductions)}
              </span>
              <span className="text-[10px] text-slate-500">
                BPJS Kes (1%) + BPJS TK (2%)
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                Estimasi Gaji Bersih (THP)
              </span>
              <span className="text-base font-bold font-mono text-emerald-700">
                {formatRupiah(estThp)}
              </span>
              <span className="text-[10px] text-slate-500">
                Sebelum perhitungan PPh 21 TER
              </span>
            </div>
          </div>
        </div>
      </FormSection>

      {/* 4.2 Identitas Perpajakan (PPh 21) & NPWP */}
      <FormSection
        id="seksi-pajak-pph21"
        title="4.2 Identitas Perpajakan (PPh 21) & Berkas NPWP"
        subtitle="Nomor NPWP, status PTKP PP 58/2023, metode pemotongan pajak, serta unggahan kartu NPWP resmi"
        icon={Calculator}
        defaultOpen={true}
      >
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            {/* Status PTKP */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="ptkpStatus" className="font-bold text-slate-700">
                  Status PTKP
                </label>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  {ptkpInfo?.terCategory || "TER A"}
                </span>
              </div>
              <select
                id="ptkpStatus"
                value={formData.ptkpStatus}
                onChange={(e) => updateField("ptkpStatus", e.target.value as PtkpStatus)}
                className="h-10 px-3 rounded-lg border border-slate-200 bg-white font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50]"
              >
                <option value="TK_0">TK/0 - Tidak Kawin, 0 Tanggungan (TER A)</option>
                <option value="TK_1">TK/1 - Tidak Kawin, 1 Tanggungan (TER A)</option>
                <option value="TK_2">TK/2 - Tidak Kawin, 2 Tanggungan (TER B)</option>
                <option value="TK_3">TK/3 - Tidak Kawin, 3 Tanggungan (TER B)</option>
                <option value="K_0">K/0 - Kawin, 0 Tanggungan (TER A)</option>
                <option value="K_1">K/1 - Kawin, 1 Tanggungan (TER B)</option>
                <option value="K_2">K/2 - Kawin, 2 Tanggungan (TER B)</option>
                <option value="K_3">K/3 - Kawin, 3 Tanggungan (TER C)</option>
              </select>
            </div>

            {/* Metode Pajak */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="taxMethod" className="font-bold text-slate-700">
                Metode Perhitungan Pajak
              </label>
              <select
                id="taxMethod"
                value={formData.taxMethod}
                onChange={(e) => updateField("taxMethod", e.target.value as TaxMethod)}
                className="h-10 px-3 rounded-lg border border-slate-200 bg-white font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50]"
              >
                <option value="GROSS">GROSS (Pajak Ditanggung Pegawai)</option>
                <option value="GROSS_UP">GROSS UP (Tunjangan Pajak Lembaga)</option>
                <option value="NET">NETT (Pajak Ditanggung Lembaga)</option>
              </select>
            </div>

            {/* NPWP */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="npwp" className="font-bold text-slate-700">
                Nomor Pokok Wajib Pajak (NPWP)
              </label>
              <input
                id="npwp"
                type="text"
                value={formData.npwp}
                onChange={(e) => updateField("npwp", e.target.value)}
                placeholder="16 digit format baru (atau NIK)"
                className="h-10 px-3 rounded-lg border border-slate-200 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50]"
              />
            </div>
          </div>

          {/* Upload Kartu NPWP */}
          <div className="pt-2 border-t border-slate-100">
            <DocumentUploadCard
              label="Kartu NPWP Resmi"
              description="Salinan kartu NPWP fisik atau bukti cetak resmi DJP Online (Format PDF / Gambar, maks. 5MB)"
              value={docNpwp}
              onChange={setDocNpwp}
            />
          </div>
        </div>
      </FormSection>

      {/* 4.3 Kepesertaan Jaminan Sosial (BPJS) */}
      <FormSection
        id="seksi-jaminan-sosial"
        title="4.3 Kepesertaan Jaminan Sosial (BPJS)"
        subtitle="Nomor kepesertaan BPJS Kesehatan dan BPJS Ketenagakerjaan beserta salinan kartu resmi"
        icon={HeartPulse}
        defaultOpen={true}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
          {/* BPJS Kesehatan */}
          <div className="flex flex-col gap-3 p-4 rounded-xl bg-slate-50/70 border border-slate-200">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="bpjsKesehatanNo" className="font-bold text-slate-700">
                Nomor Kartu BPJS Kesehatan
              </label>
              <input
                id="bpjsKesehatanNo"
                type="text"
                value={formData.bpjsKesehatanNo}
                onChange={(e) => updateField("bpjsKesehatanNo", e.target.value)}
                placeholder="13 digit nomor kartu BPJS Kesehatan"
                className="h-10 px-3 rounded-lg border border-slate-200 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50]"
              />
            </div>
            <DocumentUploadCard
              label="Kartu BPJS Kesehatan"
              description="Kartu fisik atau tangkapan layar kartu digital dari aplikasi JKN Mobile"
              value={docBpjsKes}
              onChange={setDocBpjsKes}
            />
          </div>

          {/* BPJS Ketenagakerjaan */}
          <div className="flex flex-col gap-3 p-4 rounded-xl bg-slate-50/70 border border-slate-200">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="bpjsKetenagakerjaanNo" className="font-bold text-slate-700">
                Nomor BPJS Ketenagakerjaan (KPJ)
              </label>
              <input
                id="bpjsKetenagakerjaanNo"
                type="text"
                value={formData.bpjsKetenagakerjaanNo}
                onChange={(e) => updateField("bpjsKetenagakerjaanNo", e.target.value)}
                placeholder="11 digit nomor kartu peserta (KPJ)"
                className="h-10 px-3 rounded-lg border border-slate-200 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50]"
              />
            </div>
            <DocumentUploadCard
              label="Kartu BPJS Ketenagakerjaan (KPJ)"
              description="Kartu BPJS Ketenagakerjaan fisik atau kartu digital dari aplikasi JMO"
              value={docBpjsTk}
              onChange={setDocBpjsTk}
            />
          </div>
        </div>
      </FormSection>

      {/* 4.4 Rekening Bank Penyaluran Gaji (Payroll) */}
      <FormSection
        id="seksi-rekening-bank"
        title="4.4 Rekening Bank Penyaluran Gaji (Payroll)"
        subtitle="Rekening bank terdaftar untuk transfer penggajian bulanan dan unggahan buku tabungan"
        icon={CreditCard}
        defaultOpen={true}
      >
        <div className="flex flex-col gap-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="bankName" className="font-bold text-slate-700">
                Nama Bank Payroll
              </label>
              <input
                id="bankName"
                type="text"
                value={formData.bankName}
                onChange={(e) => updateField("bankName", e.target.value)}
                placeholder="Contoh: Bank Mandiri (Utama PSPK)"
                className="h-10 px-3 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="bankAccount" className="font-bold text-slate-700">
                Nomor Rekening Bank
              </label>
              <input
                id="bankAccount"
                type="text"
                value={formData.bankAccount}
                onChange={(e) => updateField("bankAccount", e.target.value)}
                placeholder="Nomor rekening tanpa spasi/tanda hubung"
                className="h-10 px-3 rounded-lg border border-slate-200 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="bankAccountName" className="font-bold text-slate-700">
                Nama Pemilik Rekening (Sesuai Buku Tabungan)
              </label>
              <input
                id="bankAccountName"
                type="text"
                value={formData.bankAccountName}
                onChange={(e) => updateField("bankAccountName", e.target.value)}
                placeholder="Nama pemilik buku tabungan"
                className="h-10 px-3 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50]"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <DocumentUploadCard
              label="Buku Tabungan / Informasi Rekening Payroll"
              description="Halaman depan buku tabungan atau screenshot m-banking yang memuat nama bank, nomor rekening, dan nama pemilik rekening"
              value={docBankBook}
              onChange={setDocBankBook}
            />
          </div>
        </div>
      </FormSection>
    </div>
  );
}
