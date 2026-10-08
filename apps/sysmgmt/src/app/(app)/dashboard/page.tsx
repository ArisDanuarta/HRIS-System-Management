import React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession, getUserProfile } from "@pspk/auth";
import { getSysmgmtDashboardStats } from "@/server/queries/dashboard.queries";
import { ShieldAlert } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dashboard Administrator — PSPK System Management",
  description: "Pusat kendali eksekutif TI, keamanan akun, inventaris aset, dan log audit",
};

export default async function SysmgmtDashboardPage() {
  const reqHeaders = await headers();
  const session = await getSession(reqHeaders);

  if (!session || !session.user) {
    redirect("/login");
  }

  const userProfile = await getUserProfile(session.user.id);
  const roleKeys = userProfile?.roles.map((r) => r.role.key) || [];

  const isSuperAdmin = roleKeys.includes("super_admin");
  const isAdminIt = roleKeys.includes("admin_it");

  // Hanya Super Admin dan Admin IT yang memiliki wewenang akses ke portal ini
  if (!isSuperAdmin && !isAdminIt) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto shadow-sm my-12">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-200">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-2">Hak Akses Terbatas</h2>
        <p className="text-xs text-slate-500 leading-relaxed mb-6">
          Dashboard System Management hanya dapat diakses oleh Administrator IT atau Super
          Administrator PSPK.
        </p>
        <a
          href={process.env.NEXT_PUBLIC_HRIS_URL || "http://localhost:3001"}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#102E50] text-white text-xs font-semibold rounded-lg hover:bg-[#1a4473] transition-colors"
        >
          Kembali ke Portal HRIS
        </a>
      </div>
    );
  }

  const stats = await getSysmgmtDashboardStats();

  const currentUser = {
    id: session.user.id,
    name: userProfile?.employee?.fullName || session.user.name || "Administrator PSPK",
    email: session.user.email,
    roleTitle: isSuperAdmin ? "Super Administrator" : "Administrator IT",
    isSuperAdmin,
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Dashboard & Sambutan */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#102E50]/10 text-[#102E50] border border-[#102E50]/20">
              {currentUser.roleTitle}
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500">Pusat Kendali Sistem</span>
          </div>
          <h1 className="text-2xl font-bold font-serif text-[#102E50] tracking-tight">
            Dashboard System Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Selamat datang, <strong className="text-slate-700">{currentUser.name}</strong>. Pantau
            metrik pengguna, aset, lisensi, dan log audit PSPK secara real-time.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Sistem Operasional</span>
          </div>
        </div>
      </div>

      {/* Ringkasan Awal Metrik Sistem (Akan diperluas dengan visual fidelity penuh di Sub-Tahap 1C) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Pengguna & Sesi */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs hover:shadow-sm transition-shadow">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Akun Terdaftar
          </div>
          <div className="text-2xl font-bold text-[#102E50]">
            {stats.userStats.totalUsers}{" "}
            <span className="text-xs font-normal text-slate-500">akun</span>
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1.5">
            <span>● {stats.userStats.activeUsers} Aktif</span>
            <span className="text-slate-300">|</span>
            <span className="text-amber-600">{stats.userStats.activeSessions} Sesi Terbuka</span>
          </div>
        </div>

        {/* Card 2: Aset */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs hover:shadow-sm transition-shadow">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Inventaris Aset
          </div>
          <div className="text-2xl font-bold text-[#102E50]">
            {stats.assetStats.totalAssets}{" "}
            <span className="text-xs font-normal text-slate-500">unit</span>
          </div>
          <div className="text-[11px] text-slate-600 font-medium mt-1 flex items-center gap-1.5">
            <span className="text-blue-600">● {stats.assetStats.assignedAssets} Dipinjam</span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500">{stats.assetStats.inStockAssets} Gudang</span>
          </div>
        </div>

        {/* Card 3: Lisensi */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs hover:shadow-sm transition-shadow">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Lisensi Software
          </div>
          <div className="text-2xl font-bold text-[#102E50]">
            {stats.licenseStats.totalLicenses}{" "}
            <span className="text-xs font-normal text-slate-500">paket</span>
          </div>
          <div className="text-[11px] text-slate-600 font-medium mt-1 flex items-center gap-1.5">
            <span className="text-amber-700">● {stats.licenseStats.utilizationPercent}% Kursi Terpakai</span>
            {stats.licenseStats.expiringSoonCount > 0 && (
              <>
                <span className="text-slate-300">|</span>
                <span className="text-rose-600 font-bold">{stats.licenseStats.expiringSoonCount} Segera Habis</span>
              </>
            )}
          </div>
        </div>

        {/* Card 4: Dokumen & SOP */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs hover:shadow-sm transition-shadow">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Dokumen & SOP
          </div>
          <div className="text-2xl font-bold text-[#102E50]">
            {stats.documentStats.totalDocuments}{" "}
            <span className="text-xs font-normal text-slate-500">berkas</span>
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">
            ● {stats.documentStats.activeDocuments} Dokumen Kebijakan Aktif
          </div>
        </div>
      </div>
    </div>
  );
}
