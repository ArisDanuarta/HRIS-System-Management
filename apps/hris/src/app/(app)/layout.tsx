import React from "react";
import { headers, cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSession, getUserProfile } from "@pspk/auth";
import { prisma } from "@pspk/db";
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

  const [userProfile, activeEmployeeCount, pendingLeavesCount] = await Promise.all([
    getUserProfile(session.user.id),
    prisma.employee.count({ where: { status: "ACTIVE", deletedAt: null } }),
    prisma.leaveRequest.count({ where: { status: "PENDING" } }),
  ]);

  // Map roles to determine primary view mode
  const roleKeys = userProfile?.roles.map((r) => r.role.key) || [];
  const isSuperAdmin = roleKeys.includes("super_admin");

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
      isSuperAdmin={isSuperAdmin}
    >
      {children}
    </ShellContainer>
  );
}
