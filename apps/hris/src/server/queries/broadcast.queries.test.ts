import { describe, it, expect, vi, beforeEach } from "vitest";
import { getBroadcastHistory, getBroadcastDetail } from "./broadcast.queries";

vi.mock("@pspk/auth", () => ({
  getAuthContext: vi.fn(),
}));

vi.mock("@pspk/rbac", () => ({
  can: vi.fn(),
}));

vi.mock("@pspk/db", () => ({
  prisma: {
    emailBroadcast: {
      findMany: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
      findUnique: vi.fn(),
    },
    emailBroadcastRecipient: {
      findFirst: vi.fn(),
      groupBy: vi.fn().mockResolvedValue([]),
    },
    department: {
      findMany: vi.fn(),
    },
    employee: {
      findMany: vi.fn(),
    },
  },
  BroadcastScope: {
    ALL_EMPLOYEES: "ALL_EMPLOYEES",
    DEPARTMENT: "DEPARTMENT",
    TEAM: "TEAM",
    CUSTOM: "CUSTOM",
  },
  BroadcastStatus: {
    DRAFT: "DRAFT",
    SENDING: "SENDING",
    SENT: "SENT",
    PARTIALLY_FAILED: "PARTIALLY_FAILED",
    FAILED: "FAILED",
  },
  BroadcastDeliveryStatus: {
    PENDING: "PENDING",
    SENT: "SENT",
    FAILED: "FAILED",
  },
}));

import { getAuthContext } from "@pspk/auth";
import { prisma } from "@pspk/db";

type MockBroadcastMany = Awaited<ReturnType<typeof prisma.emailBroadcast.findMany>>;
type MockBroadcastAggregate = Awaited<ReturnType<typeof prisma.emailBroadcast.aggregate>>;
type MockBroadcastUnique = Awaited<ReturnType<typeof prisma.emailBroadcast.findUnique>>;

describe("broadcast.queries.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getBroadcastHistory", () => {
    it("harus mengembalikan riwayat seluruh broadcast untuk Admin HR", async () => {
      vi.mocked(getAuthContext).mockResolvedValue({
        userId: "user-hr",
        employeeId: "emp-hr",
        roles: ["admin_hr"],
        permissions: new Set(["hris.broadcast.read:all"]),
      });

      const mockDate = new Date("2026-10-21T00:00:00.000Z");
      vi.mocked(prisma.emailBroadcast.findMany).mockResolvedValue([
        {
          id: "bc-1",
          subject: "Pengumuman Libur Nasional",
          contentText: "Berikut adalah jadwal libur resmi kantor...",
          contentHtml: "<p>Berikut adalah jadwal libur resmi kantor...</p>",
          senderUserId: "user-hr",
          senderName: "Admin HR",
          senderEmail: "hr@pspk.id",
          replyToEmail: "hr@pspk.id",
          targetScope: "ALL_EMPLOYEES",
          totalRecipients: 45,
          sentCount: 45,
          failedCount: 0,
          sendInApp: true,
          status: "SENT",
          createdAt: mockDate,
          targetDepartment: null,
        },
      ] as unknown as MockBroadcastMany);

      vi.mocked(prisma.emailBroadcast.count).mockResolvedValue(1);
      vi.mocked(prisma.emailBroadcast.aggregate).mockResolvedValue({
        _count: { id: 1 },
        _sum: { sentCount: 45, failedCount: 0, totalRecipients: 45 },
      } as unknown as MockBroadcastAggregate);

      const result = await getBroadcastHistory("user-hr", { page: 1, pageSize: 10 });

      expect(result.items).toHaveLength(1);
      expect(result.items[0]?.subject).toBe("Pengumuman Libur Nasional");
      expect(result.stats.totalBroadcasts).toBe(1);
      expect(result.stats.successRate).toBe(100);
      expect(result.canCreate).toBe(true);
    });

    it("harus menyaring riwayat berdasarkan manajer dan timnya", async () => {
      vi.mocked(getAuthContext).mockResolvedValue({
        userId: "user-mgr",
        employeeId: "emp-mgr",
        roles: ["manager"],
        permissions: new Set(["hris.broadcast.read:team"]),
      });

      vi.mocked(prisma.emailBroadcast.findMany).mockResolvedValue([] as unknown as MockBroadcastMany);
      vi.mocked(prisma.emailBroadcast.count).mockResolvedValue(0);
      vi.mocked(prisma.emailBroadcast.aggregate).mockResolvedValue({
        _count: { id: 0 },
        _sum: { sentCount: 0, failedCount: 0, totalRecipients: 0 },
      } as unknown as MockBroadcastAggregate);

      const result = await getBroadcastHistory("user-mgr");

      expect(result.items).toHaveLength(0);
      expect(prisma.emailBroadcast.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { senderUserId: "user-mgr" },
              { recipients: { some: { employee: { userId: "user-mgr" } } } },
            ],
          }),
        }),
      );
    });

    it("harus menyaring berdasarkan status pengiriman", async () => {
      vi.mocked(getAuthContext).mockResolvedValue({
        userId: "user-hr",
        employeeId: "emp-hr",
        roles: ["admin_hr"],
        permissions: new Set(["hris.broadcast.read:all"]),
      });

      vi.mocked(prisma.emailBroadcast.findMany).mockResolvedValue([] as unknown as MockBroadcastMany);
      vi.mocked(prisma.emailBroadcast.count).mockResolvedValue(0);
      vi.mocked(prisma.emailBroadcast.aggregate).mockResolvedValue({
        _count: { id: 0 },
        _sum: { sentCount: 0, failedCount: 0, totalRecipients: 0 },
      } as unknown as MockBroadcastAggregate);

      await getBroadcastHistory("user-hr", { status: "SENT" });

      expect(prisma.emailBroadcast.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: "SENT",
          }),
        }),
      );
    });

    it("harus mengabaikan filter status jika bernilai ALL atau invalid", async () => {
      vi.mocked(getAuthContext).mockResolvedValue({
        userId: "user-hr",
        employeeId: "emp-hr",
        roles: ["admin_hr"],
        permissions: new Set(["hris.broadcast.read:all"]),
      });

      vi.mocked(prisma.emailBroadcast.findMany).mockResolvedValue([] as unknown as MockBroadcastMany);
      vi.mocked(prisma.emailBroadcast.count).mockResolvedValue(0);
      vi.mocked(prisma.emailBroadcast.aggregate).mockResolvedValue({
        _count: { id: 0 },
        _sum: { sentCount: 0, failedCount: 0, totalRecipients: 0 },
      } as unknown as MockBroadcastAggregate);

      await getBroadcastHistory("user-hr", { status: "ALL" });

      // Verifikasi bahwa status tidak dimasukkan ke dalam query where
      const callArgs = vi.mocked(prisma.emailBroadcast.findMany).mock.calls[0]?.[0];
      expect(callArgs?.where).not.toHaveProperty("status");
    });

    it("harus menerapkan kombinasi filter search + scope + status secara bersamaan", async () => {
      vi.mocked(getAuthContext).mockResolvedValue({
        userId: "user-hr",
        employeeId: "emp-hr",
        roles: ["admin_hr"],
        permissions: new Set(["hris.broadcast.read:all"]),
      });

      vi.mocked(prisma.emailBroadcast.findMany).mockResolvedValue([] as unknown as MockBroadcastMany);
      vi.mocked(prisma.emailBroadcast.count).mockResolvedValue(0);
      vi.mocked(prisma.emailBroadcast.aggregate).mockResolvedValue({
        _count: { id: 0 },
        _sum: { sentCount: 0, failedCount: 0, totalRecipients: 0 },
      } as unknown as MockBroadcastAggregate);

      await getBroadcastHistory("user-hr", {
        search: "rapat koordinasi",
        scope: "DEPARTMENT",
        status: "PARTIALLY_FAILED",
      });

      expect(prisma.emailBroadcast.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { subject: { contains: "rapat koordinasi", mode: "insensitive" } },
              { senderName: { contains: "rapat koordinasi", mode: "insensitive" } },
              { contentText: { contains: "rapat koordinasi", mode: "insensitive" } },
            ],
            targetScope: "DEPARTMENT",
            status: "PARTIALLY_FAILED",
          }),
        }),
      );
    });

    it("harus membatasi panjang teks search maksimal 100 karakter dan membatasi batas pageSize", async () => {
      vi.mocked(getAuthContext).mockResolvedValue({
        userId: "user-hr",
        employeeId: "emp-hr",
        roles: ["admin_hr"],
        permissions: new Set(["hris.broadcast.read:all"]),
      });

      vi.mocked(prisma.emailBroadcast.findMany).mockResolvedValue([] as unknown as MockBroadcastMany);
      vi.mocked(prisma.emailBroadcast.count).mockResolvedValue(100);
      vi.mocked(prisma.emailBroadcast.aggregate).mockResolvedValue({
        _count: { id: 100 },
        _sum: { sentCount: 100, failedCount: 0, totalRecipients: 100 },
      } as unknown as MockBroadcastAggregate);

      const veryLongSearch = "a".repeat(150);

      const res = await getBroadcastHistory("user-hr", {
        search: veryLongSearch,
        page: -5, // harus di-clamp ke 1
        pageSize: 100, // harus di-clamp ke 50
      });

      expect(res.page).toBe(1);
      expect(res.totalPages).toBe(2); // 100 total / 50 pageSize = 2 halaman
      expect(prisma.emailBroadcast.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50,
          skip: 0,
          where: expect.objectContaining({
            OR: [
              { subject: { contains: "a".repeat(100), mode: "insensitive" } },
              { senderName: { contains: "a".repeat(100), mode: "insensitive" } },
              { contentText: { contains: "a".repeat(100), mode: "insensitive" } },
            ],
          }),
        }),
      );
    });
  });

  describe("getBroadcastDetail", () => {
    it("harus mengembalikan null jika id broadcast tidak ditemukan", async () => {
      vi.mocked(getAuthContext).mockResolvedValue({
        userId: "user-hr",
        employeeId: "emp-hr",
        roles: ["admin_hr"],
        permissions: new Set(["hris.broadcast.read:all"]),
      });

      vi.mocked(prisma.emailBroadcast.findUnique).mockResolvedValue(null);

      const detail = await getBroadcastDetail("user-hr", "non-existent-id");
      expect(detail).toBeNull();
    });

    it("harus mengembalikan rincian broadcast beserta daftar log penerima", async () => {
      vi.mocked(getAuthContext).mockResolvedValue({
        userId: "user-hr",
        employeeId: "emp-hr",
        roles: ["admin_hr"],
        permissions: new Set(["hris.broadcast.read:all"]),
      });

      const mockDate = new Date();
      vi.mocked(prisma.emailBroadcast.findUnique).mockResolvedValue({
        id: "bc-123",
        subject: "Rapat Koordinasi Evaluasi Program",
        contentText: "Harap hadir tepat waktu...",
        contentHtml: "<p>Harap hadir tepat waktu...</p>",
        senderUserId: "user-hr",
        senderName: "Admin HR",
        senderEmail: "hr@pspk.id",
        replyToEmail: "hr@pspk.id",
        targetScope: "TEAM",
        totalRecipients: 2,
        sentCount: 2,
        failedCount: 0,
        sendInApp: true,
        status: "SENT",
        createdAt: mockDate,
        targetDepartment: { name: "Riset Kebijakan" },
        recipients: [
          {
            id: "rcpt-1",
            recipientName: "Budi Santoso",
            email: "budi@pspk.id",
            status: "SENT",
            errorMessage: null,
            sentAt: mockDate,
          },
          {
            id: "rcpt-2",
            recipientName: "Citra Dewi",
            email: "citra@pspk.id",
            status: "SENT",
            errorMessage: null,
            sentAt: mockDate,
          },
        ],
      } as unknown as MockBroadcastUnique);

      const detail = await getBroadcastDetail("user-hr", "bc-123");

      expect(detail).not.toBeNull();
      expect(detail?.subject).toBe("Rapat Koordinasi Evaluasi Program");
      expect(detail?.recipients).toHaveLength(2);
      expect(detail?.recipients[0]?.recipientName).toBe("Budi Santoso");
      expect(detail?.canResend).toBe(false); // failedCount is 0
    });

    it("harus menyetel canResend = true jika terdapat kegagalan pengiriman dan pengguna berhak", async () => {
      vi.mocked(getAuthContext).mockResolvedValue({
        userId: "user-author",
        employeeId: "emp-author",
        roles: ["employee"],
        permissions: new Set(),
      });

      const mockDate = new Date();
      vi.mocked(prisma.emailBroadcast.findUnique).mockResolvedValue({
        id: "bc-failed",
        subject: "Pengumuman dengan Kegagalan",
        contentText: "Harap hadir...",
        contentHtml: "<p>Harap hadir...</p>",
        senderUserId: "user-author",
        senderName: "Budi Author",
        senderEmail: "budi@pspk.id",
        replyToEmail: "budi@pspk.id",
        targetScope: "TEAM",
        totalRecipients: 3,
        sentCount: 2,
        failedCount: 1,
        sendInApp: true,
        status: "PARTIALLY_FAILED",
        createdAt: mockDate,
        targetDepartment: null,
        recipients: [
          {
            id: "rcpt-failed-1",
            recipientName: "Dedi",
            email: "dedi@pspk.id",
            status: "FAILED",
            errorMessage: "SMTP Timeout connection error",
            sentAt: null,
          },
        ],
      } as unknown as MockBroadcastUnique);

      const detail = await getBroadcastDetail("user-author", "bc-failed");

      expect(detail).not.toBeNull();
      expect(detail?.failedCount).toBe(1);
      expect(detail?.canResend).toBe(true);
      expect(detail?.recipients[0]?.errorMessage).toBe("SMTP Timeout connection error");
    });

    it("harus menyelesaikan nama multi-departemen dan daftar pegawai yang dikecualikan pada detail broadcast", async () => {
      vi.mocked(getAuthContext).mockResolvedValue({
        userId: "user-hr",
        employeeId: "emp-hr",
        roles: ["admin_hr"],
        permissions: new Set(["hris.broadcast.read:all"]),
      });

      const mockDate = new Date();
      vi.mocked(prisma.emailBroadcast.findUnique).mockResolvedValue({
        id: "bc-multi-dept",
        subject: "Pengumuman Multi Divisi & Pengecualian",
        contentText: "Isi pengumuman...",
        contentHtml: "<p>Isi pengumuman...</p>",
        senderUserId: "user-hr",
        senderName: "Admin HR",
        senderEmail: "hr@pspk.id",
        replyToEmail: "hr@pspk.id",
        targetScope: "DEPARTMENT",
        targetDepartmentIds: ["dept-1", "dept-2", "dept-3"],
        excludedEmployeeIds: ["emp-ex-1", "emp-ex-2"],
        totalRecipients: 20,
        sentCount: 20,
        failedCount: 0,
        sendInApp: true,
        status: "SENT",
        createdAt: mockDate,
        targetDepartment: null,
        recipients: [],
      } as unknown as MockBroadcastUnique);

      vi.mocked(prisma.department.findMany).mockResolvedValue([
        { id: "dept-1", name: "Riset Kebijakan" },
        { id: "dept-2", name: "Komunikasi Publik" },
        { id: "dept-3", name: "Operasional & SDM" },
      ] as never);

      vi.mocked(prisma.employee.findMany).mockResolvedValue([
        { id: "emp-ex-1", fullName: "Karyawan Izin" },
        { id: "emp-ex-2", fullName: "Karyawan Cuti" },
      ] as never);

      const detail = await getBroadcastDetail("user-hr", "bc-multi-dept");

      expect(detail).not.toBeNull();
      expect(detail?.targetDepartmentName).toBe("Riset Kebijakan +2 lainnya");
      expect(detail?.excludedCount).toBe(2);
      expect(detail?.excludedEmployeeNames).toEqual(["Karyawan Izin", "Karyawan Cuti"]);
      expect(detail?.targetDepartmentIds).toEqual(["dept-1", "dept-2", "dept-3"]);
      expect(detail?.excludedEmployeeIds).toEqual(["emp-ex-1", "emp-ex-2"]);
    });
  });
});
