import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockHolidayFindMany,
  mockLeaveRequestFindMany,
  mockLeaveTypeFindUnique,
  mockEmployeeFindUnique,
  mockLeaveBalanceFindUnique,
  mockLeaveRequestCreate,
  mockWriteAudit,
} = vi.hoisted(() => ({
  mockHolidayFindMany: vi.fn(),
  mockLeaveRequestFindMany: vi.fn(),
  mockLeaveTypeFindUnique: vi.fn(),
  mockEmployeeFindUnique: vi.fn(),
  mockLeaveBalanceFindUnique: vi.fn(),
  mockLeaveRequestCreate: vi.fn(),
  mockWriteAudit: vi.fn(),
}));

vi.mock("@pspk/db", () => {
  const prismaMock: Record<string, unknown> = {
    holiday: {
      findMany: (...args: unknown[]) => mockHolidayFindMany(...args),
    },
    leaveRequest: {
      findMany: (...args: unknown[]) => mockLeaveRequestFindMany(...args),
      create: (...args: unknown[]) => mockLeaveRequestCreate(...args),
    },
    leaveType: {
      findUnique: (...args: unknown[]) => mockLeaveTypeFindUnique(...args),
    },
    employee: {
      findUnique: (...args: unknown[]) => mockEmployeeFindUnique(...args),
    },
    leaveBalance: {
      findUnique: (...args: unknown[]) => mockLeaveBalanceFindUnique(...args),
    },
  };
  prismaMock.$transaction = vi.fn(async (cb: unknown) =>
    typeof cb === "function" ? (cb as (tx: unknown) => unknown)(prismaMock) : Promise.all(cb as unknown[]),
  );

  return {
    prisma: prismaMock,
    writeAudit: (...args: unknown[]) => mockWriteAudit(...args),
  };
});

import { submitLeaveRequest } from "./leave.service";

describe("submitLeaveRequest - Gender Restriction Scenarios", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHolidayFindMany.mockResolvedValue([]);
    mockLeaveRequestFindMany.mockResolvedValue([]);
  });

  it("menolak jika pegawai pria mencoba mengajukan cuti khusus wanita (misal: Cuti Melahirkan)", async () => {
    mockLeaveTypeFindUnique.mockResolvedValue({
      id: "lt-maternity",
      name: "Cuti Melahirkan",
      isActive: true,
      applicableGender: "FEMALE",
      requiresAttachment: false,
      defaultQuotaDays: 90,
    });

    // Pegawai pria
    mockEmployeeFindUnique.mockResolvedValue({
      gender: "MALE",
    });

    await expect(
      submitLeaveRequest(
        "emp-male-1",
        {
          leaveTypeId: "lt-maternity",
          startDate: "2026-11-02", // Monday
          endDate: "2026-11-06",   // Friday
          reason: "Permohonan melahirkan",
        },
        "user-1",
      ),
    ).rejects.toThrow("khusus diperuntukkan bagi pegawai perempuan (wanita)");
  });

  it("mengizinkan jika pegawai wanita mengajukan cuti khusus wanita (Cuti Melahirkan)", async () => {
    mockLeaveTypeFindUnique.mockResolvedValue({
      id: "lt-maternity",
      name: "Cuti Melahirkan",
      isActive: true,
      applicableGender: "FEMALE",
      requiresAttachment: false,
      defaultQuotaDays: 90,
    });

    // Pegawai wanita
    mockEmployeeFindUnique.mockResolvedValue({
      gender: "FEMALE",
    });

    mockLeaveBalanceFindUnique.mockResolvedValue({
      quotaDays: 90,
      usedDays: 0,
    });

    mockLeaveRequestCreate.mockResolvedValue({
      id: "lr-new-1",
      employeeId: "emp-female-1",
      leaveTypeId: "lt-maternity",
      days: 5,
      status: "PENDING",
    });

    const res = await submitLeaveRequest(
      "emp-female-1",
      {
        leaveTypeId: "lt-maternity",
        startDate: "2026-11-02",
        endDate: "2026-11-06",
        reason: "Cuti melahirkan anak pertama",
      },
      "user-2",
    );

    expect(res).toBeDefined();
    expect(res.id).toBe("lr-new-1");
  });

  it("menolak jika pegawai wanita mencoba mengajukan cuti khusus pria (misal: Cuti Istri Melahirkan)", async () => {
    mockLeaveTypeFindUnique.mockResolvedValue({
      id: "lt-paternity",
      name: "Cuti Istri Melahirkan",
      isActive: true,
      applicableGender: "MALE",
      requiresAttachment: false,
      defaultQuotaDays: 2,
    });

    mockEmployeeFindUnique.mockResolvedValue({
      gender: "FEMALE",
    });

    await expect(
      submitLeaveRequest(
        "emp-female-1",
        {
          leaveTypeId: "lt-paternity",
          startDate: "2026-11-02",
          endDate: "2026-11-03",
          reason: "Pendampingan istri",
        },
        "user-2",
      ),
    ).rejects.toThrow("khusus diperuntukkan bagi pegawai laki-laki (pria)");
  });
});
