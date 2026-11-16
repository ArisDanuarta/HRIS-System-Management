import type { PtkpStatus, TaxMethod } from "@pspk/db";

export interface PtkpExplanation {
  status: PtkpStatus;
  statusLabel: string;
  terCategory: "TER A" | "TER B" | "TER C";
  terBadgeClass: string;
  annualPtkp: string;
  monthlyPtkp: string;
  zeroTaxLimit: string;
  summary: string;
  calculationDetail: string;
  notes: string;
}

export interface TaxMethodExplanation {
  method: TaxMethod;
  title: string;
  badge: string;
  badgeClass: string;
  borderClass: string;
  bgClass: string;
  summary: string;
  howItWorks: string;
  employeeImpact: string;
  companyImpact: string;
  bestFor: string;
}

export const PTKP_EXPLANATION_MAP: Record<PtkpStatus, PtkpExplanation> = {
  TK_0: {
    status: "TK_0",
    statusLabel: "Tidak Kawin, 0 Tanggungan (TK/0)",
    terCategory: "TER A",
    terBadgeClass: "bg-sky-100 text-sky-800 border-sky-300",
    annualPtkp: "Rp 54.000.000 / tahun",
    monthlyPtkp: "Rp 4.500.000 / bulan",
    zeroTaxLimit: "Bruto s.d. Rp 5.400.000/bln (Tarif 0% - Bebas Pajak)",
    summary: "Karyawan lajang tanpa anggota keluarga sedarah/semenda yang menjadi tanggungan.",
    calculationDetail:
      "Jan–Nov: Dipotong sesuai 44 lapisan tarif TER Kategori A (0% s.d. 34%). Desember: Rekonsiliasi tarif progresif Pasal 17 UU HPP atas Neto Setahun dikurangi PTKP Rp 54 jt.",
    notes: "Standar baku untuk pegawai lajang, atau karyawati menikah yang suaminya berpenghasilan.",
  },
  TK_1: {
    status: "TK_1",
    statusLabel: "Tidak Kawin, 1 Tanggungan (TK/1)",
    terCategory: "TER A",
    terBadgeClass: "bg-sky-100 text-sky-800 border-sky-300",
    annualPtkp: "Rp 58.500.000 / tahun",
    monthlyPtkp: "Rp 4.875.000 / bulan",
    zeroTaxLimit: "Bruto s.d. Rp 5.400.000/bln (Tarif 0% - Bebas Pajak)",
    summary: "Karyawan lajang dengan 1 tanggungan keluarga sedarah (orang tua/anak kandung).",
    calculationDetail:
      "Jan–Nov: Masuk TER Kategori A (0% s.d. 34%). Desember: Rekonsiliasi Pasal 17 UU HPP dikurangi PTKP setahun Rp 58.500.000 (Rp 54 jt pribadi + Rp 4,5 jt tanggungan).",
    notes: "Mendapat tambahan PTKP Rp 4,5 jt/tahun untuk 1 orang anggota keluarga yang ditanggung.",
  },
  TK_2: {
    status: "TK_2",
    statusLabel: "Tidak Kawin, 2 Tanggungan (TK/2)",
    terCategory: "TER B",
    terBadgeClass: "bg-indigo-100 text-indigo-800 border-indigo-300",
    annualPtkp: "Rp 63.000.000 / tahun",
    monthlyPtkp: "Rp 5.250.000 / bulan",
    zeroTaxLimit: "Bruto s.d. Rp 6.200.000/bln (Tarif 0% - Bebas Pajak)",
    summary: "Karyawan lajang dengan 2 orang tanggungan keluarga sedarah.",
    calculationDetail:
      "Jan–Nov: Beralih ke TER Kategori B (40 lapisan tarif, 0% s.d. 34%). Batas pembebasan pajak naik ke Rp 6,2 jt/bln. Desember: Rekonsiliasi Pasal 17 dikurangi PTKP Rp 63 jt.",
    notes: "Tarif TER B memberikan potongan pajak bulanan yang lebih hemat dibanding TER A.",
  },
  TK_3: {
    status: "TK_3",
    statusLabel: "Tidak Kawin, 3 Tanggungan (TK/3)",
    terCategory: "TER B",
    terBadgeClass: "bg-indigo-100 text-indigo-800 border-indigo-300",
    annualPtkp: "Rp 67.500.000 / tahun",
    monthlyPtkp: "Rp 5.625.000 / bulan",
    zeroTaxLimit: "Bruto s.d. Rp 6.200.000/bln (Tarif 0% - Bebas Pajak)",
    summary: "Karyawan lajang dengan 3 orang tanggungan keluarga sedarah (maksimum undang-undang).",
    calculationDetail:
      "Jan–Nov: Masuk TER Kategori B. Tarif 0% hingga penghasilan bruto Rp 6,2 jt/bln. Desember: Rekonsiliasi Pasal 17 dikurangi PTKP Rp 67.500.000.",
    notes: "Batas maksimal tanggungan yang diakui oleh ketentuan perpajakan RI adalah 3 orang.",
  },
  K_0: {
    status: "K_0",
    statusLabel: "Kawin, 0 Tanggungan (K/0)",
    terCategory: "TER A",
    terBadgeClass: "bg-sky-100 text-sky-800 border-sky-300",
    annualPtkp: "Rp 58.500.000 / tahun",
    monthlyPtkp: "Rp 4.875.000 / bulan",
    zeroTaxLimit: "Bruto s.d. Rp 5.400.000/bln (Tarif 0% - Bebas Pajak)",
    summary: "Karyawan berstatus menikah (kawin) dan belum memiliki tanggungan anak.",
    calculationDetail:
      "Jan–Nov: Masuk TER Kategori A (PTKP Rp 54 jt pribadi + Rp 4,5 jt status kawin). Desember: Rekonsiliasi Pasal 17 UU HPP dikurangi PTKP Rp 58.500.000.",
    notes: "Untuk pegawai pria yang menikah, atau karyawati ber-SK suami tidak berpenghasilan.",
  },
  K_1: {
    status: "K_1",
    statusLabel: "Kawin, 1 Tanggungan (K/1)",
    terCategory: "TER B",
    terBadgeClass: "bg-indigo-100 text-indigo-800 border-indigo-300",
    annualPtkp: "Rp 63.000.000 / tahun",
    monthlyPtkp: "Rp 5.250.000 / bulan",
    zeroTaxLimit: "Bruto s.d. Rp 6.200.000/bln (Tarif 0% - Bebas Pajak)",
    summary: "Karyawan menikah dengan 1 anak atau 1 tanggungan keluarga.",
    calculationDetail:
      "Jan–Nov: Masuk kelompok TER Kategori B. Batas bebas pajak bulanan Rp 6,2 jt/bln. Desember: Rekonsiliasi Pasal 17 dikurangi PTKP Rp 63.000.000.",
    notes: "PTKP terdiri dari Rp 54 jt (pribadi) + Rp 4,5 jt (status kawin) + Rp 4,5 jt (1 anak).",
  },
  K_2: {
    status: "K_2",
    statusLabel: "Kawin, 2 Tanggungan (K/2)",
    terCategory: "TER B",
    terBadgeClass: "bg-indigo-100 text-indigo-800 border-indigo-300",
    annualPtkp: "Rp 67.500.000 / tahun",
    monthlyPtkp: "Rp 5.625.000 / bulan",
    zeroTaxLimit: "Bruto s.d. Rp 6.200.000/bln (Tarif 0% - Bebas Pajak)",
    summary: "Karyawan menikah dengan 2 orang anak atau tanggungan keluarga.",
    calculationDetail:
      "Jan–Nov: Masuk kelompok TER Kategori B. Batas tarif 0% berlaku hingga bruto Rp 6,2 jt/bln. Desember: Rekonsiliasi Pasal 17 dikurangi PTKP Rp 67.500.000.",
    notes: "PTKP terdiri dari Rp 54 jt (pribadi) + Rp 4,5 jt (status kawin) + Rp 9 jt (2 anak).",
  },
  K_3: {
    status: "K_3",
    statusLabel: "Kawin, 3 Tanggungan (K/3)",
    terCategory: "TER C",
    terBadgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300",
    annualPtkp: "Rp 72.000.000 / tahun",
    monthlyPtkp: "Rp 6.000.000 / bulan",
    zeroTaxLimit: "Bruto s.d. Rp 6.600.000/bln (Tarif 0% - Bebas Pajak)",
    summary: "Karyawan menikah dengan 3 orang anak/tanggungan (tanggungan keluarga penuh).",
    calculationDetail:
      "Jan–Nov: Masuk kelompok TER Kategori C (41 lapisan tarif, 0% s.d. 34%). Batas pembebasan pajak bulanan tertinggi (bruto s.d. Rp 6,6 jt/bln tarif 0%). Desember: Rekonsiliasi Pasal 17 dikurangi PTKP Rp 72 jt.",
    notes: "Kategori tarif bulanan TER paling ekonomis untuk karyawan berkeluarga besar.",
  },
};

export const TAX_METHOD_EXPLANATION_MAP: Record<TaxMethod, TaxMethodExplanation> = {
  GROSS: {
    method: "GROSS",
    title: "Metode GROSS (Potong Gaji Karyawan)",
    badge: "Standar Regulasi",
    badgeClass: "bg-slate-100 text-slate-800 border-slate-300",
    borderClass: "border-slate-200",
    bgClass: "bg-white",
    summary: "Pajak PPh 21 menjadi kewajiban karyawan dan dipotong langsung dari total penghasilan tunai.",
    howItWorks:
      "Bruto Pajak (Gaji Tunai + Premi Lembaga) × Tarif TER = PPh 21. Nilai pajak dimasukkan ke slip gaji pada komponen POTONGAN.",
    employeeImpact:
      "Take Home Pay (THP) berkurang senilai nominal potongan PPh 21. Karyawan menanggung sendiri pajaknya.",
    companyImpact:
      "Lembaga hanya membayarkan gaji dan premi asuransi resmi tanpa ada tambahan biaya tunjangan pajak.",
    bestFor: "Staf reguler, honorer, dan pegawai kontrak sesuai standar ketenagakerjaan di Indonesia.",
  },
  GROSS_UP: {
    method: "GROSS_UP",
    title: "Metode GROSS UP (Tunjangan Pajak Lembaga)",
    badge: "Gaji Bersih via Tunjangan",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300",
    borderClass: "border-emerald-200",
    bgClass: "bg-emerald-50/50",
    summary: "Lembaga memberikan Tunjangan Pajak (Tax Allowance) sejumlah estimasi pajak terutang.",
    howItWorks:
      "Sistem menambahkan komponen 'TUNJANGAN PAJAK' pada penerimaan tunai, lalu memotong kembali nilai yang sama pada komponen potongan pajak.",
    employeeImpact:
      "Take Home Pay (THP) utuh/bersih tidak terpotong pajak. Slip gaji menampilkan tunjangan pajak dan potongan pajak yang seimbang.",
    companyImpact:
      "Beban pajak ditanggung lembaga dalam bentuk tunjangan gaji resmi yang diakui pembukuan dan dapat dibiayakan (deductible).",
    bestFor: "Posisi manajerial, tenaga ahli khusus, atau staf dengan kesepakatan kontrak gaji bersih formal.",
  },
  NETT: {
    method: "NETT",
    title: "Metode NETT (Pajak Ditanggung Lembaga)",
    badge: "Beban Operasional Kantor",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-300",
    borderClass: "border-amber-200",
    bgClass: "bg-amber-50/50",
    summary: "Gaji dibayarkan utuh kepada karyawan tanpa ada komponen pemotongan PPh 21 pada slip gaji.",
    howItWorks:
      "Pada slip gaji: PPh 21 tercatat Rp 0 (tidak ada potongan). Beban pajak disetorkan langsung oleh bagian keuangan lembaga ke kas negara.",
    employeeImpact:
      "Slip gaji bersih dan sederhana tanpa potongan PPh 21. Gaji tunai diterima utuh bulat.",
    companyImpact:
      "Beban pajak menjadi biaya operasional lembaga langsung (umumnya bersifat non-deductible expense bagi lembaga).",
    bestFor: "Konsultan lepas, perbantuan khusus, atau kebijakan remunerasi netto khusus pimpinan.",
  },
};

export function getPtkpExplanation(status?: PtkpStatus | string | null): PtkpExplanation {
  const normalized = (status as PtkpStatus) || "TK_0";
  return PTKP_EXPLANATION_MAP[normalized] || PTKP_EXPLANATION_MAP.TK_0;
}

export function getTaxMethodExplanation(method?: TaxMethod | string | null): TaxMethodExplanation {
  const normalized = (method as TaxMethod) || "GROSS";
  return TAX_METHOD_EXPLANATION_MAP[normalized] || TAX_METHOD_EXPLANATION_MAP.GROSS;
}
