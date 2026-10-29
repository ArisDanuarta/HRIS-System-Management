"use client";

import React, { useState, useTransition } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Users,
  ShieldAlert,
  X,
  UserCheck,
} from "lucide-react";
import {
  createHolidayAction,
  createLeaveTypeAction,
  updateLeaveTypeAction,
  deleteLeaveTypeAction,
} from "@/server/actions/leave.actions";
import { ActiveWorkSchedule } from "@/server/services/work-schedule.service";
import { WorkScheduleSettingsView } from "./work-schedule-settings-view";
import { EmployeeLeaveBalancesView } from "./employee-leave-balances-view";
import { EmployeeLeaveBalanceOverview } from "@/server/queries/leave.queries";
import { PspkLoader } from "@pspk/ui";

export interface LeaveTypeItem {
  id: string;
  name: string;
  defaultQuotaDays: number;
  isPaid: boolean;
  requiresAttachment: boolean;
  applicableGender?: "MALE" | "FEMALE" | null;
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
  workSchedule?: ActiveWorkSchedule;
  employeeBalances?: EmployeeLeaveBalanceOverview[];
  defaultLeaveType?: { id: string; name: string } | null;
}

export function LeaveSettingsView({
  leaveTypes,
  holidays,
  workSchedule,
  employeeBalances = [],
  defaultLeaveType,
}: LeaveSettingsViewProps) {
  const [activeTab, setActiveTab] = useState<"schedule" | "types" | "holidays" | "balances">(
    "types",
  );

  // Holiday Modal state
  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);
  const [holidayDate, setHolidayDate] = useState("");
  const [holidayName, setHolidayName] = useState("");
  const [isCollectiveLeave, setIsCollectiveLeave] = useState(false);

  // Create Leave Type state
  const [isCreateTypeModalOpen, setIsCreateTypeModalOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createQuota, setCreateQuota] = useState(12);
  const [createIsPaid, setCreateIsPaid] = useState(true);
  const [createRequiresAttachment, setCreateRequiresAttachment] = useState(false);
  const [createApplicableGender, setCreateApplicableGender] = useState<"ALL" | "MALE" | "FEMALE">(
    "ALL",
  );
  const [createIsActive, setCreateIsActive] = useState(true);

  // Edit Leave Type state
  const [editingType, setEditingType] = useState<LeaveTypeItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editQuota, setEditQuota] = useState(12);
  const [editIsPaid, setEditIsPaid] = useState(true);
  const [editRequiresAttachment, setEditRequiresAttachment] = useState(false);
  const [editApplicableGender, setEditApplicableGender] = useState<"ALL" | "MALE" | "FEMALE">(
    "ALL",
  );
  const [editIsActive, setEditIsActive] = useState(true);

  // Delete Leave Type state
  const [deletingType, setDeletingType] = useState<LeaveTypeItem | null>(null);

  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(
    null,
  );
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

  const handleCreateType = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    startTransition(async () => {
      const res = await createLeaveTypeAction({
        name: createName,
        defaultQuotaDays: createQuota,
        isPaid: createIsPaid,
        requiresAttachment: createRequiresAttachment,
        applicableGender: createApplicableGender === "ALL" ? null : createApplicableGender,
        isActive: createIsActive,
      });

      if (res.success) {
        setFeedback({ type: "success", text: res.message });
        setIsCreateTypeModalOpen(false);
        setCreateName("");
        setCreateQuota(12);
        setCreateIsPaid(true);
        setCreateRequiresAttachment(false);
        setCreateApplicableGender("ALL");
        setCreateIsActive(true);
      } else {
        setFeedback({ type: "error", text: res.message });
      }
    });
  };

  const handleStartEdit = (lt: LeaveTypeItem) => {
    setEditingType(lt);
    setEditName(lt.name);
    setEditQuota(lt.defaultQuotaDays);
    setEditIsPaid(lt.isPaid);
    setEditRequiresAttachment(lt.requiresAttachment);
    setEditApplicableGender(
      lt.applicableGender === "MALE"
        ? "MALE"
        : lt.applicableGender === "FEMALE"
          ? "FEMALE"
          : "ALL",
    );
    setEditIsActive(lt.isActive);
  };

  const handleUpdateType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingType) return;
    setFeedback(null);

    startTransition(async () => {
      const res = await updateLeaveTypeAction({
        id: editingType.id,
        name: editName,
        defaultQuotaDays: editQuota,
        isPaid: editIsPaid,
        requiresAttachment: editRequiresAttachment,
        applicableGender: editApplicableGender === "ALL" ? null : editApplicableGender,
        isActive: editIsActive,
      });

      if (res.success) {
        setFeedback({ type: "success", text: res.message });
        setEditingType(null);
      } else {
        setFeedback({ type: "error", text: res.message });
      }
    });
  };

  const handleDeleteType = () => {
    if (!deletingType) return;
    setFeedback(null);

    startTransition(async () => {
      const res = await deleteLeaveTypeAction({ id: deletingType.id });

      if (res.success) {
        setFeedback({ type: "success", text: res.message });
        setDeletingType(null);
      } else {
        setFeedback({ type: "error", text: res.message });
        setDeletingType(null);
      }
    });
  };

  const renderGenderBadge = (gender?: "MALE" | "FEMALE" | null) => {
    if (gender === "FEMALE") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold text-xs bg-pink-50 text-pink-700 border border-pink-200">
          <span>Khusus Wanita</span>
        </span>
      );
    }
    if (gender === "MALE") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold text-xs bg-sky-50 text-sky-700 border border-sky-200">
          <span>Khusus Pria</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold text-xs bg-slate-100 text-slate-600 border border-slate-200">
        <span>Semua Pegawai</span>
      </span>
    );
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between gap-2.5 ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
              : "bg-red-50 text-red-900 border border-red-200"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tabs Controller */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setActiveTab("schedule")}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "schedule"
                ? "bg-[#102e50] text-[#ffddb0] shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Jadwal Kerja & Jam Masuk</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("types")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "types"
                ? "bg-[#102e50] text-[#ffddb0] shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Jenis & Kuota Cuti ({leaveTypes.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("holidays")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "holidays"
                ? "bg-[#102e50] text-[#ffddb0] shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Kalender Hari Libur & Cuti Bersama ({holidays.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("balances")}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "balances"
                ? "bg-[#102e50] text-[#ffddb0] shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Saldo Cuti Pegawai ({employeeBalances.length})</span>
          </button>
        </div>

        {/* Action Button for Active Tab */}
        {activeTab === "types" && (
          <button
            type="button"
            onClick={() => {
              setCreateName("");
              setCreateQuota(12);
              setCreateIsPaid(true);
              setCreateRequiresAttachment(false);
              setCreateApplicableGender("ALL");
              setCreateIsActive(true);
              setIsCreateTypeModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#102e50] text-white hover:bg-[#0c233d] text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-[0.98] shrink-0"
          >
            <Plus className="w-4 h-4 text-[#ffddb0]" />
            <span>Tambah Jenis Cuti</span>
          </button>
        )}

        {activeTab === "holidays" && (
          <button
            type="button"
            onClick={() => setIsHolidayModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#102e50] text-white hover:bg-[#0c233d] text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-[0.98] shrink-0"
          >
            <Plus className="w-4 h-4 text-[#ffddb0]" />
            <span>Tambah Hari Libur</span>
          </button>
        )}
      </div>

      {/* TAB 0: JADWAL KERJA & JAM MASUK */}
      {activeTab === "schedule" &&
        (workSchedule ? (
          <WorkScheduleSettingsView initialSchedule={workSchedule} />
        ) : (
          <PspkLoader
            fullScreen={false}
            size={64}
            label="Memuat data jadwal kerja..."
          />
        ))}

      {/* TAB 1: JENIS CUTI */}
      {activeTab === "types" && (
        <div className="bg-white rounded-xl border border-[#dee9fc] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#eff4ff]/60 border-b border-[#dee9fc] text-[#5b6675] uppercase tracking-wider font-semibold">
                  <th className="py-3.5 px-4">Nama Jenis Cuti</th>
                  <th className="py-3.5 px-4 text-center">Kriteria Pegawai</th>
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
                      <div>{lt.name}</div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {renderGenderBadge(lt.applicableGender)}
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
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold ${
                          lt.isActive
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-slate-100 text-slate-500 border border-slate-200"
                        }`}
                      >
                        {lt.isActive ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(lt)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 hover:border-[#102e50] hover:bg-[#eff4ff] text-[#102e50] font-semibold transition-colors cursor-pointer"
                          title="Edit Pengaturan Jenis Cuti"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingType(lt)}
                          className="inline-flex items-center justify-center p-1.5 rounded-lg border border-red-200 hover:border-red-500 hover:bg-red-50 text-red-600 font-semibold transition-colors cursor-pointer"
                          title="Hapus Jenis Cuti"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
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
                    <td className="py-3.5 px-4 font-semibold text-slate-800">{h.name}</td>
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

      {/* TAB 3: SALDO CUTI PEGAWAI */}
      {activeTab === "balances" && (
        <EmployeeLeaveBalancesView
          initialBalances={employeeBalances}
          defaultLeaveType={defaultLeaveType}
        />
      )}

      {/* Modal: Tambah Hari Libur */}
      {isHolidayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-[#dee9fc] shadow-2xl p-6 flex flex-col gap-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#102e50] font-heading">
                Tambah Hari Libur / Cuti Bersama
              </h3>
              <button
                type="button"
                onClick={() => setIsHolidayModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

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
                <label className="font-semibold text-slate-700">
                  Nama Peringatan / Hari Libur *
                </label>
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

      {/* Modal: Tambah Jenis Cuti Baru */}
      {isCreateTypeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-[#dee9fc] shadow-2xl p-6 flex flex-col gap-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-[#102e50] font-heading">
                  Tambah Master Jenis Cuti Baru
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tentukan kuota bawaan tahunan, kriteria gender pegawai, dan kebijakan lampiran.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateTypeModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateType} className="flex flex-col gap-4 text-xs">
              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-slate-700">Nama Jenis Cuti *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Cuti Melahirkan, Cuti Khusus..."
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  className="px-3.5 py-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-[#102e50] focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-slate-700">
                  Kuota Bawaan Tahunan (Hari) *
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={createQuota}
                  onChange={(e) => setCreateQuota(parseInt(e.target.value, 10) || 0)}
                  className="px-3.5 py-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-[#102e50] focus:outline-none"
                />
                <span className="text-[11px] text-slate-500">
                  Jumlah kuota standar yang dialokasikan otomatis kepada pegawai yang berhak setiap tahun.
                </span>
              </div>

              {/* Kriteria Gender */}
              <div className="flex flex-col gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <label className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-[#102e50]" />
                  <span>Kriteria Pegawai yang Berhak Mengajukan</span>
                </label>
                <div className="grid grid-cols-1 gap-2 pt-1">
                  <label className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 cursor-pointer">
                    <input
                      type="radio"
                      name="createGender"
                      value="ALL"
                      checked={createApplicableGender === "ALL"}
                      onChange={() => setCreateApplicableGender("ALL")}
                      className="mt-0.5 text-[#102e50] focus:ring-[#102e50]"
                    />
                    <div>
                      <span className="font-bold text-slate-800">Semua Pegawai</span>
                      <p className="text-[11px] text-slate-500">
                        Dapat diajukan oleh seluruh staf (pria maupun wanita), contoh: Cuti Tahunan, Cuti Sakit.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 cursor-pointer">
                    <input
                      type="radio"
                      name="createGender"
                      value="FEMALE"
                      checked={createApplicableGender === "FEMALE"}
                      onChange={() => setCreateApplicableGender("FEMALE")}
                      className="mt-0.5 text-[#102e50] focus:ring-[#102e50]"
                    />
                    <div>
                      <span className="font-bold text-pink-700">Khusus Karyawan Perempuan / Wanita</span>
                      <p className="text-[11px] text-slate-500">
                        Hanya muncul & dapat diajukan oleh staf perempuan, contoh: Cuti Melahirkan, Cuti Haid.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 cursor-pointer">
                    <input
                      type="radio"
                      name="createGender"
                      value="MALE"
                      checked={createApplicableGender === "MALE"}
                      onChange={() => setCreateApplicableGender("MALE")}
                      className="mt-0.5 text-[#102e50] focus:ring-[#102e50]"
                    />
                    <div>
                      <span className="font-bold text-sky-700">Khusus Karyawan Laki-laki / Pria</span>
                      <p className="text-[11px] text-slate-500">
                        Hanya muncul & dapat diajukan oleh staf pria, contoh: Cuti Istri Melahirkan (Paternity Leave).
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Ketentuan Tambahan */}
              <div className="flex flex-col gap-2 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createIsPaid}
                    onChange={(e) => setCreateIsPaid(e.target.checked)}
                    className="rounded border-slate-300 text-[#102e50] focus:ring-[#102e50]"
                  />
                  <span className="text-xs text-slate-700 font-medium">
                    Cuti Berbayar (Mendapatkan Gaji Pokok & Tunjangan Penuh)
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createRequiresAttachment}
                    onChange={(e) => setCreateRequiresAttachment(e.target.checked)}
                    className="rounded border-slate-300 text-[#102e50] focus:ring-[#102e50]"
                  />
                  <span className="text-xs text-slate-700 font-medium">
                    Wajib Melampirkan Surat Keterangan / Dokumen Bukti (Misal: Surat Dokter)
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createIsActive}
                    onChange={(e) => setCreateIsActive(e.target.checked)}
                    className="rounded border-slate-300 text-[#102e50] focus:ring-[#102e50]"
                  />
                  <span className="text-xs text-slate-700 font-medium">
                    Status Aktif (Dapat dipilih oleh pegawai saat pengajuan cuti)
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCreateTypeModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 rounded-lg bg-[#102e50] text-white font-bold hover:bg-[#0c233d] disabled:opacity-50"
                >
                  {isPending ? "Menyimpan..." : "Simpan Jenis Cuti"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Jenis Cuti */}
      {editingType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-[#dee9fc] shadow-2xl p-6 flex flex-col gap-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-[#102e50] font-heading">
                  Edit Jenis Cuti: {editingType.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Perbarui parameter kuota, kebijakan gender, atau status aktif jenis cuti ini.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingType(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateType} className="flex flex-col gap-4 text-xs">
              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-slate-700">Nama Jenis Cuti *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="px-3.5 py-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-[#102e50] focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-slate-700">
                  Kuota Bawaan Tahunan (Hari) *
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={editQuota}
                  onChange={(e) => setEditQuota(parseInt(e.target.value, 10) || 0)}
                  className="px-3.5 py-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-[#102e50] focus:outline-none"
                />
              </div>

              {/* Kriteria Gender */}
              <div className="flex flex-col gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <label className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-[#102e50]" />
                  <span>Kriteria Pegawai yang Berhak Mengajukan</span>
                </label>
                <div className="grid grid-cols-1 gap-2 pt-1">
                  <label className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 cursor-pointer">
                    <input
                      type="radio"
                      name="editGender"
                      value="ALL"
                      checked={editApplicableGender === "ALL"}
                      onChange={() => setEditApplicableGender("ALL")}
                      className="mt-0.5 text-[#102e50] focus:ring-[#102e50]"
                    />
                    <div>
                      <span className="font-bold text-slate-800">Semua Pegawai</span>
                      <p className="text-[11px] text-slate-500">
                        Dapat diajukan oleh seluruh staf (pria maupun wanita).
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 cursor-pointer">
                    <input
                      type="radio"
                      name="editGender"
                      value="FEMALE"
                      checked={editApplicableGender === "FEMALE"}
                      onChange={() => setEditApplicableGender("FEMALE")}
                      className="mt-0.5 text-[#102e50] focus:ring-[#102e50]"
                    />
                    <div>
                      <span className="font-bold text-pink-700">Khusus Karyawan Perempuan / Wanita</span>
                      <p className="text-[11px] text-slate-500">
                        Hanya muncul & dapat diajukan oleh staf perempuan (misal: Cuti Melahirkan).
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 cursor-pointer">
                    <input
                      type="radio"
                      name="editGender"
                      value="MALE"
                      checked={editApplicableGender === "MALE"}
                      onChange={() => setEditApplicableGender("MALE")}
                      className="mt-0.5 text-[#102e50] focus:ring-[#102e50]"
                    />
                    <div>
                      <span className="font-bold text-sky-700">Khusus Karyawan Laki-laki / Pria</span>
                      <p className="text-[11px] text-slate-500">
                        Hanya muncul & dapat diajukan oleh staf pria (misal: Cuti Istri Melahirkan).
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Ketentuan Tambahan */}
              <div className="flex flex-col gap-2 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editIsPaid}
                    onChange={(e) => setEditIsPaid(e.target.checked)}
                    className="rounded border-slate-300 text-[#102e50] focus:ring-[#102e50]"
                  />
                  <span className="text-xs text-slate-700 font-medium">
                    Cuti Berbayar (Mendapatkan Gaji Penuh)
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editRequiresAttachment}
                    onChange={(e) => setEditRequiresAttachment(e.target.checked)}
                    className="rounded border-slate-300 text-[#102e50] focus:ring-[#102e50]"
                  />
                  <span className="text-xs text-slate-700 font-medium">
                    Wajib Melampirkan Surat Keterangan / Berkas
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editIsActive}
                    onChange={(e) => setEditIsActive(e.target.checked)}
                    className="rounded border-slate-300 text-[#102e50] focus:ring-[#102e50]"
                  />
                  <span className="text-xs text-slate-700 font-medium">
                    Status Aktif (Tampilkan di opsi pengajuan pegawai)
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingType(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50"
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

      {/* Modal: Konfirmasi Hapus Jenis Cuti */}
      {deletingType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-red-200 shadow-2xl p-6 flex flex-col gap-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-full bg-red-50 text-red-600 shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-base font-bold text-slate-900 font-heading">
                  Hapus Master Jenis Cuti?
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Apakah Anda yakin ingin menghapus jenis cuti{" "}
                  <strong className="text-red-700 font-semibold">&ldquo;{deletingType.name}&rdquo;</strong>?
                </p>
              </div>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
              <strong className="font-bold">Keamanan Data Historis:</strong>
              <p className="mt-0.5">
                Jika jenis cuti ini sudah pernah digunakan dalam permohonan cuti pegawai sebelumnya, sistem akan menolak penghapusan permanen demi menjaga audit log. Anda dapat menonaktifkannya melalui menu edit jika tidak ingin digunakan lagi.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setDeletingType(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 text-xs"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleDeleteType}
                className="px-5 py-2 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 disabled:opacity-50 text-xs shadow-xs"
              >
                {isPending ? "Menghapus..." : "Hapus Permanen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
