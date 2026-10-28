"use client";

import React from "react";
import Link from "next/link";
import {
  Users,
  Upload,
  UserPlus,
  UserCheck,
  Clock,
  AlertTriangle,
  ShieldCheck,
  CalendarDays,
  ExternalLink,
  ShieldAlert,
  BarChart3,
  Briefcase,
} from "lucide-react";
import { HrDashboardData } from "@/server/queries/dashboard/hr-dashboard";
import type { StaffDashboardData } from "@/server/queries/dashboard/staff-dashboard";
import { TodayAttendanceCard } from "@/components/absensi/today-attendance-card";
import {
  DashboardHeader,
  Panel,
  Stat,
  StatStrip,
  Pill,
  btnPrimary,
  btnSecondary,
} from "./dashboard-ui";

interface HrDashboardProps {
  data: HrDashboardData;
  isSuperAdmin?: boolean;
  /** Presensi pribadi HR. Diisi hanya jika akun tertaut ke data pegawai. */
  personalAttendance?: {
    todayAttendance: StaffDashboardData["todayAttendance"];
    workSchedule: StaffDashboardData["workSchedule"];
    employeeName: string;
  };
}

/** Query kontrak dibatasi 5 baris → angka 5 berarti "5 atau lebih" */
const QUEUE_CAP = 5;

const CHART = {
  present: "#102e50",
  late: "#f2af3e",
  leave: "#0874aa",
  absent: "#a8281c",
};

const CONTRACT_SEGMENTS = [
  { key: "PERMANENT", label: "Tetap (PKWTT)", color: "#102e50" },
  { key: "FIXED_TERM", label: "Kontrak (PKWT)", color: "#f2af3e" },
  { key: "PART_TIME_PROJECT", label: "Paruh waktu / proyek", color: "#0874aa" },
] as const;

export function HrDashboard({
  data,
  isSuperAdmin = false,
  personalAttendance,
}: HrDashboardProps) {
  const formatDate = (d: Date) => {
    const dateObj = typeof d === "string" ? new Date(d) : d;
    return dateObj.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Skala grafik tren 7 hari
  const maxDayCount = Math.max(
    ...data.trendDays.map((d) => d.present + d.late + d.leave + d.absent),
    data.totalActiveEmployees,
    1,
  );

  const totalContracts =
    data.contractStats.PERMANENT +
    data.contractStats.FIXED_TERM +
    data.contractStats.PART_TIME_PROJECT;

  const expiringLabel =
    data.expiringContractsCount >= QUEUE_CAP
      ? `${QUEUE_CAP}+`
      : String(data.expiringContractsCount);

  const actionCount = data.expiringContracts.length + data.pendingLeavesLong.length;

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 pb-12 animate-in fade-in duration-200">
      {isSuperAdmin && (
        <div className="flex flex-col items-start justify-between gap-3 rounded-xl border border-slate-700 bg-[#0c233d] p-4 text-white shadow-xs sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f2af3e] text-[#102e50]">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="flex flex-wrap items-center gap-2 text-xs font-bold">
                <span>Pusat Kendali Super Administrator</span>
                <span className="rounded bg-[#f2af3e] px-2 py-px text-[10px] font-bold text-[#102e50]">
                  Akses penuh
                </span>
              </p>
              <p className="mt-0.5 text-[11px] text-slate-300">
                Kelola hak akses RBAC, pengguna, inventaris aset, dan audit trail di System
                Management.
              </p>
            </div>
          </div>
          <a
            href={process.env.NEXT_PUBLIC_SYSMGMT_URL || "http://localhost:3002"}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/20"
          >
            <span>Buka System Management</span>
            <ExternalLink className="h-3.5 w-3.5 text-[#ffddb0]" aria-hidden="true" />
          </a>
        </div>
      )}

      <DashboardHeader
        eyebrow={`Portal HRIS · ${new Date().getFullYear()}`}
        title="Dashboard HR"
        description="Ringkasan kepegawaian, presensi, dan hal yang perlu ditindak hari ini."
        actions={
          <>
            <Link href="/karyawan/impor" className={btnSecondary}>
              <Upload className="h-4 w-4" aria-hidden="true" />
              <span>Impor Excel</span>
            </Link>
            <Link href="/karyawan/baru" className={btnPrimary}>
              <UserPlus className="h-4 w-4 text-[#ffddb0]" aria-hidden="true" />
              <span>Tambah pegawai</span>
            </Link>
          </>
        }
      />

      {/* Presensi pribadi HR (check-in / check-out harian) */}
      {personalAttendance && (
        <TodayAttendanceCard
          todayAttendance={personalAttendance.todayAttendance}
          employeeName={personalAttendance.employeeName}
          workSchedule={personalAttendance.workSchedule}
        />
      )}

      <StatStrip cols={4}>
        <Stat
          label="Pegawai aktif"
          icon={Users}
          value={data.totalActiveEmployees}
          unit="orang"
          hint="Seluruh organisasi · Direktori"
          href="/karyawan"
        />
        <Stat
          label="Hadir hari ini"
          icon={UserCheck}
          tone="green"
          value={data.presentTodayCount}
          unit={`/ ${data.totalActiveEmployees}`}
          hint={`${data.attendancePercentage}% presensi · Rekap`}
          href="/absensi/rekap"
        />
        <Stat
          label="Cuti menunggu"
          icon={Clock}
          tone={data.pendingLeavesCount > 0 ? "amber" : "navy"}
          value={data.pendingLeavesCount}
          unit="pengajuan"
          hint="Seluruh departemen · Evaluasi"
          href="/cuti/persetujuan"
        />
        <Stat
          label="Kontrak berakhir ≤ 30 hari"
          icon={AlertTriangle}
          tone={data.expiringContractsCount > 0 ? "red" : "navy"}
          value={expiringLabel}
          unit="kontrak"
          hint="Perlu tinjauan PKWT · Tinjau"
          href="/karyawan?expiring=true"
        />
      </StatStrip>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Kolom utama */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Perlu tindakan */}
          <Panel
            title="Perlu tindakan HR"
            icon={ShieldAlert}
            badge={actionCount > 0 ? <Pill tone="red">{actionCount} item</Pill> : undefined}
          >
            {actionCount === 0 ? (
              <p className="py-4 text-center text-sm italic text-slate-400">
                Tidak ada tindakan mendesak. Operasional berjalan normal.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <h3 className="mb-1 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
                    <span>Kontrak segera berakhir</span>
                    <Link
                      href="/karyawan?expiring=true"
                      className="normal-case tracking-normal text-[#102e50] hover:underline"
                    >
                      Kelola
                    </Link>
                  </h3>
                  {data.expiringContracts.length === 0 ? (
                    <p className="py-3 text-xs italic text-slate-400">Tidak ada.</p>
                  ) : (
                    <ul className="divide-y divide-slate-100">
                      {data.expiringContracts.map((c) => (
                        <li key={c.id} className="py-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate text-sm font-semibold text-slate-800">
                              {c.employeeName}
                            </span>
                            <Pill tone="red">Habis {formatDate(c.endDate)}</Pill>
                          </div>
                          <p className="mt-0.5 truncate text-[11px] text-slate-500">
                            {c.position} • {c.department}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <h3 className="mb-1 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
                    <span>Cuti menunggu &gt; 2 hari</span>
                    <Link
                      href="/cuti/persetujuan"
                      className="normal-case tracking-normal text-[#102e50] hover:underline"
                    >
                      Persetujuan
                    </Link>
                  </h3>
                  {data.pendingLeavesLong.length === 0 ? (
                    <p className="py-3 text-xs italic text-slate-400">Tidak ada.</p>
                  ) : (
                    <ul className="divide-y divide-slate-100">
                      {data.pendingLeavesLong.map((pl) => (
                        <li key={pl.id} className="py-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate text-sm font-semibold text-slate-800">
                              {pl.employeeName}
                            </span>
                            <Pill tone="amber">Tertunda</Pill>
                          </div>
                          <p className="mt-0.5 truncate text-[11px] text-slate-500">
                            {pl.leaveTypeName} • {pl.days} hari
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </Panel>

          {/* Tren presensi */}
          <Panel title="Tren presensi 7 hari terakhir" icon={BarChart3}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-[11px] text-slate-600">
              <ul className="flex flex-wrap items-center gap-x-4 gap-y-1">
                {[
                  { c: CHART.present, l: "Hadir / WFH" },
                  { c: CHART.late, l: "Terlambat" },
                  { c: CHART.leave, l: "Cuti" },
                  { c: CHART.absent, l: "Absen" },
                ].map((i) => (
                  <li key={i.l} className="flex items-center gap-1.5">
                    <span
                      className="h-2.5 w-2.5 rounded-sm"
                      style={{ backgroundColor: i.c }}
                      aria-hidden="true"
                    />
                    <span>{i.l}</span>
                  </li>
                ))}
              </ul>
              <span className="text-slate-400">Skala 0–{maxDayCount} orang</span>
            </div>

            <div
              className="flex h-52 items-end justify-between gap-2 sm:gap-3"
              role="img"
              aria-label="Grafik batang tren presensi tujuh hari terakhir"
            >
              {data.trendDays.map((day) => {
                const total = day.present + day.late + day.leave + day.absent;
                const pct = (n: number) => `${(n / maxDayCount) * 100}%`;
                const attended = day.present + day.late;

                return (
                  <div
                    key={day.dateStr}
                    className="flex h-full flex-1 flex-col items-center justify-end gap-1.5"
                  >
                    <span className="text-[11px] font-bold tabular-nums text-slate-600">
                      {attended > 0 ? attended : ""}
                    </span>
                    <div className="flex min-h-0 w-full max-w-[40px] flex-1 flex-col-reverse gap-px">
                      {total === 0 ? (
                        <div
                          className="h-0.5 w-full rounded bg-slate-200"
                          title="Tidak ada data"
                        />
                      ) : (
                        <>
                          {day.present > 0 && (
                            <div
                              className="w-full rounded-b-sm transition-opacity hover:opacity-85"
                              style={{ height: pct(day.present), backgroundColor: CHART.present }}
                              title={`Hadir: ${day.present} orang`}
                            />
                          )}
                          {day.late > 0 && (
                            <div
                              className="w-full transition-opacity hover:opacity-85"
                              style={{ height: pct(day.late), backgroundColor: CHART.late }}
                              title={`Terlambat: ${day.late} orang`}
                            />
                          )}
                          {day.leave > 0 && (
                            <div
                              className="w-full transition-opacity hover:opacity-85"
                              style={{ height: pct(day.leave), backgroundColor: CHART.leave }}
                              title={`Cuti: ${day.leave} orang`}
                            />
                          )}
                          {day.absent > 0 && (
                            <div
                              className="w-full rounded-t-sm transition-opacity hover:opacity-85"
                              style={{ height: pct(day.absent), backgroundColor: CHART.absent }}
                              title={`Absen: ${day.absent} orang`}
                            />
                          )}
                        </>
                      )}
                    </div>
                    <span className="w-full truncate text-center text-[11px] font-semibold text-slate-600">
                      {day.dayLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </Panel>
        </div>

        {/* Kolom samping */}
        <div className="flex flex-col gap-6">
          <Panel
            title="Sedang cuti hari ini"
            icon={CalendarDays}
            badge={<Pill tone="slate">{data.onLeaveTodayList.length}</Pill>}
            padded={false}
          >
            {data.onLeaveTodayList.length === 0 ? (
              <p className="px-5 py-8 text-center text-xs italic text-slate-400">
                Tidak ada pegawai yang tercatat cuti hari ini.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {data.onLeaveTodayList.map((ol) => (
                  <li key={ol.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-800">
                        {ol.employeeName}
                      </p>
                      <p className="truncate text-[11px] text-slate-400">{ol.department}</p>
                    </div>
                    <Pill tone="blue">{ol.leaveTypeName}</Pill>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel
            title="Komposisi kepegawaian"
            icon={Briefcase}
            badge={<Pill tone="slate">{totalContracts} kontrak aktif</Pill>}
          >
            {totalContracts === 0 ? (
              <p className="py-4 text-center text-xs italic text-slate-400">
                Belum ada kontrak aktif.
              </p>
            ) : (
              <>
                <div
                  className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100"
                  role="img"
                  aria-label="Komposisi tipe kontrak aktif"
                >
                  {CONTRACT_SEGMENTS.map((s) => {
                    const n = data.contractStats[s.key];
                    return n > 0 ? (
                      <div
                        key={s.key}
                        style={{ width: `${(n / totalContracts) * 100}%`, backgroundColor: s.color }}
                        title={`${s.label}: ${n}`}
                      />
                    ) : null;
                  })}
                </div>

                <ul className="mt-4 flex flex-col gap-3">
                  {CONTRACT_SEGMENTS.map((s) => {
                    const n = data.contractStats[s.key];
                    return (
                      <li key={s.key} className="flex items-center justify-between gap-3 text-sm">
                        <span className="flex items-center gap-2 text-slate-700">
                          <span
                            className="h-2.5 w-2.5 rounded-sm"
                            style={{ backgroundColor: s.color }}
                            aria-hidden="true"
                          />
                          {s.label}
                        </span>
                        <span className="tabular-nums">
                          <strong className="font-heading text-base text-[#102e50]">{n}</strong>
                          <span className="ml-1.5 text-xs text-slate-400">
                            {Math.round((n / totalContracts) * 100)}%
                          </span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}