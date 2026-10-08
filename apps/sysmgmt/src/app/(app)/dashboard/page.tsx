import React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession, getUserProfile } from "@pspk/auth";
import { getSysmgmtDashboardStats } from "@/server/queries/dashboard.queries";
import { DashboardView } from "@/components/dashboard/dashboard-view";
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

  return <DashboardView stats={stats} currentUser={currentUser} />;
}
