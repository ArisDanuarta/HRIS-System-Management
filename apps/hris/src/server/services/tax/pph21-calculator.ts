import { PtkpStatus } from "@pspk/db";
import {
  BIAYA_JABATAN_RATE,
  MAX_BIAYA_JABATAN_ANNUAL,
  MAX_BIAYA_JABATAN_MONTHLY,
  PASAL_17_BRACKETS,
  PTKP_ANNUAL_AMOUNT,
  PTKP_TO_TER_CATEGORY,
  TER_A_TABLE,
  TER_B_TABLE,
  TER_C_TABLE,
  TerBracket,
  TerCategory,
} from "./ter-tables";

export interface MonthlyPph21Result {
  pph21: number;
  terCategory: TerCategory;
  terRate: number;
  taxableGross: number;
}

export interface CalculateAnnualPph21Params {
  annualTaxableGross: number;
  ptkp: PtkpStatus;
  annualPensionDeductions?: number; // Iuran JHT (2%) + JP (1%) yang ditanggung karyawan
  monthsWorked?: number; // Jumlah bulan kerja dalam tahun berjalan (default: 12)
  previousPph21Paid?: number; // Akumulasi PPh 21 yang telah dipotong masa Jan - Nov
}

export interface AnnualPph21Result {
  annualTaxableGross: number;
  annualBiayaJabatan: number;
  annualPensionDeductions: number;
  annualNetIncome: number;
  ptkpAmount: number;
  pkp: number;
  annualPph21Payable: number;
  previousPph21Paid: number;
  pph21December: number; // Nilai PPh 21 masa Desember (dapat positif, 0, atau pengembalian lebih bayar)
}

/**
 * Mengambil Kategori TER Bulanan (TER_A, TER_B, atau TER_C) berdasarkan Status PTKP
 */
export function getPtkpCategory(ptkp: PtkpStatus): TerCategory {
  return PTKP_TO_TER_CATEGORY[ptkp] ?? "TER_A";
}

/**
 * Mengambil tabel matriks TER berdasarkan Kategori
 */
export function getTerTable(category: TerCategory): readonly TerBracket[] {
  switch (category) {
    case "TER_A":
      return TER_A_TABLE;
    case "TER_B":
      return TER_B_TABLE;
    case "TER_C":
      return TER_C_TABLE;
    default:
      return TER_A_TABLE;
  }
}

/**
 * Mencari tarif TER (%) berdasarkan Kategori TER dan Penghasilan Bruto Kena Pajak
 */
export function findTerRate(category: TerCategory, taxableGross: number): number {
  if (taxableGross <= 0) {
    return 0;
  }

  const table = getTerTable(category);

  for (const bracket of table) {
    if (bracket.maxBruto === null) {
      if (taxableGross > bracket.minBruto) {
        return bracket.rate;
      }
    } else if (bracket.minBruto === 0) {
      if (taxableGross <= bracket.maxBruto) {
        return bracket.rate;
      }
    } else {
      if (taxableGross > bracket.minBruto && taxableGross <= bracket.maxBruto) {
        return bracket.rate;
      }
    }
  }

  return 0;
}

/**
 * Menghitung PPh 21 Bulanan Masa Januari – November (Metode Gross TER PP 58/2023)
 */
export function calculateMonthlyPph21Ter(
  taxableGross: number,
  ptkp: PtkpStatus,
): MonthlyPph21Result {
  const safeGross = Math.max(0, Math.round(taxableGross));
  const terCategory = getPtkpCategory(ptkp);
  const terRate = findTerRate(terCategory, safeGross);
  const pph21 = Math.round(safeGross * terRate);

  return {
    pph21,
    terCategory,
    terRate,
    taxableGross: safeGross,
  };
}

/**
 * Menghitung PPh 21 Terutang berdasarkan Tarif Progresif Pasal 17 ayat (1) huruf a UU HPP
 */
export function calculatePasal17Tax(pkp: number): number {
  if (pkp <= 0) {
    return 0;
  }

  let remainingPkp = pkp;
  let totalTax = 0;
  let prevLimit = 0;

  for (const bracket of PASAL_17_BRACKETS) {
    if (remainingPkp <= 0) {
      break;
    }

    if (bracket.limit === null) {
      totalTax += remainingPkp * bracket.rate;
      break;
    }

    const bracketSpan = bracket.limit - prevLimit;
    const taxableInBracket = Math.min(remainingPkp, bracketSpan);
    totalTax += taxableInBracket * bracket.rate;
    remainingPkp -= taxableInBracket;
    prevLimit = bracket.limit;
  }

  return Math.round(totalTax);
}

/**
 * Menghitung PPh 21 Akhir Tahun (Masa Desember / Masa Pajak Terakhir)
 * Sesuai Pasal 17 ayat (1) huruf a UU HPP & PMK 168/2023
 */
export function calculateAnnualPph21Pasal17(
  params: CalculateAnnualPph21Params,
): AnnualPph21Result {
  const {
    annualTaxableGross,
    ptkp,
    annualPensionDeductions = 0,
    monthsWorked = 12,
    previousPph21Paid = 0,
  } = params;

  const validMonths = Math.max(1, Math.min(12, monthsWorked));
  const safeGross = Math.max(0, Math.round(annualTaxableGross));
  const safePension = Math.max(0, Math.round(annualPensionDeductions));

  // Biaya jabatan: 5% dari Bruto, maksimal Rp500.000 / bulan kerja atau Rp6.000.000 / tahun
  const maxBiayaJabatan = Math.min(
    MAX_BIAYA_JABATAN_ANNUAL,
    MAX_BIAYA_JABATAN_MONTHLY * validMonths,
  );
  const annualBiayaJabatan = Math.min(
    maxBiayaJabatan,
    Math.round(safeGross * BIAYA_JABATAN_RATE),
  );

  // Penghasilan Neto Setahun
  const annualNetIncome = Math.max(0, safeGross - annualBiayaJabatan - safePension);

  // PTKP Setahun
  const ptkpAmount = PTKP_ANNUAL_AMOUNT[ptkp] ?? PTKP_ANNUAL_AMOUNT.TK_0;

  // Penghasilan Kena Pajak (PKP) - pembulatan ke bawah ribuan rupiah (UU PPh)
  const rawPkp = annualNetIncome - ptkpAmount;
  const pkp = rawPkp > 0 ? Math.floor(rawPkp / 1000) * 1000 : 0;

  // PPh 21 Terutang Setahun (Tarif Progresif Ps. 17)
  const annualPph21Payable = calculatePasal17Tax(pkp);

  // PPh 21 Masa Terakhir (Desember) = Terutang Setahun - Terpotong Jan-Nov
  const pph21December = annualPph21Payable - Math.round(previousPph21Paid);

  return {
    annualTaxableGross: safeGross,
    annualBiayaJabatan,
    annualPensionDeductions: safePension,
    annualNetIncome,
    ptkpAmount,
    pkp,
    annualPph21Payable,
    previousPph21Paid: Math.round(previousPph21Paid),
    pph21December,
  };
}

/**
 * Parameter dan Perhitungan Premi Asuransi Tanggungan Lembaga
 * Sebagai Objek PPh 21 (Natura) sesuai PP 44/2015, PP 45/2015, & Perpres 64/2020
 */
export const BPJS_KES_COMPANY_RATE = 0.04; // 4.00%
export const BPJS_KES_MAX_BASE = 12_000_000; // Batas atas dasar upah BPJS Kesehatan (maks Rp 480.000)
export const BPJS_JKK_COMPANY_RATE = 0.0024; // 0.24% (Tingkat Risiko Sangat Rendah)
export const BPJS_JKM_COMPANY_RATE = 0.003; // 0.30%

export interface CompanyTaxableBenefitResult {
  bpjsKesehatan: number;
  jkk: number;
  jkm: number;
  totalBenefit: number;
}

/**
 * Menghitung premi asuransi kesehatan & ketenagakerjaan porsi lembaga
 * yang ditambahkan ke penghasilan bruto sebagai Dasar Pengenaan Pajak (DPP) PPh 21
 */
export function calculateCompanyTaxableBenefit(baseSalary: number): CompanyTaxableBenefitResult {
  if (baseSalary <= 0) {
    return { bpjsKesehatan: 0, jkk: 0, jkm: 0, totalBenefit: 0 };
  }
  const safeBase = Math.round(baseSalary);
  const kesBase = Math.min(safeBase, BPJS_KES_MAX_BASE);
  const bpjsKesehatan = Math.round(kesBase * BPJS_KES_COMPANY_RATE);
  const jkk = Math.round(safeBase * BPJS_JKK_COMPANY_RATE);
  const jkm = Math.round(safeBase * BPJS_JKM_COMPANY_RATE);
  const totalBenefit = bpjsKesehatan + jkk + jkm;

  return {
    bpjsKesehatan,
    jkk,
    jkm,
    totalBenefit,
  };
}
