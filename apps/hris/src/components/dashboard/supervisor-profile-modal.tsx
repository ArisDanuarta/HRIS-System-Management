"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  UserCheck,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  IdCard,
} from "lucide-react";

export interface SupervisorInfo {
  id: string;
  fullName: string;
  nickname?: string | null;
  employeeNo: string;
  workEmail: string;
  phone?: string | null;
  photoKey?: string | null;
  status: string;
  position: string | null;
  department: string | null;
}

interface SupervisorProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  supervisor?: SupervisorInfo | null;
}

export function SupervisorProfileModal({
  isOpen,
  onClose,
  supervisor,
}: SupervisorProfileModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !supervisor) return null;

  const initials = supervisor.fullName
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const handleCopy = (text: string, field: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 flex flex-col overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-[#102E50] to-[#1a4473] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-[#F2AF3E]">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold tracking-tight text-white">
                Profil Atasan Langsung
              </h3>
              <p className="text-[11px] text-[#adc8f2]">
                Informasi koordinasi & kontak resmi kepegawaian
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(85vh-130px)]">
          {/* Identity Card */}
          <div className="flex items-start gap-4 p-4 rounded-xl bg-[#f0f4fd] border border-[#d6e3f8]">
            <div className="w-14 h-14 rounded-2xl bg-[#102E50] text-[#ffddb0] font-bold text-lg flex items-center justify-center shadow-xs shrink-0 font-serif border border-[#102E50]/20">
              {initials}
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 className="text-base font-bold text-[#102E50] font-serif leading-tight">
                  {supervisor.fullName}
                </h4>
                {supervisor.nickname && (
                  <span className="text-xs text-slate-500 font-medium">
                    (&ldquo;{supervisor.nickname}&rdquo;)
                  </span>
                )}
              </div>
              <p className="text-xs font-semibold text-slate-700 mt-1 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>{supervisor.position || "Atasan Langsung"}</span>
              </p>
              <p className="text-xs text-slate-600 mt-0.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{supervisor.department || "Unit Kerja PSPK"}</span>
              </p>

              <div className="flex items-center gap-2 mt-2.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200 text-[11px] font-mono font-bold">
                  <IdCard className="w-3 h-3 text-slate-400" />
                  NIP: {supervisor.employeeNo}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {supervisor.status === "ACTIVE" ? "Aktif" : supervisor.status}
                </span>
              </div>
            </div>
          </div>

          {/* Role Explanation Note */}
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-50/80 border border-amber-200/80 text-xs text-amber-900 leading-relaxed">
            <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Peran Penyetuju (Approver):</span> Atasan langsung
              bertindak sebagai peninjau utama permohonan cuti, perizinan kehadiran, dan penilai
              berkala evaluasi capaian kinerja riset Anda.
            </div>
          </div>

          {/* Contact Details Grid */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Saluran Komunikasi Resmi
            </h5>

            {/* Email Kerja */}
            <div className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors bg-white flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] text-slate-500 font-medium block">
                    Email Kerja Institusi
                  </span>
                  <a
                    href={`mailto:${supervisor.workEmail}`}
                    className="text-xs sm:text-sm font-semibold text-[#102E50] hover:underline truncate block"
                    title={supervisor.workEmail}
                  >
                    {supervisor.workEmail}
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => handleCopy(supervisor.workEmail, "email")}
                  className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                  title="Salin Email"
                >
                  {copiedField === "email" ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
                <a
                  href={`mailto:${supervisor.workEmail}`}
                  className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-[#102E50] transition-colors"
                  title="Kirim Email"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Nomor Telepon / WA */}
            <div className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors bg-white flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] text-slate-500 font-medium block">
                    Nomor Telepon / Kontak Kerja
                  </span>
                  {supervisor.phone ? (
                    <a
                      href={`tel:${supervisor.phone}`}
                      className="text-xs sm:text-sm font-semibold text-[#102E50] hover:underline truncate block"
                    >
                      {supervisor.phone}
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400 italic">
                      Belum dicantumkan oleh atasan
                    </span>
                  )}
                </div>
              </div>
              {supervisor.phone && (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleCopy(supervisor.phone!, "phone")}
                    className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                    title="Salin Nomor"
                  >
                    {copiedField === "phone" ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                  <a
                    href={`tel:${supervisor.phone}`}
                    className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-[#102E50] transition-colors"
                    title="Telepon"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Privacy Note */}
          <div className="pt-2 border-t border-slate-100">
            <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>
                Informasi kartu kontak resmi. Data finansial & dokumen sensitif diproteksi sesuai
                kebijakan privasi PSPK.
              </span>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#102E50] text-white hover:bg-[#0c233d] transition-all cursor-pointer shadow-xs active:scale-[0.98]"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
