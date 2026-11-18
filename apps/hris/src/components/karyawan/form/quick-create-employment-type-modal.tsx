"use client";

import React, { useState } from "react";
import { X, Plus, Loader2, AlertCircle } from "lucide-react";
import { useEmployeeForm } from "./employee-form.context";
import { createEmploymentTypeAction } from "@/server/actions/employment-type.actions";
import { EmploymentType } from "@pspk/db";

export function QuickCreateEmploymentTypeModal() {
  const {
    isQuickCreateModalOpen,
    setIsQuickCreateModalOpen,
    setEmploymentTypesList,
    updateField,
  } = useEmployeeForm();

  const [form, setForm] = useState<{
    code: string;
    name: string;
    category: "PERMANENT" | "FIXED_TERM" | "PART_TIME_PROJECT";
    wageType: "MONTHLY" | "HOURLY";
    defaultHourlyRate: string;
    description: string;
  }>({
    code: "",
    name: "",
    category: "FIXED_TERM",
    wageType: "MONTHLY",
    defaultHourlyRate: "30000",
    description: "",
  });

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isQuickCreateModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPending(true);

    try {
      const parsedRate =
        form.wageType === "HOURLY"
          ? Math.max(0, parseFloat(form.defaultHourlyRate) || 0)
          : null;

      const res = await createEmploymentTypeAction({
        code: form.code.trim().toUpperCase(),
        name: form.name.trim(),
        category: form.category,
        wageType: form.wageType,
        defaultHourlyRate: parsedRate,
        description: form.description.trim() || undefined,
        isActive: true,
      });

      if (!res.ok) {
        setError(res.error);
      } else {
        const newType = {
          id: res.data.id,
          code: res.data.code,
          name: res.data.name,
          category: res.data.category,
          wageType: res.data.wageType,
          defaultHourlyRate: res.data.defaultHourlyRate
            ? Number(res.data.defaultHourlyRate)
            : null,
          description: res.data.description,
        };

        setEmploymentTypesList((prev) => [...prev, newType]);
        updateField("employmentTypeId", newType.id);
        updateField("employmentType", newType.category as EmploymentType);
        updateField("wageType", newType.wageType);
        if (newType.wageType === "HOURLY") {
          updateField("hourlyRate", newType.defaultHourlyRate ?? 30000);
        }

        setIsQuickCreateModalOpen(false);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal menambahkan tipe ikatan kerja.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden flex flex-col">
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-[#102E50]" />
            <h3 className="text-sm font-bold text-slate-900 font-heading">
              Tambah Tipe Ikatan Kerja Baru
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setIsQuickCreateModalOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4 text-xs">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="font-bold text-slate-700">Kode Unik *</label>
            <input
              type="text"
              required
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              placeholder="Contoh: PKWT_RISET_2024"
              className="h-10 px-3 rounded-lg border border-slate-200 uppercase font-mono focus:outline-none focus:ring-2 focus:ring-[#102E50]/20"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-bold text-slate-700">Nama Tipe Ikatan Kerja *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Contoh: PKWT Peneliti Kebijakan"
              className="h-10 px-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#102E50]/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-slate-700">Kategori Regulasi</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as any })}
                className="h-10 px-2.5 rounded-lg border border-slate-200"
              >
                <option value="FIXED_TERM">PKWT (Tertentu)</option>
                <option value="PERMANENT">PKWTT (Tetap)</option>
                <option value="PART_TIME_PROJECT">Konsultan / Paruh Waktu</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-slate-700">Skema Pengupahan</label>
              <select
                value={form.wageType}
                onChange={(e) => setForm({ ...form, wageType: e.target.value as any })}
                className="h-10 px-2.5 rounded-lg border border-slate-200"
              >
                <option value="MONTHLY">Bulanan (Monthly)</option>
                <option value="HOURLY">Per Jam (Hourly)</option>
              </select>
            </div>
          </div>

          {form.wageType === "HOURLY" && (
            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-slate-700">Tarif Default Per Jam (Rp)</label>
              <input
                type="number"
                value={form.defaultHourlyRate}
                onChange={(e) => setForm({ ...form, defaultHourlyRate: e.target.value })}
                className="h-10 px-3 rounded-lg border border-slate-200 font-mono"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsQuickCreateModalOpen(false)}
              className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#102E50] text-white font-bold hover:bg-[#0c233d] transition-all disabled:opacity-50"
            >
              {pending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Simpan & Pilih</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
