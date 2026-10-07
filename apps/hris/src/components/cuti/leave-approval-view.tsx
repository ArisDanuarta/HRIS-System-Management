"use client";

import React, { useState, useTransition } from "react";
import {
  Check,
  X,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Paperclip,
  ShieldAlert,
  RotateCcw,
  Info,
} from "lucide-react";
import {
  approveLeaveRequestAction,
  rejectLeaveRequestAction,
  overrideLeaveDecisionAction,
} from "@/server/actions/leave.actions";
import { getLeaveOverrideImpact } from "@pspk/shared";

interface LeaveApprovalItem {
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
  employee: {
    id: string;
    fullName: string;
    employeeNo: string;
    currentDepartment?: { name: string } | null;
    currentPosition?: { title: string } | null;
  };
  leaveType: {
    id: string;
    name: string;
    isPaid: boolean;
  };
}

interface LeaveApprovalViewProps {
  pendingRequests: LeaveApprovalItem[];
  allRequests: LeaveApprovalItem[];
  isSuperOrHr?: boolean;
}

export function LeaveApprovalView({
  pendingRequests,
  allRequests,
  isSuperOrHr = false,
}: LeaveApprovalViewProps) {
  const [activeTab, setActiveTab] = useState<"PENDING" | "APPROVED" | "REJECTED" | "ALL">(
    "PENDING",
  );
  const [selectedAction, setSelectedAction] = useState<{
    type: "approve" | "reject";
    request: LeaveApprovalItem;
  } | null>(null);
  const [note, setNote] = useState("");

  // Override Modal State
  const [overrideTarget, setOverrideTarget] = useState<LeaveApprovalItem | null>(null);
  const [targetStatus, setTargetStatus] = useState<"APPROVED" | "REJECTED" | "CANCELLED">(
    "APPROVED",
  );
  const [overrideReason, setOverrideReason] = useState("");

  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();

  const formatDate = (d: Date) => {
    const dateObj = typeof d === "string" ? new Date(d) : d;
    return dateObj.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const filteredRequests =
    activeTab === "ALL"
      ? allRequests
      : activeTab === "PENDING"
        ? pendingRequests
        : allRequests.filter((r) => r.status === activeTab);

  const handleConfirmAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAction) return;

    setFeedback(null);
    startTransition(async () => {
      let res;
      if (selectedAction.type === "approve") {
        res = await approveLeaveRequestAction({
          leaveRequestId: selectedAction.request.id,
          decisionNote: note || "Disetujui",
        });
      } else {
        if (note.trim().length < 3) {
          setFeedback({
            type: "error",
            text: "Alasan penolakan wajib diisi minimal 3 karakter.",
          });
          return;
        }
        res = await rejectLeaveRequestAction({
          leaveRequestId: selectedAction.request.id,
          decisionNote: note,
        });
      }

      if (res.success) {
        setFeedback({ type: "success", text: res.message });
        setSelectedAction(null);
        setNote("");
      } else {
        setFeedback({ type: "error", text: res.message });
      }
    });
  };

  const openOverrideModal = (item: LeaveApprovalItem) => {
    setOverrideTarget(item);
    setOverrideReason("");
    if (item.status === "APPROVED") {
      setTargetStatus("REJECTED");
    } else {
      setTargetStatus("APPROVED");
    }
  };

  const handleConfirmOverride = (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideTarget) return;

    if (overrideReason.trim().length < 5) {
      setFeedback({
        type: "error",
        text: "Alasan koreksi/override status wajib diisi minimal 5 karakter.",
      });
      return;
    }

    setFeedback(null);
    startTransition(async () => {
      const res = await overrideLeaveDecisionAction({
        leaveRequestId: overrideTarget.id,
        targetStatus,
        overrideReason: overrideReason.trim(),
      });

      if (res.success) {
        setFeedback({ type: "success", text: res.message });
        setOverrideTarget(null);
        setOverrideReason("");
      } else {
        setFeedback({ type: "error", text: res.message });
      }
    });
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2.5 ${
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

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("PENDING")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "PENDING"
              ? "bg-[#102e50] text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <span>Menunggu Persetujuan</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#feba48] text-[#102e50]">
            {pendingRequests.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("APPROVED")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === "APPROVED"
              ? "bg-[#102e50] text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Telah Disetujui
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("REJECTED")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === "REJECTED"
              ? "bg-[#102e50] text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Ditolak
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("ALL")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === "ALL"
              ? "bg-[#102e50] text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Seluruh Riwayat
        </button>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-xl border border-[#dee9fc] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#eff4ff]/60 border-b border-[#dee9fc] text-[#5b6675] uppercase tracking-wider font-semibold">
                <th className="py-3.5 px-4">Pegawai Pemohon</th>
                <th className="py-3.5 px-4">Jenis Cuti</th>
                <th className="py-3.5 px-4">Rentang Tanggal</th>
                <th className="py-3.5 px-4 text-center">Hari Kerja</th>
                <th className="py-3.5 px-4">Alasan Cuti</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi Persetujuan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[#121c2a]">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Tidak ada permohonan cuti pada kategori ini.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((r) => {
                  const isPendingStatus = r.status === "PENDING";

                  return (
                    <tr key={r.id} className="hover:bg-[#f8f9ff] transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-[#102e50]">{r.employee.fullName}</span>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                            <span className="font-mono">{r.employee.employeeNo}</span>
                            <span>•</span>
                            <span>{r.employee.currentDepartment?.name || "PSPK"}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {r.leaveType.name}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-slate-700">
                          {formatDate(r.startDate)} s/d {formatDate(r.endDate)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-[#102e50]">
                        {Number(r.days)} Hari
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="flex flex-col gap-1 max-w-xs">
                          <span className="truncate">{r.reason || "-"}</span>
                          {r.attachmentKey && (
                            <a
                              href={`/api/documents/${r.attachmentKey}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#102e50] hover:text-[#0c233d] hover:underline"
                              title="Buka lampiran surat keterangan"
                            >
                              <Paperclip className="w-3 h-3 text-[#102e50]" />
                              <span>Lihat Surat Lampiran</span>
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {r.status === "APPROVED" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            Disetujui
                          </span>
                        )}
                        {r.status === "PENDING" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300">
                            <Clock className="w-3 h-3" />
                            Menunggu
                          </span>
                        )}
                        {r.status === "REJECTED" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-[#a8281c] border border-red-200">
                            <XCircle className="w-3 h-3" />
                            Ditolak
                          </span>
                        )}
                        {r.status === "CANCELLED" && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-300">
                            Dibatalkan
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {isPendingStatus ? (
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedAction({ type: "reject", request: r })}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 text-[#a8281c] hover:bg-red-50 font-bold transition-all cursor-pointer active:scale-[0.98]"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Tolak</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedAction({ type: "approve", request: r })}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#102e50] text-white hover:bg-[#0c233d] font-bold transition-all shadow-xs cursor-pointer active:scale-[0.98]"
                            >
                              <Check className="w-3.5 h-3.5 text-[#feba48]" />
                              <span>Setujui</span>
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center justify-end gap-2.5">
                            <span
                              className="text-[11px] text-slate-400 italic max-w-[130px] truncate"
                              title={r.decisionNote || "Selesai dievaluasi"}
                            >
                              {r.decisionNote || "Selesai dievaluasi"}
                            </span>
                            {isSuperOrHr && (
                              <button
                                type="button"
                                onClick={() => openOverrideModal(r)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-[#102e50] font-semibold text-[11px] transition-all cursor-pointer shadow-2xs active:scale-[0.98] shrink-0"
                                title="Koreksi / Override keputusan cuti ini (Khusus Admin HR)"
                              >
                                <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
                                <span>Override</span>
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      {selectedAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full border border-[#dee9fc] shadow-2xl p-6 flex flex-col gap-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  selectedAction.type === "approve"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {selectedAction.type === "approve" ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <X className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="text-base font-bold text-[#102e50] font-heading">
                  {selectedAction.type === "approve"
                    ? "Setujui Permohonan Cuti"
                    : "Tolak Permohonan Cuti"}
                </h3>
                <p className="text-xs text-slate-500">
                  Pemohon:{" "}
                  <strong className="text-slate-800">
                    {selectedAction.request.employee.fullName}
                  </strong>
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex flex-col gap-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Jenis Cuti:</span>
                <span className="font-bold text-slate-800">
                  {selectedAction.request.leaveType.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Durasi:</span>
                <span className="font-bold text-[#102e50]">
                  {Number(selectedAction.request.days)} Hari Kerja
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tanggal:</span>
                <span className="font-medium text-slate-800">
                  {formatDate(selectedAction.request.startDate)} s/d{" "}
                  {formatDate(selectedAction.request.endDate)}
                </span>
              </div>
              {selectedAction.request.attachmentKey && (
                <div className="flex justify-between items-center pt-2 mt-0.5 border-t border-slate-200">
                  <span className="text-slate-500">Lampiran Surat:</span>
                  <a
                    href={`/api/documents/${selectedAction.request.attachmentKey}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-[#102e50] hover:text-[#0c233d] hover:underline"
                    title="Buka berkas surat keterangan di tab baru"
                  >
                    <Paperclip className="w-3.5 h-3.5 text-[#102e50]" />
                    <span>Buka Berkas Lampiran</span>
                  </a>
                </div>
              )}
            </div>

            <form onSubmit={handleConfirmAction} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-700">
                  {selectedAction.type === "approve"
                    ? "Catatan Persetujuan (Opsional)"
                    : "Alasan Penolakan (Wajib Diisi) *"}
                </label>
                <textarea
                  rows={3}
                  required={selectedAction.type === "reject"}
                  placeholder={
                    selectedAction.type === "approve"
                      ? "Contoh: Selamat beristirahat, pekerjaan telah didelegasikan..."
                      : "Jelaskan alasan mengapa permohonan cuti ini tidak dapat disetujui..."
                  }
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="p-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#102e50] focus:outline-none"
                />
              </div>

              {selectedAction.type === "approve" && (
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Persetujuan ini akan secara otomatis memotong saldo cuti pegawai dan menandai
                  presensi harian sebagai &quot;Sedang Cuti&quot;.
                </p>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setSelectedAction(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className={`px-5 py-2 rounded-lg text-xs font-bold text-white transition-all shadow-xs cursor-pointer active:scale-[0.98] disabled:opacity-50 ${
                    selectedAction.type === "approve"
                      ? "bg-[#102e50] hover:bg-[#0c233d]"
                      : "bg-[#a8281c] hover:bg-[#851e14]"
                  }`}
                >
                  {isPending
                    ? "Memproses..."
                    : selectedAction.type === "approve"
                      ? "Konfirmasi Setujui"
                      : "Konfirmasi Tolak"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin HR Override Modal */}
      {overrideTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-amber-200 shadow-2xl p-6 flex flex-col gap-4 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200">
                <ShieldAlert className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-[#102e50] font-heading">
                    Koreksi Keputusan Cuti (HR Override)
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#102e50] text-[#ffddb0]">
                    SUPER ADMIN / HR
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Pemohon:{" "}
                  <strong className="text-slate-800">{overrideTarget.employee.fullName}</strong> (
                  {overrideTarget.employee.employeeNo})
                </p>
              </div>
            </div>

            {/* Request Summary Card */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex flex-col gap-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Jenis Cuti:</span>
                <span className="font-bold text-slate-800">{overrideTarget.leaveType.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Rentang Tanggal:</span>
                <span className="font-medium text-slate-800">
                  {formatDate(overrideTarget.startDate)} s/d {formatDate(overrideTarget.endDate)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Durasi:</span>
                <span className="font-bold text-[#102e50]">
                  {Number(overrideTarget.days)} Hari Kerja
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                <span className="text-slate-500">Status Saat Ini:</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                    overrideTarget.status === "APPROVED"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : overrideTarget.status === "REJECTED"
                        ? "bg-red-50 text-[#a8281c] border border-red-200"
                        : "bg-slate-100 text-slate-700 border border-slate-300"
                  }`}
                >
                  {overrideTarget.status}
                </span>
              </div>
            </div>

            {/* Form Override */}
            <form onSubmit={handleConfirmOverride} className="flex flex-col gap-4 text-xs">
              {/* Target Status Selection */}
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-slate-700">Ubah Status Menjadi *</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(["APPROVED", "REJECTED", "CANCELLED"] as const).map((st) => {
                    const isCurrent = overrideTarget.status === st;
                    const isSelected = targetStatus === st;
                    return (
                      <button
                        key={st}
                        type="button"
                        disabled={isCurrent}
                        onClick={() => setTargetStatus(st)}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                          isCurrent
                            ? "opacity-40 cursor-not-allowed bg-slate-100 border-slate-200 text-slate-400"
                            : isSelected
                              ? "bg-[#102e50] text-[#ffddb0] border-[#102e50] shadow-xs"
                              : "bg-white border-slate-200 text-slate-700 hover:border-[#102e50]"
                        }`}
                      >
                        {st === "APPROVED" && "Setujui (APPROVED)"}
                        {st === "REJECTED" && "Tolak (REJECTED)"}
                        {st === "CANCELLED" && "Batalkan (CANCELLED)"}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Impact Info Banner */}
              {(() => {
                const impact = getLeaveOverrideImpact(
                  overrideTarget.status,
                  targetStatus,
                  Number(overrideTarget.days),
                );

                if (impact.balanceDelta > 0) {
                  return (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold">
                          Saldo Cuti Akan Dikembalikan: +{impact.balanceDelta} Hari
                        </div>
                        <div className="text-[11px] text-emerald-800 mt-0.5">
                          {impact.description}
                        </div>
                      </div>
                    </div>
                  );
                }

                if (impact.balanceDelta < 0) {
                  return (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold">
                          Saldo Cuti Akan Dipotong: {impact.balanceDelta} Hari
                        </div>
                        <div className="text-[11px] text-amber-800 mt-0.5">
                          {impact.description}
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs flex items-start gap-2">
                    <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                    <div className="text-[11px]">{impact.description}</div>
                  </div>
                );
              })()}

              {/* Override Reason Input */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700">
                    Alasan Koreksi / Override (Wajib Diisi) *
                  </label>
                  <span className="text-[11px] text-slate-400">Min. 5 karakter</span>
                </div>
                <textarea
                  rows={3}
                  required
                  placeholder="Contoh: Kesalahan persetujuan atasan sebelumnya, konfirmasi penugasan riset luar kota dibatalkan..."
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  className="p-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#102e50] focus:outline-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setOverrideTarget(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending || overrideReason.trim().length < 5}
                  className="px-5 py-2 rounded-lg bg-[#102e50] text-white text-xs font-bold hover:bg-[#0c233d] transition-all shadow-xs cursor-pointer active:scale-[0.98] disabled:opacity-50 flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-[#ffddb0]" />
                  <span>{isPending ? "Menyimpan..." : "Simpan Koreksi Status"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
