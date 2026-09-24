"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AppSwitcher } from "@pspk/ui";
import { signOut } from "@pspk/auth/client";
import {
  Users,
  Layers,
  FileText,
  History,
  LogOut,
  ChevronDown,
  ShieldCheck,
} from "lucide-react";

interface SysmgmtNavbarProps {
  user: {
    id: string;
    name: string;
    email: string;
    roleName: string;
    roleKey?: string;
  };
}

export function SysmgmtNavbar({ user }: SysmgmtNavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleSignOut = async () => {
    try {
      setIsLoggingOut(true);
      await signOut();
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Gagal keluar:", err);
      setIsLoggingOut(false);
    }
  };

  const navItems = [
    {
      name: "Pengguna & Hak Akses",
      href: "/pengguna",
      icon: Users,
      active: pathname.startsWith("/pengguna"),
    },
    {
      name: "Inventaris Aset",
      href: "/aset",
      icon: Layers,
      active: pathname.startsWith("/aset"),
      badge: "Fase 6",
    },
    {
      name: "Dokumen & SOP",
      href: "/dokumen",
      icon: FileText,
      active: pathname.startsWith("/dokumen"),
      badge: "Fase 7",
    },
    {
      name: "Buku Besar Audit Log",
      href: "/audit",
      icon: History,
      active: pathname.startsWith("/audit"),
      badge: "Fase 8",
    },
  ];

  return (
    <header className="bg-white border-b border-slate-200/90 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Sisi Kiri: Logo PSPK & Judul Sistem */}
          <div className="flex items-center gap-6">
            <Link href="/pengguna" className="flex items-center gap-3">
              <div className="h-9 px-2.5 py-1 bg-white border border-slate-200 rounded-lg shadow-2xs flex items-center justify-center">
                <img
                  src="/images/logo_pspk_horizontal_trimmed.png"
                  alt="Logo Resmi PSPK"
                  className="h-6 w-auto object-contain"
                />
              </div>
              <span className="text-slate-300 font-light">|</span>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-[#102E50] leading-none">
                  System Management
                </span>
                <span className="text-[10px] text-slate-400 font-medium tracking-wider uppercase mt-0.5">
                  Tata Kelola & Keamanan
                </span>
              </div>
            </Link>

            {/* Menu Navigasi Desktop */}
            <nav className="hidden md:flex items-center gap-1 pl-4 border-l border-slate-200">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.badge ? "#" : item.href}
                    onClick={(e) => {
                      if (item.badge) {
                        e.preventDefault();
                      }
                    }}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      item.active
                        ? "bg-[#102E50]/10 text-[#102E50]"
                        : item.badge
                        ? "text-slate-400 hover:text-slate-500 cursor-not-allowed"
                        : "text-slate-600 hover:text-[#102E50] hover:bg-slate-100/70"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.name}</span>
                    {item.badge && (
                      <span className="text-[9px] px-1.5 py-0.2 bg-slate-100 text-slate-400 font-normal rounded-full border border-slate-200">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Sisi Kanan: AppSwitcher & Profil Pengguna */}
          <div className="flex items-center gap-3">
            {/* Pemindah Aplikasi */}
            <AppSwitcher
              currentApp="sysmgmt"
              hrisUrl="http://localhost:3001"
              sysmgmtUrl="http://localhost:3002"
              userRoleName={user.roleName}
            />

            {/* Profil Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-100 transition-colors focus:outline-none"
              >
                <div className="w-8 h-8 rounded-full bg-[#102E50] text-[#F2AF3E] font-bold text-xs flex items-center justify-center shadow-xs">
                  {user.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="hidden lg:flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-800 leading-tight">
                    {user.name}
                  </span>
                  <span className="text-[10px] text-amber-700 font-medium">
                    {user.roleName}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white border border-slate-200 shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-4 py-2.5 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900 leading-tight">{user.name}</p>
                    <p className="text-[11px] text-slate-500 font-mono truncate mt-0.5">
                      {user.email}
                    </p>
                    <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      <ShieldCheck className="w-3 h-3 text-amber-600" />
                      {user.roleName}
                    </div>
                  </div>

                  <div className="py-1">
                    <button
                      type="button"
                      disabled={isLoggingOut}
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors disabled:opacity-50"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>{isLoggingOut ? "Sedang keluar..." : "Keluar dari Sistem"}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
