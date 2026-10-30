import { describe, it, expect, vi } from "vitest";
import ExcelJS from "exceljs";
import { generatePayrollExcelExport } from "./payroll-export";
import { prisma, Prisma } from "@pspk/db";

vi.mock("@pspk/db", () => ({
  Prisma: {
    Decimal: class MockDecimal {
      value: number;
      constructor(val: number) {
        this.value = val;
      }
      toNumber() {
        return this.value;
      }
      valueOf() {
        return this.value;
      }
    },
  },
  prisma: {
    payrollPeriod: {
      findUnique: vi.fn(),
    },
    payrollSetting: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock("@pspk/shared", () => ({
  decryptField: vi.fn((val: string) => `decrypted_${val}`),
}));

describe("generatePayrollExcelExport", () => {
  it("harus menghasilkan berkas Excel (.xlsx) dengan 3 sheet dan formula yang tepat", async () => {
    vi.mocked(prisma.payrollSetting.findFirst).mockResolvedValue({
      id: "setting-1",
      institutionName: "Pusat Studi Pendidikan & Kebijakan",
      subHeader: "HR & Finance",
      addressLine: "Jakarta",
      logoKey: null,
      headerBannerKey: null,
      borderStyle: "NAVY_SOLID",
      disclaimerText: "Sah secara elektronik",
      senderBankName: "Bank Central Asia (BCA)",
      senderBankAccountEnc: "enc_12345",
      senderAccountName: "PSPK Official",
      senderBranch: "KCU Jakarta",
      payrollTransferNote: "Payroll Gaji",
      authorizedSignerName: "Vinda Permata Andini",
      authorizedSignerTitle: "HR Admin",
      signatureKey: null,
      stampKey: null,
      isDefault: true,
      updatedByUserId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(prisma.payrollPeriod.findUnique).mockResolvedValue({
      id: "period-1",
      year: 2026,
      month: 10,
      kind: "REGULAR",
      status: "APPROVED",
      cutoffDate: new Date("2026-10-25"),
      lockedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      payslips: [
        {
          id: "slip-1",
          periodId: "period-1",
          employeeId: "emp-1",
          grossAmount: new Prisma.Decimal(11000000),
          totalDeduction: new Prisma.Decimal(400000),
          netAmount: new Prisma.Decimal(10600000),
          wageType: "MONTHLY",
          totalHours: null,
          hourlyRate: null,
          timesheetKey: null,
          status: "APPROVED",
          publishedAt: null,
          pdfKey: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          employee: {
            id: "emp-1",
            employeeNo: "PSPK-202610-001",
            fullName: "Pegawai Satu",
            bankName: "Bank Mandiri",
            bankAccountEnc: "enc_9999",
            bankAccountName: "Pegawai Satu",
            currentDepartment: { id: "d1", name: "Riset Kebijakan" },
            currentPosition: { id: "p1", title: "Peneliti Muda" },
          },
          lines: [
            { id: "l1", payslipId: "slip-1", componentId: "c1", label: "Gaji Pokok", type: "EARNING", amount: new Prisma.Decimal(9000000) },
            { id: "l2", payslipId: "slip-1", componentId: "c2", label: "Tunjangan Jabatan & Keahlian", type: "EARNING", amount: new Prisma.Decimal(1000000) },
            { id: "l3", payslipId: "slip-1", componentId: "c3", label: "Tunjangan Komunikasi", type: "EARNING", amount: new Prisma.Decimal(500000) },
            { id: "l4", payslipId: "slip-1", componentId: "c4", label: "Tunjangan Transport", type: "EARNING", amount: new Prisma.Decimal(500000) },
            { id: "l5", payslipId: "slip-1", componentId: "c5", label: "Iuran BPJS Kesehatan", type: "DEDUCTION", amount: new Prisma.Decimal(100000) },
            { id: "l6", payslipId: "slip-1", componentId: "c6", label: "Iuran BPJS Ketenagakerjaan", type: "DEDUCTION", amount: new Prisma.Decimal(200000) },
            { id: "l7", payslipId: "slip-1", componentId: "c7", label: "PPh Pasal 21", type: "DEDUCTION", amount: new Prisma.Decimal(100000) },
          ],
        },
        {
          id: "slip-2",
          periodId: "period-1",
          employeeId: "emp-2",
          grossAmount: new Prisma.Decimal(4950000),
          totalDeduction: new Prisma.Decimal(0),
          netAmount: new Prisma.Decimal(4950000),
          wageType: "HOURLY",
          totalHours: new Prisma.Decimal(165),
          hourlyRate: new Prisma.Decimal(30000),
          timesheetKey: "https://docs.google.com/spreadsheets/d/abc",
          status: "APPROVED",
          publishedAt: null,
          pdfKey: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          employee: {
            id: "emp-2",
            employeeNo: "PSPK-202610-002",
            fullName: "Staf Freelance Jam",
            bankName: "BCA",
            bankAccountEnc: null,
            bankAccountName: null,
            currentDepartment: { id: "d2", name: "Operasional" },
            currentPosition: { id: "p2", title: "Asisten Riset" },
          },
          lines: [
            { id: "l8", payslipId: "slip-2", componentId: null, label: "Upah Jam Kerja Timesheet (165 jam @ Rp 30.000)", type: "EARNING", amount: new Prisma.Decimal(4950000) },
          ],
        },
      ],
    } as unknown as NonNullable<Awaited<ReturnType<typeof prisma.payrollPeriod.findUnique>>>);

    const result = await generatePayrollExcelExport("period-1");

    expect(result.filename).toBe("Rekap_Payroll_PSPK_2026_10_REGULAR.xlsx");
    expect(result.base64).toBeDefined();
    expect(typeof result.base64).toBe("string");
    expect(result.base64.length).toBeGreaterThan(0);

    // Muat workbook dari base64 dan verifikasi isi sheet
    const wb = new ExcelJS.Workbook();
    const buffer = Buffer.from(result.base64, "base64") as unknown as ExcelJS.Buffer;
    await wb.xlsx.load(buffer);

    const wsNames = wb.worksheets.map((w) => w.name);
    expect(wsNames).toContain("Rekap Transfer Bank");
    expect(wsNames).toContain("Rincian Komponen Gaji");
    expect(wsNames).toContain("Ringkasan Eksekutif");

    // Verifikasi Sheet 1: Rekap Transfer Bank
    const wsBank = wb.getWorksheet("Rekap Transfer Bank");
    expect(wsBank).toBeDefined();
    const rowPegawai1 = wsBank!.getRow(7);
    expect(rowPegawai1.getCell(2).value).toBe("PSPK-202610-001");
    expect(rowPegawai1.getCell(3).value).toBe("Pegawai Satu");
    expect(rowPegawai1.getCell(8).value).toBe("decrypted_enc_9999");
    expect(rowPegawai1.getCell(10).value).toBe(10600000);

    // Verifikasi Sheet 2: Rincian Komponen Gaji
    const wsLedger = wb.getWorksheet("Rincian Komponen Gaji");
    expect(wsLedger).toBeDefined();
    const ledgerRow1 = wsLedger!.getRow(7);
    expect(ledgerRow1.getCell(8).value).toBe(9000000); // Gaji Pokok
    expect(ledgerRow1.getCell(9).value).toBe(1000000); // Tunj. Jabatan
    expect(ledgerRow1.getCell(13).value).toEqual({ formula: "SUM(H7:L7)" }); // Gross formula
    expect(ledgerRow1.getCell(18).value).toEqual({ formula: "SUM(N7:Q7)" }); // Deduction formula
    expect(ledgerRow1.getCell(19).value).toEqual({ formula: "M7-R7" }); // Net formula

    // Verifikasi Sheet 3: Ringkasan Eksekutif
    const wsSummary = wb.getWorksheet("Ringkasan Eksekutif");
    expect(wsSummary).toBeDefined();
  });

  it("harus throw error jika periode tidak ditemukan", async () => {
    vi.mocked(prisma.payrollPeriod.findUnique).mockResolvedValue(null);
    await expect(generatePayrollExcelExport("invalid-id")).rejects.toThrow("Periode penggajian tidak ditemukan.");
  });
});
