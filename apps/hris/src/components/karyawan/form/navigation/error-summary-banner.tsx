"use client";

import React from "react";
import { AlertCircle, ChevronRight } from "lucide-react";
import { useEmployeeForm } from "../employee-form.context";

export function ErrorSummaryBanner() {
  const { errors, serverError, mode, goToStep, setActiveCategory } = useEmployeeForm();

  if (!serverError && errors.length === 0) return null;

  const handleJumpToField = (field: string, step: number, category: string) => {
    if (mode === "create") {
      goToStep(step as any);
    } else {
      setActiveCategory(category as any);
    }

    setTimeout(() => {
      const el = document.getElementById(field);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.focus();
      }
    }, 150);
  };

  return (
    <div
      role="alert"
      aria-labelledby="error-summary-heading"
      tabIndex={-1}
      className="p-4 sm:p-5 rounded-2xl bg-rose-50/90 border border-rose-200 text-[#A8281C] shadow-xs flex flex-col gap-3 animate-in fade-in duration-200"
    >
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
          <AlertCircle className="w-4.5 h-4.5 text-[#A8281C]" />
        </div>
        <div>
          <h3 id="error-summary-heading" className="text-sm font-bold tracking-tight">
            Terdapat data yang perlu diperiksa sebelum melanjutkan:
          </h3>
          {serverError && <p className="text-xs text-rose-800 mt-0.5">{serverError}</p>}
        </div>
      </div>

      {errors.length > 0 && (
        <ul className="flex flex-col gap-1.5 pl-10 text-xs">
          {errors.map((err, idx) => (
            <li key={idx} className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleJumpToField(err.field, err.step, err.category)}
                className="inline-flex items-center gap-1 text-left font-semibold text-[#A8281C] hover:underline cursor-pointer group"
              >
                <ChevronRight className="w-3.5 h-3.5 text-rose-400 group-hover:translate-x-0.5 transition-transform" />
                <span>
                  <strong>{err.label}:</strong> {err.message}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
