"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSession, getAuthContext } from "@pspk/auth";
import { assertCan, can, AuthContext } from "@pspk/rbac";
import { prisma } from "@pspk/db";
import {
  checkInSchema,
  checkOutSchema,
  correctAttendanceSchema,
  CheckInInput,
  CheckOutInput,
  CorrectAttendanceInput,
} from "../schemas/attendance.schema";
import { recordCheckIn, recordCheckOut, correctAttendance } from "../services/attendance.service";

function formatErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof z.ZodError) {
    return err.issues[0]?.message || err.errors[0]?.message || "Input formulir tidak valid.";
  }
  return err instanceof Error ? err.message : fallback;
}

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
  let employeeId = authCtx.employeeId;
  if (!employeeId) {
    const employee = await prisma.employee.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    employeeId = employee?.id ?? null;
  }

  if (!employeeId && session.user.email) {
    const empByEmail = await prisma.employee.findFirst({
      where: {
        OR: [
          { workEmail: session.user.email },
          { personalEmail: session.user.email },
        ],
      },
      select: { id: true, userId: true },
    });
    if (empByEmail) {
      if (!empByEmail.userId) {
        await prisma.employee.update({
          where: { id: empByEmail.id },
          data: { userId: session.user.id },
        });
      }
      employeeId = empByEmail.id;
    }
  }

  if (!employeeId) {
    throw new Error("Akun Anda belum terhubung dengan data profil pegawai. Hubungi HR untuk menautkan akun.");
  }

  return {
    userId: session.user.id,
    userEmail: session.user.email || "system@pspk.id",
    employeeId,
    authCtx,
  };
}

/**
 * Server Action: Employee Check-In
 */
export async function checkInAction(input: CheckInInput) {
  try {
    const { userId, employeeId, authCtx } = await getAuthenticatedUser();
    assertCan(authCtx, "hris.attendance.checkin:own");

    const validated = checkInSchema.parse(input);
    const attendance = await recordCheckIn(employeeId, validated.notes, userId);

    revalidatePath("/absensi");
    revalidatePath("/absensi/rekap");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: "Check-in berhasil dicatat!",
      data: attendance,
    };
  } catch (err) {
    return {
      success: false,
      message: formatErrorMessage(err, "Gagal melakukan check-in."),
    };
  }
}

/**
 * Server Action: Employee Check-Out
 */
export async function checkOutAction(input: CheckOutInput) {
  try {
    const { userId, employeeId, authCtx } = await getAuthenticatedUser();
    assertCan(authCtx, "hris.attendance.checkin:own");

    const validated = checkOutSchema.parse(input);
    const attendance = await recordCheckOut(employeeId, validated.notes, userId);

    revalidatePath("/absensi");
    revalidatePath("/absensi/rekap");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: "Check-out berhasil dicatat!",
      data: attendance,
    };
  } catch (err) {
    return {
      success: false,
      message: formatErrorMessage(err, "Gagal melakukan check-out."),
    };
  }
}

/**
 * Server Action: HR Attendance Correction
 */
export async function correctAttendanceAction(input: CorrectAttendanceInput) {
  try {
    const { userId, authCtx } = await getAuthenticatedUser();
    assertCan(authCtx, "hris.attendance.correct:all");

    const validated = correctAttendanceSchema.parse(input);
    const updated = await correctAttendance(validated, userId);

    revalidatePath("/absensi");
    revalidatePath("/absensi/rekap");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: "Koreksi data presensi berhasil disimpan!",
      data: updated,
    };
  } catch (err) {
    return {
      success: false,
      message: formatErrorMessage(err, "Gagal menyimpan koreksi presensi."),
    };
  }
}

/**
 * Server Action: Log Attendance Rekap Export Audit
 */
export async function logAttendanceExportAction(params: {
  year: number;
  month: number;
  departmentId?: string;
  totalEmployees: number;
}) {
  try {
    const { userId, userEmail, authCtx } = await getAuthenticatedUser();
    const canViewAll = can(authCtx, "hris.attendance.read:all");
    const canViewTeam = can(authCtx, "hris.attendance.read:team");

    if (!canViewAll && !canViewTeam) {
      throw new Error("Anda tidak memiliki izin untuk mengekspor data presensi.");
    }

    const { writeAudit } = await import("@pspk/db");
    await writeAudit({
      actorUserId: userId,
      actorEmail: userEmail,
      app: "hris",
      action: "EXPORT",
      entityType: "Attendance",
      after: {
        year: params.year,
        month: params.month,
        departmentId: params.departmentId || "ALL",
        totalExported: params.totalEmployees,
      },
    });

    return { success: true };
  } catch (err) {
    console.error("Gagal mencatat audit log ekspor presensi:", err);
    return { success: false };
  }
}
