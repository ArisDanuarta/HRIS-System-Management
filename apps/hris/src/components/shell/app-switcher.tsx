"use client";

import React, { useState, useRef, useEffect } from "react";
import { ArrowLeftRight, Check, ExternalLink } from "lucide-react";

export interface AppSwitcherProps {
  currentApp?: "hris" | "sysmgmt";
  hrisUrl?: string;
  sysmgmtUrl?: string;
}

export function AppSwitcher({
  currentApp = "hris",
  hrisUrl = "http://localhost:3001",
  sysmgmtUrl = "http://localhost:3002",
}: AppSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isHris = currentApp === "hris";

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-[#eff4ff] hover:bg-[#e6eeff] px-3 py-1.5 rounded-lg border border-[#dee9fc] transition-colors cursor-pointer text-left"
        title="Beralih Portal Sistem PSPK"
      >
        <ArrowLeftRight className="w-4 h-4 text-[#102e50]" />
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-xs sm:text-[13px] text-[#102e50]">
            {isHris ? "HRIS PSPK" : "System Management"}
          </span>
          <span className="bg-[#ffddb0] text-[#805600] text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
            Aktif
          </span>
        </div>
        <svg
          className={`w-3.5 h-3.5 text-[#74777f] transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white shadow-xl border border-[#dee9fc] p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-2 text-[11px] font-bold text-[#74777f] uppercase tracking-wider">
            Pindah Aplikasi PSPK
          </div>

          {/* Current Active App */}
          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#eff4ff] text-[#102e50] font-semibold text-xs mb-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#f2af3e]" />
              <span>Portal HRIS (Aktif)</span>
            </div>
            <Check className="w-4 h-4 text-[#102e50]" />
          </div>

          {/* Companion App (System Management or HRIS) */}
          <a
            href={isHris ? sysmgmtUrl : hrisUrl}
            className="flex items-center justify-between px-3 py-2 rounded-lg text-[#43474e] hover:bg-[#f8f9ff] hover:text-[#102e50] transition-colors text-xs font-medium"
            onClick={() => setIsOpen(false)}
          >
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isHris ? "bg-[#60a5fa]" : "bg-[#f2af3e]"}`} />
              <span>{isHris ? "System Management" : "Portal HRIS"}</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-[#74777f]" />
          </a>

          <div className="mt-1 pt-1.5 border-t border-[#dee9fc] px-3 py-1">
            <span className="text-[10px] text-[#74777f]">
              Menggunakan identitas akun yang sama (SSO terpadu).
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
