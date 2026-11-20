import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers({ "x-forwarded-for": "192.168.1.100" })),
}));

vi.mock("@pspk/auth", () => ({
  getSession: vi.fn(),
  getAuthContext: vi.fn(),
}));

const mockAttachmentCreate = vi.fn();

vi.mock("@pspk/db", () => ({
  prisma: {
    emailBroadcastAttachment: {
      create: (...args: unknown[]) => mockAttachmentCreate(...args),
    },
  },
  writeAudit: vi.fn(async () => {}),
}));

const mockStoragePut = vi.fn();

vi.mock("@pspk/storage", () => ({
  getStorageProvider: () => ({
    put: mockStoragePut,
  }),
}));

import {
  POST,
  isValidPdfMagicBytes,
  sanitizeAttachmentFileName,
  MAX_ATTACHMENT_SIZE_BYTES,
} from "./route";
import { getSession, getAuthContext } from "@pspk/auth";
import { writeAudit } from "@pspk/db";

type MockSession = Awaited<ReturnType<typeof getSession>>;

describe("POST /api/broadcast/upload-attachment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Utility validation functions", () => {
    it("isValidPdfMagicBytes harus memvalidasi 5 byte pertama '%PDF-'", () => {
      const validPdfBuffer = Buffer.from("%PDF-1.7 ... content");
      expect(isValidPdfMagicBytes(validPdfBuffer)).toBe(true);

      const invalidBuffer = Buffer.from("GIF89a ... image");
      expect(isValidPdfMagicBytes(invalidBuffer)).toBe(false);

      const tooShort = Buffer.from("%PD");
      expect(isValidPdfMagicBytes(tooShort)).toBe(false);
    });

    it("sanitizeAttachmentFileName harus membersihkan path traversal dan karakter kontrol", () => {
      expect(sanitizeAttachmentFileName("../../../etc/passwd.pdf")).toBe(
        "passwd.pdf",
      );
      expect(sanitizeAttachmentFileName("laporan\0final\n2026.pdf")).toBe(
        "laporanfinal2026.pdf",
      );
      expect(sanitizeAttachmentFileName("lampiran-tanpa-ekstensi")).toBe(
        "lampiran-tanpa-ekstensi.pdf",
      );
    });
  });

  describe("Endpoint handling", () => {
    it("harus menolak permintaan (401) jika sesi pengguna tidak ada", async () => {
      vi.mocked(getSession).mockResolvedValue(null);

      const req = new NextRequest(
        "http://localhost:3001/api/broadcast/upload-attachment",
        {
          method: "POST",
        },
      );

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

      const req = new NextRequest(
        "http://localhost:3001/api/broadcast/upload-attachment",
        {
          method: "POST",
        },
      );

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
      const req = new NextRequest(
        "http://localhost:3001/api/broadcast/upload-attachment",
        {
          method: "POST",
          body: formData,
        },
      );

      const res = await POST(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("Berkas PDF tidak ditemukan");
    });

    it("harus menolak (400) jika format berkas bukan PDF", async () => {
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

      const fakeImage = new File(["fake image content"], "foto.png", {
        type: "image/png",
      });
      const formData = new FormData();
      formData.append("file", fakeImage);

      const req = new NextRequest(
        "http://localhost:3001/api/broadcast/upload-attachment",
        {
          method: "POST",
          body: formData,
        },
      );

      const res = await POST(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("hanya boleh berformat PDF");
    });

    it("harus menolak (400) jika ukuran berkas melebihi 5 MB", async () => {
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

      const oversizedFile = new File(
        [new Uint8Array(MAX_ATTACHMENT_SIZE_BYTES + 1024)],
        "huge.pdf",
        { type: "application/pdf" },
      );
      const formData = new FormData();
      formData.append("file", oversizedFile);

      const req = new NextRequest(
        "http://localhost:3001/api/broadcast/upload-attachment",
        {
          method: "POST",
          body: formData,
        },
      );

      const res = await POST(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("Batas maksimum per berkas adalah 5 MB");
    });

    it("harus menolak (400) jika isi berkas bukan PDF asli (magic bytes invalid)", async () => {
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

      // Teks palsu yang dinamai .pdf
      const fakePdf = new File(["ini file teks biasa"], "palsu.pdf", {
        type: "application/pdf",
      });
      const formData = new FormData();
      formData.append("file", fakePdf);

      const req = new NextRequest(
        "http://localhost:3001/api/broadcast/upload-attachment",
        {
          method: "POST",
          body: formData,
        },
      );

      const res = await POST(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("magic bytes '%PDF-' tidak ditemukan");
    });

    it("harus berhasil mengunggah berkas PDF valid, menyimpan di storage & database, serta mencatat audit log", async () => {
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
        key: "broadcast-attachments/uuid-test.pdf",
        size: 1024,
        sha256: "hash-sha256-test",
      });

      mockAttachmentCreate.mockResolvedValue({
        id: "att-123",
        uploadedBy: "user-hr",
        key: "broadcast-attachments/uuid-test.pdf",
        fileName: "Surat_Keputusan_2026.pdf",
        mimeType: "application/pdf",
        sizeBytes: 1024,
        sha256: "hash-sha256-test",
        createdAt: new Date(),
      });

      const validPdf = new File(["%PDF-1.4 konten resmi"], "Surat_Keputusan_2026.pdf", {
        type: "application/pdf",
      });
      const formData = new FormData();
      formData.append("file", validPdf);

      const req = new NextRequest(
        "http://localhost:3001/api/broadcast/upload-attachment",
        {
          method: "POST",
          body: formData,
        },
      );

      const res = await POST(req);
      expect(res.status).toBe(200);
      const json = await res.json();

      expect(json.success).toBe(true);
      expect(json.attachment).toEqual({
        id: "att-123",
        fileName: "Surat_Keputusan_2026.pdf",
        sizeBytes: 1024,
        key: "broadcast-attachments/uuid-test.pdf",
        url: "/api/documents/broadcast-attachments/uuid-test.pdf",
      });

      expect(mockStoragePut).toHaveBeenCalledWith(
        expect.stringMatching(/^broadcast-attachments\/[0-9a-f-]+\.pdf$/),
        expect.any(Buffer),
        { contentType: "application/pdf" },
      );

      expect(mockAttachmentCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          uploadedBy: "user-hr",
          fileName: "Surat_Keputusan_2026.pdf",
          mimeType: "application/pdf",
          sizeBytes: 1024,
        }),
      });

      expect(writeAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          actorUserId: "user-hr",
          app: "hris",
          action: "UPLOAD",
          entityType: "BroadcastAttachment",
          entityId: "att-123",
        }),
      );
    });
  });
});
