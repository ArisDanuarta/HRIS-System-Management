import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  sanitizeBroadcastContent,
  htmlToPlainText,
  renderBroadcastEmailHtml,
  resolveSenderIdentity,
  executeSendBroadcast,
  getBroadcastSenderContext,
  getBroadcastRecipients,
} from "./broadcast-email.service";

vi.mock("@pspk/auth", () => ({
  getAuthContext: vi.fn(),
}));

vi.mock("@pspk/db", () => ({
  prisma: {
    employee: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    emailBroadcast: {
      create: vi.fn(),
      update: vi.fn(),
    },
    emailBroadcastRecipient: {
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    notification: {
      createMany: vi.fn(),
    },
  },
  writeAudit: vi.fn(async () => {}),
}));

import { getAuthContext } from "@pspk/auth";
import { prisma } from "@pspk/db";

type MockEmployeeFirst = Awaited<ReturnType<typeof prisma.employee.findFirst>>;
type MockEmployeeMany = Awaited<ReturnType<typeof prisma.employee.findMany>>;

describe("broadcast-email.service.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("HTML Sanitization & Plain Text Conversion", () => {
    it("harus membersihkan script berbahaya dan atribut event handler dari konten HTML", () => {
      const unsafeHtml = `
        <h2>Pengumuman Penting</h2>
        <p>Halo tim, silakan cek tautan berikut.</p>
        <script>alert('xss attack');</script>
        <img src="/api/documents/broadcast-images/test.png" onerror="alert(1)" alt="Bagan" />
        <a href="javascript:alert('steal')" target="_blank">Klik Di Sini</a>
      `;

      const cleaned = sanitizeBroadcastContent(unsafeHtml);

      expect(cleaned).not.toContain("<script>");
      expect(cleaned).not.toContain("alert");
      expect(cleaned).not.toContain("onerror");
      expect(cleaned).not.toContain("javascript:");
      expect(cleaned).toContain("<h2>Pengumuman Penting</h2>");
      expect(cleaned).toContain('alt="Bagan"');
    });

    it("harus mengonversi HTML ke teks polos (plain text) yang rapi", () => {
      const html = `
        <h2>Rapat Kerja</h2>
        <p>Berikut agenda rapat:</p>
        <ul>
          <li>Evaluasi Program</li>
          <li>Perencanaan Anggaran</li>
        </ul>
      `;

      const text = htmlToPlainText(html);

      expect(text).toContain("Rapat Kerja");
      expect(text).toContain("Berikut agenda rapat:");
      expect(text).toContain("• Evaluasi Program");
      expect(text).toContain("• Perencanaan Anggaran");
      expect(text).not.toContain("<h2>");
      expect(text).not.toContain("<li>");
    });
  });

  describe("renderBroadcastEmailHtml", () => {
    it("harus merender email HTML dengan identitas resmi PSPK dan nama penerima", () => {
      const html = renderBroadcastEmailHtml({
        subject: "Pengumuman Libur Bersama",
        contentHtml: "<p>Kantor libur tanggal 1 Mei.</p>",
        recipientName: "Budi Santoso",
        senderName: "Dian Sastro",
        senderTitle: "Head of Operations",
        scopeBadge: "PENGUMUMAN ORGANISASI",
        year: 2026,
      });

      expect(html).toContain("Pusat Studi Pendidikan dan Kebijakan");
      expect(html).toContain("Halo Budi Santoso,");
      expect(html).toContain("Dian Sastro");
      expect(html).toContain("Head of Operations");
      expect(html).toContain("PENGUMUMAN ORGANISASI");
      expect(html).toContain("&copy; 2026");
      expect(html).toContain("no-reply@pspk.id");
    });

    it("harus merender kartu institusi resmi dan kotak no-reply jika bukan perorangan", () => {
      const html = renderBroadcastEmailHtml({
        subject: "Selamat Tahun Baru 2026",
        contentHtml: "<p>Selamat menyambut tahun baru seluruh keluarga besar PSPK.</p>",
        recipientName: "Rekan PSPK",
        senderName: "Pusat Studi Pendidikan dan Kebijakan (PSPK)",
        senderTitle: "Pengumuman Resmi Institusi",
        scopeBadge: "PENGUMUMAN ORGANISASI",
        isPersonal: false,
        replyToMode: "NO_REPLY",
        year: 2026,
      });

      expect(html).toContain("Diterbitkan secara resmi oleh:");
      expect(html).toContain("Pusat Studi Pendidikan dan Kebijakan (PSPK)");
      expect(html).toContain("Pengumuman Resmi Institusi");
      expect(html).toContain("Email ini bersifat pengumuman satu arah resmi");
      expect(html).toContain("reply-box-noreply");
    });

    it("harus merender informasi kontak Tim HR jika mode balasan ORGANIZATION_HR", () => {
      const html = renderBroadcastEmailHtml({
        subject: "Pembaruan Kebijakan Asuransi",
        contentHtml: "<p>Mohon perbarui formulir data tanggungan keluarga.</p>",
        recipientName: "Budi Santoso",
        senderName: "Tim People & Culture (HR) PSPK",
        senderTitle: "Pengumuman Kepegawaian & Operasional",
        scopeBadge: "PENGUMUMAN ORGANISASI",
        isPersonal: false,
        replyToMode: "ORGANIZATION_HR",
        replyToEmail: "hr@pspk.id",
      });

      expect(html).toContain("Tim People &amp; Culture (HR) PSPK");
      expect(html).toContain("hr@pspk.id");
    });
  });

  describe("resolveSenderIdentity", () => {
    const mockCtx = {
      userId: "user-1",
      userEmail: "aris@pspk.id",
      userName: "Aris Danuarta",
      employeeId: "emp-1",
      employeeTitle: "IT Administrator",
      isSuperAdmin: true,
      isAdminHr: true,
      isManager: false,
      allowedScopes: ["ALL_EMPLOYEES" as const],
      teamMembersCount: 0,
    };

    it("harus menyelesaikan persona ORGANIZATION secara default", () => {
      const resolved = resolveSenderIdentity(mockCtx);
      expect(resolved.displayName).toBe("Pusat Studi Pendidikan dan Kebijakan (PSPK)");
      expect(resolved.displayTitle).toBe("Pengumuman Resmi Institusi");
      expect(resolved.isPersonal).toBe(false);
      expect(resolved.replyToEmail).toBe("no-reply@pspk.id");
      expect(resolved.replyToMode).toBe("NO_REPLY");
    });

    it("harus menyelesaikan persona HR_TEAM dengan balasan ORGANIZATION_HR", () => {
      const resolved = resolveSenderIdentity(
        mockCtx,
        "HR_TEAM",
        undefined,
        "ORGANIZATION_HR",
      );
      expect(resolved.displayName).toBe("Tim People & Culture (HR) PSPK");
      expect(resolved.displayTitle).toBe("Pengumuman Kepegawaian & Operasional");
      expect(resolved.isPersonal).toBe(false);
      expect(resolved.replyToEmail).toBe("hr@pspk.id");
      expect(resolved.replyToHeader).toContain("hr@pspk.id");
    });

    it("harus menyelesaikan persona PERSONAL dengan balasan SENDER_PERSONAL", () => {
      const resolved = resolveSenderIdentity(
        mockCtx,
        "PERSONAL",
        undefined,
        "SENDER_PERSONAL",
      );
      expect(resolved.displayName).toBe("Aris Danuarta");
      expect(resolved.displayTitle).toBe("IT Administrator");
      expect(resolved.isPersonal).toBe(true);
      expect(resolved.replyToEmail).toBe("aris@pspk.id");
      expect(resolved.replyToHeader).toContain("aris@pspk.id");
    });

    it("harus menyelesaikan persona CUSTOM dengan nama dan email kustom", () => {
      const resolved = resolveSenderIdentity(
        mockCtx,
        "CUSTOM",
        "Panitia Raker 2026",
        "CUSTOM",
        "raker@pspk.id",
      );
      expect(resolved.displayName).toBe("Panitia Raker 2026");
      expect(resolved.isPersonal).toBe(false);
      expect(resolved.replyToEmail).toBe("raker@pspk.id");
      expect(resolved.replyToHeader).toContain("raker@pspk.id");
    });
  });

  describe("getBroadcastSenderContext", () => {
    it("harus mengembalikan konteks Admin HR dengan seluruh cakupan yang diizinkan", async () => {
      vi.mocked(getAuthContext).mockResolvedValue({
        userId: "user-hr",
        employeeId: "emp-hr",
        roles: ["admin_hr"],
        permissions: new Set(["hris.broadcast.send:all"]),
      });

      vi.mocked(prisma.employee.findFirst).mockResolvedValue({
        id: "emp-hr",
        fullName: "Siti Rahma",
        workEmail: "siti.rahma@pspk.id",
        currentPosition: { title: "HR Manager", isUnitHead: false },
        currentDepartment: { id: "dept-1", name: "People & Culture" },
      } as unknown as MockEmployeeFirst);

      vi.mocked(prisma.employee.count).mockResolvedValue(5);

      const ctx = await getBroadcastSenderContext("user-hr");

      expect(ctx.isAdminHr).toBe(true);
      expect(ctx.userName).toBe("Siti Rahma");
      expect(ctx.allowedScopes).toEqual(["ALL_EMPLOYEES", "DEPARTMENT", "TEAM", "CUSTOM"]);
    });

    it("harus mengembalikan konteks Manajer dengan cakupan hanya TEAM", async () => {
      vi.mocked(getAuthContext).mockResolvedValue({
        userId: "user-mgr",
        employeeId: "emp-mgr",
        roles: ["manager"],
        permissions: new Set(["hris.broadcast.send:team"]),
      });

      vi.mocked(prisma.employee.findFirst).mockResolvedValue({
        id: "emp-mgr",
        fullName: "Agus Pratama",
        workEmail: "agus.pratama@pspk.id",
        currentPosition: { title: "Lead Peneliti", isUnitHead: true },
        currentDepartment: { id: "dept-2", name: "Riset Kebijakan" },
      } as unknown as MockEmployeeFirst);

      vi.mocked(prisma.employee.count).mockResolvedValue(8);

      const ctx = await getBroadcastSenderContext("user-mgr");

      expect(ctx.isManager).toBe(true);
      expect(ctx.isAdminHr).toBe(false);
      expect(ctx.allowedScopes).toEqual(["TEAM"]);
      expect(ctx.teamMembersCount).toBe(8);
    });

    it("harus melempar error jika pengguna adalah staf biasa tanpa peran pengirim", async () => {
      vi.mocked(getAuthContext).mockResolvedValue({
        userId: "user-staff",
        employeeId: "emp-staff",
        roles: ["staff"],
        permissions: new Set(["hris.broadcast.read:own"]),
      });

      await expect(getBroadcastSenderContext("user-staff")).rejects.toThrow(
        "Akses ditolak: Anda tidak memiliki izin",
      );
    });
  });

  describe("getBroadcastRecipients", () => {
    it("harus menolak manajer yang mencoba mengirim ke ALL_EMPLOYEES", async () => {
      const managerCtx = {
        userId: "user-mgr",
        userEmail: "agus@pspk.id",
        userName: "Agus",
        employeeId: "emp-mgr",
        employeeTitle: "Lead",
        isSuperAdmin: false,
        isAdminHr: false,
        isManager: true,
        allowedScopes: ["TEAM" as const],
        teamMembersCount: 4,
      };

      await expect(
        getBroadcastRecipients(managerCtx, "ALL_EMPLOYEES"),
      ).rejects.toThrow("Akses ditolak: Manajer / Lead tim hanya diizinkan");
    });

    it("harus mengambil daftar anggota tim langsung untuk manajer", async () => {
      const managerCtx = {
        userId: "user-mgr",
        userEmail: "agus@pspk.id",
        userName: "Agus",
        employeeId: "emp-mgr",
        employeeTitle: "Lead",
        isSuperAdmin: false,
        isAdminHr: false,
        isManager: true,
        allowedScopes: ["TEAM" as const],
        teamMembersCount: 2,
      };

      vi.mocked(prisma.employee.findMany).mockResolvedValue([
        {
          id: "emp-1",
          fullName: "Deni",
          workEmail: "deni@pspk.id",
          userId: "user-1",
          currentDepartment: { name: "Riset" },
        },
        {
          id: "emp-2",
          fullName: "Eka",
          workEmail: "eka@pspk.id",
          userId: "user-2",
          currentDepartment: { name: "Riset" },
        },
      ] as unknown as MockEmployeeMany);

      const recipients = await getBroadcastRecipients(managerCtx, "TEAM");

      expect(recipients).toHaveLength(2);
      expect(recipients[0]?.fullName).toBe("Deni");
      expect(recipients[1]?.workEmail).toBe("eka@pspk.id");
      expect(prisma.employee.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            managerId: "emp-mgr",
            status: "ACTIVE",
          }),
        }),
      );
    });
  });

  describe("executeSendBroadcast - Otorisasi Persona", () => {
    it("harus menolak jika Manajer mencoba mengirim atas nama Lembaga (ORGANIZATION)", async () => {
      vi.mocked(getAuthContext).mockResolvedValue({
        userId: "user-mgr-2",
        employeeId: "emp-mgr-2",
        roles: ["manager"],
        permissions: new Set(["hris.broadcast.send:team"]),
      });

      vi.mocked(prisma.employee.findFirst).mockResolvedValue({
        id: "emp-mgr-2",
        fullName: "Agus Manajer",
        workEmail: "agus@pspk.id",
        currentPosition: { title: "Lead Peneliti", isUnitHead: true },
        currentDepartment: { id: "dept-2", name: "Riset Kebijakan" },
      } as unknown as MockEmployeeFirst);

      await expect(
        executeSendBroadcast("user-mgr-2", {
          subject: "Pengumuman Palsu Lembaga",
          contentHtml: "<p>Ini tidak boleh lolos.</p>",
          targetScope: "TEAM",
          senderPersona: "ORGANIZATION",
        }),
      ).rejects.toThrow("Akses ditolak: Hanya Administrator HR dan Super Administrator");
    });
  });
});
