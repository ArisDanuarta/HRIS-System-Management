"use client";

import React, { useState, useMemo } from "react";
import {
  RoleMatrixData,
  CategoryMatrixGroup,
} from "@/server/queries/role.queries";
import {
  Search,
  Check,
  Minus,
  Users,
  User,
  Shield,
  ShieldCheck,
  RefreshCw,
  Link2,
  ChevronDown,
  ChevronRight,
  Layers,
  Network,
  FileCheck,
  Fingerprint,
  Calendar,
  CalendarRange,
  Receipt,
  FileText,
  Clock,
  TrendingUp,
  UserPlus,
  GraduationCap,
  LayoutDashboard,
  UserCog,
  KeyRound,
  FolderLock,
  History,
  X,
  HelpCircle,
} from "lucide-react";

interface RoleMatrixViewProps {
  matrixData: RoleMatrixData;
}

// Pemetaan Ikon Kategori
const CATEGORY_ICONS: Record<string, React.ElementType> = {
  employee: Users,
  org: Network,
  contract: FileCheck,
  attendance: Fingerprint,
  leave: Calendar,
  calendar: CalendarRange,
  payroll: Receipt,
  payslip: FileText,
  timesheet: Clock,
  performance: TrendingUp,
  recruitment: UserPlus,
  training: GraduationCap,
  dashboard: LayoutDashboard,
  user: UserCog,
  role: ShieldCheck,
  asset: Layers,
  license: KeyRound,
  document: FolderLock,
  audit: History,
};

export function RoleMatrixView({ matrixData }: RoleMatrixViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedModule, setSelectedModule] = useState<"ALL" | "hris" | "sysmgmt">("ALL");
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  // Toggle buka/tutup satu kategori
  const toggleCategory = (key: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Buka semua / Tutup semua kategori
  const handleExpandAll = () => setCollapsedCategories({});
  const handleCollapseAll = () => {
    const allCollapsed: Record<string, boolean> = {};
    for (const cat of matrixData.categories) {
      allCollapsed[cat.categoryKey] = true;
    }
    setCollapsedCategories(allCollapsed);
  };

  // Filter kategori dan izin berdasarkan query pencarian dan tab modul
  const filteredCategories = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return matrixData.categories
      .map((cat) => {
        // Cek filter modul
        if (selectedModule !== "ALL" && cat.app !== selectedModule) {
          return null;
        }

        // Filter permissions di dalam kategori
        const matchingPermissions = cat.permissions.filter((perm) => {
          if (!q) return true;
          return (
            perm.key.toLowerCase().includes(q) ||
            perm.description.toLowerCase().includes(q) ||
            cat.categoryLabel.toLowerCase().includes(q)
          );
        });

        if (matchingPermissions.length === 0) return null;

        return {
          ...cat,
          permissions: matchingPermissions,
        };
      })
      .filter((cat): cat is CategoryMatrixGroup => cat !== null);
  }, [matrixData.categories, searchQuery, selectedModule]);

  // Total permission yang saat ini terlihat
  const totalVisiblePermissions = useMemo(() => {
    return filteredCategories.reduce((acc, cat) => acc + cat.permissions.length, 0);
  }, [filteredCategories]);

  return (
    <div className="space-y-4">
      {/* Kontrol Bilah Pencarian, Filter Modul & Aksi */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Input Pencarian */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari izin, nama modul, atau deskripsi wewenang..."
              className="w-full pl-10 pr-9 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50] transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                title="Hapus pencarian"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Tab Modul (Semua / HRIS / Sysmgmt) */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl self-start md:self-auto">
            <button
              type="button"
              onClick={() => setSelectedModule("ALL")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                selectedModule === "ALL"
                  ? "bg-white text-[#102E50] shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Semua ({matrixData.stats.totalPermissions})
            </button>
            <button
              type="button"
              onClick={() => setSelectedModule("hris")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                selectedModule === "hris"
                  ? "bg-white text-[#102E50] shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              HRIS ({matrixData.stats.totalHrisPermissions})
            </button>
            <button
              type="button"
              onClick={() => setSelectedModule("sysmgmt")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                selectedModule === "sysmgmt"
                  ? "bg-white text-[#102E50] shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              System Management ({matrixData.stats.totalSysmgmtPermissions})
            </button>
          </div>
        </div>

        {/* Baris Bawah: Tombol Expand/Collapse & Legenda Indikator */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          {/* Kontrol Buka/Tutup */}
          <div className="flex items-center gap-2 text-slate-500">
            <span>
              Menampilkan <strong className="text-slate-900">{totalVisiblePermissions}</strong> dari{" "}
              {matrixData.stats.totalPermissions} izin
            </span>
            <span className="text-slate-300">•</span>
            <button
              type="button"
              onClick={handleExpandAll}
              className="text-[#102E50] hover:underline font-semibold"
            >
              Buka Semua
            </button>
            <span className="text-slate-300">/</span>
            <button
              type="button"
              onClick={handleCollapseAll}
              className="text-slate-500 hover:underline"
            >
              Tutup Semua
            </button>
          </div>

          {/* Legenda Indikator Akses */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[11px]">
            <span className="text-slate-400 font-medium">Keterangan:</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
              <Check className="w-3 h-3 text-emerald-600" />
              Penuh (:all)
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-50 text-sky-800 border border-sky-200 font-semibold">
              <Users className="w-3 h-3 text-sky-600" />
              Tim (:team)
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
              <User className="w-3 h-3 text-amber-600" />
              Mandiri (:own)
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200 font-semibold">
              <Shield className="w-3 h-3 text-purple-600" />
              Khusus
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-400 font-medium">
              <Minus className="w-3 h-3" />
              Terkunci
            </span>
          </div>
        </div>
      </div>

      {/* Tabel Matriks Grid Interaktif */}
      {filteredCategories.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-2xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Search className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 mb-1">Izin Tidak Ditemukan</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
            Tidak ada izin atau modul yang cocok dengan kata kunci &ldquo;{searchQuery}&rdquo;.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setSelectedModule("ALL");
            }}
            className="px-3.5 py-1.5 text-xs font-semibold text-[#102E50] bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Reset Pencarian
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              {/* Header Kolom Tabel */}
              <thead>
                <tr className="bg-[#102E50] text-white border-b border-[#0c233d]">
                  <th className="py-3.5 px-4 text-xs font-bold uppercase tracking-wider w-[380px] sticky left-0 bg-[#102E50] z-20">
                    Modul & Deskripsi Hak Akses
                  </th>
                  {matrixData.roles.map((role) => (
                    <th
                      key={role.id}
                      className="py-3.5 px-3 text-center text-xs font-bold uppercase tracking-wider w-[120px]"
                    >
                      <div className="flex flex-col items-center">
                        <span className="text-[11px] font-bold tracking-tight text-white">
                          {role.name}
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/15 text-[#F2AF3E] mt-0.5 font-normal">
                          {role.permissionCount} izin
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Body Tabel Berkelompok per Kategori */}
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredCategories.map((category) => {
                  const isCollapsed = Boolean(collapsedCategories[category.categoryKey]);
                  const CategoryIcon = CATEGORY_ICONS[category.categoryKey] || Layers;

                  return (
                    <React.Fragment key={category.categoryKey}>
                      {/* Baris Judul Kategori (Accordion Header) */}
                      <tr
                        onClick={() => toggleCategory(category.categoryKey)}
                        className="bg-slate-100/80 hover:bg-slate-150 cursor-pointer transition-colors select-none font-semibold"
                      >
                        <td
                          colSpan={matrixData.roles.length + 1}
                          className="py-2.5 px-4 text-slate-800"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <span className="text-slate-400">
                                {isCollapsed ? (
                                  <ChevronRight className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </span>
                              <div className="w-6 h-6 rounded-md bg-white border border-slate-200/80 flex items-center justify-center text-[#102E50] shadow-2xs">
                                <CategoryIcon className="w-3.5 h-3.5" />
                              </div>
                              <span className="text-xs font-bold text-slate-900">
                                {category.categoryLabel}
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white text-slate-500 border border-slate-200/80 font-normal">
                                {category.permissions.length} wewenang
                              </span>
                            </div>

                            <span
                              className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                category.app === "hris"
                                  ? "bg-amber-100/70 text-amber-800 border border-amber-200/60"
                                  : "bg-blue-100/70 text-blue-800 border border-blue-200/60"
                              }`}
                            >
                              {category.app === "hris" ? "HRIS Core" : "System Management"}
                            </span>
                          </div>
                        </td>
                      </tr>

                      {/* Baris-baris Izin di dalam Kategori */}
                      {!isCollapsed &&
                        category.permissions.map((perm) => (
                          <tr
                            key={perm.id}
                            className="hover:bg-slate-50/70 transition-colors group"
                          >
                            {/* Kolom Kiri: Nama Izin & Deskripsi */}
                            <td className="py-2.5 px-4 sticky left-0 bg-white group-hover:bg-slate-50/70 z-10 border-r border-slate-100">
                              <div className="flex flex-col">
                                <span className="text-xs font-semibold text-slate-800 leading-snug">
                                  {perm.description}
                                </span>
                                <span className="text-[10px] font-mono text-slate-400 mt-0.5 truncate">
                                  {perm.key}
                                </span>
                              </div>
                            </td>

                            {/* Kolom Akses per Peran */}
                            {matrixData.roles.map((role) => {
                              const hasAccess = perm.roleAccess[role.key] ?? false;

                              return (
                                <td
                                  key={role.id}
                                  className="py-2.5 px-3 text-center align-middle border-r border-slate-100 last:border-r-0"
                                >
                                  <AccessBadge
                                    hasAccess={hasAccess}
                                    scope={perm.scope}
                                    roleKey={role.key}
                                  />
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer Tabel */}
          <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-500 gap-2">
            <div className="flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              <span>
                Pengecekan hak akses di server dilakukan via fungsi{" "}
                <code className="font-mono text-[10px] bg-white px-1 py-0.5 rounded border border-slate-200">
                  can(ctx, permission)
                </code>{" "}
                pada setiap mutasi.
              </span>
            </div>
            <span className="font-mono text-slate-400">
              Total {matrixData.stats.totalPermissions} Permission Terverifikasi
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Komponen Badge Indikator Akses
 */
function AccessBadge({
  hasAccess,
  scope,
  roleKey,
}: {
  hasAccess: boolean;
  scope: string;
  roleKey: string;
}) {
  if (!hasAccess) {
    return (
      <span className="inline-flex items-center justify-center text-slate-300">
        <Minus className="w-3.5 h-3.5" />
      </span>
    );
  }

  // Super Admin selalu akses penuh
  if (roleKey === "super_admin" || scope === "all") {
    return (
      <span
        title="Wewenang Penuh Seluruh Organisasi"
        className="inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-3xs"
      >
        <Check className="w-2.5 h-2.5 stroke-[3]" />
        <span>Penuh</span>
      </span>
    );
  }

  if (scope === "team") {
    return (
      <span
        title="Wewenang Terbatas Anggota Tim Langsung"
        className="inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200 shadow-3xs"
      >
        <Users className="w-2.5 h-2.5" />
        <span>Tim</span>
      </span>
    );
  }

  if (scope === "own") {
    return (
      <span
        title="Wewenang Layanan Mandiri (Data Sendiri)"
        className="inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-3xs"
      >
        <User className="w-2.5 h-2.5" />
        <span>Mandiri</span>
      </span>
    );
  }

  if (scope === "sync") {
    return (
      <span
        title="Akses Sinkronisasi Integrasi"
        className="inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-3xs"
      >
        <RefreshCw className="w-2.5 h-2.5" />
        <span>Sync</span>
      </span>
    );
  }

  if (scope === "connect") {
    return (
      <span
        title="Akses Tautan Akun Eksternal"
        className="inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 shadow-3xs"
      >
        <Link2 className="w-2.5 h-2.5" />
        <span>Koneksi</span>
      </span>
    );
  }

  if (scope === "hr") {
    return (
      <span
        title="Akses Khusus Kategori Dokumen HR"
        className="inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200 shadow-3xs"
      >
        <Shield className="w-2.5 h-2.5" />
        <span>HR</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-3xs">
      <Check className="w-2.5 h-2.5 stroke-[3]" />
      <span>Aktif</span>
    </span>
  );
}
