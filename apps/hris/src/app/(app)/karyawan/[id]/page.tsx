import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate, formatRupiah } from "@pspk/shared";
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
} from "lucide-react";
import {
  getEmployeeById,
  getOrgStructureData,
  getManagersList,
} from "@/server/queries/employee.queries";
import { StatusBadge, ContractTypeBadge } from "@/components/karyawan/status-badge";
import { SensitiveFieldView } from "@/components/karyawan/sensitive-field-view";
import { CareerHistoryCard } from "@/components/karyawan/career-history-card";

export const dynamic = "force-dynamic";

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

  const [employee, departments, managers] = await Promise.all([
    getEmployeeById(id),
    getOrgStructureData(),
    getManagersList(),
  ]);

  if (!employee) {
    notFound();
  }

  const initial = employee.fullName.charAt(0).toUpperCase();

  const activeContract = employee.contracts.find((c) => c.status === "ACTIVE") || null;

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-16">
      {/* Back Link */}
      <Link
        href="/karyawan"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#102E50] transition-colors w-fit"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Kembali ke Direktori Pegawai</span>
      </Link>

      {/* Profile Header Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#102E50]/10 text-[#102E50] font-bold text-2xl flex items-center justify-center border border-[#102E50]/20 shadow-xs shrink-0">
            {initial}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-[#102E50] font-heading tracking-tight">
                {employee.fullName}
              </h1>
              {employee.nickname && (
                <span className="text-xs text-slate-400 font-medium">
                  (&ldquo;{employee.nickname}&rdquo;)
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-600 mt-1 flex-wrap">
              <span className="font-semibold text-slate-800">
                {employee.currentPosition?.title || "Belum ada jabatan"}
              </span>
              <span>•</span>
              <span>{employee.currentDepartment?.name || "Belum ada divisi"}</span>
            </div>

            <div className="flex items-center gap-2 mt-2.5 flex-wrap">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                NIP: {employee.employeeNo}
              </span>
              <StatusBadge status={employee.status} size="sm" />
              {activeContract && <ContractTypeBadge type={activeContract.type} />}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={`/karyawan/${employee.id}/ubah`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#102E50] text-white hover:bg-[#0c233d] transition-all cursor-pointer active:scale-[0.98] shadow-xs"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Ubah Profil</span>
          </Link>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto">
        <Link
          href={`/karyawan/${employee.id}?tab=biodata`}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
            tab === "biodata"
              ? "border-[#102E50] text-[#102E50] bg-white"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <User className="w-4 h-4" />
          <span>Biodata & Kontak</span>
        </Link>

        <Link
          href={`/karyawan/${employee.id}?tab=sensitif`}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
            tab === "sensitif"
              ? "border-[#102E50] text-[#102E50] bg-white"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Shield className="w-4 h-4 text-amber-600" />
          <span>Data Sensitif & Bank</span>
        </Link>

        <Link
          href={`/karyawan/${employee.id}?tab=kontrak`}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
            tab === "kontrak"
              ? "border-[#102E50] text-[#102E50] bg-white"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Kontrak Kerja ({employee.contracts.length})</span>
        </Link>

        <Link
          href={`/karyawan/${employee.id}?tab=jabatan`}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
            tab === "jabatan"
              ? "border-[#102E50] text-[#102E50] bg-white"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Jabatan & Tim</span>
        </Link>
      </div>

      {/* TAB 1: BIODATA & KONTAK */}
      {tab === "biodata" && (
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
                  {employee.gender === "MALE" ? "Laki-laki" : employee.gender === "FEMALE" ? "Perempuan" : "-"}
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
                  {employee.birthPlace || "-"}, {employee.birthDate ? formatDate(employee.birthDate) : "-"}
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
                <span className="font-medium text-slate-700 leading-relaxed">
                  {employee.address || "-"}
                </span>
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
                  <span className="font-semibold text-slate-800 truncate">{employee.workEmail}</span>
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

              <div className="p-3.5 bg-amber-50/60 border border-amber-200/60 rounded-lg flex flex-col gap-1">
                <span className="font-bold text-[#805600] text-xs">Kontak Darurat</span>
                <div className="flex justify-between items-center text-xs mt-1">
                  <span className="text-slate-600">
                    {employee.emergencyContactName || "Belum dicantumkan"}
                  </span>
                  <span className="font-mono font-bold text-slate-800">
                    {employee.emergencyContactPhone || "-"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DATA SENSITIF & BANK */}
      {tab === "sensitif" && (
        <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs flex flex-col gap-5">
          <div className="flex flex-col">
            <h3 className="font-bold text-base text-[#102E50] font-heading">
              Data Pribadi Sensitif & Payroll Perbankan
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Nilai di bawah ini dilindungi enkripsi AES-256-GCM. Pembukaan data akan tercatat di sistem audit trail.
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
      {tab === "kontrak" && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-[#102E50] font-heading">
                Riwayat Kontrak Kerja
              </h3>
              <p className="text-xs text-slate-500">
                Daftar perjanjian ikatan kerja, masa berlaku, dan nilai kompensasi pokok
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Tipe Kontrak</th>
                  <th className="py-3 px-4">Tanggal Mulai</th>
                  <th className="py-3 px-4">Tanggal Berakhir</th>
                  <th className="py-3 px-4">Gaji Pokok</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employee.contracts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                      Belum ada riwayat kontrak kerja
                    </td>
                  </tr>
                ) : (
                  employee.contracts.map((contract) => (
                    <tr key={contract.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-semibold">
                        <ContractTypeBadge type={contract.type} />
                      </td>
                      <td className="py-3 px-4 font-mono">{formatDate(contract.startDate)}</td>
                      <td className="py-3 px-4 font-mono">
                        {contract.endDate ? formatDate(contract.endDate) : "Tidak Terbatas (Tetap)"}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {contract.baseSalary ? formatRupiah(contract.baseSalary) : "-"}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            contract.status === "ACTIVE"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {contract.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                        {contract.notes || "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: JABATAN & TIM */}
      {tab === "jabatan" && (
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
            }}
            histories={employee.histories}
            departments={departments}
            managers={managers}
          />
        </div>
      )}
    </div>
  );
}
