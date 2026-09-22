import React from "react";
import { EmployeeStatus, EmploymentType } from "@pspk/db";

interface StatusBadgeProps {
  status: EmployeeStatus | string;
  size?: "sm" | "md";
}

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs";

  switch (status) {
    case "ACTIVE":
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 ${sizeClasses}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
          Aktif
        </span>
      );
    case "PROBATION":
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-semibold bg-amber-50 text-amber-800 border border-amber-200 ${sizeClasses}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
          Percobaan
        </span>
      );
    case "ON_LEAVE":
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-semibold bg-blue-50 text-blue-700 border border-blue-200 ${sizeClasses}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
          Sedang Cuti
        </span>
      );
    case "RESIGNED":
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-semibold bg-slate-100 text-slate-700 border border-slate-300 ${sizeClasses}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
          Mengundurkan Diri
        </span>
      );
    case "TERMINATED":
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-semibold bg-red-50 text-[#A8281C] border border-red-200 ${sizeClasses}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#A8281C] shrink-0" />
          Nonaktif / Selesai
        </span>
      );
    default:
      return (
        <span
          className={`inline-flex items-center rounded-full font-medium bg-slate-100 text-slate-600 border border-slate-200 ${sizeClasses}`}
        >
          {status}
        </span>
      );
  }
}

interface ContractTypeBadgeProps {
  type: EmploymentType | string;
}

export function ContractTypeBadge({ type }: ContractTypeBadgeProps) {
  switch (type) {
    case "PERMANENT":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-[#102E50]/10 text-[#102E50] border border-[#102E50]/20">
          Tetap
        </span>
      );
    case "FIXED_TERM":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-[#feba48]/20 text-[#805600] border border-[#feba48]/40">
          PKWT Riset
        </span>
      );
    case "PART_TIME_PROJECT":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
          Proyek
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
          {type}
        </span>
      );
  }
}
