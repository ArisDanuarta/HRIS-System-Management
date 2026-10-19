import { describe, it, expect, vi, beforeEach } from "vitest";
import { deleteEmployee, reactivateEmployee } from "./employee.service";
import { prisma } from "@pspk/db";

const mockTx = {
  employee: {
    update: vi.fn(),
  },
  employmentContract: {
    updateMany: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
  },
  user: {
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
        update: vi.fn(),
      },
      employmentContract: {
        updateMany: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
      },
      user: {
        update: vi.fn(),
      },
      $transaction: vi.fn(async (cb: (tx: typeof mockTx) => Promise<unknown>) => cb(mockTx)),
    },
    writeAudit: vi.fn(),
  };
});

describe("employee.service.ts - Employee Lifecycle (Deactivate & Reactivate)", () => {
  const actor = {
    id: "user-actor-1",
    email: "hr.admin@pspk.id",
    ip: "127.0.0.1",
    userAgent: "Vitest/Test",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deleteEmployee harus mengubah status menjadi TERMINATED tanpa menghapus arsip (deletedAt tetap null)", async () => {
    const existingEmployee = {
      id: "emp-1",
      fullName: "Farhan Ramadhan",
      employeeNo: "PSPK-202610-007",
      status: "ACTIVE",
      deletedAt: null,
      userId: "user-1",
    };

    vi.mocked(prisma.employee.findUnique).mockResolvedValueOnce(existingEmployee as never);
    mockTx.employee.update.mockResolvedValueOnce({
      ...existingEmployee,
      status: "TERMINATED",
      deletedAt: null,
    });

    const result = await deleteEmployee("emp-1", actor);

    // Verifikasi status menjadi TERMINATED dan deletedAt null
    expect(mockTx.employee.update).toHaveBeenCalledWith({
      where: { id: "emp-1" },
      data: {
        status: "TERMINATED",
        deletedAt: null,
      },
    });

    // Verifikasi kontrak aktif dihentikan
    expect(mockTx.employmentContract.updateMany).toHaveBeenCalledWith({
      where: { employeeId: "emp-1", status: "ACTIVE" },
      data: expect.objectContaining({
        status: "TERMINATED",
      }),
    });

    // Verifikasi akun user dinonaktifkan
    expect(mockTx.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { isActive: false },
    });

    expect(result.status).toBe("TERMINATED");
    expect(result.deletedAt).toBeNull();
  });

  it("reactivateEmployee harus mengembalikan status menjadi ACTIVE dan mengaktifkan akun pengguna", async () => {
    const terminatedEmployee = {
      id: "emp-1",
      fullName: "Farhan Ramadhan",
      employeeNo: "PSPK-202610-007",
      status: "TERMINATED",
      deletedAt: null,
      userId: "user-1",
      user: { id: "user-1", isActive: false },
    };

    vi.mocked(prisma.employee.findUnique).mockResolvedValueOnce(terminatedEmployee as never);
    mockTx.employee.update.mockResolvedValueOnce({
      ...terminatedEmployee,
      status: "ACTIVE",
      deletedAt: null,
    });

    mockTx.employmentContract.findFirst.mockResolvedValueOnce({
      id: "contract-1",
      employeeId: "emp-1",
      type: "PERMANENT",
      status: "TERMINATED",
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-10-19"),
    });

    const result = await reactivateEmployee("emp-1", actor);

    // Verifikasi status diubah menjadi ACTIVE
    expect(mockTx.employee.update).toHaveBeenCalledWith({
      where: { id: "emp-1" },
      data: {
        status: "ACTIVE",
        deletedAt: null,
      },
    });

    // Verifikasi kontrak dipulihkan ke ACTIVE
    expect(mockTx.employmentContract.update).toHaveBeenCalledWith({
      where: { id: "contract-1" },
      data: {
        status: "ACTIVE",
        endDate: null,
      },
    });

    // Verifikasi akun user diaktifkan kembali
    expect(mockTx.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { isActive: true },
    });

    expect(result.status).toBe("ACTIVE");
    expect(result.deletedAt).toBeNull();
  });
});
