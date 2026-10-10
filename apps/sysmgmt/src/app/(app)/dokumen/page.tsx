import React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession, getAuthContext } from "@pspk/auth";
import { can } from "@pspk/rbac";
import {
  getDocumentsDirectory,
  getDocumentStats,
  getAllowedVisibilitiesForRoles,
} from "@/server/queries/document.queries";
import { DocumentListView } from "@/components/documents/document-list-view";
import { ShieldAlert } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dokumen & SOP Lembaga — PSPK System Management",
  description: "Repositori resmi kebijakan, standar operasional prosedur, dan tata kelola internal PSPK.",
};

interface DocumentPageProps {
  searchParams?: Promise<{
    q?: string;
    category?: string;
    status?: string;
    visibility?: string;
    page?: string;
  }>;
}

export default async function DocumentPage({ searchParams }: DocumentPageProps) {
  const reqHeaders = await headers();
  const session = await getSession(reqHeaders);

  if (!session?.user) {
    redirect("/login");
  }

  const authCtx = await getAuthContext(session.user.id);
  if (!authCtx) {
    redirect("/login");
  }

  // Periksa wewenang akses membaca repositori dokumen
  const canRead =
    can(authCtx, "sysmgmt.document.read:own") ||
    can(authCtx, "sysmgmt.document.read:team") ||
    can(authCtx, "sysmgmt.document.read:all");

  const canManage =
    can(authCtx, "sysmgmt.document.manage:all") ||
    can(authCtx, "sysmgmt.document.manage:hr");

  if (!canRead) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto shadow-sm">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-200">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-2 font-serif">Akses Dibatasi</h2>
        <p className="text-xs text-slate-500 leading-relaxed mb-6">
          Anda tidak memiliki wewenang untuk melihat repositori dokumen dan SOP lembaga. Silakan hubungi
          Administrator IT jika Anda memerlukan akses ke modul ini.
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
  const categoryParam = resolvedParams.category || "ALL";
  const statusParam = resolvedParams.status || "ALL";
  const visibilityParam = resolvedParams.visibility || "ALL";
  const pageParam = Math.max(1, parseInt(resolvedParams.page || "1", 10) || 1);

  const allowedVisibilities = getAllowedVisibilitiesForRoles(authCtx.roles);

  const [documentsData, stats] = await Promise.all([
    getDocumentsDirectory(
      {
        q: searchParam,
        category: categoryParam,
        status: statusParam,
        visibility: visibilityParam,
        page: pageParam,
        pageSize: 15,
      },
      authCtx.roles,
    ),
    getDocumentStats(authCtx.roles),
  ]);

  return (
    <DocumentListView
      documentsData={documentsData}
      stats={stats}
      canManage={canManage}
      allowedVisibilities={allowedVisibilities}
      initialFilters={{
        search: searchParam,
        category: categoryParam,
        status: statusParam,
        visibility: visibilityParam,
        page: pageParam,
      }}
    />
  );
}
