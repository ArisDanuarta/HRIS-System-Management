import React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession, getAuthContext } from "@pspk/auth";
import { can } from "@pspk/rbac";
import { prisma, getModuleFlags, isModuleActive, AssetStatus } from "@pspk/db";
import {
  getAssetsDirectory,
  getAssetStats,
  getNextAssetTag,
} from "@/server/queries/asset.queries";
import { AssetListView } from "@/components/assets/asset-list-view";
import { ShieldAlert } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Inventaris Aset Lembaga — PSPK System Management",
  description: "Katalog inventaris perangkat IT, fasilitas kerja, dan pelacakan status fisik aset PSPK.",
};

interface AssetPageProps {
  searchParams?: Promise<{
    kategori?: string;
    status?: string;
    q?: string;
    page?: string;
  }>;
}

export default async function AssetPage({ searchParams }: AssetPageProps) {
  const reqHeaders = await headers();
  const session = await getSession(reqHeaders);

  if (!session?.user) {
    redirect("/login");
  }

  const [authCtx, moduleFlags] = await Promise.all([
    getAuthContext(session.user.id),
    getModuleFlags(prisma),
  ]);

  if (!authCtx) {
    redirect("/login");
  }

  // Jika seluruh modul inventaris aset dinonaktifkan di Tata Kelola Modul, alihkan ke dashboard
  if (!isModuleActive(moduleFlags, "asset_management")) {
    redirect("/dashboard");
  }

  // Periksa izin baca aset
  const canRead = can(authCtx, "sysmgmt.asset.read:all");
  const canWrite = can(authCtx, "sysmgmt.asset.write:all");

  if (!canRead) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto shadow-sm">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-200">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-2 font-serif">Akses Dibatasi</h2>
        <p className="text-xs text-slate-500 leading-relaxed mb-6">
          Anda tidak memiliki wewenang untuk melihat data inventaris aset lembaga. Silakan hubungi
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
  const categoryParam =
    resolvedParams.kategori === "IT" || resolvedParams.kategori === "NON_IT"
      ? resolvedParams.kategori
      : "ALL";
  const statusParam = (resolvedParams.status as AssetStatus) || "ALL";
  const searchParam = resolvedParams.q || "";
  const pageParam = Math.max(1, parseInt(resolvedParams.page || "1", 10) || 1);

  const [assetsData, stats, nextTagIt, nextTagNonIt] = await Promise.all([
    getAssetsDirectory({
      category: categoryParam,
      status: statusParam,
      search: searchParam,
      page: pageParam,
      limit: 25,
    }),
    getAssetStats(),
    getNextAssetTag("IT"),
    getNextAssetTag("NON_IT"),
  ]);

  const isAssignmentModuleActive = isModuleActive(moduleFlags, "asset_assignment");

  return (
    <AssetListView
      assetsData={assetsData}
      stats={stats}
      suggestedTagIt={nextTagIt}
      suggestedTagNonIt={nextTagNonIt}
      canWrite={canWrite}
      isAssignmentModuleActive={isAssignmentModuleActive}
      initialFilters={{
        category: categoryParam,
        status: statusParam,
        search: searchParam,
        page: pageParam,
      }}
    />
  );
}
