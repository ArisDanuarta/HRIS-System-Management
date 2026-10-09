import { describe, it, expect, vi, beforeEach } from "vitest";
import { DocumentStatus } from "@pspk/db";
import {
  createDocumentAction,
  uploadDocumentVersionAction,
  updateDocumentMetadataAction,
  archiveDocumentAction,
  deleteDocumentAction,
} from "./document.actions";

// Mock next/headers & next/cache
vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers({ "user-agent": "Vitest-Agent" })),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const mockSession = {
  user: {
    id: "user-admin-1",
    email: "itadmin@pspk.id",
    name: "Admin IT PSPK",
  },
};

const mockAuthCtx = {
  userId: "user-admin-1",
  employeeId: null,
  roles: ["admin_it"],
  permissions: new Set(["sysmgmt.document.manage:all", "sysmgmt.document.read:all"]),
};

vi.mock("@pspk/auth", () => ({
  getSession: vi.fn().mockImplementation(() => Promise.resolve(mockSession)),
  getAuthContext: vi.fn().mockImplementation(() => Promise.resolve(mockAuthCtx)),
}));

const mockStorageProvider = {
  put: vi.fn().mockResolvedValue({ key: "mock-key", size: 1024, sha256: "mock-sha" }),
  get: vi.fn(),
  delete: vi.fn().mockResolvedValue(undefined),
  exists: vi.fn().mockResolvedValue(true),
};

vi.mock("@pspk/storage", () => ({
  getStorageProvider: vi.fn(() => mockStorageProvider),
}));

const mockTx = {
  document: {
    create: vi.fn().mockResolvedValue({
      id: "e4a77918-2947-4977-8025-a1c6e144a29a",
      code: "SOP-IT-001",
      title: "SOP Backup Data",
      category: "SOP IT & Keamanan",
      visibility: "ALL_STAFF",
      status: "ACTIVE",
    }),
    update: vi.fn().mockResolvedValue({
      id: "e4a77918-2947-4977-8025-a1c6e144a29a",
      code: "SOP-IT-001",
      title: "SOP Backup Data",
      currentVersionId: "ver-uuid-1",
    }),
  },
  documentVersion: {
    create: vi.fn().mockResolvedValue({
      id: "ver-uuid-1",
      documentId: "e4a77918-2947-4977-8025-a1c6e144a29a",
      versionNo: 1,
      fileName: "backup_sop.pdf",
      sizeBytes: 1024,
    }),
  },
};

vi.mock("@pspk/db", async () => {
  const actual = await vi.importActual<typeof import("@pspk/db")>("@pspk/db");
  return {
    ...actual,
    prisma: {
      document: {
        findUnique: vi.fn(),
        findMany: vi.fn().mockResolvedValue([]),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      documentVersion: {
        create: vi.fn(),
        findUnique: vi.fn(),
      },
      $transaction: vi.fn(async (callback: (tx: typeof mockTx) => Promise<unknown>) =>
        callback(mockTx),
      ),
    },
    writeAudit: vi.fn().mockResolvedValue(undefined),
  };
});

describe("document.actions.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createDocumentAction", () => {
    it("menolak jika berkas tidak disertakan", async () => {
      const formData = new FormData();
      formData.set("code", "SOP-IT-001");
      formData.set("title", "SOP Backup Data");
      formData.set("category", "SOP IT & Keamanan");
      formData.set("visibility", "ALL_STAFF");

      const res = await createDocumentAction(formData);
      expect(res.success).toBe(false);
      expect(res.message).toContain("pilih berkas");
    });

    it("menolak jika kode dokumen duplikat", async () => {
      const db = await import("@pspk/db");
      vi.mocked(db.prisma.document.findUnique).mockResolvedValueOnce({
        id: "existing-id",
      } as never);

      const fakeFile = new File(["dummy content"], "sop.pdf", { type: "application/pdf" });
      const formData = new FormData();
      formData.set("code", "SOP-IT-001");
      formData.set("title", "SOP Backup Data");
      formData.set("category", "SOP IT & Keamanan");
      formData.set("visibility", "ALL_STAFF");
      formData.set("file", fakeFile);

      const res = await createDocumentAction(formData);
      expect(res.success).toBe(false);
      expect(res.message).toContain("sudah digunakan");
    });

    it("berhasil mengunggah dokumen baru dan versi 1", async () => {
      const db = await import("@pspk/db");
      vi.mocked(db.prisma.document.findUnique).mockResolvedValueOnce(null);

      const fakeFile = new File(["dummy pdf bytes"], "backup_sop.pdf", {
        type: "application/pdf",
      });
      const formData = new FormData();
      formData.set("code", "SOP-IT-001");
      formData.set("title", "SOP Backup Data");
      formData.set("category", "SOP IT & Keamanan");
      formData.set("visibility", "ALL_STAFF");
      formData.set("file", fakeFile);

      const res = await createDocumentAction(formData);

      expect(res.success).toBe(true);
      expect(mockStorageProvider.put).toHaveBeenCalledTimes(1);
      expect(db.writeAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "CREATE",
          entityType: "Document",
        }),
      );
    });
  });

  describe("uploadDocumentVersionAction", () => {
    it("berhasil mengunggah versi baru dengan kenaikan nomor versi", async () => {
      const db = await import("@pspk/db");
      const validDocId = "e4a77918-2947-4977-8025-a1c6e144a29a";

      vi.mocked(db.prisma.document.findUnique).mockResolvedValueOnce({
        id: validDocId,
        code: "SOP-IT-001",
        visibility: "ALL_STAFF",
        versions: [{ versionNo: 1 }],
      } as never);

      const fakeFile = new File(["dummy pdf v2 bytes"], "backup_sop_v2.pdf", {
        type: "application/pdf",
      });
      const formData = new FormData();
      formData.set("documentId", validDocId);
      formData.set("changeNote", "Pembaruan jadwal snapshot mingguan");
      formData.set("file", fakeFile);

      mockTx.documentVersion.create.mockResolvedValueOnce({
        id: "ver-uuid-2",
        documentId: validDocId,
        versionNo: 2,
        fileName: "backup_sop_v2.pdf",
        sizeBytes: 2048,
        mimeType: "application/pdf",
        sha256: "mock-sha-2",
        changeNote: "Pembaruan jadwal snapshot mingguan",
        effectiveDate: new Date(),
        createdById: "user-admin-1",
        createdAt: new Date(),
      });

      const res = await uploadDocumentVersionAction(formData);

      expect(res.success).toBe(true);
      expect(mockStorageProvider.put).toHaveBeenCalledTimes(1);
      expect(db.writeAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "CREATE",
          entityType: "DocumentVersion",
        }),
      );
    });
  });

  describe("updateDocumentMetadataAction", () => {
    it("berhasil memperbarui metadata dokumen", async () => {
      const db = await import("@pspk/db");
      const validDocId = "e4a77918-2947-4977-8025-a1c6e144a29a";

      vi.mocked(db.prisma.document.findUnique).mockResolvedValueOnce({
        id: validDocId,
        code: "SOP-IT-001",
        visibility: "ALL_STAFF",
      } as never);

      vi.mocked(db.prisma.document.update).mockResolvedValueOnce({
        id: validDocId,
        code: "SOP-IT-001",
        title: "SOP Backup & Disaster Recovery",
        category: "SOP IT & Keamanan",
        visibility: "IT_ONLY",
        status: "ACTIVE",
      } as never);

      const formData = new FormData();
      formData.set("id", validDocId);
      formData.set("title", "SOP Backup & Disaster Recovery");
      formData.set("category", "SOP IT & Keamanan");
      formData.set("visibility", "IT_ONLY");
      formData.set("status", "ACTIVE");

      const res = await updateDocumentMetadataAction(formData);

      expect(res.success).toBe(true);
      expect(db.prisma.document.update).toHaveBeenCalledTimes(1);
      expect(db.writeAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "UPDATE",
          entityType: "Document",
        }),
      );
    });
  });

  describe("archiveDocumentAction", () => {
    it("berhasil mengubah status dokumen menjadi ARCHIVED", async () => {
      const db = await import("@pspk/db");
      const validDocId = "e4a77918-2947-4977-8025-a1c6e144a29a";

      vi.mocked(db.prisma.document.findUnique).mockResolvedValueOnce({
        id: validDocId,
        code: "SOP-IT-001",
        status: "ACTIVE",
        visibility: "ALL_STAFF",
      } as never);

      vi.mocked(db.prisma.document.update).mockResolvedValueOnce({
        id: validDocId,
        status: "ARCHIVED",
      } as never);

      const res = await archiveDocumentAction(validDocId, "Digantikan oleh kebijakan baru");

      expect(res.success).toBe(true);
      expect(db.prisma.document.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: DocumentStatus.ARCHIVED },
        }),
      );
      expect(db.writeAudit).toHaveBeenCalledTimes(1);
    });
  });

  describe("deleteDocumentAction", () => {
    it("menghapus dokumen dan membersihkan file storage", async () => {
      const db = await import("@pspk/db");
      const validDocId = "e4a77918-2947-4977-8025-a1c6e144a29a";

      vi.mocked(db.prisma.document.findUnique).mockResolvedValueOnce({
        id: validDocId,
        code: "SOP-IT-001",
        title: "SOP Backup Data",
        versions: [{ fileKey: "sysmgmt/documents/sop_it_001/v1.pdf" }],
      } as never);

      vi.mocked(db.prisma.document.delete).mockResolvedValueOnce({
        id: validDocId,
      } as never);

      const res = await deleteDocumentAction(validDocId);

      expect(res.success).toBe(true);
      expect(mockStorageProvider.delete).toHaveBeenCalledWith(
        "sysmgmt/documents/sop_it_001/v1.pdf",
      );
      expect(db.prisma.document.delete).toHaveBeenCalledTimes(1);
      expect(db.writeAudit).toHaveBeenCalledTimes(1);
    });
  });
});
