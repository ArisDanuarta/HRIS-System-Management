"use client";

import React, { useState, useEffect, useTransition } from "react";
import { X, ShieldAlert, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { correctAttendanceAction } from "@/server/actions/attendance.actions";
import {
  toDateString,
  getTimezoneAbbr,
  getTimezoneOffsetString,
  INDONESIA_TIMEZONES,
} from "@pspk/shared";

interface AttendanceCorrectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: {
    id: string;
    fullName: string;
    employeeNo: string;
  };
  initialDate?: string;
}

export function AttendanceCorrectionModal({
  isOpen,
  onClose,
  employee,
  initialDate,
}: AttendanceCorrectionModalProps) {
  const [date, setDate] = useState(initialDate || toDateString(new Date()));

  useEffect(() => {
    if (initialDate) {
      setDate(initialDate);
    }
  }, [initialDate]);

  const [selectedTz, setSelectedTz] = useState<string>(() => {
    try {
      const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const match = INDONESIA_TIMEZONES.find((z) => z.key === detected);
      return match ? match.key : "Asia/Jakarta";
    } catch {
      return "Asia/Jakarta";
    }
  });
  const [inTime, setInTime] = useState("09:00");
  const [outTime, setOutTime] = useState("17:00");
  const [status, setStatus] = useState<"PRESENT" | "LATE" | "ABSENT" | "LEAVE" | "WFH">("PRESENT");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (reason.trim().length < 5) {
      setError("Alasan koreksi wajib diisi minimal 5 karakter untuk keperluan audit.");
      return;
    }

    startTransition(async () => {
      const offset = getTimezoneOffsetString(selectedTz);
      const checkInISO = inTime ? `${date}T${inTime}:00${offset}` : null;
      const checkOutISO = outTime ? `${date}T${outTime}:00${offset}` : null;
      const tzAbbr = getTimezoneAbbr(selectedTz);
      const auditReason = `[Zona: ${tzAbbr}] ${reason.trim()}`;

      const res = await correctAttendanceAction({
        employeeId: employee.id,
        date,
        checkInAt: checkInISO,
        checkOutAt: checkOutISO,
        status,
        correctionReason: auditReason,
      });

      if (res.success) {
        setSuccess("Koreksi presensi berhasil disimpan!");
        setTimeout(() => {
          onClose();
        }, 1000);
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
            <ShieldAlert className="w-5 h-5 text-[#f2af3e]" />
            <h2 className="text-base font-bold font-heading">Koreksi Presensi Pegawai</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-[#102e50] hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
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

          {/* Employee Target (Readonly) */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                Nama Pegawai
              </span>
              <span className="text-xs font-bold text-[#102e50] mt-0.5">{employee.fullName}</span>
            </div>
            <span className="font-mono text-xs text-[#102e50] font-semibold bg-white px-2.5 py-1 rounded-lg border border-slate-200">
              {employee.employeeNo}
            </span>
          </div>

          {/* Date & Timezone Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-[#102e50]">Tanggal Presensi *</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-[#102e50] focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-semibold text-[#102e50] flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#0874aa]" />
                  <span>Zona Waktu</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {getTimezoneOffsetString(selectedTz)}
                </span>
              </label>
              <select
                value={selectedTz}
                onChange={(e) => setSelectedTz(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:ring-2 focus:ring-[#102e50] focus:outline-none cursor-pointer"
              >
                {INDONESIA_TIMEZONES.map((tz) => (
                  <option key={tz.key} value={tz.key}>
                    {tz.abbr} — {tz.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Times: Check-in & Check-out */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-[#102e50]">
                Jam Masuk ({getTimezoneAbbr(selectedTz)})
              </label>
              <input
                type="time"
                value={inTime}
                onChange={(e) => setInTime(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-mono focus:ring-2 focus:ring-[#102e50] focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-[#102e50]">
                Jam Pulang ({getTimezoneAbbr(selectedTz)})
              </label>
              <input
                type="time"
                value={outTime}
                onChange={(e) => setOutTime(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-mono focus:ring-2 focus:ring-[#102e50] focus:outline-none"
              />
            </div>
          </div>

          {/* Status Dropdown */}
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-[#102e50]">Status Kehadiran *</label>
            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as "PRESENT" | "LATE" | "ABSENT" | "LEAVE" | "WFH")
              }
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:ring-2 focus:ring-[#102e50] focus:outline-none cursor-pointer"
            >
              <option value="PRESENT">Hadir Tepat Waktu (PRESENT)</option>
              <option value="LATE">Terlambat (LATE)</option>
              <option value="WFH">WFH / Kerja Remote (WFH)</option>
              <option value="LEAVE">Sedang Cuti / Izin (LEAVE)</option>
              <option value="ABSENT">Alpa / Tidak Hadir (ABSENT)</option>
            </select>
          </div>

          {/* Mandatory Correction Reason */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-[#102e50]">Alasan Koreksi (Wajib Audit) *</label>
              <span className="text-[10px] text-[#df632f] font-semibold">Tercatat di Audit Log</span>
            </div>
            <textarea
              required
              rows={3}
              placeholder="Contoh: Penyesuaian jam pulang karena penugasan rapat koordinasi di luar kantor..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="p-3 rounded-xl border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-[#102e50] focus:outline-none"
            />
          </div>

          {/* Audit Notice */}
          <div className="p-3 rounded-xl bg-[#f2af3e]/15 border border-[#f2af3e]/40 text-[#102e50] text-[11px] leading-relaxed">
            Perubahan data presensi ini akan dicatat secara permanen pada rekam audit sistem
            bersama dengan identitas akun HR Anda.
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2 rounded-xl bg-[#102e50] text-white hover:bg-[#0b223c] font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer active:scale-[0.98]"
            >
              {isPending ? "Menyimpan..." : "Simpan Koreksi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}