"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, UserPlus } from "lucide-react";
import { useEmployeeForm } from "./employee-form.context";
import { WizardStepperBar } from "./navigation/wizard-stepper-bar";
import { StickyActionBar } from "./navigation/sticky-action-bar";
import { ErrorSummaryBanner } from "./navigation/error-summary-banner";
import { Step1Identity } from "./steps/step-1-identity";
import { Step2HistoryDocs } from "./steps/step-2-history-docs";
import { Step3Placement } from "./steps/step-3-placement";
import { Step4Compensation } from "./steps/step-4-compensation";
import { Step5ReviewConfirm } from "./steps/step-5-review-confirm";
import { QuickCreateEmploymentTypeModal } from "./quick-create-employment-type-modal";
import { CredentialsModal } from "./credentials-modal";

export function EmployeeWizardCreate() {
  const { currentStep, createdCredentials, setCreatedCredentials } = useEmployeeForm();

  return (
    <div className="w-full min-w-0 max-w-5xl mx-auto pb-16 flex flex-col gap-6">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col gap-2 w-full min-w-0">
        <Link
          href="/karyawan"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#102E50] transition-colors w-fit cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Direktori Pegawai</span>
        </Link>

        <div className="flex items-center justify-between gap-4 pt-1 w-full min-w-0">
          <div className="flex items-center gap-3.5 min-w-0 flex-1">
            <div className="w-11 h-11 rounded-2xl bg-[#102E50]/10 text-[#102E50] flex items-center justify-center shrink-0 shadow-2xs">
              <UserPlus className="w-5 h-5" />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-[#102E50] font-heading tracking-tight truncate">
                Pendaftaran Pegawai Baru
              </h1>
              <p className="text-xs text-slate-500 line-clamp-2 sm:line-clamp-none">
                Isi formulir 5 langkah terarah untuk mencatat data diri, penempatan kerja, kompensasi, dan berkas kepegawaian resmi.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 5-Step Stepper Header */}
      <WizardStepperBar />

      {/* Focusable Error Summary Banner (WCAG AA) */}
      <ErrorSummaryBanner />

      {/* Form Step Body Card */}
      <div className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-7 flex flex-col">
        {currentStep === 1 && <Step1Identity />}
        {currentStep === 2 && <Step2HistoryDocs />}
        {currentStep === 3 && <Step3Placement />}
        {currentStep === 4 && <Step4Compensation />}
        {currentStep === 5 && <Step5ReviewConfirm />}

        {/* Adaptive Sticky Action Bar */}
        <StickyActionBar />
      </div>

      {/* Quick Create Modal */}
      <QuickCreateEmploymentTypeModal />

      {/* Post-Submit Account Credentials Modal */}
      {createdCredentials && (
        <CredentialsModal
          data={createdCredentials}
          onClose={() => setCreatedCredentials(null)}
        />
      )}
    </div>
  );
}
