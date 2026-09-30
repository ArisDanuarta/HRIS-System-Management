import { prisma, Prisma } from "@pspk/db";
import { AuthContext, assertCan } from "@pspk/rbac";
import { decryptField } from "@pspk/shared";
import { getPayrollSettings } from "./payroll-settings.queries";

export interface MyPayslipsFilter {
  year?: number;
  kind?: string;
}

export interface MyPayslipListItem {
  id: string;
  periodId: string;
  year: number;
  month: number;
  kind: "REGULAR" | "THR";
  grossAmount: number;
  totalDeduction: number;
  netAmount: number;
  status: string;
  wageType: string;
  totalHours: number | null;
  hourlyRate: number | null;
  publishedAt: string | null;
}

export interface MyPayslipsSummary {
  payslips: MyPayslipListItem[];
  latestPayslip: MyPayslipListItem | null;
  ytdTotalNet: number;
  totalCount: number;
  availableYears: number[];
}

export interface MyPayslipDetail {
  id: string;
  periodId: string;
  year: number;
  month: number;
  kind: "REGULAR" | "THR";
  status: string;
  publishedAt: string | null;
  grossAmount: number;
  totalDeduction: number;
  netAmount: number;
  wageType: string;
  totalHours: number | null;
  hourlyRate: number | null;
  employee: {
    id: string;
    employeeNo: string;
    fullName: string;
    nickname: string | null;
    workEmail: string;
    departmentName: string;
    positionTitle: string;
    bankName: string | null;
    bankAccountMasked: string;
    contractType: string | null;
  };
  earnings: {
    id: string;
    label: string;
    amount: number;
  }[];
  deductions: {
    id: string;
    label: string;
    amount: number;
  }[];
  institutionSettings?: {
    institutionName: string;
    subHeader: string;
    addressLine: string | null;
    logoUrl: string | null;
    headerBannerUrl: string | null;
    borderStyle: string;
    disclaimerText: string;
    senderBankName: string;
    senderAccountMasked: string;
    senderAccountName: string;
    authorizedSignerName: string | null;
    authorizedSignerTitle: string | null;
    signatureUrl: string | null;
    stampUrl: string | null;
  };
}

/**
 * Mengambil daftar seluruh slip gaji milik staf yang berstatus PUBLISHED atau LOCKED
 */
export async function getMyPayslips(
  ctx: AuthContext,
  filter?: MyPayslipsFilter,
): Promise<MyPayslipsSummary> {
  assertCan(ctx, "hris.payslip.read:own", { ownerEmployeeId: ctx.employeeId });

  if (!ctx.employeeId) {
    throw new Error("Profil karyawan tidak ditemukan untuk akun ini.");
  }

  const employeeId = ctx.employeeId;
  const currentYear = new Date().getFullYear();

  const where: Prisma.PayslipWhereInput = {
    employeeId,
    status: { in: ["PUBLISHED", "LOCKED"] },
  };

  if (filter?.year && filter.year > 0) {
    where.period = { year: filter.year };
  }

  if (filter?.kind && filter.kind !== "ALL") {
    where.period = {
      ...(where.period ? (where.period as Prisma.PayrollPeriodWhereInput) : {}),
      kind: filter.kind as Prisma.EnumPayrollKindFilter,
    };
  }

  // Ambil seluruh slip gaji terbit milik user
  const allPublishedPayslips = await prisma.payslip.findMany({
    where: {
      employeeId,
      status: { in: ["PUBLISHED", "LOCKED"] },
    },
    include: {
      period: true,
    },
    orderBy: [
      { period: { year: "desc" } },
      { period: { month: "desc" } },
      { createdAt: "desc" },
    ],
  });

  // Ekstrak daftar tahun unik untuk filter
  const yearSet = new Set<number>();
  allPublishedPayslips.forEach((p) => yearSet.add(p.period.year));
  if (!yearSet.has(currentYear)) {
    yearSet.add(currentYear);
  }
  const availableYears = Array.from(yearSet).sort((a, b) => b - a);

  // Ambil slip hasil filter
  const filteredPayslips = await prisma.payslip.findMany({
    where,
    include: {
      period: true,
    },
    orderBy: [
      { period: { year: "desc" } },
      { period: { month: "desc" } },
      { createdAt: "desc" },
    ],
  });

  const formattedPayslips: MyPayslipListItem[] = filteredPayslips.map((p) => ({
    id: p.id,
    periodId: p.periodId,
    year: p.period.year,
    month: p.period.month,
    kind: p.period.kind,
    grossAmount: Number(p.grossAmount),
    totalDeduction: Number(p.totalDeduction),
    netAmount: Number(p.netAmount),
    status: p.status,
    wageType: p.wageType,
    totalHours: p.totalHours ? Number(p.totalHours) : null,
    hourlyRate: p.hourlyRate ? Number(p.hourlyRate) : null,
    publishedAt: p.publishedAt ? p.publishedAt.toISOString() : null,
  }));

  // Hitung akumulasi YTD (Tahun Berjalan) dari seluruh slip published
  const ytdTotalNet = allPublishedPayslips
    .filter((p) => p.period.year === currentYear)
    .reduce((sum, curr) => sum + Number(curr.netAmount), 0);

  const latestPayslip = allPublishedPayslips[0]
    ? {
        id: allPublishedPayslips[0].id,
        periodId: allPublishedPayslips[0].periodId,
        year: allPublishedPayslips[0].period.year,
        month: allPublishedPayslips[0].period.month,
        kind: allPublishedPayslips[0].period.kind,
        grossAmount: Number(allPublishedPayslips[0].grossAmount),
        totalDeduction: Number(allPublishedPayslips[0].totalDeduction),
        netAmount: Number(allPublishedPayslips[0].netAmount),
        status: allPublishedPayslips[0].status,
        wageType: allPublishedPayslips[0].wageType,
        totalHours: allPublishedPayslips[0].totalHours
          ? Number(allPublishedPayslips[0].totalHours)
          : null,
        hourlyRate: allPublishedPayslips[0].hourlyRate
          ? Number(allPublishedPayslips[0].hourlyRate)
          : null,
        publishedAt: allPublishedPayslips[0].publishedAt
          ? allPublishedPayslips[0].publishedAt.toISOString()
          : null,
      }
    : null;

  return {
    payslips: formattedPayslips,
    latestPayslip,
    ytdTotalNet,
    totalCount: allPublishedPayslips.length,
    availableYears,
  };
}

/**
 * Mengambil rincian lengkap satu slip gaji milik staf (termasuk item pendapatan & potongan)
 */
export async function getMyPayslipDetail(
  ctx: AuthContext,
  payslipId: string,
): Promise<MyPayslipDetail | null> {
  assertCan(ctx, "hris.payslip.read:own", { ownerEmployeeId: ctx.employeeId });

  if (!ctx.employeeId) {
    throw new Error("Profil karyawan tidak ditemukan untuk akun ini.");
  }

  const p = await prisma.payslip.findFirst({
    where: {
      id: payslipId,
      employeeId: ctx.employeeId,
      status: { in: ["PUBLISHED", "LOCKED"] },
    },
    include: {
      period: true,
      employee: {
        select: {
          id: true,
          employeeNo: true,
          fullName: true,
          nickname: true,
          workEmail: true,
          bankName: true,
          bankAccountEnc: true,
          currentDepartment: { select: { id: true, name: true } },
          currentPosition: { select: { id: true, title: true } },
          contracts: {
            where: { status: "ACTIVE" },
            take: 1,
            select: { type: true },
          },
        },
      },
      lines: {
        orderBy: [{ type: "asc" }, { amount: "desc" }],
      },
    },
  });

  if (!p) return null;

  const setting = await getPayrollSettings().catch(() => null);

  // Masking nomor rekening: tampilkan hanya 4 digit terakhir
  let bankAccountMasked = "-";
  if (p.employee.bankAccountEnc) {
    try {
      const decrypted = decryptField(p.employee.bankAccountEnc);
      if (decrypted.length > 4) {
        bankAccountMasked = `•••• ${decrypted.slice(-4)}`;
      } else {
        bankAccountMasked = decrypted;
      }
    } catch {
      bankAccountMasked = "[Tersimpan Terenkripsi]";
    }
  }

  const earnings = p.lines
    .filter((l) => l.type === "EARNING")
    .map((l) => ({
      id: l.id,
      label: l.label,
      amount: Number(l.amount),
    }));

  const deductions = p.lines
    .filter((l) => l.type === "DEDUCTION")
    .map((l) => ({
      id: l.id,
      label: l.label,
      amount: Number(l.amount),
    }));

  return {
    id: p.id,
    periodId: p.periodId,
    year: p.period.year,
    month: p.period.month,
    kind: p.period.kind,
    status: p.status,
    publishedAt: p.publishedAt ? p.publishedAt.toISOString() : null,
    grossAmount: Number(p.grossAmount),
    totalDeduction: Number(p.totalDeduction),
    netAmount: Number(p.netAmount),
    wageType: p.wageType,
    totalHours: p.totalHours ? Number(p.totalHours) : null,
    hourlyRate: p.hourlyRate ? Number(p.hourlyRate) : null,
    employee: {
      id: p.employee.id,
      employeeNo: p.employee.employeeNo,
      fullName: p.employee.fullName,
      nickname: p.employee.nickname,
      workEmail: p.employee.workEmail,
      departmentName: p.employee.currentDepartment?.name || "Unit Riset / Staf",
      positionTitle: p.employee.currentPosition?.title || "Pegawai",
      bankName: p.employee.bankName || "Bank Transfer",
      bankAccountMasked,
      contractType: p.employee.contracts[0]?.type || null,
    },
    earnings,
    deductions,
    institutionSettings: {
      institutionName: setting?.institutionName || "Pusat Studi Pendidikan & Kebijakan",
      subHeader: setting?.subHeader || "HR & Finance Division • Sistem Penggajian Elektronik",
      addressLine: setting?.addressLine || null,
      logoUrl: setting?.logoUrl || null,
      headerBannerUrl: setting?.headerBannerUrl || null,
      borderStyle: setting?.borderStyle || "NAVY_SOLID",
      disclaimerText:
        setting?.disclaimerText ||
        "Dokumen ini diterbitkan secara elektronik oleh Divisi SDM & Keuangan Pusat Studi Pendidikan dan Kebijakan (PSPK). Sah tanpa tanda tangan basah.",
      senderBankName: setting?.senderBankName || "Bank Central Asia (BCA)",
      senderAccountName: setting?.senderAccountName || "Pusat Studi Pendidikan dan Kebijakan",
      senderAccountMasked: setting?.senderAccountMasked || "-",
      authorizedSignerName: setting?.authorizedSignerName || null,
      authorizedSignerTitle: setting?.authorizedSignerTitle || null,
      signatureUrl: setting?.signatureUrl || null,
      stampUrl: setting?.stampUrl || null,
    },
  };
}
