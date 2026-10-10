import React from "react";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { getSession, getAuthContext } from "@pspk/auth";
import { can } from "@pspk/rbac";
import { getDocumentById } from "@/server/queries/document.queries";
import { DocumentDetailView } from "@/components/documents/document-detail-view";
import { ShieldAlert } from "lucide-react";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const doc = await getDocumentById(id, ["super_admin"]);
  if (!doc) {
    return {
      title: "Dokumen Tidak Ditemukan — PSPK System Management",
    };
  }

  return {
    title: `${doc.code}: ${doc.title} — PSPK Dokumen & SOP`,
    description: `Detail kebijakan/SOP ${doc.title} (${doc.code}) beserta riwayat versi lengkap.`,
  };
}

interface DocumentDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function DocumentDetailPage({ params }: DocumentDetailPageProps) {
  const reqHeaders = await headers();
  const session = await getSession(reqHeaders);

  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;

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

  const canDelete =
    authCtx.roles.includes("super_admin") || authCtx.roles.includes("admin_it");

  if (!canRead) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto shadow-sm">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-200">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-2 font-serif">Akses Dibatasi</h2>
        <p className="text-xs text-slate-500 leading-relaxed mb-6">
          Anda tidak memiliki wewenang untuk melihat data dokumen kebijakan atau SOP ini.
        </p>
        <Link
          href="/dokumen"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#102E50] text-white text-xs font-semibold rounded-lg hover:bg-[#1a4473] transition-colors"
        >
          Kembali ke Direktori Dokumen
        </Link>
      </div>
    );
  }

  const doc = await getDocumentById(id, authCtx.roles);

  if (!doc) {
    notFound();
  }

  return (
    <DocumentDetailView
      document={doc}
      canManage={canManage}
      canDelete={canDelete}
    />
  );
}
