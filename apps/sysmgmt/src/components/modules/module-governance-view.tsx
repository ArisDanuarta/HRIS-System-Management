"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ModuleGovernanceData,
  ModuleConfigItem,
} from "@/server/queries/module.queries";
import {
  toggleModuleAction,
  resetAllModulesToDefaultAction,
} from "@/server/actions/module.actions";
import {
  Sliders,
  Network,
  Building2,
  TrendingUp,
  Clock,
  UserPlus,
  GraduationCap,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Search,
  Loader2,
  X,
  ExternalLink,
  Layers,
  Sparkles,
} from "lucide-react";

interface ModuleGovernanceViewProps {
  governanceData: ModuleGovernanceData;
}

const MODULE_ICONS: Record<string, React.ElementType> = {
  org_chart: Network,
  organization_structure: Building2,
  performance: TrendingUp,
  timesheet: Clock,
  recruitment: UserPlus,
  training: GraduationCap,
};

export function ModuleGovernanceView({
  governanceData,
}: ModuleGovernanceViewProps) {
  const router = useRouter();

  const [modules, setModules] = useState<ModuleConfigItem[]>(
    governanceData.modules,
  );
  const [pendingModuleKey, setPendingModuleKey] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    moduleKey: string;
    targetEnabled: boolean;
    moduleName: string;
    impactDescription: string;
    affectedRoutes: string[];
  } | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<"ALL" | "hris" | "sysmgmt">("ALL");
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Sinkronkan state jika props diperbarui oleh RSC
  const [prevData, setPrevData] = useState(governanceData);
  if (governanceData !== prevData) {
    setPrevData(governanceData);
    setModules(governanceData.modules);
  }

  // Filter modul berdasarkan pencarian dan kategori
  const filteredModules = modules.filter((m) => {
    if (filterCategory !== "ALL" && m.category !== filterCategory) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.description.toLowerCase().includes(q) ||
      m.moduleKey.toLowerCase().includes(q)
    );
  });

  const activeCount = modules.filter((m) => m.isEnabled).length;
  const inactiveCount = modules.length - activeCount;

  // Handler klik sakelar toggle switch
  const handleToggleClick = (mod: ModuleConfigItem) => {
    const nextEnabled = !mod.isEnabled;

    // Jika ingin menonaktifkan modul yang sedang aktif, mintalah konfirmasi dampak
    if (!nextEnabled) {
      setConfirmModal({
        moduleKey: mod.moduleKey,
        targetEnabled: false,
        moduleName: mod.name,
        impactDescription: mod.impactDescription,
        affectedRoutes: mod.affectedRoutes,
      });
    } else {
      // Jika ingin mengaktifkan, langsung eksekusi
      executeToggle(mod.moduleKey, true);
    }
  };

  // Eksekusi mutasi server action
  const executeToggle = async (moduleKey: string, enabled: boolean) => {
    setPendingModuleKey(moduleKey);
    setFeedbackMessage(null);

    // Optimistic update
    setModules((prev) =>
      prev.map((m) => (m.moduleKey === moduleKey ? { ...m, isEnabled: enabled } : m)),
    );

    try {
      const res = await toggleModuleAction({ moduleKey, enabled });

      if (res.ok) {
        setFeedbackMessage({
          type: "success",
          text: res.message,
        });
        router.refresh();
      } else {
        // Rollback state jika gagal
        setModules((prev) =>
          prev.map((m) =>
            m.moduleKey === moduleKey ? { ...m, isEnabled: !enabled } : m,
          ),
        );
        setFeedbackMessage({
          type: "error",
          text: res.error,
        });
      }
    } catch (err: unknown) {
      setModules((prev) =>
        prev.map((m) =>
          m.moduleKey === moduleKey ? { ...m, isEnabled: !enabled } : m,
        ),
      );
      setFeedbackMessage({
        type: "error",
        text:
          err instanceof Error
            ? err.message
            : "Terjadi kesalahan sistem saat memperbarui status modul.",
      });
    } finally {
      setPendingModuleKey(null);
      setConfirmModal(null);
    }
  };

  // Handler reset semua modul ke default
  const handleResetToDefault = async () => {
    setIsResetting(true);
    setFeedbackMessage(null);

    try {
      const res = await resetAllModulesToDefaultAction();

      if (res.ok) {
        setFeedbackMessage({
          type: "success",
          text: res.message,
        });
        setShowResetModal(false);
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
            : "Gagal mereset modul ke pengaturan default.",
      });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner Feedback */}
      {feedbackMessage && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs animate-in fade-in duration-200 ${
            feedbackMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span className="font-medium">{feedbackMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMessage(null)}
            className="p-1 hover:bg-black/5 rounded-md transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Ringkasan Statistik Modul */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Total Modul Sistem
            </span>
            <Sliders className="w-4 h-4 text-[#102E50]" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2 font-serif">
            {modules.length}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Area modul terkonfigurasi</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Modul Aktif
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-700 mt-2 font-serif">
            {activeCount}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Dapat diakses di HRIS</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Modul Dinonaktifkan
            </span>
            <Sparkles className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-slate-700 mt-2 font-serif">
            {inactiveCount}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Disembunyikan dari navigasi</p>
        </div>
      </div>

      {/* Toolbar Pencarian & Kontrol */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
          {/* Kolom Pencarian */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari modul (contoh: Bagan Organisasi, Kinerja, Timesheet)..."
              className="w-full text-xs pl-9 pr-8 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#102E50] focus:border-transparent transition-all placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Tab Kategori */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setFilterCategory("ALL")}
              className={`px-3 py-1 text-xs rounded-lg font-semibold transition-all ${
                filterCategory === "ALL"
                  ? "bg-white text-[#102E50] shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Semua ({modules.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterCategory("hris")}
              className={`px-3 py-1 text-xs rounded-lg font-semibold transition-all ${
                filterCategory === "hris"
                  ? "bg-white text-[#102E50] shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              HRIS Core
            </button>
          </div>
        </div>

        {/* Tombol Reset ke Default */}
        <button
          type="button"
          onClick={() => setShowResetModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors shrink-0 self-end md:self-auto"
          title="Kembalikan semua status modul ke standar awal PSPK"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
          <span>Reset ke Default PSPK</span>
        </button>
      </div>

      {/* Grid Kartu Modul Sistem */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredModules.map((mod) => {
          const Icon = MODULE_ICONS[mod.moduleKey] || Layers;
          const isPending = pendingModuleKey === mod.moduleKey;

          return (
            <div
              key={mod.key}
              className={`bg-white rounded-2xl border transition-all shadow-2xs flex flex-col justify-between overflow-hidden ${
                mod.isEnabled
                  ? "border-slate-200/90 hover:border-slate-300"
                  : "border-slate-200/60 bg-slate-50/50 opacity-90"
              }`}
            >
              {/* Header Kartu */}
              <div className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                        mod.isEnabled
                          ? "bg-amber-50 text-amber-700 border-amber-200/80"
                          : "bg-slate-100 text-slate-400 border-slate-200"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 leading-snug">
                        {mod.name}
                      </h3>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-semibold inline-block mt-0.5">
                        {mod.moduleKey}
                      </span>
                    </div>
                  </div>

                  {/* Sakelar Toggle Switch */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={mod.isEnabled}
                      disabled={isPending}
                      onClick={() => handleToggleClick(mod)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#102E50] focus:ring-offset-2 disabled:opacity-50 ${
                        mod.isEnabled ? "bg-emerald-600" : "bg-slate-300"
                      }`}
                      title={
                        mod.isEnabled
                          ? "Klik untuk menonaktifkan modul"
                          : "Klik untuk mengaktifkan modul"
                      }
                    >
                      <span className="sr-only">Toggle {mod.name}</span>
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          mod.isEnabled ? "translate-x-5" : "translate-x-0"
                        }`}
                      >
                        {isPending && (
                          <Loader2 className="w-3 h-3 text-[#102E50] animate-spin absolute inset-1" />
                        )}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Deskripsi Modul */}
                <p className="text-xs text-slate-600 leading-relaxed min-h-[38px]">
                  {mod.description}
                </p>

                {/* Status Badge */}
                <div className="flex items-center gap-2 pt-1">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      mod.isEnabled
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-slate-100 text-slate-500 border border-slate-200"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        mod.isEnabled ? "bg-emerald-500" : "bg-slate-400"
                      }`}
                    />
                    {mod.isEnabled ? "Modul Aktif" : "Dinonaktifkan"}
                  </span>

                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 font-medium">
                    {mod.category === "hris" ? "HRIS Core" : "System Management"}
                  </span>
                </div>

                {/* Rute Terdampak */}
                <div className="pt-2 border-t border-slate-100 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Menu & Rute Terdampak
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {mod.affectedRoutes.map((route) => (
                      <span
                        key={route}
                        className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-100/90 text-slate-600 border border-slate-200/60 inline-flex items-center gap-1"
                      >
                        <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                        {route}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer Kartu */}
              <div className="px-5 py-2.5 bg-slate-50/80 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
                <span>
                  {mod.updatedBy
                    ? `Oleh: ${mod.updatedBy.split("@")[0]}`
                    : "Pengaturan Default"}
                </span>
                <span>
                  {mod.updatedAt
                    ? new Date(mod.updatedAt).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "Standar Sistem"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {filteredModules.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto">
          <Sliders className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-slate-700">Modul tidak ditemukan</h4>
          <p className="text-xs text-slate-400 mt-1">
            Tidak ada modul yang cocok dengan kata kunci &quot;{searchQuery}&quot;.
          </p>
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="mt-3 text-xs font-semibold text-[#102E50] hover:underline"
          >
            Bersihkan pencarian
          </button>
        </div>
      )}

      {/* Modal Konfirmasi Penonaktifan Modul */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200/80 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-700 shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 font-serif">
                  Nonaktifkan Modul {confirmModal.moduleName}?
                </h3>
                <p className="text-xs text-slate-500">
                  Konfirmasi penonaktifan fungsionalitas modul sistem
                </p>
              </div>
            </div>

            <div className="bg-amber-50/70 border border-amber-200/70 rounded-xl p-3.5 space-y-2 text-xs text-amber-900">
              <p className="font-semibold text-amber-950">Dampak Penonaktifan:</p>
              <p className="leading-relaxed text-[11px]">
                {confirmModal.impactDescription}
              </p>
              <div className="pt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                  Rute URL yang dialihkan:
                </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {confirmModal.affectedRoutes.map((r) => (
                    <span
                      key={r}
                      className="font-mono text-[10px] px-2 py-0.5 rounded bg-white text-amber-900 border border-amber-300"
                    >
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-500">
              Data yang sudah tersimpan sebelumnya di database tetap utuh dan aman. Anda dapat
              mengaktifkan kembali modul ini sewaktu-waktu.
            </p>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                disabled={Boolean(pendingModuleKey)}
                className="flex-1 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => executeToggle(confirmModal.moduleKey, false)}
                disabled={Boolean(pendingModuleKey)}
                className="flex-1 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-xs disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {pendingModuleKey ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menonaktifkan...</span>
                  </>
                ) : (
                  <span>Ya, Nonaktifkan Modul</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Reset Semua Modul ke Default */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200/80 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200/80 flex items-center justify-center text-[#102E50] shrink-0">
                <RotateCcw className="w-5 h-5 text-[#102E50]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 font-serif">
                  Kembalikan Modul ke Standar Awal?
                </h3>
                <p className="text-xs text-slate-500">
                  Reset konfigurasi seluruh feature flags sistem PSPK
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Tindakan ini akan mengembalikan status seluruh modul (Bagan Organisasi, Struktur
              Organisasi, Kinerja, Timesheet, Rekrutmen, dan Pelatihan) kembali persis sesuai
              konfigurasi default blueprint PSPK.
            </p>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
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
    </div>
  );
}
