import {
  Gender,
  MaritalStatus,
  Religion,
  Citizenship,
  BloodType,
  EmployeeStatus,
  EmploymentType,
  WageType,
  PtkpStatus,
  TaxMethod,
  AddressType,
} from "@pspk/db";

export type FormMode = "create" | "edit";

export type CreateStepNumber = 1 | 2 | 3 | 4 | 5;

export type EditCategoryKey =
  | "identitas"
  | "riwayat"
  | "penempatan"
  | "kompensasi"
  | "pajak_bank"
  | "berkas"
  | "akun";

export interface DepartmentOption {
  id: string;
  name: string;
  type?: string;
  positions: { id: string; title: string }[];
}

export interface ManagerOption {
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
  emergencyContactRelation?: string | null;
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
  user?: {
    id: string;
    email: string;
    roles?: { role: { key: string; name: string } }[];
  } | null;
}

export interface EmployeeFormData {
  // Step 1: Personal
  fullName: string;
  nickname: string;
  workEmail: string;
  personalEmail: string;
  phone: string;
  birthDate: string;
  birthPlace: string;
  gender: Gender | "";
  religion: Religion | "";
  bloodType: BloodType | "";
  maritalStatus: MaritalStatus | "";
  motherName: string;
  landlinePhone: string;
  address: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;

  // Step 2: Placement
  employeeNo: string;
  currentDepartmentId: string;
  currentPositionId: string;
  managerId: string;
  joinDate: string;
  status: EmployeeStatus;
  workLocationId: string;
  legalEntityId: string;
  probationEndDate: string;
  endDate: string;

  // Step 3: Contract & Compensation
  employmentType: EmploymentType;
  employmentTypeId: string;
  wageType: WageType;
  hourlyRate: number | string;
  contractStartDate: string;
  contractEndDate: string;
  baseSalary: number | string;
  allowancePosition: number | string;
  allowanceTransport: number | string;
  allowanceCommunication: number | string;
  allowanceOther: number | string;
  allowanceOtherNote: string;
  contractNumber: string;
  contractDocumentKey: string;
  contractNotes: string;

  // Step 4: Sensitive Data, Tax & Banking
  nik: string;
  npwp: string;
  passportKitas: string;
  bpjsKesehatanNo: string;
  bpjsKetenagakerjaanNo: string;
  citizenship: Citizenship | "WNI" | "WNA";
  ptkpStatus: PtkpStatus;
  taxMethod: TaxMethod;
  bankName: string;
  bankAccount: string;
  bankAccountName: string;
  createUserAccount: boolean;
  accountRole: string;
}

export interface ValidationErrorItem {
  field: string;
  label: string;
  message: string;
  step: CreateStepNumber;
  category: EditCategoryKey;
}

export interface WizardEmployeeFormProps {
  mode: FormMode;
  departments: DepartmentOption[];
  managers: ManagerOption[];
  roles?: RoleOption[];
  isSuperAdmin?: boolean;
  initialData?: InitialEmployeeData | null;
  employmentTypes?: EmploymentTypeOption[];
  workLocations?: WorkLocationOption[];
  legalEntities?: LegalEntityOption[];
}
