import { prisma, writeAudit } from "@pspk/db";
import { decryptField, sanitizeCsvField } from "@pspk/shared";
import { getTimesheetValidationForPayroll } from "@/server/queries/timesheet.queries";
import {
  calculateMonthlyPph21Ter,
  calculateAnnualPph21Pasal17,
  calculateCompanyTaxableBenefit,
} from "./tax/pph21-calculator";

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
export async function calculatePeriodPayroll(
  periodId: string,
  options?: { allowUnapprovedTimesheet?: boolean },
): Promise<CalculatePayrollResult> {
  const period = await prisma.payrollPeriod.findUnique({
    where: { id: periodId },
  });

  if (!period) {
    throw new Error("Periode penggajian tidak ditemukan.");
  }

  if (period.status === "LOCKED") {
    throw new Error("Periode penggajian telah dikunci (LOCKED) dan tidak dapat dihitung ulang.");
  }

  // 1. Validasi Blocker Timesheet Freelance (PKWT Per Jam)
  const timesheetValidation = await getTimesheetValidationForPayroll(period.year, period.month);
  if (!options?.allowUnapprovedTimesheet && !timesheetValidation.canProceed) {
    const missingList = timesheetValidation.blockers
      .filter((b) => b.reason === "MISSING_TIMESHEET")
      .map((b) => `${b.employeeName} (${b.employeeNo}) [Belum Mengumpulkan]`);

    const pendingList = timesheetValidation.blockers
      .filter((b) => b.reason === "PENDING_APPROVAL")
      .map(
        (b) =>
          `${b.employeeName} (${b.employeeNo}) [Menunggu ACC: ${b.pendingReviewers.join(", ")}]`,
      );

    const details = [...missingList, ...pendingList].join("; ");
    throw new Error(
      `Kalkulasi payroll ditangguhkan: Terdapat ${timesheetValidation.blockers.length} pegawai freelance yang timesheet-nya belum di-ACC oleh atasan. Rincian: ${details}. Pastikan seluruh atasan telah menyetujui timesheet sebelum melakukan kalkulasi.`,
    );
  }

  // 2. Ambil seluruh pegawai aktif beserta kontrak dan komponen khususnya
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

  // 3. Ambil master komponen organisasi yang aktif
  const masterComponents = await prisma.salaryComponent.findMany({
    where: { isActive: true },
  });

  const baseSalaryComp = masterComponents.find(
    (c) => c.code === "BASE_SALARY" || c.name.toLowerCase().includes("gaji pokok"),
  );

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

    // Ambil timesheet resmi berstatus APPROVED untuk bulan & tahun periode ini
    const approvedTimesheets = await tx.timesheetSubmission.findMany({
      where: {
        periodYear: period.year,
        periodMonth: period.month,
        status: "APPROVED",
      },
    });
    const approvedTimesheetMap = new Map(approvedTimesheets.map((ts) => [ts.employeeId, ts]));

    // Bersihkan slip lama pada periode ini
    await tx.payslip.deleteMany({
      where: {
        periodId: period.id,
      },
    });

    // Peta slip gaji Jan-Nov jika menghitung periode Desember (Masa 12)
    const pastPayslipsByEmp = new Map<
      string,
      Array<{
        taxableGross: unknown;
        grossAmount: unknown;
        pph21Amount: unknown;
        lines: Array<{ type: string; label: string; amount: unknown }>;
      }>
    >();

    if (period.month === 12) {
      const pastPayslips = await tx.payslip.findMany({
        where: {
          period: {
            year: period.year,
            month: { lt: 12 },
          },
        },
        select: {
          employeeId: true,
          taxableGross: true,
          grossAmount: true,
          pph21Amount: true,
          lines: {
            select: {
              type: true,
              label: true,
              amount: true,
            },
          },
        },
      });

      for (const p of pastPayslips) {
        const arr = pastPayslipsByEmp.get(p.employeeId) ?? [];
        arr.push(p);
        pastPayslipsByEmp.set(p.employeeId, arr);
      }
    }

    for (const emp of activeEmployees) {
      const activeContract = emp.contracts[0];
      const wageType = activeContract?.wageType || "MONTHLY";
      const baseSalary = activeContract?.baseSalary ? Number(activeContract.baseSalary) : 0;
      const contractHourlyRate = activeContract?.hourlyRate ? Number(activeContract.hourlyRate) : 0;

      const existingTimesheet = existingTimesheetMap.get(emp.id);
      const approvedTs = approvedTimesheetMap.get(emp.id);

      const totalHours = approvedTs
        ? Number(approvedTs.totalHours)
        : existingTimesheet?.totalHours
          ? Number(existingTimesheet.totalHours)
          : 0;

      const effectiveHourlyRate =
        contractHourlyRate > 0
          ? contractHourlyRate
          : existingTimesheet?.hourlyRate && Number(existingTimesheet.hourlyRate) > 0
            ? Number(existingTimesheet.hourlyRate)
            : 0;

      const timesheetKey = approvedTs
        ? approvedTs.spreadsheetUrl
        : (existingTimesheet?.timesheetKey ?? null);

      // Tautkan timesheet ke ID payroll period jika ada
      if (approvedTs) {
        await tx.timesheetSubmission.update({
          where: { id: approvedTs.id },
          data: { payrollPeriodId: period.id },
        });
      }

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
            componentId: baseSalaryComp?.id ?? null,
            label: "Gaji Pokok",
            type: "EARNING",
            amount: baseSalary,
          });
        }
      }

      // 2. Komponen Organisasi & Komponen Khusus Pegawai
      const empComponentMap = new Map(emp.salaryComponents.map((sc) => [sc.componentId, sc]));

      for (const comp of masterComponents) {
        // A. Komponen Gaji Pokok sudah dihitung dari kontrak pegawai di atas.
        // Mencegah duplikasi Gaji Pokok untuk pegawai bulanan dan mencegah pegawai per jam mendapatkan Gaji Pokok.
        if (comp.code === "BASE_SALARY" || comp.name.toLowerCase().includes("gaji pokok")) {
          continue;
        }

        // B. Abaikan master PPh 21 lama karena pajak dihitung otomatis oleh Tax Engine (PP 58/2023 & Ps 17)
        if (
          comp.code === "POT_PPH21" ||
          comp.code === "PPH_21" ||
          comp.code === "PPH21" ||
          comp.name.toLowerCase().includes("pph 21") ||
          comp.name.toLowerCase().includes("pph21")
        ) {
          continue;
        }

        // C. Pegawai Per Jam / Freelance (HOURLY):
        // Sesuai prinsip "No Work, No Pay", kompensasi pegawai per jam hanya berasal dari jam kerja timesheet.
        // Tunjangan tetap bulanan dan iuran BPJS reguler tidak berlaku untuk kontrak per jam.
        if (wageType === "HOURLY") {
          // Hanya izinkan komponen MANUAL jika ada override khusus pegawai (misal bonus/potongan proyek khusus)
          if (comp.calcType !== "MANUAL") {
            continue;
          }
        }

        const empOverride = empComponentMap.get(comp.id);

        let amount = 0;
        if (comp.calcType === "FIXED") {
          // Komponen fixed default kantor hanya otomatis untuk pegawai bulanan,
          // kecuali ada override khusus yang dikonfigurasi admin
          if (empOverride) {
            amount = Number(empOverride.amount);
          } else if (wageType === "MONTHLY") {
            amount = Number(comp.defaultValue || 0);
          }
        } else if (comp.calcType === "PERCENT_OF_BASE") {
          // Komponen persentase default (seperti BPJS) hanya untuk pegawai bulanan tetap
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

      // 3. Kalkulasi Pajak Penghasilan (PPh 21 Metode Gross)
      // A. Total penghasilan tunai bruto (Cash Earnings)
      const cashEarnings = linesData
        .filter((l) => l.type === "EARNING")
        .reduce((sum, l) => sum + l.amount, 0);

      // B. Premi asuransi tanggungan lembaga (JKK 0.24%, JKM 0.30%, BPJS Kes 4%) sebagai penambah bruto pajak
      const companyBenefit =
        wageType === "MONTHLY"
          ? calculateCompanyTaxableBenefit(baseSalary)
          : { bpjsKesehatan: 0, jkk: 0, jkm: 0, totalBenefit: 0 };
      const companyTaxBenefit = companyBenefit.totalBenefit;

      // C. Dasar Pengenaan Pajak (DPP / Taxable Gross)
      const taxableGross = cashEarnings + companyTaxBenefit;

      // D. Hitung PPh 21 (Bulan 1-11: TER PP 58/2023, Bulan 12: Pasal 17 UU HPP)
      let pph21 = 0;
      let terCategory: string | null = null;
      let terRate: number | null = null;

      if (period.month <= 11) {
        const monthlyResult = calculateMonthlyPph21Ter(taxableGross, emp.ptkpStatus);
        pph21 = monthlyResult.pph21;
        terCategory = monthlyResult.terCategory;
        terRate = monthlyResult.terRate;
      } else {
        // Bulan 12 (Desember) - Rekonsiliasi Tahunan Pasal 17
        const pastSlips = pastPayslipsByEmp.get(emp.id) ?? [];
        let pastTaxableGross = 0;
        let pastPph21Paid = 0;
        let pastPensionDeductions = 0;

        for (const p of pastSlips) {
          pastTaxableGross += p.taxableGross ? Number(p.taxableGross) : Number(p.grossAmount);
          if (p.pph21Amount) {
            pastPph21Paid += Number(p.pph21Amount);
          } else {
            const pphLine = p.lines
              .filter(
                (l) =>
                  l.type === "DEDUCTION" &&
                  (l.label.toLowerCase().includes("pph 21") ||
                    l.label.toLowerCase().includes("pph21")),
              )
              .reduce((s, l) => s + Number(l.amount), 0);
            pastPph21Paid += pphLine;
          }

          const pensionLine = p.lines
            .filter(
              (l) =>
                l.type === "DEDUCTION" &&
                (l.label.toLowerCase().includes("jht") ||
                  l.label.toLowerCase().includes("jp") ||
                  l.label.toLowerCase().includes("pensiun")),
            )
            .reduce((s, l) => s + Number(l.amount), 0);
          pastPensionDeductions += pensionLine;
        }

        const currentPensionDeductions = linesData
          .filter(
            (l) =>
              l.type === "DEDUCTION" &&
              (l.label.toLowerCase().includes("jht") ||
                l.label.toLowerCase().includes("jp") ||
                l.label.toLowerCase().includes("pensiun")),
          )
          .reduce((sum, l) => sum + l.amount, 0);

        const annualResult = calculateAnnualPph21Pasal17({
          annualTaxableGross: pastTaxableGross + taxableGross,
          ptkp: emp.ptkpStatus,
          annualPensionDeductions: pastPensionDeductions + currentPensionDeductions,
          monthsWorked: Math.min(12, pastSlips.length + 1),
          previousPph21Paid: pastPph21Paid,
        });

        pph21 = Math.max(0, annualResult.pph21December);
        terCategory = "PASAL_17";
        terRate = null;
      }

      // E. Terapkan PPh 21 ke rincian slip sesuai Metode Pajak Pegawai
      const taxMethod = emp.taxMethod || "GROSS";

      if (pph21 > 0) {
        const taxLabel =
          period.month === 12
            ? "PPh 21 (Pasal 17 Desember)"
            : `PPh 21 (${(terCategory ?? "").replace("_", " ")} ${((terRate ?? 0) * 100).toFixed(2).replace(/\.00$/, "")}%)`;

        if (taxMethod === "GROSS") {
          linesData.push({
            componentId: null,
            label: taxLabel,
            type: "DEDUCTION",
            amount: pph21,
          });
        } else if (taxMethod === "GROSS_UP") {
          linesData.push({
            componentId: null,
            label: "Tunjangan PPh 21 (Gross Up)",
            type: "EARNING",
            amount: pph21,
          });
          linesData.push({
            componentId: null,
            label: taxLabel,
            type: "DEDUCTION",
            amount: pph21,
          });
        }
        // Jika NETT: PPh 21 ditanggung kantor tanpa memotong gaji tunai pegawai
      }

      // F. Hitung total penghasilan tunai (grossAmount), potongan (totalDeduction), dan THP (netAmount)
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

      // G. Simpan Payslip dan baris-baris rinciannya
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
          taxableGross,
          pph21Amount: pph21,
          terCategory,
          terRate,
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

  // Validasi Blocker Timesheet Freelance: Seluruh timesheet wajib disetujui atasan
  const timesheetValidation = await getTimesheetValidationForPayroll(period.year, period.month);
  if (!timesheetValidation.canProceed) {
    const missingList = timesheetValidation.blockers
      .filter((b) => b.reason === "MISSING_TIMESHEET")
      .map((b) => `${b.employeeName} (${b.employeeNo}) [Belum Mengumpulkan]`);

    const pendingList = timesheetValidation.blockers
      .filter((b) => b.reason === "PENDING_APPROVAL")
      .map(
        (b) =>
          `${b.employeeName} (${b.employeeNo}) [Menunggu ACC: ${b.pendingReviewers.join(", ")}]`,
      );

    const details = [...missingList, ...pendingList].join("; ");
    throw new Error(
      `Persetujuan payroll ditolak: Terdapat ${timesheetValidation.blockers.length} pegawai freelance yang timesheet-nya belum selesai di-ACC oleh atasan proyek. Rincian: ${details}. Seluruh timesheet wajib disetujui sebelum periode disetujui HR.`,
    );
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

  // Validasi Blocker Timesheet Freelance: Pastikan tidak ada timesheet yang belum selesai
  const timesheetValidation = await getTimesheetValidationForPayroll(period.year, period.month);
  if (!timesheetValidation.canProceed) {
    const missingList = timesheetValidation.blockers
      .filter((b) => b.reason === "MISSING_TIMESHEET")
      .map((b) => `${b.employeeName} (${b.employeeNo}) [Belum Mengumpulkan]`);

    const pendingList = timesheetValidation.blockers
      .filter((b) => b.reason === "PENDING_APPROVAL")
      .map(
        (b) =>
          `${b.employeeName} (${b.employeeNo}) [Menunggu ACC: ${b.pendingReviewers.join(", ")}]`,
      );

    const details = [...missingList, ...pendingList].join("; ");
    throw new Error(
      `Publikasi slip gaji ditolak: Terdapat ${timesheetValidation.blockers.length} pegawai freelance yang timesheet-nya belum di-ACC oleh atasan. Rincian: ${details}. Slip gaji tidak dapat dipublikasikan sampai seluruh timesheet diverifikasi lengkap.`,
    );
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

  const timesheetValidation = await getTimesheetValidationForPayroll(period.year, period.month);
  if (!timesheetValidation.canProceed) {
    throw new Error(
      "Periode tidak dapat dikunci karena masih terdapat data timesheet freelance yang belum tuntas di-ACC.",
    );
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
 * Kembalikan Status Periode Payroll ke Draf Awal (REVERT TO DRAFT)
 */
export async function revertPayrollPeriod(periodId: string) {
  const period = await prisma.payrollPeriod.findUnique({
    where: { id: periodId },
  });

  if (!period) throw new Error("Periode penggajian tidak ditemukan.");
  if (period.status === "LOCKED") {
    throw new Error(
      "Periode yang telah dikunci permanen (LOCKED) tidak dapat dikembalikan ke Draf.",
    );
  }
  if (period.status === "DRAFT") {
    throw new Error("Periode sudah berada pada status Draf Awal.");
  }

  await prisma.$transaction([
    prisma.payrollPeriod.update({
      where: { id: period.id },
      data: { status: "DRAFT" },
    }),
    prisma.payslip.updateMany({
      where: { periodId: period.id },
      data: { status: "DRAFT", publishedAt: null },
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

  const headers = [
    "No",
    "NIP",
    "Nama Pegawai",
    "Nama Bank",
    "Nomor Rekening",
    "Nominal Transfer (Rp)",
    "Keterangan",
  ];

  const rows: string[] = [headers.map(sanitizeCsvField).join(",")];

  period.payslips.forEach((p, idx) => {
    let plainAccount = "-";
    if (p.employee.bankAccountEnc) {
      try {
        plainAccount = decryptField(p.employee.bankAccountEnc);
      } catch {
        plainAccount = "[Terenkripsi]";
      }
    }

    rows.push(
      [
        idx + 1,
        p.employee.employeeNo,
        p.employee.fullName,
        p.employee.bankName || "-",
        plainAccount,
        Number(p.netAmount),
        `Payroll PSPK ${periodLabel}`,
      ]
        .map(sanitizeCsvField)
        .join(","),
    );
  });

  const csvContent = rows.join("\r\n");
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
    // Skip Gaji Pokok untuk pekerja per jam
    if (comp.code === "BASE_SALARY" || comp.name.toLowerCase().includes("gaji pokok")) {
      continue;
    }
    // Pegawai per jam tidak mendapatkan tunjangan tetap atau iuran BPJS bulanan kantor
    if (comp.calcType !== "MANUAL") {
      continue;
    }

    const empOverride = empComponentMap.get(comp.id);

    let amount = 0;
    if (comp.calcType === "MANUAL") {
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
