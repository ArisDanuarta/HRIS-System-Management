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
    documentVersion: {
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
type MockDocumentVersion = Awaited<ReturnType<typeof prisma.documentVersion.findFirst>>;

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

  describe("Akses Dokumen Kebijakan & SOP Lembaga (sysmgmt/documents/...)", () => {
    it("harus mengizinkan seluruh staf mengakses dokumen dengan visibilitas ALL_STAFF (200)", async () => {
      vi.mocked(getSession).mockResolvedValue({
        user: { id: "user-staf", email: "staf@pspk.id" },
      } as unknown as MockSession);

      vi.mocked(getAuthContext).mockResolvedValue({
        userId: "user-staf",
        employeeId: "emp-staf",
        roles: ["staf"],
        permissions: new Set(["view:self"]),
      });

      vi.mocked(prisma.documentVersion.findFirst).mockResolvedValue({
        id: "ver-1",
        fileKey: "sysmgmt/documents/kbj-002/v1-sample-kbj-002.pdf",
        document: {
          id: "doc-1",
          visibility: "ALL_STAFF",
        },
      } as unknown as MockDocumentVersion);

      const req = createRequest("sysmgmt/documents/kbj-002/v1-sample-kbj-002.pdf");
      const res = await GET(req, {
        params: Promise.resolve({
          path: ["sysmgmt", "documents", "kbj-002", "v1-sample-kbj-002.pdf"],
        }),
      });

      expect(res.status).toBe(200);
    });

    it("harus menolak staf biasa jika dokumen memiliki visibilitas MANAGERS (403)", async () => {
      vi.mocked(getSession).mockResolvedValue({
        user: { id: "user-staf", email: "staf@pspk.id" },
      } as unknown as MockSession);

      vi.mocked(getAuthContext).mockResolvedValue({
        userId: "user-staf",
        employeeId: "emp-staf",
        roles: ["staf"],
        permissions: new Set(["view:self"]),
      });

      vi.mocked(prisma.documentVersion.findFirst).mockResolvedValue({
        id: "ver-2",
        fileKey: "sysmgmt/documents/kbj-003/v1-mgr.pdf",
        document: {
          id: "doc-2",
          visibility: "MANAGERS",
        },
      } as unknown as MockDocumentVersion);

      const req = createRequest("sysmgmt/documents/kbj-003/v1-mgr.pdf");
      const res = await GET(req, {
        params: Promise.resolve({
          path: ["sysmgmt", "documents", "kbj-003", "v1-mgr.pdf"],
        }),
      });

      expect(res.status).toBe(403);
    });

    it("harus mengizinkan manager mengakses dokumen MANAGERS (200)", async () => {
      vi.mocked(getSession).mockResolvedValue({
        user: { id: "user-mgr", email: "manager@pspk.id" },
      } as unknown as MockSession);

      vi.mocked(getAuthContext).mockResolvedValue({
        userId: "user-mgr",
        employeeId: "emp-mgr",
        roles: ["manager"],
        permissions: new Set(["view:team"]),
      });

      vi.mocked(prisma.documentVersion.findFirst).mockResolvedValue({
        id: "ver-2",
        fileKey: "sysmgmt/documents/kbj-003/v1-mgr.pdf",
        document: {
          id: "doc-2",
          visibility: "MANAGERS",
        },
      } as unknown as MockDocumentVersion);

      const req = createRequest("sysmgmt/documents/kbj-003/v1-mgr.pdf");
      const res = await GET(req, {
        params: Promise.resolve({
          path: ["sysmgmt", "documents", "kbj-003", "v1-mgr.pdf"],
        }),
      });

      expect(res.status).toBe(200);
    });
  });

  describe("Akses Berkas Kontrak Kerja (contracts/...)", () => {
    it("harus mengizinkan pegawai mengunduh berkas kontrak miliknya sendiri (200)", async () => {
      vi.mocked(getSession).mockResolvedValue({
        user: { id: "user-staf", email: "staf@pspk.id" },
      } as unknown as MockSession);

      vi.mocked(getAuthContext).mockResolvedValue({
        userId: "user-staf",
        employeeId: "emp-staf",
        roles: ["staf"],
        permissions: new Set(["view:self"]),
      });

      const req = createRequest("contracts/emp-staf_1700000000_kontrak_pkwt.pdf");
      const res = await GET(req, {
        params: Promise.resolve({
          path: ["contracts", "emp-staf_1700000000_kontrak_pkwt.pdf"],
        }),
      });

      expect(res.status).toBe(200);
    });

    it("harus menolak pegawai lain yang mencoba mengakses berkas kontrak milik orang lain (403)", async () => {
      vi.mocked(getSession).mockResolvedValue({
        user: { id: "user-lain", email: "other@pspk.id" },
      } as unknown as MockSession);

      vi.mocked(getAuthContext).mockResolvedValue({
        userId: "user-lain",
        employeeId: "emp-other",
        roles: ["staf"],
        permissions: new Set(["view:self"]),
      });

      vi.mocked(prisma.employmentContract.findFirst).mockResolvedValue(null);

      const req = createRequest("contracts/emp-target_1700000000_kontrak_pkwt.pdf");
      const res = await GET(req, {
        params: Promise.resolve({
          path: ["contracts", "emp-target_1700000000_kontrak_pkwt.pdf"],
        }),
      });

      expect(res.status).toBe(403);
    });

    it("harus mengizinkan Admin HR mengunduh berkas kontrak pegawai siapa pun (200)", async () => {
      vi.mocked(getSession).mockResolvedValue({
        user: { id: "user-hr", email: "hr@pspk.id" },
      } as unknown as MockSession);

      vi.mocked(getAuthContext).mockResolvedValue({
        userId: "user-hr",
        employeeId: "emp-hr",
        roles: ["admin_hr"],
        permissions: new Set(["hris.employee.read:all"]),
      });

      const req = createRequest("contracts/emp-staf_1700000000_kontrak_pkwt.pdf");
      const res = await GET(req, {
        params: Promise.resolve({
          path: ["contracts", "emp-staf_1700000000_kontrak_pkwt.pdf"],
        }),
      });

      expect(res.status).toBe(200);
    });
  });
});
