import { prisma } from "@pspk/db";
import { decryptField } from "@pspk/shared";

export interface CalculatePayrollResult {
  totalProcessed: number;
  totalGross: number;
  totalDeduction: number;
  totalNet: number;
  skippedWithoutContract: string[];
}

/**
 * Logika Kalkulasi Payroll Massal untuk Satu Periode
 */
export async function calculatePeriodPayroll(periodId: string): Promise<CalculatePayrollResult> {
  const period = await prisma.payrollPeriod.findUnique({
    where: { id: periodId },
  });

  if (!period) {
    throw new Error("Periode penggajian tidak ditemukan.");
  }

  if (period.status === "LOCKED") {
    throw new Error("Periode penggajian telah dikunci (LOCKED) dan tidak dapat dihitung ulang.");
  }

  // 1. Ambil seluruh pegawai aktif beserta kontrak dan komponen khususnya
  const activeEmployees = await prisma.employee.findMany({
    where: {
      status: "ACTIVE",
      deletedAt: null,
    },
    include: {
      contracts: {
        where: { status: "ACTIVE" },
        orderBy: { startDate: "desc" },
        take: 1,
      },
      salaryComponents: {
        include: {
          component: true,
        },
      },
      currentDepartment: { select: { name: true } },
      currentPosition: { select: { title: true } },
    },
  });

  // 2. Ambil master komponen organisasi yang aktif
  const masterComponents = await prisma.salaryComponent.findMany({
    where: { isActive: true },
  });

  const skippedWithoutContract: string[] = [];
  let grandGross = 0;
  let grandDeduction = 0;
  let grandNet = 0;

  // Jalankan dalam Prisma Transaction
  await prisma.$transaction(async (tx) => {
    // Bersihkan slip lama pada periode ini (jika berstatus DRAFT atau CALCULATED)
    await tx.payslip.deleteMany({
      where: {
        periodId: period.id,
        status: { in: ["DRAFT", "CALCULATED"] },
      },
    });

    for (const emp of activeEmployees) {
      const activeContract = emp.contracts[0];
      const baseSalary = activeContract?.baseSalary ? Number(activeContract.baseSalary) : 0;

      if (!activeContract || baseSalary <= 0) {
        skippedWithoutContract.push(`${emp.fullName} (${emp.employeeNo})`);
      }

      // Kumpulkan komponen earnings & deductions
      const linesData: {
        componentId: string | null;
        label: string;
        type: "EARNING" | "DEDUCTION";
        amount: number;
      }[] = [];

      // 1. Gaji Pokok (Selalu ada jika > 0)
      if (baseSalary > 0) {
        linesData.push({
          componentId: null,
          label: "Gaji Pokok",
          type: "EARNING",
          amount: baseSalary,
        });
      }

      // 2. Komponen Organisasi (Default) & Komponen Khusus Pegawai
      // Petakan komponen khusus pegawai terlebih dahulu
      const empComponentMap = new Map(
        emp.salaryComponents.map((sc) => [sc.componentId, sc]),
      );

      for (const comp of masterComponents) {
        const empOverride = empComponentMap.get(comp.id);

        let amount = 0;
        if (comp.calcType === "FIXED") {
          amount = empOverride ? Number(empOverride.amount) : Number(comp.defaultValue || 0);
        } else if (comp.calcType === "PERCENT_OF_BASE") {
          const percent = empOverride ? Number(empOverride.amount) : Number(comp.defaultValue || 0);
          amount = Math.round((percent / 100) * baseSalary);
        } else if (comp.calcType === "MANUAL") {
          amount = empOverride ? Number(empOverride.amount) : 0;
        }

        if (amount > 0) {
          linesData.push({
            componentId: comp.id,
            label: comp.name,
            type: comp.type,
            amount,
          });
        }
      }

      // Hitung total gross, deductions, dan net
      const grossAmount = linesData
        .filter((l) => l.type === "EARNING")
        .reduce((sum, l) => sum + l.amount, 0);

      const totalDeduction = linesData
        .filter((l) => l.type === "DEDUCTION")
        .reduce((sum, l) => sum + l.amount, 0);

      const netAmount = Math.max(0, grossAmount - totalDeduction);

      grandGross += grossAmount;
      grandDeduction += totalDeduction;
      grandNet += netAmount;

      // Simpan Payslip dan baris-baris rinciannya
      await tx.payslip.create({
        data: {
          periodId: period.id,
          employeeId: emp.id,
          grossAmount,
          totalDeduction,
          netAmount,
          status: "CALCULATED",
          lines: {
            create: linesData.map((l) => ({
              componentId: l.componentId,
              label: l.label,
              type: l.type,
              amount: l.amount,
            })),
          },
        },
      });
    }

    // Update status periode menjadi CALCULATED
    await tx.payrollPeriod.update({
      where: { id: period.id },
      data: {
        status: "CALCULATED",
      },
    });
  });

  return {
    totalProcessed: activeEmployees.length,
    totalGross: grandGross,
    totalDeduction: grandDeduction,
    totalNet: grandNet,
    skippedWithoutContract,
  };
}

/**
 * Setujui Periode Payroll (APPROVE)
 */
export async function approvePeriodPayroll(periodId: string) {
  const period = await prisma.payrollPeriod.findUnique({
    where: { id: periodId },
  });

  if (!period) throw new Error("Periode tidak ditemukan.");
  if (period.status !== "CALCULATED") {
    throw new Error("Hanya periode berstatus CALCULATED yang dapat disetujui (APPROVED).");
  }

  await prisma.$transaction([
    prisma.payrollPeriod.update({
      where: { id: period.id },
      data: { status: "APPROVED" },
    }),
    prisma.payslip.updateMany({
      where: { periodId: period.id },
      data: { status: "APPROVED" },
    }),
  ]);

  return { ok: true };
}

/**
 * Publikasikan Slip Gaji ke Pegawai (PUBLISH)
 */
export async function publishPeriodPayroll(periodId: string) {
  const period = await prisma.payrollPeriod.findUnique({
    where: { id: periodId },
  });

  if (!period) throw new Error("Periode tidak ditemukan.");
  if (period.status !== "APPROVED") {
    throw new Error("Hanya periode yang sudah disetujui (APPROVED) yang dapat dipublikasikan.");
  }

  const now = new Date();

  await prisma.$transaction([
    prisma.payrollPeriod.update({
      where: { id: period.id },
      data: { status: "PUBLISHED" },
    }),
    prisma.payslip.updateMany({
      where: { periodId: period.id },
      data: { status: "PUBLISHED", publishedAt: now },
    }),
  ]);

  return { ok: true };
}

/**
 * Kunci Periode Payroll Permanen (LOCK)
 */
export async function lockPeriodPayroll(periodId: string) {
  const period = await prisma.payrollPeriod.findUnique({
    where: { id: periodId },
  });

  if (!period) throw new Error("Periode tidak ditemukan.");
  if (period.status !== "PUBLISHED") {
    throw new Error("Hanya periode berstatus PUBLISHED yang dapat dikunci (LOCKED).");
  }

  const now = new Date();

  await prisma.$transaction([
    prisma.payrollPeriod.update({
      where: { id: period.id },
      data: { status: "LOCKED", lockedAt: now },
    }),
    prisma.payslip.updateMany({
      where: { periodId: period.id },
      data: { status: "LOCKED" },
    }),
  ]);

  return { ok: true };
}

/**
 * Rekap Penggajian untuk Transfer Perbankan (CSV Format)
 */
export async function generatePayrollBankExport(periodId: string) {
  const period = await prisma.payrollPeriod.findUnique({
    where: { id: periodId },
    include: {
      payslips: {
        include: {
          employee: {
            select: {
              employeeNo: true,
              fullName: true,
              bankName: true,
              bankAccountEnc: true,
            },
          },
        },
      },
    },
  });

  if (!period) throw new Error("Periode tidak ditemukan.");

  const monthNames = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];
  const periodLabel = `${monthNames[period.month - 1]} ${period.year}`;

  const rows = [
    ["No", "NIP", "Nama Pegawai", "Nama Bank", "Nomor Rekening", "Nominal Transfer (Rp)", "Keterangan"],
  ];

  period.payslips.forEach((p, idx) => {
    let plainAccount = "-";
    if (p.employee.bankAccountEnc) {
      try {
        plainAccount = decryptField(p.employee.bankAccountEnc);
      } catch {
        plainAccount = "[Terenkripsi]";
      }
    }

    rows.push([
      String(idx + 1),
      p.employee.employeeNo,
      `"${p.employee.fullName}"`,
      p.employee.bankName || "-",
      `'${plainAccount}`,
      String(p.netAmount),
      `"Payroll PSPK ${periodLabel}"`,
    ]);
  });

  const csvContent = rows.map((r) => r.join(",")).join("\n");
  const filename = `Payroll_PSPK_${period.year}_${String(period.month).padStart(2, "0")}_${period.kind}.csv`;

  return {
    filename,
    csvContent,
  };
}
