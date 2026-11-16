import React from "react";
import { EmployeeStatus, EmploymentType, PtkpStatus, TaxMethod } from "@pspk/db";

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
  label?: string | null;
}

export function ContractTypeBadge({ type, label }: ContractTypeBadgeProps) {
  const displayLabel =
    label ||
    (type === "PERMANENT"
      ? "Tetap"
      : type === "FIXED_TERM"
        ? "PKWT Riset"
        : type === "PART_TIME_PROJECT"
          ? "Proyek"
          : type);

  switch (type) {
    case "PERMANENT":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-[#102E50]/10 text-[#102E50] border border-[#102E50]/20">
          {displayLabel}
        </span>
      );
    case "FIXED_TERM":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
          {displayLabel}
        </span>
      );
    case "PART_TIME_PROJECT":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
          {displayLabel}
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
          {displayLabel}
        </span>
      );
  }
}

interface PtkpBadgeProps {
  status: PtkpStatus | string;
  size?: "sm" | "md";
}

export function PtkpBadge({ status, size = "md" }: PtkpBadgeProps) {
  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs";
  const formatted = status.replace("_", "/");
  const terCategory =
    status === "K_3"
      ? "TER C"
      : ["TK_2", "TK_3", "K_1", "K_2"].includes(status)
        ? "TER B"
        : "TER A";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold bg-sky-50 text-sky-800 border border-sky-200 ${sizeClasses}`}
      title={`Status PTKP ${formatted} (Kategori ${terCategory} PP 58/2023)`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0" />
      <span>PTKP {formatted}</span>
      <span className="text-[10px] bg-sky-100 text-sky-900 px-1.5 py-0.2 rounded font-mono font-bold">
        {terCategory}
      </span>
    </span>
  );
}

interface TaxMethodBadgeProps {
  method: TaxMethod | string;
  size?: "sm" | "md";
}

export function TaxMethodBadge({ method, size = "md" }: TaxMethodBadgeProps) {
  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs";
  const label =
    method === "GROSS_UP"
      ? "Gross Up"
      : method === "NETT"
        ? "Nett"
        : "Gross";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold bg-purple-50 text-purple-800 border border-purple-200 ${sizeClasses}`}
      title={`Metode Pajak: ${label}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
      <span>{label}</span>
    </span>
  );
}
