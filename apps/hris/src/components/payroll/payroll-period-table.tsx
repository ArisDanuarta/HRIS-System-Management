"use client";

import React, { useState } from "react";
import Link from "next/link";
import { formatRupiah, formatDate } from "@pspk/shared";
import {
  Calendar,
  ChevronRight,
  Receipt,
  Users,
  Lock,
  CheckCircle2,
  Clock,
  Sparkles,
  TrendingUp,
} from "lucide-react";

export interface PeriodItem {
  id: string;
  year: number;
  month: number;
  kind: "REGULAR" | "THR";
  status: "DRAFT" | "CALCULATED" | "APPROVED" | "PUBLISHED" | "LOCKED";
  cutoffDate: Date | string | null;
  lockedAt: Date | string | null;
  totalEmployees: number;
  totalGross: number;
  totalDeduction: number;
  totalNet: number;
}

interface PayrollPeriodTableProps {
  periods: PeriodItem[];
  onOpenCreateModal: () => void;
}

export function PayrollPeriodTable({ periods, onOpenCreateModal }: PayrollPeriodTableProps) {
  const [selectedYear, setSelectedYear] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedKind, setSelectedKind] = useState<string>("ALL");

  const monthNames = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

  const filteredPeriods = periods.filter((p) => {
    const matchYear = selectedYear === "ALL" || String(p.year) === selectedYear;
    const matchStatus = selectedStatus === "ALL" || p.status === selectedStatus;
    const matchKind = selectedKind === "ALL" || p.kind === selectedKind;
    return matchYear && matchStatus && matchKind;
  });

  const getStatusBadge = (status: PeriodItem["status"]) => {
    switch (status) {
      case "DRAFT":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <Clock className="w-3 h-3 text-slate-500" />
            Draf Awal
          </span>
        );
      case "CALCULATED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Sparkles className="w-3 h-3 text-blue-600" />
            Terhitung (Review)
          </span>
        );
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <CheckCircle2 className="w-3 h-3 text-amber-600" />
            Disetujui HR
          </span>
        );
      case "PUBLISHED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <TrendingUp className="w-3 h-3 text-emerald-600" />
            Dipublikasikan
          </span>
        );
      case "LOCKED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-800 border border-purple-200">
            <Lock className="w-3 h-3 text-purple-600" />
            Terkunci Permanen
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3">
          {/* Filter Tahun */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-500 whitespace-nowrap">Tahun:</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-800 font-medium focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50]"
            >
              <option value="ALL">Semua Tahun</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
            </select>
          </div>

          {/* Filter Jenis */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-500 whitespace-nowrap">Jenis:</label>
            <select
              value={selectedKind}
              onChange={(e) => setSelectedKind(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-800 font-medium focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50]"
            >
              <option value="ALL">Semua Jenis</option>
              <option value="REGULAR">Reguler Bulanan</option>
              <option value="THR">Tunjangan Hari Raya (THR)</option>
            </select>
          </div>

          {/* Filter Status */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-500 whitespace-nowrap">Status:</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-800 font-medium focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50]"
            >
              <option value="ALL">Semua Status</option>
              <option value="DRAFT">Draf Awal</option>
              <option value="CALCULATED">Terhitung</option>
              <option value="APPROVED">Disetujui HR</option>
              <option value="PUBLISHED">Dipublikasikan</option>
              <option value="LOCKED">Terkunci</option>
            </select>
          </div>
        </div>

        <div>
          <button
            type="button"
            onClick={onOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#102E50] hover:bg-[#1a4473] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
          >
            <span>+ Buat Periode Baru</span>
          </button>
        </div>
      </div>

      {/* Tabel Periode */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Periode Penggajian</th>
                <th className="py-3 px-4">Jenis & Cut-Off</th>
                <th className="py-3 px-4 text-center">Status Siklus</th>
                <th className="py-3 px-4 text-center">Pegawai Terproses</th>
                <th className="py-3 px-4 text-right">Total Netto Dibayarkan</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPeriods.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Receipt className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-1" />
                    Belum ada data periode penggajian yang cocok dengan kriteria filter.
                  </td>
                </tr>
              ) : (
                filteredPeriods.map((p) => {
                  const monthName = monthNames[p.month - 1];
                  const title = `${monthName} ${p.year}`;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition-colors group">
                      {/* Periode */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                            <Calendar className="w-4 h-4 text-amber-600" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block leading-tight">
                              {title}
                            </span>
                            <span className="text-[11px] text-slate-500 font-mono">
                              ID: {p.id.substring(0, 8)}...
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Jenis & Cutoff */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span
                            className={`text-xs font-semibold ${
                              p.kind === "THR" ? "text-amber-700" : "text-slate-700"
                            }`}
                          >
                            {p.kind === "THR" ? "Tunjangan Hari Raya (THR)" : "Gaji Reguler Bulanan"}
                          </span>
                          <span className="text-[11px] text-slate-400 mt-0.5">
                            Cut-Off: {p.cutoffDate ? formatDate(p.cutoffDate) : "Akhir Bulan"}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">{getStatusBadge(p.status)}</td>

                      {/* Pegawai Terproses */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold text-xs">
                          <Users className="w-3.5 h-3.5 text-slate-500" />
                          {p.totalEmployees} Orang
                        </span>
                      </td>

                      {/* Total Netto */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-bold text-slate-900 text-sm font-mono">
                          {formatRupiah(p.totalNet)}
                        </div>
                        {p.totalGross > 0 && (
                          <div className="text-[10px] text-slate-400">
                            Bruto: {formatRupiah(p.totalGross)} | Pot:{" "}
                            {formatRupiah(p.totalDeduction)}
                          </div>
                        )}
                      </td>

                      {/* Aksi */}
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/payroll/${p.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:text-[#102E50] hover:bg-slate-50 rounded-lg text-xs font-semibold transition-colors shadow-2xs group-hover:border-[#102E50]/30"
                        >
                          <span>Buka Detail</span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#102E50] transition-transform group-hover:translate-x-0.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
