"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  Users,
  UserCheck,
  Clock,
  Calendar,
  Check,
  X,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  CalendarDays,
  ShieldCheck,
} from "lucide-react";
import { ManagerDashboardData } from "@/server/queries/dashboard/manager-dashboard";
import { TodayAttendanceCard } from "@/components/absensi/today-attendance-card";
import { LeaveBalanceCards } from "@/components/cuti/leave-balance-cards";
import {
  approveLeaveRequestAction,
  rejectLeaveRequestAction,
} from "@/server/actions/leave.actions";

interface ManagerDashboardProps {
  data: ManagerDashboardData;
  managerName: string;
}

export function ManagerDashboard({ data, managerName }: ManagerDashboardProps) {
  const [rejectingItem, setRejectingItem] = useState<{
    id: string;
    employeeName: string;
    leaveTypeName: string;
    days: number;
  } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState<string | null>(null);

  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const formatDate = (d: Date) => {
    const dateObj = typeof d === "string" ? new Date(d) : d;
    return dateObj.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
    });
  };

  const handleApprove = (leaveRequestId: string, empName: string) => {
    setFeedback(null);
    startTransition(async () => {
      const res = await approveLeaveRequestAction({
        leaveRequestId,
        decisionNote: "Disetujui oleh atasan langsung",
      });
      if (res.success) {
        setFeedback({ type: "success", text: `Permohonan cuti ${empName} berhasil disetujui!` });
      } else {
        setFeedback({ type: "error", text: res.message });
      }
    });
  };

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingItem) return;

    if (rejectReason.trim().length < 3) {
      setRejectError("Alasan penolakan wajib diisi minimal 3 karakter.");
      return;
    }

    setFeedback(null);
    setRejectError(null);
    startTransition(async () => {
      const res = await rejectLeaveRequestAction({
        leaveRequestId: rejectingItem.id,
        decisionNote: rejectReason.trim(),
      });
      if (res.success) {
        setFeedback({ type: "success", text: `Permohonan cuti ${rejectingItem.employeeName} telah ditolak.` });
        setRejectingItem(null);
        setRejectReason("");
      } else {
        setRejectError(res.message);
      }
    });
  };

  // Generate 5 days of current week (Monday to Friday)
  const weekDays = [0, 1, 2, 3, 4].map((offset) => {
    const d = new Date(data.startOfWeek);
    d.setDate(d.getDate() + offset);
    return {
      date: d,
      dateStr: d.toISOString().split("T")[0]!,
      dayName: d.toLocaleDateString("id-ID", { weekday: "short" }),
      dayNumber: d.getDate(),
      isToday: d.toISOString().split("T")[0] === new Date().toISOString().split("T")[0],
    };
  });

  return (
    <div className="flex flex-col gap-6 max-w-[1440px] mx-auto pb-12 w-full animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#dee9fc]">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#74777f] mb-1">
            <span>Portal Manajer & Atasan Tim</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#f2af3e]" />
            <span>PSPK</span>
          </div>
          <h1 className="text-2xl sm:text-3xl text-[#102e50] font-heading font-bold tracking-tight">
            Dashboard Tim — {managerName}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Pusat persetujuan cuti tim, pantauan kehadiran harian bawahan, dan administrasi mandiri.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/cuti/persetujuan"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#102e50] text-white hover:bg-[#0c233d] text-xs sm:text-sm font-semibold transition-all shadow-xs cursor-pointer active:scale-[0.98]"
          >
            <span>Semua Persetujuan</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Action Feedback Alert */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2.5 animate-in fade-in duration-150 ${
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

      {/* 3 Team Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Stat 1: Total Anggota Tim */}
        <div className="bg-white rounded-xl border border-[#dee9fc] p-5 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Anggota Tim Aktif
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl sm:text-4xl font-extrabold text-[#102e50] font-heading leading-none">
                {data.totalTeamMembers}
              </span>
              <span className="text-xs font-semibold text-slate-500">Pegawai</span>
            </div>
            <span className="text-[11px] text-slate-400 mt-1">Bawahan langsung Anda</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#eff4ff] text-[#102e50] flex items-center justify-center">
            <Users className="w-5 h-5 text-[#102e50]" />
          </div>
        </div>

        {/* Stat 2: Hadir Hari Ini */}
        <div className="bg-white rounded-xl border border-[#dee9fc] p-5 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Tim Hadir Hari Ini
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl sm:text-4xl font-extrabold text-emerald-700 font-heading leading-none">
                {data.teamPresentCount}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                / {data.totalTeamMembers} Orang
              </span>
            </div>
            <span className="text-[11px] text-emerald-600 font-medium mt-1">
              {data.totalTeamMembers > 0
                ? `${Math.round((data.teamPresentCount / data.totalTeamMembers) * 100)}% kehadiran tim`
                : "Tidak ada bawahan"}
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Stat 3: Persetujuan Cuti Menunggu */}
        <div className="bg-white rounded-xl border border-[#dee9fc] p-5 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Antrean Persetujuan Cuti
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span
                className={`text-3xl sm:text-4xl font-extrabold font-heading leading-none ${
                  data.pendingLeavesCount > 0 ? "text-amber-600" : "text-[#102e50]"
                }`}
              >
                {data.pendingLeavesCount}
              </span>
              <span className="text-xs font-semibold text-slate-500">Pengajuan</span>
            </div>
            <span
              className={`text-[11px] font-medium mt-1 ${
                data.pendingLeavesCount > 0 ? "text-amber-600" : "text-slate-400"
              }`}
            >
              {data.pendingLeavesCount > 0 ? "Perlu respon persetujuan" : "Semua bersih"}
            </span>
          </div>
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center ${
              data.pendingLeavesCount > 0
                ? "bg-amber-50 text-amber-600"
                : "bg-slate-50 text-slate-400"
            }`}
          >
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Actionable Grid: Pending Approvals (Left 2 cols) & Weekly Team Calendar (Right 1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* WIDGET UTAMA: Actionable Approval List (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#dee9fc] shadow-xs flex flex-col overflow-hidden">
          <div className="p-5 border-b border-[#dee9fc] flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#102e50] font-heading">
                  Permohonan Cuti Tim Menunggu Persetujuan
                </h2>
                {data.pendingLeavesCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                    {data.pendingLeavesCount} Baru
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Setujui atau tolak permohonan cuti bawahan langsung Anda secara instan dari sini
              </p>
            </div>
            <Link
              href="/cuti/persetujuan"
              className="text-xs font-semibold text-[#102e50] hover:text-[#f2af3e] transition-colors inline-flex items-center gap-1"
            >
              <span>Semua Log</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 overflow-x-auto">
            {data.pendingLeaveRequests.length === 0 ? (
              <div className="p-10 text-center flex flex-col items-center justify-center gap-2 text-slate-400">
                <CheckCircle2 className="w-10 h-10 text-emerald-500/80 mb-1" />
                <p className="text-sm font-semibold text-slate-700">Semua Permohonan Selesai</p>
                <p className="text-xs text-slate-400">
                  Tidak ada permohonan cuti dari tim yang menunggu persetujuan Anda saat ini.
                </p>
              </div>
            ) : (
              data.pendingLeaveRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#f8f9ff] transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[#102e50] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs mt-0.5">
                      {req.employeeName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-[#102e50]">
                          {req.employeeName}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                          {req.employeeNo}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          ({req.positionTitle})
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-600 mt-1 flex-wrap">
                        <span className="font-semibold text-blue-900 bg-blue-50 px-2 py-0.5 rounded text-[11px]">
                          {req.leaveTypeName}
                        </span>
                        <span>•</span>
                        <span className="font-bold text-slate-800">
                          {req.days} Hari Kerja
                        </span>
                        <span>•</span>
                        <span className="text-slate-500">
                          {formatDate(req.startDate)} s/d {formatDate(req.endDate)}
                        </span>
                      </div>

                      {req.reason && (
                        <p className="text-xs text-slate-500 italic mt-1.5 bg-slate-50 p-2 rounded border border-slate-200/60 max-w-xl">
                          &ldquo;{req.reason}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons: Setujui (Fast) & Tolak (Modal Reason) */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() =>
                        setRejectingItem({
                          id: req.id,
                          employeeName: req.employeeName,
                          leaveTypeName: req.leaveTypeName,
                          days: req.days,
                        })
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-[#a8281c] hover:bg-red-50 text-xs font-bold transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Tolak</span>
                    </button>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleApprove(req.id, req.employeeName)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#102e50] text-white hover:bg-[#0c233d] text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-[0.98] disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5 text-[#feba48]" />
                      <span>Setujui</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Kalender Tim Minggu Ini (1 col) */}
        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-xl border border-[#dee9fc] shadow-xs p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#dee9fc]">
              <div className="flex items-center gap-2 text-[#102e50]">
                <CalendarDays className="w-4 h-4 text-[#f2af3e]" />
                <h3 className="text-sm font-bold font-heading">Jadwal Tim Minggu Ini</h3>
              </div>
              <span className="text-[11px] text-slate-400">Sen - Jum</span>
            </div>

            {/* 5-Day Strip */}
            <div className="grid grid-cols-5 gap-1.5 text-center">
              {weekDays.map((wd) => (
                <div
                  key={wd.dateStr}
                  className={`p-2 rounded-lg flex flex-col items-center gap-0.5 border ${
                    wd.isToday
                      ? "bg-[#102e50] text-white border-[#102e50] shadow-xs"
                      : "bg-slate-50 border-slate-200/60 text-slate-700"
                  }`}
                >
                  <span className={`text-[10px] uppercase font-semibold ${wd.isToday ? "text-[#ffddb0]" : "text-slate-400"}`}>
                    {wd.dayName}
                  </span>
                  <span className="text-sm font-bold font-heading">{wd.dayNumber}</span>
                </div>
              ))}
            </div>

            {/* Subordinate leave records this week */}
            <div className="flex flex-col gap-2 pt-2">
              <span className="text-xs font-bold text-slate-700">
                Anggota Tim Cuti ({data.weekTeamLeaves.length})
              </span>

              {data.weekTeamLeaves.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-2">
                  Tidak ada anggota tim yang sedang cuti pada pekan ini.
                </p>
              ) : (
                <div className="flex flex-col divide-y divide-slate-100 text-xs">
                  {data.weekTeamLeaves.map((wl) => (
                    <div key={wl.id} className="py-2 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-800">{wl.employeeName}</span>
                        <span className="text-[11px] text-slate-400">{wl.leaveTypeName}</span>
                      </div>
                      <span className="text-[11px] text-blue-800 font-medium">
                        {formatDate(wl.startDate)} - {formatDate(wl.endDate)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 text-center">
              <Link
                href="/cuti/kalender"
                className="text-xs font-semibold text-[#102e50] hover:underline inline-flex items-center gap-1"
              >
                <span>Buka Kalender Cuti Lengkap</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Bagian Bawah: Presensi & Kuota Cuti Pribadi Milik Manajer Sendiri */}
      <div className="mt-4 pt-6 border-t border-[#dee9fc] flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#f2af3e]" />
          <h2 className="text-sm font-bold text-[#102e50] font-heading uppercase tracking-wider">
            Presensi & Hak Cuti Pribadi Manajer
          </h2>
        </div>

        <TodayAttendanceCard
          todayAttendance={data.managerOwn.todayAttendance}
          employeeName={managerName}
        />

        <LeaveBalanceCards balances={data.managerOwn.leaveBalances} />
      </div>

      {/* Rejection Modal with Mandatory Reason Dialog */}
      {rejectingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full border border-[#dee9fc] shadow-2xl p-6 flex flex-col gap-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-red-50 text-red-700 flex items-center justify-center shrink-0">
                <X className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#102e50] font-heading">
                  Tolak Permohonan Cuti
                </h3>
                <p className="text-xs text-slate-500">
                  Pemohon: <strong className="text-slate-800">{rejectingItem.employeeName}</strong>
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex justify-between">
              <span className="text-slate-600">{rejectingItem.leaveTypeName}</span>
              <span className="font-bold text-[#102e50]">{rejectingItem.days} Hari Kerja</span>
            </div>

            {rejectError && (
              <div className="p-3 bg-red-50 text-red-900 border border-red-200 rounded-lg text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{rejectError}</span>
              </div>
            )}

            <form onSubmit={handleConfirmReject} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Alasan Penolakan (Wajib Diisi untuk Pemohon) *
                </label>
                <textarea
                  required
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Contoh: Kebutuhan deadline laporan riset pekan ini belum selesai..."
                  className="w-full text-xs p-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#102e50]/20 focus:border-[#102e50]"
                />
                <span className="text-[11px] text-slate-400">Minimal 3 karakter</span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setRejectingItem(null);
                    setRejectReason("");
                    setRejectError(null);
                  }}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 text-xs font-bold text-white bg-red-700 hover:bg-red-800 rounded-lg transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  Konfirmasi Tolak Cuti
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
