import React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession, getUserProfile } from "@pspk/auth";
import { SysmgmtNavbar } from "@/components/shell/sysmgmt-navbar";

export const dynamic = "force-dynamic";

export default async function SysmgmtProtectedLayout({
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
  const roleKeys = userProfile?.roles.map((r) => r.role.key) || [];

  const isSuperAdmin = roleKeys.includes("super_admin");
  const isAdminIt = roleKeys.includes("admin_it");

  let roleDisplayName = "Staff";
  if (isSuperAdmin) {
    roleDisplayName = "Super Admin";
  } else if (isAdminIt) {
    roleDisplayName = "Admin IT";
  } else if (roleKeys.includes("admin_hr")) {
    roleDisplayName = "Admin HR";
  } else if (roleKeys.includes("manager")) {
    roleDisplayName = "Manajer";
  }

  const userData = {
    id: session.user.id,
    name: userProfile?.employee?.fullName || session.user.name || "Administrator PSPK",
    email: session.user.email,
    roleName: roleDisplayName,
    roleKey: roleKeys[0] || "staff",
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      <SysmgmtNavbar user={userData} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
