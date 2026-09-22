"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getSession, getAuthContext } from "@pspk/auth";
import { assertCan, AuthContext } from "@pspk/rbac";
import { prisma } from "@pspk/db";
import {
  checkInSchema,
  checkOutSchema,
  correctAttendanceSchema,
  CheckInInput,
  CheckOutInput,
  CorrectAttendanceInput,
} from "../schemas/attendance.schema";
import {
  recordCheckIn,
  recordCheckOut,
  correctAttendance,
} from "../services/attendance.service";

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
      message: err instanceof Error ? err.message : "Gagal melakukan check-in.",
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
      message: err instanceof Error ? err.message : "Gagal melakukan check-out.",
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
      message: err instanceof Error ? err.message : "Gagal menyimpan koreksi presensi.",
    };
  }
}
