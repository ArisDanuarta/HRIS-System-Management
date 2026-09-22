import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Edit } from "lucide-react";
import {
  getEmployeeById,
  getOrgStructureData,
  getManagersList,
} from "@/server/queries/employee.queries";
import { WizardEmployeeForm } from "@/components/karyawan/wizard-employee-form";

export const dynamic = "force-dynamic";

interface UbahKaryawanPageProps {
  params: Promise<{ id: string }>;
}

export default async function UbahKaryawanPage({ params }: UbahKaryawanPageProps) {
  const { id } = await params;

  const [employee, departments, managers] = await Promise.all([
    getEmployeeById(id),
    getOrgStructureData(),
    getManagersList(),
  ]);

  if (!employee) {
    notFound();
  }

  // Filter out the employee themselves from manager list to prevent circular reporting
  const filteredManagers = managers.filter((m) => m.id !== id);

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-16">
      {/* Back Link */}
      <Link
        href={`/karyawan/${employee.id}`}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#102E50] transition-colors w-fit"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Kembali ke Profil Pegawai</span>
      </Link>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#102E50]/10 text-[#102E50] flex items-center justify-center shrink-0">
          <Edit className="w-5 h-5" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold text-[#102E50] font-heading tracking-tight">
            Ubah Data: {employee.fullName}
          </h1>
          <span className="text-xs text-slate-500">
            Perbarui data identitas, penempatan posisi kerja, atau perpanjangan kontrak
          </span>
        </div>
      </div>

      {/* Form Wizard */}
      <WizardEmployeeForm
        mode="edit"
        departments={departments}
        managers={filteredManagers}
        initialData={employee}
      />
    </div>
  );
}
