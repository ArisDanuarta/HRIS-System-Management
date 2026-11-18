import React from "react";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { getSession, getUserProfile } from "@pspk/auth";
import type { Metadata } from "next";
import {
  getEmployeeById,
  getOrgStructureData,
  getManagersList,
  getActiveWorkLocations,
  getActiveLegalEntities,
} from "@/server/queries/employee.queries";
import { getActiveEmploymentTypes } from "@/server/queries/employment-type.queries";
import { WizardEmployeeForm } from "@/components/karyawan/wizard-employee-form";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const employee = await getEmployeeById(id).catch(() => null);
  const name = employee?.fullName ?? "Pegawai";
  return {
    title: `Ubah Data ${name} | HRIS PSPK`,
    description: `Formulir ubah data pegawai ${name}`,
    robots: { index: false, follow: false },
  };
}

interface UbahKaryawanPageProps {
  params: Promise<{ id: string }>;
}

export default async function UbahKaryawanPage({ params }: UbahKaryawanPageProps) {
  const { id } = await params;

  const reqHeaders = await headers();
  const session = await getSession(reqHeaders);
  if (!session || !session.user) {
    redirect("/login");
  }

  const userProfile = await getUserProfile(session.user.id);
  const roleKeys = userProfile?.roles.map((r) => r.role.key) || [];
  const isHrOrAdmin = roleKeys.includes("super_admin") || roleKeys.includes("admin_hr");

  if (!isHrOrAdmin) {
    redirect(`/karyawan/${id}`);
  }

  const [employee, departments, managers, employmentTypes, workLocations, legalEntities] =
    await Promise.all([
      getEmployeeById(id),
      getOrgStructureData(),
      getManagersList(),
      getActiveEmploymentTypes(),
      getActiveWorkLocations(),
      getActiveLegalEntities(),
    ]);

  if (!employee) {
    notFound();
  }

  // Filter out the employee themselves from manager list to prevent circular reporting
  const filteredManagers = managers.filter((m) => m.id !== id);

  return (
    <WizardEmployeeForm
      mode="edit"
      departments={departments}
      managers={filteredManagers}
      initialData={employee}
      employmentTypes={employmentTypes}
      workLocations={workLocations}
      legalEntities={legalEntities}
    />
  );
}
