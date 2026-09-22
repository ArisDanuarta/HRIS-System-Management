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
} from "lucide-react";
import { createEmployeeAction, updateEmployeeAction } from "@/server/actions/employee.actions";
import { CreateEmployeeInput, UpdateEmployeeInput } from "@/server/schemas/employee.schema";

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

interface WizardEmployeeFormProps {
  mode: "create" | "edit";
  departments: DepartmentOption[];
  managers: ManagerOption[];
  initialData?: any;
}

export function WizardEmployeeForm({
  mode,
  departments,
  managers,
  initialData,
}: WizardEmployeeFormProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

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
    employeeNo: initialData?.employeeNo || `PSPK-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}-0${Math.floor(10 + Math.random() * 90)}`,
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

  // Step Validation before progressing
  const validateStep = (step: number): boolean => {
    setServerError(null);
    if (step === 1) {
      if (!formData.fullName.trim() || formData.fullName.length < 3) {
        setServerError("Nama lengkap wajib diisi minimal 3 karakter.");
        return false;
      }
      if (!formData.workEmail.trim() || !formData.workEmail.includes("@")) {
        setServerError("Email kantor tidak valid.");
        return false;
      }
    } else if (step === 2) {
      if (!formData.employeeNo.trim()) {
        setServerError("Nomor Induk Pegawai (NIP) wajib diisi.");
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
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
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
    if (!validateStep(currentStep)) return;

    setIsSubmitting(true);
    setServerError(null);

    if (mode === "create") {
      const payload: CreateEmployeeInput = {
        ...formData,
        baseSalary: Number(formData.baseSalary),
        managerId: formData.managerId || null,
        contractEndDate: formData.contractEndDate || undefined,
        personalEmail: formData.personalEmail || undefined,
        phone: formData.phone || undefined,
        birthDate: formData.birthDate || undefined,
        birthPlace: formData.birthPlace || undefined,
        address: formData.address || undefined,
        emergencyContactName: formData.emergencyContactName || undefined,
        emergencyContactPhone: formData.emergencyContactPhone || undefined,
        contractNotes: formData.contractNotes || undefined,
        nik: formData.nik || undefined,
        npwp: formData.npwp || undefined,
        bankName: formData.bankName || undefined,
        bankAccount: formData.bankAccount || undefined,
        bankAccountName: formData.bankAccountName || undefined,
      };

      const res = await createEmployeeAction(payload);
      setIsSubmitting(false);

      if (res.ok) {
        router.push("/karyawan");
        router.refresh();
      } else {
        setServerError(res.error);
      }
    } else {
      const payload: UpdateEmployeeInput = {
        id: initialData.id,
        ...formData,
        baseSalary: Number(formData.baseSalary),
        managerId: formData.managerId || null,
        contractEndDate: formData.contractEndDate || undefined,
        personalEmail: formData.personalEmail || undefined,
        phone: formData.phone || undefined,
        birthDate: formData.birthDate || undefined,
        birthPlace: formData.birthPlace || undefined,
        address: formData.address || undefined,
        emergencyContactName: formData.emergencyContactName || undefined,
        emergencyContactPhone: formData.emergencyContactPhone || undefined,
        contractNotes: formData.contractNotes || undefined,
        nik: formData.nik || undefined,
        npwp: formData.npwp || undefined,
        bankName: formData.bankName || undefined,
        bankAccount: formData.bankAccount || undefined,
        bankAccountName: formData.bankAccountName || undefined,
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
                    className={`text-xs font-semibold truncate ${
                      isCurrent ? "text-[#102E50]" : "text-slate-700"
                    }`}
                  >
                    {s.title}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Form Content Body */}
      <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6">
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
                placeholder="nama@pspk.example"
                required
                className="w-full px-3 py-2 text-sm bg-slate-50/70 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#102E50]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email Pribadi
              </label>
              <input
                type="email"
                name="personalEmail"
                value={formData.personalEmail}
                onChange={handleChange}
                placeholder="nama.personal@example.com"
                className="w-full px-3 py-2 text-sm bg-slate-50/70 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#102E50]"
              />
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
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Nomor Induk Pegawai (NIP) <span className="text-[#A8281C]">*</span>
              </label>
              <input
                type="text"
                name="employeeNo"
                value={formData.employeeNo}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 text-sm font-mono bg-slate-50/70 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#102E50]"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Format standar: PSPK-YYYYMM-XXX
              </span>
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
              <div className="md:col-span-2 p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="createUserAccount"
                  name="createUserAccount"
                  checked={formData.createUserAccount}
                  onChange={handleChange}
                  className="w-4 h-4 mt-1 rounded text-[#102E50] focus:ring-[#102E50]"
                />
                <div className="flex flex-col">
                  <label
                    htmlFor="createUserAccount"
                    className="font-bold text-xs text-slate-900 cursor-pointer"
                  >
                    Otomatis Buat Akun Pengguna Portal HRIS
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Sistem akan membuat akun login aktif dengan email kantor ({formData.workEmail || "email kerja"}) dan menetapkan peran dasar &apos;staff&apos; untuk akses portal mandiri.
                  </span>
                </div>
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
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-semibold bg-[#102E50] text-white hover:bg-[#0c233d] transition-all cursor-pointer active:scale-[0.98]"
              >
                <span>Langkah Selanjutnya</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-6 py-2 rounded-lg text-xs font-semibold bg-[#feba48] text-[#102E50] hover:bg-[#e5a63d] transition-all cursor-pointer active:scale-[0.98] shadow-xs disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSubmitting ? "Menyimpan..." : mode === "create" ? "Daftarkan Pegawai" : "Simpan Perubahan"}</span>
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
