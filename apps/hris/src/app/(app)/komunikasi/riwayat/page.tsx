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
    search?: string;
    scope?: string;
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
  const canRead =
    isSuperAdmin ||
    isAdminHr ||
    isManager ||
    can(authCtx, "hris.broadcast.read") ||
    can(authCtx, "hris.broadcast.read:all") ||
    can(authCtx, "hris.broadcast.read:team") ||
    can(authCtx, "hris.broadcast.read:own");

  // Jika tidak memiliki izin membaca atau mengirim broadcast
  if (!canRead && !canSendAll && !canSendTeam) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center space-y-3">
          <h2 className="text-base font-bold text-red-900">Akses Ditolak</h2>
          <p className="text-xs text-red-700">
            Anda tidak memiliki hak akses untuk melihat arsip riwayat pengumuman email.
          </p>
          <div className="pt-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center px-4 py-2 bg-[#102E50] text-white rounded-xl text-xs font-semibold hover:bg-[#0c233d] transition-colors"
            >
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const resolvedParams = await searchParams;
  const page = parseInt(resolvedParams.page || "1", 10);
  const search = resolvedParams.search || "";
  const scope = resolvedParams.scope || "ALL";

  const historyData = await getBroadcastHistory(session.user.id, {
    search,
    scope: scope !== "ALL" ? scope : undefined,
    page: isNaN(page) || page < 1 ? 1 : page,
    pageSize: 25,
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
        initialItems={historyData.items}
        stats={historyData.stats}
        canCreate={canCreate}
      />
    </div>
  );
}
