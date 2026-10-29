import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock next/headers
const mockHeadersGet = vi.fn((key: string) => {
  if (key === "x-forwarded-for") return "127.0.0.1";
  if (key === "user-agent") return "Vitest/1.0";
  return null;
});

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => ({
    get: mockHeadersGet,
  })),
}));

// Mock next/cache
const mockRevalidatePath = vi.fn();
vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

// Mock @pspk/auth
vi.mock("@pspk/auth", () => ({
  getSession: vi.fn(),
  getAuthContext: vi.fn(),
}));

// Mock @pspk/rbac
vi.mock("@pspk/rbac", () => ({
  assertCan: vi.fn(),
  can: vi.fn(() => true),
}));

// Mock @pspk/db
const mockLeaveTypeCreate = vi.fn();
const mockLeaveTypeUpdate = vi.fn();
const mockLeaveTypeFindUnique = vi.fn();
const mockLeaveTypeDelete = vi.fn();
const mockLeaveRequestCount = vi.fn();
const mockLeaveBalanceCount = vi.fn();
const mockLeaveBalanceDeleteMany = vi.fn();
const mockEmployeeFindFirst = vi.fn();
const mockEmployeeFindUnique = vi.fn();
const mockWriteAudit = vi.fn();
const mockTransaction = vi.fn(async (ops: unknown[]) => Promise.all(ops));

vi.mock("@pspk/db", () => ({
  prisma: {
    employee: {
      findFirst: (...args: unknown[]) => mockEmployeeFindFirst(...args),
      findUnique: (...args: unknown[]) => mockEmployeeFindUnique(...args),
    },
    leaveType: {
      create: (...args: unknown[]) => mockLeaveTypeCreate(...args),
      update: (...args: unknown[]) => mockLeaveTypeUpdate(...args),
      findUnique: (...args: unknown[]) => mockLeaveTypeFindUnique(...args),
      delete: (...args: unknown[]) => mockLeaveTypeDelete(...args),
    },
    leaveRequest: {
      count: (...args: unknown[]) => mockLeaveRequestCount(...args),
    },
    leaveBalance: {
      count: (...args: unknown[]) => mockLeaveBalanceCount(...args),
      deleteMany: (...args: unknown[]) => mockLeaveBalanceDeleteMany(...args),
    },
    $transaction: (ops: unknown[]) => mockTransaction(ops),
  },
  writeAudit: (...args: unknown[]) => mockWriteAudit(...args),
}));

import {
  createLeaveTypeAction,
  updateLeaveTypeAction,
  deleteLeaveTypeAction,
} from "./leave.actions";
import { getSession, getAuthContext } from "@pspk/auth";

type MockSession = Awaited<ReturnType<typeof getSession>>;
type MockAuthContext = Awaited<ReturnType<typeof getAuthContext>>;

describe("Leave Type Master Actions & Gender Restriction", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    const mockAdminSession: MockSession = {
      user: {
        id: "user-admin-1",
        email: "hr@pspk.id",
        name: "Admin HR",
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      session: {
        id: "sess-1",
        userId: "user-admin-1",
        token: "token-1",
        expiresAt: new Date(Date.now() + 86400000),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };

    const mockAdminAuthContext: MockAuthContext = {
      userId: "user-admin-1",
      email: "hr@pspk.id",
      roles: ["admin_hr"],
      permissions: ["hris.leave.configure:all"],
      departmentId: null,
      employeeId: "emp-hr-1",
    };

    vi.mocked(getSession).mockResolvedValue(mockAdminSession);
    vi.mocked(getAuthContext).mockResolvedValue(mockAdminAuthContext);

    mockEmployeeFindFirst.mockResolvedValue({
      id: "emp-hr-1",
      userId: "user-admin-1",
    });
  });

  describe("createLeaveTypeAction", () => {
    it("berhasil menambahkan jenis cuti khusus wanita (misal: Cuti Melahirkan)", async () => {
      mockLeaveTypeCreate.mockResolvedValue({
        id: "lt-maternity",
        name: "Cuti Melahirkan",
        defaultQuotaDays: 90,
        isPaid: true,
        requiresAttachment: true,
        applicableGender: "FEMALE",
        isActive: true,
      });

      const res = await createLeaveTypeAction({
        name: "Cuti Melahirkan",
        defaultQuotaDays: 90,
        isPaid: true,
        requiresAttachment: true,
        applicableGender: "FEMALE",
        isActive: true,
      });

      expect(res.success).toBe(true);
      expect(res.message).toContain("Cuti Melahirkan");
      expect(mockLeaveTypeCreate).toHaveBeenCalledWith({
        data: {
          name: "Cuti Melahirkan",
          defaultQuotaDays: 90,
          isPaid: true,
          requiresAttachment: true,
          applicableGender: "FEMALE",
          isActive: true,
        },
      });
      expect(mockWriteAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "CREATE",
          entityType: "LeaveType",
          entityId: "lt-maternity",
        }),
      );
    });

    it("berhasil menambahkan jenis cuti untuk semua pegawai (applicableGender = null)", async () => {
      mockLeaveTypeCreate.mockResolvedValue({
        id: "lt-annual",
        name: "Cuti Tahunan",
        defaultQuotaDays: 12,
        isPaid: true,
        requiresAttachment: false,
        applicableGender: null,
        isActive: true,
      });

      const res = await createLeaveTypeAction({
        name: "Cuti Tahunan",
        defaultQuotaDays: 12,
        isPaid: true,
        requiresAttachment: false,
        applicableGender: null,
        isActive: true,
      });

      expect(res.success).toBe(true);
      expect(mockLeaveTypeCreate).toHaveBeenCalledWith({
        data: {
          name: "Cuti Tahunan",
          defaultQuotaDays: 12,
          isPaid: true,
          requiresAttachment: false,
          applicableGender: null,
          isActive: true,
        },
      });
    });
  });

  describe("updateLeaveTypeAction", () => {
    it("berhasil memperbarui kriteria gender jenis cuti", async () => {
      mockLeaveTypeUpdate.mockResolvedValue({
        id: "lt-paternity",
        name: "Cuti Istri Melahirkan",
        defaultQuotaDays: 2,
        isPaid: true,
        requiresAttachment: true,
        applicableGender: "MALE",
        isActive: true,
      });

      const res = await updateLeaveTypeAction({
        id: "lt-paternity",
        name: "Cuti Istri Melahirkan",
        defaultQuotaDays: 2,
        isPaid: true,
        requiresAttachment: true,
        applicableGender: "MALE",
        isActive: true,
      });

      expect(res.success).toBe(true);
      expect(mockLeaveTypeUpdate).toHaveBeenCalledWith({
        where: { id: "lt-paternity" },
        data: {
          name: "Cuti Istri Melahirkan",
          defaultQuotaDays: 2,
          isPaid: true,
          requiresAttachment: true,
          applicableGender: "MALE",
          isActive: true,
        },
      });
      expect(mockWriteAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "UPDATE",
          entityType: "LeaveType",
          entityId: "lt-paternity",
        }),
      );
    });
  });

  describe("deleteLeaveTypeAction with Safety Checks", () => {
    it("menolak penghapusan jenis cuti jika sudah memiliki riwayat pengajuan cuti", async () => {
      mockLeaveTypeFindUnique.mockResolvedValue({
        id: "lt-used",
        name: "Cuti Tahunan",
      });
      mockLeaveRequestCount.mockResolvedValue(5); // 5 riwayat cuti
      mockLeaveBalanceCount.mockResolvedValue(0);

      const res = await deleteLeaveTypeAction({ id: "lt-used" });

      expect(res.success).toBe(false);
      expect(res.message).toContain("tidak dapat dihapus permanen");
      expect(res.message).toContain("5 riwayat permohonan");
      expect(mockLeaveTypeDelete).not.toHaveBeenCalled();
    });

    it("menolak penghapusan jenis cuti jika saldo cuti sudah pernah terpakai oleh pegawai", async () => {
      mockLeaveTypeFindUnique.mockResolvedValue({
        id: "lt-used-balance",
        name: "Cuti Melahirkan",
      });
      mockLeaveRequestCount.mockResolvedValue(0);
      mockLeaveBalanceCount.mockResolvedValue(2); // ada balance dengan usedDays > 0

      const res = await deleteLeaveTypeAction({ id: "lt-used-balance" });

      expect(res.success).toBe(false);
      expect(res.message).toContain("tidak dapat dihapus permanen");
      expect(mockLeaveTypeDelete).not.toHaveBeenCalled();
    });

    it("berhasil menghapus secara permanen jika belum pernah digunakan sama sekali", async () => {
      mockLeaveTypeFindUnique.mockResolvedValue({
        id: "lt-clean",
        name: "Cuti Uji Coba",
      });
      mockLeaveRequestCount.mockResolvedValue(0);
      mockLeaveBalanceCount.mockResolvedValue(0);

      const res = await deleteLeaveTypeAction({ id: "lt-clean" });

      expect(res.success).toBe(true);
      expect(res.message).toContain("berhasil dihapus permanen");
      expect(mockTransaction).toHaveBeenCalled();
      expect(mockWriteAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "DELETE",
          entityType: "LeaveType",
          entityId: "lt-clean",
        }),
      );
    });
  });
});
