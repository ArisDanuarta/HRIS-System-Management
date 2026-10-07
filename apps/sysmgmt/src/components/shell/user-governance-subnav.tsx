"use client";

import React from "react";
import Link from "next/link";
import { Users, ShieldCheck, Sliders } from "lucide-react";

export type UserGovernanceTab = "users" | "roles" | "modules";

export interface UserGovernanceSubnavProps {
  activeTab: UserGovernanceTab;
  userCount?: number;
  roleCount?: number;
  moduleCount?: number;
  className?: string;
}

export function UserGovernanceSubnav({
  activeTab,
  userCount,
  roleCount = 5,
  moduleCount = 6,
  className = "",
}: UserGovernanceSubnavProps) {
  const tabs = [
    {
      id: "users" as UserGovernanceTab,
      label: "Akun Pengguna",
      href: "/pengguna",
      icon: Users,
      badge: userCount !== undefined ? `${userCount} Akun` : undefined,
    },
    {
      id: "roles" as UserGovernanceTab,
      label: "Matriks Peran & Hak Akses",
      href: "/pengguna?tab=roles",
      icon: ShieldCheck,
      badge: `${roleCount} Peran`,
    },
    {
      id: "modules" as UserGovernanceTab,
      label: "Tata Kelola Modul",
      href: "/pengguna?tab=modules",
      icon: Sliders,
      badge: `${moduleCount} Modul`,
    },
  ];

  return (
    <div
      className={`flex items-center gap-2 border-b border-slate-200/90 pb-3 overflow-x-auto no-scrollbar ${className}`}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <Link
            key={tab.id}
            href={tab.href}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs rounded-xl transition-all whitespace-nowrap shrink-0 font-semibold ${
              isActive
                ? "bg-[#102E50] text-white shadow-xs scale-[1.01]"
                : "text-slate-600 hover:text-[#102E50] hover:bg-slate-100/80 bg-white border border-slate-200/80"
            }`}
          >
            <Icon
              className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-[#F2AF3E]" : "text-slate-400"}`}
            />
            <span>{tab.label}</span>
            {tab.badge && (
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-medium transition-colors ${
                  isActive
                    ? "bg-white/15 text-white/90"
                    : "bg-slate-100 text-slate-500 border border-slate-200/60"
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
