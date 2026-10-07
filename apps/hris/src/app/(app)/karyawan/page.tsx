import React from "react";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Plus, Upload, Users, UserCheck, Clock, Building2, Briefcase, Network } from "lucide-react";
import { getSession, getUserProfile } from "@pspk/auth";
import { prisma, getModuleFlags, isModuleActive } from "@pspk/db";
import {
  getEmployeesDirectory,
  getOrgStructureData,
  getManagerTeamInfo,
} from "@/server/queries/employee.queries";
import { EmployeeTable } from "@/components/karyawan/employee-table";
import { EmployeeFilterBar } from "@/components/karyawan/employee-filter-bar";
import { ExpiringContractAlert } from "@/components/karyawan/expiring-contract-alert";

export const dynamic = "force-dynamic";

interface KaryawanPageProps {
  searchParams: Promise<{
    search?: string;
    dept?: string;
    status?: string;
    type?: string;
    expiring?: string;
    page?: string;
    view?: string;
  }>;
}

export default async function KaryawanPage({ searchParams }: KaryawanPageProps) {
  const reqHeaders = await headers();
  const session = await getSession(reqHeaders);

  if (!session || !session.user) {
    redirect("/login");
  }

  const userProfile = await getUserProfile(session.user.id);
  const roleKeys = userProfile?.roles.map((r) => r.role.key) || [];
  const isSuperOrHr = roleKeys.includes("super_admin") || roleKeys.includes("admin_hr");
  const isManager = roleKeys.includes("manager");

  const resolvedParams = await searchParams;
  // Mode tim aktif jika pengguna mengakses lewat ?view=team atau jika memiliki role manager non-HR
  const isTeamView = resolvedParams.view === "team" || (isManager && !isSuperOrHr);

  const page = parseInt(resolvedParams.page || "1", 10);
  const search = resolvedParams.search || "";
  const departmentId = resolvedParams.dept || "ALL";
  const status = resolvedParams.status || "ALL";
  const type = resolvedParams.type || "ALL";
  const expiringSoonOnly = resolvedParams.expiring === "true";

  const currentEmployee = userProfile?.employee || null;

  // Jika mode tim, ambil data divisi & supervisi manajer
  const managerTeamInfo =
    isTeamView && currentEmployee ? await getManagerTeamInfo(currentEmployee.id) : null;

  // Parallel data fetching via Server Component
  const [directoryData, departments, moduleFlags] = await Promise.all([
    getEmployeesDirectory({
      search,
      departmentId: isTeamView ? "ALL" : departmentId,
      status,
      type,
      expiringSoonOnly,
      page,
      pageSize: 10,
      teamManagerId: isTeamView && currentEmployee ? currentEmployee.id : undefined,
      managerDepartmentId:
        isTeamView && managerTeamInfo?.currentDepartmentId
          ? managerTeamInfo.currentDepartmentId
          : undefined,
      excludeEmployeeId: isTeamView && currentEmployee ? currentEmployee.id : undefined,
    }),
    getOrgStructureData(),
    getModuleFlags(prisma),
  ]);

  return (
    <div className="flex flex-col gap-6 max-w-[1400px] mx-auto pb-12">
      {/* Header & Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#102E50] font-heading tracking-tight">
              {isTeamView ? "Anggota Tim Saya" : "Direktori Pegawai"}
            </h1>
            {isTeamView ? (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#102E50]/10 text-[#102E50] border border-[#102E50]/20 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#F2AF3E]"></span>
                {managerTeamInfo?.currentDepartment?.name || "Divisi Saya"}
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#feba48]/20 text-[#805600] border border-[#feba48]/30">
                Admin HR
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {isTeamView
              ? `Daftar pegawai di bawah supervisi ${managerTeamInfo?.fullName || "Anda"} pada ${managerTeamInfo?.currentDepartment?.name || "divisi kerja"}.`
              : "Kelola data induk karyawan, penempatan tim riset, kontrak kerja, dan hierarki organisasi PSPK."}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {isModuleActive(moduleFlags, "org_chart") && (
            <Link
              href="/karyawan/struktur"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#eff4ff] text-[#102E50] border border-[#dee9fc] hover:bg-[#dee9fc] transition-all cursor-pointer active:scale-[0.98] shadow-xs"
            >
              <Network className="w-4 h-4 text-[#102E50]" />
              <span>Bagan Organisasi ↗</span>
            </Link>
          )}

          {isModuleActive(moduleFlags, "organization_structure") && (
            <Link
              href="/karyawan/organisasi"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 transition-all cursor-pointer active:scale-[0.98] shadow-xs"
            >
              <Building2 className="w-4 h-4 text-slate-500" />
              <span>Struktur Organisasi</span>
            </Link>
          )}

          <Link
            href="/karyawan/ikatan-kerja"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 transition-all cursor-pointer active:scale-[0.98] shadow-xs"
          >
            <Briefcase className="w-4 h-4 text-slate-500" />
            <span>Tipe Ikatan Kerja</span>
          </Link>

          {/* Tombol aksi eksklusif Admin HR: hanya muncul jika bukan mode tim */}
          {isSuperOrHr && !isTeamView && (
            <>
              <Link
                href="/karyawan/impor"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 transition-all cursor-pointer active:scale-[0.98] shadow-xs"
              >
                <Upload className="w-4 h-4 text-slate-500" />
                <span>Impor Excel</span>
              </Link>

              <Link
                href="/karyawan/baru"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#102E50] text-white hover:bg-[#0c233d] transition-all cursor-pointer active:scale-[0.98] shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Pegawai</span>
              </Link>
            </>
          )}

          {/* Quick link untuk Admin HR yang sedang meninjau mode tim agar bisa kembali ke seluruh direktori */}
          {isSuperOrHr && isTeamView && (
            <Link
              href="/karyawan"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all cursor-pointer active:scale-[0.98]"
            >
              <span>Lihat Semua Direktori HR</span>
            </Link>
          )}
        </div>
      </div>

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Metric 1: Total Active */}
        <div className="bg-white rounded-xl border border-slate-200 p-4.5 shadow-xs flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {isTeamView ? "Anggota Tim Aktif" : "Pegawai Aktif"}
            </span>
            <span className="text-2xl sm:text-3xl font-bold text-[#102E50] font-heading mt-1">
              {directoryData.stats.totalActive}
            </span>
            <span className="text-[11px] text-emerald-600 font-medium mt-0.5">
              {isTeamView ? "Dalam supervisi Anda" : "Terdaftar dalam sistem"}
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 2: Probation */}
        <div className="bg-white rounded-xl border border-slate-200 p-4.5 shadow-xs flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Masa Percobaan
            </span>
            <span className="text-2xl sm:text-3xl font-bold text-[#805600] font-heading mt-1">
              {directoryData.stats.totalProbation}
            </span>
            <span className="text-[11px] text-amber-600 font-medium mt-0.5">
              {isTeamView ? "Anggota tim evaluasi" : "Evaluasi kinerja berjalan"}
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-[#805600] flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 3: Expiring Soon */}
        <div className="bg-white rounded-xl border border-slate-200 p-4.5 shadow-xs flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Kontrak Habis ≤ 30 Hari
            </span>
            <span className="text-2xl sm:text-3xl font-bold text-[#A8281C] font-heading mt-1">
              {directoryData.stats.totalContractsExpiring}
            </span>
            <span className="text-[11px] text-[#A8281C] font-medium mt-0.5">
              {isTeamView ? "Perlu rekomendasi atasan" : "Perlu tinjauan perpanjangan"}
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-red-50 text-[#A8281C] flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Expiring PKWT Alert Banner */}
      <ExpiringContractAlert count={directoryData.stats.totalContractsExpiring} />

      {/* Filter Bar */}
      <EmployeeFilterBar
        departments={departments}
        currentSearch={search}
        currentDepartmentId={departmentId}
        currentStatus={status}
        currentType={type}
        isTeamView={isTeamView}
        departmentName={managerTeamInfo?.currentDepartment?.name}
      />

      {/* Employee Data Table */}
      <EmployeeTable
        items={directoryData.items}
        total={directoryData.total}
        page={directoryData.page}
        pageSize={directoryData.pageSize}
        totalPages={directoryData.totalPages}
        canManageEmployees={isSuperOrHr && !isTeamView}
      />
    </div>
  );
}
