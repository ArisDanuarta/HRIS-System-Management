import React from "react";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getSession, getUserProfile } from "@pspk/auth";
import { getPayrollPeriodById } from "@/server/queries/payroll.queries";
import { PayrollDetailView } from "@/components/payroll/payroll-detail-view";
import { ShieldAlert } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Detail & Kalkulasi Periode Penggajian — HRIS PSPK",
  description: "Eksekusi kalkulasi, persetujuan, dan publikasi slip gaji periode",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PayrollDetailPage({ params }: PageProps) {
  const { id } = await params;

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
          Modul eksekusi penggajian hanya dapat diakses oleh Tim Administrator HR dan Pimpinan
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

  const period = await getPayrollPeriodById(id);

  if (!period) {
    notFound();
  }

  // Format payload untuk client component
  const formattedPeriod = {
    ...period,
    totalGross: period.totalGross,
    totalDeduction: period.totalDeduction,
    totalNet: period.totalNet,
    payslips: period.payslips.map((p) => ({
      ...p,
      grossAmount: Number(p.grossAmount),
      totalDeduction: Number(p.totalDeduction),
      netAmount: Number(p.netAmount),
      lines: p.lines.map((l) => ({
        ...l,
        amount: Number(l.amount),
      })),
    })),
  };

  return (
    <PayrollDetailView
      period={formattedPeriod as unknown as Parameters<typeof PayrollDetailView>[0]["period"]}
    />
  );
}
