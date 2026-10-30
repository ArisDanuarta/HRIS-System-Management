import React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { getSession, getUserProfile } from "@pspk/auth";
import { getOrgStructureDetail } from "@/server/queries/employee.queries";
import { getEmploymentTypes } from "@/server/queries/employment-type.queries";
import {
  getLeaveTypes,
  getHolidays,
  getAllEmployeeLeaveBalances,
} from "@/server/queries/leave.queries";
import { getActiveWorkSchedule } from "@/server/services/work-schedule.service";
import { getSalaryComponents } from "@/server/queries/payroll.queries";
import { getPayrollSettings } from "@/server/queries/payroll-settings.queries";
import { TataKelolaView } from "@/components/tata-kelola/tata-kelola-view";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tata Kelola & Master HR - HRIS PSPK",
  description:
    "Pusat konfigurasi terpadu struktur divisi, tipe ikatan kerja, regulasi jadwal kerja & cuti, komponen gaji, dan rekening bank resmi lembaga.",
};

export default async function TataKelolaPage() {
  const reqHeaders = await headers();
  const session = await getSession(reqHeaders);

  if (!session?.user) {
    redirect("/login");
  }

  const userProfile = await getUserProfile(session.user.id);
  const roleKeys = userProfile?.roles.map((r) => r.role.key) || [];

  const isSuperAdmin = roleKeys.includes("super_admin");
  const isAdminHr = roleKeys.includes("admin_hr");

  // Proteksi Hak Akses Tata Kelola: Khusus Admin HR dan Super Admin
  if (!isSuperAdmin && !isAdminHr) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto shadow-sm my-12">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-200">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-2 font-serif">Akses Dibatasi</h2>
        <p className="text-xs text-slate-500 leading-relaxed mb-6">
          Modul Tata Kelola & Master HR hanya dapat diakses oleh Administrator HR dan Pimpinan
          Lembaga PSPK.
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

  const currentYear = new Date().getFullYear();

  // Pengambilan data master secara paralel
  const [
    orgData,
    employmentTypes,
    leaveTypes,
    holidays,
    workSchedule,
    leaveBalanceData,
    rawSalaryComponents,
    payrollSettings,
  ] = await Promise.all([
    getOrgStructureDetail(),
    getEmploymentTypes(),
    getLeaveTypes(),
    getHolidays(currentYear),
    getActiveWorkSchedule(),
    getAllEmployeeLeaveBalances(currentYear),
    getSalaryComponents(),
    getPayrollSettings(),
  ]);

  const salaryComponents = rawSalaryComponents.map((c) => ({
    ...c,
    defaultValue: c.defaultValue ? Number(c.defaultValue) : 0,
  }));

  return (
    <TataKelolaView
      departments={orgData.departments}
      orgStats={orgData.stats}
      employmentTypes={employmentTypes}
      leaveTypes={leaveTypes}
      holidays={holidays}
      workSchedule={workSchedule}
      employeeBalances={leaveBalanceData.balances}
      defaultLeaveType={leaveBalanceData.defaultLeaveType}
      salaryComponents={salaryComponents}
      payrollSettings={payrollSettings}
      canManage={true}
    />
  );
}

