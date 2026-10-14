"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { AppSwitcher } from "@pspk/ui";
import { signOut } from "@pspk/auth/client";
import {
  Users,
  Layers,
  KeyRound,
  FileText,
  History,
  LogOut,
  ChevronDown,
  ShieldCheck,
  LayoutDashboard,
  Settings,
  Menu,
  X,
  HelpCircle,
} from "lucide-react";

import { ModuleFlags, isModuleActive } from "@pspk/db";

interface SysmgmtNavbarProps {
  user: {
    id: string;
    name: string;
    email: string;
    roleName: string;
    roleKey?: string;
  };
  canAccessHris?: boolean;
  moduleFlags?: ModuleFlags;
}

export function SysmgmtNavbar({ user, canAccessHris = false, moduleFlags }: SysmgmtNavbarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [openDropdown, setOpenDropdown] = useState<"inventaris" | "governance" | "user" | null>(
    null,
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);

  // Sesuaikan state dropdown saat navigasi rute berubah (pola render React resmi)
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setOpenDropdown(null);
    setMobileMenuOpen(false);
  }

  const navContainerRef = useRef<HTMLElement>(null);

  // Deteksi klik di luar komponen navbar dan tombol escape untuk menutup dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (navContainerRef.current && !navContainerRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenDropdown(null);
        setMobileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const toggleDropdown = (menu: "inventaris" | "governance" | "user") => {
    setOpenDropdown((prev) => (prev === menu ? null : menu));
  };

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

  const isAssetEnabled = !moduleFlags || isModuleActive(moduleFlags, "asset_management");

  // Status keaktifan grup menu bertingkat
  const isInventarisActive = pathname.startsWith("/aset") || pathname.startsWith("/lisensi");
  const isGovernanceActive = pathname.startsWith("/audit") || pathname.startsWith("/pengaturan");

  return (
    <header
      ref={navContainerRef}
      className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 shadow-2xs"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Sisi Kiri: Brand & Logo PSPK */}
          <div className="flex items-center gap-3 lg:gap-5 shrink-0">
            <Link
              href="/dashboard"
              className="flex items-center shrink-0 group"
              title="System Management PSPK"
            >
              <div className="h-9 px-2.5 py-1 bg-white border border-slate-200 rounded-xl shadow-2xs flex items-center justify-center group-hover:border-slate-300 transition-colors">
                <Image
                  src="/images/logo_pspk_horizontal_trimmed.png"
                  alt="Logo Resmi PSPK"
                  width={116}
                  height={24}
                  className="h-6 w-auto object-contain"
                  priority
                />
              </div>
            </Link>

            {/* Menu Navigasi Desktop — Pola Hirarkis Elegan (5 Item) */}
            <nav className="hidden md:flex items-center gap-1 pl-3 lg:pl-4 border-l border-slate-200/80">
              {/* 1. Dashboard */}
              <Link
                href="/dashboard"
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  pathname === "/dashboard"
                    ? "bg-[#102E50]/10 text-[#102E50] font-bold shadow-2xs"
                    : "text-slate-600 hover:text-[#102E50] hover:bg-slate-100/70"
                }`}
              >
                <LayoutDashboard className="w-4 h-4 shrink-0" />
                <span>Dashboard</span>
              </Link>

              {/* 2. Pengguna & Hak Akses */}
              <Link
                href="/pengguna"
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  pathname.startsWith("/pengguna")
                    ? "bg-[#102E50]/10 text-[#102E50] font-bold shadow-2xs"
                    : "text-slate-600 hover:text-[#102E50] hover:bg-slate-100/70"
                }`}
              >
                <Users className="w-4 h-4 shrink-0" />
                <span>Pengguna & Akses</span>
              </Link>

              {/* 3. Grup Inventaris (Dropdown Popover) */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => toggleDropdown("inventaris")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isInventarisActive
                      ? "bg-[#102E50]/10 text-[#102E50] font-bold shadow-2xs"
                      : "text-slate-600 hover:text-[#102E50] hover:bg-slate-100/70"
                  }`}
                  aria-expanded={openDropdown === "inventaris"}
                >
                  <Layers className="w-4 h-4 shrink-0" />
                  <span>Inventaris</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                      openDropdown === "inventaris" ? "rotate-180 text-[#102E50]" : ""
                    }`}
                  />
                </button>

                {openDropdown === "inventaris" && (
                  <div className="absolute left-0 mt-2 w-76 sm:w-80 rounded-2xl bg-white border border-slate-200/90 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-1.5 border-b border-slate-100 mb-1 flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Modul Inventaris Perangkat
                      </span>
                    </div>
                    <div className="space-y-1">
                      {isAssetEnabled && (
                        <Link
                          href="/aset"
                          className={`flex items-start gap-3 p-2.5 rounded-xl transition-all cursor-pointer group ${
                            pathname.startsWith("/aset")
                              ? "bg-slate-50 border border-slate-200/80"
                              : "hover:bg-slate-50 border border-transparent"
                          }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                              pathname.startsWith("/aset")
                                ? "bg-[#102E50] text-[#F2AF3E] shadow-2xs"
                                : "bg-slate-100 text-slate-600 group-hover:bg-[#102E50]/10 group-hover:text-[#102E50]"
                            }`}
                          >
                            <Layers className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-900 group-hover:text-[#102E50]">
                                Inventaris Aset
                              </span>
                              {pathname.startsWith("/aset") && (
                                <span className="text-[9px] font-bold text-[#102E50] bg-[#102E50]/10 px-1.5 py-0.5 rounded">
                                  Aktif
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                              Pencatatan perangkat keras, laptop, dan aset fisik kantor
                            </p>
                          </div>
                        </Link>
                      )}

                      <Link
                        href="/lisensi"
                        className={`flex items-start gap-3 p-2.5 rounded-xl transition-all cursor-pointer group ${
                          pathname.startsWith("/lisensi")
                            ? "bg-slate-50 border border-slate-200/80"
                            : "hover:bg-slate-50 border border-transparent"
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                            pathname.startsWith("/lisensi")
                              ? "bg-[#102E50] text-[#F2AF3E] shadow-2xs"
                              : "bg-slate-100 text-slate-600 group-hover:bg-[#102E50]/10 group-hover:text-[#102E50]"
                          }`}
                        >
                          <KeyRound className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900 group-hover:text-[#102E50]">
                              Lisensi Software
                            </span>
                            {pathname.startsWith("/lisensi") && (
                              <span className="text-[9px] font-bold text-[#102E50] bg-[#102E50]/10 px-1.5 py-0.5 rounded">
                                Aktif
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                            Monitoring masa aktif langganan, kuota kursi, dan vendor
                          </p>
                        </div>
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* 4. Dokumen & SOP */}
              <Link
                href="/dokumen"
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  pathname.startsWith("/dokumen")
                    ? "bg-[#102E50]/10 text-[#102E50] font-bold shadow-2xs"
                    : "text-slate-600 hover:text-[#102E50] hover:bg-slate-100/70"
                }`}
              >
                <FileText className="w-4 h-4 shrink-0" />
                <span>Dokumen & SOP</span>
              </Link>

              {/* 5. Grup Tata Kelola (Dropdown Popover) */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => toggleDropdown("governance")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isGovernanceActive
                      ? "bg-[#102E50]/10 text-[#102E50] font-bold shadow-2xs"
                      : "text-slate-600 hover:text-[#102E50] hover:bg-slate-100/70"
                  }`}
                  aria-expanded={openDropdown === "governance"}
                >
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>Tata Kelola</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                      openDropdown === "governance" ? "rotate-180 text-[#102E50]" : ""
                    }`}
                  />
                </button>

                {openDropdown === "governance" && (
                  <div className="absolute left-0 mt-2 w-76 sm:w-84 rounded-2xl bg-white border border-slate-200/90 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-1.5 border-b border-slate-100 mb-1 flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Tata Kelola & Keamanan Sistem
                      </span>
                    </div>
                    <div className="space-y-1">
                      {/* Sub-item: Buku Besar Audit Log */}
                      <Link
                        href="/audit"
                        className={`flex items-start gap-3 p-2.5 rounded-xl transition-all cursor-pointer group ${
                          pathname.startsWith("/audit")
                            ? "bg-slate-50 border border-slate-200/80"
                            : "hover:bg-slate-50 border border-transparent"
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                            pathname.startsWith("/audit")
                              ? "bg-[#102E50] text-[#F2AF3E] shadow-2xs"
                              : "bg-slate-100 text-slate-600 group-hover:bg-[#102E50]/10 group-hover:text-[#102E50]"
                          }`}
                        >
                          <History className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900 group-hover:text-[#102E50]">
                              Buku Besar Audit Log
                            </span>
                            {pathname.startsWith("/audit") && (
                              <span className="text-[9px] font-bold text-[#102E50] bg-[#102E50]/10 px-1.5 py-0.5 rounded">
                                Aktif
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                            Rekaman aktivitas & jejak mutasi data sistem terenkripsi
                          </p>
                        </div>
                      </Link>

                      {/* Sub-item: Pengaturan Master */}
                      <Link
                        href="/pengaturan"
                        className={`flex items-start gap-3 p-2.5 rounded-xl transition-all cursor-pointer group ${
                          pathname.startsWith("/pengaturan")
                            ? "bg-slate-50 border border-slate-200/80"
                            : "hover:bg-slate-50 border border-transparent"
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                            pathname.startsWith("/pengaturan")
                              ? "bg-[#102E50] text-[#F2AF3E] shadow-2xs"
                              : "bg-slate-100 text-slate-600 group-hover:bg-[#102E50]/10 group-hover:text-[#102E50]"
                          }`}
                        >
                          <Settings className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900 group-hover:text-[#102E50]">
                              Pengaturan & Master Data
                            </span>
                            {pathname.startsWith("/pengaturan") && (
                              <span className="text-[9px] font-bold text-[#102E50] bg-[#102E50]/10 px-1.5 py-0.5 rounded">
                                Aktif
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                            Kategori dokumen, tipe & lokasi aset, dan preferensi modul
                          </p>
                        </div>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </nav>
          </div>

          {/* Sisi Kanan: AppSwitcher & Profil Pengguna + Tombol Mobile Menu */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Pemindah Portal Aplikasi (Khusus yang memiliki akses ke HRIS) */}
            {canAccessHris && (
              <AppSwitcher
                currentApp="sysmgmt"
                hrisUrl={process.env.NEXT_PUBLIC_HRIS_URL || "http://localhost:3001"}
                sysmgmtUrl={process.env.NEXT_PUBLIC_SYSMGMT_URL || "http://localhost:3002"}
                canAccessHris={canAccessHris}
                userRoleName={user.roleName}
              />
            )}

            {/* Profil Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => toggleDropdown("user")}
                className="flex items-center gap-2 p-1 sm:p-1.5 rounded-xl hover:bg-slate-100/80 transition-colors focus:outline-none cursor-pointer"
                aria-expanded={openDropdown === "user"}
              >
                <div className="w-8 h-8 rounded-full bg-[#102E50] text-[#F2AF3E] font-bold text-xs flex items-center justify-center shadow-xs ring-2 ring-white">
                  {user.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="hidden 2xl:flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-800 leading-tight max-w-[130px] truncate">
                    {user.name}
                  </span>
                  <span className="text-[10px] text-amber-700 font-medium">{user.roleName}</span>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 hidden sm:block ${
                    openDropdown === "user" ? "rotate-180" : ""
                  }`}
                />
              </button>

              {openDropdown === "user" && (
                <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-white border border-slate-200/90 shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-4 py-2.5 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900 leading-tight">{user.name}</p>
                    <p className="text-[11px] text-slate-500 font-mono truncate mt-0.5">
                      {user.email}
                    </p>
                    <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      <ShieldCheck className="w-3 h-3 text-amber-600" />
                      {user.roleName}
                    </div>
                  </div>

                  <div className="py-1 border-b border-slate-100">
                    <Link
                      href="/pengaturan"
                      onClick={() => setOpenDropdown(null)}
                      className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                    >
                      <Settings className="w-3.5 h-3.5 text-slate-500" />
                      <span>Pengaturan & Master Data</span>
                    </Link>

                    <Link
                      href="/bantuan"
                      onClick={() => setOpenDropdown(null)}
                      className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                      <span>Pusat Bantuan & FAQ</span>
                    </Link>
                  </div>

                  <div className="py-1">
                    <button
                      type="button"
                      disabled={isLoggingOut}
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>{isLoggingOut ? "Sedang keluar..." : "Keluar dari Sistem"}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Tombol Hamburger untuk Layar Mobile/Tablet (< md) */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors focus:outline-none"
              aria-label="Buka Menu Navigasi"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Menu Mobile / Drawer Terorganisir */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200/90 bg-white/98 backdrop-blur-md px-4 pt-3 pb-6 space-y-4 animate-in slide-in-from-top duration-200 shadow-xl">
          {/* Kelompok: Navigasi Utama */}
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
              Navigasi Utama
            </p>
            <Link
              href="/dashboard"
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold ${
                pathname === "/dashboard"
                  ? "bg-[#102E50]/10 text-[#102E50]"
                  : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>
            <Link
              href="/pengguna"
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold ${
                pathname.startsWith("/pengguna")
                  ? "bg-[#102E50]/10 text-[#102E50]"
                  : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Pengguna & Hak Akses</span>
            </Link>
            <Link
              href="/dokumen"
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold ${
                pathname.startsWith("/dokumen")
                  ? "bg-[#102E50]/10 text-[#102E50]"
                  : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Dokumen & SOP</span>
            </Link>
          </div>

          {/* Kelompok: Inventaris Perangkat */}
          <div className="space-y-1 pt-2 border-t border-slate-100">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
              Inventaris Perangkat
            </p>
            {isAssetEnabled && (
              <Link
                href="/aset"
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold ${
                  pathname.startsWith("/aset")
                    ? "bg-[#102E50]/10 text-[#102E50]"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Inventaris Aset</span>
              </Link>
            )}
            <Link
              href="/lisensi"
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold ${
                pathname.startsWith("/lisensi")
                  ? "bg-[#102E50]/10 text-[#102E50]"
                  : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              <KeyRound className="w-4 h-4" />
              <span>Lisensi Software</span>
            </Link>
          </div>

          {/* Kelompok: Tata Kelola Sistem */}
          <div className="space-y-1 pt-2 border-t border-slate-100">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
              Tata Kelola & Keamanan
            </p>
            <Link
              href="/audit"
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold ${
                pathname.startsWith("/audit")
                  ? "bg-[#102E50]/10 text-[#102E50]"
                  : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              <History className="w-4 h-4" />
              <span>Buku Besar Audit Log</span>
            </Link>
            <Link
              href="/pengaturan"
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold ${
                pathname.startsWith("/pengaturan")
                  ? "bg-[#102E50]/10 text-[#102E50]"
                  : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Pengaturan & Master Data</span>
            </Link>
          </div>

          {/* Tombol Keluar di Mobile */}
          <div className="pt-3 border-t border-slate-100">
            <button
              type="button"
              disabled={isLoggingOut}
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors disabled:opacity-50"
            >
              <LogOut className="w-4 h-4" />
              <span>{isLoggingOut ? "Sedang keluar..." : "Keluar dari Sistem"}</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

