"use client";

import * as React from "react";

export interface AppSwitcherProps {
  currentApp: "hris" | "sysmgmt";
  hrisUrl?: string;
  sysmgmtUrl?: string;
}

export function AppSwitcher({
  currentApp,
  hrisUrl = "http://localhost:3001",
  sysmgmtUrl = "http://localhost:3002",
}: AppSwitcherProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const apps = [
    {
      id: "hris",
      name: "HRIS",
      desc: "Pengelolaan SDM & Kepegawaian",
      url: hrisUrl,
    },
    {
      id: "sysmgmt",
      name: "System Management",
      desc: "Akses, Aset, Dokumen & Audit",
      url: sysmgmtUrl,
    },
  ];

  const activeApp = apps.find((a) => a.id === currentApp) || apps[0];

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-[#102E50] bg-white border border-[#E1E6ED] rounded-md hover:bg-[#F5F7FA] transition-colors focus:outline-none focus:ring-2 focus:ring-[#102E50]"
      >
        <span className="w-2 h-2 rounded-full bg-[#F2AF3E]"></span>
        <span>{activeApp?.name}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1 w-60 rounded-md shadow-lg bg-white border border-[#E1E6ED] ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1">
            <div className="px-3 py-1.5 text-[10px] font-semibold text-[#5B6675] uppercase tracking-wider">
              Pilih Aplikasi
            </div>
            {apps.map((app) => (
              <a
                key={app.id}
                href={app.url}
                className={`block px-3 py-2 text-xs transition-colors ${
                  app.id === currentApp
                    ? "bg-[#F0F4F8] text-[#102E50] font-semibold"
                    : "text-[#1B2430] hover:bg-[#F5F7FA]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{app.name}</span>
                  {app.id === currentApp && (
                    <span className="text-[10px] bg-[#102E50] text-white px-1.5 py-0.5 rounded">
                      Aktif
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-[#5B6675] font-normal mt-0.5">{app.desc}</div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
