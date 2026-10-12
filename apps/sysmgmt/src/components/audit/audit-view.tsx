"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AuditDirectoryResult,
  AuditStats,
  AuditFilterOptions,
  SerializedAuditLog,
} from "@/server/queries/audit.queries";
import { AuditStatsCards } from "./audit-stats-cards";
import { AuditFilterToolbar } from "./audit-filter-toolbar";
import { AuditTable } from "./audit-table";
import { AuditDiffModal } from "./audit-diff-modal";
import { ShieldCheck, Database } from "lucide-react";

interface AuditViewProps {
  directory: AuditDirectoryResult;
  stats: AuditStats;
  filterOptions: AuditFilterOptions;
  canExport: boolean;
  initialFilters: {
    q: string;
    app: string;
    action: string;
    entityType: string;
    startDate: string;
    endDate: string;
    page: number;
  };
}

export function AuditView({
  directory,
  stats,
  filterOptions,
  canExport,
  initialFilters,
}: AuditViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [inspectingLog, setInspectingLog] = useState<SerializedAuditLog | null>(null);

  const isFiltered = Boolean(
    initialFilters.q ||
      (initialFilters.app && initialFilters.app !== "ALL") ||
      (initialFilters.action && initialFilters.action !== "ALL") ||
      (initialFilters.entityType && initialFilters.entityType !== "ALL") ||
      initialFilters.startDate ||
      initialFilters.endDate,
  );

  const applyFilters = (newFilters: {
    q?: string;
    app?: string;
    action?: string;
    entityType?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
  }) => {
    const params = new URLSearchParams(searchParams.toString());

    const q = newFilters.q !== undefined ? newFilters.q : initialFilters.q;
    const app = newFilters.app !== undefined ? newFilters.app : initialFilters.app;
    const action = newFilters.action !== undefined ? newFilters.action : initialFilters.action;
    const entityType =
      newFilters.entityType !== undefined ? newFilters.entityType : initialFilters.entityType;
    const startDate =
      newFilters.startDate !== undefined ? newFilters.startDate : initialFilters.startDate;
    const endDate =
      newFilters.endDate !== undefined ? newFilters.endDate : initialFilters.endDate;
    const page = newFilters.page !== undefined ? newFilters.page : 1;

    if (q && q.trim()) params.set("q", q.trim());
    else params.delete("q");

    if (app && app !== "ALL") params.set("app", app);
    else params.delete("app");

    if (action && action !== "ALL") params.set("action", action);
    else params.delete("action");

    if (entityType && entityType !== "ALL") params.set("entityType", entityType);
    else params.delete("entityType");

    if (startDate) params.set("startDate", startDate);
    else params.delete("startDate");

    if (endDate) params.set("endDate", endDate);
    else params.delete("endDate");

    if (page > 1) params.set("page", String(page));
    else params.delete("page");

    router.push(`?${params.toString()}`);
  };

  const handleResetFilters = () => {
    router.push("/audit");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Halaman */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 font-serif">
              Buku Besar Audit Log
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span>Immutabel & Terenkripsi</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Pencatatan menyeluruh setiap transaksi mutasi data, aktivitas masuk/keluar sistem, serta akses data sensitif di portal HRIS dan System Management PSPK.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-[#102E50]" />
            <span>Skema: core.audit_logs</span>
          </div>
        </div>
      </div>

      {/* 4 Kartu Metrik Ringkasan */}
      <AuditStatsCards stats={stats} />

      {/* Bilah Toolbar Pencarian & Filter */}
      <AuditFilterToolbar
        filterOptions={filterOptions}
        currentFilters={initialFilters}
        onApplyFilters={applyFilters}
        onResetFilters={handleResetFilters}
        isFiltered={isFiltered}
        canExport={canExport}
      />

      {/* Tabel Data Log */}
      <AuditTable
        logs={directory.logs}
        pagination={{
          page: directory.currentPage,
          totalPages: directory.totalPages,
          total: directory.totalCount,
          limit: directory.pageSize,
        }}
        onPageChange={(newPage) => applyFilters({ page: newPage })}
        onInspectLog={(log) => setInspectingLog(log)}
      />

      {/* Modal Detail Diff JSON */}
      <AuditDiffModal
        isOpen={Boolean(inspectingLog)}
        onClose={() => setInspectingLog(null)}
        log={inspectingLog}
      />
    </div>
  );
}
