"use client";

import React, { useState } from "react";
import { Eye, EyeOff, ShieldCheck, AlertTriangle } from "lucide-react";
import { unmaskSensitiveFieldAction } from "@/server/actions/employee.actions";

interface SensitiveFieldViewProps {
  employeeId: string;
  field: "nik" | "npwp" | "bankAccount";
  fieldLabel: string;
  maskedValue: string;
  hasValue: boolean;
}

export function SensitiveFieldView({
  employeeId,
  field,
  fieldLabel,
  maskedValue,
  hasValue,
}: SensitiveFieldViewProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const [decryptedValue, setDecryptedValue] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!hasValue) {
    return <span className="text-slate-400 italic">Belum tercatat</span>;
  }

  const handleRequestUnmask = () => {
    if (isRevealed) {
      setIsRevealed(false);
      return;
    }
    // Show audit confirmation modal before unmasking
    setShowConfirmModal(true);
  };

  const confirmUnmask = async () => {
    setIsLoading(true);
    setErrorMsg(null);

    const res = await unmaskSensitiveFieldAction({
      employeeId,
      field,
    });

    setIsLoading(false);

    if (res.ok && res.data) {
      setDecryptedValue(res.data.decryptedValue);
      setIsRevealed(true);
      setShowConfirmModal(false);
    } else {
      setErrorMsg(res.error || "Gagal membuka data sensitif.");
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm tracking-wider font-semibold text-slate-900 bg-slate-100/80 px-2.5 py-1 rounded-md border border-slate-200">
          {isRevealed && decryptedValue ? decryptedValue : maskedValue}
        </span>

        <button
          type="button"
          onClick={handleRequestUnmask}
          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-all cursor-pointer active:scale-[0.98]"
          title={isRevealed ? "Sembunyikan data" : "Buka data sensitif terenkripsi"}
        >
          {isRevealed ? (
            <>
              <EyeOff className="w-3.5 h-3.5 text-slate-500" />
              <span>Sembunyikan</span>
            </>
          ) : (
            <>
              <Eye className="w-3.5 h-3.5 text-[#102E50]" />
              <span>Buka Data</span>
            </>
          )}
        </button>
      </div>

      {/* Confirmation & Audit Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <h3 className="text-base font-bold text-slate-900 font-heading">
                  Akses Data Sensitif: {fieldLabel}
                </h3>
                <span className="text-xs text-slate-500">Pemberitahuan Audit Keamanan</span>
              </div>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              Anda akan melihat nilai asli dari data pribadi yang dilindungi oleh enkripsi <strong>AES-256-GCM</strong>.
            </p>

            <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-lg text-xs text-amber-900 leading-relaxed flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <span>
                Sesuai kebijakan kepatuhan keamanan data PSPK, tindakan ini akan <strong>dicatat secara permanen</strong> pada sistem Audit Log lembaga (merekam identitas akun Anda, alamat IP, dan waktu akses).
              </span>
            </div>

            {errorMsg && (
              <div className="p-2.5 bg-red-50 text-[#A8281C] text-xs rounded-lg border border-red-200">
                {errorMsg}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={isLoading}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmUnmask}
                disabled={isLoading}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#102E50] text-white hover:bg-[#0c233d] transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50"
              >
                {isLoading ? "Mendekripsi..." : "Lanjutkan & Lihat Data"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
