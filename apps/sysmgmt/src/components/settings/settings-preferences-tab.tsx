"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { SystemPreferencesData } from "@/server/queries/settings.queries";
import { updateSystemPreferencesAction } from "@/server/actions/settings.actions";
import {
  Sliders,
  UploadCloud,
  History,
  Clock,
  ShieldCheck,
  Loader2,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

interface SettingsPreferencesTabProps {
  preferences: SystemPreferencesData;
  canManage: boolean;
}

export function SettingsPreferencesTab({
  preferences,
  canManage,
}: SettingsPreferencesTabProps) {
  const router = useRouter();

  const [maxUploadMb, setMaxUploadMb] = useState<number | string>(preferences.maxUploadMb);
  const [auditRetentionDays, setAuditRetentionDays] = useState<number | string>(
    preferences.auditRetentionDays,
  );
  const [sessionTimeoutMins, setSessionTimeoutMins] = useState<number | string>(
    preferences.sessionTimeoutMins,
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) return;

    setErrorMsg(null);
    setSuccessMsg(null);

    const uploadNum = Number(maxUploadMb);
    const retentionNum = Number(auditRetentionDays);
    const timeoutNum = Number(sessionTimeoutMins);

    if (isNaN(uploadNum) || uploadNum < 1 || uploadNum > 100) {
      setErrorMsg("Batas upload berkas harus antara 1 sampai 100 MB.");
      return;
    }

    if (isNaN(retentionNum) || retentionNum < 30 || retentionNum > 3650) {
      setErrorMsg("Masa retensi audit log harus antara 30 sampai 3650 hari.");
      return;
    }

    if (isNaN(timeoutNum) || timeoutNum < 15 || timeoutNum > 10080) {
      setErrorMsg("Masa aktif sesi harus antara 15 sampai 10080 menit (maks 7 hari).");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await updateSystemPreferencesAction({
        maxUploadMb: uploadNum,
        auditRetentionDays: retentionNum,
        sessionTimeoutMins: timeoutNum,
      });

      if (!res.ok) {
        setErrorMsg(res.error);
        setIsSubmitting(false);
        return;
      }

      setSuccessMsg("Preferensi sistem berhasil disimpan dan diperbarui.");
      router.refresh();
    } catch (err) {
      console.error("Gagal menyimpan preferensi sistem:", err);
      setErrorMsg(err instanceof Error ? err.message : "Terjadi kesalahan sistem.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      {/* Feedback Alerts */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-3 shadow-2xs">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{errorMsg}</div>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-3 shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{successMsg}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card 1: Batas Unggah Dokumen */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 space-y-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <UploadCloud className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 leading-tight">
                Batas Ukuran Unggah Berkas Repositori
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Mengontrol batas maksimal berkas PDF, DOCX, dan XLSX pada modal unggah modul Dokumen & SOP.
              </p>
            </div>
          </div>

          <div className="pt-2 max-w-xs">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Ukuran Maksimal (Megabyte / MB)
            </label>
            <div className="relative">
              <input
                type="number"
                min={1}
                max={100}
                required
                disabled={!canManage || isSubmitting}
                value={maxUploadMb}
                onChange={(e) => setMaxUploadMb(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-[#102E50] focus:outline-none focus:ring-2 focus:ring-[#102E50] focus:border-transparent transition disabled:bg-slate-50 disabled:text-slate-500"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                MB
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Rekomendasi standar: <span className="font-semibold text-slate-600">25 MB</span> (Maksimal diizinkan: 100 MB).
            </p>
          </div>
        </div>

        {/* Card 2: Masa Retensi Audit Log */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 space-y-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <History className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 leading-tight">
                Masa Retensi Buku Besar Audit Log
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Jangka waktu penyimpanan catatan riwayat transaksi sistem sebelum dapat diarsipkan secara legal.
              </p>
            </div>
          </div>

          <div className="pt-2 max-w-xs">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Masa Retensi (Hari)
            </label>
            <div className="relative">
              <input
                type="number"
                min={30}
                max={3650}
                required
                disabled={!canManage || isSubmitting}
                value={auditRetentionDays}
                onChange={(e) => setAuditRetentionDays(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-[#102E50] focus:outline-none focus:ring-2 focus:ring-[#102E50] focus:border-transparent transition disabled:bg-slate-50 disabled:text-slate-500"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                Hari
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Standar kepatuhan organisasi: <span className="font-semibold text-slate-600">365 Hari (1 Tahun)</span>.
            </p>
          </div>
        </div>

        {/* Card 3: Masa Aktif Sesi Login */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 space-y-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 leading-tight">
                Durasi Masa Aktif Sesi Pengguna
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Batas waktu kedaluwarsa sesi token login jika pengguna tidak aktif di aplikasi web.
              </p>
            </div>
          </div>

          <div className="pt-2 max-w-xs">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Timeout Sesi (Menit)
            </label>
            <div className="relative">
              <input
                type="number"
                min={15}
                max={10080}
                required
                disabled={!canManage || isSubmitting}
                value={sessionTimeoutMins}
                onChange={(e) => setSessionTimeoutMins(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-[#102E50] focus:outline-none focus:ring-2 focus:ring-[#102E50] focus:border-transparent transition disabled:bg-slate-50 disabled:text-slate-500"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                Menit
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Nilai default: <span className="font-semibold text-slate-600">1440 Menit (24 Jam)</span>.
            </p>
          </div>
        </div>

        {/* Audit Callout Banner */}
        <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200/90 text-xs text-slate-600 flex items-start gap-3">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold text-slate-800">Tata Kelola & Keamanan:</span> Setiap perubahan
            pada konfigurasi sistem di atas secara otomatis direkam ke dalam{" "}
            <span className="font-semibold text-[#102E50]">Buku Besar Audit Log (`core.audit_logs`)</span>{" "}
            beserta identitas administrator dan stempel waktu absolut demi transparansi tata kelola IT PSPK.
          </div>
        </div>

        {/* Submit Button */}
        {canManage && (
          <div className="flex items-center justify-end pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#102E50] text-white text-xs font-semibold hover:bg-[#102E50]/90 transition shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sliders className="w-4 h-4" />
              )}
              <span>{isSubmitting ? "Menyimpan Preferensi..." : "Simpan Preferensi Sistem"}</span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
