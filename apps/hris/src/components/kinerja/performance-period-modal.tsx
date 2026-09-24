"use client";

import React, { useState, useTransition } from "react";
import { X, Calendar, Plus, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";
import { createPerformancePeriodAction } from "@/server/actions/performance.actions";

interface PerformancePeriodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function PerformancePeriodModal({
  isOpen,
  onClose,
  onSuccess,
}: PerformancePeriodModalProps) {
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split("T")[0]!);
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 180);
    return d.toISOString().split("T")[0]!;
  });
  const [status, setStatus] = useState<"OPEN" | "CLOSED">("OPEN");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const res = await createPerformancePeriodAction({
        name,
        startDate,
        endDate,
        status,
      });

      if (!res.success) {
        setError(res.error || "Gagal membuat periode evaluasi.");
      } else {
        setSuccess("Periode evaluasi kinerja dan kerangka review pegawai berhasil dibuat.");
        setTimeout(() => {
          onClose();
          if (onSuccess) onSuccess();
        }, 1200);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden transform transition-all">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#102E50] to-[#1a4473] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-[#F2AF3E]">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold tracking-tight">
                Buat Periode Evaluasi Kinerja
              </h3>
              <p className="text-[11px] text-slate-200">
                Inisiasi siklus sasaran kerja (OKR) dan evaluasi staf PSPK
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content & Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{error}</div>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{success}</span>
            </div>
          )}

          {/* Nama Periode */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Nama Siklus Evaluasi <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Semester Ganjil 2026 — Riset & Advokasi Kebijakan"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:border-[#102E50] focus:ring-1 focus:ring-[#102E50] outline-hidden placeholder:text-slate-400 font-medium"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Beri nama deskriptif yang mencerminkan fokus periode riset atau semester kerja.
            </p>
          </div>

          {/* Rentang Tanggal */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Tanggal Mulai <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-[#102E50] focus:ring-1 focus:ring-[#102E50] outline-hidden font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Batas Akhir Selesai <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-[#102E50] focus:ring-1 focus:ring-[#102E50] outline-hidden font-medium"
              />
            </div>
          </div>

          {/* Status Awal */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Status Awal Periode
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setStatus("OPEN")}
                className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-all text-left flex items-center justify-between ${
                  status === "OPEN"
                    ? "border-emerald-500 bg-emerald-50/50 text-emerald-900 ring-1 ring-emerald-500"
                    : "border-slate-200 hover:bg-slate-50 text-slate-700"
                }`}
              >
                <span>Buka Pengisian (OPEN)</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </button>
              <button
                type="button"
                onClick={() => setStatus("CLOSED")}
                className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-all text-left flex items-center justify-between ${
                  status === "CLOSED"
                    ? "border-slate-500 bg-slate-100 text-slate-900 ring-1 ring-slate-500"
                    : "border-slate-200 hover:bg-slate-50 text-slate-700"
                }`}
              >
                <span>Tutup / Arsip (CLOSED)</span>
                <span className="w-2 h-2 rounded-full bg-slate-400" />
              </button>
            </div>
          </div>

          {/* Info Tambahan */}
          <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/80 text-[11px] text-amber-800 leading-relaxed">
            💡 Sistem akan secara otomatis menginisialisasi draf penilaian untuk seluruh pegawai aktif di database dan menetapkan atasan langsung sebagai penilai utama.
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-[#102E50] hover:bg-[#1a4473] rounded-xl shadow-xs transition-colors disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#F2AF3E]" />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5 text-[#F2AF3E]" />
                  <span>Buat Periode</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
