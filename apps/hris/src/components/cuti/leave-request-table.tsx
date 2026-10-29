"use client";

import React, { useState, useMemo, useTransition } from "react";
import {
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Ban,
  Paperclip,
  ArrowRight,
  X,
} from "lucide-react";
import { cancelLeaveRequestAction } from "@/server/actions/leave.actions";

interface LeaveRequestItem {
  id: string;
  startDate: Date;
  endDate: Date;
  days: number | string | { toString(): string };
  reason?: string | null;
  attachmentKey?: string | null;
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

type StatusFilter = "ALL" | "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export function LeaveRequestTable({ requests }: LeaveRequestTableProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();

  const counts = useMemo(() => {
    return {
      ALL: requests.length,
      PENDING: requests.filter((r) => r.status === "PENDING").length,
      APPROVED: requests.filter((r) => r.status === "APPROVED").length,
      REJECTED: requests.filter((r) => r.status === "REJECTED").length,
      CANCELLED: requests.filter((r) => r.status === "CANCELLED").length,
    };
  }, [requests]);

  const filteredRequests = useMemo(() => {
    if (statusFilter === "ALL") return requests;
    return requests.filter((r) => r.status === statusFilter);
  }, [requests, statusFilter]);

  const formatDate = (d: Date) => {
    const dateObj = typeof d === "string" ? new Date(d) : d;
    return dateObj.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Disetujui</span>
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#f2af3e]/20 text-[#8e2d3f] border border-[#f2af3e]/50">
            <Clock className="w-3.5 h-3.5 text-[#df632f]" />
            <span>Menunggu Review</span>
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#a8281c]/10 text-[#a8281c] border border-[#a8281c]/25">
            <XCircle className="w-3.5 h-3.5 text-[#a8281c]" />
            <span>Ditolak</span>
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            <Ban className="w-3.5 h-3.5 text-slate-400" />
            <span>Dibatalkan</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
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
        cancellationReason: cancelReason.trim() || undefined,
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

  const filterTabs: { id: StatusFilter; label: string; count: number }[] = [
    { id: "ALL", label: "Semua", count: counts.ALL },
    { id: "PENDING", label: "Menunggu Review", count: counts.PENDING },
    { id: "APPROVED", label: "Disetujui", count: counts.APPROVED },
    { id: "REJECTED", label: "Ditolak", count: counts.REJECTED },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col">
      {/* Top Filter Bar */}
      <div className="px-5 py-3.5 border-b border-slate-200/80 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {filterTabs.map((tab) => {
            const active = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  active
                    ? "bg-[#102e50] text-white shadow-2xs"
                    : "text-slate-600 hover:text-[#102e50] hover:bg-white border border-transparent hover:border-slate-200/80"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full tabular-nums ${
                    active ? "bg-white/20 text-white" : "bg-slate-200/70 text-slate-600"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        <span className="text-[11px] text-slate-500 font-medium">
          Menampilkan <strong className="text-[#102e50]">{filteredRequests.length}</strong> dari{" "}
          {requests.length} pengajuan
        </span>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`mx-5 mt-4 p-3 rounded-xl text-xs font-medium flex items-center justify-between gap-2 ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
              : "bg-[#a8281c]/10 text-[#a8281c] border border-[#a8281c]/25"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-[#a8281c] shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Empty State */}
      {filteredRequests.length === 0 ? (
        <div className="p-12 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-[#102e50]/5 border border-[#102e50]/10 text-[#102e50] flex items-center justify-center mb-3">
            <Calendar className="w-6 h-6 text-[#f2af3e]" />
          </div>
          <p className="text-sm font-bold text-[#102e50] font-heading">
            {requests.length === 0
              ? "Belum Ada Riwayat Pengajuan Cuti"
              : "Tidak Ada Pengajuan pada Kategori Ini"}
          </p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm leading-relaxed">
            {requests.length === 0
              ? "Anda belum pernah mengajukan permohonan cuti. Gunakan tombol Ajukan Cuti Baru di bagian atas untuk memulai."
              : "Silakan pilih tab status lain untuk melihat daftar riwayat permohonan Anda."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200/80 text-[#102e50] uppercase tracking-wider font-bold text-[11px]">
                <th className="py-3.5 px-5">Jenis Cuti</th>
                <th className="py-3.5 px-4">Rentang Tanggal</th>
                <th className="py-3.5 px-4 text-center">Durasi Efektif</th>
                <th className="py-3.5 px-4">Keterangan & Lampiran</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4">Catatan Pejabat</th>
                <th className="py-3.5 px-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredRequests.map((r) => {
                const isPendingStatus = r.status === "PENDING";
                const isCancellingThis = cancellingId === r.id;

                return (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Leave Type */}
                    <td className="py-4 px-5 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-bold text-[#102e50]">{r.leaveType.name}</span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          Diajukan {formatDate(r.createdAt)}
                        </span>
                      </div>
                    </td>

                    {/* Date Span Badge */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/80 text-slate-700 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-[#0874aa]" />
                        <span>{formatDate(r.startDate)}</span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                        <span>{formatDate(r.endDate)}</span>
                      </div>
                    </td>

                    {/* Duration */}
                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-[#102e50]/5 text-[#102e50] font-bold tabular-nums">
                        {Number(r.days)} Hari
                      </span>
                    </td>

                    {/* Reason & Attachment */}
                    <td className="py-4 px-4 max-w-xs">
                      <div className="flex flex-col gap-1">
                        <span className="text-slate-700 line-clamp-2 leading-relaxed">
                          {r.reason || "-"}
                        </span>
                        {r.attachmentKey && (
                          <a
                            href={`/api/documents/${r.attachmentKey}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0874aa] hover:text-[#102e50] hover:underline w-fit"
                            title="Buka berkas lampiran pendukung"
                          >
                            <Paperclip className="w-3 h-3" />
                            <span>Lihat Dokumen Lampiran</span>
                          </a>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      {renderStatusBadge(r.status)}
                    </td>

                    {/* Decision Note */}
                    <td className="py-4 px-4 max-w-[200px]">
                      <span className="text-slate-500 line-clamp-2 text-[11px]">
                        {r.decisionNote || "-"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-5 text-right whitespace-nowrap">
                      {isPendingStatus ? (
                        isCancellingThis ? (
                          <div className="inline-flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                            <input
                              type="text"
                              placeholder="Alasan pembatalan..."
                              value={cancelReason}
                              onChange={(e) => setCancelReason(e.target.value)}
                              className="px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#102e50] w-36"
                            />
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() => handleCancel(r.id)}
                              className="px-2.5 py-1 bg-[#a8281c] hover:bg-[#8e2d3f] text-white rounded-lg font-bold text-[11px] transition-colors cursor-pointer disabled:opacity-50"
                            >
                              {isPending ? "..." : "Konfirmasi"}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setCancellingId(null);
                                setCancelReason("");
                              }}
                              className="px-2 py-1 text-slate-600 hover:bg-slate-200/70 rounded-lg font-semibold text-[11px] transition-colors cursor-pointer"
                            >
                              Tutup
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setCancellingId(r.id)}
                            className="px-3 py-1.5 text-xs font-semibold text-[#a8281c] hover:bg-[#a8281c]/10 rounded-xl border border-[#a8281c]/25 transition-colors cursor-pointer"
                          >
                            Batalkan
                          </button>
                        )
                      ) : (
                        <span className="text-slate-300 text-[11px]">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}