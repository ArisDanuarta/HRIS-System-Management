"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { Bell, ChevronRight, Eye } from "lucide-react";
import { AppSwitcher } from "./app-switcher";
import { UserNav } from "./user-nav";
import { RoleViewType } from "./app-sidebar";

export interface AppTopbarProps {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
    roleName?: string;
  };
  currentRole: RoleViewType;
  onRoleChange: (role: RoleViewType) => void;
  isCollapsed: boolean;
  hrisUrl?: string;
  sysmgmtUrl?: string;
}

export function AppTopbar({
  user,
  currentRole,
  onRoleChange,
  isCollapsed,
  hrisUrl = "http://localhost:3001",
  sysmgmtUrl = "http://localhost:3002",
}: AppTopbarProps) {
  const pathname = usePathname();
  const [showNotificationList, setShowNotificationList] = useState(false);

  // Derive breadcrumb page title from pathname
  const getPageTitle = () => {
    if (pathname === "/" || pathname === "/dashboard") {
      if (currentRole === "admin_hr") return "Manajemen Karyawan";
      if (currentRole === "manager") return "Persetujuan Cuti Tim";
      return "Profil Saya & Portofolio";
    }
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
      {/* Left: Breadcrumbs & Role Perspective Switcher */}
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

        {/* Live Role View Previewer Toggle (Quick switcher for testing perspectives) */}
        <div className="hidden xl:flex items-center gap-1.5 pl-3 border-l border-[#dee9fc]">
          <div className="flex items-center gap-1 text-[11px] text-[#74777f] font-medium mr-1">
            <Eye className="w-3 h-3 text-[#f2af3e]" />
            <span>Tampilan:</span>
          </div>
          <button
            type="button"
            onClick={() => onRoleChange("admin_hr")}
            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
              currentRole === "admin_hr"
                ? "bg-[#102e50] text-white shadow-xs"
                : "bg-[#eff4ff] text-[#43474e] hover:bg-[#dee9fc]"
            }`}
          >
            Admin HR
          </button>
          <button
            type="button"
            onClick={() => onRoleChange("manager")}
            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
              currentRole === "manager"
                ? "bg-[#102e50] text-white shadow-xs"
                : "bg-[#eff4ff] text-[#43474e] hover:bg-[#dee9fc]"
            }`}
          >
            Manajer
          </button>
          <button
            type="button"
            onClick={() => onRoleChange("staff")}
            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
              currentRole === "staff"
                ? "bg-[#102e50] text-white shadow-xs"
                : "bg-[#eff4ff] text-[#43474e] hover:bg-[#dee9fc]"
            }`}
          >
            Staff
          </button>
        </div>
      </div>

      {/* Right: Actions, AppSwitcher, Notifications & UserNav */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* App Switcher (HRIS <-> SysMgmt) */}
        <AppSwitcher currentApp="hris" hrisUrl={hrisUrl} sysmgmtUrl={sysmgmtUrl} />

        {/* Notification Bell */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotificationList(!showNotificationList)}
            aria-label="Notifikasi sistem"
            className="relative p-2 rounded-lg text-[#43474e] hover:text-[#102e50] hover:bg-[#eff4ff] transition-colors cursor-pointer"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#ba1a1a] text-white text-[10px] font-bold ring-2 ring-white">
              3
            </span>
          </button>

          {showNotificationList && (
            <div className="absolute right-0 mt-2 w-72 rounded-xl bg-white shadow-xl border border-[#dee9fc] p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between px-2 py-1.5 border-b border-[#dee9fc]">
                <span className="text-xs font-bold text-[#102e50]">Pemberitahuan</span>
                <span className="text-[10px] text-[#f2af3e] font-semibold cursor-pointer hover:underline">
                  Tandai Dibaca
                </span>
              </div>
              <div className="py-1 flex flex-col gap-1 text-xs">
                <div className="p-2 rounded-lg hover:bg-[#eff4ff] transition-colors cursor-pointer">
                  <p className="font-semibold text-[#121c2a] text-[11px] leading-tight">
                    Pengajuan Cuti: Siti Rahma
                  </p>
                  <p className="text-[10px] text-[#74777f] mt-0.5">
                    Membutuhkan persetujuan manajerial Anda • 2 jam lalu
                  </p>
                </div>
                <div className="p-2 rounded-lg hover:bg-[#eff4ff] transition-colors cursor-pointer">
                  <p className="font-semibold text-[#121c2a] text-[11px] leading-tight">
                    Pengingat Kontrak Riset
                  </p>
                  <p className="text-[10px] text-[#74777f] mt-0.5">
                    2 kontrak fixed-term berakhir dalam ≤ 30 hari
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-[#dee9fc] hidden sm:block" />

        {/* User Navigation Dropdown */}
        <UserNav user={user} />
      </div>
    </header>
  );
}
