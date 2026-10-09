import { describe, it, expect, vi, beforeEach } from "vitest";
import { DocumentVisibility, DocumentStatus } from "@prisma/client";
import {
  canUserViewDocument,
  getAllowedVisibilitiesForRoles,
  getDocumentsDirectory,
  getDocumentById,
  getDocumentStats,
  getNextDocumentCode,
} from "./document.queries";

vi.mock("@pspk/db", async () => {
  const actual = await vi.importActual<typeof import("@pspk/db")>("@pspk/db");
  return {
    ...actual,
    prisma: {
      document: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        count: vi.fn(),
      },
      user: {
        findMany: vi.fn().mockResolvedValue([
          { id: "user-1", name: "Budi Santoso", email: "budi@pspk.id" },
        ]),
      },
    },
  };
});

describe("document.queries.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("canUserViewDocument", () => {
    it("memverifikasi Super Admin dapat melihat seluruh dokumen", () => {
      expect(canUserViewDocument(["super_admin"], DocumentVisibility.ALL_STAFF)).toBe(true);
      expect(canUserViewDocument(["super_admin"], DocumentVisibility.MANAGERS)).toBe(true);
      expect(canUserViewDocument(["super_admin"], DocumentVisibility.HR_ONLY)).toBe(true);
      expect(canUserViewDocument(["super_admin"], DocumentVisibility.IT_ONLY)).toBe(true);
    });

    it("memverifikasi Staff hanya dapat melihat ALL_STAFF", () => {
      expect(canUserViewDocument(["staff"], DocumentVisibility.ALL_STAFF)).toBe(true);
      expect(canUserViewDocument(["staff"], DocumentVisibility.MANAGERS)).toBe(false);
      expect(canUserViewDocument(["staff"], DocumentVisibility.HR_ONLY)).toBe(false);
      expect(canUserViewDocument(["staff"], DocumentVisibility.IT_ONLY)).toBe(false);
    });

    it("memverifikasi Manager dapat melihat ALL_STAFF dan MANAGERS", () => {
      expect(canUserViewDocument(["manager"], DocumentVisibility.ALL_STAFF)).toBe(true);
      expect(canUserViewDocument(["manager"], DocumentVisibility.MANAGERS)).toBe(true);
      expect(canUserViewDocument(["manager"], DocumentVisibility.HR_ONLY)).toBe(false);
      expect(canUserViewDocument(["manager"], DocumentVisibility.IT_ONLY)).toBe(false);
    });

    it("memverifikasi Admin HR dapat melihat ALL_STAFF, MANAGERS, dan HR_ONLY", () => {
      expect(canUserViewDocument(["admin_hr"], DocumentVisibility.ALL_STAFF)).toBe(true);
      expect(canUserViewDocument(["admin_hr"], DocumentVisibility.MANAGERS)).toBe(true);
      expect(canUserViewDocument(["admin_hr"], DocumentVisibility.HR_ONLY)).toBe(true);
      expect(canUserViewDocument(["admin_hr"], DocumentVisibility.IT_ONLY)).toBe(false);
    });

    it("memverifikasi Admin IT dapat melihat ALL_STAFF, MANAGERS, dan IT_ONLY", () => {
      expect(canUserViewDocument(["admin_it"], DocumentVisibility.ALL_STAFF)).toBe(true);
      expect(canUserViewDocument(["admin_it"], DocumentVisibility.MANAGERS)).toBe(true);
      expect(canUserViewDocument(["admin_it"], DocumentVisibility.HR_ONLY)).toBe(false);
      expect(canUserViewDocument(["admin_it"], DocumentVisibility.IT_ONLY)).toBe(true);
    });
  });

  describe("getAllowedVisibilitiesForRoles", () => {
    it("menghasilkan 4 visibilitas untuk super_admin", () => {
      const allowed = getAllowedVisibilitiesForRoles(["super_admin"]);
      expect(allowed).toHaveLength(4);
      expect(allowed).toContain(DocumentVisibility.ALL_STAFF);
      expect(allowed).toContain(DocumentVisibility.HR_ONLY);
      expect(allowed).toContain(DocumentVisibility.IT_ONLY);
      expect(allowed).toContain(DocumentVisibility.MANAGERS);
    });

    it("menghasilkan hanya ALL_STAFF untuk role staff", () => {
      const allowed = getAllowedVisibilitiesForRoles(["staff"]);
      expect(allowed).toEqual([DocumentVisibility.ALL_STAFF]);
    });
  });

  describe("getDocumentsDirectory", () => {
    it("mengambil daftar dokumen dengan mapping versi terkini", async () => {
      const { prisma } = await import("@pspk/db");
      const mockDocs = [
        {
          id: "doc-1",
          code: "SOP-HR-001",
          title: "SOP Pengajuan Cuti Staf",
          category: "SOP HR & Kepegawaian",
          visibility: DocumentVisibility.ALL_STAFF,
          status: DocumentStatus.ACTIVE,
          createdAt: new Date("2026-01-01"),
          updatedAt: new Date("2026-02-01"),
          versions: [
            {
              versionNo: 2,
              fileName: "SOP_Cuti_v2.pdf",
              sizeBytes: 1024000,
              mimeType: "application/pdf",
              effectiveDate: new Date("2026-02-01"),
            },
          ],
          _count: { versions: 2 },
        },
      ];

      (prisma.document.count as any).mockResolvedValue(1);
      (prisma.document.findMany as any).mockResolvedValue(mockDocs);

      const result = await getDocumentsDirectory({}, ["staff"]);

      expect(result.totalCount).toBe(1);
      expect(result.documents).toHaveLength(1);
      expect(result.documents[0]?.code).toBe("SOP-HR-001");
      expect(result.documents[0]?.currentVersionNo).toBe(2);
      expect(result.documents[0]?.currentFileName).toBe("SOP_Cuti_v2.pdf");
      expect(result.documents[0]?.totalVersionsCount).toBe(2);
    });
  });

  describe("getNextDocumentCode", () => {
    it("menghasilkan kode sequential berdasarkan kategori SOP HR", async () => {
      const { prisma } = await import("@pspk/db");
      (prisma.document.findMany as any).mockResolvedValue([
        { code: "SOP-HR-001" },
        { code: "SOP-HR-002" },
      ]);

      const nextCode = await getNextDocumentCode("SOP HR & Kepegawaian");
      expect(nextCode).toBe("SOP-HR-003");
    });

    it("menghasilkan kode default jika belum ada dokumen sebelumnya", async () => {
      const { prisma } = await import("@pspk/db");
      (prisma.document.findMany as any).mockResolvedValue([]);

      const nextCode = await getNextDocumentCode("Kebijakan Lembaga");
      expect(nextCode).toBe("KBJ-001");
    });
  });
});
