import { PtkpStatus } from "@pspk/db";

export type TerCategory = "TER_A" | "TER_B" | "TER_C";

export interface TerBracket {
  minBruto: number;
  maxBruto: number | null; // null jika di atas batas tertinggi (unbounded)
  rate: number;
}

/**
 * Matriks Tarif Efektif Rata-Rata (TER) Bulanan PP No. 58 Tahun 2023 & PMK No. 168 Tahun 2023
 */

// Kategori A: TK/0 (PTKP Rp54 jt), TK/1 (PTKP Rp58,5 jt), K/0 (PTKP Rp58,5 jt) - 44 Lapisan
export const TER_A_TABLE: readonly TerBracket[] = [
  { minBruto: 0, maxBruto: 5_400_000, rate: 0.0 },
  { minBruto: 5_400_000, maxBruto: 5_650_000, rate: 0.0025 },
  { minBruto: 5_650_000, maxBruto: 5_950_000, rate: 0.005 },
  { minBruto: 5_950_000, maxBruto: 6_300_000, rate: 0.0075 },
  { minBruto: 6_300_000, maxBruto: 6_750_000, rate: 0.01 },
  { minBruto: 6_750_000, maxBruto: 7_500_000, rate: 0.0125 },
  { minBruto: 7_500_000, maxBruto: 8_550_000, rate: 0.015 },
  { minBruto: 8_550_000, maxBruto: 9_650_000, rate: 0.0175 },
  { minBruto: 9_650_000, maxBruto: 10_050_000, rate: 0.02 },
  { minBruto: 10_050_000, maxBruto: 10_350_000, rate: 0.0225 },
  { minBruto: 10_350_000, maxBruto: 10_700_000, rate: 0.025 },
  { minBruto: 10_700_000, maxBruto: 11_050_000, rate: 0.03 },
  { minBruto: 11_050_000, maxBruto: 11_600_000, rate: 0.035 },
  { minBruto: 11_600_000, maxBruto: 12_500_000, rate: 0.04 },
  { minBruto: 12_500_000, maxBruto: 13_750_000, rate: 0.05 },
  { minBruto: 13_750_000, maxBruto: 15_100_000, rate: 0.06 },
  { minBruto: 15_100_000, maxBruto: 16_950_000, rate: 0.07 },
  { minBruto: 16_950_000, maxBruto: 19_750_000, rate: 0.08 },
  { minBruto: 19_750_000, maxBruto: 24_150_000, rate: 0.09 },
  { minBruto: 24_150_000, maxBruto: 26_450_000, rate: 0.1 },
  { minBruto: 26_450_000, maxBruto: 28_000_000, rate: 0.11 },
  { minBruto: 28_000_000, maxBruto: 30_050_000, rate: 0.12 },
  { minBruto: 30_050_000, maxBruto: 32_400_000, rate: 0.13 },
  { minBruto: 32_400_000, maxBruto: 35_400_000, rate: 0.14 },
  { minBruto: 35_400_000, maxBruto: 39_100_000, rate: 0.15 },
  { minBruto: 39_100_000, maxBruto: 43_850_000, rate: 0.16 },
  { minBruto: 43_850_000, maxBruto: 47_800_000, rate: 0.17 },
  { minBruto: 47_800_000, maxBruto: 51_400_000, rate: 0.18 },
  { minBruto: 51_400_000, maxBruto: 56_300_000, rate: 0.19 },
  { minBruto: 56_300_000, maxBruto: 62_200_000, rate: 0.2 },
  { minBruto: 62_200_000, maxBruto: 68_600_000, rate: 0.21 },
  { minBruto: 68_600_000, maxBruto: 77_500_000, rate: 0.22 },
  { minBruto: 77_500_000, maxBruto: 89_000_000, rate: 0.23 },
  { minBruto: 89_000_000, maxBruto: 103_000_000, rate: 0.24 },
  { minBruto: 103_000_000, maxBruto: 125_000_000, rate: 0.25 },
  { minBruto: 125_000_000, maxBruto: 157_000_000, rate: 0.26 },
  { minBruto: 157_000_000, maxBruto: 206_000_000, rate: 0.27 },
  { minBruto: 206_000_000, maxBruto: 337_000_000, rate: 0.28 },
  { minBruto: 337_000_000, maxBruto: 454_000_000, rate: 0.29 },
  { minBruto: 454_000_000, maxBruto: 550_000_000, rate: 0.3 },
  { minBruto: 550_000_000, maxBruto: 695_000_000, rate: 0.31 },
  { minBruto: 695_000_000, maxBruto: 910_000_000, rate: 0.32 },
  { minBruto: 910_000_000, maxBruto: 1_400_000_000, rate: 0.33 },
  { minBruto: 1_400_000_000, maxBruto: null, rate: 0.34 },
];

// Kategori B: TK/2 (PTKP Rp63 jt), TK/3 (PTKP Rp67,5 jt), K/1 (PTKP Rp63 jt), K/2 (PTKP Rp67,5 jt) - 40 Lapisan
export const TER_B_TABLE: readonly TerBracket[] = [
  { minBruto: 0, maxBruto: 6_200_000, rate: 0.0 },
  { minBruto: 6_200_000, maxBruto: 6_500_000, rate: 0.0025 },
  { minBruto: 6_500_000, maxBruto: 6_850_000, rate: 0.005 },
  { minBruto: 6_850_000, maxBruto: 7_300_000, rate: 0.0075 },
  { minBruto: 7_300_000, maxBruto: 9_200_000, rate: 0.01 },
  { minBruto: 9_200_000, maxBruto: 10_750_000, rate: 0.015 },
  { minBruto: 10_750_000, maxBruto: 11_250_000, rate: 0.02 },
  { minBruto: 11_250_000, maxBruto: 11_600_000, rate: 0.025 },
  { minBruto: 11_600_000, maxBruto: 12_600_000, rate: 0.03 },
  { minBruto: 12_600_000, maxBruto: 13_600_000, rate: 0.04 },
  { minBruto: 13_600_000, maxBruto: 14_950_000, rate: 0.05 },
  { minBruto: 14_950_000, maxBruto: 16_400_000, rate: 0.06 },
  { minBruto: 16_400_000, maxBruto: 18_450_000, rate: 0.07 },
  { minBruto: 18_450_000, maxBruto: 21_850_000, rate: 0.08 },
  { minBruto: 21_850_000, maxBruto: 26_000_000, rate: 0.09 },
  { minBruto: 26_000_000, maxBruto: 27_700_000, rate: 0.1 },
  { minBruto: 27_700_000, maxBruto: 29_350_000, rate: 0.11 },
  { minBruto: 29_350_000, maxBruto: 31_450_000, rate: 0.12 },
  { minBruto: 31_450_000, maxBruto: 33_950_000, rate: 0.13 },
  { minBruto: 33_950_000, maxBruto: 37_100_000, rate: 0.14 },
  { minBruto: 37_100_000, maxBruto: 41_100_000, rate: 0.15 },
  { minBruto: 41_100_000, maxBruto: 45_800_000, rate: 0.16 },
  { minBruto: 45_800_000, maxBruto: 49_500_000, rate: 0.17 },
  { minBruto: 49_500_000, maxBruto: 53_800_000, rate: 0.18 },
  { minBruto: 53_800_000, maxBruto: 58_500_000, rate: 0.19 },
  { minBruto: 58_500_000, maxBruto: 64_000_000, rate: 0.2 },
  { minBruto: 64_000_000, maxBruto: 71_000_000, rate: 0.21 },
  { minBruto: 71_000_000, maxBruto: 80_000_000, rate: 0.22 },
  { minBruto: 80_000_000, maxBruto: 93_000_000, rate: 0.23 },
  { minBruto: 93_000_000, maxBruto: 109_000_000, rate: 0.24 },
  { minBruto: 109_000_000, maxBruto: 129_000_000, rate: 0.25 },
  { minBruto: 129_000_000, maxBruto: 163_000_000, rate: 0.26 },
  { minBruto: 163_000_000, maxBruto: 211_000_000, rate: 0.27 },
  { minBruto: 211_000_000, maxBruto: 374_000_000, rate: 0.28 },
  { minBruto: 374_000_000, maxBruto: 459_000_000, rate: 0.29 },
  { minBruto: 459_000_000, maxBruto: 555_000_000, rate: 0.3 },
  { minBruto: 555_000_000, maxBruto: 704_000_000, rate: 0.31 },
  { minBruto: 704_000_000, maxBruto: 957_000_000, rate: 0.32 },
  { minBruto: 957_000_000, maxBruto: 1_405_000_000, rate: 0.33 },
  { minBruto: 1_405_000_000, maxBruto: null, rate: 0.34 },
];

// Kategori C: K/3 (PTKP Rp72 jt) - 41 Lapisan
export const TER_C_TABLE: readonly TerBracket[] = [
  { minBruto: 0, maxBruto: 6_600_000, rate: 0.0 },
  { minBruto: 6_600_000, maxBruto: 6_950_000, rate: 0.0025 },
  { minBruto: 6_950_000, maxBruto: 7_350_000, rate: 0.005 },
  { minBruto: 7_350_000, maxBruto: 7_800_000, rate: 0.0075 },
  { minBruto: 7_800_000, maxBruto: 8_850_000, rate: 0.01 },
  { minBruto: 8_850_000, maxBruto: 9_800_000, rate: 0.0125 },
  { minBruto: 9_800_000, maxBruto: 10_950_000, rate: 0.015 },
  { minBruto: 10_950_000, maxBruto: 11_200_000, rate: 0.0175 },
  { minBruto: 11_200_000, maxBruto: 12_050_000, rate: 0.02 },
  { minBruto: 12_050_000, maxBruto: 12_950_000, rate: 0.03 },
  { minBruto: 12_950_000, maxBruto: 14_150_000, rate: 0.04 },
  { minBruto: 14_150_000, maxBruto: 15_550_000, rate: 0.05 },
  { minBruto: 15_550_000, maxBruto: 17_050_000, rate: 0.06 },
  { minBruto: 17_050_000, maxBruto: 19_500_000, rate: 0.07 },
  { minBruto: 19_500_000, maxBruto: 22_700_000, rate: 0.08 },
  { minBruto: 22_700_000, maxBruto: 26_600_000, rate: 0.09 },
  { minBruto: 26_600_000, maxBruto: 28_100_000, rate: 0.1 },
  { minBruto: 28_100_000, maxBruto: 30_100_000, rate: 0.11 },
  { minBruto: 30_100_000, maxBruto: 32_600_000, rate: 0.12 },
  { minBruto: 32_600_000, maxBruto: 35_400_000, rate: 0.13 },
  { minBruto: 35_400_000, maxBruto: 38_900_000, rate: 0.14 },
  { minBruto: 38_900_000, maxBruto: 43_000_000, rate: 0.15 },
  { minBruto: 43_000_000, maxBruto: 47_400_000, rate: 0.16 },
  { minBruto: 47_400_000, maxBruto: 51_200_000, rate: 0.17 },
  { minBruto: 51_200_000, maxBruto: 55_800_000, rate: 0.18 },
  { minBruto: 55_800_000, maxBruto: 60_400_000, rate: 0.19 },
  { minBruto: 60_400_000, maxBruto: 66_700_000, rate: 0.2 },
  { minBruto: 66_700_000, maxBruto: 74_500_000, rate: 0.21 },
  { minBruto: 74_500_000, maxBruto: 83_200_000, rate: 0.22 },
  { minBruto: 83_200_000, maxBruto: 95_600_000, rate: 0.23 },
  { minBruto: 95_600_000, maxBruto: 110_000_000, rate: 0.24 },
  { minBruto: 110_000_000, maxBruto: 134_000_000, rate: 0.25 },
  { minBruto: 134_000_000, maxBruto: 169_000_000, rate: 0.26 },
  { minBruto: 169_000_000, maxBruto: 221_000_000, rate: 0.27 },
  { minBruto: 221_000_000, maxBruto: 390_000_000, rate: 0.28 },
  { minBruto: 390_000_000, maxBruto: 463_000_000, rate: 0.29 },
  { minBruto: 463_000_000, maxBruto: 561_000_000, rate: 0.3 },
  { minBruto: 561_000_000, maxBruto: 709_000_000, rate: 0.31 },
  { minBruto: 709_000_000, maxBruto: 965_000_000, rate: 0.32 },
  { minBruto: 965_000_000, maxBruto: 1_419_000_000, rate: 0.33 },
  { minBruto: 1_419_000_000, maxBruto: null, rate: 0.34 },
];

/**
 * Pemetaan Status PTKP ke Kategori TER Bulanan
 * Sesuai PP No. 58 Tahun 2023 Pasal 2 ayat (2)
 */
export const PTKP_TO_TER_CATEGORY: Record<PtkpStatus, TerCategory> = {
  TK_0: "TER_A",
  TK_1: "TER_A",
  K_0: "TER_A",
  TK_2: "TER_B",
  TK_3: "TER_B",
  K_1: "TER_B",
  K_2: "TER_B",
  K_3: "TER_C",
};

/**
 * Nilai Nominal PTKP Setahun (Rupiah)
 * Sesuai PMK No. 101/PMK.010/2016 & UU HPP
 */
export const PTKP_ANNUAL_AMOUNT: Record<PtkpStatus, number> = {
  TK_0: 54_000_000,
  TK_1: 58_500_000,
  TK_2: 63_000_000,
  TK_3: 67_500_000,
  K_0: 58_500_000,
  K_1: 63_000_000,
  K_2: 67_500_000,
  K_3: 72_000_000,
};

/**
 * Batasan Tarif Progresif PPh Pasal 17 ayat (1) huruf a UU PPh / UU HPP No. 7 Tahun 2021
 */
export interface Pasal17Bracket {
  limit: number | null; // Batas atas lapisan, null jika tanpa batas
  rate: number;
}

export const PASAL_17_BRACKETS: readonly Pasal17Bracket[] = [
  { limit: 60_000_000, rate: 0.05 },
  { limit: 250_000_000, rate: 0.15 },
  { limit: 500_000_000, rate: 0.25 },
  { limit: 5_000_000_000, rate: 0.3 },
  { limit: null, rate: 0.35 },
];

// Parameter Tetap Regulasi Pajak
export const BIAYA_JABATAN_RATE = 0.05; // 5%
export const MAX_BIAYA_JABATAN_MONTHLY = 500_000; // Rp500.000 / bulan
export const MAX_BIAYA_JABATAN_ANNUAL = 6_000_000; // Rp6.000.000 / tahun
