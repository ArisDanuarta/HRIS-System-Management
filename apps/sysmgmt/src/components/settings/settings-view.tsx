"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  SerializedDocumentCategory,
  SerializedAssetType,
  SerializedAssetLocation,
  SystemPreferencesData,
  SettingsStats,
} from "@/server/queries/settings.queries";
import { SettingsCategoriesTab } from "./settings-categories-tab";
import { SettingsAssetsTab } from "./settings-assets-tab";
import { SettingsPreferencesTab } from "./settings-preferences-tab";
import {
  FolderKanban,
  Layers,
  Sliders,
  Settings,
  ShieldCheck,
  MapPin,
  FileText,
  UploadCloud,
} from "lucide-react";

interface SettingsViewProps {
  categories: SerializedDocumentCategory[];
  assetTypes: SerializedAssetType[];
  assetLocations: SerializedAssetLocation[];
  preferences: SystemPreferencesData;
  stats: SettingsStats;
  canManage: boolean;
}

export function SettingsView({
  categories,
  assetTypes,
  assetLocations,
  preferences,
  stats,
  canManage,
}: SettingsViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabParam = searchParams.get("tab");
  const validTabs = ["categories", "assets", "preferences"];
  const initialActiveTab = tabParam && validTabs.includes(tabParam) ? tabParam : "categories";

  const [activeTab, setActiveTab] = useState<string>(initialActiveTab);

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", newTab);
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header Eksekutif */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1">
            <span>System Management</span>
            <span>&bull;</span>
            <span className="text-[#102E50]">Tata Kelola & Pengaturan</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5 font-serif">
            <Settings className="w-6 h-6 text-[#102E50]" />
            <span>Pengaturan Sistem & Master Data</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Konfigurasi terpusat kategori dokumen resmi lembaga, master tipe & lokasi penempatan aset,
            serta parameter preferensi global platform.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>{canManage ? "Mode Administrator Penuh" : "Akses Hanya Baca"}</span>
          </div>
        </div>
      </div>

      {/* 4 Kartu Statistik Metrik Ringkasan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Kategori Dokumen */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-xs transition flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <FolderKanban className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Kategori Dokumen
            </div>
            <div className="text-xl font-bold text-slate-900 mt-0.5">
              {stats.totalCategories}
              <span className="text-xs font-normal text-slate-400 ml-1.5">
                ({stats.activeCategories} Aktif)
              </span>
            </div>
            <div className="text-[11px] text-blue-700 font-medium mt-0.5 flex items-center gap-1">
              <FileText className="w-3 h-3 text-blue-500" />
              <span>Standardisasi prefix SOP</span>
            </div>
          </div>
        </div>

        {/* Card 2: Master Tipe Aset */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-xs transition flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Tipe Inventaris
            </div>
            <div className="text-xl font-bold text-slate-900 mt-0.5">
              {stats.totalAssetTypes}
              <span className="text-xs font-normal text-slate-400 ml-1.5">
                ({stats.itAssetTypes} TI • {stats.nonItAssetTypes} Non-TI)
              </span>
            </div>
            <div className="text-[11px] text-indigo-700 font-medium mt-0.5">
              Katalog aset & fasilitas
            </div>
          </div>
        </div>

        {/* Card 3: Lokasi Ruangan */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-xs transition flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <MapPin className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Lokasi & Ruangan
            </div>
            <div className="text-xl font-bold text-slate-900 mt-0.5">
              {stats.totalLocations}
              <span className="text-xs font-normal text-slate-400 ml-1.5">
                ({stats.activeLocations} Siap Pakai)
              </span>
            </div>
            <div className="text-[11px] text-emerald-700 font-medium mt-0.5">
              Penempatan fisik kantor
            </div>
          </div>
        </div>

        {/* Card 4: Preferensi Sistem */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-xs transition flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <UploadCloud className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Batas Upload & Retensi
            </div>
            <div className="text-xl font-bold text-slate-900 mt-0.5">
              {preferences.maxUploadMb} MB
              <span className="text-xs font-normal text-slate-400 ml-1.5">
                • {preferences.auditRetentionDays} Hari
              </span>
            </div>
            <div className="text-[11px] text-amber-800 font-medium mt-0.5">
              Timeout: {Math.round(preferences.sessionTimeoutMins / 60)} Jam
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-200 flex items-center gap-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => handleTabChange("categories")}
          className={`flex items-center gap-2 py-3.5 px-4 text-xs font-bold border-b-2 transition -mb-px whitespace-nowrap ${
            activeTab === "categories"
              ? "border-[#102E50] text-[#102E50] bg-white rounded-t-xl"
              : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/60"
          }`}
        >
          <FolderKanban className="w-4 h-4" />
          <span>Kategori Dokumen Resmi</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-600 font-semibold border border-slate-200">
            {categories.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("assets")}
          className={`flex items-center gap-2 py-3.5 px-4 text-xs font-bold border-b-2 transition -mb-px whitespace-nowrap ${
            activeTab === "assets"
              ? "border-[#102E50] text-[#102E50] bg-white rounded-t-xl"
              : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/60"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Master Tipe Aset & Ruangan</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-600 font-semibold border border-slate-200">
            {assetTypes.length + assetLocations.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("preferences")}
          className={`flex items-center gap-2 py-3.5 px-4 text-xs font-bold border-b-2 transition -mb-px whitespace-nowrap ${
            activeTab === "preferences"
              ? "border-[#102E50] text-[#102E50] bg-white rounded-t-xl"
              : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/60"
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Preferensi Platform Global</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === "categories" && (
          <SettingsCategoriesTab categories={categories} canManage={canManage} />
        )}

        {activeTab === "assets" && (
          <SettingsAssetsTab
            assetTypes={assetTypes}
            assetLocations={assetLocations}
            canManage={canManage}
          />
        )}

        {activeTab === "preferences" && (
          <SettingsPreferencesTab preferences={preferences} canManage={canManage} />
        )}
      </div>
    </div>
  );
}
