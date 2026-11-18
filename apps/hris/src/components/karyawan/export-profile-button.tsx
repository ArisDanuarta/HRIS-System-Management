"use client";

import React, { useState } from "react";
import { Download } from "lucide-react";
import { ExportProfileModal } from "@/components/karyawan/export-profile-modal";

export interface ExportProfileButtonProps {
  employeeId: string;
  employeeName: string;
  employeeNo: string;
  isHrOrAdmin?: boolean;
  isManager?: boolean;
  className?: string;
}

export function ExportProfileButton({
  employeeId,
  employeeName,
  employeeNo,
  isHrOrAdmin = false,
  isManager = false,
  className = "",
}: ExportProfileButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-300 hover:border-[#102E50] text-[#102E50] hover:bg-slate-50 transition-all cursor-pointer active:scale-[0.98] shadow-2xs ${className}`}
        title="Ekspor ringkasan data profil pegawai ke format PDF atau ZIP"
      >
        <Download className="w-3.5 h-3.5 text-[#102E50]" />
        <span>Export Profil</span>
      </button>

      <ExportProfileModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        employeeId={employeeId}
        employeeName={employeeName}
        employeeNo={employeeNo}
        isHrOrAdmin={isHrOrAdmin}
        isManager={isManager}
      />
    </>
  );
}
