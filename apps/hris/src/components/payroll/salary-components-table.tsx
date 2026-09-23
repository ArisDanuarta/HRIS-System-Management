"use client";

import React, { useState } from "react";
import Link from "next/link";
import { formatRupiah } from "@pspk/shared";
import {
  Plus,
  TrendingUp,
  TrendingDown,
  Edit2,
  Calendar,
  Layers,
} from "lucide-react";
import { SalaryComponentModal, SalaryComponentItem } from "./salary-component-modal";

interface SalaryComponentsTableProps {
  components: SalaryComponentItem[];
}

export function SalaryComponentsTable({ components }: SalaryComponentsTableProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState<SalaryComponentItem | null>(null);

  const earnings = components.filter((c) => c.type === "EARNING");
  const deductions = components.filter((c) => c.type === "DEDUCTION");

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
          <h1 className="text-xl font-bold text-slate-900 font-serif">
            Master Komponen Gaji & Tunjangan
          </h1>
          <p className="text-xs text-slate-500">
            Kelola formula tunjangan (*Earnings*) dan potongan (*Deductions*) standar PSPK.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/payroll"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition-colors"
          >
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>Siklus Periode</span>
          </Link>
          <button
            type="button"
            onClick={() => {
              setSelectedComponent(null);
              setModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#102E50] hover:bg-[#1a4473] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-[#F2AF3E]" />
            <span>Tambah Komponen</span>
          </button>
        </div>
      </div>

      {/* Rangkuman Metrik */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Layers className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-medium">Total Komponen</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{components.length} Item</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">
            {components.filter((c) => c.isActive).length} aktif digunakan
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
        <div className="overflow-x-auto">
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
              {components.map((c) => {
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
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedComponent(c);
                          setModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 hover:text-[#102E50] rounded-lg text-xs font-medium transition-colors shadow-2xs"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                        <span>Ubah</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
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
    </div>
  );
}
