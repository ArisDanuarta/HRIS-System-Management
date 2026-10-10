"use client";

import React from "react";
import { DocumentStats } from "@/server/queries/document.queries";
import {
  FileText,
  Landmark,
  Workflow,
  Lock,
} from "lucide-react";

interface DocumentStatsCardsProps {
  stats: DocumentStats;
  selectedCategory?: string;
  onSelectCategory?: (category: string) => void;
}

export function DocumentStatsCards({
  stats,
  selectedCategory,
  onSelectCategory,
}: DocumentStatsCardsProps) {
  const cards = [
    {
      id: "all",
      label: "Total Dokumen & SOP",
      value: stats.totalDocuments,
      subtext: `${stats.activeDocuments} berkas berstatus aktif`,
      icon: FileText,
      accentColor: "border-l-[#102E50]",
      iconBg: "bg-[#102E50]/10 text-[#102E50]",
      filterCategory: "ALL",
    },
    {
      id: "kebijakan",
      label: "Kebijakan Lembaga",
      value: stats.kebijakanCount,
      subtext: "Surat Keputusan & Tata Kelola",
      icon: Landmark,
      accentColor: "border-l-[#F2AF3E]",
      iconBg: "bg-amber-50 text-amber-600 border border-amber-200/50",
      filterCategory: "Kebijakan",
    },
    {
      id: "sop",
      label: "SOP Operasional",
      value: stats.sopCount,
      subtext: "HR, IT, Keuangan & Umum",
      icon: Workflow,
      accentColor: "border-l-emerald-600",
      iconBg: "bg-emerald-50 text-emerald-600 border border-emerald-200/50",
      filterCategory: "SOP",
    },
    {
      id: "restricted",
      label: "Akses Terbatas",
      value: stats.restrictedCount,
      subtext: "Khusus Manajerial & Tim Tertentu",
      icon: Lock,
      accentColor: "border-l-indigo-600",
      iconBg: "bg-indigo-50 text-indigo-600 border border-indigo-200/50",
      filterCategory: undefined,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const isSelected =
          card.filterCategory &&
          card.filterCategory !== "ALL" &&
          selectedCategory === card.filterCategory;

        return (
          <div
            key={card.id}
            onClick={() => {
              if (card.filterCategory && onSelectCategory) {
                onSelectCategory(card.filterCategory);
              }
            }}
            className={`bg-white rounded-2xl border p-5 transition-all duration-200 border-l-4 ${card.accentColor} ${
              card.filterCategory ? "cursor-pointer hover:shadow-md hover:-translate-y-0.5" : ""
            } ${
              isSelected
                ? "border-slate-400 ring-2 ring-[#102E50]/10 bg-slate-50/50"
                : "border-slate-200/90 shadow-xs"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {card.label}
              </span>
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${card.iconBg}`}
              >
                <Icon className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 font-serif tracking-tight">
                {card.value.toLocaleString("id-ID")}
              </span>
              <span className="text-xs font-medium text-slate-400">berkas</span>
            </div>
            <p className="mt-1.5 text-xs text-slate-500 truncate">{card.subtext}</p>
          </div>
        );
      })}
    </div>
  );
}
