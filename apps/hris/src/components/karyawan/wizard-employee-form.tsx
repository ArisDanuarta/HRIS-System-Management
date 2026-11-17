"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Briefcase,
  FileText,
  Shield,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Save,
  Key,
  ShieldCheck,
  Copy,
  Check,
  Mail,
  Sparkles,
  Loader2,
  XCircle,
  CheckCircle2,
  Plus,
  ExternalLink,
  Settings,
  UploadCloud,
  FileCheck,
  Trash2,
  Download,
  Receipt,
  Info,
  Camera,
  PhoneCall,
  Home,
  HeartHandshake,
  FileUp,
  GraduationCap,
  Award,
  Users,
} from "lucide-react";
import {
  createEmployeeAction,
  updateEmployeeAction,
  generateNextEmployeeNoAction,
  checkEmployeeNoAvailabilityAction,
  uploadContractFileAction,
  uploadEmployeePhotoAction,
} from "@/server/actions/employee.actions";
import { createEmploymentTypeAction } from "@/server/actions/employment-type.actions";
import { CreateEmployeeInput, UpdateEmployeeInput } from "@/server/schemas/employee.schema";

import {
  EmployeeStatus,
  EmploymentType,
  Gender,
  MaritalStatus,
  PtkpStatus,
  TaxMethod,
  Religion,
  Citizenship,
  BloodType,
  AddressType,
  FamilyRelation,
  EducationLevel,
} from "@pspk/db";
import { toDateString, formatRupiah } from "@pspk/shared";
import { getPtkpExplanation, getTaxMethodExplanation } from "@/lib/tax-explanation";
import {
  calculateMonthlyPph21Ter,
  calculateCompanyTaxableBenefit,
} from "@/server/services/tax/pph21-calculator";
import { DocumentUploadCard } from "./components/DocumentUploadCard";
import { DocumentChecklistSummary, ChecklistDocItem } from "./components/DocumentChecklistSummary";
import { FormSection } from "./components/FormSection";
import { AddressFields } from "./components/AddressFields";
import { DynamicTable } from "./components/DynamicTable";
import {
  UploadedFileState,
  AdditionalDocumentItem,
  AddressData,
  FamilyMemberItem,
  EducationItem,
  TrainingItem,
  WorkExperienceItem,
} from "./types/employee-form.types";
import {
  uploadEmployeeDocumentAction,
  DocumentCategory,
} from "@/server/actions/document.actions";

interface DepartmentOption {
  id: string;
  name: string;
  type?: string;
  positions: { id: string; title: string }[];
}

interface ManagerOption {
  id: string;
  fullName: string;
  employeeNo: string;
  currentPosition?: { title: string } | null;
}

export interface RoleOption {
  id: string;
  key: string;
  name: string;
  description?: string | null;
}

export interface EmploymentTypeOption {
  id: string;
  code: string;
  name: string;
  category: "PERMANENT" | "FIXED_TERM" | "PART_TIME_PROJECT";
  wageType: "MONTHLY" | "HOURLY";
  defaultHourlyRate: number | null;
  description: string | null;
}

export interface InitialEmployeeData {
  id: string;
  fullName: string;
  nickname?: string | null;
  workEmail: string;
  personalEmail?: string | null;
  phone?: string | null;
  birthDate?: Date | string | null;
  birthPlace?: string | null;
  gender?: Gender | null;
  maritalStatus?: MaritalStatus | null;
  address?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  employeeNo: string;
  currentDepartmentId?: string | null;
  currentPositionId?: string | null;
  managerId?: string | null;
  joinDate?: Date | string | null;
  status: EmployeeStatus;
  bankName?: string | null;
  bankAccountName?: string | null;
  ptkpStatus?: PtkpStatus | null;
  taxMethod?: TaxMethod | null;
  hasNik?: boolean;
  hasNpwp?: boolean;
  hasBankAccount?: boolean;
  hasPassportKitas?: boolean;
  hasBpjsKes?: boolean;
  hasBpjsTk?: boolean;
  citizenship?: "WNI" | "WNA" | Citizenship | null;
  religion?: Religion | null;
  bloodType?: BloodType | null;
  motherName?: string | null;
  landlinePhone?: string | null;
  emergencyContactRelation?: string | null;
  photoKey?: string | null;
  hasCv?: boolean;
  hasDiploma?: boolean;
  hasFamilyCard?: boolean;
  hasPreviousEmployerLetter?: boolean;
  hasOfferLetter?: boolean;
  hasNda?: boolean;
  hasMarriageCert?: boolean;
  workLocationId?: string | null;
  legalEntityId?: string | null;
  probationEndDate?: Date | string | null;
  endDate?: Date | string | null;
  addresses?: {
    id?: string;
    type: AddressType;
    street: string;
    kelurahan?: string | null;
    kecamatan?: string | null;
    city?: string | null;
    province?: string | null;
    postalCode?: string | null;
  }[];
  contracts?: {
    type: EmploymentType;
    employmentTypeId?: string | null;
    wageType?: "MONTHLY" | "HOURLY";
    hourlyRate?: number | null;
    startDate: Date | string;
    endDate?: Date | string | null;
    baseSalary?: number | null;
    status?: string | null;
    notes?: string | null;
    documentKey?: string | null;
    employmentTypeMaster?: { id: string; name: string; code: string } | null;
  }[];
  salaryComponents?: {
    id: string;
    componentId: string;
    code: string;
    name: string;
    amount: number;
  }[];
  familyMembers?: {
    id?: string;
    name: string;
    relation: string;
    birthDate?: Date | string | null;
    phone?: string | null;
    isDependent?: boolean | null;
    notes?: string | null;
  }[];
  educations?: {
    id?: string;
    level: string;
    institution: string;
    major?: string | null;
    graduationYear?: number | null;
    gpa?: { toNumber(): number } | number | string | null;
  }[];
  trainings?: {
    id?: string;
    name: string;
    participationType?: string | null;
    startDate?: Date | string | null;
    endDate?: Date | string | null;
    duration?: string | null;
    location?: string | null;
    organizer?: string | null;
  }[];
  workExperiences?: {
    id?: string;
    companyName: string;
    jobTitle: string;
    startDate?: Date | string | null;
    endDate?: Date | string | null;
    isCurrent?: boolean | null;
    reasonForLeaving?: string | null;
    description?: string | null;
  }[];
  documents?: {
    id: string;
    category: string;
    title: string;
    fileName: string;
    fileKey: string;
    educationId?: string | null;
    trainingId?: string | null;
  }[];
}

export interface WorkLocationOption {
  id: string;
  name: string;
  address?: string | null;
  isDefault?: boolean;
}

export interface LegalEntityOption {
  id: string;
  name: string;
  tkuCode?: string | null;
  npwp?: string | null;
  isDefault?: boolean;
}

interface WizardEmployeeFormProps {
  mode: "create" | "edit";
  departments: DepartmentOption[];
  managers: ManagerOption[];
  roles?: RoleOption[];
  isSuperAdmin?: boolean;
  initialData?: InitialEmployeeData | null;
  /** Daftar tipe ikatan kerja aktif dari master data (EmploymentTypeMaster) */
  employmentTypes?: EmploymentTypeOption[];
  workLocations?: WorkLocationOption[];
  legalEntities?: LegalEntityOption[];
}

export function WizardEmployeeForm({
  mode,
  departments,
  managers,
  roles,
  isSuperAdmin = false,
  initialData,
  employmentTypes = [],
  workLocations = [],
  legalEntities = [],
}: WizardEmployeeFormProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isGeneratingNip, setIsGeneratingNip] = useState(false);
  const [isCheckingNip, setIsCheckingNip] = useState(false);
  const [nipStatus, setNipStatus] = useState<{
    available: boolean;
    message: string;
  } | null>(null);
  const checkNipDebounceRef = React.useRef<NodeJS.Timeout | null>(null);

  const [stepCooldown, setStepCooldown] = useState(false);
  const [copied, setCopied] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{
    id: string;
    employeeNo: string;
    fullName: string;
    workEmail: string;
    temporaryPassword?: string;
    roleKey?: string;
    roleName?: string;
    personalEmail?: string | null;
    emailSent?: boolean;
    emailSimulated?: boolean;
    emailMessage?: string;
  } | null>(null);

  // Employment Type Options State
  const [employmentTypesList, setEmploymentTypesList] = useState(employmentTypes || []);
  const [isQuickCreateModalOpen, setIsQuickCreateModalOpen] = useState(false);
  const [quickCreateForm, setQuickCreateForm] = useState<{
    code: string;
    name: string;
    category: "PERMANENT" | "FIXED_TERM" | "PART_TIME_PROJECT";
    wageType: "MONTHLY" | "HOURLY";
    defaultHourlyRate: string;
    description: string;
  }>({
    code: "",
    name: "",
    category: "FIXED_TERM",
    wageType: "MONTHLY",
    defaultHourlyRate: "30000",
    description: "",
  });
  const [quickCreatePending, setQuickCreatePending] = useState(false);
  const [quickCreateError, setQuickCreateError] = useState<string | null>(null);
  const [quickCreateSuccess, setQuickCreateSuccess] = useState<string | null>(null);

  // Initial active contract resolution
  const initialActiveContract =
    initialData?.contracts?.find((c) => c.status === "ACTIVE") || initialData?.contracts?.[0];

  // Helper untuk mengekstrak nomor kontrak dari catatan [Nomor: ...]
  const extractContractNumber = (notesStr?: string | null) => {
    if (!notesStr) return "";
    const match = notesStr.match(/\[Nomor:\s*([^\]]+)\]/);
    return match && match[1] ? match[1].trim() : "";
  };

  const cleanContractNotes = (notesStr?: string | null) => {
    if (!notesStr) return "";
    return notesStr.replace(/\[Nomor:\s*[^\]]+\]\s*/, "").trim();
  };

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Personal
    fullName: initialData?.fullName || "",
    nickname: initialData?.nickname || "",
    workEmail: initialData?.workEmail || "",
    personalEmail: initialData?.personalEmail || "",
    phone: initialData?.phone || "",
    birthDate: initialData?.birthDate ? toDateString(initialData.birthDate) : "",
    birthPlace: initialData?.birthPlace || "",
    gender: initialData?.gender || "MALE",
    religion: (initialData?.religion as string) || "",
    bloodType: (initialData?.bloodType as string) || "",
    maritalStatus: initialData?.maritalStatus || "SINGLE",
    motherName: initialData?.motherName || "",
    landlinePhone: initialData?.landlinePhone || "",
    address: initialData?.address || "",
    emergencyContactName: initialData?.emergencyContactName || "",
    emergencyContactPhone: initialData?.emergencyContactPhone || "",
    emergencyContactRelation: initialData?.emergencyContactRelation || "",

    // Step 2: Placement
    employeeNo: initialData?.employeeNo || "",
    currentDepartmentId: initialData?.currentDepartmentId || (departments[0]?.id ?? ""),
    currentPositionId: initialData?.currentPositionId || "",
    managerId: initialData?.managerId || "",
    joinDate: initialData?.joinDate ? toDateString(initialData.joinDate) : toDateString(new Date()),
    status: initialData?.status || "ACTIVE",
    workLocationId:
      initialData?.workLocationId ||
      workLocations.find((w) => w.isDefault)?.id ||
      workLocations[0]?.id ||
      "",
    legalEntityId:
      initialData?.legalEntityId ||
      legalEntities.find((l) => l.isDefault)?.id ||
      legalEntities[0]?.id ||
      "",
    probationEndDate: initialData?.probationEndDate ? toDateString(initialData.probationEndDate) : "",
    endDate: initialData?.endDate ? toDateString(initialData.endDate) : "",

    // Step 3: Contract
    employmentType: initialActiveContract?.type || "PERMANENT",
    employmentTypeId:
      initialActiveContract?.employmentTypeId ||
      employmentTypes?.find(
        (t) =>
          t.category === (initialActiveContract?.type || "PERMANENT") &&
          t.wageType === (initialActiveContract?.wageType || "MONTHLY"),
      )?.id ||
      employmentTypes?.[0]?.id ||
      "",
    wageType: (initialActiveContract?.wageType as "MONTHLY" | "HOURLY") || "MONTHLY",
    hourlyRate: initialActiveContract?.hourlyRate || 0,
    contractStartDate: initialActiveContract?.startDate
      ? toDateString(initialActiveContract.startDate)
      : toDateString(new Date()),
    contractEndDate: initialActiveContract?.endDate
      ? toDateString(initialActiveContract.endDate)
      : "",
    baseSalary:
      initialActiveContract?.baseSalary !== undefined && initialActiveContract?.baseSalary !== null
        ? Number(initialActiveContract.baseSalary)
        : "",
    allowancePosition:
      initialData?.salaryComponents?.find((sc) => sc.code === "ALLOWANCE_POSITION")?.amount ?? "",
    allowanceTransport:
      initialData?.salaryComponents?.find((sc) => sc.code === "ALLOWANCE_TRANSPORT")?.amount ?? "",
    allowanceCommunication:
      initialData?.salaryComponents?.find((sc) => sc.code === "ALLOWANCE_COMMUNICATION")?.amount ?? "",
    allowanceOther:
      initialData?.salaryComponents?.find((sc) => sc.code === "ALLOWANCE_OTHER")?.amount ?? "",
    allowanceOtherNote: "",
    contractNumber: extractContractNumber(initialActiveContract?.notes),
    contractDocumentKey: initialActiveContract?.documentKey || "",
    contractNotes: cleanContractNotes(initialActiveContract?.notes),

    // Step 4: Sensitive Data, Tax & Account
    nik: "",
    npwp: "",
    passportKitas: "",
    bpjsKesehatanNo: "",
    bpjsKetenagakerjaanNo: "",
    citizenship: initialData?.citizenship || "WNI",
    ptkpStatus: (initialData?.ptkpStatus as PtkpStatus) || "TK_0",
    taxMethod: (initialData?.taxMethod as TaxMethod) || "GROSS",
    bankName: initialData?.bankName || "",
    bankAccount: "",
    bankAccountName: initialData?.bankAccountName || "",
    createUserAccount: mode === "create",
    accountRole: "staff",
  });

  // State Alamat Lengkap (KTP & Domisili)
  const initialKtp = initialData?.addresses?.find((a) => a.type === "KTP");
  const initialDomicile = initialData?.addresses?.find((a) => a.type === "DOMICILE");

  const [addressKtp, setAddressKtp] = useState<AddressData>({
    street: initialKtp?.street || "",
    kelurahan: initialKtp?.kelurahan || "",
    kecamatan: initialKtp?.kecamatan || "",
    city: initialKtp?.city || "",
    province: initialKtp?.province || "",
    postalCode: initialKtp?.postalCode || "",
  });

  const [addressDomicile, setAddressDomicile] = useState<AddressData>({
    street: initialDomicile?.street || initialData?.address || "",
    kelurahan: initialDomicile?.kelurahan || "",
    kecamatan: initialDomicile?.kecamatan || "",
    city: initialDomicile?.city || "",
    province: initialDomicile?.province || "",
    postalCode: initialDomicile?.postalCode || "",
  });

  const [isDomicileSameAsKtp, setIsDomicileSameAsKtp] = useState<boolean>(false);

  const handleToggleSameAddress = (checked: boolean) => {
    setIsDomicileSameAsKtp(checked);
    if (checked) {
      setAddressDomicile({ ...addressKtp });
    }
  };

  const handleAddressKtpChange = (newKtp: AddressData) => {
    setAddressKtp(newKtp);
    if (isDomicileSameAsKtp) {
      setAddressDomicile(newKtp);
    }
  };

  // State Foto Profil & Dokumen Langkah 1
  const [profilePhoto, setProfilePhoto] = useState<UploadedFileState>({ file: null, status: "idle" });
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(
    initialData?.photoKey ? `/api/documents/${initialData.photoKey}` : null,
  );

  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setProfilePhoto({
        file: null,
        status: "error",
        error: "Format foto harus JPG, PNG, atau WEBP.",
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setProfilePhoto({
        file: null,
        status: "error",
        error: "Ukuran foto melebihi batas maksimal 2 MB.",
      });
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setProfilePhotoPreview(previewUrl);
    setProfilePhoto({
      file,
      fileName: file.name,
      fileSize: file.size,
      status: "staged",
    });
  };

  const handleRemoveProfilePhoto = () => {
    setProfilePhoto({ file: null, status: "idle" });
    setProfilePhotoPreview(initialData?.photoKey ? `/api/documents/${initialData.photoKey}` : null);
  };

  const [docCv, setDocCv] = useState<UploadedFileState>({ file: null, status: "idle" });
  const [docDiploma, setDocDiploma] = useState<UploadedFileState>({ file: null, status: "idle" });
  const [docFamilyCard, setDocFamilyCard] = useState<UploadedFileState>({ file: null, status: "idle" });
  const [docPreviousEmployerLetter, setDocPreviousEmployerLetter] = useState<UploadedFileState>({
    file: null,
    status: "idle",
  });
  const [docOfferLetter, setDocOfferLetter] = useState<UploadedFileState>({
    file: null,
    status: "idle",
  });
  const [docNda, setDocNda] = useState<UploadedFileState>({
    file: null,
    status: "idle",
  });
  const [docMarriageCert, setDocMarriageCert] = useState<UploadedFileState>({
    file: null,
    status: "idle",
  });

  // --- Tabel Dinamis: Data Keluarga ---
  const [familyMembers, setFamilyMembers] = useState<FamilyMemberItem[]>(
    initialData?.familyMembers?.map((fm) => ({
      id: fm.id,
      name: fm.name,
      relation: fm.relation as FamilyRelation,
      birthDate: fm.birthDate ? toDateString(fm.birthDate) : "",
      phone: fm.phone ?? "",
      isDependent: fm.isDependent ?? false,
      notes: fm.notes ?? "",
    })) ?? []
  );

  // --- Tabel Dinamis: Riwayat Pendidikan ---
  const [educations, setEducations] = useState<EducationItem[]>(
    initialData?.educations?.map((edu) => {
      const linkedDoc = initialData.documents?.find((d) => d.educationId === edu.id);
      return {
        id: edu.id,
        level: edu.level as EducationLevel,
        institution: edu.institution,
        major: edu.major ?? "",
        graduationYear: edu.graduationYear ?? null,
        gpa: edu.gpa != null ? String(edu.gpa) : "",
        certificateFile: null,
        certificateFileName: linkedDoc ? linkedDoc.fileName : null,
        certificateDocKey: linkedDoc ? linkedDoc.fileKey : null,
      };
    }) ?? []
  );

  // --- Tabel Dinamis: Pelatihan / Seminar ---
  const [trainings, setTrainings] = useState<TrainingItem[]>(
    initialData?.trainings?.map((tr) => {
      const linkedDoc = initialData.documents?.find((d) => d.trainingId === tr.id);
      return {
        id: tr.id,
        name: tr.name,
        participationType: tr.participationType ?? "",
        startDate: tr.startDate ? toDateString(tr.startDate) : "",
        endDate: tr.endDate ? toDateString(tr.endDate) : "",
        duration: tr.duration ?? "",
        location: tr.location ?? "",
        organizer: tr.organizer ?? "",
        certificateFile: null,
        certificateFileName: linkedDoc ? linkedDoc.fileName : null,
        certificateDocKey: linkedDoc ? linkedDoc.fileKey : null,
      };
    }) ?? []
  );

  // --- Tabel Dinamis: Pengalaman Kerja Terdahulu ---
  const [workExperiences, setWorkExperiences] = useState<WorkExperienceItem[]>(
    initialData?.workExperiences?.map((we) => ({
      id: we.id,
      companyName: we.companyName,
      jobTitle: we.jobTitle,
      startDate: we.startDate ? toDateString(we.startDate).slice(0, 7) : "",
      endDate: we.endDate ? toDateString(we.endDate).slice(0, 7) : "",
      isCurrent: we.isCurrent ?? !we.endDate,
      reasonForLeaving: we.reasonForLeaving ?? "",
      description: we.description ?? "",
    })) ?? []
  );

  // Helper Perhitungan Usia Otomatis dari Tanggal Lahir
  const calculateAge = (birthDateStr?: string | null): string | null => {
    if (!birthDateStr) return null;
    const birth = new Date(birthDateStr);
    if (isNaN(birth.getTime())) return null;
    const now = new Date();
    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();
    if (now.getDate() < birth.getDate()) {
      months--;
    }
    if (months < 0) {
      years--;
      months += 12;
    }
    if (years < 0) return null;
    if (years === 0) return `${months} bulan`;
    return months > 0 ? `${years} tahun ${months} bulan` : `${years} tahun`;
  };

  // Dokumen Berkas Berpasangan Langkah 4
  const [docKtp, setDocKtp] = useState<UploadedFileState>({ file: null, status: "idle" });
  const [docNpwp, setDocNpwp] = useState<UploadedFileState>({ file: null, status: "idle" });
  const [docBankBook, setDocBankBook] = useState<UploadedFileState>({ file: null, status: "idle" });
  const [docBpjsKes, setDocBpjsKes] = useState<UploadedFileState>({ file: null, status: "idle" });
  const [docBpjsTk, setDocBpjsTk] = useState<UploadedFileState>({ file: null, status: "idle" });
  const [docSkck, setDocSkck] = useState<UploadedFileState>({ file: null, status: "idle" });
  const [docHealthCert, setDocHealthCert] = useState<UploadedFileState>({ file: null, status: "idle" });
  const [additionalDocs, setAdditionalDocs] = useState<AdditionalDocumentItem[]>([]);
  const [uploadWarningMessage, setUploadWarningMessage] = useState<string | null>(null);

  const handleAddAdditionalDoc = () => {
    setAdditionalDocs((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        title: "",
        file: null,
        status: "idle",
      },
    ]);
  };

  const handleRemoveAdditionalDoc = (id: string) => {
    setAdditionalDocs((prev) => prev.filter((d) => d.id !== id));
  };

  const handleUpdateAdditionalDocTitle = (id: string, title: string) => {
    setAdditionalDocs((prev) =>
      prev.map((d) => (d.id === id ? { ...d, title } : d)),
    );
  };

  const handleUpdateAdditionalDocFile = (id: string, fileState: UploadedFileState) => {
    setAdditionalDocs((prev) =>
      prev.map((d) =>
        d.id === id
          ? {
              ...d,
              file: fileState.file,
              fileName: fileState.fileName,
              fileSize: fileState.fileSize,
              status: fileState.status,
              error: fileState.error,
            }
          : d,
      ),
    );
  };

  // State berkas upload kontrak kerja PDF
  const [contractFile, setContractFile] = useState<File | null>(null);
  const [contractFileError, setContractFileError] = useState<string | null>(null);

  const handleContractFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContractFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setContractFileError("Format berkas harus berupa dokumen PDF (.pdf).");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setContractFileError("Ukuran berkas melebihi batas maksimal 10 MB.");
      return;
    }

    setContractFile(file);
  };

  const handleRemoveContractFile = () => {
    setContractFile(null);
    setContractFileError(null);
  };

  // Keep positions filtered by selected department
  const selectedDept = departments.find((d) => d.id === formData.currentDepartmentId);
  const availablePositions = selectedDept?.positions || [];

  // Update currentPositionId when department changes if needed
  const handleDepartmentChange = (deptId: string) => {
    const dept = departments.find((d) => d.id === deptId);
    const firstPos = dept?.positions[0]?.id || "";
    setFormData((prev) => ({
      ...prev,
      currentDepartmentId: deptId,
      currentPositionId: firstPos,
    }));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Handler Generate NIP Otomatis
  const handleGenerateNip = async () => {
    setIsGeneratingNip(true);
    setServerError(null);
    try {
      const res = await generateNextEmployeeNoAction(formData.joinDate);
      if (res.ok && res.data.employeeNo) {
        setFormData((prev) => ({ ...prev, employeeNo: res.data.employeeNo }));
        setNipStatus({
          available: true,
          message: `✓ NIP '${res.data.employeeNo}' berhasil dibuat otomatis dan siap digunakan.`,
        });
      } else {
        setServerError(res.error || "Gagal membuat NIP otomatis.");
      }
    } catch {
      setServerError("Terjadi kendala saat membuat NIP otomatis.");
    } finally {
      setIsGeneratingNip(false);
    }
  };

  // Handler input NIP dengan debounce pengecekan duplikat
  const handleNipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setFormData((prev) => ({ ...prev, employeeNo: value }));

    if (checkNipDebounceRef.current) {
      clearTimeout(checkNipDebounceRef.current);
    }

    const trimmed = value.trim();
    if (!trimmed || trimmed.length < 3) {
      setNipStatus(null);
      setIsCheckingNip(false);
      return;
    }

    setIsCheckingNip(true);
    checkNipDebounceRef.current = setTimeout(async () => {
      try {
        const res = await checkEmployeeNoAvailabilityAction(trimmed, initialData?.id);
        if (res.ok) {
          setNipStatus({
            available: res.available,
            message: res.message,
          });
        } else {
          setNipStatus(null);
        }
      } catch {
        setNipStatus(null);
      } finally {
        setIsCheckingNip(false);
      }
    }, 350);
  };

  // Step Validation before progressing
  const validateStep = (step: number): boolean => {
    setServerError(null);
    if (step === 1) {
      if (!formData.fullName.trim() || formData.fullName.length < 3) {
        setServerError("Nama lengkap wajib diisi minimal 3 karakter.");
        return false;
      }
      const emailTrimmed = formData.workEmail.trim().toLowerCase();
      if (!emailTrimmed || !emailTrimmed.includes("@") || !emailTrimmed.endsWith("@pspk.id")) {
        setServerError(
          "Email kantor wajib menggunakan domain resmi @pspk.id (contoh: nama@pspk.id).",
        );
        return false;
      }
      if (mode === "create" && formData.createUserAccount) {
        const personalTrimmed = formData.personalEmail.trim().toLowerCase();
        if (!personalTrimmed || !personalTrimmed.includes("@")) {
          setServerError(
            "Email pribadi wajib diisi untuk pengiriman kredensial akun & kata sandi baru.",
          );
          return false;
        }
        if (personalTrimmed.endsWith("@pspk.id")) {
          setServerError(
            "Email pribadi harus merupakan email pribadi (bukan email kantor @pspk.id).",
          );
          return false;
        }
      }
    } else if (step === 2) {
      if (!formData.employeeNo.trim()) {
        setServerError("Nomor Induk Pegawai (NIP) wajib diisi.");
        return false;
      }
      if (nipStatus && !nipStatus.available) {
        setServerError(
          "Nomor Induk Pegawai (NIP) sudah terdaftar di sistem. Harap gunakan NIP yang berbeda.",
        );
        return false;
      }
      if (!formData.currentDepartmentId) {
        setServerError("Pilih divisi/departemen.");
        return false;
      }
      if (!formData.currentPositionId) {
        setServerError("Pilih posisi/jabatan.");
        return false;
      }
      if (formData.status === "PROBATION" && formData.probationEndDate && formData.joinDate) {
        if (new Date(formData.probationEndDate) < new Date(formData.joinDate)) {
          setServerError("Tanggal akhir masa percobaan tidak boleh mendahului tanggal mulai bergabung.");
          return false;
        }
      }
      if (
        (formData.status === "RESIGNED" || formData.status === "TERMINATED") &&
        formData.endDate &&
        formData.joinDate
      ) {
        if (new Date(formData.endDate) < new Date(formData.joinDate)) {
          setServerError("Tanggal terakhir kerja tidak boleh mendahului tanggal mulai bergabung.");
          return false;
        }
      }
    } else if (step === 3) {
      if (employmentTypesList.length > 0 && !formData.employmentTypeId) {
        setServerError("Pilih salah satu tipe ikatan kerja terlebih dahulu.");
        return false;
      }
      if (!formData.contractStartDate) {
        setServerError("Tanggal mulai kontrak wajib diisi.");
        return false;
      }
      if (formData.employmentType === "FIXED_TERM" && !formData.contractEndDate) {
        setServerError("Kontrak PKWT Riset wajib memiliki tanggal berakhir.");
        return false;
      }
    } else if (step === 4) {
      if (mode === "create" && formData.createUserAccount) {
        if (!formData.personalEmail.trim() || !formData.personalEmail.includes("@")) {
          setServerError(
            "Email pribadi pada Langkah 1 wajib diisi untuk pengiriman informasi akun & kata sandi.",
          );
          return false;
        }
      }
    }
    return true;
  };

  const handleQuickCreateEmploymentType = async (e: React.FormEvent) => {
    e.preventDefault();
    setQuickCreateError(null);
    setQuickCreatePending(true);

    try {
      const parsedRate =
        quickCreateForm.wageType === "HOURLY"
          ? Math.max(0, parseFloat(quickCreateForm.defaultHourlyRate) || 0)
          : null;

      const res = await createEmploymentTypeAction({
        code: quickCreateForm.code,
        name: quickCreateForm.name,
        category: quickCreateForm.category,
        wageType: quickCreateForm.wageType,
        defaultHourlyRate: parsedRate,
        description: quickCreateForm.description,
        isActive: true,
      });

      if (!res.ok) {
        setQuickCreateError(res.error);
      } else {
        const newType = {
          id: res.data.id,
          code: res.data.code,
          name: res.data.name,
          category: res.data.category,
          wageType: res.data.wageType,
          defaultHourlyRate: res.data.defaultHourlyRate ? Number(res.data.defaultHourlyRate) : null,
          description: res.data.description,
        };

        setEmploymentTypesList((prev) => [...prev, newType]);
        setFormData((prev) => ({
          ...prev,
          employmentTypeId: newType.id,
          employmentType: newType.category as EmploymentType,
          wageType: newType.wageType,
          hourlyRate:
            newType.wageType === "HOURLY" ? (newType.defaultHourlyRate ?? 30000) : prev.hourlyRate,
        }));

        setIsQuickCreateModalOpen(false);
        setQuickCreateSuccess(
          `Tipe ikatan kerja '${newType.name}' berhasil ditambahkan dan langsung dipilih.`,
        );
        setQuickCreateForm({
          code: "",
          name: "",
          category: "FIXED_TERM",
          wageType: "MONTHLY",
          defaultHourlyRate: "30000",
          description: "",
        });
        setTimeout(() => setQuickCreateSuccess(null), 5000);
      }
    } catch (err: unknown) {
      setQuickCreateError(
        err instanceof Error ? err.message : "Gagal menambahkan tipe ikatan kerja.",
      );
    } finally {
      setQuickCreatePending(false);
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep === 3) {
        setStepCooldown(true);
        setTimeout(() => setStepCooldown(false), 400);
      }
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const handlePrev = () => {
    setServerError(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // Final Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Guard ketat: Submit form hanya dapat diproses pada Langkah 4!
    if (currentStep < 4) {
      handleNext();
      return;
    }
    if (stepCooldown) return;
    if (!validateStep(4)) return;

    setIsSubmitting(true);
    setServerError(null);

    let effectiveContractDocumentKey = formData.contractDocumentKey || undefined;
    if (contractFile) {
      const fileData = new FormData();
      fileData.append("file", contractFile);
      fileData.append("employeeId", mode === "edit" && initialData?.id ? initialData.id : "temp");
      const uploadRes = await uploadContractFileAction(fileData);

      if (!uploadRes.ok) {
        setServerError(uploadRes.error);
        setIsSubmitting(false);
        return;
      }
      effectiveContractDocumentKey = uploadRes.data.documentKey;
    }

    const baseJoinDate = formData.joinDate || toDateString(new Date());
    const baseContractStart = formData.contractStartDate || baseJoinDate;

    if (mode === "create") {
      const payload: CreateEmployeeInput = {
        fullName: formData.fullName.trim(),
        nickname: formData.nickname.trim() || undefined,
        workEmail: formData.workEmail.toLowerCase().trim(),
        personalEmail: formData.personalEmail.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        birthDate: formData.birthDate || undefined,
        birthPlace: formData.birthPlace.trim() || undefined,
        gender: formData.gender as Gender,
        maritalStatus: formData.maritalStatus as MaritalStatus,
        address: formData.address.trim() || undefined,
        emergencyContactName: formData.emergencyContactName.trim() || undefined,
        emergencyContactPhone: formData.emergencyContactPhone.trim() || undefined,
        emergencyContactRelation: formData.emergencyContactRelation.trim() || undefined,
        religion: formData.religion || undefined,
        citizenship: (formData.citizenship as "WNI" | "WNA") || "WNI",
        bloodType: formData.bloodType || undefined,
        motherName: formData.motherName?.trim() || undefined,
        landlinePhone: formData.landlinePhone?.trim() || undefined,
        addressKtp: addressKtp.street?.trim() || addressKtp.city?.trim() ? addressKtp : undefined,
        addressDomicile: addressDomicile.street?.trim() || addressDomicile.city?.trim() ? addressDomicile : undefined,
        employeeNo: formData.employeeNo.trim(),
        currentDepartmentId: formData.currentDepartmentId,
        currentPositionId: formData.currentPositionId,
        managerId: formData.managerId || null,
        joinDate: baseJoinDate,
        status: formData.status as EmployeeStatus,
        workLocationId: formData.workLocationId?.trim() || undefined,
        legalEntityId: formData.legalEntityId?.trim() || undefined,
        probationEndDate: formData.probationEndDate || undefined,
        endDate: formData.endDate || undefined,
        employmentType: formData.employmentType as EmploymentType,
        employmentTypeId: formData.employmentTypeId || undefined,
        wageType: formData.wageType,
        hourlyRate: formData.wageType === "HOURLY" ? Number(formData.hourlyRate) || 0 : undefined,
        contractStartDate: baseContractStart,
        contractEndDate: formData.contractEndDate || undefined,
        baseSalary: formData.wageType === "HOURLY" ? 0 : Number(formData.baseSalary) || 0,
        allowancePosition: Number(formData.allowancePosition) || 0,
        allowanceTransport: Number(formData.allowanceTransport) || 0,
        allowanceCommunication: Number(formData.allowanceCommunication) || 0,
        allowanceOther: Number(formData.allowanceOther) || 0,
        allowanceOtherNote: formData.allowanceOtherNote?.trim() || undefined,
        contractNumber: formData.contractNumber.trim() || undefined,
        contractDocumentKey: effectiveContractDocumentKey,
        contractNotes: formData.contractNotes.trim() || undefined,
        nik: formData.nik.trim() || undefined,
        npwp: formData.npwp.trim() || undefined,
        passportKitas: formData.passportKitas?.trim() || undefined,
        bpjsKesehatanNo: formData.bpjsKesehatanNo?.trim() || undefined,
        bpjsKetenagakerjaanNo: formData.bpjsKetenagakerjaanNo?.trim() || undefined,
        ptkpStatus: formData.ptkpStatus,
        taxMethod: formData.taxMethod,
        bankName: formData.bankName.trim() || undefined,
        bankAccount: formData.bankAccount.trim() || undefined,
        bankAccountName: formData.bankAccountName.trim() || undefined,
        createUserAccount: formData.createUserAccount,
        accountRole: (formData.accountRole || "staff") as
          "staff" | "manager" | "admin_hr" | "admin_it",
        familyMembers: familyMembers
          .filter((fm) => fm.name.trim())
          .map((fm) => ({
            id: fm.id,
            name: fm.name.trim(),
            relation: fm.relation,
            birthDate: fm.birthDate || undefined,
            phone: fm.phone?.trim() || undefined,
            isDependent: fm.isDependent,
            notes: fm.notes?.trim() || undefined,
          })),
        educations: educations
          .filter((edu) => edu.institution.trim())
          .map((edu) => ({
            id: edu.id,
            level: edu.level,
            institution: edu.institution.trim(),
            major: edu.major?.trim() || undefined,
            graduationYear: edu.graduationYear || undefined,
            gpa: edu.gpa || undefined,
          })),
        trainings: trainings
          .filter((tr) => tr.name.trim())
          .map((tr) => ({
            id: tr.id,
            name: tr.name.trim(),
            participationType: tr.participationType?.trim() || undefined,
            startDate: tr.startDate || undefined,
            endDate: tr.endDate || undefined,
            duration: tr.duration?.trim() || undefined,
            location: tr.location?.trim() || undefined,
            organizer: tr.organizer?.trim() || undefined,
          })),
        workExperiences: workExperiences
          .filter((we) => we.companyName.trim() && we.jobTitle.trim() && we.startDate)
          .map((we) => ({
            id: we.id,
            companyName: we.companyName.trim(),
            jobTitle: we.jobTitle.trim(),
            startDate: `${we.startDate!}-01`,
            endDate: we.isCurrent ? undefined : we.endDate ? `${we.endDate}-01` : undefined,
            isCurrent: we.isCurrent,
            reasonForLeaving: we.reasonForLeaving?.trim() || undefined,
            description: we.description?.trim() || undefined,
          })),
      };

      const res = await createEmployeeAction(payload);

      if (res.ok) {
        const newEmployeeId = res.data.id;

        // Upload semua berkas dokumen yang ter-stage secara paralel
        const docsToUpload: Array<{
          category: DocumentCategory;
          title: string;
          file: File;
          educationId?: string;
          trainingId?: string;
        }> = [];
        if (docCv.file) {
          docsToUpload.push({
            category: "CV",
            title: "Curriculum Vitae / Resume",
            file: docCv.file,
          });
        }
        if (docDiploma.file) {
          docsToUpload.push({
            category: "DIPLOMA",
            title: "Ijazah & Transkrip Terakhir",
            file: docDiploma.file,
          });
        }
        if (docFamilyCard.file) {
          docsToUpload.push({
            category: "FAMILY_CARD",
            title: "Kartu Keluarga (KK)",
            file: docFamilyCard.file,
          });
        }
        if (docPreviousEmployerLetter.file) {
          docsToUpload.push({
            category: "PREVIOUS_EMPLOYER_LETTER",
            title: "Surat Pengalaman Kerja / Paklaring",
            file: docPreviousEmployerLetter.file,
          });
        }
        if (docOfferLetter.file) {
          docsToUpload.push({
            category: "OFFER_LETTER",
            title: "Surat Penawaran Kerja (Signed Offer Letter)",
            file: docOfferLetter.file,
          });
        }
        if (docNda.file) {
          docsToUpload.push({
            category: "NDA",
            title: "Non-Disclosure Agreement (NDA) / Pakta Integritas",
            file: docNda.file,
          });
        }
        if (docMarriageCert.file) {
          docsToUpload.push({
            category: "MARRIAGE_CERT",
            title: "Buku Nikah / Akta Perkawinan",
            file: docMarriageCert.file,
          });
        }
        if (docKtp.file) {
          docsToUpload.push({
            category: "KTP",
            title: formData.citizenship === "WNA" ? "Paspor / KITAS WNA" : "Kartu Tanda Penduduk (KTP)",
            file: docKtp.file,
          });
        }
        if (docNpwp.file) {
          docsToUpload.push({
            category: "NPWP",
            title: "Nomor Pokok Wajib Pajak (NPWP)",
            file: docNpwp.file,
          });
        }
        if (docBankBook.file) {
          docsToUpload.push({
            category: "BANK_BOOK",
            title: "Buku Tabungan / Rekening Payroll",
            file: docBankBook.file,
          });
        }
        if (docBpjsKes.file) {
          docsToUpload.push({
            category: "BPJS_KES",
            title: "Kartu BPJS Kesehatan",
            file: docBpjsKes.file,
          });
        }
        if (docBpjsTk.file) {
          docsToUpload.push({
            category: "BPJS_TK",
            title: "Kartu BPJS Ketenagakerjaan",
            file: docBpjsTk.file,
          });
        }
        if (docSkck.file) {
          docsToUpload.push({
            category: "SKCK",
            title: "Surat Keterangan Catatan Kepolisian (SKCK)",
            file: docSkck.file,
          });
        }
        if (docHealthCert.file) {
          docsToUpload.push({
            category: "HEALTH_CERT",
            title: "Surat Keterangan Sehat",
            file: docHealthCert.file,
          });
        }
        for (const addDoc of additionalDocs) {
          if (addDoc.file) {
            docsToUpload.push({
              category: "OTHER",
              title: addDoc.title.trim() || "Dokumen Tambahan",
              file: addDoc.file,
            });
          }
        }

        // Tambahkan berkas dari tabel dinamis Pendidikan (Ijazah)
        for (const edu of educations) {
          if (edu.certificateFile) {
            docsToUpload.push({
              category: "DIPLOMA",
              title: `Ijazah - ${edu.institution}${edu.major ? ` (${edu.major})` : ""}`,
              file: edu.certificateFile,
            });
          }
        }

        // Tambahkan berkas dari tabel dinamis Pelatihan (Sertifikat)
        for (const tr of trainings) {
          if (tr.certificateFile) {
            docsToUpload.push({
              category: "CERTIFICATE",
              title: `Sertifikat - ${tr.name}`,
              file: tr.certificateFile,
            });
          }
        }

        if (docsToUpload.length > 0) {
          const uploadPromises = docsToUpload.map(async (docItem) => {
            const fd = new FormData();
            fd.append("employeeId", newEmployeeId);
            fd.append("category", docItem.category);
            fd.append("title", docItem.title);
            fd.append("file", docItem.file);
            if (docItem.educationId) fd.append("educationId", docItem.educationId);
            if (docItem.trainingId) fd.append("trainingId", docItem.trainingId);
            const uploadRes = await uploadEmployeeDocumentAction(fd);
            return {
              title: docItem.title,
              success: uploadRes.success,
              message: uploadRes.message,
            };
          });

          const uploadResults = await Promise.allSettled(uploadPromises);
          const failedUploads: string[] = [];
          uploadResults.forEach((result, idx) => {
            if (result.status === "rejected") {
              failedUploads.push(docsToUpload[idx]?.title || "Dokumen");
            } else if (!result.value.success) {
              failedUploads.push(result.value.title);
            }
          });

          if (failedUploads.length > 0) {
            setUploadWarningMessage(
              `Pegawai berhasil didaftarkan, namun berkas berikut belum berhasil terunggah: ${failedUploads.join(", ")}. Anda dapat mengunggahnya melalui tab Berkas Pegawai.`
            );
          }
        }

        // Unggah foto profil jika terpasang
        if (profilePhoto.file) {
          try {
            const photoFd = new FormData();
            photoFd.append("file", profilePhoto.file);
            await uploadEmployeePhotoAction(newEmployeeId, photoFd);
          } catch (photoErr) {
            console.error("Gagal mengunggah foto profil:", photoErr);
          }
        }

        setIsSubmitting(false);

        if (res.data.accountCreated && res.data.credentials) {
          setCreatedCredentials({
            id: res.data.id,
            employeeNo: res.data.employeeNo,
            fullName: payload.fullName,
            workEmail: res.data.credentials.workEmail,
            temporaryPassword: res.data.credentials.temporaryPassword,
            roleKey: res.data.credentials.roleKey,
            roleName: res.data.credentials.roleName,
            personalEmail: res.data.credentials.personalEmail,
            emailSent: res.data.credentials.emailSent,
            emailSimulated: res.data.credentials.emailSimulated,
            emailMessage: res.data.credentials.emailMessage,
          });
        } else {
          router.push("/karyawan");
          router.refresh();
        }
      } else {
        setServerError(res.error);
      }
    } else {
      if (!initialData) return;
      const payload: UpdateEmployeeInput = {
        id: initialData.id,
        fullName: formData.fullName.trim(),
        nickname: formData.nickname?.trim() || undefined,
        workEmail: formData.workEmail.trim(),
        personalEmail: formData.personalEmail?.trim() || undefined,
        phone: formData.phone?.trim() || undefined,
        birthDate: formData.birthDate || undefined,
        birthPlace: formData.birthPlace?.trim() || undefined,
        gender: formData.gender as Gender,
        maritalStatus: formData.maritalStatus as MaritalStatus,
        address: formData.address.trim() || undefined,
        emergencyContactName: formData.emergencyContactName?.trim() || undefined,
        emergencyContactPhone: formData.emergencyContactPhone?.trim() || undefined,
        emergencyContactRelation: formData.emergencyContactRelation?.trim() || undefined,
        religion: formData.religion || undefined,
        citizenship: (formData.citizenship as "WNI" | "WNA") || "WNI",
        bloodType: formData.bloodType || undefined,
        motherName: formData.motherName?.trim() || undefined,
        landlinePhone: formData.landlinePhone?.trim() || undefined,
        addressKtp: addressKtp.street?.trim() || addressKtp.city?.trim() ? addressKtp : undefined,
        addressDomicile: addressDomicile.street?.trim() || addressDomicile.city?.trim() ? addressDomicile : undefined,
        employeeNo: formData.employeeNo.trim(),
        currentDepartmentId: formData.currentDepartmentId,
        currentPositionId: formData.currentPositionId,
        managerId: formData.managerId || null,
        joinDate: baseJoinDate,
        status: formData.status as EmployeeStatus,
        workLocationId: formData.workLocationId?.trim() || undefined,
        legalEntityId: formData.legalEntityId?.trim() || undefined,
        probationEndDate: formData.probationEndDate || undefined,
        endDate: formData.endDate || undefined,
        employmentType: formData.employmentType as EmploymentType,
        employmentTypeId: formData.employmentTypeId || undefined,
        wageType: formData.wageType,
        hourlyRate: formData.wageType === "HOURLY" ? Number(formData.hourlyRate) || 0 : undefined,
        contractStartDate: baseContractStart,
        contractEndDate: formData.contractEndDate || undefined,
        baseSalary: formData.wageType === "HOURLY" ? 0 : Number(formData.baseSalary) || 0,
        allowancePosition: Number(formData.allowancePosition) || 0,
        allowanceTransport: Number(formData.allowanceTransport) || 0,
        allowanceCommunication: Number(formData.allowanceCommunication) || 0,
        allowanceOther: Number(formData.allowanceOther) || 0,
        allowanceOtherNote: formData.allowanceOtherNote?.trim() || undefined,
        contractNumber: formData.contractNumber.trim() || undefined,
        contractDocumentKey: effectiveContractDocumentKey,
        contractNotes: formData.contractNotes?.trim() || undefined,
        nik: formData.nik.trim() || undefined,
        npwp: formData.npwp.trim() || undefined,
        passportKitas: formData.passportKitas?.trim() || undefined,
        bpjsKesehatanNo: formData.bpjsKesehatanNo?.trim() || undefined,
        bpjsKetenagakerjaanNo: formData.bpjsKetenagakerjaanNo?.trim() || undefined,
        ptkpStatus: formData.ptkpStatus,
        taxMethod: formData.taxMethod,
        bankName: formData.bankName.trim() || undefined,
        bankAccount: formData.bankAccount.trim() || undefined,
        bankAccountName: formData.bankAccountName?.trim() || undefined,
        createUserAccount: formData.createUserAccount,
        accountRole: (formData.accountRole || "staff") as
          "staff" | "manager" | "admin_hr" | "admin_it",
        familyMembers: familyMembers
          .filter((fm) => fm.name.trim())
          .map((fm) => ({
            id: fm.id,
            name: fm.name.trim(),
            relation: fm.relation,
            birthDate: fm.birthDate || undefined,
            phone: fm.phone?.trim() || undefined,
            isDependent: fm.isDependent,
            notes: fm.notes?.trim() || undefined,
          })),
        educations: educations
          .filter((edu) => edu.institution.trim())
          .map((edu) => ({
            id: edu.id,
            level: edu.level,
            institution: edu.institution.trim(),
            major: edu.major?.trim() || undefined,
            graduationYear: edu.graduationYear || undefined,
            gpa: edu.gpa || undefined,
          })),
        trainings: trainings
          .filter((tr) => tr.name.trim())
          .map((tr) => ({
            id: tr.id,
            name: tr.name.trim(),
            participationType: tr.participationType?.trim() || undefined,
            startDate: tr.startDate || undefined,
            endDate: tr.endDate || undefined,
            duration: tr.duration?.trim() || undefined,
            location: tr.location?.trim() || undefined,
            organizer: tr.organizer?.trim() || undefined,
          })),
        workExperiences: workExperiences
          .filter((we) => we.companyName.trim() && we.jobTitle.trim() && we.startDate)
          .map((we) => ({
            id: we.id,
            companyName: we.companyName.trim(),
            jobTitle: we.jobTitle.trim(),
            startDate: `${we.startDate!}-01`,
            endDate: we.isCurrent ? undefined : we.endDate ? `${we.endDate}-01` : undefined,
            isCurrent: we.isCurrent,
            reasonForLeaving: we.reasonForLeaving?.trim() || undefined,
            description: we.description?.trim() || undefined,
          })),
      };

      const res = await updateEmployeeAction(payload);

      if (res.ok) {
        // Upload dokumen baru jika ada yang dipilih saat edit
        const docsToUpload: Array<{
          category: DocumentCategory;
          title: string;
          file: File;
          educationId?: string;
          trainingId?: string;
        }> = [];
        if (docCv.file) {
          docsToUpload.push({
            category: "CV",
            title: "Curriculum Vitae / Resume",
            file: docCv.file,
          });
        }
        if (docDiploma.file) {
          docsToUpload.push({
            category: "DIPLOMA",
            title: "Ijazah & Transkrip Terakhir",
            file: docDiploma.file,
          });
        }
        if (docFamilyCard.file) {
          docsToUpload.push({
            category: "FAMILY_CARD",
            title: "Kartu Keluarga (KK)",
            file: docFamilyCard.file,
          });
        }
        if (docPreviousEmployerLetter.file) {
          docsToUpload.push({
            category: "PREVIOUS_EMPLOYER_LETTER",
            title: "Surat Pengalaman Kerja / Paklaring",
            file: docPreviousEmployerLetter.file,
          });
        }
        if (docOfferLetter.file) {
          docsToUpload.push({
            category: "OFFER_LETTER",
            title: "Surat Penawaran Kerja (Signed Offer Letter)",
            file: docOfferLetter.file,
          });
        }
        if (docNda.file) {
          docsToUpload.push({
            category: "NDA",
            title: "Non-Disclosure Agreement (NDA) / Pakta Integritas",
            file: docNda.file,
          });
        }
        if (docMarriageCert.file) {
          docsToUpload.push({
            category: "MARRIAGE_CERT",
            title: "Buku Nikah / Akta Perkawinan",
            file: docMarriageCert.file,
          });
        }
        if (docKtp.file) {
          docsToUpload.push({
            category: "KTP",
            title: formData.citizenship === "WNA" ? "Paspor / KITAS WNA" : "Kartu Tanda Penduduk (KTP)",
            file: docKtp.file,
          });
        }
        if (docNpwp.file) {
          docsToUpload.push({
            category: "NPWP",
            title: "Nomor Pokok Wajib Pajak (NPWP)",
            file: docNpwp.file,
          });
        }
        if (docBankBook.file) {
          docsToUpload.push({
            category: "BANK_BOOK",
            title: "Buku Tabungan / Rekening Payroll",
            file: docBankBook.file,
          });
        }
        if (docBpjsKes.file) {
          docsToUpload.push({
            category: "BPJS_KES",
            title: "Kartu BPJS Kesehatan",
            file: docBpjsKes.file,
          });
        }
        if (docBpjsTk.file) {
          docsToUpload.push({
            category: "BPJS_TK",
            title: "Kartu BPJS Ketenagakerjaan",
            file: docBpjsTk.file,
          });
        }
        if (docSkck.file) {
          docsToUpload.push({
            category: "SKCK",
            title: "Surat Keterangan Catatan Kepolisian (SKCK)",
            file: docSkck.file,
          });
        }
        if (docHealthCert.file) {
          docsToUpload.push({
            category: "HEALTH_CERT",
            title: "Surat Keterangan Sehat",
            file: docHealthCert.file,
          });
        }
        for (const addDoc of additionalDocs) {
          if (addDoc.file) {
            docsToUpload.push({
              category: "OTHER",
              title: addDoc.title.trim() || "Dokumen Tambahan",
              file: addDoc.file,
            });
          }
        }

        // Tambahkan berkas dari tabel dinamis Pendidikan (Ijazah)
        for (const edu of educations) {
          if (edu.certificateFile) {
            docsToUpload.push({
              category: "DIPLOMA",
              title: `Ijazah - ${edu.institution}${edu.major ? ` (${edu.major})` : ""}`,
              file: edu.certificateFile,
              educationId: edu.id,
            });
          }
        }

        // Tambahkan berkas dari tabel dinamis Pelatihan (Sertifikat)
        for (const tr of trainings) {
          if (tr.certificateFile) {
            docsToUpload.push({
              category: "CERTIFICATE",
              title: `Sertifikat - ${tr.name}`,
              file: tr.certificateFile,
              trainingId: tr.id,
            });
          }
        }

        if (docsToUpload.length > 0) {
          await Promise.allSettled(
            docsToUpload.map((d) => {
              const fd = new FormData();
              fd.append("employeeId", initialData.id);
              fd.append("category", d.category);
              fd.append("title", d.title);
              fd.append("file", d.file);
              if (d.educationId) fd.append("educationId", d.educationId);
              if (d.trainingId) fd.append("trainingId", d.trainingId);
              return uploadEmployeeDocumentAction(fd);
            }),
          );
        }

        // Unggah foto profil baru jika dipilih saat edit
        if (profilePhoto.file) {
          try {
            const photoFd = new FormData();
            photoFd.append("file", profilePhoto.file);
            await uploadEmployeePhotoAction(initialData.id, photoFd);
          } catch (photoErr) {
            console.error("Gagal mengunggah foto profil:", photoErr);
          }
        }

        setIsSubmitting(false);
        router.push(`/karyawan/${initialData.id}`);
        router.refresh();
      } else {
        setServerError(res.error);
      }
    }
  };

  const defaultRoles: RoleOption[] = [
    {
      id: "1",
      key: "staff",
      name: "Karyawan (Staff)",
      description: "Akses mandiri (self-service) data pribadi, presensi, cuti, slip gaji",
    },
    {
      id: "2",
      key: "manager",
      name: "Manajer / Atasan",
      description: "Persetujuan cuti tim, melihat kinerja & presensi bawahan langsung",
    },
    {
      id: "3",
      key: "admin_hr",
      name: "Admin HR",
      description: "Pengelolaan penuh modul HRIS (karyawan, absensi, cuti, payroll)",
    },
    {
      id: "4",
      key: "admin_it",
      name: "Admin IT",
      description: "Pengelolaan user, inventaris aset, lisensi, dokumen & audit log",
    },
  ];
  const allRoles = roles && roles.length > 0 ? roles : defaultRoles;
  const availableRoles = isSuperAdmin
    ? allRoles
    : allRoles.filter((r) => r.key === "staff" || r.key === "manager");

  const steps = [
    { num: 1, title: "Identitas Pribadi", icon: User },
    { num: 2, title: "Penempatan Kerja", icon: Briefcase },
    { num: 3, title: "Kontrak & Kompensasi", icon: FileText },
    { num: 4, title: "Perbankan & Akun", icon: Shield },
  ];

  return (
    <div className="w-full min-w-0 max-w-full bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
      {/* Stepper Header */}
      <div className="bg-slate-50/70 border-b border-slate-200 p-3 sm:p-5 w-full min-w-0">
        <div className="w-full min-w-0 grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
          {steps.map((s) => {
            const Icon = s.icon;
            const isDone = currentStep > s.num;
            const isCurrent = currentStep === s.num;

            return (
              <div
                key={s.num}
                onClick={() => {
                  if (s.num < currentStep) setCurrentStep(s.num);
                }}
                className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-2.5 rounded-lg border transition-all min-w-0 ${
                  isCurrent
                    ? "bg-white border-[#102E50] shadow-xs"
                    : isDone
                      ? "bg-emerald-50/50 border-emerald-200 cursor-pointer hover:bg-emerald-50"
                      : "bg-slate-100/50 border-slate-200 opacity-60"
                }`}
              >
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-[11px] sm:text-xs shrink-0 ${
                    isCurrent
                      ? "bg-[#102E50] text-white"
                      : isDone
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {isDone ? <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : s.num}
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                    Langkah {s.num}
                  </span>
                  <span
                    className={`text-[11px] sm:text-xs font-semibold truncate flex items-center gap-1 sm:gap-1.5 ${
                      isCurrent ? "text-[#102E50]" : "text-slate-700"
                    }`}
                  >
                    <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                    <span className="truncate">{s.title}</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Form Content Body */}
      <form
        onSubmit={handleSubmit}
        onKeyDown={(e) => {
          if (e.key === "Enter" && e.target instanceof HTMLInputElement) {
            e.preventDefault();
            if (currentStep < 4) {
              handleNext();
            }
          }
        }}
        className="w-full min-w-0 max-w-full p-3.5 sm:p-6 flex flex-col gap-5 sm:gap-6"
      >
        {serverError && (
          <div className="p-3 bg-red-50 border border-red-200 text-[#A8281C] text-sm rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        {/* STEP 1: IDENTITAS PRIBADI */}
        {currentStep === 1 && (
          <div className="w-full min-w-0 flex flex-col gap-5 animate-in fade-in duration-200">
            {/* Header Pengantar */}
            <div className="pb-2 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-base text-[#102E50] font-heading">
                  Identitas Pribadi & Kontak Pegawai
                </h3>
                <p className="text-xs text-slate-500">
                  Data diri lengkap, informasi kontak, alamat domisili, dan berkas identitas resmi
                </p>
              </div>
              <div className="text-[11px] text-slate-500 bg-slate-100/80 px-2.5 py-1 rounded-md border border-slate-200/80 w-fit">
                Tanda <span className="text-[#A8281C] font-bold">*</span> wajib diisi
              </div>
            </div>

            {/* SEKSI 1.1: DATA DIRI */}
            <FormSection
              id="seksi-data-diri"
              title="1.1 Data Diri Pegawai"
              subtitle="Foto profil, nama lengkap, tempat tanggal lahir, agama, dan status kependudukan"
              icon={User}
              badge={
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100/70 text-[#102E50] border border-blue-200/60">
                  Data Pokok
                </span>
              }
              defaultOpen={true}
            >
              <div className="flex flex-col gap-5 w-full min-w-0">
                {/* Komponen Upload Foto Profil */}
                <div className="w-full min-w-0 p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 flex flex-col sm:flex-row items-center sm:items-start gap-4">
                  <div className="relative group shrink-0">
                    <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-slate-300 bg-white overflow-hidden flex items-center justify-center shadow-2xs">
                      {profilePhotoPreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={profilePhotoPreview}
                          alt="Foto Profil"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-slate-400">
                          <User className="w-8 h-8 stroke-[1.5]" />
                          <span className="text-[9px] font-semibold mt-0.5">Tanpa Foto</span>
                        </div>
                      )}
                    </div>
                    {profilePhoto.file && (
                      <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-xs">
                        <Check className="w-3 h-3 stroke-[2.5]" />
                      </span>
                    )}
                  </div>

                  <div className="flex-1 text-center sm:text-left flex flex-col justify-center">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Foto Profil Pegawai
                      </h4>
                      <span className="text-[10px] text-slate-500 bg-slate-200/60 px-1.5 py-0.5 rounded">
                        Opsional
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
                      Gunakan foto formal/semi-formal berlatar belakang polos. Format JPG, PNG, atau WEBP maks 2 MB.
                    </p>

                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-[#102E50] text-xs font-semibold shadow-2xs transition-all active:scale-95">
                        <Camera className="w-3.5 h-3.5 text-[#102E50]" />
                        <span>{profilePhoto.file || profilePhotoPreview ? "Ganti Foto" : "Pilih Foto"}</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleProfilePhotoChange}
                          className="hidden"
                        />
                      </label>
                      {(profilePhoto.file || profilePhotoPreview) && (
                        <button
                          type="button"
                          onClick={handleRemoveProfilePhoto}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-xs font-semibold transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus</span>
                        </button>
                      )}
                      {profilePhoto.status === "error" && (
                        <span className="text-[11px] text-red-600 font-medium">
                          {profilePhoto.error}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Grid Input Data Diri */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Nama Lengkap & Gelar <span className="text-[#A8281C]">*</span>
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="Contoh: Dr. Budi Rahardjo, M.Ed."
                      required
                      className="w-full px-3 py-2 text-sm bg-slate-50/70 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#102E50]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Nama Panggilan
                    </label>
                    <input
                      type="text"
                      name="nickname"
                      value={formData.nickname}
                      onChange={handleChange}
                      placeholder="Contoh: Budi"
                      className="w-full px-3 py-2 text-sm bg-slate-50/70 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#102E50]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Jenis Kelamin
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-sm bg-slate-50/70 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#102E50]"
                    >
                      <option value="MALE">Laki-laki</option>
                      <option value="FEMALE">Perempuan</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Tempat Lahir
                    </label>
                    <input
                      type="text"
                      name="birthPlace"
                      value={formData.birthPlace}
                      onChange={handleChange}
                      placeholder="Kota kelahiran (contoh: Jakarta)"
                      className="w-full px-3 py-2 text-sm bg-slate-50/70 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#102E50]"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-slate-700">
                        Tanggal Lahir
                      </label>
                      {formData.birthDate && calculateAge(formData.birthDate) && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 bg-blue-50 text-[#102E50] border border-blue-200/80 rounded-md">
                          Usia: {calculateAge(formData.birthDate)}
                        </span>
                      )}
                    </div>
                    <input
                      type="date"
                      name="birthDate"
                      value={formData.birthDate}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-sm bg-slate-50/70 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#102E50]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Agama
                    </label>
                    <select
                      name="religion"
                      value={formData.religion}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-sm bg-slate-50/70 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#102E50]"
                    >
                      <option value="">-- Pilih Agama --</option>
                      <option value="ISLAM">Islam</option>
                      <option value="CHRISTIAN">Kristen (Protestan)</option>
                      <option value="CATHOLIC">Katolik</option>
                      <option value="HINDU">Hindu</option>
                      <option value="BUDDHIST">Buddha</option>
                      <option value="CONFUCIAN">Konghucu</option>
                      <option value="OTHER">Lainnya</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Kewarganegaraan
                    </label>
                    <div className="flex items-center gap-4 px-3 py-2 bg-slate-50/70 border border-slate-200 rounded-lg h-[38px]">
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-slate-800">
                        <input
                          type="radio"
                          name="citizenship"
                          value="WNI"
                          checked={formData.citizenship === "WNI"}
                          onChange={() => setFormData((prev) => ({ ...prev, citizenship: "WNI" }))}
                          className="text-[#102E50] focus:ring-[#102E50]"
                        />
                        <span>WNI (Indonesia)</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-slate-800">
                        <input
                          type="radio"
                          name="citizenship"
                          value="WNA"
                          checked={formData.citizenship === "WNA"}
                          onChange={() => setFormData((prev) => ({ ...prev, citizenship: "WNA" }))}
                          className="text-[#102E50] focus:ring-[#102E50]"
                        />
                        <span>WNA (Asing)</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Golongan Darah
                    </label>
                    <select
                      name="bloodType"
                      value={formData.bloodType}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-sm bg-slate-50/70 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#102E50]"
                    >
                      <option value="">-- Pilih Golongan Darah --</option>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="AB">AB</option>
                      <option value="O">O</option>
                      <option value="UNKNOWN">Tidak Tahu</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Status Pernikahan
                    </label>
                    <select
                      name="maritalStatus"
                      value={formData.maritalStatus}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-sm bg-slate-50/70 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#102E50]"
                    >
                      <option value="SINGLE">Belum Menikah</option>
                      <option value="MARRIED">Menikah</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Nama Ibu Kandung
                    </label>
                    <input
                      type="text"
                      name="motherName"
                      value={formData.motherName}
                      onChange={handleChange}
                      placeholder="Nama lengkap ibu kandung"
                      className="w-full px-3 py-2 text-sm bg-slate-50/70 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#102E50]"
                    />
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      Dibutuhkan untuk verifikasi pendaftaran BPJS Ketenagakerjaan & perbankan.
                    </span>
                  </div>
                </div>
              </div>
            </FormSection>

            {/* SEKSI 1.2: KONTAK */}
            <FormSection
              id="seksi-kontak"
              title="1.2 Informasi Kontak"
              subtitle="Email resmi PSPK, email pribadi untuk akses akun, nomor WhatsApp, dan telepon"
              icon={PhoneCall}
              badge={
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100/70 text-[#102E50] border border-blue-200/60">
                  Wajib Inti
                </span>
              }
              defaultOpen={true}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Email Kantor (PSPK) <span className="text-[#A8281C]">*</span>
                  </label>
                  <input
                    type="email"
                    name="workEmail"
                    value={formData.workEmail}
                    onChange={handleChange}
                    placeholder="nama@pspk.id"
                    required
                    className="w-full px-3 py-2 text-sm bg-slate-50/70 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#102E50]"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Wajib berakhiran <strong className="text-slate-600">@pspk.id</strong> (digunakan untuk login akun pegawai).
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Email Pribadi{" "}
                    {formData.createUserAccount && (
                      <span className="text-[#A8281C]">* (Wajib untuk Akun)</span>
                    )}
                  </label>
                  <input
                    type="email"
                    name="personalEmail"
                    value={formData.personalEmail}
                    onChange={handleChange}
                    placeholder="nama.pribadi@gmail.com"
                    required={formData.createUserAccount}
                    className="w-full px-3 py-2 text-sm bg-slate-50/70 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#102E50]"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Kredensial login & kata sandi sementara akan otomatis dikirimkan ke email ini.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Nomor HP / WhatsApp
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Contoh: 08123456789 atau +628123456789"
                    className="w-full px-3 py-2 text-sm bg-slate-50/70 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#102E50]"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Format angka 9-15 digit untuk keperluan koordinasi via WhatsApp.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Nomor Telepon Rumah / Lainnya
                  </label>
                  <input
                    type="text"
                    name="landlinePhone"
                    value={formData.landlinePhone}
                    onChange={handleChange}
                    placeholder="Contoh: 021-1234567 (opsional)"
                    className="w-full px-3 py-2 text-sm bg-slate-50/70 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#102E50]"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Nomor telepon rumah tetap atau nomor alternatif jika ada.
                  </span>
                </div>
              </div>
            </FormSection>

            {/* SEKSI 1.3: ALAMAT KEPENDUDUKAN & DOMISILI */}
            <FormSection
              id="seksi-alamat"
              title="1.3 Alamat KTP & Alamat Domisili"
              subtitle="Alamat terdaftar sesuai KTP dan alamat tempat tinggal saat ini"
              icon={Home}
              defaultOpen={true}
            >
              <div className="flex flex-col gap-4">
                {/* Alamat KTP */}
                <AddressFields
                  title="Alamat Sesuai KTP"
                  description="Alamat tempat tinggal resmi yang tercantum pada Kartu Tanda Penduduk"
                  value={addressKtp}
                  onChange={handleAddressKtpChange}
                />

                {/* Alamat Domisili dengan opsi sync */}
                <AddressFields
                  title="Alamat Domisili Saat Ini"
                  description="Alamat tempat tinggal saat ini jika berbeda dengan alamat KTP"
                  value={addressDomicile}
                  onChange={(newDom) => setAddressDomicile(newDom)}
                  syncOption={{
                    checked: isDomicileSameAsKtp,
                    onChange: handleToggleSameAddress,
                    label: "Sama dengan alamat KTP",
                  }}
                />
              </div>
            </FormSection>

            {/* SEKSI 1.4: KONTAK DARURAT */}
            <FormSection
              id="seksi-kontak-darurat"
              title="1.4 Kontak Darurat"
              subtitle="Pihak keluarga atau kerabat terdekat yang dapat dihubungi saat keadaan mendesak"
              icon={HeartHandshake}
              defaultOpen={true}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Nama Kontak Darurat
                  </label>
                  <input
                    type="text"
                    name="emergencyContactName"
                    value={formData.emergencyContactName}
                    onChange={handleChange}
                    placeholder="Nama anggota keluarga / kerabat"
                    className="w-full px-3 py-2 text-sm bg-slate-50/70 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#102E50]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    No. HP Kontak Darurat
                  </label>
                  <input
                    type="text"
                    name="emergencyContactPhone"
                    value={formData.emergencyContactPhone}
                    onChange={handleChange}
                    placeholder="+628123456789"
                    className="w-full px-3 py-2 text-sm bg-slate-50/70 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#102E50]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Hubungan dengan Pegawai
                  </label>
                  <select
                    name="emergencyContactRelation"
                    value={formData.emergencyContactRelation}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm bg-slate-50/70 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#102E50]"
                  >
                    <option value="">-- Pilih Hubungan --</option>
                    <option value="Ayah">Ayah</option>
                    <option value="Ibu">Ibu</option>
                    <option value="Suami/Istri">Suami / Istri</option>
                    <option value="Anak">Anak</option>
                    <option value="Saudara">Saudara Kandung</option>
                    <option value="Lainnya">Kerabat / Lainnya</option>
                  </select>
                </div>
              </div>
            </FormSection>

            {/* SEKSI 1.5: DATA KELUARGA */}
            <FormSection
              id="seksi-data-keluarga"
              title="1.5 Data Keluarga"
              subtitle="Anggota keluarga dan tanggungan pegawai (opsional)"
              icon={Users}
              badge={
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  Opsional
                </span>
              }
              defaultOpen={false}
            >
              <DynamicTable<FamilyMemberItem>
                title="Daftar Anggota Keluarga"
                items={familyMembers}
                onAdd={() =>
                  setFamilyMembers((prev) => [
                    ...prev,
                    {
                      name: "",
                      relation: "SPOUSE" as FamilyRelation,
                      birthDate: "",
                      phone: "",
                      isDependent: false,
                      notes: "",
                    },
                  ])
                }
                onRemove={(idx) =>
                  setFamilyMembers((prev) => prev.filter((_, i) => i !== idx))
                }
                addButtonLabel="Tambah Anggota Keluarga"
                emptyMessage="Belum ada data keluarga. Klik tombol di bawah untuk menambahkan."
                tableMinWidth="min-w-[860px]"
                columns={[
                  { key: "name", label: "Nama", width: "24%", minWidth: "160px" },
                  { key: "relation", label: "Hubungan", width: "18%", minWidth: "135px" },
                  { key: "birthDate", label: "Tanggal Lahir", width: "18%", minWidth: "140px" },
                  { key: "phone", label: "No. HP", width: "16%", minWidth: "130px" },
                  { key: "isDependent", label: "Tanggungan", width: "10%", minWidth: "90px" },
                  { key: "notes", label: "Keterangan", width: "14%", minWidth: "130px" },
                ]}
                renderDesktopRow={(item, idx) => (
                  <>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) =>
                          setFamilyMembers((prev) =>
                            prev.map((x, i) => (i === idx ? { ...x, name: e.target.value } : x))
                          )
                        }
                        placeholder="Nama lengkap"
                        className="w-full px-2 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-[#102E50]"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={item.relation}
                        onChange={(e) =>
                          setFamilyMembers((prev) =>
                            prev.map((x, i) =>
                              i === idx ? { ...x, relation: e.target.value as FamilyRelation } : x
                            )
                          )
                        }
                        className="w-full px-2 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-[#102E50]"
                      >
                        <option value="FATHER">Ayah</option>
                        <option value="MOTHER">Ibu</option>
                        <option value="SPOUSE">Suami / Istri</option>
                        <option value="CHILD">Anak</option>
                        <option value="SIBLING">Saudara Kandung</option>
                        <option value="OTHER">Lainnya</option>
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-col gap-0.5">
                        <input
                          type="date"
                          value={item.birthDate ?? ""}
                          onChange={(e) =>
                            setFamilyMembers((prev) =>
                              prev.map((x, i) =>
                                i === idx ? { ...x, birthDate: e.target.value } : x
                              )
                            )
                          }
                          className="w-full px-2 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-[#102E50]"
                        />
                        {item.birthDate && calculateAge(item.birthDate) && (
                          <span className="text-[10px] text-slate-500">
                            {calculateAge(item.birthDate)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="tel"
                        value={item.phone ?? ""}
                        onChange={(e) =>
                          setFamilyMembers((prev) =>
                            prev.map((x, i) => (i === idx ? { ...x, phone: e.target.value } : x))
                          )
                        }
                        placeholder="08xx"
                        className="w-full px-2 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-[#102E50]"
                      />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={item.isDependent}
                        onChange={(e) =>
                          setFamilyMembers((prev) =>
                            prev.map((x, i) =>
                              i === idx ? { ...x, isDependent: e.target.checked } : x
                            )
                          )
                        }
                        className="h-4 w-4 rounded border-slate-300 text-[#102E50] focus:ring-[#102E50]"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={item.notes ?? ""}
                        onChange={(e) =>
                          setFamilyMembers((prev) =>
                            prev.map((x, i) => (i === idx ? { ...x, notes: e.target.value } : x))
                          )
                        }
                        placeholder="Catatan (opsional)"
                        className="w-full px-2 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-[#102E50]"
                      />
                    </td>
                  </>
                )}
                renderMobileCard={(item, idx) => (
                  <div className="space-y-2.5 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="col-span-1 sm:col-span-2">
                        <label className="text-xs font-semibold text-slate-700">Nama Lengkap</label>
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) =>
                            setFamilyMembers((prev) =>
                              prev.map((x, i) => (i === idx ? { ...x, name: e.target.value } : x))
                            )
                          }
                          placeholder="Nama lengkap anggota keluarga"
                          className="w-full mt-1 px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#102E50]"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-700">Hubungan Keluarga</label>
                        <select
                          value={item.relation}
                          onChange={(e) =>
                            setFamilyMembers((prev) =>
                              prev.map((x, i) =>
                                i === idx ? { ...x, relation: e.target.value as FamilyRelation } : x
                              )
                            )
                          }
                          className="w-full mt-1 px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#102E50]"
                        >
                          <option value="FATHER">Ayah</option>
                          <option value="MOTHER">Ibu</option>
                          <option value="SPOUSE">Suami / Istri</option>
                          <option value="CHILD">Anak</option>
                          <option value="SIBLING">Saudara Kandung</option>
                          <option value="OTHER">Lainnya</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-700">Tanggal Lahir</label>
                        <input
                          type="date"
                          value={item.birthDate ?? ""}
                          onChange={(e) =>
                            setFamilyMembers((prev) =>
                              prev.map((x, i) =>
                                i === idx ? { ...x, birthDate: e.target.value } : x
                              )
                            )
                          }
                          className="w-full mt-1 px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#102E50]"
                        />
                        {item.birthDate && calculateAge(item.birthDate) && (
                          <span className="text-[10px] text-slate-500 block mt-1">
                            Usia: {calculateAge(item.birthDate)}
                          </span>
                        )}
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-700">No. WhatsApp / HP</label>
                        <input
                          type="tel"
                          value={item.phone ?? ""}
                          onChange={(e) =>
                            setFamilyMembers((prev) =>
                              prev.map((x, i) => (i === idx ? { ...x, phone: e.target.value } : x))
                            )
                          }
                          placeholder="08xxxxxxxxxx"
                          className="w-full mt-1 px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#102E50]"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-700">Catatan (Opsional)</label>
                        <input
                          type="text"
                          value={item.notes ?? ""}
                          onChange={(e) =>
                            setFamilyMembers((prev) =>
                              prev.map((x, i) => (i === idx ? { ...x, notes: e.target.value } : x))
                            )
                          }
                          placeholder="Catatan tambahan"
                          className="w-full mt-1 px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#102E50]"
                        />
                      </div>
                    </div>
                    <label className="flex items-center gap-2 text-xs text-slate-700 pt-1 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={item.isDependent}
                        onChange={(e) =>
                          setFamilyMembers((prev) =>
                            prev.map((x, i) =>
                              i === idx ? { ...x, isDependent: e.target.checked } : x
                            )
                          )
                        }
                        className="rounded border-slate-300 text-[#102E50] focus:ring-[#102E50] w-4 h-4 cursor-pointer"
                      />
                      <span className="font-medium">Tanggungan resmi (diperhitungkan dalam tunjangan / PTKP)</span>
                    </label>
                  </div>
                )}
              />
            </FormSection>

            {/* SEKSI 1.6: RIWAYAT PENDIDIKAN */}
            <FormSection
              id="seksi-pendidikan"
              title="1.6 Riwayat Pendidikan"
              subtitle="Riwayat pendidikan formal (opsional, dapat disusulkan)"
              icon={GraduationCap}
              badge={
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  Opsional
                </span>
              }
              defaultOpen={false}
            >
              <DynamicTable<EducationItem>
                title="Daftar Riwayat Pendidikan"
                items={educations}
                onAdd={() =>
                  setEducations((prev) => [
                    ...prev,
                    {
                      level: "S1" as EducationLevel,
                      institution: "",
                      major: "",
                      graduationYear: null,
                      gpa: "",
                      certificateFile: null,
                      certificateFileName: null,
                      certificateDocKey: null,
                    },
                  ])
                }
                onRemove={(idx) =>
                  setEducations((prev) => prev.filter((_, i) => i !== idx))
                }
                addButtonLabel="Tambah Riwayat Pendidikan"
                emptyMessage="Belum ada riwayat pendidikan. Klik tombol di bawah untuk menambahkan."
                tableMinWidth="min-w-[880px]"
                columns={[
                  { key: "level", label: "Jenjang", width: "15%", minWidth: "120px" },
                  { key: "institution", label: "Institusi / Kampus", width: "23%", minWidth: "180px" },
                  { key: "major", label: "Jurusan / Prodi", width: "20%", minWidth: "160px" },
                  { key: "graduationYear", label: "Lulus", width: "10%", minWidth: "95px" },
                  { key: "gpa", label: "IPK / Nilai", width: "10%", minWidth: "95px" },
                  { key: "certificateFile", label: "Ijazah", width: "22%", minWidth: "140px" },
                ]}
                renderDesktopRow={(item, idx) => (
                  <>
                    <td className="px-3 py-2">
                      <select
                        value={item.level}
                        onChange={(e) =>
                          setEducations((prev) =>
                            prev.map((x, i) =>
                              i === idx ? { ...x, level: e.target.value as EducationLevel } : x
                            )
                          )
                        }
                        className="w-full px-2 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-[#102E50]"
                      >
                        <option value="SD">SD</option>
                        <option value="SMP">SMP</option>
                        <option value="SMA_SMK">SMA/SMK</option>
                        <option value="D3">D3</option>
                        <option value="D4">D4</option>
                        <option value="S1">S1</option>
                        <option value="S2">S2</option>
                        <option value="S3">S3</option>
                        <option value="OTHER">Lainnya</option>
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={item.institution}
                        onChange={(e) =>
                          setEducations((prev) =>
                            prev.map((x, i) =>
                              i === idx ? { ...x, institution: e.target.value } : x
                            )
                          )
                        }
                        placeholder="Nama kampus / sekolah"
                        className="w-full px-2 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-[#102E50]"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={item.major ?? ""}
                        onChange={(e) =>
                          setEducations((prev) =>
                            prev.map((x, i) =>
                              i === idx ? { ...x, major: e.target.value } : x
                            )
                          )
                        }
                        placeholder="Jurusan / prodi"
                        className="w-full px-2 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-[#102E50]"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min="1950"
                        max={new Date().getFullYear()}
                        value={item.graduationYear ?? ""}
                        onChange={(e) =>
                          setEducations((prev) =>
                            prev.map((x, i) =>
                              i === idx
                                ? { ...x, graduationYear: e.target.value ? Number(e.target.value) : null }
                                : x
                            )
                          )
                        }
                        placeholder="2020"
                        className="w-full px-2 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-[#102E50]"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={item.gpa ?? ""}
                        onChange={(e) =>
                          setEducations((prev) =>
                            prev.map((x, i) =>
                              i === idx ? { ...x, gpa: e.target.value } : x
                            )
                          )
                        }
                        placeholder="3.75"
                        className="w-full px-2 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-[#102E50]"
                      />
                    </td>
                    <td className="px-3 py-2">
                      {item.certificateFileName ? (
                        <div className="flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-1 rounded">
                          <FileCheck className="h-3.5 w-3.5 flex-shrink-0" />
                          <span className="truncate max-w-[120px]">{item.certificateFileName}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setEducations((prev) =>
                                prev.map((x, i) =>
                                  i === idx
                                    ? { ...x, certificateFile: null, certificateFileName: null }
                                    : x
                                )
                              )
                            }
                            className="ml-auto text-red-500 hover:text-red-700 flex-shrink-0"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-500 hover:text-[#102E50] transition-colors">
                          <UploadCloud className="h-3.5 w-3.5" />
                          <span>Unggah ijazah</span>
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="sr-only"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f)
                                setEducations((prev) =>
                                  prev.map((x, i) =>
                                    i === idx
                                      ? { ...x, certificateFile: f, certificateFileName: f.name }
                                      : x
                                  )
                                );
                            }}
                          />
                        </label>
                      )}
                    </td>
                  </>
                )}
                renderMobileCard={(item, idx) => (
                  <div className="space-y-2.5 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-xs font-semibold text-slate-700">Jenjang</label>
                        <select
                          value={item.level}
                          onChange={(e) =>
                            setEducations((prev) =>
                              prev.map((x, i) =>
                                i === idx ? { ...x, level: e.target.value as EducationLevel } : x
                              )
                            )
                          }
                          className="w-full mt-1 px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#102E50]"
                        >
                          <option value="SD">SD</option>
                          <option value="SMP">SMP</option>
                          <option value="SMA_SMK">SMA/SMK</option>
                          <option value="D3">D3</option>
                          <option value="D4">D4</option>
                          <option value="S1">S1</option>
                          <option value="S2">S2</option>
                          <option value="S3">S3</option>
                          <option value="OTHER">Lainnya</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-700">Tahun Lulus</label>
                        <input
                          type="number"
                          min="1950"
                          max={new Date().getFullYear()}
                          value={item.graduationYear ?? ""}
                          onChange={(e) =>
                            setEducations((prev) =>
                              prev.map((x, i) =>
                                i === idx
                                  ? { ...x, graduationYear: e.target.value ? Number(e.target.value) : null }
                                  : x
                              )
                            )
                          }
                          placeholder="2020"
                          className="w-full mt-1 px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#102E50]"
                        />
                      </div>
                      <div className="col-span-1 sm:col-span-2">
                        <label className="text-xs font-semibold text-slate-700">Institusi / Kampus</label>
                        <input
                          type="text"
                          value={item.institution}
                          onChange={(e) =>
                            setEducations((prev) =>
                              prev.map((x, i) =>
                                i === idx ? { ...x, institution: e.target.value } : x
                              )
                            )
                          }
                          placeholder="Nama kampus / sekolah"
                          className="w-full mt-1 px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#102E50]"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-700">Jurusan / Program Studi</label>
                        <input
                          type="text"
                          value={item.major ?? ""}
                          onChange={(e) =>
                            setEducations((prev) =>
                              prev.map((x, i) =>
                                i === idx ? { ...x, major: e.target.value } : x
                              )
                            )
                          }
                          placeholder="Contoh: Manajemen Pendidikan"
                          className="w-full mt-1 px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#102E50]"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-700">IPK / Nilai</label>
                        <input
                          type="text"
                          value={item.gpa ?? ""}
                          onChange={(e) =>
                            setEducations((prev) =>
                              prev.map((x, i) => (i === idx ? { ...x, gpa: e.target.value } : x))
                            )
                          }
                          placeholder="3.75"
                          className="w-full mt-1 px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#102E50]"
                        />
                      </div>
                      <div className="col-span-1 sm:col-span-2">
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          Berkas Ijazah / Transkrip (Opsional)
                        </label>
                        {item.certificateFileName ? (
                          <div className="flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-200">
                            <FileCheck className="h-4 w-4 shrink-0 text-emerald-600" />
                            <span className="truncate font-medium">{item.certificateFileName}</span>
                            <button
                              type="button"
                              onClick={() =>
                                setEducations((prev) =>
                                  prev.map((x, i) =>
                                    i === idx
                                      ? { ...x, certificateFile: null, certificateFileName: null }
                                      : x
                                  )
                                )
                              }
                              className="ml-auto text-slate-400 hover:text-red-600 p-1 rounded transition-colors"
                              title="Hapus berkas"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 transition-colors w-full justify-center">
                            <UploadCloud className="h-3.5 w-3.5 text-slate-500" />
                            <span className="font-semibold text-[#102E50]">Unggah Ijazah / Transkrip</span>
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              className="sr-only"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f)
                                  setEducations((prev) =>
                                    prev.map((x, i) =>
                                      i === idx
                                        ? { ...x, certificateFile: f, certificateFileName: f.name }
                                        : x
                                    )
                                  );
                              }}
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              />
            </FormSection>

            {/* SEKSI 1.7: PELATIHAN & SERTIFIKASI */}
            <FormSection
              id="seksi-pelatihan"
              title="1.7 Pelatihan & Sertifikasi"
              subtitle="Riwayat pelatihan, seminar, dan sertifikasi (opsional)"
              icon={Award}
              badge={
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  Opsional
                </span>
              }
              defaultOpen={false}
            >
              <DynamicTable<TrainingItem>
                title="Daftar Pelatihan & Sertifikasi"
                items={trainings}
                onAdd={() =>
                  setTrainings((prev) => [
                    ...prev,
                    {
                      name: "",
                      participationType: "Peserta",
                      startDate: "",
                      endDate: "",
                      duration: "",
                      location: "",
                      organizer: "",
                      certificateFile: null,
                      certificateFileName: null,
                      certificateDocKey: null,
                    },
                  ])
                }
                onRemove={(idx) =>
                  setTrainings((prev) => prev.filter((_, i) => i !== idx))
                }
                addButtonLabel="Tambah Pelatihan / Sertifikasi"
                emptyMessage="Belum ada riwayat pelatihan. Klik tombol di bawah untuk menambahkan."
                tableMinWidth="min-w-[980px]"
                columns={[
                  { key: "name", label: "Nama Pelatihan", width: "20%", minWidth: "180px" },
                  { key: "participationType", label: "Jenis", width: "15%", minWidth: "135px" },
                  { key: "startDate", label: "Mulai", width: "12%", minWidth: "135px" },
                  { key: "endDate", label: "Selesai", width: "12%", minWidth: "135px" },
                  { key: "duration", label: "Durasi", width: "11%", minWidth: "110px" },
                  { key: "organizer", label: "Penyelenggara", width: "15%", minWidth: "150px" },
                  { key: "certificateFile", label: "Sertifikat", width: "15%", minWidth: "140px" },
                ]}
                renderDesktopRow={(item, idx) => (
                  <>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) =>
                          setTrainings((prev) =>
                            prev.map((x, i) => (i === idx ? { ...x, name: e.target.value } : x))
                          )
                        }
                        placeholder="Nama pelatihan / seminar"
                        className="w-full px-2 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-[#102E50]"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={item.participationType ?? ""}
                        onChange={(e) =>
                          setTrainings((prev) =>
                            prev.map((x, i) =>
                              i === idx ? { ...x, participationType: e.target.value } : x
                            )
                          )
                        }
                        className="w-full px-2 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-[#102E50]"
                      >
                        <option value="Peserta">Peserta</option>
                        <option value="Pembicara">Pembicara</option>
                        <option value="Panitia">Panitia</option>
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="date"
                        value={item.startDate ?? ""}
                        onChange={(e) =>
                          setTrainings((prev) =>
                            prev.map((x, i) =>
                              i === idx ? { ...x, startDate: e.target.value } : x
                            )
                          )
                        }
                        className="w-full px-2 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-[#102E50]"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="date"
                        value={item.endDate ?? ""}
                        onChange={(e) =>
                          setTrainings((prev) =>
                            prev.map((x, i) =>
                              i === idx ? { ...x, endDate: e.target.value } : x
                            )
                          )
                        }
                        className="w-full px-2 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-[#102E50]"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={item.duration ?? ""}
                        onChange={(e) =>
                          setTrainings((prev) =>
                            prev.map((x, i) =>
                              i === idx ? { ...x, duration: e.target.value } : x
                            )
                          )
                        }
                        placeholder="mis. 2 hari"
                        className="w-full px-2 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-[#102E50]"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={item.organizer ?? ""}
                        onChange={(e) =>
                          setTrainings((prev) =>
                            prev.map((x, i) =>
                              i === idx ? { ...x, organizer: e.target.value } : x
                            )
                          )
                        }
                        placeholder="Penyelenggara"
                        className="w-full px-2 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-[#102E50]"
                      />
                    </td>
                    <td className="px-3 py-2">
                      {item.certificateFileName ? (
                        <div className="flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-1 rounded">
                          <FileCheck className="h-3.5 w-3.5 flex-shrink-0" />
                          <span className="truncate max-w-[100px]">{item.certificateFileName}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setTrainings((prev) =>
                                prev.map((x, i) =>
                                  i === idx
                                    ? { ...x, certificateFile: null, certificateFileName: null }
                                    : x
                                )
                              )
                            }
                            className="ml-auto text-red-500 hover:text-red-700 flex-shrink-0"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-500 hover:text-[#102E50] transition-colors">
                          <UploadCloud className="h-3.5 w-3.5" />
                          <span>Unggah sertifikat</span>
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="sr-only"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f)
                                setTrainings((prev) =>
                                  prev.map((x, i) =>
                                    i === idx
                                      ? { ...x, certificateFile: f, certificateFileName: f.name }
                                      : x
                                  )
                                );
                            }}
                          />
                        </label>
                      )}
                    </td>
                  </>
                )}
                renderMobileCard={(item, idx) => (
                  <div className="space-y-2.5 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="col-span-1 sm:col-span-2">
                        <label className="text-xs font-semibold text-slate-700">Nama Pelatihan / Seminar</label>
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) =>
                            setTrainings((prev) =>
                              prev.map((x, i) => (i === idx ? { ...x, name: e.target.value } : x))
                            )
                          }
                          placeholder="Nama kegiatan pelatihan"
                          className="w-full mt-1 px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#102E50]"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-700">Jenis Kepesertaan</label>
                        <select
                          value={item.participationType ?? ""}
                          onChange={(e) =>
                            setTrainings((prev) =>
                              prev.map((x, i) =>
                                i === idx ? { ...x, participationType: e.target.value } : x
                              )
                            )
                          }
                          className="w-full mt-1 px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#102E50]"
                        >
                          <option value="Peserta">Peserta</option>
                          <option value="Pembicara">Pembicara</option>
                          <option value="Panitia">Panitia</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-700">Penyelenggara</label>
                        <input
                          type="text"
                          value={item.organizer ?? ""}
                          onChange={(e) =>
                            setTrainings((prev) =>
                              prev.map((x, i) =>
                                i === idx ? { ...x, organizer: e.target.value } : x
                              )
                            )
                          }
                          placeholder="Lembaga penyelenggara"
                          className="w-full mt-1 px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#102E50]"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-700">Tanggal Mulai</label>
                        <input
                          type="date"
                          value={item.startDate ?? ""}
                          onChange={(e) =>
                            setTrainings((prev) =>
                              prev.map((x, i) =>
                                i === idx ? { ...x, startDate: e.target.value } : x
                              )
                            )
                          }
                          className="w-full mt-1 px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#102E50]"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-700">Tanggal Selesai</label>
                        <input
                          type="date"
                          value={item.endDate ?? ""}
                          onChange={(e) =>
                            setTrainings((prev) =>
                              prev.map((x, i) =>
                                i === idx ? { ...x, endDate: e.target.value } : x
                              )
                            )
                          }
                          className="w-full mt-1 px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#102E50]"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-700">Durasi</label>
                        <input
                          type="text"
                          value={item.duration ?? ""}
                          onChange={(e) =>
                            setTrainings((prev) =>
                              prev.map((x, i) => (i === idx ? { ...x, duration: e.target.value } : x))
                            )
                          }
                          placeholder="mis. 2 hari / 16 jam"
                          className="w-full mt-1 px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#102E50]"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-700">Tempat</label>
                        <input
                          type="text"
                          value={item.location ?? ""}
                          onChange={(e) =>
                            setTrainings((prev) =>
                              prev.map((x, i) => (i === idx ? { ...x, location: e.target.value } : x))
                            )
                          }
                          placeholder="Jakarta / Online"
                          className="w-full mt-1 px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#102E50]"
                        />
                      </div>
                      <div className="col-span-1 sm:col-span-2">
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          Sertifikat Pelatihan (Opsional)
                        </label>
                        {item.certificateFileName ? (
                          <div className="flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-200">
                            <FileCheck className="h-4 w-4 shrink-0 text-emerald-600" />
                            <span className="truncate font-medium">{item.certificateFileName}</span>
                            <button
                              type="button"
                              onClick={() =>
                                setTrainings((prev) =>
                                  prev.map((x, i) =>
                                    i === idx
                                      ? { ...x, certificateFile: null, certificateFileName: null }
                                      : x
                                  )
                                )
                              }
                              className="ml-auto text-slate-400 hover:text-red-600 p-1 rounded transition-colors"
                              title="Hapus berkas"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 transition-colors w-full justify-center">
                            <UploadCloud className="h-3.5 w-3.5 text-slate-500" />
                            <span className="font-semibold text-[#102E50]">Unggah Sertifikat</span>
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              className="sr-only"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f)
                                  setTrainings((prev) =>
                                    prev.map((x, i) =>
                                      i === idx
                                        ? { ...x, certificateFile: f, certificateFileName: f.name }
                                        : x
                                    )
                                  );
                              }}
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              />
            </FormSection>

            {/* SEKSI 1.8: PENGALAMAN KERJA SEBELUMNYA */}
            <FormSection
              id="seksi-pengalaman-kerja"
              title="1.8 Pengalaman Kerja Sebelumnya"
              subtitle="Riwayat pekerjaan di perusahaan/organisasi sebelumnya (opsional)"
              icon={Briefcase}
              badge={
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  Opsional
                </span>
              }
              defaultOpen={false}
            >
              <DynamicTable<WorkExperienceItem>
                title="Daftar Pengalaman Kerja"
                items={workExperiences}
                onAdd={() =>
                  setWorkExperiences((prev) => [
                    ...prev,
                    {
                      companyName: "",
                      jobTitle: "",
                      startDate: "",
                      endDate: "",
                      isCurrent: false,
                      reasonForLeaving: "",
                      description: "",
                    },
                  ])
                }
                onRemove={(idx) =>
                  setWorkExperiences((prev) => prev.filter((_, i) => i !== idx))
                }
                addButtonLabel="Tambah Pengalaman Kerja"
                emptyMessage="Belum ada riwayat pekerjaan. Klik tombol di bawah untuk menambahkan."
                tableMinWidth="min-w-[940px]"
                columns={[
                  { key: "companyName", label: "Perusahaan", width: "20%", minWidth: "170px" },
                  { key: "jobTitle", label: "Jabatan", width: "18%", minWidth: "150px" },
                  { key: "startDate", label: "Mulai (YYYY-MM)", width: "14%", minWidth: "135px" },
                  { key: "endDate", label: "Selesai (YYYY-MM)", width: "14%", minWidth: "140px" },
                  { key: "reasonForLeaving", label: "Alasan Berhenti", width: "17%", minWidth: "150px" },
                  { key: "description", label: "Uraian Tugas", width: "17%", minWidth: "170px" },
                ]}
                renderDesktopRow={(item, idx) => (
                  <>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={item.companyName}
                        onChange={(e) =>
                          setWorkExperiences((prev) =>
                            prev.map((x, i) =>
                              i === idx ? { ...x, companyName: e.target.value } : x
                            )
                          )
                        }
                        placeholder="Nama perusahaan"
                        className="w-full px-2 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-[#102E50]"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={item.jobTitle}
                        onChange={(e) =>
                          setWorkExperiences((prev) =>
                            prev.map((x, i) =>
                              i === idx ? { ...x, jobTitle: e.target.value } : x
                            )
                          )
                        }
                        placeholder="Jabatan / posisi"
                        className="w-full px-2 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-[#102E50]"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="month"
                        value={item.startDate ?? ""}
                        onChange={(e) =>
                          setWorkExperiences((prev) =>
                            prev.map((x, i) =>
                              i === idx ? { ...x, startDate: e.target.value } : x
                            )
                          )
                        }
                        className="w-full px-2 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-[#102E50]"
                      />
                    </td>
                    <td className="px-3 py-2">
                      {item.isCurrent ? (
                        <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
                          Masih Aktif
                        </span>
                      ) : (
                        <input
                          type="month"
                          value={item.endDate ?? ""}
                          min={item.startDate ?? undefined}
                          onChange={(e) =>
                            setWorkExperiences((prev) =>
                              prev.map((x, i) =>
                                i === idx ? { ...x, endDate: e.target.value } : x
                              )
                            )
                          }
                          className="w-full px-2 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-[#102E50]"
                        />
                      )}
                      <label className="flex items-center gap-1 mt-1 text-[10px] text-slate-500 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.isCurrent ?? false}
                          onChange={(e) =>
                            setWorkExperiences((prev) =>
                              prev.map((x, i) =>
                                i === idx ? { ...x, isCurrent: e.target.checked, endDate: e.target.checked ? "" : x.endDate } : x
                              )
                            )
                          }
                          className="h-3 w-3 rounded border-slate-300 text-[#102E50]"
                        />
                        Masih aktif
                      </label>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={item.reasonForLeaving ?? ""}
                        onChange={(e) =>
                          setWorkExperiences((prev) =>
                            prev.map((x, i) =>
                              i === idx ? { ...x, reasonForLeaving: e.target.value } : x
                            )
                          )
                        }
                        placeholder="Alasan berhenti"
                        className="w-full px-2 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-[#102E50]"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <textarea
                        value={item.description ?? ""}
                        onChange={(e) =>
                          setWorkExperiences((prev) =>
                            prev.map((x, i) =>
                              i === idx ? { ...x, description: e.target.value } : x
                            )
                          )
                        }
                        placeholder="Uraian tugas singkat"
                        rows={2}
                        className="w-full px-2 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-[#102E50] resize-none"
                      />
                    </td>
                  </>
                )}
                renderMobileCard={(item, idx) => (
                  <div className="space-y-2.5 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="col-span-1 sm:col-span-2">
                        <label className="text-xs font-semibold text-slate-700">Nama Perusahaan / Lembaga</label>
                        <input
                          type="text"
                          value={item.companyName}
                          onChange={(e) =>
                            setWorkExperiences((prev) =>
                              prev.map((x, i) =>
                                i === idx ? { ...x, companyName: e.target.value } : x
                              )
                            )
                          }
                          placeholder="Nama instansi / perusahaan"
                          className="w-full mt-1 px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#102E50]"
                        />
                      </div>
                      <div className="col-span-1 sm:col-span-2">
                        <label className="text-xs font-semibold text-slate-700">Jabatan / Posisi</label>
                        <input
                          type="text"
                          value={item.jobTitle}
                          onChange={(e) =>
                            setWorkExperiences((prev) =>
                              prev.map((x, i) =>
                                i === idx ? { ...x, jobTitle: e.target.value } : x
                              )
                            )
                          }
                          placeholder="Jabatan atau posisi kerja"
                          className="w-full mt-1 px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#102E50]"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-700">Bulan & Tahun Mulai</label>
                        <input
                          type="month"
                          value={item.startDate ?? ""}
                          onChange={(e) =>
                            setWorkExperiences((prev) =>
                              prev.map((x, i) =>
                                i === idx ? { ...x, startDate: e.target.value } : x
                              )
                            )
                          }
                          className="w-full mt-1 px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#102E50]"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-700">Bulan & Tahun Selesai</label>
                        <input
                          type="month"
                          value={item.endDate ?? ""}
                          min={item.startDate ?? undefined}
                          disabled={item.isCurrent}
                          onChange={(e) =>
                            setWorkExperiences((prev) =>
                              prev.map((x, i) =>
                                i === idx ? { ...x, endDate: e.target.value } : x
                              )
                            )
                          }
                          className="w-full mt-1 px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#102E50] disabled:bg-slate-100 disabled:opacity-60"
                        />
                        <label className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-600 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={item.isCurrent ?? false}
                            onChange={(e) =>
                              setWorkExperiences((prev) =>
                                prev.map((x, i) =>
                                  i === idx ? { ...x, isCurrent: e.target.checked } : x
                                )
                              )
                            }
                            className="h-3.5 w-3.5 rounded border-slate-300 text-[#102E50] cursor-pointer"
                          />
                          <span>Masih aktif bekerja di sini</span>
                        </label>
                      </div>
                      <div className="col-span-1 sm:col-span-2">
                        <label className="text-xs font-semibold text-slate-700">Alasan Berhenti / Pindah</label>
                        <input
                          type="text"
                          value={item.reasonForLeaving ?? ""}
                          onChange={(e) =>
                            setWorkExperiences((prev) =>
                              prev.map((x, i) =>
                                i === idx ? { ...x, reasonForLeaving: e.target.value } : x
                              )
                            )
                          }
                          placeholder="Alasan pengunduran diri / selesai kontrak"
                          className="w-full mt-1 px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#102E50]"
                        />
                      </div>
                      <div className="col-span-1 sm:col-span-2">
                        <label className="text-xs font-semibold text-slate-700">Uraian Tugas Singkat</label>
                        <textarea
                          value={item.description ?? ""}
                          onChange={(e) =>
                            setWorkExperiences((prev) =>
                              prev.map((x, i) =>
                                i === idx ? { ...x, description: e.target.value } : x
                              )
                            )
                          }
                          placeholder="Uraian tugas dan tanggung jawab..."
                          rows={2}
                          className="w-full mt-1 px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#102E50] resize-none"
                        />
                      </div>
                    </div>
                  </div>
                )}
              />
            </FormSection>

            {/* SEKSI 1.9: BERKAS DOKUMEN PRIBADI */}
            <FormSection
              id="seksi-dokumen-langkah-1"
              title="1.9 Berkas Dokumen Pribadi"
              subtitle="Unggah salinan Curriculum Vitae, ijazah terakhir, kartu keluarga, dan buku nikah (jika menikah)"
              icon={FileUp}
              badge={
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  Dapat Disusulkan
                </span>
              }
              defaultOpen={true}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                <DocumentUploadCard
                  label="Curriculum Vitae (CV) / Resume"
                  description="Dokumen riwayat hidup profesional pegawai terbaru"
                  accept="application/pdf"
                  maxSizeMB={10}
                  value={docCv}
                  onChange={setDocCv}
                />

                <DocumentUploadCard
                  label="Ijazah & Transkrip Terakhir"
                  description="Bukti kelulusan jenjang pendidikan formal terakhir"
                  accept="application/pdf,image/jpeg,image/png"
                  maxSizeMB={5}
                  value={docDiploma}
                  onChange={setDocDiploma}
                />

                <DocumentUploadCard
                  label="Kartu Keluarga (KK)"
                  description="Salinan kartu keluarga untuk verifikasi data tanggungan"
                  accept="application/pdf,image/jpeg,image/png"
                  maxSizeMB={5}
                  value={docFamilyCard}
                  onChange={setDocFamilyCard}
                />

                {(formData.maritalStatus === "MARRIED" || initialData?.hasMarriageCert) && (
                  <div className="animate-in fade-in duration-200">
                    <DocumentUploadCard
                      label="Buku Nikah / Akta Perkawinan"
                      description="PDF / Gambar maks. 5 MB • Verifikasi status pernikahan & keluarga"
                      accept=".pdf,.jpg,.jpeg,.png"
                      maxSizeMB={5}
                      value={docMarriageCert}
                      onChange={setDocMarriageCert}
                    />
                  </div>
                )}
              </div>
            </FormSection>
          </div>
        )}

        {/* STEP 2: PENEMPATAN KERJA */}
        {currentStep === 2 && (
          <div className="w-full min-w-0 max-w-full grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in duration-200">
            <div className="md:col-span-2 pb-2 border-b border-slate-100">
              <h3 className="font-bold text-base text-[#102E50] font-heading">
                Penempatan & Jabatan Organisasi
              </h3>
              <p className="text-xs text-slate-500">
                Informasi divisi kerja, posisi riset, dan atasan langsung
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Nomor Induk Pegawai (NIP) <span className="text-[#A8281C]">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleGenerateNip}
                  disabled={isGeneratingNip}
                  className="text-[11px] font-semibold text-[#102E50] hover:text-[#0c233d] bg-blue-50/80 hover:bg-blue-100 px-2.5 py-1 rounded-md border border-blue-200/80 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
                  title="Generate nomor induk pegawai otomatis berdasarkan tahun & bulan bergabung"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#F2AF3E]" />
                  <span>{isGeneratingNip ? "Menghasilkan NIP..." : "Buat NIP Otomatis"}</span>
                </button>
              </div>

              <div className="relative">
                <input
                  type="text"
                  name="employeeNo"
                  value={formData.employeeNo}
                  onChange={handleNipChange}
                  placeholder="PSPK-YYYYMM-XXX"
                  required
                  className={`w-full px-3 py-2 pr-9 text-sm font-mono rounded-lg text-slate-900 focus:outline-none focus:ring-2 transition-all ${
                    nipStatus?.available === false
                      ? "border-red-400 focus:ring-red-400 bg-red-50/30 text-red-900"
                      : nipStatus?.available === true
                        ? "border-emerald-400 focus:ring-emerald-400 bg-emerald-50/20 text-slate-900"
                        : "border-slate-200 bg-slate-50/70 focus:ring-[#102E50]"
                  }`}
                />
                <div className="absolute right-3 top-2.5 flex items-center pointer-events-none">
                  {isCheckingNip && <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />}
                  {!isCheckingNip && nipStatus?.available === true && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  )}
                  {!isCheckingNip && nipStatus?.available === false && (
                    <XCircle className="w-4 h-4 text-red-600" />
                  )}
                </div>
              </div>

              {/* Status Validasi NIP */}
              {nipStatus ? (
                <span
                  className={`text-[11px] mt-1.5 block font-medium flex items-center gap-1 ${
                    nipStatus.available ? "text-emerald-700" : "text-[#A8281C]"
                  }`}
                >
                  {nipStatus.message}
                </span>
              ) : (
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Format standar: PSPK-YYYYMM-XXX (klik tombol di atas untuk membuat NIP urut
                  otomatis)
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Tanggal Mulai Bergabung <span className="text-[#A8281C]">*</span>
              </label>
              <input
                type="date"
                name="joinDate"
                value={formData.joinDate}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 text-sm bg-slate-50/70 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#102E50]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Divisi / Departemen <span className="text-[#A8281C]">*</span>
              </label>
              <select
                name="currentDepartmentId"
                value={formData.currentDepartmentId}
                onChange={(e) => handleDepartmentChange(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm bg-slate-50/70 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#102E50]"
              >
                <option value="">Pilih Divisi</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Jabatan / Posisi Riset <span className="text-[#A8281C]">*</span>
              </label>
              <select
                name="currentPositionId"
                value={formData.currentPositionId}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 text-sm bg-slate-50/70 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#102E50]"
              >
                <option value="">Pilih Posisi</option>
                {availablePositions.map((pos) => (
                  <option key={pos.id} value={pos.id}>
                    {pos.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Atasan Langsung (Manager Approver)
              </label>
              <select
                name="managerId"
                value={formData.managerId}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm bg-slate-50/70 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#102E50]"
              >
                <option value="">Tidak ada (Direksi / Melapor Mandiri)</option>
                {managers.map((mgr) => (
                  <option key={mgr.id} value={mgr.id}>
                    {mgr.fullName} ({mgr.currentPosition?.title || mgr.employeeNo})
                  </option>
                ))}
              </select>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Atasan langsung bertindak sebagai penyetuju cuti dan penilai kinerja
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Status Kepegawaian <span className="text-[#A8281C]">*</span>
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 text-sm bg-slate-50/70 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#102E50]"
              >
                <option value="ACTIVE">Aktif</option>
                <option value="PROBATION">Masa Percobaan (Probation)</option>
                <option value="ON_LEAVE">Sedang Cuti Panjang</option>
                <option value="RESIGNED">Mengundurkan Diri</option>
                <option value="TERMINATED">Nonaktif / Berhenti</option>
              </select>
            </div>

            {/* Lokasi Kerja */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Lokasi Kerja
              </label>
              <select
                name="workLocationId"
                value={formData.workLocationId}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm bg-slate-50/70 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#102E50]"
              >
                <option value="">Pilih Lokasi Kerja</option>
                {workLocations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} {loc.isDefault ? "(Default)" : ""}
                  </option>
                ))}
              </select>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Lokasi kantor fisik atau penugasan kerja utama pegawai.
              </span>
            </div>

            {/* TKU / Entitas Hukum */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                TKU / Entitas Hukum
              </label>
              <select
                name="legalEntityId"
                value={formData.legalEntityId}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm bg-slate-50/70 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#102E50]"
              >
                <option value="">Pilih Entitas Hukum</option>
                {legalEntities.map((ent) => (
                  <option key={ent.id} value={ent.id}>
                    {ent.name} {ent.tkuCode ? `[TKU: ${ent.tkuCode}]` : ""} {ent.isDefault ? "(Default)" : ""}
                  </option>
                ))}
              </select>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Badan hukum resmi yang menaungi penempatan dan kontrak kerja pegawai.
              </span>
            </div>

            {/* Tanggal Akhir Masa Percobaan (Kondisional: PROBATION) */}
            {formData.status === "PROBATION" && (
              <div className="animate-in fade-in duration-150">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Tanggal Akhir Masa Percobaan (Probation)
                </label>
                <input
                  type="date"
                  name="probationEndDate"
                  value={formData.probationEndDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm bg-slate-50/70 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#102E50]"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Estimasi tanggal evaluasi probation (misalnya 3 bulan sejak bergabung).
                </span>
              </div>
            )}

            {/* Tanggal Terakhir Kerja (Kondisional: RESIGNED / TERMINATED) */}
            {(formData.status === "RESIGNED" || formData.status === "TERMINATED") && (
              <div className="animate-in fade-in duration-150">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Tanggal Terakhir Kerja (End Date)
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm bg-slate-50/70 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#102E50]"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Tanggal efektif pegawai berhenti atau mengakhiri masa kerjanya di organisasi.
                </span>
              </div>
            )}

            {/* Dokumen Langkah 2 (Opsional): Paklaring & Offer Letter */}
            <div className="md:col-span-2 mt-2 pt-4 border-t border-slate-100 flex flex-col gap-3">
              <div>
                <h4 className="text-xs font-bold text-[#102E50] uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#102E50]" />
                  <span>Dokumen Penempatan & Pengalaman Kerja (Opsional)</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Unggah surat penawaran kerja (offer letter) bertanda tangan atau surat pengalaman kerja sebelumnya jika ada.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DocumentUploadCard
                  label="Surat Keterangan Kerja / Paklaring Sebelumnya"
                  description="Surat pengalaman kerja resmi dari instansi atau perusahaan terdahulu (PDF/JPG maks 5 MB)"
                  accept="application/pdf,image/jpeg,image/png"
                  maxSizeMB={5}
                  value={docPreviousEmployerLetter}
                  onChange={setDocPreviousEmployerLetter}
                />
                <DocumentUploadCard
                  label="Offer Letter Ditandatangani"
                  description="Surat penawaran kerja resmi yang telah ditandatangani pegawai (PDF/JPG maks 5 MB)"
                  accept="application/pdf,image/jpeg,image/png"
                  maxSizeMB={5}
                  value={docOfferLetter}
                  onChange={setDocOfferLetter}
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: KONTRAK & KOMPENSASI */}
        {currentStep === 3 && (
          <div className="w-full min-w-0 max-w-full grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in duration-200">
            <div className="md:col-span-2 pb-2 border-b border-slate-100">
              <h3 className="font-bold text-base text-[#102E50] font-heading">
                Kontrak Kerja & Kompensasi
              </h3>
              <p className="text-xs text-slate-500">
                Ketentuan perjanjian ikatan kerja, paket remunerasi bulanan, dan pengaturan perpajakan staf
              </p>
            </div>

            {/* BAGIAN A: KETENTUAN & BERKAS KONTRAK KERJA */}
            <div className="md:col-span-2 p-5 bg-white rounded-xl border border-slate-200/90 shadow-2xs flex flex-col gap-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#102E50]" />
                  <h4 className="text-xs font-bold text-[#102E50] uppercase tracking-wider">
                    Ketentuan & Berkas Kontrak Kerja
                  </h4>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setQuickCreateError(null);
                      setIsQuickCreateModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-[#102E50]/10 text-[#102E50] hover:bg-[#102E50]/20 transition-all cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#F2AF3E]" />
                    <span>Tambah Tipe Baru</span>
                  </button>
                  <span className="text-slate-300 text-xs">|</span>
                  <Link
                    href="/karyawan/ikatan-kerja"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-[#102E50] transition-colors"
                    title="Buka Pengaturan Master Tipe Ikatan Kerja di Tab Baru"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Pengaturan Ikatan Kerja</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </Link>
                </div>
              </div>

              {quickCreateSuccess && (
                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between animate-in fade-in duration-150">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{quickCreateSuccess}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setQuickCreateSuccess(null)}
                    className="text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Tipe Ikatan Kerja Cards */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Pilih Tipe Ikatan Kerja <span className="text-[#A8281C]">*</span>
                </label>
                {employmentTypesList.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {employmentTypesList.map((et) => {
                      const isSelected = formData.employmentTypeId === et.id;
                      return (
                        <button
                          key={et.id}
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              employmentTypeId: et.id,
                              employmentType: et.category as EmploymentType,
                              wageType: et.wageType,
                              hourlyRate:
                                et.wageType === "HOURLY"
                                  ? (et.defaultHourlyRate ?? 30000)
                                  : prev.hourlyRate,
                              baseSalary: prev.baseSalary,
                            }))
                          }
                          className={`text-left p-3 rounded-lg border-2 transition-all cursor-pointer ${
                            isSelected
                              ? "border-[#102E50] bg-[#102E50]/5 shadow-xs"
                              : "border-slate-200 bg-slate-50/70 hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span
                              className={`text-xs font-bold ${
                                isSelected ? "text-[#102E50]" : "text-slate-700"
                              }`}
                            >
                              {et.name}
                            </span>
                            <span
                              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${
                                et.wageType === "HOURLY"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {et.wageType === "HOURLY" ? "Per Jam" : "Bulanan"}
                            </span>
                          </div>
                          {et.description && (
                            <p className="text-[11px] text-slate-500 mt-1 leading-tight">
                              {et.description}
                            </p>
                          )}
                          {et.wageType === "HOURLY" && et.defaultHourlyRate && (
                            <p className="text-[11px] text-slate-400 mt-1">
                              Tarif default: Rp{et.defaultHourlyRate.toLocaleString("id-ID")}/jam
                            </p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <select
                    name="employmentType"
                    value={formData.employmentType}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 text-sm bg-slate-50/70 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#102E50]"
                  >
                    <option value="PERMANENT">Pegawai Tetap (Permanent)</option>
                    <option value="FIXED_TERM">PKWT Riset (Fixed Term Project)</option>
                    <option value="PART_TIME_PROJECT">Paruh Waktu / Proyek Ad-Hoc</option>
                  </select>
                )}
                {!formData.employmentTypeId && employmentTypesList.length > 0 && (
                  <p className="text-[11px] text-[#A8281C] mt-1.5">
                    Pilih tipe ikatan kerja terlebih dahulu
                  </p>
                )}
              </div>

              {/* Grid Tanggal Kontrak */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Tanggal Mulai Kontrak <span className="text-[#A8281C]">*</span>
                  </label>
                  <input
                    type="date"
                    name="contractStartDate"
                    value={formData.contractStartDate}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 text-sm bg-slate-50/70 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#102E50]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Tanggal Berakhir Kontrak{" "}
                    {formData.employmentType === "FIXED_TERM" && (
                      <span className="text-[#A8281C]">* (Wajib untuk PKWT)</span>
                    )}
                  </label>
                  <input
                    type="date"
                    name="contractEndDate"
                    value={formData.contractEndDate}
                    onChange={handleChange}
                    required={formData.employmentType === "FIXED_TERM"}
                    className="w-full px-3 py-2 text-sm bg-slate-50/70 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#102E50]"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Sistem akan memicu peringatan otomatis jika masa kontrak tersisa ≤ 30 hari
                  </span>
                </div>
              </div>

              {/* Nomor Dokumen Kontrak & Catatan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Nomor Surat Perjanjian / SK Kontrak
                  </label>
                  <input
                    type="text"
                    name="contractNumber"
                    value={formData.contractNumber}
                    onChange={handleChange}
                    placeholder="Contoh: 018/PKWT/PSPK/X/2026 atau No. SK Direksi"
                    className="w-full px-3 py-2 text-sm font-mono bg-slate-50/70 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#102E50]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Catatan Kontrak Kerja
                  </label>
                  <input
                    type="text"
                    name="contractNotes"
                    value={formData.contractNotes}
                    onChange={handleChange}
                    placeholder="Keterangan penugasan khusus atau klausul riset..."
                    className="w-full px-3 py-2 text-sm bg-slate-50/70 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#102E50]"
                  />
                </div>
              </div>

              {/* Berkas Perjanjian Kerja & Legalitas (Kontrak & NDA) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                {/* Kolom 1: Lampiran Berkas Kontrak Kerja (PDF) */}
                <div className="flex flex-col">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Lampiran Berkas Kontrak Kerja (PDF)
                    </label>
                    <span className="text-[11px] text-slate-400">
                      Opsional saat pendaftaran • Maksimal 10 MB
                    </span>
                  </div>

                  {formData.contractDocumentKey && !contractFile && (
                    <div className="mb-3 p-3 bg-blue-50/70 border border-blue-200/80 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-semibold text-blue-900 truncate">
                            Berkas Kontrak Telah Terunggah
                          </span>
                          <span className="text-[11px] text-blue-700 font-mono truncate">
                            {formData.contractDocumentKey}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <a
                          href={`/api/documents/${formData.contractDocumentKey}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 text-xs font-semibold bg-white text-blue-700 hover:bg-blue-100/60 rounded border border-blue-300 transition-colors inline-flex items-center gap-1 shadow-2xs"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Lihat PDF</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, contractDocumentKey: "" }))}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                          title="Hapus berkas kontrak ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {(!formData.contractDocumentKey || contractFile) && (
                    <div className="p-4 bg-slate-50/70 border-2 border-dashed border-slate-200 hover:border-slate-300 rounded-xl transition-all flex-1 flex flex-col justify-center">
                      {!contractFile ? (
                        <label className="flex flex-col items-center justify-center cursor-pointer py-2">
                          <UploadCloud className="w-7 h-7 text-slate-400 mb-1.5 group-hover:text-[#102E50]" />
                          <span className="text-xs font-bold text-slate-700 mb-0.5 text-center">
                            Pilih atau seret berkas PDF kontrak ke sini
                          </span>
                          <span className="text-[11px] text-slate-400 text-center">
                            Hanya format PDF (.pdf), ukuran maksimal 10 MB
                          </span>
                          <input
                            type="file"
                            accept="application/pdf,.pdf"
                            onChange={handleContractFileChange}
                            className="hidden"
                          />
                        </label>
                      ) : (
                        <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
                              <FileCheck className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-bold text-slate-800 truncate">
                                {contractFile.name}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                {(contractFile.size / 1024 / 1024).toFixed(2)} MB • Siap disimpan
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={handleRemoveContractFile}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                            title="Hapus pilihan berkas"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      {contractFileError && (
                        <p className="text-xs text-rose-600 font-semibold mt-2 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>{contractFileError}</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Kolom 2: Dokumen NDA / Pakta Integritas Pegawai */}
                <div className="flex flex-col">
                  <DocumentUploadCard
                    label="NDA / Pakta Integritas Pegawai"
                    description="Format PDF maks. 5 MB • Perjanjian kerahasiaan & integritas lembaga"
                    accept="application/pdf,.pdf"
                    maxSizeMB={5}
                    value={docNda}
                    onChange={setDocNda}
                  />
                </div>
              </div>
            </div>

            {/* BAGIAN B: STRUKTUR KOMPENSASI & PENGATURAN PAJAK (SATU PINTU) */}
            <div className="md:col-span-2 p-5 bg-gradient-to-br from-slate-50 via-slate-50/90 to-blue-50/20 rounded-xl border border-slate-200/90 flex flex-col gap-4 shadow-2xs">
              <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-200/70">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#102E50]/10 text-[#102E50] flex items-center justify-center font-bold">
                    <Receipt className="w-4 h-4 text-[#102E50]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#102E50] uppercase tracking-wider">
                      Struktur Kompensasi, Tunjangan & Pajak (PPh 21)
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Tentukan gaji pokok, tunjangan tetap, dan konfigurasi pajak penghasilan sesuai penawaran kerja.
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-200/70 text-slate-700">
                  {formData.wageType === "HOURLY" ? "Tipe Per Jam" : "Tipe Gaji Bulanan"}
                </span>
              </div>

              {formData.wageType === "HOURLY" ? (
                <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl">
                  <label className="block text-xs font-semibold text-amber-950 mb-1.5">
                    Tarif Upah Per Jam (IDR) <span className="text-[#A8281C]">*</span>
                  </label>
                  <input
                    type="number"
                    name="hourlyRate"
                    value={formData.hourlyRate}
                    onChange={handleChange}
                    required
                    min={0}
                    placeholder="Contoh: 150000"
                    className="w-full px-3 py-2 text-sm font-mono bg-white border border-amber-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <span className="text-[11px] text-amber-800 mt-1.5 block">
                    Penghasilan akhir dihitung otomatis berdasarkan total jam kerja terverifikasi pada timesheet bulanan.
                  </span>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Gaji Pokok Bulanan */}
                  <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Gaji Pokok Bulanan (IDR) <span className="text-[#A8281C]">*</span>
                    </label>
                    <input
                      type="number"
                      name="baseSalary"
                      value={formData.baseSalary}
                      onChange={handleChange}
                      required
                      min={0}
                      placeholder="Contoh: 8000000"
                      className="w-full px-3 py-2 text-sm font-mono bg-slate-50/70 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#102E50] font-semibold"
                    />
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      Kompensasi dasar bulanan. Dijadikan acuan dasar perhitungan BPJS, upah lembur, dan tunjangan.
                    </span>
                  </div>

                  {/* Tunjangan-Tunjangan Tetap Perorangan */}
                  <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 flex-wrap gap-1">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Tunjangan Tetap Perorangan (Opsional Sesuai Kontrak)
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Isi 0 jika pegawai tidak mendapatkan tunjangan
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Tunjangan Jabatan & Keahlian (IDR)
                        </label>
                        <input
                          type="number"
                          name="allowancePosition"
                          value={formData.allowancePosition}
                          onChange={handleChange}
                          min={0}
                          placeholder="0"
                          className="w-full px-3 py-2 text-sm font-mono bg-slate-50/70 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#102E50]"
                        />
                        <span className="text-[10.5px] text-slate-400 mt-0.5 block">
                          Untuk staf struktural / manajerial / tenaga ahli.
                        </span>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Tunjangan Transportasi & Mobilitas (IDR)
                        </label>
                        <input
                          type="number"
                          name="allowanceTransport"
                          value={formData.allowanceTransport}
                          onChange={handleChange}
                          min={0}
                          placeholder="0"
                          className="w-full px-3 py-2 text-sm font-mono bg-slate-50/70 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#102E50]"
                        />
                        <span className="text-[10.5px] text-slate-400 mt-0.5 block">
                          Bantuan transport / kehadiran kerja bulanan.
                        </span>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Tunjangan Komunikasi & Internet (IDR)
                        </label>
                        <input
                          type="number"
                          name="allowanceCommunication"
                          value={formData.allowanceCommunication}
                          onChange={handleChange}
                          min={0}
                          placeholder="0"
                          className="w-full px-3 py-2 text-sm font-mono bg-slate-50/70 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#102E50]"
                        />
                        <span className="text-[10.5px] text-slate-400 mt-0.5 block">
                          Bantuan pulsa, kuota, atau internet kerja.
                        </span>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Tunjangan Fungsional & Khusus Lainnya (IDR)
                        </label>
                        <input
                          type="number"
                          name="allowanceOther"
                          value={formData.allowanceOther}
                          onChange={handleChange}
                          min={0}
                          placeholder="0"
                          className="w-full px-3 py-2 text-sm font-mono bg-slate-50/70 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#102E50]"
                        />
                        <span className="text-[10.5px] text-slate-400 mt-0.5 block">
                          Tunjangan proyek atau penugasan khusus lainnya.
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Pengaturan Pajak Penghasilan (PPh 21 — PP 58/2023) */}
                  {(() => {
                    const selectedPtkpInfo = getPtkpExplanation(formData.ptkpStatus);
                    const selectedTaxMethodInfo = getTaxMethodExplanation(formData.taxMethod);

                    return (
                      <div className="p-4 sm:p-5 bg-white rounded-xl border border-slate-200 flex flex-col gap-4 shadow-2xs">
                        <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-100">
                          <div className="flex items-center gap-2">
                            <Receipt className="w-4 h-4 text-[#102E50]" />
                            <h4 className="text-xs font-bold text-[#102E50] uppercase tracking-wider">
                              Pengaturan Pajak Penghasilan (PPh 21 — PP 58/2023)
                            </h4>
                          </div>
                          <span className="text-[11px] font-medium text-slate-500 bg-slate-50 px-2.5 py-0.5 rounded-full border border-slate-200">
                            Regulasi PP 58/2023 & PMK 168/2023
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Status PTKP menentukan lapisan <strong>Tarif Efektif Rata-Rata (TER A, B, atau C)</strong> untuk pemotongan bulanan Januari–November dan rekonsiliasi Pasal 17 UU HPP pada masa Desember.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                          {/* Kolom 1: Status PTKP */}
                          <div className="flex flex-col gap-2">
                            <label className="block text-xs font-semibold text-slate-700">
                              Status PTKP (Penghasilan Tidak Kena Pajak) <span className="text-[#A8281C]">*</span>
                            </label>
                            <select
                              name="ptkpStatus"
                              value={formData.ptkpStatus}
                              onChange={handleChange}
                              className="w-full px-3 py-2 text-sm bg-slate-50/70 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#102E50] font-medium"
                            >
                              <option value="TK_0">TK/0 — Tidak Kawin, 0 Tanggungan (TER A - Rp 54 jt)</option>
                              <option value="TK_1">TK/1 — Tidak Kawin, 1 Tanggungan (TER A - Rp 58,5 jt)</option>
                              <option value="TK_2">TK/2 — Tidak Kawin, 2 Tanggungan (TER B - Rp 63 jt)</option>
                              <option value="TK_3">TK/3 — Tidak Kawin, 3 Tanggungan (TER B - Rp 67,5 jt)</option>
                              <option value="K_0">K/0 — Kawin, 0 Tanggungan (TER A - Rp 58,5 jt)</option>
                              <option value="K_1">K/1 — Kawin, 1 Tanggungan (TER B - Rp 63 jt)</option>
                              <option value="K_2">K/2 — Kawin, 2 Tanggungan (TER B - Rp 67,5 jt)</option>
                              <option value="K_3">K/3 — Kawin, 3 Tanggungan (TER C - Rp 72 jt)</option>
                            </select>

                            {selectedPtkpInfo && (
                              <div className="p-3 rounded-lg bg-sky-50/70 border border-sky-200/90 text-xs flex flex-col gap-2 shadow-2xs">
                                <div className="flex items-center justify-between gap-2 border-b border-sky-200/60 pb-1.5">
                                  <div className="flex items-center gap-1.5 font-bold text-[#102E50]">
                                    <Info className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                                    <span>{selectedPtkpInfo.statusLabel}</span>
                                  </div>
                                  <span className={`px-2 py-0.5 text-[10.5px] font-bold rounded-md border ${selectedPtkpInfo.terBadgeClass}`}>
                                    {selectedPtkpInfo.terCategory}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-[10.5px] bg-white/90 p-2 rounded-md border border-sky-100">
                                  <div>
                                    <span className="text-slate-400 block text-[9.5px] font-bold uppercase">Nilai PTKP Setahun:</span>
                                    <span className="font-bold text-slate-800 text-xs">{selectedPtkpInfo.annualPtkp}</span>
                                    <span className="text-[10px] text-slate-500 block">({selectedPtkpInfo.monthlyPtkp})</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block text-[9.5px] font-bold uppercase">Batas Bebas Pajak:</span>
                                    <span className="font-semibold text-emerald-700 block">{selectedPtkpInfo.zeroTaxLimit}</span>
                                  </div>
                                </div>
                                <div className="text-[10.5px] text-slate-700 leading-relaxed">
                                  <span className="font-bold text-[#102E50]">Alur: </span>
                                  {selectedPtkpInfo.calculationDetail}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Kolom 2: Metode Pemotongan Pajak */}
                          <div className="flex flex-col gap-2">
                            <label className="block text-xs font-semibold text-slate-700">
                              Metode Pemotongan Pajak <span className="text-[#A8281C]">*</span>
                            </label>
                            <select
                              name="taxMethod"
                              value={formData.taxMethod}
                              onChange={handleChange}
                              className="w-full px-3 py-2 text-sm bg-slate-50/70 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#102E50] font-medium"
                            >
                              <option value="GROSS">GROSS — Pajak dipotong dari gaji karyawan (Standar)</option>
                              <option value="GROSS_UP">GROSS UP — Pajak ditunjang penuh oleh lembaga</option>
                              <option value="NETT">NETT — Gaji diterima bersih tanpa potongan pajak</option>
                            </select>

                            {selectedTaxMethodInfo && (
                              <div className={`p-3 rounded-lg border text-xs flex flex-col gap-2 shadow-2xs ${selectedTaxMethodInfo.bgClass} ${selectedTaxMethodInfo.borderClass}`}>
                                <div className="flex items-center justify-between gap-2 border-b border-slate-200/60 pb-1.5">
                                  <div className="flex items-center gap-1.5 font-bold text-slate-900">
                                    <Receipt className="w-3.5 h-3.5 text-[#102E50] shrink-0" />
                                    <span>{selectedTaxMethodInfo.title}</span>
                                  </div>
                                  <span className={`px-2 py-0.5 text-[10.5px] font-bold rounded-md border ${selectedTaxMethodInfo.badgeClass}`}>
                                    {selectedTaxMethodInfo.badge}
                                  </span>
                                </div>
                                <div className="text-[10.5px] text-slate-700 leading-relaxed">
                                  <span className="font-bold text-slate-900">Konsep: </span>
                                  {selectedTaxMethodInfo.summary}
                                </div>
                                <div className="text-[10.5px] text-slate-700 leading-relaxed bg-white/90 p-2 rounded-md border border-slate-200/60 space-y-1">
                                  <div>
                                    <span className="font-semibold text-slate-900">Ke Karyawan: </span>
                                    <span className="text-slate-600">{selectedTaxMethodInfo.employeeImpact}</span>
                                  </div>
                                  <div>
                                    <span className="font-semibold text-slate-900">Ke Lembaga: </span>
                                    <span className="text-slate-600">{selectedTaxMethodInfo.companyImpact}</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Banner Catatan Penting HR */}
                        <div className="p-3 bg-amber-50/90 rounded-lg border border-amber-200/80 text-[11px] text-amber-950 flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                          <p className="leading-relaxed">
                            <strong>Hal Penting HR:</strong> Dasar Pengenaan Pajak (DPP) dihitung dari penghasilan tunai ditambah premi asuransi kantor (JKK, JKM, BPJS Kes 4%). Potongan bulanan menggunakan persentase TER sesuai status PTKP di atas.
                          </p>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Ringkasan Estimasi Kompensasi Bulanan & Take Home Pay (Live Preview) */}
                  {(() => {
                    const base = Number(formData.baseSalary) || 0;
                    const pos = Number(formData.allowancePosition) || 0;
                    const tra = Number(formData.allowanceTransport) || 0;
                    const com = Number(formData.allowanceCommunication) || 0;
                    const oth = Number(formData.allowanceOther) || 0;
                    const totalAllowances = pos + tra + com + oth;
                    const totalCashGross = base + totalAllowances;
                    const estBpjsKes = Math.round(base * 0.01);
                    const estBpjsTk = Math.round(base * 0.02);
                    const totalBpjsEmp = estBpjsKes + estBpjsTk;

                    // Hitung PPh 21 TER real-time
                    const companyBenefit = calculateCompanyTaxableBenefit(base);
                    const taxableGross = totalCashGross + companyBenefit.totalBenefit;
                    const pphResult = calculateMonthlyPph21Ter(taxableGross, formData.ptkpStatus);
                    const pphRatePercent = (pphResult.terRate * 100).toFixed(2);
                    const estPph21Amount = pphResult.pph21;

                    // Potongan yang memotong gaji tunai:
                    // GROSS: PPh dipotong dari pegawai
                    // GROSS_UP / NETT: PPh ditanggung/ditunjang lembaga
                    const employeeTaxDeduction = formData.taxMethod === "GROSS" ? estPph21Amount : 0;
                    const estimatedTakeHomePay = Math.max(0, totalCashGross - totalBpjsEmp - employeeTaxDeduction);

                    return (
                      <div className="p-4 sm:p-5 bg-gradient-to-br from-sky-50 via-white to-blue-50/70 rounded-xl border border-sky-200/90 text-xs text-sky-950 flex flex-col gap-3 shadow-xs">
                        <div className="flex items-center justify-between flex-wrap gap-2 border-b border-sky-200/70 pb-2">
                          <div className="flex items-center gap-2">
                            <Receipt className="w-4 h-4 text-sky-600" />
                            <span className="font-bold text-[#102E50] text-xs">
                              Pratinjau Estimasi Kompensasi & Gaji Bersih (Live Preview):
                            </span>
                          </div>
                          <span className="font-bold text-xs text-sky-900 bg-sky-100/80 px-2.5 py-0.5 rounded-full border border-sky-200">
                            Simulasi Berdasarkan Input Di Atas
                          </span>
                        </div>

                        {/* 4 Kartu Breakdown Utama */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 text-[11px]">
                          <div className="bg-white p-2.5 rounded-lg border border-sky-100 shadow-2xs">
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">
                              Gaji Pokok:
                            </span>
                            <span className="font-bold text-slate-800 text-xs block mt-0.5">
                              {formatRupiah(base)}
                            </span>
                          </div>

                          <div className="bg-white p-2.5 rounded-lg border border-sky-100 shadow-2xs">
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">
                              Total Tunjangan:
                            </span>
                            <span className="font-bold text-emerald-700 text-xs block mt-0.5">
                              + {formatRupiah(totalAllowances)}
                            </span>
                          </div>

                          <div className="bg-white p-2.5 rounded-lg border border-sky-100 shadow-2xs">
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">
                              Iuran BPJS Pegawai:
                            </span>
                            <span className="font-semibold text-rose-700 text-xs block mt-0.5">
                              - {formatRupiah(totalBpjsEmp)}
                            </span>
                            <span className="text-[9.5px] text-slate-400 block">
                              Kes 1% + TK 2%
                            </span>
                          </div>

                          <div className="bg-white p-2.5 rounded-lg border border-sky-100 shadow-2xs">
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">
                              Estimasi PPh 21 TER:
                            </span>
                            <span className="font-semibold text-rose-700 text-xs block mt-0.5">
                              {formData.taxMethod === "GROSS"
                                ? `- ${formatRupiah(estPph21Amount)}`
                                : `Rp 0 (${formData.taxMethod})`}
                            </span>
                            <span className="text-[9.5px] text-slate-400 block">
                              {pphResult.terCategory.replace("_", " ")} ({pphRatePercent}%)
                            </span>
                          </div>
                        </div>

                        {/* Banner Highlight Take Home Pay */}
                        <div className="p-3 bg-gradient-to-r from-[#102E50] to-[#1a4473] rounded-lg text-white flex items-center justify-between flex-wrap gap-2 shadow-xs">
                          <div>
                            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-200 block">
                              Estimasi Gaji Bersih Diterima Pegawai (Take Home Pay / THP):
                            </span>
                            <span className="text-[11px] text-slate-300">
                              Total Bruto Tunai: {formatRupiah(totalCashGross)}
                            </span>
                          </div>
                          <span className="font-mono font-bold text-base text-[#F2AF3E]">
                            {formatRupiah(estimatedTakeHomePay)} / bulan
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 4: PERBANKAN & AKUN */}
        {currentStep === 4 && (
          <div className="w-full min-w-0 max-w-full flex flex-col gap-6 animate-in fade-in duration-200">
            {/* Header Seksi */}
            <div className="pb-3 border-b border-slate-100 flex items-start justify-between gap-3">
              <div>
                <h3 className="font-bold text-base text-[#102E50] font-heading flex items-center gap-2">
                  <Shield className="w-5 h-5 text-[#102E50]" />
                  <span>Perbankan, Data Sensitif & Akun Pengguna</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Lengkapi data rekening payroll, dokumen kependudukan resmi terenkripsi (AES-256), kartu jaminan sosial BPJS, dan akun login portal.
                </p>
              </div>
              <span className="text-[11px] font-semibold text-sky-800 bg-sky-100/70 px-2.5 py-1 rounded-md border border-sky-200/60 shrink-0">
                Langkah 4 dari 4
              </span>
            </div>

            {/* Peringatan jika ada berkas gagal diunggah */}
            {uploadWarningMessage && (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xl flex items-start gap-2 shadow-xs">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>{uploadWarningMessage}</span>
              </div>
            )}

            {/* KARTU 1: IDENTITAS RESMI KEPENDUDUKAN & DOKUMEN BERPASANGAN */}
            <div className="border border-slate-200/90 rounded-xl p-4 sm:p-5 bg-white shadow-2xs flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#102E50]/10 text-[#102E50] flex items-center justify-center shrink-0">
                    <Key className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-tight">
                      Identitas Resmi Kependudukan & Dokumen Terenkripsi
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      NIK, NPWP, atau Paspor otomatis diamankan dengan enkripsi standar militer AES-256-GCM.
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  AES-256 Terenkripsi
                </span>
              </div>

              {/* Baris 1: NIK atau Paspor/KITAS Berpasangan dengan Dokumen Upload */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formData.citizenship === "WNA" ? (
                  <>
                    <div className="flex flex-col gap-1.5 justify-center">
                      <label className="text-xs font-semibold text-slate-700">
                        Nomor Paspor / KITAS <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="passportKitas"
                        value={formData.passportKitas || ""}
                        onChange={handleChange}
                        placeholder={
                          initialData?.hasPassportKitas
                            ? "Sudah terenkripsi (isi untuk mengubah)"
                            : "Nomor Paspor atau kartu KITAS aktif"
                        }
                        className="w-full px-3 py-2 text-xs font-mono bg-slate-50/70 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#102E50]"
                      />
                      <span className="text-[10px] text-slate-400">
                        Wajib untuk pegawai berstatus Warga Negara Asing (WNA)
                      </span>
                    </div>

                    <DocumentUploadCard
                      label="Foto / Berkas Paspor atau KITAS"
                      description="Halaman identitas paspor atau dokumen izin tinggal resmi"
                      required={true}
                      value={docKtp}
                      onChange={setDocKtp}
                      maxSizeMB={5}
                      accept="application/pdf,image/jpeg,image/png"
                    />
                  </>
                ) : (
                  <>
                    <div className="flex flex-col gap-1.5 justify-center">
                      <label className="text-xs font-semibold text-slate-700">
                        Nomor Induk Kependudukan (NIK) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="nik"
                        value={formData.nik}
                        onChange={(e) => {
                          const numOnly = e.target.value.replace(/\D/g, "");
                          setFormData((prev) => ({ ...prev, nik: numOnly }));
                        }}
                        maxLength={16}
                        placeholder={
                          initialData?.hasNik
                            ? "Sudah terenkripsi (isi untuk mengubah)"
                            : "16 digit NIK sesuai KTP"
                        }
                        className="w-full px-3 py-2 text-xs font-mono bg-slate-50/70 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#102E50]"
                      />
                      <span className="text-[10px] text-slate-400">
                        16 digit angka resmi kependudukan Indonesia
                      </span>
                    </div>

                    <DocumentUploadCard
                      label="Foto Kartu Tanda Penduduk (KTP)"
                      description="Foto e-KTP jelas & terbaca untuk verifikasi identitas resmi"
                      required={true}
                      value={docKtp}
                      onChange={setDocKtp}
                      maxSizeMB={5}
                      accept="application/pdf,image/jpeg,image/png"
                    />
                  </>
                )}
              </div>

              {/* Baris 2: NPWP Berpasangan dengan Dokumen Upload */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                <div className="flex flex-col gap-1.5 justify-center">
                  <label className="text-xs font-semibold text-slate-700">
                    Nomor Pokok Wajib Pajak (NPWP)
                  </label>
                  <input
                    type="text"
                    name="npwp"
                    value={formData.npwp}
                    onChange={handleChange}
                    maxLength={25}
                    placeholder={
                      initialData?.hasNpwp
                        ? "Sudah terenkripsi (isi untuk mengubah)"
                        : "15 atau 16 digit NPWP"
                    }
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50/70 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#102E50]"
                  />
                  <span className="text-[10px] text-slate-400">
                    Jika diisi, wajib melampirkan foto kartu NPWP di sebelah kanan
                  </span>
                </div>

                <DocumentUploadCard
                  label="Foto / Salinan Kartu NPWP"
                  description="Kartu fisik NPWP atau bukti konfirmasi NPWP elektronik (DJP)"
                  required={Boolean(formData.npwp && formData.npwp.trim() !== "")}
                  value={docNpwp}
                  onChange={setDocNpwp}
                  maxSizeMB={5}
                  accept="application/pdf,image/jpeg,image/png"
                />
              </div>
            </div>

            {/* KARTU 2: REKENING BANK PAYROLL & BUKU TABUNGAN */}
            <div className="border border-slate-200/90 rounded-xl p-4 sm:p-5 bg-white shadow-2xs flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#102E50]/10 text-[#102E50] flex items-center justify-center shrink-0">
                    <Receipt className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-tight">
                      Rekening Bank Payroll & Buku Tabungan
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Rekening tujuan pencairan gaji bulanan dan bukti buku tabungan resmi.
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Payroll Disbursement
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Kolom Kiri: Form Rekening */}
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nama Bank Payroll <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="bankName"
                      value={formData.bankName}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-xs bg-slate-50/70 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#102E50]"
                    >
                      <option value="">-- Pilih Bank Payroll --</option>
                      <option value="Bank Mandiri">Bank Mandiri</option>
                      <option value="Bank BCA">Bank BCA</option>
                      <option value="Bank BNI">Bank BNI</option>
                      <option value="Bank BRI">Bank BRI</option>
                      <option value="Bank BSI">Bank BSI (Syariah)</option>
                      <option value="Bank CIMB Niaga">Bank CIMB Niaga</option>
                      <option value="Bank Permata">Bank Permata</option>
                      <option value="Bank Danamon">Bank Danamon</option>
                      <option value="Bank Lainnya">Bank Lainnya</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nomor Rekening Bank <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="bankAccount"
                      value={formData.bankAccount}
                      onChange={handleChange}
                      placeholder={
                        initialData?.hasBankAccount
                          ? "Sudah terenkripsi (isi untuk mengubah)"
                          : "Contoh: 1230009876543"
                      }
                      className="w-full px-3 py-2 text-xs font-mono bg-slate-50/70 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#102E50]"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Disimpan terenkripsi otomatis (AES-256)
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nama Pemilik Rekening (Sesuai Buku Tabungan) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="bankAccountName"
                      value={formData.bankAccountName}
                      onChange={handleChange}
                      placeholder="Nama lengkap sesuai yang tertera di rekening"
                      className="w-full px-3 py-2 text-xs bg-slate-50/70 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#102E50]"
                    />
                  </div>
                </div>

                {/* Kolom Kanan: Upload Buku Tabungan */}
                <div className="flex flex-col justify-start">
                  <DocumentUploadCard
                    label="Foto Buku Tabungan / Halaman Depan Rekening"
                    description="Foto halaman buku tabungan atau tangkapan layar e-statement yang memuat nomor rekening dan nama pemilik"
                    required={true}
                    value={docBankBook}
                    onChange={setDocBankBook}
                    maxSizeMB={5}
                    accept="application/pdf,image/jpeg,image/png"
                  />
                </div>
              </div>
            </div>

            {/* KARTU 3: JAMINAN SOSIAL & KETENAGAKERJAAN (BPJS) */}
            <div className="border border-slate-200/90 rounded-xl p-4 sm:p-5 bg-white shadow-2xs flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#102E50]/10 text-[#102E50] flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-tight">
                      Jaminan Sosial Ketenagakerjaan & Kesehatan (BPJS)
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Nomor kepesertaan dan kartu BPJS Kesehatan serta BPJS Ketenagakerjaan (Disarankan).
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  Program Jamsostek
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* BPJS Kesehatan */}
                <div className="flex flex-col gap-2.5 p-3 rounded-lg border border-slate-200/80 bg-slate-50/30">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nomor BPJS Kesehatan (13 Digit)
                    </label>
                    <input
                      type="text"
                      name="bpjsKesehatanNo"
                      value={formData.bpjsKesehatanNo || ""}
                      onChange={(e) => {
                        const numOnly = e.target.value.replace(/\D/g, "");
                        setFormData((prev) => ({ ...prev, bpjsKesehatanNo: numOnly }));
                      }}
                      maxLength={13}
                      placeholder={
                        initialData?.hasBpjsKes
                          ? "Sudah terenkripsi (isi untuk mengubah)"
                          : "Contoh: 0001234567890"
                      }
                      className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#102E50]"
                    />
                  </div>
                  <DocumentUploadCard
                    label="Kartu BPJS Kesehatan"
                    description="Kartu fisik atau kartu digital e-ID BPJS Kesehatan"
                    required={false}
                    value={docBpjsKes}
                    onChange={setDocBpjsKes}
                    maxSizeMB={5}
                    accept="application/pdf,image/jpeg,image/png"
                  />
                </div>

                {/* BPJS Ketenagakerjaan */}
                <div className="flex flex-col gap-2.5 p-3 rounded-lg border border-slate-200/80 bg-slate-50/30">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nomor BPJS Ketenagakerjaan (11 Digit)
                    </label>
                    <input
                      type="text"
                      name="bpjsKetenagakerjaanNo"
                      value={formData.bpjsKetenagakerjaanNo || ""}
                      onChange={(e) => {
                        const numOnly = e.target.value.replace(/\D/g, "");
                        setFormData((prev) => ({ ...prev, bpjsKetenagakerjaanNo: numOnly }));
                      }}
                      maxLength={11}
                      placeholder={
                        initialData?.hasBpjsTk
                          ? "Sudah terenkripsi (isi untuk mengubah)"
                          : "Contoh: 12345678901"
                      }
                      className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#102E50]"
                    />
                  </div>
                  <DocumentUploadCard
                    label="Kartu BPJS Ketenagakerjaan"
                    description="Kartu peserta KPJ atau kartu digital Jamsostek"
                    required={false}
                    value={docBpjsTk}
                    onChange={setDocBpjsTk}
                    maxSizeMB={5}
                    accept="application/pdf,image/jpeg,image/png"
                  />
                </div>
              </div>
            </div>

            {/* KARTU 4: BERKAS & DOKUMEN PENDUKUNG LAINNYA (OPSIONAL) */}
            <div className="border border-slate-200/90 rounded-xl p-4 sm:p-5 bg-white shadow-2xs flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#102E50]/10 text-[#102E50] flex items-center justify-center shrink-0">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-tight">
                      Berkas & Dokumen Pendukung Tambahan (Opsional)
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      SKCK, Surat Keterangan Sehat, atau berkas pendukung lainnya.
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200/80">
                  Opsional
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DocumentUploadCard
                  label="Surat Keterangan Catatan Kepolisian (SKCK)"
                  description="SKCK yang masih berlaku dari kepolisian (PDF / JPG maks 5 MB)"
                  required={false}
                  value={docSkck}
                  onChange={setDocSkck}
                  maxSizeMB={5}
                  accept="application/pdf,image/jpeg,image/png"
                />

                <DocumentUploadCard
                  label="Surat Keterangan Sehat / Bebas Narkoba"
                  description="Surat keterangan sehat dokter atau klinik (PDF / JPG maks 5 MB)"
                  required={false}
                  value={docHealthCert}
                  onChange={setDocHealthCert}
                  maxSizeMB={5}
                  accept="application/pdf,image/jpeg,image/png"
                />
              </div>

              {/* Dokumen Tambahan Lainnya (Multi-berkas) */}
              <div className="pt-3 border-t border-slate-100 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-slate-800">
                      Dokumen Lainnya
                    </h5>
                    <p className="text-[11px] text-slate-500">
                      Unggah berkas lain seperti sertifikat keahlian, rekomendasi, atau portofolio.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddAdditionalDoc}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Tambah Berkas Lainnya</span>
                  </button>
                </div>

                {additionalDocs.length > 0 && (
                  <div className="flex flex-col gap-3">
                    {additionalDocs.map((docItem, index) => (
                      <div
                        key={docItem.id}
                        className="p-3 rounded-lg border border-slate-200 bg-slate-50/40 flex flex-col gap-2.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <input
                            type="text"
                            value={docItem.title}
                            onChange={(e) =>
                              handleUpdateAdditionalDocTitle(docItem.id, e.target.value)
                            }
                            placeholder={`Nama / Keterangan Dokumen #${index + 1} (contoh: Portofolio Riset)`}
                            className="text-xs font-semibold px-2.5 py-1.5 rounded border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#102E50] w-full sm:w-1/2"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveAdditionalDoc(docItem.id)}
                            className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1 font-semibold shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Hapus</span>
                          </button>
                        </div>
                        <DocumentUploadCard
                          label={docItem.title || `Berkas #${index + 1}`}
                          required={false}
                          value={{
                            file: docItem.file,
                            fileName: docItem.fileName,
                            fileSize: docItem.fileSize,
                            status: docItem.status,
                            error: docItem.error,
                          }}
                          onChange={(fs) => handleUpdateAdditionalDocFile(docItem.id, fs)}
                          maxSizeMB={10}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* KARTU 5: PEMBUATAN AKUN PENGGUNA PORTAL HRIS */}
            {mode === "create" && (
              <div className="p-5 bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-xl border border-blue-200/60 flex flex-col gap-4 shadow-2xs">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="createUserAccount"
                    name="createUserAccount"
                    checked={formData.createUserAccount}
                    onChange={handleChange}
                    className="w-4 h-4 mt-0.5 rounded text-[#102E50] focus:ring-[#102E50] cursor-pointer"
                  />
                  <div className="flex flex-col">
                    <label
                      htmlFor="createUserAccount"
                      className="font-bold text-sm text-[#102E50] cursor-pointer flex items-center gap-1.5"
                    >
                      <span>Otomatis Buat Akun Pengguna Portal HRIS</span>
                      <span className="text-[10px] font-semibold uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                        Rekomendasi
                      </span>
                    </label>
                    <span className="text-xs text-slate-600 mt-0.5">
                      Sistem akan membuat akun login aktif dengan email kantor (
                      {formData.workEmail || "nama@pspk.id"}), menghasilkan kata sandi sementara
                      secara otomatis, dan mengirimkannya ke email pribadi (
                      {formData.personalEmail || "email pribadi"}).
                    </span>
                  </div>
                </div>

                {formData.createUserAccount && (
                  <div className="pt-3 border-t border-slate-200/80 flex flex-col gap-4 animate-in fade-in duration-150">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Pilih Hak Akses / Peran Sistem (Role){" "}
                        <span className="text-[#A8281C]">*</span>
                      </label>
                      <select
                        name="accountRole"
                        value={formData.accountRole}
                        onChange={handleChange}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#102E50]"
                      >
                        {availableRoles.map((r) => (
                          <option key={r.key} value={r.key}>
                            {r.name} - {r.description}
                          </option>
                        ))}
                      </select>
                      <span className="text-[11px] text-slate-500 mt-1 block">
                        Peran ini menentukan hak akses serta menu yang dapat dibuka oleh staf di dalam portal.
                      </span>
                    </div>

                    {/* Ringkasan Akun yang akan dibuat */}
                    <div className="p-3.5 bg-white/90 rounded-lg border border-slate-200/90 text-xs flex flex-col gap-2">
                      <div className="font-semibold text-slate-700 flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5 text-[#F2AF3E]" />
                        <span>Rincian Otomatisasi Kredensial Login:</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 pt-1">
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">
                            Email Login Kantor
                          </span>
                          <span className="font-mono font-semibold text-slate-800 text-xs">
                            {formData.workEmail || "(Wajib diisi di Langkah 1)"}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">
                            Kata Sandi Awal
                          </span>
                          <span className="text-slate-700 font-semibold text-xs flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            Auto-generated aman (≥ 6 karakter)
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">
                            Tujuan Pengiriman Kredensial
                          </span>
                          <span className="font-semibold text-slate-800 text-xs">
                            {formData.personalEmail || "(Wajib diisi di Langkah 1)"}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">
                            Notifikasi Email
                          </span>
                          <span className="text-emerald-700 font-medium text-xs">
                            Otomatis terkirim ke email pribadi saat pendaftaran berhasil
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* KARTU 6: RINGKASAN KELENGKAPAN BERKAS & KONFIRMASI DATA */}
            {(() => {
              const currentDept = departments.find((d) => d.id === formData.currentDepartmentId);
              const currentPos = currentDept?.positions.find((p) => p.id === formData.currentPositionId);
              const base = Number(formData.baseSalary) || 0;
              const pos = Number(formData.allowancePosition) || 0;
              const tra = Number(formData.allowanceTransport) || 0;
              const com = Number(formData.allowanceCommunication) || 0;
              const oth = Number(formData.allowanceOther) || 0;
              const totalAllowances = pos + tra + com + oth;
              const totalGross = base + totalAllowances;
              const estBpjs = Math.round(base * 0.03);
              const companyBenefit = calculateCompanyTaxableBenefit(base);
              const taxableGross = totalGross + companyBenefit.totalBenefit;
              const pphResult = calculateMonthlyPph21Ter(taxableGross, formData.ptkpStatus);
              const pphDeduction = formData.taxMethod === "GROSS" ? pphResult.pph21 : 0;
              const thpFinal = Math.max(0, totalGross - estBpjs - pphDeduction);
              const selectedPtkp = getPtkpExplanation(formData.ptkpStatus);

              const isWna = formData.citizenship === "WNA";
              const selectedLocation = workLocations.find((w) => w.id === formData.workLocationId);
              const selectedEntity = legalEntities.find((l) => l.id === formData.legalEntityId);
              const checklistItems: ChecklistDocItem[] = [
                {
                  id: "cv",
                  label: "Curriculum Vitae (CV) / Resume",
                  step: 1,
                  isRequired: false,
                  isUploaded: Boolean(docCv.file || initialData?.hasCv),
                },
                {
                  id: "diploma",
                  label: "Ijazah & Transkrip Terakhir",
                  step: 1,
                  isRequired: false,
                  isUploaded: Boolean(docDiploma.file || initialData?.hasDiploma),
                },
                {
                  id: "family_card",
                  label: "Kartu Keluarga (KK)",
                  step: 1,
                  isRequired: false,
                  isUploaded: Boolean(docFamilyCard.file || initialData?.hasFamilyCard),
                },
                ...((formData.maritalStatus === "MARRIED" || formData.ptkpStatus.startsWith("K_") || initialData?.hasMarriageCert)
                  ? [
                      {
                        id: "marriage_cert",
                        label: "Buku Nikah / Akta Perkawinan",
                        step: 1,
                        isRequired: false,
                        isUploaded: Boolean(docMarriageCert.file || initialData?.hasMarriageCert),
                      },
                    ]
                  : []),
                {
                  id: "paklaring",
                  label: "Paklaring / Surat Pengalaman Kerja",
                  step: 2,
                  isRequired: false,
                  isUploaded: Boolean(docPreviousEmployerLetter.file || initialData?.hasPreviousEmployerLetter),
                },
                {
                  id: "offer_letter",
                  label: "Offer Letter Ditandatangani",
                  step: 2,
                  isRequired: false,
                  isUploaded: Boolean(docOfferLetter.file || initialData?.hasOfferLetter),
                },
                {
                  id: "contract",
                  label: "Dokumen Kontrak Kerja / PKWT",
                  step: 3,
                  isRequired: formData.employmentType === "FIXED_TERM",
                  isUploaded: Boolean(contractFile || formData.contractDocumentKey),
                },
                {
                  id: "nda",
                  label: "NDA / Pakta Integritas Pegawai",
                  step: 3,
                  isRequired: false,
                  isUploaded: Boolean(docNda.file || initialData?.hasNda),
                },
                {
                  id: "ktp",
                  label: isWna ? "No. Paspor / KITAS & Dokumen" : "Foto KTP (Identitas Resmi)",
                  step: 4,
                  isRequired: true,
                  isUploaded: isWna
                    ? Boolean(formData.passportKitas || docKtp.file || initialData?.hasPassportKitas)
                    : Boolean(docKtp.file || initialData?.hasNik),
                },
                {
                  id: "npwp",
                  label: "Foto Kartu NPWP",
                  step: 4,
                  isRequired: Boolean(formData.npwp && formData.npwp.trim() !== ""),
                  isUploaded: Boolean(docNpwp.file || initialData?.hasNpwp),
                },
                {
                  id: "bank_book",
                  label: "Foto Buku Tabungan / Bukti Rekening",
                  step: 4,
                  isRequired: true,
                  isUploaded: Boolean(docBankBook.file || initialData?.hasBankAccount),
                },
                {
                  id: "bpjs_kes",
                  label: "Kartu BPJS Kesehatan",
                  step: 4,
                  isRequired: false,
                  isUploaded: Boolean(docBpjsKes.file || initialData?.hasBpjsKes),
                },
                {
                  id: "bpjs_tk",
                  label: "Kartu BPJS Ketenagakerjaan",
                  step: 4,
                  isRequired: false,
                  isUploaded: Boolean(docBpjsTk.file || initialData?.hasBpjsTk),
                },
              ];

              return (
                <div className="flex flex-col gap-4">
                  {/* Kartu Ringkasan Checklist Dokumen */}
                  <DocumentChecklistSummary
                    items={checklistItems}
                    onJumpToStep={(stepNumber) => setCurrentStep(stepNumber)}
                  />

                  {/* Kartu Konfirmasi Data 4 Kolom */}
                  <div className="p-5 bg-gradient-to-br from-slate-50 via-white to-sky-50/50 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col gap-3.5">
                    <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
                      <div className="flex items-center gap-2">
                        <FileCheck className="w-4 h-4 text-[#102E50]" />
                        <h4 className="text-xs font-bold text-[#102E50] uppercase tracking-wider">
                          Konfirmasi Ringkasan Data {mode === "create" ? "Pendaftaran" : "Pembaruan"} Pegawai
                        </h4>
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-md border border-emerald-200/60">
                        Siap Disimpan
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                      {/* Kolom 1: Profil & Penempatan Awal */}
                      <div className="p-3 bg-white rounded-lg border border-slate-200/80 flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Identitas & Penempatan Awal
                        </span>
                        <span className="font-bold text-slate-900 text-xs truncate">
                          {formData.fullName || "(Belum diisi)"}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          NIP: {formData.employeeNo || "-"}
                        </span>
                        <span className="text-[11px] text-slate-600 truncate">
                          {currentDept?.name || "Divisi belum dipilih"}
                        </span>
                        <span className="text-[11px] font-semibold text-[#102E50] truncate">
                          {currentPos?.title || "Posisi belum dipilih"}
                        </span>
                        <div className="pt-1 mt-0.5 border-t border-slate-100 flex flex-col gap-0.5 text-[10.5px] text-slate-500">
                          <span>
                            <strong className="text-slate-700">Mulai:</strong> {formData.joinDate || "-"} ({formData.status})
                          </span>
                          <span className="truncate">
                            <strong className="text-slate-700">Lokasi:</strong> {selectedLocation?.name || "PSPK"}
                          </span>
                          {selectedEntity && (
                            <span className="truncate text-[10px] text-slate-400">
                              {selectedEntity.name}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Kolom 2: Paket Kompensasi & Estimasi THP */}
                      <div className="p-3 bg-white rounded-lg border border-slate-200/80 flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Paket Kompensasi & THP
                        </span>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 text-[11px]">Gaji Pokok:</span>
                          <span className="font-semibold text-slate-900 font-mono text-[11px]">
                            {formatRupiah(base)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 text-[11px]">Tunjangan:</span>
                          <span className="font-semibold text-emerald-700 font-mono text-[11px]">
                            + {formatRupiah(totalAllowances)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 text-[11px]">Total Bruto:</span>
                          <span className="font-bold text-slate-900 font-mono text-[11px]">
                            {formatRupiah(totalGross)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-slate-100 mt-0.5">
                          <span className="font-bold text-emerald-800 text-[11px]">Est. THP Bersih:</span>
                          <span className="font-bold text-emerald-700 font-mono text-xs">
                            {formatRupiah(thpFinal)}
                          </span>
                        </div>
                      </div>

                      {/* Kolom 3: Perpajakan & Payroll */}
                      <div className="p-3 bg-white rounded-lg border border-slate-200/80 flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Pajak & Rekening Payroll
                        </span>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 text-[11px]">PTKP:</span>
                          <span className="font-semibold text-slate-900 text-[11px]">
                            {formData.ptkpStatus.replace("_", "/")} ({selectedPtkp?.terCategory || "TER A"})
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 text-[11px]">Metode:</span>
                          <span className="font-semibold text-[#102E50] text-[11px]">
                            {formData.taxMethod}
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-slate-100 mt-0.5">
                          <span className="text-slate-500 text-[11px]">Bank:</span>
                          <span className="font-semibold text-slate-800 text-[11px] truncate">
                            {formData.bankName || "Belum dipilih"}
                          </span>
                        </div>
                      </div>

                      {/* Kolom 4: Akun & Hak Akses */}
                      <div className="p-3 bg-white rounded-lg border border-slate-200/80 flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Akun & Akses Sistem
                        </span>
                        {formData.createUserAccount ? (
                          <>
                            <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Buat Akun Otomatis
                            </span>
                            <span className="text-[11px] text-slate-600 font-mono truncate">
                              {formData.workEmail || "-"}
                            </span>
                            <span className="text-[11px] text-slate-700 font-semibold capitalize mt-0.5">
                              Role: {formData.accountRole.replace("_", " ")}
                            </span>
                          </>
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">
                            Tanpa pembuatan akun otomatis
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Stepper Navigation Buttons */}
        <div className="w-full min-w-0 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-slate-200">
          <div>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handlePrev}
                disabled={isSubmitting}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-2 min-h-[42px] rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200 transition-all cursor-pointer active:scale-[0.98]"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Sebelumnya</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => router.push("/karyawan")}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none px-4 py-2.5 sm:py-2 min-h-[42px] rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-colors cursor-pointer text-center"
            >
              Batal
            </button>

            {currentStep < 4 ? (
              <button
                key="btn-next-step"
                type="button"
                onClick={handleNext}
                className="flex-2 sm:flex-none inline-flex items-center justify-center gap-1.5 px-5 py-2.5 sm:py-2 min-h-[42px] rounded-lg text-xs font-semibold bg-[#102E50] text-white hover:bg-[#0c233d] transition-all cursor-pointer active:scale-[0.98] shadow-xs"
              >
                <span>Langkah Selanjutnya</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                key="btn-submit-final"
                type="submit"
                disabled={isSubmitting || stepCooldown}
                className="flex-2 sm:flex-none inline-flex items-center justify-center gap-1.5 px-6 py-2.5 sm:py-2 min-h-[42px] rounded-lg text-xs font-semibold bg-[#feba48] text-[#102E50] hover:bg-[#e5a63d] transition-all cursor-pointer active:scale-[0.98] shadow-xs disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>
                  {isSubmitting
                    ? "Menyimpan..."
                    : mode === "create"
                      ? "Daftarkan Pegawai"
                      : "Simpan Perubahan"}
                </span>
              </button>
            )}
          </div>
        </div>
      </form>

      {/* Modal Sukses Kredensial Akun Pegawai Baru */}
      {createdCredentials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <h3 className="text-lg font-bold text-[#102E50] font-heading">
                  Pendaftaran Pegawai & Akun Berhasil!
                </h3>
                <p className="text-xs text-slate-500">
                  Data pegawai {createdCredentials.fullName} ({createdCredentials.employeeNo}) telah
                  tersimpan.
                </p>
              </div>
            </div>

            {/* Credential Card */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Kredensial Login Pegawai
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#102E50]/10 text-[#102E50]">
                  {createdCredentials.roleName || "Karyawan"}
                </span>
              </div>

              <div className="flex flex-col gap-2 pt-1 font-mono text-xs">
                <div className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-200">
                  <span className="text-slate-500 font-sans text-[11px]">Email Kantor:</span>
                  <span className="font-bold text-slate-900">{createdCredentials.workEmail}</span>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-amber-200 bg-amber-50/30">
                  <span className="text-slate-500 font-sans text-[11px]">
                    Kata Sandi Sementara:
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded font-mono">
                      {createdCredentials.temporaryPassword}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (createdCredentials.temporaryPassword) {
                          navigator.clipboard.writeText(createdCredentials.temporaryPassword);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }
                      }}
                      className="p-1 text-slate-500 hover:text-[#102E50] hover:bg-slate-100 rounded transition-colors cursor-pointer"
                      title="Salin Kata Sandi"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Status pengiriman email */}
              <div className="text-[11px] p-2.5 rounded-lg border bg-white flex items-start gap-2 text-slate-600">
                <Mail className="w-4 h-4 text-[#102E50] shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-800">
                    {createdCredentials.emailSent
                      ? "Kredensial Terkirim ke Email Pribadi"
                      : "Status Pengiriman Email"}
                  </span>
                  <span className="text-slate-500">
                    {createdCredentials.emailSent
                      ? `Informasi akun telah dikirim ke: ${createdCredentials.personalEmail}`
                      : `${createdCredentials.emailMessage} (Silakan berikan kata sandi di atas secara langsung kepada staf).`}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  const loginUrl = `${(typeof window !== "undefined" && window.location?.origin ? window.location.origin : process.env.NEXT_PUBLIC_HRIS_URL || "http://localhost:3001").replace(/\/+$/, "")}/login`;
                  const text = `Kredensial Akses Portal HRIS PSPK:\nNama: ${createdCredentials.fullName}\nEmail Login: ${createdCredentials.workEmail}\nKata Sandi Sementara: ${createdCredentials.temporaryPassword}\nHak Akses: ${createdCredentials.roleName}\nLink: ${loginUrl}`;
                  navigator.clipboard.writeText(text);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="px-4 py-2 rounded-lg text-xs font-semibold border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copied ? "Tersalin!" : "Salin Semua Info"}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    router.push(`/karyawan/${createdCredentials.id}`);
                    router.refresh();
                  }}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#102E50] text-white hover:bg-[#0c233d] transition-colors cursor-pointer"
                >
                  Lihat Profil Pegawai
                </button>
                <button
                  type="button"
                  onClick={() => {
                    router.push("/karyawan");
                    router.refresh();
                  }}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#feba48] text-[#102E50] hover:bg-[#e5a63d] transition-colors cursor-pointer"
                >
                  Ke Direktori Pegawai
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Create Tipe Ikatan Kerja Modal */}
      {isQuickCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#102E50]/10 text-[#102E50] flex items-center justify-center font-bold">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm leading-tight">
                    Tambah Tipe Ikatan Kerja Baru
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Master data baru akan langsung dapat dipilih pada kontrak ini
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg text-sm"
              >
                ✕
              </button>
            </div>

            {quickCreateError && (
              <div className="mb-3 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{quickCreateError}</span>
              </div>
            )}

            <form onSubmit={handleQuickCreateEmploymentType} className="space-y-3.5">
              {/* Kode */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kode Ikatan Kerja <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={quickCreateForm.code}
                  onChange={(e) =>
                    setQuickCreateForm((prev) => ({
                      ...prev,
                      code: e.target.value.toUpperCase().replace(/\s+/g, "_"),
                    }))
                  }
                  placeholder="Contoh: PKWT_KONSULTAN"
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50]"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Identifikasi unik dalam sistem (otomatis kapital & underscore)
                </span>
              </div>

              {/* Nama */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Ikatan Kerja <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={quickCreateForm.name}
                  onChange={(e) =>
                    setQuickCreateForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Contoh: PKWT Konsultan Senior"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50]"
                />
              </div>

              {/* Kategori Sistem & Skema Upah */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kategori Laporan <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={quickCreateForm.category}
                    onChange={(e) =>
                      setQuickCreateForm((prev) => ({
                        ...prev,
                        category: e.target.value as
                          "PERMANENT" | "FIXED_TERM" | "PART_TIME_PROJECT",
                      }))
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="PERMANENT">Pegawai Tetap</option>
                    <option value="FIXED_TERM">PKWT Berjangka</option>
                    <option value="PART_TIME_PROJECT">Paruh Waktu</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Skema Upah <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={quickCreateForm.wageType}
                    onChange={(e) =>
                      setQuickCreateForm((prev) => ({
                        ...prev,
                        wageType: e.target.value as "MONTHLY" | "HOURLY",
                      }))
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white font-medium"
                  >
                    <option value="MONTHLY">Gaji Bulanan</option>
                    <option value="HOURLY">Per Jam (Timesheet)</option>
                  </select>
                </div>
              </div>

              {/* Tarif Acuan Per Jam (Muncul jika HOURLY) */}
              {quickCreateForm.wageType === "HOURLY" && (
                <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 text-xs animate-in fade-in duration-150">
                  <label className="block text-xs font-semibold text-amber-950 mb-1">
                    Tarif Acuan Per Jam Bawaan (Rp) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min="1000"
                      step="1000"
                      value={quickCreateForm.defaultHourlyRate}
                      onChange={(e) =>
                        setQuickCreateForm((prev) => ({
                          ...prev,
                          defaultHourlyRate: e.target.value,
                        }))
                      }
                      placeholder="30000"
                      className="w-full pl-3 pr-12 py-2 text-xs font-mono border border-amber-300 bg-white rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-amber-700 font-medium">
                      / jam
                    </span>
                  </div>
                  <span className="text-[10px] text-amber-800/90 mt-1 block">
                    Tarif default yang otomatis terisi saat memilih ikatan kerja ini.
                  </span>
                </div>
              )}

              {/* Deskripsi */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Deskripsi / Keterangan
                </label>
                <textarea
                  rows={2}
                  value={quickCreateForm.description}
                  onChange={(e) =>
                    setQuickCreateForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Keterangan peruntukan ikatan kerja..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50]"
                />
              </div>

              {/* Tombol Simpan */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsQuickCreateModalOpen(false)}
                  disabled={quickCreatePending}
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={quickCreatePending}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-[#102E50] text-white hover:bg-[#102E50]/90 rounded-lg transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {quickCreatePending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Simpan & Pilih Tipe Ini</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
