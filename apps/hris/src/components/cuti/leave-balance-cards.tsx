import React from "react";
import { Calendar, HeartPulse, Clock, Sparkles } from "lucide-react";

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
  const getIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes("tahunan")) return <Calendar className="w-5 h-5 text-[#102e50]" />;
    if (lower.includes("sakit")) return <HeartPulse className="w-5 h-5 text-[#a8281c]" />;
    if (lower.includes("penting")) return <Clock className="w-5 h-5 text-[#805600]" />;
    return <Sparkles className="w-5 h-5 text-indigo-700" />;
  };

  const getColorClasses = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes("tahunan")) {
      return {
        bg: "bg-[#eff4ff]",
        progress: "bg-[#102e50]",
        text: "text-[#102e50]",
      };
    }
    if (lower.includes("sakit")) {
      return {
        bg: "bg-red-50",
        progress: "bg-[#a8281c]",
        text: "text-[#a8281c]",
      };
    }
    if (lower.includes("penting")) {
      return {
        bg: "bg-amber-50",
        progress: "bg-[#f2af3e]",
        text: "text-[#805600]",
      };
    }
    return {
      bg: "bg-purple-50",
      progress: "bg-purple-600",
      text: "text-purple-800",
    };
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {balances.map((b) => {
        const theme = getColorClasses(b.leaveType.name);

        return (
          <div
            key={b.id}
            className="bg-white rounded-xl border border-[#dee9fc] shadow-xs p-5 flex flex-col justify-between hover:shadow-md transition-shadow"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 truncate pr-2">
                  {b.leaveType.name}
                </span>
                <div className={`w-9 h-9 rounded-lg ${theme.bg} flex items-center justify-center shrink-0`}>
                  {getIcon(b.leaveType.name)}
                </div>
              </div>

              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-extrabold text-[#102e50] font-heading leading-none">
                  {b.remainingDays}
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  / {b.quotaDays} Hari Sisa
                </span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                <span>Terpakai: {b.usedDaysNumber} hari</span>
                <span>{b.usagePercentage}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${theme.progress}`}
                  style={{ width: `${Math.min(100, Math.max(b.usagePercentage, 0))}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
