import React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession, getAuthContext } from "@pspk/auth";
import { can } from "@pspk/rbac";
import {
  getAuditLogs,
  getAuditStats,
  getAuditFilterOptions,
} from "@/server/queries/audit.queries";
import { AuditView } from "@/components/audit/audit-view";
import { ShieldAlert } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Buku Besar Audit Log — PSPK System Management",
  description:
    "Rekaman jejak transaksi mutasi data, aktivitas autentikasi, dan audit keamanan sistem PSPK.",
};

interface AuditPageProps {
  searchParams?: Promise<{
    q?: string;
    app?: string;
    action?: string;
    entityType?: string;
    startDate?: string;
    endDate?: string;
    page?: string;
  }>;
}

export default async function AuditPage({ searchParams }: AuditPageProps) {
  const reqHeaders = await headers();
  const session = await getSession(reqHeaders);

  if (!session?.user) {
    redirect("/login");
  }

  const authCtx = await getAuthContext(session.user.id);
  if (!authCtx) {
    redirect("/login");
  }

  // Periksa wewenang membaca buku besar audit log
  const canRead = can(authCtx, "sysmgmt.audit.read:all");
  const canExport = can(authCtx, "sysmgmt.audit.export:all") || canRead;

  if (!canRead) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto shadow-sm my-12">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-200">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-2 font-serif">Akses Dibatasi</h2>
        <p className="text-xs text-slate-500 leading-relaxed mb-6">
          Anda tidak memiliki wewenang untuk melihat Buku Besar Audit Log sistem.
          Akses modul ini dibatasi khusus bagi Administrator Keamanan & Super Administrator PSPK.
        </p>
        <a
          href="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#102E50] text-white text-xs font-semibold rounded-lg hover:bg-[#1a4473] transition-colors"
        >
          Kembali ke Dashboard
        </a>
      </div>
    );
  }

  const resolvedParams = searchParams ? await searchParams : {};
  const searchParam = resolvedParams.q || "";
  const appParam = resolvedParams.app || "ALL";
  const actionParam = resolvedParams.action || "ALL";
  const entityTypeParam = resolvedParams.entityType || "ALL";
  const startDateParam = resolvedParams.startDate || "";
  const endDateParam = resolvedParams.endDate || "";
  const pageParam = Math.max(1, parseInt(resolvedParams.page || "1", 10) || 1);

  const [directory, stats, filterOptions] = await Promise.all([
    getAuditLogs({
      q: searchParam,
      app: appParam,
      action: actionParam,
      entityType: entityTypeParam,
      startDate: startDateParam,
      endDate: endDateParam,
      page: pageParam,
      pageSize: 25,
    }),
    getAuditStats(),
    getAuditFilterOptions(),
  ]);

  return (
    <AuditView
      directory={directory}
      stats={stats}
      filterOptions={filterOptions}
      canExport={canExport}
      initialFilters={{
        q: searchParam,
        app: appParam,
        action: actionParam,
        entityType: entityTypeParam,
        startDate: startDateParam,
        endDate: endDateParam,
        page: pageParam,
      }}
    />
  );
}
