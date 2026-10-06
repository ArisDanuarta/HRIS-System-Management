"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getSession, getAuthContext } from "@pspk/auth";
import { assertCan, can, AuthContext } from "@pspk/rbac";
import { prisma } from "@pspk/db";
import { getStorageProvider } from "@pspk/storage";
import { calculateAdjustedLeaveQuota } from "@pspk/shared";
import {
  createLeaveRequestSchema,
  approveLeaveRequestSchema,
  rejectLeaveRequestSchema,
  cancelLeaveRequestSchema,
  createHolidaySchema,
  updateLeaveTypeSchema,
  overrideLeaveDecisionSchema,
  CreateLeaveRequestInput,
  ApproveLeaveRequestInput,
  RejectLeaveRequestInput,
  CancelLeaveRequestInput,
  CreateHolidayInput,
  UpdateLeaveTypeInput,
  OverrideLeaveDecisionInput,
} from "../schemas/leave.schema";
import {
  submitLeaveRequest,
  approveLeaveRequest,
  rejectLeaveRequest,
  cancelLeaveRequest,
  overrideLeaveDecision,
} from "../services/leave.service";
import {
  createNotification,
  createNotificationForRole,
  createNotificationForEmployeeManager,
} from "../services/notification.service";

async function getAuthenticatedUser(): Promise<{
  userId: string;
  userEmail: string;
  employeeId: string;
  authCtx: AuthContext;
}> {
  const reqHeaders = await headers();
  const session = await getSession(reqHeaders);

  if (!session?.user) {
    throw new Error("Sesi Anda telah kedaluwarsa. Silakan masuk kembali.");
  }

  const authCtx = await getAuthContext(session.user.id);
  if (!authCtx) {
    throw new Error("Pengguna tidak aktif atau hak akses tidak valid.");
  }

  // Find linked employee
  let employee = await prisma.employee.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  // Fallback for dev / admin without direct employee linkage
  if (!employee) {
    const firstEmp = await prisma.employee.findFirst({
      where: { deletedAt: null },
      select: { id: true },
    });
    if (firstEmp) {
      employee = firstEmp;
    } else {
      throw new Error("Data profil pegawai Anda tidak ditemukan dalam sistem.");
    }
  }

  return {
    userId: session.user.id,
    userEmail: session.user.email || "system@pspk.id",
    employeeId: employee.id,
    authCtx,
  };
}

/**
 * Server Action: Submit Leave Request
 */
export async function submitLeaveRequestAction(input: CreateLeaveRequestInput) {
  try {
    const { userId, employeeId, authCtx } = await getAuthenticatedUser();
    assertCan(authCtx, "hris.leave.create:own");

    const validated = createLeaveRequestSchema.parse(input);
    const request = await submitLeaveRequest(employeeId, validated, userId);

    // Kirim notifikasi in-app ke atasan langsung dan tim Admin HR
    try {
      const emp = await prisma.employee.findUnique({
        where: { id: employeeId },
        select: { fullName: true },
      });
      const empName = emp?.fullName || "Pegawai";

      await Promise.all([
        createNotificationForEmployeeManager(employeeId, {
          title: "Pengajuan Cuti Baru",
          message: `${empName} mengajukan permohonan cuti baru. Silakan tinjau di portal persetujuan.`,
          type: "ACTION_REQUIRED",
          category: "LEAVE",
          link: "/cuti/persetujuan",
        }),
        createNotificationForRole("admin_hr", {
          title: "Permohonan Cuti Masuk",
          message: `${empName} mengajukan permohonan cuti baru.`,
          type: "INFO",
          category: "LEAVE",
          link: "/cuti/persetujuan",
        }),
      ]);
    } catch (notifErr) {
      console.error("Gagal mengirim notifikasi cuti:", notifErr);
    }

    revalidatePath("/cuti");
    revalidatePath("/cuti/persetujuan");
    revalidatePath("/kalender");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: "Permohonan cuti berhasil diajukan dan sedang menunggu persetujuan!",
      data: {
        id: request.id,
        days: Number(request.days),
        status: request.status,
      },
    };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Gagal mengajukan permohonan cuti.",
    };
  }
}

/**
 * Server Action: Approve Leave Request
 */
export async function approveLeaveRequestAction(input: ApproveLeaveRequestInput) {
  try {
    const { userId, employeeId, authCtx } = await getAuthenticatedUser();
    
    // Must have either all-approval (HR) or team-approval (Manager)
    const canApproveAll = can(authCtx, "hris.leave.approve:all");
    const canApproveTeam = can(authCtx, "hris.leave.approve:team");

    if (!canApproveAll && !canApproveTeam) {
      throw new Error("Anda tidak memiliki izin otorisasi untuk menyetujui cuti.");
    }

    const validated = approveLeaveRequestSchema.parse(input);
    const approved = await approveLeaveRequest(
      validated.leaveRequestId,
      userId,
      employeeId,
      validated.decisionNote,
    );

    // Kirim notifikasi ke pegawai pemohon
    try {
      const leaveReq = await prisma.leaveRequest.findUnique({
        where: { id: validated.leaveRequestId },
        include: {
          employee: { select: { userId: true } },
          leaveType: { select: { name: true } },
        },
      });

      if (leaveReq?.employee?.userId) {
        await createNotification({
          userId: leaveReq.employee.userId,
          title: "Pengajuan Cuti Disetujui",
          message: `Permohonan cuti (${leaveReq.leaveType.name}) Anda telah disetujui.`,
          type: "SUCCESS",
          category: "LEAVE",
          link: "/cuti",
        });
      }
    } catch (notifErr) {
      console.error("Gagal mengirim notifikasi persetujuan cuti:", notifErr);
    }

    revalidatePath("/cuti");
    revalidatePath("/cuti/persetujuan");
    revalidatePath("/kalender");
    revalidatePath("/absensi");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: "Permohonan cuti telah disetujui, saldo dipotong, dan presensi dicatat.",
      data: {
        id: approved.id,
        days: Number(approved.days),
        status: approved.status,
      },
    };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Gagal menyetujui permohonan cuti.",
    };
  }
}

/**
 * Server Action: Reject Leave Request
 */
export async function rejectLeaveRequestAction(input: RejectLeaveRequestInput) {
  try {
    const { userId, employeeId, authCtx } = await getAuthenticatedUser();

    const canApproveAll = can(authCtx, "hris.leave.approve:all");
    const canApproveTeam = can(authCtx, "hris.leave.approve:team");

    if (!canApproveAll && !canApproveTeam) {
      throw new Error("Anda tidak memiliki izin otorisasi untuk memproses penolakan cuti.");
    }

    const validated = rejectLeaveRequestSchema.parse(input);
    const rejected = await rejectLeaveRequest(
      validated.leaveRequestId,
      userId,
      employeeId,
      validated.decisionNote,
    );

    // Kirim notifikasi ke pegawai pemohon
    try {
      const leaveReq = await prisma.leaveRequest.findUnique({
        where: { id: validated.leaveRequestId },
        include: {
          employee: { select: { userId: true } },
          leaveType: { select: { name: true } },
        },
      });

      if (leaveReq?.employee?.userId) {
        await createNotification({
          userId: leaveReq.employee.userId,
          title: "Pengajuan Cuti Ditolak",
          message: `Permohonan cuti (${leaveReq.leaveType.name}) Anda ditolak. Catatan: ${validated.decisionNote || "-"}`,
          type: "WARNING",
          category: "LEAVE",
          link: "/cuti",
        });
      }
    } catch (notifErr) {
      console.error("Gagal mengirim notifikasi penolakan cuti:", notifErr);
    }

    revalidatePath("/cuti");
    revalidatePath("/cuti/persetujuan");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: "Permohonan cuti telah ditolak.",
      data: {
        id: rejected.id,
        days: Number(rejected.days),
        status: rejected.status,
      },
    };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Gagal menolak permohonan cuti.",
    };
  }
}

/**
 * Server Action: Cancel Leave Request
 */
export async function cancelLeaveRequestAction(input: CancelLeaveRequestInput) {
  try {
    const { userId, authCtx } = await getAuthenticatedUser();
    
    // Check permission
    assertCan(authCtx, "hris.leave.cancel:own");

    const validated = cancelLeaveRequestSchema.parse(input);
    const cancelled = await cancelLeaveRequest(
      validated.leaveRequestId,
      userId,
      validated.cancellationReason,
    );

    revalidatePath("/cuti");
    revalidatePath("/cuti/persetujuan");
    revalidatePath("/kalender");
    revalidatePath("/absensi");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: "Permohonan cuti berhasil dibatalkan.",
      data: {
        id: cancelled.id,
        days: Number(cancelled.days),
        status: cancelled.status,
      },
    };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Gagal membatalkan permohonan cuti.",
    };
  }
}

/**
 * Server Action: Add Holiday (HR Setting)
 */
export async function createHolidayAction(input: CreateHolidayInput) {
  try {
    const { authCtx } = await getAuthenticatedUser();
    assertCan(authCtx, "hris.leave.configure:all");

    const validated = createHolidaySchema.parse(input);
    const holidayDate = new Date(validated.date);

    const holiday = await prisma.holiday.upsert({
      where: { date: holidayDate },
      update: {
        name: validated.name,
        isCollectiveLeave: validated.isCollectiveLeave,
      },
      create: {
        date: holidayDate,
        name: validated.name,
        isCollectiveLeave: validated.isCollectiveLeave,
      },
    });

    revalidatePath("/cuti/pengaturan");
    revalidatePath("/kalender");
    revalidatePath("/cuti/ajukan");

    return {
      success: true,
      message: "Hari libur berhasil ditambahkan ke kalender!",
      data: {
        id: holiday.id,
        date: holiday.date.toISOString().split("T")[0]!,
        name: holiday.name,
      },
    };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Gagal menambahkan hari libur.",
    };
  }
}

/**
 * Server Action: Update Leave Type Quota (HR Setting)
 */
export async function updateLeaveTypeAction(input: UpdateLeaveTypeInput) {
  try {
    const { authCtx } = await getAuthenticatedUser();
    assertCan(authCtx, "hris.leave.configure:all");

    const validated = updateLeaveTypeSchema.parse(input);

    const updated = await prisma.leaveType.update({
      where: { id: validated.id },
      data: {
        name: validated.name,
        defaultQuotaDays: validated.defaultQuotaDays,
        isPaid: validated.isPaid,
        requiresAttachment: validated.requiresAttachment,
        isActive: validated.isActive,
      },
    });

    revalidatePath("/cuti/pengaturan");
    revalidatePath("/cuti");
    revalidatePath("/cuti/ajukan");

    return {
      success: true,
      message: "Konfigurasi jenis cuti berhasil diperbarui!",
      data: updated,
    };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Gagal memperbarui konfigurasi cuti.",
    };
  }
}

/**
 * Server Action: Upload Leave Attachment File (Surat Keterangan Dokter / Dokumen Pendukung)
 */
export async function uploadLeaveAttachmentAction(formData: FormData) {
  try {
    const { employeeId } = await getAuthenticatedUser();
    const file = formData.get("file") as File | null;

    if (!file || file.size === 0) {
      return { success: false, message: "Berkas tidak ditemukan atau kosong." };
    }

    // Allowed mime types & extensions: PDF, JPG, PNG, WEBP
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];
    const isAllowedExt = /\.(pdf|jpg|jpeg|png|webp)$/i.test(file.name);
    if (!allowedTypes.includes(file.type) && !isAllowedExt) {
      return {
        success: false,
        message: "Format berkas tidak didukung. Harap unggah berkas bertipe PDF, JPG, atau PNG.",
      };
    }

    // 10 MB limit
    const maxSizeBytes = 10 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return {
        success: false,
        message: "Ukuran berkas melebihi batas maksimal 10 MB.",
      };
    }

    const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const storageKey = `cuti/lampiran/${employeeId}_${Date.now()}_${safeFileName}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const storage = getStorageProvider();
    const contentType = file.type || (file.name.toLowerCase().endsWith(".pdf") ? "application/pdf" : "image/jpeg");
    await storage.put(storageKey, buffer, { contentType });

    return {
      success: true,
      message: "Berkas lampiran berhasil diunggah.",
      key: storageKey,
      fileName: file.name,
      fileSize: file.size,
    };
  } catch (err) {
    console.error("uploadLeaveAttachmentAction error:", err);
    return {
      success: false,
      message: err instanceof Error ? err.message : "Gagal mengunggah berkas lampiran.",
    };
  }
}

/**
 * Server Action: Adjust Employee Leave Balance (Admin HR / Super Admin)
 */
export async function adjustEmployeeLeaveBalanceAction(input: {
  employeeId: string;
  leaveTypeId: string;
  year: number;
  mode: "ADD" | "DEDUCT" | "SET";
  amount: number;
  reason: string;
}) {
  try {
    const { userId, userEmail, authCtx } = await getAuthenticatedUser();
    assertCan(authCtx, "hris.leave.configure:all");

    if (!input.amount || input.amount <= 0) {
      return { success: false, message: "Nominal hari harus berupa angka positif lebih dari 0." };
    }

    if (!input.reason || input.reason.trim().length < 5) {
      return { success: false, message: "Alasan penyesuaian wajib diisi (minimal 5 karakter)." };
    }

    // Cari atau buat saldo cuti pegawai
    const existing = await prisma.leaveBalance.findUnique({
      where: {
        employeeId_leaveTypeId_year: {
          employeeId: input.employeeId,
          leaveTypeId: input.leaveTypeId,
          year: input.year,
        },
      },
    });

    const leaveType = await prisma.leaveType.findUnique({
      where: { id: input.leaveTypeId },
      select: { name: true, defaultQuotaDays: true },
    });

    const currentQuota = existing ? existing.quotaDays : (leaveType?.defaultQuotaDays || 12);
    const currentUsed = existing ? Number(existing.usedDays) : 0;

    const newQuota = calculateAdjustedLeaveQuota(
      currentQuota,
      currentUsed,
      input.mode,
      input.amount,
    );

    const updated = await prisma.leaveBalance.upsert({
      where: {
        employeeId_leaveTypeId_year: {
          employeeId: input.employeeId,
          leaveTypeId: input.leaveTypeId,
          year: input.year,
        },
      },
      create: {
        employeeId: input.employeeId,
        leaveTypeId: input.leaveTypeId,
        year: input.year,
        quotaDays: newQuota,
        usedDays: 0,
      },
      update: {
        quotaDays: newQuota,
      },
      include: {
        employee: { select: { fullName: true, employeeNo: true } },
        leaveType: { select: { name: true } },
      },
    });

    const { writeAudit } = await import("@pspk/db");
    await writeAudit({
      actorUserId: userId,
      actorEmail: userEmail,
      app: "hris",
      action: "UPDATE",
      entityType: "LeaveBalance",
      entityId: updated.id,
      before: {
        quotaDays: currentQuota,
        usedDays: currentUsed,
      },
      after: {
        quotaDays: newQuota,
        mode: input.mode,
        amount: input.amount,
        reason: input.reason.trim(),
        employeeName: updated.employee.fullName,
      },
    });

    revalidatePath("/cuti");
    revalidatePath("/cuti/pengaturan");

    return {
      success: true,
      message: `Berhasil menyesuaikan kuota cuti ${updated.employee.fullName} menjadi ${newQuota} hari.`,
      data: updated,
    };
  } catch (err) {
    console.error("adjustEmployeeLeaveBalanceAction error:", err);
    return {
      success: false,
      message: err instanceof Error ? err.message : "Gagal menyesuaikan saldo cuti.",
    };
  }
}

/**
 * Server Action: Override Leave Request Decision (Super Admin / Admin HR only)
 */
export async function overrideLeaveDecisionAction(input: OverrideLeaveDecisionInput) {
  try {
    const { userId, userEmail, employeeId, authCtx } = await getAuthenticatedUser();
    assertCan(authCtx, "hris.leave.configure:all");

    const validated = overrideLeaveDecisionSchema.parse(input);

    const updated = await overrideLeaveDecision({
      leaveRequestId: validated.leaveRequestId,
      targetStatus: validated.targetStatus,
      overrideReason: validated.overrideReason,
      adminUserId: userId,
      adminEmail: userEmail,
      adminEmployeeId: employeeId,
    });

    revalidatePath("/cuti");
    revalidatePath("/cuti/persetujuan");
    revalidatePath("/cuti/pengaturan");
    revalidatePath("/absensi");

    return {
      success: true,
      message: `Status permohonan cuti ${updated.employee?.fullName || "pegawai"} berhasil diubah menjadi ${validated.targetStatus}.`,
      data: updated,
    };
  } catch (err) {
    console.error("overrideLeaveDecisionAction error:", err);
    return {
      success: false,
      message: err instanceof Error ? err.message : "Gagal melakukan koreksi/override keputusan cuti.",
    };
  }
}


