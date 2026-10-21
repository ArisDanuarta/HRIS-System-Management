import { describe, it, expect, vi, beforeEach } from "vitest";
import { getBroadcastHistory, getBroadcastDetail } from "./broadcast.queries";

vi.mock("@pspk/auth", () => ({
  getAuthContext: vi.fn(),
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
    },
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
    });
  });
});
