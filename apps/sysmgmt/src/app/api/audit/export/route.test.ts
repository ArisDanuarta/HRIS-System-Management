import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@pspk/auth", () => ({
  getSession: vi.fn(),
  getAuthContext: vi.fn(),
}));

vi.mock("@pspk/db", () => ({
  prisma: {
    auditLog: {
      findMany: vi.fn(),
    },
  },
  writeAudit: vi.fn(async () => {}),
}));

import { GET } from "./route";
import { getSession, getAuthContext } from "@pspk/auth";
import { prisma, writeAudit } from "@pspk/db";

type MockSession = Awaited<ReturnType<typeof getSession>>;
type MockAuthContext = Awaited<ReturnType<typeof getAuthContext>>;
type MockAuditLog = Awaited<ReturnType<typeof prisma.auditLog.findMany>>;

describe("GET /api/audit/export", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function createRequest(searchParams = ""): NextRequest {
    return new NextRequest(`http://localhost:3002/api/audit/export${searchParams}`, {
      headers: {
        "x-forwarded-for": "192.168.1.10",
        "user-agent": "Vitest-Agent",
      },
    });
  }

  it("harus menolak permintaan jika sesi pengguna tidak valid (401)", async () => {
    vi.mocked(getSession).mockResolvedValue(null);

    const req = createRequest();
    const res = await GET(req);

    expect(res.status).toBe(401);
  });

  it("harus menolak pengguna yang tidak memiliki hak akses audit.export:all (403)", async () => {
    vi.mocked(getSession).mockResolvedValue({
      user: { id: "user-staff", email: "staff@pspk.id" },
    } as unknown as MockSession);

    vi.mocked(getAuthContext).mockResolvedValue({
      userId: "user-staff",
      employeeId: "emp-staff",
      roles: ["staff"],
      permissions: new Set(["sysmgmt.document.read:own"]),
    } as unknown as MockAuthContext);

    const req = createRequest();
    const res = await GET(req);

    expect(res.status).toBe(403);
  });

  it("harus mengizinkan Super Admin/IT mengekspor CSV dan menetralkan karakter formula injection (200)", async () => {
    vi.mocked(getSession).mockResolvedValue({
      user: { id: "user-admin", email: "admin@pspk.id" },
    } as unknown as MockSession);

    vi.mocked(getAuthContext).mockResolvedValue({
      userId: "user-admin",
      employeeId: "emp-admin",
      roles: ["admin_it"],
      permissions: new Set(["sysmgmt.audit.export:all", "sysmgmt.audit.read:all"]),
    } as unknown as MockAuthContext);

    // Mock baris data audit yang berisi muatan berbahaya Formula Injection (CWE-1236)
    vi.mocked(prisma.auditLog.findMany).mockResolvedValue([
      {
        id: "log-1",
        occurredAt: new Date("2026-10-13T10:00:00Z"),
        app: "sysmgmt",
        action: "UPDATE",
        actorEmail: "admin@pspk.id",
        entityType: "User",
        entityId: "=cmd|'/C calc'!A0", // Formula injection via entityId
        ip: "127.0.0.1",
        userAgent: "@evil_user_agent", // Formula trigger via @
      },
      {
        id: "log-2",
        occurredAt: new Date("2026-10-13T10:05:00Z"),
        app: "hris",
        action: "CREATE",
        actorEmail: "+628123456789", // Phone number trigger via +
        entityType: "Employee",
        entityId: 'emp-"quote"-test', // RFC 4180 quote escaping
        ip: "10.0.0.1",
        userAgent: "\tMozilla/5.0", // Tab trigger
      },
    ] as unknown as MockAuditLog);

    const req = createRequest("?app=sysmgmt&action=UPDATE");
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/csv");
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(res.headers.get("Cache-Control")).toContain("no-store");

    const csvText = await res.text();

    // Verifikasi UTF-8 BOM
    expect(csvText.charCodeAt(0)).toBe(0xfeff);

    // Verifikasi netralisasi formula injection: Karakter diawali kutip tunggal (') di dalam sel
    expect(csvText).toContain('"\'=cmd|\'/C calc\'!A0"');
    expect(csvText).toContain('"\'@evil_user_agent"');
    expect(csvText).toContain('"\'\tMozilla/5.0"');

    // Verifikasi escaping kutip ganda RFC 4180
    expect(csvText).toContain('"emp-""quote""-test"');

    // Verifikasi pencatatan audit log mutasi ekspor
    expect(writeAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: "user-admin",
        app: "sysmgmt",
        action: "EXPORT",
        entityType: "AuditLog",
      }),
    );
  });
});
