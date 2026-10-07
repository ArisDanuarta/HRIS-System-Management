import React from "react";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ArrowLeft, FileSpreadsheet, ShieldCheck } from "lucide-react";
import { getSession, getUserProfile } from "@pspk/auth";
import { prisma } from "@pspk/db";
import { ExcelImporter } from "@/components/karyawan/excel-importer";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Impor Massal Data Pegawai — HRIS PSPK",
  description:
    "Unggah berkas spreadsheet Excel (.xlsx) untuk mendaftarkan data pegawai secara massal",
};

export default async function ImporKaryawanPage() {
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

  // Ambil referensi master data terkini untuk sheet panduan & opsi template
  const [departments, rawEmploymentTypes] = await Promise.all([
    prisma.department.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        positions: {
          orderBy: { title: "asc" },
          select: { id: true, title: true },
        },
      },
    }),
    prisma.employmentTypeMaster.findMany({
      where: { isActive: true },
      orderBy: [{ category: "asc" }, { name: "asc" }],
      select: {
        id: true,
        code: true,
        name: true,
        category: true,
        wageType: true,
        defaultHourlyRate: true,
      },
    }),
  ]);

  const employmentTypes = rawEmploymentTypes.map((et) => ({
    id: et.id,
    code: et.code,
    name: et.name,
    category: et.category,
    wageType: et.wageType,
    defaultHourlyRate: et.defaultHourlyRate ? Number(et.defaultHourlyRate) : null,
  }));

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

      {/* Page Title & Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#102E50]/10 text-[#102E50] flex items-center justify-center shrink-0">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#102E50] font-heading tracking-tight">
                Impor Massal Data Pegawai
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#feba48]/20 text-[#805600] border border-[#feba48]/30">
                Excel .xlsx
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Gunakan berkas format resmi Microsoft Excel (.xlsx) untuk mendaftarkan banyak pegawai
              secara otomatis ke dalam database HRIS PSPK.
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium self-start sm:self-center">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Validasi Otomatis Sebelum Simpan</span>
        </div>
      </div>

      {/* Main Interactive Importer Component with Template Downloads & Guidance */}
      <ExcelImporter departments={departments} employmentTypes={employmentTypes} />
    </div>
  );
}
