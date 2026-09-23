import { prisma, writeAudit } from "@pspk/db";
import {
  CreateDepartmentInput,
  UpdateDepartmentInput,
  CreatePositionInput,
  UpdatePositionInput,
  TransferEmployeePositionInput,
} from "../schemas/organization.schema";
import { ActorContext } from "./employee.service";

/**
 * Service untuk Master Divisi / Departemen
 */
export async function createDepartment(data: CreateDepartmentInput, actor: ActorContext) {
  const trimmedName = data.name.trim();

  const existing = await prisma.department.findFirst({
    where: {
      name: { equals: trimmedName, mode: "insensitive" },
    },
  });

  if (existing) {
    throw new Error(`Divisi/Departemen dengan nama "${trimmedName}" sudah ada.`);
  }

  if (data.parentId) {
    const parent = await prisma.department.findUnique({
      where: { id: data.parentId },
    });
    if (!parent) {
      throw new Error("Divisi induk yang dipilih tidak ditemukan.");
    }
  }

  const department = await prisma.department.create({
    data: {
      name: trimmedName,
      parentId: data.parentId || null,
    },
  });

  await writeAudit({
    actorUserId: actor.id,
    actorEmail: actor.email,
    app: "hris",
    action: "CREATE",
    entityType: "Department",
    entityId: department.id,
    after: { name: department.name, parentId: department.parentId },
    ip: actor.ip,
    userAgent: actor.userAgent,
  });

  return department;
}

export async function updateDepartment(data: UpdateDepartmentInput, actor: ActorContext) {
  const current = await prisma.department.findUnique({
    where: { id: data.id },
  });

  if (!current) {
    throw new Error("Data divisi tidak ditemukan.");
  }

  const trimmedName = data.name.trim();

  // Cek duplikasi nama divisi lain
  const conflict = await prisma.department.findFirst({
    where: {
      id: { not: data.id },
      name: { equals: trimmedName, mode: "insensitive" },
    },
  });

  if (conflict) {
    throw new Error(`Nama divisi "${trimmedName}" sudah digunakan oleh divisi lain.`);
  }

  // Cegah divisi menjadikan dirinya sendiri sebagai parent
  if (data.parentId && data.parentId === data.id) {
    throw new Error("Divisi tidak dapat menjadi divisi induk bagi dirinya sendiri.");
  }

  const updated = await prisma.department.update({
    where: { id: data.id },
    data: {
      name: trimmedName,
      parentId: data.parentId || null,
    },
  });

  await writeAudit({
    actorUserId: actor.id,
    actorEmail: actor.email,
    app: "hris",
    action: "UPDATE",
    entityType: "Department",
    entityId: updated.id,
    before: { name: current.name, parentId: current.parentId },
    after: { name: updated.name, parentId: updated.parentId },
    ip: actor.ip,
    userAgent: actor.userAgent,
  });

  return updated;
}

export async function deleteDepartment(id: string, actor: ActorContext) {
  const department = await prisma.department.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          employees: { where: { deletedAt: null } },
          positions: true,
          children: true,
        },
      },
    },
  });

  if (!department) {
    throw new Error("Data divisi tidak ditemukan.");
  }

  // 1. Guard integritas: Tidak boleh menghapus divisi yang memiliki pegawai aktif
  if (department._count.employees > 0) {
    throw new Error(
      `Tidak dapat menghapus divisi "${department.name}" karena masih memiliki ${department._count.employees} pegawai aktif. Harap mutasikan pegawai ke divisi lain terlebih dahulu.`,
    );
  }

  // 2. Guard: Cek apakah ada sub-divisi
  if (department._count.children > 0) {
    throw new Error(
      `Tidak dapat menghapus divisi "${department.name}" karena memiliki ${department._count.children} sub-divisi di bawahnya.`,
    );
  }

  // 3. Guard: Cek apakah jabatan di divisi ini masih memiliki pegawai aktif
  const positionsWithEmployees = await prisma.position.findMany({
    where: {
      departmentId: id,
      employees: { some: { deletedAt: null } },
    },
    select: { title: true },
  });

  if (positionsWithEmployees.length > 0) {
    const posNames = positionsWithEmployees.map((p) => p.title).join(", ");
    throw new Error(
      `Tidak dapat menghapus divisi karena jabatan (${posNames}) masih diduduki pegawai aktif.`,
    );
  }

  // Bersihkan jabatan kosong di divisi ini lalu hapus divisi
  await prisma.$transaction(async (tx) => {
    await tx.position.deleteMany({ where: { departmentId: id } });
    await tx.department.delete({ where: { id } });

    await writeAudit(
      {
        actorUserId: actor.id,
        actorEmail: actor.email,
        app: "hris",
        action: "DELETE",
        entityType: "Department",
        entityId: id,
        before: { name: department.name },
        ip: actor.ip,
        userAgent: actor.userAgent,
      },
      tx,
    );
  });

  return { success: true };
}

/**
 * Service untuk Master Jabatan / Posisi Riset
 */
export async function createPosition(data: CreatePositionInput, actor: ActorContext) {
  const trimmedTitle = data.title.trim();

  // Pastikan divisi valid
  const department = await prisma.department.findUnique({
    where: { id: data.departmentId },
  });
  if (!department) {
    throw new Error("Divisi yang dipilih tidak ditemukan.");
  }

  // Cek duplikasi jabatan dalam divisi yang sama
  const existing = await prisma.position.findFirst({
    where: {
      departmentId: data.departmentId,
      title: { equals: trimmedTitle, mode: "insensitive" },
    },
  });

  if (existing) {
    throw new Error(
      `Jabatan "${trimmedTitle}" sudah terdaftar pada divisi ${department.name}.`,
    );
  }

  const position = await prisma.position.create({
    data: {
      title: trimmedTitle,
      departmentId: data.departmentId,
    },
    include: {
      department: { select: { id: true, name: true } },
    },
  });

  await writeAudit({
    actorUserId: actor.id,
    actorEmail: actor.email,
    app: "hris",
    action: "CREATE",
    entityType: "Position",
    entityId: position.id,
    after: { title: position.title, departmentId: position.departmentId },
    ip: actor.ip,
    userAgent: actor.userAgent,
  });

  return position;
}

export async function updatePosition(data: UpdatePositionInput, actor: ActorContext) {
  const current = await prisma.position.findUnique({
    where: { id: data.id },
  });

  if (!current) {
    throw new Error("Data jabatan tidak ditemukan.");
  }

  const trimmedTitle = data.title.trim();

  // Cek duplikasi di divisi target
  const conflict = await prisma.position.findFirst({
    where: {
      id: { not: data.id },
      departmentId: data.departmentId,
      title: { equals: trimmedTitle, mode: "insensitive" },
    },
  });

  if (conflict) {
    throw new Error(`Jabatan "${trimmedTitle}" sudah terdaftar pada divisi tersebut.`);
  }

  const updated = await prisma.position.update({
    where: { id: data.id },
    data: {
      title: trimmedTitle,
      departmentId: data.departmentId,
    },
    include: {
      department: { select: { id: true, name: true } },
    },
  });

  await writeAudit({
    actorUserId: actor.id,
    actorEmail: actor.email,
    app: "hris",
    action: "UPDATE",
    entityType: "Position",
    entityId: updated.id,
    before: { title: current.title, departmentId: current.departmentId },
    after: { title: updated.title, departmentId: updated.departmentId },
    ip: actor.ip,
    userAgent: actor.userAgent,
  });

  return updated;
}

export async function deletePosition(id: string, actor: ActorContext) {
  const position = await prisma.position.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          employees: { where: { deletedAt: null } },
        },
      },
    },
  });

  if (!position) {
    throw new Error("Data jabatan tidak ditemukan.");
  }

  // Guard integritas: Tidak boleh menghapus jabatan yang diduduki pegawai aktif
  if (position._count.employees > 0) {
    throw new Error(
      `Tidak dapat menghapus jabatan "${position.title}" karena masih diduduki oleh ${position._count.employees} pegawai aktif. Harap lakukan penyesuaian posisi pegawai terlebih dahulu.`,
    );
  }

  await prisma.position.delete({
    where: { id },
  });

  await writeAudit({
    actorUserId: actor.id,
    actorEmail: actor.email,
    app: "hris",
    action: "DELETE",
    entityType: "Position",
    entityId: id,
    before: { title: position.title, departmentId: position.departmentId },
    ip: actor.ip,
    userAgent: actor.userAgent,
  });

  return { success: true };
}

/**
 * Service untuk Mutasi / Promosi / Perubahan Jabatan Pegawai
 */
export async function transferEmployeePosition(
  data: TransferEmployeePositionInput,
  actor: ActorContext,
) {
  const employee = await prisma.employee.findUnique({
    where: { id: data.employeeId },
    include: {
      currentDepartment: true,
      currentPosition: true,
      manager: true,
    },
  });

  if (!employee || employee.deletedAt) {
    throw new Error("Data pegawai tidak ditemukan.");
  }

  // Validasi posisi dan divisi baru
  const targetPosition = await prisma.position.findUnique({
    where: { id: data.positionId },
    include: { department: true },
  });

  if (!targetPosition) {
    throw new Error("Jabatan baru yang dipilih tidak ditemukan.");
  }

  if (targetPosition.departmentId !== data.departmentId) {
    throw new Error("Jabatan yang dipilih tidak sesuai dengan divisi tujuan.");
  }

  // Validasi atasan baru (mencegah circular reporting)
  if (data.managerId) {
    if (data.managerId === data.employeeId) {
      throw new Error("Pegawai tidak dapat menjadi atasan langsung bagi dirinya sendiri.");
    }

    // Pastikan atasan bukan salah satu bawahan langsung dari pegawai yang dimutasi
    const subordinates = await prisma.employee.findMany({
      where: { managerId: data.employeeId, deletedAt: null },
      select: { id: true, fullName: true },
    });

    const isSubordinate = subordinates.some((s) => s.id === data.managerId);
    if (isSubordinate) {
      throw new Error(
        "Tidak dapat memilih atasan yang saat ini merupakan bawahan langsung pegawai ini (mencegah relasi melingkar).",
      );
    }
  }

  const transferTypeLabelMap: Record<string, string> = {
    PROMOTION: "Promosi Jabatan",
    ROTATION: "Rotasi Divisi",
    DEMOTION: "Demosi",
    ADJUSTMENT: "Penyesuaian Struktur",
  };

  const typeLabel = transferTypeLabelMap[data.transferType] || "Penyesuaian Posisi";
  const skPart = data.skNumber?.trim() ? `[SK: ${data.skNumber.trim()}] ` : "";
  const notesPart = data.notes?.trim() || "";
  const combinedNotes = `${typeLabel}: ${skPart}${notesPart}`.trim();
  const effectiveDateObj = new Date(data.effectiveDate);

  const result = await prisma.$transaction(async (tx) => {
    // 1. Tutup riwayat jabatan sebelumnya jika masih terbuka
    const openHistory = await tx.employmentHistory.findFirst({
      where: {
        employeeId: employee.id,
        endDate: null,
      },
      orderBy: { startDate: "desc" },
    });

    if (openHistory) {
      await tx.employmentHistory.update({
        where: { id: openHistory.id },
        data: { endDate: effectiveDateObj },
      });
    }

    // 2. Buat record riwayat jabatan baru
    const newHistory = await tx.employmentHistory.create({
      data: {
        employeeId: employee.id,
        departmentId: data.departmentId,
        positionId: data.positionId,
        startDate: effectiveDateObj,
        notes: combinedNotes,
        documentKey: data.documentKey || null,
      },
      include: {
        department: { select: { name: true } },
        position: { select: { title: true } },
      },
    });

    // 3. Update pointer jabatan, divisi, dan atasan di record Employee
    const updatedEmployee = await tx.employee.update({
      where: { id: employee.id },
      data: {
        currentDepartmentId: data.departmentId,
        currentPositionId: data.positionId,
        managerId: data.managerId || null,
      },
      include: {
        currentDepartment: { select: { name: true } },
        currentPosition: { select: { title: true } },
        manager: { select: { fullName: true } },
      },
    });

    // 4. Catat Audit Log
    await writeAudit(
      {
        actorUserId: actor.id,
        actorEmail: actor.email,
        app: "hris",
        action: "UPDATE",
        entityType: "Employee",
        entityId: employee.id,
        before: {
          department: employee.currentDepartment?.name,
          position: employee.currentPosition?.title,
          manager: employee.manager?.fullName,
        },
        after: {
          department: updatedEmployee.currentDepartment?.name,
          position: updatedEmployee.currentPosition?.title,
          manager: updatedEmployee.manager?.fullName,
          transferType: data.transferType,
          effectiveDate: data.effectiveDate,
          skNumber: data.skNumber,
        },
        ip: actor.ip,
        userAgent: actor.userAgent,
      },
      tx,
    );

    return { updatedEmployee, newHistory };
  });

  return result;
}
