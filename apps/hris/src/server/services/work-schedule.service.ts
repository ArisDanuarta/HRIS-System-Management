import { Prisma, prisma, writeAudit } from "@pspk/db";
import { WorkScheduleInput } from "../schemas/work-schedule.schema";

export interface ActiveWorkSchedule {
  id: string;
  name: string;
  workStartTime: string;
  workEndTime: string;
  gracePeriodMins: number;
  workingDays: number[];
  isFlexible: boolean;
  isDefault: boolean;
  departmentId: string | null;
}

const DEFAULT_FALLBACK_SCHEDULE: ActiveWorkSchedule = {
  id: "default-fallback",
  name: "Jadwal Kerja Reguler PSPK",
  workStartTime: "09:00",
  workEndTime: "17:00",
  gracePeriodMins: 15,
  workingDays: [1, 2, 3, 4, 5],
  isFlexible: false,
  isDefault: true,
  departmentId: null,
};

/**
 * Retrieves the active work schedule for an employee/department, or the organizational default.
 */
export async function getActiveWorkSchedule(
  departmentId?: string | null,
): Promise<ActiveWorkSchedule> {
  try {
    if (!prisma.workScheduleSetting) {
      console.warn("prisma.workScheduleSetting belum ter-load di Prisma instance, menggunakan fallback");
      return DEFAULT_FALLBACK_SCHEDULE;
    }

    if (departmentId) {
      const deptSchedule = await prisma.workScheduleSetting.findFirst({
        where: { departmentId },
      });
      if (deptSchedule) {
        return deptSchedule;
      }
    }

    const defaultSchedule = await prisma.workScheduleSetting.findFirst({
      where: { isDefault: true },
    });

    if (defaultSchedule) {
      return defaultSchedule;
    }

    return DEFAULT_FALLBACK_SCHEDULE;
  } catch (err) {
    console.error("Gagal membaca work schedule dari database, menggunakan fallback:", err);
    return DEFAULT_FALLBACK_SCHEDULE;
  }
}

/**
 * Updates or creates a work schedule setting.
 */
export async function updateWorkSchedule(
  input: WorkScheduleInput,
  actorUserId: string,
) {
  if (!prisma.workScheduleSetting) {
    throw new Error(
      "Skema jadwal kerja sedang diinisialisasi. Silakan refresh halaman atau muat ulang server dev.",
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    let existing = null;
    if (input.id) {
      existing = await tx.workScheduleSetting.findUnique({
        where: { id: input.id },
      });
    } else {
      existing = await tx.workScheduleSetting.findFirst({
        where: { isDefault: true },
      });
    }

    const beforeState = existing ? { ...existing } : null;

    let updated;
    if (existing) {
      updated = await tx.workScheduleSetting.update({
        where: { id: existing.id },
        data: {
          name: input.name,
          workStartTime: input.workStartTime,
          workEndTime: input.workEndTime,
          gracePeriodMins: input.gracePeriodMins,
          workingDays: input.workingDays,
          isFlexible: input.isFlexible,
          departmentId: input.departmentId ?? null,
        },
      });
    } else {
      updated = await tx.workScheduleSetting.create({
        data: {
          name: input.name,
          workStartTime: input.workStartTime,
          workEndTime: input.workEndTime,
          gracePeriodMins: input.gracePeriodMins,
          workingDays: input.workingDays,
          isFlexible: input.isFlexible,
          isDefault: true,
          departmentId: input.departmentId ?? null,
        },
      });
    }

    // Write audit log
    await writeAudit(
      {
        actorUserId,
        actorEmail: "admin@pspk.example",
        app: "hris",
        action: "UPDATE",
        entityType: "WorkScheduleSetting",
        entityId: updated.id,
        before: beforeState ? (JSON.parse(JSON.stringify(beforeState)) as Prisma.InputJsonObject) : undefined,
        after: JSON.parse(JSON.stringify(updated)) as Prisma.InputJsonObject,
      },
      tx,
    );

    return updated;
  });

  return result;
}
