import React from "react";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession, getUserProfile, getAuthContext } from "@pspk/auth";
import { can } from "@pspk/rbac";
import { prisma, getModuleFlags, isModuleActive } from "@pspk/db";
import { Clock, Fingerprint, LayoutDashboard, AlertCircle } from "lucide-react";
import {
  getTimesheetSubmissionsByEmployee,
  getEligibleReviewers,
} from "@/server/queries/timesheet.queries";
import { TimesheetView } from "@/components/timesheet/timesheet-view";
import { UnlinkedEmployeeNotice } from "@/components/dashboard/unlinked-employee-notice";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Timesheet Saya — HRIS PSPK",
  description: "Pengumpulan dan pelaporan lembar waktu Google Spreadsheet karyawan freelance PSPK",
};

export default async function TimesheetPage() {
  const reqHeaders = await headers();
  const session = await getSession(reqHeaders);

  if (!session?.user) {
    redirect("/login");
  }

  // Route Guard: Pastikan modul Timesheet aktif
  const moduleFlags = await getModuleFlags(prisma);
  if (!isModuleActive(moduleFlags, "timesheet")) {
    redirect("/dashboard");
  }

  const [ctx, userProfile] = await Promise.all([
    getAuthContext(session.user.id),
    getUserProfile(session.user.id),
  ]);

  if (!ctx || !ctx.employeeId || !userProfile?.employee) {
    return <UnlinkedEmployeeNotice roleName="Karyawan / Freelance" />;
  }

  // Ambil kontrak aktif pegawai untuk mengetahui wageType & hourlyRate
  const activeContract = await prisma.employmentContract.findFirst({
    where: {
      employeeId: ctx.employeeId,
      status: "ACTIVE",
    },
    select: {
      wageType: true,
      hourlyRate: true,
      type: true,
    },
    orderBy: { startDate: "desc" },
  });

  const isHourly = activeContract?.wageType === "HOURLY";

  // Periksa apakah pengguna memiliki peran/hak untuk melakukan review persetujuan timesheet
  const canReview =
    can(ctx, "hris.timesheet.review:team") ||
    ctx.roles.includes("manager") ||
    ctx.roles.includes("admin_hr") ||
    ctx.roles.includes("super_admin");

  // Jika bukan karyawan per jam tapi memiliki wewenang review (seperti Manajer / Lead / Admin HR),
  // otomatis arahkan ke halaman Persetujuan Timesheet
  if (!isHourly && canReview) {
    redirect("/timesheet/persetujuan");
  }

  // Jika bukan karyawan per jam dan juga bukan reviewer (misal staf bulanan tetap)
  if (!isHourly) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-8 text-center space-y-5 animate-in fade-in duration-200">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-700 mx-auto flex items-center justify-center">
            <Clock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
              <AlertCircle className="w-3.5 h-3.5 text-slate-500" />
              <span>Khusus Tenaga Riset / PKWT Per Jam</span>
            </div>
            <h1 className="text-xl font-bold font-serif text-slate-900">
              Portal Timesheet Freelance
            </h1>
            <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
              Pengumpulan jam kerja via Google Spreadsheet hanya berlaku bagi staf freelance dan pegawai kontrak PKWT per jam. Akun Anda saat ini tercatat dengan skema <strong className="text-slate-800">Gaji Bulanan Tetap</strong>.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60 text-xs text-slate-500 text-left space-y-1.5">
            <div className="font-semibold text-slate-700 flex items-center gap-1.5">
              <span>Ketentuan Presensi & Penggajian Anda:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-600">
              <li>Pencatatan kehadiran harian Anda dilakukan melalui menu Absensi Harian (Clock-in / Clock-out).</li>
              <li>Gaji pokok dan tunjangan bulanan Anda dihitung otomatis pada periode penggajian tanpa perlu menyetor timesheet jam kerja.</li>
            </ul>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/absensi"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#102E50] hover:bg-[#1a4473] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
            >
              <Fingerprint className="w-4 h-4 text-[#F2AF3E]" />
              <span>Buka Absensi Harian</span>
            </Link>
            <Link
              href="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Kembali ke Beranda</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const [timesheetData, eligibleReviewers] = await Promise.all([
    getTimesheetSubmissionsByEmployee(ctx.employeeId),
    getEligibleReviewers(ctx.employeeId),
  ]);

  return (
    <TimesheetView
      submissions={timesheetData.items}
      stats={timesheetData.stats}
      eligibleReviewers={eligibleReviewers}
      hourlyRate={activeContract?.hourlyRate ? Number(activeContract.hourlyRate) : null}
      wageType={activeContract?.wageType || "MONTHLY"}
    />
  );
}

