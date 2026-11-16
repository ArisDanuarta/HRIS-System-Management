import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockPayrollPeriodFindUnique,
  mockPayrollPeriodUpdate,
  mockEmployeeFindMany,
  mockSalaryComponentFindMany,
  mockPayslipFindMany,
  mockPayslipDeleteMany,
  mockPayslipCreate,
  mockPayslipUpdate,
  mockPayslipLineDeleteMany,
  mockTimesheetSubmissionFindMany,
  mockTimesheetSubmissionUpdate,
  mockGetTimesheetValidation,
  mockWriteAudit,
} = vi.hoisted(() => ({
  mockPayrollPeriodFindUnique: vi.fn(),
  mockPayrollPeriodUpdate: vi.fn(),
  mockEmployeeFindMany: vi.fn(),
  mockSalaryComponentFindMany: vi.fn(),
  mockPayslipFindMany: vi.fn(),
  mockPayslipDeleteMany: vi.fn(),
  mockPayslipCreate: vi.fn(),
  mockPayslipUpdate: vi.fn(),
  mockPayslipLineDeleteMany: vi.fn(),
  mockTimesheetSubmissionFindMany: vi.fn(),
  mockTimesheetSubmissionUpdate: vi.fn(),
  mockGetTimesheetValidation: vi.fn(),
  mockWriteAudit: vi.fn(),
}));

vi.mock("@/server/queries/timesheet.queries", () => ({
  getTimesheetValidationForPayroll: (...args: unknown[]) => mockGetTimesheetValidation(...args),
}));

vi.mock("@pspk/db", () => {
  const prismaMock: Record<string, unknown> = {
    payrollPeriod: {
      findUnique: (...args: unknown[]) => mockPayrollPeriodFindUnique(...args),
      update: (...args: unknown[]) => mockPayrollPeriodUpdate(...args),
    },
    employee: {
      findMany: (...args: unknown[]) => mockEmployeeFindMany(...args),
    },
    salaryComponent: {
      findMany: (...args: unknown[]) => mockSalaryComponentFindMany(...args),
    },
    payslip: {
      findMany: (...args: unknown[]) => mockPayslipFindMany(...args),
      deleteMany: (...args: unknown[]) => mockPayslipDeleteMany(...args),
      create: (...args: unknown[]) => mockPayslipCreate(...args),
      update: (...args: unknown[]) => mockPayslipUpdate(...args),
    },
    payslipLine: {
      deleteMany: (...args: unknown[]) => mockPayslipLineDeleteMany(...args),
    },
    timesheetSubmission: {
      findMany: (...args: unknown[]) => mockTimesheetSubmissionFindMany(...args),
      update: (...args: unknown[]) => mockTimesheetSubmissionUpdate(...args),
    },
  };

  prismaMock.$transaction = vi.fn(async (cb: unknown) => {
    if (typeof cb === "function") {
      return (cb as (tx: unknown) => unknown)(prismaMock);
    }
    return Promise.all(cb as unknown[]);
  });

  return {
    prisma: prismaMock,
    writeAudit: (...args: unknown[]) => mockWriteAudit(...args),
  };
});

import { calculatePeriodPayroll } from "./payroll.service";

describe("payroll.service - Kalkulasi PPh 21 Terintegrasi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetTimesheetValidation.mockResolvedValue({ canProceed: true, blockers: [] });
    mockPayslipFindMany.mockResolvedValue([]);
    mockTimesheetSubmissionFindMany.mockResolvedValue([]);
    mockPayslipDeleteMany.mockResolvedValue({ count: 0 });
    mockPayslipCreate.mockResolvedValue({ id: "slip-created" });
    mockPayrollPeriodUpdate.mockResolvedValue({ id: "period-1", status: "CALCULATED" });
  });

  it("Kasus Budi: Menghitung PPh 21 Metode Gross (TER A 1.75%) tepat Rp163.856 dan THP tepat Rp8.516.144", async () => {
    // Periode bulan Oktober (Masa 10)
    mockPayrollPeriodFindUnique.mockResolvedValue({
      id: "period-10",
      year: 2026,
      month: 10,
      status: "DRAFT",
    });

    // Karyawan Budi: Gaji pokok 8.000.000, Transport 1.000.000, Status PTKP TK/0, Metode GROSS
    mockEmployeeFindMany.mockResolvedValue([
      {
        id: "emp-budi",
        fullName: "Budi Santoso",
        employeeNo: "PSPK-001",
        status: "ACTIVE",
        ptkpStatus: "TK_0",
        taxMethod: "GROSS",
        contracts: [
          {
            id: "contract-budi",
            wageType: "MONTHLY",
            baseSalary: 8000000,
            hourlyRate: null,
            status: "ACTIVE",
          },
        ],
        salaryComponents: [],
      },
    ]);

    // Master Komponen: Gaji Pokok, Tunjangan Transport (Rp1.000.000 fixed), BPJS Kes (1%), BPJS JHT (2%), BPJS JP (1%), plus legacy PPh 21
    mockSalaryComponentFindMany.mockResolvedValue([
      {
        id: "comp-base",
        code: "BASE_SALARY",
        name: "Gaji Pokok",
        type: "EARNING",
        calcType: "FIXED",
        defaultValue: 0,
        isActive: true,
      },
      {
        id: "comp-transport",
        code: "TUNJ_TRANSPORT",
        name: "Tunjangan Transport",
        type: "EARNING",
        calcType: "FIXED",
        defaultValue: 1000000,
        isActive: true,
      },
      {
        id: "comp-bpjs-kes",
        code: "POT_BPJS_KES",
        name: "BPJS Kesehatan (1%)",
        type: "DEDUCTION",
        calcType: "PERCENT_OF_BASE",
        defaultValue: 1, // 1%
        isActive: true,
      },
      {
        id: "comp-bpjs-jht",
        code: "POT_BPJS_JHT",
        name: "BPJS JHT (2%)",
        type: "DEDUCTION",
        calcType: "PERCENT_OF_BASE",
        defaultValue: 2, // 2%
        isActive: true,
      },
      {
        id: "comp-bpjs-jp",
        code: "POT_BPJS_JP",
        name: "BPJS JP (1%)",
        type: "DEDUCTION",
        calcType: "PERCENT_OF_BASE",
        defaultValue: 1, // 1%
        isActive: true,
      },
      {
        id: "comp-legacy-tax",
        code: "POT_PPH21",
        name: "Potongan PPh 21 (Lama)",
        type: "DEDUCTION",
        calcType: "MANUAL",
        defaultValue: 0,
        isActive: true,
      },
    ]);

    const result = await calculatePeriodPayroll("period-10");

    expect(result.totalProcessed).toBe(1);
    expect(result.skippedWithoutContract).toHaveLength(0);

    // Ambil parameter data yang dikirim ke tx.payslip.create
    expect(mockPayslipCreate).toHaveBeenCalledTimes(1);
    const createdData = mockPayslipCreate.mock.calls[0]![0].data;

    // 1. Verifikasi Penghasilan Tunai (Cash Gross): 8 jt + 1 jt = 9.000.000
    expect(createdData.grossAmount).toBe(9000000);

    // 2. Verifikasi Dasar Pengenaan Pajak (DPP / Taxable Gross):
    // Tunai 9.000.000 + Premi Lembaga 363.200 (Kes 320 rb + JKK 19.200 + JKM 24 rb) = 9.363.200
    expect(createdData.taxableGross).toBe(9363200);

    // 3. Verifikasi PPh 21: TER A 1.75% dari 9.363.200 = Tepat Rp163.856
    expect(createdData.pph21Amount).toBe(163856);
    expect(createdData.terCategory).toBe("TER_A");
    expect(createdData.terRate).toBe(0.0175);

    // 4. Verifikasi Potongan Total:
    // BPJS Kes (80.000) + JHT (160.000) + JP (80.000) + PPh 21 (163.856) = Rp483.856
    expect(createdData.totalDeduction).toBe(483856);

    // 5. Verifikasi Take Home Pay (THP):
    // 9.000.000 - 483.856 = Tepat Rp8.516.144
    expect(createdData.netAmount).toBe(8516144);

    // 6. Verifikasi Rincian Lines
    const lines = createdData.lines.create;
    const pphLine = lines.find((l: { label: string }) => l.label.includes("PPh 21"));
    expect(pphLine).toBeDefined();
    expect(pphLine.type).toBe("DEDUCTION");
    expect(pphLine.amount).toBe(163856);
    expect(pphLine.label).toBe("PPh 21 (TER A 1.75%)");

    // Pastikan komponen legacy PPh 21 diabaikan dan tidak diduplikasi
    const legacyLine = lines.find((l: { label: string }) => l.label.includes("Lama"));
    expect(legacyLine).toBeUndefined();
  });

  it("Metode GROSS_UP: Memberikan tunjangan pajak sehingga THP tidak berkurang oleh potongan PPh 21", async () => {
    mockPayrollPeriodFindUnique.mockResolvedValue({
      id: "period-10",
      year: 2026,
      month: 10,
      status: "DRAFT",
    });

    mockEmployeeFindMany.mockResolvedValue([
      {
        id: "emp-andi",
        fullName: "Andi Wijaya",
        employeeNo: "PSPK-002",
        status: "ACTIVE",
        ptkpStatus: "TK_0",
        taxMethod: "GROSS_UP",
        contracts: [
          {
            id: "contract-andi",
            wageType: "MONTHLY",
            baseSalary: 8000000,
            hourlyRate: null,
            status: "ACTIVE",
          },
        ],
        salaryComponents: [],
      },
    ]);

    mockSalaryComponentFindMany.mockResolvedValue([]);

    await calculatePeriodPayroll("period-10");

    const createdData = mockPayslipCreate.mock.calls[0]![0].data;
    const lines = createdData.lines.create;

    // Ada baris Tunjangan PPh 21 (Gross Up) di EARNING
    const allowanceLine = lines.find((l: { label: string }) =>
      l.label.includes("Tunjangan PPh 21 (Gross Up)"),
    );
    expect(allowanceLine).toBeDefined();
    expect(allowanceLine.type).toBe("EARNING");
    expect(allowanceLine.amount).toBe(createdData.pph21Amount);

    // Ada baris Potongan PPh 21 di DEDUCTION
    const deductionLine = lines.find(
      (l: { label: string; type: string }) =>
        l.type === "DEDUCTION" && l.label.includes("PPh 21"),
    );
    expect(deductionLine).toBeDefined();
    expect(deductionLine.amount).toBe(createdData.pph21Amount);

    // THP pegawai utuh sebesar Gaji Pokok (8.000.000)
    expect(createdData.netAmount).toBe(8000000);
  });

  it("Metode NETT: Mencatat metadata pajak tanpa memotong gaji tunai pegawai", async () => {
    mockPayrollPeriodFindUnique.mockResolvedValue({
      id: "period-10",
      year: 2026,
      month: 10,
      status: "DRAFT",
    });

    mockEmployeeFindMany.mockResolvedValue([
      {
        id: "emp-siti",
        fullName: "Siti Rahma",
        employeeNo: "PSPK-003",
        status: "ACTIVE",
        ptkpStatus: "TK_0",
        taxMethod: "NETT",
        contracts: [
          {
            id: "contract-siti",
            wageType: "MONTHLY",
            baseSalary: 8000000,
            hourlyRate: null,
            status: "ACTIVE",
          },
        ],
        salaryComponents: [],
      },
    ]);

    mockSalaryComponentFindMany.mockResolvedValue([]);

    await calculatePeriodPayroll("period-10");

    const createdData = mockPayslipCreate.mock.calls[0]![0].data;
    const lines = createdData.lines.create;

    // Pajak tetap terhitung di metadata slip
    expect(createdData.pph21Amount).toBeGreaterThan(0);

    // Tidak ada baris potongan PPh 21
    const taxLine = lines.find((l: { label: string }) => l.label.includes("PPh 21"));
    expect(taxLine).toBeUndefined();

    // THP utuh 8.000.000
    expect(createdData.netAmount).toBe(8000000);
  });

  it("Masa Desember (Bulan 12): Menjalankan rekonsiliasi tahunan Pasal 17 UU HPP", async () => {
    mockPayrollPeriodFindUnique.mockResolvedValue({
      id: "period-12",
      year: 2026,
      month: 12,
      status: "DRAFT",
    });

    mockEmployeeFindMany.mockResolvedValue([
      {
        id: "emp-budi",
        fullName: "Budi Santoso",
        employeeNo: "PSPK-001",
        status: "ACTIVE",
        ptkpStatus: "TK_0",
        taxMethod: "GROSS",
        contracts: [
          {
            id: "contract-budi",
            wageType: "MONTHLY",
            baseSalary: 8000000,
            hourlyRate: null,
            status: "ACTIVE",
          },
        ],
        salaryComponents: [],
      },
    ]);

    mockSalaryComponentFindMany.mockResolvedValue([]);

    // Mock akumulasi 11 bulan sebelumnya (Jan-Nov)
    // Tiap bulan taxableGross: 8.363.200 (8 jt gaji + 363.200 premi lembaga), pph21: 125.448 (TER A 1.5%)
    const pastSlips = Array.from({ length: 11 }, () => ({
      employeeId: "emp-budi",
      taxableGross: 8363200,
      grossAmount: 8000000,
      pph21Amount: 125448,
      lines: [
        { type: "DEDUCTION", label: "PPh 21 (TER A 1.5%)", amount: 125448 },
        { type: "DEDUCTION", label: "BPJS JHT (2%)", amount: 160000 },
      ],
    }));
    mockPayslipFindMany.mockResolvedValue(pastSlips);

    await calculatePeriodPayroll("period-12");

    const createdData = mockPayslipCreate.mock.calls[0]![0].data;

    // Verifikasi kategori Pasal 17
    expect(createdData.terCategory).toBe("PASAL_17");
    expect(createdData.terRate).toBeNull();

    // Verifikasi label line slip
    const lines = createdData.lines.create;
    const taxLine = lines.find((l: { label: string }) => l.label.includes("Pasal 17"));
    expect(taxLine).toBeDefined();
    expect(taxLine.label).toBe("PPh 21 (Pasal 17 Desember)");
  });

  it("Pegawai Per Jam (HOURLY): Menghitung TER dari upah jam kerja tanpa premi lembaga", async () => {
    mockPayrollPeriodFindUnique.mockResolvedValue({
      id: "period-10",
      year: 2026,
      month: 10,
      status: "DRAFT",
    });

    mockEmployeeFindMany.mockResolvedValue([
      {
        id: "emp-freelance",
        fullName: "Dedi Riset",
        employeeNo: "PSPK-004",
        status: "ACTIVE",
        ptkpStatus: "TK_0",
        taxMethod: "GROSS",
        contracts: [
          {
            id: "contract-freelance",
            wageType: "HOURLY",
            baseSalary: null,
            hourlyRate: 50000,
            status: "ACTIVE",
          },
        ],
        salaryComponents: [],
      },
    ]);

    mockSalaryComponentFindMany.mockResolvedValue([]);
    // 100 jam ter-ACC = Rp 5.000.000
    mockTimesheetSubmissionFindMany.mockResolvedValue([
      {
        id: "ts-1",
        employeeId: "emp-freelance",
        totalHours: 100,
        status: "APPROVED",
        spreadsheetUrl: "https://docs.google.com/timesheet-dedi",
      },
    ]);

    await calculatePeriodPayroll("period-10");

    const createdData = mockPayslipCreate.mock.calls[0]![0].data;

    // 100 jam x 50.000 = 5.000.000
    expect(createdData.grossAmount).toBe(5000000);
    // Tidak ada premi kantor lembaga untuk pekerja per jam
    expect(createdData.taxableGross).toBe(5000000);
    // Rp 5.000.000 pada TER A (sampai 5.4 jt) tarifnya 0%
    expect(createdData.pph21Amount).toBe(0);
    expect(createdData.terRate).toBe(0);
    expect(createdData.netAmount).toBe(5000000);
  });

  it("Kasus Karyawan K/1 (TER B): Gaji Pokok 12 jt -> DPP 12.544.800 -> TER B 3% tepat Rp376.344", async () => {
    mockPayrollPeriodFindUnique.mockResolvedValue({
      id: "period-10",
      year: 2026,
      month: 10,
      status: "DRAFT",
    });

    mockEmployeeFindMany.mockResolvedValue([
      {
        id: "emp-dewi",
        fullName: "Dewi Lestari",
        employeeNo: "PSPK-005",
        status: "ACTIVE",
        ptkpStatus: "K_1",
        taxMethod: "GROSS",
        contracts: [
          {
            id: "contract-dewi",
            wageType: "MONTHLY",
            baseSalary: 12000000,
            hourlyRate: null,
            status: "ACTIVE",
          },
        ],
        salaryComponents: [],
      },
    ]);

    mockSalaryComponentFindMany.mockResolvedValue([]);

    await calculatePeriodPayroll("period-10");

    const createdData = mockPayslipCreate.mock.calls[0]![0].data;

    // Gaji pokok 12.000.000
    expect(createdData.grossAmount).toBe(12000000);
    // Premi lembaga: BPJS Kes (max base 12 jt x 4% = 480.000) + JKK (12 jt x 0.24% = 28.800) + JKM (12 jt x 0.30% = 36.000) = 544.800
    // DPP = 12.000.000 + 544.800 = 12.544.800
    expect(createdData.taxableGross).toBe(12544800);
    expect(createdData.terCategory).toBe("TER_B");
    expect(createdData.terRate).toBe(0.03); // 3%
    // PPh 21 = 12.544.800 x 3% = 376.344
    expect(createdData.pph21Amount).toBe(376344);
    expect(createdData.netAmount).toBe(12000000 - 376344);
  });

  it("Kompensasi Satu Pintu: Menghitung tunjangan perorangan dari salaryComponents dan mencegah kebocoran ke staf lain", async () => {
    mockPayrollPeriodFindUnique.mockResolvedValue({
      id: "period-11",
      year: 2026,
      month: 11,
      status: "DRAFT",
    });

    const compTransport = {
      id: "comp-trans",
      code: "ALLOWANCE_TRANSPORT",
      name: "Tunjangan Transportasi",
      type: "EARNING",
      calcType: "FIXED",
      defaultValue: 0, // master default 0
      isActive: true,
    };
    const compPosition = {
      id: "comp-pos",
      code: "ALLOWANCE_POSITION",
      name: "Tunjangan Jabatan",
      type: "EARNING",
      calcType: "FIXED",
      defaultValue: 0, // master default 0
      isActive: true,
    };

    mockEmployeeFindMany.mockResolvedValue([
      {
        id: "emp-lead",
        fullName: "Ahmad Ketua Tim",
        employeeNo: "PSPK-010",
        status: "ACTIVE",
        ptkpStatus: "TK_0",
        taxMethod: "GROSS",
        contracts: [
          {
            id: "contract-lead",
            wageType: "MONTHLY",
            baseSalary: 10000000,
            hourlyRate: null,
            status: "ACTIVE",
          },
        ],
        // Pegawai ini memiliki tunjangan jabatan & transport
        salaryComponents: [
          {
            id: "esc-1",
            componentId: "comp-pos",
            amount: 2500000,
          },
          {
            id: "esc-2",
            componentId: "comp-trans",
            amount: 750000,
          },
        ],
      },
      {
        id: "emp-staff",
        fullName: "Siti Staf Junior",
        employeeNo: "PSPK-011",
        status: "ACTIVE",
        ptkpStatus: "TK_0",
        taxMethod: "GROSS",
        contracts: [
          {
            id: "contract-staff",
            wageType: "MONTHLY",
            baseSalary: 6000000,
            hourlyRate: null,
            status: "ACTIVE",
          },
        ],
        // Pegawai ini tidak memiliki tunjangan apa pun
        salaryComponents: [],
      },
    ]);

    mockSalaryComponentFindMany.mockResolvedValue([compTransport, compPosition]);

    await calculatePeriodPayroll("period-11");

    expect(mockPayslipCreate).toHaveBeenCalledTimes(2);

    const callLead = mockPayslipCreate.mock.calls.find(
      (c) => c[0].data.employeeId === "emp-lead",
    );
    const callStaff = mockPayslipCreate.mock.calls.find(
      (c) => c[0].data.employeeId === "emp-staff",
    );

    expect(callLead).toBeDefined();
    expect(callStaff).toBeDefined();

    // Lead: Gaji pokok 10 jt + TJ Jabatan 2.5 jt + TJ Transport 750k = 13.250.000
    expect(callLead![0].data.grossAmount).toBe(13250000);
    const leadLines = callLead![0].data.lines.create;
    expect(leadLines.some((l: { label: string; amount: number }) => l.label === "Tunjangan Jabatan" && l.amount === 2500000)).toBe(true);
    expect(leadLines.some((l: { label: string; amount: number }) => l.label === "Tunjangan Transportasi" && l.amount === 750000)).toBe(true);

    // Staff: Gaji pokok 6 jt saja, tidak boleh mendapat tunjangan jabatan atau transport
    expect(callStaff![0].data.grossAmount).toBe(6000000);
    const staffLines = callStaff![0].data.lines.create;
    expect(staffLines.some((l: { label: string }) => l.label === "Tunjangan Jabatan")).toBe(false);
    expect(staffLines.some((l: { label: string }) => l.label === "Tunjangan Transportasi")).toBe(false);
  });
});
