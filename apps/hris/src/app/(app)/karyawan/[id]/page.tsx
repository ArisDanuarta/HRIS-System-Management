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
    <div className="w-full min-w-0 max-w-6xl mx-auto pb-16 flex flex-col gap-4">
      {/* Top bar: Back link + action buttons */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Link
          href={isManager && !isHrOrAdmin ? "/karyawan?view=team" : "/karyawan"}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#102E50] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{isManager && !isHrOrAdmin ? "Kembali ke Tim Saya" : "Direktori Pegawai"}</span>
        </Link>

        {/* Action buttons - top right */}
        <div className="flex items-center gap-2 flex-wrap">
          {(isHrOrAdmin || isManager) && (
            <ExportProfileButton
              employeeId={employee.id}
              employeeName={employee.fullName}
              employeeNo={employee.employeeNo}
              isHrOrAdmin={isHrOrAdmin}
              isManager={isManager}
            />
          )}
          {isHrOrAdmin && (
            <EmployeeStatusActions
              employeeId={employee.id}
              employeeName={employee.fullName}
              employeeNo={employee.employeeNo}
              isTerminated={isTerminated}
              variant="header"
            />
          )}
          {isHrOrAdmin && (
            <Link
              href={`/karyawan/${employee.id}/ubah`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#102E50] text-white hover:bg-[#0c233d] transition-all cursor-pointer active:scale-[0.98]"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Ubah Profil</span>
            </Link>
          )}
        </div>
      </div>

      {/* Terminated alert */}
      {isTerminated && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900">
          <div className="flex items-center gap-2.5 min-w-0">
            <UserX className="w-4 h-4 text-amber-700 shrink-0" />
            <span className="text-xs font-semibold text-amber-800 break-words">
              Pegawai ini berstatus <strong>{employee.status}</strong> — akun login telah dinonaktifkan. Riwayat tetap tersimpan.
            </span>
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

      {/* ── Main two-column layout ─────────────────────────────── */}
      <div className="flex flex-col lg:flex-row gap-5 items-start w-full min-w-0">

        {/* ── LEFT COLUMN: Profile card + vertical nav ──────────── */}
        <aside className="w-full lg:w-64 xl:w-72 shrink-0 flex flex-col gap-3 lg:sticky lg:top-20">

          {/* Profile identity card */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {/* brand strip */}
            <div className="h-1.5 bg-gradient-to-r from-[#102E50] to-[#F2AF3E]" />

            <div className="p-4 flex flex-col items-center text-center gap-3">
              <EmployeeAvatar
                photoKey={employee.photoKey}
                name={employee.fullName}
                gender={employee.gender}
              />

              <div className="w-full min-w-0">
                <h1 className="text-sm font-bold text-[#102E50] font-heading break-words leading-tight">
                  {employee.fullName}
                  {employee.nickname && (
                    <span className="ml-1 text-[11px] text-slate-400 font-normal">
                      &ldquo;{employee.nickname}&rdquo;
                    </span>
                  )}
                </h1>
                <p className="text-[11px] text-slate-500 mt-0.5 break-words">
                  {employee.currentPosition?.title || "—"}{" "}
                  {employee.currentDepartment?.name && (
                    <span className="text-slate-400">· {employee.currentDepartment.name}</span>
                  )}
                </p>
              </div>

              {/* Quick badges */}
              <div className="flex flex-wrap justify-center gap-1.5 w-full">
                <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                  {employee.employeeNo}
                </span>
                <StatusBadge status={employee.status} size="sm" />
                {activeContract && (
                  <ContractTypeBadge
                    type={activeContract.type}
                    label={activeContract.employmentTypeMaster?.name}
                  />
                )}
              </div>

              {/* Quick contact */}
              <div className="w-full border-t border-slate-100 pt-3 flex flex-col gap-1.5 text-left">
                <a
                  href={`mailto:${employee.workEmail}`}
                  className="inline-flex items-center gap-2 text-[11px] text-slate-600 hover:text-[#102E50] transition-colors truncate cursor-pointer"
                >
                  <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="truncate">{employee.workEmail}</span>
                </a>
                {employee.phone && (
                  <a
                    href={`tel:${employee.phone}`}
                    className="inline-flex items-center gap-2 text-[11px] text-slate-600 hover:text-[#102E50] transition-colors truncate cursor-pointer"
                  >
                    <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{employee.phone}</span>
                  </a>
                )}
                {employee.manager && (
                  <Link
                    href={`/karyawan/${employee.manager.id}`}
                    className="inline-flex items-center gap-2 text-[11px] text-slate-600 hover:text-[#102E50] transition-colors truncate cursor-pointer"
                  >
                    <UserCheck className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">
                      <span className="text-slate-400">Atasan: </span>
                      {employee.manager.fullName}
                    </span>
                  </Link>
                )}
                <div className="inline-flex items-center gap-2 text-[11px] text-slate-500">
                  <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>Bergabung {formatDate(employee.joinDate)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Vertical navigation menu */}
          <nav className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-3 py-2 border-b border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Menu Profil</span>
            </div>
            <div className="p-1.5 flex flex-col gap-0.5">
              {/* Group: Utama */}
              {(
                [
                  { key: "ringkasan", icon: LayoutDashboard, label: "Ringkasan", iconColor: "text-[#102E50]" },
                  { key: "biodata", icon: User, label: "Biodata & Riwayat", iconColor: "text-slate-500" },
                  { key: "absensi", icon: Calendar, label: "Absensi & Cuti", iconColor: "text-emerald-600" },
                  { key: "kontrak", icon: FileText, label: "Kontrak & Kompensasi", iconColor: "text-slate-500", badge: employee.contracts.length },
                  { key: "jabatan", icon: Briefcase, label: "Jabatan & Tim", iconColor: "text-slate-500", badge: employee.histories.length > 0 ? employee.histories.length : undefined },
                  { key: "dokumen", icon: FolderArchive, label: "Dokumen Digital", iconColor: "text-[#102E50]", badge: employee.documents?.length || 0 },
                ] as Array<{ key: string; icon: React.ElementType; label: string; iconColor: string; badge?: number }>
              ).map(({ key, icon: Icon, label, iconColor, badge }) => (
                <Link
                  key={key}
                  href={`/karyawan/${employee.id}?tab=${key}`}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    effectiveTab === key
                      ? "bg-[#102E50]/8 text-[#102E50] font-semibold"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${effectiveTab === key ? "text-[#102E50]" : iconColor}`} />
                  <span className="flex-1 truncate">{label}</span>
                  {badge !== undefined && badge > 0 && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${effectiveTab === key ? "bg-[#102E50]/15 text-[#102E50]" : "bg-slate-100 text-slate-500"}`}>
                      {badge}
                    </span>
                  )}
                </Link>
              ))}

              {/* Aset (modular) */}
              {isAssetAssignmentActive && (
                <Link
                  href={`/karyawan/${employee.id}?tab=aset`}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    effectiveTab === "aset"
                      ? "bg-[#102E50]/8 text-[#102E50] font-semibold"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Laptop className={`w-3.5 h-3.5 shrink-0 ${effectiveTab === "aset" ? "text-[#102E50]" : "text-slate-500"}`} />
                  <span className="flex-1 truncate">Aset & Fasilitas</span>
                  {activeAssets.length > 0 && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${effectiveTab === "aset" ? "bg-[#102E50]/15 text-[#102E50]" : "bg-slate-100 text-slate-500"}`}>
                      {activeAssets.length}
                    </span>
                  )}
                </Link>
              )}

              {/* Divider + HR-only section */}
              {isHrOrAdmin && (
                <>
                  <div className="my-1 border-t border-slate-100 mx-1" />
                  <div className="px-3 py-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">HR & Admin</span>
                  </div>
                  <Link
                    href={`/karyawan/${employee.id}?tab=sensitif`}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      effectiveTab === "sensitif"
                        ? "bg-amber-50 text-amber-800 font-semibold"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <Shield className={`w-3.5 h-3.5 shrink-0 ${effectiveTab === "sensitif" ? "text-amber-600" : "text-amber-500"}`} />
                    <span className="flex-1 truncate">Data Sensitif & Pajak</span>
                  </Link>
                  <Link
                    href={`/karyawan/${employee.id}?tab=akun`}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      effectiveTab === "akun"
                        ? "bg-[#102E50]/8 text-[#102E50] font-semibold"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <KeyRound className={`w-3.5 h-3.5 shrink-0 ${effectiveTab === "akun" ? "text-[#F2AF3E]" : "text-[#F2AF3E]"}`} />
                    <span className="flex-1 truncate">Akun & Hak Akses</span>
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${employee.user ? "bg-emerald-500" : "bg-amber-400"}`} />
                  </Link>
                </>
              )}
            </div>
          </nav>
        </aside>

        {/* ── RIGHT COLUMN: Tab content panel ─────────────────── */}
        <main className="flex-1 min-w-0 w-full">

          {/* TAB 1: RINGKASAN */}
          {effectiveTab === "ringkasan" && (
            <EmployeeOverviewTab
              employee={employee}
              attendanceOverview={attendanceOverview}
              activeAssetsCount={activeAssets.length}
              isHrOrAdmin={isHrOrAdmin}
            />
          )}

          {/* TAB 2: BIODATA */}
          {effectiveTab === "biodata" && <EmployeeBiodataTab employee={employee} />}

          {/* TAB 3: ABSENSI */}
          {effectiveTab === "absensi" && (
            <EmployeeAttendanceTab
              employeeId={employee.id}
              employeeName={employee.fullName}
              initialData={attendanceOverview}
            />
          )}

          {/* TAB 4: KONTRAK & KOMPENSASI */}
          {effectiveTab === "kontrak" && (
            <div className="flex flex-col gap-5 w-full min-w-0">
              {isHrOrAdmin && (
                <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col gap-4">
                  <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Receipt className="w-4.5 h-4.5 text-[#102E50]" />
                      <div>
                        <h3 className="font-bold text-sm text-[#102E50] font-heading">
                          Struktur Kompensasi & Paket Penggajian
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          Rincian gaji pokok dan tunjangan bulanan resmi
                        </p>
                      </div>
                    </div>
                    <Link
                      href={`/karyawan/${employee.id}/ubah`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#102E50] bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
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
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              {activeContract?.wageType === "HOURLY" ? "Tarif Per Jam" : "Gaji Pokok"}
                            </span>
                            <span className="text-base font-bold font-mono text-[#102E50]">
                              {activeContract?.wageType === "HOURLY"
                                ? `${formatRupiah(hourlyRate || 0)}/jam`
                                : formatRupiah(baseSalary)}
                            </span>
                          </div>
                          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-col gap-1">
                            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Total Tunjangan</span>
                            <span className="text-base font-bold font-mono text-emerald-700">+ {formatRupiah(totalAllowances)}</span>
                            <span className="text-[10px] text-emerald-600">{allowances.length} komponen</span>
                          </div>
                          <div className="p-4 rounded-xl bg-sky-50 border border-sky-200 flex flex-col gap-1">
                            <span className="text-[10px] font-bold text-sky-700 uppercase tracking-wider">Bruto Tunai</span>
                            <span className="text-base font-bold font-mono text-sky-900">{formatRupiah(totalGrossCash)}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          <div className="p-3.5 rounded-xl border border-slate-200 bg-white flex flex-col gap-2">
                            <span className="font-bold text-[#102E50] text-xs pb-1.5 border-b border-slate-100 flex items-center justify-between">
                              <span>Rincian Tunjangan</span>
                              <span className="text-[11px] font-normal text-slate-400">{allowances.length} item</span>
                            </span>
                            {allowances.length === 0 ? (
                              <div className="py-3 text-center text-slate-400 italic">Tidak ada tunjangan tambahan</div>
                            ) : (
                              <div className="divide-y divide-slate-100">
                                {allowances.map((item) => (
                                  <div key={item.id} className="py-2 flex items-center justify-between">
                                    <div>
                                      <span className="font-semibold text-slate-800 block">{item.name}</span>
                                      <span className="text-[10px] text-slate-400 font-mono">{item.code}</span>
                                    </div>
                                    <span className="font-mono font-bold text-emerald-700">{formatRupiah(item.amount)}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="p-3.5 rounded-xl border border-slate-200 bg-white flex flex-col gap-2">
                            <span className="font-bold text-[#102E50] text-xs pb-1.5 border-b border-slate-100">
                              Estimasi Iuran & Pajak (PP 58/2023)
                            </span>
                            <div className="space-y-2 text-xs">
                              <div className="flex items-center justify-between">
                                <span className="text-slate-600">BPJS Kesehatan Pegawai (1%):</span>
                                <span className="font-mono font-semibold text-rose-600">- {formatRupiah(estBpjsKes)}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-slate-600">BPJS Ketenagakerjaan Pegawai (2%):</span>
                                <span className="font-mono font-semibold text-rose-600">- {formatRupiah(estBpjsTk)}</span>
                              </div>
                              <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                                <span className="text-slate-600">Status PTKP:</span>
                                <span className="font-semibold text-slate-800">
                                  {employee.ptkpStatus?.replace("_", "/") || "TK/0"} ({getPtkpExplanation(employee.ptkpStatus)?.terCategory || "TER A"})
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-slate-600">Metode Pajak:</span>
                                <span className="font-semibold text-[#102E50]">{employee.taxMethod || "GROSS"}</span>
                              </div>
                            </div>
                            <div className="mt-auto p-2 bg-slate-50 rounded-lg text-[10px] text-slate-500 italic border border-slate-100">
                              * PPh 21 dihitung otomatis per periode payroll berdasarkan TER PP 58/2023.
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full min-w-0">
              <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col gap-4">
                <h3 className="font-bold text-sm text-[#102E50] font-heading pb-2 border-b border-slate-100">
                  Hierarki Tim & Laporan Kerja
                </h3>
                <div className="flex flex-col gap-3 text-xs">
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
                    <UserCheck className="w-4 h-4 text-[#102E50] shrink-0 mt-0.5" />
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Atasan Langsung</span>
                      {employee.manager ? (
                        <div className="mt-1">
                          <Link href={`/karyawan/${employee.manager.id}`} className="font-bold text-slate-900 hover:text-[#102E50] hover:underline cursor-pointer">
                            {employee.manager.fullName}
                          </Link>
                          <span className="text-slate-500 block">{employee.manager.currentPosition?.title || employee.manager.employeeNo}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic mt-0.5">Tidak ada atasan (Direksi / Mandiri)</span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 mt-1">
                    <span className="font-bold text-xs text-slate-700">
                      Bawahan Langsung ({employee.directReports.length})
                    </span>
                    {employee.directReports.length === 0 ? (
                      <span className="text-slate-400 italic">Tidak ada bawahan langsung.</span>
                    ) : (
                      <div className="flex flex-col divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                        {employee.directReports.map((sub) => (
                          <div key={sub.id} className="p-2.5 bg-white hover:bg-slate-50 flex items-center justify-between">
                            <div className="flex flex-col">
                              <Link href={`/karyawan/${sub.id}`} className="font-semibold text-slate-800 hover:text-[#102E50] hover:underline cursor-pointer">
                                {sub.fullName}
                              </Link>
                              <span className="text-[11px] text-slate-400">{sub.currentPosition?.title || sub.employeeNo}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

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

          {/* TAB 6: DOKUMEN */}
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

          {/* TAB 7: ASET */}
          {isAssetAssignmentActive && effectiveTab === "aset" && (
            <EmployeeAssetsCard
              employeeName={employee.fullName}
              activeAssignments={activeAssets}
              returnedAssignments={returnedAssets}
              isHrOrAdmin={isHrOrAdmin}
            />
          )}

          {/* TAB 8: DATA SENSITIF (HR/Admin only) */}
          {isHrOrAdmin && effectiveTab === "sensitif" && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col gap-5 w-full min-w-0">
              <div>
                <h3 className="font-bold text-sm text-[#102E50] font-heading">
                  Data Pribadi Sensitif & Payroll Perbankan
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Dilindungi enkripsi AES-256-GCM. Pembukaan data tercatat di audit trail.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full min-w-0">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col gap-2">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">NIK</span>
                  <SensitiveFieldView
                    employeeId={employee.id}
                    field="nik"
                    fieldLabel="Nomor Induk Kependudukan (NIK)"
                    maskedValue={employee.nikMasked}
                    hasValue={employee.hasNik}
                  />
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col gap-2">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">NPWP</span>
                  <SensitiveFieldView
                    employeeId={employee.id}
                    field="npwp"
                    fieldLabel="Nomor Pokok Wajib Pajak (NPWP)"
                    maskedValue={employee.npwpMasked}
                    hasValue={employee.hasNpwp}
                  />
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col gap-2">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Bank Payroll</span>
                  <span className="font-semibold text-sm text-slate-900 truncate">{employee.bankName || "Bank Mandiri"}</span>
                  <span className="text-[11px] text-slate-500 truncate">Pemilik: {employee.bankAccountName || employee.fullName}</span>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col gap-2">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Nomor Rekening</span>
                  <SensitiveFieldView
                    employeeId={employee.id}
                    field="bankAccount"
                    fieldLabel="Nomor Rekening Bank"
                    maskedValue={employee.bankAccountMasked}
                    hasValue={employee.hasBankAccount}
                  />
                </div>

                {/* PPh 21 */}
                {(() => {
                  const ptkpInfo = getPtkpExplanation(employee.ptkpStatus);
                  const taxMethodInfo = getTaxMethodExplanation(employee.taxMethod);
                  return (
                    <>
                      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col gap-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Info className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Status PTKP</span>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${ptkpInfo.terBadgeClass}`}>
                            {ptkpInfo.terCategory}
                          </span>
                        </div>
                        <PtkpBadge status={employee.ptkpStatus} size="md" />
                        <div className="text-[11px] text-slate-600 space-y-1 bg-white p-3 rounded-lg border border-slate-200 leading-relaxed">
                          <div className="font-semibold text-slate-800">{ptkpInfo.annualPtkp} <span className="text-slate-500 font-normal">({ptkpInfo.monthlyPtkp})</span></div>
                          <div className="text-emerald-700 font-medium">{ptkpInfo.zeroTaxLimit}</div>
                          <div className="text-slate-500 text-[10.5px]">{ptkpInfo.calculationDetail}</div>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col gap-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Receipt className="w-3.5 h-3.5 text-[#102E50] shrink-0" />
                            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Metode Pajak</span>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${taxMethodInfo.badgeClass}`}>
                            {taxMethodInfo.badge}
                          </span>
                        </div>
                        <TaxMethodBadge method={employee.taxMethod} size="md" />
                        <div className="text-[11px] text-slate-600 space-y-1 bg-white p-3 rounded-lg border border-slate-200 leading-relaxed">
                          <div className="font-semibold text-slate-800">{taxMethodInfo.title}</div>
                          <div className="text-slate-500 text-[10.5px]">{taxMethodInfo.howItWorks}</div>
                          <div className="text-[10.5px] font-medium bg-slate-50 p-1.5 rounded border border-slate-100">
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

          {/* TAB 9: AKUN & HAK AKSES (HR/Admin only) */}
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
        </main>
      </div>
    </div>
  );
}
