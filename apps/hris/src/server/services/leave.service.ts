import { prisma, writeAudit } from "@pspk/db";
import {
  calculateWorkingDays,
  isDateOverlapping,
  hasSufficientLeaveBalance,
  getLeaveOverrideImpact,
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
        gte: new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0)),
        lte: new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999)),
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

    await writeAudit(
      {
        actorUserId: userId,
        actorEmail: "employee@pspk.example",
        app: "hris",
        action: "LEAVE_REQUEST_CREATE",
        entityType: "LeaveRequest",
        entityId: request.id,
        after: {
          employeeId,
          leaveTypeId: input.leaveTypeId,
          startDate: input.startDate,
          endDate: input.endDate,
          days: workingDays,
          reason: input.reason,
        },
      },
      tx,
    );

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
        gte: new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0)),
        lte: new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999)),
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
      const dayOfWeek = current.getUTCDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const curDateStr = toDateString(current);
      const isHoliday = holidaySet.has(curDateStr);

      if (!isWeekend && !isHoliday) {
        const attendanceDate = new Date(curDateStr);
        await tx.attendance.upsert({
          where: {
            employeeId_date: {
              employeeId: request.employeeId,
              date: attendanceDate,
            },
          },
          update: {
            status: "LEAVE",
            notes: `Cuti Disetujui: ${request.leaveType.name}`,
          },
          create: {
            employeeId: request.employeeId,
            date: attendanceDate,
            status: "LEAVE",
            source: "WEB",
            notes: `Cuti Disetujui: ${request.leaveType.name}`,
          },
        });
      }

      current.setUTCDate(current.getUTCDate() + 1);
    }

    // 4. Log Audit Event
    await writeAudit(
      {
        actorUserId: approverUserId,
        actorEmail: "approver@pspk.example",
        app: "hris",
        action: "LEAVE_REQUEST_APPROVE",
        entityType: "LeaveRequest",
        entityId: request.id,
        before: { status: "PENDING" },
        after: {
          status: "APPROVED",
          approverId: approverEmployeeId || approverUserId,
          decisionNote,
          deductedDays: Number(request.days),
        },
      },
      tx,
    );

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

    await writeAudit(
      {
        actorUserId: approverUserId,
        actorEmail: "approver@pspk.example",
        app: "hris",
        action: "LEAVE_REQUEST_REJECT",
        entityType: "LeaveRequest",
        entityId: request.id,
        before: { status: "PENDING" },
        after: {
          status: "REJECTED",
          decisionNote,
        },
      },
      tx,
    );

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

    await writeAudit(
      {
        actorUserId: userId,
        actorEmail: "employee@pspk.example",
        app: "hris",
        action: "LEAVE_REQUEST_CANCEL",
        entityType: "LeaveRequest",
        entityId: request.id,
        before: { status: request.status },
        after: {
          status: "CANCELLED",
          wasApproved,
          refundedDays: wasApproved ? Number(request.days) : 0,
          cancellationReason,
        },
      },
      tx,
    );

    return updated;
  });

  return result;
}

/**
 * Overrides an existing leave request decision (Super Admin / Admin HR only).
 * Handles quota refund or deduction, attendance synchronization, and audit logging.
 */
export async function overrideLeaveDecision({
  leaveRequestId,
  targetStatus,
  overrideReason,
  adminUserId,
  adminEmail,
  adminEmployeeId,
}: {
  leaveRequestId: string;
  targetStatus: "APPROVED" | "REJECTED" | "CANCELLED";
  overrideReason: string;
  adminUserId: string;
  adminEmail: string;
  adminEmployeeId?: string;
}) {
  const request = await prisma.leaveRequest.findUnique({
    where: { id: leaveRequestId },
    include: {
      employee: {
        select: {
          id: true,
          fullName: true,
          employeeNo: true,
        },
      },
      leaveType: true,
    },
  });

  if (!request) {
    throw new Error("Permohonan cuti tidak ditemukan.");
  }

  if (request.status === targetStatus) {
    throw new Error(`Permohonan cuti sudah berstatus ${targetStatus}.`);
  }

  if (!overrideReason || overrideReason.trim().length < 5) {
    throw new Error("Alasan koreksi/override status wajib diisi minimal 5 karakter.");
  }

  const startDate = request.startDate;
  const endDate = request.endDate;
  const year = startDate.getFullYear();
  const requestDays = Number(request.days);
  const wasApproved = request.status === "APPROVED";
  const willBeApproved = targetStatus === "APPROVED";

  const impact = getLeaveOverrideImpact(request.status, targetStatus, requestDays);

  // Pre-fetch holidays if approving
  let holidaySet = new Set<string>();
  if (willBeApproved) {
    const holidays = await prisma.holiday.findMany({
      where: {
        date: {
          gte: new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0)),
          lte: new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999)),
        },
      },
      select: { date: true },
    });
    holidaySet = new Set(holidays.map((h) => toDateString(h.date)));
  }

  const result = await prisma.$transaction(async (tx) => {
    // 1. If transitioning to APPROVED, validate balance & schedule overlap
    if (willBeApproved) {
      const balance = await tx.leaveBalance.findUnique({
        where: {
          employeeId_leaveTypeId_year: {
            employeeId: request.employeeId,
            leaveTypeId: request.leaveTypeId,
            year,
          },
        },
      });

      const quotaDays = balance ? balance.quotaDays : request.leaveType.defaultQuotaDays;
      const usedDays = balance ? Number(balance.usedDays) : 0;
      const remainingDays = quotaDays - usedDays;

      if (remainingDays < requestDays) {
        throw new Error(
          `Sisa kuota cuti pegawai (${remainingDays} hari) tidak mencukupi untuk durasi cuti ini (${requestDays} hari).`,
        );
      }

      // Check overlap with another active approved leave request
      const overlapping = await tx.leaveRequest.findFirst({
        where: {
          id: { not: request.id },
          employeeId: request.employeeId,
          status: "APPROVED",
          startDate: { lte: endDate },
          endDate: { gte: startDate },
        },
      });

      if (overlapping) {
        throw new Error("Terdapat pengajuan cuti lain yang sudah disetujui pada rentang tanggal yang sama.");
      }

      // Deduct quota
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
            increment: requestDays,
          },
        },
        create: {
          employeeId: request.employeeId,
          leaveTypeId: request.leaveTypeId,
          year,
          quotaDays: request.leaveType.defaultQuotaDays,
          usedDays: requestDays,
        },
      });

      // Mark Attendance as LEAVE for working days
      const current = new Date(startDate);
      while (current <= endDate) {
        const dayOfWeek = current.getUTCDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const curDateStr = toDateString(current);
        const isHoliday = holidaySet.has(curDateStr);

        if (!isWeekend && !isHoliday) {
          const attendanceDate = new Date(curDateStr);
          await tx.attendance.upsert({
            where: {
              employeeId_date: {
                employeeId: request.employeeId,
                date: attendanceDate,
              },
            },
            update: {
              status: "LEAVE",
              notes: `Cuti Disetujui (Override HR): ${request.leaveType.name}`,
            },
            create: {
              employeeId: request.employeeId,
              date: attendanceDate,
              status: "LEAVE",
              source: "WEB",
              notes: `Cuti Disetujui (Override HR): ${request.leaveType.name}`,
            },
          });
        }

        current.setUTCDate(current.getUTCDate() + 1);
      }
    }

    // 2. If previously APPROVED and transitioning away from APPROVED, refund balance and clear attendance
    if (wasApproved && !willBeApproved) {
      await tx.leaveBalance.updateMany({
        where: {
          employeeId: request.employeeId,
          leaveTypeId: request.leaveTypeId,
          year,
        },
        data: {
          usedDays: {
            decrement: requestDays,
          },
        },
      });

      // Delete attendance records marked as LEAVE for that period
      await tx.attendance.deleteMany({
        where: {
          employeeId: request.employeeId,
          date: {
            gte: startDate,
            lte: endDate,
          },
          status: "LEAVE",
        },
      });
    }

    // 3. Update LeaveRequest status
    const updatedRequest = await tx.leaveRequest.update({
      where: { id: leaveRequestId },
      data: {
        status: targetStatus,
        decidedAt: new Date(),
        approverId: adminEmployeeId || adminUserId,
        decisionNote: `[Override HR] ${overrideReason.trim()}`,
      },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            employeeNo: true,
          },
        },
      },
    });

    // 4. Log Audit Event
    await writeAudit(
      {
        actorUserId: adminUserId,
        actorEmail: adminEmail,
        app: "hris",
        action: "OVERRIDE",
        entityType: "LeaveRequest",
        entityId: request.id,
        before: {
          status: request.status,
          decisionNote: request.decisionNote,
          approverId: request.approverId,
        },
        after: {
          status: targetStatus,
          overrideReason: overrideReason.trim(),
          balanceDelta: impact.balanceDelta,
          employeeName: request.employee.fullName,
        },
      },
      tx,
    );

    return updatedRequest;
  });

  return result;
}

