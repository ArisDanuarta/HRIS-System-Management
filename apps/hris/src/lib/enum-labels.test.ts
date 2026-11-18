import { describe, it, expect } from "vitest";
import {
  getGenderLabel,
  getMaritalStatusLabel,
  getReligionLabel,
  getBloodTypeLabel,
  getCitizenshipLabel,
  getFamilyRelationLabel,
  getEducationLevelLabel,
} from "./enum-labels";

describe("enum-labels helpers", () => {
  it("harus memetakan enum ke label Bahasa Indonesia dengan tepat", () => {
    expect(getGenderLabel("MALE")).toBe("Laki-laki");
    expect(getGenderLabel("FEMALE")).toBe("Perempuan");
    expect(getGenderLabel(null)).toBe("-");

    expect(getMaritalStatusLabel("MARRIED")).toBe("Menikah");
    expect(getMaritalStatusLabel("SINGLE")).toBe("Belum Menikah");

    expect(getReligionLabel("ISLAM")).toBe("Islam");
    expect(getReligionLabel("CHRISTIAN")).toBe("Kristen Protestan");

    expect(getBloodTypeLabel("O")).toBe("O");
    expect(getCitizenshipLabel("WNI")).toBe("WNI (Warga Negara Indonesia)");

    expect(getFamilyRelationLabel("SPOUSE")).toBe("Pasangan (Suami/Istri)");
    expect(getFamilyRelationLabel("CHILD")).toBe("Anak");

    expect(getEducationLevelLabel("S1")).toBe("Sarjana (S1)");
    expect(getEducationLevelLabel("SMA_SMK")).toBe("SMA / SMK / MA");
  });

  it("harus mengembalikan nilai aslinya jika tidak terdaftar di kamus", () => {
    expect(getFamilyRelationLabel("CUSTOM_RELATION")).toBe("CUSTOM_RELATION");
  });
});
