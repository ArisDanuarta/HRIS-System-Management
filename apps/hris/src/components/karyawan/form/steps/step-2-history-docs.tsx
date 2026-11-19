"use client";

import React from "react";
import {
  GraduationCap,
  Users,
  Award,
  Briefcase,
  Trash2,
  Upload,
  X,
  FileCheck,
} from "lucide-react";
import { useEmployeeForm } from "../employee-form.context";
import { FormSection } from "../../components/FormSection";
import { DynamicTable } from "../../components/DynamicTable";
import {
  FamilyMemberItem,
  EducationItem,
  TrainingItem,
  WorkExperienceItem,
} from "../../types/employee-form.types";
import { FamilyRelation, EducationLevel } from "@pspk/db";

export function Step2HistoryDocs() {
  const {
    familyMembers,
    setFamilyMembers,
    educations,
    setEducations,
    trainings,
    setTrainings,
    workExperiences,
    setWorkExperiences,
  } = useEmployeeForm();

  // Family Members handlers
  const handleAddFamilyMember = () => {
    setFamilyMembers((prev) => [
      ...prev,
      {
        name: "",
        relation: "SPOUSE" as FamilyRelation,
        isDependent: false,
      },
    ]);
  };

  const handleRemoveFamilyMember = (index: number) => {
    setFamilyMembers((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateFamilyMember = <K extends keyof FamilyMemberItem>(
    index: number,
    field: K,
    val: FamilyMemberItem[K],
  ) => {
    setFamilyMembers((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: val } : item)),
    );
  };

  // Education handlers
  const handleAddEducation = () => {
    setEducations((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        level: "S1" as EducationLevel,
        institution: "",
        major: "",
        graduationYear: null,
        certificateFile: null,
        certificateFileName: null,
        certificateDocKey: null,
      },
    ]);
  };

  const handleRemoveEducation = (index: number) => {
    setEducations((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateEducation = <K extends keyof EducationItem>(
    index: number,
    field: K,
    val: EducationItem[K],
  ) => {
    setEducations((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: val } : item)),
    );
  };

  // Training handlers
  const handleAddTraining = () => {
    setTrainings((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: "",
        organizer: "",
        duration: "",
        certificateFile: null,
        certificateFileName: null,
        certificateDocKey: null,
      },
    ]);
  };

  const handleRemoveTraining = (index: number) => {
    setTrainings((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateTraining = <K extends keyof TrainingItem>(
    index: number,
    field: K,
    val: TrainingItem[K],
  ) => {
    setTrainings((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: val } : item)),
    );
  };

  // Work Experience handlers
  const handleAddWorkExperience = () => {
    setWorkExperiences((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        companyName: "",
        jobTitle: "",
        startDate: "",
        endDate: "",
        certificateFile: null,
        certificateFileName: null,
        certificateDocKey: null,
      },
    ]);
  };

  const handleRemoveWorkExperience = (index: number) => {
    setWorkExperiences((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateWorkExperience = <K extends keyof WorkExperienceItem>(
    index: number,
    field: K,
    val: WorkExperienceItem[K],
  ) => {
    setWorkExperiences((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: val } : item)),
    );
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-200">
      {/* 2.1 Data Keluarga */}
      <FormSection
        id="seksi-data-keluarga"
        title="2.1 Anggota Keluarga & Tanggungan"
        subtitle="Data pasangan, anak, atau orang tua yang menjadi tanggungan pegawai"
        icon={Users}
        defaultOpen={true}
      >
        <DynamicTable<FamilyMemberItem>
          title="Daftar Anggota Keluarga"
          description="Tambahkan data keluarga untuk kelengkapan administrasi BPJS & PTKP"
          columns={[
            { key: "name", label: "Nama Anggota Keluarga", width: "w-1/3" },
            { key: "relation", label: "Hubungan", width: "w-1/4" },
            { key: "birthDate", label: "Tanggal Lahir", width: "w-1/4" },
            { key: "isDependent", label: "Tanggungan", width: "w-24 text-center" },
          ]}
          items={familyMembers}
          onAdd={handleAddFamilyMember}
          onRemove={handleRemoveFamilyMember}
          addButtonLabel="+ Tambah Anggota Keluarga"
          emptyMessage="Belum ada anggota keluarga ditambahkan."
          renderDesktopRow={(item, idx) => (
            <>
              <td className="p-3">
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => handleUpdateFamilyMember(idx, "name", e.target.value)}
                  placeholder="Nama lengkap"
                  className="w-full h-9 px-2.5 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#102E50]"
                />
              </td>
              <td className="p-3">
                <select
                  value={item.relation}
                  onChange={(e) =>
                    handleUpdateFamilyMember(idx, "relation", e.target.value as FamilyRelation)
                  }
                  className="w-full h-9 px-2.5 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#102E50]"
                >
                  <option value="SPOUSE">Suami / Istri</option>
                  <option value="CHILD">Anak Kandung / Angkat</option>
                  <option value="PARENT">Orang Tua</option>
                  <option value="SIBLING">Saudara Kandung</option>
                  <option value="OTHER">Lainnya</option>
                </select>
              </td>
              <td className="p-3">
                <input
                  type="date"
                  value={item.birthDate || ""}
                  onChange={(e) => handleUpdateFamilyMember(idx, "birthDate", e.target.value)}
                  className="w-full h-9 px-2.5 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#102E50]"
                />
              </td>
              <td className="p-3 text-center">
                <input
                  type="checkbox"
                  checked={item.isDependent}
                  onChange={(e) => handleUpdateFamilyMember(idx, "isDependent", e.target.checked)}
                  className="w-4 h-4 rounded text-[#102E50] focus:ring-[#102E50]"
                />
              </td>
            </>
          )}
          renderMobileCard={(item, idx, onRemove) => (
            <div className="flex flex-col gap-2 p-3 bg-slate-50/60 rounded-xl border border-slate-200 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">Anggota #{idx + 1}</span>
                <button
                  type="button"
                  onClick={onRemove}
                  className="text-rose-600 hover:text-rose-700 p-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <input
                type="text"
                value={item.name}
                onChange={(e) => handleUpdateFamilyMember(idx, "name", e.target.value)}
                placeholder="Nama lengkap"
                className="h-9 px-2.5 rounded-lg border border-slate-200 bg-white"
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={item.relation}
                  onChange={(e) =>
                    handleUpdateFamilyMember(idx, "relation", e.target.value as FamilyRelation)
                  }
                  className="h-9 px-2 rounded-lg border border-slate-200 bg-white text-xs"
                >
                  <option value="SPOUSE">Suami/Istri</option>
                  <option value="CHILD">Anak</option>
                  <option value="PARENT">Orang Tua</option>
                  <option value="SIBLING">Saudara</option>
                  <option value="OTHER">Lainnya</option>
                </select>
                <input
                  type="date"
                  value={item.birthDate || ""}
                  onChange={(e) => handleUpdateFamilyMember(idx, "birthDate", e.target.value)}
                  className="h-9 px-2 rounded-lg border border-slate-200 bg-white text-xs"
                />
              </div>
            </div>
          )}
        />
      </FormSection>

      {/* 2.2 Riwayat Pendidikan */}
      <FormSection
        id="seksi-pendidikan"
        title="2.2 Riwayat Pendidikan Formal & Ijazah"
        subtitle="Jenjang pendidikan formal (SD, SMP, SMA/SMK, Diploma, Sarjana, Pascasarjana) beserta unggahan ijazah"
        icon={GraduationCap}
        defaultOpen={true}
      >
        <DynamicTable<EducationItem>
          title="Daftar Riwayat Pendidikan"
          columns={[
            { key: "level", label: "Jenjang", width: "w-28" },
            { key: "institution", label: "Nama Sekolah / Universitas", width: "w-1/4" },
            { key: "major", label: "Jurusan / Program Studi", width: "w-1/5" },
            { key: "year", label: "Tahun Lulus", width: "w-20 text-center" },
            { key: "certificateFile", label: "Berkas Ijazah (PDF/Gbr)", width: "w-44" },
          ]}
          items={educations}
          onAdd={handleAddEducation}
          onRemove={handleRemoveEducation}
          addButtonLabel="+ Tambah Riwayat Pendidikan"
          emptyMessage="Belum ada riwayat pendidikan ditambahkan."
          renderDesktopRow={(item, idx) => {
            const currentLevel = (item.level === ("SMA" as unknown) ? "SMA_SMK" : item.level) || "S1";
            return (
              <>
                <td className="p-3">
                  <select
                    value={currentLevel}
                    onChange={(e) =>
                      handleUpdateEducation(idx, "level", e.target.value as EducationLevel)
                    }
                    className="w-full h-9 px-2 rounded-lg border border-slate-200 text-xs bg-white font-medium"
                  >
                    <option value="SD">SD / Sederajat</option>
                    <option value="SMP">SMP / MTs</option>
                    <option value="SMA_SMK">SMA / SMK / MA</option>
                    <option value="D3">Diploma 3 (D3)</option>
                    <option value="D4">Sarjana Terapan (D4)</option>
                    <option value="S1">Sarjana (S1)</option>
                    <option value="S2">Magister (S2)</option>
                    <option value="S3">Doktor (S3)</option>
                    <option value="OTHER">Lainnya</option>
                  </select>
                </td>
                <td className="p-3">
                  <input
                    type="text"
                    value={item.institution}
                    onChange={(e) => handleUpdateEducation(idx, "institution", e.target.value)}
                    placeholder="Contoh: Universitas Indonesia"
                    className="w-full h-9 px-2.5 rounded-lg border border-slate-200 text-xs bg-white"
                  />
                </td>
                <td className="p-3">
                  <input
                    type="text"
                    value={item.major || ""}
                    onChange={(e) => handleUpdateEducation(idx, "major", e.target.value)}
                    placeholder="Contoh: Kebijakan Publik"
                    className="w-full h-9 px-2.5 rounded-lg border border-slate-200 text-xs bg-white"
                  />
                </td>
                <td className="p-3 text-center">
                  <input
                    type="number"
                    value={item.graduationYear || ""}
                    onChange={(e) =>
                      handleUpdateEducation(idx, "graduationYear", parseInt(e.target.value) || null)
                    }
                    placeholder="2020"
                    className="w-full h-9 px-2 text-center rounded-lg border border-slate-200 text-xs bg-white"
                  />
                </td>
                <td className="p-3">
                  {item.certificateFile || item.certificateDocKey ? (
                    <div className="flex items-center justify-between gap-1.5 px-2.5 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <FileCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span
                          className="truncate max-w-[110px] font-medium"
                          title={item.certificateFile?.name || item.certificateFileName || "Ijazah"}
                        >
                          {item.certificateFile?.name || item.certificateFileName || "Ijazah"}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          handleUpdateEducation(idx, "certificateFile", null);
                          handleUpdateEducation(idx, "certificateFileName", null);
                          handleUpdateEducation(idx, "certificateDocKey", null);
                        }}
                        className="text-rose-500 hover:text-rose-700 p-0.5 cursor-pointer shrink-0"
                        title="Hapus berkas"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-dashed border-slate-300 text-slate-600 hover:text-[#102E50] hover:border-[#102E50] text-[11px] font-semibold bg-white cursor-pointer transition-colors shadow-2xs">
                      <Upload className="w-3.5 h-3.5 text-slate-400" />
                      <span>Unggah Ijazah</span>
                      <input
                        type="file"
                        accept="application/pdf,image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleUpdateEducation(idx, "certificateFile", file);
                            handleUpdateEducation(idx, "certificateFileName", file.name);
                          }
                        }}
                      />
                    </label>
                  )}
                </td>
              </>
            );
          }}
          renderMobileCard={(item, idx, onRemove) => {
            const currentLevel = (item.level === ("SMA" as unknown) ? "SMA_SMK" : item.level) || "S1";
            return (
              <div className="flex flex-col gap-2.5 p-3.5 bg-slate-50/60 rounded-xl border border-slate-200 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">Pendidikan #{idx + 1}</span>
                  <button
                    type="button"
                    onClick={onRemove}
                    className="text-rose-600 p-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={currentLevel}
                    onChange={(e) =>
                      handleUpdateEducation(idx, "level", e.target.value as EducationLevel)
                    }
                    className="h-9 px-2 rounded-lg border border-slate-200 bg-white text-xs font-medium"
                  >
                    <option value="SD">SD / Sederajat</option>
                    <option value="SMP">SMP / MTs</option>
                    <option value="SMA_SMK">SMA / SMK / MA</option>
                    <option value="D3">Diploma 3 (D3)</option>
                    <option value="D4">Sarjana Terapan (D4)</option>
                    <option value="S1">Sarjana (S1)</option>
                    <option value="S2">Magister (S2)</option>
                    <option value="S3">Doktor (S3)</option>
                    <option value="OTHER">Lainnya</option>
                  </select>
                  <input
                    type="number"
                    value={item.graduationYear || ""}
                    onChange={(e) =>
                      handleUpdateEducation(idx, "graduationYear", parseInt(e.target.value) || null)
                    }
                    placeholder="Tahun Lulus"
                    className="h-9 px-2.5 rounded-lg border border-slate-200 bg-white text-center"
                  />
                </div>
                <input
                  type="text"
                  value={item.institution}
                  onChange={(e) => handleUpdateEducation(idx, "institution", e.target.value)}
                  placeholder="Nama Institusi / Sekolah / Universitas"
                  className="h-9 px-2.5 rounded-lg border border-slate-200 bg-white"
                />
                <input
                  type="text"
                  value={item.major || ""}
                  onChange={(e) => handleUpdateEducation(idx, "major", e.target.value)}
                  placeholder="Jurusan / Program Studi"
                  className="h-9 px-2.5 rounded-lg border border-slate-200 bg-white"
                />
                <div className="pt-1 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-500">Ijazah (PDF/Gbr):</span>
                  {item.certificateFile || item.certificateDocKey ? (
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs">
                      <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="truncate max-w-[120px] font-medium">
                        {item.certificateFile?.name || item.certificateFileName || "Ijazah"}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          handleUpdateEducation(idx, "certificateFile", null);
                          handleUpdateEducation(idx, "certificateFileName", null);
                          handleUpdateEducation(idx, "certificateDocKey", null);
                        }}
                        className="text-rose-500 hover:text-rose-700 p-0.5"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <label className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-dashed border-slate-300 text-slate-600 text-[11px] font-semibold bg-white cursor-pointer">
                      <Upload className="w-3 h-3 text-slate-400" />
                      <span>Unggah Ijazah</span>
                      <input
                        type="file"
                        accept="application/pdf,image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleUpdateEducation(idx, "certificateFile", file);
                            handleUpdateEducation(idx, "certificateFileName", file.name);
                          }
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>
            );
          }}
        />
      </FormSection>

      {/* 2.3 Pelatihan & Sertifikasi */}
      <FormSection
        id="seksi-pelatihan"
        title="2.3 Pelatihan & Sertifikasi Kompetensi"
        subtitle="Kursus, sertifikasi profesi, dan workshop relevan beserta dokumen sertifikat"
        icon={Award}
        defaultOpen={false}
      >
        <DynamicTable<TrainingItem>
          title="Daftar Pelatihan & Sertifikasi"
          columns={[
            { key: "name", label: "Nama Pelatihan / Sertifikasi", width: "w-1/3" },
            { key: "organizer", label: "Penyelenggara", width: "w-1/4" },
            { key: "duration", label: "Durasi / Tahun", width: "w-24 text-center" },
            { key: "certificateFile", label: "Berkas Sertifikat (PDF/Gbr)", width: "w-44" },
          ]}
          items={trainings}
          onAdd={handleAddTraining}
          onRemove={handleRemoveTraining}
          addButtonLabel="+ Tambah Sertifikasi"
          emptyMessage="Belum ada sertifikasi ditambahkan."
          renderDesktopRow={(item, idx) => (
            <>
              <td className="p-3">
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => handleUpdateTraining(idx, "name", e.target.value)}
                  placeholder="Nama pelatihan atau sertifikat"
                  className="w-full h-9 px-2.5 rounded-lg border border-slate-200 text-xs bg-white"
                />
              </td>
              <td className="p-3">
                <input
                  type="text"
                  value={item.organizer || ""}
                  onChange={(e) => handleUpdateTraining(idx, "organizer", e.target.value)}
                  placeholder="Lembaga penerbit"
                  className="w-full h-9 px-2.5 rounded-lg border border-slate-200 text-xs bg-white"
                />
              </td>
              <td className="p-3 text-center">
                <input
                  type="text"
                  value={item.duration || ""}
                  onChange={(e) => handleUpdateTraining(idx, "duration", e.target.value)}
                  placeholder="32 Jam / 2023"
                  className="w-full h-9 px-2 text-center rounded-lg border border-slate-200 text-xs bg-white"
                />
              </td>
              <td className="p-3">
                {item.certificateFile || item.certificateDocKey ? (
                  <div className="flex items-center justify-between gap-1.5 px-2.5 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <FileCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span
                        className="truncate max-w-[110px] font-medium"
                        title={item.certificateFile?.name || item.certificateFileName || "Sertifikat"}
                      >
                        {item.certificateFile?.name || item.certificateFileName || "Sertifikat"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        handleUpdateTraining(idx, "certificateFile", null);
                        handleUpdateTraining(idx, "certificateFileName", null);
                        handleUpdateTraining(idx, "certificateDocKey", null);
                      }}
                      className="text-rose-500 hover:text-rose-700 p-0.5 cursor-pointer shrink-0"
                      title="Hapus berkas"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-dashed border-slate-300 text-slate-600 hover:text-[#102E50] hover:border-[#102E50] text-[11px] font-semibold bg-white cursor-pointer transition-colors shadow-2xs">
                    <Upload className="w-3.5 h-3.5 text-slate-400" />
                    <span>Unggah Sertifikat</span>
                    <input
                      type="file"
                      accept="application/pdf,image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleUpdateTraining(idx, "certificateFile", file);
                          handleUpdateTraining(idx, "certificateFileName", file.name);
                        }
                      }}
                    />
                  </label>
                )}
              </td>
            </>
          )}
          renderMobileCard={(item, idx, onRemove) => (
            <div className="flex flex-col gap-2.5 p-3.5 bg-slate-50/60 rounded-xl border border-slate-200 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">Sertifikat #{idx + 1}</span>
                <button
                  type="button"
                  onClick={onRemove}
                  className="text-rose-600 p-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <input
                type="text"
                value={item.name}
                onChange={(e) => handleUpdateTraining(idx, "name", e.target.value)}
                placeholder="Nama Pelatihan / Sertifikasi"
                className="h-9 px-2.5 rounded-lg border border-slate-200 bg-white"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={item.organizer || ""}
                  onChange={(e) => handleUpdateTraining(idx, "organizer", e.target.value)}
                  placeholder="Penyelenggara"
                  className="h-9 px-2.5 rounded-lg border border-slate-200 bg-white"
                />
                <input
                  type="text"
                  value={item.duration || ""}
                  onChange={(e) => handleUpdateTraining(idx, "duration", e.target.value)}
                  placeholder="Durasi / Tahun"
                  className="h-9 px-2.5 rounded-lg border border-slate-200 bg-white text-center"
                />
              </div>
              <div className="pt-1 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500">Sertifikat:</span>
                {item.certificateFile || item.certificateDocKey ? (
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs">
                    <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="truncate max-w-[120px] font-medium">
                      {item.certificateFile?.name || item.certificateFileName || "Sertifikat"}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        handleUpdateTraining(idx, "certificateFile", null);
                        handleUpdateTraining(idx, "certificateFileName", null);
                        handleUpdateTraining(idx, "certificateDocKey", null);
                      }}
                      className="text-rose-500 hover:text-rose-700 p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-dashed border-slate-300 text-slate-600 text-[11px] font-semibold bg-white cursor-pointer">
                    <Upload className="w-3 h-3 text-slate-400" />
                    <span>Unggah Sertifikat</span>
                    <input
                      type="file"
                      accept="application/pdf,image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleUpdateTraining(idx, "certificateFile", file);
                          handleUpdateTraining(idx, "certificateFileName", file.name);
                        }
                      }}
                    />
                  </label>
                )}
              </div>
            </div>
          )}
        />
      </FormSection>

      {/* 2.4 Pengalaman Kerja Sebelumnya */}
      <FormSection
        id="seksi-pengalaman-kerja"
        title="2.4 Pengalaman Kerja Sebelumnya & Berkas"
        subtitle="Riwayat institusi tempat bekerja sebelumnya beserta surat keterangan kerja / paklaring / portofolio"
        icon={Briefcase}
        defaultOpen={false}
      >
        <DynamicTable<WorkExperienceItem>
          title="Daftar Pengalaman Kerja"
          columns={[
            { key: "company", label: "Nama Perusahaan / Organisasi", width: "w-1/4" },
            { key: "jobTitle", label: "Posisi / Jabatan", width: "w-1/4" },
            { key: "period", label: "Periode Kerja", width: "w-1/4" },
            { key: "certificateFile", label: "Paklaring / Dokumen (PDF/Gbr)", width: "w-44" },
          ]}
          items={workExperiences}
          onAdd={handleAddWorkExperience}
          onRemove={handleRemoveWorkExperience}
          addButtonLabel="+ Tambah Pengalaman Kerja"
          emptyMessage="Belum ada riwayat pekerjaan sebelumnya ditambahkan."
          renderDesktopRow={(item, idx) => (
            <>
              <td className="p-3">
                <input
                  type="text"
                  value={item.companyName}
                  onChange={(e) => handleUpdateWorkExperience(idx, "companyName", e.target.value)}
                  placeholder="Contoh: PT Riset Kebijakan Utama"
                  className="w-full h-9 px-2.5 rounded-lg border border-slate-200 text-xs bg-white"
                />
              </td>
              <td className="p-3">
                <input
                  type="text"
                  value={item.jobTitle}
                  onChange={(e) => handleUpdateWorkExperience(idx, "jobTitle", e.target.value)}
                  placeholder="Contoh: Junior Policy Analyst"
                  className="w-full h-9 px-2.5 rounded-lg border border-slate-200 text-xs bg-white"
                />
              </td>
              <td className="p-3">
                <div className="flex items-center gap-1.5 text-xs">
                  <input
                    type="month"
                    value={item.startDate || ""}
                    onChange={(e) => handleUpdateWorkExperience(idx, "startDate", e.target.value)}
                    className="h-9 px-2 rounded-lg border border-slate-200 text-xs bg-white"
                  />
                  <span>-</span>
                  <input
                    type="month"
                    value={item.endDate || ""}
                    onChange={(e) => handleUpdateWorkExperience(idx, "endDate", e.target.value)}
                    disabled={item.isCurrent}
                    placeholder="Selesai"
                    className="h-9 px-2 rounded-lg border border-slate-200 text-xs bg-white"
                  />
                </div>
              </td>
              <td className="p-3">
                {item.certificateFile || item.certificateDocKey ? (
                  <div className="flex items-center justify-between gap-1.5 px-2.5 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <FileCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span
                        className="truncate max-w-[110px] font-medium"
                        title={item.certificateFile?.name || item.certificateFileName || "Paklaring"}
                      >
                        {item.certificateFile?.name || item.certificateFileName || "Paklaring"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        handleUpdateWorkExperience(idx, "certificateFile", null);
                        handleUpdateWorkExperience(idx, "certificateFileName", null);
                        handleUpdateWorkExperience(idx, "certificateDocKey", null);
                      }}
                      className="text-rose-500 hover:text-rose-700 p-0.5 cursor-pointer shrink-0"
                      title="Hapus berkas"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-dashed border-slate-300 text-slate-600 hover:text-[#102E50] hover:border-[#102E50] text-[11px] font-semibold bg-white cursor-pointer transition-colors shadow-2xs">
                    <Upload className="w-3.5 h-3.5 text-slate-400" />
                    <span>Unggah Berkas</span>
                    <input
                      type="file"
                      accept="application/pdf,image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleUpdateWorkExperience(idx, "certificateFile", file);
                          handleUpdateWorkExperience(idx, "certificateFileName", file.name);
                        }
                      }}
                    />
                  </label>
                )}
              </td>
            </>
          )}
          renderMobileCard={(item, idx, onRemove) => (
            <div className="flex flex-col gap-2.5 p-3.5 bg-slate-50/60 rounded-xl border border-slate-200 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">
                  {item.companyName || `Pengalaman #${idx + 1}`}
                </span>
                <button
                  type="button"
                  onClick={onRemove}
                  className="text-rose-600 p-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <input
                type="text"
                value={item.companyName}
                onChange={(e) => handleUpdateWorkExperience(idx, "companyName", e.target.value)}
                placeholder="Nama Perusahaan / Organisasi"
                className="h-9 px-2.5 rounded-lg border border-slate-200 bg-white"
              />
              <input
                type="text"
                value={item.jobTitle}
                onChange={(e) => handleUpdateWorkExperience(idx, "jobTitle", e.target.value)}
                placeholder="Jabatan / Posisi"
                className="h-9 px-2.5 rounded-lg border border-slate-200 bg-white"
              />
              <div className="pt-1 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500">Paklaring / Portofolio:</span>
                {item.certificateFile || item.certificateDocKey ? (
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs">
                    <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="truncate max-w-[120px] font-medium">
                      {item.certificateFile?.name || item.certificateFileName || "Paklaring"}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        handleUpdateWorkExperience(idx, "certificateFile", null);
                        handleUpdateWorkExperience(idx, "certificateFileName", null);
                        handleUpdateWorkExperience(idx, "certificateDocKey", null);
                      }}
                      className="text-rose-500 hover:text-rose-700 p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-dashed border-slate-300 text-slate-600 text-[11px] font-semibold bg-white cursor-pointer">
                    <Upload className="w-3 h-3 text-slate-400" />
                    <span>Unggah Berkas</span>
                    <input
                      type="file"
                      accept="application/pdf,image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleUpdateWorkExperience(idx, "certificateFile", file);
                          handleUpdateWorkExperience(idx, "certificateFileName", file.name);
                        }
                      }}
                    />
                  </label>
                )}
              </div>
            </div>
          )}
        />
      </FormSection>
    </div>
  );
}
