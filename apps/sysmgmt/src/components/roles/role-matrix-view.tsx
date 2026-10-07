"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  RoleMatrixData,
  CategoryMatrixGroup,
} from "@/server/queries/role.queries";
import {
  batchUpdateRoleMatrixAction,
  resetRolePermissionsToDefaultAction,
  updatePermissionDescriptionAction,
} from "@/server/actions/role.actions";
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
  Edit3,
  Save,
  RotateCcw,
  Lock,
  Loader2,
  AlertTriangle,
  CheckCircle2,
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

function createInitialMatrixState(
  matrixData: RoleMatrixData,
): Record<string, Record<string, boolean>> {
  const state: Record<string, Record<string, boolean>> = {};
  for (const role of matrixData.roles) {
    state[role.key] = {};
  }
  for (const cat of matrixData.categories) {
    for (const perm of cat.permissions) {
      for (const role of matrixData.roles) {
        if (!state[role.key]) state[role.key] = {};
        state[role.key]![perm.key] = perm.roleAccess[role.key] ?? false;
      }
    }
  }
  return state;
}

export function RoleMatrixView({ matrixData }: RoleMatrixViewProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedModule, setSelectedModule] = useState<"ALL" | "hris" | "sysmgmt">("ALL");
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  // State Mode Edit
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedMatrix, setEditedMatrix] = useState<Record<string, Record<string, boolean>>>(
    () => createInitialMatrixState(matrixData),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  // State Modal Edit Deskripsi Izin
  const [editingPermission, setEditingPermission] = useState<{
    id: string;
    key: string;
    description: string;
    categoryLabel: string;
    app: "hris" | "sysmgmt";
  } | null>(null);
  const [editedDescriptionInput, setEditedDescriptionInput] = useState("");
  const [isUpdatingDescription, setIsUpdatingDescription] = useState(false);

  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Sinkronkan state matriks jika data server diperbarui (sesuai rekomendasi React "adjusting state when props change")
  const [prevMatrixData, setPrevMatrixData] = useState(matrixData);
  if (matrixData !== prevMatrixData) {
    setPrevMatrixData(matrixData);
    setEditedMatrix(createInitialMatrixState(matrixData));
  }

  // Otomatis hilangkan pesan feedback setelah 5 detik
  useEffect(() => {
    if (feedbackMessage) {
      const timer = setTimeout(() => setFeedbackMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [feedbackMessage]);

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

  // Toggle centang wewenang pada mode edit
  const toggleCell = (roleKey: string, permKey: string) => {
    if (roleKey === "super_admin") return; // Terkunci aman

    setEditedMatrix((prev) => {
      const roleMap = { ...(prev[roleKey] || {}) };
      roleMap[permKey] = !roleMap[permKey];
      return {
        ...prev,
        [roleKey]: roleMap,
      };
    });
  };

  // Hitung jumlah perubahan wewenang yang belum disimpan
  const changeCount = useMemo(() => {
    let count = 0;
    for (const role of matrixData.roles) {
      if (role.key === "super_admin") continue;
      for (const cat of matrixData.categories) {
        for (const perm of cat.permissions) {
          const initialVal = perm.roleAccess[role.key] ?? false;
          const currentVal = editedMatrix[role.key]?.[perm.key] ?? false;
          if (initialVal !== currentVal) {
            count++;
          }
        }
      }
    }
    return count;
  }, [editedMatrix, matrixData]);

  // Batalkan seluruh editan dan keluar dari mode edit
  const handleCancelEdits = () => {
    setEditedMatrix(createInitialMatrixState(matrixData));
    setIsEditMode(false);
  };

  // Simpan seluruh editan ke database via Server Action
  const handleSaveEdits = async () => {
    try {
      setIsSaving(true);
      setFeedbackMessage(null);

      const updates: Array<{ roleKey: string; permissionKeys: string[] }> = [];

      for (const role of matrixData.roles) {
        if (role.key === "super_admin") continue;

        let hasChanges = false;
        const activeKeys: string[] = [];

        for (const cat of matrixData.categories) {
          for (const perm of cat.permissions) {
            const initialVal = perm.roleAccess[role.key] ?? false;
            const currentVal = editedMatrix[role.key]?.[perm.key] ?? false;

            if (initialVal !== currentVal) {
              hasChanges = true;
            }
            if (currentVal) {
              activeKeys.push(perm.key);
            }
          }
        }

        if (hasChanges) {
          updates.push({
            roleKey: role.key,
            permissionKeys: activeKeys,
          });
        }
      }

      if (updates.length === 0) {
        setIsEditMode(false);
        setIsSaving(false);
        return;
      }

      const res = await batchUpdateRoleMatrixAction({ updates });

      if (res.ok) {
        setFeedbackMessage({
          type: "success",
          text: res.message,
        });
        setIsEditMode(false);
        router.refresh();
      } else {
        setFeedbackMessage({
          type: "error",
          text: res.error,
        });
      }
    } catch (err) {
      setFeedbackMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Gagal menyimpan perubahan wewenang.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Kembalikan seluruh wewenang ke default sistem PSPK
  const handleResetToDefault = async () => {
    try {
      setIsResetting(true);
      setShowResetModal(false);
      setFeedbackMessage(null);

      const res = await resetRolePermissionsToDefaultAction();

      if (res.ok) {
        setFeedbackMessage({
          type: "success",
          text: res.message,
        });
        setIsEditMode(false);
        router.refresh();
      } else {
        setFeedbackMessage({
          type: "error",
          text: res.error,
        });
      }
    } catch (err) {
      setFeedbackMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Gagal mengembalikan ke default.",
      });
    } finally {
      setIsResetting(false);
    }
  };

  // Simpan perubahan keterangan/deskripsi izin
  const handleSaveDescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPermission) return;

    const trimmed = editedDescriptionInput.trim();
    if (!trimmed) {
      setFeedbackMessage({
        type: "error",
        text: "Keterangan izin tidak boleh kosong.",
      });
      return;
    }

    if (trimmed.length < 3) {
      setFeedbackMessage({
        type: "error",
        text: "Keterangan izin minimal harus 3 karakter.",
      });
      return;
    }

    setIsUpdatingDescription(true);
    setFeedbackMessage(null);

    try {
      const res = await updatePermissionDescriptionAction({
        permissionKey: editingPermission.key,
        description: trimmed,
      });

      if (res.ok) {
        setFeedbackMessage({
          type: "success",
          text: res.message,
        });
        setEditingPermission(null);
        router.refresh();
      } else {
        setFeedbackMessage({
          type: "error",
          text: res.error,
        });
      }
    } catch (err: unknown) {
      setFeedbackMessage({
        type: "error",
        text:
          err instanceof Error
            ? err.message
            : "Terjadi kesalahan sistem saat menyimpan keterangan izin.",
      });
    } finally {
      setIsUpdatingDescription(false);
    }
  };

  // Filter kategori dan izin berdasarkan query pencarian dan tab modul
  const filteredCategories = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return matrixData.categories
      .map((cat) => {
        if (selectedModule !== "ALL" && cat.app !== selectedModule) {
          return null;
        }

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

  const totalVisiblePermissions = useMemo(() => {
    return filteredCategories.reduce((acc, cat) => acc + cat.permissions.length, 0);
  }, [filteredCategories]);

  return (
    <div className="space-y-4 relative pb-16">
      {/* Banner Pesan Feedback Sukses / Gagal */}
      {feedbackMessage && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs font-semibold animate-in fade-in duration-200 ${
            feedbackMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMessage(null)}
            className="text-slate-400 hover:text-slate-600 p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Kontrol Bilah Pencarian, Filter Modul & Tombol Aksi Edit */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
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

          {/* Sisi Kanan: Filter Tab Modul & Tombol Mode Ubah */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Tab Modul */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setSelectedModule("ALL")}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
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
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
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
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                  selectedModule === "sysmgmt"
                    ? "bg-white text-[#102E50] shadow-xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                SysMgmt ({matrixData.stats.totalSysmgmtPermissions})
              </button>
            </div>

            {/* Tombol Utama: Mode Ubah Hak Akses */}
            {!isEditMode ? (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsEditMode(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-[#102E50] text-white hover:bg-[#1a4473] transition-colors shadow-2xs"
                >
                  <Edit3 className="w-3.5 h-3.5 text-[#F2AF3E]" />
                  <span>Ubah Hak Akses</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowResetModal(true)}
                  disabled={isResetting}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-[#102E50] hover:bg-slate-50 transition-colors shadow-2xs"
                  title="Kembalikan wewenang peran ke standar awal blueprint PSPK"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                  <span>Default Sistem</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/80 animate-pulse">
                  ● Mode Ubah Aktif
                </span>
                <button
                  type="button"
                  onClick={handleCancelEdits}
                  className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                >
                  Selesai
                </button>
              </div>
            )}
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
                        <div className="flex items-center gap-1">
                          <span className="text-[11px] font-bold tracking-tight text-white">
                            {role.name}
                          </span>
                          {role.key === "super_admin" && (
                            <span title="Akses Super Admin Terkunci Permanen">
                              <Lock className="w-3 h-3 text-[#F2AF3E]" />
                            </span>
                          )}
                        </div>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/15 text-[#F2AF3E] mt-0.5 font-normal">
                          {role.key === "super_admin"
                            ? "Akses Penuh"
                            : `${role.permissionCount} izin`}
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
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex flex-col min-w-0 pr-1">
                                  <span className="text-xs font-semibold text-slate-800 leading-snug">
                                    {perm.description}
                                  </span>
                                  <span className="text-[10px] font-mono text-slate-400 mt-0.5 truncate">
                                    {perm.key}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingPermission({
                                      id: perm.id,
                                      key: perm.key,
                                      description: perm.description,
                                      categoryLabel: category.categoryLabel,
                                      app: category.app,
                                    });
                                    setEditedDescriptionInput(perm.description);
                                  }}
                                  className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-[#102E50] hover:bg-slate-100 transition-all shrink-0"
                                  title="Ubah teks keterangan wewenang ini"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>

                            {/* Kolom Akses per Peran */}
                            {matrixData.roles.map((role) => {
                              const isChecked =
                                editedMatrix[role.key]?.[perm.key] ?? false;

                              return (
                                <td
                                  key={role.id}
                                  className="py-2.5 px-3 text-center align-middle border-r border-slate-100 last:border-r-0"
                                >
                                  {/* Mode Edit: Tampilkan Checkbox/Toggle Interaktif */}
                                  {isEditMode ? (
                                    role.key === "super_admin" ? (
                                      <span
                                        title="Super Admin memiliki akses penuh permanen"
                                        className="inline-flex items-center justify-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200/90 shadow-3xs cursor-not-allowed select-none"
                                      >
                                        <Lock className="w-2.5 h-2.5 text-amber-600" />
                                        <span>Permanen</span>
                                      </span>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => toggleCell(role.key, perm.key)}
                                        className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all active:scale-95 shadow-3xs ${
                                          isChecked
                                            ? "bg-emerald-600 text-white hover:bg-emerald-700 ring-2 ring-emerald-500/30"
                                            : "bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 border border-slate-200/80"
                                        }`}
                                        title={
                                          isChecked
                                            ? "Klik untuk mencabut wewenang ini"
                                            : "Klik untuk memberikan wewenang ini"
                                        }
                                      >
                                        {isChecked ? (
                                          <>
                                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                                            <span>Aktif</span>
                                          </>
                                        ) : (
                                          <>
                                            <Minus className="w-2.5 h-2.5" />
                                            <span>Mati</span>
                                          </>
                                        )}
                                      </button>
                                    )
                                  ) : (
                                    /* Mode Viewer: Tampilkan Lencana Statis */
                                    <AccessBadge
                                      hasAccess={isChecked}
                                      scope={perm.scope}
                                      roleKey={role.key}
                                    />
                                  )}
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
                Wewenang peran disimpan dinamis di tabel{" "}
                <code className="font-mono text-[10px] bg-white px-1 py-0.5 rounded border border-slate-200">
                  core.role_permissions
                </code>{" "}
                dan diverifikasi otomatis pada setiap mutasi server.
              </span>
            </div>
            <span className="font-mono text-slate-400">
              Total {matrixData.stats.totalPermissions} Permission Terverifikasi
            </span>
          </div>
        </div>
      )}

      {/* Floating Bottom Bar: Bilah Simpan Saat Mode Edit Aktif */}
      {isEditMode && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#102E50] text-white px-6 py-3.5 rounded-2xl shadow-2xl border border-white/20 flex items-center gap-5 sm:gap-6 animate-in slide-in-from-bottom-5 duration-200 max-w-xl w-[92vw]">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div
              className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                changeCount > 0 ? "bg-[#F2AF3E] animate-pulse" : "bg-slate-400"
              }`}
            />
            <div className="flex flex-col truncate">
              <span className="text-xs font-bold truncate">
                {changeCount === 0
                  ? "Belum ada perubahan wewenang"
                  : `${changeCount} perubahan wewenang belum disimpan`}
              </span>
              <span className="text-[10px] text-slate-300 truncate">
                Klik kotak pada tabel untuk mengubah akses peran
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCancelEdits}
              disabled={isSaving}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSaveEdits}
              disabled={isSaving || changeCount === 0}
              className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded-xl bg-[#F2AF3E] text-[#102E50] hover:bg-[#ffc15e] transition-colors shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Perubahan</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Dialog Konfirmasi: Kembalikan ke Default Sistem */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
              <RotateCcw className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900 font-serif">
                Kembalikan Wewenang ke Standar Sistem?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Tindakan ini akan mengatur ulang seluruh pemetaan izin untuk peran{" "}
                <strong>Admin HR, Manajer, Staf, dan Admin IT</strong> kembali persis sesuai
                standar blueprint awal PSPK. Peran Super Admin tetap aman.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                disabled={isResetting}
                className="flex-1 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleResetToDefault}
                disabled={isResetting}
                className="flex-1 py-2 text-xs font-bold text-white bg-[#102E50] hover:bg-[#1a4473] rounded-xl transition-colors shadow-xs disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isResetting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Mereset...</span>
                  </>
                ) : (
                  <span>Ya, Kembalikan ke Standar</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit Keterangan Wewenang / Izin */}
      {editingPermission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200/80 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-700 shrink-0">
                  <Edit3 className="w-5 h-5 text-[#F2AF3E]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-serif">
                    Ubah Keterangan Wewenang
                  </h3>
                  <p className="text-xs text-slate-500">
                    Kategori: {editingPermission.categoryLabel} (
                    {editingPermission.app === "hris" ? "HRIS Core" : "System Management"})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingPermission(null)}
                disabled={isUpdatingDescription}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDescription} className="space-y-4">
              {/* Identifikasi Izin */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Kunci Izin (System Key)
                </span>
                <div className="font-mono text-xs font-semibold text-[#102E50] select-all">
                  {editingPermission.key}
                </div>
              </div>

              {/* Input Keterangan */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="perm-desc-input" className="font-semibold text-slate-700">
                    Teks Deskripsi / Keterangan
                  </label>
                  <span
                    className={`text-[10px] font-mono ${
                      editedDescriptionInput.length > 255
                        ? "text-red-600 font-bold"
                        : "text-slate-400"
                    }`}
                  >
                    {editedDescriptionInput.length}/255
                  </span>
                </div>
                <textarea
                  id="perm-desc-input"
                  rows={3}
                  value={editedDescriptionInput}
                  onChange={(e) => setEditedDescriptionInput(e.target.value)}
                  maxLength={255}
                  disabled={isUpdatingDescription}
                  placeholder="Tuliskan keterangan wewenang yang jelas dan mudah dipahami..."
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#102E50] focus:border-transparent transition-all disabled:bg-slate-100 resize-none text-slate-800"
                  autoFocus
                />
                <p className="text-[11px] text-slate-400">
                  Perubahan keterangan ini akan langsung terlihat di matriks peran dan audit log sistem.
                </p>
              </div>

              {/* Aksi */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingPermission(null)}
                  disabled={isUpdatingDescription}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={
                    isUpdatingDescription ||
                    !editedDescriptionInput.trim() ||
                    editedDescriptionInput.trim() === editingPermission.description
                  }
                  className="px-4 py-2 text-xs font-bold text-white bg-[#102E50] hover:bg-[#1a4473] rounded-xl transition-colors shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isUpdatingDescription ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Simpan Keterangan</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Komponen Badge Indikator Akses (Mode Viewer)
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
