"use client";

import React from "react";
import { SerializedSoftwareLicense } from "@/server/queries/license.queries";
import { formatDate } from "@pspk/shared";
import {
  KeyRound,
  Eye,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  ClockAlert,
  CheckCircle2,
  Infinity as InfinityIcon,
  HelpCircle,
} from "lucide-react";

interface LicenseTableProps {
  licenses: SerializedSoftwareLicense[];
  canManage: boolean;
  onEditLicense?: (license: SerializedSoftwareLicense) => void;
  onDeleteLicense?: (license: SerializedSoftwareLicense) => void;
  onRevealKey?: (license: SerializedSoftwareLicense) => void;
  pagination: {
    page: number;
    totalPages: number;
    total: number;
    limit: number;
  };
  onPageChange: (newPage: number) => void;
}

export function LicenseTable({
  licenses,
  canManage,
  onEditLicense,
  onDeleteLicense,
  onRevealKey,
  pagination,
  onPageChange,
}: LicenseTableProps) {
  if (licenses.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center shadow-xs">
        <div className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-4 border border-slate-200">
          <KeyRound className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-slate-800 font-serif">Tidak Ada Lisensi Ditemukan</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Tidak ada data lisensi perangkat lunak yang cocok dengan kriteria pencarian atau penyaring yang dipilih.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-3.5 px-4 pl-6">Perangkat Lunak & Vendor</th>
              <th className="py-3.5 px-4">Alokasi Kursi (Seats)</th>
              <th className="py-3.5 px-4">Masa Berlaku</th>
              <th className="py-3.5 px-4">Kunci Produk (Serial)</th>
              <th className="py-3.5 px-4 pr-6 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {licenses.map((license) => {
              // Menentukan warna progress bar alokasi kursi
              let progressColor = "bg-emerald-500";
              let badgeColor = "bg-emerald-50 text-emerald-700 border-emerald-200";

              if (license.utilizationPercent >= 100) {
                progressColor = "bg-rose-500";
                badgeColor = "bg-rose-50 text-rose-700 border-rose-200";
              } else if (license.utilizationPercent >= 80) {
                progressColor = "bg-amber-500";
                badgeColor = "bg-amber-50 text-amber-700 border-amber-200";
              }

              return (
                <tr
                  key={license.id}
                  className="hover:bg-slate-50/70 transition-colors group"
                >
                  {/* Kolom 1: Perangkat Lunak & Vendor */}
                  <td className="py-4 px-4 pl-6 align-top">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#102E50]/5 border border-[#102E50]/10 flex items-center justify-center text-[#102E50] shrink-0 font-bold text-xs uppercase shadow-2xs mt-0.5">
                        {license.vendor ? license.vendor.substring(0, 2).toUpperCase() : license.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 text-sm leading-tight">
                            {license.name}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 font-medium mt-0.5">
                          {license.vendor || "Vendor Umum / Tidak Dicatat"}
                        </span>
                        {license.notes && (
                          <p className="text-[11px] text-slate-400 line-clamp-1 mt-1 max-w-xs" title={license.notes}>
                            {license.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Kolom 2: Alokasi Kursi (Seats) */}
                  <td className="py-4 px-4 align-top">
                    <div className="flex flex-col gap-1.5 w-full max-w-[200px]">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-800">
                          {license.seatsUsed} <span className="text-slate-400 font-normal">/ {license.seatsTotal}</span>
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full border ${badgeColor}`}
                        >
                          {license.utilizationPercent}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
                        <div
                          className={`h-full ${progressColor} transition-all duration-300 rounded-full`}
                          style={{ width: `${Math.min(license.utilizationPercent, 100)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>{license.seatsTotal - license.seatsUsed > 0 ? `Sisa ${license.seatsTotal - license.seatsUsed} kursi` : "Kuota Penuh"}</span>
                        {license.utilizationPercent >= 80 && (
                          <span className="flex items-center gap-0.5 text-amber-600 font-medium">
                            <AlertTriangle className="w-2.5 h-2.5" /> Kritis
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Kolom 3: Masa Berlaku */}
                  <td className="py-4 px-4 align-top">
                    <div className="flex flex-col gap-1">
                      {license.expiresAt ? (
                        <>
                          <span className="text-xs font-medium text-slate-800">
                            {formatDate(license.expiresAt)}
                          </span>
                          {license.isExpired ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 w-fit">
                              <ClockAlert className="w-3 h-3" /> Kedaluwarsa
                            </span>
                          ) : license.isExpiringSoon ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 w-fit">
                              <ClockAlert className="w-3 h-3" /> Berakhir {license.daysRemaining} hari lagi
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 w-fit">
                              <CheckCircle2 className="w-3 h-3" /> Aktif ({license.daysRemaining} hari)
                            </span>
                          )}
                        </>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-medium text-slate-700 flex items-center gap-1">
                            <InfinityIcon className="w-3.5 h-3.5 text-slate-400" /> Langganan Tetap
                          </span>
                          <span className="inline-flex items-center text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 w-fit">
                            Tanpa Kedaluwarsa
                          </span>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Kolom 4: Kunci Produk */}
                  <td className="py-4 px-4 align-top">
                    {license.hasLicenseKey ? (
                      <div className="flex items-center gap-2">
                        <code className="font-mono text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 select-none">
                          ••••••••••••
                        </code>
                        {canManage && (
                          <button
                            type="button"
                            onClick={() => onRevealKey?.(license)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-[#102E50] hover:text-[#1a4473] bg-[#102E50]/5 hover:bg-[#102E50]/10 rounded-md border border-[#102E50]/20 transition-colors shadow-2xs"
                            title="Buka Kunci Produk (Aktivitas ini dicatat dalam log audit)"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Buka Kunci</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 italic">
                        <HelpCircle className="w-3 h-3" /> Tanpa Kunci
                      </span>
                    )}
                  </td>

                  {/* Kolom 5: Aksi */}
                  <td className="py-4 px-4 pr-6 align-top text-right">
                    {canManage ? (
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onEditLicense?.(license)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-[#102E50] hover:bg-slate-100 transition-colors"
                          title="Ubah Lisensi"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteLicense?.(license)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Hapus Lisensi"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-slate-300 text-xs">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Kontrol Paginasi */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-3.5 bg-slate-50/60 border-t border-slate-200 text-xs text-slate-600">
          <span>
            Menampilkan{" "}
            <span className="font-semibold text-slate-800">
              {(pagination.page - 1) * pagination.limit + 1}
            </span>{" "}
            -{" "}
            <span className="font-semibold text-slate-800">
              {Math.min(pagination.page * pagination.limit, pagination.total)}
            </span>{" "}
            dari <span className="font-semibold text-slate-800">{pagination.total}</span> lisensi
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={pagination.page <= 1}
              onClick={() => onPageChange(pagination.page - 1)}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>
            <span className="px-2 font-medium text-slate-700">
              {pagination.page} / {pagination.totalPages}
            </span>
            <button
              type="button"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => onPageChange(pagination.page + 1)}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
