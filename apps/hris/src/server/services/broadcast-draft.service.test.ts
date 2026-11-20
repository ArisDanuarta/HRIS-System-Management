import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  saveBroadcastDraft,
  getBroadcastDraft,
  listBroadcastDrafts,
  deleteBroadcastDraft,
  saveBroadcastTemplate,
  listBroadcastTemplates,
  deleteBroadcastTemplate,
} from "./broadcast-draft.service";

vi.mock("@pspk/db", () => ({
  prisma: {
    broadcastDraft: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    broadcastTemplate: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
  writeAudit: vi.fn(async () => {}),
}));

import { prisma, writeAudit } from "@pspk/db";

describe("broadcast-draft.service.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Broadcast Drafts Isolation & Quota", () => {
    it("harus menolak pembuatan draf baru jika kuota 50 draf tercapai", async () => {
      vi.mocked(prisma.broadcastDraft.count).mockResolvedValue(50);

      await expect(
        saveBroadcastDraft("user-1", {
          title: "Draf Baru",
          targetScope: "ALL_EMPLOYEES",
          senderPersona: "ORGANIZATION",
          replyToMode: "NO_REPLY",
          subject: "Subjek",
          contentHtml: "<p>Halo</p>",
        }),
      ).rejects.toThrow(/Batas maksimal 50 draf/);
    });

    it("harus berhasil membuat draf baru dan mensanitasi HTML", async () => {
      vi.mocked(prisma.broadcastDraft.count).mockResolvedValue(5);
      const mockCreated = {
        id: "draft-123",
        ownerUserId: "user-1",
        title: "Pengumuman Libur",
        targetScope: "ALL_EMPLOYEES",
        targetDepartmentId: null,
        targetEmployeeIds: [],
        senderPersona: "ORGANIZATION",
        customSenderName: null,
        replyToMode: "NO_REPLY",
        customReplyToEmail: null,
        subject: "Libur Nasional",
        contentHtml: "<p>Libur bersama</p>",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      vi.mocked(prisma.broadcastDraft.create).mockResolvedValue(mockCreated as never);

      const res = await saveBroadcastDraft("user-1", {
        title: "Pengumuman Libur",
        targetScope: "ALL_EMPLOYEES",
        senderPersona: "ORGANIZATION",
        replyToMode: "NO_REPLY",
        subject: "Libur Nasional",
        contentHtml: "<p>Libur bersama</p><script>alert(1)</script>",
      });

      expect(res.id).toBe("draft-123");
      expect(prisma.broadcastDraft.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            ownerUserId: "user-1",
            contentHtml: "<p>Libur bersama</p>", // script di-sanitize
          }),
        }),
      );
    });

    it("harus menolak update draf milik pengguna lain (isolasi draf)", async () => {
      vi.mocked(prisma.broadcastDraft.findUnique).mockResolvedValue({
        id: "draft-other",
        ownerUserId: "user-2", // milik user lain!
      } as never);

      await expect(
        saveBroadcastDraft("user-1", {
          id: "draft-other",
          title: "Coba Update",
          targetScope: "ALL_EMPLOYEES",
          senderPersona: "ORGANIZATION",
          replyToMode: "NO_REPLY",
          subject: "Update",
          contentHtml: "<p>Update</p>",
        }),
      ).rejects.toThrow(
        "Akses ditolak: Draf tidak ditemukan atau Anda bukan pemilik draf ini.",
      );
    });

    it("harus menolak getBroadcastDraft jika draf bukan milik pemanggil", async () => {
      vi.mocked(prisma.broadcastDraft.findUnique).mockResolvedValue({
        id: "draft-x",
        ownerUserId: "user-another",
      } as never);

      await expect(getBroadcastDraft("user-1", "draft-x")).rejects.toThrow(
        "Akses ditolak: Draf tidak ditemukan atau Anda tidak memiliki akses ke draf ini.",
      );
    });

    it("harus menolak deleteBroadcastDraft jika draf bukan milik pemanggil", async () => {
      vi.mocked(prisma.broadcastDraft.findUnique).mockResolvedValue({
        id: "draft-x",
        ownerUserId: "user-another",
      } as never);

      await expect(deleteBroadcastDraft("user-1", "draft-x")).rejects.toThrow(
        "Akses ditolak: Draf tidak ditemukan atau Anda tidak memiliki izin untuk menghapusnya.",
      );
    });

    it("harus berhasil menghapus draf milik sendiri", async () => {
      vi.mocked(prisma.broadcastDraft.findUnique).mockResolvedValue({
        id: "draft-mine",
        ownerUserId: "user-1",
      } as never);
      vi.mocked(prisma.broadcastDraft.delete).mockResolvedValue({} as never);

      const res = await deleteBroadcastDraft("user-1", "draft-mine");
      expect(res.success).toBe(true);
      expect(prisma.broadcastDraft.delete).toHaveBeenCalledWith({
        where: { id: "draft-mine" },
      });
    });

    it("harus memuat daftar draf hanya untuk ownerUserId pemanggil", async () => {
      vi.mocked(prisma.broadcastDraft.findMany).mockResolvedValue([
        {
          id: "d1",
          ownerUserId: "user-1",
          title: "Draf 1",
          targetScope: "ALL_EMPLOYEES",
          targetDepartmentId: null,
          targetEmployeeIds: [],
          senderPersona: "PERSONAL",
          customSenderName: null,
          replyToMode: "NO_REPLY",
          customReplyToEmail: null,
          subject: "Subjek 1",
          contentHtml: "<p>Konten</p>",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ] as never);

      const list = await listBroadcastDrafts("user-1");
      expect(list.length).toBe(1);
      expect(prisma.broadcastDraft.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { ownerUserId: "user-1" },
        }),
      );
    });
  });

  describe("Broadcast Templates Authorization & Auditing", () => {
    it("harus menolak pembuatan template jika kuota 100 template tercapai", async () => {
      vi.mocked(prisma.broadcastTemplate.count).mockResolvedValue(100);

      await expect(
        saveBroadcastTemplate(
          "user-1",
          {
            name: "Template Baru",
            subject: "Subjek",
            contentHtml: "<p>Halo</p>",
          },
          false,
        ),
      ).rejects.toThrow(/Batas maksimal 100 template/);
    });

    it("menolak user non-canSendAll yang mencoba membuat template bersama", async () => {
      await expect(
        saveBroadcastTemplate(
          "user-manager",
          {
            name: "Template Tim",
            subject: "Subjek Tim",
            contentHtml: "<p>Konten</p>",
            isShared: true, // Non-admin coba set isShared
          },
          false, // canSendAll = false (manager)
        ),
      ).rejects.toThrow(
        "Akses ditolak: Hanya Super Admin dan Admin HR yang dapat membagikan template ke semua pengirim.",
      );
      expect(writeAudit).not.toHaveBeenCalled();
    });

    it("mengizinkan user non-canSendAll membuat template pribadi", async () => {
      vi.mocked(prisma.broadcastTemplate.count).mockResolvedValue(10);
      vi.mocked(prisma.broadcastTemplate.create).mockResolvedValue({
        id: "tpl-1",
        name: "Template Pribadi",
        category: null,
        subject: "Subjek Tim",
        contentHtml: "<p>Konten</p>",
        isShared: false,
        createdByUserId: "user-manager",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never);

      const res = await saveBroadcastTemplate(
        "user-manager",
        {
          name: "Template Pribadi",
          subject: "Subjek Tim",
          contentHtml: "<p>Konten</p>",
          isShared: false,
        },
        false,
      );

      expect(res.isShared).toBe(false);
      expect(res.id).toBe("tpl-1");
      expect(writeAudit).not.toHaveBeenCalled();
    });

    it("harus mengizinkan canSendAll membuat template bersama dan mencatat audit log", async () => {
      vi.mocked(prisma.broadcastTemplate.count).mockResolvedValue(10);
      vi.mocked(prisma.broadcastTemplate.create).mockResolvedValue({
        id: "tpl-shared-1",
        name: "Template Lembaga",
        category: "Operasional",
        subject: "Pengumuman Resmi",
        contentHtml: "<p>Resmi</p>",
        isShared: true,
        createdByUserId: "user-admin",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never);

      const res = await saveBroadcastTemplate(
        "user-admin",
        {
          name: "Template Lembaga",
          category: "Operasional",
          subject: "Pengumuman Resmi",
          contentHtml: "<p>Resmi</p>",
          isShared: true,
        },
        true, // canSendAll = true
        { userEmail: "admin@pspk.id", ip: "192.168.1.1", userAgent: "Vitest" },
      );

      expect(res.isShared).toBe(true);
      expect(writeAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          actorUserId: "user-admin",
          actorEmail: "admin@pspk.id",
          action: "BROADCAST_TEMPLATE_CREATE",
          entityType: "BroadcastTemplate",
          entityId: "tpl-shared-1",
        }),
      );
    });

    it("harus menolak user non-canSendAll mengubah template bersama", async () => {
      vi.mocked(prisma.broadcastTemplate.findUnique).mockResolvedValue({
        id: "tpl-shared-x",
        isShared: true,
        createdByUserId: "user-admin",
      } as never);

      await expect(
        saveBroadcastTemplate(
          "user-manager",
          {
            id: "tpl-shared-x",
            name: "Hacked Template",
            subject: "Subjek",
            contentHtml: "<p>Konten</p>",
          },
          false, // canSendAll = false
        ),
      ).rejects.toThrow(
        "Akses ditolak: Anda tidak memiliki wewenang untuk mengubah template bersama.",
      );
    });

    it("harus menolak user non-canSendAll menghapus template bersama", async () => {
      vi.mocked(prisma.broadcastTemplate.findUnique).mockResolvedValue({
        id: "tpl-shared-y",
        isShared: true,
        name: "Template Penting",
      } as never);

      await expect(
        deleteBroadcastTemplate("user-manager", "tpl-shared-y", false),
      ).rejects.toThrow(
        "Akses ditolak: Hanya Super Admin dan Admin HR yang dapat menghapus template bersama.",
      );
    });

    it("harus mencatat audit saat canSendAll menghapus template bersama", async () => {
      vi.mocked(prisma.broadcastTemplate.findUnique).mockResolvedValue({
        id: "tpl-shared-z",
        isShared: true,
        name: "Template Bersama Lama",
      } as never);
      vi.mocked(prisma.broadcastTemplate.delete).mockResolvedValue({} as never);

      const res = await deleteBroadcastTemplate(
        "user-admin",
        "tpl-shared-z",
        true,
        { userEmail: "admin@pspk.id" },
      );

      expect(res.success).toBe(true);
      expect(prisma.broadcastTemplate.delete).toHaveBeenCalledWith({
        where: { id: "tpl-shared-z" },
      });
      expect(writeAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "BROADCAST_TEMPLATE_DELETE",
          actorUserId: "user-admin",
          actorEmail: "admin@pspk.id",
          entityId: "tpl-shared-z",
        }),
      );
    });

    it("harus mengembalikan template pribadi dan template bersama pada listBroadcastTemplates", async () => {
      vi.mocked(prisma.broadcastTemplate.findMany).mockResolvedValue([
        {
          id: "t1",
          name: "Template Pribadiku",
          category: null,
          subject: "Subjek",
          contentHtml: "<p>Konten</p>",
          isShared: false,
          createdByUserId: "user-1",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "t2",
          name: "Template Bersama",
          category: "HR",
          subject: "Subjek",
          contentHtml: "<p>Konten</p>",
          isShared: true,
          createdByUserId: "user-admin",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ] as never);

      const list = await listBroadcastTemplates("user-1");
      expect(list.length).toBe(2);
      expect(list[0]?.isOwner).toBe(true);
      expect(list[1]?.isOwner).toBe(false);
      expect(list[1]?.isShared).toBe(true);
    });
  });
});
