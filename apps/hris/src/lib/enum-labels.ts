/**
 * Kamus pemetaan label Bahasa Indonesia untuk nilai enum Prisma di HRIS.
 */

export const GENDER_LABELS: Record<string, string> = {
  MALE: "Laki-laki",
  FEMALE: "Perempuan",
};

export const MARITAL_STATUS_LABELS: Record<string, string> = {
  SINGLE: "Belum Menikah",
  MARRIED: "Menikah",
  DIVORCED: "Cerai Hidup",
  WIDOWED: "Cerai Mati",
};

export const RELIGION_LABELS: Record<string, string> = {
  ISLAM: "Islam",
  CHRISTIAN: "Kristen Protestan",
  CATHOLIC: "Katolik",
  HINDU: "Hindu",
  BUDDHIST: "Buddha",
  CONFUCIAN: "Konghucu",
  OTHER: "Lainnya",
};

export const BLOOD_TYPE_LABELS: Record<string, string> = {
  A: "A",
  B: "B",
  AB: "AB",
  O: "O",
  UNKNOWN: "Tidak Diketahui",
};

export const CITIZENSHIP_LABELS: Record<string, string> = {
  WNI: "WNI (Warga Negara Indonesia)",
  WNA: "WNA (Warga Negara Asing)",
};

export const ADDRESS_TYPE_LABELS: Record<string, string> = {
  KTP: "Sesuai KTP",
  DOMICILE: "Domisili Sekarang",
};

export const FAMILY_RELATION_LABELS: Record<string, string> = {
  FATHER: "Ayah",
  MOTHER: "Ibu",
  SPOUSE: "Pasangan (Suami/Istri)",
  CHILD: "Anak",
  SIBLING: "Saudara Kandung",
  OTHER: "Lainnya",
};

export const EDUCATION_LEVEL_LABELS: Record<string, string> = {
  SD: "SD / Sederajat",
  SMP: "SMP / MTs",
  SMA_SMK: "SMA / SMK / MA",
  D3: "Diploma 3 (D3)",
  D4: "Diploma 4 (D4)",
  S1: "Sarjana (S1)",
  S2: "Magister (S2)",
  S3: "Doktor (S3)",
  OTHER: "Lainnya",
};

export function getGenderLabel(val?: string | null): string {
  if (!val) return "-";
  return GENDER_LABELS[val] || val;
}

export function getMaritalStatusLabel(val?: string | null): string {
  if (!val) return "-";
  return MARITAL_STATUS_LABELS[val] || val;
}

export function getReligionLabel(val?: string | null): string {
  if (!val) return "-";
  return RELIGION_LABELS[val] || val;
}

export function getBloodTypeLabel(val?: string | null): string {
  if (!val) return "-";
  return BLOOD_TYPE_LABELS[val] || val;
}

export function getCitizenshipLabel(val?: string | null): string {
  if (!val) return "WNI";
  return CITIZENSHIP_LABELS[val] || val;
}

export function getFamilyRelationLabel(val?: string | null): string {
  if (!val) return "-";
  return FAMILY_RELATION_LABELS[val] || val;
}

export function getEducationLevelLabel(val?: string | null): string {
  if (!val) return "-";
  return EDUCATION_LEVEL_LABELS[val] || val;
}
