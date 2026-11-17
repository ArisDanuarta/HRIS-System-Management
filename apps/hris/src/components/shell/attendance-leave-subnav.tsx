"use client";

import React from "react";
import Link from "next/link";
import {
  Layers,
  Fingerprint,
  Calendar,
  ClipboardList,
  Settings,
  ArrowUpRight,
} from "lucide-react";

export type AttendanceLeaveTab =
  | "rekap"
  | "persetujuan"
  | "pengaturan"
  | "absensi"
  | "cuti";

export interface AttendanceLeaveSubnavProps {
  activeTab: AttendanceLeaveTab;
  isHrOrAdmin?: boolean;
  isManager?: boolean;
  pendingLeavesCount?: number;
  className?: string;
  mode?: "management" | "self";
}

export function AttendanceLeaveSubnav({
  activeTab,
  isHrOrAdmin = false,
  isManager = false,
  pendingLeavesCount = 0,
  className = "",
  mode,
}: AttendanceLeaveSubnavProps) {
  // Tentukan mode navigasi:
  // - "management" untuk halaman HR: Absensi Karyawan (Rekap Kehadiran, Permohonan Cuti, Shortcut Pengaturan Cuti)
  // - "self" untuk halaman mandiri pegawai: Layanan Mandiri (Presensi Saya, Cuti Saya)
  const effectiveMode =
    mode ||
    (activeTab === "rekap" || activeTab === "persetujuan" || activeTab === "pengaturan"
      ? "management"
      : "self");

  const managementTabs = [
    {
      id: "rekap" as AttendanceLeaveTab,
      label: "Rekap Kehadiran",
      href: "/absensi/rekap",
      icon: <Layers className="w-4 h-4 shrink-0" />,
      badge: undefined,
      isShortcut: false,
      visible: isHrOrAdmin || isManager,
    },
    {
      id: "persetujuan" as AttendanceLeaveTab,
      label: "Permohonan Cuti",
      href: "/cuti/persetujuan",
      icon: <ClipboardList className="w-4 h-4 shrink-0" />,
      badge: pendingLeavesCount > 0 ? pendingLeavesCount : undefined,
      isShortcut: false,
      visible: isHrOrAdmin || isManager,
    },
    {
      id: "pengaturan" as AttendanceLeaveTab,
      label: "Pengaturan Cuti",
      href: "/tata-kelola?tab=jenis-cuti",
      icon: <Settings className="w-4 h-4 shrink-0" />,
      badge: undefined,
      isShortcut: true,
      visible: isHrOrAdmin,
    },
  ];

  const selfTabs = [
    {
      id: "absensi" as AttendanceLeaveTab,
      label: "Presensi Saya",
      href: "/absensi",
      icon: <Fingerprint className="w-4 h-4 shrink-0" />,
      badge: undefined,
      isShortcut: false,
      visible: true,
    },
    {
      id: "cuti" as AttendanceLeaveTab,
      label: "Cuti Saya",
      href: "/cuti",
      icon: <Calendar className="w-4 h-4 shrink-0" />,
      badge: undefined,
      isShortcut: false,
      visible: true,
    },
  ];

  const tabs = (effectiveMode === "management" ? managementTabs : selfTabs).filter(
    (t) => t.visible,
  );

  return (
    <div
      className={`w-full min-w-0 max-w-full flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200/90 shadow-2xs overflow-x-auto scrollbar-none no-scrollbar scroll-smooth [overscroll-behavior-x:contain] ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <Link
            key={tab.id}
            href={tab.href}
            title={tab.isShortcut ? "Buka Pengaturan Master & Kuota Cuti di Tata Kelola HR" : undefined}
            className={`group inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 text-xs rounded-xl transition-all whitespace-nowrap shrink-0 ${
              isActive
                ? "bg-[#102e50] text-white font-bold shadow-xs"
                : "text-slate-600 hover:text-[#102e50] hover:bg-slate-100/70 font-semibold"
            }`}
          >
            <span className={isActive ? "text-[#f2af3e]" : "text-slate-400 group-hover:text-[#102e50] transition-colors"}>
              {tab.icon}
            </span>
            <span>{tab.label}</span>

            {/* Badge Counter */}
            {tab.badge !== undefined && (
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none tabular-nums ${
                  isActive ? "bg-[#f2af3e] text-[#102e50]" : "bg-[#a8281c] text-white shadow-2xs"
                }`}
              >
                {tab.badge}
              </span>
            )}

            {/* Shortcut External Indicator */}
            {tab.isShortcut && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-slate-400 group-hover:text-[#102e50] bg-slate-100 group-hover:bg-slate-200/60 px-1.5 py-0.5 rounded border border-slate-200/60 transition-colors ml-0.5">
                <span>Tata Kelola</span>
                <ArrowUpRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}