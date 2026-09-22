"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getSession, getAuthContext } from "@pspk/auth";
import { assertCan, can, AuthContext } from "@pspk/rbac";
import { prisma } from "@pspk/db";
import {
  createLeaveRequestSchema,
  approveLeaveRequestSchema,
  rejectLeaveRequestSchema,
  cancelLeaveRequestSchema,
  createHolidaySchema,
  updateLeaveTypeSchema,
  CreateLeaveRequestInput,
  ApproveLeaveRequestInput,
  RejectLeaveRequestInput,
  CancelLeaveRequestInput,
  CreateHolidayInput,
  UpdateLeaveTypeInput,
} from "../schemas/leave.schema";
import {
  submitLeaveRequest,
  approveLeaveRequest,
  rejectLeaveRequest,
  cancelLeaveRequest,
} from "../services/leave.service";

async function getAuthenticatedUser(): Promise<{
  userId: string;
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

    revalidatePath("/cuti");
    revalidatePath("/cuti/persetujuan");
    revalidatePath("/cuti/kalender");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: "Permohonan cuti berhasil diajukan dan sedang menunggu persetujuan!",
      data: request,
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

    revalidatePath("/cuti");
    revalidatePath("/cuti/persetujuan");
    revalidatePath("/cuti/kalender");
    revalidatePath("/absensi");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: "Permohonan cuti telah disetujui, saldo dipotong, dan presensi dicatat.",
      data: approved,
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

    revalidatePath("/cuti");
    revalidatePath("/cuti/persetujuan");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: "Permohonan cuti telah ditolak.",
      data: rejected,
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
    revalidatePath("/cuti/kalender");
    revalidatePath("/absensi");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: "Permohonan cuti berhasil dibatalkan.",
      data: cancelled,
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
    revalidatePath("/cuti/kalender");
    revalidatePath("/cuti/ajukan");

    return {
      success: true,
      message: "Hari libur berhasil ditambahkan ke kalender!",
      data: holiday,
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
