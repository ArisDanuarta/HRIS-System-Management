import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers({ "x-forwarded-for": "192.168.1.100" })),
}));

vi.mock("@pspk/auth", () => ({
  getSession: vi.fn(),
  getAuthContext: vi.fn(),
}));

vi.mock("@pspk/db", () => ({
  writeAudit: vi.fn(async () => {}),
}));

const mockStoragePut = vi.fn();

vi.mock("@pspk/storage", () => ({
  getStorageProvider: () => ({
    put: mockStoragePut,
  }),
}));

import { POST } from "./route";
import { getSession, getAuthContext } from "@pspk/auth";
import { writeAudit } from "@pspk/db";

type MockSession = Awaited<ReturnType<typeof getSession>>;

describe("POST /api/broadcast/upload-image", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("harus menolak permintaan (401) jika sesi pengguna tidak ada", async () => {
    vi.mocked(getSession).mockResolvedValue(null);

    const req = new NextRequest("http://localhost:3001/api/broadcast/upload-image", {
      method: "POST",
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toContain("Sesi tidak valid");
  });

  it("harus menolak staf biasa (403) yang tidak memiliki hak broadcast", async () => {
    vi.mocked(getSession).mockResolvedValue({
      user: { id: "user-staff", email: "staff@pspk.id", name: "Staff Biasa" },
      session: { id: "sess-1", userId: "user-staff", expiresAt: new Date() },
    } as unknown as MockSession);

    vi.mocked(getAuthContext).mockResolvedValue({
      userId: "user-staff",
      employeeId: "emp-staff",
      roles: ["staff"],
      permissions: new Set(["hris.broadcast.read:own"]),
    });

    const req = new NextRequest("http://localhost:3001/api/broadcast/upload-image", {
      method: "POST",
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toContain("Akses ditolak");
  });

  it("harus menolak (400) jika berkas tidak disertakan pada form data", async () => {
    vi.mocked(getSession).mockResolvedValue({
      user: { id: "user-hr", email: "hr@pspk.id", name: "Admin HR" },
      session: { id: "sess-2", userId: "user-hr", expiresAt: new Date() },
    } as unknown as MockSession);

    vi.mocked(getAuthContext).mockResolvedValue({
      userId: "user-hr",
      employeeId: "emp-hr",
      roles: ["admin_hr"],
      permissions: new Set(["hris.broadcast.send:all"]),
    });

    const formData = new FormData();
    const req = new NextRequest("http://localhost:3001/api/broadcast/upload-image", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("Berkas gambar tidak ditemukan");
  });

  it("harus menolak (400) jika format berkas bukan gambar yang diizinkan (misal PDF)", async () => {
    vi.mocked(getSession).mockResolvedValue({
      user: { id: "user-hr", email: "hr@pspk.id", name: "Admin HR" },
      session: { id: "sess-2", userId: "user-hr", expiresAt: new Date() },
    } as unknown as MockSession);

    vi.mocked(getAuthContext).mockResolvedValue({
      userId: "user-hr",
      employeeId: "emp-hr",
      roles: ["admin_hr"],
      permissions: new Set(["hris.broadcast.send:all"]),
    });

    const formData = new FormData();
    const pdfBlob = new Blob(["%PDF-1.4 dummy"], { type: "application/pdf" });
    formData.append("file", pdfBlob, "surat.pdf");

    const req = new NextRequest("http://localhost:3001/api/broadcast/upload-image", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("Format berkas tidak didukung");
  });

  it("harus menolak (400) jika ukuran gambar melebihi 3 MB", async () => {
    vi.mocked(getSession).mockResolvedValue({
      user: { id: "user-hr", email: "hr@pspk.id", name: "Admin HR" },
      session: { id: "sess-2", userId: "user-hr", expiresAt: new Date() },
    } as unknown as MockSession);

    vi.mocked(getAuthContext).mockResolvedValue({
      userId: "user-hr",
      employeeId: "emp-hr",
      roles: ["admin_hr"],
      permissions: new Set(["hris.broadcast.send:all"]),
    });

    const formData = new FormData();
    const largeBuffer = new Uint8Array(4 * 1024 * 1024); // 4 MB
    const largeBlob = new Blob([largeBuffer], { type: "image/png" });
    formData.append("file", largeBlob, "banner-huge.png");

    const req = new NextRequest("http://localhost:3001/api/broadcast/upload-image", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("Ukuran gambar terlalu besar");
  });

  it("harus berhasil mengunggah gambar (200) untuk Admin HR dan mencatat audit log", async () => {
    vi.mocked(getSession).mockResolvedValue({
      user: { id: "user-hr", email: "hr@pspk.id", name: "Admin HR" },
      session: { id: "sess-2", userId: "user-hr", expiresAt: new Date() },
    } as unknown as MockSession);

    vi.mocked(getAuthContext).mockResolvedValue({
      userId: "user-hr",
      employeeId: "emp-hr",
      roles: ["admin_hr"],
      permissions: new Set(["hris.broadcast.send:all"]),
    });

    mockStoragePut.mockResolvedValue({
      key: "broadcast-images/mock-uuid.png",
      size: 1024,
      sha256: "dummy-hash",
    });

    const formData = new FormData();
    const imageBlob = new Blob(["dummy image bytes"], { type: "image/png" });
    formData.append("file", imageBlob, "diagram-organisasi.png");

    const req = new NextRequest("http://localhost:3001/api/broadcast/upload-image", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();

    expect(json.success).toBe(true);
    expect(json.url).toMatch(/^\/api\/documents\/broadcast-images\/[a-f0-9-]+\.png$/);
    expect(mockStoragePut).toHaveBeenCalled();
    expect(writeAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        actorEmail: "hr@pspk.id",
        action: "UPLOAD",
        entityType: "BroadcastImage",
      }),
    );
  });

  it("harus berhasil mengunggah gambar (200) untuk Manajer tim", async () => {
    vi.mocked(getSession).mockResolvedValue({
      user: { id: "user-mgr", email: "manager@pspk.id", name: "Lead Riset" },
      session: { id: "sess-3", userId: "user-mgr", expiresAt: new Date() },
    } as unknown as MockSession);

    vi.mocked(getAuthContext).mockResolvedValue({
      userId: "user-mgr",
      employeeId: "emp-mgr",
      roles: ["manager"],
      permissions: new Set(["hris.broadcast.send:team"]),
    });

    mockStoragePut.mockResolvedValue({
      key: "broadcast-images/mgr-uuid.jpg",
      size: 2048,
      sha256: "mgr-hash",
    });

    const formData = new FormData();
    const imageBlob = new Blob(["dummy image bytes"], { type: "image/jpeg" });
    formData.append("file", imageBlob, "alur-kerja.jpg");

    const req = new NextRequest("http://localhost:3001/api/broadcast/upload-image", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();

    expect(json.success).toBe(true);
    expect(json.url).toMatch(/^\/api\/documents\/broadcast-images\/[a-f0-9-]+\.jpg$/);
  });
});
