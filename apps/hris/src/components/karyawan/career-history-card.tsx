"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  ArrowRightLeft,
  FileText,
  Download,
  Building2,
} from "lucide-react";
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
}

export function CareerHistoryCard({
  employee,
  histories,
  departments,
  managers,
}: CareerHistoryCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

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

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#102E50] text-white hover:bg-[#0c233d] transition-all cursor-pointer shadow-xs active:scale-95"
        >
          <ArrowRightLeft className="w-3.5 h-3.5 text-[#F2AF3E]" />
          <span>Mutasi / Promosi Jabatan</span>
        </button>
      </div>

      {/* Timeline List */}
      <div className="flex flex-col divide-y divide-slate-100 text-xs">
        {histories.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 italic">
            Belum ada catatan mutasi jabatan untuk pegawai ini.
          </div>
        ) : (
          histories.map((hist, index) => {
            return (
              <div
                key={hist.id}
                className={`py-3.5 flex flex-col gap-2 transition-colors ${
                  index === 0 ? "pt-1" : ""
                }`}
              >
                {/* Status & Date */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-800">
                      {formatDate(hist.startDate)}
                    </span>
                    <span className="text-slate-400">s/d</span>
                    {hist.endDate ? (
                      <span className="font-mono text-slate-600">
                        {formatDate(hist.endDate)}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Posisi Saat Ini
                      </span>
                    )}
                  </div>

                  {hist.documentKey && (
                    <a
                      href={`/api/documents/${hist.documentKey}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-[11px] transition-colors"
                      title="Lihat Berkas Surat Keputusan"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Berkas SK</span>
                      <Download className="w-3 h-3 ml-0.5" />
                    </a>
                  )}
                </div>

                {/* Position and Department info */}
                <div className="flex flex-col gap-0.5 bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
                  <span className="font-bold text-slate-900 text-xs">
                    {hist.position?.title || "Jabatan Terdaftar"}
                  </span>
                  <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                    <Building2 className="w-3 h-3 text-slate-400" />
                    <span>{hist.department?.name || "Divisi Terdaftar"}</span>
                  </div>
                </div>

                {/* Notes / SK Number */}
                {hist.notes && (
                  <span className="text-slate-600 text-[11px] leading-relaxed pl-1">
                    {hist.notes}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal Dialog */}
      <TransferPositionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        employee={employee}
        departments={departments}
        managers={managers}
        onSuccess={() => {
          router.refresh();
        }}
      />
    </div>
  );
}
