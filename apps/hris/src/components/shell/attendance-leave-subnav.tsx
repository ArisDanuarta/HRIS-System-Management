"use client";

import React from "react";
import Link from "next/link";
import {
  Layers,
  Fingerprint,
  Calendar,
  CheckSquare,
  CalendarDays,
  Settings,
} from "lucide-react";

export type AttendanceLeaveTab =
  | "rekap"
  | "absensi"
  | "cuti"
  | "persetujuan"
  | "kalender"
  | "pengaturan";

export interface AttendanceLeaveSubnavProps {
  activeTab: AttendanceLeaveTab;
  isHrOrAdmin?: boolean;
  isManager?: boolean;
  pendingLeavesCount?: number;
  className?: string;
}

export function AttendanceLeaveSubnav({
  activeTab,
  isHrOrAdmin = false,
  isManager = false,
  pendingLeavesCount = 0,
  className = "",
}: AttendanceLeaveSubnavProps) {
  const tabs = [
    {
      id: "rekap" as AttendanceLeaveTab,
      label: "Rekap Kehadiran",
      href: "/absensi/rekap",
      icon: <Layers className="w-3.5 h-3.5" />,
      visible: isHrOrAdmin || isManager,
    },
    {
      id: "absensi" as AttendanceLeaveTab,
      label: "Presensi Saya",
      href: "/absensi",
      icon: <Fingerprint className="w-3.5 h-3.5" />,
      visible: true,
    },
    {
      id: "cuti" as AttendanceLeaveTab,
      label: "Cuti Saya",
      href: "/cuti",
      icon: <Calendar className="w-3.5 h-3.5" />,
      visible: true,
    },
    {
      id: "persetujuan" as AttendanceLeaveTab,
      label: "Persetujuan Cuti",
      href: "/cuti/persetujuan",
      icon: <CheckSquare className="w-3.5 h-3.5" />,
      badge: pendingLeavesCount > 0 ? pendingLeavesCount : undefined,
      visible: isHrOrAdmin || isManager,
    },
    {
      id: "kalender" as AttendanceLeaveTab,
      label: "Kalender Cuti",
      href: "/cuti/kalender",
      icon: <CalendarDays className="w-3.5 h-3.5" />,
      visible: true,
    },
    {
      id: "pengaturan" as AttendanceLeaveTab,
      label: "Pengaturan Kuota & Libur",
      href: "/cuti/pengaturan",
      icon: <Settings className="w-3.5 h-3.5" />,
      visible: isHrOrAdmin,
    },
  ].filter((t) => t.visible);

  return (
    <div
      className={`flex items-center gap-1.5 sm:gap-2 border-b border-gray-200/80 pb-2 overflow-x-auto no-scrollbar scroll-smooth ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <Link
            key={tab.id}
            href={tab.href}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 text-xs rounded-lg transition-all whitespace-nowrap shrink-0 ${
              isActive
                ? "bg-[#102e50] text-white font-bold shadow-xs scale-[1.01]"
                : "text-slate-600 hover:text-[#102e50] hover:bg-slate-100 font-medium"
            }`}
          >
            <span className={isActive ? "text-[#f2af3e]" : "text-slate-400"}>
              {tab.icon}
            </span>
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  isActive
                    ? "bg-[#ba1a1a] text-white"
                    : "bg-[#ba1a1a] text-white"
                }`}
              >
                {tab.badge}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
