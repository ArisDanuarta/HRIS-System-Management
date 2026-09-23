"use client";

import React, { useState, useTransition } from "react";
import { RefreshCw, AlertCircle, CheckCircle2, Sliders } from "lucide-react";
import { createOrUpdateSalaryComponentAction } from "@/server/actions/payroll.actions";

export interface SalaryComponentItem {
  id: string;
  code: string;
  name: string;
  type: "EARNING" | "DEDUCTION";
  calcType: "FIXED" | "PERCENT_OF_BASE" | "MANUAL";
  defaultValue: number | string | null;
  isActive: boolean;
}

interface SalaryComponentModalProps {
  isOpen: boolean;
  component: SalaryComponentItem | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export function SalaryComponentModal({
  isOpen,
  component,
  onClose,
  onSuccess,
}: SalaryComponentModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {component ? "Ubah Komponen Gaji" : "Tambah Komponen Gaji"}
              </h3>
              <p className="text-xs text-slate-500">Konfigurasi tunjangan atau potongan gaji</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            ✕
          </button>
        </div>

        <SalaryComponentForm
          key={component ? component.id : "new-component"}
          component={component}
          onClose={onClose}
          onSuccess={onSuccess}
        />
      </div>
    </div>
  );
}

function SalaryComponentForm({
  component,
  onClose,
  onSuccess,
}: {
  component: SalaryComponentItem | null;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const [code, setCode] = useState(component ? component.code : "");
  const [name, setName] = useState(component ? component.name : "");
  const [type, setType] = useState<"EARNING" | "DEDUCTION">(
    component ? component.type : "EARNING",
  );
  const [calcType, setCalcType] = useState<"FIXED" | "PERCENT_OF_BASE" | "MANUAL">(
    component ? component.calcType : "FIXED",
  );
  const [defaultValue, setDefaultValue] = useState<string>(
    component ? String(component.defaultValue || 0) : "0",
  );
  const [isActive, setIsActive] = useState(component ? component.isActive : true);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const res = await createOrUpdateSalaryComponentAction({
        id: component?.id,
        code,
        name,
        type,
        calcType,
        defaultValue: Number(defaultValue) || 0,
        isActive,
      });

      if (!res.ok) {
        setError(res.error);
      } else {
        setSuccess(res.message);
        setTimeout(() => {
          onClose();
          onSuccess?.();
        }, 1200);
      }
    });
  };

  return (
    <>
      {error && (
        <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 mb-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Tipe Komponen */}
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">
            Kategori Komponen *
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setType("EARNING")}
              className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-all ${
                type === "EARNING"
                  ? "bg-emerald-700 text-white border-emerald-700 shadow-2xs"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              Pendapatan (Earning)
            </button>
            <button
              type="button"
              onClick={() => setType("DEDUCTION")}
              className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-all ${
                type === "DEDUCTION"
                  ? "bg-rose-700 text-white border-rose-700 shadow-2xs"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              Potongan (Deduction)
            </button>
          </div>
        </div>

        {/* Kode & Nama */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Kode *</label>
            <input
              type="text"
              disabled={!!component}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="TUNJ_XXX"
              required
              className="w-full text-xs font-mono border border-slate-200 rounded-lg px-3 py-2 disabled:bg-slate-100 disabled:text-slate-500 focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50]"
            />
          </div>
          <div className="col-span-2">
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Nama Komponen *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Tunjangan Makan"
              required
              className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50]"
            />
          </div>
        </div>

        {/* Metode Kalkulasi */}
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">
            Metode Kalkulasi *
          </label>
          <select
            value={calcType}
            onChange={(e) =>
              setCalcType(e.target.value as "FIXED" | "PERCENT_OF_BASE" | "MANUAL")
            }
            className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-800 font-medium focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50]"
          >
            <option value="FIXED">Nominal Tetap (Rp)</option>
            <option value="PERCENT_OF_BASE">Persentase dari Gaji Pokok (%)</option>
            <option value="MANUAL">Input Manual per Pegawai</option>
          </select>
        </div>

        {/* Nilai Default */}
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">
            {calcType === "PERCENT_OF_BASE"
              ? "Persentase Default (%)"
              : "Nilai Default Bawaan (Rp)"}
          </label>
          <input
            type="number"
            step={calcType === "PERCENT_OF_BASE" ? "0.1" : "1"}
            value={defaultValue}
            onChange={(e) => setDefaultValue(e.target.value)}
            className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 font-mono focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50]"
          />
        </div>

        {/* Status Aktif */}
        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="isActiveComp"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="w-4 h-4 rounded text-[#102E50] border-slate-300 focus:ring-[#102E50]"
          />
          <label htmlFor="isActiveComp" className="text-xs font-medium text-slate-700 cursor-pointer">
            Aktifkan komponen ini dalam kalkulasi otomatis
          </label>
        </div>

        {/* Tombol Aksi */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            disabled={isPending}
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="px-5 py-2 text-xs font-semibold text-white bg-[#102E50] hover:bg-[#1a4473] disabled:opacity-50 rounded-lg transition-all shadow-xs flex items-center gap-2"
          >
            {isPending && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
            <span>{component ? "Simpan Perubahan" : "Tambah Komponen"}</span>
          </button>
        </div>
      </form>
    </>
  );
}
