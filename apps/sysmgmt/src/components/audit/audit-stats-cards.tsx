"use client";

import React from "react";
import { AuditStats } from "@/server/queries/audit.queries";
import { History, Activity, Users, ShieldAlert } from "lucide-react";

interface AuditStatsCardsProps {
  stats: AuditStats;
}

export function AuditStatsCards({ stats }: AuditStatsCardsProps) {
  const topAction = stats.actionBreakdown[0] || { action: "NONE", count: 0 };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Kartu 1: Total Log Immutabel */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Total Rekaman
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#102E50]/10 text-[#102E50] flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight font-serif">
              {stats.totalLogs.toLocaleString("id-ID")}
            </span>
            <span className="text-xs text-slate-500 font-medium">peristiwa</span>
          </div>
        </div>
        <p className="text-[11px] text-slate-500 mt-3 pt-3 border-t border-slate-100 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
          <span>Buku besar audit tersimpan immutabel</span>
        </p>
      </div>

      {/* Kartu 2: Aktivitas 24 Jam Terakhir */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Aktivitas 24 Jam
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight font-serif">
              {stats.last24hCount.toLocaleString("id-ID")}
            </span>
            <span className="text-xs text-slate-500 font-medium">mutasi baru</span>
          </div>
        </div>
        <p className="text-[11px] text-slate-500 mt-3 pt-3 border-t border-slate-100">
          Transaksi dan mutasi data real-time hari ini
        </p>
      </div>

      {/* Kartu 3: Aktor Unik (30 Hari) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Aktor Aktif
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight font-serif">
              {stats.uniqueActorsCount.toLocaleString("id-ID")}
            </span>
            <span className="text-xs text-slate-500 font-medium">akun teridentifikasi</span>
          </div>
        </div>
        <p className="text-[11px] text-slate-500 mt-3 pt-3 border-t border-slate-100">
          Pengguna yang tercatat beraktivitas 30 hari terakhir
        </p>
      </div>

      {/* Kartu 4: Aksi Paling Dominan */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Aksi Dominan
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-700 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight font-mono">
              {topAction.action}
            </span>
            <span className="text-xs font-semibold text-purple-700">
              ({topAction.count.toLocaleString("id-ID")}x)
            </span>
          </div>
        </div>
        <div className="text-[11px] text-slate-500 mt-3 pt-3 border-t border-slate-100 flex items-center gap-1.5 overflow-hidden text-ellipsis whitespace-nowrap">
          {stats.actionBreakdown.slice(0, 3).map((a) => (
            <span
              key={a.action}
              className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-[10px] text-slate-600"
            >
              {a.action}: {a.count}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
