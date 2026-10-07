import React from "react";
import { headers, cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSession, getUserProfile } from "@pspk/auth";
import { prisma, getModuleFlags } from "@pspk/db";
import { ShellContainer } from "@/components/shell/shell-container";
import { RoleViewType } from "@/components/shell/app-sidebar";

export const dynamic = "force-dynamic";

export default async function AppProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const reqHeaders = await headers();
  const session = await getSession(reqHeaders);

  if (!session || !session.user) {
    redirect("/login");
  }

  const [userProfile, activeEmployeeCount, pendingLeavesCount, moduleFlags] = await Promise.all([
    getUserProfile(session.user.id),
    prisma.employee.count({ where: { status: "ACTIVE", deletedAt: null } }),
    prisma.leaveRequest.count({ where: { status: "PENDING" } }),
    getModuleFlags(prisma),
  ]);

  // Map roles to determine primary view mode
  const roleKeys = userProfile?.roles.map((r) => r.role.key) || [];
  const isSuperAdmin = roleKeys.includes("super_admin");
  const canAccessSysmgmt = isSuperAdmin || roleKeys.includes("admin_it");

  const cookieStore = await cookies();
  const previewCookie = cookieStore.get("pspk_role_view")?.value;
  const activePreviewRole =
    isSuperAdmin && (previewCookie === "admin_hr" || previewCookie === "manager" || previewCookie === "staff")
      ? (previewCookie as RoleViewType)
      : null;

  let initialRole: RoleViewType = "staff";
  let roleDisplayName = "Staff";

  if (activePreviewRole) {
    initialRole = activePreviewRole;
    roleDisplayName =
      activePreviewRole === "admin_hr"
        ? "Admin HR (Pratinjau)"
        : activePreviewRole === "manager"
        ? "Manajer (Pratinjau)"
        : "Staf (Pratinjau)";
  } else if (roleKeys.includes("super_admin") || roleKeys.includes("admin_hr")) {
    initialRole = "admin_hr";
    roleDisplayName = roleKeys.includes("super_admin") ? "Super Admin" : "Admin HR";
  } else if (roleKeys.includes("manager")) {
    initialRole = "manager";
    roleDisplayName = "Manajer";
  }

  let isHourlyEmployee = false;
  let pendingTimesheetsCount = 0;
  let remainingLeaveDays = 12;

  const currentYear = new Date().getFullYear();

  if (userProfile?.employee?.id) {
    const [activeContract, balances, defaultAnnualType] = await Promise.all([
      prisma.employmentContract.findFirst({
        where: {
          employeeId: userProfile.employee.id,
          status: "ACTIVE",
        },
        select: { wageType: true },
        orderBy: { startDate: "desc" },
      }),
      prisma.leaveBalance.findMany({
        where: {
          employeeId: userProfile.employee.id,
          year: currentYear,
        },
        include: { leaveType: true },
      }),
      prisma.leaveType.findFirst({
        where: {
          name: { contains: "Tahunan", mode: "insensitive" },
          isActive: true,
        },
        select: { defaultQuotaDays: true },
      }),
    ]);

    isHourlyEmployee = activeContract?.wageType === "HOURLY";

    const annualBalance =
      balances.find((b) => b.leaveType.name.toLowerCase().includes("tahunan")) || balances[0];
    if (annualBalance) {
      remainingLeaveDays = Math.max(0, annualBalance.quotaDays - Number(annualBalance.usedDays));
    } else if (defaultAnnualType) {
      remainingLeaveDays = defaultAnnualType.defaultQuotaDays;
    }

    if (initialRole === "manager") {
      pendingTimesheetsCount = await prisma.timesheetReviewer.count({
        where: {
          reviewerId: userProfile.employee.id,
          status: { in: ["PENDING", "IN_REVIEW"] },
        },
      });
    }
  }

  if (initialRole === "admin_hr") {
    pendingTimesheetsCount = await prisma.timesheetSubmission.count({
      where: {
        status: { in: ["PENDING", "IN_REVIEW"] },
      },
    });
  }

  const userData = {
    id: session.user.id,
    name: userProfile?.employee?.fullName || session.user.name || "Pegawai PSPK",
    email: session.user.email,
    image: session.user.image,
    roleName: roleDisplayName,
  };

  return (
    <ShellContainer
      user={userData}
      initialRole={initialRole}
      employeeCount={activeEmployeeCount}
      pendingLeavesCount={pendingLeavesCount}
      remainingLeaveDays={remainingLeaveDays}
      pendingTimesheetsCount={pendingTimesheetsCount}
      isHourlyEmployee={isHourlyEmployee}
      isSuperAdmin={isSuperAdmin}
      canAccessSysmgmt={canAccessSysmgmt}
      moduleFlags={moduleFlags}
    >
      {children}
    </ShellContainer>
  );
}
