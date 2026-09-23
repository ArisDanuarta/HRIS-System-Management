"use client";

import React, { useState, useTransition } from "react";
import { Plus, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";
import { createPayrollPeriodAction } from "@/server/actions/payroll.actions";

interface CreatePeriodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreatePeriodModal({ isOpen, onClose, onSuccess }: CreatePeriodModalProps) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [year, setYear] = useState<number>(currentYear);
  const [month, setMonth] = useState<number>(currentMonth);
  const [kind, setKind] = useState<"REGULAR" | "THR">("REGULAR");
  const [cutoffDate, setCutoffDate] = useState<string>("");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  const monthOptions = [
    { value: 1, label: "Januari" },
    { value: 2, label: "Februari" },
    { value: 3, label: "Maret" },
    { value: 4, label: "April" },
    { value: 5, label: "Mei" },
    { value: 6, label: "Juni" },
    { value: 7, label: "Juli" },
    { value: 8, label: "Agustus" },
    { value: 9, label: "September" },
    { value: 10, label: "Oktober" },
    { value: 11, label: "November" },
    { value: 12, label: "Desember" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const res = await createPayrollPeriodAction({
        year,
        month,
        kind,
        cutoffDate: cutoffDate || undefined,
      });

      if (!res.ok) {
        setError(res.error);
      } else {
        setSuccess(res.message);
        setTimeout(() => {
          onClose();
          onSuccess?.();
        }, 1200);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Buat Periode Penggajian</h3>
              <p className="text-xs text-slate-500">Mulai siklus payroll bulanan atau THR baru</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 mb-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Jenis Penggajian */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Jenis Penggajian *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setKind("REGULAR")}
                className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-all ${
                  kind === "REGULAR"
                    ? "bg-[#102E50] text-white border-[#102E50] shadow-2xs"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                Gaji Reguler Bulanan
              </button>
              <button
                type="button"
                onClick={() => setKind("THR")}
                className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-all ${
                  kind === "THR"
                    ? "bg-amber-600 text-white border-amber-600 shadow-2xs"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                Tunjangan Hari Raya (THR)
              </button>
            </div>
          </div>

          {/* Bulan & Tahun */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Bulan *</label>
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-800 font-medium focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50]"
              >
                {monthOptions.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Tahun *</label>
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-800 font-medium focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50]"
              >
                {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tanggal Cut-off Presensi / Dokumen */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Tanggal Cut-Off Periode (Opsional)
            </label>
            <div className="relative">
              <input
                type="date"
                value={cutoffDate}
                onChange={(e) => setCutoffDate(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50]"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Batas akhir rekonsiliasi presensi dan mutasi jabatan untuk periode ini.
            </p>
          </div>

          {/* Tombol Aksi */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              disabled={isPending}
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2 text-xs font-semibold text-white bg-[#102E50] hover:bg-[#1a4473] disabled:opacity-50 rounded-lg transition-all shadow-xs flex items-center gap-2"
            >
              {isPending && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>Simpan & Buat Siklus</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
