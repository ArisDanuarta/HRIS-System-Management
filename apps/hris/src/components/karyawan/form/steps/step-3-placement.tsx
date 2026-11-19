"use client";

import React from "react";
import {
  Briefcase,
  Sparkles,
  Loader2,
  CheckCircle2,
  XCircle,
  FileText,
  Building2,
  Plus,
  ShieldCheck,
} from "lucide-react";
import { useEmployeeForm } from "../employee-form.context";
import { FormSection } from "../../components/FormSection";
import { DocumentUploadCard } from "../../components/DocumentUploadCard";
import { EmployeeStatus, EmploymentType, WageType } from "@pspk/db";

export function Step3Placement() {
  const {
    formData,
    updateField,
    departments,
    managers,
    workLocations,
    legalEntities,
    employmentTypesList,
    setIsQuickCreateModalOpen,
    nipChecking,
    nipStatus,
    handleGenerateNip,
    handleCheckNipAvailability,
    docOfferLetter,
    setDocOfferLetter,
    docNda,
    setDocNda,
    docContract,
    setDocContract,
    mode,
  } = useEmployeeForm();

  // Filter positions based on selected department
  const selectedDept = departments.find((d) => d.id === formData.currentDepartmentId);
  const availablePositions = selectedDept?.positions || [];

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-200">
      {/* 3.1 NIP & Status Kepegawaian */}
      <FormSection
        id="seksi-nip-status"
        title="3.1 Nomor Induk Pegawai & Status Masuk"
        subtitle="Penetapan NIP resmi lembaga dan tanggal mulai bergabung kerja"
        icon={Briefcase}
        defaultOpen={true}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
          {/* NIP Field with Generator Button */}
          <div className="sm:col-span-2 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="employeeNo" className="font-bold text-slate-700">
                Nomor Induk Pegawai (NIP) <span className="text-[#A8281C]">*</span>
              </label>
              {mode === "create" && (
                <button
                  type="button"
                  onClick={handleGenerateNip}
                  disabled={nipChecking}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#102E50] hover:text-[#0c233d] hover:underline cursor-pointer disabled:opacity-50"
                >
                  {nipChecking ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3 text-[#F2AF3E]" />
                  )}
                  <span>Generate NIP Otomatis</span>
                </button>
              )}
            </div>

            <div className="relative">
              <input
                id="employeeNo"
                type="text"
                required
                value={formData.employeeNo}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase();
                  updateField("employeeNo", val);
                  handleCheckNipAvailability(val);
                }}
                placeholder="Contoh: PSPK-202401-001"
                className="w-full h-10 px-3 pr-10 rounded-lg border border-slate-200 bg-white font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50] transition-all"
              />

              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {nipChecking && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
                {!nipChecking && nipStatus && nipStatus.available && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                )}
                {!nipChecking && nipStatus && !nipStatus.available && (
                  <XCircle className="w-4 h-4 text-rose-600" />
                )}
              </div>
            </div>

            {nipStatus && (
              <span
                className={`text-[10.5px] font-medium ${
                  nipStatus.available ? "text-emerald-700" : "text-rose-600"
                }`}
              >
                {nipStatus.message}
              </span>
            )}
          </div>

          {/* Tanggal Bergabung */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="joinDate" className="font-bold text-slate-700">
              Tanggal Mulai Bergabung <span className="text-[#A8281C]">*</span>
            </label>
            <input
              id="joinDate"
              type="date"
              required
              value={formData.joinDate}
              onChange={(e) => updateField("joinDate", e.target.value)}
              className="h-10 px-3 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50] transition-all"
            />
          </div>

          {/* Status Pegawai */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="status" className="font-bold text-slate-700">
              Status Kepegawaian <span className="text-[#A8281C]">*</span>
            </label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => updateField("status", e.target.value as EmployeeStatus)}
              className="h-10 px-3 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50] transition-all font-semibold text-slate-800"
            >
              <option value="ACTIVE">Aktif (Active)</option>
              <option value="PROBATION">Masa Percobaan (Probation)</option>
              <option value="RESIGNED">Mengundurkan Diri (Resigned)</option>
              <option value="TERMINATED">Diberhentikan (Terminated)</option>
            </select>
          </div>

          {/* Akhir Probation jika status probation */}
          {formData.status === "PROBATION" && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="probationEndDate" className="font-bold text-slate-700">
                Tanggal Akhir Masa Percobaan
              </label>
              <input
                id="probationEndDate"
                type="date"
                value={formData.probationEndDate}
                onChange={(e) => updateField("probationEndDate", e.target.value)}
                className="h-10 px-3 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50] transition-all"
              />
            </div>
          )}

          {/* Tanggal Keluar jika Resigned/Terminated */}
          {(formData.status === "RESIGNED" || formData.status === "TERMINATED") && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="endDate" className="font-bold text-slate-700">
                Tanggal Terakhir Bekerja
              </label>
              <input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => updateField("endDate", e.target.value)}
                className="h-10 px-3 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50] transition-all"
              />
            </div>
          )}
        </div>
      </FormSection>

      {/* 3.2 Penempatan Tim & Atasan */}
      <FormSection
        id="seksi-penempatan-tim"
        title="3.2 Penempatan Divisi & Struktur Hierarki"
        subtitle="Divisi, posisi kerja, dan atasan langsung yang bertanggung jawab"
        icon={Building2}
        defaultOpen={true}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
          {/* Departemen / Divisi */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="currentDepartmentId" className="font-bold text-slate-700">
              Divisi / Departemen <span className="text-[#A8281C]">*</span>
            </label>
            <select
              id="currentDepartmentId"
              required
              value={formData.currentDepartmentId}
              onChange={(e) => {
                const deptId = e.target.value;
                updateField("currentDepartmentId", deptId);
                // Reset position if dept changed
                const dept = departments.find((d) => d.id === deptId);
                if (dept && dept.positions[0]) {
                  updateField("currentPositionId", dept.positions[0].id);
                } else {
                  updateField("currentPositionId", "");
                }
              }}
              className="h-10 px-3 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50] transition-all"
            >
              <option value="">Pilih Divisi</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          {/* Posisi / Jabatan */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="currentPositionId" className="font-bold text-slate-700">
              Posisi / Jabatan Kerja <span className="text-[#A8281C]">*</span>
            </label>
            <select
              id="currentPositionId"
              required
              value={formData.currentPositionId}
              onChange={(e) => updateField("currentPositionId", e.target.value)}
              className="h-10 px-3 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50] transition-all"
            >
              <option value="">Pilih Jabatan</option>
              {availablePositions.map((pos) => (
                <option key={pos.id} value={pos.id}>
                  {pos.title}
                </option>
              ))}
            </select>
          </div>

          {/* Atasan Langsung */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="managerId" className="font-bold text-slate-700">
              Atasan Langsung (Direct Manager)
            </label>
            <select
              id="managerId"
              value={formData.managerId}
              onChange={(e) => updateField("managerId", e.target.value)}
              className="h-10 px-3 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50] transition-all"
            >
              <option value="">Tanpa Atasan (Direktur / Mandiri)</option>
              {managers.map((mgr) => (
                <option key={mgr.id} value={mgr.id}>
                  {mgr.fullName} ({mgr.currentPosition?.title || mgr.employeeNo})
                </option>
              ))}
            </select>
          </div>

          {/* Entitas Hukum */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="legalEntityId" className="font-bold text-slate-700">
              Entitas Hukum Lembaga
            </label>
            <select
              id="legalEntityId"
              value={formData.legalEntityId}
              onChange={(e) => updateField("legalEntityId", e.target.value)}
              className="h-10 px-3 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50] transition-all"
            >
              <option value="">Pilih Entitas Hukum</option>
              {legalEntities.map((ent) => (
                <option key={ent.id} value={ent.id}>
                  {ent.name}
                </option>
              ))}
            </select>
          </div>

          {/* Lokasi Kerja */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="workLocationId" className="font-bold text-slate-700">
              Lokasi Kerja Penempatan
            </label>
            <select
              id="workLocationId"
              value={formData.workLocationId}
              onChange={(e) => updateField("workLocationId", e.target.value)}
              className="h-10 px-3 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50] transition-all"
            >
              <option value="">Pilih Lokasi Kerja</option>
              {workLocations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </FormSection>

      {/* 3.3 Tipe Ikatan Kerja & Periode Perjanjian */}
      <FormSection
        id="seksi-ikatan-kerja"
        title="3.3 Tipe Ikatan Kerja & Periode Perjanjian"
        subtitle="Skema hubungan kerja formal, jangka waktu kontrak, dan nomor dokumen perjanjian"
        icon={FileText}
        defaultOpen={true}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
          {/* Tipe Ikatan Kerja */}
          <div className="sm:col-span-2 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="employmentTypeId" className="font-bold text-slate-700">
                Tipe Ikatan Kerja <span className="text-[#A8281C]">*</span>
              </label>
              <button
                type="button"
                onClick={() => setIsQuickCreateModalOpen(true)}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#102E50] hover:underline cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Tipe Baru</span>
              </button>
            </div>

            <select
              id="employmentTypeId"
              required
              value={formData.employmentTypeId}
              onChange={(e) => {
                const selectedId = e.target.value;
                updateField("employmentTypeId", selectedId);
                const selected = employmentTypesList.find((t) => t.id === selectedId);
                if (selected) {
                  updateField("employmentType", selected.category as EmploymentType);
                  updateField("wageType", selected.wageType as WageType);
                  if (selected.defaultHourlyRate && selected.wageType === "HOURLY") {
                    updateField("hourlyRate", selected.defaultHourlyRate);
                  }
                }
              }}
              className="h-10 px-3 rounded-lg border border-slate-200 bg-white font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50] transition-all"
            >
              <option value="">Pilih Tipe Ikatan Kerja</option>
              {employmentTypesList.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name} ({type.category === "PERMANENT" ? "PKWTT Tetap" : "PKWT Tertentu"} ·{" "}
                  {type.wageType === "MONTHLY" ? "Upah Bulanan" : "Upah Per Jam"})
                </option>
              ))}
            </select>
          </div>

          {/* Tipe Upah */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="wageType" className="font-bold text-slate-700">
              Skema Pengupahan
            </label>
            <select
              id="wageType"
              value={formData.wageType}
              onChange={(e) => updateField("wageType", e.target.value as WageType)}
              className="h-10 px-3 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50] transition-all"
            >
              <option value="MONTHLY">Bulanan (Monthly Salary)</option>
              <option value="HOURLY">Per Jam (Hourly Rate / Timesheet)</option>
            </select>
          </div>

          {/* Tanggal Mulai Kontrak */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="contractStartDate" className="font-bold text-slate-700">
              Tanggal Mulai Kontrak <span className="text-[#A8281C]">*</span>
            </label>
            <input
              id="contractStartDate"
              type="date"
              required
              value={formData.contractStartDate}
              onChange={(e) => updateField("contractStartDate", e.target.value)}
              className="h-10 px-3 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50] transition-all"
            />
          </div>

          {/* Tanggal Berakhir Kontrak */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="contractEndDate" className="font-bold text-slate-700">
              Tanggal Berakhir Kontrak{" "}
              {formData.employmentType === "FIXED_TERM" && (
                <span className="text-[#A8281C]">*</span>
              )}
            </label>
            <input
              id="contractEndDate"
              type="date"
              value={formData.contractEndDate}
              onChange={(e) => updateField("contractEndDate", e.target.value)}
              className="h-10 px-3 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50] transition-all"
            />
            {formData.employmentType === "PERMANENT" && (
              <span className="text-[10px] text-slate-400">Kosongkan untuk pegawai tetap.</span>
            )}
          </div>

          {/* Nomor Surat Perjanjian */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="contractNumber" className="font-bold text-slate-700">
              Nomor Dokumen Kontrak / SPK
            </label>
            <input
              id="contractNumber"
              type="text"
              value={formData.contractNumber}
              onChange={(e) => updateField("contractNumber", e.target.value)}
              placeholder="Contoh: 001/SPK/PSPK/I/2024"
              className="h-10 px-3 rounded-lg border border-slate-200 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50] transition-all"
            />
          </div>

          {/* Catatan / Klausul Kontrak */}
          <div className="sm:col-span-3 flex flex-col gap-1.5">
            <label htmlFor="contractNotes" className="font-bold text-slate-700">
              Catatan / Klausul Khusus Perjanjian (Opsional)
            </label>
            <input
              id="contractNotes"
              type="text"
              value={formData.contractNotes}
              onChange={(e) => updateField("contractNotes", e.target.value)}
              placeholder="Misal: Evaluasi kinerja setiap 6 bulan atau klausul remote working"
              className="h-10 px-3 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50] transition-all"
            />
          </div>
        </div>
      </FormSection>

      {/* 3.4 Berkas Dokumen Legalitas Kerja & Pra-Kerja */}
      <FormSection
        id="seksi-dokumen-legalitas"
        title="3.4 Berkas Dokumen Legalitas & Pra-Kerja"
        subtitle="Dokumen Perjanjian Kerja (PKWT/PKWTT), Surat Penawaran Kerja (Offer Letter), dan Pakta Integritas / NDA"
        icon={ShieldCheck}
        defaultOpen={true}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <DocumentUploadCard
            label="Berkas Dokumen Kontrak Kerja (PKWT / PKWTT)"
            description="Salinan dokumen kontrak kerja resmi yang telah ditandatangani kedua belah pihak (PDF / Gambar, maks. 10MB)"
            value={docContract}
            onChange={setDocContract}
          />
          <DocumentUploadCard
            label="Surat Penawaran Kerja (Signed Offer Letter)"
            description="Dokumen persetujuan penawaran kerja dari kandidat"
            value={docOfferLetter}
            onChange={setDocOfferLetter}
          />
          <DocumentUploadCard
            label="Non-Disclosure Agreement (NDA) / Pakta Integritas"
            description="Perjanjian kerahasiaan data riset dan kebijakan PSPK"
            value={docNda}
            onChange={setDocNda}
          />
        </div>
      </FormSection>
    </div>
  );
}
