import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  sanitizeBroadcastContent,
  htmlToPlainText,
  renderBroadcastEmailHtml,
  resolveSenderIdentity,
  executeSendBroadcast,
  enqueueBroadcast,
  processBroadcast,
  sendTestBroadcast,
  resendFailedRecipients,
  getBroadcastSenderContext,
  getBroadcastRecipients,
  absolutizeImageUrls,
  escapeHtml,
  replacePersonalizationVariables,
  interpolatePreviewVariables,
} from "./broadcast-email.service";

vi.mock("@pspk/auth", () => ({
  getAuthContext: vi.fn(),
}));

vi.mock("@pspk/rbac", () => ({
  can: vi.fn((ctx, perm: string) => {
    if (typeof perm === "string" && perm.endsWith(":all")) {
      return ctx?.roles?.includes("admin_hr") || ctx?.roles?.includes("super_admin") || false;
    }
    if (typeof perm === "string" && perm.endsWith(":team")) {
      return (
        ctx?.roles?.includes("manager") ||
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
    emailBroadcast: {
      create: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
      updateMany: vi.fn(),
    },
    emailBroadcastRecipient: {
      update: vi.fn(),
      updateMany: vi.fn(),
      findMany: vi.fn(),
      groupBy: vi.fn(),
    },
    auditLog: {
      count: vi.fn(),
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
      canSendAll: true,
      canSendTeam: true,
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
      expect(ctx.canSendAll).toBe(true);
      expect(ctx.canSendTeam).toBe(true);
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
      expect(ctx.canSendAll).toBe(false);
      expect(ctx.canSendTeam).toBe(true);
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
        canSendAll: false,
        canSendTeam: true,
        allowedScopes: ["TEAM" as const],
        teamMembersCount: 4,
      };

      await expect(
        getBroadcastRecipients(managerCtx, "ALL_EMPLOYEES"),
      ).rejects.toThrow("Akses ditolak: Anda hanya diizinkan mengirim pengumuman ke anggota timnya sendiri.");
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
        canSendAll: false,
        canSendTeam: true,
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

    it("harus mendukung pemilihan multi-departemen dengan opsi departmentIds", async () => {
      const adminCtx = {
        userId: "user-admin",
        userEmail: "admin@pspk.id",
        userName: "Admin HR",
        employeeId: "emp-admin",
        employeeTitle: "HR Lead",
        isSuperAdmin: true,
        isAdminHr: true,
        isManager: false,
        canSendAll: true,
        canSendTeam: true,
        allowedScopes: ["ALL_EMPLOYEES" as const, "DEPARTMENT" as const, "TEAM" as const, "CUSTOM" as const],
        teamMembersCount: 0,
      };

      vi.mocked(prisma.employee.findMany).mockResolvedValue([
        {
          id: "emp-10",
          fullName: "Faisal",
          workEmail: "faisal@pspk.id",
          userId: "user-10",
          currentDepartment: { name: "Riset" },
        },
        {
          id: "emp-11",
          fullName: "Gita",
          workEmail: "gita@pspk.id",
          userId: "user-11",
          currentDepartment: { name: "Kebijakan" },
        },
      ] as unknown as MockEmployeeMany);

      const recipients = await getBroadcastRecipients(adminCtx, "DEPARTMENT", {
        departmentIds: ["dept-riset", "dept-kebijakan"],
      });

      expect(recipients).toHaveLength(2);
      expect(prisma.employee.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            currentDepartmentId: { in: ["dept-riset", "dept-kebijakan"] },
            status: "ACTIVE",
          }),
        }),
      );
    });

    it("harus mengecualikan karyawan yang didaftarkan pada excludedEmployeeIds", async () => {
      const adminCtx = {
        userId: "user-admin",
        userEmail: "admin@pspk.id",
        userName: "Admin HR",
        employeeId: "emp-admin",
        employeeTitle: "HR Lead",
        isSuperAdmin: true,
        isAdminHr: true,
        isManager: false,
        canSendAll: true,
        canSendTeam: true,
        allowedScopes: ["ALL_EMPLOYEES" as const, "DEPARTMENT" as const, "TEAM" as const, "CUSTOM" as const],
        teamMembersCount: 0,
      };

      vi.mocked(prisma.employee.findMany).mockResolvedValue([
        {
          id: "emp-12",
          fullName: "Hadi",
          workEmail: "hadi@pspk.id",
          userId: "user-12",
          currentDepartment: { name: "Operasional" },
        },
      ] as unknown as MockEmployeeMany);

      const recipients = await getBroadcastRecipients(adminCtx, "ALL_EMPLOYEES", {
        excludedEmployeeIds: ["emp-cuti-1", "emp-cuti-2"],
      });

      expect(recipients).toHaveLength(1);
      expect(prisma.employee.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: { notIn: ["emp-cuti-1", "emp-cuti-2"] },
            status: "ACTIVE",
          }),
        }),
      );
    });

    it("harus mendukung fallback data lama dengan string targetDepartmentId", async () => {
      const adminCtx = {
        userId: "user-admin",
        userEmail: "admin@pspk.id",
        userName: "Admin HR",
        employeeId: "emp-admin",
        employeeTitle: "HR Lead",
        isSuperAdmin: true,
        isAdminHr: true,
        isManager: false,
        canSendAll: true,
        canSendTeam: true,
        allowedScopes: ["ALL_EMPLOYEES" as const, "DEPARTMENT" as const, "TEAM" as const, "CUSTOM" as const],
        teamMembersCount: 0,
      };

      vi.mocked(prisma.employee.findMany).mockResolvedValue([
        {
          id: "emp-legacy",
          fullName: "Indra",
          workEmail: "indra@pspk.id",
          userId: "user-legacy",
          currentDepartment: { name: "Riset" },
        },
      ] as unknown as MockEmployeeMany);

      const recipients = await getBroadcastRecipients(adminCtx, "DEPARTMENT", "dept-legacy-1");

      expect(recipients).toHaveLength(1);
      expect(prisma.employee.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            currentDepartmentId: { in: ["dept-legacy-1"] },
            status: "ACTIVE",
          }),
        }),
      );
    });

    it("harus mendukung pengecualian anggota tim pada scope TEAM bagi manajer", async () => {
      const managerCtx = {
        userId: "user-mgr",
        userEmail: "agus@pspk.id",
        userName: "Agus Lead",
        employeeId: "emp-mgr",
        employeeTitle: "Lead Peneliti",
        isSuperAdmin: false,
        isAdminHr: false,
        isManager: true,
        canSendAll: false,
        canSendTeam: true,
        allowedScopes: ["TEAM" as const],
        teamMembersCount: 2,
      };

      vi.mocked(prisma.employee.findMany).mockResolvedValue([
        {
          id: "emp-aktif-team",
          fullName: "Karyawan Masuk",
          workEmail: "masuk@pspk.id",
          userId: "user-masuk",
          currentDepartment: { name: "Riset" },
        },
      ] as unknown as MockEmployeeMany);

      const recipients = await getBroadcastRecipients(managerCtx, "TEAM", null, undefined, {
        excludedEmployeeIds: ["emp-cuti-team"],
      });

      expect(recipients).toHaveLength(1);
      expect(prisma.employee.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            managerId: "emp-mgr",
            id: { notIn: ["emp-cuti-team"] },
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
      ).rejects.toThrow("Akses ditolak: Anda hanya dapat menerbitkan pengumuman atas nama pribadi.");
    });

    it("harus menolak jika Manajer mencoba mengirim dengan persona CUSTOM", async () => {
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
          subject: "Pengumuman Palsu Panitia",
          contentHtml: "<p>Ini tidak boleh lolos.</p>",
          targetScope: "TEAM",
          senderPersona: "CUSTOM",
          customSenderName: "Panitia Kustom",
        }),
      ).rejects.toThrow("Akses ditolak: Anda hanya dapat menerbitkan pengumuman atas nama pribadi.");
    });
  });

  describe("absolutizeImageUrls", () => {
    it("harus mengubah URL gambar relatif /api/documents/... menjadi absolut", () => {
      const originalEnv = process.env.HRIS_URL;
      process.env.HRIS_URL = "https://hris.pspk.id";

      try {
        const inputHtml = '<p>Lihat bagan berikut:</p><img src="/api/documents/broadcast-images/test-123.png" alt="Bagan" />';
        const result = absolutizeImageUrls(inputHtml);

        expect(result).toContain('src="https://hris.pspk.id/api/documents/broadcast-images/test-123.png"');
      } finally {
        process.env.HRIS_URL = originalEnv;
      }
    });

    it("tidak mengubah gambar yang sudah memiliki URL eksternal http/https", () => {
      const inputHtml = '<img src="https://images.unsplash.com/photo-123" alt="Foto" />';
      const result = absolutizeImageUrls(inputHtml);

      expect(result).toBe(inputHtml);
    });
  });

  describe("enqueueBroadcast & processBroadcast", () => {
    it("enqueueBroadcast harus membuat record berstatus QUEUED dan mendaftarkan recipient PENDING", async () => {
      vi.mocked(getAuthContext).mockResolvedValue({
        userId: "user-hr-1",
        employeeId: "emp-hr-1",
        roles: ["admin_hr"],
        permissions: new Set(["hris.broadcast.send:all"]),
      });

      vi.mocked(prisma.employee.findFirst).mockResolvedValue({
        id: "emp-hr-1",
        fullName: "Admin HR",
        workEmail: "hr@pspk.id",
        currentPosition: { title: "HR Specialist", isUnitHead: false },
        currentDepartment: { id: "dept-1", name: "People & Culture" },
      } as unknown as MockEmployeeFirst);

      vi.mocked(prisma.employee.findMany).mockResolvedValue([
        {
          id: "emp-2",
          fullName: "Staf 2",
          workEmail: "staf2@pspk.id",
          userId: "user-staf-2",
          currentDepartment: { name: "Riset" },
        },
      ] as unknown as MockEmployeeMany);

      vi.mocked(prisma.emailBroadcast.create).mockResolvedValue({
        id: "bc-queued-1",
        subject: "Surat Edaran Libur",
      } as never);

      const res = await enqueueBroadcast("user-hr-1", {
        subject: "Surat Edaran Libur",
        contentHtml: "<p>Libur bersama dimulai lusa.</p>",
        targetScope: "ALL_EMPLOYEES",
      });

      expect(res.success).toBe(true);
      expect(res.broadcastId).toBe("bc-queued-1");
      expect(res.totalRecipients).toBe(1);
      expect(prisma.emailBroadcast.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: "QUEUED",
            totalRecipients: 1,
            recipients: expect.objectContaining({
              create: expect.arrayContaining([
                expect.objectContaining({
                  email: "staf2@pspk.id",
                  status: "PENDING",
                }),
              ]),
            }),
          }),
        }),
      );
    });

    it("processBroadcast harus mengembalikan reason BROADCAST_NOT_FOUND jika broadcast id tidak ada", async () => {
      vi.mocked(prisma.emailBroadcast.findUnique).mockResolvedValue(null);

      const res = await processBroadcast("bc-none");
      expect(res.processed).toBe(false);
      expect(res.reason).toBe("BROADCAST_NOT_FOUND");
    });

    it("processBroadcast harus mengembalikan reason ALREADY_FINISHED jika status sudah SENT", async () => {
      vi.mocked(prisma.emailBroadcast.findUnique).mockResolvedValue({
        id: "bc-done",
        status: "SENT",
        sentCount: 10,
        failedCount: 0,
      } as never);

      const res = await processBroadcast("bc-done");
      expect(res.processed).toBe(false);
      expect(res.reason).toBe("ALREADY_FINISHED");
      expect(res.finalStatus).toBe("SENT");
    });

    it("processBroadcast berhasil memproses antrean QUEUED dan memperbarui status menjadi SENT", async () => {
      vi.mocked(prisma.emailBroadcast.findUnique).mockResolvedValue({
        id: "bc-to-process",
        subject: "Pengumuman Rapat",
        contentHtml: "<p>Konten rapat.</p>",
        contentText: "Konten rapat.",
        senderName: "Admin HR",
        senderEmail: "hr@pspk.id",
        replyToEmail: "hr@pspk.id",
        targetScope: "ALL_EMPLOYEES",
        status: "QUEUED",
        sendInApp: false,
        totalRecipients: 1,
        sentCount: 0,
        failedCount: 0,
      } as never);

      vi.mocked(prisma.emailBroadcast.updateMany).mockResolvedValue({ count: 1 });
      vi.mocked(prisma.emailBroadcastRecipient.updateMany).mockResolvedValue({ count: 1 });

      // Batch loop: 1 item pada iterasi pertama, lalu kosong
      vi.mocked(prisma.emailBroadcastRecipient.findMany)
        .mockResolvedValueOnce([
          {
            id: "rcpt-1",
            recipientName: "Staf 1",
            email: "staf1@pspk.id",
          },
        ] as never)
        .mockResolvedValueOnce([] as never);

      vi.mocked(prisma.emailBroadcastRecipient.groupBy).mockResolvedValue([
        { status: "SENT", _count: { id: 1 } },
      ] as never);

      vi.mocked(prisma.emailBroadcast.update).mockResolvedValue({} as never);

      const res = await processBroadcast("bc-to-process");
      expect(res.processed).toBe(true);
      expect(res.finalStatus).toBe("SENT");
      expect(res.sentCount).toBe(1);
      expect(res.failedCount).toBe(0);
      expect(prisma.emailBroadcast.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "bc-to-process" },
          data: expect.objectContaining({
            status: "SENT",
            lockedAt: null,
          }),
        }),
      );
    });
  });

  describe("sendTestBroadcast", () => {
    it("harus melempar error jika akun pengguna belum memiliki email kerja yang valid", async () => {
      vi.mocked(getAuthContext).mockResolvedValue({
        userId: "user-no-email",
        employeeId: "emp-no-email",
        roles: ["admin_hr"],
        permissions: new Set(["hris.broadcast.send:all"]),
      });

      vi.mocked(prisma.employee.findFirst).mockResolvedValue({
        id: "emp-no-email",
        fullName: "Staf Tanpa Email",
        workEmail: "",
        currentPosition: { title: "Staf" },
      } as unknown as MockEmployeeFirst);

      await expect(
        sendTestBroadcast("user-no-email", {
          subject: "Uji Coba",
          contentHtml: "<p>Konten uji coba yang valid.</p>",
        }),
      ).rejects.toThrow("Akun Anda belum memiliki alamat email kerja yang valid");
    });

    it("harus melempar error jika melebihi batas rate limit 5x dalam 10 menit", async () => {
      vi.mocked(getAuthContext).mockResolvedValue({
        userId: "user-rate-limited",
        employeeId: "emp-rl",
        roles: ["admin_hr"],
        permissions: new Set(["hris.broadcast.send:all"]),
      });

      vi.mocked(prisma.employee.findFirst).mockResolvedValue({
        id: "emp-rl",
        fullName: "Admin Terbatas",
        workEmail: "admin@pspk.id",
        currentPosition: { title: "Admin" },
      } as unknown as MockEmployeeFirst);

      vi.mocked(prisma.auditLog.count).mockResolvedValue(5);

      await expect(
        sendTestBroadcast("user-rate-limited", {
          subject: "Uji Coba",
          contentHtml: "<p>Konten uji coba yang valid.</p>",
        }),
      ).rejects.toThrow("Terlalu sering mengirim email uji. Batas maksimal adalah 5 kali per 10 menit.");
    });

    it("berhasil mengirim email uji simulasi tanpa membuat record EmailBroadcast dan mencatat audit", async () => {
      vi.mocked(getAuthContext).mockResolvedValue({
        userId: "user-test-ok",
        employeeId: "emp-ok",
        roles: ["admin_hr"],
        permissions: new Set(["hris.broadcast.send:all"]),
      });

      vi.mocked(prisma.employee.findFirst).mockResolvedValue({
        id: "emp-ok",
        fullName: "Budi Peneliti",
        workEmail: "budi@pspk.id",
        currentPosition: { title: "Peneliti Senior" },
      } as unknown as MockEmployeeFirst);

      vi.mocked(prisma.auditLog.count).mockResolvedValue(1);

      const res = await sendTestBroadcast("user-test-ok", {
        subject: "Surat Edaran Percobaan",
        contentHtml: "<p>Ini pesan uji coba pengumuman.</p>",
        senderPersona: "ORGANIZATION",
      });

      expect(res.success).toBe(true);
      expect(res.message).toContain("budi@pspk.id");
      // Memastikan TIDAK membuat record EmailBroadcast
      expect(prisma.emailBroadcast.create).not.toHaveBeenCalled();
    });
  });

  describe("resendFailedRecipients", () => {
    it("harus melempar error jika broadcast tidak ditemukan", async () => {
      vi.mocked(prisma.emailBroadcast.findUnique).mockResolvedValue(null);

      await expect(
        resendFailedRecipients("user-1", "bc-notfound"),
      ).rejects.toThrow("Pengumuman tidak ditemukan.");
    });

    it("harus melempar error jika broadcast masih berstatus QUEUED atau SENDING", async () => {
      vi.mocked(prisma.emailBroadcast.findUnique).mockResolvedValue({
        id: "bc-running",
        status: "SENDING",
      } as never);

      await expect(
        resendFailedRecipients("user-1", "bc-running"),
      ).rejects.toThrow("Pengumuman masih dalam proses pengiriman antrean.");
    });

    it("harus melempar error jika pengguna bukan pembuat dan bukan pemegang hak all", async () => {
      vi.mocked(prisma.emailBroadcast.findUnique).mockResolvedValue({
        id: "bc-failed-1",
        status: "PARTIALLY_FAILED",
        senderUserId: "author-other",
        recipients: [
          { id: "rcpt-1", status: "FAILED", employee: { status: "ACTIVE", workEmail: "a@pspk.id" } },
        ],
      } as never);

      vi.mocked(getAuthContext).mockResolvedValue({
        userId: "user-unauthorized",
        employeeId: "emp-unauth",
        roles: ["employee"],
        permissions: new Set(),
      });

      await expect(
        resendFailedRecipients("user-unauthorized", "bc-failed-1"),
      ).rejects.toThrow("Akses ditolak: Anda tidak memiliki izin untuk mengirim ulang pengumuman ini.");
    });

    it("harus melempar error jika tidak ada penerima berstatus FAILED", async () => {
      vi.mocked(prisma.emailBroadcast.findUnique).mockResolvedValue({
        id: "bc-all-sent",
        status: "SENT",
        senderUserId: "user-author",
        recipients: [],
      } as never);

      vi.mocked(getAuthContext).mockResolvedValue({
        userId: "user-author",
        employeeId: "emp-author",
        roles: ["employee"],
        permissions: new Set(),
      });

      await expect(
        resendFailedRecipients("user-author", "bc-all-sent"),
      ).rejects.toThrow("Tidak ada penerima berstatus gagal pada pengumuman ini.");
    });

    it("berhasil mengubah status recipient FAILED yang valid ke PENDING dan mengembalikan broadcast ke QUEUED", async () => {
      vi.mocked(prisma.emailBroadcast.findUnique).mockResolvedValue({
        id: "bc-to-resend",
        status: "PARTIALLY_FAILED",
        senderUserId: "user-author",
        senderEmail: "author@pspk.id",
        subject: "Pengumuman Penting",
        recipients: [
          {
            id: "rcpt-failed-active",
            status: "FAILED",
            employee: { id: "emp-1", status: "ACTIVE", workEmail: "emp1@pspk.id" },
          },
          {
            id: "rcpt-failed-inactive",
            status: "FAILED",
            employee: { id: "emp-2", status: "TERMINATED", workEmail: "emp2@pspk.id" },
          },
        ],
      } as never);

      vi.mocked(getAuthContext).mockResolvedValue({
        userId: "user-author",
        employeeId: "emp-author",
        roles: ["employee"],
        permissions: new Set(),
      });

      vi.mocked(prisma.emailBroadcastRecipient.updateMany).mockResolvedValue({ count: 1 });
      vi.mocked(prisma.emailBroadcast.update).mockResolvedValue({} as never);

      const res = await resendFailedRecipients("user-author", "bc-to-resend");

      expect(res.success).toBe(true);
      expect(res.retriedCount).toBe(1);
      // Memastikan yang inactive ditandai FAILED dengan pesan tidak aktif
      expect(prisma.emailBroadcastRecipient.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: { in: ["rcpt-failed-inactive"] } },
          data: expect.objectContaining({
            status: "FAILED",
            errorMessage: "Karyawan sudah tidak aktif atau email kerja tidak valid.",
          }),
        }),
      );
      // Memastikan yang active disetel ke PENDING
      expect(prisma.emailBroadcastRecipient.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: { in: ["rcpt-failed-active"] } },
          data: expect.objectContaining({
            status: "PENDING",
            errorMessage: null,
          }),
        }),
      );
      // Memastikan status broadcast induk disetel kembali ke QUEUED
      expect(prisma.emailBroadcast.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "bc-to-resend" },
          data: expect.objectContaining({
            status: "QUEUED",
            lockedAt: null,
          }),
        }),
      );
    });
  });

  describe("Personalization Variables & HTML Escaping", () => {
    it("harus meng-escape karakter HTML khusus dengan aman", () => {
      expect(escapeHtml("Budi & Joko")).toBe("Budi &amp; Joko");
      expect(escapeHtml("<script>alert('xss')</script>")).toBe(
        "&lt;script&gt;alert(&#39;xss&#39;)&lt;/script&gt;",
      );
      expect(escapeHtml('"quoted"')).toBe("&quot;quoted&quot;");
    });

    it("harus mengganti variabel {{nama}} dan {{nama_depan}} untuk penerima", () => {
      const template = "Halo {{nama}}, apakah nama panggilanmu {{nama_depan}}?";
      const recipient = {
        fullName: "Siti Rahmawati Putri",
        workEmail: "siti@pspk.id",
      };

      const result = replacePersonalizationVariables(template, recipient);
      expect(result).toBe("Halo Siti Rahmawati Putri, apakah nama panggilanmu Siti?");
    });

    it("harus meng-escape karakter HTML pada nama penerima saat interpolasi variabel", () => {
      const template = "<p>Selamat datang, {{nama}} ({{nama_depan}})!</p>";
      const maliciousRecipient = {
        fullName: "Budi <img src=x onerror=alert(1)> Santoso",
        workEmail: "budi@pspk.id",
      };

      const result = replacePersonalizationVariables(template, maliciousRecipient);
      expect(result).not.toContain("<img");
      expect(result).toContain("&lt;img src=x onerror=alert(1)&gt;");
    });

    it("harus menangani kasus nama kosong atau whitespace saja dengan fallback 'Rekan PSPK'", () => {
      const template = "Halo {{nama}}, sapaan singkat: {{nama_depan}}.";
      const emptyRecipient = {
        fullName: "   ",
        workEmail: "anon@pspk.id",
      };

      const result = replacePersonalizationVariables(template, emptyRecipient);
      expect(result).toBe("Halo Rekan PSPK, sapaan singkat: Rekan.");
    });

    it("harus menginterpolasi preview dengan nama contoh Budi Santoso", () => {
      const template = "Yth. {{nama}}, terima kasih atas kerja keras Anda, {{nama_depan}}.";
      const preview = interpolatePreviewVariables(template);
      expect(preview).toBe("Yth. Budi Santoso, terima kasih atas kerja keras Anda, Budi.");
    });
  });
});
