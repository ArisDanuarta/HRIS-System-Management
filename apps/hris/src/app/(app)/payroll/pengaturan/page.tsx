import React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession, getUserProfile } from "@pspk/auth";
import { ShieldAlert } from "lucide-react";
import { getPayrollSettings } from "@/server/queries/payroll-settings.queries";
import { PayrollSettingsView } from "@/components/payroll/payroll-settings-view";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Pengaturan Dokumen & Bank Penggajian — HRIS PSPK",
  description: "Kelola rekening operasional bank pengirim penggajian PSPK, logo, kop surat, dan border dokumen slip gaji",
};

export default async function PayrollSettingsPage() {
  const reqHeaders = await headers();
  const session = await getSession(reqHeaders);

  if (!session?.user) {
    redirect("/login");
  }

  const userProfile = await getUserProfile(session.user.id);
  const roleKeys = userProfile?.roles.map((r) => r.role.key) || [];

  const isSuperAdmin = roleKeys.includes("super_admin");
  const isAdminHr = roleKeys.includes("admin_hr");

  // Proteksi Akses: Hanya Admin HR dan Super Admin
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
          Pengaturan rekening bank pengirim penggajian dan desain dokumen resmi lembaga hanya dapat dikonfigurasi oleh Administrator HR dan Super Admin.
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

  const settings = await getPayrollSettings();

  return <PayrollSettingsView initialSettings={settings} />;
}
