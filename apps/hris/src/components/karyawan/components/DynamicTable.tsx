"use client";

import React from "react";
import { Plus, Trash2, Layers } from "lucide-react";

export interface DynamicColumn {
  key: string;
  label: string;
  width?: string;
  className?: string;
}

interface DynamicTableProps<T> {
  title: string;
  description?: string;
  columns: DynamicColumn[];
  items: T[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  renderDesktopRow: (item: T, index: number) => React.ReactNode;
  renderMobileCard: (item: T, index: number, onRemove: () => void) => React.ReactNode;
  addButtonLabel?: string;
  emptyMessage?: string;
  maxRows?: number;
  disabled?: boolean;
  className?: string;
}

export function DynamicTable<T>({
  title,
  description,
  columns,
  items,
  onAdd,
  onRemove,
  renderDesktopRow,
  renderMobileCard,
  addButtonLabel = "Tambah Baris",
  emptyMessage = "Belum ada data ditambahkan.",
  maxRows,
  disabled = false,
  className = "",
}: DynamicTableProps<T>) {
  const canAdd = !disabled && (!maxRows || items.length < maxRows);

  return (
    <div className={`border border-slate-200/90 rounded-xl overflow-hidden bg-white ${className}`}>
      {/* Header bar */}
      <div className="p-3.5 sm:p-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-bold text-slate-800 tracking-tight uppercase">
              {title}
            </h4>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-600">
              {items.length} Data
            </span>
          </div>
          {description && (
            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
              {description}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onAdd}
          disabled={!canAdd}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-colors ${
            canAdd
              ? "bg-[#102E50] text-white hover:bg-[#102E50]/90 active:scale-[0.98]"
              : "bg-slate-200 text-slate-400 cursor-not-allowed"
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{addButtonLabel}</span>
        </button>
      </div>

      {/* Content */}
      {items.length === 0 ? (
        <div className="p-6 sm:p-8 text-center flex flex-col items-center justify-center gap-2 bg-slate-50/20">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
            <Layers className="w-5 h-5" />
          </div>
          <p className="text-xs font-medium text-slate-500">{emptyMessage}</p>
          {canAdd && (
            <button
              type="button"
              onClick={onAdd}
              className="text-xs font-bold text-[#102E50] hover:underline mt-0.5"
            >
              + {addButtonLabel} Sekarang
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table View (md and up) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3 w-10 text-center">#</th>
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className={`py-2.5 px-3 ${col.width ? col.width : ""} ${
                        col.className || ""
                      }`}
                    >
                      {col.label}
                    </th>
                  ))}
                  <th className="py-2.5 px-3 w-14 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item, index) => (
                  <tr
                    key={index}
                    className="hover:bg-slate-50/60 transition-colors group align-top"
                  >
                    <td className="py-3 px-3 text-center font-bold text-slate-400 text-xs">
                      {index + 1}
                    </td>
                    {renderDesktopRow(item, index)}
                    <td className="py-3 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => onRemove(index)}
                        disabled={disabled}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Hapus Baris"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Stacking View (< md) */}
          <div className="md:hidden p-3 divide-y divide-slate-100 flex flex-col gap-3">
            {items.map((item, index) => (
              <div
                key={index}
                className="p-3 rounded-lg border border-slate-200 bg-slate-50/40 flex flex-col gap-2.5 relative"
              >
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Data #{index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemove(index)}
                    disabled={disabled}
                    className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus</span>
                  </button>
                </div>
                {renderMobileCard(item, index, () => onRemove(index))}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
