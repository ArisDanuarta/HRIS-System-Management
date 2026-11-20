import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { History, ChevronRight, PenSquare } from "lucide-react";
import { getSession, getAuthContext } from "@pspk/auth";
import { can } from "@pspk/rbac";
import { getBroadcastHistory } from "../../../../server/queries/broadcast.queries";
import { BroadcastHistoryView } from "../../../../components/broadcast/broadcast-history-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Riwayat Pengumuman & Broadcast Email",
  description:
    "Daftar arsip pengumuman dan riwayat transmisi pengiriman email resmi no-reply@pspk.id",
};

interface RiwayatBroadcastPageProps {
  searchParams: Promise<{
    q?: string;
    search?: string;
    scope?: string;
    status?: string;
    page?: string;
  }>;
}

export default async function KomunikasiRiwayatPage({
  searchParams,
}: RiwayatBroadcastPageProps) {
  const reqHeaders = await headers();
  const session = await getSession(reqHeaders);

  if (!session?.user) {
    redirect("/login");
  }

  const authCtx = await getAuthContext(session.user.id);
  if (!authCtx) {
    redirect("/login");
  }

  const isSuperAdmin = authCtx.roles.includes("super_admin");
  const isAdminHr = authCtx.roles.includes("admin_hr");
  const isManager = authCtx.roles.includes("manager");

  const canSendAll = isSuperAdmin || isAdminHr || can(authCtx, "hris.broadcast.send:all");
  const canSendTeam = isManager || can(authCtx, "hris.broadcast.send:team");
  const isSenderOrManager =
    canSendAll ||
    canSendTeam ||
    can(authCtx, "hris.broadcast.read:all") ||
    can(authCtx, "hris.broadcast.read:team");

  // Proteksi Akses: Pengguna staff biasa (penerima pesan) dilarang mengakses konsol riwayat pengiriman
  if (!isSenderOrManager) {
    redirect("/notifikasi");
  }

  const resolvedParams = await searchParams;
  const q = (resolvedParams.q || resolvedParams.search || "").trim();
  const scope = resolvedParams.scope || "ALL";
  const status = resolvedParams.status || "ALL";
  const parsedPage = parseInt(resolvedParams.page || "1", 10);
  const page = isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage;

  const historyData = await getBroadcastHistory(session.user.id, {
    search: q || undefined,
    scope: scope !== "ALL" ? scope : undefined,
    status: status !== "ALL" ? status : undefined,
    page,
    pageSize: 15,
  });

  const canCreate = canSendAll || canSendTeam;

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* BREADCRUMB & HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Link href="/dashboard" className="hover:text-navy-900 transition-colors">
              Beranda
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">Komunikasi</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold text-navy-900">Riwayat Pengumuman</span>
          </div>
          <h1 className="text-2xl font-bold text-navy-900 tracking-tight font-serif flex items-center gap-2.5">
            <History className="w-6 h-6 text-navy-800" />
            <span>Riwayat Pengumuman &amp; Broadcast Email</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            Arsip pengumuman terkirim via <code className="text-navy-900 font-mono bg-navy-50 px-1 py-0.5 rounded border border-navy-100">no-reply@pspk.id</code> dan log status penerimaan per pegawai.
          </p>
        </div>

        {canCreate && (
          <div className="flex items-center gap-2">
            <Link
              href="/komunikasi/baru"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#102E50] hover:bg-[#0c233d] text-white rounded-xl text-xs font-semibold shadow-sm transition-all duration-150 cursor-pointer"
            >
              <PenSquare className="w-4 h-4 text-gold-400" />
              <span>Tulis Pengumuman Baru</span>
            </Link>
          </div>
        )}
      </div>

      {/* MAIN HISTORY VIEW */}
      <BroadcastHistoryView
        items={historyData.items}
        total={historyData.total}
        page={historyData.page}
        totalPages={historyData.totalPages}
        stats={historyData.stats}
        canCreate={canCreate}
        initialSearch={q}
        initialScope={scope}
        initialStatus={status}
      />
    </div>
  );
}
