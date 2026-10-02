import React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession, getUserProfile, getAuthContext } from "@pspk/auth";
import { can } from "@pspk/rbac";
import { getTimesheetSubmissionsForReviewer } from "@/server/queries/timesheet.queries";
import { TimesheetApprovalView } from "@/components/timesheet/approval/timesheet-approval-view";
import { UnlinkedEmployeeNotice } from "@/components/dashboard/unlinked-employee-notice";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Persetujuan Timesheet — HRIS PSPK",
  description: "Persetujuan lembar kerja jam kerja karyawan freelance PSPK",
};

export default async function TimesheetApprovalPage(props: {
  searchParams?: Promise<{ submissionId?: string }>;
}) {
  const reqHeaders = await headers();
  const session = await getSession(reqHeaders);

  if (!session?.user) {
    redirect("/login");
  }

  const searchParams = await props.searchParams;

  const [ctx, userProfile] = await Promise.all([
    getAuthContext(session.user.id),
    getUserProfile(session.user.id),
  ]);

  if (!ctx || !ctx.employeeId || !userProfile?.employee) {
    return <UnlinkedEmployeeNotice roleName="Atasan / Lead Reviewer" />;
  }

  // Otorisasi: Pastikan memiliki peran manajer/admin atau permission review
  const canReview =
    can(ctx, "hris.timesheet.review:team") ||
    ctx.roles.includes("manager") ||
    ctx.roles.includes("admin_hr") ||
    ctx.roles.includes("super_admin");

  if (!canReview) {
    redirect("/timesheet");
  }

  const timesheetData = await getTimesheetSubmissionsForReviewer(ctx.employeeId);

  return (
    <TimesheetApprovalView
      items={timesheetData.items}
      stats={timesheetData.stats}
      currentEmployeeId={ctx.employeeId}
      initialSubmissionId={searchParams?.submissionId}
    />
  );
}
