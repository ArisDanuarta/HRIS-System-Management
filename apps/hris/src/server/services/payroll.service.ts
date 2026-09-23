import { prisma, writeAudit } from "@pspk/db";
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
    // Ambil data timesheet yang mungkin sudah diinput sebelumnya untuk periode ini
    const existingPayslips = await tx.payslip.findMany({
      where: { periodId: period.id },
      select: {
        employeeId: true,
        totalHours: true,
        hourlyRate: true,
        timesheetKey: true,
        wageType: true,
      },
    });
    const existingTimesheetMap = new Map(existingPayslips.map((p) => [p.employeeId, p]));

    // Bersihkan slip lama pada periode ini
    await tx.payslip.deleteMany({
      where: {
        periodId: period.id,
      },
    });

    for (const emp of activeEmployees) {
      const activeContract = emp.contracts[0];
      const wageType = activeContract?.wageType || "MONTHLY";
      const baseSalary = activeContract?.baseSalary ? Number(activeContract.baseSalary) : 0;
      const contractHourlyRate = activeContract?.hourlyRate ? Number(activeContract.hourlyRate) : 0;

      const existingTimesheet = existingTimesheetMap.get(emp.id);
      const totalHours = existingTimesheet?.totalHours ? Number(existingTimesheet.totalHours) : 0;
      const effectiveHourlyRate =
        existingTimesheet?.hourlyRate && Number(existingTimesheet.hourlyRate) > 0
          ? Number(existingTimesheet.hourlyRate)
          : contractHourlyRate;
      const timesheetKey = existingTimesheet?.timesheetKey ?? null;

      // Kumpulkan komponen earnings & deductions
      const linesData: {
        componentId: string | null;
        label: string;
        type: "EARNING" | "DEDUCTION";
        amount: number;
      }[] = [];

      let baseForCalculation = 0;

      if (wageType === "HOURLY") {
        if (!activeContract || effectiveHourlyRate <= 0) {
          skippedWithoutContract.push(
            `${emp.fullName} (${emp.employeeNo}) - Tarif per jam belum diatur pada kontrak`,
          );
        }

        const hourlyPay = Math.round(totalHours * effectiveHourlyRate);
        baseForCalculation = hourlyPay;

        if (hourlyPay > 0) {
          linesData.push({
            componentId: null,
            label: `Upah Jam Kerja Timesheet (${totalHours} jam @ Rp ${effectiveHourlyRate.toLocaleString("id-ID")})`,
            type: "EARNING",
            amount: hourlyPay,
          });
        }
      } else {
        // MONTHLY
        if (!activeContract || baseSalary <= 0) {
          skippedWithoutContract.push(`${emp.fullName} (${emp.employeeNo})`);
        }

        baseForCalculation = baseSalary;

        if (baseSalary > 0) {
          linesData.push({
            componentId: null,
            label: "Gaji Pokok",
            type: "EARNING",
            amount: baseSalary,
          });
        }
      }

      // 2. Komponen Organisasi & Komponen Khusus Pegawai
      const empComponentMap = new Map(
        emp.salaryComponents.map((sc) => [sc.componentId, sc]),
      );

      for (const comp of masterComponents) {
        const empOverride = empComponentMap.get(comp.id);

        let amount = 0;
        if (comp.calcType === "FIXED") {
          // Komponen fixed default kantor hanya otomatis untuk pegawai bulanan,
          // kecuali staf per jam memiliki override khusus yang dikonfigurasi admin
          if (empOverride) {
            amount = Number(empOverride.amount);
          } else if (wageType === "MONTHLY") {
            amount = Number(comp.defaultValue || 0);
          }
        } else if (comp.calcType === "PERCENT_OF_BASE") {
          // Komponen persentase default (seperti BPJS) hanya untuk pegawai bulanan tetap,
          // untuk freelance per jam hanya berlaku jika ada konfigurasi khusus (override)
          if (empOverride) {
            const percent = Number(empOverride.amount);
            amount = Math.round((percent / 100) * baseForCalculation);
          } else if (wageType === "MONTHLY") {
            const percent = Number(comp.defaultValue || 0);
            amount = Math.round((percent / 100) * baseForCalculation);
          }
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
          wageType,
          totalHours: wageType === "HOURLY" ? totalHours : null,
          hourlyRate: wageType === "HOURLY" ? effectiveHourlyRate : null,
          timesheetKey,
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

export interface UpdatePayslipTimesheetInput {
  payslipId: string;
  totalHours: number;
  hourlyRate?: number;
  timesheetKey?: string | null;
  actor: {
    userId: string;
    email: string;
    ip?: string | null;
    userAgent?: string | null;
  };
}

/**
 * Memperbarui data jam kerja timesheet pegawai pada periode penggajian
 */
export async function updatePayslipTimesheet(input: UpdatePayslipTimesheetInput) {
  const payslip = await prisma.payslip.findUnique({
    where: { id: input.payslipId },
    include: {
      period: true,
      employee: {
        include: {
          contracts: {
            where: { status: "ACTIVE" },
            orderBy: { startDate: "desc" },
            take: 1,
          },
          salaryComponents: {
            include: { component: true },
          },
        },
      },
      lines: true,
    },
  });

  if (!payslip) {
    throw new Error("Slip gaji tidak ditemukan.");
  }

  if (payslip.period.status === "LOCKED") {
    throw new Error("Periode penggajian telah dikunci permanen (LOCKED) dan tidak dapat diubah.");
  }

  if (input.totalHours < 0) {
    throw new Error("Total jam kerja tidak boleh bernilai negatif.");
  }

  const activeContract = payslip.employee.contracts[0];
  const effectiveHourlyRate =
    input.hourlyRate && input.hourlyRate > 0
      ? input.hourlyRate
      : activeContract?.hourlyRate
      ? Number(activeContract.hourlyRate)
      : payslip.hourlyRate
      ? Number(payslip.hourlyRate)
      : 0;

  if (effectiveHourlyRate <= 0) {
    throw new Error("Tarif upah per jam belum ditentukan pada kontrak pegawai.");
  }

  const hourlyPay = Math.round(input.totalHours * effectiveHourlyRate);

  // Ambil master komponen untuk menghitung ulang komponen khusus pegawai
  const masterComponents = await prisma.salaryComponent.findMany({
    where: { isActive: true },
  });

  const empComponentMap = new Map(
    payslip.employee.salaryComponents.map((sc) => [sc.componentId, sc]),
  );

  const linesData: {
    componentId: string | null;
    label: string;
    type: "EARNING" | "DEDUCTION";
    amount: number;
  }[] = [];

  // 1. Upah jam kerja
  if (hourlyPay > 0) {
    linesData.push({
      componentId: null,
      label: `Upah Jam Kerja Timesheet (${input.totalHours} jam @ Rp ${effectiveHourlyRate.toLocaleString("id-ID")})`,
      type: "EARNING",
      amount: hourlyPay,
    });
  }

  // 2. Komponen khusus pegawai (jika ada)
  for (const comp of masterComponents) {
    const empOverride = empComponentMap.get(comp.id);

    let amount = 0;
    if (comp.calcType === "FIXED") {
      if (empOverride) amount = Number(empOverride.amount);
    } else if (comp.calcType === "PERCENT_OF_BASE") {
      if (empOverride) {
        const percent = Number(empOverride.amount);
        amount = Math.round((percent / 100) * hourlyPay);
      }
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

  const grossAmount = linesData
    .filter((l) => l.type === "EARNING")
    .reduce((sum, l) => sum + l.amount, 0);

  const totalDeduction = linesData
    .filter((l) => l.type === "DEDUCTION")
    .reduce((sum, l) => sum + l.amount, 0);

  const netAmount = Math.max(0, grossAmount - totalDeduction);

  const finalTimesheetKey =
    input.timesheetKey !== undefined ? input.timesheetKey : payslip.timesheetKey;

  // Jalankan dalam transaksi
  const updated = await prisma.$transaction(async (tx) => {
    // Hapus rincian lama
    await tx.payslipLine.deleteMany({
      where: { payslipId: payslip.id },
    });

    // Update payslip dan buat rincian baru
    const updatedSlip = await tx.payslip.update({
      where: { id: payslip.id },
      data: {
        wageType: "HOURLY",
        totalHours: input.totalHours,
        hourlyRate: effectiveHourlyRate,
        timesheetKey: finalTimesheetKey,
        grossAmount,
        totalDeduction,
        netAmount,
        lines: {
          create: linesData.map((l) => ({
            componentId: l.componentId,
            label: l.label,
            type: l.type,
            amount: l.amount,
          })),
        },
      },
      include: {
        lines: true,
      },
    });

    // Tulis Audit Log
    await writeAudit({
      actorUserId: input.actor.userId,
      actorEmail: input.actor.email,
      app: "hris",
      action: "UPDATE",
      entityType: "PayslipTimesheet",
      entityId: payslip.id,
      before: {
        totalHours: payslip.totalHours ? Number(payslip.totalHours) : null,
        hourlyRate: payslip.hourlyRate ? Number(payslip.hourlyRate) : null,
        grossAmount: Number(payslip.grossAmount),
        netAmount: Number(payslip.netAmount),
        timesheetKey: payslip.timesheetKey,
      },
      after: {
        totalHours: input.totalHours,
        hourlyRate: effectiveHourlyRate,
        grossAmount,
        netAmount,
        timesheetKey: finalTimesheetKey,
      },
      ip: input.actor.ip,
      userAgent: input.actor.userAgent,
    });

    return updatedSlip;
  });

  return updated;
}

