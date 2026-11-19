"use client";

import React, { createContext, useContext, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toDateString } from "@pspk/shared";
import {
  createEmployeeAction,
  updateEmployeeAction,
  generateNextEmployeeNoAction,
  checkEmployeeNoAvailabilityAction,
  uploadContractFileAction,
  uploadEmployeePhotoAction,
} from "@/server/actions/employee.actions";
import {
  uploadEmployeeDocumentAction,
  DocumentCategory,
} from "@/server/actions/document.actions";
import { CreateEmployeeInput, UpdateEmployeeInput } from "@/server/schemas/employee.schema";
import {
  AddressData,
  FamilyMemberItem,
  EducationItem,
  TrainingItem,
  WorkExperienceItem,
  UploadedFileState,
  AdditionalDocumentItem,
} from "../types/employee-form.types";
import {
  FormMode,
  CreateStepNumber,
  EditCategoryKey,
  EmployeeFormData,
  ValidationErrorItem,
  WizardEmployeeFormProps,
  DepartmentOption,
  ManagerOption,
  RoleOption,
  EmploymentTypeOption,
  WorkLocationOption,
  LegalEntityOption,
} from "./types";
import {
  EmployeeStatus,
  EmploymentType,
  Gender,
  MaritalStatus,
  PtkpStatus,
  TaxMethod,
  Religion,
  BloodType,
  FamilyRelation,
  EducationLevel,
} from "@pspk/db";

export interface CreatedCredentialsData {
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
}

interface EmployeeFormContextType {
  mode: FormMode;
  currentStep: CreateStepNumber;
  activeCategory: EditCategoryKey;
  formData: EmployeeFormData;
  updateField: <K extends keyof EmployeeFormData>(key: K, val: EmployeeFormData[K]) => void;

  // Addresses
  addressKtp: AddressData;
  addressDomicile: AddressData;
  isDomicileSameAsKtp: boolean;
  setAddressKtp: (data: AddressData) => void;
  setAddressDomicile: (data: AddressData) => void;
  handleToggleSameAddress: (same: boolean) => void;

  // Profile photo
  profilePhoto: UploadedFileState;
  profilePhotoPreview: string | null;
  handleProfilePhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  clearProfilePhoto: () => void;

  // Dynamic tables
  familyMembers: FamilyMemberItem[];
  setFamilyMembers: React.Dispatch<React.SetStateAction<FamilyMemberItem[]>>;
  educations: EducationItem[];
  setEducations: React.Dispatch<React.SetStateAction<EducationItem[]>>;
  trainings: TrainingItem[];
  setTrainings: React.Dispatch<React.SetStateAction<TrainingItem[]>>;
  workExperiences: WorkExperienceItem[];
  setWorkExperiences: React.Dispatch<React.SetStateAction<WorkExperienceItem[]>>;
  additionalDocuments: AdditionalDocumentItem[];
  setAdditionalDocuments: React.Dispatch<React.SetStateAction<AdditionalDocumentItem[]>>;

  // Documents
  docCv: UploadedFileState;
  setDocCv: (s: UploadedFileState) => void;
  docDiploma: UploadedFileState;
  setDocDiploma: (s: UploadedFileState) => void;
  docFamilyCard: UploadedFileState;
  setDocFamilyCard: (s: UploadedFileState) => void;
  docPreviousEmployerLetter: UploadedFileState;
  setDocPreviousEmployerLetter: (s: UploadedFileState) => void;
  docOfferLetter: UploadedFileState;
  setDocOfferLetter: (s: UploadedFileState) => void;
  docNda: UploadedFileState;
  setDocNda: (s: UploadedFileState) => void;
  docMarriageCert: UploadedFileState;
  setDocMarriageCert: (s: UploadedFileState) => void;
  docKtp: UploadedFileState;
  setDocKtp: (s: UploadedFileState) => void;
  docNpwp: UploadedFileState;
  setDocNpwp: (s: UploadedFileState) => void;
  docBankBook: UploadedFileState;
  setDocBankBook: (s: UploadedFileState) => void;
  docBpjsKes: UploadedFileState;
  setDocBpjsKes: (s: UploadedFileState) => void;
  docBpjsTk: UploadedFileState;
  setDocBpjsTk: (s: UploadedFileState) => void;
  docSkck: UploadedFileState;
  setDocSkck: (s: UploadedFileState) => void;
  docHealthCert: UploadedFileState;
  setDocHealthCert: (s: UploadedFileState) => void;
  docContract: UploadedFileState;
  setDocContract: (s: UploadedFileState) => void;
  contractFile: File | null;
  setContractFile: (f: File | null) => void;

  // NIP live check & generator
  nipChecking: boolean;
  nipStatus: { available: boolean; message: string } | null;
  handleGenerateNip: () => Promise<void>;
  handleCheckNipAvailability: (nip: string) => Promise<void>;

  // Master data
  departments: DepartmentOption[];
  managers: ManagerOption[];
  roles?: RoleOption[];
  isSuperAdmin: boolean;
  employmentTypesList: EmploymentTypeOption[];
  setEmploymentTypesList: React.Dispatch<React.SetStateAction<EmploymentTypeOption[]>>;
  workLocations: WorkLocationOption[];
  legalEntities: LegalEntityOption[];

  // Dirty state tracking for edit mode
  dirtyCategories: Set<EditCategoryKey>;
  isDirty: boolean;

  // Errors & validation
  errors: ValidationErrorItem[];
  serverError: string | null;
  setServerError: (msg: string | null) => void;
  validateStep: (step: CreateStepNumber) => boolean;
  validateAll: () => boolean;

  // Navigation
  goToStep: (step: CreateStepNumber) => void;
  nextStep: () => void;
  prevStep: () => void;
  setActiveCategory: (cat: EditCategoryKey) => void;

  // Submitting
  isSubmitting: boolean;
  uploadWarningMessage: string | null;
  createdCredentials: CreatedCredentialsData | null;
  setCreatedCredentials: (c: CreatedCredentialsData | null) => void;
  handleSubmit: (e?: React.FormEvent) => Promise<void>;

  // Quick create employment type modal state
  isQuickCreateModalOpen: boolean;
  setIsQuickCreateModalOpen: (open: boolean) => void;
}

const EmployeeFormContext = createContext<EmployeeFormContextType | null>(null);

export function useEmployeeForm() {
  const ctx = useContext(EmployeeFormContext);
  if (!ctx) {
    throw new Error("useEmployeeForm must be used within an EmployeeFormProvider");
  }
  return ctx;
}

export function EmployeeFormProvider({
  children,
  props,
}: {
  children: React.ReactNode;
  props: WizardEmployeeFormProps;
}) {
  const router = useRouter();
  const {
    mode,
    departments,
    managers,
    roles,
    isSuperAdmin = false,
    initialData,
    employmentTypes = [],
    workLocations = [],
    legalEntities = [],
  } = props;

  const [currentStep, setCurrentStep] = useState<CreateStepNumber>(1);
  const [activeCategory, setActiveCategory] = useState<EditCategoryKey>("identitas");
  const [dirtyCategories, setDirtyCategories] = useState<Set<EditCategoryKey>>(new Set());

  // Employment Type Master List State
  const [employmentTypesList, setEmploymentTypesList] = useState(employmentTypes || []);
  const [isQuickCreateModalOpen, setIsQuickCreateModalOpen] = useState(false);

  // Active Contract helper
  const initialActiveContract =
    initialData?.contracts?.find((c) => c.status === "ACTIVE") || initialData?.contracts?.[0];

  const extractContractNumber = (notesStr?: string | null) => {
    if (!notesStr) return "";
    const match = notesStr.match(/\[Nomor:\s*([^\]]+)\]/);
    return match && match[1] ? match[1].trim() : "";
  };

  const cleanContractNotes = (notesStr?: string | null) => {
    if (!notesStr) return "";
    return notesStr.replace(/\[Nomor:\s*[^\]]+\]\s*/, "").trim();
  };

  // Main Form Data State
  const [formData, setFormData] = useState<EmployeeFormData>({
    fullName: initialData?.fullName || "",
    nickname: initialData?.nickname || "",
    workEmail: initialData?.workEmail || "",
    personalEmail: initialData?.personalEmail || "",
    phone: initialData?.phone || "",
    birthDate: initialData?.birthDate ? toDateString(initialData.birthDate) : "",
    birthPlace: initialData?.birthPlace || "",
    gender: initialData?.gender || "MALE",
    religion: (initialData?.religion as Religion) || "",
    bloodType: (initialData?.bloodType as BloodType) || "",
    maritalStatus: initialData?.maritalStatus || "SINGLE",
    motherName: initialData?.motherName || "",
    landlinePhone: initialData?.landlinePhone || "",
    address: initialData?.address || "",
    emergencyContactName: initialData?.emergencyContactName || "",
    emergencyContactPhone: initialData?.emergencyContactPhone || "",
    emergencyContactRelation: initialData?.emergencyContactRelation || "",

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
    probationEndDate: initialData?.probationEndDate
      ? toDateString(initialData.probationEndDate)
      : "",
    endDate: initialData?.endDate ? toDateString(initialData.endDate) : "",

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
      initialData?.salaryComponents?.find((sc) => sc.code === "ALLOWANCE_COMMUNICATION")?.amount ??
      "",
    allowanceOther:
      initialData?.salaryComponents?.find((sc) => sc.code === "ALLOWANCE_OTHER")?.amount ?? "",
    allowanceOtherNote: "",
    contractNumber: extractContractNumber(initialActiveContract?.notes),
    contractDocumentKey: initialActiveContract?.documentKey || "",
    contractNotes: cleanContractNotes(initialActiveContract?.notes),

    nik: "",
    npwp: "",
    passportKitas: "",
    bpjsKesehatanNo: "",
    bpjsKetenagakerjaanNo: "",
    citizenship: (initialData?.citizenship as "WNI" | "WNA") || "WNI",
    ptkpStatus: (initialData?.ptkpStatus as PtkpStatus) || "TK_0",
    taxMethod: (initialData?.taxMethod as TaxMethod) || "GROSS",
    bankName: initialData?.bankName || "",
    bankAccount: "",
    bankAccountName: initialData?.bankAccountName || "",
    createUserAccount: mode === "create",
    accountRole: "staff",
  });

  const markDirty = useCallback((cat: EditCategoryKey) => {
    setDirtyCategories((prev) => new Set(prev).add(cat));
  }, []);

  const updateField = useCallback(
    <K extends keyof EmployeeFormData>(key: K, val: EmployeeFormData[K]) => {
      setFormData((prev) => ({ ...prev, [key]: val }));

      // Map key to Category
      let cat: EditCategoryKey = "identitas";
      if (
        [
          "fullName",
          "nickname",
          "workEmail",
          "personalEmail",
          "phone",
          "birthDate",
          "birthPlace",
          "gender",
          "religion",
          "bloodType",
          "maritalStatus",
          "motherName",
          "landlinePhone",
          "emergencyContactName",
          "emergencyContactPhone",
          "emergencyContactRelation",
          "nik",
        ].includes(key)
      ) {
        cat = "identitas";
      } else if (
        [
          "employeeNo",
          "currentDepartmentId",
          "currentPositionId",
          "managerId",
          "joinDate",
          "status",
          "workLocationId",
          "legalEntityId",
          "probationEndDate",
          "endDate",
          "employmentType",
          "employmentTypeId",
          "contractStartDate",
          "contractEndDate",
          "contractNumber",
          "contractNotes",
        ].includes(key)
      ) {
        cat = "penempatan";
      } else if (
        [
          "wageType",
          "hourlyRate",
          "baseSalary",
          "allowancePosition",
          "allowanceTransport",
          "allowanceCommunication",
          "allowanceOther",
          "allowanceOtherNote",
        ].includes(key)
      ) {
        cat = "kompensasi";
      } else if (
        [
          "npwp",
          "passportKitas",
          "bpjsKesehatanNo",
          "bpjsKetenagakerjaanNo",
          "citizenship",
          "ptkpStatus",
          "taxMethod",
          "bankName",
          "bankAccount",
          "bankAccountName",
        ].includes(key)
      ) {
        cat = "pajak_bank";
      } else if (["createUserAccount", "accountRole"].includes(key)) {
        cat = "akun";
      }
      markDirty(cat);
    },
    [markDirty],
  );

  // Address states
  const initialKtp = initialData?.addresses?.find((a) => a.type === "KTP");
  const initialDomicile = initialData?.addresses?.find((a) => a.type === "DOMICILE");

  const [addressKtp, setAddressKtpState] = useState<AddressData>({
    street: initialKtp?.street || "",
    kelurahan: initialKtp?.kelurahan || "",
    kecamatan: initialKtp?.kecamatan || "",
    city: initialKtp?.city || "",
    province: initialKtp?.province || "",
    postalCode: initialKtp?.postalCode || "",
  });

  const [addressDomicile, setAddressDomicileState] = useState<AddressData>({
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
      setAddressDomicileState({ ...addressKtp });
    }
    markDirty("identitas");
  };

  const setAddressKtp = (newKtp: AddressData) => {
    setAddressKtpState(newKtp);
    if (isDomicileSameAsKtp) {
      setAddressDomicileState(newKtp);
    }
    markDirty("identitas");
  };

  const setAddressDomicile = (newDom: AddressData) => {
    setAddressDomicileState(newDom);
    markDirty("identitas");
  };

  // Profile photo state
  const [profilePhoto, setProfilePhoto] = useState<UploadedFileState>({
    file: null,
    status: "idle",
  });
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
    markDirty("identitas");
  };

  const clearProfilePhoto = () => {
    setProfilePhoto({ file: null, status: "idle" });
    setProfilePhotoPreview(null);
    markDirty("identitas");
  };

  // Dynamic tables
  const [familyMembers, setFamilyMembers] = useState<FamilyMemberItem[]>(
    initialData?.familyMembers?.map((fm) => ({
      id: fm.id,
      name: fm.name,
      relation: fm.relation as FamilyRelation,
      birthDate: fm.birthDate ? toDateString(fm.birthDate) : undefined,
      phone: fm.phone || undefined,
      isDependent: Boolean(fm.isDependent),
      notes: fm.notes || undefined,
    })) || [],
  );

  const [educations, setEducations] = useState<EducationItem[]>(
    initialData?.educations?.map((edu) => {
      const doc = initialData.documents?.find((d) => d.educationId === edu.id);
      return {
        id: edu.id,
        level:
          (edu.level as unknown as string) === "SMA"
            ? ("SMA_SMK" as EducationLevel)
            : (edu.level as EducationLevel),
        institution: edu.institution,
        major: edu.major || undefined,
        graduationYear: edu.graduationYear || undefined,
        gpa: edu.gpa ? String(edu.gpa) : undefined,
        certificateDocKey: doc?.fileKey || null,
        certificateFileName: doc?.fileName || null,
      };
    }) || [],
  );

  const [trainings, setTrainings] = useState<TrainingItem[]>(
    initialData?.trainings?.map((tr) => {
      const doc = initialData.documents?.find((d) => d.trainingId === tr.id);
      return {
        id: tr.id,
        name: tr.name,
        participationType: tr.participationType || undefined,
        startDate: tr.startDate ? toDateString(tr.startDate) : undefined,
        endDate: tr.endDate ? toDateString(tr.endDate) : undefined,
        duration: tr.duration || undefined,
        location: tr.location || undefined,
        organizer: tr.organizer || undefined,
        certificateDocKey: doc?.fileKey || null,
        certificateFileName: doc?.fileName || null,
      };
    }) || [],
  );

  const [workExperiences, setWorkExperiences] = useState<WorkExperienceItem[]>(
    initialData?.workExperiences?.map((we) => {
      const doc = initialData.documents?.find((d) => d.workExperienceId === we.id);
      return {
        id: we.id,
        companyName: we.companyName,
        jobTitle: we.jobTitle,
        startDate: we.startDate ? toDateString(we.startDate).substring(0, 7) : "",
        endDate: we.endDate ? toDateString(we.endDate).substring(0, 7) : undefined,
        isCurrent: Boolean(we.isCurrent),
        reasonForLeaving: we.reasonForLeaving || undefined,
        description: we.description || undefined,
        certificateDocKey: doc?.fileKey || null,
        certificateFileName: doc?.fileName || null,
      };
    }) || [],
  );

  const [additionalDocuments, setAdditionalDocuments] = useState<AdditionalDocumentItem[]>([]);

  // Documents
  const cvDoc = initialData?.documents?.find((d) => d.category === "CV");
  const diplomaDoc = initialData?.documents?.find((d) => d.category === "DIPLOMA" && !d.educationId);
  const kkDoc = initialData?.documents?.find((d) => d.category === "FAMILY_CARD");
  const prevExpDoc = initialData?.documents?.find(
    (d) => d.category === "PREVIOUS_EMPLOYER_LETTER" && !d.workExperienceId,
  );
  const offerDoc = initialData?.documents?.find((d) => d.category === "OFFER_LETTER");
  const ndaDoc = initialData?.documents?.find((d) => d.category === "NDA");
  const marriageDoc = initialData?.documents?.find((d) => d.category === "MARRIAGE_CERT");
  const ktpDoc = initialData?.documents?.find((d) => d.category === "KTP");
  const npwpDoc = initialData?.documents?.find((d) => d.category === "NPWP");
  const bankDoc = initialData?.documents?.find((d) => d.category === "BANK_BOOK");
  const bpjsKesDoc = initialData?.documents?.find(
    (d) => d.category === "BPJS_KES" || d.category === "BPJS",
  );
  const bpjsTkDoc = initialData?.documents?.find((d) => d.category === "BPJS_TK");

  const [docCv, setDocCv] = useState<UploadedFileState>({
    file: null,
    documentKey: cvDoc?.fileKey || null,
    fileName: cvDoc?.fileName || null,
    previewUrl: cvDoc?.fileKey ? `/api/documents/${cvDoc.fileKey}` : null,
    status: cvDoc || initialData?.hasCv ? "uploaded" : "idle",
  });
  const [docDiploma, setDocDiploma] = useState<UploadedFileState>({
    file: null,
    documentKey: diplomaDoc?.fileKey || null,
    fileName: diplomaDoc?.fileName || null,
    previewUrl: diplomaDoc?.fileKey ? `/api/documents/${diplomaDoc.fileKey}` : null,
    status: diplomaDoc || initialData?.hasDiploma ? "uploaded" : "idle",
  });
  const [docFamilyCard, setDocFamilyCard] = useState<UploadedFileState>({
    file: null,
    documentKey: kkDoc?.fileKey || null,
    fileName: kkDoc?.fileName || null,
    previewUrl: kkDoc?.fileKey ? `/api/documents/${kkDoc.fileKey}` : null,
    status: kkDoc || initialData?.hasFamilyCard ? "uploaded" : "idle",
  });
  const [docPreviousEmployerLetter, setDocPreviousEmployerLetter] = useState<UploadedFileState>({
    file: null,
    documentKey: prevExpDoc?.fileKey || null,
    fileName: prevExpDoc?.fileName || null,
    previewUrl: prevExpDoc?.fileKey ? `/api/documents/${prevExpDoc.fileKey}` : null,
    status: prevExpDoc || initialData?.hasPreviousEmployerLetter ? "uploaded" : "idle",
  });
  const [docOfferLetter, setDocOfferLetter] = useState<UploadedFileState>({
    file: null,
    documentKey: offerDoc?.fileKey || null,
    fileName: offerDoc?.fileName || null,
    previewUrl: offerDoc?.fileKey ? `/api/documents/${offerDoc.fileKey}` : null,
    status: offerDoc || initialData?.hasOfferLetter ? "uploaded" : "idle",
  });
  const [docNda, setDocNda] = useState<UploadedFileState>({
    file: null,
    documentKey: ndaDoc?.fileKey || null,
    fileName: ndaDoc?.fileName || null,
    previewUrl: ndaDoc?.fileKey ? `/api/documents/${ndaDoc.fileKey}` : null,
    status: ndaDoc || initialData?.hasNda ? "uploaded" : "idle",
  });
  const [docMarriageCert, setDocMarriageCert] = useState<UploadedFileState>({
    file: null,
    documentKey: marriageDoc?.fileKey || null,
    fileName: marriageDoc?.fileName || null,
    previewUrl: marriageDoc?.fileKey ? `/api/documents/${marriageDoc.fileKey}` : null,
    status: marriageDoc || initialData?.hasMarriageCert ? "uploaded" : "idle",
  });
  const [docKtp, setDocKtp] = useState<UploadedFileState>({
    file: null,
    documentKey: ktpDoc?.fileKey || null,
    fileName: ktpDoc?.fileName || null,
    previewUrl: ktpDoc?.fileKey ? `/api/documents/${ktpDoc.fileKey}` : null,
    status: ktpDoc || initialData?.hasNik ? "uploaded" : "idle",
  });
  const [docNpwp, setDocNpwp] = useState<UploadedFileState>({
    file: null,
    documentKey: npwpDoc?.fileKey || null,
    fileName: npwpDoc?.fileName || null,
    previewUrl: npwpDoc?.fileKey ? `/api/documents/${npwpDoc.fileKey}` : null,
    status: npwpDoc || initialData?.hasNpwp ? "uploaded" : "idle",
  });
  const [docBankBook, setDocBankBook] = useState<UploadedFileState>({
    file: null,
    documentKey: bankDoc?.fileKey || null,
    fileName: bankDoc?.fileName || null,
    previewUrl: bankDoc?.fileKey ? `/api/documents/${bankDoc.fileKey}` : null,
    status: bankDoc || initialData?.hasBankAccount ? "uploaded" : "idle",
  });
  const [docBpjsKes, setDocBpjsKes] = useState<UploadedFileState>({
    file: null,
    documentKey: bpjsKesDoc?.fileKey || null,
    fileName: bpjsKesDoc?.fileName || null,
    previewUrl: bpjsKesDoc?.fileKey ? `/api/documents/${bpjsKesDoc.fileKey}` : null,
    status: bpjsKesDoc || initialData?.hasBpjsKes ? "uploaded" : "idle",
  });
  const [docBpjsTk, setDocBpjsTk] = useState<UploadedFileState>({
    file: null,
    documentKey: bpjsTkDoc?.fileKey || null,
    fileName: bpjsTkDoc?.fileName || null,
    previewUrl: bpjsTkDoc?.fileKey ? `/api/documents/${bpjsTkDoc.fileKey}` : null,
    status: bpjsTkDoc || initialData?.hasBpjsTk ? "uploaded" : "idle",
  });
  const [docSkck, setDocSkck] = useState<UploadedFileState>({ file: null, status: "idle" });
  const [docHealthCert, setDocHealthCert] = useState<UploadedFileState>({
    file: null,
    status: "idle",
  });
  const [docContract, setDocContract] = useState<UploadedFileState>({
    file: null,
    status: initialActiveContract?.documentKey ? "uploaded" : "idle",
  });
  const [contractFile, setContractFile] = useState<File | null>(null);

  // NIP Generation & Availability Check
  const [nipChecking, setNipChecking] = useState(false);
  const [nipStatus, setNipStatus] = useState<{ available: boolean; message: string } | null>(null);

  const handleGenerateNip = async () => {
    try {
      setNipChecking(true);
      const res = await generateNextEmployeeNoAction(formData.joinDate || undefined);
      if (res.ok) {
        updateField("employeeNo", res.data.employeeNo);
        setNipStatus({
          available: true,
          message: `NIP ${res.data.employeeNo} siap digunakan.`,
        });
      }
    } finally {
      setNipChecking(false);
    }
  };

  const handleCheckNipAvailability = async (nip: string) => {
    if (!nip.trim() || (mode === "edit" && nip === initialData?.employeeNo)) {
      setNipStatus(null);
      return;
    }
    try {
      setNipChecking(true);
      const res = await checkEmployeeNoAvailabilityAction(nip.trim());
      if (res.ok) {
        setNipStatus({
          available: res.available,
          message: res.available
            ? "NIP dapat digunakan."
            : "NIP sudah terdaftar di sistem. Harap gunakan nomor lain.",
        });
      }
    } finally {
      setNipChecking(false);
    }
  };

  // Validation Engine
  const [errors, setErrors] = useState<ValidationErrorItem[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);

  const validateStep = useCallback(
    (step: CreateStepNumber): boolean => {
      const newErrors: ValidationErrorItem[] = [];

      if (step === 1) {
        if (!formData.fullName.trim() || formData.fullName.length < 3) {
          newErrors.push({
            field: "fullName",
            label: "Nama Lengkap",
            message: "Nama lengkap wajib diisi minimal 3 karakter.",
            step: 1,
            category: "identitas",
          });
        }
        const emailTrimmed = formData.workEmail.trim().toLowerCase();
        if (!emailTrimmed || !emailTrimmed.includes("@") || !emailTrimmed.endsWith("@pspk.id")) {
          newErrors.push({
            field: "workEmail",
            label: "Email Kantor",
            message: "Email kantor wajib menggunakan domain resmi @pspk.id (contoh: nama@pspk.id).",
            step: 1,
            category: "identitas",
          });
        }
        if (mode === "create" && formData.createUserAccount) {
          const personalTrimmed = formData.personalEmail.trim().toLowerCase();
          if (!personalTrimmed || !personalTrimmed.includes("@")) {
            newErrors.push({
              field: "personalEmail",
              label: "Email Pribadi",
              message:
                "Email pribadi wajib diisi untuk pengiriman kredensial akun & kata sandi baru.",
              step: 1,
              category: "identitas",
            });
          } else if (personalTrimmed.endsWith("@pspk.id")) {
            newErrors.push({
              field: "personalEmail",
              label: "Email Pribadi",
              message: "Email pribadi harus berupa email personal (bukan domain @pspk.id).",
              step: 1,
              category: "identitas",
            });
          }
        }
      } else if (step === 2) {
        // Step 2 is history & education (optional, no blocking validations unless needed)
      } else if (step === 3) {
        if (!formData.employeeNo.trim()) {
          newErrors.push({
            field: "employeeNo",
            label: "Nomor Induk Pegawai (NIP)",
            message: "Nomor Induk Pegawai (NIP) wajib diisi.",
            step: 3,
            category: "penempatan",
          });
        }
        if (nipStatus && !nipStatus.available) {
          newErrors.push({
            field: "employeeNo",
            label: "Nomor Induk Pegawai (NIP)",
            message: "NIP sudah terdaftar di sistem. Harap gunakan NIP yang berbeda.",
            step: 3,
            category: "penempatan",
          });
        }
        if (!formData.currentDepartmentId) {
          newErrors.push({
            field: "currentDepartmentId",
            label: "Divisi / Departemen",
            message: "Pilih divisi/departemen kerja.",
            step: 3,
            category: "penempatan",
          });
        }
        if (!formData.currentPositionId) {
          newErrors.push({
            field: "currentPositionId",
            label: "Posisi / Jabatan",
            message: "Pilih posisi/jabatan pegawai.",
            step: 3,
            category: "penempatan",
          });
        }
        if (formData.status === "PROBATION" && formData.probationEndDate && formData.joinDate) {
          if (new Date(formData.probationEndDate) < new Date(formData.joinDate)) {
            newErrors.push({
              field: "probationEndDate",
              label: "Masa Percobaan",
              message:
                "Tanggal akhir masa percobaan tidak boleh mendahului tanggal mulai bergabung.",
              step: 3,
              category: "penempatan",
            });
          }
        }
        if (employmentTypesList.length > 0 && !formData.employmentTypeId) {
          newErrors.push({
            field: "employmentTypeId",
            label: "Tipe Ikatan Kerja",
            message: "Pilih salah satu tipe ikatan kerja terlebih dahulu.",
            step: 3,
            category: "penempatan",
          });
        }
        if (!formData.contractStartDate) {
          newErrors.push({
            field: "contractStartDate",
            label: "Tanggal Mulai Kontrak",
            message: "Tanggal mulai kontrak wajib diisi.",
            step: 3,
            category: "penempatan",
          });
        }
        if (formData.employmentType === "FIXED_TERM" && !formData.contractEndDate) {
          newErrors.push({
            field: "contractEndDate",
            label: "Tanggal Berakhir Kontrak",
            message: "Kontrak PKWT Waktu Tertentu wajib memiliki tanggal berakhir.",
            step: 3,
            category: "penempatan",
          });
        }
      } else if (step === 4) {
        // Step 4 is compensation & tax (validations handled via form inputs)
      }

      setErrors(newErrors);
      if (newErrors.length > 0) {
        setServerError(newErrors[0]?.message || "Harap periksa isian formulir.");
        return false;
      }
      setServerError(null);
      return true;
    },
    [formData, employmentTypesList, mode, nipStatus],
  );

  const validateAll = useCallback((): boolean => {
    const allErrors: ValidationErrorItem[] = [];

    // Step 1
    if (!formData.fullName.trim() || formData.fullName.length < 3) {
      allErrors.push({
        field: "fullName",
        label: "Nama Lengkap",
        message: "Nama lengkap wajib diisi minimal 3 karakter.",
        step: 1,
        category: "identitas",
      });
    }
    const emailTrimmed = formData.workEmail.trim().toLowerCase();
    if (!emailTrimmed || !emailTrimmed.includes("@") || !emailTrimmed.endsWith("@pspk.id")) {
      allErrors.push({
        field: "workEmail",
        label: "Email Kantor",
        message: "Email kantor wajib menggunakan domain resmi @pspk.id.",
        step: 1,
        category: "identitas",
      });
    }
    if (mode === "create" && formData.createUserAccount) {
      const personalTrimmed = formData.personalEmail.trim().toLowerCase();
      if (!personalTrimmed || !personalTrimmed.includes("@")) {
        allErrors.push({
          field: "personalEmail",
          label: "Email Pribadi",
          message: "Email pribadi wajib diisi untuk aktivasi akun login.",
          step: 1,
          category: "identitas",
        });
      }
    }

    // Step 3 (Placement)
    if (!formData.employeeNo.trim()) {
      allErrors.push({
        field: "employeeNo",
        label: "Nomor Induk Pegawai",
        message: "Nomor Induk Pegawai (NIP) wajib diisi.",
        step: 3,
        category: "penempatan",
      });
    }
    if (!formData.currentDepartmentId) {
      allErrors.push({
        field: "currentDepartmentId",
        label: "Divisi / Departemen",
        message: "Pilih divisi/departemen kerja.",
        step: 3,
        category: "penempatan",
      });
    }
    if (!formData.currentPositionId) {
      allErrors.push({
        field: "currentPositionId",
        label: "Posisi / Jabatan",
        message: "Pilih posisi/jabatan pegawai.",
        step: 3,
        category: "penempatan",
      });
    }
    if (employmentTypesList.length > 0 && !formData.employmentTypeId) {
      allErrors.push({
        field: "employmentTypeId",
        label: "Tipe Ikatan Kerja",
        message: "Pilih salah satu tipe ikatan kerja terlebih dahulu.",
        step: 3,
        category: "penempatan",
      });
    }
    if (!formData.contractStartDate) {
      allErrors.push({
        field: "contractStartDate",
        label: "Tanggal Mulai Kontrak",
        message: "Tanggal mulai kontrak wajib diisi.",
        step: 3,
        category: "penempatan",
      });
    }

    setErrors(allErrors);
    if (allErrors.length > 0) {
      setServerError(allErrors[0]?.message || "Harap lengkapi field yang bertanda bintang.");
      return false;
    }
    setServerError(null);
    return true;
  }, [formData, employmentTypesList, mode]);

  // Navigation handlers
  const goToStep = (step: CreateStepNumber) => {
    if (step < currentStep || validateStep(currentStep)) {
      setCurrentStep(step);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 5) {
        setCurrentStep((prev) => (prev + 1) as CreateStepNumber);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as CreateStepNumber);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Submit states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadWarningMessage, setUploadWarningMessage] = useState<string | null>(null);
  const [createdCredentials, setCreatedCredentials] = useState<CreatedCredentialsData | null>(null);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validateAll()) return;

    setIsSubmitting(true);
    setServerError(null);

    let effectiveContractDocumentKey = formData.contractDocumentKey || undefined;
    const contractToUpload = contractFile || docContract.file;
    if (contractToUpload) {
      const fileData = new FormData();
      fileData.append("file", contractToUpload);
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
        addressDomicile:
          addressDomicile.street?.trim() || addressDomicile.city?.trim()
            ? addressDomicile
            : undefined,
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
          | "staff"
          | "manager"
          | "admin_hr"
          | "admin_it",
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

        // Upload staged documents
        const docsToUpload: Array<{
          category: DocumentCategory;
          title: string;
          file: File;
          educationId?: string;
          trainingId?: string;
          workExperienceId?: string;
        }> = [];
        if (docCv.file)
          docsToUpload.push({
            category: "CV",
            title: "Curriculum Vitae / Resume",
            file: docCv.file,
          });
        if (docDiploma.file)
          docsToUpload.push({
            category: "DIPLOMA",
            title: "Ijazah & Transkrip Terakhir",
            file: docDiploma.file,
          });
        if (docFamilyCard.file)
          docsToUpload.push({
            category: "FAMILY_CARD",
            title: "Kartu Keluarga (KK)",
            file: docFamilyCard.file,
          });
        if (docPreviousEmployerLetter.file)
          docsToUpload.push({
            category: "PREVIOUS_EMPLOYER_LETTER",
            title: "Surat Pengalaman Kerja / Paklaring",
            file: docPreviousEmployerLetter.file,
          });
        if (docOfferLetter.file)
          docsToUpload.push({
            category: "OFFER_LETTER",
            title: "Surat Penawaran Kerja (Signed Offer Letter)",
            file: docOfferLetter.file,
          });
        if (docNda.file)
          docsToUpload.push({
            category: "NDA",
            title: "Non-Disclosure Agreement (NDA) / Pakta Integritas",
            file: docNda.file,
          });
        if (docMarriageCert.file)
          docsToUpload.push({
            category: "MARRIAGE_CERT",
            title: "Buku Nikah / Akta Perkawinan",
            file: docMarriageCert.file,
          });
        if (docKtp.file)
          docsToUpload.push({
            category: "KTP",
            title:
              formData.citizenship === "WNA"
                ? "Paspor / KITAS WNA"
                : "Kartu Tanda Penduduk (KTP)",
            file: docKtp.file,
          });
        if (docNpwp.file)
          docsToUpload.push({
            category: "NPWP",
            title: "Nomor Pokok Wajib Pajak (NPWP)",
            file: docNpwp.file,
          });
        if (docBankBook.file)
          docsToUpload.push({
            category: "BANK_BOOK",
            title: "Buku Tabungan / Rekening Payroll",
            file: docBankBook.file,
          });
        if (docBpjsKes.file)
          docsToUpload.push({
            category: "BPJS_KES",
            title: "Kartu BPJS Kesehatan",
            file: docBpjsKes.file,
          });
        if (docBpjsTk.file)
          docsToUpload.push({
            category: "BPJS_TK",
            title: "Kartu BPJS Ketenagakerjaan",
            file: docBpjsTk.file,
          });
        if (docSkck.file)
          docsToUpload.push({
            category: "SKCK",
            title: "Surat Keterangan Catatan Kepolisian (SKCK)",
            file: docSkck.file,
          });
        if (docHealthCert.file)
          docsToUpload.push({
            category: "HEALTH_CERT",
            title: "Surat Keterangan Sehat",
            file: docHealthCert.file,
          });

        for (const edu of educations) {
          if (edu.certificateFile) {
            docsToUpload.push({
              category: "DIPLOMA",
              title: `Ijazah ${edu.level || ""} - ${edu.institution}`.trim(),
              file: edu.certificateFile,
              educationId: edu.id,
            });
          }
        }

        for (const tr of trainings) {
          if (tr.certificateFile) {
            docsToUpload.push({
              category: "CERTIFICATE",
              title: `Sertifikat - ${tr.name}`.trim(),
              file: tr.certificateFile,
              trainingId: tr.id,
            });
          }
        }

        for (const we of workExperiences) {
          if (we.certificateFile) {
            docsToUpload.push({
              category: "PREVIOUS_EMPLOYER_LETTER",
              title: `Paklaring - ${we.companyName}`.trim(),
              file: we.certificateFile,
              workExperienceId: we.id,
            });
          }
        }

        for (const addDoc of additionalDocuments) {
          if (addDoc.file) {
            docsToUpload.push({
              category: "OTHER",
              title: addDoc.title.trim() || "Dokumen Tambahan",
              file: addDoc.file,
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
            if (docItem.workExperienceId) fd.append("workExperienceId", docItem.workExperienceId);
            const uploadRes = await uploadEmployeeDocumentAction(fd);
            return {
              title: docItem.title,
              success: uploadRes.success,
            };
          });

          const uploadResults = await Promise.allSettled(uploadPromises);
          const failedUploads: string[] = [];
          uploadResults.forEach((result, idx) => {
            if (result.status === "rejected" || !result.value.success) {
              failedUploads.push(docsToUpload[idx]?.title || "Dokumen");
            }
          });

          if (failedUploads.length > 0) {
            setUploadWarningMessage(
              `Pegawai berhasil didaftarkan, namun dokumen berikut belum berhasil terunggah: ${failedUploads.join(", ")}. Anda dapat mengunggahnya nanti di tab Berkas Pegawai.`,
            );
          }
        }

        // Upload Profile photo if available
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
        setIsSubmitting(false);
      }
    } else {
      // EDIT MODE
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
        addressDomicile:
          addressDomicile.street?.trim() || addressDomicile.city?.trim()
            ? addressDomicile
            : undefined,
        employeeNo: formData.employeeNo.trim(),
        currentDepartmentId: formData.currentDepartmentId,
        currentPositionId: formData.currentPositionId,
        managerId: formData.managerId || null,
        joinDate: formData.joinDate,
        status: formData.status as EmployeeStatus,
        workLocationId: formData.workLocationId?.trim() || undefined,
        legalEntityId: formData.legalEntityId?.trim() || undefined,
        probationEndDate: formData.probationEndDate || undefined,
        endDate: formData.endDate || undefined,
        employmentType: formData.employmentType as EmploymentType,
        employmentTypeId: formData.employmentTypeId || undefined,
        wageType: formData.wageType,
        hourlyRate: formData.wageType === "HOURLY" ? Number(formData.hourlyRate) || 0 : undefined,
        contractStartDate: formData.contractStartDate,
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
        createUserAccount: false,
        accountRole: "staff",
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
        const targetId = initialData.id;

        // Upload any newly staged documents in edit mode
        const docsToUpload: Array<{
          category: DocumentCategory;
          title: string;
          file: File;
          educationId?: string;
          trainingId?: string;
          workExperienceId?: string;
        }> = [];

        if (docCv.file)
          docsToUpload.push({
            category: "CV",
            title: "Curriculum Vitae / Resume",
            file: docCv.file,
          });
        if (docDiploma.file)
          docsToUpload.push({
            category: "DIPLOMA",
            title: "Ijazah & Transkrip Terakhir",
            file: docDiploma.file,
          });
        if (docFamilyCard.file)
          docsToUpload.push({
            category: "FAMILY_CARD",
            title: "Kartu Keluarga (KK)",
            file: docFamilyCard.file,
          });
        if (docPreviousEmployerLetter.file)
          docsToUpload.push({
            category: "PREVIOUS_EMPLOYER_LETTER",
            title: "Surat Pengalaman Kerja / Paklaring",
            file: docPreviousEmployerLetter.file,
          });
        if (docOfferLetter.file)
          docsToUpload.push({
            category: "OFFER_LETTER",
            title: "Surat Penawaran Kerja (Signed Offer Letter)",
            file: docOfferLetter.file,
          });
        if (docNda.file)
          docsToUpload.push({
            category: "NDA",
            title: "Non-Disclosure Agreement (NDA) / Pakta Integritas",
            file: docNda.file,
          });
        if (docMarriageCert.file)
          docsToUpload.push({
            category: "MARRIAGE_CERT",
            title: "Buku Nikah / Akta Perkawinan",
            file: docMarriageCert.file,
          });
        if (docKtp.file)
          docsToUpload.push({
            category: "KTP",
            title:
              formData.citizenship === "WNA"
                ? "Paspor / KITAS WNA"
                : "Kartu Tanda Penduduk (KTP)",
            file: docKtp.file,
          });
        if (docNpwp.file)
          docsToUpload.push({
            category: "NPWP",
            title: "Nomor Pokok Wajib Pajak (NPWP)",
            file: docNpwp.file,
          });
        if (docBankBook.file)
          docsToUpload.push({
            category: "BANK_BOOK",
            title: "Buku Tabungan / Rekening Payroll",
            file: docBankBook.file,
          });
        if (docBpjsKes.file)
          docsToUpload.push({
            category: "BPJS_KES",
            title: "Kartu BPJS Kesehatan",
            file: docBpjsKes.file,
          });
        if (docBpjsTk.file)
          docsToUpload.push({
            category: "BPJS_TK",
            title: "Kartu BPJS Ketenagakerjaan",
            file: docBpjsTk.file,
          });

        for (const edu of educations) {
          if (edu.certificateFile) {
            docsToUpload.push({
              category: "DIPLOMA",
              title: `Ijazah ${edu.level || ""} - ${edu.institution}`.trim(),
              file: edu.certificateFile,
              educationId: edu.id,
            });
          }
        }

        for (const tr of trainings) {
          if (tr.certificateFile) {
            docsToUpload.push({
              category: "CERTIFICATE",
              title: `Sertifikat - ${tr.name}`.trim(),
              file: tr.certificateFile,
              trainingId: tr.id,
            });
          }
        }

        for (const we of workExperiences) {
          if (we.certificateFile) {
            docsToUpload.push({
              category: "PREVIOUS_EMPLOYER_LETTER",
              title: `Paklaring - ${we.companyName}`.trim(),
              file: we.certificateFile,
              workExperienceId: we.id,
            });
          }
        }

        if (docsToUpload.length > 0) {
          await Promise.allSettled(
            docsToUpload.map(async (docItem) => {
              const fd = new FormData();
              fd.append("employeeId", targetId);
              fd.append("category", docItem.category);
              fd.append("title", docItem.title);
              fd.append("file", docItem.file);
              if (docItem.educationId) fd.append("educationId", docItem.educationId);
              if (docItem.trainingId) fd.append("trainingId", docItem.trainingId);
              if (docItem.workExperienceId) fd.append("workExperienceId", docItem.workExperienceId);
              return uploadEmployeeDocumentAction(fd);
            }),
          );
        }

        // Upload photo if changed
        if (profilePhoto.file) {
          try {
            const photoFd = new FormData();
            photoFd.append("file", profilePhoto.file);
            await uploadEmployeePhotoAction(targetId, photoFd);
          } catch (photoErr) {
            console.error("Gagal memperbarui foto profil:", photoErr);
          }
        }

        setIsSubmitting(false);
        setDirtyCategories(new Set());
        router.push(`/karyawan/${initialData.id}`);
        router.refresh();
      } else {
        setServerError(res.error);
        setIsSubmitting(false);
      }
    }
  };

  const isDirty = useMemo(() => dirtyCategories.size > 0, [dirtyCategories]);

  return (
    <EmployeeFormContext.Provider
      value={{
        mode,
        currentStep,
        activeCategory,
        formData,
        updateField,

        addressKtp,
        addressDomicile,
        isDomicileSameAsKtp,
        setAddressKtp,
        setAddressDomicile,
        handleToggleSameAddress,

        profilePhoto,
        profilePhotoPreview,
        handleProfilePhotoChange,
        clearProfilePhoto,

        familyMembers,
        setFamilyMembers,
        educations,
        setEducations,
        trainings,
        setTrainings,
        workExperiences,
        setWorkExperiences,
        additionalDocuments,
        setAdditionalDocuments,

        docCv,
        setDocCv,
        docDiploma,
        setDocDiploma,
        docFamilyCard,
        setDocFamilyCard,
        docPreviousEmployerLetter,
        setDocPreviousEmployerLetter,
        docOfferLetter,
        setDocOfferLetter,
        docNda,
        setDocNda,
        docMarriageCert,
        setDocMarriageCert,
        docKtp,
        setDocKtp,
        docNpwp,
        setDocNpwp,
        docBankBook,
        setDocBankBook,
        docBpjsKes,
        setDocBpjsKes,
        docBpjsTk,
        setDocBpjsTk,
        docSkck,
        setDocSkck,
        docHealthCert,
        setDocHealthCert,
        docContract,
        setDocContract,
        contractFile,
        setContractFile,

        nipChecking,
        nipStatus,
        handleGenerateNip,
        handleCheckNipAvailability,

        departments,
        managers,
        roles,
        isSuperAdmin,
        employmentTypesList,
        setEmploymentTypesList,
        workLocations,
        legalEntities,

        dirtyCategories,
        isDirty,

        errors,
        serverError,
        setServerError,
        validateStep,
        validateAll,

        goToStep,
        nextStep,
        prevStep,
        setActiveCategory,

        isSubmitting,
        uploadWarningMessage,
        createdCredentials,
        setCreatedCredentials,
        handleSubmit,

        isQuickCreateModalOpen,
        setIsQuickCreateModalOpen,
      }}
    >
      {children}
    </EmployeeFormContext.Provider>
  );
}
