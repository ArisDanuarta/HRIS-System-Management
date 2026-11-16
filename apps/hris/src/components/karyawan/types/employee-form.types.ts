import {
  Religion,
  Citizenship,
  BloodType,
  AddressType,
  FamilyRelation,
  EducationLevel,
  EmployeeStatus,
  EmploymentType,
  Gender,
  MaritalStatus,
  PtkpStatus,
  TaxMethod,
  WageType,
} from "@pspk/db";

export {
  Religion,
  Citizenship,
  BloodType,
  AddressType,
  FamilyRelation,
  EducationLevel,
};

export const DOCUMENT_CATEGORIES = [
  "KTP",
  "NPWP",
  "CV",
  "DIPLOMA",
  "CERTIFICATE",
  "CONTRACT",
  "FAMILY_CARD",
  "BANK_BOOK",
  "BPJS_KES",
  "BPJS_TK",
  "SKCK",
  "HEALTH_CERT",
  "PREVIOUS_EMPLOYER_LETTER",
  "OFFER_LETTER",
  "NDA",
  "MARRIAGE_CERT",
  "OTHER",
] as const;

export type DocumentCategoryKey = (typeof DOCUMENT_CATEGORIES)[number];

export interface AddressData {
  street: string;
  kelurahan: string;
  kecamatan: string;
  city: string;
  province: string;
  postalCode: string;
}

export interface FamilyMemberItem {
  id?: string;
  name: string;
  relation: FamilyRelation;
  birthDate?: string; // YYYY-MM-DD
  phone?: string;
  isDependent: boolean;
  notes?: string;
}

export interface EducationItem {
  id?: string;
  level: EducationLevel;
  institution: string;
  major?: string;
  graduationYear?: number | null;
  gpa?: string | null;
  certificateFile?: File | null;
  certificateFileName?: string | null;
  certificateDocKey?: string | null;
}

export interface TrainingItem {
  id?: string;
  name: string;
  participationType?: string; // e.g. "Peserta", "Pembicara", "Panitia"
  startDate?: string;
  endDate?: string;
  duration?: string;
  location?: string;
  organizer?: string;
  certificateFile?: File | null;
  certificateFileName?: string | null;
  certificateDocKey?: string | null;
}

export interface WorkExperienceItem {
  id?: string;
  companyName: string;
  jobTitle: string;
  startDate: string; // YYYY-MM
  endDate?: string; // YYYY-MM or empty for "Sekarang"
  isCurrent?: boolean;
  reasonForLeaving?: string;
  description?: string;
}

export interface UploadedFileState {
  file: File | null;
  previewUrl?: string | null;
  documentKey?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  uploadedAt?: string | null;
  status: "idle" | "staged" | "uploading" | "uploaded" | "error";
  error?: string | null;
}

export interface AdditionalDocumentItem {
  id: string;
  title: string;
  file: File | null;
  fileName?: string | null;
  fileSize?: number | null;
  documentKey?: string | null;
  status: "idle" | "staged" | "uploading" | "uploaded" | "error";
  error?: string | null;
}

export interface MasterOption {
  id: string;
  name: string;
  isDefault?: boolean;
}

export interface EmployeeWizardExtendedState {
  // --- LANGKAH 1: DATA DIRI & KONTAK ---
  profilePhoto: UploadedFileState;
  fullName: string;
  nickname: string;
  gender: Gender | "";
  birthPlace: string;
  birthDate: string;
  religion: Religion | "";
  citizenship: Citizenship;
  bloodType: BloodType | "";
  maritalStatus: MaritalStatus | "";
  motherName: string;

  // Kontak
  workEmail: string;
  personalEmail: string;
  phone: string;
  landlinePhone: string;

  // Alamat KTP & Domisili
  addressKtp: AddressData;
  isDomicileSameAsKtp: boolean;
  addressDomicile: AddressData;

  // Kontak Darurat
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;

  // Tabel Dinamis Langkah 1
  familyMembers: FamilyMemberItem[];
  educations: EducationItem[];
  trainings: TrainingItem[];
  workExperiences: WorkExperienceItem[];

  // Dokumen Berkas Langkah 1
  docCv: UploadedFileState;
  docDiploma: UploadedFileState;
  docFamilyCard: UploadedFileState;

  // --- LANGKAH 2: PENEMPATAN & JABATAN ---
  workLocationId: string;
  legalEntityId: string;
  employeeNo: string;
  currentDepartmentId: string;
  currentPositionId: string;
  managerId: string;
  joinDate: string;
  status: EmployeeStatus;
  probationEndDate: string;
  resignationDate: string;

  // Dokumen Berkas Langkah 2
  docExperienceLetter: UploadedFileState;
  docOfferLetter: UploadedFileState;

  // --- LANGKAH 3: KONTRAK & KOMPENSASI ---
  employmentTypeId: string;
  employmentType: EmploymentType;
  contractStartDate: string;
  contractEndDate: string;
  contractNumber: string;
  contractNotes: string;
  wageType: WageType;
  hourlyRate: number;
  baseSalary: number;
  allowancePosition: number;
  allowanceTransport: number;
  allowanceCommunication: number;
  allowanceOther: number;
  allowanceOtherNote: string;
  ptkpStatus: PtkpStatus;
  taxMethod: TaxMethod;

  // Dokumen Berkas Langkah 3
  docContract: UploadedFileState;
  docNda: UploadedFileState;
  docMarriageCert: UploadedFileState;

  // --- LANGKAH 4: PERBANKAN & DATA SENSITIF ---
  bankName: string;
  bankAccount: string;
  bankAccountName: string;
  nik: string;
  npwp: string;
  passportKitas: string;
  bpjsKesehatanNo: string;
  bpjsKetenagakerjaanNo: string;

  // Dokumen Berkas Langkah 4 (Berpasangan)
  docKtp: UploadedFileState;
  docNpwp: UploadedFileState;
  docBankBook: UploadedFileState;
  docBpjsKes: UploadedFileState;
  docBpjsTk: UploadedFileState;
  docSkck: UploadedFileState;
  docHealthCert: UploadedFileState;
  additionalDocuments: AdditionalDocumentItem[];

  // Opsi Pembuatan Akun
  createUserAccount: boolean;
  accountRole: string;
}
