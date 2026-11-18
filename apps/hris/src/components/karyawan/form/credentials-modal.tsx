"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Copy,
  Check,
  Mail,
  ArrowRight,
} from "lucide-react";
import { CreatedCredentialsData } from "./employee-form.context";

interface CredentialsModalProps {
  data: CreatedCredentialsData;
  onClose: () => void;
}

export function CredentialsModal({ data, onClose }: CredentialsModalProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const handleCopyPassword = () => {
    if (data.temporaryPassword) {
      navigator.clipboard.writeText(data.temporaryPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleFinish = () => {
    onClose();
    router.push(`/karyawan/${data.id}`);
    router.refresh();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
        {/* Header strip */}
        <div className="h-2 bg-gradient-to-r from-emerald-500 via-[#102E50] to-[#F2AF3E]" />

        <div className="p-6 sm:p-7 flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-bold text-[#102E50] font-heading">
              Pegawai Berhasil Didaftarkan!
            </h2>
            <p className="text-xs text-slate-500 max-w-sm">
              Akun pengguna dan hak akses sistem telah dibuat untuk <strong>{data.fullName}</strong>.
            </p>
          </div>

          {/* Credentials Card */}
          <div className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200/90 text-left flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
              <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">
                Informasi Login Pegawai
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#102E50]/10 text-[#102E50]">
                {data.roleName || "Staff"}
              </span>
            </div>

            <div className="flex flex-col gap-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Email Kerja:</span>
                <span className="font-semibold text-slate-900 font-mono">{data.workEmail}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Nomor Induk Pegawai:</span>
                <span className="font-semibold text-slate-800 font-mono">{data.employeeNo}</span>
              </div>

              {data.temporaryPassword && (
                <div className="mt-2 p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between gap-3">
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Kata Sandi Sementara
                    </span>
                    <span className="font-mono font-bold text-sm text-[#102E50] truncate">
                      {data.temporaryPassword}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyPassword}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer shrink-0"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 font-bold">Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-600" />
                        <span>Salin</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Email Dispatch Info */}
            <div className="mt-1 pt-2 border-t border-slate-200/60 flex items-start gap-2 text-[11px] text-slate-600">
              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
              <span>
                {data.personalEmail ? (
                  <>
                    Informasi aktivasi telah dikirim ke email pribadi:{" "}
                    <strong>{data.personalEmail}</strong>
                  </>
                ) : (
                  "Pegawai wajib mengganti kata sandi ini saat pertama kali login ke sistem."
                )}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleFinish}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-bold bg-[#102E50] text-[#ffddb0] hover:bg-[#0c233d] transition-all cursor-pointer active:scale-[0.98] shadow-xs"
          >
            <span>Buka Profil Pegawai Lengkap</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
