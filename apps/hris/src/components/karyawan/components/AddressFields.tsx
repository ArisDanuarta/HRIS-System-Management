"use client";

import React from "react";
import { MapPin, Lock } from "lucide-react";
import { AddressData } from "../types/employee-form.types";

interface AddressFieldsProps {
  title: string;
  description?: string;
  value: AddressData;
  onChange: (data: AddressData) => void;
  disabled?: boolean;
  required?: boolean;
  syncOption?: {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label: string;
  };
  className?: string;
}

export function AddressFields({
  title,
  description,
  value,
  onChange,
  disabled = false,
  required = false,
  syncOption,
  className = "",
}: AddressFieldsProps) {
  const handleChange = (field: keyof AddressData, val: string) => {
    onChange({
      ...value,
      [field]: val,
    });
  };

  const isLocked = disabled || Boolean(syncOption?.checked);

  return (
    <div
      className={`border rounded-xl p-4 sm:p-5 bg-white transition-all flex flex-col gap-4 ${
        isLocked
          ? "border-slate-200/80 bg-slate-50/40"
          : "border-slate-200 hover:border-slate-300 shadow-2xs"
      } ${className}`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#102E50]/10 text-[#102E50] flex items-center justify-center shrink-0">
            <MapPin className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs font-bold text-slate-900 tracking-tight uppercase">
                {title}
              </h4>
              {required && <span className="text-xs font-bold text-red-500">*</span>}
            </div>
            {description && (
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Sync Checkbox if provided (e.g. Sama dengan KTP) */}
        {syncOption && (
          <label className="flex items-center gap-2 cursor-pointer select-none bg-blue-50/60 hover:bg-blue-50 border border-blue-200/80 px-2.5 py-1.5 rounded-lg transition-colors">
            <input
              type="checkbox"
              checked={syncOption.checked}
              onChange={(e) => syncOption.onChange(e.target.checked)}
              className="rounded border-slate-300 text-[#102E50] focus:ring-[#102E50] w-4 h-4 cursor-pointer"
            />
            <span className="text-xs font-semibold text-[#102E50]">
              {syncOption.label}
            </span>
          </label>
        )}
      </div>

      {isLocked && syncOption?.checked && (
        <div className="p-2.5 rounded-lg bg-blue-50/50 border border-blue-100 text-blue-800 text-[11px] flex items-center gap-2 font-medium">
          <Lock className="w-3.5 h-3.5 shrink-0" />
          <span>
            Nilai alamat otomatis disinkronkan dari Alamat KTP dan dikunci. Hilangkan centang di atas untuk mengubah mandiri.
          </span>
        </div>
      )}

      {/* Grid Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {/* Alamat Lengkap (Textarea full row) */}
        <div className="col-span-1 sm:col-span-2 md:col-span-3 flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-700">
            Jalan / RT / RW / No. Bangunan
          </label>
          <textarea
            rows={2}
            value={value.street || ""}
            onChange={(e) => handleChange("street", e.target.value)}
            disabled={isLocked}
            placeholder="Contoh: Jl. Panglima Polim Raya No. 45, RT 02 / RW 05"
            className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50] disabled:bg-slate-100/70 disabled:text-slate-500 disabled:cursor-not-allowed resize-none transition-colors"
          />
        </div>

        {/* Kelurahan / Desa */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-700">
            Kelurahan / Desa
          </label>
          <input
            type="text"
            value={value.kelurahan || ""}
            onChange={(e) => handleChange("kelurahan", e.target.value)}
            disabled={isLocked}
            placeholder="Kelurahan"
            className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50] disabled:bg-slate-100/70 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors"
          />
        </div>

        {/* Kecamatan */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-700">
            Kecamatan
          </label>
          <input
            type="text"
            value={value.kecamatan || ""}
            onChange={(e) => handleChange("kecamatan", e.target.value)}
            disabled={isLocked}
            placeholder="Kecamatan"
            className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50] disabled:bg-slate-100/70 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors"
          />
        </div>

        {/* Kota / Kabupaten */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-700">
            Kota / Kabupaten
          </label>
          <input
            type="text"
            value={value.city || ""}
            onChange={(e) => handleChange("city", e.target.value)}
            disabled={isLocked}
            placeholder="Kota / Kabupaten"
            className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50] disabled:bg-slate-100/70 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors"
          />
        </div>

        {/* Provinsi */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-700">
            Provinsi
          </label>
          <input
            type="text"
            value={value.province || ""}
            onChange={(e) => handleChange("province", e.target.value)}
            disabled={isLocked}
            placeholder="Provinsi"
            className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50] disabled:bg-slate-100/70 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors"
          />
        </div>

        {/* Kode Pos */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-700">
            Kode Pos (5 Digit)
          </label>
          <input
            type="text"
            maxLength={5}
            value={value.postalCode || ""}
            onChange={(e) => {
              const numOnly = e.target.value.replace(/\D/g, "");
              handleChange("postalCode", numOnly);
            }}
            disabled={isLocked}
            placeholder="12345"
            className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50] disabled:bg-slate-100/70 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors"
          />
        </div>
      </div>
    </div>
  );
}
