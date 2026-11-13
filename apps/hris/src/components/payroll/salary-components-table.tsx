"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { formatRupiah } from "@pspk/shared";
import {
  Plus,
  TrendingUp,
  TrendingDown,
  Edit2,
  Trash2,
  Calendar,
  Layers,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { SalaryComponentModal, SalaryComponentItem } from "./salary-component-modal";
import { deleteSalaryComponentAction } from "@/server/actions/payroll.actions";

interface SalaryComponentsTableProps {
  components: SalaryComponentItem[];
  isEmbedded?: boolean;
}

export function SalaryComponentsTable({
  components,
  isEmbedded = false,
}: SalaryComponentsTableProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState<SalaryComponentItem | null>(null);
  const [deletingComponent, setDeletingComponent] = useState<SalaryComponentItem | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  const items = components.filter((c) => !deletedIds.has(c.id));
  const earnings = items.filter((c) => c.type === "EARNING");
  const deductions = items.filter((c) => c.type === "DEDUCTION");

  const handleDelete = () => {
    if (!deletingComponent) return;
    setFeedback(null);

    startTransition(async () => {
      const res = await deleteSalaryComponentAction(deletingComponent.id);
      if (res.ok) {
        setFeedback({ type: "success", text: res.message });
        setDeletedIds((prev) => new Set(prev).add(deletingComponent.id));
        setDeletingComponent(null);
      } else {
        setFeedback({ type: "error", text: res.error });
        setDeletingComponent(null);
      }
    });
  };

  const getCalcTypeBadge = (calcType: string) => {
    switch (calcType) {
      case "FIXED":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            Nominal Tetap (Rp)
          </span>
        );
      case "PERCENT_OF_BASE":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            % Gaji Pokok
          </span>
        );
      case "MANUAL":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            Input Manual
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1
            className={`${
              isEmbedded ? "text-base sm:text-lg" : "text-xl"
            } font-bold text-slate-900 font-serif`}
          >
            Master Komponen Gaji & Tunjangan
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola formula tunjangan (*Earnings*) dan potongan (*Deductions*) standar lembaga PSPK.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isEmbedded && (
            <Link
              href="/payroll"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition-colors"
            >
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>Siklus Periode</span>
            </Link>
          )}
          <button
            type="button"
            onClick={() => {
              setSelectedComponent(null);
              setModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#102E50] hover:bg-[#1a4473] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#F2AF3E]" />
            <span>Tambah Komponen</span>
          </button>
        </div>
      </div>

      {/* Alert Notifikasi Status */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs animate-in slide-in-from-top-2 duration-200 ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="leading-relaxed">{feedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 font-bold ml-2 text-sm p-1 rounded-md"
          >
            ✕
          </button>
        </div>
      )}

      {/* Rangkuman Metrik */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Layers className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-medium">Total Komponen</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{items.length} Item</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">
            {items.filter((c) => c.isActive).length} aktif digunakan
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 text-emerald-700 mb-1">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-medium">Tunjangan (Earnings)</span>
          </div>
          <div className="text-2xl font-bold text-emerald-900">{earnings.length} Item</div>
          <div className="text-[11px] text-slate-400 mt-1">Transport, komunikasi, dll</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 text-rose-700 mb-1">
            <TrendingDown className="w-4 h-4 text-rose-600" />
            <span className="text-xs font-medium">Potongan (Deductions)</span>
          </div>
          <div className="text-2xl font-bold text-rose-900">{deductions.length} Item</div>
          <div className="text-[11px] text-slate-400 mt-1">BPJS & estimasi PPh 21</div>
        </div>
      </div>

      {/* Tabel Komponen */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* 1. Mobile Card View (< sm) */}
        <div className="sm:hidden divide-y divide-slate-100">
          {items.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Belum ada komponen gaji yang terdaftar.
            </div>
          ) : (
            items.map((c) => {
              const isEarning = c.type === "EARNING";
              return (
                <div key={c.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-slate-900 text-sm leading-tight">
                        {c.name}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                        Kode: {c.code}
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${
                        c.isActive
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-500 border border-slate-200"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          c.isActive ? "bg-emerald-500" : "bg-slate-400"
                        }`}
                      />
                      {c.isActive ? "Aktif" : "Nonaktif"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block uppercase">
                        Kategori
                      </span>
                      <div className="mt-0.5">
                        {isEarning ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <TrendingUp className="w-3 h-3 text-emerald-600" />
                            Pendapatan
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                            <TrendingDown className="w-3 h-3 text-rose-600" />
                            Potongan
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block uppercase">
                        Metode Kalkulasi
                      </span>
                      <div className="mt-0.5">{getCalcTypeBadge(c.calcType)}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block uppercase">
                        Nilai Acuan
                      </span>
                      <span className="font-mono text-xs font-bold text-slate-800">
                        {c.calcType === "PERCENT_OF_BASE"
                          ? `${c.defaultValue}% dari Pokok`
                          : c.calcType === "MANUAL"
                            ? "Sesuai Input"
                            : formatRupiah(c.defaultValue)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedComponent(c);
                          setModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 hover:text-[#102E50] rounded-lg text-xs font-semibold transition-colors shadow-2xs"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                        <span>Ubah</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFeedback(null);
                          setDeletingComponent(c);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-lg text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
                        title="Hapus Komponen"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 2. Desktop Table View (>= sm) */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Kode & Nama Komponen</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Metode Kalkulasi</th>
                <th className="py-3 px-4 text-right">Nilai Default</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                    Belum ada komponen gaji yang terdaftar.
                  </td>
                </tr>
              ) : (
                items.map((c) => {
                  const isEarning = c.type === "EARNING";

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/60 transition-colors group">
                      {/* Kode & Nama */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 text-xs">{c.name}</div>
                        <div className="text-[11px] font-mono text-slate-400">{c.code}</div>
                      </td>

                      {/* Kategori */}
                      <td className="py-3 px-4">
                        {isEarning ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <TrendingUp className="w-3 h-3 text-emerald-600" />
                            Pendapatan
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                            <TrendingDown className="w-3 h-3 text-rose-600" />
                            Potongan
                          </span>
                        )}
                      </td>

                      {/* Metode Kalkulasi */}
                      <td className="py-3 px-4">{getCalcTypeBadge(c.calcType)}</td>

                      {/* Nilai Default */}
                      <td className="py-3 px-4 text-right font-mono text-xs text-slate-800">
                        {c.calcType === "PERCENT_OF_BASE"
                          ? `${c.defaultValue}% dari Pokok`
                          : c.calcType === "MANUAL"
                            ? "Sesuai Input"
                            : formatRupiah(c.defaultValue)}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            c.isActive
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-slate-100 text-slate-500 border border-slate-200"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              c.isActive ? "bg-emerald-500" : "bg-slate-400"
                            }`}
                          />
                          {c.isActive ? "Aktif" : "Nonaktif"}
                        </span>
                      </td>

                      {/* Aksi */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedComponent(c);
                              setModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 hover:text-[#102E50] rounded-lg text-xs font-medium transition-colors shadow-2xs cursor-pointer"
                            title="Ubah Komponen"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                            <span>Ubah</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setFeedback(null);
                              setDeletingComponent(c);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-lg text-xs font-medium transition-colors shadow-2xs cursor-pointer"
                            title="Hapus Komponen"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                            <span>Hapus</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah / Edit */}
      <SalaryComponentModal
        isOpen={modalOpen}
        component={selectedComponent}
        onClose={() => setModalOpen(false)}
      />

      {/* Modal Konfirmasi Hapus Komponen Gaji */}
      {deletingComponent && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base font-serif">
                  Hapus Komponen Gaji
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tindakan ini akan menghapus master data komponen secara permanen dari sistem.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs text-slate-700 space-y-1 mb-4">
              <div className="flex justify-between">
                <span className="text-slate-500">Nama Komponen:</span>
                <span className="font-bold text-slate-900">{deletingComponent.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Kode Komponen:</span>
                <span className="font-mono font-bold text-slate-800">{deletingComponent.code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Kategori:</span>
                <span className="font-semibold text-slate-800">
                  {deletingComponent.type === "EARNING" ? "Pendapatan / Tunjangan" : "Potongan"}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200/80 p-2.5 rounded-lg mb-5 leading-relaxed">
              ⚠️ <strong>Pemeriksaan Keamanan:</strong> Komponen hanya dapat dihapus jika belum pernah tercatat dalam riwayat slip gaji historis atau data penugasan karyawan. Jika sudah pernah digunakan, Anda disarankan untuk menonaktifkannya.
            </p>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingComponent(null)}
                disabled={isPending}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {isPending ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>{isPending ? "Menghapus..." : "Ya, Hapus Permanen"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
