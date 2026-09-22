import React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession, getUserProfile } from "@pspk/auth";
import { prisma } from "@pspk/db";
import { getLeaveTypes, getEmployeeLeaveBalances, getHolidays } from "@/server/queries/leave.queries";
import { LeaveRequestForm } from "@/components/cuti/leave-request-form";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AjukanCutiPage() {
  const reqHeaders = await headers();
  const session = await getSession(reqHeaders);

  if (!session || !session.user) {
    redirect("/login");
  }

  const userProfile = await getUserProfile(session.user.id);
  const employee =
    userProfile?.employee ||
    (await prisma.employee.findFirst({
      where: { deletedAt: null },
      orderBy: { createdAt: "asc" },
    }));

  if (!employee) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-gray-200">
        <p className="text-gray-600">Profil pegawai tidak ditemukan untuk akun ini.</p>
      </div>
    );
  }

  // Fetch real leave types, current balances, and holiday dates for working day calculations
  const [leaveTypes, balances, holidays] = await Promise.all([
    getLeaveTypes(),
    getEmployeeLeaveBalances(employee.id, 2026),
    getHolidays(2026),
  ]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header & Back Link */}
      <div>
        <Link
          href="/cuti"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-[#102e50] transition-colors mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Daftar Cuti
        </Link>
        <h1 className="font-heading font-bold text-2xl md:text-3xl text-[#102e50] tracking-tight">
          Formulir Pengajuan Cuti & Izin
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Lengkapi detail permohonan cuti Anda. Sistem akan menghitung otomatis hari kerja efektif
          tanpa akhir pekan dan hari libur nasional.
        </p>
      </div>

      {/* Interactive Form Component */}
      <LeaveRequestForm
        leaveTypes={leaveTypes}
        balances={balances}
        holidays={holidays}
      />
    </div>
  );
}
