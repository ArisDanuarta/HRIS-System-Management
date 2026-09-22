import React from "react";
import { Clock } from "lucide-react";

interface AttendanceRecord {
  id: string;
  date: Date;
  checkInAt: Date | null;
  checkOutAt: Date | null;
  status: string;
  source: string;
  notes?: string | null;
  correctionReason?: string | null;
}

interface AttendanceTableProps {
  attendances: AttendanceRecord[];
}

export function AttendanceTable({ attendances }: AttendanceTableProps) {
  const formatDate = (d: Date) => {
    const dateObj = typeof d === "string" ? new Date(d) : d;
    return dateObj.toLocaleDateString("id-ID", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (d: Date | null | undefined) => {
    if (!d) return "--:--";
    const dateObj = typeof d === "string" ? new Date(d) : d;
    return dateObj.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const calculateHours = (inAt: Date | null, outAt: Date | null) => {
    if (!inAt || !outAt) return "-";
    const diffMs = new Date(outAt).getTime() - new Date(inAt).getTime();
    if (diffMs <= 0) return "-";
    const hours = diffMs / 3600000;
    return `${hours.toFixed(1)} Jam`;
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "PRESENT":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Hadir Tepat Waktu
          </span>
        );
      case "LATE":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300">
            Terlambat
          </span>
        );
      case "LEAVE":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            Sedang Cuti
          </span>
        );
      case "ABSENT":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-[#A8281C] border border-red-200">
            Alpa / Tidak Hadir
          </span>
        );
      case "WFH":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            WFH (Remote)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
            {status}
          </span>
        );
    }
  };

  if (attendances.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#dee9fc] p-12 text-center flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-xl bg-[#eff4ff] text-[#102e50] flex items-center justify-center mb-3">
          <Clock className="w-6 h-6" />
        </div>
        <p className="text-sm font-bold text-[#102e50]">Belum Ada Catatan Presensi</p>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">
          Tidak ditemukan riwayat kehadiran untuk periode ini. Gunakan tombol Check-In di atas saat mulai bertugas.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-[#dee9fc] shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#eff4ff]/60 border-b border-[#dee9fc] text-[#5b6675] uppercase tracking-wider font-semibold">
              <th className="py-3.5 px-4">Tanggal</th>
              <th className="py-3.5 px-4">Jam Masuk</th>
              <th className="py-3.5 px-4">Jam Pulang</th>
              <th className="py-3.5 px-4">Durasi Kerja</th>
              <th className="py-3.5 px-4">Status Kehadiran</th>
              <th className="py-3.5 px-4">Sumber / Catatan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-[#121c2a]">
            {attendances.map((a) => (
              <tr key={a.id} className="hover:bg-[#f8f9ff] transition-colors">
                <td className="py-3.5 px-4 font-semibold text-[#102e50]">
                  {formatDate(a.date)}
                </td>
                <td className="py-3.5 px-4 font-mono">
                  {formatTime(a.checkInAt)}
                </td>
                <td className="py-3.5 px-4 font-mono">
                  {formatTime(a.checkOutAt)}
                </td>
                <td className="py-3.5 px-4 font-medium text-slate-600">
                  {calculateHours(a.checkInAt, a.checkOutAt)}
                </td>
                <td className="py-3.5 px-4">
                  {renderStatusBadge(a.status)}
                </td>
                <td className="py-3.5 px-4 max-w-xs truncate text-slate-500">
                  {a.source === "MANUAL_HR" ? (
                    <span className="text-amber-700 font-semibold" title={a.correctionReason || "Koreksi HR"}>
                      [Koreksi HR] {a.correctionReason || ""}
                    </span>
                  ) : (
                    <span>{a.notes || "Aplikasi Web"}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
