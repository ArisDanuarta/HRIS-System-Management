"use client";

import React, { useState, useEffect, useTransition } from "react";
import {
  X,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  Building,
  ShieldAlert,
  Info,
} from "lucide-react";
import {
  getMissedCheckOutCountAction,
  bulkFillMissedCheckOutAction,
} from "@/server/actions/attendance.actions";

interface BulkCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  year: number;
  month: number;
  monthLabel: string;
  departmentId?: string;
  departmentName?: string;
  onSuccess?: () => void;
}

export function BulkCheckoutModal({
  isOpen,
  onClose,
  year,
  month,
  monthLabel,
  departmentId,
  departmentName,
  onSuccess,
}: BulkCheckoutModalProps) {
  const [checkOutTime, setCheckOutTime] = useState("17:00");
  const [reason, setReason] = useState("Penyesuaian massal check-out audit HR");
  const [count, setCount] = useState<number | null>(null);
  const [isLoadingCount, setIsLoadingCount] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Load preview count when modal opens or period changes
  useEffect(() => {
    if (!isOpen) {
      setCount(null);
      setError(null);
      setSuccess(null);
      return;
    }

    let isMounted = true;
    setIsLoadingCount(true);
    setError(null);

    getMissedCheckOutCountAction({
      year,
      month,
      departmentId: departmentId && departmentId !== "ALL" ? departmentId : undefined,
    })
      .then((res) => {
        if (!isMounted) return;
        if (res.success) {
          setCount(res.count);
        } else {
          setError(res.message || "Gagal memuat pratinjau data.");
          setCount(0);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : "Terjadi kesalahan sistem.");
        setCount(0);
      })
      .finally(() => {
        if (isMounted) setIsLoadingCount(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, year, month, departmentId]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!checkOutTime || !/^([01]\d|2[0-3]):([0-5]\d)$/.test(checkOutTime)) {
      setError("Format waktu check-out harus berupa jam yang valid (HH:mm).");
      return;
    }

    if (reason.trim().length < 3) {
      setError("Alasan penyesuaian wajib diisi minimal 3 karakter untuk audit trail.");
      return;
    }

    startTransition(async () => {
      const res = await bulkFillMissedCheckOutAction({
        year,
        month,
        departmentId: departmentId && departmentId !== "ALL" ? departmentId : undefined,
        checkOutTime,
        reason: reason.trim(),
      });

      if (res.success) {
        setSuccess(res.message);
        setTimeout(() => {
          onClose();
          onSuccess?.();
        }, 1200);
      } else {
        setError(res.message);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#102e50]/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
        {/* PSPK Signature Top Bar */}
        <div className="flex h-1.5 w-full">
          <div className="w-1/2 bg-[#102e50]" />
          <div className="w-1/4 bg-[#f2af3e]" />
          <div className="w-1/6 bg-[#a8281c]" />
          <div className="flex-1 bg-slate-300" />
        </div>

        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-[#102e50]">
            <Clock className="w-5 h-5 text-[#f2af3e]" />
            <div>
              <h2 className="text-base font-bold font-heading">Lengkapi Check-Out Massal</h2>
              <p className="text-[11px] text-slate-500">
                Penyelesaian otomatis presensi tanpa tap pulang oleh HR
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="p-1.5 rounded-lg text-slate-400 hover:text-[#102e50] hover:bg-slate-200/60 transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-[#a8281c]/10 border border-[#a8281c]/25 text-[#a8281c] flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{success}</span>
            </div>
          )}

          {/* Scope Target Information */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col gap-2">
            <div className="flex items-center justify-between text-slate-600">
              <span className="flex items-center gap-1.5 font-medium">
                <Calendar className="w-3.5 h-3.5 text-[#0874aa]" />
                Periode Rekap
              </span>
              <span className="font-semibold text-[#102e50]">
                {monthLabel} {year}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span className="flex items-center gap-1.5 font-medium">
                <Building className="w-3.5 h-3.5 text-[#0874aa]" />
                Cakupan Divisi
              </span>
              <span className="font-semibold text-[#102e50]">
                {departmentName || "Semua Divisi"}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
              <span className="font-medium text-slate-600">Data Check-Out Kosong</span>
              <span className="font-bold text-sm text-[#102e50] flex items-center gap-1.5">
                {isLoadingCount ? (
                  <span className="inline-flex items-center gap-1 text-slate-400 font-normal text-xs">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Menghitung...
                  </span>
                ) : count !== null ? (
                  <span className={count > 0 ? "text-[#a8281c]" : "text-emerald-700"}>
                    {count} data
                  </span>
                ) : (
                  "-"
                )}
              </span>
            </div>
          </div>

          {/* Safety Notice */}
          <div className="p-3 rounded-xl bg-[#0874aa]/10 border border-[#0874aa]/20 text-[#102e50] flex items-start gap-2 text-[11px] leading-relaxed">
            <Info className="w-4 h-4 text-[#0874aa] shrink-0 mt-0.5" />
            <span>
              <strong>Perhatian:</strong> Sistem hanya memproses presensi tanggal lampau (sebelum
              hari ini). Presensi hari ini tetap dibiarkan aktif agar karyawan dapat melakukan
              check-out mandiri.
            </span>
          </div>

          {/* Jam Pulang Target */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="bulk-checkout-time" className="font-semibold text-[#102e50]">
              Waktu Check-Out yang Diterapkan *
            </label>
            <div className="relative">
              <input
                id="bulk-checkout-time"
                type="time"
                required
                value={checkOutTime}
                onChange={(e) => setCheckOutTime(e.target.value)}
                disabled={isPending || (count === 0 && !isLoadingCount)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-[#102e50] focus:ring-2 focus:ring-[#102e50] focus:outline-none disabled:bg-slate-100 disabled:opacity-60"
              />
            </div>
            <span className="text-[10px] text-slate-500">
              Jam pulang ini akan diterapkan pada masing-masing tanggal presensi yang bersangkutan.
            </span>
          </div>

          {/* Alasan Penyesuaian (Audit Trail) */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="bulk-checkout-reason" className="font-semibold text-[#102e50]">
              Catatan / Alasan Penyesuaian *
            </label>
            <textarea
              id="bulk-checkout-reason"
              rows={2}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isPending || (count === 0 && !isLoadingCount)}
              placeholder="Contoh: Audit rutin akhir bulan, pengisian checkout standar kantor"
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-[#102e50] focus:ring-2 focus:ring-[#102e50] focus:outline-none resize-none disabled:bg-slate-100 disabled:opacity-60"
            />
            <span className="text-[10px] text-slate-500">
              Alasan ini akan tercatat permanen di audit log dan riwayat keterangan presensi pegawai.
            </span>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 rounded-xl border border-slate-200 font-semibold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending || isLoadingCount || count === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#102e50] text-[#f2af3e] font-bold hover:bg-[#1a4066] transition-all cursor-pointer shadow-xs disabled:opacity-50 active:scale-[0.98]"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Terapkan Massal</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
