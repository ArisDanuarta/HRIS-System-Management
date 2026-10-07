"use client";

import React, { useState } from "react";
import { Plus } from "lucide-react";
import { TimesheetSubmissionItem } from "@/server/queries/timesheet.queries";
import { TimesheetStatsCards } from "./timesheet-stats-cards";
import { TimesheetTable } from "./timesheet-table";
import { TimesheetSubmissionModal } from "./timesheet-submission-modal";

interface EligibleReviewer {
  id: string;
  fullName: string;
  employeeNo: string;
  positionTitle: string;
  departmentName: string;
  isLeadOrManager: boolean;
}

interface TimesheetViewProps {
  submissions: TimesheetSubmissionItem[];
  stats: {
    totalSubmissions: number;
    totalHoursApproved: number;
    totalHoursPending: number;
    approvedCount: number;
    pendingCount: number;
  };
  eligibleReviewers: EligibleReviewer[];
  hourlyRate?: number | null;
  wageType?: string;
}

export function TimesheetView({
  submissions,
  stats,
  eligibleReviewers,
  hourlyRate,
  wageType,
}: TimesheetViewProps) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold font-serif text-slate-900 tracking-tight">
              Timesheet Saya
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#102E50]/10 text-[#102E50] border border-[#102E50]/20 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F2AF3E]"></span>
              {wageType === "HOURLY" ? "PKWT Per Jam (Freelance)" : "Portal Jam Kerja"}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Kumpulkan laporan jam kerja Google Spreadsheet kepada Lead / Atasan proyek untuk
            diverifikasi dan diteruskan ke penggajian.
          </p>
        </div>

        {/* Action Button */}
        <div>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#102E50] hover:bg-[#1a4473] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#F2AF3E]" />
            <span>Ajukan Timesheet Baru</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <TimesheetStatsCards stats={stats} hourlyRate={hourlyRate} />

      {/* Directory & Tracking Table */}
      <TimesheetTable submissions={submissions} />

      {/* Modal Pengajuan Baru */}
      <TimesheetSubmissionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        eligibleReviewers={eligibleReviewers}
      />
    </div>
  );
}
