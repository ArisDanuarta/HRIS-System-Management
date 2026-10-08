import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { getSession, getAuthContext } from "@pspk/auth";
import { can } from "@pspk/rbac";
import { prisma, getModuleFlags, isModuleActive } from "@pspk/db";
import {
  getAssetById,
  getActiveEmployeesForAssignment,
} from "@/server/queries/asset.queries";
import { AssetDetailView } from "@/components/assets/asset-detail-view";
import { ShieldAlert } from "lucide-react";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const asset = await getAssetById(id);
  if (!asset) return { title: "Aset Tidak Ditemukan — PSPK System Management" };

  return {
    title: `${asset.name} (${asset.assetTag}) — PSPK Inventaris Aset`,
    description: `Spesifikasi dan riwayat penugasan unit aset ${asset.name} (${asset.assetTag}).`,
  };
}

interface AssetDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AssetDetailPage({ params }: AssetDetailPageProps) {
  const reqHeaders = await headers();
  const session = await getSession(reqHeaders);

  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;

  const [authCtx, moduleFlags] = await Promise.all([
    getAuthContext(session.user.id),
    getModuleFlags(prisma),
  ]);

  if (!authCtx) {
    redirect("/login");
  }

  // Jika modul inventaris dinonaktifkan di Tata Kelola Modul, alihkan ke dashboard
  if (!isModuleActive(moduleFlags, "asset_management")) {
    redirect("/dashboard");
  }

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
          Anda tidak memiliki wewenang untuk melihat detail data aset ini.
        </p>
        <Link
          href="/aset"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#102E50] text-white text-xs font-semibold rounded-lg hover:bg-[#1a4473] transition-colors"
        >
          Kembali ke Direktori Aset
        </Link>
      </div>
    );
  }

  const isAssignmentModuleActive = isModuleActive(moduleFlags, "asset_assignment");

  const [asset, employees] = await Promise.all([
    getAssetById(id),
    isAssignmentModuleActive ? getActiveEmployeesForAssignment() : Promise.resolve([]),
  ]);

  if (!asset) {
    notFound();
  }

  return (
    <AssetDetailView
      asset={asset}
      employees={employees}
      canWrite={canWrite}
      isAssignmentModuleActive={isAssignmentModuleActive}
    />
  );
}
