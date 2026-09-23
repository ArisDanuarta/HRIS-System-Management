import React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession, getUserProfile } from "@pspk/auth";
import {
  getAllUsers,
  getUserStats,
  getAllSystemRoles,
} from "@/server/queries/user.queries";
import { UserManagementTable } from "@/components/users/user-management-table";
import { ShieldCheck, ShieldAlert, Key } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Manajemen Pengguna & RBAC — PSPK System Management",
  description: "Kelola akun login pengguna, peran sistem, dan status aktif",
};

export default async function UserManagementPage() {
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

  const [users, stats, allRoles] = await Promise.all([
    getAllUsers(),
    getUserStats(),
    getAllSystemRoles(),
  ]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-slate-900 font-serif">
              Manajemen Pengguna & Hak Akses
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-amber-600" />
              RBAC Aktif
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Kelola akun pengguna, status aktivasi login, dan penugasan peran sistem (Super Admin,
            Admin IT, Admin HR, Manajer, Staf).
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

      {/* Tabel Pengguna Interaktif */}
      <UserManagementTable
        users={users}
        stats={stats}
        allRoles={allRoles}
        currentUserId={session.user.id}
        isSuperAdmin={isSuperAdmin}
        isAdminIt={isAdminIt}
      />
    </div>
  );
}
