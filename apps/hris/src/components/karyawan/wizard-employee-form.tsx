"use client";

import React, { useState } from "react";
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
} from "lucide-react";
import {
  createEmployeeAction,
  updateEmployeeAction,
  generateNextEmployeeNoAction,
  checkEmployeeNoAvailabilityAction,
} from "@/server/actions/employee.actions";
import { CreateEmployeeInput, UpdateEmployeeInput } from "@/server/schemas/employee.schema";

import { EmployeeStatus, EmploymentType, Gender, MaritalStatus } from "@pspk/db";

interface DepartmentOption {
  id: string;
  name: string;
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
  hasNik?: boolean;
  hasNpwp?: boolean;
  hasBankAccount?: boolean;
  contracts?: {
    type: EmploymentType;
    startDate: Date | string;
    endDate?: Date | string | null;
    baseSalary?: number | null;
    notes?: string | null;
  }[];
}

interface WizardEmployeeFormProps {
  mode: "create" | "edit";
  departments: DepartmentOption[];
  managers: ManagerOption[];
  roles?: RoleOption[];
  initialData?: InitialEmployeeData | null;
}

export function WizardEmployeeForm({
  mode,
  departments,
  managers,
  roles,
  initialData,
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

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Personal
    fullName: initialData?.fullName || "",
    nickname: initialData?.nickname || "",
    workEmail: initialData?.workEmail || "",
    personalEmail: initialData?.personalEmail || "",
    phone: initialData?.phone || "",
    birthDate: initialData?.birthDate
      ? new Date(initialData.birthDate).toISOString().split("T")[0]
      : "",
    birthPlace: initialData?.birthPlace || "",
    gender: initialData?.gender || "MALE",
    maritalStatus: initialData?.maritalStatus || "SINGLE",
    address: initialData?.address || "",
    emergencyContactName: initialData?.emergencyContactName || "",
    emergencyContactPhone: initialData?.emergencyContactPhone || "",

    // Step 2: Placement
    employeeNo: initialData?.employeeNo || "",
    currentDepartmentId: initialData?.currentDepartmentId || (departments[0]?.id ?? ""),
    currentPositionId: initialData?.currentPositionId || "",
    managerId: initialData?.managerId || "",
    joinDate: initialData?.joinDate
      ? new Date(initialData.joinDate).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
    status: initialData?.status || "ACTIVE",

    // Step 3: Contract
    employmentType: initialData?.contracts?.[0]?.type || "PERMANENT",
    contractStartDate: initialData?.contracts?.[0]?.startDate
      ? new Date(initialData.contracts[0].startDate).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
    contractEndDate: initialData?.contracts?.[0]?.endDate
      ? new Date(initialData.contracts[0].endDate).toISOString().split("T")[0]
      : "",
    baseSalary: initialData?.contracts?.[0]?.baseSalary || 10000000,
    contractNotes: initialData?.contracts?.[0]?.notes || "",

    // Step 4: Sensitive Data & Account
    nik: "",
    npwp: "",
    bankName: initialData?.bankName || "Bank Mandiri",
    bankAccount: "",
    bankAccountName: initialData?.bankAccountName || "",
    createUserAccount: mode === "create",
    accountRole: "staff",
  });

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
        setServerError("Email kantor wajib menggunakan domain resmi @pspk.id (contoh: nama@pspk.id).");
        return false;
      }
      if (mode === "create" && formData.createUserAccount) {
        const personalTrimmed = formData.personalEmail.trim().toLowerCase();
        if (!personalTrimmed || !personalTrimmed.includes("@")) {
          setServerError("Email pribadi wajib diisi untuk pengiriman kredensial akun & kata sandi baru.");
          return false;
        }
        if (personalTrimmed.endsWith("@pspk.id")) {
          setServerError("Email pribadi harus merupakan email pribadi (bukan email kantor @pspk.id).");
          return false;
        }
      }
    } else if (step === 2) {
      if (!formData.employeeNo.trim()) {
        setServerError("Nomor Induk Pegawai (NIP) wajib diisi.");
        return false;
      }
      if (nipStatus && !nipStatus.available) {
        setServerError("Nomor Induk Pegawai (NIP) sudah terdaftar di sistem. Harap gunakan NIP yang berbeda.");
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
    } else if (step === 3) {
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
          setServerError("Email pribadi pada Langkah 1 wajib diisi untuk pengiriman informasi akun & kata sandi.");
          return false;
        }
      }
    }
    return true;
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

    const baseJoinDate = formData.joinDate || new Date().toISOString().slice(0, 10);
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
        employeeNo: formData.employeeNo.trim(),
        currentDepartmentId: formData.currentDepartmentId,
        currentPositionId: formData.currentPositionId,
        managerId: formData.managerId || null,
        joinDate: baseJoinDate,
        status: formData.status as EmployeeStatus,
        employmentType: formData.employmentType as EmploymentType,
        contractStartDate: baseContractStart,
        contractEndDate: formData.contractEndDate || undefined,
        baseSalary: Number(formData.baseSalary) || 0,
        contractNotes: formData.contractNotes.trim() || undefined,
        nik: formData.nik.trim() || undefined,
        npwp: formData.npwp.trim() || undefined,
        bankName: formData.bankName.trim() || undefined,
        bankAccount: formData.bankAccount.trim() || undefined,
        bankAccountName: formData.bankAccountName.trim() || undefined,
        createUserAccount: formData.createUserAccount,
        accountRole: (formData.accountRole || "staff") as "staff" | "manager" | "admin_hr" | "admin_it",
      };

      const res = await createEmployeeAction(payload);
      setIsSubmitting(false);

      if (res.ok) {
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
        address: formData.address?.trim() || undefined,
        emergencyContactName: formData.emergencyContactName?.trim() || undefined,
        emergencyContactPhone: formData.emergencyContactPhone?.trim() || undefined,
        employeeNo: formData.employeeNo.trim(),
        currentDepartmentId: formData.currentDepartmentId,
        currentPositionId: formData.currentPositionId,
        managerId: formData.managerId || null,
        joinDate: baseJoinDate,
        status: formData.status as EmployeeStatus,
        employmentType: formData.employmentType as EmploymentType,
        contractStartDate: baseContractStart,
        contractEndDate: formData.contractEndDate || undefined,
        baseSalary: Number(formData.baseSalary) || 0,
        contractNotes: formData.contractNotes?.trim() || undefined,
        nik: formData.nik.trim() || undefined,
        npwp: formData.npwp.trim() || undefined,
        bankName: formData.bankName.trim() || undefined,
        bankAccount: formData.bankAccount.trim() || undefined,
        bankAccountName: formData.bankAccountName?.trim() || undefined,
        createUserAccount: formData.createUserAccount,
        accountRole: (formData.accountRole || "staff") as "staff" | "manager" | "admin_hr" | "admin_it",
      };

      const res = await updateEmployeeAction(payload);
      setIsSubmitting(false);

      if (res.ok) {
        router.push(`/karyawan/${initialData.id}`);
        router.refresh();
      } else {
        setServerError(res.error);
      }
    }
  };

  const defaultRoles: RoleOption[] = [
    { id: "1", key: "staff", name: "Karyawan (Staff)", description: "Akses mandiri (self-service) data pribadi, presensi, cuti, slip gaji" },
    { id: "2", key: "manager", name: "Manajer / Atasan", description: "Persetujuan cuti tim, melihat kinerja & presensi bawahan langsung" },
    { id: "3", key: "admin_hr", name: "Admin HR", description: "Pengelolaan penuh modul HRIS (karyawan, absensi, cuti, payroll)" },
    { id: "4", key: "admin_it", name: "Admin IT", description: "Pengelolaan user, inventaris aset, lisensi, dokumen & audit log" },
  ];
  const availableRoles = roles && roles.length > 0 ? roles : defaultRoles;

  const steps = [
    { num: 1, title: "Identitas Pribadi", icon: User },
    { num: 2, title: "Penempatan Kerja", icon: Briefcase },
    { num: 3, title: "Kontrak & Gaji", icon: FileText },
    { num: 4, title: "Data Sensitif & Akun", icon: Shield },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
      {/* Stepper Header */}
      <div className="bg-slate-50/70 border-b border-slate-200 p-4 sm:p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
                className={`flex items-center gap-3 p-2.5 rounded-lg border transition-all ${
                  isCurrent
                    ? "bg-white border-[#102E50] shadow-xs"
                    : isDone
                      ? "bg-emerald-50/50 border-emerald-200 cursor-pointer hover:bg-emerald-50"
                      : "bg-slate-100/50 border-slate-200 opacity-60"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                    isCurrent
                      ? "bg-[#102E50] text-white"
                      : isDone
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {isDone ? <CheckCircle className="w-4 h-4" /> : s.num}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Langkah {s.num}
                  </span>
                  <span
                    className={`text-xs font-semibold truncate flex items-center gap-1.5 ${
                      isCurrent ? "text-[#102E50]" : "text-slate-700"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{s.title}</span>
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
        className="p-6 flex flex-col gap-6"
      >
        {serverError && (
          <div className="p-3 bg-red-50 border border-red-200 text-[#A8281C] text-sm rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        {/* STEP 1: IDENTITAS PRIBADI */}
        {currentStep === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in duration-200">
            <div className="md:col-span-2 pb-2 border-b border-slate-100">
              <h3 className="font-bold text-base text-[#102E50] font-heading">
                Identitas Pribadi Pegawai
              </h3>
              <p className="text-xs text-slate-500">
                Data diri lengkap sesuai KTP dan dokumen identitas resmi
              </p>
            </div>

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
                Email Pribadi {formData.createUserAccount && <span className="text-[#A8281C]">* (Wajib untuk Akun)</span>}
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
                Nomor Telepon / WhatsApp
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+628123456789"
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
                placeholder="Kota kelahiran"
                className="w-full px-3 py-2 text-sm bg-slate-50/70 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#102E50]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Tanggal Lahir
              </label>
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
                <option value="DIVORCED">Cerai Hidup</option>
                <option value="WIDOWED">Cerai Mati</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Alamat Domisili
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Jl. Nama Jalan, Kelurahan, Kecamatan, Kota"
                className="w-full px-3 py-2 text-sm bg-slate-50/70 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#102E50]"
              />
            </div>

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
          </div>
        )}

        {/* STEP 2: PENEMPATAN KERJA */}
        {currentStep === 2 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in duration-200">
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
                  Format standar: PSPK-YYYYMM-XXX (klik tombol di atas untuk membuat NIP urut otomatis)
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
          </div>
        )}

        {/* STEP 3: KONTRAK & GAJI */}
        {currentStep === 3 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in duration-200">
            <div className="md:col-span-2 pb-2 border-b border-slate-100">
              <h3 className="font-bold text-base text-[#102E50] font-heading">
                Kontrak Kerja & Kompensasi
              </h3>
              <p className="text-xs text-slate-500">
                Ketentuan perjanjian ikatan kerja dan nilai gaji pokok
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Tipe Ikatan Kerja <span className="text-[#A8281C]">*</span>
              </label>
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
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Gaji Pokok (IDR) <span className="text-[#A8281C]">*</span>
              </label>
              <input
                type="number"
                name="baseSalary"
                value={formData.baseSalary}
                onChange={handleChange}
                required
                min={0}
                className="w-full px-3 py-2 text-sm font-mono bg-slate-50/70 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#102E50]"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Dasar perhitungan payroll bulanan dan tunjangan fungsional
              </span>
            </div>

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

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Catatan Kontrak Kerja
              </label>
              <textarea
                name="contractNotes"
                value={formData.contractNotes}
                onChange={handleChange}
                rows={2}
                placeholder="Keterangan penugasan khusus atau klausul riset..."
                className="w-full px-3 py-2 text-sm bg-slate-50/70 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#102E50]"
              />
            </div>
          </div>
        )}

        {/* STEP 4: DATA SENSITIF & AKUN */}
        {currentStep === 4 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in duration-200">
            <div className="md:col-span-2 pb-2 border-b border-slate-100">
              <h3 className="font-bold text-base text-[#102E50] font-heading">
                Data Sensitif & Akun Pengguna
              </h3>
              <p className="text-xs text-slate-500">
                Nilai data di bawah ini disimpan terenkripsi otomatis (AES-256-GCM) di database
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Nomor Induk Kependudukan (NIK)
              </label>
              <input
                type="text"
                name="nik"
                value={formData.nik}
                onChange={handleChange}
                placeholder={initialData?.hasNik ? "Sudah terenkripsi (isi untuk mengubah)" : "16 digit NIK"}
                maxLength={20}
                className="w-full px-3 py-2 text-sm font-mono bg-slate-50/70 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#102E50]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Nomor Pokok Wajib Pajak (NPWP)
              </label>
              <input
                type="text"
                name="npwp"
                value={formData.npwp}
                onChange={handleChange}
                placeholder={initialData?.hasNpwp ? "Sudah terenkripsi (isi untuk mengubah)" : "15 / 16 digit NPWP"}
                maxLength={25}
                className="w-full px-3 py-2 text-sm font-mono bg-slate-50/70 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#102E50]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Nama Bank Payroll
              </label>
              <select
                name="bankName"
                value={formData.bankName}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm bg-slate-50/70 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#102E50]"
              >
                <option value="Bank Mandiri">Bank Mandiri</option>
                <option value="Bank BCA">Bank BCA</option>
                <option value="Bank BNI">Bank BNI</option>
                <option value="Bank BRI">Bank BRI</option>
                <option value="Bank BSI">Bank BSI (Syariah)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Nomor Rekening Bank
              </label>
              <input
                type="text"
                name="bankAccount"
                value={formData.bankAccount}
                onChange={handleChange}
                placeholder={initialData?.hasBankAccount ? "Sudah terenkripsi (isi untuk mengubah)" : "Nomor rekening payroll"}
                className="w-full px-3 py-2 text-sm font-mono bg-slate-50/70 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#102E50]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Nama Pemilik Rekening (Sesuai Buku Tabungan)
              </label>
              <input
                type="text"
                name="bankAccountName"
                value={formData.bankAccountName}
                onChange={handleChange}
                placeholder="Nama pemilik rekening bank"
                className="w-full px-3 py-2 text-sm bg-slate-50/70 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#102E50]"
              />
            </div>

            {mode === "create" && (
              <div className="md:col-span-2 p-5 bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-xl border border-blue-200/60 flex flex-col gap-4">
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
                      Sistem akan membuat akun login aktif dengan email kantor ({formData.workEmail || "nama@pspk.id"}), menghasilkan kata sandi sementara secara otomatis, dan mengirimkannya ke email pribadi ({formData.personalEmail || "email pribadi"}).
                    </span>
                  </div>
                </div>

                {formData.createUserAccount && (
                  <div className="pt-3 border-t border-slate-200/80 flex flex-col gap-4 animate-in fade-in duration-150">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Pilih Hak Akses / Peran Sistem (Role) <span className="text-[#A8281C]">*</span>
                      </label>
                      <select
                        name="accountRole"
                        value={formData.accountRole}
                        onChange={handleChange}
                        className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#102E50]"
                      >
                        {availableRoles.map((r) => (
                          <option key={r.key} value={r.key}>
                            {r.name} — {r.description}
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
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Email Login Kantor</span>
                          <span className="font-mono font-semibold text-slate-800 text-xs">
                            {formData.workEmail || "(Wajib diisi di Langkah 1)"}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Kata Sandi Awal</span>
                          <span className="text-slate-700 font-semibold text-xs flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            Auto-generated aman (≥ 12 karakter)
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Tujuan Pengiriman Kredensial</span>
                          <span className="font-semibold text-slate-800 text-xs">
                            {formData.personalEmail || "(Wajib diisi di Langkah 1)"}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Notifikasi Email</span>
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
          </div>
        )}

        {/* Stepper Navigation Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <div>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handlePrev}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200 transition-all cursor-pointer active:scale-[0.98]"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Sebelumnya</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.push("/karyawan")}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Batal
            </button>

            {currentStep < 4 ? (
              <button
                key="btn-next-step"
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-semibold bg-[#102E50] text-white hover:bg-[#0c233d] transition-all cursor-pointer active:scale-[0.98]"
              >
                <span>Langkah Selanjutnya</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                key="btn-submit-final"
                type="submit"
                disabled={isSubmitting || stepCooldown}
                className="inline-flex items-center gap-1.5 px-6 py-2 rounded-lg text-xs font-semibold bg-[#feba48] text-[#102E50] hover:bg-[#e5a63d] transition-all cursor-pointer active:scale-[0.98] shadow-xs disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSubmitting ? "Menyimpan..." : mode === "create" ? "Daftarkan Pegawai" : "Simpan Perubahan"}</span>
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
                  Data pegawai {createdCredentials.fullName} ({createdCredentials.employeeNo}) telah tersimpan.
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
                  <span className="text-slate-500 font-sans text-[11px]">Kata Sandi Sementara:</span>
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
                      {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
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
                  const text = `Kredensial Akses Portal HRIS PSPK:\nNama: ${createdCredentials.fullName}\nEmail Login: ${createdCredentials.workEmail}\nKata Sandi Sementara: ${createdCredentials.temporaryPassword}\nHak Akses: ${createdCredentials.roleName}\nLink: http://localhost:3001/masuk`;
                  navigator.clipboard.writeText(text);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="px-4 py-2 rounded-lg text-xs font-semibold border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
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
    </div>
  );
}
