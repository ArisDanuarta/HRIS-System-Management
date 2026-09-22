"use client";

import React, { useState, useTransition } from "react";
import { Calendar, Clock, AlertCircle, CheckCircle2, XCircle, Ban } from "lucide-react";
import { cancelLeaveRequestAction } from "@/server/actions/leave.actions";

interface LeaveRequestItem {
  id: string;
  startDate: Date;
  endDate: Date;
  days: number | string | { toString(): string };
  reason?: string | null;
  status: string;
  decisionNote?: string | null;
  decidedAt?: Date | null;
  createdAt: Date;
  leaveType: {
    name: string;
    isPaid: boolean;
  };
}

interface LeaveRequestTableProps {
  requests: LeaveRequestItem[];
}

export function LeaveRequestTable({ requests }: LeaveRequestTableProps) {
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const formatDate = (d: Date) => {
    const dateObj = typeof d === "string" ? new Date(d) : d;
    return dateObj.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Disetujui</span>
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300">
            <Clock className="w-3.5 h-3.5" />
            <span>Menunggu Review</span>
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-[#A8281C] border border-red-200">
            <XCircle className="w-3.5 h-3.5" />
            <span>Ditolak</span>
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-300">
            <Ban className="w-3.5 h-3.5" />
            <span>Dibatalkan</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  const handleCancel = (requestId: string) => {
    setFeedback(null);
    startTransition(async () => {
      const res = await cancelLeaveRequestAction({
        leaveRequestId: requestId,
        cancellationReason: cancelReason || undefined,
      });

      if (res.success) {
        setFeedback({ type: "success", text: res.message });
        setCancellingId(null);
        setCancelReason("");
      } else {
        setFeedback({ type: "error", text: res.message });
      }
    });
  };

  if (requests.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#dee9fc] p-12 text-center flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-xl bg-[#eff4ff] text-[#102e50] flex items-center justify-center mb-3">
          <Calendar className="w-6 h-6" />
        </div>
        <p className="text-sm font-bold text-[#102e50]">Belum Ada Pengajuan Cuti</p>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">
          Anda belum pernah mengajukan permohonan cuti. Klik tombol &quot;Ajukan Cuti Baru&quot; untuk memulai.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-[#dee9fc] shadow-xs overflow-hidden flex flex-col gap-2">
      {/* Feedback banner */}
      {feedback && (
        <div
          className={`m-4 p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
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

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#eff4ff]/60 border-b border-[#dee9fc] text-[#5b6675] uppercase tracking-wider font-semibold">
              <th className="py-3.5 px-4">Jenis Cuti</th>
              <th className="py-3.5 px-4">Rentang Tanggal</th>
              <th className="py-3.5 px-4 text-center">Durasi</th>
              <th className="py-3.5 px-4">Alasan</th>
              <th className="py-3.5 px-4 text-center">Status</th>
              <th className="py-3.5 px-4">Catatan Evaluasi</th>
              <th className="py-3.5 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-[#121c2a]">
            {requests.map((r) => {
              const isPendingStatus = r.status === "PENDING";
              const isCancellingThis = cancellingId === r.id;

              return (
                <tr key={r.id} className="hover:bg-[#f8f9ff] transition-colors">
                  <td className="py-3.5 px-4 font-bold text-[#102e50]">
                    {r.leaveType.name}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-slate-800">
                      {formatDate(r.startDate)} s/d {formatDate(r.endDate)}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-[#102e50]">
                    {Number(r.days)} Hari
                  </td>
                  <td className="py-3.5 px-4 max-w-xs truncate text-slate-600">
                    {r.reason || "-"}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {renderStatusBadge(r.status)}
                  </td>
                  <td className="py-3.5 px-4 max-w-xs truncate text-slate-500">
                    {r.decisionNote || "-"}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {isPendingStatus && (
                      isCancellingThis ? (
                        <div className="inline-flex items-center gap-1.5">
                          <input
                            type="text"
                            placeholder="Alasan batal..."
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            className="px-2 py-1 text-xs border border-slate-300 rounded"
                          />
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => handleCancel(r.id)}
                            className="px-2 py-1 bg-red-600 text-white rounded font-bold cursor-pointer"
                          >
                            Ya
                          </button>
                          <button
                            type="button"
                            onClick={() => setCancellingId(null)}
                            className="px-2 py-1 bg-slate-200 text-slate-700 rounded font-semibold cursor-pointer"
                          >
                            Batal
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setCancellingId(r.id)}
                          className="px-2.5 py-1 text-xs font-semibold text-[#a8281c] hover:bg-red-50 rounded-md border border-red-200 transition-colors cursor-pointer"
                        >
                          Batalkan
                        </button>
                      )
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
