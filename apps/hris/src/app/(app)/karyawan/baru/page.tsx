import React from "react";
import Link from "next/link";
import { headers } from "next/headers";
import { ArrowLeft, UserPlus } from "lucide-react";
import { getSession, getUserProfile } from "@pspk/auth";
import { getOrgStructureData, getManagersList, getAssignableRoles } from "@/server/queries/employee.queries";
import { getActiveEmploymentTypes } from "@/server/queries/employment-type.queries";
import { WizardEmployeeForm } from "@/components/karyawan/wizard-employee-form";

export const dynamic = "force-dynamic";

export default async function TambahKaryawanPage() {
  const reqHeaders = await headers();
  const session = await getSession(reqHeaders);
  const userProfile = session?.user?.id ? await getUserProfile(session.user.id) : null;
  const isSuperAdmin = userProfile?.roles.some((r) => r.role.key === "super_admin") ?? false;

  const [departments, managers, roles, employmentTypes] = await Promise.all([
    getOrgStructureData(),
    getManagersList(),
    getAssignableRoles(),
    getActiveEmploymentTypes(),
  ]);

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-16">
      {/* Back Button & Header */}
      <div className="flex flex-col gap-2">
        <Link
          href="/karyawan"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#102E50] transition-colors w-fit"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Direktori Pegawai</span>
        </Link>

        <div className="flex items-center justify-between gap-4 pt-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#102E50]/10 text-[#102E50] flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold text-[#102E50] font-heading tracking-tight">
                Pendaftaran Pegawai Baru
              </h1>
              <p className="text-xs text-slate-500">
                Isi formulir bertahap untuk mencatat identitas, penempatan tim, kontrak kerja, dan data sensitif pegawai.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4-Step Form Wizard */}
      <WizardEmployeeForm
        mode="create"
        departments={departments}
        managers={managers}
        roles={roles}
        isSuperAdmin={isSuperAdmin}
        employmentTypes={employmentTypes}
      />
    </div>
  );
}
