"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Fingerprint, CalendarCheck, User } from "lucide-react";

export interface MobileBottomNavProps {
  pendingLeavesCount?: number;
  currentRole?: string;
}

export function MobileBottomNav({ pendingLeavesCount = 0, currentRole }: MobileBottomNavProps) {
  const pathname = usePathname();

  const navItems = [
    {
      href: "/dashboard",
      label: "Beranda",
      icon: LayoutDashboard,
      isActive: pathname === "/" || pathname === "/dashboard",
    },
    {
      href: "/absensi",
      label: "Presensi",
      icon: Fingerprint,
      isActive: pathname.startsWith("/absensi"),
    },
    {
      href: "/cuti",
      label: "Cuti",
      icon: CalendarCheck,
      isActive: pathname.startsWith("/cuti"),
      badge: currentRole !== "staff" && pendingLeavesCount > 0 ? pendingLeavesCount : undefined,
    },
    {
      href: "/profil",
      label: "Profil",
      icon: User,
      isActive: pathname.startsWith("/profil"),
    },
  ];

  return (
    <nav
      aria-label="Navigasi Bawah Mobile"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#dee9fc] shadow-[0_-2px_10px_rgba(16,46,80,0.06)] md:hidden px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1"
    >
      <div className="grid grid-cols-4 items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all relative ${
                item.isActive
                  ? "text-[#102e50] font-bold"
                  : "text-[#5b6675] hover:text-[#102e50] font-medium"
              }`}
            >
              <div className="relative">
                <div
                  className={`w-9 h-7 flex items-center justify-center rounded-lg transition-colors ${
                    item.isActive ? "bg-[#102e50]/10 text-[#102e50]" : "text-[#5b6675]"
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#a8281c] text-white text-[9px] font-bold px-1.5 min-w-[16px] h-4 rounded-full flex items-center justify-center shadow-xs">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-full">
                {item.label}
              </span>
              {item.isActive && (
                <span className="w-1 h-1 rounded-full bg-[#f2af3e] mt-0.5" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
