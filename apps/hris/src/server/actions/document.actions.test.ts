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

type MockSession = Awaited<ReturnType<typeof getSession>>;
type MockAuthContext = Awaited<ReturnType<typeof getAuthContext>>;
type MockEmployee = Awaited<ReturnType<typeof prisma.employee.findUnique>>;
type MockEmployeeDoc = Awaited<ReturnType<typeof prisma.employeeDocument.create>>;
type MockDocUnique = Awaited<ReturnType<typeof prisma.employeeDocument.findUnique>>;

describe("HRIS document.actions.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockStaffSession: MockSession = {
    user: {
      id: "user-123",
      email: "aris@pspk.id",
      name: "Aris Danuarta",
      emailVerified: true,
      mustChangePassword: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    session: {
      id: "sess-123",
      userId: "user-123",
      token: "tok-123",
      expiresAt: new Date(Date.now() + 3600000),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };

  const mockStaffAuthCtx: MockAuthContext = {
    userId: "user-123",
    employeeId: "emp-123",
    roles: ["staff"],
    permissions: new Set(["hris.employee.read:own", "hris.employee.write:own"]),
  };

  it("berhasil mengunggah dokumen dengan judul 2 karakter (misal: 'CV')", async () => {
    vi.mocked(getSession).mockResolvedValue(mockStaffSession);
    vi.mocked(getAuthContext).mockResolvedValue(mockStaffAuthCtx);
    vi.mocked(prisma.employee.findUnique).mockResolvedValue({
      id: "emp-123",
      fullName: "I Made Aris Danuarta",
      employeeNo: "EMP-001",
    } as unknown as MockEmployee);

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
    } as unknown as MockEmployeeDoc;
    vi.mocked(prisma.employeeDocument.create).mockResolvedValue(createdDoc);

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

  it("berhasil mengunggah dokumen baru: BANK_BOOK, BPJS, EXPERIENCE_LETTER, dan CONTRACT oleh pegawai", async () => {
    vi.mocked(getSession).mockResolvedValue(mockStaffSession);
    vi.mocked(getAuthContext).mockResolvedValue(mockStaffAuthCtx);
    vi.mocked(prisma.employee.findUnique).mockResolvedValue({
      id: "emp-123",
      fullName: "I Made Aris Danuarta",
      employeeNo: "EMP-001",
    } as unknown as MockEmployee);

    const categories = ["BANK_BOOK", "BPJS", "EXPERIENCE_LETTER", "CONTRACT"] as const;

    for (const cat of categories) {
      vi.mocked(prisma.employeeDocument.create).mockResolvedValue({
        id: `doc-${cat}`,
        employeeId: "emp-123",
        category: cat,
        title: `Berkas ${cat}`,
        fileName: `${cat}.pdf`,
        fileKey: `documents/emp-123/${cat.toLowerCase()}.pdf`,
        fileSize: 1024,
        mimeType: "application/pdf",
        uploadedById: "user-123",
        createdAt: new Date(),
      } as unknown as MockEmployeeDoc);

      const formData = new FormData();
      formData.append("employeeId", "emp-123");
      formData.append("category", cat);
      formData.append("title", `Berkas ${cat}`);
      const fakeFile = new File(["dummy content"], `${cat}.pdf`, { type: "application/pdf" });
      formData.append("file", fakeFile);

      const res = await uploadEmployeeDocumentAction(formData);
      expect(res.success).toBe(true);
    }
  });

  it("menolak unggah dokumen jika judul kurang dari 2 karakter", async () => {
    vi.mocked(getSession).mockResolvedValue(mockStaffSession);
    vi.mocked(getAuthContext).mockResolvedValue(mockStaffAuthCtx);
    vi.mocked(prisma.employee.findUnique).mockResolvedValue({
      id: "emp-123",
      fullName: "I Made Aris Danuarta",
      employeeNo: "EMP-001",
    } as unknown as MockEmployee);

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

  it("menolak staf mengunggah dokumen untuk ID pegawai lain", async () => {
    vi.mocked(getSession).mockResolvedValue(mockStaffSession);
    vi.mocked(getAuthContext).mockResolvedValue(mockStaffAuthCtx);
    vi.mocked(prisma.employee.findUnique)
      .mockResolvedValueOnce({ id: "emp-123" } as unknown as MockEmployee)
      .mockResolvedValueOnce({
        id: "emp-999",
        fullName: "Pegawai Lain",
        employeeNo: "EMP-999",
      } as unknown as MockEmployee);

    const formData = new FormData();
    formData.append("employeeId", "emp-999");
    formData.append("category", "CV");
    formData.append("title", "CV Pegawai Lain");
    const fakeFile = new File(["dummy content"], "CV.pdf", { type: "application/pdf" });
    formData.append("file", fakeFile);

    const res = await uploadEmployeeDocumentAction(formData);

    expect(res.success).toBe(false);
    expect(res.message).toContain("tidak memiliki izin");
  });

  it("mengizinkan Admin HR mengunggah dokumen untuk pegawai mana saja", async () => {
    const mockHrSession: MockSession = {
      user: {
        id: "hr-user",
        email: "hr@pspk.id",
        name: "Admin HR",
        emailVerified: true,
        mustChangePassword: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      session: {
        id: "sess-hr",
        userId: "hr-user",
        token: "tok-hr",
        expiresAt: new Date(Date.now() + 3600000),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };
    const mockHrAuthCtx: MockAuthContext = {
      userId: "hr-user",
      employeeId: "hr-emp",
      roles: ["admin_hr"],
      permissions: new Set(["hris.employee.write:all"]),
    };

    vi.mocked(getSession).mockResolvedValue(mockHrSession);
    vi.mocked(getAuthContext).mockResolvedValue(mockHrAuthCtx);
    vi.mocked(prisma.employee.findUnique).mockResolvedValue({
      id: "emp-123",
      fullName: "I Made Aris Danuarta",
      employeeNo: "EMP-001",
    } as unknown as MockEmployee);

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
    } as unknown as MockEmployeeDoc);

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

  it("mengizinkan staf menghapus dokumen miliknya sendiri", async () => {
    vi.mocked(getSession).mockResolvedValue(mockStaffSession);
    vi.mocked(getAuthContext).mockResolvedValue(mockStaffAuthCtx);
    vi.mocked(prisma.employee.findUnique).mockResolvedValue({
      id: "emp-123",
    } as unknown as MockEmployee);
    vi.mocked(prisma.employeeDocument.findUnique).mockResolvedValue({
      id: "doc-1",
      employeeId: "emp-123",
      category: "CV",
      title: "CV Aris",
      fileName: "CV.pdf",
      fileKey: "documents/emp-123/cv.pdf",
      employee: { fullName: "I Made Aris Danuarta" },
    } as unknown as MockDocUnique);

    const res = await deleteEmployeeDocumentAction({ documentId: "doc-1" });

    expect(res.success).toBe(true);
    expect(mockStorageDelete).toHaveBeenCalledWith("documents/emp-123/cv.pdf");
    expect(prisma.employeeDocument.delete).toHaveBeenCalledWith({
      where: { id: "doc-1" },
    });
  });

  it("menolak pengguna menghapus dokumen milik orang lain jika bukan HR/Super Admin", async () => {
    vi.mocked(getSession).mockResolvedValue(mockStaffSession);
    vi.mocked(getAuthContext).mockResolvedValue(mockStaffAuthCtx);
    vi.mocked(prisma.employee.findUnique).mockResolvedValue({
      id: "emp-123",
    } as unknown as MockEmployee);
    vi.mocked(prisma.employeeDocument.findUnique).mockResolvedValue({
      id: "doc-other",
      employeeId: "emp-999", // Milik orang lain
      category: "CV",
      title: "CV Orang Lain",
      fileName: "CV.pdf",
      fileKey: "documents/emp-999/cv.pdf",
      employee: { fullName: "Pegawai Lain" },
    } as unknown as MockDocUnique);

    const res = await deleteEmployeeDocumentAction({ documentId: "doc-other" });

    expect(res.success).toBe(false);
    expect(res.message).toContain("tidak memiliki izin");
    expect(mockStorageDelete).not.toHaveBeenCalled();
  });
});
