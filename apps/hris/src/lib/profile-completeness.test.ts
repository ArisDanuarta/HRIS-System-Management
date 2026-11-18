import { describe, it, expect } from "vitest";
import { calculateProfileCompleteness } from "./profile-completeness";

describe("calculateProfileCompleteness", () => {
  it("harus mengembalikan persentase 0% jika semua data kosong", () => {
    const result = calculateProfileCompleteness({});
    expect(result.percentage).toBe(0);
    expect(result.completedCount).toBe(0);
    expect(result.totalCount).toBe(12);
    expect(result.missingItems.length).toBe(12);
  });

  it("harus menghitung persentase secara proporsional sesuai kelengkapan data", () => {
    const mockEmployee = {
      photoKey: "avatars/emp-1.jpg",
      addresses: [
        { type: "KTP", street: "Jl. Sudirman No. 1" },
        { type: "DOMICILE", street: "Jl. Thamrin No. 2" },
      ],
      emergencyContactName: "Budi Santoso",
      emergencyContactPhone: "08123456789",
      familyMembers: [{ name: "Siti" }],
      educations: [{ level: "S1" }],
      workExperiences: [{ companyName: "PT Maju" }],
      documents: [
        { category: "KTP" },
        { category: "NPWP" },
        { category: "DIPLOMA" },
        { category: "CV" },
      ],
      bankAccountMasked: "1234567890",
    };

    const result = calculateProfileCompleteness(mockEmployee);
    expect(result.percentage).toBe(100);
    expect(result.completedCount).toBe(12);
    expect(result.missingItems.length).toBe(0);
  });

  it("harus menggunakan fallback address string jika addresses array kosong", () => {
    const mockEmployee = {
      address: "Jl. Merdeka No. 45 Jakarta",
      emergencyContactName: "Budi",
      emergencyContactPhone: "08123",
    };

    const result = calculateProfileCompleteness(mockEmployee);
    // KTP dan Domicile terhitung lengkap via fallback address, plus emergency contact = 3 item
    expect(result.completedCount).toBe(3);
    const completedKeys = result.items.filter((i) => i.isComplete).map((i) => i.key);
    expect(completedKeys).toContain("ktpAddress");
    expect(completedKeys).toContain("domicileAddress");
    expect(completedKeys).toContain("emergencyContact");
  });
});
