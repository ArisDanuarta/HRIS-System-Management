import { prisma, logAuditEvent } from "@pspk/db";
import {
  calculateWorkingDays,
  isDateOverlapping,
  hasSufficientLeaveBalance,
  toDateString,
} from "@pspk/shared";
import { CreateLeaveRequestInput } from "../schemas/leave.schema";

/**
 * Submits a new leave request with pure working days calculation, overlap check, and balance check.
 */
export async function submitLeaveRequest(
  employeeId: string,
  input: CreateLeaveRequestInput,
  userId: string,
) {
  const startDate = new Date(input.startDate);
  const endDate = new Date(input.endDate);
  const year = startDate.getFullYear();

  if (endDate < startDate) {
    throw new Error("Tanggal akhir cuti tidak boleh lebih awal dari tanggal mulai.");
  }

  // Fetch holidays for working days computation
  const holidays = await prisma.holiday.findMany({
    where: {
      date: {
        gte: new Date(year, 0, 1),
        lte: new Date(year, 11, 31),
      },
    },
    select: { date: true },
  });

  const holidayDates = holidays.map((h) => h.date);
  const workingDays = calculateWorkingDays(startDate, endDate, holidayDates);

  if (workingDays <= 0) {
    throw new Error(
      "Rentang tanggal yang Anda pilih tidak memuat hari kerja aktif (seluruhnya jatuh pada akhir pekan atau hari libur nasional).",
    );
  }

  // Check overlap with existing active or pending leave requests
  const existingRequests = await prisma.leaveRequest.findMany({
    where: {
      employeeId,
      status: { in: ["PENDING", "APPROVED"] },
    },
    select: {
      id: true,
      startDate: true,
      endDate: true,
      status: true,
      leaveType: { select: { name: true } },
    },
  });

  for (const req of existingRequests) {
    if (isDateOverlapping(startDate, endDate, req.startDate, req.endDate)) {
      const startFmt = toDateString(req.startDate);
      const endFmt = toDateString(req.endDate);
      throw new Error(
        `Rentang tanggal bertabrakan dengan permohonan ${req.leaveType.name} (${startFmt} s/d ${endFmt}) yang berstatus ${req.status}.`,
      );
    }
  }

  // Fetch leave type & balance
  const leaveType = await prisma.leaveType.findUnique({
    where: { id: input.leaveTypeId },
  });

  if (!leaveType || !leaveType.isActive) {
    throw new Error("Jenis cuti yang dipilih tidak aktif atau tidak ditemukan.");
  }

  if (leaveType.requiresAttachment && !input.attachmentKey) {
    throw new Error(`Jenis cuti ${leaveType.name} mewajibkan pengunggahan berkas lampiran pendukung.`);
  }

  // Check quota balance
  const balance = await prisma.leaveBalance.findUnique({
    where: {
      employeeId_leaveTypeId_year: {
        employeeId,
        leaveTypeId: input.leaveTypeId,
        year,
      },
    },
  });

  const quota = balance ? balance.quotaDays : leaveType.defaultQuotaDays;
  const used = balance ? Number(balance.usedDays) : 0;

  if (!hasSufficientLeaveBalance(quota, used, workingDays)) {
    const remaining = Math.max(0, quota - used);
    throw new Error(
      `Saldo cuti ${leaveType.name} Anda tidak mencukupi. Sisa saldo Anda: ${remaining} hari, dibutuhkan: ${workingDays} hari kerja.`,
    );
  }

  // Create request in transaction
  const result = await prisma.$transaction(async (tx) => {
    const request = await tx.leaveRequest.create({
      data: {
        employeeId,
        leaveTypeId: input.leaveTypeId,
        startDate,
        endDate,
        days: workingDays,
        reason: input.reason,
        attachmentKey: input.attachmentKey || null,
        status: "PENDING",
      },
      include: {
        leaveType: true,
      },
    });

    await logAuditEvent({
      userId,
      action: "LEAVE_REQUEST_CREATE",
      entity: "LeaveRequest",
      entityId: request.id,
      newData: {
        employeeId,
        leaveTypeId: input.leaveTypeId,
        startDate: input.startDate,
        endDate: input.endDate,
        days: workingDays,
        reason: input.reason,
      },
    });

    return request;
  });

  return result;
}

/**
 * Approves a pending leave request atomically.
 * Deducts quota balance and marks daily attendance as LEAVE on business days.
 */
export async function approveLeaveRequest(
  leaveRequestId: string,
  approverUserId: string,
  approverEmployeeId?: string,
  decisionNote?: string,
) {
  const request = await prisma.leaveRequest.findUnique({
    where: { id: leaveRequestId },
    include: {
      employee: true,
      leaveType: true,
    },
  });

  if (!request) {
    throw new Error("Permohonan cuti tidak ditemukan.");
  }

  if (request.status !== "PENDING") {
    throw new Error(`Permohonan cuti ini tidak dapat disetujui karena sudah berstatus ${request.status}.`);
  }

  const startDate = request.startDate;
  const endDate = request.endDate;
  const year = startDate.getFullYear();

  // Fetch holidays to mark exact attendance business days
  const holidays = await prisma.holiday.findMany({
    where: {
      date: {
        gte: new Date(year, 0, 1),
        lte: new Date(year, 11, 31),
      },
    },
    select: { date: true },
  });
  const holidaySet = new Set(holidays.map((h) => toDateString(h.date)));

  const result = await prisma.$transaction(async (tx) => {
    // 1. Update LeaveRequest status
    const updatedRequest = await tx.leaveRequest.update({
      where: { id: leaveRequestId },
      data: {
        status: "APPROVED",
        decidedAt: new Date(),
        approverId: approverEmployeeId || approverUserId,
        decisionNote: decisionNote || "Disetujui",
      },
    });

    // 2. Increment usedDays in LeaveBalance
    await tx.leaveBalance.upsert({
      where: {
        employeeId_leaveTypeId_year: {
          employeeId: request.employeeId,
          leaveTypeId: request.leaveTypeId,
          year,
        },
      },
      update: {
        usedDays: {
          increment: Number(request.days),
        },
      },
      create: {
        employeeId: request.employeeId,
        leaveTypeId: request.leaveTypeId,
        year,
        quotaDays: request.leaveType.defaultQuotaDays,
        usedDays: Number(request.days),
      },
    });

    // 3. Mark Attendance records as LEAVE for all working days in range
    const current = new Date(startDate);
    while (current <= endDate) {
      const dayOfWeek = current.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isHoliday = holidaySet.has(toDateString(current));

      if (!isWeekend && !isHoliday) {
        const dateCopy = new Date(current);
        await tx.attendance.upsert({
          where: {
            employeeId_date: {
              employeeId: request.employeeId,
              date: dateCopy,
            },
          },
          update: {
            status: "LEAVE",
            notes: `Cuti Disetujui: ${request.leaveType.name}`,
          },
          create: {
            employeeId: request.employeeId,
            date: dateCopy,
            status: "LEAVE",
            source: "WEB",
            notes: `Cuti Disetujui: ${request.leaveType.name}`,
          },
        });
      }

      current.setDate(current.getDate() + 1);
    }

    // 4. Log Audit Event
    await logAuditEvent({
      userId: approverUserId,
      action: "LEAVE_REQUEST_APPROVE",
      entity: "LeaveRequest",
      entityId: request.id,
      oldData: { status: "PENDING" },
      newData: {
        status: "APPROVED",
        approverId: approverEmployeeId || approverUserId,
        decisionNote,
        deductedDays: Number(request.days),
      },
    });

    return updatedRequest;
  });

  return result;
}

/**
 * Rejects a pending leave request with a mandatory reason.
 */
export async function rejectLeaveRequest(
  leaveRequestId: string,
  approverUserId: string,
  approverEmployeeId?: string,
  decisionNote: string = "Ditolak",
) {
  const request = await prisma.leaveRequest.findUnique({
    where: { id: leaveRequestId },
  });

  if (!request) {
    throw new Error("Permohonan cuti tidak ditemukan.");
  }

  if (request.status !== "PENDING") {
    throw new Error(`Permohonan cuti ini tidak dapat ditolak karena berstatus ${request.status}.`);
  }

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.leaveRequest.update({
      where: { id: leaveRequestId },
      data: {
        status: "REJECTED",
        decidedAt: new Date(),
        approverId: approverEmployeeId || approverUserId,
        decisionNote,
      },
    });

    await logAuditEvent({
      userId: approverUserId,
      action: "LEAVE_REQUEST_REJECT",
      entity: "LeaveRequest",
      entityId: request.id,
      oldData: { status: "PENDING" },
      newData: {
        status: "REJECTED",
        decisionNote,
      },
    });

    return updated;
  });

  return result;
}

/**
 * Cancels a leave request.
 * If request was already APPROVED, restores the deducted leave balance and clears Attendance records.
 */
export async function cancelLeaveRequest(
  leaveRequestId: string,
  userId: string,
  cancellationReason?: string,
) {
  const request = await prisma.leaveRequest.findUnique({
    where: { id: leaveRequestId },
    include: { leaveType: true },
  });

  if (!request) {
    throw new Error("Permohonan cuti tidak ditemukan.");
  }

  if (request.status === "CANCELLED" || request.status === "REJECTED") {
    throw new Error(`Permohonan cuti sudah tidak aktif (${request.status}).`);
  }

  const year = request.startDate.getFullYear();

  const result = await prisma.$transaction(async (tx) => {
    const wasApproved = request.status === "APPROVED";

    const updated = await tx.leaveRequest.update({
      where: { id: leaveRequestId },
      data: {
        status: "CANCELLED",
        decisionNote: cancellationReason ? `Dibatalkan: ${cancellationReason}` : "Dibatalkan oleh pemohon",
      },
    });

    // If was approved, refund leave balance and reset attendance
    if (wasApproved) {
      await tx.leaveBalance.updateMany({
        where: {
          employeeId: request.employeeId,
          leaveTypeId: request.leaveTypeId,
          year,
        },
        data: {
          usedDays: {
            decrement: Number(request.days),
          },
        },
      });

      // Clear attendance status on those dates
      await tx.attendance.deleteMany({
        where: {
          employeeId: request.employeeId,
          date: {
            gte: request.startDate,
            lte: request.endDate,
          },
          status: "LEAVE",
        },
      });
    }

    await logAuditEvent({
      userId,
      action: "LEAVE_REQUEST_CANCEL",
      entity: "LeaveRequest",
      entityId: request.id,
      oldData: { status: request.status },
      newData: {
        status: "CANCELLED",
        wasApproved,
        refundedDays: wasApproved ? Number(request.days) : 0,
        cancellationReason,
      },
    });

    return updated;
  });

  return result;
}
