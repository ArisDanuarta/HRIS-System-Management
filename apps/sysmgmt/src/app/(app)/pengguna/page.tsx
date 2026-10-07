import React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession, getUserProfile } from "@pspk/auth";
import {
  getAllUsers,
  getUserStats,
  getAllSystemRoles,
} from "@/server/queries/user.queries";
import { getRoleMatrixData } from "@/server/queries/role.queries";
import { getModuleGovernanceData } from "@/server/queries/module.queries";
import { UserManagementTable } from "@/components/users/user-management-table";
import { UserGovernanceSubnav, UserGovernanceTab } from "@/components/shell/user-governance-subnav";
import { RoleMatrixView } from "@/components/roles/role-matrix-view";
import { ModuleGovernanceView } from "@/components/modules/module-governance-view";
import { ShieldCheck, ShieldAlert, Key, Shield, Users, Layers } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Tata Kelola Pengguna & Hak Akses — PSPK System Management",
  description: "Kelola akun pengguna, matriks peran RBAC, dan status aktivasi",
};

interface UserManagementPageProps {
  searchParams?: Promise<{ tab?: string }>;
}

export default async function UserManagementPage({
  searchParams,
}: UserManagementPageProps) {
  const reqHeaders = await headers();
  const session = await getSession(reqHeaders);

  if (!session || !session.user) {
    redirect("/login");
  }

  const userProfile = await getUserProfile(session.user.id);
  const roleKeys = userProfile?.roles.map((r) => r.role.key) || [];

  const isSuperAdmin = roleKeys.includes("super_admin");
  const isAdminIt = roleKeys.includes("admin_it");

  // Jika bukan Super Admin atau Admin IT, tolak akses ke menu manajemen user
  if (!isSuperAdmin && !isAdminIt) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto shadow-sm">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-200">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-2">
          Hak Akses Tidak Mencukupi
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed mb-6">
          Menu Manajemen Pengguna dan RBAC hanya dapat diakses oleh Administrator IT atau Super
          Administrator PSPK.
        </p>
        <a
          href="http://localhost:3001"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#102E50] text-white text-xs font-semibold rounded-lg hover:bg-[#1a4473] transition-colors"
        >
          Kembali ke HRIS
        </a>
      </div>
    );
  }

  const resolvedParams = searchParams ? await searchParams : {};
  const rawTab = resolvedParams.tab;
  const activeTab: UserGovernanceTab =
    rawTab === "roles" ? "roles" : rawTab === "modules" ? "modules" : "users";

  // Muat data statistik bersama
  const [stats, allRoles] = await Promise.all([
    getUserStats(),
    getAllSystemRoles(),
  ]);

  // Muat data sesuai tab aktif
  const users = activeTab === "users" ? await getAllUsers() : [];
  const matrixData = activeTab === "roles" ? await getRoleMatrixData() : null;
  const moduleData = activeTab === "modules" ? await getModuleGovernanceData() : null;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-slate-900 font-serif">
              Tata Kelola Pengguna & Hak Akses
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-amber-600" />
              RBAC Aktif
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Kelola akun pengguna, status aktivasi login, dan matriks wewenang peran sistem (Super
            Admin, Admin IT, Admin HR, Manajer, Staf).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">
              Wewenang Anda
            </span>
            <span className="text-xs font-bold text-[#102E50]">
              {isSuperAdmin ? "Super Administrator (Root)" : "Administrator IT"}
            </span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[#102E50]">
            <Key className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Sub-Navigasi Tab: [Akun Pengguna], [Matriks Peran & Hak Akses], [Tata Kelola Modul] */}
      <UserGovernanceSubnav
        activeTab={activeTab}
        userCount={stats.totalUsers}
        roleCount={allRoles.length}
        moduleCount={6}
      />

      {/* Konten Tab 1: Akun Pengguna */}
      {activeTab === "users" && (
        <UserManagementTable
          users={users}
          stats={stats}
          allRoles={allRoles}
          currentUserId={session.user.id}
          isSuperAdmin={isSuperAdmin}
          isAdminIt={isAdminIt}
        />
      )}

      {/* Konten Tab 2: Matriks Peran & Hak Akses (RBAC) */}
      {activeTab === "roles" && matrixData && (
        <div className="space-y-6">
          {/* Ringkasan Analitik RBAC */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Total Peran Sistem
                </span>
                <Shield className="w-4 h-4 text-[#102E50]" />
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-2 font-serif">
                {matrixData.stats.totalRoles}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Peran terdaftar di skema core</p>
            </div>

            <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Total Izin Sistem
                </span>
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-2 font-serif">
                {matrixData.stats.totalPermissions}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                {matrixData.stats.totalHrisPermissions} HRIS + {matrixData.stats.totalSysmgmtPermissions} SysMgmt
              </p>
            </div>

            <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Pengguna Ditugaskan
                </span>
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-2 font-serif">
                {matrixData.stats.totalAssignedUsers}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Total asosiasi peran aktif</p>
            </div>

            <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Kategori Modul
                </span>
                <Layers className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-2 font-serif">
                {matrixData.categories.length}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Area fungsional terpetakan</p>
            </div>
          </div>

          {/* Kartu Ringkasan Peran Cepat */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {matrixData.roles.map((r) => (
              <div
                key={r.id}
                className="bg-white rounded-xl p-3.5 border border-slate-200/90 shadow-2xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-900">{r.name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-semibold">
                      {r.userCount} user
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                    {r.description || "Peran operasional sistem"}
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Total Akses:</span>
                  <span className="font-bold text-[#102E50]">{r.permissionCount} izin</span>
                </div>
              </div>
            ))}
          </div>

          {/* Tabel Matriks Grid Interaktif (Sub-Tahap A3) */}
          <RoleMatrixView matrixData={matrixData} />
        </div>
      )}

      {/* Konten Tab 3: Tata Kelola Modul (Feature Flags) */}
      {activeTab === "modules" && moduleData && (
        <ModuleGovernanceView governanceData={moduleData} />
      )}
    </div>
  );
}
