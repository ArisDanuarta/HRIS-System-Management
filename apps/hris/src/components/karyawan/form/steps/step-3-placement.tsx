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
} from "lucide-react";
import { useEmployeeForm } from "../employee-form.context";
import { FormSection } from "../../components/FormSection";
import { DocumentUploadCard } from "../../components/DocumentUploadCard";
import { EmployeeStatus } from "@pspk/db";

export function Step3Placement() {
  const {
    formData,
    updateField,
    departments,
    managers,
    workLocations,
    legalEntities,
    nipChecking,
    nipStatus,
    handleGenerateNip,
    handleCheckNipAvailability,
    docOfferLetter,
    setDocOfferLetter,
    docNda,
    setDocNda,
    docPreviousEmployerLetter,
    setDocPreviousEmployerLetter,
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

      {/* 3.3 Berkas Dokumen Pra-Kerja */}
      <FormSection
        id="seksi-dokumen-prakerja"
        title="3.3 Berkas Dokumen Pra-Kerja (Offer Letter & NDA)"
        subtitle="Surat Penawaran Kerja resmi yang telah ditandatangani dan Pakta Integritas / NDA"
        icon={FileText}
        defaultOpen={true}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          <DocumentUploadCard
            label="Surat Pengalaman Kerja / Paklaring (Jika Ada)"
            description="Surat referensi atau keterangan kerja sebelumnya"
            value={docPreviousEmployerLetter}
            onChange={setDocPreviousEmployerLetter}
          />
        </div>
      </FormSection>
    </div>
  );
}
