"use client";

import React from "react";
import { FolderOpen } from "lucide-react";

export interface EmptyStateViewProps {
  icon?: React.ReactNode;
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
}

export function EmptyStateView({
  icon,
  title = "Belum Ada Data",
  message = "Tidak ada catatan atau data yang tersedia untuk saat ini.",
  actionLabel,
  onAction,
  actionHref,
}: EmptyStateViewProps) {
  return (
    <div className="bg-white rounded-2xl p-8 sm:p-12 text-center border border-slate-200/80 shadow-xs space-y-4 max-w-lg mx-auto my-6">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400 border border-slate-200/70 shadow-2xs">
        {icon || <FolderOpen className="w-8 h-8 stroke-[1.5]" />}
      </div>

      <div className="space-y-1">
        <h3 className="text-base sm:text-lg font-bold text-slate-800">{title}</h3>
        <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
          {message}
        </p>
      </div>

      {actionLabel && (
        <div className="pt-2">
          {actionHref ? (
            <a
              href={actionHref}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#102E50] text-white hover:bg-[#1a4473] transition-colors shadow-xs"
            >
              <span>{actionLabel}</span>
            </a>
          ) : (
            <button
              type="button"
              onClick={onAction}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#102E50] text-white hover:bg-[#1a4473] transition-colors shadow-xs cursor-pointer"
            >
              <span>{actionLabel}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
