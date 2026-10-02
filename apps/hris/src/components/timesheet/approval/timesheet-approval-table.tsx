"use client";

import React, { useState } from "react";
import {
  Clock,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Search,
  Check,
  Filter,
  FileSpreadsheet,
} from "lucide-react";
import { formatDate } from "@pspk/shared";
import {
  TimesheetApprovalItem,
  TimesheetApprovalModal,
} from "./timesheet-approval-modal";

interface TimesheetApprovalTableProps {
  items: TimesheetApprovalItem[];
  currentEmployeeId: string;
  initialSubmissionId?: string;
}

const MONTH_NAMES = [
  "",
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

export function TimesheetApprovalTable({
  items,
  currentEmployeeId,
  initialSubmissionId,
}: TimesheetApprovalTableProps) {
  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState<"ALL" | "NEEDS_REVIEW" | "APPROVED" | "REJECTED">("NEEDS_REVIEW");
  const [selectedSubmission, setSelectedSubmission] = useState<TimesheetApprovalItem | null>(
    () => (initialSubmissionId ? items.find((i) => i.id === initialSubmissionId) || null : null),
  );

  React.useEffect(() => {
    if (initialSubmissionId && items.length > 0) {
      const match = items.find((i) => i.id === initialSubmissionId);
      if (match) {
        setSelectedSubmission(match);
      }
    }
  }, [initialSubmissionId, items]);

  const handleCloseModal = () => {
    setSelectedSubmission(null);
    if (typeof window !== "undefined" && window.location.search.includes("submissionId")) {
      const url = new URL(window.location.href);
      url.searchParams.delete("submissionId");
      window.history.replaceState(null, "", url.pathname + (url.search ? url.search : ""));
    }
  };

  // Filter items
  const filteredItems = items.filter((item) => {
    const myReview = item.reviewers.find((r) => r.reviewerId === currentEmployeeId);
    const myStatus = myReview?.status || "PENDING";

    // Tab filter
    if (filterTab === "NEEDS_REVIEW") {
      if (myStatus !== "PENDING" && myStatus !== "IN_REVIEW") return false;
    } else if (filterTab === "APPROVED") {
      if (myStatus !== "APPROVED") return false;
    } else if (filterTab === "REJECTED") {
      if (myStatus !== "REJECTED") return false;
    }

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = item.employeeName.toLowerCase().includes(q);
      const matchNo = item.employeeNo.toLowerCase().includes(q);
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchDept = item.employeeDepartment.toLowerCase().includes(q);
      return matchName || matchNo || matchTitle || matchDept;
    }

    return true;
  });

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-full sm:w-auto overflow-x-auto">
          <button
            type="button"
            onClick={() => setFilterTab("NEEDS_REVIEW")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              filterTab === "NEEDS_REVIEW"
                ? "bg-[#102e50] text-[#ffddb0] shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Butuh Review
          </button>
          <button
            type="button"
            onClick={() => setFilterTab("APPROVED")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              filterTab === "APPROVED"
                ? "bg-[#102e50] text-[#ffddb0] shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Sudah Disetujui (ACC)
          </button>
          <button
            type="button"
            onClick={() => setFilterTab("REJECTED")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              filterTab === "REJECTED"
                ? "bg-[#102e50] text-[#ffddb0] shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Ditolak
          </button>
          <button
            type="button"
            onClick={() => setFilterTab("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              filterTab === "ALL"
                ? "bg-[#102e50] text-[#ffddb0] shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Semua ({items.length})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari staf, NIP, judul..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#102e50]/20 focus:border-[#102e50]"
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Pegawai Freelance</th>
                <th className="py-3 px-4">Periode</th>
                <th className="py-3 px-4">Judul & Spreadsheet</th>
                <th className="py-3 px-4 text-center">Total Jam</th>
                <th className="py-3 px-4">Status Review Anda</th>
                <th className="py-3 px-4">Status Rekan Penilai</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Filter className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">Tidak ada pengajuan timesheet</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {filterTab === "NEEDS_REVIEW"
                        ? "Tidak ada antrean timesheet yang memerlukan review Anda saat ini."
                        : "Tidak ada data yang cocok dengan kriteria pencarian Anda."}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((sub) => {
                  const myReview = sub.reviewers.find((r) => r.reviewerId === currentEmployeeId);
                  const myStatus = myReview?.status || "PENDING";
                  const otherReviewers = sub.reviewers.filter((r) => r.reviewerId !== currentEmployeeId);

                  return (
                    <tr key={sub.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Pegawai Freelance */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{sub.employeeName}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {sub.employeeNo} • {sub.employeeDepartment}
                        </div>
                      </td>

                      {/* Periode */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-semibold text-slate-800">
                          {MONTH_NAMES[sub.periodMonth]} {sub.periodYear}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {formatDate(sub.submittedAt)}
                        </div>
                      </td>

                      {/* Judul & Spreadsheet */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-semibold text-slate-800 line-clamp-1">{sub.title}</div>
                        <a
                          href={sub.spreadsheetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200/80 rounded-lg hover:bg-emerald-100 hover:border-emerald-300 transition-all text-[11px] font-medium mt-1.5 group cursor-pointer shadow-2xs"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Buka Spreadsheet</span>
                          <ExternalLink className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </a>
                      </td>

                      {/* Total Jam */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                          <Clock className="w-3 h-3 text-amber-600" />
                          {sub.totalHours} Jam
                        </span>
                      </td>

                      {/* Status Review Anda */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {myStatus === "APPROVED" && (
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full font-bold text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Disetujui (ACC)
                          </span>
                        )}
                        {myStatus === "IN_REVIEW" && (
                          <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full font-bold text-[11px]">
                            <Eye className="w-3.5 h-3.5 text-blue-600" />
                            Sedang Dicek
                          </span>
                        )}
                        {myStatus === "PENDING" && (
                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full font-bold text-[11px]">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            Belum Diperiksa
                          </span>
                        )}
                        {myStatus === "REJECTED" && (
                          <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-full font-bold text-[11px]">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                            Ditolak
                          </span>
                        )}
                      </td>

                      {/* Status Rekan Penilai */}
                      <td className="py-3 px-4">
                        {otherReviewers.length === 0 ? (
                          <span className="text-[11px] text-slate-400 italic">Hanya Anda</span>
                        ) : (
                          <div className="flex flex-col gap-1">
                            {otherReviewers.map((r) => (
                              <div
                                key={r.id}
                                className="flex items-center gap-1.5 text-[11px] text-slate-600"
                              >
                                {r.status === "APPROVED" && (
                                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="ACC" />
                                )}
                                {r.status === "IN_REVIEW" && (
                                  <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" title="Sedang dicek" />
                                )}
                                {r.status === "PENDING" && (
                                  <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" title="Menunggu" />
                                )}
                                {r.status === "REJECTED" && (
                                  <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" title="Ditolak" />
                                )}
                                <span className="truncate max-w-[140px]">{r.reviewerName}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Aksi */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedSubmission(sub)}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                            myStatus === "PENDING" || myStatus === "IN_REVIEW"
                              ? "bg-[#102e50] text-[#ffddb0] hover:bg-[#0c233d] shadow-xs"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{myStatus === "PENDING" || myStatus === "IN_REVIEW" ? "Review" : "Lihat"}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Review */}
      {selectedSubmission && (
        <TimesheetApprovalModal
          submission={selectedSubmission}
          currentEmployeeId={currentEmployeeId}
          isOpen={!!selectedSubmission}
          onClose={handleCloseModal}
          onSuccess={() => {
            // Bisa reload atau trigger revalidate
          }}
        />
      )}
    </div>
  );
}
