import React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession, getAuthContext } from "@pspk/auth";
import { can } from "@pspk/rbac";
import {
  getCredentialsDirectory,
  getCredentialStats,
  getActiveEmployeesForPic,
  CredentialFilterParams,
} from "@/server/queries/credential.queries";
import { CredentialListView } from "@/components/credentials/credential-list-view";
import { ShieldAlert } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Akun & Kredensial - PSPK System Management",
  description:
    "Brankas terpusat untuk manajemen akun website, media sosial, SaaS, dan portal instansi PSPK.",
};

interface CredentialPageProps {
  searchParams?: Promise<{
    q?: string;
    category?: string;
    twoFactor?: string;
    status?: string;
    needsRotation?: string;
    page?: string;
  }>;
}

export default async function CredentialPage({ searchParams }: CredentialPageProps) {
  const reqHeaders = await headers();
  const session = await getSession(reqHeaders);

  if (!session?.user) {
    redirect("/login");
  }

  const authCtx = await getAuthContext(session.user.id);
  if (!authCtx) {
    redirect("/login");
  }

  // Periksa wewenang RBAC
  const canRead = can(authCtx, "sysmgmt.credential.read:all");
  const canManage = can(authCtx, "sysmgmt.credential.manage:all");
  const canReveal = can(authCtx, "sysmgmt.credential.reveal:all");

  if (!canRead) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto shadow-sm mt-8">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-200">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-2 font-serif">Akses Dibatasi</h2>
        <p className="text-xs text-slate-500 leading-relaxed mb-6">
          Anda tidak memiliki wewenang untuk mengakses Brankas Kredensial & Akun lembaga.
          Modul ini hanya dapat diakses oleh Administrator IT dan Super Admin.
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
  const categoryParam = (resolvedParams.category as CredentialFilterParams["category"]) || "ALL";
  const twoFactorParam = (resolvedParams.twoFactor as CredentialFilterParams["twoFactor"]) || "ALL";
  const statusParam = (resolvedParams.status as CredentialFilterParams["status"]) || "ALL";
  const needsRotationParam = resolvedParams.needsRotation === "true";
  const pageParam = Math.max(1, parseInt(resolvedParams.page || "1", 10) || 1);

  const [credentialsData, stats, picEmployees] = await Promise.all([
    getCredentialsDirectory({
      search: searchParam,
      category: categoryParam,
      twoFactor: twoFactorParam,
      status: statusParam,
      needsRotationOnly: needsRotationParam,
      page: pageParam,
      limit: 15,
    }),
    getCredentialStats(),
    getActiveEmployeesForPic(),
  ]);

  return (
    <CredentialListView
      credentialsData={credentialsData}
      stats={stats}
      picEmployees={picEmployees}
      canManage={canManage}
      canReveal={canReveal}
      initialFilters={{
        search: searchParam,
        category: categoryParam,
        twoFactor: twoFactorParam,
        status: statusParam,
        needsRotationOnly: needsRotationParam,
        page: pageParam,
      }}
    />
  );
}

