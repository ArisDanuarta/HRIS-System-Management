"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Edit, Shield, KeyRound } from "lucide-react";
import { useEmployeeForm } from "./employee-form.context";
import { EditCategorySidebar } from "./navigation/edit-category-sidebar";
import { StickyActionBar } from "./navigation/sticky-action-bar";
import { ErrorSummaryBanner } from "./navigation/error-summary-banner";
import { Step1Identity } from "./steps/step-1-identity";
import { Step2HistoryDocs } from "./steps/step-2-history-docs";
import { Step3Placement } from "./steps/step-3-placement";
import { Step4Compensation } from "./steps/step-4-compensation";
import { QuickCreateEmploymentTypeModal } from "./quick-create-employment-type-modal";
import { DocumentUploadCard } from "../components/DocumentUploadCard";
import { FormSection } from "../components/FormSection";

export function EmployeeWorkspaceEdit() {
  const {
    formData,
    activeCategory,
    docCv,
    setDocCv,
    docDiploma,
    setDocDiploma,
    docFamilyCard,
    setDocFamilyCard,
    docOfferLetter,
    setDocOfferLetter,
    docNda,
    setDocNda,
    docContract,
    setDocContract,
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
    docPreviousEmployerLetter,
    setDocPreviousEmployerLetter,
  } = useEmployeeForm();

  return (
    <div className="w-full min-w-0 max-w-6xl mx-auto pb-16 flex flex-col gap-6">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col gap-2 w-full min-w-0">
        <Link
          href={`/karyawan/${formData.employeeNo ? "" : ""}`}
          onClick={(e) => {
            e.preventDefault();
            window.history.back();
          }}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#102E50] transition-colors w-fit cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Profil Pegawai</span>
        </Link>

        <div className="flex items-center justify-between gap-4 pt-1 w-full min-w-0">
          <div className="flex items-center gap-3.5 min-w-0 flex-1">
            <div className="w-11 h-11 rounded-2xl bg-[#102E50]/10 text-[#102E50] flex items-center justify-center shrink-0 shadow-2xs">
              <Edit className="w-5 h-5" />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-[#102E50] font-heading tracking-tight truncate">
                Ubah Data: {formData.fullName}
              </h1>
              <p className="text-xs text-slate-500 line-clamp-2 sm:line-clamp-none">
                Pilih kategori data di sebelah kiri untuk memperbarui informasi pegawai. Anda dapat menyimpan perubahan kapan saja dari bilah bawah.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Focusable Error Summary Banner */}
      <ErrorSummaryBanner />

      {/* Dual Column Layout: Sidebar + Form Area */}
      <div className="flex flex-col lg:flex-row gap-6 items-start w-full min-w-0">
        {/* Left Sticky Category Sidebar */}
        <EditCategorySidebar />

        {/* Right Main Content Editor */}
        <main className="flex-1 min-w-0 w-full bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-7 flex flex-col">
          {activeCategory === "identitas" && <Step1Identity />}

          {activeCategory === "riwayat" && <Step2HistoryDocs />}

          {activeCategory === "penempatan" && <Step3Placement />}

          {activeCategory === "kompensasi" && <Step4Compensation />}

          {activeCategory === "pajak_bank" && <Step4Compensation />}

          {activeCategory === "berkas" && (
            <div className="w-full flex flex-col gap-6 animate-in fade-in duration-200">
              <FormSection
                id="seksi-berkas-lengkap"
                title="Kelola Berkas & Dokumen Pegawai"
                subtitle="Unggah atau perbarui dokumen resmi kepegawaian"
                icon={Shield}
                defaultOpen={true}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <DocumentUploadCard
                    label="Curriculum Vitae / Resume"
                    value={docCv}
                    onChange={setDocCv}
                  />
                  <DocumentUploadCard
                    label="Ijazah & Transkrip Terakhir"
                    value={docDiploma}
                    onChange={setDocDiploma}
                  />
                  <DocumentUploadCard
                    label="Kartu Tanda Penduduk (KTP)"
                    value={docKtp}
                    onChange={setDocKtp}
                  />
                  <DocumentUploadCard
                    label="Kartu NPWP"
                    value={docNpwp}
                    onChange={setDocNpwp}
                  />
                  <DocumentUploadCard
                    label="Buku Tabungan Payroll"
                    value={docBankBook}
                    onChange={setDocBankBook}
                  />
                  <DocumentUploadCard
                    label="Kartu BPJS Kesehatan"
                    value={docBpjsKes}
                    onChange={setDocBpjsKes}
                  />
                  <DocumentUploadCard
                    label="Kartu BPJS Ketenagakerjaan"
                    value={docBpjsTk}
                    onChange={setDocBpjsTk}
                  />
                  <DocumentUploadCard
                    label="Kartu Keluarga (KK)"
                    value={docFamilyCard}
                    onChange={setDocFamilyCard}
                  />
                  <DocumentUploadCard
                    label="Surat Penawaran Kerja (Offer Letter)"
                    value={docOfferLetter}
                    onChange={setDocOfferLetter}
                  />
                  <DocumentUploadCard
                    label="Pakta Integritas / NDA"
                    value={docNda}
                    onChange={setDocNda}
                  />
                  <DocumentUploadCard
                    label="Berkas Dokumen Kontrak Kerja (PKWT/PKWTT)"
                    value={docContract}
                    onChange={setDocContract}
                  />
                  <DocumentUploadCard
                    label="Surat Pengalaman Kerja / Paklaring"
                    value={docPreviousEmployerLetter}
                    onChange={setDocPreviousEmployerLetter}
                  />
                  {formData.maritalStatus === "MARRIED" && (
                    <DocumentUploadCard
                      label="Buku Nikah / Akta Perkawinan"
                      value={docMarriageCert}
                      onChange={setDocMarriageCert}
                    />
                  )}
                </div>
              </FormSection>
            </div>
          )}

          {activeCategory === "akun" && (
            <div className="w-full flex flex-col gap-6 animate-in fade-in duration-200">
              <FormSection
                id="seksi-akun-role"
                title="Akun Pengguna Sistem"
                subtitle="Informasi akun pengguna terkait pegawai ini"
                icon={KeyRound}
                defaultOpen={true}
              >
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Email Kerja Login:</span>
                    <span className="font-semibold text-slate-900 font-mono">
                      {formData.workEmail}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Email Pemulihan Pribadi:</span>
                    <span className="font-semibold text-slate-800 font-mono">
                      {formData.personalEmail || "Belum diisi"}
                    </span>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-200 text-slate-600 text-[11px] leading-relaxed">
                    Pengaturan hak akses, reset kata sandi, dan status login dapat dikelola secara lengkap melalui tab <strong>Akun & Hak Akses</strong> pada halaman detail profil pegawai.
                  </div>
                </div>
              </FormSection>
            </div>
          )}

          {/* Sticky Bottom Action Bar with Dirty State Tracker */}
          <StickyActionBar />
        </main>
      </div>

      {/* Quick Create Employment Type Modal */}
      <QuickCreateEmploymentTypeModal />
    </div>
  );
}
