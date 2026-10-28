"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Plus,
  CalendarCheck,
  Clock,
  Receipt,
  FileText,
  BookOpen,
  UserCheck,
  Calendar,
  Download,
  ExternalLink,
  Info,
} from "lucide-react";
import { StaffDashboardData } from "@/server/queries/dashboard/staff-dashboard";
import { formatRupiah } from "@pspk/shared";
import { TodayAttendanceCard } from "@/components/absensi/today-attendance-card";
import { LeaveBalanceCards } from "@/components/cuti/leave-balance-cards";
import { SupervisorProfileModal } from "./supervisor-profile-modal";
import {
  DashboardHeader,
  Panel,
  Stat,
  StatStrip,
  Pill,
  EmptyState,
  btnPrimary,
  type Tone,
} from "./dashboard-ui";

interface StaffDashboardProps {
  data: StaffDashboardData;
  employeeName: string;
}

const LEAVE_STATUS: Record<string, { label: string; tone: Tone }> = {
  APPROVED: { label: "Disetujui", tone: "green" },
  PENDING: { label: "Menunggu", tone: "amber" },
  REJECTED: { label: "Ditolak", tone: "red" },
  CANCELLED: { label: "Dibatalkan", tone: "slate" },
};

function categoryClass(color?: string | null) {
  switch (color) {
    case "emerald":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "amber":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "purple":
      return "bg-purple-50 text-purple-700 border-purple-200";
    default:
      return "bg-blue-50 text-[#102e50] border-blue-200";
  }
}

export function StaffDashboard({ data, employeeName }: StaffDashboardProps) {
  const [showSupervisorModal, setShowSupervisorModal] = useState(false);

  const formatDate = (d: Date) => {
    const dateObj = typeof d === "string" ? new Date(d) : d;
    return dateObj.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const annualLeave = data.leaveBalances.find((b) =>
    b.leaveType.name.toLowerCase().includes("tahunan"),
  );

  const supervisorInitials = data.manager
    ? data.manager.fullName
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "";

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 pb-12 animate-in fade-in duration-200">
      <DashboardHeader
        eyebrow="Portal Karyawan"
        title={`Halo, ${employeeName}`}
        description="Presensi hari ini, kuota cuti, dan informasi kepegawaian Anda."
        actions={
          <Link href="/cuti/ajukan" className={btnPrimary}>
            <Plus className="h-4 w-4 text-[#ffddb0]" aria-hidden="true" />
            <span>Ajukan Cuti</span>
          </Link>
        }
      />

      {/* 1. Aksi harian: presensi */}
      <TodayAttendanceCard
        todayAttendance={data.todayAttendance}
        employeeName={employeeName}
        workSchedule={data.workSchedule}
      />

      {/* 2. Ringkasan pribadi */}
      <StatStrip cols={3}>
        <Stat
          label="Sisa cuti tahunan"
          icon={CalendarCheck}
          value={annualLeave ? annualLeave.remainingDays : "—"}
          unit={annualLeave ? `/ ${annualLeave.quotaDays} hari` : undefined}
          hint={
            annualLeave
              ? `Terpakai ${annualLeave.usedDaysNumber} hari`
              : "Belum ada kuota cuti tahunan"
          }
          href="/cuti"
        />
        <Stat
          label="Cuti menunggu persetujuan"
          icon={Clock}
          tone={data.pendingLeavesCount > 0 ? "amber" : "navy"}
          value={data.pendingLeavesCount}
          unit="permohonan"
          hint={data.pendingLeavesCount > 0 ? "Menunggu respon atasan" : "Tidak ada antrean"}
          href="/cuti"
        />
        {data.latestPayslip ? (
          <Stat
            label="Slip gaji terbaru"
            icon={Receipt}
            size="md"
            value={formatRupiah(data.latestPayslip.netAmount)}
            hint={
              <>
                Periode {data.latestPayslip.month}/{data.latestPayslip.year}
                {data.latestPayslip.wageType === "HOURLY" && data.latestPayslip.totalHours ? (
                  <span className="ml-1.5 font-semibold text-amber-800">
                    • {data.latestPayslip.totalHours} jam
                  </span>
                ) : null}
              </>
            }
            href="/slip-gaji"
          />
        ) : (
          <Stat
            label="Slip gaji terbaru"
            icon={Receipt}
            tone="slate"
            size="md"
            value="Belum ada"
            hint="Menunggu publikasi resmi"
            href="/slip-gaji"
          />
        )}
      </StatStrip>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Kolom utama */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          <section aria-labelledby="saldo-cuti" className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <h2
                id="saldo-cuti"
                className="font-heading text-base font-bold text-[#102e50]"
              >
                Hak cuti tahun berjalan
              </h2>
              <Link href="/cuti" className="text-xs font-semibold text-[#102e50] hover:underline">
                Semua jenis cuti
              </Link>
            </div>
            <LeaveBalanceCards balances={data.leaveBalances} />
            <p className="flex items-center gap-1.5 text-xs text-slate-500">
              <Info className="h-3.5 w-3.5 shrink-0 text-[#f2af3e]" aria-hidden="true" />
              <span>
                Pengajuan cuti minimal <strong className="text-slate-700">3 hari kerja</strong>{" "}
                sebelum jadwal pelaksanaan.
              </span>
            </p>
          </section>

          <Panel
            title="Pengajuan cuti terakhir"
            icon={Calendar}
            action={{ href: "/cuti", label: "Semua riwayat" }}
            padded={false}
          >
            {data.recentLeaves.length === 0 ? (
              <EmptyState icon={FileText} title="Belum ada pengajuan cuti">
                <Link href="/cuti/ajukan" className="font-bold text-[#102e50] hover:underline">
                  + Ajukan cuti sekarang
                </Link>
              </EmptyState>
            ) : (
              <ul className="divide-y divide-slate-100">
                {data.recentLeaves.map((leave) => {
                  const status = LEAVE_STATUS[leave.status] ?? {
                    label: leave.status,
                    tone: "slate" as Tone,
                  };
                  return (
                    <li
                      key={leave.id}
                      className="flex items-center justify-between gap-4 px-5 py-3.5 transition-colors hover:bg-[#f8f9ff]"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                          <Calendar className="h-4 w-4" aria-hidden="true" />
                        </span>
                        <div className="min-w-0">
                          <p className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                            <span className="truncate">{leave.leaveType.name}</span>
                            <span className="shrink-0 rounded border border-blue-100 bg-blue-50 px-1.5 py-0.5 text-[11px] font-bold text-[#102e50]">
                              {leave.days} hari
                            </span>
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {formatDate(leave.startDate)} s/d {formatDate(leave.endDate)}
                          </p>
                        </div>
                      </div>
                      <Pill tone={status.tone}>{status.label}</Pill>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </div>

        {/* Kolom samping */}
        <div className="flex flex-col gap-6">
          {data.manager && (
            <Panel title="Atasan langsung" icon={UserCheck}>
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#102e50] font-heading text-sm font-bold text-[#ffddb0]">
                  {supervisorInitials}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-[#102e50]">
                    {data.manager.fullName}
                  </p>
                  {data.manager.position && (
                    <p className="truncate text-xs text-slate-500">{data.manager.position}</p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSupervisorModal(true)}
                className="mt-4 w-full cursor-pointer rounded-lg border border-[#dee9fc] bg-white px-3 py-2 text-xs font-semibold text-[#102e50] transition-colors hover:bg-[#eff4ff]"
              >
                Lihat profil & kontak
              </button>
            </Panel>
          )}

          <Panel
            title="Dokumen & panduan"
            icon={BookOpen}
            badge={
              data.publishedDocuments && data.publishedDocuments.length > 0 ? (
                <Pill tone="navy">{data.publishedDocuments.length}</Pill>
              ) : undefined
            }
            padded={false}
          >
            {!data.publishedDocuments || data.publishedDocuments.length === 0 ? (
              <EmptyState icon={FileText} title="Belum ada dokumen aktif">
                Dokumen resmi yang diterbitkan lewat System Management akan tampil di sini.
              </EmptyState>
            ) : (
              <ul className="divide-y divide-slate-100">
                {data.publishedDocuments.map((doc) => {
                  const latestVer = doc.currentVersion;
                  const previewHref = latestVer
                    ? `/api/documents/${latestVer.fileKey}?filename=${encodeURIComponent(latestVer.fileName)}`
                    : null;
                  const downloadHref = latestVer
                    ? `/api/documents/${latestVer.fileKey}?download=true&filename=${encodeURIComponent(latestVer.fileName)}`
                    : null;

                  return (
                    <li key={doc.id} className="flex items-center justify-between gap-2 px-5 py-3">
                      <div className="min-w-0">
                        {previewHref ? (
                          <a
                            href={previewHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="line-clamp-1 text-sm font-semibold text-slate-800 hover:text-[#102e50] hover:underline"
                            title={`Buka ${doc.title}`}
                          >
                            {doc.title}
                          </a>
                        ) : (
                          <span className="line-clamp-1 text-sm font-semibold text-slate-700">
                            {doc.title}
                          </span>
                        )}
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          <span className="rounded border border-slate-200 bg-slate-100 px-1.5 py-px font-mono text-[10px] font-bold text-slate-600">
                            {doc.code}
                          </span>
                          <span
                            className={`rounded border px-1.5 py-px text-[10px] font-medium ${categoryClass(doc.categoryColor)}`}
                          >
                            {doc.category}
                          </span>
                          {latestVer && (
                            <span className="text-[10px] text-slate-400">
                              v{latestVer.versionNo}.0
                            </span>
                          )}
                        </div>
                      </div>

                      {latestVer && (
                        <div className="flex shrink-0 items-center gap-1">
                          {previewHref && (
                            <a
                              href={previewHref}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded-lg bg-[#eff4ff] px-2.5 py-1.5 text-[11px] font-bold text-[#102e50] transition-colors hover:bg-[#dee9fc]"
                              title={`Buka berkas ${latestVer.fileName}`}
                            >
                              <span>Buka</span>
                              <ExternalLink className="h-3 w-3" aria-hidden="true" />
                            </a>
                          )}
                          {downloadHref && (
                            <a
                              href={downloadHref}
                              download={latestVer.fileName}
                              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                              title={`Unduh ${latestVer.fileName}`}
                              aria-label={`Unduh ${latestVer.fileName}`}
                            >
                              <Download className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </div>
      </div>

      {data.manager && (
        <SupervisorProfileModal
          isOpen={showSupervisorModal}
          onClose={() => setShowSupervisorModal(false)}
          supervisor={data.manager}
        />
      )}
    </div>
  );
}