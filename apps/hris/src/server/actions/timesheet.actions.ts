"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma, writeAudit } from "@pspk/db";
import { getSession, getAuthContext } from "@pspk/auth";
import { extractClientIp } from "@pspk/shared";
import { createNotification } from "@/server/services/notification.service";

const SubmitTimesheetSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Judul pengajuan minimal 3 karakter.")
    .max(150, "Judul pengajuan maksimal 150 karakter."),
  periodMonth: z.number().int().min(1).max(12),
  periodYear: z.number().int().min(2020).max(2035),
  spreadsheetUrl: z
    .string()
    .trim()
    .url("Link Google Spreadsheet harus berupa URL yang valid (diawali https://).")
    .refine(
      (url) => url.startsWith("https://") || url.startsWith("http://"),
      "Link harus berupa tautan web yang valid.",
    ),
  totalHours: z
    .number()
    .positive("Jumlah jam kerja harus lebih besar dari 0.")
    .max(720, "Jumlah jam kerja tidak realistis (maksimal 720 jam per bulan)."),
  reviewerIds: z
    .array(z.string().uuid("ID atasan penilai tidak valid."))
    .min(1, "Pilih minimal 1 atasan penilai."),
  description: z.string().trim().max(1000, "Deskripsi maksimal 1000 karakter.").optional(),
});

export type SubmitTimesheetInput = z.infer<typeof SubmitTimesheetSchema>;

async function getActor() {
  const reqHeaders = await headers();
  const session = await getSession(reqHeaders);

  if (!session?.user) {
    throw new Error("Sesi Anda telah kedaluwarsa. Silakan masuk kembali.");
  }

  const authCtx = await getAuthContext(session.user.id);
  if (!authCtx || !authCtx.employeeId) {
    throw new Error("Akun Anda belum ditautkan ke data karyawan PSPK.");
  }

  const ip = extractClientIp(reqHeaders);
  const userAgent = reqHeaders.get("user-agent") || "unknown";

  return {
    userId: session.user.id,
    email: session.user.email,
    employeeId: authCtx.employeeId,
    ip,
    userAgent,
  };
}

/**
 * Server Action: Mengajukan timesheet baru oleh staf freelance
 */
export async function submitTimesheetAction(rawInput: SubmitTimesheetInput) {
  try {
    const actor = await getActor();
    const validated = SubmitTimesheetSchema.parse(rawInput);

    // Cek apakah staf memilih dirinya sendiri sebagai reviewer
    if (validated.reviewerIds.includes(actor.employeeId)) {
      return {
        ok: false as const,
        error: "Anda tidak dapat memilih diri Anda sendiri sebagai atasan penilai.",
      };
    }

    // Cek apakah sudah ada pengajuan timesheet berstatus APPROVED pada periode bulan/tahun yang sama
    const existingApproved = await prisma.timesheetSubmission.findFirst({
      where: {
        employeeId: actor.employeeId,
        periodYear: validated.periodYear,
        periodMonth: validated.periodMonth,
        status: "APPROVED",
      },
    });

    if (existingApproved) {
      return {
        ok: false as const,
        error: `Timesheet untuk periode ${validated.periodMonth}/${validated.periodYear} sudah disetujui sebelumnya.`,
      };
    }

    // Ambil data atasan terpilih untuk validasi & notifikasi
    const reviewersWithUser = await prisma.employee.findMany({
      where: {
        id: { in: validated.reviewerIds },
        status: "ACTIVE",
      },
      select: {
        id: true,
        userId: true,
        fullName: true,
      },
    });

    if (reviewersWithUser.length !== validated.reviewerIds.length) {
      return {
        ok: false as const,
        error: "Satu atau lebih atasan penilai yang dipilih tidak aktif atau tidak ditemukan.",
      };
    }

    // Simpan ke dalam Database dalam Prisma Transaction
    const submission = await prisma.$transaction(async (tx) => {
      const created = await tx.timesheetSubmission.create({
        data: {
          employeeId: actor.employeeId,
          periodMonth: validated.periodMonth,
          periodYear: validated.periodYear,
          title: validated.title,
          spreadsheetUrl: validated.spreadsheetUrl,
          totalHours: validated.totalHours,
          description: validated.description || null,
          status: "PENDING",
          reviewers: {
            create: validated.reviewerIds.map((reviewerId) => ({
              reviewerId,
              status: "PENDING",
            })),
          },
        },
        include: {
          employee: { select: { fullName: true, employeeNo: true } },
        },
      });

      // Audit Log
      await writeAudit({
        actorUserId: actor.userId,
        actorEmail: actor.email,
        app: "hris",
        action: "CREATE",
        entityType: "TimesheetSubmission",
        entityId: created.id,
        after: {
          title: created.title,
          totalHours: validated.totalHours,
          period: `${created.periodMonth}/${created.periodYear}`,
          reviewersCount: validated.reviewerIds.length,
        },
        ip: actor.ip,
        userAgent: actor.userAgent,
      });

      return created;
    });

    // Kirim notifikasi in-app ke seluruh atasan yang dipilih
    for (const r of reviewersWithUser) {
      if (r.userId) {
        await createNotification({
          userId: r.userId,
          title: "Pengajuan Timesheet Baru Menunggu Peninjauan",
          message: `${submission.employee.fullName} mengajukan "${submission.title}" (${validated.totalHours} jam kerja) dan meminta review Anda.`,
          type: "ACTION_REQUIRED",
          category: "ATTENDANCE",
          link: `/timesheet/persetujuan?submissionId=${submission.id}`,
        });
      }
    }

    revalidatePath("/timesheet");
    revalidatePath("/timesheet/persetujuan");

    return {
      ok: true as const,
      data: { id: submission.id },
    };
  } catch (err: unknown) {
    console.error("Gagal mengajukan timesheet:", err);
    if (err instanceof z.ZodError) {
      return { ok: false as const, error: err.issues[0]?.message || "Data formulir tidak valid." };
    }
    return {
      ok: false as const,
      error:
        err instanceof Error ? err.message : "Terjadi kesalahan sistem saat menyimpan pengajuan.",
    };
  }
}

/**
 * Server Action: Membatalkan pengajuan timesheet (hanya jika masih PENDING)
 */
export async function cancelTimesheetSubmissionAction(submissionId: string) {
  try {
    const actor = await getActor();

    const submission = await prisma.timesheetSubmission.findUnique({
      where: { id: submissionId },
      include: { reviewers: true },
    });

    if (!submission) {
      return { ok: false as const, error: "Pengajuan timesheet tidak ditemukan." };
    }

    if (submission.employeeId !== actor.employeeId) {
      return {
        ok: false as const,
        error: "Anda tidak memiliki hak untuk membatalkan pengajuan ini.",
      };
    }

    if (submission.status !== "PENDING" && submission.status !== "REVISION_REQUESTED") {
      return {
        ok: false as const,
        error:
          "Hanya timesheet dengan status Menunggu (Pending) atau Perlu Revisi yang dapat dibatalkan.",
      };
    }

    await prisma.$transaction(async (tx) => {
      await tx.timesheetSubmission.delete({
        where: { id: submissionId },
      });

      await writeAudit({
        actorUserId: actor.userId,
        actorEmail: actor.email,
        app: "hris",
        action: "DELETE",
        entityType: "TimesheetSubmission",
        entityId: submissionId,
        before: { title: submission.title, totalHours: Number(submission.totalHours) },
        ip: actor.ip,
        userAgent: actor.userAgent,
      });
    });

    revalidatePath("/timesheet");
    return { ok: true as const };
  } catch (err: unknown) {
    console.error("Gagal membatalkan timesheet:", err);
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Gagal membatalkan pengajuan timesheet.",
    };
  }
}

/**
 * Server Action: Atasan mulai mereview timesheet (mengubah status reviewer & submission menjadi IN_REVIEW)
 */
export async function startTimesheetReviewAction(submissionId: string) {
  try {
    const actor = await getActor();

    // Pastikan actor adalah reviewer yang ditugaskan
    const reviewerRecord = await prisma.timesheetReviewer.findFirst({
      where: {
        submissionId,
        reviewerId: actor.employeeId,
      },
      include: {
        submission: {
          include: {
            employee: {
              select: {
                id: true,
                fullName: true,
                userId: true,
              },
            },
          },
        },
        reviewer: {
          select: {
            fullName: true,
          },
        },
      },
    });

    if (!reviewerRecord) {
      return {
        ok: false as const,
        error: "Anda tidak terdaftar sebagai atasan penilai untuk pengajuan timesheet ini.",
      };
    }

    if (reviewerRecord.status !== "PENDING") {
      return {
        ok: true as const,
        message: "Status review Anda sudah berjalan atau telah diselesaikan.",
      };
    }

    await prisma.$transaction(async (tx) => {
      // Update status reviewer menjadi IN_REVIEW
      await tx.timesheetReviewer.update({
        where: { id: reviewerRecord.id },
        data: {
          status: "IN_REVIEW",
          actionAt: new Date(),
        },
      });

      // Update parent submission menjadi IN_REVIEW jika sebelumnya PENDING
      if (reviewerRecord.submission.status === "PENDING") {
        await tx.timesheetSubmission.update({
          where: { id: submissionId },
          data: {
            status: "IN_REVIEW",
          },
        });
      }

      await writeAudit({
        actorUserId: actor.userId,
        actorEmail: actor.email,
        app: "hris",
        action: "UPDATE",
        entityType: "TimesheetReviewer",
        entityId: reviewerRecord.id,
        before: { status: reviewerRecord.status },
        after: { status: "IN_REVIEW" },
        ip: actor.ip,
        userAgent: actor.userAgent,
      });
    });

    // Kirim notifikasi ke karyawan pengaju
    if (reviewerRecord.submission.employee.userId) {
      await createNotification({
        userId: reviewerRecord.submission.employee.userId,
        title: "Timesheet Sedang Direview",
        message: `Atasan ${reviewerRecord.reviewer.fullName} mulai memeriksa timesheet "${reviewerRecord.submission.title}".`,
        type: "INFO",
        category: "PAYROLL",
        link: "/timesheet",
      });
    }

    revalidatePath("/timesheet/persetujuan");
    revalidatePath("/timesheet");

    return { ok: true as const };
  } catch (err: unknown) {
    console.error("Gagal memulai review timesheet:", err);
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Gagal memulai proses review timesheet.",
    };
  }
}

const SubmitReviewDecisionSchema = z.object({
  submissionId: z.string().uuid("ID pengajuan tidak valid."),
  decision: z.enum(["APPROVE", "REJECT"]),
  notes: z.string().trim().max(1000, "Catatan maksimal 1000 karakter.").optional(),
});

export type SubmitReviewDecisionInput = z.infer<typeof SubmitReviewDecisionSchema>;

/**
 * Server Action: Atasan memberikan keputusan (ACC atau Tolak) atas timesheet staf
 */
export async function submitReviewDecisionAction(input: SubmitReviewDecisionInput) {
  try {
    const actor = await getActor();
    const validated = SubmitReviewDecisionSchema.parse(input);

    if (
      validated.decision === "REJECT" &&
      (!validated.notes || validated.notes.trim().length < 5)
    ) {
      return {
        ok: false as const,
        error: "Mohon sertakan catatan alasan penolakan/revisi minimal 5 karakter.",
      };
    }

    // Pastikan actor adalah reviewer yang ditugaskan
    const reviewerRecord = await prisma.timesheetReviewer.findFirst({
      where: {
        submissionId: validated.submissionId,
        reviewerId: actor.employeeId,
      },
      include: {
        submission: {
          include: {
            employee: {
              select: {
                id: true,
                fullName: true,
                userId: true,
              },
            },
          },
        },
        reviewer: {
          select: {
            fullName: true,
          },
        },
      },
    });

    if (!reviewerRecord) {
      return {
        ok: false as const,
        error: "Anda tidak terdaftar sebagai atasan penilai untuk pengajuan timesheet ini.",
      };
    }

    const newReviewerStatus = validated.decision === "APPROVE" ? "APPROVED" : "REJECTED";
    const now = new Date();

    let finalSubmissionStatus: "APPROVED" | "REJECTED" | "IN_REVIEW" = "IN_REVIEW";
    let isFullyApproved = false;

    await prisma.$transaction(async (tx) => {
      // 1. Update status reviewer aktif
      await tx.timesheetReviewer.update({
        where: { id: reviewerRecord.id },
        data: {
          status: newReviewerStatus,
          notes: validated.notes?.trim() || null,
          reviewedAt: now,
          actionAt: now,
        },
      });

      // 2. Ambil seluruh reviewer untuk evaluasi status konsolidasi
      const allReviewers = await tx.timesheetReviewer.findMany({
        where: { submissionId: validated.submissionId },
      });

      const hasRejection = allReviewers.some(
        (r) => (r.id === reviewerRecord.id ? newReviewerStatus : r.status) === "REJECTED",
      );

      const allApproved = allReviewers.every(
        (r) => (r.id === reviewerRecord.id ? newReviewerStatus : r.status) === "APPROVED",
      );

      if (hasRejection) {
        finalSubmissionStatus = "REJECTED";
      } else if (allApproved) {
        finalSubmissionStatus = "APPROVED";
        isFullyApproved = true;
      } else {
        finalSubmissionStatus = "IN_REVIEW";
      }

      await tx.timesheetSubmission.update({
        where: { id: validated.submissionId },
        data: {
          status: finalSubmissionStatus,
          approvedAt: isFullyApproved ? now : null,
        },
      });

      await writeAudit({
        actorUserId: actor.userId,
        actorEmail: actor.email,
        app: "hris",
        action: "UPDATE",
        entityType: "TimesheetSubmission",
        entityId: validated.submissionId,
        before: {
          reviewerStatus: reviewerRecord.status,
          submissionStatus: reviewerRecord.submission.status,
        },
        after: {
          reviewerStatus: newReviewerStatus,
          submissionStatus: finalSubmissionStatus,
          notes: validated.notes,
        },
        ip: actor.ip,
        userAgent: actor.userAgent,
      });
    });

    // 3. Notifikasi ke staf pengaju
    if (reviewerRecord.submission.employee.userId) {
      if (validated.decision === "APPROVE") {
        if (isFullyApproved) {
          await createNotification({
            userId: reviewerRecord.submission.employee.userId,
            title: "Timesheet Disetujui Sepenuhnya (ACC)",
            message: `Kabar baik! Timesheet "${reviewerRecord.submission.title}" telah disetujui oleh seluruh atasan penilai dan siap diproses ke payroll.`,
            type: "SUCCESS",
            category: "PAYROLL",
            link: "/timesheet",
          });
        } else {
          await createNotification({
            userId: reviewerRecord.submission.employee.userId,
            title: "Timesheet Disetujui (Menunggu Atasan Lain)",
            message: `Atasan ${reviewerRecord.reviewer.fullName} telah menyetujui timesheet "${reviewerRecord.submission.title}". Masih menunggu atasan penilai lainnya.`,
            type: "INFO",
            category: "PAYROLL",
            link: "/timesheet",
          });
        }
      } else {
        await createNotification({
          userId: reviewerRecord.submission.employee.userId,
          title: "Timesheet Ditolak / Perlu Perbaikan",
          message: `Atasan ${reviewerRecord.reviewer.fullName} menolak timesheet "${reviewerRecord.submission.title}". Catatan: ${validated.notes || "-"}`,
          type: "WARNING",
          category: "PAYROLL",
          link: "/timesheet",
        });
      }
    }

    revalidatePath("/timesheet/persetujuan");
    revalidatePath("/timesheet");
    revalidatePath("/payroll");

    return {
      ok: true as const,
      data: {
        reviewerStatus: newReviewerStatus,
        submissionStatus: finalSubmissionStatus,
        isFullyApproved,
      },
    };
  } catch (err: unknown) {
    console.error("Gagal memproses persetujuan timesheet:", err);
    if (err instanceof z.ZodError) {
      return { ok: false as const, error: err.issues[0]?.message || "Input tidak valid." };
    }
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Gagal memproses keputusan review.",
    };
  }
}
