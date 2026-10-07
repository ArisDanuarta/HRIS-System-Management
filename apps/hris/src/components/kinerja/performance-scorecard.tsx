"use client";

import React from "react";
import {
  Award,
  CheckCircle2,
  FileText,
  Lock,
  MessageSquare,
  ShieldCheck,
  Target,
  User,
  Calendar,
} from "lucide-react";
import { StaffPerformanceReviewData } from "@/server/queries/performance.queries";

interface PerformanceScorecardProps {
  review: StaffPerformanceReviewData;
  employeeName: string;
  positionTitle?: string;
  departmentName?: string;
  employeeNo?: string;
}

export function PerformanceScorecard({
  review,
  employeeName,
  positionTitle = "Pegawai PSPK",
  departmentName = "Pusat Studi Pendidikan dan Kebijakan",
  employeeNo = "-",
}: PerformanceScorecardProps) {
  const finalScore = review.finalScore !== null ? review.finalScore : "-";

  const getPredicateBadge = (pred: string) => {
    switch (pred) {
      case "Sangat Baik":
        return "bg-emerald-50 text-emerald-800 border-emerald-300 ring-1 ring-emerald-400/20";
      case "Baik":
        return "bg-blue-50 text-blue-800 border-blue-300 ring-1 ring-blue-400/20";
      case "Cukup":
        return "bg-amber-50 text-amber-800 border-amber-300 ring-1 ring-amber-400/20";
      default:
        return "bg-rose-50 text-rose-800 border-rose-300 ring-1 ring-rose-400/20";
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
      {/* SCORECARD HEADER */}
      <div className="bg-gradient-to-r from-[#102E50] via-[#153a63] to-[#0c233d] p-6 sm:p-8 text-white relative">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-[#F2AF3E]/20 text-[#ffddb0] px-2.5 py-0.5 rounded-full border border-[#F2AF3E]/30">
                Scorecard Resmi PSPK
              </span>
              <span className="text-xs text-slate-300 flex items-center gap-1 font-mono">
                <Lock className="w-3 h-3 text-emerald-400" />
                Terkunci & Disahkan
              </span>
            </div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-white">
              {review.period.name}
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Periode Evaluasi: {review.period.startDate} s.d. {review.period.endDate}
            </p>
          </div>

          {/* Skor Utama Badge */}
          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-center min-w-[150px] shadow-inner">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 block mb-0.5">
              Skor Akhir Resmi
            </span>
            <div className="text-3xl font-extrabold font-mono text-[#F2AF3E]">
              {finalScore}
              <span className="text-xs font-normal text-slate-300"> / 100</span>
            </div>
            <div className="mt-1.5">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getPredicateBadge(
                  review.predicate,
                )}`}
              >
                {review.predicate}
              </span>
            </div>
          </div>
        </div>

        {/* Pegawai Info strip */}
        <div className="mt-6 pt-4 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Nama Pegawai:</span>
            <strong className="text-white font-medium">{employeeName}</strong>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">NIP:</span>
            <span className="text-white font-mono">{employeeNo}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Jabatan & Divisi:</span>
            <span className="text-white">
              {positionTitle} • {departmentName}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Atasan Penilai:</span>
            <span className="text-white font-medium">{review.reviewer?.fullName || "-"}</span>
          </div>
        </div>
      </div>

      <div className="p-6 sm:p-8 space-y-6">
        {/* SCORE COMPARISON PILLS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider">
              Evaluasi Mandiri (Staf)
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-bold font-mono text-slate-900">
                {review.selfScore !== null ? review.selfScore : "-"}
              </span>
              <span className="text-xs text-slate-400">/ 100</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/80">
            <span className="text-[11px] font-semibold text-blue-900 block uppercase tracking-wider">
              Penilaian Atasan Langsung
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-bold font-mono text-blue-950">
                {review.managerScore !== null ? review.managerScore : "-"}
              </span>
              <span className="text-xs text-blue-400">/ 100</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80">
            <span className="text-[11px] font-semibold text-amber-900 block uppercase tracking-wider">
              Skor Disahkan Lembaga
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-bold font-mono text-amber-950">{finalScore}</span>
              <span className="text-xs text-amber-500">/ 100</span>
            </div>
          </div>
        </div>

        {/* GOALS BREAKDOWN */}
        <div className="space-y-3">
          <h4 className="font-serif text-sm font-bold text-slate-900 flex items-center gap-2">
            <Target className="w-4 h-4 text-[#102E50]" />
            <span>Rincian Sasaran Riset & Realisasi Capaian</span>
          </h4>

          {review.goals.length === 0 ? (
            <p className="text-xs text-slate-400 italic">
              Tidak ada rincian sasaran yang tercatat.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 overflow-hidden">
              {review.goals.map((g, idx) => (
                <div
                  key={g.id}
                  className="p-4 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-400">#{idx + 1}</span>
                      <strong className="text-slate-900">{g.title}</strong>
                      <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-slate-100 text-slate-700">
                        Bobot {g.weight}%
                      </span>
                    </div>
                    {g.description && (
                      <p className="text-slate-500 text-[11px] pl-5">{g.description}</p>
                    )}
                  </div>

                  <div className="sm:text-right pl-5 sm:pl-0 shrink-0">
                    <div className="text-[11px] text-slate-500">
                      Target:{" "}
                      <strong className="text-slate-700">
                        {g.target || "-"} {g.unit || ""}
                      </strong>
                    </div>
                    <div className="text-[11px] text-emerald-700 font-medium">
                      Realisasi: <strong>{g.actual || "Tercapai"}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FEEDBACK COMMENTS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Refleksi Staf */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <FileText className="w-4 h-4 text-slate-400" />
              <span>Refleksi Mandiri Pegawai</span>
            </div>
            <p className="text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-200/80 italic leading-relaxed min-h-[64px]">
              &ldquo;{review.selfComment || "Tidak ada catatan refleksi."}&rdquo;
            </p>
          </div>

          {/* Feedback Atasan */}
          <div className="p-4 rounded-2xl bg-blue-50/40 border border-blue-200/70 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
              <MessageSquare className="w-4 h-4 text-blue-600" />
              <span>Catatan Evaluasi Atasan Langsung</span>
            </div>
            <p className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-blue-100 italic leading-relaxed min-h-[64px]">
              &ldquo;{review.managerComment || "Tidak ada catatan evaluasi dari atasan."}&rdquo;
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
