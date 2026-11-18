"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Save, Loader2, CheckCircle2 } from "lucide-react";
import { useEmployeeForm } from "../employee-form.context";

export function StickyActionBar() {
  const router = useRouter();
  const {
    mode,
    currentStep,
    nextStep,
    prevStep,
    isSubmitting,
    handleSubmit,
    isDirty,
    dirtyCategories,
  } = useEmployeeForm();

  return (
    <div className="sticky bottom-0 z-30 w-full bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg py-3 px-4 sm:px-6 mt-6 rounded-b-2xl">
      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 max-w-full">
        {/* Left Side: Back / Cancel / Navigation */}
        <div className="flex items-center gap-2">
          {mode === "create" ? (
            currentStep > 1 && (
              <button
                type="button"
                onClick={prevStep}
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Sebelumnya</span>
              </button>
            )
          ) : (
            <div className="flex items-center gap-2 text-xs">
              {isDirty ? (
                <div className="inline-flex items-center gap-1.5 text-amber-700 font-semibold bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span>{dirtyCategories.size} bagian telah diubah</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Semua perubahan tersimpan</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Action Buttons */}
        <div className="flex items-center gap-2.5 justify-end">
          <button
            type="button"
            onClick={() => router.push("/karyawan")}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-colors cursor-pointer text-center"
          >
            Batal
          </button>

          {mode === "create" ? (
            currentStep < 5 ? (
              <button
                type="button"
                onClick={nextStep}
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-[#102E50] text-white hover:bg-[#0c233d] transition-all cursor-pointer active:scale-[0.98] shadow-sm"
              >
                <span>Langkah Selanjutnya</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-[#F2AF3E] text-[#102E50] hover:bg-[#e09e2d] transition-all cursor-pointer active:scale-[0.98] shadow-sm disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Mendaftarkan Pegawai...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Daftarkan Pegawai Resmi</span>
                  </>
                )}
              </button>
            )
          ) : (
            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-[#102E50] text-[#ffddb0] hover:bg-[#0c233d] transition-all cursor-pointer active:scale-[0.98] shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#F2AF3E]" />
                  <span>Menyimpan Perubahan...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 text-[#F2AF3E]" />
                  <span>Simpan Perubahan</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
