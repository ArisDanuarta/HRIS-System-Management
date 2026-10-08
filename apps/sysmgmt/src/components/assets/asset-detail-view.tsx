"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  SerializedAsset,
  ActiveEmployeeOption,
} from "@/server/queries/asset.queries";
import { AssetFormModal } from "./asset-form-modal";
import { AssetDeleteModal } from "./asset-delete-modal";
import { AssetCheckoutModal } from "./asset-checkout-modal";
import { AssetCheckinModal } from "./asset-checkin-modal";
import { formatRupiah, formatDate, formatDateTime } from "@pspk/shared";
import {
  ArrowLeft,
  Package,
  CheckCircle2,
  Wrench,
  AlertCircle,
  MapPin,
  Edit2,
  Trash2,
  UserCheck,
  RotateCcw,
  User,
  History,
} from "lucide-react";

interface AssetDetailViewProps {
  asset: SerializedAsset;
  employees: ActiveEmployeeOption[];
  canWrite: boolean;
  isAssignmentModuleActive: boolean;
}

export function AssetDetailView({
  asset,
  employees,
  canWrite,
  isAssignmentModuleActive,
}: AssetDetailViewProps) {
  const router = useRouter();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isCheckinModalOpen, setIsCheckinModalOpen] = useState(false);

  const activeAssignment = asset.activeAssignment;
  const assignments = asset.assignments || [];

  return (
    <div className="space-y-6">
      {/* 1. Header & Breadcrumb */}
      <div>
        <Link
          href="/aset"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#102E50] mb-3 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Direktori Inventaris</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-mono font-bold text-sm text-[#102E50] bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                {asset.assetTag}
              </span>
              <span
                className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                  asset.category === "IT"
                    ? "bg-sky-50 text-sky-700 border border-sky-200"
                    : "bg-amber-50 text-amber-700 border border-amber-200"
                }`}
              >
                {asset.category === "IT" ? "Perangkat IT" : "Fasilitas Non-IT"}
              </span>
              <span className="text-xs text-slate-400 font-medium">Tipe: {asset.type}</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 font-serif">{asset.name}</h1>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {canWrite && isAssignmentModuleActive && (
              <>
                {asset.status === "IN_STOCK" && (
                  <button
                    type="button"
                    onClick={() => setIsCheckoutModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
                  >
                    <UserCheck className="w-4 h-4 text-white" />
                    <span>Serah Terima ke Pegawai</span>
                  </button>
                )}
                {asset.status === "ASSIGNED" && (
                  <button
                    type="button"
                    onClick={() => setIsCheckinModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
                  >
                    <RotateCcw className="w-4 h-4 text-white" />
                    <span>Terima Pengembalian</span>
                  </button>
                )}
              </>
            )}

            {canWrite && (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-700 hover:text-[#102E50] text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Ubah Data</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold rounded-lg transition-colors shadow-2xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 2. Grid Dua Kolom (Kiri 8-span, Kanan 4-span) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Kolom Kiri: Spesifikasi & Riwayat */}
        <div className="lg:col-span-8 space-y-6">
          {/* Panel Spesifikasi */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-5">
            <h3 className="text-sm font-bold text-slate-900 font-serif flex items-center gap-2">
              <Package className="w-4 h-4 text-[#102E50]" />
              <span>Spesifikasi & Detail Perangkat</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100 space-y-1">
                <span className="text-slate-400 block font-medium">Merek / Brand:</span>
                <span className="font-semibold text-slate-800 text-sm">
                  {asset.brand || "-"}
                </span>
              </div>

              <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100 space-y-1">
                <span className="text-slate-400 block font-medium">Model / Tipe Seri:</span>
                <span className="font-semibold text-slate-800 text-sm">
                  {asset.model || "-"}
                </span>
              </div>

              <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100 space-y-1">
                <span className="text-slate-400 block font-medium">Nomor Seri (Serial Number):</span>
                <span className="font-mono font-bold text-slate-800 text-sm">
                  {asset.serialNumber || "-"}
                </span>
              </div>

              <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100 space-y-1">
                <span className="text-slate-400 block font-medium">Lokasi Penempatan:</span>
                <span className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  {asset.location || "Gudang Kantor"}
                </span>
              </div>

              <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100 space-y-1">
                <span className="text-slate-400 block font-medium">Tanggal Perolehan / Pembelian:</span>
                <span className="font-semibold text-slate-800 text-sm">
                  {asset.purchaseDate ? formatDate(asset.purchaseDate) : "-"}
                </span>
              </div>

              <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100 space-y-1">
                <span className="text-slate-400 block font-medium">Harga Perolehan:</span>
                <span className="font-semibold text-emerald-700 text-sm">
                  {asset.purchasePrice ? formatRupiah(asset.purchasePrice) : "-"}
                </span>
              </div>
            </div>

            {asset.notes && (
              <div className="pt-3 border-t border-slate-100">
                <span className="text-xs font-semibold text-slate-700 block mb-1">
                  Catatan Spesifikasi / Fisik:
                </span>
                <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200/60 whitespace-pre-wrap">
                  {asset.notes}
                </p>
              </div>
            )}
          </div>

          {/* Panel Riwayat Peminjaman (Serah Terima) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 font-serif flex items-center gap-2">
                <History className="w-4 h-4 text-[#102E50]" />
                <span>Riwayat Serah Terima & Peminjaman Pegawai</span>
              </h3>
              <span className="text-xs font-medium text-slate-400">
                {assignments.length} transaksi tercatat
              </span>
            </div>

            {!isAssignmentModuleActive ? (
              <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>Sub-Modul Serah Terima Dinonaktifkan</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Fitur pencatatan peminjaman ke staf saat ini sedang di-nonaktifkan di Tata Kelola
                  Modul. Anda dapat mengaktifkannya kembali kapan saja untuk mulai melacak riwayat
                  penugasan unit ini.
                </p>
              </div>
            ) : assignments.length === 0 ? (
              <div className="py-8 text-center text-slate-400 space-y-2 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                <History className="w-6 h-6 mx-auto text-slate-300" />
                <p className="text-xs font-medium text-slate-600">Belum ada riwayat peminjaman</p>
                <p className="text-[11px] text-slate-400">
                  Unit ini belum pernah diserahterimakan kepada staf.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                      <th className="py-2.5 px-3">Pegawai Penerima</th>
                      <th className="py-2.5 px-3">Tanggal Pinjam</th>
                      <th className="py-2.5 px-3">Tanggal Kembali</th>
                      <th className="py-2.5 px-3">Kondisi Keluar / Masuk</th>
                      <th className="py-2.5 px-3">Catatan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {assignments.map((ass) => {
                      const isActive = ass.returnedAt === null;
                      return (
                        <tr
                          key={ass.id}
                          className={`hover:bg-slate-50/50 transition-colors ${
                            isActive ? "bg-sky-50/30 font-medium" : ""
                          }`}
                        >
                          <td className="py-3 px-3">
                            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-[#102E50]" />
                              <span>{ass.employee.fullName}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 pl-5">
                              {ass.employee.departmentName || "Staff"}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-slate-700">
                            {formatDate(ass.assignedAt)}
                          </td>
                          <td className="py-3 px-3">
                            {ass.returnedAt ? (
                              <span className="text-slate-600">{formatDate(ass.returnedAt)}</span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-300">
                                <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
                                Sedang Dipinjam
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 space-y-0.5 text-[11px]">
                            <div className="text-slate-600">
                              <span className="text-slate-400 text-[10px]">Keluar:</span>{" "}
                              {ass.conditionOut || "-"}
                            </div>
                            {ass.conditionIn && (
                              <div className="text-emerald-700 font-medium">
                                <span className="text-slate-400 text-[10px]">Masuk:</span>{" "}
                                {ass.conditionIn}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3 text-slate-500 text-[11px] max-w-xs truncate">
                            {ass.notes || "-"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Kolom Kanan: Status & Pemegang Saat Ini */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card Status Fisik */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Status Ketersediaan
            </span>

            <div>
              {asset.status === "IN_STOCK" && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-emerald-800">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <div className="font-bold text-xs">Tersedia di Gudang</div>
                    <div className="text-[11px] text-emerald-700">
                      Unit siap untuk diserahterimakan kepada staf.
                    </div>
                  </div>
                </div>
              )}

              {asset.status === "ASSIGNED" && (
                <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl flex items-center gap-2.5 text-sky-800">
                  <UserCheck className="w-5 h-5 text-sky-600 shrink-0" />
                  <div>
                    <div className="font-bold text-xs">Sedang Dipinjamkan</div>
                    <div className="text-[11px] text-sky-700">
                      Unit sedang digunakan oleh pegawai aktif.
                    </div>
                  </div>
                </div>
              )}

              {asset.status === "MAINTENANCE" && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2.5 text-amber-800">
                  <Wrench className="w-5 h-5 text-amber-600 shrink-0" />
                  <div>
                    <div className="font-bold text-xs">Dalam Pemeliharaan / Servis</div>
                    <div className="text-[11px] text-amber-700">
                      Unit sedang diperbaiki oleh tim TI / vendor.
                    </div>
                  </div>
                </div>
              )}

              {asset.status === "RETIRED" && (
                <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl flex items-center gap-2.5 text-slate-700">
                  <AlertCircle className="w-5 h-5 text-slate-500 shrink-0" />
                  <div>
                    <div className="font-bold text-xs">Afkir / Tidak Digunakan</div>
                    <div className="text-[11px] text-slate-500">
                      Unit telah usang atau dinonaktifkan dari operasional.
                    </div>
                  </div>
                </div>
              )}

              {asset.status === "LOST" && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-rose-800">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  <div>
                    <div className="font-bold text-xs">Hilang</div>
                    <div className="text-[11px] text-rose-700">
                      Unit dilaporkan hilang dan dalam pelacakan.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Card Pemegang Saat Ini (Hanya jika module assignment aktif) */}
          {isAssignmentModuleActive && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Pemegang Saat Ini
              </span>

              {activeAssignment ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                    <div className="w-10 h-10 rounded-full bg-[#102E50] text-[#F2AF3E] font-bold text-sm flex items-center justify-center shrink-0">
                      {activeAssignment.employee.fullName.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        {activeAssignment.employee.fullName}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {activeAssignment.employee.positionTitle || "Staff"}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {activeAssignment.employee.departmentName}
                      </p>
                    </div>
                  </div>

                  <div className="text-xs space-y-1.5 pt-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Tanggal Serah Terima:</span>
                      <span className="font-semibold text-slate-700">
                        {formatDate(activeAssignment.assignedAt)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Kondisi Keluar:</span>
                      <span className="font-semibold text-slate-700">
                        {activeAssignment.conditionOut || "Baik"}
                      </span>
                    </div>
                    {activeAssignment.notes && (
                      <div className="pt-1 text-[11px] text-slate-500 bg-slate-50 p-2 rounded border border-slate-100">
                        <span className="font-semibold block text-slate-600">Catatan:</span>
                        {activeAssignment.notes}
                      </div>
                    )}
                  </div>

                  {canWrite && (
                    <button
                      type="button"
                      onClick={() => setIsCheckinModalOpen(true)}
                      className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Terima Pengembalian</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-center py-4 space-y-2">
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <Package className="w-4 h-4" />
                  </div>
                  <p className="text-xs font-medium text-slate-600">Unit Berada di Gudang</p>
                  <p className="text-[11px] text-slate-400">
                    Tidak ada staf yang sedang memegang unit ini.
                  </p>
                  {canWrite && asset.status === "IN_STOCK" && (
                    <button
                      type="button"
                      onClick={() => setIsCheckoutModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 rounded-lg text-xs font-semibold transition-colors mt-2"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-sky-600" />
                      <span>Serahkan ke Pegawai</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Card Audit Trail & Metadata */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs text-xs space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Informasi Sistem
            </span>
            <div className="flex justify-between">
              <span className="text-slate-400">Dicatat Pada:</span>
              <span className="text-slate-600">{formatDateTime(asset.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Terakhir Diperbarui:</span>
              <span className="text-slate-600">{formatDateTime(asset.updatedAt)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AssetFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        asset={asset}
        suggestedTagIt={asset.assetTag}
        suggestedTagNonIt={asset.assetTag}
      />

      <AssetDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          router.push("/aset");
        }}
        asset={asset}
      />

      <AssetCheckoutModal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        asset={asset}
        employees={employees}
      />

      <AssetCheckinModal
        isOpen={isCheckinModalOpen}
        onClose={() => setIsCheckinModalOpen(false)}
        asset={asset}
      />
    </div>
  );
}
