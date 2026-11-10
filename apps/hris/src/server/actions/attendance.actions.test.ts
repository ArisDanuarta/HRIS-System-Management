import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock next/headers
vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers()),
}));

// Mock next/cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Mock @pspk/auth
vi.mock("@pspk/auth", () => ({
  getSession: vi.fn(),
  getAuthContext: vi.fn(),
}));

// Mock @pspk/db
vi.mock("@pspk/db", () => ({
  prisma: {
    employee: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
  writeAudit: vi.fn(async () => {}),
}));

// Mock services
const {
  mockRecordCheckIn,
  mockRecordCheckOut,
  mockCorrectAttendance,
  mockGetMissedCheckOutCount,
  mockBulkFillMissedCheckOut,
} = vi.hoisted(() => ({
  mockRecordCheckIn: vi.fn(),
  mockRecordCheckOut: vi.fn(),
  mockCorrectAttendance: vi.fn(),
  mockGetMissedCheckOutCount: vi.fn(),
  mockBulkFillMissedCheckOut: vi.fn(),
}));

vi.mock("../services/attendance.service", () => ({
  recordCheckIn: (...args: unknown[]) => mockRecordCheckIn(...args),
  recordCheckOut: (...args: unknown[]) => mockRecordCheckOut(...args),
  correctAttendance: (...args: unknown[]) => mockCorrectAttendance(...args),
  getMissedCheckOutCount: (...args: unknown[]) => mockGetMissedCheckOutCount(...args),
  bulkFillMissedCheckOut: (...args: unknown[]) => mockBulkFillMissedCheckOut(...args),
}));

import {
  getMissedCheckOutCountAction,
  bulkFillMissedCheckOutAction,
} from "./attendance.actions";
import { getSession, getAuthContext } from "@pspk/auth";
import { revalidatePath } from "next/cache";

type MockSession = Awaited<ReturnType<typeof getSession>>;
type MockAuthContext = Awaited<ReturnType<typeof getAuthContext>>;

describe("attendance.actions - Bulk Missed Check-Out", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockHrSession: MockSession = {
    user: {
      id: "admin-123",
      email: "hr@pspk.id",
      name: "HR Admin",
      emailVerified: true,
      mustChangePassword: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    session: {
      id: "sess-1",
      userId: "admin-123",
      expiresAt: new Date(Date.now() + 3600000),
      createdAt: new Date(),
      updatedAt: new Date(),
      token: "dummy-token",
    },
  };

  const mockHrAuthCtx: MockAuthContext = {
    userId: "admin-123",
    email: "hr@pspk.id",
    roles: ["HR_ADMIN"],
    permissions: ["hris.attendance.correct:all"],
    isActive: true,
  };

  const mockStaffAuthCtx: MockAuthContext = {
    userId: "staff-123",
    email: "staff@pspk.id",
    roles: ["STAFF"],
    permissions: ["hris.attendance.read:own", "hris.attendance.checkin:own"],
    isActive: true,
  };

  describe("getMissedCheckOutCountAction", () => {
    it("menolak akses jika user tidak memiliki izin hris.attendance.correct:all", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockHrSession);
      vi.mocked(getAuthContext).mockResolvedValueOnce(mockStaffAuthCtx);

      const res = await getMissedCheckOutCountAction({
        year: 2026,
        month: 10,
      });

      expect(res.success).toBe(false);
      expect(res.count).toBe(0);
      expect(res.message).toContain("Akses ditolak");
      expect(mockGetMissedCheckOutCount).not.toHaveBeenCalled();
    });

    it("berhasil mengambil jumlah checkout yang kosong untuk HR Admin", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockHrSession);
      vi.mocked(getAuthContext).mockResolvedValueOnce(mockHrAuthCtx);
      mockGetMissedCheckOutCount.mockResolvedValueOnce(7);

      const res = await getMissedCheckOutCountAction({
        year: 2026,
        month: 10,
        departmentId: "dept-it",
      });

      expect(res.success).toBe(true);
      expect(res.count).toBe(7);
      expect(mockGetMissedCheckOutCount).toHaveBeenCalledWith({
        year: 2026,
        month: 10,
        departmentId: "dept-it",
      });
    });
  });

  describe("bulkFillMissedCheckOutAction", () => {
    it("menolak jika user staf biasa mencoba mengeksekusi penyesuaian massal", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockHrSession);
      vi.mocked(getAuthContext).mockResolvedValueOnce(mockStaffAuthCtx);

      const res = await bulkFillMissedCheckOutAction({
        year: 2026,
        month: 10,
        checkOutTime: "17:00",
        reason: "Percobaan bypass staf",
      });

      expect(res.success).toBe(false);
      expect(res.message).toContain("Akses ditolak");
      expect(mockBulkFillMissedCheckOut).not.toHaveBeenCalled();
    });

    it("menolak format jam yang tidak valid", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockHrSession);
      vi.mocked(getAuthContext).mockResolvedValueOnce(mockHrAuthCtx);

      const res = await bulkFillMissedCheckOutAction({
        year: 2026,
        month: 10,
        checkOutTime: "99:99", // format invalid
        reason: "Uji format jam",
      });

      expect(res.success).toBe(false);
      expect(res.message).toContain("Format jam check-out harus HH:mm");
      expect(mockBulkFillMissedCheckOut).not.toHaveBeenCalled();
    });

    it("berhasil mengeksekusi penyesuaian massal dan memicu revalidatePath", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockHrSession);
      vi.mocked(getAuthContext).mockResolvedValueOnce(mockHrAuthCtx);
      mockBulkFillMissedCheckOut.mockResolvedValueOnce({
        count: 5,
        skipped: 0,
        message: "Berhasil melengkapi 5 data check-out yang kosong.",
      });

      const res = await bulkFillMissedCheckOutAction({
        year: 2026,
        month: 10,
        checkOutTime: "17:00",
        reason: "Audit mingguan HR",
      });

      expect(res.success).toBe(true);
      expect(res.count).toBe(5);
      expect(res.message).toContain("Berhasil melengkapi 5 data check-out yang kosong.");
      expect(revalidatePath).toHaveBeenCalledWith("/absensi");
      expect(revalidatePath).toHaveBeenCalledWith("/absensi/rekap");
      expect(revalidatePath).toHaveBeenCalledWith("/dashboard");
    });
  });
});
