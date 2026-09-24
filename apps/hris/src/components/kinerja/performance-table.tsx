"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  Filter,
  Eye,
  CheckCircle2,
  Clock,
  FileText,
  Layers,
} from "lucide-react";
import {
  PerformanceDetailModal,
  PerformanceReviewItem,
} from "./performance-detail-modal";

interface PerformanceTableProps {
  reviews: PerformanceReviewItem[];
  departments: { id: string; name: string }[];
}

export function PerformanceTable({ reviews, departments }: PerformanceTableProps) {
  const [search, setSearch] = useState("");
  const [departmentId, setDepartmentId] = useState("ALL");
  const [status, setStatus] = useState("ALL");

  const [selectedReview, setSelectedReview] = useState<PerformanceReviewItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Filtered Reviews in memory for instant responsiveness
  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      // 1. Search filter
      if (search.trim() !== "") {
        const q = search.toLowerCase().trim();
        const matchName = r.employee.fullName.toLowerCase().includes(q);
        const matchNo = r.employee.employeeNo.toLowerCase().includes(q);
        const matchEmail = (r.employee.workEmail || "").toLowerCase().includes(q);
        if (!matchName && !matchNo && !matchEmail) return false;
      }

      // 2. Department filter
      if (departmentId !== "ALL" && r.employee.departmentId !== departmentId) {
        return false;
      }

      // 3. Status filter
      if (status !== "ALL" && r.status !== status) {
        return false;
      }

      return true;
    });
  }, [reviews, search, departmentId, status]);

  const getStatusBadge = (st: string) => {
    switch (st) {
      case "DRAFT":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Penyusunan Sasaran
          </span>
        );
      case "SELF_REVIEW":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
            <FileText className="w-3 h-3 text-sky-500" />
            Evaluasi Diri
          </span>
        );
      case "MANAGER_REVIEW":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-500" />
            Review Atasan
          </span>
        );
      case "FINALIZED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Selesai (Terkunci)
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-600">
            {st}
          </span>
        );
    }
  };

  const openDetail = (review: PerformanceReviewItem) => {
    setSelectedReview(review);
    setDetailOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari nama pegawai, NIP, atau email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-[#102E50] rounded-xl text-xs font-medium outline-hidden transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Divisi */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              aria-label="Pilih Divisi"
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 outline-hidden cursor-pointer"
            >
              <option value="ALL">Semua Divisi Riset</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <select
              aria-label="Pilih Status Review"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 outline-hidden cursor-pointer"
            >
              <option value="ALL">Semua Status Review</option>
              <option value="DRAFT">Penyusunan Sasaran (Draft)</option>
              <option value="SELF_REVIEW">Evaluasi Diri (Self-Review)</option>
              <option value="MANAGER_REVIEW">Review Atasan</option>
              <option value="FINALIZED">Selesai / Terkunci</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Pegawai</th>
                <th className="py-3 px-4">Divisi</th>
                <th className="py-3 px-4">Atasan Penilai</th>
                <th className="py-3 px-4 text-center">Kelengkapan OKR</th>
                <th className="py-3 px-4 text-center">Status Review</th>
                <th className="py-3 px-4 text-center">Skor Akhir</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredReviews.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <Layers className="w-5 h-5" />
                      </div>
                      <p className="font-medium text-slate-600">Tidak ada data pegawai yang sesuai filter</p>
                      <p className="text-[11px] text-slate-400">
                        Coba sesuaikan kata kunci pencarian atau ubah filter divisi.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredReviews.map((r) => {
                  const hasFinal = r.finalScore !== null;

                  return (
                    <tr
                      key={r.id}
                      onClick={() => openDetail(r)}
                      className="hover:bg-slate-50/60 transition-colors cursor-pointer group"
                    >
                      {/* Pegawai */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[#102E50]/10 text-[#102E50] font-bold text-xs flex items-center justify-center shrink-0">
                            {r.employee.fullName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 group-hover:text-[#102E50] transition-colors">
                              {r.employee.fullName}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {r.employee.employeeNo} • {r.employee.positionTitle}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Divisi */}
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700">
                          {r.employee.departmentName}
                        </span>
                      </td>

                      {/* Atasan Penilai */}
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {r.reviewer ? (
                          <div>
                            <div className="text-slate-900 font-semibold text-xs">
                              {r.reviewer.fullName}
                            </div>
                            <div className="text-[10px] text-slate-400 font-normal">
                              {r.reviewer.positionTitle}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Belum Ada</span>
                        )}
                      </td>

                      {/* Kelengkapan OKR */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-mono text-[11px] font-bold ${
                            r.isGoalComplete
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-amber-50 text-amber-800 border border-amber-200"
                          }`}
                        >
                          {r.goalsCount} Target ({r.totalGoalWeight}%)
                        </span>
                      </td>

                      {/* Status Review */}
                      <td className="py-3 px-4 text-center">
                        {getStatusBadge(r.status)}
                      </td>

                      {/* Skor Akhir & Predikat */}
                      <td className="py-3 px-4 text-center">
                        {hasFinal ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="font-mono font-bold text-emerald-900 text-xs">
                              {r.finalScore} / 100
                            </span>
                            <span className="text-[10px] font-semibold text-emerald-700">
                              {r.predicate}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-mono">-</span>
                        )}
                      </td>

                      {/* Aksi */}
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDetail(r);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 hover:text-[#102E50] rounded-xl text-xs font-semibold transition-colors shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          <span>Detail</span>
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

      {/* Modal Detail & Review */}
      <PerformanceDetailModal
        isOpen={detailOpen}
        review={selectedReview}
        onClose={() => setDetailOpen(false)}
      />
    </div>
  );
}
