import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock next/headers
const mockHeadersGet = vi.fn((key: string) => {
  if (key === "x-forwarded-for") return "192.168.1.10";
  if (key === "user-agent") return "Vitest-Browser/1.0";
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
}));

// Mock @pspk/db
vi.mock("@pspk/db", () => ({
  prisma: {
    department: {
      findMany: vi.fn(),
    },
    employee: {
      findMany: vi.fn(),
    },
  },
}));

// Mock broadcast-email.service
const mockGetBroadcastSenderContext = vi.fn();
const mockExecuteSendBroadcast = vi.fn();
vi.mock("../services/broadcast-email.service", () => ({
  getBroadcastSenderContext: (...args: unknown[]) => mockGetBroadcastSenderContext(...args),
  executeSendBroadcast: (...args: unknown[]) => mockExecuteSendBroadcast(...args),
}));

// Mock broadcast.queries
const mockGetBroadcastDetail = vi.fn();
vi.mock("../queries/broadcast.queries", () => ({
  getBroadcastDetail: (...args: unknown[]) => mockGetBroadcastDetail(...args),
}));

import {
  getBroadcastFormDataAction,
  sendBroadcastAction,
  getBroadcastDetailAction,
} from "./broadcast.actions";
import { getSession } from "@pspk/auth";
import { prisma } from "@pspk/db";

type MockSession = Awaited<ReturnType<typeof getSession>>;

describe("HRIS broadcast.actions.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockHrSession: MockSession = {
    user: {
      id: "user-hr-1",
      name: "Admin HR PSPK",
      email: "hr@pspk.id",
      emailVerified: true,
      mustChangePassword: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    session: {
      id: "sess-1",
      userId: "user-hr-1",
      token: "token-1",
      expiresAt: new Date(Date.now() + 86400000),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };

  const mockManagerSession: MockSession = {
    user: {
      id: "user-mgr-1",
      name: "Budi Manajer",
      email: "budi@pspk.id",
      emailVerified: true,
      mustChangePassword: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    session: {
      id: "sess-2",
      userId: "user-mgr-1",
      token: "token-2",
      expiresAt: new Date(Date.now() + 86400000),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };

  describe("getBroadcastFormDataAction", () => {
    it("harus mengembalikan error jika pengguna belum login", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(null);

      const result = await getBroadcastFormDataAction();
      expect(result.success).toBe(false);
      expect(result.error).toContain("Sesi telah berakhir");
    });

    it("harus memuat departemen dan seluruh pegawai aktif untuk Admin HR", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockHrSession);
      mockGetBroadcastSenderContext.mockResolvedValueOnce({
        userId: "user-hr-1",
        employeeId: "emp-hr-1",
        senderName: "Admin HR PSPK",
        senderEmail: "hr@pspk.id",
        isSuperAdmin: false,
        isAdminHr: true,
        isManager: false,
        allowedScopes: ["ALL_EMPLOYEES", "DEPARTMENT", "CUSTOM"],
      });

      vi.mocked(prisma.department.findMany).mockResolvedValueOnce([
        { id: "dept-1", name: "Riset Kebijakan" },
        { id: "dept-2", name: "Operasional" },
      ] as never);

      vi.mocked(prisma.employee.findMany)
        .mockResolvedValueOnce([
          {
            id: "emp-1",
            fullName: "Ani Peneliti",
            workEmail: "ani@pspk.id",
            currentDepartment: { name: "Riset Kebijakan" },
          },
          {
            id: "emp-2",
            fullName: "Budi Staf",
            workEmail: "budi@pspk.id",
            currentDepartment: null,
          },
        ] as never)
        .mockResolvedValueOnce([] as never);

      const result = await getBroadcastFormDataAction();
      expect(result.success).toBe(true);
      expect(result.data?.departments).toHaveLength(2);
      expect(result.data?.employees).toHaveLength(2);
      expect(result.data?.employees[0]?.departmentName).toBe("Riset Kebijakan");
      expect(result.data?.employees[1]?.departmentName).toBeNull();
    });

    it("harus memuat anggota tim bawahan langsung untuk Manajer", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockManagerSession);
      mockGetBroadcastSenderContext.mockResolvedValueOnce({
        userId: "user-mgr-1",
        employeeId: "emp-mgr-1",
        senderName: "Budi Manajer",
        senderEmail: "budi@pspk.id",
        isSuperAdmin: false,
        isAdminHr: false,
        isManager: true,
        allowedScopes: ["TEAM"],
      });

      vi.mocked(prisma.department.findMany).mockResolvedValueOnce([] as never);
      // Untuk manajer, employees (seluruh staf) kosong, tapi tim bawahan diisi
      vi.mocked(prisma.employee.findMany).mockResolvedValueOnce([
        {
          id: "emp-sub-1",
          fullName: "Citra Bawahan",
          workEmail: "citra@pspk.id",
          currentPosition: { title: "Junior Researcher" },
        },
      ] as never);

      const result = await getBroadcastFormDataAction();
      expect(result.success).toBe(true);
      expect(result.data?.employees).toHaveLength(0);
      expect(result.data?.teamMembers).toHaveLength(1);
      expect(result.data?.teamMembers[0]?.fullName).toBe("Citra Bawahan");
      expect(result.data?.teamMembers[0]?.positionTitle).toBe("Junior Researcher");
    });

    it("harus menangani exception database dengan aman", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockHrSession);
      mockGetBroadcastSenderContext.mockRejectedValueOnce(new Error("Database offline"));

      const result = await getBroadcastFormDataAction();
      expect(result.success).toBe(false);
      expect(result.error).toBe("Database offline");
    });
  });

  describe("sendBroadcastAction", () => {
    it("harus gagal jika sesi tidak ditemukan", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(null);

      const result = await sendBroadcastAction({
        subject: "Halo Tim",
        contentHtml: "<p>Konten panjang yang valid</p>",
        targetScope: "ALL_EMPLOYEES",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Sesi tidak valid");
    });

    it("harus gagal jika input tidak lolos validasi skema Zod (subjek terlalu pendek)", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockHrSession);

      const result = await sendBroadcastAction({
        subject: "Hi",
        contentHtml: "<p>Konten panjang yang valid dan informatif</p>",
        targetScope: "ALL_EMPLOYEES",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Subjek pengumuman minimal 3 karakter");
    });

    it("harus gagal jika konten pesan terlalu pendek", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockHrSession);

      const result = await sendBroadcastAction({
        subject: "Subjek Pengumuman Penting",
        contentHtml: "<p>hi</p>",
        targetScope: "ALL_EMPLOYEES",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("minimal 10 karakter");
    });

    it("berhasil mengirim broadcast, memanggil revalidatePath, dan mengembalikan broadcastId", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockHrSession);
      mockExecuteSendBroadcast.mockResolvedValueOnce({
        broadcastId: "broadcast-uuid-123",
        message: "Pengumuman berhasil disebarkan ke 42 penerima.",
        totalRecipients: 42,
        sentCount: 42,
        failedCount: 0,
      });

      const result = await sendBroadcastAction({
        subject: "Pengumuman Rapat Bulanan Yayasan",
        contentHtml: "<p>Yth Rekan-rekan sekalian, mohon hadir dalam rapat bulanan.</p>",
        targetScope: "ALL_EMPLOYEES",
        sendInApp: true,
      });

      expect(result.success).toBe(true);
      expect(result.broadcastId).toBe("broadcast-uuid-123");
      expect(result.message).toContain("42 penerima");
      expect(mockExecuteSendBroadcast).toHaveBeenCalledWith(
        "user-hr-1",
        expect.objectContaining({
          subject: "Pengumuman Rapat Bulanan Yayasan",
          targetScope: "ALL_EMPLOYEES",
        }),
        expect.objectContaining({
          ip: "192.168.1.10",
          userAgent: "Vitest-Browser/1.0",
        }),
      );
      expect(mockRevalidatePath).toHaveBeenCalledWith("/komunikasi/riwayat");
    });

    it("harus menangani kegagalan eksekusi pengiriman dari service", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockHrSession);
      mockExecuteSendBroadcast.mockRejectedValueOnce(
        new Error("Tidak ada penerima aktif yang memiliki email kerja valid"),
      );

      const result = await sendBroadcastAction({
        subject: "Pengumuman Uji Coba",
        contentHtml: "<p>Konten panjang yang lolos validasi skema Zod.</p>",
        targetScope: "ALL_EMPLOYEES",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Tidak ada penerima aktif yang memiliki email kerja valid");
    });
  });

  describe("getBroadcastDetailAction", () => {
    it("harus menolak permintaan jika sesi tidak ditemukan", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(null);

      const result = await getBroadcastDetailAction("bc-1");
      expect(result.success).toBe(false);
      expect(result.error).toContain("Sesi telah berakhir");
    });

    it("harus memanggil getBroadcastDetail dan mengembalikan data rincian", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockHrSession);
      mockGetBroadcastDetail.mockResolvedValueOnce({
        id: "bc-1",
        subject: "Surat Edaran",
        contentHtml: "<p>Isi surat edaran</p>",
        recipients: [
          {
            id: "rec-1",
            recipientName: "Budi",
            email: "budi@pspk.id",
            status: "SENT",
            errorMessage: null,
            sentAt: new Date(),
          },
        ],
      });

      const result = await getBroadcastDetailAction("bc-1");
      expect(result.success).toBe(true);
      expect(result.data?.id).toBe("bc-1");
      expect(result.data?.subject).toBe("Surat Edaran");
      expect(result.data?.recipients).toHaveLength(1);
    });

    it("harus menangani error jika detail tidak ditemukan", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockHrSession);
      mockGetBroadcastDetail.mockRejectedValueOnce(
        new Error("Pengumuman tidak ditemukan atau Anda tidak memiliki akses."),
      );

      const result = await getBroadcastDetailAction("bc-nonexistent");
      expect(result.success).toBe(false);
      expect(result.error).toBe("Pengumuman tidak ditemukan atau Anda tidak memiliki akses.");
    });
  });
});
