import React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession, getAuthContext } from "@pspk/auth";
import { can } from "@pspk/rbac";
import {
  getDocumentCategories,
  getAssetTypes,
  getAssetLocations,
  getSystemPreferences,
  getSettingsStats,
} from "@/server/queries/settings.queries";
import { SettingsView } from "@/components/settings/settings-view";
import { ShieldAlert } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Master Data & Pengaturan Sistem — PSPK System Management",
  description:
    "Konfigurasi terpusat kategori dokumen, master tipe dan lokasi aset, serta parameter global sistem PSPK.",
};

export default async function SettingsPage() {
  const reqHeaders = await headers();
  const session = await getSession(reqHeaders);

  if (!session?.user) {
    redirect("/login");
  }

  const authCtx = await getAuthContext(session.user.id);
  if (!authCtx) {
    redirect("/login");
  }

  // Hak akses membaca pengaturan sistem
  const canRead = can(authCtx, "sysmgmt.settings.read:all");
  const canManage = can(authCtx, "sysmgmt.settings.manage:all");

  if (!canRead) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto shadow-sm my-12">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-200">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-2 font-serif">Akses Dibatasi</h2>
        <p className="text-xs text-slate-500 leading-relaxed mb-6">
          Akun Anda tidak memiliki izin untuk melihat modul Master Data & Pengaturan Sistem.
          Silakan hubungi Super Admin jika Anda memerlukan akses konfigurasi ini.
        </p>
      </div>
    );
  }

  // Ambil seluruh data master & preferensi secara paralel
  const [categories, assetTypes, assetLocations, preferences, stats] = await Promise.all([
    getDocumentCategories({ includeInactive: true }),
    getAssetTypes({ includeInactive: true }),
    getAssetLocations({ includeInactive: true }),
    getSystemPreferences(),
    getSettingsStats(),
  ]);

  return (
    <SettingsView
      categories={categories}
      assetTypes={assetTypes}
      assetLocations={assetLocations}
      preferences={preferences}
      stats={stats}
      canManage={canManage}
    />
  );
}
