import React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession, getUserProfile } from "@pspk/auth";
import { prisma } from "@pspk/db";
import {
  getLeaveTypes,
  getEmployeeLeaveBalances,
  getHolidays,
} from "@/server/queries/leave.queries";
import { LeaveRequestForm } from "@/components/cuti/leave-request-form";
import { UnlinkedEmployeeNotice } from "@/components/dashboard/unlinked-employee-notice";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pengajuan Cuti - HRIS PSPK",
  description: "Formulir pengajuan izin dan cuti kerja pegawai PSPK",
};

export default async function AjukanCutiPage() {
  const reqHeaders = await headers();
  const session = await getSession(reqHeaders);

  if (!session || !session.user) {
    redirect("/login");
  }

  const userProfile = await getUserProfile(session.user.id);
  const employee =
    (userProfile?.employee?.id
      ? await prisma.employee.findUnique({
          where: { id: userProfile.employee.id },
          include: {
            currentDepartment: { select: { name: true } },
            currentPosition: { select: { title: true } },
          },
        })
      : null) ||
    (await prisma.employee.findFirst({
      where: { deletedAt: null },
      include: {
        currentDepartment: { select: { name: true } },
        currentPosition: { select: { title: true } },
      },
      orderBy: { createdAt: "asc" },
    }));

  if (!employee) {
    return <UnlinkedEmployeeNotice roleName="Pengajuan Cuti" />;
  }

  const currentYear = new Date().getFullYear();

  // Fetch real leave types (filtered by gender), current balances, and holiday dates for working day calculations
  const [leaveTypes, balances, holidays] = await Promise.all([
    getLeaveTypes(employee.gender),
    getEmployeeLeaveBalances(employee.id, currentYear),
    getHolidays(currentYear),
  ]);

  const employeeInfo = {
    fullName: employee.fullName,
    employeeNo: employee.employeeNo,
    department: employee.currentDepartment?.name ?? null,
    position: employee.currentPosition?.title ?? null,
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header & Back Link */}
      <div>
        <Link
          href="/cuti"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#102e50] transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Dashboard Cuti</span>
        </Link>
        <h1 className="font-heading font-bold text-2xl md:text-3xl text-[#102e50] tracking-tight">
          Formulir Pengajuan Cuti & Izin
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
          Ajukan permohonan cuti kerja melalui proses multi-tahap yang terverifikasi otomatis dengan
          kalender hari libur resmi PSPK.
        </p>
      </div>

      {/* Interactive Multi-Step Form Component */}
      <LeaveRequestForm
        leaveTypes={leaveTypes}
        balances={balances}
        holidays={holidays}
        employeeInfo={employeeInfo}
      />
    </div>
  );
}
