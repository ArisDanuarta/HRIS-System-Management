"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma, writeAudit } from "@pspk/db";
import { getSession, getAuthContext } from "@pspk/auth";
import { getStorageProvider } from "@pspk/storage";
import {
  calculatePeriodPayroll,
  approvePeriodPayroll,
  publishPeriodPayroll,
  lockPeriodPayroll,
  generatePayrollBankExport,
  updatePayslipTimesheet,
} from "../services/payroll.service";

async function getActorInfo() {
  const reqHeaders = await headers();
  const session = await getSession(reqHeaders);

  if (!session?.user) {
    throw new Error("Sesi Anda telah kedaluwarsa. Silakan masuk kembali.");
  }

  const authCtx = await getAuthContext(session.user.id);
  if (!authCtx) {
    throw new Error("Pengguna tidak aktif atau hak akses tidak valid.");
  }

  const isSuperAdmin = authCtx.roles.includes("super_admin");
  const isAdminHr = authCtx.roles.includes("admin_hr");

  const ip = reqHeaders.get("x-forwarded-for") || reqHeaders.get("x-real-ip") || "127.0.0.1";
  const userAgent = reqHeaders.get("user-agent") || "unknown";

  return {
    userId: session.user.id,
    email: session.user.email,
    authCtx,
    isSuperAdmin,
    isAdminHr,
    ip,
    userAgent,
  };
}

/**
 * Buat Periode Penggajian Baru
 */
export async function createPayrollPeriodAction(input: {
  year: number;
  month: number;
  kind: "REGULAR" | "THR";
  cutoffDate?: string;
}) {
  try {
    const actor = await getActorInfo();

    if (!actor.isSuperAdmin && !actor.isAdminHr) {
      return {
        ok: false as const,
        error: "Hanya Admin HR atau Super Admin yang berwenang membuat periode penggajian.",
      };
    }

    if (input.month < 1 || input.month > 12) {
      return { ok: false as const, error: "Bulan tidak valid (1-12)." };
    }

    // Cek apakah periode dengan tahun, bulan, dan jenis ini sudah ada
    const existing = await prisma.payrollPeriod.findUnique({
      where: {
        year_month_kind: {
          year: input.year,
          month: input.month,
          kind: input.kind,
        },
      },
    });

    if (existing) {
      return {
        ok: false as const,
        error: `Periode penggajian ${input.kind} untuk bulan ${input.month}/${input.year} sudah terdaftar.`,
      };
    }

    const cutoff = input.cutoffDate ? new Date(input.cutoffDate) : null;

    const period = await prisma.$transaction(async (tx) => {
      const created = await tx.payrollPeriod.create({
        data: {
          year: input.year,
          month: input.month,
          kind: input.kind,
          cutoffDate: cutoff,
          status: "DRAFT",
        },
      });

      await writeAudit(
        {
          actorUserId: actor.userId,
          actorEmail: actor.email,
          app: "hris",
          action: "CREATE",
          entityType: "PayrollPeriod",
          entityId: created.id,
          after: {
            year: input.year,
            month: input.month,
            kind: input.kind,
            cutoffDate: input.cutoffDate,
          },
          ip: actor.ip,
          userAgent: actor.userAgent,
        },
        tx,
      );

      return created;
    });

    revalidatePath("/payroll");

    return {
      ok: true as const,
      message: `Periode penggajian ${input.kind} ${input.month}/${input.year} berhasil dibuat.`,
      periodId: period.id,
    };
  } catch (err: unknown) {
    console.error("createPayrollPeriodAction error:", err);
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Gagal membuat periode penggajian.",
    };
  }
}

/**
 * Jalankan Kalkulasi Payroll Massal
 */
export async function calculatePayrollAction(input: { periodId: string }) {
  try {
    const actor = await getActorInfo();

    if (!actor.isSuperAdmin && !actor.isAdminHr) {
      return {
        ok: false as const,
        error: "Hanya Admin HR atau Super Admin yang berwenang menjalankan kalkulasi penggajian.",
      };
    }

    const result = await calculatePeriodPayroll(input.periodId);

    // Audit Log
    await writeAudit({
      actorUserId: actor.userId,
      actorEmail: actor.email,
      app: "hris",
      action: "CALCULATE",
      entityType: "PayrollPeriod",
      entityId: input.periodId,
      after: {
        totalProcessed: result.totalProcessed,
        totalGross: result.totalGross,
        totalDeduction: result.totalDeduction,
        totalNet: result.totalNet,
        skippedCount: result.skippedWithoutContract.length,
      },
      ip: actor.ip,
      userAgent: actor.userAgent,
    });

    revalidatePath("/payroll");
    revalidatePath(`/payroll/${input.periodId}`);

    return {
      ok: true as const,
      message: `Kalkulasi payroll berhasil diproses untuk ${result.totalProcessed} pegawai. Total Netto: Rp ${result.totalNet.toLocaleString("id-ID")}.`,
      result,
    };
  } catch (err: unknown) {
    console.error("calculatePayrollAction error:", err);
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Gagal menghitung payroll.",
    };
  }
}

/**
 * Setujui Periode Payroll (APPROVE)
 */
export async function approvePayrollAction(input: { periodId: string }) {
  try {
    const actor = await getActorInfo();

    if (!actor.isSuperAdmin && !actor.isAdminHr) {
      return {
        ok: false as const,
        error: "Hanya Admin HR atau Super Admin yang berwenang menyetujui penggajian.",
      };
    }

    await approvePeriodPayroll(input.periodId);

    await writeAudit({
      actorUserId: actor.userId,
      actorEmail: actor.email,
      app: "hris",
      action: "APPROVE",
      entityType: "PayrollPeriod",
      entityId: input.periodId,
      ip: actor.ip,
      userAgent: actor.userAgent,
    });

    revalidatePath("/payroll");
    revalidatePath(`/payroll/${input.periodId}`);

    return {
      ok: true as const,
      message: "Periode penggajian berhasil disetujui (APPROVED).",
    };
  } catch (err: unknown) {
    console.error("approvePayrollAction error:", err);
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Gagal menyetujui payroll.",
    };
  }
}

/**
 * Publikasikan Slip Gaji ke Akun Karyawan (PUBLISH)
 */
export async function publishPayrollAction(input: { periodId: string }) {
  try {
    const actor = await getActorInfo();

    if (!actor.isSuperAdmin && !actor.isAdminHr) {
      return {
        ok: false as const,
        error: "Hanya Admin HR atau Super Admin yang berwenang mempublikasikan slip gaji.",
      };
    }

    await publishPeriodPayroll(input.periodId);

    await writeAudit({
      actorUserId: actor.userId,
      actorEmail: actor.email,
      app: "hris",
      action: "PUBLISH",
      entityType: "PayrollPeriod",
      entityId: input.periodId,
      ip: actor.ip,
      userAgent: actor.userAgent,
    });

    revalidatePath("/payroll");
    revalidatePath(`/payroll/${input.periodId}`);

    return {
      ok: true as const,
      message: "Slip gaji resmi berhasil dipublikasikan ke portal masing-masing pegawai.",
    };
  } catch (err: unknown) {
    console.error("publishPayrollAction error:", err);
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Gagal mempublikasikan slip gaji.",
    };
  }
}

/**
 * Kunci Periode Payroll Permanen (LOCK)
 */
export async function lockPayrollAction(input: { periodId: string }) {
  try {
    const actor = await getActorInfo();

    if (!actor.isSuperAdmin && !actor.isAdminHr) {
      return {
        ok: false as const,
        error: "Hanya Admin HR atau Super Admin yang berwenang mengunci periode penggajian.",
      };
    }

    await lockPeriodPayroll(input.periodId);

    await writeAudit({
      actorUserId: actor.userId,
      actorEmail: actor.email,
      app: "hris",
      action: "LOCK",
      entityType: "PayrollPeriod",
      entityId: input.periodId,
      ip: actor.ip,
      userAgent: actor.userAgent,
    });

    revalidatePath("/payroll");
    revalidatePath(`/payroll/${input.periodId}`);

    return {
      ok: true as const,
      message: "Periode penggajian telah dikunci permanen (LOCKED).",
    };
  } catch (err: unknown) {
    console.error("lockPayrollAction error:", err);
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Gagal mengunci periode penggajian.",
    };
  }
}

/**
 * Buat atau Ubah Master Komponen Gaji
 */
export async function createOrUpdateSalaryComponentAction(input: {
  id?: string;
  code: string;
  name: string;
  type: "EARNING" | "DEDUCTION";
  calcType: "FIXED" | "PERCENT_OF_BASE" | "MANUAL";
  defaultValue?: number;
  isActive: boolean;
}) {
  try {
    const actor = await getActorInfo();

    if (!actor.isSuperAdmin && !actor.isAdminHr) {
      return {
        ok: false as const,
        error: "Hanya Admin HR atau Super Admin yang berwenang mengonfigurasi komponen gaji.",
      };
    }

    const cleanCode = input.code.trim().toUpperCase();

    if (!input.id) {
      // Create new
      const existing = await prisma.salaryComponent.findUnique({
        where: { code: cleanCode },
      });

      if (existing) {
        return {
          ok: false as const,
          error: `Komponen dengan kode '${cleanCode}' sudah ada.`,
        };
      }

      const created = await prisma.salaryComponent.create({
        data: {
          code: cleanCode,
          name: input.name.trim(),
          type: input.type,
          calcType: input.calcType,
          defaultValue: input.defaultValue ?? 0,
          isActive: input.isActive,
        },
      });

      await writeAudit({
        actorUserId: actor.userId,
        actorEmail: actor.email,
        app: "hris",
        action: "CREATE",
        entityType: "SalaryComponent",
        entityId: created.id,
        after: { code: cleanCode, name: input.name },
        ip: actor.ip,
        userAgent: actor.userAgent,
      });

      revalidatePath("/payroll/komponen");

      return {
        ok: true as const,
        message: `Komponen gaji '${created.name}' berhasil ditambahkan.`,
      };
    } else {
      // Update existing
      const updated = await prisma.salaryComponent.update({
        where: { id: input.id },
        data: {
          name: input.name.trim(),
          type: input.type,
          calcType: input.calcType,
          defaultValue: input.defaultValue ?? 0,
          isActive: input.isActive,
        },
      });

      await writeAudit({
        actorUserId: actor.userId,
        actorEmail: actor.email,
        app: "hris",
        action: "UPDATE",
        entityType: "SalaryComponent",
        entityId: updated.id,
        after: { name: updated.name, isActive: updated.isActive },
        ip: actor.ip,
        userAgent: actor.userAgent,
      });

      revalidatePath("/payroll/komponen");

      return {
        ok: true as const,
        message: `Komponen gaji '${updated.name}' berhasil diperbarui.`,
      };
    }
  } catch (err: unknown) {
    console.error("createOrUpdateSalaryComponentAction error:", err);
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Gagal menyimpan komponen gaji.",
    };
  }
}

/**
 * Ekspor Rekap Transfer Bank Payroll (CSV)
 */
export async function exportPayrollBankCsvAction(input: { periodId: string }) {
  try {
    const actor = await getActorInfo();

    if (!actor.isSuperAdmin && !actor.isAdminHr) {
      return {
        ok: false as const,
        error: "Hanya Admin HR atau Super Admin yang berwenang mengekspor data penggajian.",
      };
    }

    const { filename, csvContent } = await generatePayrollBankExport(input.periodId);

    // Audit log ekspor data sensitif
    await writeAudit({
      actorUserId: actor.userId,
      actorEmail: actor.email,
      app: "hris",
      action: "EXPORT",
      entityType: "PayrollPeriod",
      entityId: input.periodId,
      after: { filename },
      ip: actor.ip,
      userAgent: actor.userAgent,
    });

    return {
      ok: true as const,
      filename,
      csvContent,
    };
  } catch (err: unknown) {
    console.error("exportPayrollBankCsvAction error:", err);
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Gagal mengekspor rekap perbankan.",
    };
  }
}

/**
 * Update Timesheet Jam Kerja Pegawai & Unggah Bukti Timesheet (PDF/XLSX)
 */
export async function updatePayslipTimesheetAction(formData: FormData) {
  try {
    const actor = await getActorInfo();

    if (!actor.isSuperAdmin && !actor.isAdminHr) {
      return {
        ok: false as const,
        error: "Hanya Admin HR atau Super Admin yang berwenang memperbarui timesheet pegawai.",
      };
    }

    const payslipId = formData.get("payslipId") as string;
    const totalHoursRaw = formData.get("totalHours") as string;
    const hourlyRateRaw = formData.get("hourlyRate") as string | null;

    if (!payslipId || !totalHoursRaw) {
      return { ok: false as const, error: "ID slip dan total jam kerja wajib diisi." };
    }

    const totalHours = Number(totalHoursRaw);
    if (isNaN(totalHours) || totalHours < 0) {
      return { ok: false as const, error: "Total jam kerja harus berupa angka valid (>= 0)." };
    }

    const hourlyRate =
      hourlyRateRaw && !isNaN(Number(hourlyRateRaw)) ? Number(hourlyRateRaw) : undefined;

    let timesheetKey: string | null | undefined = undefined;
    const file = formData.get("timesheetFile") as File | null;

    if (file && file.size > 0) {
      const allowedExtensions = [".pdf", ".xlsx", ".xls", ".csv"];
      const fileNameLower = file.name.toLowerCase();
      const isAllowed = allowedExtensions.some((ext) => fileNameLower.endsWith(ext));

      if (!isAllowed) {
        return {
          ok: false as const,
          error: "Berkas lampiran timesheet harus berformat PDF, Excel (.xlsx/.xls), atau CSV.",
        };
      }

      if (file.size > 15 * 1024 * 1024) {
        return { ok: false as const, error: "Ukuran berkas lampiran timesheet maksimal 15 MB." };
      }

      let contentType = file.type || "application/octet-stream";
      if (fileNameLower.endsWith(".pdf")) contentType = "application/pdf";
      else if (fileNameLower.endsWith(".xlsx"))
        contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      else if (fileNameLower.endsWith(".xls")) contentType = "application/vnd.ms-excel";
      else if (fileNameLower.endsWith(".csv")) contentType = "text/csv";

      const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const storageKey = `timesheets/${payslipId}_${Date.now()}_${safeFileName}`;
      const buffer = Buffer.from(await file.arrayBuffer());

      const storage = getStorageProvider();
      await storage.put(storageKey, buffer, { contentType });
      timesheetKey = storageKey;
    }

    const updated = await updatePayslipTimesheet({
      payslipId,
      totalHours,
      hourlyRate,
      timesheetKey,
      actor: {
        userId: actor.userId,
        email: actor.email,
        ip: actor.ip,
        userAgent: actor.userAgent,
      },
    });

    revalidatePath(`/payroll/${updated.periodId}`);
    revalidatePath("/payroll");

    return {
      ok: true as const,
      message: `Timesheet berhasil diperbarui. Total upah jam kerja terhitung: Rp ${Number(updated.grossAmount).toLocaleString("id-ID")}`,
    };
  } catch (err: unknown) {
    console.error("updatePayslipTimesheetAction error:", err);
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Gagal memperbarui data timesheet pegawai.",
    };
  }
}

