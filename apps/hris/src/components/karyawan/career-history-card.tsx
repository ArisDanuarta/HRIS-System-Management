"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Briefcase, ArrowRightLeft, FileText, Download, Building2 } from "lucide-react";
import { TransferPositionModal } from "./transfer-position-modal";
import { formatDate } from "@pspk/shared";

export interface HistoryItem {
  id: string;
  startDate: Date | string;
  endDate?: Date | string | null;
  notes?: string | null;
  documentKey?: string | null;
  department?: { id: string; name: string } | null;
  position?: { id: string; title: string } | null;
}

interface CareerHistoryCardProps {
  employee: {
    id: string;
    fullName: string;
    employeeNo: string;
    currentDepartmentId?: string | null;
    currentDepartmentName?: string;
    currentPositionId?: string | null;
    currentPositionTitle?: string;
    managerId?: string | null;
    managerName?: string;
    currentEmploymentType?: "PERMANENT" | "FIXED_TERM" | "PART_TIME_PROJECT" | null;
    currentEmploymentTypeId?: string | null;
    currentEmploymentTypeName?: string;
    currentContractEndDate?: string | null;
    currentBaseSalary?: number | null;
  };
  histories: HistoryItem[];
  departments: Array<{
    id: string;
    name: string;
    positions: Array<{ id: string; title: string }>;
  }>;
  managers: Array<{
    id: string;
    fullName: string;
    employeeNo: string;
    currentPosition?: { title: string } | null;
    currentDepartment?: { name: string } | null;
  }>;
  employmentTypes?: Array<{
    id: string;
    code: string;
    name: string;
    category: "PERMANENT" | "FIXED_TERM" | "PART_TIME_PROJECT";
    wageType: "MONTHLY" | "HOURLY";
    defaultHourlyRate?: number | null;
    description?: string | null;
  }>;
  isHrOrAdmin?: boolean;
}

export function CareerHistoryCard({
  employee,
  histories,
  departments,
  managers,
  employmentTypes = [],
  isHrOrAdmin = true,
}: CareerHistoryCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const sortedHistories = [...histories].sort((a, b) => {
    // 1. Posisi saat ini (endDate null) selalu paling atas
    if (a.endDate === null && b.endDate !== null) return -1;
    if (a.endDate !== null && b.endDate === null) return 1;

    // 2. Tanggal mulai menurun
    const startDiff = new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
    if (startDiff !== 0) return startDiff;

    return 0;
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex flex-col gap-4">
      {/* Header Card */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-[#102E50]" />
          <h3 className="font-bold text-sm text-[#102E50] font-heading">
            Riwayat Mutasi & Jabatan ({histories.length})
          </h3>
        </div>

        {isHrOrAdmin && (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#102E50] text-white hover:bg-[#0c233d] transition-all cursor-pointer shadow-xs active:scale-95"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-[#F2AF3E]" />
            <span>Mutasi / Promosi Jabatan</span>
          </button>
        )}
      </div>

      {/* Vertical Career Timeline */}
      {histories.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400 italic">
          Belum ada catatan mutasi jabatan untuk pegawai ini.
        </div>
      ) : (
        <div className="relative pl-6 sm:pl-7 pt-1 pb-1">
          {/* Timeline spine/line */}
          <div className="absolute left-2.5 sm:left-3 top-3 bottom-3 w-0.5 bg-slate-200" />

          <div className="flex flex-col gap-5">
            {sortedHistories.map((hist) => {
              const isCurrent = !hist.endDate;
              const startStr = formatDate(hist.startDate);
              const endStr = hist.endDate ? formatDate(hist.endDate) : null;
              const isSameDayTransition = endStr === startStr;

              return (
                <div key={hist.id} className="relative flex flex-col gap-2 group">
                  {/* Timeline Dot Node */}
                  <div
                    className={`absolute -left-6 sm:-left-7 top-0.5 w-5 h-5 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 ${
                      isCurrent
                        ? "bg-emerald-600 ring-4 ring-emerald-100 shadow-xs"
                        : "bg-slate-300 ring-4 ring-slate-100"
                    }`}
                  >
                    {isCurrent ? (
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                    )}
                  </div>

                  {/* Date & Action Header */}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-slate-800">
                        {startStr}
                      </span>
                      <span className="text-slate-400 text-xs">
                        {isCurrent ? "—" : "s/d"}
                      </span>
                      {isCurrent ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                          Sekarang (Posisi Aktif)
                        </span>
                      ) : isSameDayTransition ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                          {endStr} • Transisi
                        </span>
                      ) : (
                        <span className="font-mono text-xs text-slate-600 font-medium">
                          {endStr}
                        </span>
                      )}
                    </div>

                    {hist.documentKey && (
                      <a
                        href={`/api/documents/${hist.documentKey}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-[11px] transition-colors border border-blue-200/60 shadow-2xs"
                        title="Lihat Berkas Surat Keputusan / Kontrak Kerja"
                      >
                        <FileText className="w-3.5 h-3.5 text-blue-600" />
                        <span>Berkas SK / Kontrak</span>
                        <Download className="w-3 h-3 ml-0.5 text-blue-500" />
                      </a>
                    )}
                  </div>

                  {/* Position and Department Card Box */}
                  <div
                    className={`p-3.5 rounded-xl border flex flex-col gap-2 transition-all ${
                      isCurrent
                        ? "bg-emerald-50/30 border-emerald-200/80 shadow-2xs"
                        : "bg-slate-50/70 border-slate-200/80 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900 text-xs sm:text-sm">
                        {hist.position?.title || "Jabatan Terdaftar"}
                      </span>
                      <div className="flex items-center gap-1.5 text-slate-600 text-xs mt-0.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{hist.department?.name || "Divisi Terdaftar"}</span>
                      </div>
                    </div>

                    {/* Notes / SK Number */}
                    {hist.notes && (
                      <div className="pt-2 border-t border-slate-200/60 text-[11px] text-slate-600 leading-relaxed font-sans">
                        {hist.notes}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal Dialog */}
      <TransferPositionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        employee={employee}
        departments={departments}
        managers={managers}
        employmentTypes={employmentTypes}
        onSuccess={() => {
          router.refresh();
        }}
      />
    </div>
  );
}
