import React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession, getUserProfile } from "@pspk/auth";
import { prisma, getModuleFlags } from "@pspk/db";
import { SysmgmtNavbar } from "@/components/shell/sysmgmt-navbar";
import { ShieldAlert } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SysmgmtProtectedLayout({ children }: { children: React.ReactNode }) {
  const reqHeaders = await headers();
  const [session, moduleFlags] = await Promise.all([
    getSession(reqHeaders),
    getModuleFlags(prisma),
  ]);

  if (!session || !session.user) {
    redirect("/login");
  }

  const userProfile = await getUserProfile(session.user.id);

  // Proteksi: Pengguna berstatus wajib ganti kata sandi dilarang mengakses layout dashboard
  if (userProfile?.mustChangePassword) {
    redirect("/ganti-password-wajib");
  }

  const roleKeys = userProfile?.roles.map((r) => r.role.key) || [];

  const isSuperAdmin = roleKeys.includes("super_admin");
  const isAdminIt = roleKeys.includes("admin_it");

  let roleDisplayName = "Staff";
  if (isSuperAdmin) {
    roleDisplayName = "Super Admin";
  } else if (isAdminIt) {
    roleDisplayName = "Admin IT";
  } else if (roleKeys.includes("admin_hr")) {
    roleDisplayName = "Admin HR";
  } else if (roleKeys.includes("manager")) {
    roleDisplayName = "Manajer";
  }

  const canAccessHris =
    isSuperAdmin ||
    roleKeys.includes("admin_hr") ||
    roleKeys.includes("manager") ||
    roleKeys.includes("staff") ||
    Boolean(userProfile?.employee);

  const userData = {
    id: session.user.id,
    name: userProfile?.employee?.fullName || session.user.name || "Administrator PSPK",
    email: session.user.email,
    roleName: roleDisplayName,
    roleKey: roleKeys[0] || "staff",
  };

  // Proteksi Akses Portal: Hanya Super Admin dan Admin IT yang memiliki wewenang di System Management
  if (!isSuperAdmin && !isAdminIt) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
        <SysmgmtNavbar user={userData} canAccessHris={canAccessHris} moduleFlags={moduleFlags} />
        <main className="flex-1 max-w-lg w-full mx-auto px-4 py-16 flex items-center justify-center">
          <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center shadow-xs w-full">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-200">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">Hak Akses Terbatas</h2>
            <p className="text-xs text-slate-500 leading-relaxed mb-6">
              Portal System Management hanya dapat diakses oleh Administrator IT atau Super
              Administrator PSPK. Akun Anda saat ini tidak memiliki wewenang administratif.
            </p>
            <a
              href={process.env.NEXT_PUBLIC_HRIS_URL || "http://localhost:3001"}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#102E50] text-white text-xs font-semibold rounded-lg hover:bg-[#1a4473] transition-colors"
            >
              Kembali ke Portal HRIS
            </a>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans overflow-x-hidden">
      <SysmgmtNavbar user={userData} canAccessHris={canAccessHris} moduleFlags={moduleFlags} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  );
}
