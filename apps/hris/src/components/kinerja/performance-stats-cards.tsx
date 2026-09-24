"use client";

import React from "react";
import {
  Users,
  FileText,
  Clock,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";

interface PerformanceStatsCardsProps {
  stats: {
    totalReviews: number;
    draftCount: number;
    selfReviewCount: number;
    managerReviewCount: number;
    finalizedCount: number;
    averageScore: number;
    completeGoalsCount: number;
    participationRate: number;
    completionRate: number;
  };
}

export function PerformanceStatsCards({ stats }: PerformanceStatsCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Pegawai */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-semibold text-slate-600">Total Pegawai</span>
          <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-[#102E50]">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-slate-900 tracking-tight">
          {stats.totalReviews}{" "}
          <span className="text-xs font-normal text-slate-400">Pegawai</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-2">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>{stats.completeGoalsCount} sasaran bobot 100%</span>
        </div>
      </div>

      {/* 2. Self-Review Staf */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-semibold text-sky-800">Evaluasi Diri</span>
          <div className="w-8 h-8 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600 border border-sky-100">
            <FileText className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-slate-900 tracking-tight">
          {stats.selfReviewCount}{" "}
          <span className="text-xs font-normal text-slate-400">Sedang Mengisi</span>
        </div>
        <div className="text-[11px] text-sky-700 font-medium mt-2">
          {stats.participationRate}% partisipasi pengisian
        </div>
      </div>

      {/* 3. Review Atasan */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-semibold text-amber-800">Review Atasan</span>
          <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-slate-900 tracking-tight">
          {stats.managerReviewCount}{" "}
          <span className="text-xs font-normal text-slate-400">Menunggu</span>
        </div>
        <div className="text-[11px] text-amber-700 font-medium mt-2">
          Menunggu penilaian manajer tim
        </div>
      </div>

      {/* 4. Selesai / Final */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-semibold text-emerald-800">Final & Terkunci</span>
          <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-emerald-950 tracking-tight">
          {stats.finalizedCount}{" "}
          <span className="text-xs font-normal text-slate-400">Selesai</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium mt-2">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
          <span>
            Rata-rata: <strong>{stats.averageScore > 0 ? stats.averageScore : "-"}</strong> / 100
          </span>
        </div>
      </div>
    </div>
  );
}
