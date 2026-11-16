import { describe, expect, it } from "vitest";
import {
  calculateAnnualPph21Pasal17,
  calculateCompanyTaxableBenefit,
  calculateMonthlyPph21Ter,
  calculatePasal17Tax,
  findTerRate,
  getPtkpCategory,
  getTerTable,
} from "./pph21-calculator";

describe("PPh 21 Tax Calculation Engine (PP 58/2023 & PMK 168/2023)", () => {
  describe("Pemetaan Status PTKP ke Kategori TER", () => {
    it("memetakan TK/0, TK/1, K/0 ke TER A", () => {
      expect(getPtkpCategory("TK_0")).toBe("TER_A");
      expect(getPtkpCategory("TK_1")).toBe("TER_A");
      expect(getPtkpCategory("K_0")).toBe("TER_A");
    });

    it("memetakan TK/2, TK/3, K/1, K/2 ke TER B", () => {
      expect(getPtkpCategory("TK_2")).toBe("TER_B");
      expect(getPtkpCategory("TK_3")).toBe("TER_B");
      expect(getPtkpCategory("K_1")).toBe("TER_B");
      expect(getPtkpCategory("K_2")).toBe("TER_B");
    });

    it("memetakan K/3 ke TER C", () => {
      expect(getPtkpCategory("K_3")).toBe("TER_C");
    });
  });

  describe("Kelengkapan Lapisan Tabel TER PP 58/2023", () => {
    it("memiliki tepat 44 lapisan pada TER A", () => {
      expect(getTerTable("TER_A")).toHaveLength(44);
    });

    it("memiliki tepat 40 lapisan pada TER B", () => {
      expect(getTerTable("TER_B")).toHaveLength(40);
    });

    it("memiliki tepat 41 lapisan pada TER C", () => {
      expect(getTerTable("TER_C")).toHaveLength(41);
    });
  });

  describe("Pencarian Tarif TER (findTerRate)", () => {
    it("mengembalikan 0 jika bruto <= 0", () => {
      expect(findTerRate("TER_A", 0)).toBe(0);
      expect(findTerRate("TER_A", -1000)).toBe(0);
    });

    describe("TER Kategori A", () => {
      it("tarif 0% untuk penghasilan s.d. Rp 5.400.000", () => {
        expect(findTerRate("TER_A", 3_000_000)).toBe(0.0);
        expect(findTerRate("TER_A", 5_400_000)).toBe(0.0);
      });

      it("tarif 0.25% untuk penghasilan > Rp 5.400.000 s.d. Rp 5.650.000", () => {
        expect(findTerRate("TER_A", 5_400_001)).toBe(0.0025);
        expect(findTerRate("TER_A", 5_650_000)).toBe(0.0025);
      });

      it("tarif 0.5% untuk penghasilan > Rp 5.650.000 s.d. Rp 5.950.000", () => {
        expect(findTerRate("TER_A", 5_650_001)).toBe(0.005);
        expect(findTerRate("TER_A", 5_950_000)).toBe(0.005);
      });

      it("tarif 1.75% untuk lapisan Rp 8.550.000 s.d. Rp 9.650.000", () => {
        expect(findTerRate("TER_A", 8_550_001)).toBe(0.0175);
        expect(findTerRate("TER_A", 9_363_200)).toBe(0.0175);
        expect(findTerRate("TER_A", 9_650_000)).toBe(0.0175);
      });

      it("tarif 34% untuk penghasilan di atas Rp 1.400.000.000", () => {
        expect(findTerRate("TER_A", 1_400_000_001)).toBe(0.34);
        expect(findTerRate("TER_A", 2_000_000_000)).toBe(0.34);
      });
    });

    describe("TER Kategori B", () => {
      it("tarif 0% untuk penghasilan s.d. Rp 6.200.000", () => {
        expect(findTerRate("TER_B", 5_000_000)).toBe(0.0);
        expect(findTerRate("TER_B", 6_200_000)).toBe(0.0);
      });

      it("tarif 0.25% untuk penghasilan > Rp 6.200.000 s.d. Rp 6.500.000", () => {
        expect(findTerRate("TER_B", 6_200_001)).toBe(0.0025);
        expect(findTerRate("TER_B", 6_500_000)).toBe(0.0025);
      });

      it("tarif 1.5% untuk penghasilan > Rp 9.200.000 s.d. Rp 10.750.000", () => {
        expect(findTerRate("TER_B", 10_000_000)).toBe(0.015);
      });

      it("tarif 34% untuk penghasilan di atas Rp 1.405.000.000", () => {
        expect(findTerRate("TER_B", 1_405_000_001)).toBe(0.34);
      });
    });

    describe("TER Kategori C", () => {
      it("tarif 0% untuk penghasilan s.d. Rp 6.600.000", () => {
        expect(findTerRate("TER_C", 6_000_000)).toBe(0.0);
        expect(findTerRate("TER_C", 6_600_000)).toBe(0.0);
      });

      it("tarif 0.25% untuk penghasilan > Rp 6.600.000 s.d. Rp 6.950.000", () => {
        expect(findTerRate("TER_C", 6_600_001)).toBe(0.0025);
        expect(findTerRate("TER_C", 6_950_000)).toBe(0.0025);
      });

      it("tarif 1.75% untuk penghasilan > Rp 10.950.000 s.d. Rp 11.200.000", () => {
        expect(findTerRate("TER_C", 11_000_000)).toBe(0.0175);
      });

      it("tarif 34% untuk penghasilan di atas Rp 1.419.000.000", () => {
        expect(findTerRate("TER_C", 1_419_000_001)).toBe(0.34);
      });
    });
  });

  describe("Kalkulasi PPh 21 Bulanan (calculateMonthlyPph21Ter)", () => {
    it("menghitung simulasi riil kasus Budi (TK/0, Bruto Rp 9.363.200) tepat Rp 163.856", () => {
      // Kasus Budi: Gaji pokok 8 jt + transport 1 jt + premi asuransi kantor 363.200
      const taxableGross = 9_363_200;
      const result = calculateMonthlyPph21Ter(taxableGross, "TK_0");

      expect(result.terCategory).toBe("TER_A");
      expect(result.terRate).toBe(0.0175); // 1.75%
      expect(result.taxableGross).toBe(9_363_200);
      expect(result.pph21).toBe(163_856); // 9.363.200 * 1.75% = 163.856
    });

    it("menghasilkan PPh 21 Rp 0 bagi karyawan dengan penghasilan di bawah batas kena pajak TER", () => {
      const result = calculateMonthlyPph21Ter(5_000_000, "TK_0");
      expect(result.terRate).toBe(0.0);
      expect(result.pph21).toBe(0);
    });

    it("menangani pembulatan desimal dengan Math.round secara akurat", () => {
      // Misal bruto Rp 5.500.000 @ 0.25% = 13.750
      const result = calculateMonthlyPph21Ter(5_500_000, "TK_0");
      expect(result.terRate).toBe(0.0025);
      expect(result.pph21).toBe(13_750);
    });
  });

  describe("Kalkulasi Tarif Progresif Pasal 17 UU HPP (calculatePasal17Tax)", () => {
    it("mengembalikan 0 untuk PKP <= 0", () => {
      expect(calculatePasal17Tax(0)).toBe(0);
      expect(calculatePasal17Tax(-1000)).toBe(0);
    });

    it("menghitung lapisan pertama (s.d. 60 jt @ 5%)", () => {
      expect(calculatePasal17Tax(50_000_000)).toBe(2_500_000); // 5% * 50 jt
      expect(calculatePasal17Tax(60_000_000)).toBe(3_000_000); // 5% * 60 jt
    });

    it("menghitung lapisan kedua (> 60 jt s.d. 250 jt @ 15%)", () => {
      // PKP 100 jt: 60 jt @ 5% = 3 jt, 40 jt @ 15% = 6 jt -> total 9 jt
      expect(calculatePasal17Tax(100_000_000)).toBe(9_000_000);
      // PKP 250 jt: 60 jt @ 5% = 3 jt, 190 jt @ 15% = 28.5 jt -> total 31.5 jt
      expect(calculatePasal17Tax(250_000_000)).toBe(31_500_000);
    });

    it("menghitung lapisan ketiga (> 250 jt s.d. 500 jt @ 25%)", () => {
      // PKP 300 jt: 31.5 jt + (50 jt @ 25% = 12.5 jt) = 44 jt
      expect(calculatePasal17Tax(300_000_000)).toBe(44_000_000);
    });

    it("menghitung lapisan keempat (> 500 jt s.d. 5 M @ 30%)", () => {
      // PKP 600 jt: 31.5 jt + (250 jt @ 25% = 62.5 jt) + (100 jt @ 30% = 30 jt) = 124 jt
      expect(calculatePasal17Tax(600_000_000)).toBe(124_000_000);
    });

    it("menghitung lapisan kelima (> 5 M @ 35%)", () => {
      // PKP 6 M:
      // 60 jt @ 5% = 3 jt
      // 190 jt @ 15% = 28.5 jt
      // 250 jt @ 25% = 62.5 jt
      // 4.5 M @ 30% = 1.35 M
      // 1 M @ 35% = 350 jt
      // Total = 3 + 28.5 + 62.5 + 1350 + 350 = 1.794 M
      expect(calculatePasal17Tax(6_000_000_000)).toBe(1_794_000_000);
    });
  });

  describe("Kalkulasi PPh 21 Tahunan / Masa Desember (calculateAnnualPph21Pasal17)", () => {
    it("menghitung rekonsiliasi akhir tahun Desember untuk pegawai setahun penuh", () => {
      // Simulasi Pegawai Tetap TK/0:
      // Bruto per bulan Rp 10.000.000 x 12 bulan = Rp 120.000.000
      // Biaya jabatan: 5% x 120 jt = 6 jt (pas cap tahunan Rp 6.000.000)
      // Iuran pensiun/JHT karyawan: Rp 200.000/bln x 12 = Rp 2.400.000
      // Neto setahun = 120 jt - 6 jt - 2.4 jt = 111.600.000
      // PTKP TK/0 = 54.000.000
      // PKP = 111.600.000 - 54.000.000 = 57.600.000
      // PPh 21 setahun (5% x 57.600.000) = 2.880.000
      // Selama Jan-Nov telah dipotong TER A (2% x 10 jt = 200 rb/bln x 11 = 2.200.000)
      // Maka PPh 21 Desember = 2.880.000 - 2.200.000 = 680.000

      const result = calculateAnnualPph21Pasal17({
        annualTaxableGross: 120_000_000,
        ptkp: "TK_0",
        annualPensionDeductions: 2_400_000,
        monthsWorked: 12,
        previousPph21Paid: 2_200_000,
      });

      expect(result.annualTaxableGross).toBe(120_000_000);
      expect(result.annualBiayaJabatan).toBe(6_000_000);
      expect(result.annualPensionDeductions).toBe(2_400_000);
      expect(result.annualNetIncome).toBe(111_600_000);
      expect(result.ptkpAmount).toBe(54_000_000);
      expect(result.pkp).toBe(57_600_000);
      expect(result.annualPph21Payable).toBe(2_880_000);
      expect(result.previousPph21Paid).toBe(2_200_000);
      expect(result.pph21December).toBe(680_000);
    });

    it("menerapkan batasan biaya jabatan proporsional bagi yang bekerja kurang dari 12 bulan", () => {
      // Bekerja 6 bulan: max biaya jabatan = 500.000 * 6 = 3.000.000
      // Bruto 6 bulan = 80.000.000 -> 5% = 4.000.000, dicap ke 3.000.000
      const result = calculateAnnualPph21Pasal17({
        annualTaxableGross: 80_000_000,
        ptkp: "TK_0",
        monthsWorked: 6,
      });

      expect(result.annualBiayaJabatan).toBe(3_000_000);
    });

    it("melakukan pembulatan PKP ke bawah ke ribuan rupiah terdekat (floor to thousand)", () => {
      // Neto - PTKP = 50.123.750 -> PKP harus 50.123.000
      const result = calculateAnnualPph21Pasal17({
        annualTaxableGross: 110_123_750,
        ptkp: "TK_0", // 54.000.000
        annualPensionDeductions: 0,
      });

      // Biaya jabatan: min(6 jt, 5% * 110.123.750 = 5.506.188) = 5.506.188
      // Neto: 110.123.750 - 5.506.188 = 104.617.562
      // Raw PKP: 104.617.562 - 54.000.000 = 50.617.562
      // PKP: 50.617.000
      expect(result.pkp % 1000).toBe(0);
    });

    it("menghasilkan PPh 21 Rp 0 jika penghasilan neto berada di bawah PTKP", () => {
      const result = calculateAnnualPph21Pasal17({
        annualTaxableGross: 45_000_000,
        ptkp: "TK_0", // 54.000.000
      });

      expect(result.pkp).toBe(0);
      expect(result.annualPph21Payable).toBe(0);
      expect(result.pph21December).toBe(0);
    });
  });

  describe("Kalkulasi Premi Asuransi Kantor / Objek Pajak Natura (calculateCompanyTaxableBenefit)", () => {
    it("menghitung premi kantor tepat Rp 363.200 untuk gaji pokok Rp 8.000.000 (Kasus Budi)", () => {
      // Budi: Gaji pokok 8.000.000
      // BPJS Kesehatan kantor (4%): 320.000
      // JKK kantor (0.24%): 19.200
      // JKM kantor (0.30%): 24.000
      // Total: 363.200
      const benefit = calculateCompanyTaxableBenefit(8_000_000);
      expect(benefit.bpjsKesehatan).toBe(320_000);
      expect(benefit.jkk).toBe(19_200);
      expect(benefit.jkm).toBe(24_000);
      expect(benefit.totalBenefit).toBe(363_200);
    });

    it("menerapkan batas maksimal gaji Rp 12.000.000 untuk porsi BPJS Kesehatan lembaga", () => {
      // Gaji 20 jt:
      // BPJS Kesehatan kantor: cap di 12 jt * 4% = 480.000
      // JKK kantor (0.24%): 20 jt * 0.24% = 48.000
      // JKM kantor (0.30%): 20 jt * 0.30% = 60.000
      // Total: 480.000 + 48.000 + 60.000 = 588.000
      const benefit = calculateCompanyTaxableBenefit(20_000_000);
      expect(benefit.bpjsKesehatan).toBe(480_000);
      expect(benefit.jkk).toBe(48_000);
      expect(benefit.jkm).toBe(60_000);
      expect(benefit.totalBenefit).toBe(588_000);
    });

    it("mengembalikan 0 untuk gaji pokok <= 0", () => {
      const benefit = calculateCompanyTaxableBenefit(0);
      expect(benefit.totalBenefit).toBe(0);
    });
  });
});
