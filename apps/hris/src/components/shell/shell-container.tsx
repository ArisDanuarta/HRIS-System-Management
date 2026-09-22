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
  children: React.ReactNode;
}

export function ShellContainer({
  user,
  initialRole = "admin_hr",
  employeeCount,
  pendingLeavesCount,
  children,
}: ShellContainerProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const currentRole = initialRole;

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

      {/* Top Header */}
      <AppTopbar
        user={user}
        currentRole={currentRole}
        isCollapsed={isCollapsed}
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
