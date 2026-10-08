"use client";

import React, { useState } from "react";
import { formatDate } from "@pspk/shared";
import {
  Laptop,
  Package,
  CheckCircle2,
  RotateCcw,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  MapPin,
  AlertCircle,
} from "lucide-react";

export interface SerializedEmployeeAssetAssignment {
  id: string;
  assignedAt: Date | string;
  returnedAt: Date | string | null;
  conditionOut: string | null;
  conditionIn: string | null;
  notes: string | null;
  asset: {
    id: string;
    assetTag: string;
    name: string;
    category: "IT" | "NON_IT";
    type: string;
    brand: string | null;
    model: string | null;
    serialNumber: string | null;
    location: string | null;
    status: string;
  };
}

interface EmployeeAssetsCardProps {
  employeeName: string;
  activeAssignments: SerializedEmployeeAssetAssignment[];
  returnedAssignments: SerializedEmployeeAssetAssignment[];
  isHrOrAdmin: boolean;
}

export function EmployeeAssetsCard({
  employeeName,
  activeAssignments,
  returnedAssignments,
  isHrOrAdmin,
}: EmployeeAssetsCardProps) {
  const [showHistory, setShowHistory] = useState(false);

  return (
    <div className="space-y-6">
      {/* 1. Header Card Aset */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#102E50]/10 text-[#102E50] flex items-center justify-center shrink-0">
              <Laptop className="w-5 h-5 text-[#102E50]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-[#102E50] font-heading">
                  Aset & Fasilitas Kerja yang Dibawa
                </h3>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {activeAssignments.length} Unit Aktif
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Daftar inventaris TI dan fasilitas kantor yang sedang dipinjamkan kepada {employeeName}.
              </p>
            </div>
          </div>

          {isHrOrAdmin && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-xs">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Pemeriksaan Wajib Offboarding HR</span>
            </div>
          )}
        </div>

        {/* 2. Daftar Aset Aktif */}
        <div className="pt-4">
          {activeAssignments.length === 0 ? (
            <div className="text-center py-10 px-4 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
              <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2.5">
                <Package className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-bold text-slate-700">
                Tidak Ada Aset yang Sedang Dipinjam
              </h4>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto mt-1">
                Seluruh perangkat komputer atau perlengkapan kantor yang dialokasikan kepada staf ini
                tercatat telah dikembalikan atau belum ada penyerahan aset baru.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeAssignments.map((item) => {
                const { asset } = item;
                const isIT = asset.category === "IT";

                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl border border-slate-200 hover:border-[#102E50]/40 bg-white hover:shadow-xs transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Badge Tag & Kategori */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                          {asset.assetTag}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            isIT
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {isIT ? "Perangkat IT" : "Fasilitas Non-IT"}
                        </span>
                      </div>

                      {/* Nama Aset & Spesifikasi */}
                      <h4 className="font-bold text-xs text-slate-900 line-clamp-1">
                        {asset.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {asset.brand ? `${asset.brand} ` : ""}
                        {asset.model ? `• ${asset.model}` : `(${asset.type})`}
                      </p>

                      {/* Detail Serial & Lokasi */}
                      <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Nomor Seri</span>
                          <span className="font-mono font-medium text-slate-700 truncate block">
                            {asset.serialNumber || "-"}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Tgl Penyerahan</span>
                          <span className="font-medium text-slate-700">
                            {formatDate(item.assignedAt)}
                          </span>
                        </div>
                      </div>

                      {/* Kondisi Keluar */}
                      <div className="mt-2 text-[11px] bg-slate-50 rounded-lg p-2 border border-slate-100">
                        <span className="text-slate-500 font-medium block text-[10px]">
                          Kondisi Saat Diserahkan:
                        </span>
                        <span className="text-slate-700 font-semibold">
                          {item.conditionOut || "Baik / Lengkap"}
                        </span>
                        {item.notes && (
                          <p className="text-[10px] text-slate-500 mt-0.5 italic">
                            Catatan: {item.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <span className="flex items-center gap-1 text-emerald-600 font-medium text-[10px]">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        Status: Sedang Digunakan
                      </span>
                      {asset.location && (
                        <span className="flex items-center gap-1 text-[10px] text-slate-400 truncate max-w-[150px]">
                          <MapPin className="w-2.5 h-2.5 shrink-0" />
                          {asset.location}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 3. Riwayat Pengembalian Lampau (Jika Ada) */}
      {returnedAssignments.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className="w-full flex items-center justify-between text-left cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-slate-500 group-hover:text-[#102E50] transition-colors" />
              <h4 className="font-bold text-xs text-slate-800 group-hover:text-[#102E50] transition-colors">
                Riwayat Pengembalian Aset Lampau ({returnedAssignments.length} Arsip)
              </h4>
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-400 group-hover:text-slate-600">
              <span>{showHistory ? "Sembunyikan" : "Tampilkan"}</span>
              {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>

          {showHistory && (
            <div className="mt-4 pt-4 border-t border-slate-100 overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[10px]">
                    <th className="py-2 px-3">Tag & Nama Aset</th>
                    <th className="py-2 px-3">Tgl Pinjam</th>
                    <th className="py-2 px-3">Tgl Kembali</th>
                    <th className="py-2 px-3">Kondisi Saat Kembali</th>
                    <th className="py-2 px-3">Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {returnedAssignments.map((h) => (
                    <tr key={h.id} className="hover:bg-slate-50/60">
                      <td className="py-2 px-3">
                        <span className="font-mono text-[11px] font-bold text-slate-800 block">
                          {h.asset.assetTag}
                        </span>
                        <span className="text-[11px] text-slate-600 font-medium block">
                          {h.asset.name}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-600 whitespace-nowrap">
                        {formatDate(h.assignedAt)}
                      </td>
                      <td className="py-2 px-3 text-emerald-700 font-medium whitespace-nowrap">
                        {h.returnedAt ? formatDate(h.returnedAt) : "-"}
                      </td>
                      <td className="py-2 px-3 text-slate-700">
                        {h.conditionIn || "Baik / Lengkap"}
                      </td>
                      <td className="py-2 px-3 text-slate-500 text-[11px]">
                        {h.notes || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 4. Banner Petunjuk Offboarding HR */}
      <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-3">
        <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-blue-950">
            Panduan Inventarisasi Aset & Serah Terima Lembaga:
          </p>
          <p className="text-[11px] text-blue-800 leading-relaxed">
            Data peminjaman perangkat di atas tersinkronisasi langsung secara real-time dengan portal{" "}
            <strong>System Management PSPK</strong>. Untuk memproses serah terima baru atau penerimaan kembali barang fisik,
            Admin TI / Super Admin dapat mengelolanya melalui menu <em>Inventaris Aset</em>.
          </p>
        </div>
      </div>
    </div>
  );
}
