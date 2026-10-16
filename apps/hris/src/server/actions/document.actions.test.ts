import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock next/headers
vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers()),
}));

// Mock next/cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Mock @pspk/auth
vi.mock("@pspk/auth", () => ({
  getSession: vi.fn(),
  getAuthContext: vi.fn(),
}));

// Mock @pspk/db
vi.mock("@pspk/db", () => ({
  prisma: {
    employee: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    employeeDocument: {
      create: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
  },
  writeAudit: vi.fn(async () => {}),
}));

// Mock @pspk/storage
const mockStoragePut = vi.fn(async () => {});
const mockStorageDelete = vi.fn(async () => {});
vi.mock("@pspk/storage", () => ({
  getStorageProvider: () => ({
    put: mockStoragePut,
    delete: mockStorageDelete,
  }),
}));

import { uploadEmployeeDocumentAction, deleteEmployeeDocumentAction } from "./document.actions";
import { getSession, getAuthContext } from "@pspk/auth";
import { prisma, writeAudit } from "@pspk/db";

describe("HRIS document.actions.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockStaffSession = {
    user: { id: "user-123", email: "aris@pspk.id" },
  };

  const mockStaffAuthCtx = {
    userId: "user-123",
    employeeId: "emp-123",
    roles: ["staff"],
    permissions: new Set(["hris.employee.read:own", "hris.employee.write:own"]),
  };

  it("berhasil mengunggah dokumen dengan judul 2 karakter (misal: 'CV')", async () => {
    vi.mocked(getSession).mockResolvedValue(mockStaffSession as any);
    vi.mocked(getAuthContext).mockResolvedValue(mockStaffAuthCtx as any);
    vi.mocked(prisma.employee.findUnique).mockResolvedValue({
      id: "emp-123",
      fullName: "I Made Aris Danuarta",
      employeeNo: "EMP-001",
    } as any);

    const createdDoc = {
      id: "doc-1",
      employeeId: "emp-123",
      category: "CV",
      title: "CV",
      fileName: "CV.pdf",
      fileKey: "documents/emp-123/cv-123-abc.pdf",
      fileSize: 1024,
      mimeType: "application/pdf",
      uploadedById: "user-123",
      createdAt: new Date(),
    };
    vi.mocked(prisma.employeeDocument.create).mockResolvedValue(createdDoc as any);

    const formData = new FormData();
    formData.append("employeeId", "emp-123");
    formData.append("category", "CV");
    formData.append("title", "CV");
    const fakeFile = new File(["dummy content"], "CV.pdf", { type: "application/pdf" });
    formData.append("file", fakeFile);

    const res = await uploadEmployeeDocumentAction(formData);

    expect(res.success).toBe(true);
    expect(res.message).toContain("CV");
    expect(mockStoragePut).toHaveBeenCalled();
    expect(writeAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "UPLOAD_DOCUMENT",
        entityType: "EmployeeDocument",
      }),
    );
  });

  it("menolak unggah dokumen jika judul kurang dari 2 karakter", async () => {
    vi.mocked(getSession).mockResolvedValue(mockStaffSession as any);
    vi.mocked(getAuthContext).mockResolvedValue(mockStaffAuthCtx as any);
    vi.mocked(prisma.employee.findUnique).mockResolvedValue({
      id: "emp-123",
      fullName: "I Made Aris Danuarta",
      employeeNo: "EMP-001",
    } as any);

    const formData = new FormData();
    formData.append("employeeId", "emp-123");
    formData.append("category", "CV");
    formData.append("title", "C"); // Hanya 1 karakter
    const fakeFile = new File(["dummy content"], "CV.pdf", { type: "application/pdf" });
    formData.append("file", fakeFile);

    const res = await uploadEmployeeDocumentAction(formData);

    expect(res.success).toBe(false);
    expect(res.message).toBe("Judul dokumen minimal 2 karakter (misal: CV, SK, KK).");
  });

  it("menolak staf biasa mengunggah dokumen kategori CONTRACT", async () => {
    vi.mocked(getSession).mockResolvedValue(mockStaffSession as any);
    vi.mocked(getAuthContext).mockResolvedValue(mockStaffAuthCtx as any);
    vi.mocked(prisma.employee.findUnique).mockResolvedValue({
      id: "emp-123",
      fullName: "I Made Aris Danuarta",
      employeeNo: "EMP-001",
    } as any);

    const formData = new FormData();
    formData.append("employeeId", "emp-123");
    formData.append("category", "CONTRACT");
    formData.append("title", "Kontrak Kerja PKWT");
    const fakeFile = new File(["dummy content"], "kontrak.pdf", { type: "application/pdf" });
    formData.append("file", fakeFile);

    const res = await uploadEmployeeDocumentAction(formData);

    expect(res.success).toBe(false);
    expect(res.message).toContain("Admin HR");
  });

  it("mengizinkan Admin HR mengunggah dokumen CONTRACT untuk pegawai mana saja", async () => {
    const mockHrSession = { user: { id: "hr-user", email: "hr@pspk.id" } };
    const mockHrAuthCtx = {
      userId: "hr-user",
      employeeId: "hr-emp",
      roles: ["admin_hr"],
      permissions: new Set(["hris.employee.write:all"]),
    };

    vi.mocked(getSession).mockResolvedValue(mockHrSession as any);
    vi.mocked(getAuthContext).mockResolvedValue(mockHrAuthCtx as any);
    vi.mocked(prisma.employee.findUnique).mockResolvedValue({
      id: "emp-123",
      fullName: "I Made Aris Danuarta",
      employeeNo: "EMP-001",
    } as any);

    vi.mocked(prisma.employeeDocument.create).mockResolvedValue({
      id: "doc-contract-1",
      employeeId: "emp-123",
      category: "CONTRACT",
      title: "Surat Keputusan Kerja PKWT",
      fileName: "SK.pdf",
      fileKey: "documents/emp-123/contract-123-abc.pdf",
      fileSize: 2048,
      mimeType: "application/pdf",
      uploadedById: "hr-user",
      createdAt: new Date(),
    } as any);

    const formData = new FormData();
    formData.append("employeeId", "emp-123");
    formData.append("category", "CONTRACT");
    formData.append("title", "Surat Keputusan Kerja PKWT");
    const fakeFile = new File(["dummy content"], "SK.pdf", { type: "application/pdf" });
    formData.append("file", fakeFile);

    const res = await uploadEmployeeDocumentAction(formData);

    expect(res.success).toBe(true);
    expect(mockStoragePut).toHaveBeenCalled();
  });

  it("mengizinkan staf menghapus dokumen non-kontrak miliknya sendiri", async () => {
    vi.mocked(getSession).mockResolvedValue(mockStaffSession as any);
    vi.mocked(getAuthContext).mockResolvedValue(mockStaffAuthCtx as any);
    vi.mocked(prisma.employee.findUnique).mockImplementation((args: any) => {
      if (args.where?.userId) {
        return Promise.resolve({ id: "emp-123" } as any);
      }
      if (args.where?.id === "doc-1") {
        return Promise.resolve({
          id: "doc-1",
          employeeId: "emp-123",
          category: "CV",
          title: "CV Aris",
          fileName: "CV.pdf",
          fileKey: "documents/emp-123/cv.pdf",
          employee: { fullName: "I Made Aris Danuarta" },
        } as any);
      }
      return Promise.resolve(null);
    });

    const res = await deleteEmployeeDocumentAction({ documentId: "doc-1" });

    expect(res.success).toBe(true);
    expect(mockStorageDelete).toHaveBeenCalledWith("documents/emp-123/cv.pdf");
    expect(prisma.employeeDocument.delete).toHaveBeenCalledWith({
      where: { id: "doc-1" },
    });
  });

  it("menolak staf menghapus dokumen kategori CONTRACT", async () => {
    vi.mocked(getSession).mockResolvedValue(mockStaffSession as any);
    vi.mocked(getAuthContext).mockResolvedValue(mockStaffAuthCtx as any);
    vi.mocked(prisma.employee.findUnique).mockImplementation((args: any) => {
      if (args.where?.userId) {
        return Promise.resolve({ id: "emp-123" } as any);
      }
      if (args.where?.id === "doc-contract") {
        return Promise.resolve({
          id: "doc-contract",
          employeeId: "emp-123",
          category: "CONTRACT",
          title: "SK PKWT",
          fileName: "SK.pdf",
          fileKey: "documents/emp-123/contract.pdf",
          employee: { fullName: "I Made Aris Danuarta" },
        } as any);
      }
      return Promise.resolve(null);
    });

    const res = await deleteEmployeeDocumentAction({ documentId: "doc-contract" });

    expect(res.success).toBe(false);
    expect(res.message).toContain("Admin HR");
    expect(mockStorageDelete).not.toHaveBeenCalled();
  });
});
