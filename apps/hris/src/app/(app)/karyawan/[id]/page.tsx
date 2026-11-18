import React from "react";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { formatDate, formatRupiah } from "@pspk/shared";
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
  Receipt,
  Info,
  LayoutDashboard,
} from "lucide-react";
import { getPtkpExplanation, getTaxMethodExplanation } from "@/lib/tax-explanation";
import {
  getEmployeeById,
  getOrgStructureData,
  getManagersList,
  getManagerTeamInfo,
} from "@/server/queries/employee.queries";
import { getActiveEmploymentTypes } from "@/server/queries/employment-type.queries";
import { getEmployeeMonthlyAttendanceOverview } from "@/server/queries/attendance.queries";
import {
  StatusBadge,
  ContractTypeBadge,
  PtkpBadge,
  TaxMethodBadge,
} from "@/components/karyawan/status-badge";
import { SensitiveFieldView } from "@/components/karyawan/sensitive-field-view";
import { CareerHistoryCard } from "@/components/karyawan/career-history-card";
import { EmployeeContractsTable } from "@/components/karyawan/employee-contracts-table";
import { EmployeeAccountRoleCard } from "@/components/karyawan/employee-account-role-card";
import { EmployeeDocumentsCard } from "@/components/karyawan/employee-documents-card";
import { EmployeeStatusActions } from "@/components/karyawan/employee-status-actions";
import { EmployeeAvatar } from "@/components/karyawan/employee-avatar";
import { ExportProfileButton } from "@/components/karyawan/export-profile-button";
import {
  EmployeeAssetsCard,
  SerializedEmployeeAssetAssignment,
} from "@/components/karyawan/employee-assets-card";
import { EmployeeOverviewTab } from "@/components/karyawan/tabs/employee-overview-tab";
import { EmployeeBiodataTab } from "@/components/karyawan/tabs/employee-biodata-tab";
import { EmployeeAttendanceTab } from "@/components/karyawan/tabs/employee-attendance-tab";

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
    title: `${name} - Profil Karyawan 360° | HRIS PSPK`,
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
  const { tab = "ringkasan" } = await searchParams;

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

  // Waktu saat ini untuk absensi & cuti
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const [
    employee,
    departments,
    managers,
    moduleFlags,
    activeEmploymentTypes,
    attendanceOverview,
  ] = await Promise.all([
    getEmployeeById(id),
    getOrgStructureData(),
    getManagersList(),
    getModuleFlags(prisma),
    getActiveEmploymentTypes(),
    getEmployeeMonthlyAttendanceOverview(id, currentYear, currentMonth),
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

  // Sanitasi Tab: Tab yang valid
  const VALID_TABS = [
    "ringkasan",
    "biodata",
    "absensi",
    "kontrak",
    "jabatan",
    "dokumen",
    "aset",
    "sensitif",
    "akun",
  ];
  let effectiveTab = VALID_TABS.includes(tab) ? tab : "ringkasan";

  if (!isHrOrAdmin && (effectiveTab === "sensitif" || effectiveTab === "akun")) {
    effectiveTab = "ringkasan";
  } else if (effectiveTab === "aset" && !isAssetAssignmentActive) {
    effectiveTab = "ringkasan";
  }

  const isTerminated = employee.status === "TERMINATED" || employee.status === "RESIGNED";
  const activeContract =
    employee.contracts.find((c) => c.status === "ACTIVE") ||
    (isTerminated ? employee.contracts[0] : null);

  return (
    <div className="flex flex-col gap-6 w-full min-w-0 max-w-5xl mx-auto pb-16">
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
        <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900 shadow-xs animate-in fade-in duration-200 w-full min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800 shrink-0">
              <UserX className="w-5 h-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                Status: Nonaktif / Berhenti ({employee.status})
              </span>
              <span className="text-xs text-amber-700 mt-0.5 break-words">
                Pegawai ini saat ini berstatus nonaktif dan akses login akun pengguna terkait telah
                dinonaktifkan. Seluruh riwayat tetap tersimpan.
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

      {/* Modern Profile Header Card (Hero Card 360°) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col w-full min-w-0 max-w-full">
        {/* Brand Accent Top Bar */}
        <div className="h-2 bg-gradient-to-r from-[#102E50] via-[#102E50]/90 to-[#F2AF3E]" />

        <div className="p-4 sm:p-6 flex flex-col gap-4 w-full min-w-0">
          {/* Main Top Row: Avatar, Identity & Actions */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 sm:gap-5 w-full min-w-0">
            {/* Left: Avatar & Identity */}
            <div className="flex flex-col sm:flex-row items-start gap-3.5 sm:gap-5 w-full min-w-0">
              {/* Photo Avatar with Gender Fallback */}
              <div className="shrink-0">
                <EmployeeAvatar
                  photoKey={employee.photoKey}
                  name={employee.fullName}
                  gender={employee.gender}
                />
              </div>

              {/* Name, Title, Badges */}
              <div className="flex flex-col min-w-0 w-full">
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                  <h1 className="text-xl sm:text-2xl font-bold text-[#102E50] font-heading tracking-tight break-words">
                    {employee.fullName}
                  </h1>
                  {employee.nickname && (
                    <span className="text-xs text-slate-500 font-medium px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 shrink-0">
                      &ldquo;{employee.nickname}&rdquo;
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-600 mt-1.5 flex-wrap min-w-0">
                  <span className="font-semibold text-slate-800">
                    {employee.currentPosition?.title || "Belum ada jabatan"}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-600">
                    {employee.currentDepartment?.name || "Belum ada divisi"}
                  </span>
                </div>

                {/* Badges Row */}
                <div className="flex items-center gap-2 mt-3 flex-wrap min-w-0">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                    NIP: {employee.employeeNo}
                  </span>
                  <StatusBadge status={employee.status} size="sm" />
                  <PtkpBadge status={employee.ptkpStatus} size="sm" />
                  {activeContract && (
                    <ContractTypeBadge
                      type={activeContract.type}
                      label={activeContract.employmentTypeMaster?.name}
                    />
                  )}
                  {employee.user?.roles && employee.user.roles.length > 0 && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#102E50]/10 text-[#102E50] border border-[#102E50]/20 shrink-0">
                      <KeyRound className="w-3 h-3 text-[#F2AF3E]" />
                      <span>{employee.user.roles.map((r) => r.role.name).join(", ")}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Action Buttons (Export Profil & Ubah Profil) */}
            <div className="flex items-center gap-2 shrink-0 flex-wrap w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 justify-start sm:justify-end">
              {/* Tombol Export Profil (HR / Admin & Manager) */}
              {(isHrOrAdmin || isManager) && (
                <ExportProfileButton
                  employeeId={employee.id}
                  employeeName={employee.fullName}
                  employeeNo={employee.employeeNo}
                  isHrOrAdmin={isHrOrAdmin}
                  isManager={isManager}
                />
              )}

              {/* Status Actions (Nonaktif / Aktifkan Kembali) */}
              {isHrOrAdmin && (
                <EmployeeStatusActions
                  employeeId={employee.id}
                  employeeName={employee.fullName}
                  employeeNo={employee.employeeNo}
                  isTerminated={isTerminated}
                  variant="header"
                />
              )}

              {/* Tombol Ubah Profil (Khusus HR/Admin) */}
              {isHrOrAdmin && (
                <Link
                  href={`/karyawan/${employee.id}/ubah`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#102E50] text-[#ffddb0] hover:bg-[#0c233d] transition-all cursor-pointer active:scale-[0.98] shadow-xs"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Ubah Profil</span>
                </Link>
              )}
            </div>
          </div>

          {/* Quick Contact & Metadata Strip */}
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-y-2 gap-x-5 text-xs text-slate-600 w-full min-w-0">
            <a
              href={`mailto:${employee.workEmail}`}
              className="inline-flex items-center gap-1.5 hover:text-[#102E50] hover:underline transition-colors max-w-full min-w-0 truncate"
              title="Kirim email kerja"
            >
              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="font-medium text-slate-700 truncate">{employee.workEmail}</span>
            </a>

            {employee.phone && (
              <a
                href={`tel:${employee.phone}`}
                className="inline-flex items-center gap-1.5 hover:text-[#102E50] hover:underline transition-colors max-w-full min-w-0 truncate"
                title="Nomor telepon pegawai"
              >
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="font-medium text-slate-700 truncate">{employee.phone}</span>
              </a>
            )}

            {employee.manager && (
              <Link
                href={`/karyawan/${employee.manager.id}`}
                className="inline-flex items-center gap-1.5 hover:text-[#102E50] hover:underline transition-colors max-w-full min-w-0 truncate"
                title="Lihat profil atasan langsung"
              >
                <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="text-slate-500 shrink-0">Atasan:</span>
                <span className="font-semibold text-slate-800 truncate">
                  {employee.manager.fullName}
                </span>
              </Link>
            )}

            <div className="inline-flex items-center gap-1.5 text-slate-500 shrink-0">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Mulai Bergabung:</span>
              <span className="font-medium text-slate-700">{formatDate(employee.joinDate)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation (Responsive Horizontal Swipe dengan Proteksi Scroll) */}
      <div className="flex items-center gap-1 sm:gap-1.5 border-b border-slate-200 overflow-x-auto scrollbar-none w-full min-w-0 max-w-full [overscroll-behavior-x:contain] py-0.5">
        {/* TAB 1: Ringkasan 360° (Default) */}
        <Link
          href={`/karyawan/${employee.id}?tab=ringkasan`}
          className={`shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
            effectiveTab === "ringkasan"
              ? "border-[#102E50] text-[#102E50]"
              : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
          }`}
        >
          <LayoutDashboard className="w-4 h-4 text-[#102E50]" />
          <span>Ringkasan</span>
        </Link>

        {/* TAB 2: Biodata & Riwayat Terpadu */}
        <Link
          href={`/karyawan/${employee.id}?tab=biodata`}
          className={`shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
            effectiveTab === "biodata"
              ? "border-[#102E50] text-[#102E50]"
              : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
          }`}
        >
          <User className="w-4 h-4" />
          <span>Biodata</span>
        </Link>

        {/* TAB 3: Absensi & Cuti */}
        <Link
          href={`/karyawan/${employee.id}?tab=absensi`}
          className={`shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
            effectiveTab === "absensi"
              ? "border-[#102E50] text-[#102E50]"
              : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
          }`}
        >
          <Calendar className="w-4 h-4 text-emerald-600" />
          <span>Absensi & Cuti</span>
        </Link>

        {/* TAB 4: Kontrak Kerja */}
        <Link
          href={`/karyawan/${employee.id}?tab=kontrak`}
          className={`shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
            effectiveTab === "kontrak"
              ? "border-[#102E50] text-[#102E50]"
              : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Kontrak</span>
          <span
            className={`px-1.5 py-0.5 text-[10px] rounded-full font-bold ${
              effectiveTab === "kontrak"
                ? "bg-[#102E50]/10 text-[#102E50]"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            {employee.contracts.length}
          </span>
        </Link>

        {/* TAB 5: Jabatan & Tim */}
        <Link
          href={`/karyawan/${employee.id}?tab=jabatan`}
          className={`shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
            effectiveTab === "jabatan"
              ? "border-[#102E50] text-[#102E50]"
              : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Jabatan & Tim</span>
          {employee.histories.length > 0 && (
            <span
              className={`px-1.5 py-0.5 text-[10px] rounded-full font-bold ${
                effectiveTab === "jabatan"
                  ? "bg-[#102E50]/10 text-[#102E50]"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {employee.histories.length}
            </span>
          )}
        </Link>

        {/* TAB 6: Dokumen Digital */}
        <Link
          href={`/karyawan/${employee.id}?tab=dokumen`}
          className={`shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
            effectiveTab === "dokumen"
              ? "border-[#102E50] text-[#102E50]"
              : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
          }`}
        >
          <FolderArchive className="w-4 h-4 text-[#102E50]" />
          <span>Dokumen</span>
          <span
            className={`px-1.5 py-0.5 text-[10px] rounded-full font-bold ${
              effectiveTab === "dokumen"
                ? "bg-[#102E50]/10 text-[#102E50]"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            {employee.documents?.length || 0}
          </span>
        </Link>

        {/* TAB 7: Aset & Fasilitas Kerja (Modular) */}
        {isAssetAssignmentActive && (
          <Link
            href={`/karyawan/${employee.id}?tab=aset`}
            className={`shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              effectiveTab === "aset"
                ? "border-[#102E50] text-[#102E50]"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
            }`}
          >
            <Laptop className="w-4 h-4 text-[#102E50]" />
            <span>Aset</span>
            <span
              className={`px-1.5 py-0.5 text-[10px] rounded-full font-bold ${
                effectiveTab === "aset"
                  ? "bg-[#102E50]/10 text-[#102E50]"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {activeAssets.length}
            </span>
          </Link>
        )}

        {/* TAB 8: Data Sensitif & Pajak (Khusus HR/Admin) */}
        {isHrOrAdmin && (
          <Link
            href={`/karyawan/${employee.id}?tab=sensitif`}
            className={`shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              effectiveTab === "sensitif"
                ? "border-[#102E50] text-[#102E50]"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
            }`}
          >
            <Shield className="w-4 h-4 text-amber-600" />
            <span>Data Sensitif</span>
          </Link>
        )}

        {/* TAB 9: Akun & Hak Akses (Khusus HR/Admin) */}
        {isHrOrAdmin && (
          <Link
            href={`/karyawan/${employee.id}?tab=akun`}
            className={`shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              effectiveTab === "akun"
                ? "border-[#102E50] text-[#102E50]"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
            }`}
          >
            <KeyRound className="w-4 h-4 text-[#F2AF3E]" />
            <span>Akun & Akses</span>
            {employee.user ? (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Akun aktif" />
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Belum memiliki akun" />
            )}
          </Link>
        )}
      </div>

      {/* ===================== TAB CONTENTS ===================== */}

      {/* TAB 1: RINGKASAN 360° (Default Landing Tab) */}
      {effectiveTab === "ringkasan" && (
        <EmployeeOverviewTab
          employee={employee}
          attendanceOverview={attendanceOverview}
          activeAssetsCount={activeAssets.length}
          isHrOrAdmin={isHrOrAdmin}
        />
      )}

      {/* TAB 2: BIODATA & RIWAYAT TERPADU (Multi-Table Relasional) */}
      {effectiveTab === "biodata" && (
        <EmployeeBiodataTab employee={employee} />
      )}

      {/* TAB 3: ABSENSI & CUTI */}
      {effectiveTab === "absensi" && (
        <EmployeeAttendanceTab
          employeeId={employee.id}
          employeeName={employee.fullName}
          initialData={attendanceOverview}
        />
      )}

      {/* TAB 4: KONTRAK KERJA & KOMPENSASI */}
      {effectiveTab === "kontrak" && (
        <div className="flex flex-col gap-6 w-full min-w-0">
          {/* Kartu Ringkasan Struktur Kompensasi (Khusus HR / Admin) */}
          {isHrOrAdmin && (
            <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex flex-col gap-4">
              <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-[#102E50]" />
                  <div>
                    <h3 className="font-bold text-sm text-[#102E50] font-heading">
                      Struktur Kompensasi & Paket Penggajian Aktif
                    </h3>
                    <p className="text-xs text-slate-500">
                      Rincian gaji pokok dan tunjangan bulanan resmi yang melekat pada kontrak kerja
                      staf
                    </p>
                  </div>
                </div>
                <Link
                  href={`/karyawan/${employee.id}/ubah`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#102E50] bg-slate-100 hover:bg-slate-200/80 transition-colors"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Ubah Kompensasi</span>
                </Link>
              </div>

              {(() => {
                const baseSalary =
                  activeContract?.wageType === "HOURLY"
                    ? 0
                    : activeContract?.baseSalary
                      ? Number(activeContract.baseSalary)
                      : 0;
                const hourlyRate =
                  activeContract?.wageType === "HOURLY" && activeContract?.hourlyRate
                    ? Number(activeContract.hourlyRate)
                    : null;
                const allowances = employee.salaryComponents || [];
                const totalAllowances = allowances.reduce((acc, c) => acc + c.amount, 0);
                const totalGrossCash = baseSalary + totalAllowances;
                const estBpjsKes = Math.round(baseSalary * 0.01);
                const estBpjsTk = Math.round(baseSalary * 0.02);

                return (
                  <div className="flex flex-col gap-4">
                    {/* Ringkasan Angka Utama */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          {activeContract?.wageType === "HOURLY"
                            ? "Tarif Upah Per Jam"
                            : "Gaji Pokok Bulanan"}
                        </span>
                        <div className="mt-2">
                          <span className="text-lg font-bold font-mono text-[#102E50]">
                            {activeContract?.wageType === "HOURLY"
                              ? `${formatRupiah(hourlyRate || 0)} / jam`
                              : formatRupiah(baseSalary)}
                          </span>
                          <span className="text-[11px] text-slate-500 block mt-0.5">
                            {activeContract?.wageType === "HOURLY"
                              ? "Berbasis timesheet kehadiran disetujui"
                              : "Gaji pokok kontrak kerja aktif"}
                          </span>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/80 flex flex-col justify-between">
                        <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                          Total Tunjangan Bulanan
                        </span>
                        <div className="mt-2">
                          <span className="text-lg font-bold font-mono text-emerald-700">
                            + {formatRupiah(totalAllowances)}
                          </span>
                          <span className="text-[11px] text-emerald-600 block mt-0.5">
                            {allowances.length > 0
                              ? `${allowances.length} komponen tunjangan aktif`
                              : "Tanpa tunjangan tambahan"}
                          </span>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-sky-50/70 border border-sky-200/80 flex flex-col justify-between">
                        <span className="text-[11px] font-bold text-sky-800 uppercase tracking-wider">
                          Estimasi Penghasilan Bruto Tunai
                        </span>
                        <div className="mt-2">
                          <span className="text-lg font-bold font-mono text-sky-900">
                            {formatRupiah(totalGrossCash)}
                          </span>
                          <span className="text-[11px] text-sky-700 block mt-0.5">
                            Gaji Pokok + Total Tunjangan
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Breakdown Tunjangan & Potongan BPJS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      {/* Daftar Tunjangan */}
                      <div className="p-3.5 rounded-xl border border-slate-200/80 bg-white flex flex-col gap-2">
                        <span className="font-bold text-[#102E50] text-xs pb-1.5 border-b border-slate-100 flex items-center justify-between">
                          <span>Rincian Komponen Tunjangan</span>
                          <span className="text-[11px] font-normal text-slate-400">
                            {allowances.length} Item
                          </span>
                        </span>
                        {allowances.length === 0 ? (
                          <div className="py-4 text-center text-slate-400 italic">
                            Pegawai ini tidak memiliki komponen tunjangan khusus.
                          </div>
                        ) : (
                          <div className="divide-y divide-slate-100">
                            {allowances.map((item) => (
                              <div
                                key={item.id}
                                className="py-2 flex items-center justify-between text-xs"
                              >
                                <div>
                                  <span className="font-semibold text-slate-800 block">
                                    {item.name}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    {item.code}
                                  </span>
                                </div>
                                <span className="font-mono font-bold text-emerald-700">
                                  {formatRupiah(item.amount)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Estimasi Potongan & Metadata Perpajakan */}
                      <div className="p-3.5 rounded-xl border border-slate-200/80 bg-white flex flex-col gap-2.5">
                        <span className="font-bold text-[#102E50] text-xs pb-1.5 border-b border-slate-100">
                          Estimasi Iuran BPJS & Perpajakan (PP 58/2023)
                        </span>

                        <div className="space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-600">Iuran BPJS Kesehatan Pegawai (1%):</span>
                            <span className="font-mono font-semibold text-rose-600">
                              - {formatRupiah(estBpjsKes)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-600">
                              Iuran BPJS Ketenagakerjaan Pegawai (2%):
                            </span>
                            <span className="font-mono font-semibold text-rose-600">
                              - {formatRupiah(estBpjsTk)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                            <span className="text-slate-600">Status PTKP & Kategori TER:</span>
                            <span className="font-semibold text-slate-800">
                              {employee.ptkpStatus ? employee.ptkpStatus.replace("_", "/") : "TK/0"}{" "}
                              ({getPtkpExplanation(employee.ptkpStatus)?.terCategory || "TER A"})
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-600">Metode Pemotongan Pajak:</span>
                            <span className="font-semibold text-[#102E50]">
                              {employee.taxMethod || "GROSS"}
                            </span>
                          </div>
                        </div>

                        <div className="mt-auto p-2 bg-slate-50 rounded-lg text-[10.5px] text-slate-500 italic border border-slate-100">
                          * Pajak PPh 21 dihitung otomatis setiap periode payroll berdasarkan status
                          PTKP & aturan TER (PP 58/2023).
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Tabel Riwayat Kontrak Kerja */}
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
        </div>
      )}

      {/* TAB 5: JABATAN & TIM */}
      {effectiveTab === "jabatan" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full min-w-0">
          {/* Card Atasan & Bawahan */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-4 sm:p-5 shadow-xs flex flex-col gap-4 w-full min-w-0">
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

      {/* TAB 6: DOKUMEN & BERKAS DIGITAL (Dengan Checklist Wajib 7 Berkas) */}
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

      {/* TAB 8: DATA SENSITIF & PAJAK (Khusus HR / Admin) */}
      {isHrOrAdmin && effectiveTab === "sensitif" && (
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 sm:p-6 shadow-xs flex flex-col gap-5 w-full min-w-0">
          <div className="flex flex-col min-w-0">
            <h3 className="font-bold text-base text-[#102E50] font-heading break-words">
              Data Pribadi Sensitif & Payroll Perbankan
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 break-words">
              Nilai di bawah ini dilindungi enkripsi AES-256-GCM. Pembukaan data akan tercatat di
              sistem audit trail.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 pt-2 w-full min-w-0">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col gap-2 w-full min-w-0">
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

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col gap-2 w-full min-w-0">
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

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col gap-2 w-full min-w-0">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Bank Payroll Lembaga
              </span>
              <span className="font-semibold text-sm text-slate-900 truncate">
                {employee.bankName || "Bank Mandiri"}
              </span>
              <span className="text-[11px] text-slate-500 truncate">
                Pemilik: {employee.bankAccountName || employee.fullName}
              </span>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col gap-2 w-full min-w-0">
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

            {/* Status Perpajakan PPh 21 */}
            {(() => {
              const ptkpInfo = getPtkpExplanation(employee.ptkpStatus);
              const taxMethodInfo = getTaxMethodExplanation(employee.taxMethod);

              return (
                <>
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col gap-2.5 w-full min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                        <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                          Status PTKP (PP 58/2023)
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border ${ptkpInfo.terBadgeClass}`}
                      >
                        {ptkpInfo.terCategory}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 pt-0.5">
                      <PtkpBadge status={employee.ptkpStatus} size="md" />
                    </div>
                    <div className="text-[11px] text-slate-600 space-y-1.5 bg-white p-3 rounded-lg border border-slate-200/60 leading-relaxed">
                      <div className="font-semibold text-slate-800">
                        {ptkpInfo.annualPtkp}{" "}
                        <span className="text-slate-500 font-normal">
                          ({ptkpInfo.monthlyPtkp})
                        </span>
                      </div>
                      <div className="text-emerald-700 font-medium">
                        {ptkpInfo.zeroTaxLimit}
                      </div>
                      <div className="text-slate-500 text-[10.5px]">
                        {ptkpInfo.calculationDetail}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col gap-2.5 w-full min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Receipt className="w-3.5 h-3.5 text-[#102E50] shrink-0" />
                        <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                          Metode Perhitungan Pajak
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border ${taxMethodInfo.badgeClass}`}
                      >
                        {taxMethodInfo.badge}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 pt-0.5">
                      <TaxMethodBadge method={employee.taxMethod} size="md" />
                    </div>
                    <div className="text-[11px] text-slate-600 space-y-1.5 bg-white p-3 rounded-lg border border-slate-200/60 leading-relaxed">
                      <div className="font-semibold text-slate-800">
                        {taxMethodInfo.title}
                      </div>
                      <div className="text-slate-500 text-[10.5px]">
                        {taxMethodInfo.howItWorks}
                      </div>
                      <div className="text-[10.5px] text-slate-600 font-medium bg-slate-50 p-1.5 rounded border border-slate-100">
                        Dampak THP: {taxMethodInfo.employeeImpact}
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* TAB 9: AKUN & HAK AKSES (Khusus HR / Admin) */}
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
    </div>
  );
}
