"use client";

import React, { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import {
  Users,
  UserCheck,
  Clock,
  Check,
  X,
  AlertCircle,
  CheckCircle2,
  CalendarDays,
  ClipboardCheck,
  Timer,
  ShieldCheck,
} from "lucide-react";
import { ManagerDashboardData } from "@/server/queries/dashboard/manager-dashboard";
import { TodayAttendanceCard } from "@/components/absensi/today-attendance-card";
import { LeaveBalanceCards } from "@/components/cuti/leave-balance-cards";
import {
  approveLeaveRequestAction,
  rejectLeaveRequestAction,
} from "@/server/actions/leave.actions";
import { toDateString } from "@pspk/shared";
import {
  DashboardHeader,
  Panel,
  Stat,
  StatStrip,
  Pill,
  btnPrimary,
  btnSecondary,
} from "./dashboard-ui";

interface ManagerDashboardProps {
  data: ManagerDashboardData;
  managerName: string;
}

/** Query timesheet dibatasi 5 baris → angka 5 berarti "5 atau lebih" */
const QUEUE_CAP = 5;

export function ManagerDashboard({ data, managerName }: ManagerDashboardProps) {
  const [rejectingItem, setRejectingItem] = useState<{
    id: string;
    employeeName: string;
    leaveTypeName: string;
    days: number;
  } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState<string | null>(null);

  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();

  // Tutup dialog dengan tombol Escape
  useEffect(() => {
    if (!rejectingItem) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setRejectingItem(null);
        setRejectReason("");
        setRejectError(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [rejectingItem]);

  const formatDate = (d: Date) => {
    const dateObj = typeof d === "string" ? new Date(d) : d;
    return dateObj.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
    });
  };

  const closeReject = () => {
    setRejectingItem(null);
    setRejectReason("");
    setRejectError(null);
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
        setFeedback({
          type: "success",
          text: `Permohonan cuti ${rejectingItem.employeeName} telah ditolak.`,
        });
        setRejectingItem(null);
        setRejectReason("");
      } else {
        setRejectError(res.message);
      }
    });
  };

  const todayDateStr = toDateString(new Date());
  // 5 hari kerja minggu ini (Senin–Jumat), lengkap dengan jumlah anggota tim yang cuti
  const weekDays = [0, 1, 2, 3, 4].map((offset) => {
    const d = new Date(data.startOfWeek);
    d.setUTCDate(d.getUTCDate() + offset);
    const dateStr = toDateString(d);
    const onLeave = data.weekTeamLeaves.filter(
      (wl) =>
        toDateString(new Date(wl.startDate)) <= dateStr &&
        toDateString(new Date(wl.endDate)) >= dateStr,
    ).length;
    return {
      date: d,
      dateStr,
      dayName: d.toLocaleDateString("id-ID", { weekday: "short", timeZone: "UTC" }),
      dayNumber: d.getUTCDate(),
      isToday: dateStr === todayDateStr,
      onLeave,
    };
  });

  const timesheetCount =
    data.pendingTimesheetsCount >= QUEUE_CAP
      ? `${QUEUE_CAP}+`
      : String(data.pendingTimesheetsCount);

  const presencePct =
    data.totalTeamMembers > 0
      ? Math.round((data.teamPresentCount / data.totalTeamMembers) * 100)
      : 0;

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 pb-12 animate-in fade-in duration-200">
      <DashboardHeader
        eyebrow="Portal Manajer"
        title="Dashboard Tim"
        description={`Halo, ${managerName}. Tinjau persetujuan dan kehadiran tim Anda.`}
        actions={
          <>
            <a href="#presensi-saya" className={btnSecondary}>
              <span>Presensi saya</span>
            </a>
            <Link href="/cuti/persetujuan" className={btnPrimary}>
              <span>Semua persetujuan</span>
            </Link>
          </>
        }
      />

      {feedback && (
        <div
          role={feedback.type === "error" ? "alert" : "status"}
          className={`flex items-center gap-2.5 rounded-xl border p-3.5 text-sm font-semibold animate-in fade-in duration-150 ${
            feedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-red-200 bg-red-50 text-red-900"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      <StatStrip cols={4}>
        <Stat
          label="Anggota tim aktif"
          icon={Users}
          value={data.totalTeamMembers}
          unit="pegawai"
          hint="Bawahan langsung Anda"
        />
        <Stat
          label="Tim hadir hari ini"
          icon={UserCheck}
          tone="green"
          value={data.teamPresentCount}
          unit={`/ ${data.totalTeamMembers} orang`}
          hint={data.totalTeamMembers > 0 ? `${presencePct}% kehadiran tim` : "Tidak ada bawahan"}
        />
        <Stat
          label="Antrean cuti"
          icon={Clock}
          tone={data.pendingLeavesCount > 0 ? "amber" : "navy"}
          value={data.pendingLeavesCount}
          unit="pengajuan"
          hint={data.pendingLeavesCount > 0 ? "Perlu respon Anda" : "Semua bersih"}
          href="/cuti/persetujuan"
        />
        <Stat
          label="Antrean timesheet"
          icon={Timer}
          tone={data.pendingTimesheetsCount > 0 ? "amber" : "navy"}
          value={timesheetCount}
          unit="freelance"
          hint={data.pendingTimesheetsCount > 0 ? "Perlu ACC Anda" : "Semua bersih"}
          href="/timesheet/persetujuan"
        />
      </StatStrip>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Kolom utama: yang perlu diputuskan */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Panel
            title="Persetujuan cuti tim"
            icon={ClipboardCheck}
            badge={
              data.pendingLeavesCount > 0 ? (
                <Pill tone="amber">{data.pendingLeavesCount} baru</Pill>
              ) : undefined
            }
            action={{ href: "/cuti/persetujuan", label: "Semua log" }}
            padded={false}
          >
            {data.pendingLeaveRequests.length === 0 ? (
              <div className="flex flex-col items-center gap-1.5 px-6 py-10 text-center">
                <CheckCircle2 className="mb-1 h-9 w-9 text-emerald-500/80" aria-hidden="true" />
                <p className="text-sm font-semibold text-slate-700">Semua permohonan selesai</p>
                <p className="text-xs text-slate-500">
                  Tidak ada permohonan cuti tim yang menunggu persetujuan Anda.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {data.pendingLeaveRequests.map((req) => (
                  <li
                    key={req.id}
                    className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-[#f8f9ff] sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#102e50] text-xs font-bold text-white">
                        {req.employeeName.charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="text-sm font-bold text-[#102e50]">
                            {req.employeeName}
                          </span>
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">
                            {req.employeeNo}
                          </span>
                          <span className="text-[11px] text-slate-400">{req.positionTitle}</span>
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-600">
                          <Pill tone="blue">{req.leaveTypeName}</Pill>
                          <span className="font-bold text-slate-800">{req.days} hari kerja</span>
                          <span className="text-slate-300" aria-hidden="true">
                            •
                          </span>
                          <span className="text-slate-500">
                            {formatDate(req.startDate)} s/d {formatDate(req.endDate)}
                          </span>
                        </div>
                        {req.reason && (
                          <p className="mt-2 max-w-xl rounded border border-slate-200/70 bg-slate-50 p-2 text-xs italic text-slate-500">
                            &ldquo;{req.reason}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2 sm:self-center">
                      <button
                        type="button"
                        disabled={isPending}
                        aria-label={`Tolak cuti ${req.employeeName}`}
                        onClick={() =>
                          setRejectingItem({
                            id: req.id,
                            employeeName: req.employeeName,
                            leaveTypeName: req.leaveTypeName,
                            days: req.days,
                          })
                        }
                        className="inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-red-200 px-3.5 py-2 text-xs font-bold text-[#a8281c] transition-all hover:bg-red-50 active:scale-[0.98] disabled:opacity-50 sm:flex-none"
                      >
                        <X className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Tolak</span>
                      </button>
                      <button
                        type="button"
                        disabled={isPending}
                        aria-label={`Setujui cuti ${req.employeeName}`}
                        onClick={() => handleApprove(req.id, req.employeeName)}
                        className="inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-[#102e50] px-3.5 py-2 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#0c233d] active:scale-[0.98] disabled:opacity-50 sm:flex-none"
                      >
                        <Check className="h-3.5 w-3.5 text-[#feba48]" aria-hidden="true" />
                        <span>Setujui</span>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          {data.pendingTimesheetsCount > 0 && (
            <Panel
              title="Timesheet freelance menunggu ACC"
              icon={Timer}
              badge={<Pill tone="amber">Menahan payroll</Pill>}
              action={{ href: "/timesheet/persetujuan", label: "Buka & beri ACC" }}
              padded={false}
            >
              <p className="border-b border-slate-100 bg-amber-50/60 px-5 py-3 text-xs leading-relaxed text-amber-900">
                Payroll periode berjalan tertahan sampai seluruh atasan memberi persetujuan.
              </p>
              <ul className="divide-y divide-slate-100">
                {data.pendingTimesheetReviews.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-3 px-5 py-3 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-800">{item.employeeName}</p>
                      <p className="truncate text-xs text-slate-500">{item.title}</p>
                    </div>
                    <span className="shrink-0 text-xs font-bold tabular-nums text-slate-700">
                      {item.totalHours} jam
                    </span>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>

        {/* Kolom samping: jadwal tim */}
        <div className="flex flex-col gap-6">
          <Panel
            title="Jadwal tim pekan ini"
            icon={CalendarDays}
            action={{ href: "/kalender", label: "Kalender" }}
          >
            <div className="grid grid-cols-5 gap-1.5 text-center">
              {weekDays.map((wd) => (
                <div
                  key={wd.dateStr}
                  className={`flex flex-col items-center gap-0.5 rounded-lg border p-2 ${
                    wd.isToday
                      ? "border-[#102e50] bg-[#102e50] text-white"
                      : "border-slate-200/70 bg-slate-50 text-slate-700"
                  }`}
                  aria-current={wd.isToday ? "date" : undefined}
                >
                  <span
                    className={`text-[10px] font-semibold uppercase ${
                      wd.isToday ? "text-[#ffddb0]" : "text-slate-400"
                    }`}
                  >
                    {wd.dayName}
                  </span>
                  <span className="font-heading text-sm font-bold">{wd.dayNumber}</span>
                  <span
                    className={`text-[10px] font-semibold ${
                      wd.onLeave > 0
                        ? wd.isToday
                          ? "text-[#feba48]"
                          : "text-[#0874aa]"
                        : wd.isToday
                          ? "text-white/40"
                          : "text-slate-300"
                    }`}
                  >
                    {wd.onLeave > 0 ? `${wd.onLeave} cuti` : "—"}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 border-t border-slate-100 pt-3">
              <p className="text-xs font-bold text-slate-700">
                Anggota tim cuti ({data.weekTeamLeaves.length})
              </p>
              {data.weekTeamLeaves.length === 0 ? (
                <p className="py-3 text-xs italic text-slate-400">
                  Tidak ada anggota tim yang cuti pekan ini.
                </p>
              ) : (
                <ul className="mt-1 divide-y divide-slate-100 text-xs">
                  {data.weekTeamLeaves.map((wl) => (
                    <li key={wl.id} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-800">{wl.employeeName}</p>
                        <p className="text-[11px] text-slate-400">{wl.leaveTypeName}</p>
                      </div>
                      <span className="shrink-0 text-[11px] font-medium text-[#0874aa]">
                        {formatDate(wl.startDate)} – {formatDate(wl.endDate)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Panel>
        </div>
      </div>

      {/* Bagian pribadi manajer */}
      <section
        id="presensi-saya"
        className="flex scroll-mt-20 flex-col gap-4 border-t border-[#dee9fc] pt-6"
      >
        <h2 className="flex items-center gap-2 font-heading text-base font-bold text-[#102e50]">
          <ShieldCheck className="h-4 w-4 text-[#f2af3e]" aria-hidden="true" />
          Presensi & hak cuti pribadi
        </h2>
        <TodayAttendanceCard
          todayAttendance={data.managerOwn.todayAttendance}
          employeeName={managerName}
          workSchedule={data.workSchedule}
        />
        <LeaveBalanceCards balances={data.managerOwn.leaveBalances} />
      </section>

      {/* Dialog tolak cuti */}
      {rejectingItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={closeReject}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="reject-title"
            onClick={(e) => e.stopPropagation()}
            className="flex w-full max-w-md flex-col gap-4 rounded-2xl border border-[#dee9fc] bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-700">
                <X className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h3 id="reject-title" className="font-heading text-base font-bold text-[#102e50]">
                  Tolak permohonan cuti
                </h3>
                <p className="text-xs text-slate-500">
                  Pemohon: <strong className="text-slate-800">{rejectingItem.employeeName}</strong>
                </p>
              </div>
            </div>

            <div className="flex justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
              <span className="text-slate-600">{rejectingItem.leaveTypeName}</span>
              <span className="font-bold text-[#102e50]">{rejectingItem.days} hari kerja</span>
            </div>

            {rejectError && (
              <div
                role="alert"
                className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-900"
              >
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />
                <span>{rejectError}</span>
              </div>
            )}

            <form onSubmit={handleConfirmReject} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="reject-reason" className="text-xs font-semibold text-slate-700">
                  Alasan penolakan (wajib, akan dilihat pemohon) *
                </label>
                <textarea
                  id="reject-reason"
                  required
                  autoFocus
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Contoh: Deadline laporan riset pekan ini belum selesai…"
                  className="w-full rounded-lg border border-slate-200 p-3 text-sm focus:border-[#102e50] focus:outline-none focus:ring-2 focus:ring-[#102e50]/20"
                />
                <span className="text-[11px] text-slate-400">Minimal 3 karakter</span>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={closeReject}
                  className="cursor-pointer rounded-lg px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="cursor-pointer rounded-lg bg-red-700 px-4 py-2 text-xs font-bold text-white shadow-xs transition-all hover:bg-red-800 disabled:opacity-50"
                >
                  Konfirmasi tolak
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}