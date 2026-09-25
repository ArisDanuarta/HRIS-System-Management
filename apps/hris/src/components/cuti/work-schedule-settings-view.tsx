"use client";

import React, { useState, useTransition } from "react";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Save,
  Info,
  ShieldCheck,
  Timer,
  Zap,
} from "lucide-react";
import { ActiveWorkSchedule } from "@/server/services/work-schedule.service";
import { updateWorkScheduleAction } from "@/server/actions/work-schedule.actions";

interface WorkScheduleSettingsViewProps {
  initialSchedule: ActiveWorkSchedule;
}

const DAY_LABELS = [
  { id: 1, name: "Senin", short: "Sen" },
  { id: 2, name: "Selasa", short: "Sel" },
  { id: 3, name: "Rabu", short: "Rab" },
  { id: 4, name: "Kamis", short: "Kam" },
  { id: 5, name: "Jumat", short: "Jum" },
  { id: 6, name: "Sabtu", short: "Sab" },
  { id: 7, name: "Minggu", short: "Min" },
];

const PRESET_GRACE_PERIODS = [
  { value: 0, label: "0 Menit", note: "Ketat (On-Time)" },
  { value: 5, label: "5 Menit", note: "Toleransi Minimal" },
  { value: 10, label: "10 Menit", note: "Toleransi Sedang" },
  { value: 15, label: "15 Menit", note: "Standar PSPK" },
  { value: 30, label: "30 Menit", note: "Toleransi Longgar" },
];

export function WorkScheduleSettingsView({ initialSchedule }: WorkScheduleSettingsViewProps) {
  const [schedule, setSchedule] = useState({
    id: initialSchedule.id === "default-fallback" ? undefined : initialSchedule.id,
    name: initialSchedule.name,
    workStartTime: initialSchedule.workStartTime,
    workEndTime: initialSchedule.workEndTime,
    gracePeriodMins: initialSchedule.gracePeriodMins,
    workingDays: initialSchedule.workingDays,
    isFlexible: initialSchedule.isFlexible,
  });

  const [testTime, setTestTime] = useState<string>("09:14");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  // Helper to compute cutoff time (e.g., 09:00 + 15 min = 09:15)
  const calculateCutoffTime = (startTime: string, graceMins: number): string => {
    const parts = startTime.split(":");
    const h = parseInt(parts[0] || "9", 10);
    const m = parseInt(parts[1] || "0", 10);
    const totalMinutes = h * 60 + m + graceMins;
    const cutoffH = Math.floor(totalMinutes / 60) % 24;
    const cutoffM = totalMinutes % 60;
    return `${String(cutoffH).padStart(2, "0")}:${String(cutoffM).padStart(2, "0")}`;
  };

  // Calculate work duration
  const calculateWorkHours = (startTime: string, endTime: string): string => {
    const startParts = startTime.split(":");
    const endParts = endTime.split(":");
    const startMin = parseInt(startParts[0] || "9", 10) * 60 + parseInt(startParts[1] || "0", 10);
    const endMin = parseInt(endParts[0] || "17", 10) * 60 + parseInt(endParts[1] || "0", 10);
    const diffMin = endMin - startMin;
    if (diffMin <= 0) return "Durasi tidak valid";
    const hours = Math.floor(diffMin / 60);
    const mins = diffMin % 60;
    return mins > 0 ? `${hours} jam ${mins} menit` : `${hours} jam`;
  };

  const cutoffTime = calculateCutoffTime(schedule.workStartTime, schedule.gracePeriodMins);
  const totalWorkDuration = calculateWorkHours(schedule.workStartTime, schedule.workEndTime);

  // Test check-in calculation
  const getTestCheckInStatus = (testHourMin: string) => {
    const [tH, tM] = testHourMin.split(":").map((v) => parseInt(v, 10));
    const [sH, sM] = schedule.workStartTime.split(":").map((v) => parseInt(v, 10));
    const testTotal = (tH || 0) * 60 + (tM || 0);
    const startTotal = (sH || 0) * 60 + (sM || 0);
    const cutoffTotal = startTotal + schedule.gracePeriodMins;

    if (testTotal <= cutoffTotal) {
      return {
        isLate: false,
        label: "Tepat Waktu (Hadir)",
        color: "bg-emerald-50 text-emerald-800 border-emerald-200",
        message:
          testTotal <= startTotal
            ? "Tiba lebih awal atau pas jam masuk."
            : `Tiba dalam batas toleransi (${testTotal - startTotal} menit dari jam masuk).`,
      };
    } else {
      const lateBy = testTotal - startTotal;
      return {
        isLate: true,
        label: `Terlambat (${lateBy} Menit)`,
        color: "bg-amber-50 text-amber-900 border-amber-200",
        message: `Melebihi batas toleransi ${schedule.gracePeriodMins} menit. Tercatat terlambat.`,
      };
    }
  };

  const testStatus = getTestCheckInStatus(testTime);

  const toggleDay = (dayId: number) => {
    setSchedule((prev) => {
      const exists = prev.workingDays.includes(dayId);
      if (exists) {
        if (prev.workingDays.length <= 1) return prev; // Minimal 1 hari
        return { ...prev, workingDays: prev.workingDays.filter((d) => d !== dayId) };
      } else {
        return { ...prev, workingDays: [...prev.workingDays, dayId].sort((a, b) => a - b) };
      }
    });
  };

  const select5DaysWeek = () => {
    setSchedule((prev) => ({ ...prev, workingDays: [1, 2, 3, 4, 5] }));
  };

  const select6DaysWeek = () => {
    setSchedule((prev) => ({ ...prev, workingDays: [1, 2, 3, 4, 5, 6] }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    startTransition(async () => {
      const res = await updateWorkScheduleAction({
        id: schedule.id,
        name: schedule.name,
        workStartTime: schedule.workStartTime,
        workEndTime: schedule.workEndTime,
        gracePeriodMins: schedule.gracePeriodMins,
        workingDays: schedule.workingDays,
        isFlexible: schedule.isFlexible,
      });

      if (res.success) {
        setFeedback({ type: "success", text: res.message });
      } else {
        setFeedback({ type: "error", text: res.message });
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
              : "bg-red-50 text-red-900 border border-red-200"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Kolom Kiri: Form Konfigurasi (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-[#eff4ff] text-[#102e50] rounded-xl">
                <Clock className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-base font-bold text-[#102e50]">
                  Kebijakan Jam Masuk & Pulang Kerja
                </h2>
                <p className="text-xs text-slate-500">
                  Parameter baku waktu kerja kantor pusat PSPK untuk verifikasi presensi harian.
                </p>
              </div>
            </div>
          </div>

          {/* Nama Jadwal */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Nama Kebijakan Jadwal
            </label>
            <input
              type="text"
              value={schedule.name}
              onChange={(e) => setSchedule((p) => ({ ...p, name: e.target.value }))}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#102e50]/20 focus:border-[#102e50] outline-hidden transition-all text-slate-800 font-medium"
              placeholder="Contoh: Jadwal Kerja Reguler PSPK"
            />
          </div>

          {/* Jam Masuk & Jam Pulang */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Jam Masuk Baku (WIB)
              </label>
              <div className="relative">
                <input
                  type="time"
                  value={schedule.workStartTime}
                  onChange={(e) => setSchedule((p) => ({ ...p, workStartTime: e.target.value }))}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#102e50]/20 focus:border-[#102e50] outline-hidden font-mono font-bold text-slate-800 transition-all"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Default resmi: 09:00 WIB</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Jam Pulang Baku (WIB)
              </label>
              <div className="relative">
                <input
                  type="time"
                  value={schedule.workEndTime}
                  onChange={(e) => setSchedule((p) => ({ ...p, workEndTime: e.target.value }))}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#102e50]/20 focus:border-[#102e50] outline-hidden font-mono font-bold text-slate-800 transition-all"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Default resmi: 17:00 WIB</p>
            </div>
          </div>

          {/* Toleransi Keterlambatan (Grace Period) */}
          <div className="bg-[#eff4ff]/40 p-4.5 rounded-xl border border-[#dee9fc] space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#102e50] flex items-center gap-1.5">
                <Timer className="w-4 h-4 text-[#f2af3e]" />
                <span>Toleransi Keterlambatan (Grace Period)</span>
              </label>
              <span className="text-xs font-mono font-bold bg-[#102e50] text-white px-2.5 py-1 rounded-lg">
                {schedule.gracePeriodMins} Menit
              </span>
            </div>

            <p className="text-[11px] text-slate-600 leading-relaxed">
              Karyawan yang melakukan check-in antara pukul{" "}
              <strong className="text-slate-800 font-mono">{schedule.workStartTime}</strong> sampai{" "}
              <strong className="text-emerald-700 font-mono">{cutoffTime} WIB</strong> tetap diakui{" "}
              <strong className="text-emerald-700">Tepat Waktu (Hadir)</strong> tanpa potongan.
            </p>

            {/* Presets Button */}
            <div className="flex flex-wrap gap-2 pt-1">
              {PRESET_GRACE_PERIODS.map((preset) => {
                const isSelected = schedule.gracePeriodMins === preset.value;
                return (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setSchedule((p) => ({ ...p, gracePeriodMins: preset.value }))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#102e50] text-[#ffddb0] shadow-xs font-bold ring-2 ring-[#102e50]/30"
                        : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>

            {/* Custom Input */}
            <div className="flex items-center gap-2 pt-2">
              <span className="text-[11px] text-slate-500">Atau atur manual:</span>
              <input
                type="number"
                min={0}
                max={120}
                value={schedule.gracePeriodMins}
                onChange={(e) =>
                  setSchedule((p) => ({
                    ...p,
                    gracePeriodMins: Math.max(0, Math.min(120, parseInt(e.target.value, 10) || 0)),
                  }))
                }
                className="w-20 px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-mono font-bold text-center bg-white"
              />
              <span className="text-[11px] text-slate-600">menit (maksimal 120 menit)</span>
            </div>
          </div>

          {/* Hari Kerja Aktif */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-500" />
                <span>Hari Kerja Aktif Organisasi</span>
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={select5DaysWeek}
                  className="text-[11px] text-[#102e50] hover:underline font-semibold cursor-pointer"
                >
                  Sen-Jum (5 Hari)
                </button>
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  onClick={select6DaysWeek}
                  className="text-[11px] text-[#102e50] hover:underline font-semibold cursor-pointer"
                >
                  Sen-Sab (6 Hari)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {DAY_LABELS.map((day) => {
                const isSelected = schedule.workingDays.includes(day.id);
                return (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => toggleDay(day.id)}
                    className={`py-2 px-1 rounded-xl text-xs text-center transition-all cursor-pointer font-medium ${
                      isSelected
                        ? "bg-[#102e50] text-white font-bold shadow-xs ring-1 ring-[#102e50]"
                        : "bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200"
                    }`}
                  >
                    <div>{day.short}</div>
                    <div className="text-[9px] opacity-75">{isSelected ? "Aktif" : "Libur"}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Opsi Fleksibel */}
          <div className="pt-2">
            <label className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-all">
              <input
                type="checkbox"
                checked={schedule.isFlexible}
                onChange={(e) => setSchedule((p) => ({ ...p, isFlexible: e.target.checked }))}
                className="w-4 h-4 rounded-sm text-[#102e50] border-slate-300 focus:ring-[#102e50]"
              />
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  Terapkan Jam Fleksibel (Flexible Hours)
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Jika diaktifkan, pegawai bebas check-in kapan saja selama memenuhi target total jam kerja.
                </span>
              </div>
            </label>
          </div>

          {/* Tombol Simpan */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Tindakan ini dicatat dalam Audit Log resmi.
            </span>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#102e50] text-white hover:bg-[#0c233d] disabled:opacity-50 text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-[0.98]"
            >
              <Save className="w-4 h-4 text-[#ffddb0]" />
              <span>{isPending ? "Menyimpan Perubahan..." : "Simpan Pengaturan Jadwal"}</span>
            </button>
          </div>
        </div>

        {/* Kolom Kanan: Simulator & Pratinjau Dampak (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Card Simulator Check-in */}
          <div className="bg-gradient-to-br from-white to-[#f8fafd] rounded-2xl border border-[#dee9fc] shadow-xs p-5.5 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <span className="p-1.5 bg-[#f2af3e]/20 text-[#a8281c] rounded-lg">
                <Zap className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-xs font-bold text-[#102e50] uppercase tracking-wider">
                  Simulasi Penentuan Presensi
                </h3>
                <p className="text-[11px] text-slate-500">
                  Uji coba jam kedatangan karyawan dengan konfigurasi saat ini.
                </p>
              </div>
            </div>

            {/* Durasi Kerja */}
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-2xs">
                <span className="text-[10px] text-slate-400 font-semibold block uppercase">
                  Batas Hadir Tepat Waktu
                </span>
                <span className="text-base font-mono font-bold text-emerald-700">
                  {cutoffTime} WIB
                </span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-2xs">
                <span className="text-[10px] text-slate-400 font-semibold block uppercase">
                  Total Jam Kerja Harian
                </span>
                <span className="text-base font-mono font-bold text-[#102e50]">
                  {totalWorkDuration}
                </span>
              </div>
            </div>

            {/* Test Input */}
            <div className="space-y-2 pt-1">
              <label className="block text-xs font-bold text-slate-700">
                Coba Masukkan Jam Check-in:
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="time"
                  value={testTime}
                  onChange={(e) => setTestTime(e.target.value)}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold text-slate-800 bg-white"
                />
                <div
                  className={`flex-1 px-3 py-2 rounded-xl border text-xs font-bold flex items-center justify-between ${testStatus.color}`}
                >
                  <span>{testStatus.label}</span>
                  {!testStatus.isLate ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                  )}
                </div>
              </div>
              <p className="text-[11px] text-slate-600 italic">{testStatus.message}</p>
            </div>

            {/* Visual Timeline Bar */}
            <div className="space-y-1.5 pt-2">
              <span className="text-[11px] font-semibold text-slate-600 block">
                Visual Skema Waktu Check-In:
              </span>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                <div
                  className="bg-emerald-500 h-full"
                  style={{ width: "65%" }}
                  title="Tepat Waktu (Hadir)"
                />
                <div
                  className="bg-amber-500 h-full"
                  style={{ width: "35%" }}
                  title="Terlambat"
                />
              </div>
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>{schedule.workStartTime}</span>
                <span className="text-emerald-700 font-bold">{cutoffTime} (Toleransi)</span>
                <span className="text-amber-700 font-bold">&gt; Terlambat</span>
              </div>
            </div>
          </div>

          {/* Info Card Kebijakan PSPK */}
          <div className="bg-[#f8fafd] rounded-2xl border border-slate-200 p-5 space-y-3 text-xs text-slate-600">
            <div className="flex items-center gap-2 font-bold text-[#102e50]">
              <Info className="w-4 h-4 text-[#102e50]" />
              <span>Panduan Kebijakan & Prinsip PSPK</span>
            </div>
            <ul className="space-y-2 list-disc list-inside text-[11px] leading-relaxed text-slate-600">
              <li>
                <strong>Koreksi Manual:</strong> Jika pegawai terlambat karena tugas luar kantor atau kendala teknis, Admin HR tetap dapat memberikan persetujuan status hadir lewat menu <em>Koreksi Absensi</em>.
              </li>
              <li>
                <strong>Pengaruh ke Payroll:</strong> Status keterlambatan terakumulasi pada rekapitulasi bulanan dan dapat dijadikan rujukan perhitungan tunjangan kehadiran (jika diaktifkan).
              </li>
              <li>
                <strong>Zona Waktu:</strong> Semua pencatatan waktu diproses dalam zona waktu resmi <strong>Asia/Jakarta (WIB)</strong>.
              </li>
            </ul>
          </div>
        </div>
      </form>
    </div>
  );
}
