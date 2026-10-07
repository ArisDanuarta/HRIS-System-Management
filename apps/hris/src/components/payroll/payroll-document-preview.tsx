"use client";

import React from "react";
import Image from "next/image";
import { Lock, Building2, ShieldCheck } from "lucide-react";
import { PayrollSettingsInput } from "@/server/actions/payroll-settings.actions";

interface PayrollDocumentPreviewProps {
  settings: PayrollSettingsInput & {
    logoUrl?: string | null;
    headerBannerUrl?: string | null;
    signatureUrl?: string | null;
    stampUrl?: string | null;
    senderAccountMasked?: string;
  };
}

export function PayrollDocumentPreview({ settings }: PayrollDocumentPreviewProps) {
  // Border styles styling map
  const getBorderClass = (style: string) => {
    switch (style) {
      case "NAVY_GOLD":
        return "border-b-2 border-[#102E50] pb-3 mb-1 relative after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:right-0 after:h-[2px] after:bg-[#F2AF3E]";
      case "DOUBLE_LINE":
        return "border-b-4 border-double border-[#102E50] pb-3";
      case "MINIMALIST":
        return "border-b border-slate-200 pb-3";
      case "NAVY_SOLID":
      default:
        return "border-b-2 border-[#102E50] pb-3";
    }
  };

  return (
    <div className="sticky top-6 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Live Preview Slip Gaji A4</span>
        </div>
        <span className="text-[11px] text-slate-400">Pratinjau Cetak Real-Time</span>
      </div>

      {/* Sheet Dokumen Mini Simulasi A4 */}
      <div className="bg-white rounded-2xl border-2 border-slate-200/90 shadow-lg p-5 sm:p-6 text-slate-800 text-[11px] select-none transition-all duration-200 overflow-hidden">
        {/* Banner Kop Penuh (Jika Ada) */}
        {settings.headerBannerUrl ? (
          <div className="mb-4 rounded-lg overflow-hidden border border-slate-200">
            <div className="relative w-full h-16 sm:h-20 bg-slate-50">
              <Image
                src={settings.headerBannerUrl}
                alt="Banner Kop Surat"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          </div>
        ) : (
          /* Kop Surat Standar (Logo + Identitas Lembaga) */
          <div
            className={`flex items-start justify-between ${getBorderClass(settings.borderStyle)}`}
          >
            <div className="flex items-center gap-2.5">
              {settings.logoUrl ? (
                <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-200 bg-white p-1 shrink-0 flex items-center justify-center">
                  <div className="relative w-full h-full">
                    <Image
                      src={settings.logoUrl}
                      alt="Logo Lembaga"
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                </div>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-[#102E50] text-[#F2AF3E] font-bold font-serif text-lg flex items-center justify-center shadow-2xs shrink-0">
                  P
                </div>
              )}
              <div className="leading-tight">
                <h4 className="text-xs font-bold text-[#102E50] font-serif uppercase tracking-tight line-clamp-1">
                  {settings.institutionName || "Pusat Studi Pendidikan & Kebijakan"}
                </h4>
                <p className="text-[9px] text-slate-500 mt-0.5 line-clamp-1">
                  {settings.subHeader || "HR & Finance Division • Sistem Penggajian"}
                </p>
                {settings.addressLine && (
                  <p className="text-[8px] text-slate-400 line-clamp-1 mt-0.5">
                    {settings.addressLine}
                  </p>
                )}
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
                <Lock className="w-2.5 h-2.5 text-rose-600" />
                Rahasia
              </span>
            </div>
          </div>
        )}

        {/* Title Banner */}
        <div className="text-center py-1.5 bg-slate-50 rounded border border-slate-200 my-3">
          <h5 className="text-[10px] font-bold text-[#102E50] font-serif uppercase tracking-wider">
            Slip Gaji Karyawan — September 2026
          </h5>
          <p className="text-[9px] text-slate-500">Jenis: Gaji Bulanan Reguler</p>
        </div>

        {/* Simulasi Data Pegawai & Akun Penyalur */}
        <div className="bg-[#f8fafd] p-3 rounded-lg border border-[#dee9fc] space-y-1 mb-3 text-[10px]">
          <div className="flex justify-between">
            <span className="text-slate-500">Nama Pegawai:</span>
            <span className="font-bold text-[#102E50]">I Made Aris Danuarta</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Jabatan:</span>
            <span className="font-semibold text-slate-700">Staff Peneliti & IT</span>
          </div>
          <div className="flex justify-between pt-1 border-t border-slate-200/60">
            <span className="text-slate-500">Rekening Tujuan:</span>
            <span className="font-mono text-slate-700">BCA (•••• 1029)</span>
          </div>
          {/* Info Bank Penyalur PSPK */}
          <div className="flex justify-between pt-1 border-t border-slate-200/60 text-emerald-800 bg-emerald-50/70 p-1.5 rounded">
            <div className="flex items-center gap-1">
              <Building2 className="w-3 h-3 text-emerald-600 shrink-0" />
              <span className="font-semibold text-[9px]">Penyalur Resmi PSPK:</span>
            </div>
            <span className="font-mono font-bold text-[9px]">
              {settings.senderBankName || "BCA"} ({settings.senderAccountMasked || "•••• 3456"})
            </span>
          </div>
        </div>

        {/* Simulasi Kotak THP */}
        <div className="p-2.5 rounded-lg bg-[#102E50] text-white flex items-center justify-between mb-3 shadow-xs">
          <div>
            <span className="text-[8px] font-bold uppercase tracking-wider text-[#F2AF3E] block">
              Take Home Pay
            </span>
            <span className="text-[9px] text-slate-300 italic">
              Tiga Juta Enam Ratus Ribu Rupiah
            </span>
          </div>
          <span className="text-sm font-extrabold font-mono text-[#ffddb0]">Rp 3.600.000</span>
        </div>

        {/* Penandatangan Resmi (Jika Ada) */}
        {settings.authorizedSignerName && (
          <div className="flex justify-end pt-2 pb-1 text-right">
            <div className="flex flex-col items-center">
              <span className="text-[9px] text-slate-400 block mb-1">
                Disahkan Secara Elektronik:
              </span>
              <div className="relative min-w-[70px] min-h-[36px] flex items-center justify-center mb-1">
                {/* Stempel Resmi jika ada */}
                {settings.stampUrl && (
                  <div className="absolute -left-2 -top-1 opacity-85 pointer-events-none select-none z-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={settings.stampUrl}
                      alt="Stempel Lembaga"
                      className="w-10 h-10 object-contain drop-shadow-sm"
                    />
                  </div>
                )}
                {/* Tanda Tangan jika ada */}
                {settings.signatureUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={settings.signatureUrl}
                    alt="Tanda Tangan"
                    className="w-16 h-8 object-contain relative z-10"
                  />
                ) : !settings.stampUrl ? (
                  <div className="w-16 h-8 border border-dashed border-slate-300 rounded flex items-center justify-center bg-slate-50/50">
                    <span className="text-[8px] font-serif italic text-slate-400">
                      Digital Sign
                    </span>
                  </div>
                ) : (
                  <div className="h-8 w-16" />
                )}
              </div>
              <span className="font-bold text-[#102E50] text-[10px]">
                {settings.authorizedSignerName}
              </span>
              <span className="text-[8px] text-slate-500">
                {settings.authorizedSignerTitle || "HR & Finance"}
              </span>
            </div>
          </div>
        )}

        {/* Disclaimer Legalitas */}
        <div className="border-t border-slate-200 pt-2 text-center">
          <p className="text-[8px] text-slate-400 leading-tight">
            {settings.disclaimerText ||
              "Dokumen ini diterbitkan secara elektronik oleh Divisi SDM & Keuangan PSPK. Sah tanpa tanda tangan basah."}
          </p>
        </div>
      </div>

      <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 text-xs text-blue-900 flex items-start gap-2">
        <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <span className="text-[11px] leading-relaxed">
          Tampilan ini mencerminkan hasil cetak fisik kertas A4 dan unduhan PDF slip gaji yang akan
          dilihat oleh seluruh pegawai.
        </span>
      </div>
    </div>
  );
}
