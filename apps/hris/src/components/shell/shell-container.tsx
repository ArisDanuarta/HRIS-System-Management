"use client";

import React, { useState } from "react";
import { ModuleFlags } from "@pspk/db";
import { AppSidebar, RoleViewType } from "./app-sidebar";
import { AppTopbar } from "./app-topbar";
import { MobileBottomNav } from "./mobile-bottom-nav";

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
  remainingLeaveDays?: number;
  pendingTimesheetsCount?: number;
  isHourlyEmployee?: boolean;
  isSuperAdmin?: boolean;
  canAccessSysmgmt?: boolean;
  moduleFlags?: ModuleFlags;
  children: React.ReactNode;
}

export function ShellContainer({
  user,
  initialRole = "admin_hr",
  employeeCount,
  pendingLeavesCount,
  remainingLeaveDays,
  pendingTimesheetsCount = 0,
  isHourlyEmployee = false,
  isSuperAdmin = false,
  canAccessSysmgmt = false,
  moduleFlags,
  children,
}: ShellContainerProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
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
      {/* Dynamic Left Sidebar (Desktop Static & Mobile Slide-Over Drawer) */}
      <AppSidebar
        currentRole={currentRole}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        employeeCount={employeeCount}
        pendingLeavesCount={pendingLeavesCount}
        remainingLeaveDays={remainingLeaveDays}
        pendingTimesheetsCount={pendingTimesheetsCount}
        isHourlyEmployee={isHourlyEmployee}
        moduleFlags={moduleFlags}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />

      {/* Top Header with Superadmin Switcher & Mobile Hamburger Toggle */}
      <AppTopbar
        user={user}
        currentRole={currentRole}
        isCollapsed={isCollapsed}
        isSuperAdmin={isSuperAdmin}
        canAccessSysmgmt={canAccessSysmgmt}
        onRoleChange={isSuperAdmin ? handleRoleChange : undefined}
        onToggleMobile={() => setMobileNavOpen((prev) => !prev)}
      />

      {/* Main Content Area - Adaptif Mobile pl-0, Desktop pl-20/pl-264 */}
      <div
        className={`flex-1 transition-all duration-300 pt-16 pb-20 md:pb-6 ${
          isCollapsed ? "md:pl-20 pl-0" : "md:pl-[264px] pl-0"
        }`}
      >
        <main className="p-3.5 sm:p-6 lg:p-8 max-w-[1440px] mx-auto min-h-[calc(100vh-64px)] flex flex-col">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Khusus Layar Ponsel < 768px) */}
      <MobileBottomNav pendingLeavesCount={pendingLeavesCount} currentRole={currentRole} />
    </div>
  );
}
