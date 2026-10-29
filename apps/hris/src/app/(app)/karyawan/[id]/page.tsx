import React from "react";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { formatDate } from "@pspk/shared";
import { getSession, getUserProfile } from "@pspk/auth";
import { prisma, getModuleFlags, isModuleActive } from "@pspk/db";
import type { Metadata } from "next";
import {
  ArrowLeft,
  Edit,
  User,
  Shield,
  FileText,
  Briefcase,
  Phone,
  Mail,
  UserCheck,
  UserX,
  KeyRound,
  FolderArchive,
  Laptop,
  Calendar,
  AlertCircle,
} from "lucide-react";
import {
  getEmployeeById,
  getOrgStructureData,
  getManagersList,
  getManagerTeamInfo,
} from "@/server/queries/employee.queries";
import { getActiveEmploymentTypes } from "@/server/queries/employment-type.queries";
import { StatusBadge, ContractTypeBadge } from "@/components/karyawan/status-badge";
import { SensitiveFieldView } from "@/components/karyawan/sensitive-field-view";
import { CareerHistoryCard } from "@/components/karyawan/career-history-card";
import { EmployeeContractsTable } from "@/components/karyawan/employee-contracts-table";
import { EmployeeAccountRoleCard } from "@/components/karyawan/employee-account-role-card";
import { EmployeeDocumentsCard } from "@/components/karyawan/employee-documents-card";
import { EmployeeStatusActions } from "@/components/karyawan/employee-status-actions";
import {
  EmployeeAssetsCard,
  SerializedEmployeeAssetAssignment,
} from "@/components/karyawan/employee-assets-card";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const employee = await getEmployeeById(id).catch(() => null);
  const name = employee?.fullName ?? "Karyawan";
  return {
    title: `${name} - Profil Karyawan | HRIS PSPK`,
    description: `Detail profil karyawan ${name} di sistem HRIS PSPK`,
    robots: { index: false, follow: false },
  };
}

interface EmployeeDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}


export default async function EmployeeDetailPage({
  params,
  searchParams,
}: EmployeeDetailPageProps) {
  const { id } = await params;
  const { tab = "biodata" } = await searchParams;

  const reqHeaders = await headers();
  const session = await getSession(reqHeaders);
  if (!session || !session.user) {
    redirect("/login");
  }

  const actorProfile = await getUserProfile(session.user.id);
  const actorRoleKeys = actorProfile?.roles.map((r) => r.role.key) || [];
  const isSuperAdmin = actorRoleKeys.includes("super_admin");
  const isAdminIt = actorRoleKeys.includes("admin_it");
  const isAdminHr = actorRoleKeys.includes("admin_hr");
  const isManager = actorRoleKeys.includes("manager");
  const isHrOrAdmin = isSuperAdmin || isAdminHr;

  const currentActorEmployee = actorProfile?.employee || null;
  const managerTeamInfo =
    isManager && currentActorEmployee ? await getManagerTeamInfo(currentActorEmployee.id) : null;

  const [employee, departments, managers, moduleFlags, activeEmploymentTypes] =
    await Promise.all([
      getEmployeeById(id),
      getOrgStructureData(),
      getManagersList(),
      getModuleFlags(prisma),
      getActiveEmploymentTypes(),
    ]);

  if (!employee) {
    notFound();
  }

  const isAssetAssignmentActive = isModuleActive(moduleFlags, "asset_assignment");

  const rawAssetAssignments = isAssetAssignmentActive
    ? await prisma.assetAssignment.findMany({
        where: { employeeId: id },
        include: { asset: true },
        orderBy: { assignedAt: "desc" },
      })
    : [];

  const activeAssets: SerializedEmployeeAssetAssignment[] = rawAssetAssignments
    .filter((a) => a.returnedAt === null)
    .map((a) => ({
      id: a.id,
      assignedAt: a.assignedAt,
      returnedAt: a.returnedAt,
      conditionOut: a.conditionOut,
      conditionIn: a.conditionIn,
      notes: a.notes,
      asset: {
        id: a.asset.id,
        assetTag: a.asset.assetTag,
        name: a.asset.name,
        category: a.asset.category,
        type: a.asset.type,
        brand: a.asset.brand,
        model: a.asset.model,
        serialNumber: a.asset.serialNumber,
        location: a.asset.location,
        status: a.asset.status,
      },
    }));

  const returnedAssets: SerializedEmployeeAssetAssignment[] = rawAssetAssignments
    .filter((a) => a.returnedAt !== null)
    .map((a) => ({
      id: a.id,
      assignedAt: a.assignedAt,
      returnedAt: a.returnedAt,
      conditionOut: a.conditionOut,
      conditionIn: a.conditionIn,
      notes: a.notes,
      asset: {
        id: a.asset.id,
        assetTag: a.asset.assetTag,
        name: a.asset.name,
        category: a.asset.category,
        type: a.asset.type,
        brand: a.asset.brand,
        model: a.asset.model,
        serialNumber: a.asset.serialNumber,
        location: a.asset.location,
        status: a.asset.status,
      },
    }));

  // Proteksi Akses Berbasis Peran:
  // 1. Super Admin, Admin HR, dan Admin IT memiliki akses institusi penuh
  // 2. Manajer hanya boleh melihat profil dirinya sendiri, bawahan langsungnya, atau pegawai di divisi yang dipimpinnya
  if (isManager && !isHrOrAdmin && !isAdminIt) {
    const isSelf = currentActorEmployee?.id === employee.id;
    const isDirectReport = employee.managerId === currentActorEmployee?.id;
    const isSameDepartment =
      Boolean(managerTeamInfo?.currentDepartmentId) &&
      employee.currentDepartmentId === managerTeamInfo?.currentDepartmentId;

    if (!isSelf && !isDirectReport && !isSameDepartment) {
      redirect("/karyawan?view=team");
    }
  } else if (!isSuperAdmin && !isAdminHr && !isAdminIt && !isManager) {
    // Pengguna Staff biasa diarahkan ke profil sendiri jika melihat diri sendiri, atau ke dashboard
    if (currentActorEmployee?.id === employee.id) {
      redirect("/profil");
    } else {
      redirect("/dashboard");
    }
  }

  // Sanitasi Tab: Tab data sensitif dan akun hanya diizinkan untuk Admin HR / Super Admin
  let effectiveTab = tab;
  if (!isHrOrAdmin && (tab === "sensitif" || tab === "akun")) {
    effectiveTab = "biodata";
  } else if (tab === "aset" && !isAssetAssignmentActive) {
    effectiveTab = "biodata";
  }

  const initial = employee.fullName.charAt(0).toUpperCase();

  const isTerminated = employee.status === "TERMINATED" || employee.status === "RESIGNED";
  const activeContract =
    employee.contracts.find((c) => c.status === "ACTIVE") ||
    (isTerminated ? employee.contracts[0] : null);

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-16">
      {/* Back Link */}
      <Link
        href={isManager && !isHrOrAdmin ? "/karyawan?view=team" : "/karyawan"}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#102E50] transition-colors w-fit"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>
          {isManager && !isHrOrAdmin ? "Kembali ke Tim Saya" : "Kembali ke Direktori Pegawai"}
        </span>
      </Link>

      {/* Alert Banner jika Pegawai Nonaktif / Berhenti */}
      {isTerminated && (
        <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900 shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800 shrink-0">
              <UserX className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                Status: Nonaktif / Berhenti ({employee.status})
              </span>
              <span className="text-xs text-amber-700 mt-0.5">
                Pegawai ini saat ini berstatus nonaktif dan akses login akun pengguna terkait telah dinonaktifkan. Seluruh riwayat tetap tersimpan.
              </span>
            </div>
          </div>
          {isHrOrAdmin && (
            <EmployeeStatusActions
              employeeId={employee.id}
              employeeName={employee.fullName}
              employeeNo={employee.employeeNo}
              isTerminated={isTerminated}
              variant="banner"
            />
          )}
        </div>
      )}

      {/* Modern Profile Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col">
        {/* Subtle Brand Accent Top Bar */}
        <div className="h-2 bg-gradient-to-r from-[#102E50] via-[#102E50]/90 to-[#F2AF3E]" />

        <div className="p-5 sm:p-6 flex flex-col gap-4">
          {/* Main Top Row: Avatar, Identity & Actions */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
            {/* Left: Avatar & Identity */}
            <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5">
              {/* Photo Avatar or Fallback Initials */}
              {employee.photoKey ? (
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden ring-1 ring-slate-200 shadow-sm shrink-0 bg-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/documents/${employee.photoKey}`}
                    alt={employee.fullName}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#102E50]/10 text-[#102E50] font-bold text-2xl sm:text-3xl font-heading flex items-center justify-center border border-[#102E50]/20 shadow-xs shrink-0">
                  {initial}
                </div>
              )}

              {/* Name, Title, Badges */}
              <div className="flex flex-col">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold text-[#102E50] font-heading tracking-tight">
                    {employee.fullName}
                  </h1>
                  {employee.nickname && (
                    <span className="text-xs text-slate-500 font-medium px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200">
                      &ldquo;{employee.nickname}&rdquo;
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-600 mt-1.5 flex-wrap">
                  <span className="font-semibold text-slate-800">
                    {employee.currentPosition?.title || "Belum ada jabatan"}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-600">
                    {employee.currentDepartment?.name || "Belum ada divisi"}
                  </span>
                </div>

                {/* Badges Row */}
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    NIP: {employee.employeeNo}
                  </span>
                  <StatusBadge status={employee.status} size="sm" />
                  {activeContract && (
                    <ContractTypeBadge
                      type={activeContract.type}
                      label={activeContract.employmentTypeMaster?.name}
                    />
                  )}
                  {employee.user?.roles && employee.user.roles.length > 0 && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#102E50]/10 text-[#102E50] border border-[#102E50]/20">
                      <KeyRound className="w-3 h-3 text-[#F2AF3E]" />
                      <span>{employee.user.roles.map((r) => r.role.name).join(", ")}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Action Buttons */}
            {isHrOrAdmin && (
              <div className="flex items-center gap-2 shrink-0 flex-wrap self-start">
                <EmployeeStatusActions
                  employeeId={employee.id}
                  employeeName={employee.fullName}
                  employeeNo={employee.employeeNo}
                  isTerminated={isTerminated}
                  variant="header"
                />
                <Link
                  href={`/karyawan/${employee.id}/ubah`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#102E50] text-white hover:bg-[#0c233d] transition-all cursor-pointer active:scale-[0.98] shadow-xs"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Ubah Profil</span>
                </Link>
              </div>
            )}
          </div>

          {/* Quick Contact & Metadata Strip */}
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-y-2 gap-x-5 text-xs text-slate-600">
            <a
              href={`mailto:${employee.workEmail}`}
              className="inline-flex items-center gap-1.5 hover:text-[#102E50] hover:underline transition-colors"
              title="Kirim email kerja"
            >
              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="font-medium text-slate-700">{employee.workEmail}</span>
            </a>

            {employee.phone && (
              <a
                href={`tel:${employee.phone}`}
                className="inline-flex items-center gap-1.5 hover:text-[#102E50] hover:underline transition-colors"
                title="Nomor telepon pegawai"
              >
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="font-medium text-slate-700">{employee.phone}</span>
              </a>
            )}

            {employee.manager && (
              <Link
                href={`/karyawan/${employee.manager.id}`}
                className="inline-flex items-center gap-1.5 hover:text-[#102E50] hover:underline transition-colors"
                title="Lihat profil atasan langsung"
              >
                <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="text-slate-500">Atasan:</span>
                <span className="font-semibold text-slate-800">{employee.manager.fullName}</span>
              </Link>
            )}

            <div className="inline-flex items-center gap-1.5 text-slate-500">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Mulai Bergabung:</span>
              <span className="font-medium text-slate-700">{formatDate(employee.joinDate)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-slate-100/90 p-1.5 rounded-xl border border-slate-200/80 flex items-center gap-1.5 overflow-x-auto shadow-2xs">
        <Link
          href={`/karyawan/${employee.id}?tab=biodata`}
          className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer shrink-0 ${
            effectiveTab === "biodata"
              ? "bg-white text-[#102E50] shadow-xs border border-slate-200/80"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          }`}
        >
          <User className="w-4 h-4 text-slate-500" />
          <span>Biodata & Kontak</span>
        </Link>

        {isHrOrAdmin && (
          <Link
            href={`/karyawan/${employee.id}?tab=sensitif`}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer shrink-0 ${
              effectiveTab === "sensitif"
                ? "bg-white text-[#102E50] shadow-xs border border-slate-200/80"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <Shield className="w-4 h-4 text-amber-600" />
            <span>Data Sensitif & Bank</span>
          </Link>
        )}

        <Link
          href={`/karyawan/${employee.id}?tab=kontrak`}
          className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer shrink-0 ${
            effectiveTab === "kontrak"
              ? "bg-white text-[#102E50] shadow-xs border border-slate-200/80"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          }`}
        >
          <FileText className="w-4 h-4 text-slate-500" />
          <span>Kontrak Kerja</span>
          <span
            className={`px-1.5 py-0.5 text-[10px] rounded-full font-bold ${
              effectiveTab === "kontrak"
                ? "bg-[#102E50]/10 text-[#102E50]"
                : "bg-slate-200/80 text-slate-600"
            }`}
          >
            {employee.contracts.length}
          </span>
        </Link>

        <Link
          href={`/karyawan/${employee.id}?tab=jabatan`}
          className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer shrink-0 ${
            effectiveTab === "jabatan"
              ? "bg-white text-[#102E50] shadow-xs border border-slate-200/80"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          }`}
        >
          <Briefcase className="w-4 h-4 text-slate-500" />
          <span>Jabatan & Tim</span>
          {employee.histories.length > 0 && (
            <span
              className={`px-1.5 py-0.5 text-[10px] rounded-full font-bold ${
                effectiveTab === "jabatan"
                  ? "bg-[#102E50]/10 text-[#102E50]"
                  : "bg-slate-200/80 text-slate-600"
              }`}
            >
              {employee.histories.length}
            </span>
          )}
        </Link>

        <Link
          href={`/karyawan/${employee.id}?tab=dokumen`}
          className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer shrink-0 ${
            effectiveTab === "dokumen"
              ? "bg-white text-[#102E50] shadow-xs border border-slate-200/80"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          }`}
        >
          <FolderArchive className="w-4 h-4 text-[#102E50]" />
          <span>Dokumen & Berkas</span>
          <span
            className={`px-1.5 py-0.5 text-[10px] rounded-full font-bold ${
              effectiveTab === "dokumen"
                ? "bg-[#102E50]/10 text-[#102E50]"
                : "bg-slate-200/80 text-slate-600"
            }`}
          >
            {employee.documents?.length || 0}
          </span>
        </Link>

        {isAssetAssignmentActive && (
          <Link
            href={`/karyawan/${employee.id}?tab=aset`}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer shrink-0 ${
              effectiveTab === "aset"
                ? "bg-white text-[#102E50] shadow-xs border border-slate-200/80"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <Laptop className="w-4 h-4 text-[#102E50]" />
            <span>Aset yang Dibawa</span>
            <span
              className={`px-1.5 py-0.5 text-[10px] rounded-full font-bold ${
                effectiveTab === "aset"
                  ? "bg-[#102E50]/10 text-[#102E50]"
                  : "bg-slate-200/80 text-slate-600"
              }`}
            >
              {activeAssets.length}
            </span>
          </Link>
        )}

        {isHrOrAdmin && (
          <Link
            href={`/karyawan/${employee.id}?tab=akun`}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer shrink-0 ${
              effectiveTab === "akun"
                ? "bg-white text-[#102E50] shadow-xs border border-slate-200/80"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <KeyRound className="w-4 h-4 text-[#F2AF3E]" />
            <span>Akun & Hak Akses</span>
            {employee.user ? (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Akun aktif" />
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Belum memiliki akun" />
            )}
          </Link>
        )}
      </div>

      {/* TAB 1: BIODATA & KONTAK */}
      {effectiveTab === "biodata" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Data Pribadi */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex flex-col gap-4">
            <h3 className="font-bold text-sm text-[#102E50] font-heading pb-2 border-b border-slate-100">
              Identitas Pribadi
            </h3>

            <div className="grid grid-cols-2 gap-y-3.5 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Nama Lengkap</span>
                <span className="font-semibold text-slate-800">{employee.fullName}</span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Nama Panggilan</span>
                <span className="font-semibold text-slate-800">{employee.nickname || "-"}</span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Jenis Kelamin</span>
                <span className="font-semibold text-slate-800">
                  {employee.gender === "MALE"
                    ? "Laki-laki"
                    : employee.gender === "FEMALE"
                      ? "Perempuan"
                      : "-"}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Status Pernikahan</span>
                <span className="font-semibold text-slate-800">
                  {employee.maritalStatus === "MARRIED"
                    ? "Menikah"
                    : employee.maritalStatus === "SINGLE"
                      ? "Belum Menikah"
                      : employee.maritalStatus || "-"}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Tempat, Tanggal Lahir</span>
                <span className="font-semibold text-slate-800">
                  {employee.birthPlace || "-"},{" "}
                  {employee.birthDate ? formatDate(employee.birthDate) : "-"}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Tanggal Bergabung</span>
                <span className="font-semibold text-slate-800 font-mono">
                  {formatDate(employee.joinDate)}
                </span>
              </div>

              <div className="col-span-2">
                <span className="text-slate-400 block mb-0.5">Alamat Domisili</span>
                {employee.address ? (
                  <span className="font-medium text-slate-700 leading-relaxed">
                    {employee.address}
                  </span>
                ) : (
                  <span className="text-slate-400 italic text-xs">Belum dicantumkan</span>
                )}
              </div>
            </div>
          </div>

          {/* Card 2: Kontak & Darurat */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex flex-col gap-4">
            <h3 className="font-bold text-sm text-[#102E50] font-heading pb-2 border-b border-slate-100">
              Informasi Kontak & Darurat
            </h3>

            <div className="flex flex-col gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg flex items-center gap-3">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-[11px] text-slate-400">Email Kantor (Resmi)</span>
                  <span className="font-semibold text-slate-800 truncate">
                    {employee.workEmail}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg flex items-center gap-3">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-[11px] text-slate-400">Email Pribadi</span>
                  <span className="font-semibold text-slate-800 truncate">
                    {employee.personalEmail || "-"}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg flex items-center gap-3">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-[11px] text-slate-400">Nomor Telepon / WhatsApp</span>
                  <span className="font-semibold text-slate-800">{employee.phone || "-"}</span>
                </div>
              </div>

              <div className="p-3.5 bg-amber-50/50 border border-amber-200/60 rounded-xl flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 text-[#805600] font-bold text-xs">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Kontak Darurat</span>
                </div>
                {employee.emergencyContactName || employee.emergencyContactPhone ? (
                  <div className="flex justify-between items-center text-xs mt-0.5">
                    <span className="text-slate-700 font-medium">
                      {employee.emergencyContactName || "Nama tidak dicatat"}
                    </span>
                    <span className="font-mono font-bold text-slate-800">
                      {employee.emergencyContactPhone || "-"}
                    </span>
                  </div>
                ) : (
                  <span className="text-slate-500 italic text-xs mt-0.5">
                    Belum ada kontak darurat yang dicantumkan
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DATA SENSITIF & BANK */}
      {isHrOrAdmin && effectiveTab === "sensitif" && (
        <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs flex flex-col gap-5">
          <div className="flex flex-col">
            <h3 className="font-bold text-base text-[#102E50] font-heading">
              Data Pribadi Sensitif & Payroll Perbankan
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Nilai di bawah ini dilindungi enkripsi AES-256-GCM. Pembukaan data akan tercatat di
              sistem audit trail.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col gap-2">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Nomor Induk Kependudukan (NIK)
              </span>
              <SensitiveFieldView
                employeeId={employee.id}
                field="nik"
                fieldLabel="Nomor Induk Kependudukan (NIK)"
                maskedValue={employee.nikMasked}
                hasValue={employee.hasNik}
              />
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col gap-2">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Nomor Pokok Wajib Pajak (NPWP)
              </span>
              <SensitiveFieldView
                employeeId={employee.id}
                field="npwp"
                fieldLabel="Nomor Pokok Wajib Pajak (NPWP)"
                maskedValue={employee.npwpMasked}
                hasValue={employee.hasNpwp}
              />
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col gap-2">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Bank Payroll Lembaga
              </span>
              <span className="font-semibold text-sm text-slate-900">
                {employee.bankName || "Bank Mandiri"}
              </span>
              <span className="text-[11px] text-slate-500">
                Pemilik: {employee.bankAccountName || employee.fullName}
              </span>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col gap-2">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Nomor Rekening Bank
              </span>
              <SensitiveFieldView
                employeeId={employee.id}
                field="bankAccount"
                fieldLabel="Nomor Rekening Bank"
                maskedValue={employee.bankAccountMasked}
                hasValue={employee.hasBankAccount}
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: KONTRAK KERJA */}
      {effectiveTab === "kontrak" && (
        <EmployeeContractsTable
          employeeId={employee.id}
          employeeName={employee.fullName}
          isHrOrAdmin={isHrOrAdmin}
          contracts={employee.contracts.map((c) => ({
            id: c.id,
            type: c.type,
            wageType: c.wageType,
            hourlyRate: c.hourlyRate ? Number(c.hourlyRate) : null,
            baseSalary: c.baseSalary ? Number(c.baseSalary) : null,
            startDate: c.startDate,
            endDate: c.endDate,
            status: c.status,
            documentKey: c.documentKey,
            notes: c.notes,
            employmentTypeMaster: c.employmentTypeMaster,
          }))}
        />
      )}

      {/* TAB 4: JABATAN & TIM */}
      {effectiveTab === "jabatan" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card Atasan & Bawahan */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex flex-col gap-4">
            <h3 className="font-bold text-sm text-[#102E50] font-heading pb-2 border-b border-slate-100">
              Hierarki Tim & Laporan Kerja
            </h3>

            <div className="flex flex-col gap-3 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
                <UserCheck className="w-5 h-5 text-[#102E50] shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="text-[11px] text-slate-400 font-bold uppercase">
                    Atasan Langsung (Manager)
                  </span>
                  {employee.manager ? (
                    <div className="mt-1">
                      <Link
                        href={`/karyawan/${employee.manager.id}`}
                        className="font-bold text-slate-900 hover:text-[#102E50] hover:underline"
                      >
                        {employee.manager.fullName}
                      </Link>
                      <span className="text-slate-500 block">
                        {employee.manager.currentPosition?.title || employee.manager.employeeNo}
                      </span>
                    </div>
                  ) : (
                    <span className="text-slate-500 italic mt-0.5">
                      Tidak memiliki atasan langsung (Direksi / Mandiri)
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2 mt-2">
                <span className="font-bold text-xs text-slate-700">
                  Bawahan Langsung ({employee.directReports.length} Pegawai)
                </span>
                {employee.directReports.length === 0 ? (
                  <span className="text-slate-400 italic text-xs">
                    Tidak ada bawahan langsung yang melapor ke pegawai ini.
                  </span>
                ) : (
                  <div className="flex flex-col divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                    {employee.directReports.map((sub) => (
                      <div
                        key={sub.id}
                        className="p-2.5 bg-white hover:bg-slate-50 flex items-center justify-between"
                      >
                        <div className="flex flex-col">
                          <Link
                            href={`/karyawan/${sub.id}`}
                            className="font-semibold text-slate-800 hover:text-[#102E50] hover:underline"
                          >
                            {sub.fullName}
                          </Link>
                          <span className="text-[11px] text-slate-400">
                            {sub.currentPosition?.title || sub.employeeNo}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Card Riwayat Mutasi & Jabatan dengan Fitur Mutasi Cepat */}
          <CareerHistoryCard
            employee={{
              id: employee.id,
              fullName: employee.fullName,
              employeeNo: employee.employeeNo,
              currentDepartmentId: employee.currentDepartmentId,
              currentDepartmentName: employee.currentDepartment?.name,
              currentPositionId: employee.currentPositionId,
              currentPositionTitle: employee.currentPosition?.title,
              managerId: employee.managerId,
              managerName: employee.manager?.fullName,
              currentEmploymentType: activeContract?.type || null,
              currentEmploymentTypeId: activeContract?.employmentTypeId || null,
              currentEmploymentTypeName: activeContract?.employmentTypeMaster?.name,
              currentContractEndDate: activeContract?.endDate
                ? activeContract.endDate.toISOString()
                : null,
              currentBaseSalary: activeContract?.baseSalary
                ? Number(activeContract.baseSalary)
                : null,
            }}
            histories={employee.histories}
            departments={departments}
            managers={managers}
            employmentTypes={activeEmploymentTypes}
            isHrOrAdmin={isHrOrAdmin}
          />
        </div>
      )}

      {/* TAB 5: AKUN & HAK AKSES */}
      {isHrOrAdmin && effectiveTab === "akun" && (
        <EmployeeAccountRoleCard
          employeeId={employee.id}
          fullName={employee.fullName}
          workEmail={employee.workEmail}
          personalEmail={employee.personalEmail}
          user={employee.user}
          isSuperAdmin={isSuperAdmin}
          isAdminIt={isAdminIt}
          isAdminHr={isAdminHr}
        />
      )}

      {/* TAB 6: DOKUMEN & BERKAS DIGITAL */}
      {effectiveTab === "dokumen" && (
        <EmployeeDocumentsCard
          employeeId={employee.id}
          employeeName={employee.fullName}
          documents={employee.documents || []}
          canUpload={isHrOrAdmin || currentActorEmployee?.id === employee.id}
          canDelete={isHrOrAdmin || currentActorEmployee?.id === employee.id}
          isHrOrAdmin={isHrOrAdmin}
        />
      )}

      {/* TAB 7: ASET & FASILITAS KERJA (Modular Feature Flag) */}
      {isAssetAssignmentActive && effectiveTab === "aset" && (
        <EmployeeAssetsCard
          employeeName={employee.fullName}
          activeAssignments={activeAssets}
          returnedAssignments={returnedAssets}
          isHrOrAdmin={isHrOrAdmin}
        />
      )}
    </div>
  );
}
