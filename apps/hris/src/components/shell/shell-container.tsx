"use client";

import React, { useState } from "react";
import { AppSidebar, RoleViewType } from "./app-sidebar";
import { AppTopbar } from "./app-topbar";

export interface ShellContainerProps {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
    roleName?: string;
  };
  initialRole?: RoleViewType;
  employeeCount?: number;
  pendingLeavesCount?: number;
  isSuperAdmin?: boolean;
  canAccessSysmgmt?: boolean;
  children: React.ReactNode;
}

export function ShellContainer({
  user,
  initialRole = "admin_hr",
  employeeCount,
  pendingLeavesCount,
  isSuperAdmin = false,
  canAccessSysmgmt = false,
  children,
}: ShellContainerProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentRole, setCurrentRole] = useState<RoleViewType>(() => {
    if (typeof window !== "undefined" && isSuperAdmin) {
      const saved = sessionStorage.getItem("pspk_superadmin_role_view");
      if (saved === "admin_hr" || saved === "manager" || saved === "staff") {
        return saved;
      }
    }
    return initialRole;
  });

  const handleRoleChange = (newRole: RoleViewType) => {
    if (!isSuperAdmin) return;
    setCurrentRole(newRole);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("pspk_superadmin_role_view", newRole);
      document.cookie = `pspk_role_view=${newRole}; path=/; max-age=86400; SameSite=Lax`;
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#121c2a] flex flex-col antialiased">
      {/* Dynamic Left Sidebar */}
      <AppSidebar
        currentRole={currentRole}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        employeeCount={employeeCount}
        pendingLeavesCount={pendingLeavesCount}
      />

      {/* Top Header with Superadmin Switcher */}
      <AppTopbar
        user={user}
        currentRole={currentRole}
        isCollapsed={isCollapsed}
        isSuperAdmin={isSuperAdmin}
        canAccessSysmgmt={canAccessSysmgmt}
        onRoleChange={isSuperAdmin ? handleRoleChange : undefined}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 transition-all duration-300 pt-16 ${
          isCollapsed ? "pl-20" : "pl-[264px]"
        }`}
      >
        <main className="p-4 sm:p-6 lg:p-8 max-w-[1440px] mx-auto min-h-[calc(100vh-64px)] flex flex-col">
          {children}
        </main>
      </div>
    </div>
  );
}
