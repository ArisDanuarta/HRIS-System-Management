"use client";

import React, { useState, useTransition } from "react";
import { Plus, Edit2, Calendar, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import { createHolidayAction, updateLeaveTypeAction } from "@/server/actions/leave.actions";

interface LeaveTypeItem {
  id: string;
  name: string;
  defaultQuotaDays: number;
  isPaid: boolean;
  requiresAttachment: boolean;
  isActive: boolean;
}

interface HolidayItem {
  id: string;
  date: Date;
  name: string;
  isCollectiveLeave: boolean;
}

interface LeaveSettingsViewProps {
  leaveTypes: LeaveTypeItem[];
  holidays: HolidayItem[];
}

export function LeaveSettingsView({ leaveTypes, holidays }: LeaveSettingsViewProps) {
  const [activeTab, setActiveTab] = useState<"types" | "holidays">("types");

  // Holiday Modal state
  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);
  const [holidayDate, setHolidayDate] = useState("");
  const [holidayName, setHolidayName] = useState("");
  const [isCollectiveLeave, setIsCollectiveLeave] = useState(false);

  // Edit Leave Type state
  const [editingType, setEditingType] = useState<LeaveTypeItem | null>(null);
  const [editQuota, setEditQuota] = useState(12);
  const [editIsPaid, setEditIsPaid] = useState(true);
  const [editRequiresAttachment, setEditRequiresAttachment] = useState(false);

  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const formatDate = (d: Date) => {
    const dateObj = typeof d === "string" ? new Date(d) : d;
    return dateObj.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const handleAddHoliday = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    startTransition(async () => {
      const res = await createHolidayAction({
        date: holidayDate,
        name: holidayName,
        isCollectiveLeave,
      });

      if (res.success) {
        setFeedback({ type: "success", text: res.message });
        setIsHolidayModalOpen(false);
        setHolidayDate("");
        setHolidayName("");
        setIsCollectiveLeave(false);
      } else {
        setFeedback({ type: "error", text: res.message });
      }
    });
  };

  const handleUpdateType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingType) return;
    setFeedback(null);

    startTransition(async () => {
      const res = await updateLeaveTypeAction({
        id: editingType.id,
        name: editingType.name,
        defaultQuotaDays: editQuota,
        isPaid: editIsPaid,
        requiresAttachment: editRequiresAttachment,
        isActive: editingType.isActive,
      });

      if (res.success) {
        setFeedback({ type: "success", text: res.message });
        setEditingType(null);
      } else {
        setFeedback({ type: "error", text: res.message });
      }
    });
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Feedback Banner */}
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

      {/* Tabs Controller */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("types")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "types"
                ? "bg-[#102e50] text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Jenis & Kuota Cuti
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("holidays")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "holidays"
                ? "bg-[#102e50] text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Kalender Hari Libur & Cuti Bersama ({holidays.length})
          </button>
        </div>

        {activeTab === "holidays" && (
          <button
            type="button"
            onClick={() => setIsHolidayModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#102e50] text-white hover:bg-[#0c233d] text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 text-[#ffddb0]" />
            <span>Tambah Hari Libur</span>
          </button>
        )}
      </div>

      {/* TAB 1: JENIS CUTI */}
      {activeTab === "types" && (
        <div className="bg-white rounded-xl border border-[#dee9fc] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#eff4ff]/60 border-b border-[#dee9fc] text-[#5b6675] uppercase tracking-wider font-semibold">
                  <th className="py-3.5 px-4">Nama Jenis Cuti</th>
                  <th className="py-3.5 px-4 text-center">Kuota Bawaan Tahunan</th>
                  <th className="py-3.5 px-4 text-center">Tipe Gaji</th>
                  <th className="py-3.5 px-4 text-center">Kewajiban Lampiran</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[#121c2a]">
                {leaveTypes.map((lt) => (
                  <tr key={lt.id} className="hover:bg-[#f8f9ff] transition-colors">
                    <td className="py-3.5 px-4 font-bold text-[#102e50]">
                      {lt.name}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-[#102e50]">
                      {lt.defaultQuotaDays} Hari
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-semibold ${
                          lt.isPaid
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-amber-50 text-amber-800 border border-amber-200"
                        }`}
                      >
                        {lt.isPaid ? "Berbayar (Gaji Penuh)" : "Unpaid Leave"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {lt.requiresAttachment ? (
                        <span className="text-amber-800 font-semibold">Wajib Surat/Berkas</span>
                      ) : (
                        <span className="text-slate-400">Tidak Wajib</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700">
                        Aktif
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingType(lt);
                          setEditQuota(lt.defaultQuotaDays);
                          setEditIsPaid(lt.isPaid);
                          setEditRequiresAttachment(lt.requiresAttachment);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 hover:border-[#102e50] hover:bg-[#eff4ff] text-[#102e50] font-semibold transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit Kuota</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: HARI LIBUR NASIONAL */}
      {activeTab === "holidays" && (
        <div className="bg-white rounded-xl border border-[#dee9fc] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#eff4ff]/60 border-b border-[#dee9fc] text-[#5b6675] uppercase tracking-wider font-semibold">
                  <th className="py-3.5 px-4">Tanggal Libur</th>
                  <th className="py-3.5 px-4">Nama Hari Libur / Peringatan</th>
                  <th className="py-3.5 px-4 text-center">Kategori</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[#121c2a]">
                {holidays.map((h) => (
                  <tr key={h.id} className="hover:bg-[#f8f9ff] transition-colors">
                    <td className="py-3.5 px-4 font-bold text-[#102e50] font-mono">
                      {formatDate(h.date)}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {h.name}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-semibold ${
                          h.isCollectiveLeave
                            ? "bg-amber-50 text-amber-900 border border-amber-200"
                            : "bg-red-50 text-[#a8281c] border border-red-200"
                        }`}
                      >
                        {h.isCollectiveLeave ? "Cuti Bersama" : "Libur Nasional"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Tambah Hari Libur */}
      {isHolidayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-[#dee9fc] shadow-2xl p-6 flex flex-col gap-4 animate-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-[#102e50] font-heading">
              Tambah Hari Libur / Cuti Bersama
            </h3>

            <form onSubmit={handleAddHoliday} className="flex flex-col gap-4 text-xs">
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-slate-700">Tanggal Libur *</label>
                <input
                  type="date"
                  required
                  value={holidayDate}
                  onChange={(e) => setHolidayDate(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-[#102e50] focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold text-slate-700">Nama Peringatan / Hari Libur *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Hari Guru Nasional..."
                  value={holidayName}
                  onChange={(e) => setHolidayName(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-[#102e50] focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="collectiveCheck"
                  checked={isCollectiveLeave}
                  onChange={(e) => setIsCollectiveLeave(e.target.checked)}
                  className="rounded border-slate-300 text-[#102e50] focus:ring-[#102e50]"
                />
                <label htmlFor="collectiveCheck" className="text-xs text-slate-700 font-medium">
                  Tandai sebagai Cuti Bersama
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsHolidayModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 rounded-lg bg-[#102e50] text-white font-bold hover:bg-[#0c233d] disabled:opacity-50"
                >
                  {isPending ? "Menyimpan..." : "Simpan Hari Libur"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Jenis Cuti */}
      {editingType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-[#dee9fc] shadow-2xl p-6 flex flex-col gap-4 animate-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-[#102e50] font-heading">
              Edit Konfigurasi: {editingType.name}
            </h3>

            <form onSubmit={handleUpdateType} className="flex flex-col gap-4 text-xs">
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-slate-700">Kuota Bawaan Tahunan (Hari) *</label>
                <input
                  type="number"
                  min={0}
                  required
                  value={editQuota}
                  onChange={(e) => setEditQuota(parseInt(e.target.value, 10))}
                  className="px-3 py-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-[#102e50] focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="paidCheck"
                  checked={editIsPaid}
                  onChange={(e) => setEditIsPaid(e.target.checked)}
                  className="rounded border-slate-300 text-[#102e50]"
                />
                <label htmlFor="paidCheck" className="text-xs text-slate-700 font-medium">
                  Cuti Berbayar (Mendapatkan Gaji Penuh)
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="attachCheck"
                  checked={editRequiresAttachment}
                  onChange={(e) => setEditRequiresAttachment(e.target.checked)}
                  className="rounded border-slate-300 text-[#102e50]"
                />
                <label htmlFor="attachCheck" className="text-xs text-slate-700 font-medium">
                  Wajib Melampirkan Surat Keterangan
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingType(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 rounded-lg bg-[#102e50] text-white font-bold hover:bg-[#0c233d] disabled:opacity-50"
                >
                  {isPending ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
