"use client";

import React, { useState, useTransition } from "react";
import { X, ShieldAlert, CheckCircle2, AlertCircle } from "lucide-react";
import { correctAttendanceAction } from "@/server/actions/attendance.actions";

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
  const [date, setDate] = useState(
    initialDate || new Date().toISOString().split("T")[0]!,
  );
  const [inTime, setInTime] = useState("08:30");
  const [outTime, setOutTime] = useState("17:30");
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
      // Form ISO strings for times
      const checkInISO = inTime ? `${date}T${inTime}:00+07:00` : null;
      const checkOutISO = outTime ? `${date}T${outTime}:00+07:00` : null;

      const res = await correctAttendanceAction({
        employeeId: employee.id,
        date,
        checkInAt: checkInISO,
        checkOutAt: checkOutISO,
        status,
        correctionReason: reason,
      });

      if (res.success) {
        setSuccess("Koreksi presensi berhasil disimpan!");
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setError(res.message);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-[#dee9fc] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#eff4ff] border-b border-[#dee9fc] flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#102e50]">
            <ShieldAlert className="w-5 h-5 text-[#f2af3e]" />
            <h2 className="text-base font-bold font-heading">Koreksi Presensi Karyawan</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 text-xs">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{success}</span>
            </div>
          )}

          {/* Employee Target (Readonly) */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] text-slate-500 font-medium">Pegawai</span>
              <span className="text-xs font-bold text-[#102e50] mt-0.5">{employee.fullName}</span>
            </div>
            <span className="font-mono text-xs text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
              {employee.employeeNo}
            </span>
          </div>

          {/* Date Picker */}
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-slate-700">Tanggal Presensi *</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs focus:ring-2 focus:ring-[#102e50] focus:outline-none"
            />
          </div>

          {/* Times: Check-in & Check-out */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-slate-700">Jam Masuk</label>
              <input
                type="time"
                value={inTime}
                onChange={(e) => setInTime(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-mono focus:ring-2 focus:ring-[#102e50] focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-slate-700">Jam Pulang</label>
              <input
                type="time"
                value={outTime}
                onChange={(e) => setOutTime(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-mono focus:ring-2 focus:ring-[#102e50] focus:outline-none"
              />
            </div>
          </div>

          {/* Status Dropdown */}
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-slate-700">Status Kehadiran *</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs focus:ring-2 focus:ring-[#102e50] focus:outline-none cursor-pointer"
            >
              <option value="PRESENT">Hadir Tepat Waktu (PRESENT)</option>
              <option value="LATE">Terlambat (LATE)</option>
              <option value="ABSENT">Alpa / Tidak Hadir (ABSENT)</option>
              <option value="LEAVE">Sedang Cuti / Izin (LEAVE)</option>
              <option value="WFH">WFH / Kerja Remote (WFH)</option>
            </select>
          </div>

          {/* Mandatory Correction Reason */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-700">Alasan Koreksi (Wajib Audit) *</label>
              <span className="text-[10px] text-amber-800 font-semibold">Tercatat ke Log Audit</span>
            </div>
            <textarea
              required
              rows={3}
              placeholder="Contoh: Lupa check-out saat rapat koordinasi di luar kantor..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="p-3 rounded-lg border border-slate-300 bg-white text-xs focus:ring-2 focus:ring-[#102e50] focus:outline-none"
            />
          </div>

          {/* Audit Notice */}
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
            Perubahan data kehadiran akan tercatat secara permanen pada audit log sistem bersama dengan identitas akun Anda.
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2 rounded-lg bg-[#102e50] text-white hover:bg-[#0c233d] font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer active:scale-[0.98]"
            >
              {isPending ? "Menyimpan..." : "Simpan Koreksi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
