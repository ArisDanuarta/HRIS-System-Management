"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { ChevronRight, ShieldCheck } from "lucide-react";
import { AppSwitcher } from "@pspk/ui";
import { UserNav } from "./user-nav";
import { NotificationBell } from "./notification-bell";
import { RoleViewType } from "./app-sidebar";

export interface AppTopbarProps {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
    roleName?: string;
  };
  currentRole?: RoleViewType;
  isCollapsed: boolean;
  isSuperAdmin?: boolean;
  canAccessSysmgmt?: boolean;
  onRoleChange?: (role: RoleViewType) => void;
}

export function AppTopbar({
  user,
  currentRole = "admin_hr",
  isCollapsed,
  isSuperAdmin = false,
  canAccessSysmgmt = false,
  onRoleChange,
}: AppTopbarProps) {
  const pathname = usePathname();

  // Derive breadcrumb page title from pathname
  const getPageTitle = () => {
    if (pathname === "/" || pathname === "/dashboard") {
      if (currentRole === "admin_hr") return "Manajemen Karyawan";
      if (currentRole === "manager") return "Persetujuan Cuti Tim";
      return "Profil Saya & Portofolio";
    }
    if (pathname.startsWith("/notifikasi")) return "Pusat Notifikasi";
    if (pathname.startsWith("/karyawan")) return "Manajemen Karyawan";
    if (pathname.startsWith("/cuti/persetujuan")) return "Persetujuan Cuti Tim";
    if (pathname.startsWith("/cuti")) return "Kehadiran & Cuti";
    if (pathname.startsWith("/absensi")) return "Presensi & Kehadiran";
    if (pathname.startsWith("/payroll")) return "Penggajian (Payroll)";
    if (pathname.startsWith("/slip-gaji")) return "Slip Gaji";
    if (pathname.startsWith("/kinerja")) return "Kinerja & Riset";
    if (pathname.startsWith("/profil")) return "Profil Saya";
    return "Portal HRIS";
  };

  return (
    <header
      className={`fixed top-0 right-0 h-16 bg-white/95 backdrop-blur-md z-40 flex items-center justify-between px-4 sm:px-6 lg:px-8 border-b border-[#dee9fc] shadow-xs transition-all duration-300 ${
        isCollapsed ? "left-20" : "left-[264px]"
      }`}
    >
      {/* Left: Breadcrumbs */}
      <div className="flex items-center gap-3">
        {/* Breadcrumb Path */}
        <div className="flex items-center gap-1.5 text-xs text-[#5b6675]">
          <span className="text-[#5b6675]/80 hover:text-[#102e50] transition-colors">
            Portal HRIS
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-[#c4c6cf]" />
          <span className="text-[#102e50] font-bold text-xs sm:text-sm">
            {getPageTitle()}
          </span>
        </div>
      </div>

      {/* Center: Super Admin Perspective Switcher (ONLY for Super Admin) */}
      {isSuperAdmin && onRoleChange && (
        <div className="flex items-center gap-1.5 bg-amber-50/90 border border-amber-300/80 px-2.5 py-1 rounded-lg shadow-xs">
          <div className="flex items-center gap-1 text-[11px] font-bold text-amber-900 mr-1 hidden sm:flex">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
            <span>Mode Pratinjau:</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onRoleChange("admin_hr")}
              title="Pratinjau modul & menu Admin HR"
              className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                currentRole === "admin_hr"
                  ? "bg-[#102e50] text-white shadow-xs"
                  : "text-slate-600 hover:text-[#102e50] hover:bg-amber-200/50"
              }`}
            >
              Admin HR
            </button>
            <button
              type="button"
              onClick={() => onRoleChange("manager")}
              title="Pratinjau modul & menu Manajer"
              className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                currentRole === "manager"
                  ? "bg-[#102e50] text-white shadow-xs"
                  : "text-slate-600 hover:text-[#102e50] hover:bg-amber-200/50"
              }`}
            >
              Manajer
            </button>
            <button
              type="button"
              onClick={() => onRoleChange("staff")}
              title="Pratinjau modul & menu Staf Karyawan"
              className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                currentRole === "staff"
                  ? "bg-[#102e50] text-white shadow-xs"
                  : "text-slate-600 hover:text-[#102e50] hover:bg-amber-200/50"
              }`}
            >
              Staf
            </button>
          </div>
        </div>
      )}

      {/* Right: AppSwitcher, Notifications & UserNav */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* App Switcher (HRIS <-> SysMgmt) */}
        <AppSwitcher
          currentApp="hris"
          canAccessSysmgmt={canAccessSysmgmt}
          userRoleName={user.roleName}
        />

        {/* Divider */}
        <div className="h-6 w-px bg-[#dee9fc] hidden sm:block" />

        {/* Notification Bell Live Dropdown */}
        <NotificationBell />

        {/* Divider */}
        <div className="h-6 w-px bg-[#dee9fc] hidden sm:block" />

        {/* User Navigation Dropdown */}
        <UserNav user={user} />
      </div>
    </header>
  );
}
