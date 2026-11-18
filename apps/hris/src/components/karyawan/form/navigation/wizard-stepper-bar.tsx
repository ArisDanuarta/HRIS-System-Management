"use client";

import React from "react";
import {
  User,
  GraduationCap,
  Briefcase,
  FileText,
  ShieldCheck,
  Check,
} from "lucide-react";
import { useEmployeeForm } from "../employee-form.context";
import { CreateStepNumber } from "../types";

interface StepConfig {
  num: CreateStepNumber;
  title: string;
  subtitle: string;
  icon: React.ElementType;
}

const STEPS: StepConfig[] = [
  {
    num: 1,
    title: "Identitas & Kontak",
    subtitle: "Data diri, kontak & alamat",
    icon: User,
  },
  {
    num: 2,
    title: "Riwayat & Berkas",
    subtitle: "Pendidikan, pengalaman & CV",
    icon: GraduationCap,
  },
  {
    num: 3,
    title: "Penempatan Kerja",
    subtitle: "NIP, divisi, jabatan & atasan",
    icon: Briefcase,
  },
  {
    num: 4,
    title: "Kontrak & Pajak",
    subtitle: "Gaji, tunjangan & rekening",
    icon: FileText,
  },
  {
    num: 5,
    title: "Review & Konfirmasi",
    subtitle: "Pratinjau akhir & akun login",
    icon: ShieldCheck,
  },
];

export function WizardStepperBar() {
  const { currentStep, goToStep } = useEmployeeForm();

  const progressPercentage = Math.round((currentStep / 5) * 100);

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col">
      {/* Brand Accent Top Strip */}
      <div className="h-1.5 bg-gradient-to-r from-[#102E50] via-[#102E50]/90 to-[#F2AF3E]" />

      {/* Mobile Stepper Header (< 640px) */}
      <div className="p-4 sm:hidden flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#102E50] text-white text-xs font-bold flex items-center justify-center">
              {currentStep}
            </span>
            <span className="text-xs font-bold text-[#102E50] font-heading">
              {STEPS[currentStep - 1]?.title}
            </span>
          </div>
          <span className="text-[11px] font-semibold text-slate-500">
            Langkah {currentStep} dari 5 ({progressPercentage}%)
          </span>
        </div>
        {/* Progress Bar Line */}
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#102E50] to-[#F2AF3E] transition-all duration-300 rounded-full"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Desktop & Tablet Stepper (>= 640px) */}
      <div className="hidden sm:grid sm:grid-cols-5 p-3 gap-2 bg-slate-50/60">
        {STEPS.map((s) => {
          const Icon = s.icon;
          const isDone = currentStep > s.num;
          const isCurrent = currentStep === s.num;

          return (
            <button
              key={s.num}
              type="button"
              onClick={() => {
                if (s.num < currentStep) goToStep(s.num);
              }}
              disabled={s.num > currentStep}
              className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all ${
                isCurrent
                  ? "bg-white border-[#102E50] shadow-xs cursor-default ring-2 ring-[#102E50]/10"
                  : isDone
                    ? "bg-white border-emerald-200/80 cursor-pointer hover:border-emerald-300 hover:bg-emerald-50/30"
                    : "bg-slate-50/50 border-slate-200/60 opacity-60 cursor-not-allowed"
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold transition-all ${
                  isCurrent
                    ? "bg-[#102E50] text-white shadow-xs"
                    : isDone
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-200 text-slate-600"
                }`}
              >
                {isDone ? <Check className="w-4 h-4 stroke-[2.5]" /> : s.num}
              </div>

              <div className="flex flex-col min-w-0 flex-1">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider truncate ${
                    isCurrent
                      ? "text-[#102E50]"
                      : isDone
                        ? "text-emerald-700"
                        : "text-slate-400"
                  }`}
                >
                  Langkah {s.num}
                </span>
                <span
                  className={`text-xs font-bold truncate ${
                    isCurrent
                      ? "text-slate-900"
                      : isDone
                        ? "text-slate-800"
                        : "text-slate-500"
                  }`}
                >
                  {s.title}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
