"use client";

import React, { useState } from "react";
import {
  GraduationCap,
  Users,
  Award,
  Briefcase,
  FolderArchive,
  Plus,
  Trash2,
} from "lucide-react";
import { useEmployeeForm } from "../employee-form.context";
import { FormSection } from "../../components/FormSection";
import { DynamicTable } from "../../components/DynamicTable";
import { DocumentUploadCard } from "../../components/DocumentUploadCard";
import {
  FamilyMemberItem,
  EducationItem,
  TrainingItem,
  WorkExperienceItem,
} from "../../types/employee-form.types";
import { FamilyRelation, EducationLevel } from "@pspk/db";

export function Step2HistoryDocs() {
  const {
    formData,
    familyMembers,
    setFamilyMembers,
    educations,
    setEducations,
    trainings,
    setTrainings,
    workExperiences,
    setWorkExperiences,
    docCv,
    setDocCv,
    docDiploma,
    setDocDiploma,
    docFamilyCard,
    setDocFamilyCard,
    docMarriageCert,
    setDocMarriageCert,
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

  const handleUpdateFamilyMember = (
    index: number,
    field: keyof FamilyMemberItem,
    val: any,
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
        level: "S1" as EducationLevel,
        institution: "",
      },
    ]);
  };

  const handleRemoveEducation = (index: number) => {
    setEducations((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateEducation = (index: number, field: keyof EducationItem, val: any) => {
    setEducations((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: val } : item)),
    );
  };

  // Training handlers
  const handleAddTraining = () => {
    setTrainings((prev) => [
      ...prev,
      {
        name: "",
      },
    ]);
  };

  const handleRemoveTraining = (index: number) => {
    setTrainings((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateTraining = (index: number, field: keyof TrainingItem, val: any) => {
    setTrainings((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: val } : item)),
    );
  };

  // Work Experience handlers
  const handleAddWorkExperience = () => {
    setWorkExperiences((prev) => [
      ...prev,
      {
        companyName: "",
        jobTitle: "",
        startDate: "",
      },
    ]);
  };

  const handleRemoveWorkExperience = (index: number) => {
    setWorkExperiences((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateWorkExperience = (
    index: number,
    field: keyof WorkExperienceItem,
    val: any,
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
                  onChange={(e) => handleUpdateFamilyMember(idx, "relation", e.target.value)}
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
                  className="text-rose-600 hover:text-rose-700 p-1"
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
                  onChange={(e) => handleUpdateFamilyMember(idx, "relation", e.target.value)}
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
        title="2.2 Riwayat Pendidikan Formal"
        subtitle="Jenjang pendidikan formal yang pernah ditempuh (SMA, D3, S1, S2, S3)"
        icon={GraduationCap}
        defaultOpen={true}
      >
        <DynamicTable<EducationItem>
          title="Daftar Riwayat Pendidikan"
          columns={[
            { key: "level", label: "Jenjang", width: "w-28" },
            { key: "institution", label: "Nama Sekolah / Universitas", width: "w-1/3" },
            { key: "major", label: "Jurusan / Program Studi", width: "w-1/4" },
            { key: "year", label: "Tahun Lulus", width: "w-24 text-center" },
          ]}
          items={educations}
          onAdd={handleAddEducation}
          onRemove={handleRemoveEducation}
          addButtonLabel="+ Tambah Riwayat Pendidikan"
          emptyMessage="Belum ada riwayat pendidikan ditambahkan."
          renderDesktopRow={(item, idx) => (
            <>
              <td className="p-3">
                <select
                  value={item.level}
                  onChange={(e) => handleUpdateEducation(idx, "level", e.target.value)}
                  className="w-full h-9 px-2.5 rounded-lg border border-slate-200 text-xs bg-white"
                >
                  <option value="SMA">SMA / SMK</option>
                  <option value="D3">Diploma (D3)</option>
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
            </>
          )}
          renderMobileCard={(item, idx, onRemove) => (
            <div className="flex flex-col gap-2 p-3 bg-slate-50/60 rounded-xl border border-slate-200 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">{item.level || "Pendidikan"}</span>
                <button type="button" onClick={onRemove} className="text-rose-600 p-1">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <input
                type="text"
                value={item.institution}
                onChange={(e) => handleUpdateEducation(idx, "institution", e.target.value)}
                placeholder="Nama Institusi / Universitas"
                className="h-9 px-2.5 rounded-lg border border-slate-200 bg-white"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={item.major || ""}
                  onChange={(e) => handleUpdateEducation(idx, "major", e.target.value)}
                  placeholder="Jurusan"
                  className="h-9 px-2.5 rounded-lg border border-slate-200 bg-white"
                />
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
            </div>
          )}
        />
      </FormSection>

      {/* 2.3 Pelatihan & Sertifikasi */}
      <FormSection
        id="seksi-pelatihan"
        title="2.3 Pelatihan & Sertifikasi Kompetensi"
        subtitle="Kursus, sertifikasi profesi, dan workshop relevan"
        icon={Award}
        defaultOpen={false}
      >
        <DynamicTable<TrainingItem>
          title="Daftar Pelatihan & Sertifikasi"
          columns={[
            { key: "name", label: "Nama Pelatihan / Sertifikasi", width: "w-1/2" },
            { key: "organizer", label: "Penyelenggara", width: "w-1/3" },
            { key: "duration", label: "Durasi / Tahun", width: "w-28 text-center" },
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
            </>
          )}
          renderMobileCard={(item, idx, onRemove) => (
            <div className="flex flex-col gap-2 p-3 bg-slate-50/60 rounded-xl border border-slate-200 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">Sertifikat #{idx + 1}</span>
                <button type="button" onClick={onRemove} className="text-rose-600 p-1">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <input
                type="text"
                value={item.name}
                onChange={(e) => handleUpdateTraining(idx, "name", e.target.value)}
                placeholder="Nama Pelatihan"
                className="h-9 px-2.5 rounded-lg border border-slate-200 bg-white"
              />
              <input
                type="text"
                value={item.organizer || ""}
                onChange={(e) => handleUpdateTraining(idx, "organizer", e.target.value)}
                placeholder="Penyelenggara"
                className="h-9 px-2.5 rounded-lg border border-slate-200 bg-white"
              />
            </div>
          )}
        />
      </FormSection>

      {/* 2.4 Pengalaman Kerja Sebelumnya */}
      <FormSection
        id="seksi-pengalaman-kerja"
        title="2.4 Pengalaman Kerja Sebelumnya"
        subtitle="Riwayat institusi atau perusahaan tempat bekerja sebelum bergabung di PSPK"
        icon={Briefcase}
        defaultOpen={false}
      >
        <DynamicTable<WorkExperienceItem>
          title="Daftar Pengalaman Kerja"
          columns={[
            { key: "company", label: "Nama Perusahaan / Organisasi", width: "w-1/3" },
            { key: "jobTitle", label: "Posisi / Jabatan", width: "w-1/3" },
            { key: "period", label: "Periode Kerja", width: "w-1/4" },
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
            </>
          )}
          renderMobileCard={(item, idx, onRemove) => (
            <div className="flex flex-col gap-2 p-3 bg-slate-50/60 rounded-xl border border-slate-200 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">
                  {item.companyName || "Pengalaman Kerja"}
                </span>
                <button type="button" onClick={onRemove} className="text-rose-600 p-1">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <input
                type="text"
                value={item.companyName}
                onChange={(e) => handleUpdateWorkExperience(idx, "companyName", e.target.value)}
                placeholder="Nama Perusahaan"
                className="h-9 px-2.5 rounded-lg border border-slate-200 bg-white"
              />
              <input
                type="text"
                value={item.jobTitle}
                onChange={(e) => handleUpdateWorkExperience(idx, "jobTitle", e.target.value)}
                placeholder="Jabatan"
                className="h-9 px-2.5 rounded-lg border border-slate-200 bg-white"
              />
            </div>
          )}
        />
      </FormSection>

      {/* 2.5 Berkas Dokumen Profil */}
      <FormSection
        id="seksi-berkas-profil"
        title="2.5 Berkas Dokumen Profil & Ijazah"
        subtitle="Salinan Curriculum Vitae, Ijazah terakhir, Kartu Keluarga, dan Buku Nikah"
        icon={FolderArchive}
        defaultOpen={true}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DocumentUploadCard
            label="Curriculum Vitae / Resume"
            description="Format PDF atau gambar resmi (maks. 5MB)"
            value={docCv}
            onChange={setDocCv}
          />
          <DocumentUploadCard
            label="Ijazah & Transkrip Terakhir"
            description="Ijazah pendidikan tertinggi yang diselesaikan"
            value={docDiploma}
            onChange={setDocDiploma}
          />
          <DocumentUploadCard
            label="Kartu Keluarga (KK)"
            description="Salinan Kartu Keluarga resmi dari Disdukcapil"
            value={docFamilyCard}
            onChange={setDocFamilyCard}
          />
          {formData.maritalStatus === "MARRIED" && (
            <DocumentUploadCard
              label="Buku Nikah / Akta Perkawinan"
              description="Khusus bagi pegawai berstatus menikah"
              value={docMarriageCert}
              onChange={setDocMarriageCert}
            />
          )}
        </div>
      </FormSection>
    </div>
  );
}
