import { describe, it, expect } from "vitest";

describe("Formula Kalkulasi Payroll PSPK", () => {
  it("menghitung gaji bruto dan take-home pay dengan tunjangan tetap dan potongan persentase", () => {
    const baseSalary = 10000000; // Rp 10.000.000
    const fixedTransport = 1000000;
    const fixedKomunikasi = 500000;
    const fixedJabatan = 2500000;

    const bpjsKesPercent = 1.0; // 1%
    const bpjsJhtPercent = 2.0; // 2%
    const bpjsJpPercent = 1.0; // 1%

    const totalEarnings = baseSalary + fixedTransport + fixedKomunikasi + fixedJabatan;
    expect(totalEarnings).toBe(14000000);

    const bpjsKes = Math.round((bpjsKesPercent / 100) * baseSalary);
    const bpjsJht = Math.round((bpjsJhtPercent / 100) * baseSalary);
    const bpjsJp = Math.round((bpjsJpPercent / 100) * baseSalary);

    expect(bpjsKes).toBe(100000);
    expect(bpjsJht).toBe(200000);
    expect(bpjsJp).toBe(100000);

    const totalDeductions = bpjsKes + bpjsJht + bpjsJp;
    expect(totalDeductions).toBe(400000);

    const netAmount = totalEarnings - totalDeductions;
    expect(netAmount).toBe(13600000);
  });

  it("mencegah gaji bersih (netto) menjadi bernilai negatif", () => {
    const totalGross = 5000000;
    const totalDeductions = 6000000;
    const netAmount = Math.max(0, totalGross - totalDeductions);
    expect(netAmount).toBe(0);
  });
});
