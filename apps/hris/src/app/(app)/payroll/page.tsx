import React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession, getUserProfile } from "@pspk/auth";
import { formatRupiah } from "@pspk/shared";
import { getPayrollPeriods, getPayrollStats } from "@/server/queries/payroll.queries";
import { PeriodItem } from "@/components/payroll/payroll-period-table";
import { PayrollClientWrapper } from "./payroll-client-wrapper";
import {
  Receipt,
  Users,
  CreditCard,
  Sliders,
  ShieldAlert,
  Calendar,
} from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Penggajian (Payroll) — HRIS PSPK",
  description: "Kelola siklus periode penggajian bulanan, tunjangan, dan slip gaji pegawai PSPK",
};

export default async function PayrollPage() {
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
          Sesuai standar kerahasiaan keuangan dan tata kelola PSPK, modul penggajian hanya dapat
          diakses oleh Tim Administrator HR dan Pimpinan Tertinggi. Manajer dan staf tidak memiliki
          akses ke data penggajian organisasi.
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

  const [periods, stats] = await Promise.all([
    getPayrollPeriods(),
    getPayrollStats(),
  ]);

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-slate-900 font-serif">
              Penggajian & Tunjangan (Payroll)
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1 font-mono">
              <Receipt className="w-3 h-3 text-emerald-600" />
              Siklus Aktif
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Kelola periode penggajian bulanan, perhitungan tunjangan/potongan resmi, dan penerbitan
            slip gaji bagi peneliti dan staf PSPK.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/payroll/komponen"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition-colors"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-500" />
            <span>Master Komponen Gaji</span>
          </Link>
        </div>
      </div>

      {/* Kartu Metrik Ringkasan KPI Payroll */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <CreditCard className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-medium">Beban Gaji Bulan Ini</span>
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono">
            {formatRupiah(stats.currentPeriodNet)}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">
            {stats.currentPeriodEmployeesProcessed} pegawai terproses
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 text-blue-700 mb-1">
            <Users className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-medium">Pegawai Aktif Lembaga</span>
          </div>
          <div className="text-2xl font-bold text-blue-900">{stats.totalActiveEmployees} Orang</div>
          <div className="text-[11px] text-slate-400 mt-1">Memiliki kontrak kerja aktif</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 text-amber-700 mb-1">
            <Calendar className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-medium">Total Periode Terdaftar</span>
          </div>
          <div className="text-2xl font-bold text-amber-900">{stats.totalPeriods} Periode</div>
          <div className="text-[11px] text-slate-400 mt-1">Siklus reguler & THR</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 text-purple-700 mb-1">
            <Sliders className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-medium">Komponen Gaji Aktif</span>
          </div>
          <div className="text-2xl font-bold text-purple-900">{stats.allComponentsCount} Item</div>
          <div className="text-[11px] text-slate-400 mt-1">Tunjangan & potongan resmi</div>
        </div>
      </div>

      {/* Tabel Periode dengan Client Wrapper untuk Modal */}
      <PayrollClientWrapper periods={periods as unknown as PeriodItem[]} />
    </div>
  );
}
