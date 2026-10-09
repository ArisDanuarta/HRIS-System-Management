import React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession, getAuthContext } from "@pspk/auth";
import { can } from "@pspk/rbac";
import {
  getLicensesDirectory,
  getLicenseStats,
  LicenseFilterParams,
} from "@/server/queries/license.queries";
import { LicenseListView } from "@/components/licenses/license-list-view";
import { ShieldAlert } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Lisensi Perangkat Lunak — PSPK System Management",
  description: "Katalog lisensi software, alokasi kursi, masa berlaku, dan kunci produk berbayar PSPK.",
};

interface LicensePageProps {
  searchParams?: Promise<{
    q?: string;
    status?: string;
    vendor?: string;
    page?: string;
  }>;
}

export default async function LicensePage({ searchParams }: LicensePageProps) {
  const reqHeaders = await headers();
  const session = await getSession(reqHeaders);

  if (!session?.user) {
    redirect("/login");
  }

  const authCtx = await getAuthContext(session.user.id);
  if (!authCtx) {
    redirect("/login");
  }

  // Periksa hak akses membaca lisensi
  const canRead = can(authCtx, "sysmgmt.license.read:all");
  const canManage = can(authCtx, "sysmgmt.license.manage:all");

  if (!canRead) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto shadow-sm">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-200">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-2 font-serif">Akses Dibatasi</h2>
        <p className="text-xs text-slate-500 leading-relaxed mb-6">
          Anda tidak memiliki wewenang untuk melihat data lisensi perangkat lunak lembaga. Silakan hubungi
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
  const statusParam = (resolvedParams.status as LicenseFilterParams["status"]) || "ALL";
  const vendorParam = resolvedParams.vendor || "ALL";
  const pageParam = Math.max(1, parseInt(resolvedParams.page || "1", 10) || 1);

  const [licensesData, stats] = await Promise.all([
    getLicensesDirectory({
      search: searchParam,
      status: statusParam,
      vendor: vendorParam,
      page: pageParam,
      limit: 15,
    }),
    getLicenseStats(),
  ]);

  return (
    <LicenseListView
      licensesData={licensesData}
      stats={stats}
      canManage={canManage}
      initialFilters={{
        search: searchParam,
        status: statusParam,
        vendor: vendorParam,
        page: pageParam,
      }}
    />
  );
}
