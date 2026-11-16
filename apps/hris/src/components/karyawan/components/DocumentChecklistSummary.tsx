"use client";

import React from "react";
import { CheckCircle2, AlertCircle, ArrowUpRight, FileCheck, ShieldCheck } from "lucide-react";

export interface ChecklistDocItem {
  id: string;
  label: string;
  step: number;
  isRequired: boolean;
  isUploaded: boolean;
}

interface DocumentChecklistSummaryProps {
  items: ChecklistDocItem[];
  onJumpToStep: (stepNumber: number) => void;
  className?: string;
}

export function DocumentChecklistSummary({
  items,
  onJumpToStep,
  className = "",
}: DocumentChecklistSummaryProps) {
  const requiredItems = items.filter((i) => i.isRequired);
  const uploadedRequired = requiredItems.filter((i) => i.isUploaded);
  const totalUploadedAll = items.filter((i) => i.isUploaded).length;

  const percentage =
    requiredItems.length > 0
      ? Math.round((uploadedRequired.length / requiredItems.length) * 100)
      : 100;

  const missingRequired = requiredItems.filter((i) => !i.isUploaded);
  const optionalMissing = items.filter((i) => !i.isRequired && !i.isUploaded);

  return (
    <div
      className={`border rounded-xl p-4 sm:p-5 bg-gradient-to-br from-white to-slate-50/60 border-slate-200 shadow-xs flex flex-col gap-4 ${className}`}
    >
      {/* Header Metric */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#102E50]/10 text-[#102E50] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 tracking-tight uppercase">
              Kelengkapan Dokumen & Berkas Pegawai
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {uploadedRequired.length} dari {requiredItems.length} berkas utama terlampir ({percentage}%)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            Total Terunggah: {totalUploadedAll} Berkas
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="flex flex-col gap-1.5">
        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              percentage === 100
                ? "bg-emerald-500"
                : percentage >= 50
                  ? "bg-[#102E50]"
                  : "bg-amber-500"
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium">
          <span>0%</span>
          <span>Target Kelengkapan Berkas Utama: 100%</span>
        </div>
      </div>

      {/* Missing Items List (if any) */}
      {missingRequired.length > 0 ? (
        <div className="flex flex-col gap-2 p-3 rounded-lg bg-amber-50/60 border border-amber-200/80">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Dokumen Utama yang Belum Diunggah ({missingRequired.length})</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
            {missingRequired.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-2 p-2 rounded-md bg-white border border-amber-200/60 text-xs shadow-2xs"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                  <span className="font-medium text-slate-700 truncate" title={item.label}>
                    {item.label}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onJumpToStep(item.step)}
                  className="inline-flex items-center gap-0.5 text-[11px] font-bold text-[#102E50] hover:text-[#102E50]/80 hover:underline shrink-0"
                >
                  <span>Lengkapi</span>
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-amber-800/90 mt-1 leading-relaxed">
            💡 <strong>Catatan:</strong> Dokumen yang belum lengkap tetap dapat disusulkan setelah pegawai terdaftar. Tombol pendaftaran pegawai tetap aktif dan tidak diblokir.
          </p>
        </div>
      ) : (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            Seluruh dokumen utama ({requiredItems.length} berkas) telah lengkap terunggah!
          </span>
        </div>
      )}

      {/* Optional docs list hint */}
      {optionalMissing.length > 0 && (
        <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
          <FileCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>
            {optionalMissing.length} dokumen pendukung tambahan bersifat opsional (dapat dilengkapi kapan saja).
          </span>
        </div>
      )}
    </div>
  );
}
