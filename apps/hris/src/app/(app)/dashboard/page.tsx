import React from "react";
import Link from "next/link";
import {
  Users,
  Upload,
  UserPlus,
  Building2,
  Clock,
  ArrowRight,
  AlertTriangle,
  Download,
  ShieldCheck,
} from "lucide-react";
import { prisma } from "@pspk/db";
import { StatusBadge } from "@/components/karyawan/status-badge";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  // Fetch live stats and data from PostgreSQL
  const [
    activeEmployeeCount,
    probationCount,
    expiringContracts,
    departments,
    recentEmployees,
  ] = await Promise.all([
    prisma.employee.count({
      where: { status: "ACTIVE", deletedAt: null },
    }),
    prisma.employee.count({
      where: { status: "PROBATION", deletedAt: null },
    }),
    prisma.employmentContract.findMany({
      where: {
        status: "ACTIVE",
        endDate: {
          lte: thirtyDaysFromNow,
          gte: new Date(),
        },
      },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            employeeNo: true,
            currentPosition: { select: { title: true } },
            currentDepartment: { select: { name: true } },
          },
        },
      },
      take: 5,
    }),
    prisma.department.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            employees: { where: { status: "ACTIVE", deletedAt: null } },
          },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.employee.findMany({
      where: { deletedAt: null },
      include: {
        currentDepartment: { select: { name: true } },
        currentPosition: { select: { title: true } },
        contracts: {
          where: { status: "ACTIVE" },
          take: 1,
          orderBy: { startDate: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-300 pb-12 max-w-[1440px] mx-auto">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-[#dee9fc]">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#74777f] mb-1">
            <span>Portal HRIS Lembaga</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#f2af3e]"></span>
            <span>Tahun Operasional 2026</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl text-[#102e50] font-serif font-bold tracking-tight">
            Dashboard Eksekutif HR
          </h1>
          <p className="text-xs sm:text-sm text-[#5b6675] mt-1 max-w-2xl">
            Pusat pemantauan data kepegawaian, distribusi riset, dan administrasi operasional PSPK.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/karyawan/impor"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-[#dee9fc] text-[#102e50] hover:bg-[#eff4ff] text-xs sm:text-sm font-semibold transition-all shadow-xs cursor-pointer active:scale-[0.98]"
          >
            <Upload className="w-4 h-4 text-[#102e50]" />
            <span>Impor Data Excel</span>
          </Link>
          <Link
            href="/karyawan/baru"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#102e50] text-white hover:bg-[#0c233d] text-xs sm:text-sm font-semibold transition-all shadow-sm hover:shadow-md cursor-pointer active:scale-[0.98]"
          >
            <UserPlus className="w-4 h-4 text-[#ffddb0]" />
            <span>+ Tambah Pegawai Baru</span>
          </Link>
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Pegawai Aktif */}
        <div className="bg-white p-5 rounded-xl border border-[#dee9fc] shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-medium text-[#5b6675]">Pegawai Aktif</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl sm:text-4xl font-bold text-[#102e50] font-heading leading-none">
                  {activeEmployeeCount}
                </span>
                <span className="text-xs font-medium text-[#5b6675]">Orang</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#eff4ff] text-[#102e50] flex items-center justify-center">
              <Users className="w-5 h-5 text-[#102e50]" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#dee9fc] flex items-center justify-between text-xs">
            <span className="text-emerald-700 font-semibold">Aktif Bekerja</span>
            <Link
              href="/karyawan"
              className="text-[#102e50] font-bold hover:underline flex items-center gap-1"
            >
              <span>Direktori</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Card 2: Masa Percobaan (Probation) */}
        <div className="bg-white p-5 rounded-xl border border-[#dee9fc] shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-medium text-[#5b6675]">Masa Percobaan</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl sm:text-4xl font-bold text-amber-600 font-heading leading-none">
                  {probationCount}
                </span>
                <span className="text-xs font-medium text-[#5b6675]">Pegawai</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-700" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#dee9fc] flex items-center justify-between text-xs">
            <span className="text-[#805600] font-medium">Evaluasi Kinerja</span>
            <Link
              href="/karyawan?status=PROBATION"
              className="text-amber-700 font-bold hover:underline flex items-center gap-1"
            >
              <span>Filter</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Card 3: Kontrak Segera Berakhir */}
        <div className="bg-white p-5 rounded-xl border border-[#dee9fc] shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-medium text-[#5b6675]">Kontrak ≤ 30 Hari</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl sm:text-4xl font-bold text-[#ba1a1a] font-heading leading-none">
                  {expiringContracts.length}
                </span>
                <span className="text-xs font-medium text-[#5b6675]">Kontrak</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-red-50 text-[#ba1a1a] flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-[#ba1a1a]" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#dee9fc] flex items-center justify-between text-xs">
            <span className="text-[#ba1a1a] font-semibold">Perlu Pembaharuan</span>
            <Link
              href="/karyawan?expiring=true"
              className="text-[#ba1a1a] font-bold hover:underline flex items-center gap-1"
            >
              <span>Tinjau</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Card 4: Divisi & Unit Kerja */}
        <div className="bg-white p-5 rounded-xl border border-[#dee9fc] shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-medium text-[#5b6675]">Unit Kerja / Divisi</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl sm:text-4xl font-bold text-[#102e50] font-heading leading-none">
                  {departments.length}
                </span>
                <span className="text-xs font-medium text-[#5b6675]">Divisi</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#eff4ff] text-[#102e50] flex items-center justify-center">
              <Building2 className="w-5 h-5 text-[#102e50]" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#dee9fc] flex items-center justify-between text-xs">
            <span className="text-[#5b6675]">PSPK Pusat & Regional</span>
            <span className="px-2 py-0.5 rounded bg-[#eff4ff] text-[#102e50] font-bold text-[10px]">
              Organisasi
            </span>
          </div>
        </div>
      </div>

      {/* Expiring Contracts Alert (If any) */}
      {expiringContracts.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-950">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 text-amber-800">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-900">
                Perhatian: {expiringContracts.length} Kontrak Kerja Karyawan Berakhir dalam ≤ 30 Hari
              </p>
              <p className="text-[11px] text-amber-800">
                Termasuk {expiringContracts.map((c) => c.employee.fullName).join(", ")}. Segera
                lakukan peninjauan perpanjangan atau evaluasi masa kerja.
              </p>
            </div>
          </div>
          <Link
            href="/karyawan?expiring=true"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#102E50] text-white text-xs font-semibold hover:bg-[#0c233d] transition-all shrink-0 cursor-pointer shadow-xs"
          >
            <span>Tinjau di Direktori</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Main Grid: Recent Employees (Left) & Organizational Breakdown / Quick Tools (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Registered Employees (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#dee9fc] shadow-xs flex flex-col overflow-hidden">
          <div className="p-5 border-b border-[#dee9fc] flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#102e50] font-heading">
                Pegawai Baru Terdaftar
              </h2>
              <p className="text-xs text-[#5b6675] mt-0.5">
                5 pegawai terakhir yang didaftarkan ke sistem kepegawaian PSPK
              </p>
            </div>
            <Link
              href="/karyawan"
              className="text-xs font-semibold text-[#102e50] hover:text-[#f2af3e] flex items-center gap-1 transition-colors"
            >
              <span>Lihat Semua</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 overflow-x-auto">
            {recentEmployees.map((emp) => {
              const activeContract = emp.contracts[0];
              const initials = emp.fullName
                ? emp.fullName
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()
                : "U";

              return (
                <div
                  key={emp.id}
                  className="p-4 flex items-center justify-between gap-4 hover:bg-[#f8f9ff] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-[#102e50] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                      {initials}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/karyawan/${emp.id}`}
                          className="font-semibold text-xs text-[#102e50] hover:underline truncate"
                        >
                          {emp.fullName}
                        </Link>
                        <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {emp.employeeNo}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5 truncate">
                        <span>{emp.currentPosition?.title || "Staff"}</span>
                        <span>•</span>
                        <span>{emp.currentDepartment?.name || "PSPK"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <StatusBadge status={emp.status} size="sm" />
                    {activeContract && (
                      <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {activeContract.type}
                      </span>
                    )}
                    <Link
                      href={`/karyawan/${emp.id}`}
                      className="text-xs font-semibold text-[#102e50] hover:underline"
                    >
                      Detail
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 bg-[#f8f9ff] border-t border-[#dee9fc] text-center">
            <Link
              href="/karyawan"
              className="text-xs font-semibold text-[#102e50] hover:underline inline-flex items-center gap-1.5"
            >
              <span>Buka Direktori Lengkap ({activeEmployeeCount} Pegawai Terdaftar)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Right Column: Department Breakdown & Quick Tools (1 col) */}
        <div className="flex flex-col gap-6">
          {/* Department Breakdown Card */}
          <div className="bg-white rounded-xl border border-[#dee9fc] shadow-xs p-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#dee9fc] mb-4">
              <h2 className="text-sm font-bold text-[#102e50] font-heading">
                Distribusi per Divisi
              </h2>
              <span className="text-[11px] text-slate-500 font-medium">Pegawai Aktif</span>
            </div>

            <div className="flex flex-col gap-3">
              {departments.map((dept) => {
                const count = dept._count.employees;
                const percentage =
                  activeEmployeeCount > 0 ? Math.round((count / activeEmployeeCount) * 100) : 0;

                return (
                  <div key={dept.id} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700 truncate pr-2">
                        {dept.name}
                      </span>
                      <span className="font-bold text-[#102e50] shrink-0">
                        {count} <span className="text-[10px] text-slate-400 font-normal">({percentage}%)</span>
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#102e50] rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(percentage, 5)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Institutional Guidelines Card */}
          <div className="bg-[#eff4ff] rounded-xl border border-[#dee9fc] p-5 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-[#102e50]">
              <ShieldCheck className="w-5 h-5 text-[#f2af3e]" />
              <h3 className="text-xs font-bold uppercase tracking-wider">
                Panduan Tata Kelola SDM
              </h3>
            </div>
            <p className="text-xs text-[#5b6675] leading-relaxed">
              Seluruh data NIK, NPWP, dan rekening staf dienkripsi secara otomatis menggunakan AES-256-GCM.
              Setiap pembukaan data sensitif akan tercatat dalam audit log sistem.
            </p>
            <div className="pt-2 border-t border-[#dee9fc] flex items-center justify-between">
              <Link
                href="/karyawan/impor"
                className="text-xs font-bold text-[#102e50] hover:underline inline-flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Template Excel</span>
              </Link>
              <Link
                href="/karyawan"
                className="text-xs font-bold text-[#805600] hover:underline inline-flex items-center gap-1"
              >
                <span>Kelola Pegawai</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
