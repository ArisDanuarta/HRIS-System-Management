"use client";

import React, { useState, useCallback, useSyncExternalStore } from "react";
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

/**
 * Memeriksa apakah viewport saat ini berada dalam rentang tablet semua ukuran:
 * - Layar standar via breakpoint CSS/DevTools (lebar 768px hingga < 1280px)
 * - Tablet fisik/touch devices (iPad Mini 768px hingga iPad Pro 12.9" landscape 1366px)
 */
function isTabletViewport(width?: number): boolean {
  if (typeof window === "undefined") return false;
  const currentWidth = width ?? window.innerWidth;

  const isTouchDevice =
    window.matchMedia("(pointer: coarse)").matches ||
    (typeof navigator !== "undefined" && navigator.maxTouchPoints > 0);

  // Tablet touch devices (iPad Mini 768px hingga iPad Pro 12.9" landscape 1366px)
  if (isTouchDevice && currentWidth >= 768 && currentWidth <= 1366) {
    return true;
  }

  // Tablet standar via breakpoint CSS/DevTools (768px hingga < 1280px)
  return currentWidth >= 768 && currentWidth < 1280;
}

function subscribeResize(callback: () => void) {
  window.addEventListener("resize", callback);
  window.addEventListener("orientationchange", callback);
  return () => {
    window.removeEventListener("resize", callback);
    window.removeEventListener("orientationchange", callback);
  };
}

const getTabletSnapshot = () => isTabletViewport();
const getServerTabletSnapshot = () => false;

const emptySubscribe = () => () => {};
const getMountedSnapshot = () => true;
const getServerMountedSnapshot = () => false;

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
  const isTablet = useSyncExternalStore(subscribeResize, getTabletSnapshot, getServerTabletSnapshot);
  const isMounted = useSyncExternalStore(emptySubscribe, getMountedSnapshot, getServerMountedSnapshot);

  const [userOverride, setUserOverride] = useState<boolean | null>(null);
  const [prevIsTablet, setPrevIsTablet] = useState(isTablet);

  // Jika bertransisi antar mode (tablet <-> desktop), reset override agar default responsif aktif
  if (prevIsTablet !== isTablet) {
    setPrevIsTablet(isTablet);
    setUserOverride(null);
  }

  // State akhir isCollapsed:
  // - Jika pengguna melakukan interaksi toggle manual, gunakan userOverride
  // - Default mode tablet (semua ukuran): minimal / rail (true)
  // - Default mode desktop: extended (false)
  const isCollapsed = userOverride !== null ? userOverride : isTablet;

  const handleToggleCollapse = useCallback(() => {
    setUserOverride((current) => {
      const effectiveCurrent = current !== null ? current : isTablet;
      return !effectiveCurrent;
    });
  }, [isTablet]);

  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const handleCloseMobile = useCallback(() => {
    setMobileNavOpen(false);
  }, []);

  const handleToggleMobile = useCallback(() => {
    setMobileNavOpen((prev) => !prev);
  }, []);

  // State peran tampilan (ditentukan secara deterministik dari server cookie via initialRole)
  const [currentRole, setCurrentRole] = useState<RoleViewType>(initialRole);

  const handleRoleChange = (newRole: RoleViewType) => {
    if (!isSuperAdmin) return;
    setCurrentRole(newRole);
    if (typeof window !== "undefined") {
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
        isMounted={isMounted}
        onToggleCollapse={handleToggleCollapse}
        employeeCount={employeeCount}
        pendingLeavesCount={pendingLeavesCount}
        remainingLeaveDays={remainingLeaveDays}
        pendingTimesheetsCount={pendingTimesheetsCount}
        isHourlyEmployee={isHourlyEmployee}
        moduleFlags={moduleFlags}
        mobileOpen={mobileNavOpen}
        onCloseMobile={handleCloseMobile}
      />

      {/* Top Header with Superadmin Switcher & Mobile Hamburger Toggle */}
      <AppTopbar
        user={user}
        currentRole={currentRole}
        isCollapsed={isCollapsed}
        isMounted={isMounted}
        isSuperAdmin={isSuperAdmin}
        canAccessSysmgmt={canAccessSysmgmt}
        onRoleChange={isSuperAdmin ? handleRoleChange : undefined}
        onToggleMobile={handleToggleMobile}
      />

      {/* Main Content Area - Adaptif Mobile pl-0, Tablet & Desktop adaptif pl-20 / pl-264 */}
      <div
        className={`flex-1 w-full min-w-0 max-w-full overflow-x-hidden ${
          isMounted ? "transition-all duration-300" : ""
        } pt-[calc(4rem+env(safe-area-inset-top,0px))] md:pt-16 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-6 ${
          isCollapsed ? "md:pl-20 pl-0" : "pl-0 md:pl-[264px]"
        }`}
      >
        <main className="p-3.5 sm:p-6 lg:p-8 max-w-[1440px] w-full min-w-0 mx-auto min-h-[calc(100vh-4rem-env(safe-area-inset-top,0px))] md:min-h-[calc(100vh-64px)] flex flex-col">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Khusus Layar Ponsel < 768px) */}
      <MobileBottomNav pendingLeavesCount={pendingLeavesCount} currentRole={currentRole} />
    </div>
  );
}
