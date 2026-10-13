import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { EventEmitter } from "node:events";

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers()),
}));

vi.mock("@pspk/auth", () => ({
  getSession: vi.fn(),
  getAuthContext: vi.fn(),
}));

vi.mock("@pspk/db", () => ({
  prisma: {
    employeeDocument: {
      findFirst: vi.fn(),
    },
    leaveRequest: {
      findFirst: vi.fn(),
    },
    employmentHistory: {
      findFirst: vi.fn(),
    },
    employmentContract: {
      findFirst: vi.fn(),
    },
    payslip: {
      findUnique: vi.fn(),
    },
    employee: {
      findFirst: vi.fn(),
    },
  },
  writeAudit: vi.fn(async () => {}),
}));

const mockStorageExists = vi.fn();
const mockStorageGet = vi.fn();

vi.mock("@pspk/storage", () => ({
  getStorageProvider: () => ({
    exists: mockStorageExists,
    get: mockStorageGet,
  }),
}));

import { GET } from "./route";
import { getSession, getAuthContext } from "@pspk/auth";
import { prisma, writeAudit } from "@pspk/db";

type MockSession = Awaited<ReturnType<typeof getSession>>;
type MockLeaveRequest = Awaited<ReturnType<typeof prisma.leaveRequest.findFirst>>;
type MockEmployee = Awaited<ReturnType<typeof prisma.employee.findFirst>>;

describe("GET /api/documents/[...path]", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockStorageExists.mockResolvedValue(true);
    mockStorageGet.mockImplementation(async () => {
      const stream = new EventEmitter();
      setTimeout(() => {
        stream.emit("data", Buffer.from("test content"));
        stream.emit("end");
      }, 5);

      return {
        stream,
        size: 12,
        contentType: "application/pdf",
      };
    });
  });

  function createRequest(urlPath: string, searchParams = ""): NextRequest {
    return new NextRequest(`http://localhost:3001/api/documents/${urlPath}${searchParams}`);
  }

  it("harus menolak path traversal dengan status 400", async () => {
    const req = createRequest("..%2Fsecret.txt");
    const res = await GET(req, { params: Promise.resolve({ path: ["..", "secret.txt"] }) });

    expect(res.status).toBe(400);
  });

  it("harus mengizinkan akses ke berkas publik (avatars/) tanpa autentikasi", async () => {
    const req = createRequest("avatars/user-123.jpg");
    const res = await GET(req, {
      params: Promise.resolve({ path: ["avatars", "user-123.jpg"] }),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toContain("public");
    expect(writeAudit).not.toHaveBeenCalled();
  });

  it("harus menolak dokumen sensitif jika tidak ada sesi (401)", async () => {
    vi.mocked(getSession).mockResolvedValue(null);

    const req = createRequest("documents/emp-1/ktp.pdf");
    const res = await GET(req, {
      params: Promise.resolve({ path: ["documents", "emp-1", "ktp.pdf"] }),
    });

    expect(res.status).toBe(401);
  });

  it("harus mencegah IDOR jika staf mencoba mengakses dokumen milik pegawai lain (403)", async () => {
    vi.mocked(getSession).mockResolvedValue({
      user: { id: "user-attacker", email: "attacker@pspk.id" },
    } as unknown as MockSession);

    vi.mocked(getAuthContext).mockResolvedValue({
      userId: "user-attacker",
      employeeId: "emp-attacker",
      roles: ["staff"],
      permissions: new Set(["hris.employee.read:own"]),
    });

    vi.mocked(prisma.employeeDocument.findFirst).mockResolvedValue(null);

    const req = createRequest("documents/emp-victim/ktp.pdf");
    const res = await GET(req, {
      params: Promise.resolve({ path: ["documents", "emp-victim", "ktp.pdf"] }),
    });

    expect(res.status).toBe(403);
    expect(writeAudit).not.toHaveBeenCalled();
  });

  it("harus mengizinkan pegawai mengakses dokumen miliknya sendiri (200)", async () => {
    vi.mocked(getSession).mockResolvedValue({
      user: { id: "user-legit", email: "legit@pspk.id" },
    } as unknown as MockSession);

    vi.mocked(getAuthContext).mockResolvedValue({
      userId: "user-legit",
      employeeId: "emp-legit",
      roles: ["staff"],
      permissions: new Set(["hris.employee.read:own"]),
    });

    const req = createRequest("documents/emp-legit/ktp.pdf");
    const res = await GET(req, {
      params: Promise.resolve({ path: ["documents", "emp-legit", "ktp.pdf"] }),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toContain("no-store");
    expect(writeAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: "user-legit",
        app: "hris",
        action: "VIEW",
      }),
    );
  });

  it("harus mengizinkan atasan/manager melihat lampiran cuti bawahan langsung (200)", async () => {
    vi.mocked(getSession).mockResolvedValue({
      user: { id: "user-manager", email: "manager@pspk.id" },
    } as unknown as MockSession);

    vi.mocked(getAuthContext).mockResolvedValue({
      userId: "user-manager",
      employeeId: "emp-manager",
      roles: ["manager"],
      permissions: new Set(["hris.leave.read:team"]),
    });

    vi.mocked(prisma.leaveRequest.findFirst).mockResolvedValue({
      employeeId: "emp-subordinate",
    } as unknown as MockLeaveRequest);

    vi.mocked(prisma.employee.findFirst).mockResolvedValue({
      id: "emp-subordinate",
    } as unknown as MockEmployee);

    const req = createRequest("cuti/lampiran/emp-subordinate_123456_surat_dokter.pdf");
    const res = await GET(req, {
      params: Promise.resolve({
        path: ["cuti", "lampiran", "emp-subordinate_123456_surat_dokter.pdf"],
      }),
    });

    expect(res.status).toBe(200);
    expect(writeAudit).toHaveBeenCalled();
  });

  it("harus mengizinkan super_admin mengakses berkas apapun (200)", async () => {
    vi.mocked(getSession).mockResolvedValue({
      user: { id: "user-admin", email: "admin@pspk.id" },
    } as unknown as MockSession);

    vi.mocked(getAuthContext).mockResolvedValue({
      userId: "user-admin",
      employeeId: "emp-admin",
      roles: ["super_admin"],
      permissions: new Set(["*"]),
    });

    const req = createRequest("cuti/lampiran/emp-anyone_123456_surat_dokter.pdf");
    const res = await GET(req, {
      params: Promise.resolve({
        path: ["cuti", "lampiran", "emp-anyone_123456_surat_dokter.pdf"],
      }),
    });

    expect(res.status).toBe(200);
  });

  it("harus membersihkan karakter newline dan quote dari nama file untuk mencegah CRLF / response header splitting", async () => {
    vi.mocked(getSession).mockResolvedValue({
      user: { id: "user-admin", email: "admin@pspk.id" },
    } as unknown as MockSession);

    vi.mocked(getAuthContext).mockResolvedValue({
      userId: "user-admin",
      employeeId: "emp-admin",
      roles: ["super_admin"],
      permissions: new Set(["*"]),
    });

    // Injeksi header CRLF pada query filename
    const maliciousFilename = 'surat\r\nInjected-Header: evil\r\n"test".pdf';
    const req = createRequest(
      "cuti/lampiran/emp-admin_123456_file.pdf",
      `?download=true&filename=${encodeURIComponent(maliciousFilename)}`,
    );

    const res = await GET(req, {
      params: Promise.resolve({
        path: ["cuti", "lampiran", "emp-admin_123456_file.pdf"],
      }),
    });

    expect(res.status).toBe(200);
    const contentDisposition = res.headers.get("Content-Disposition") || "";

    // Memastikan tidak ada karakter \r atau \n mentah di Content-Disposition
    expect(contentDisposition).not.toContain("\r");
    expect(contentDisposition).not.toContain("\n");
    expect(contentDisposition).toContain("attachment");
  });
});
