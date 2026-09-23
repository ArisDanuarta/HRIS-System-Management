import { prisma, writeAudit } from "@pspk/db";

export interface ActorInfo {
  userId: string;
  email: string;
  ip?: string | null;
  userAgent?: string | null;
}

export interface CreateEmploymentTypeDTO {
  code: string;
  name: string;
  category: "PERMANENT" | "FIXED_TERM" | "PART_TIME_PROJECT";
  wageType: "MONTHLY" | "HOURLY";
  defaultHourlyRate?: number | null;
  description?: string | null;
  isActive?: boolean;
}

export interface UpdateEmploymentTypeDTO {
  id: string;
  name: string;
  category: "PERMANENT" | "FIXED_TERM" | "PART_TIME_PROJECT";
  wageType: "MONTHLY" | "HOURLY";
  defaultHourlyRate?: number | null;
  description?: string | null;
  isActive?: boolean;
}

export async function createEmploymentType(dto: CreateEmploymentTypeDTO, actor: ActorInfo) {
  const normalizedCode = dto.code.trim().toUpperCase().replace(/[^A-Z0-9_]/g, "_");

  const existing = await prisma.employmentTypeMaster.findUnique({
    where: { code: normalizedCode },
  });

  if (existing) {
    throw new Error(`Kode ikatan kerja '${normalizedCode}' sudah digunakan.`);
  }

  const created = await prisma.employmentTypeMaster.create({
    data: {
      code: normalizedCode,
      name: dto.name.trim(),
      category: dto.category,
      wageType: dto.wageType,
      defaultHourlyRate: dto.defaultHourlyRate !== undefined && dto.defaultHourlyRate !== null ? dto.defaultHourlyRate : null,
      description: dto.description?.trim() || null,
      isActive: dto.isActive ?? true,
    },
  });

  await writeAudit({
    actorUserId: actor.userId,
    actorEmail: actor.email,
    app: "hris",
    action: "CREATE",
    entityType: "EmploymentTypeMaster",
    entityId: created.id,
    after: {
      code: created.code,
      name: created.name,
      category: created.category,
      wageType: created.wageType,
      defaultHourlyRate: created.defaultHourlyRate ? Number(created.defaultHourlyRate) : null,
    },
    ip: actor.ip,
    userAgent: actor.userAgent,
  });

  return created;
}

export async function updateEmploymentType(dto: UpdateEmploymentTypeDTO, actor: ActorInfo) {
  const existing = await prisma.employmentTypeMaster.findUnique({
    where: { id: dto.id },
  });

  if (!existing) {
    throw new Error("Tipe ikatan kerja tidak ditemukan.");
  }

  const updated = await prisma.employmentTypeMaster.update({
    where: { id: dto.id },
    data: {
      name: dto.name.trim(),
      category: dto.category,
      wageType: dto.wageType,
      defaultHourlyRate: dto.defaultHourlyRate !== undefined && dto.defaultHourlyRate !== null ? dto.defaultHourlyRate : null,
      description: dto.description?.trim() || null,
      isActive: dto.isActive !== undefined ? dto.isActive : existing.isActive,
    },
  });

  await writeAudit({
    actorUserId: actor.userId,
    actorEmail: actor.email,
    app: "hris",
    action: "UPDATE",
    entityType: "EmploymentTypeMaster",
    entityId: updated.id,
    before: {
      name: existing.name,
      category: existing.category,
      wageType: existing.wageType,
      defaultHourlyRate: existing.defaultHourlyRate ? Number(existing.defaultHourlyRate) : null,
      isActive: existing.isActive,
    },
    after: {
      name: updated.name,
      category: updated.category,
      wageType: updated.wageType,
      defaultHourlyRate: updated.defaultHourlyRate ? Number(updated.defaultHourlyRate) : null,
      isActive: updated.isActive,
    },
    ip: actor.ip,
    userAgent: actor.userAgent,
  });

  return updated;
}

export async function deleteEmploymentType(id: string, actor: ActorInfo) {
  const existing = await prisma.employmentTypeMaster.findUnique({
    where: { id },
    include: {
      _count: {
        select: { contracts: true },
      },
    },
  });

  if (!existing) {
    throw new Error("Tipe ikatan kerja tidak ditemukan.");
  }

  // Jika ada kontrak yang terhubung, jangan hapus hard delete melainkan nonaktifkan
  if (existing._count.contracts > 0) {
    const deactivated = await prisma.employmentTypeMaster.update({
      where: { id },
      data: { isActive: false },
    });

    await writeAudit({
      actorUserId: actor.userId,
      actorEmail: actor.email,
      app: "hris",
      action: "UPDATE",
      entityType: "EmploymentTypeMaster",
      entityId: id,
      before: { isActive: existing.isActive },
      after: { isActive: false, reason: "Deactivated because contracts are attached" },
      ip: actor.ip,
      userAgent: actor.userAgent,
    });

    return {
      deactivated: true,
      message: `Tipe ikatan kerja '${existing.name}' dinonaktifkan karena telah terhubung ke ${existing._count.contracts} kontrak pegawai.`,
    };
  }

  await prisma.employmentTypeMaster.delete({
    where: { id },
  });

  await writeAudit({
    actorUserId: actor.userId,
    actorEmail: actor.email,
    app: "hris",
    action: "DELETE",
    entityType: "EmploymentTypeMaster",
    entityId: id,
    before: { code: existing.code, name: existing.name },
    ip: actor.ip,
    userAgent: actor.userAgent,
  });

  return {
    deactivated: false,
    message: `Tipe ikatan kerja '${existing.name}' berhasil dihapus secara permanen.`,
  };
}

export async function toggleEmploymentTypeStatus(id: string, isActive: boolean, actor: ActorInfo) {
  const existing = await prisma.employmentTypeMaster.findUnique({ where: { id } });
  if (!existing) throw new Error("Tipe ikatan kerja tidak ditemukan.");

  const updated = await prisma.employmentTypeMaster.update({
    where: { id },
    data: { isActive },
  });

  await writeAudit({
    actorUserId: actor.userId,
    actorEmail: actor.email,
    app: "hris",
    action: "UPDATE",
    entityType: "EmploymentTypeMaster",
    entityId: id,
    before: { isActive: existing.isActive },
    after: { isActive },
    ip: actor.ip,
    userAgent: actor.userAgent,
  });

  return updated;
}
