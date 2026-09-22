"use client";

import React from "react";
import { AlertTriangle, ArrowRight, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

interface ExpiringContractAlertProps {
  count: number;
}

export function ExpiringContractAlert({ count }: ExpiringContractAlertProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isExpiringFilter = searchParams.get("expiring") === "true";
  const [dismissed, setDismissed] = React.useState(false);

  if (count === 0 || dismissed) {
    return null;
  }

  const handleToggleFilter = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (isExpiringFilter) {
      params.delete("expiring");
    } else {
      params.set("expiring", "true");
      params.delete("page");
    }
    router.push(`/karyawan?${params.toString()}`);
  };

  return (
    <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 bg-amber-50/90 border border-amber-200/80 rounded-xl shadow-xs text-amber-950 transition-all duration-200">
      <div className="flex items-start sm:items-center gap-3">
        <div className="p-2 rounded-lg bg-[#feba48]/30 text-[#805600] shrink-0">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-[#805600] tracking-tight">
              Peringatan Kontrak PKWT ({count} Pegawai)
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#feba48] text-[#805600]">
              Mendesak
            </span>
          </div>
          <p className="text-xs text-amber-900/80 mt-0.5">
            Terdapat {count} pegawai riset berbasis kontrak yang masa berlakunya akan berakhir dalam tempo ≤ 30 hari. Segera lakukan peninjauan perpanjangan atau penyelesaian penugasan.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
        <button
          type="button"
          onClick={handleToggleFilter}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer active:scale-[0.98] ${
            isExpiringFilter
              ? "bg-[#102E50] text-white hover:bg-[#0c233d]"
              : "bg-white text-[#805600] border border-amber-300 hover:bg-amber-100/50 shadow-xs"
          }`}
        >
          <span>{isExpiringFilter ? "Tampilkan Semua Pegawai" : "Tinjau Pegawai Ini"}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="p-1 rounded-md text-amber-700/60 hover:text-amber-900 hover:bg-amber-100/50 transition-colors"
          aria-label="Tutup pemberitahuan"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
