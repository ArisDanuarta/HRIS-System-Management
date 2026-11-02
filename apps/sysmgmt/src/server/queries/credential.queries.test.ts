import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getCredentialsDirectory,
  getCredentialStats,
} from "./credential.queries";
import type { CredentialCategory, TwoFactorType } from "@pspk/db";

vi.mock("@pspk/db", async () => {
  const actual = await vi.importActual<typeof import("@pspk/db")>("@pspk/db");
  return {
    ...actual,
    prisma: {
      credential: {
        findMany: vi.fn(),
        count: vi.fn(),
        groupBy: vi.fn(),
      },
    },
  };
});

describe("credential.queries.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockCredentials = [
    {
      id: "cred-1",
      title: "Instagram Resmi PSPK",
      category: "SOCIAL_MEDIA" as CredentialCategory,
      url: "https://instagram.com/pspk.id",
      username: "pspk.id",
      email: "humas@pspk.id",
      passwordEnc: "enc:mock1",
      twoFactorType: "AUTHENTICATOR_APP" as TwoFactorType,
      recoveryEmail: "it@pspk.id",
      recoveryPhone: null,
      picEmployeeId: "emp-1",
      notes: "Akun IG",
      isActive: true,
      lastRotatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      createdAt: new Date(),
      updatedAt: new Date(),
      picEmployee: {
        id: "emp-1",
        fullName: "Farhan Ramadhan",
        employeeNo: "EMP-001",
        currentDepartment: { name: "Komunikasi" },
        currentPosition: { title: "Staf Humas" },
      },
    },
    {
      id: "cred-2",
      title: "cPanel Rumahweb",
      category: "WEBSITE_HOSTING" as CredentialCategory,
      url: "https://rumahweb.com",
      username: "root_pspk",
      email: "it@pspk.id",
      passwordEnc: "enc:mock2",
      twoFactorType: "NONE" as TwoFactorType,
      recoveryEmail: null,
      recoveryPhone: null,
      picEmployeeId: null,
      notes: "Hosting utama",
      isActive: true,
      lastRotatedAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000), // 120 days ago (>90, needs rotation)
      createdAt: new Date(),
      updatedAt: new Date(),
      picEmployee: null,
    },
  ];

  it("harus mengembalikan daftar kredensial terformat tanpa membocorkan ciphertext/plaintext password", async () => {
    const { prisma } = await import("@pspk/db");

    vi.mocked(prisma.credential.findMany).mockResolvedValue(
      mockCredentials as unknown as Awaited<ReturnType<typeof prisma.credential.findMany>>,
    );
    vi.mocked(prisma.credential.count).mockResolvedValue(2);
    vi.mocked(prisma.credential.groupBy).mockResolvedValue([
      { category: "SOCIAL_MEDIA", _count: { id: 1 } },
      { category: "WEBSITE_HOSTING", _count: { id: 1 } },
    ] as unknown as Awaited<ReturnType<typeof prisma.credential.groupBy>>);

    const result = await getCredentialsDirectory();

    expect(result.total).toBe(2);
    expect(result.credentials.length).toBe(2);

    const first = result.credentials[0]!;
    expect(first.title).toBe("Instagram Resmi PSPK");
    expect(first.hasPassword).toBe(true);
    // Memastikan field passwordEnc tidak diekspos di SerializedCredential
    expect("passwordEnc" in first).toBe(false);
    expect(first.needsRotation).toBe(false);

    const second = result.credentials[1]!;
    expect(second.title).toBe("cPanel Rumahweb");
    expect(second.needsRotation).toBe(true); // > 90 hari
  });

  it("harus menghitung metrik agregat kredensial dengan benar", async () => {
    const { prisma } = await import("@pspk/db");

    vi.mocked(prisma.credential.count)
      .mockResolvedValueOnce(10) // total
      .mockResolvedValueOnce(8)  // active
      .mockResolvedValueOnce(3)  // social media
      .mockResolvedValueOnce(2)  // website hosting
      .mockResolvedValueOnce(3)  // saas tools
      .mockResolvedValueOnce(6)  // 2fa protected
      .mockResolvedValueOnce(2); // needs rotation

    const stats = await getCredentialStats();

    expect(stats.totalCredentials).toBe(10);
    expect(stats.activeCount).toBe(8);
    expect(stats.socialMediaCount).toBe(3);
    expect(stats.websiteHostingCount).toBe(2);
    expect(stats.twoFactorProtectedCount).toBe(6);
    expect(stats.twoFactorAdoptionRate).toBe(75); // (6/8)*100 = 75%
    expect(stats.needsRotationCount).toBe(2);
  });
});
