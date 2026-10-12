"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  SerializedAssetType,
  SerializedAssetLocation,
} from "@/server/queries/settings.queries";
import {
  toggleAssetTypeStatusAction,
  toggleAssetLocationStatusAction,
} from "@/server/actions/settings.actions";
import { SettingsAssetTypeModal } from "./settings-asset-type-modal";
import { SettingsAssetLocationModal } from "./settings-asset-location-modal";
import { SettingsDeleteAssetMasterModal } from "./settings-delete-asset-master-modal";
import {
  Layers,
  MapPin,
  Plus,
  Search,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Monitor,
  Package,
  Loader2,
  Building2,
} from "lucide-react";

interface SettingsAssetsTabProps {
  assetTypes: SerializedAssetType[];
  assetLocations: SerializedAssetLocation[];
  canManage: boolean;
}

export function SettingsAssetsTab({
  assetTypes,
  assetLocations,
  canManage,
}: SettingsAssetsTabProps) {
  const router = useRouter();
  const [subTab, setSubTab] = useState<"TYPES" | "LOCATIONS">("TYPES");

  // State for Tipe Aset
  const [searchType, setSearchType] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"ALL" | "IT" | "NON_IT">("ALL");
  const [typeModalOpen, setTypeModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<SerializedAssetType | null>(null);

  // State for Lokasi
  const [searchLocation, setSearchLocation] = useState("");
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<SerializedAssetLocation | null>(null);

  // State for Delete Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    kind: "TYPE" | "LOCATION";
    id: string;
    name: string;
  } | null>(null);

  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Filter types
  const filteredTypes = assetTypes.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchType.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchType.toLowerCase()));

    if (!matchesSearch) return false;

    if (categoryFilter === "IT") return t.category === "IT";
    if (categoryFilter === "NON_IT") return t.category === "NON_IT";
    return true;
  });

  // Filter locations
  const filteredLocations = assetLocations.filter((loc) => {
    return (
      loc.name.toLowerCase().includes(searchLocation.toLowerCase()) ||
      (loc.building && loc.building.toLowerCase().includes(searchLocation.toLowerCase())) ||
      (loc.floor && loc.floor.toLowerCase().includes(searchLocation.toLowerCase())) ||
      (loc.description && loc.description.toLowerCase().includes(searchLocation.toLowerCase()))
    );
  });

  const handleToggleType = async (type: SerializedAssetType) => {
    if (!canManage) return;
    setTogglingId(type.id);
    try {
      await toggleAssetTypeStatusAction({ id: type.id });
      router.refresh();
    } catch (err) {
      console.error("Gagal toggle tipe aset:", err);
    } finally {
      setTogglingId(null);
    }
  };

  const handleToggleLocation = async (loc: SerializedAssetLocation) => {
    if (!canManage) return;
    setTogglingId(loc.id);
    try {
      await toggleAssetLocationStatusAction({ id: loc.id });
      router.refresh();
    } catch (err) {
      console.error("Gagal toggle lokasi aset:", err);
    } finally {
      setTogglingId(null);
    }
  };

  const handleOpenDeleteType = (type: SerializedAssetType) => {
    setDeleteTarget({ kind: "TYPE", id: type.id, name: type.name });
    setDeleteModalOpen(true);
  };

  const handleOpenDeleteLocation = (loc: SerializedAssetLocation) => {
    setDeleteTarget({ kind: "LOCATION", id: loc.id, name: loc.name });
    setDeleteModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Sub-tab Navigation */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setSubTab("TYPES")}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition -mb-px ${
            subTab === "TYPES"
              ? "border-[#102E50] text-[#102E50]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Tipe Inventaris Aset</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-600 font-semibold border border-slate-200">
            {assetTypes.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab("LOCATIONS")}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition -mb-px ${
            subTab === "LOCATIONS"
              ? "border-[#102E50] text-[#102E50]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Lokasi & Ruangan Kantor</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-600 font-semibold border border-slate-200">
            {assetLocations.length}
          </span>
        </button>
      </div>

      {/* SECTION 1: TIPE INVENTARIS ASET */}
      {subTab === "TYPES" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value)}
                  placeholder="Cari tipe aset..."
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#102E50] focus:border-transparent transition"
                />
              </div>
              <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setCategoryFilter("ALL")}
                  className={`px-3 py-1.5 rounded-lg font-medium transition ${
                    categoryFilter === "ALL" ? "bg-white text-slate-900 shadow-2xs font-bold" : "text-slate-600"
                  }`}
                >
                  Semua
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryFilter("IT")}
                  className={`px-3 py-1.5 rounded-lg font-medium transition ${
                    categoryFilter === "IT" ? "bg-white text-blue-700 shadow-2xs font-bold" : "text-slate-600"
                  }`}
                >
                  IT
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryFilter("NON_IT")}
                  className={`px-3 py-1.5 rounded-lg font-medium transition ${
                    categoryFilter === "NON_IT" ? "bg-white text-emerald-700 shadow-2xs font-bold" : "text-slate-600"
                  }`}
                >
                  Non-IT
                </button>
              </div>
            </div>

            {canManage && (
              <button
                type="button"
                onClick={() => {
                  setSelectedType(null);
                  setTypeModalOpen(true);
                }}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#102E50] text-white text-xs font-semibold hover:bg-[#102E50]/90 transition shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Tipe Aset</span>
              </button>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Nama Tipe Aset</th>
                    <th className="py-3 px-4">Klasifikasi</th>
                    <th className="py-3 px-4">Keterangan</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    {canManage && <th className="py-3 px-4 text-right">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredTypes.length === 0 ? (
                    <tr>
                      <td colSpan={canManage ? 5 : 4} className="py-12 text-center text-slate-400">
                        <Layers className="w-8 h-8 mx-auto text-slate-300 mb-2 stroke-[1.5]" />
                        <p className="font-semibold text-slate-600">Tidak ada tipe aset ditemukan</p>
                      </td>
                    </tr>
                  ) : (
                    filteredTypes.map((t) => {
                      const isToggling = togglingId === t.id;
                      const isIT = t.category === "IT";

                      return (
                        <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-800">{t.name}</td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                                isIT
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
                              }`}
                            >
                              {isIT ? <Monitor className="w-3 h-3" /> : <Package className="w-3 h-3" />}
                              <span>{isIT ? "Perangkat TI" : "Fasilitas Non-TI"}</span>
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-500">
                            {t.description || <span className="italic text-slate-400">Tanpa keterangan</span>}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {canManage ? (
                              <button
                                type="button"
                                disabled={isToggling}
                                onClick={() => handleToggleType(t)}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition ${
                                  t.isActive
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                    : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
                                }`}
                              >
                                {isToggling ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : t.isActive ? (
                                  <ToggleRight className="w-4 h-4 text-emerald-600" />
                                ) : (
                                  <ToggleLeft className="w-4 h-4 text-slate-400" />
                                )}
                                <span>{t.isActive ? "Aktif" : "Nonaktif"}</span>
                              </button>
                            ) : (
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                  t.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                                }`}
                              >
                                {t.isActive ? "Aktif" : "Nonaktif"}
                              </span>
                            )}
                          </td>
                          {canManage && (
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedType(t);
                                    setTypeModalOpen(true);
                                  }}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
                                  title="Ubah tipe aset"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenDeleteType(t)}
                                  className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition"
                                  title="Hapus tipe aset"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: LOKASI & RUANGAN KANTOR */}
      {subTab === "LOCATIONS" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                placeholder="Cari nama ruangan, gedung, atau lantai..."
                className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#102E50] focus:border-transparent transition"
              />
            </div>

            {canManage && (
              <button
                type="button"
                onClick={() => {
                  setSelectedLocation(null);
                  setLocationModalOpen(true);
                }}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#102E50] text-white text-xs font-semibold hover:bg-[#102E50]/90 transition shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Lokasi Baru</span>
              </button>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Nama Ruangan / Lokasi</th>
                    <th className="py-3 px-4">Gedung</th>
                    <th className="py-3 px-4">Lantai</th>
                    <th className="py-3 px-4">Deskripsi</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    {canManage && <th className="py-3 px-4 text-right">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredLocations.length === 0 ? (
                    <tr>
                      <td colSpan={canManage ? 6 : 5} className="py-12 text-center text-slate-400">
                        <MapPin className="w-8 h-8 mx-auto text-slate-300 mb-2 stroke-[1.5]" />
                        <p className="font-semibold text-slate-600">Tidak ada lokasi ruangan ditemukan</p>
                      </td>
                    </tr>
                  ) : (
                    filteredLocations.map((loc) => {
                      const isToggling = togglingId === loc.id;

                      return (
                        <tr key={loc.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-800 flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span>{loc.name}</span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-700">
                            <span className="inline-flex items-center gap-1">
                              <Building2 className="w-3 h-3 text-slate-400" />
                              <span>{loc.building || "Gedung Edukasi"}</span>
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-medium text-slate-600">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[11px] border border-slate-200">
                              {loc.floor || "Lt. 3"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-500">
                            {loc.description || <span className="italic text-slate-400">Tanpa keterangan</span>}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {canManage ? (
                              <button
                                type="button"
                                disabled={isToggling}
                                onClick={() => handleToggleLocation(loc)}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition ${
                                  loc.isActive
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                    : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
                                }`}
                              >
                                {isToggling ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : loc.isActive ? (
                                  <ToggleRight className="w-4 h-4 text-emerald-600" />
                                ) : (
                                  <ToggleLeft className="w-4 h-4 text-slate-400" />
                                )}
                                <span>{loc.isActive ? "Aktif" : "Nonaktif"}</span>
                              </button>
                            ) : (
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                  loc.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                                }`}
                              >
                                {loc.isActive ? "Aktif" : "Nonaktif"}
                              </span>
                            )}
                          </td>
                          {canManage && (
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedLocation(loc);
                                    setLocationModalOpen(true);
                                  }}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
                                  title="Ubah lokasi"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenDeleteLocation(loc)}
                                  className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition"
                                  title="Hapus lokasi"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <SettingsAssetTypeModal
        isOpen={typeModalOpen}
        onClose={() => setTypeModalOpen(false)}
        initialData={selectedType}
        defaultCategory={categoryFilter === "NON_IT" ? "NON_IT" : "IT"}
      />

      <SettingsAssetLocationModal
        isOpen={locationModalOpen}
        onClose={() => setLocationModalOpen(false)}
        initialData={selectedLocation}
      />

      <SettingsDeleteAssetMasterModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        target={deleteTarget}
      />
    </div>
  );
}
