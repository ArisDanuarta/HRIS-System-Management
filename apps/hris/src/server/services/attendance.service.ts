import { prisma, logAuditEvent } from "@pspk/db";
import { toDateString } from "@pspk/shared";
import { CorrectAttendanceInput } from "../schemas/attendance.schema";

/**
 * Records employee check-in using server timestamp.
 */
export async function recordCheckIn(
  employeeId: string,
  notes?: string,
  userId?: string,
) {
  const now = new Date();
  const todayDateStr = toDateString(now);
  const todayDate = new Date(todayDateStr);

  // Check if today attendance already exists
  const existing = await prisma.attendance.findUnique({
    where: {
      employeeId_date: {
        employeeId,
        date: todayDate,
      },
    },
  });

  if (existing && existing.checkInAt) {
    const timeStr = existing.checkInAt.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: process.env.APP_TIMEZONE || "Asia/Jakarta",
    });
    throw new Error(`Anda sudah melakukan check-in hari ini pada pukul ${timeStr} WIB.`);
  }

  // Determine LATE vs PRESENT (Standard entry cut-off: 09:00:00 WIB)
  const hour = parseInt(
    now.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      hour12: false,
      timeZone: process.env.APP_TIMEZONE || "Asia/Jakarta",
    }),
    10,
  );
  const minute = parseInt(
    now.toLocaleTimeString("id-ID", {
      minute: "2-digit",
      timeZone: process.env.APP_TIMEZONE || "Asia/Jakarta",
    }),
    10,
  );

  const isLate = hour > 9 || (hour === 9 && minute > 0);
  const status = isLate ? "LATE" : "PRESENT";

  const attendance = await prisma.$transaction(async (tx) => {
    const record = await tx.attendance.upsert({
      where: {
        employeeId_date: {
          employeeId,
          date: todayDate,
        },
      },
      update: {
        checkInAt: now,
        status,
        notes: notes || undefined,
      },
      create: {
        employeeId,
        date: todayDate,
        checkInAt: now,
        status,
        source: "WEB",
        notes,
      },
    });

    if (userId) {
      await logAuditEvent({
        userId,
        action: "ATTENDANCE_CHECKIN",
        entity: "Attendance",
        entityId: record.id,
        newData: {
          employeeId,
          date: todayDateStr,
          checkInAt: now.toISOString(),
          status,
        },
      });
    }

    return record;
  });

  return attendance;
}

/**
 * Records employee check-out using server timestamp.
 */
export async function recordCheckOut(
  employeeId: string,
  notes?: string,
  userId?: string,
) {
  const now = new Date();
  const todayDateStr = toDateString(now);
  const todayDate = new Date(todayDateStr);

  const existing = await prisma.attendance.findUnique({
    where: {
      employeeId_date: {
        employeeId,
        date: todayDate,
      },
    },
  });

  if (!existing || !existing.checkInAt) {
    throw new Error("Anda belum melakukan check-in hari ini.");
  }

  if (existing.checkOutAt) {
    const timeStr = existing.checkOutAt.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: process.env.APP_TIMEZONE || "Asia/Jakarta",
    });
    throw new Error(`Anda sudah melakukan check-out hari ini pada pukul ${timeStr} WIB.`);
  }

  const attendance = await prisma.$transaction(async (tx) => {
    const record = await tx.attendance.update({
      where: { id: existing.id },
      data: {
        checkOutAt: now,
        notes: notes ? `${existing.notes || ""} [Out: ${notes}]`.trim() : undefined,
      },
    });

    if (userId) {
      await logAuditEvent({
        userId,
        action: "ATTENDANCE_CHECKOUT",
        entity: "Attendance",
        entityId: record.id,
        newData: {
          employeeId,
          date: todayDateStr,
          checkOutAt: now.toISOString(),
        },
      });
    }

    return record;
  });

  return attendance;
}

/**
 * Performs administrative attendance correction by HR with mandatory reason and audit log.
 */
export async function correctAttendance(
  input: CorrectAttendanceInput,
  adminUserId: string,
) {
  const targetDate = new Date(input.date);

  const existing = await prisma.attendance.findUnique({
    where: {
      employeeId_date: {
        employeeId: input.employeeId,
        date: targetDate,
      },
    },
  });

  const checkInDate = input.checkInAt ? new Date(input.checkInAt) : null;
  const checkOutDate = input.checkOutAt ? new Date(input.checkOutAt) : null;

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.attendance.upsert({
      where: {
        employeeId_date: {
          employeeId: input.employeeId,
          date: targetDate,
        },
      },
      update: {
        checkInAt: checkInDate,
        checkOutAt: checkOutDate,
        status: input.status,
        correctedById: adminUserId,
        correctionReason: input.correctionReason,
      },
      create: {
        employeeId: input.employeeId,
        date: targetDate,
        checkInAt: checkInDate,
        checkOutAt: checkOutDate,
        status: input.status,
        source: "MANUAL_HR",
        correctedById: adminUserId,
        correctionReason: input.correctionReason,
      },
    });

    await logAuditEvent({
      userId: adminUserId,
      action: "ATTENDANCE_CORRECT",
      entity: "Attendance",
      entityId: updated.id,
      oldData: existing
        ? {
            status: existing.status,
            checkInAt: existing.checkInAt?.toISOString(),
            checkOutAt: existing.checkOutAt?.toISOString(),
          }
        : null,
      newData: {
        employeeId: input.employeeId,
        date: input.date,
        status: input.status,
        checkInAt: checkInDate?.toISOString(),
        checkOutAt: checkOutDate?.toISOString(),
        correctionReason: input.correctionReason,
      },
    });

    return updated;
  });

  return result;
}
