"use client";

import React, { useState, useTransition } from "react";
import {
  Calendar,
  Plus,
  Download,
  Lock,
  Unlock,
  RefreshCw,
  ChevronDown,
  Layers,
} from "lucide-react";
import { PerformancePeriodSummary } from "@/server/queries/performance.queries";
import {
  updatePerformancePeriodStatusAction,
  exportPerformanceReportAction,
} from "@/server/actions/performance.actions";
import { PerformancePeriodModal } from "./performance-period-modal";

interface PerformanceHeaderProps {
  periods: PerformancePeriodSummary[];
  activePeriod: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    status: string;
  } | null;
  onSelectPeriod: (periodId: string) => void;
}

export function PerformanceHeader({
  periods,
  activePeriod,
  onSelectPeriod,
}: PerformanceHeaderProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isTogglingStatus, startTransition] = useTransition();

  const isOpen = activePeriod?.status === "OPEN";

  const handleToggleStatus = () => {
    if (!activePeriod) return;
    const nextStatus = isOpen ? "CLOSED" : "OPEN";
    const confirmMsg = isOpen
      ? `Apakah Anda yakin ingin MENUTUP pengisian evaluasi periode "${activePeriod.name}"? Pegawai tidak dapat mengubah sasaran kerja setelah ditutup.`
      : `Buka kembali periode "${activePeriod.name}" untuk pengisian review kinerja?`;

    if (!window.confirm(confirmMsg)) return;

    startTransition(async () => {
      const res = await updatePerformancePeriodStatusAction({
        id: activePeriod.id,
        status: nextStatus,
      });

      if (!res.success) {
        alert(res.error || "Gagal memperbarui status periode.");
      }
    });
  };

  const handleExportCsv = async () => {
    if (!activePeriod) return;
    try {
      setIsExporting(true);
      const res = await exportPerformanceReportAction(activePeriod.id);
      if (!res.success || !res.data) {
        alert(res.error || "Gagal mengunduh rekap kinerja.");
        return;
      }

      // Download file in browser
      const blob = new Blob([res.data.content], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = res.data.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Gagal ekspor:", err);
      alert("Terjadi kesalahan saat mengekspor laporan kinerja.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-4 pb-4 border-b border-slate-200">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Title */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-slate-900 font-serif tracking-tight">
              Kinerja & Riset
            </h1>
            {activePeriod && (
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide ${
                  isOpen
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-slate-100 text-slate-600 border border-slate-200"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isOpen ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                  }`}
                />
                {isOpen ? "Siklus Aktif Berjalan" : "Siklus Ditutup / Terkunci"}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">
            Kelola formula sasaran riset kebijakan (*OKR/KPI*), evaluasi staf, dan rekap penilaian kinerja organisasi.
          </p>
        </div>

        {/* Right Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Period Selector Dropdown */}
          {periods.length > 0 && (
            <div className="relative inline-block">
              <select
                aria-label="Pilih Periode Evaluasi"
                value={activePeriod?.id || ""}
                onChange={(e) => onSelectPeriod(e.target.value)}
                className="appearance-none inline-flex items-center gap-2 pl-3.5 pr-8 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-semibold rounded-xl shadow-2xs transition-colors cursor-pointer outline-hidden focus:ring-1 focus:ring-[#102E50]"
              >
                {periods.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.status})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          )}

          {/* Toggle Period Status */}
          {activePeriod && (
            <button
              type="button"
              onClick={handleToggleStatus}
              disabled={isTogglingStatus}
              title={isOpen ? "Tutup Pengisian Periode" : "Buka Kembali Periode"}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-2xs transition-colors disabled:opacity-50"
            >
              {isTogglingStatus ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-500" />
              ) : isOpen ? (
                <>
                  <Lock className="w-3.5 h-3.5 text-amber-600" />
                  <span className="hidden sm:inline">Tutup Periode</span>
                </>
              ) : (
                <>
                  <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden sm:inline">Buka Periode</span>
                </>
              )}
            </button>
          )}

          {/* Export Report CSV */}
          {activePeriod && (
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={isExporting}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-2xs transition-colors disabled:opacity-50"
            >
              {isExporting ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-500" />
              ) : (
                <Download className="w-3.5 h-3.5 text-slate-600" />
              )}
              <span>Ekspor Rekap</span>
            </button>
          )}

          {/* Create New Period */}
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#102E50] hover:bg-[#1a4473] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-[#F2AF3E]" />
            <span>Buat Periode</span>
          </button>
        </div>
      </div>

      {/* Detail Rentang Tanggal Periode Aktif */}
      {activePeriod && (
        <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 bg-slate-50/80 px-3.5 py-2 rounded-xl border border-slate-200/60">
          <div className="flex items-center gap-1.5 font-medium text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>
              Rentang Evaluasi:{" "}
              <strong className="text-slate-900 font-semibold">{activePeriod.startDate}</strong> s/d{" "}
              <strong className="text-slate-900 font-semibold">{activePeriod.endDate}</strong>
            </span>
          </div>
          <span className="text-slate-300 hidden sm:inline">•</span>
          <div className="flex items-center gap-1.5 text-slate-600">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span>Fokus: Riset Kebijakan, Advokasi Daerah & Tata Kelola PSPK</span>
          </div>
        </div>
      )}

      {/* Modal */}
      <PerformancePeriodModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
