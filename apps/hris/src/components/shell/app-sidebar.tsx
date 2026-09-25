"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  Receipt,
  TrendingUp,
  CheckSquare,
  CalendarClock,
  LineChart,
  User,
  Fingerprint,
  Calendar,
  PanelLeftClose,
  PanelLeftOpen,
  Building2,
} from "lucide-react";

export type RoleViewType = "admin_hr" | "manager" | "staff";

export interface AppSidebarProps {
  currentRole: RoleViewType;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  employeeCount?: number;
  pendingLeavesCount?: number;
  remainingLeaveDays?: number;
}

export function AppSidebar({
  currentRole,
  isCollapsed,
  onToggleCollapse,
  employeeCount = 148,
  pendingLeavesCount = 3,
  remainingLeaveDays = 8,
}: AppSidebarProps) {
  const pathname = usePathname();

  const isNavActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/" || pathname === "/dashboard";
    }
    if (href === "/karyawan") {
      return (
        pathname === "/karyawan" ||
        (pathname.startsWith("/karyawan/") && !pathname.startsWith("/karyawan/organisasi"))
      );
    }
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-[#102e50] text-white z-50 flex flex-col justify-between select-none shadow-[0_1px_8px_rgba(16,46,80,0.15)] transition-all duration-300 ${
        isCollapsed ? "w-20" : "w-[264px]"
      }`}
      style={{ backgroundColor: "#102e50" }}
    >
      <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        {/* Brand Header */}
        <div className="h-16 px-3.5 flex items-center justify-center bg-[#0c233d]/40 border-b border-white/10">
          {isCollapsed ? (
            <div className="w-10 h-10 rounded-xl bg-white p-1.5 shadow-sm border border-white/20 flex items-center justify-center shrink-0">
              <Image
                alt="Logo PSPK"
                className="w-full h-full object-contain"
                src="/images/logo_pspk_circle_trimmed.png"
                width={36}
                height={36}
                priority
              />
            </div>
          ) : (
            <div className="h-11 px-3 py-1 bg-white rounded-xl shadow-xs border border-white/15 flex items-center justify-between w-full transition-all">
              <Image
                alt="Pusat Studi Pendidikan dan Kebijakan"
                className="h-7 w-auto object-contain"
                src="/images/logo_pspk_horizontal_trimmed.png"
                width={170}
                height={28}
                priority
              />
              <span className="text-[9px] font-bold tracking-wider text-[#805600] bg-[#feba48]/25 px-1.5 py-0.5 rounded uppercase">
                HRIS
              </span>
            </div>
          )}
        </div>

        {/* ADMIN HR VIEW NAVIGATION */}
        {currentRole === "admin_hr" && (
          <div className="py-3">
            {!isCollapsed && (
              <div className="px-5 py-2">
                <span className="text-[11px] uppercase tracking-wider text-[#adc8f2]/80 font-bold">
                  Navigasi Utama
                </span>
              </div>
            )}
            <nav className="flex flex-col gap-1 px-2.5">
              <NavItem
                href="/dashboard"
                label="Beranda"
                icon={<LayoutDashboard className="w-5 h-5 shrink-0" />}
                isActive={isNavActive("/dashboard")}
                isCollapsed={isCollapsed}
              />
              <NavItem
                href="/karyawan"
                label="Manajemen Karyawan"
                icon={<Users className="w-5 h-5 shrink-0" />}
                isActive={isNavActive("/karyawan")}
                isCollapsed={isCollapsed}
                badge={
                  <span className="bg-[#feba48] text-[#805600] text-[10px] px-2 py-0.5 rounded font-bold">
                    {employeeCount}
                  </span>
                }
              />
              <NavItem
                href="/karyawan/organisasi"
                label="Struktur Organisasi"
                icon={<Building2 className="w-5 h-5 shrink-0" />}
                isActive={isNavActive("/karyawan/organisasi")}
                isCollapsed={isCollapsed}
              />
              <NavItem
                href="/absensi/rekap"
                label="Kehadiran & Cuti"
                icon={<CalendarCheck className="w-5 h-5 shrink-0" />}
                isActive={pathname.startsWith("/cuti") || pathname.startsWith("/absensi")}
                isCollapsed={isCollapsed}
                badge={
                  pendingLeavesCount > 0 ? (
                    <span className="bg-[#ba1a1a] text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                      {pendingLeavesCount}
                    </span>
                  ) : undefined
                }
              />
              <NavItem
                href="/payroll"
                label="Penggajian (Payroll)"
                icon={<Receipt className="w-5 h-5 shrink-0" />}
                isActive={isNavActive("/payroll")}
                isCollapsed={isCollapsed}
              />
              <NavItem
                href="/kinerja"
                label="Kinerja & Riset"
                icon={<TrendingUp className="w-5 h-5 shrink-0" />}
                isActive={isNavActive("/kinerja")}
                isCollapsed={isCollapsed}
              />
            </nav>
          </div>
        )}

        {/* MANAGER VIEW NAVIGATION */}
        {currentRole === "manager" && (
          <div className="py-3">
            {!isCollapsed && (
              <div className="px-5 py-2 flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider text-[#adc8f2]/80 font-bold">
                  Tim & Approval
                </span>
                <span className="bg-[#feba48]/20 text-[#ffddb0] text-[10px] px-1.5 py-0.5 rounded font-bold">
                  LEAD
                </span>
              </div>
            )}
            <nav className="flex flex-col gap-1 px-2.5">
              <NavItem
                href="/dashboard"
                label="Beranda"
                icon={<LayoutDashboard className="w-5 h-5 shrink-0" />}
                isActive={isNavActive("/dashboard")}
                isCollapsed={isCollapsed}
              />
              <NavItem
                href="/karyawan?view=team"
                label="Tim Saya"
                icon={<Users className="w-5 h-5 shrink-0" />}
                isActive={isNavActive("/karyawan")}
                isCollapsed={isCollapsed}
              />
              <NavItem
                href="/cuti/persetujuan"
                label="Persetujuan Cuti"
                icon={<CheckSquare className="w-5 h-5 shrink-0" />}
                isActive={isNavActive("/cuti/persetujuan")}
                isCollapsed={isCollapsed}
                badge={
                  <span className="bg-[#feba48] text-[#102e50] text-[11px] px-2 py-0.5 rounded-full font-bold shadow-xs">
                    {pendingLeavesCount}
                  </span>
                }
              />
              <NavItem
                href="/absensi/rekap"
                label="Absensi Tim"
                icon={<CalendarClock className="w-5 h-5 shrink-0" />}
                isActive={isNavActive("/absensi/rekap")}
                isCollapsed={isCollapsed}
              />
              <NavItem
                href="/kinerja"
                label="Kinerja Tim"
                icon={<LineChart className="w-5 h-5 shrink-0" />}
                isActive={isNavActive("/kinerja")}
                isCollapsed={isCollapsed}
              />
            </nav>

            <div className="my-3 mx-4 border-t border-white/10" />

            {!isCollapsed && (
              <div className="px-5 pb-1">
                <span className="text-[11px] uppercase tracking-wider text-[#adc8f2]/80 font-bold">
                  Menu Personal
                </span>
              </div>
            )}
            <nav className="flex flex-col gap-1 px-2.5">
              <NavItem
                href="/profil"
                label="Profil Saya"
                icon={<User className="w-5 h-5 shrink-0" />}
                isActive={isNavActive("/profil")}
                isCollapsed={isCollapsed}
              />
              <NavItem
                href="/absensi"
                label="Absensi Saya"
                icon={<Fingerprint className="w-5 h-5 shrink-0" />}
                isActive={isNavActive("/absensi")}
                isCollapsed={isCollapsed}
              />
              <NavItem
                href="/cuti"
                label="Cuti Saya"
                icon={<Calendar className="w-5 h-5 shrink-0" />}
                isActive={isNavActive("/cuti") && !isNavActive("/cuti/persetujuan")}
                isCollapsed={isCollapsed}
              />
              <NavItem
                href="/slip-gaji"
                label="Slip Gaji"
                icon={<Receipt className="w-5 h-5 shrink-0" />}
                isActive={isNavActive("/slip-gaji")}
                isCollapsed={isCollapsed}
              />
            </nav>
          </div>
        )}

        {/* STAFF VIEW NAVIGATION */}
        {currentRole === "staff" && (
          <div className="py-3">
            {!isCollapsed && (
              <div className="px-5 py-2">
                <span className="text-[11px] uppercase tracking-wider text-[#adc8f2]/80 font-bold">
                  Menu Karyawan
                </span>
              </div>
            )}
            <nav className="flex flex-col gap-1 px-2.5">
              <NavItem
                href="/dashboard"
                label="Beranda"
                icon={<LayoutDashboard className="w-5 h-5 shrink-0" />}
                isActive={isNavActive("/dashboard")}
                isCollapsed={isCollapsed}
              />
              <NavItem
                href="/profil"
                label="Profil Saya"
                icon={<User className="w-5 h-5 shrink-0" />}
                isActive={isNavActive("/profil")}
                isCollapsed={isCollapsed}
              />
              <NavItem
                href="/absensi"
                label="Absensi Saya"
                icon={<Fingerprint className="w-5 h-5 shrink-0" />}
                isActive={isNavActive("/absensi")}
                isCollapsed={isCollapsed}
              />
              <NavItem
                href="/cuti"
                label="Cuti Saya"
                icon={<Calendar className="w-5 h-5 shrink-0" />}
                isActive={isNavActive("/cuti")}
                isCollapsed={isCollapsed}
                badge={
                  <span className="bg-[#0c233d] text-[#ffddb0] text-[11px] px-2 py-0.5 rounded font-semibold">
                    {remainingLeaveDays} Hari
                  </span>
                }
              />
              <NavItem
                href="/slip-gaji"
                label="Slip Gaji"
                icon={<Receipt className="w-5 h-5 shrink-0" />}
                isActive={isNavActive("/slip-gaji")}
                isCollapsed={isCollapsed}
              />
              <NavItem
                href="/kinerja"
                label="Kinerja Saya"
                icon={<LineChart className="w-5 h-5 shrink-0" />}
                isActive={isNavActive("/kinerja")}
                isCollapsed={isCollapsed}
              />
            </nav>
          </div>
        )}
      </div>

      {/* Sidebar Footer */}
      <div className="p-3 bg-[#0c233d]/60 border-t border-white/10 flex items-center justify-between text-[#adc8f2] text-xs">
        {!isCollapsed && (
          <span className="text-[11px] opacity-80 truncate">v1.0.0 • PSPK Internal</span>
        )}
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={isCollapsed ? "Perluas Sidebar" : "Perkecil Sidebar"}
          className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors cursor-pointer ml-auto"
          title={isCollapsed ? "Perluas Sidebar" : "Perkecil Sidebar"}
        >
          {isCollapsed ? (
            <PanelLeftOpen className="w-4 h-4" />
          ) : (
            <PanelLeftClose className="w-4 h-4" />
          )}
        </button>
      </div>
    </aside>
  );
}

interface NavItemProps {
  href: string;
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  isCollapsed: boolean;
  badge?: React.ReactNode;
}

function NavItem({ href, label, icon, isActive, isCollapsed, badge }: NavItemProps) {
  return (
    <Link
      href={href}
      className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-xs sm:text-[13px] group ${
        isActive
          ? "bg-[#feba48]/20 text-white border-l-4 border-[#f2af3e] font-semibold"
          : "text-[#adc8f2] hover:bg-white/10 hover:text-white font-medium"
      }`}
      title={isCollapsed ? label : undefined}
    >
      <div className="flex items-center gap-3 overflow-hidden">
        <span
          className={`transition-colors ${
            isActive ? "text-[#feba48]" : "text-[#adc8f2] group-hover:text-white"
          }`}
        >
          {icon}
        </span>
        {!isCollapsed && <span className="truncate">{label}</span>}
      </div>
      {!isCollapsed && badge && <div className="shrink-0">{badge}</div>}
    </Link>
  );
}
