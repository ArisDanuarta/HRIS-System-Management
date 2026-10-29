import React from "react";
import { Calendar, HeartPulse, Clock, Award, FileCheck2 } from "lucide-react";

interface LeaveBalanceItem {
  id: string;
  leaveTypeId: string;
  year: number;
  quotaDays: number;
  usedDaysNumber: number;
  remainingDays: number;
  usagePercentage: number;
  leaveType: {
    name: string;
    isPaid: boolean;
    requiresAttachment: boolean;
  };
}

interface LeaveBalanceCardsProps {
  balances: LeaveBalanceItem[];
}

export function LeaveBalanceCards({ balances }: LeaveBalanceCardsProps) {
  const getCategoryTheme = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes("tahunan") || lower.includes("annual")) {
      return {
        accentBar: "bg-[#102e50]",
        strokeColor: "#102e50",
        iconBg: "bg-[#102e50]/5 border-[#102e50]/15 text-[#102e50]",
        icon: <Calendar className="w-4 h-4 text-[#102e50]" />,
      };
    }
    if (lower.includes("sakit") || lower.includes("sick")) {
      return {
        accentBar: "bg-[#a8281c]",
        strokeColor: "#a8281c",
        iconBg: "bg-[#a8281c]/10 border-[#a8281c]/20 text-[#a8281c]",
        icon: <HeartPulse className="w-4 h-4 text-[#a8281c]" />,
      };
    }
    if (lower.includes("penting")) {
      return {
        accentBar: "bg-[#df632f]",
        strokeColor: "#df632f",
        iconBg: "bg-[#df632f]/10 border-[#df632f]/20 text-[#df632f]",
        icon: <Clock className="w-4 h-4 text-[#df632f]" />,
      };
    }
    return {
      accentBar: "bg-[#8e2d3f]",
      strokeColor: "#8e2d3f",
      iconBg: "bg-[#8e2d3f]/10 border-[#8e2d3f]/20 text-[#8e2d3f]",
      icon: <Award className="w-4 h-4 text-[#8e2d3f]" />,
    };
  };

  const getQuotaStatusBadge = (remaining: number, quota: number) => {
    if (remaining <= 0) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-[#a8281c]/10 text-[#a8281c] border border-[#a8281c]/25">
          Kuota Habis
        </span>
      );
    }
    if (quota > 0 && remaining / quota <= 0.25) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-[#f2af3e]/20 text-[#8e2d3f] border border-[#f2af3e]/50">
          Tersisa Sedikit
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
        Kuota Aman
      </span>
    );
  };

  if (balances.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200/90 shadow-xs">
        <p className="text-xs text-slate-500 font-medium">
          Belum ada jenis cuti aktif yang dikonfigurasi dalam sistem oleh Admin HR.
        </p>
      </div>
    );
  }

  // SVG Ring Constants
  const size = 64;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {balances.map((b) => {
        const theme = getCategoryTheme(b.leaveType.name);
        const remainingRatio =
          b.quotaDays > 0 ? Math.min(1, Math.max(0, b.remainingDays / b.quotaDays)) : 0;
        const strokeDashoffset = circumference * (1 - remainingRatio);

        return (
          <div
            key={b.id}
            className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 flex flex-col justify-between relative overflow-hidden hover:border-slate-300 transition-colors"
          >
            {/* Left Vertical Brand Accent */}
            <div className={`absolute top-0 left-0 bottom-0 w-1 ${theme.accentBar}`} />

            {/* Top Header: Title, Meta & Status Badge */}
            <div>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-[#102e50] font-heading truncate">
                    {b.leaveType.name}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    {getQuotaStatusBadge(b.remainingDays, b.quotaDays)}
                    {b.leaveType.requiresAttachment && (
                      <span
                        className="inline-flex items-center gap-1 text-[10px] text-slate-500 font-medium"
                        title="Wajib melampirkan dokumen pendukung"
                      >
                        <FileCheck2 className="w-3 h-3 text-[#0874aa]" />
                        <span>Lampiran</span>
                      </span>
                    )}
                  </div>
                </div>

                <div
                  className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${theme.iconBg}`}
                >
                  {theme.icon}
                </div>
              </div>

              {/* Center Metric & Radial Ring */}
              <div className="flex items-center justify-between gap-4 my-5">
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block">
                    Sisa Kuota
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-3xl font-bold text-[#102e50] font-heading tabular-nums leading-none">
                      {b.remainingDays}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">Hari</span>
                  </div>
                </div>

                {/* Minimalist Radial Gauge */}
                <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                  <svg className="w-16 h-16 -rotate-90" viewBox={`0 0 ${size} ${size}`}>
                    <circle
                      cx={size / 2}
                      cy={size / 2}
                      r={radius}
                      fill="transparent"
                      stroke="#f1f5f9"
                      strokeWidth={strokeWidth}
                    />
                    <circle
                      cx={size / 2}
                      cy={size / 2}
                      r={radius}
                      fill="transparent"
                      stroke={theme.strokeColor}
                      strokeWidth={strokeWidth}
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      className="transition-all duration-500"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-[11px] font-bold text-[#102e50] tabular-nums leading-none">
                      {Math.round(remainingRatio * 100)}%
                    </span>
                    <span className="text-[8px] uppercase tracking-wider text-slate-400 font-semibold mt-0.5">
                      Utuh
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Breakdown Footer: Hak Awal vs Terpakai */}
            <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-medium block">Hak Tahunan</span>
                <span className="font-bold text-[#102e50] tabular-nums">{b.quotaDays} Hari</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-medium block">Terpakai</span>
                <span className="font-bold text-slate-700 tabular-nums">
                  {b.usedDaysNumber} Hari
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}