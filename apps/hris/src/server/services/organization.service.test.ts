import { describe, it, expect, vi, beforeEach } from "vitest";
import { transferEmployeePosition } from "./organization.service";
import { prisma } from "@pspk/db";

const mockTx = {
  employmentHistory: {
    findFirst: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
  },
  employmentContract: {
    findFirst: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
  },
  employee: {
    update: vi.fn(),
  },
  auditLog: {
    create: vi.fn(),
  },
};

vi.mock("@pspk/db", () => {
  return {
    prisma: {
      employee: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
      },
      position: {
        findUnique: vi.fn(),
      },
      employmentContract: {
        findFirst: vi.fn(),
        update: vi.fn(),
        create: vi.fn(),
      },
      employmentHistory: {
        findFirst: vi.fn(),
        update: vi.fn(),
        create: vi.fn(),
      },
      employmentTypeMaster: {
        findUnique: vi.fn(),
      },
      $transaction: vi.fn(async (cb: (tx: typeof mockTx) => Promise<unknown>) => cb(mockTx)),
    },
    writeAudit: vi.fn(),
  };
});

describe("organization.service.ts - transferEmployeePosition", () => {
  const actor = {
    id: "user-actor-1",
    email: "hr.admin@pspk.id",
    ip: "127.0.0.1",
    userAgent: "Vitest/Test",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("berhasil memproses promosi jabatan dan mengubah status ikatan kerja dari PKWT ke Pegawai Tetap", async () => {
    // 1. Mock Employee
    vi.mocked(prisma.employee.findUnique).mockResolvedValue({
      id: "emp-101",
      fullName: "I Made Aris Danuarta",
      employeeNo: "PSPK-202610-003",
      deletedAt: null,
      currentDepartmentId: "dept-1",
      currentPositionId: "pos-1",
      managerId: "mgr-1",
      endDate: new Date("2026-12-31"),
      currentDepartment: { id: "dept-1", name: "Riset Literasi" },
      currentPosition: { id: "pos-1", title: "Staf Peneliti" },
      manager: { id: "mgr-1", fullName: "Jody Fathurachman" },
    } as unknown as Awaited<ReturnType<typeof prisma.employee.findUnique>>);

    // 2. Mock Target Position
    vi.mocked(prisma.position.findUnique).mockResolvedValue({
      id: "pos-2",
      title: "Lead Researcher",
      departmentId: "dept-2",
      department: { id: "dept-2", name: "Inisiatif Pemantik" },
    } as unknown as Awaited<ReturnType<typeof prisma.position.findUnique>>);

    // 3. Mock Active Contract (PKWT lama)
    vi.mocked(prisma.employmentContract.findFirst).mockResolvedValue({
      id: "contract-old",
      employeeId: "emp-101",
      type: "FIXED_TERM",
      employmentTypeId: "type-pkwt",
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-12-31"),
      baseSalary: 7000000 as unknown,
      wageType: "MONTHLY",
      status: "ACTIVE",
      employmentTypeMaster: {
        id: "type-pkwt",
        name: "PKWT Peneliti",
        category: "FIXED_TERM",
      },
    } as unknown as Awaited<ReturnType<typeof prisma.employmentContract.findFirst>>);

    // 4. Mock Master Tipe Kerja Baru (Pegawai Tetap)
    vi.mocked(prisma.employmentTypeMaster.findUnique).mockResolvedValue({
      id: "type-pkwtt",
      code: "PKWTT",
      name: "Pegawai Tetap (PKWTT)",
      category: "PERMANENT",
      wageType: "MONTHLY",
      defaultHourlyRate: null,
    } as unknown as Awaited<ReturnType<typeof prisma.employmentTypeMaster.findUnique>>);

    // 5. Setup transaction callback behavior using mockTx
    mockTx.employmentHistory.findFirst.mockResolvedValue({
      id: "hist-old",
      employeeId: "emp-101",
      endDate: null,
    });
    mockTx.employmentHistory.update.mockResolvedValue({ id: "hist-old" });
    mockTx.employmentHistory.create.mockImplementation(
      (args: { data: Record<string, unknown> }) => ({
        id: "hist-new",
        ...args.data,
        department: { name: "Inisiatif Pemantik" },
        position: { title: "Lead Researcher" },
      }),
    );

    mockTx.employmentContract.update.mockResolvedValue({ id: "contract-old", status: "RENEWED" });
    mockTx.employmentContract.create.mockImplementation(
      (args: { data: Record<string, unknown> }) => ({
        id: "contract-new",
        ...args.data,
      }),
    );

    mockTx.employee.update.mockResolvedValue({
      id: "emp-101",
      currentDepartmentId: "dept-2",
      currentPositionId: "pos-2",
      managerId: null,
      endDate: null,
      currentDepartment: { name: "Inisiatif Pemantik" },
      currentPosition: { title: "Lead Researcher" },
      manager: null,
    });

    // Execute transfer
    const result = await transferEmployeePosition(
      {
        employeeId: "emp-101",
        departmentId: "dept-2",
        positionId: "pos-2",
        managerId: null,
        effectiveDate: "2026-11-01",
        transferType: "PROMOTION",
        employmentType: "PERMANENT",
        employmentTypeId: "type-pkwtt",
        newBaseSalary: 9500000,
        skNumber: "045/SK-DIR/PSPK/X/2026",
        notes: "Promosi kinerja semester II dan pengangkatan tetap",
        documentKey: "sk-mutasi/emp-101_172000000_sk_promosi.pdf",
      },
      actor,
    );

    expect(result).toBeDefined();
    expect(result.updatedEmployee).toBeDefined();
    expect(result.newHistory).toBeDefined();
    expect(result.newContract).toBeDefined();

    // Pastikan riwayat jabatan mencatat perubahan ikatan kerja dan SK/Kontrak
    expect(result.newHistory.notes).toContain("Promosi Jabatan");
    expect(result.newHistory.notes).toContain("[SK/Kontrak: 045/SK-DIR/PSPK/X/2026]");
    expect(result.newHistory.notes).toContain("PKWT Peneliti ➔ Pegawai Tetap (PKWTT)");
    expect(result.newHistory.documentKey).toBe("sk-mutasi/emp-101_172000000_sk_promosi.pdf");

    // Pastikan kontrak baru dibuat dengan tipe PERMANENT dan nilai gaji baru
    expect(result.newContract?.type).toBe("PERMANENT");
    expect(result.newContract?.baseSalary).toBe(9500000);
    expect(result.newContract?.status).toBe("ACTIVE");
    expect(result.newContract?.endDate).toBeNull();
  });
});
