import React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession, getUserProfile, getAuthContext } from "@pspk/auth";
import { prisma } from "@pspk/db";
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
