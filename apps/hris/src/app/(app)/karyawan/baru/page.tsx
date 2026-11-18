import React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession, getUserProfile } from "@pspk/auth";
import type { Metadata } from "next";
import {
  getOrgStructureData,
  getManagersList,
  getAssignableRoles,
  getActiveWorkLocations,
  getActiveLegalEntities,
} from "@/server/queries/employee.queries";
import { getActiveEmploymentTypes } from "@/server/queries/employment-type.queries";
import { WizardEmployeeForm } from "@/components/karyawan/wizard-employee-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pendaftaran Pegawai Baru | HRIS PSPK",
  description: "Formulir pendaftaran pegawai baru PSPK terpadu",
  robots: { index: false, follow: false },
};

export default async function TambahKaryawanPage() {
  const reqHeaders = await headers();
  const session = await getSession(reqHeaders);
  if (!session?.user) {
    redirect("/login");
  }

  const userProfile = await getUserProfile(session.user.id);
  const roleKeys = userProfile?.roles.map((r) => r.role.key) || [];
  const isHrOrAdmin = roleKeys.includes("super_admin") || roleKeys.includes("admin_hr");

  if (!isHrOrAdmin) {
    redirect("/karyawan");
  }

  const isSuperAdmin = roleKeys.includes("super_admin");

  const [departments, managers, roles, employmentTypes, workLocations, legalEntities] =
    await Promise.all([
      getOrgStructureData(),
      getManagersList(),
      getAssignableRoles(),
      getActiveEmploymentTypes(),
      getActiveWorkLocations(),
      getActiveLegalEntities(),
    ]);

  return (
    <WizardEmployeeForm
      mode="create"
      departments={departments}
      managers={managers}
      roles={roles}
      isSuperAdmin={isSuperAdmin}
      employmentTypes={employmentTypes}
      workLocations={workLocations}
      legalEntities={legalEntities}
    />
  );
}
