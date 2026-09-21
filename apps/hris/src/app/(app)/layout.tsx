import React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession, getUserProfile } from "@pspk/auth";
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

  const userProfile = await getUserProfile(session.user.id);

  // Map roles to determine primary view mode
  const roleKeys = userProfile?.roles.map((r) => r.role.key) || [];
  let initialRole: RoleViewType = "staff";
  let roleDisplayName = "Staff";

  if (roleKeys.includes("super_admin") || roleKeys.includes("admin_hr")) {
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
    <ShellContainer user={userData} initialRole={initialRole}>
      {children}
    </ShellContainer>
  );
}
