"use client";

import React from "react";
import Link from "next/link";
import { SysmgmtDashboardStats } from "@/server/queries/dashboard.queries";
import { formatDateTime, formatRelativeTime } from "@pspk/shared";
import {
  Users,
  Layers,
  FileText,
  History,
  ShieldCheck,
  KeyRound,
  SlidersHorizontal,
  ExternalLink,
  Activity,
  Server,
  Lock,
  ArrowRight,
  AlertTriangle,
  Clock,
  Laptop,
} from "lucide-react";

interface DashboardViewProps {
  stats: SysmgmtDashboardStats;
  currentUser: {
    id: string;
    name: string;
    email: string;
    roleTitle: string;
    isSuperAdmin: boolean;
  };
}

export function DashboardView({ stats, currentUser }: DashboardViewProps) {
  // Helper warna badge aksi audit log
  const getActionBadgeStyle = (action: string) => {
    switch (action.toUpperCase()) {
      case "CREATE":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "UPDATE":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "DELETE":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "LOGIN":
      case "LOGOUT":
        return "bg-sky-50 text-sky-700 border-sky-200";
      case "VIEW_SENSITIVE":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "EXPORT":
        return "bg-blue-50 text-blue-700 border-blue-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header Sambutan Eksekutif & Quick Actions */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-[#102E50] text-[#F2AF3E] shadow-2xs">
                {currentUser.roleTitle}
              </span>
              <span className="text-xs text-slate-300">•</span>
              <span className="text-xs font-medium text-slate-500">Pusat Tata Kelola TI</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-serif text-[#102E50] tracking-tight">
              Pusat Kendali System Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Selamat datang kembali, <strong className="text-slate-800 font-semibold">{currentUser.name}</strong>.
              Pantau status keamanan identitas, inventarisasi aset institusi, lisensi perangkat lunak, serta buku besar audit sistem PSPK secara terpadu.
            </p>
          </div>

          {/* Indikator Status Operasional */}
          <div className="flex flex-wrap items-center gap-3 self-start lg:self-auto shrink-0">
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-xs font-semibold shadow-2xs">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Sistem Berjalan Normal</span>
            </div>
          </div>
        </div>

        {/* Bilah Aksi Cepat (Quick Action Pills) */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-wrap items-center gap-2.5">
          <span className="text-xs font-semibold text-slate-400 mr-1 uppercase tracking-wider">
            Aksi Cepat:
          </span>
          <Link
            href="/pengguna"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700 transition-colors"
          >
            <Users className="w-3.5 h-3.5 text-[#102E50]" />
            <span>Kelola Pengguna</span>
          </Link>
          <Link
            href="/pengguna?tab=roles"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700 transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
            <span>Matriks Hak Akses (RBAC)</span>
          </Link>
          <Link
            href="/lisensi"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700 transition-colors"
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-600" />
            <span>Lisensi Software</span>
          </Link>
          <Link
            href="/pengguna?tab=modules"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700 transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
            <span>Tata Kelola Modul</span>
          </Link>
          <Link
            href="/audit"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700 transition-colors"
          >
            <History className="w-3.5 h-3.5 text-purple-600" />
            <span>Buku Besar Audit Log</span>
          </Link>
        </div>
      </div>

      {/* 2. Empat Kartu Metrik Utama (4-Column Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Akun & Keamanan Pengguna */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Akses & Pengguna
              </span>
              <div className="w-8 h-8 rounded-lg bg-[#102E50]/10 text-[#102E50] flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-[#102E50] tracking-tight">
              {stats.userStats.totalUsers}
              <span className="text-xs font-medium text-slate-400 ml-1.5">akun</span>
            </div>
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Status Akun:</span>
                <span className="font-semibold text-emerald-600">
                  {stats.userStats.activeUsers} Aktif
                  {stats.userStats.inactiveUsers > 0 && (
                    <span className="text-rose-600 ml-1">({stats.userStats.inactiveUsers} Nonaktif)</span>
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Sesi Login Terbuka:</span>
                <span className="font-semibold text-amber-700 inline-flex items-center gap-1">
                  <Activity className="w-3 h-3 text-amber-600" />
                  {stats.userStats.activeSessions} Sesi
                </span>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100">
            <Link
              href="/pengguna"
              className="text-xs font-semibold text-[#102E50] hover:text-[#1a4473] inline-flex items-center gap-1 group"
            >
              <span>Direktori Pengguna</span>
              <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>

        {/* Card 2: Inventaris Aset Lembaga */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Inventaris Aset
              </span>
              <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-[#102E50] tracking-tight">
              {stats.assetStats.totalAssets}
              <span className="text-xs font-medium text-slate-400 ml-1.5">unit</span>
            </div>
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Dipinjamkan Staf:</span>
                <span className="font-semibold text-blue-600">
                  {stats.assetStats.assignedAssets} Unit
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Tersedia di Gudang:</span>
                <span className="font-semibold text-slate-700">
                  {stats.assetStats.inStockAssets} Unit
                </span>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100">
            <Link
              href="/aset"
              className="text-xs font-semibold text-teal-700 hover:text-teal-800 inline-flex items-center gap-1 group"
            >
              <span>Kelola Inventaris Aset</span>
              <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>

        {/* Card 3: Lisensi Software */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Lisensi Software
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                <Laptop className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-[#102E50] tracking-tight">
              {stats.licenseStats.totalLicenses}
              <span className="text-xs font-medium text-slate-400 ml-1.5">paket</span>
            </div>
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Utilisasi Kursi:</span>
                <span className="font-semibold text-amber-700">
                  {stats.licenseStats.usedSeats} / {stats.licenseStats.totalSeats} ({stats.licenseStats.utilizationPercent}%)
                </span>
              </div>
              {/* Progress Bar Kursi */}
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-amber-500 h-1.5 rounded-full transition-all"
                  style={{ width: `${Math.min(100, stats.licenseStats.utilizationPercent)}%` }}
                />
              </div>
              {stats.licenseStats.expiringSoonCount > 0 && (
                <div className="flex items-center gap-1 text-[11px] font-bold text-rose-600 mt-1">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  <span>{stats.licenseStats.expiringSoonCount} lisensi segera habis</span>
                </div>
              )}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100">
            <Link
              href="/lisensi"
              className="text-xs font-semibold text-amber-700 hover:text-amber-800 inline-flex items-center gap-1 group"
            >
              <span>Pantau Lisensi Software</span>
              <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>

        {/* Card 4: Dokumen & SOP */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Dokumen & SOP
              </span>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-[#102E50] tracking-tight">
              {stats.documentStats.totalDocuments}
              <span className="text-xs font-medium text-slate-400 ml-1.5">berkas</span>
            </div>
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Kebijakan Aktif:</span>
                <span className="font-semibold text-emerald-600">
                  {stats.documentStats.activeDocuments} Dokumen
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Draf & Arsip:</span>
                <span className="font-semibold text-slate-600">
                  {stats.documentStats.draftDocuments} Draf | {stats.documentStats.archivedDocuments} Arsip
                </span>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100">
            <Link
              href="/dokumen"
              className="text-xs font-semibold text-indigo-700 hover:text-indigo-800 inline-flex items-center gap-1 group"
            >
              <span>Repositori Dokumen</span>
              <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* 3. Baris Kedua: Feed Log Audit Terkini (Kiri) & Status Sistem (Kanan) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Kolom Kiri: Feed Log Audit Terkini (8 Kolom) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <History className="w-4 h-4 text-purple-600" />
                <span>Log Audit Sistem Terkini</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Rekaman transaksi mutasi data dan aktivitas keamanan dari portal HRIS dan System Management
              </p>
            </div>
            <Link
              href="/audit"
              className="text-xs font-semibold text-[#102E50] hover:text-[#1a4473] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
            >
              <span>Buku Besar Audit</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          {stats.recentAudits.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                <Clock className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-slate-600">Belum Ada Rekaman Audit</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Setiap mutasi akun, wewenang, dan aset akan dicatat secara otomatis di sini.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 font-semibold border-b border-slate-100">
                    <th className="pb-2.5 font-medium">WAKTU</th>
                    <th className="pb-2.5 font-medium">AKTOR</th>
                    <th className="pb-2.5 font-medium">PORTAL</th>
                    <th className="pb-2.5 font-medium">AKSI</th>
                    <th className="pb-2.5 font-medium">ENTITAS</th>
                    <th className="pb-2.5 font-medium text-right">ALAMAT IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stats.recentAudits.map((audit) => (
                    <tr key={audit.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 text-slate-500 whitespace-nowrap">
                        <span title={formatDateTime(audit.occurredAt)}>
                          {formatRelativeTime(audit.occurredAt)}
                        </span>
                      </td>
                      <td className="py-2.5 font-medium text-slate-800 max-w-[160px] truncate">
                        {audit.actorEmail}
                      </td>
                      <td className="py-2.5 whitespace-nowrap">
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                            audit.app === "hris"
                              ? "bg-[#102E50]/10 text-[#102E50]"
                              : "bg-blue-50 text-blue-700"
                          }`}
                        >
                          {audit.app}
                        </span>
                      </td>
                      <td className="py-2.5 whitespace-nowrap">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getActionBadgeStyle(
                            audit.action,
                          )}`}
                        >
                          {audit.action}
                        </span>
                      </td>
                      <td className="py-2.5 font-mono text-[11px] text-slate-600 max-w-[120px] truncate">
                        {audit.entityType}
                      </td>
                      <td className="py-2.5 text-right font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {audit.ip || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Kolom Kanan: Panel Status Layanan & Tata Kelola (4 Kolom) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card Status Layanan */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs">
            <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Server className="w-4 h-4 text-emerald-600" />
              <span>Status Infrastruktur & Layanan</span>
            </h2>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      stats.systemHealth.isDatabaseConnected
                        ? "bg-emerald-500"
                        : "bg-rose-500 animate-ping"
                    }`}
                  />
                  <span className="text-xs font-semibold text-slate-700">Database PostgreSQL</span>
                </div>
                <span className="text-[11px] font-bold text-emerald-700">
                  {stats.systemHealth.isDatabaseConnected ? "Terhubung (v17)" : "Terputus"}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-blue-600" />
                  <span className="text-xs font-semibold text-slate-700">Enkripsi Data</span>
                </div>
                <span className="text-[11px] font-bold text-slate-700">AES-256-GCM</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                  <span className="text-xs font-semibold text-slate-700">Otorisasi & RBAC</span>
                </div>
                <span className="text-[11px] font-bold text-amber-800">Application Layer</span>
              </div>
            </div>
          </div>

          {/* Card Tata Kelola Modul */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                <span>Feature Flags Modul</span>
              </h2>
              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                {stats.systemHealth.activeModulesCount} / {stats.systemHealth.totalModulesCount} Aktif
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              Pengaturan modul dinamis untuk mengontrol ketersediaan fitur organisasi tanpa *re-deploy*.
            </p>

            <Link
              href="/pengguna?tab=modules"
              className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 rounded-xl transition-colors"
            >
              <span>Atur Feature Flags Modul</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
