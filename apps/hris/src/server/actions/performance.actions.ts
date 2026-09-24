"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma, writeAudit } from "@pspk/db";
import { getSession, getAuthContext } from "@pspk/auth";
import {
  createPerformancePeriodSchema,
  updatePerformancePeriodStatusSchema,
  finalizePerformanceReviewSchema,
} from "../schemas/performance.schema";
import {
  createPerformancePeriod,
  updatePerformancePeriodStatus,
  finalizePerformanceReview,
  generatePerformanceExportCsv,
} from "../services/performance.service";

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
 * Server Action: Buat Periode Evaluasi Kinerja Baru
 */
export async function createPerformancePeriodAction(rawData: unknown) {
  try {
    const actor = await getActorInfo();

    if (!actor.isSuperAdmin && !actor.isAdminHr) {
      return {
        success: false,
        error: "Anda tidak memiliki hak akses untuk membuat periode evaluasi kinerja.",
      };
    }

    const validated = createPerformancePeriodSchema.safeParse(rawData);
    if (!validated.success) {
      const firstError = validated.error.issues[0]?.message || "Input tidak valid";
      return { success: false, error: firstError };
    }

    const period = await createPerformancePeriod(validated.data);

    await writeAudit({
      actorUserId: actor.userId,
      actorEmail: actor.email,
      app: "hris",
      action: "CREATE",
      entityType: "PerformancePeriod",
      entityId: period.id,
      after: {
        id: period.id,
        name: period.name,
        startDate: period.startDate,
        endDate: period.endDate,
        status: period.status,
      },
      ip: actor.ip,
      userAgent: actor.userAgent,
    });

    // Kirim notifikasi in-app ke seluruh pegawai aktif bahwa siklus evaluasi dibuka
    try {
      const activeUsers = await prisma.employee.findMany({
        where: {
          status: { in: ["ACTIVE", "PROBATION"] },
          deletedAt: null,
          userId: { not: null },
        },
        select: { userId: true },
      });

      const userIds = [
        ...new Set(activeUsers.map((u) => u.userId).filter(Boolean)),
      ] as string[];

      if (userIds.length > 0) {
        await prisma.notification.createMany({
          data: userIds.map((userId) => ({
            userId,
            title: "Periode Kinerja Dibuka",
            message: `Siklus evaluasi "${period.name}" telah dibuka. Harap menyusun sasaran riset & OKR Anda.`,
            type: "INFO",
            category: "PERFORMANCE",
            link: "/kinerja",
            isRead: false,
          })),
        });
      }
    } catch (notifErr) {
      console.error("Gagal mengirim notifikasi pembukaan periode kinerja:", notifErr);
    }

    revalidatePath("/kinerja");
    return { success: true, data: period };
  } catch (error) {
    console.error("Gagal membuat periode kinerja:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Terjadi kesalahan sistem saat membuat periode kinerja.",
    };
  }
}

/**
 * Server Action: Ubah Status Periode Kinerja (Buka / Kunci Periode)
 */
export async function updatePerformancePeriodStatusAction(rawData: unknown) {
  try {
    const actor = await getActorInfo();

    if (!actor.isSuperAdmin && !actor.isAdminHr) {
      return {
        success: false,
        error: "Anda tidak memiliki wewenang untuk mengubah status periode kinerja.",
      };
    }

    const validated = updatePerformancePeriodStatusSchema.safeParse(rawData);
    if (!validated.success) {
      const firstError = validated.error.issues[0]?.message || "Input tidak valid";
      return { success: false, error: firstError };
    }

    const existingPeriod = await prisma.performancePeriod.findUnique({
      where: { id: validated.data.id },
    });

    if (!existingPeriod) {
      return { success: false, error: "Periode evaluasi tidak ditemukan." };
    }

    const updated = await updatePerformancePeriodStatus(validated.data.id, validated.data.status);

    await writeAudit({
      actorUserId: actor.userId,
      actorEmail: actor.email,
      app: "hris",
      action: "UPDATE",
      entityType: "PerformancePeriodStatus",
      entityId: updated.id,
      before: { status: existingPeriod.status },
      after: { status: updated.status },
      ip: actor.ip,
      userAgent: actor.userAgent,
    });

    revalidatePath("/kinerja");
    return { success: true, data: updated };
  } catch (error) {
    console.error("Gagal mengubah status periode:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Terjadi kesalahan saat mengubah status periode.",
    };
  }
}

/**
 * Server Action: Finalisasi Nilai Kinerja Pegawai (Lock Score)
 */
export async function finalizePerformanceReviewAction(rawData: unknown) {
  try {
    const actor = await getActorInfo();

    if (!actor.isSuperAdmin && !actor.isAdminHr) {
      return {
        success: false,
        error: "Hanya Admin HR dan Pimpinan yang berwenang memfinalisasi nilai kinerja.",
      };
    }

    const validated = finalizePerformanceReviewSchema.safeParse(rawData);
    if (!validated.success) {
      const firstError = validated.error.issues[0]?.message || "Input tidak valid";
      return { success: false, error: firstError };
    }

    const existing = await prisma.performanceReview.findUnique({
      where: { id: validated.data.reviewId },
      include: {
        employee: { select: { fullName: true, employeeNo: true } },
      },
    });

    if (!existing) {
      return { success: false, error: "Data evaluasi kinerja tidak ditemukan." };
    }

    const updated = await finalizePerformanceReview(validated.data);

    await writeAudit({
      actorUserId: actor.userId,
      actorEmail: actor.email,
      app: "hris",
      action: "FINALIZE",
      entityType: "PerformanceReview",
      entityId: updated.id,
      before: {
        status: existing.status,
        finalScore: existing.finalScore ? Number(existing.finalScore) : null,
      },
      after: {
        status: updated.status,
        finalScore: Number(updated.finalScore),
        employee: existing.employee.fullName,
      },
      ip: actor.ip,
      userAgent: actor.userAgent,
    });

    // Kirim notifikasi in-app hasil penilaian ke pegawai terkait
    try {
      const emp = await prisma.employee.findUnique({
        where: { id: existing.employeeId },
        select: { userId: true },
      });

      if (emp?.userId) {
        await prisma.notification.create({
          data: {
            userId: emp.userId,
            title: "Evaluasi Kinerja Difinalisasi",
            message: `Penilaian kinerja Anda telah resmi disahkan dengan skor akhir ${updated.finalScore}.`,
            type: "SUCCESS",
            category: "PERFORMANCE",
            link: "/kinerja",
            isRead: false,
          },
        });
      }
    } catch (notifErr) {
      console.error("Gagal mengirim notifikasi finalisasi kinerja:", notifErr);
    }

    revalidatePath("/kinerja");
    return { success: true, data: updated };
  } catch (error) {
    console.error("Gagal memfinalisasi review:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Terjadi kesalahan saat memfinalisasi review kinerja.",
    };
  }
}

/**
 * Server Action: Ekspor Rekap Kinerja Pegawai (CSV)
 */
export async function exportPerformanceReportAction(periodId: string) {
  try {
    const actor = await getActorInfo();

    if (!actor.isSuperAdmin && !actor.isAdminHr) {
      return {
        success: false,
        error: "Anda tidak memiliki wewenang untuk mengekspor data evaluasi kinerja.",
      };
    }

    const result = await generatePerformanceExportCsv(periodId);

    await writeAudit({
      actorUserId: actor.userId,
      actorEmail: actor.email,
      app: "hris",
      action: "EXPORT",
      entityType: "PerformanceReport",
      entityId: periodId,
      after: { filename: result.filename },
      ip: actor.ip,
      userAgent: actor.userAgent,
    });

    return { success: true, data: result };
  } catch (error) {
    console.error("Gagal mengekspor laporan kinerja:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal mengekspor laporan kinerja.",
    };
  }
}
