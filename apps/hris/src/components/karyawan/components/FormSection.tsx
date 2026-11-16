"use client";

import React, { useState } from "react";
import { ChevronDown, LucideIcon } from "lucide-react";

interface FormSectionProps {
  id: string;
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  badge?: React.ReactNode;
  defaultOpen?: boolean;
  isOpen?: boolean;
  onToggle?: (isOpen: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

export function FormSection({
  id,
  title,
  subtitle,
  icon: Icon,
  badge,
  defaultOpen = true,
  isOpen: controlledIsOpen,
  onToggle,
  children,
  className = "",
}: FormSectionProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(defaultOpen);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  const handleToggle = () => {
    const next = !isOpen;
    if (controlledIsOpen === undefined) {
      setInternalIsOpen(next);
    }
    if (onToggle) {
      onToggle(next);
    }
  };

  return (
    <div
      id={id}
      className={`border border-slate-200/90 rounded-xl bg-white overflow-hidden shadow-xs transition-shadow hover:shadow-sm ${className}`}
    >
      {/* Header Button */}
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={isOpen}
        aria-controls={`${id}-content`}
        className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-left bg-slate-50/40 hover:bg-slate-50/80 transition-colors cursor-pointer select-none"
      >
        <div className="flex items-center gap-3 min-w-0">
          {Icon && (
            <div className="w-8 h-8 rounded-lg bg-[#102E50]/10 text-[#102E50] flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4" />
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-slate-800 tracking-tight">
                {title}
              </h3>
              {badge}
            </div>
            {subtitle && (
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed truncate sm:whitespace-normal">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 transition-transform duration-200 ${
              isOpen ? "rotate-180" : "rotate-0"
            }`}
          >
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
      </button>

      {/* Accordion Content Body */}
      {isOpen && (
        <div
          id={`${id}-content`}
          className="p-4 sm:p-6 border-t border-slate-200/80 bg-white"
        >
          {children}
        </div>
      )}
    </div>
  );
}
