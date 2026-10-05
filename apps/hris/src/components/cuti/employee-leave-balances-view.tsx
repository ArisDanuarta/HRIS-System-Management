"use client";

import React, { useState, useTransition } from "react";
import {
  Users,
  Search,
  Filter,
  Sliders,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Plus,
  Minus,
  Equal,
} from "lucide-react";
import { EmployeeLeaveBalanceOverview } from "@/server/queries/leave.queries";
import { adjustEmployeeLeaveBalanceAction } from "@/server/actions/leave.actions";

interface EmployeeLeaveBalancesViewProps {
  initialBalances: EmployeeLeaveBalanceOverview[];
  defaultLeaveType?: { id: string; name: string } | null;
}

export function EmployeeLeaveBalancesView({
  initialBalances,
  defaultLeaveType,
}: EmployeeLeaveBalancesViewProps) {
  const [balances, setBalances] = useState<EmployeeLeaveBalanceOverview[]>(initialBalances);
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("ALL");
  const [isPending, startTransition] = useTransition();

  // Feedback Notification
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modal State
  const [modalTarget, setModalTarget] = useState<EmployeeLeaveBalanceOverview | null>(null);
  const [adjustmentMode, setAdjustmentMode] = useState<"ADD" | "DEDUCT" | "SET">("ADD");
  const [adjustmentAmount, setAdjustmentAmount] = useState<number>(1);
  const [adjustmentReason, setAdjustmentReason] = useState<string>("");

  // Departments list
  const departments = Array.from(new Set(balances.map((b) => b.departmentName))).sort();

  // Filtering
  const filteredBalances = balances.filter((b) => {
    const matchesSearch =
      b.fullName.toLowerCase().includes(search.toLowerCase()) ||
      b.employeeNo.toLowerCase().includes(search.toLowerCase()) ||
      b.positionTitle.toLowerCase().includes(search.toLowerCase());

    const matchesDept = selectedDept === "ALL" || b.departmentName === selectedDept;

    return matchesSearch && matchesDept;
  });

  // Metrics
  const totalEmployees = balances.length;
  const totalQuota = balances.reduce((sum, b) => sum + b.quotaDays, 0);
  const totalUsed = balances.reduce((sum, b) => sum + b.usedDays, 0);
  const totalRemaining = balances.reduce((sum, b) => sum + b.remainingDays, 0);
  const avgRemaining = totalEmployees > 0 ? (totalRemaining / totalEmployees).toFixed(1) : "0";
  const lowRemainingCount = balances.filter((b) => b.remainingDays <= 3).length;

  const handleOpenModal = (item: EmployeeLeaveBalanceOverview) => {
    setModalTarget(item);
    setAdjustmentMode("ADD");
    setAdjustmentAmount(1);
    setAdjustmentReason("");
  };

  const handleCloseModal = () => {
    setModalTarget(null);
    setAdjustmentReason("");
  };

  // Kalkulasi pratinjau kuota baru
  const calculatePreview = () => {
    if (!modalTarget) return { newQuota: 0, newRemaining: 0 };
    const curQuota = modalTarget.quotaDays;
    const curUsed = modalTarget.usedDays;
    const amount = Number(adjustmentAmount) || 0;

    let newQuota = curQuota;
    if (adjustmentMode === "ADD") {
      newQuota = curQuota + amount;
    } else if (adjustmentMode === "DEDUCT") {
      newQuota = Math.max(Math.ceil(curUsed), curQuota - amount);
    } else if (adjustmentMode === "SET") {
      newQuota = Math.max(Math.ceil(curUsed), amount);
    }

    const newRemaining = Math.max(0, newQuota - curUsed);
    return { newQuota, newRemaining };
  };

  const handleSaveAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalTarget) return;

    if (!adjustmentReason.trim() || adjustmentReason.trim().length < 5) {
      setFeedback({ type: "error", text: "Alasan penyesuaian wajib diisi minimal 5 karakter." });
      return;
    }

    if (!adjustmentAmount || adjustmentAmount <= 0) {
      setFeedback({ type: "error", text: "Nominal hari harus berupa angka positif." });
      return;
    }

    setFeedback(null);

    startTransition(async () => {
      const res = await adjustEmployeeLeaveBalanceAction({
        employeeId: modalTarget.employeeId,
        leaveTypeId: modalTarget.leaveTypeId || defaultLeaveType?.id || "",
        year: modalTarget.year,
        mode: adjustmentMode,
        amount: Number(adjustmentAmount),
        reason: adjustmentReason.trim(),
      });

      if (res.success && res.data) {
        setFeedback({ type: "success", text: res.message });
        const { newQuota, newRemaining } = calculatePreview();

        // Update local state instan
        setBalances((prev) =>
          prev.map((item) =>
            item.employeeId === modalTarget.employeeId
              ? {
                  ...item,
                  quotaDays: newQuota,
                  remainingDays: newRemaining,
                }
              : item,
          ),
        );

        handleCloseModal();
      } else {
        setFeedback({ type: "error", text: res.message || "Gagal menyimpan penyesuaian saldo." });
      }
    });
  };

  const preview = calculatePreview();

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between gap-2.5 ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
              : "bg-red-50 text-red-900 border border-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
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
            className="text-slate-400 hover:text-slate-600 p-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* Ringkasan Metrik Kuota Cuti Lembaga */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col gap-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Total Pegawai Aktif
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#102e50]">{totalEmployees}</span>
            <span className="text-xs text-slate-500">orang</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col gap-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Rata-rata Sisa Kuota
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-700">{avgRemaining}</span>
            <span className="text-xs text-slate-500">hari / pegawai</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col gap-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Total Cuti Digunakan
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-blue-700">{totalUsed}</span>
            <span className="text-xs text-slate-500">dari {totalQuota} hari</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col gap-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Sisa Kuota Kritis (≤ 3 Hari)
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-600">{lowRemainingCount}</span>
            <span className="text-xs text-slate-500">pegawai</span>
          </div>
        </div>
      </div>

      {/* Toolbar Filter & Pencarian */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama pegawai, NIP, atau jabatan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 bg-white text-xs focus:ring-2 focus:ring-[#102e50] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="px-2.5 py-2 rounded-lg border border-slate-300 bg-white text-xs focus:ring-2 focus:ring-[#102e50] focus:outline-none cursor-pointer max-w-[200px] truncate"
            >
              <option value="ALL">Semua Divisi ({totalEmployees})</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <span className="text-slate-400 text-xs">
            Menampilkan <strong>{filteredBalances.length}</strong> pegawai
          </span>
        </div>
      </div>

      {/* Tabel Saldo Cuti Pegawai */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#102e50]" />
            <span className="font-bold text-xs text-[#102e50]">
              Daftar Kuota & Saldo Cuti Pegawai PSPK ({defaultLeaveType?.name || "Cuti Tahunan"} 2026)
            </span>
          </div>
          <span className="text-[11px] text-slate-500">
            Penyesuaian kuota langsung memperbarui hak cuti aktif pegawai
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Pegawai</th>
                <th className="py-3 px-4">Divisi & Jabatan</th>
                <th className="py-3 px-4 text-center">Kuota Awal</th>
                <th className="py-3 px-4 text-center">Terpakai</th>
                <th className="py-3 px-4 text-center">Sisa Saldo</th>
                <th className="py-3 px-4 text-center">Tingkat Pemakaian</th>
                <th className="py-3 px-4 text-right">Aksi HR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredBalances.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Tidak ada pegawai yang cocok dengan kriteria pencarian.
                  </td>
                </tr>
              ) : (
                filteredBalances.map((item) => {
                  const usagePercent =
                    item.quotaDays > 0 ? Math.round((item.usedDays / item.quotaDays) * 100) : 0;

                  return (
                    <tr key={item.employeeId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{item.fullName}</div>
                        <div className="text-[11px] font-mono text-slate-400">{item.employeeNo}</div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="text-slate-800">{item.positionTitle}</div>
                        <div className="text-[11px] text-slate-500">{item.departmentName}</div>
                      </td>

                      <td className="py-3 px-4 text-center font-semibold text-slate-700">
                        {item.quotaDays} hari
                      </td>

                      <td className="py-3 px-4 text-center font-semibold text-blue-700">
                        {item.usedDays} hari
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            item.remainingDays > 5
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : item.remainingDays > 0
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {item.remainingDays} hari
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 bg-slate-200 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                usagePercent > 80
                                  ? "bg-rose-500"
                                  : usagePercent > 50
                                  ? "bg-amber-500"
                                  : "bg-emerald-500"
                              }`}
                              style={{ width: `${Math.min(100, usagePercent)}%` }}
                            />
                          </div>
                          <span className="text-[11px] text-slate-500 font-mono w-8 text-right">
                            {usagePercent}%
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenModal(item)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-[#102e50] hover:text-white hover:border-[#102e50] transition-colors cursor-pointer shadow-2xs"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                          <span>Sesuaikan</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Penyesuaian Saldo Cuti */}
      {modalTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-[#F2AF3E] uppercase tracking-wider">
                  Penyesuaian Saldo Cuti Pegawai
                </span>
                <h3 className="font-bold text-base text-[#102e50] font-heading mt-0.5">
                  {modalTarget.fullName}
                </h3>
                <span className="text-xs text-slate-500">
                  {modalTarget.employeeNo} • {modalTarget.departmentName}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            {/* Info Saldo Saat Ini */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Kuota Saat Ini</span>
                <span className="font-bold text-sm text-slate-800">{modalTarget.quotaDays} hari</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Telah Dipakai</span>
                <span className="font-bold text-sm text-blue-700">{modalTarget.usedDays} hari</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Sisa Aktif</span>
                <span className="font-bold text-sm text-emerald-700">{modalTarget.remainingDays} hari</span>
              </div>
            </div>

            <form onSubmit={handleSaveAdjustment} className="flex flex-col gap-4 text-xs">
              {/* Pilihan Mode */}
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-slate-700">Metode Penyesuaian Kuota:</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustmentMode("ADD")}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-bold border transition-colors cursor-pointer ${
                      adjustmentMode === "ADD"
                        ? "bg-[#102e50] text-white border-[#102e50]"
                        : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah (+)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAdjustmentMode("DEDUCT")}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-bold border transition-colors cursor-pointer ${
                      adjustmentMode === "DEDUCT"
                        ? "bg-[#102e50] text-white border-[#102e50]"
                        : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <Minus className="w-3.5 h-3.5" />
                    <span>Kurang (-)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAdjustmentMode("SET")}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-bold border transition-colors cursor-pointer ${
                      adjustmentMode === "SET"
                        ? "bg-[#102e50] text-white border-[#102e50]"
                        : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <Equal className="w-3.5 h-3.5" />
                    <span>Tetapkan (=)</span>
                  </button>
                </div>
              </div>

              {/* Jumlah Hari */}
              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-700">
                  {adjustmentMode === "ADD"
                    ? "Jumlah Hari Ditambahkan:"
                    : adjustmentMode === "DEDUCT"
                    ? "Jumlah Hari Dikurangkan:"
                    : "Nilai Kuota Total Baru (Hari):"}
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  required
                  value={adjustmentAmount}
                  onChange={(e) => setAdjustmentAmount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs focus:ring-2 focus:ring-[#102e50] focus:outline-none"
                />
              </div>

              {/* Pratinjau Dampak */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] text-emerald-700 uppercase font-bold">Hasil Penyesuaian</span>
                  <span className="text-xs font-semibold">
                    Kuota Baru: <strong>{preview.newQuota} hari</strong>
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-emerald-700 uppercase font-bold block">Sisa Cuti Baru</span>
                  <span className="text-xs font-bold text-emerald-800">
                    {preview.newRemaining} hari aktif
                  </span>
                </div>
              </div>

              {/* Alasan Penyesuaian (Wajib) */}
              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-700">
                  Alasan Penyesuaian Kuota Cuti <span className="text-red-500">*</span>:
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Contoh: Kompensasi dinas survei lapangan hari Sabtu/Minggu di NTT, atau carry-over sisa cuti tahun 2025."
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs focus:ring-2 focus:ring-[#102e50] focus:outline-none"
                />
                <span className="text-[10px] text-slate-400">
                  Wajib diisi minimal 5 karakter untuk rekaman kepatuhan audit trail.
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[#102e50] text-white font-bold hover:bg-[#0c233d] disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isPending ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Simpan Penyesuaian</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
