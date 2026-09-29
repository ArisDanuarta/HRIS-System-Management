"use client";

import React, { useEffect } from "react";
import {
  X,
  Calendar,
  CheckCircle2,
  FileText,
  Building2,
  Briefcase,
  Paperclip,
  ExternalLink,
  HeartPulse,
  CalendarCheck,
} from "lucide-react";

export interface CalendarLeaveDetail {
  id: string;
  startDate: Date | string;
  endDate: Date | string;
  days: number;
  reason?: string | null;
  attachmentKey?: string | null;
  status: string;
  decisionNote?: string | null;
  decidedAt?: Date | string | null;
  employee: {
    id: string;
    fullName: string;
    employeeNo: string;
    department?: string | null;
    position?: string | null;
  };
  leaveType: {
    name: string;
    isPaid: boolean;
  };
}

interface LeaveDetailModalProps {
  leave: CalendarLeaveDetail | null;
  onClose: () => void;
}

export function LeaveDetailModal({ leave, onClose }: LeaveDetailModalProps) {
  // Listen for Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (leave) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [leave, onClose]);

  if (!leave) return null;

  const formatDate = (val: Date | string) => {
    const d = typeof val === "string" ? new Date(val) : val;
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const isSickLeave = leave.leaveType.name.toLowerCase().includes("sakit");
  const isAnnualLeave = leave.leaveType.name.toLowerCase().includes("tahunan");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      {/* Click outside backdrop */}
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      {/* Modal Dialog Card */}
      <div className="relative bg-white rounded-2xl max-w-lg w-full border border-[#dee9fc] shadow-2xl overflow-hidden flex flex-col z-10 animate-in zoom-in-95 duration-200 my-8">
        {/* Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-[#eff4ff] to-white border-b border-[#dee9fc] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-xs ${
                isSickLeave
                  ? "bg-rose-50 text-rose-600 border border-rose-200"
                  : isAnnualLeave
                  ? "bg-blue-50 text-blue-600 border border-blue-200"
                  : "bg-amber-50 text-amber-700 border border-amber-200"
              }`}
            >
              {isSickLeave ? (
                <HeartPulse className="w-5 h-5" />
              ) : isAnnualLeave ? (
                <CalendarCheck className="w-5 h-5" />
              ) : (
                <FileText className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-[#102e50] font-heading leading-tight">
                Detail Ketidakhadiran Pegawai
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Informasi jadwal cuti/izin resmi terverifikasi
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
            title="Tutup dialog (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-xs sm:text-sm">
          {/* Section 1: Profil Pegawai */}
          <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-[#f8fafd] border border-[#dee9fc]/80">
            <div className="w-12 h-12 rounded-xl bg-[#102e50] text-[#f2af3e] flex items-center justify-center font-bold font-heading text-base shrink-0 shadow-xs">
              {getInitials(leave.employee.fullName)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-[#102e50] text-sm sm:text-base leading-tight">
                  {leave.employee.fullName}
                </span>
                <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded bg-white text-slate-600 border border-slate-200">
                  {leave.employee.employeeNo}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                {leave.employee.position && (
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-[#102e50]" />
                    <span>{leave.employee.position}</span>
                  </span>
                )}
                {leave.employee.department && (
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-[#102e50]" />
                    <span>{leave.employee.department}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Ringkasan Jadwal & Jenis Cuti */}
          <div className="grid grid-cols-2 gap-3">
            {/* Jenis Cuti */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Jenis Permohonan
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span
                  className={`font-bold px-2 py-0.5 rounded text-xs inline-flex items-center gap-1 ${
                    isSickLeave
                      ? "bg-rose-100 text-rose-800"
                      : isAnnualLeave
                      ? "bg-blue-100 text-blue-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {leave.leaveType.name}
                </span>
                <span className="text-[11px] text-slate-500">
                  {leave.leaveType.isPaid ? "(Berbayar)" : "(Tanpa Gaji)"}
                </span>
              </div>
            </div>

            {/* Durasi Hari */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Total Durasi
              </span>
              <span className="font-extrabold text-[#102e50] text-sm sm:text-base font-heading block">
                {leave.days} Hari Kerja
              </span>
            </div>
          </div>

          {/* Tanggal Pelaksanaan */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#102e50]" />
              <span>Rentang Tanggal</span>
            </span>
            <div className="text-xs sm:text-sm font-semibold text-slate-800">
              {formatDate(leave.startDate)}{" "}
              <span className="text-slate-400 font-normal px-1">s/d</span>{" "}
              {formatDate(leave.endDate)}
            </div>
          </div>

          {/* Section 3: Alasan Pengajuan */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#102e50]" />
              <span>Alasan / Keterangan</span>
            </span>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed italic">
              {leave.reason ? `"${leave.reason}"` : "(Tidak ada keterangan tertulis)"}
            </div>
          </div>

          {/* Section 4: Berkas Lampiran / Surat Dokter (Jika ada) */}
          {leave.attachmentKey ? (
            <div className="p-3.5 rounded-xl bg-[#eff4ff]/60 border border-[#dee9fc] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-white border border-[#dee9fc] text-[#102e50] flex items-center justify-center shrink-0">
                  <Paperclip className="w-4 h-4 text-[#102e50]" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-[#102e50] block truncate">
                    Surat Keterangan / Berkas Bukti
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Dokumen resmi terunggah
                  </span>
                </div>
              </div>
              <a
                href={`/api/documents/${leave.attachmentKey}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#102e50] text-white hover:bg-[#0c233d] text-xs font-semibold transition-all shadow-xs shrink-0 cursor-pointer active:scale-[0.98]"
              >
                <span>Buka Berkas</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          ) : null}

          {/* Section 5: Status Persetujuan & Catatan Approver */}
          <div className="pt-3 border-t border-slate-200 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">Status Pengajuan:</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Disetujui (Approved)</span>
              </span>
            </div>
            {leave.decisionNote && (
              <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 text-xs text-emerald-900">
                <span className="font-semibold block mb-0.5">Catatan Persetujuan:</span>
                <span>{leave.decisionNote}</span>
              </div>
            )}
            {leave.decidedAt && (
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Waktu Persetujuan:</span>
                <span>{formatDate(leave.decidedAt)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#102e50] text-white hover:bg-[#0c233d] text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-[0.98]"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
