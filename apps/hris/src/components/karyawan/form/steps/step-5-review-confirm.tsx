"use client";

import React from "react";
import {
  CheckCircle2,
  User,
  GraduationCap,
  Briefcase,
  Receipt,
  FileCheck,
  KeyRound,
  Edit,
  Mail,
  Shield,
} from "lucide-react";
import { useEmployeeForm } from "../employee-form.context";
import { formatRupiah, formatDate } from "@pspk/shared";
import { StatusBadge } from "../../status-badge";

export function Step5ReviewConfirm() {
  const {
    formData,
    updateField,
    profilePhotoPreview,
    profilePhoto,
    departments,
    managers,
    employmentTypesList,
    workLocations,
    legalEntities,
    goToStep,
    familyMembers,
    educations,
    trainings,
    workExperiences,
    docCv,
    docDiploma,
    docFamilyCard,
    docMarriageCert,
    docOfferLetter,
    docNda,
    docContract,
    docKtp,
    docNpwp,
    docBankBook,
    docBpjsKes,
    docBpjsTk,
  } = useEmployeeForm();

  const selectedDept = departments.find((d) => d.id === formData.currentDepartmentId);
  const selectedPos = selectedDept?.positions.find((p) => p.id === formData.currentPositionId);
  const selectedMgr = managers.find((m) => m.id === formData.managerId);
  const selectedEmpType = employmentTypesList.find((t) => t.id === formData.employmentTypeId);
  const selectedLocation = workLocations.find((l) => l.id === formData.workLocationId);
  const selectedEntity = legalEntities.find((e) => e.id === formData.legalEntityId);

  const baseSalaryNum =
    formData.wageType === "HOURLY" ? 0 : Number(formData.baseSalary) || 0;
  const posAllowance = Number(formData.allowancePosition) || 0;
  const transAllowance = Number(formData.allowanceTransport) || 0;
  const commAllowance = Number(formData.allowanceCommunication) || 0;
  const otherAllowance = Number(formData.allowanceOther) || 0;
  const totalAllowances = posAllowance + transAllowance + commAllowance + otherAllowance;
  const totalGross = baseSalaryNum + totalAllowances;

  // Documents checklist across all 4 domains
  const docsList = [
    // 1. Identitas
    {
      label: "Pasfoto Resmi",
      has: Boolean(profilePhotoPreview || profilePhoto.file),
      required: false,
    },
    {
      label: "Curriculum Vitae (CV) / Resume",
      has: Boolean(docCv.file || docCv.status === "uploaded"),
      required: true,
    },
    {
      label: "Kartu Tanda Penduduk (KTP / Paspor)",
      has: Boolean(docKtp.file || docKtp.status === "uploaded"),
      required: true,
    },

    // 2. Keluarga & Kualifikasi
    {
      label: "Kartu Keluarga (KK)",
      has: Boolean(docFamilyCard.file || docFamilyCard.status === "uploaded"),
      required: false,
    },
    ...(formData.maritalStatus === "MARRIED"
      ? [
          {
            label: "Buku Nikah / Akta Perkawinan",
            has: Boolean(docMarriageCert.file || docMarriageCert.status === "uploaded"),
            required: false,
          },
        ]
      : []),
    {
      label: "Ijazah & Transkrip Pendidikan",
      has: Boolean(
        docDiploma.file ||
          docDiploma.status === "uploaded" ||
          educations.some((e) => e.certificateFile || e.certificateDocKey),
      ),
      required: false,
    },
    {
      label: "Sertifikat Pelatihan / Kompetensi",
      has: Boolean(trainings.some((t) => t.certificateFile || t.certificateDocKey)),
      required: false,
    },
    {
      label: "Surat Pengalaman Kerja / Paklaring",
      has: Boolean(workExperiences.some((w) => w.certificateFile || w.certificateDocKey)),
      required: false,
    },

    // 3. Legalitas Kerja
    {
      label: "Berkas Kontrak Kerja (PKWT/PKWTT)",
      has: Boolean(
        docContract.file ||
          docContract.status === "uploaded" ||
          formData.contractDocumentKey,
      ),
      required: false,
    },
    {
      label: "Surat Penawaran Kerja (Offer Letter)",
      has: Boolean(docOfferLetter.file || docOfferLetter.status === "uploaded"),
      required: true,
    },
    {
      label: "Pakta Integritas / NDA",
      has: Boolean(docNda.file || docNda.status === "uploaded"),
      required: true,
    },

    // 4. Finansial & Jaminan Sosial
    {
      label: "Kartu NPWP",
      has: Boolean(docNpwp.file || docNpwp.status === "uploaded"),
      required: false,
    },
    {
      label: "Kartu BPJS Kesehatan",
      has: Boolean(docBpjsKes.file || docBpjsKes.status === "uploaded"),
      required: false,
    },
    {
      label: "Kartu BPJS Ketenagakerjaan",
      has: Boolean(docBpjsTk.file || docBpjsTk.status === "uploaded"),
      required: false,
    },
    {
      label: "Buku Tabungan Payroll",
      has: Boolean(docBankBook.file || docBankBook.status === "uploaded"),
      required: false,
    },
  ];

  const totalUploadedDocs = docsList.filter((d) => d.has).length;

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Intro Alert Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-amber-900 flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 text-amber-800 mt-0.5">
          <Shield className="w-5 h-5" />
        </div>
        <div className="flex flex-col gap-1 min-w-0">
          <h3 className="text-sm font-bold text-amber-950 font-heading">
            Pratinjau & Konfirmasi Pendaftaran Pegawai
          </h3>
          <p className="text-xs text-amber-800 leading-relaxed">
            Harap tinjau kembali data 4 domain di bawah ini. Anda dapat mengklik tombol <strong>Ubah</strong> pada masing-masing bagian jika terdapat data yang perlu dikoreksi sebelum pendaftaran diproses permanen.
          </p>
        </div>
      </div>

      {/* Grid Kartu Ringkasan 4 Domain */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
        {/* KARTU 1: IDENTITAS & BIODATA POKOK */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-[#102E50]" />
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-tight">
                1. Data Diri & Identitas Pokok
              </h4>
            </div>
            <button
              type="button"
              onClick={() => goToStep(1)}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#102E50] hover:underline cursor-pointer"
            >
              <Edit className="w-3 h-3" />
              <span>Ubah</span>
            </button>
          </div>

          <div className="p-5 flex flex-col gap-4 text-xs">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                {profilePhotoPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profilePhotoPreview}
                    alt={formData.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8 text-slate-300" />
                )}
              </div>

              <div className="flex flex-col min-w-0">
                <h3 className="text-sm font-bold text-[#102E50] font-heading break-words">
                  {formData.fullName || "Belum ada nama"}
                </h3>
                <span className="text-[11px] text-slate-500 font-medium">
                  {formData.nickname ? `Panggilan: "${formData.nickname}"` : "Tanpa nama panggilan"} ·{" "}
                  {formData.gender === "MALE" ? "Laki-laki" : "Perempuan"}
                </span>
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700">
                    NIK: {formData.nik || "—"}
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {formData.maritalStatus === "MARRIED" ? "Menikah" : "Belum Menikah"}
                  </span>
                </div>
              </div>
            </div>

            <div className="divide-y divide-slate-100 pt-2 border-t border-slate-100">
              <div className="py-1.5 flex items-center justify-between">
                <span className="text-slate-500">Email Kantor Resmi:</span>
                <span className="font-semibold text-slate-900 font-mono">{formData.workEmail}</span>
              </div>
              <div className="py-1.5 flex items-center justify-between">
                <span className="text-slate-500">Email Pribadi:</span>
                <span className="font-semibold text-slate-800 font-mono">{formData.personalEmail || "—"}</span>
              </div>
              <div className="py-1.5 flex items-center justify-between">
                <span className="text-slate-500">Nomor WhatsApp:</span>
                <span className="font-semibold text-slate-800">{formData.phone || "—"}</span>
              </div>
              <div className="py-1.5 flex items-center justify-between">
                <span className="text-slate-500">Kewarganegaraan:</span>
                <span className="font-semibold text-slate-800">{formData.citizenship || "WNI"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* KARTU 2: RIWAYAT KARIR & KELUARGA */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-[#102E50]" />
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-tight">
                2. Riwayat Karir & Keluarga
              </h4>
            </div>
            <button
              type="button"
              onClick={() => goToStep(2)}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#102E50] hover:underline cursor-pointer"
            >
              <Edit className="w-3 h-3" />
              <span>Ubah</span>
            </button>
          </div>

          <div className="p-5 flex flex-col gap-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Anggota Keluarga
                </span>
                <span className="text-lg font-bold font-mono text-[#102E50] mt-0.5">
                  {familyMembers.length} Orang
                </span>
                <span className="text-[10.5px] text-slate-500 mt-0.5">
                  {familyMembers.filter((f) => f.isDependent).length} tanggungan resmi
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Pendidikan Formal
                </span>
                <span className="text-lg font-bold font-mono text-[#102E50] mt-0.5">
                  {educations.length} Jenjang
                </span>
                <span className="text-[10.5px] text-slate-500 mt-0.5">
                  {educations[0]?.level || "Belum ada"} {educations[0]?.major ? `· ${educations[0].major}` : ""}
                </span>
              </div>
            </div>

            <div className="divide-y divide-slate-100 pt-1">
              <div className="py-2 flex items-center justify-between">
                <span className="text-slate-500">Pelatihan & Sertifikasi:</span>
                <span className="font-semibold text-slate-800">
                  {trainings.length > 0 ? `${trainings.length} Sertifikat Pelatihan` : "Belum ditambahkan"}
                </span>
              </div>
              <div className="py-2 flex items-center justify-between">
                <span className="text-slate-500">Pengalaman Kerja Sebelumnya:</span>
                <span className="font-semibold text-slate-800">
                  {workExperiences.length > 0
                    ? `${workExperiences.length} Riwayat Organisasi/Perusahaan`
                    : "Belum ditambahkan"}
                </span>
              </div>
              <div className="py-2 flex items-center justify-between">
                <span className="text-slate-500">Lampiran Ijazah & Sertifikat:</span>
                <span className="font-semibold text-emerald-700">
                  {educations.filter((e) => e.certificateFile || e.certificateDocKey).length +
                    trainings.filter((t) => t.certificateFile || t.certificateDocKey).length +
                    workExperiences.filter((w) => w.certificateFile || w.certificateDocKey).length}{" "}
                  berkas terlampir
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* KARTU 3: PENEMPATAN & PERJANJIAN KERJA */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-[#102E50]" />
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-tight">
                3. Penempatan & Legalitas Hubungan Kerja
              </h4>
            </div>
            <button
              type="button"
              onClick={() => goToStep(3)}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#102E50] hover:underline cursor-pointer"
            >
              <Edit className="w-3 h-3" />
              <span>Ubah</span>
            </button>
          </div>

          <div className="p-5 flex flex-col gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  NIP & Status Pegawai
                </span>
                <span className="text-base font-bold font-mono text-[#102E50]">
                  {formData.employeeNo || "—"}
                </span>
                <span className="text-[10.5px] text-slate-500">
                  Mulai Bergabung: {formData.joinDate ? formatDate(formData.joinDate) : "—"}
                </span>
              </div>
              <div className="text-right">
                <StatusBadge status={formData.status} size="sm" />
                <span className="text-[10.5px] font-semibold text-slate-600 block mt-1">
                  {selectedEmpType?.name || formData.employmentType}
                </span>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              <div className="py-1.5 flex items-center justify-between">
                <span className="text-slate-500">Divisi / Departemen:</span>
                <span className="font-semibold text-slate-900">{selectedDept?.name || "—"}</span>
              </div>
              <div className="py-1.5 flex items-center justify-between">
                <span className="text-slate-500">Posisi / Jabatan:</span>
                <span className="font-semibold text-slate-900">{selectedPos?.title || "—"}</span>
              </div>
              <div className="py-1.5 flex items-center justify-between">
                <span className="text-slate-500">Atasan Langsung:</span>
                <span className="font-semibold text-slate-800">{selectedMgr?.fullName || "Tanpa Atasan"}</span>
              </div>
              <div className="py-1.5 flex items-center justify-between">
                <span className="text-slate-500">Nomor Kontrak:</span>
                <span className="font-semibold font-mono text-slate-800">{formData.contractNumber || "—"}</span>
              </div>
              <div className="py-1.5 flex items-center justify-between">
                <span className="text-slate-500">Periode Perjanjian:</span>
                <span className="font-semibold text-slate-800">
                  {formData.contractStartDate ? formatDate(formData.contractStartDate) : "—"} s/d{" "}
                  {formData.contractEndDate ? formatDate(formData.contractEndDate) : "Selesai"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* KARTU 4: KOMPENSASI & REKENING PAYROLL */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-[#102E50]" />
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-tight">
                4. Paket Kompensasi & Rekening Payroll
              </h4>
            </div>
            <button
              type="button"
              onClick={() => goToStep(4)}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#102E50] hover:underline cursor-pointer"
            >
              <Edit className="w-3 h-3" />
              <span>Ubah</span>
            </button>
          </div>

          <div className="p-5 flex flex-col gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Total Kompensasi Bruto
                </span>
                <span className="text-base font-bold font-mono text-[#102E50]">
                  {formatRupiah(totalGross)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Metode Pajak
                </span>
                <span className="font-semibold text-slate-800">
                  {formData.ptkpStatus.replace("_", "/")} · {formData.taxMethod}
                </span>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              <div className="py-1.5 flex items-center justify-between">
                <span className="text-slate-500">Gaji Pokok / Upah:</span>
                <span className="font-semibold font-mono text-slate-900">
                  {formData.wageType === "HOURLY"
                    ? `${formatRupiah(Number(formData.hourlyRate) || 0)}/jam`
                    : formatRupiah(baseSalaryNum)}
                </span>
              </div>
              <div className="py-1.5 flex items-center justify-between">
                <span className="text-slate-500">Total Tunjangan Bulanan:</span>
                <span className="font-semibold font-mono text-emerald-700">
                  + {formatRupiah(totalAllowances)}
                </span>
              </div>
              <div className="py-1.5 flex items-center justify-between">
                <span className="text-slate-500">Nomor NPWP:</span>
                <span className="font-semibold font-mono text-slate-800">{formData.npwp || "—"}</span>
              </div>
              <div className="py-1.5 flex items-center justify-between">
                <span className="text-slate-500">BPJS Kes / Ketenagakerjaan:</span>
                <span className="font-semibold font-mono text-slate-800">
                  {formData.bpjsKesehatanNo || "—"} / {formData.bpjsKetenagakerjaanNo || "—"}
                </span>
              </div>
              <div className="py-1.5 flex items-center justify-between">
                <span className="text-slate-500">Bank & Rekening Payroll:</span>
                <span className="font-semibold text-slate-800">
                  {formData.bankName || "Mandiri"}{" "}
                  {formData.bankAccount && `(${formData.bankAccount})`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* KARTU 5: REKAPITULASI KELENGKAPAN BERKAS */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col md:col-span-2">
          <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-[#102E50]" />
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-tight">
                Rekapitulasi Berkas Dokumen Kepegawaian ({totalUploadedDocs} dari {docsList.length}{" "}
                berkas terlampir)
              </h4>
            </div>
            <button
              type="button"
              onClick={() => goToStep(2)}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#102E50] hover:underline cursor-pointer"
            >
              <Edit className="w-3 h-3" />
              <span>Kelola Berkas</span>
            </button>
          </div>

          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            {docsList.map((doc, idx) => (
              <div
                key={idx}
                className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${
                  doc.has
                    ? "bg-emerald-50/40 border-emerald-200/80 text-emerald-900"
                    : "bg-slate-50/40 border-slate-200/80 text-slate-500"
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {doc.has ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <span className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                  )}
                  <span className="font-semibold truncate">{doc.label}</span>
                </div>
                {doc.required && (
                  <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 shrink-0">
                    Wajib
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* KARTU 6: PEMBUATAN AKUN SISTEM */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col md:col-span-2">
          <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-[#F2AF3E]" />
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-tight">
                Aktivasi Akun Pengguna & Hak Akses Sistem
              </h4>
            </div>
          </div>

          <div className="p-5 flex flex-col gap-4 text-xs">
            <label className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 cursor-pointer hover:bg-slate-100/70 transition-colors">
              <input
                type="checkbox"
                checked={formData.createUserAccount}
                onChange={(e) => updateField("createUserAccount", e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded text-[#102E50] focus:ring-[#102E50]"
              />
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-slate-900">
                  Buat akun login sistem secara otomatis untuk pegawai ini
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  Sistem akan membuatkan akun dengan kata sandi sementara yang aman dan mengirimkan
                  tautan instruksi aktivasi langsung ke email pribadi pegawai (
                  <strong>{formData.personalEmail || "Belum diisi"}</strong>).
                </span>
              </div>
            </label>

            {formData.createUserAccount && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="accountRole" className="font-bold text-slate-700">
                    Hak Akses / Role Sistem
                  </label>
                  <select
                    id="accountRole"
                    value={formData.accountRole}
                    onChange={(e) => updateField("accountRole", e.target.value)}
                    className="h-10 px-3 rounded-lg border border-slate-200 bg-white font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50]"
                  >
                    <option value="staff">Staff (Akses Mandiri Karyawan)</option>
                    <option value="manager">Manager / Atasan Tim (Approval & Bawahan)</option>
                    <option value="admin_hr">Admin HR (Manajemen Karyawan Lengkap)</option>
                    <option value="admin_it">Admin IT (Pengaturan Teknis & Aset)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="font-bold text-slate-700">Tujuan Pengiriman Kredensial</span>
                  <div className="h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center gap-2 font-mono text-slate-700 truncate">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{formData.personalEmail || "(Email pribadi)"}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
