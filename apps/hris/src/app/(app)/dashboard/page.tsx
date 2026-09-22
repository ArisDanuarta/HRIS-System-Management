import React from "react";
import { headers, cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSession, getUserProfile, getAuthContext } from "@pspk/auth";
import { AuthContext } from "@pspk/rbac";
import { getStaffDashboard } from "@/server/queries/dashboard/staff-dashboard";
import { getManagerDashboard } from "@/server/queries/dashboard/manager-dashboard";
import { getHrDashboard } from "@/server/queries/dashboard/hr-dashboard";
import { StaffDashboard } from "@/components/dashboard/staff-dashboard";
import { ManagerDashboard } from "@/components/dashboard/manager-dashboard";
import { HrDashboard } from "@/components/dashboard/hr-dashboard";
import { ItDashboard } from "@/components/dashboard/it-dashboard";
import { UnlinkedEmployeeNotice } from "@/components/dashboard/unlinked-employee-notice";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const reqHeaders = await headers();
  const session = await getSession(reqHeaders);

  if (!session || !session.user) {
    redirect("/login");
  }

  const [ctx, userProfile] = await Promise.all([
    getAuthContext(session.user.id),
    getUserProfile(session.user.id),
  ]);

  if (!ctx) {
    redirect("/login");
  }

  const roleKeys = ctx.roles;
  const isSuperAdmin = roleKeys.includes("super_admin");
  const isAdminHr = roleKeys.includes("admin_hr");
  const isManager = roleKeys.includes("manager");
  const isOnlyAdminIt = roleKeys.includes("admin_it") && !isAdminHr && !isManager && !isSuperAdmin;

  // Check preview cookie (STRICT SECURITY: only respected if user has super_admin role in DB)
  const cookieStore = await cookies();
  const rawPreviewCookie = cookieStore.get("pspk_role_view")?.value;
  const activePreviewRole =
    isSuperAdmin && (rawPreviewCookie === "admin_hr" || rawPreviewCookie === "manager" || rawPreviewCookie === "staff")
      ? rawPreviewCookie
      : null;

  const employeeName = userProfile?.employee?.fullName || session.user.name || "Karyawan PSPK";

  // CASE 1: SUPER ADMIN PREVIEW SWITCH
  if (activePreviewRole === "staff") {
    if (!ctx.employeeId) {
      return <UnlinkedEmployeeNotice roleName="Staff / Karyawan" />;
    }
    const staffData = await getStaffDashboard(ctx);
    return <StaffDashboard data={staffData} employeeName={employeeName} />;
  }

  if (activePreviewRole === "manager") {
    if (!ctx.employeeId) {
      return <UnlinkedEmployeeNotice roleName="Manajer" />;
    }
    const managerData = await getManagerDashboard(ctx);
    return <ManagerDashboard data={managerData} managerName={employeeName} />;
  }

  if (activePreviewRole === "admin_hr") {
    const hrData = await getHrDashboard(ctx);
    return <HrDashboard data={hrData} isSuperAdmin={isSuperAdmin} />;
  }

  // CASE 2: NORMAL ROLE RESOLUTION (Prioritas: Super Admin / Admin HR > Manager > Admin IT > Staff)
  if (isSuperAdmin || isAdminHr) {
    const hrData = await getHrDashboard(ctx);
    return <HrDashboard data={hrData} isSuperAdmin={isSuperAdmin} />;
  }

  if (isManager) {
    if (!ctx.employeeId) {
      return <UnlinkedEmployeeNotice roleName="Manajer" />;
    }
    const managerData = await getManagerDashboard(ctx);
    return <ManagerDashboard data={managerData} managerName={employeeName} />;
  }

  if (isOnlyAdminIt) {
    return <ItDashboard />;
  }

  // DEFAULT: STAFF DASHBOARD
  if (!ctx.employeeId) {
    return <UnlinkedEmployeeNotice roleName="Staff" />;
  }

  const staffData = await getStaffDashboard(ctx);
  return <StaffDashboard data={staffData} employeeName={employeeName} />;
}
