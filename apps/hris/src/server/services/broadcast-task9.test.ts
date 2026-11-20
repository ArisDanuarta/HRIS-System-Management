import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  escapeCsvField,
  GET as exportCsvHandler,
} from "../../app/api/broadcast/[id]/export/route";
import {
  renderBroadcastEmailHtml,
  buildEmailForRecipient,
  enqueueBroadcast,
  markBroadcastAsRead,
  remindUnreadRecipients,
} from "./broadcast-email.service";
import { NextRequest } from "next/server";

vi.mock("@pspk/auth", () => ({
  getSession: vi.fn(),
  getAuthContext: vi.fn(),
}));

vi.mock("@pspk/rbac", () => ({
  can: vi.fn((ctx, perm: string) => {
    if (typeof perm === "string" && perm.endsWith(":all")) {
      return (
        ctx?.roles?.includes("admin_hr") ||
        ctx?.roles?.includes("super_admin") ||
        false
      );
    }
    return false;
  }),
}));

vi.mock("@pspk/db", () => ({
  prisma: {
    employee: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    emailBroadcast: {
      create: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
      updateMany: vi.fn(),
      findMany: vi.fn(),
    },
    emailBroadcastRecipient: {
      findFirst: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
      groupBy: vi.fn(),
      createMany: vi.fn(),
    },
    auditLog: {
      count: vi.fn(),
    },
    notification: {
      createMany: vi.fn(),
    },
    emailBroadcastAttachment: {
      findMany: vi.fn().mockResolvedValue([]),
    },
  },
  writeAudit: vi.fn(async () => {}),
}));

import { getSession, getAuthContext } from "@pspk/auth";
import { prisma, writeAudit } from "@pspk/db";

describe("Task 9: Kategori, Prioritas, Ekspor CSV, dan Konfirmasi Dibaca", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("9.1 Kategori dan Prioritas", () => {
    it("harus menolak kategori DARURAT jika pengirim bukan pemegang hak canSendAll (Admin HR / Super Admin)", async () => {
      // Setup sender context: Manajer biasa tanpa hak canSendAll
      vi.mocked(getAuthContext).mockResolvedValue({
        userId: "user-mgr-1",
        employeeId: "emp-mgr-1",
        roles: ["manager"],
        permissions: new Set(["hris.broadcast.send:team"]),
      });

      vi.mocked(prisma.employee.findFirst).mockResolvedValue({
        id: "emp-mgr-1",
        fullName: "Budi Manajer",
        workEmail: "budi.mgr@pspk.id",
        currentPosition: { title: "Lead Researcher", isUnitHead: true },
        currentDepartment: { id: "dept-riset", name: "Riset" },
      } as never);

      await expect(
        enqueueBroadcast(
          "user-mgr-1",
          {
            subject: "Pengumuman Darurat Gempa",
            contentHtml: "<p>Mohon evakuasi segera.</p>",
            targetScope: "TEAM",
            senderPersona: "PERSONAL",
            category: "DARURAT",
            priority: "PENTING",
          },
          { ip: "127.0.0.1" },
        ),
      ).rejects.toThrow("Akses ditolak: Kategori Darurat hanya dapat dikirimkan oleh Admin HR");
    });

    it("harus mengizinkan kategori DARURAT untuk Admin HR dengan canSendAll", async () => {
      vi.mocked(getAuthContext).mockResolvedValue({
        userId: "user-admin-1",
        employeeId: "emp-admin-1",
        roles: ["admin_hr"],
        permissions: new Set(["hris.broadcast.send:all"]),
      });

      vi.mocked(prisma.employee.findFirst).mockResolvedValue({
        id: "emp-admin-1",
        fullName: "Siti Admin HR",
        workEmail: "hr@pspk.id",
        currentPosition: { title: "HR Manager", isUnitHead: true },
        currentDepartment: { id: "dept-hr", name: "People & Culture" },
      } as never);

      vi.mocked(prisma.employee.findMany).mockResolvedValue([
        {
          id: "emp-1",
          fullName: "Staf Riset",
          workEmail: "staf@pspk.id",
          userId: "user-staf-1",
          currentDepartment: { name: "Riset" },
        },
      ] as never);

      vi.mocked(prisma.emailBroadcast.create).mockResolvedValue({
        id: "bc-darurat-1",
        subject: "Peringatan Darurat Cuaca Ekstrem",
        status: "QUEUED",
      } as never);

      vi.mocked(prisma.emailBroadcastRecipient.createMany).mockResolvedValue({
        count: 1,
      });

      const res = await enqueueBroadcast(
        "user-admin-1",
        {
          subject: "Peringatan Darurat Cuaca Ekstrem",
          contentHtml: "<p>Bekerja dari rumah (WFH) hari ini.</p>",
          targetScope: "ALL_EMPLOYEES",
          senderPersona: "ORGANIZATION",
          category: "DARURAT",
          priority: "PENTING",
          requireReadReceipt: true,
        },
        { ip: "127.0.0.1" },
      );

      expect(res.broadcastId).toBe("bc-darurat-1");
      expect(prisma.emailBroadcast.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            category: "DARURAT",
            priority: "PENTING",
            requireReadReceipt: true,
          }),
        }),
      );
    });

    it("buildEmailForRecipient: harus menambahkan [PENTING] pada subjek dan header prioritas tinggi jika priority=PENTING", () => {
      const emailOptions = buildEmailForRecipient(
        {
          id: "bc-penting-1",
          subject: "Perubahan Kebijakan Operasional",
          contentHtml: "<p>Kebijakan baru berlaku besok.</p>",
          contentText: "Kebijakan baru berlaku besok.",
          targetScope: "ALL_EMPLOYEES",
          priority: "PENTING",
          category: "KEBIJAKAN",
          requireReadReceipt: true,
          sendInApp: true,
          senderName: "PSPK HR",
          replyToEmail: "no-reply@pspk.id",
        },
        {
          recipientName: "Ahmad Staff",
          email: "ahmad@pspk.id",
        },
      );

      expect(emailOptions.subject).toBe("[PENTING] [PSPK HRIS] Perubahan Kebijakan Operasional");
      expect(emailOptions.headers).toEqual(
        expect.objectContaining({
          "X-Priority": "1",
          Importance: "high",
        }),
      );
      expect(emailOptions.html).toContain("⚠️ PENTING");
      expect(emailOptions.html).toContain("Kebijakan");
      expect(emailOptions.html).toContain("/pengumuman/bc-penting-1");
    });

    it("renderBroadcastEmailHtml: harus merender badge kategori dan kotak CTA portal pembaca saat sendInApp aktif", () => {
      const html = renderBroadcastEmailHtml({
        subject: "Pengumuman Acara Tahunan",
        contentHtml: "<p>Silakan hadir di aula utama.</p>",
        recipientName: "Dewi Lestari",
        senderName: "Tim HR PSPK",
        senderTitle: "People & Culture",
        scopeBadge: "Pengumuman Resmi",
        replyToEmail: "hr@pspk.id",
        category: "ACARA",
        priority: "NORMAL",
        requireReadReceipt: true,
        broadcastId: "bc-event-123",
        sendInApp: true,
      });

      expect(html).toContain("Acara");
      expect(html).not.toContain("⚠️ PENTING");
      expect(html).toContain("Portal HRIS");
      expect(html).toContain("/pengumuman/bc-event-123");
      expect(html).toContain("Buka &amp; Konfirmasi Dibaca");
    });
  });

  describe("9.2 Ekspor CSV Log Penerima & Formula Injection Protection", () => {
    it("escapeCsvField: harus menambahkan kutip tunggal prefix pada sel yang diawali formula trigger (=, +, -, @, \\t, \\r)", () => {
      // Test CSV formula injection payloads
      expect(escapeCsvField("=SUM(A1:A10)")).toBe("'=SUM(A1:A10)");
      expect(escapeCsvField("+1234567890")).toBe("'+1234567890");
      expect(escapeCsvField("-5000")).toBe("'-5000");
      expect(escapeCsvField("@evil_cmd")).toBe("'@evil_cmd");
      expect(escapeCsvField("\talert(1)")).toBe("'\talert(1)");
      // Nilai yang mengandung newline (\r\n) juga dibungkus tanda kutip per RFC 4180
      expect(escapeCsvField("\r\nevil")).toBe('"\'\r\nevil"');
    });

    it("escapeCsvField: harus meng-escape tanda kutip ganda dan membungkus teks yang mengandung koma atau newline", () => {
      expect(escapeCsvField('Budi "Hebat"')).toBe('"Budi ""Hebat"""');
      expect(escapeCsvField("Jakarta, Indonesia")).toBe('"Jakarta, Indonesia"');
      expect(escapeCsvField("Baris 1\nBaris 2")).toBe('"Baris 1\nBaris 2"');
      expect(escapeCsvField(null)).toBe("");
      expect(escapeCsvField(undefined)).toBe("");
      expect(escapeCsvField("Teks Aman")).toBe("Teks Aman");
    });

    it("GET /api/broadcast/[id]/export: harus menolak jika pengguna belum terotentikasi (401)", async () => {
      vi.mocked(getSession).mockResolvedValue(null);

      const req = new NextRequest("http://localhost:3001/api/broadcast/bc-1/export");
      const res = await exportCsvHandler(req, {
        params: Promise.resolve({ id: "bc-1" }),
      });

      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toContain("Sesi tidak valid");
    });

    it("GET /api/broadcast/[id]/export: harus menolak pengguna non-penulis dan tanpa canSendAll (403)", async () => {
      vi.mocked(getSession).mockResolvedValue({
        user: { id: "user-other", email: "other@pspk.id", name: "Other User" } as never,
        session: {} as never,
      });

      vi.mocked(getAuthContext).mockResolvedValue({
        userId: "user-other",
        employeeId: "emp-other",
        roles: ["employee"],
        permissions: new Set(),
      });

      vi.mocked(prisma.emailBroadcast.findUnique).mockResolvedValue({
        id: "bc-private-1",
        senderUserId: "user-creator",
        recipients: [],
      } as never);

      const req = new NextRequest(
        "http://localhost:3001/api/broadcast/bc-private-1/export",
      );
      const res = await exportCsvHandler(req, {
        params: Promise.resolve({ id: "bc-private-1" }),
      });

      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain("Akses ditolak");
    });

    it("GET /api/broadcast/[id]/export: berhasil menghasilkan berkas CSV dengan UTF-8 BOM dan header attachment untuk pembuat broadcast", async () => {
      vi.mocked(getSession).mockResolvedValue({
        user: { id: "user-author", email: "author@pspk.id", name: "Author User" } as never,
        session: {} as never,
      });

      vi.mocked(getAuthContext).mockResolvedValue({
        userId: "user-author",
        employeeId: "emp-author",
        roles: ["manager"],
        permissions: new Set(["hris.broadcast.send:team"]),
      });

      vi.mocked(prisma.emailBroadcast.findUnique).mockResolvedValue({
        id: "bc-success-export",
        senderUserId: "user-author",
        recipients: [
          {
            recipientName: "Budi Santoso",
            email: "budi@pspk.id",
            status: "SENT",
            attempts: 1,
            sentAt: new Date("2026-11-20T10:00:00Z"),
            readAt: new Date("2026-11-20T10:15:00Z"),
            errorMessage: null,
            employee: {
              currentDepartment: { name: "Riset & Kebijakan" },
            },
          },
          {
            recipientName: "=CMD() Exploit",
            email: "exploit@pspk.id",
            status: "FAILED",
            attempts: 3,
            sentAt: null,
            readAt: null,
            errorMessage: "SMTP Timeout connection refused",
            employee: null,
          },
        ],
      } as never);

      const req = new NextRequest(
        "http://localhost:3001/api/broadcast/bc-success-export/export",
      );
      const res = await exportCsvHandler(req, {
        params: Promise.resolve({ id: "bc-success-export" }),
      });

      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toBe("text/csv; charset=utf-8");
      expect(res.headers.get("Content-Disposition")).toContain(
        'attachment; filename="broadcast-bc-success-export-',
      );

      const arrayBuffer = await res.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      // Verifikasi Byte Order Mark (BOM) UTF-8 pada level biner: 0xEF, 0xBB, 0xBF
      expect(bytes[0]).toBe(0xef);
      expect(bytes[1]).toBe(0xbb);
      expect(bytes[2]).toBe(0xbf);

      const csvText = new TextDecoder("utf-8").decode(bytes);
      // Verifikasi baris header
      expect(csvText).toContain(
        "Nama,Email,Departemen,Status,Waktu Kirim,Percobaan,Pesan Error,Dibaca Pada",
      );

      // Verifikasi data penerima sukses
      expect(csvText).toContain("Riset & Kebijakan");
      expect(csvText).toContain("budi@pspk.id");
      expect(csvText).toContain("SENT");

      // Verifikasi proteksi formula injection untuk "=CMD() Exploit"
      expect(csvText).toContain("'=CMD() Exploit");

      // Verifikasi pencatatan audit log BROADCAST_EXPORT
      expect(writeAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "BROADCAST_EXPORT",
          entityId: "bc-success-export",
        }),
      );
    });
  });

  describe("9.3 Konfirmasi Dibaca (In-App Read Receipts)", () => {
    describe("markBroadcastAsRead", () => {
      it("harus menolak jika pengguna bukan penerima terdaftar dari broadcast", async () => {
        vi.mocked(prisma.emailBroadcast.findUnique).mockResolvedValue({
          id: "bc-read-1",
          subject: "Pengumuman Terbatas",
        } as never);

        vi.mocked(prisma.employee.findFirst).mockResolvedValue({
          id: "emp-unrelated",
          workEmail: "unrelated@pspk.id",
        } as never);

        vi.mocked(prisma.user.findUnique).mockResolvedValue({
          id: "user-unrelated",
          email: "unrelated@pspk.id",
        } as never);

        vi.mocked(prisma.emailBroadcastRecipient.findFirst).mockResolvedValue(null);

        await expect(
          markBroadcastAsRead("user-unrelated", "bc-read-1"),
        ).rejects.toThrow("Anda tidak terdaftar sebagai penerima pengumuman ini.");
      });

      it("harus memperbarui readAt jika pertama kali membaca dan mencatat audit log BROADCAST_READ", async () => {
        const fakeNow = new Date("2026-11-20T11:00:00Z");
        vi.mocked(prisma.emailBroadcast.findUnique).mockResolvedValue({
          id: "bc-read-1",
          subject: "Pengumuman Cuti Bersama",
        } as never);

        vi.mocked(prisma.employee.findFirst).mockResolvedValue({
          id: "emp-recipient",
          workEmail: "recipient@pspk.id",
        } as never);

        vi.mocked(prisma.user.findUnique).mockResolvedValue({
          id: "user-recipient",
          email: "recipient@pspk.id",
        } as never);

        vi.mocked(prisma.emailBroadcastRecipient.findFirst).mockResolvedValue({
          id: "rcpt-1",
          broadcastId: "bc-read-1",
          email: "recipient@pspk.id",
          readAt: null,
        } as never);

        vi.mocked(prisma.emailBroadcastRecipient.update).mockResolvedValue({
          id: "rcpt-1",
          readAt: fakeNow,
        } as never);

        const res = await markBroadcastAsRead("user-recipient", "bc-read-1");
        expect(res.success).toBe(true);
        expect(res.readAt).toBeDefined();

        expect(prisma.emailBroadcastRecipient.update).toHaveBeenCalledWith({
          where: { id: "rcpt-1" },
          data: { readAt: expect.any(Date) },
        });

        expect(writeAudit).toHaveBeenCalledWith(
          expect.objectContaining({
            action: "BROADCAST_READ",
            entityType: "EmailBroadcastRecipient",
            entityId: "rcpt-1",
          }),
        );
      });

      it("harus idempoten: jika penerima sudah memiliki readAt, tidak melakukan update database ulang", async () => {
        const existingReadAt = new Date("2026-11-20T08:00:00Z");

        vi.mocked(prisma.emailBroadcast.findUnique).mockResolvedValue({
          id: "bc-read-1",
          subject: "Pengumuman Cuti Bersama",
        } as never);

        vi.mocked(prisma.employee.findFirst).mockResolvedValue({
          id: "emp-recipient",
          workEmail: "recipient@pspk.id",
        } as never);

        vi.mocked(prisma.user.findUnique).mockResolvedValue({
          id: "user-recipient",
          email: "recipient@pspk.id",
        } as never);

        vi.mocked(prisma.emailBroadcastRecipient.findFirst).mockResolvedValue({
          id: "rcpt-1",
          broadcastId: "bc-read-1",
          email: "recipient@pspk.id",
          readAt: existingReadAt,
        } as never);

        const res = await markBroadcastAsRead("user-recipient", "bc-read-1");
        expect(res.success).toBe(true);
        expect(res.readAt).toEqual(existingReadAt);
        expect(prisma.emailBroadcastRecipient.update).not.toHaveBeenCalled();
      });
    });

    describe("remindUnreadRecipients", () => {
      it("harus menolak pengguna yang bukan pembuat dan bukan pemegang hak canSendAll", async () => {
        vi.mocked(prisma.emailBroadcast.findUnique).mockResolvedValue({
          id: "bc-remind-1",
          senderUserId: "user-original-sender",
          recipients: [],
        } as never);

        vi.mocked(getAuthContext).mockResolvedValue({
          userId: "user-intruder",
          employeeId: "emp-intruder",
          roles: ["employee"],
          permissions: new Set(),
        });

        await expect(
          remindUnreadRecipients("user-intruder", "bc-remind-1"),
        ).rejects.toThrow("Akses ditolak: Hanya pengirim pengumuman atau Admin HR");
      });

      it("berhasil mengirimkan notifikasi pengingat in-app kepada penerima dengan status SENT dan readAt null", async () => {
        vi.mocked(prisma.emailBroadcast.findUnique).mockResolvedValue({
          id: "bc-remind-1",
          subject: "Sosialisasi SOP Baru",
          senderName: "Pusat Studi Pendidikan dan Kebijakan",
          senderEmail: "info@pspk.id",
          senderUserId: "user-author",
          requireReadReceipt: true,
          recipients: [
            {
              id: "rcpt-unread-1",
              status: "SENT",
              readAt: null,
              employee: { userId: "user-target-1" },
            },
            {
              id: "rcpt-unread-2",
              status: "SENT",
              readAt: null,
              employee: { userId: "user-target-2" },
            },
          ],
        } as never);

        vi.mocked(getAuthContext).mockResolvedValue({
          userId: "user-author",
          employeeId: "emp-author",
          roles: ["manager"],
          permissions: new Set(["hris.broadcast.send:team"]),
        });

        vi.mocked(prisma.user.findUnique).mockResolvedValue({
          id: "user-author",
          email: "author@pspk.id",
        } as never);

        vi.mocked(prisma.notification.createMany).mockResolvedValue({ count: 2 });

        const res = await remindUnreadRecipients("user-author", "bc-remind-1");
        expect(res.success).toBe(true);
        expect(res.remindedCount).toBe(2);

        expect(prisma.notification.createMany).toHaveBeenCalledWith({
          data: [
            expect.objectContaining({
              userId: "user-target-1",
              title: "Pengingat: Sosialisasi SOP Baru",
              type: "ACTION_REQUIRED",
              link: "/pengumuman/bc-remind-1",
            }),
            expect.objectContaining({
              userId: "user-target-2",
              title: "Pengingat: Sosialisasi SOP Baru",
              type: "ACTION_REQUIRED",
              link: "/pengumuman/bc-remind-1",
            }),
          ],
        });

        expect(writeAudit).toHaveBeenCalledWith(
          expect.objectContaining({
            action: "BROADCAST_REMIND_UNREAD",
            entityId: "bc-remind-1",
          }),
        );
      });
    });
  });
});
