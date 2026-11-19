import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  extractBusinessTripInfo,
  formatLeaveRange,
  getTodayOutOfOfficeData,
} from "./out-of-office.queries";
import { prisma } from "@pspk/db";

vi.mock("@pspk/db", () => ({
  prisma: {
    leaveRequest: {
      findMany: vi.fn(),
    },
    attendance: {
      findMany: vi.fn(),
    },
  },
}));

describe("out-of-office.queries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("extractBusinessTripInfo", () => {
    it("should return fallback when notes is null or empty", () => {
      expect(extractBusinessTripInfo(null)).toBe("Dinas Luar Kantor");
      expect(extractBusinessTripInfo(undefined)).toBe("Dinas Luar Kantor");
      expect(extractBusinessTripInfo("")).toBe("Dinas Luar Kantor");
      expect(extractBusinessTripInfo("   ")).toBe("Dinas Luar Kantor");
    });

    it("should remove [DINAS] or [BUSINESS_TRIP] tag and return clean info", () => {
      expect(extractBusinessTripInfo("[DINAS] Riset Lapangan Lombok")).toBe(
        "Riset Lapangan Lombok",
      );
      expect(extractBusinessTripInfo("[BUSINESS_TRIP] Kunjungan Mitra Kemendikbud")).toBe(
        "Kunjungan Mitra Kemendikbud",
      );
      expect(extractBusinessTripInfo("[dinas] Workshop Bali")).toBe("Workshop Bali");
    });

    it("should return fallback if notes only contains the tag", () => {
      expect(extractBusinessTripInfo("[DINAS]")).toBe("Dinas Luar Kantor");
      expect(extractBusinessTripInfo("[BUSINESS_TRIP]  ")).toBe("Dinas Luar Kantor");
    });

    it("should preserve normal notes without tags", () => {
      expect(extractBusinessTripInfo("Pelatihan Pengukuran Literasi")).toBe(
        "Pelatihan Pengukuran Literasi",
      );
    });
  });

  describe("formatLeaveRange", () => {
    it("should format single day leave cleanly", () => {
      const day = new Date("2026-11-19T00:00:00.000Z");
      const label = formatLeaveRange(day, day);
      expect(label).toContain("19");
      expect(label).toContain("Nov");
      expect(label).not.toContain("–");
    });

    it("should format multiple day leave with dash separator", () => {
      const start = new Date("2026-11-18T00:00:00.000Z");
      const end = new Date("2026-11-21T00:00:00.000Z");
      const label = formatLeaveRange(start, end);
      expect(label).toContain("18");
      expect(label).toContain("21");
      expect(label).toContain("–");
    });
  });

  describe("getTodayOutOfOfficeData", () => {
    it("should query leaves and business trips in parallel and format result", async () => {
      const mockLeaves = [
        {
          id: "leave-1",
          startDate: new Date("2026-11-18T00:00:00.000Z"),
          endDate: new Date("2026-11-20T00:00:00.000Z"),
          leaveType: { id: "lt-1", name: "Cuti Tahunan" },
          employee: {
            id: "emp-1",
            fullName: "Budi Santoso",
            nickname: "Budi",
            employeeNo: "PSPK-001",
            photoKey: "photo/budi.jpg",
            currentPosition: { title: "Peneliti" },
            currentDepartment: { name: "Riset Kebijakan" },
          },
        },
      ];

      const mockTrips = [
        {
          id: "att-1",
          checkInAt: new Date("2026-11-19T08:15:00.000Z"),
          notes: "[DINAS] Evaluasi Program NTB",
          employee: {
            id: "emp-2",
            fullName: "Siti Rahma",
            nickname: null,
            employeeNo: "PSPK-002",
            photoKey: null,
            currentPosition: { title: "Lead Advokasi" },
            currentDepartment: { name: "Kemitraan & Advokasi" },
          },
        },
      ];

      vi.mocked(prisma.leaveRequest.findMany).mockResolvedValue(mockLeaves as unknown as Awaited<ReturnType<typeof prisma.leaveRequest.findMany>>);
      vi.mocked(prisma.attendance.findMany).mockResolvedValue(mockTrips as unknown as Awaited<ReturnType<typeof prisma.attendance.findMany>>);

      const target = new Date("2026-11-19T00:00:00.000Z");
      const result = await getTodayOutOfOfficeData(target);

      expect(result.totalCount).toBe(2);
      expect(result.leaves).toHaveLength(1);
      expect(result.leaves[0]?.fullName).toBe("Budi Santoso");
      expect(result.leaves[0]?.typeLabel).toBe("Cuti Tahunan");
      expect(result.leaves[0]?.department).toBe("Riset Kebijakan");
      expect(result.leaves[0]?.kind).toBe("LEAVE");

      expect(result.businessTrips).toHaveLength(1);
      expect(result.businessTrips[0]?.fullName).toBe("Siti Rahma");
      expect(result.businessTrips[0]?.typeLabel).toBe("Perjalanan Dinas");
      expect(result.businessTrips[0]?.info).toBe("Evaluasi Program NTB");
      expect(result.businessTrips[0]?.kind).toBe("BUSINESS_TRIP");
    });
  });
});
