import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockAttendanceCount,
  mockAttendanceFindMany,
  mockAttendanceUpdate,
  mockWriteAudit,
} = vi.hoisted(() => ({
  mockAttendanceCount: vi.fn(),
  mockAttendanceFindMany: vi.fn(),
  mockAttendanceUpdate: vi.fn(),
  mockWriteAudit: vi.fn(),
}));

vi.mock("@pspk/db", () => {
  const prismaMock: Record<string, unknown> = {
    attendance: {
      count: (...args: unknown[]) => mockAttendanceCount(...args),
      findMany: (...args: unknown[]) => mockAttendanceFindMany(...args),
      update: (...args: unknown[]) => mockAttendanceUpdate(...args),
      upsert: vi.fn(),
      findUnique: vi.fn(),
    },
    employee: {
      findUnique: vi.fn(),
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

vi.mock("./work-schedule.service", () => ({
  getActiveWorkSchedule: vi.fn(async () => ({
    workStartTime: "09:00",
    workEndTime: "17:00",
    gracePeriodMins: 15,
    isFlexible: false,
  })),
}));

import { getMissedCheckOutCount, bulkFillMissedCheckOut } from "./attendance.service";

describe("attendance.service - Missed Check-Out Bulk Operations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getMissedCheckOutCount", () => {
    it("menghitung jumlah presensi yang lupa check-out dengan batasan date < today", async () => {
      mockAttendanceCount.mockResolvedValueOnce(5);

      const count = await getMissedCheckOutCount({
        year: 2026,
        month: 10,
        departmentId: "dept-1",
      });

      expect(count).toBe(5);
      expect(mockAttendanceCount).toHaveBeenCalledTimes(1);

      const queryArgs = mockAttendanceCount.mock.calls[0]![0];
      expect(queryArgs.where.checkInAt).toEqual({ not: null });
      expect(queryArgs.where.checkOutAt).toBeNull();
      expect(queryArgs.where.date.lt).toBeInstanceOf(Date);
      expect(queryArgs.where.employee).toEqual({
        currentDepartmentId: "dept-1",
        deletedAt: null,
      });
    });

    it("tidak menambahkan filter departemen jika bernilai ALL atau kosong", async () => {
      mockAttendanceCount.mockResolvedValueOnce(2);

      await getMissedCheckOutCount({
        year: 2026,
        month: 10,
        departmentId: "ALL",
      });

      const queryArgs = mockAttendanceCount.mock.calls[0]![0];
      expect(queryArgs.where.employee).toBeUndefined();
    });
  });

  describe("bulkFillMissedCheckOut", () => {
    it("mengembalikan respon kosong jika tidak ada data yang ditemukan", async () => {
      mockAttendanceFindMany.mockResolvedValueOnce([]);

      const result = await bulkFillMissedCheckOut(
        {
          year: 2026,
          month: 10,
          checkOutTime: "17:00",
          reason: "Audit akhir bulan",
        },
        "admin-user-1",
        "hr@pspk.example",
      );

      expect(result.count).toBe(0);
      expect(result.skipped).toBe(0);
      expect(result.message).toContain("Tidak ada data presensi");
      expect(mockAttendanceUpdate).not.toHaveBeenCalled();
      expect(mockWriteAudit).not.toHaveBeenCalled();
    });

    it("berhasil mengisi check-out untuk tanggal yang sudah lewat dan mencatat audit log", async () => {
      const pastDate = new Date("2026-10-05T00:00:00.000Z");
      const checkInTime = new Date("2026-10-05T02:00:00.000Z"); // 09:00 WIB (+7)

      mockAttendanceFindMany.mockResolvedValueOnce([
        {
          id: "att-1",
          employeeId: "emp-1",
          date: pastDate,
          checkInAt: checkInTime,
          notes: "Lupa tap kartu",
        },
      ]);
      mockAttendanceUpdate.mockResolvedValueOnce({ id: "att-1" });

      const result = await bulkFillMissedCheckOut(
        {
          year: 2026,
          month: 10,
          checkOutTime: "17:00",
          reason: "Audit mingguan HR",
        },
        "admin-user-1",
        "hr@pspk.example",
      );

      expect(result.count).toBe(1);
      expect(result.skipped).toBe(0);
      expect(mockAttendanceUpdate).toHaveBeenCalledTimes(1);

      const updateCall = mockAttendanceUpdate.mock.calls[0]![0];
      expect(updateCall.where.id).toBe("att-1");
      expect(updateCall.data.source).toBe("MANUAL_HR");
      expect(updateCall.data.correctedById).toBe("admin-user-1");
      expect(updateCall.data.correctionReason).toBe("Audit mingguan HR");
      expect(updateCall.data.notes).toContain("[Auto-Out HR: 17:00]");

      expect(mockWriteAudit).toHaveBeenCalledTimes(1);
      const auditCall = mockWriteAudit.mock.calls[0]![0];
      expect(auditCall.action).toBe("ATTENDANCE_BULK_CHECKOUT");
      expect(auditCall.after.affectedCount).toBe(1);
      expect(auditCall.after.affectedIds).toContain("att-1");
    });

    it("melewati record jika check-in dilakukan setelah waktu checkout yang ditentukan", async () => {
      const pastDate = new Date("2026-10-05T00:00:00.000Z");
      // Check-in jam 18:00 WIB (11:00 UTC) padahal checkout default 17:00 WIB
      const lateCheckInTime = new Date("2026-10-05T11:00:00.000Z");

      mockAttendanceFindMany.mockResolvedValueOnce([
        {
          id: "att-2",
          employeeId: "emp-2",
          date: pastDate,
          checkInAt: lateCheckInTime,
          notes: null,
        },
      ]);

      const result = await bulkFillMissedCheckOut(
        {
          year: 2026,
          month: 10,
          checkOutTime: "17:00",
          reason: "Audit mingguan HR",
        },
        "admin-user-1",
        "hr@pspk.example",
      );

      expect(result.count).toBe(0);
      expect(result.skipped).toBe(1);
      expect(mockAttendanceUpdate).not.toHaveBeenCalled();
      expect(mockWriteAudit).not.toHaveBeenCalled();
    });
  });
});
