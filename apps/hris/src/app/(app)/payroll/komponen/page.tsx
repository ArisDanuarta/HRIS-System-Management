import React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession, getUserProfile } from "@pspk/auth";
import { getSalaryComponents } from "@/server/queries/payroll.queries";
import { SalaryComponentsTable } from "@/components/payroll/salary-components-table";
import { ShieldAlert } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Master Komponen Gaji — HRIS PSPK",
  description: "Kelola konfigurasi tunjangan dan potongan gaji standar PSPK",
};

export default async function SalaryComponentsPage() {
  const reqHeaders = await headers();
  const session = await getSession(reqHeaders);

  if (!session?.user) {
    redirect("/login");
  }

  const userProfile = await getUserProfile(session.user.id);
  const roleKeys = userProfile?.roles.map((r) => r.role.key) || [];

  const isSuperAdmin = roleKeys.includes("super_admin");
  const isAdminHr = roleKeys.includes("admin_hr");

  // Proteksi Akses
  if (!isSuperAdmin && !isAdminHr) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto shadow-sm mt-8">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-200">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-2">
          Hak Akses Terbatas (Separation of Duties)
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed mb-6">
          Konfigurasi komponen penggajian hanya dapat diakses oleh Tim Administrator HR dan Pimpinan
          Tertinggi PSPK.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#102E50] text-white text-xs font-semibold rounded-lg hover:bg-[#1a4473] transition-colors"
        >
          Kembali ke Beranda
        </Link>
      </div>
    );
  }

  const components = await getSalaryComponents();

  const formattedComponents = components.map((c) => ({
    ...c,
    defaultValue: c.defaultValue ? Number(c.defaultValue) : 0,
  }));

  return <SalaryComponentsTable components={formattedComponents} />;
}
