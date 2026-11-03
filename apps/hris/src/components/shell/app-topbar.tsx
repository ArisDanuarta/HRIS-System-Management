"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { ChevronRight, ShieldCheck, Menu } from "lucide-react";
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
  onToggleMobile?: () => void;
}

export function AppTopbar({
  user,
  currentRole = "admin_hr",
  isCollapsed,
  isSuperAdmin = false,
  canAccessSysmgmt = false,
  onRoleChange,
  onToggleMobile,
}: AppTopbarProps) {
  const pathname = usePathname();

  // Derive breadcrumb page title from pathname
  const getPageTitle = () => {
    if (pathname === "/" || pathname === "/dashboard") return "Beranda";
    if (pathname.startsWith("/kalender")) return "Kalender Kerja";
    if (pathname.startsWith("/notifikasi")) return "Pusat Notifikasi";
    if (pathname.startsWith("/komunikasi")) return "Komunikasi & Pengumuman";
    if (pathname.startsWith("/karyawan/struktur")) return "Bagan Struktur Organisasi";
    if (pathname.startsWith("/karyawan/ikatan-kerja")) return "Tipe Ikatan Kerja";
    if (pathname.startsWith("/karyawan/organisasi")) return "Struktur Organisasi";
    if (pathname.startsWith("/karyawan")) {
      return currentRole === "manager" ? "Tim Saya" : "Manajemen Karyawan";
    }
    if (pathname.startsWith("/cuti/persetujuan")) return "Persetujuan Cuti";
    if (pathname.startsWith("/absensi/rekap")) {
      return currentRole === "manager" ? "Absensi Tim" : "Kehadiran Organisasi";
    }
    if (pathname.startsWith("/cuti")) return "Cuti Saya";
    if (pathname.startsWith("/absensi")) return "Absensi Saya";
    if (pathname.startsWith("/timesheet/persetujuan")) {
      return currentRole === "manager" ? "Persetujuan Timesheet" : "Timesheet Freelance";
    }
    if (pathname.startsWith("/timesheet")) return "Timesheet Saya";
    if (pathname.startsWith("/payroll")) return "Penggajian (Payroll)";
    if (pathname.startsWith("/slip-gaji")) return "Slip Gaji";
    if (pathname.startsWith("/kinerja")) {
      return currentRole === "staff"
        ? "Kinerja Saya"
        : currentRole === "manager"
          ? "Kinerja Tim"
          : "Kinerja Organisasi";
    }
    if (pathname.startsWith("/profil")) return "Profil Saya";
    return "Portal HRIS";
  };

  return (
    <header
      className={`fixed top-0 right-0 h-16 bg-white/95 backdrop-blur-md z-40 flex items-center justify-between px-3 sm:px-6 lg:px-8 border-b border-[#dee9fc] shadow-xs transition-all duration-300 left-0 ${
        isCollapsed ? "md:left-20" : "md:left-[264px]"
      }`}
    >
      {/* Left: Hamburger Button & Breadcrumbs */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Hamburger Button for Mobile */}
        <button
          type="button"
          onClick={onToggleMobile}
          className="p-2 -ml-1 rounded-xl text-slate-600 hover:text-[#102e50] hover:bg-slate-100/80 md:hidden transition-colors cursor-pointer shrink-0"
          aria-label="Buka menu navigasi"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Breadcrumb Path */}
        <div className="flex items-center gap-1.5 text-xs text-[#5b6675] min-w-0">
          <span className="text-[#5b6675]/80 hover:text-[#102e50] transition-colors hidden sm:inline shrink-0">
            Portal HRIS
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-[#c4c6cf] hidden sm:inline shrink-0" />
          <span className="text-[#102e50] font-bold text-xs sm:text-sm truncate">
            {getPageTitle()}
          </span>
        </div>
      </div>

      {/* Center: Super Admin Perspective Switcher (ONLY for Super Admin - disembunyikan di layar mobile) */}
      {isSuperAdmin && onRoleChange && (
        <div className="hidden md:flex items-center gap-1.5 bg-amber-50/90 border border-amber-300/80 px-2.5 py-1 rounded-lg shadow-xs">
          <div className="flex items-center gap-1 text-[11px] font-bold text-amber-900 mr-1 hidden lg:flex">
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
        {/* App Switcher (HRIS <-> SysMgmt) - Hanya tampil jika akun memiliki hak akses ke Sysmgmt */}
        {canAccessSysmgmt && (
          <>
            <AppSwitcher
              currentApp="hris"
              canAccessSysmgmt={canAccessSysmgmt}
              userRoleName={user.roleName}
            />
            {/* Divider */}
            <div className="h-6 w-px bg-[#dee9fc] hidden sm:block" />
          </>
        )}

        {/* Notification Bell Live Dropdown */}
        <NotificationBell />

        {/* Divider */}
        <div className="h-6 w-px bg-[#dee9fc] hidden sm:block" />

        {/* User Navigation Dropdown */}
        <UserNav user={user} canAccessSysmgmt={canAccessSysmgmt} />
      </div>
    </header>
  );
}
