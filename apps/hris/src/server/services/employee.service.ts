import { prisma, writeAudit } from "@pspk/db";
import { encryptField, decryptField } from "@pspk/shared";
import { CreateEmployeeInput, UpdateEmployeeInput } from "../schemas/employee.schema";

export type ActorContext = {
  id: string;
  email: string;
  ip?: string | null;
  userAgent?: string | null;
};

export async function createEmployee(data: CreateEmployeeInput, actor: ActorContext) {
  // 1. Validation checks
  const existingEmail = await prisma.employee.findUnique({
    where: { workEmail: data.workEmail.toLowerCase().trim() },
  });
  if (existingEmail) {
    throw new Error(`Email kantor ${data.workEmail} sudah terdaftar.`);
  }

  const existingNip = await prisma.employee.findUnique({
    where: { employeeNo: data.employeeNo.trim() },
  });
  if (existingNip) {
    throw new Error(`Nomor Induk Pegawai ${data.employeeNo} sudah digunakan.`);
  }

  // 2. Encrypt sensitive fields
  const nikEnc = data.nik && data.nik.trim() !== "" ? encryptField(data.nik.trim()) : null;
  const npwpEnc = data.npwp && data.npwp.trim() !== "" ? encryptField(data.npwp.trim()) : null;
  const bankAccountEnc =
    data.bankAccount && data.bankAccount.trim() !== "" ? encryptField(data.bankAccount.trim()) : null;

  // 3. Database transaction
  const result = await prisma.$transaction(async (tx) => {
    let linkedUserId: string | null = null;

    // Optional user account creation
    if (data.createUserAccount) {
      let existingUser = await tx.user.findUnique({
        where: { email: data.workEmail.toLowerCase().trim() },
      });

      if (!existingUser) {
        existingUser = await tx.user.create({
          data: {
            email: data.workEmail.toLowerCase().trim(),
            name: data.fullName,
            isActive: true,
          },
        });

        // Assign default 'staff' role
        const staffRole = await tx.role.findUnique({ where: { key: "staff" } });
        if (staffRole) {
          await tx.userRole.create({
            data: {
              userId: existingUser.id,
              roleId: staffRole.id,
            },
          });
        }
      }
      linkedUserId = existingUser.id;
    }

    // Create employee
    const newEmployee = await tx.employee.create({
      data: {
        employeeNo: data.employeeNo.trim(),
        userId: linkedUserId,
        fullName: data.fullName.trim(),
        nickname: data.nickname?.trim() || null,
        workEmail: data.workEmail.toLowerCase().trim(),
        personalEmail: data.personalEmail?.toLowerCase().trim() || null,
        phone: data.phone?.trim() || null,
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
        birthPlace: data.birthPlace?.trim() || null,
        gender: data.gender || null,
        maritalStatus: data.maritalStatus || null,
        address: data.address?.trim() || null,
        emergencyContactName: data.emergencyContactName?.trim() || null,
        emergencyContactPhone: data.emergencyContactPhone?.trim() || null,
        nikEnc,
        npwpEnc,
        bankName: data.bankName?.trim() || null,
        bankAccountEnc,
        bankAccountName: data.bankAccountName?.trim() || null,
        joinDate: new Date(data.joinDate),
        endDate: data.contractEndDate ? new Date(data.contractEndDate) : null,
        status: data.status,
        managerId: data.managerId || null,
        currentDepartmentId: data.currentDepartmentId,
        currentPositionId: data.currentPositionId,
      },
    });

    // Create initial employment contract
    const newContract = await tx.employmentContract.create({
      data: {
        employeeId: newEmployee.id,
        type: data.employmentType,
        startDate: new Date(data.contractStartDate),
        endDate: data.contractEndDate ? new Date(data.contractEndDate) : null,
        baseSalary: data.baseSalary !== undefined ? data.baseSalary : null,
        status: "ACTIVE",
        notes: data.contractNotes?.trim() || "Kontrak kerja awal saat pendaftaran pegawai",
      },
    });

    // Create initial employment history entry
    await tx.employmentHistory.create({
      data: {
        employeeId: newEmployee.id,
        departmentId: data.currentDepartmentId,
        positionId: data.currentPositionId,
        startDate: new Date(data.joinDate),
        notes: "Penempatan posisi awal",
      },
    });

    // Write audit log
    await writeAudit(
      {
        actorUserId: actor.id,
        actorEmail: actor.email,
        app: "hris",
        action: "CREATE",
        entityType: "Employee",
        entityId: newEmployee.id,
        after: {
          employeeNo: newEmployee.employeeNo,
          fullName: newEmployee.fullName,
          workEmail: newEmployee.workEmail,
          departmentId: newEmployee.currentDepartmentId,
          positionId: newEmployee.currentPositionId,
          contractType: newContract.type,
        },
        ip: actor.ip,
        userAgent: actor.userAgent,
      },
      tx,
    );

    return newEmployee;
  });

  return result;
}

export async function updateEmployee(data: UpdateEmployeeInput, actor: ActorContext) {
  const current = await prisma.employee.findUnique({
    where: { id: data.id },
    include: { contracts: { where: { status: "ACTIVE" }, take: 1 } },
  });

  if (!current || current.deletedAt) {
    throw new Error("Data pegawai tidak ditemukan.");
  }

  // Check email conflict
  if (data.workEmail.toLowerCase().trim() !== current.workEmail.toLowerCase()) {
    const existingEmail = await prisma.employee.findUnique({
      where: { workEmail: data.workEmail.toLowerCase().trim() },
    });
    if (existingEmail && existingEmail.id !== data.id) {
      throw new Error(`Email ${data.workEmail} sudah digunakan pegawai lain.`);
    }
  }

  // Handle sensitive data updates
  let nikEnc = current.nikEnc;
  if (data.nik && data.nik.trim() !== "") {
    nikEnc = encryptField(data.nik.trim());
  }

  let npwpEnc = current.npwpEnc;
  if (data.npwp && data.npwp.trim() !== "") {
    npwpEnc = encryptField(data.npwp.trim());
  }

  let bankAccountEnc = current.bankAccountEnc;
  if (data.bankAccount && data.bankAccount.trim() !== "") {
    bankAccountEnc = encryptField(data.bankAccount.trim());
  }

  const result = await prisma.$transaction(async (tx) => {
    // Check if position or department changed to log history
    const isTransferred =
      data.currentDepartmentId !== current.currentDepartmentId ||
      data.currentPositionId !== current.currentPositionId;

    if (isTransferred) {
      // Close previous history
      const lastHistory = await tx.employmentHistory.findFirst({
        where: { employeeId: current.id, endDate: null },
        orderBy: { startDate: "desc" },
      });

      if (lastHistory) {
        await tx.employmentHistory.update({
          where: { id: lastHistory.id },
          data: { endDate: new Date() },
        });
      }

      // Add new history
      await tx.employmentHistory.create({
        data: {
          employeeId: current.id,
          departmentId: data.currentDepartmentId,
          positionId: data.currentPositionId,
          startDate: new Date(),
          notes: "Mutasi / Penyesuaian Jabatan oleh HR",
        },
      });
    }

    // Update employee record
    const updated = await tx.employee.update({
      where: { id: data.id },
      data: {
        fullName: data.fullName.trim(),
        nickname: data.nickname?.trim() || null,
        workEmail: data.workEmail.toLowerCase().trim(),
        personalEmail: data.personalEmail?.toLowerCase().trim() || null,
        phone: data.phone?.trim() || null,
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
        birthPlace: data.birthPlace?.trim() || null,
        gender: data.gender || null,
        maritalStatus: data.maritalStatus || null,
        address: data.address?.trim() || null,
        emergencyContactName: data.emergencyContactName?.trim() || null,
        emergencyContactPhone: data.emergencyContactPhone?.trim() || null,
        nikEnc,
        npwpEnc,
        bankName: data.bankName?.trim() || null,
        bankAccountEnc,
        bankAccountName: data.bankAccountName?.trim() || null,
        endDate: data.contractEndDate ? new Date(data.contractEndDate) : null,
        status: data.status,
        managerId: data.managerId || null,
        currentDepartmentId: data.currentDepartmentId,
        currentPositionId: data.currentPositionId,
      },
    });

    // Write audit log
    await writeAudit(
      {
        actorUserId: actor.id,
        actorEmail: actor.email,
        app: "hris",
        action: "UPDATE",
        entityType: "Employee",
        entityId: updated.id,
        before: {
          fullName: current.fullName,
          workEmail: current.workEmail,
          status: current.status,
          departmentId: current.currentDepartmentId,
          positionId: current.currentPositionId,
        },
        after: {
          fullName: updated.fullName,
          workEmail: updated.workEmail,
          status: updated.status,
          departmentId: updated.currentDepartmentId,
          positionId: updated.currentPositionId,
        },
        ip: actor.ip,
        userAgent: actor.userAgent,
      },
      tx,
    );

    return updated;
  });

  return result;
}

export async function deleteEmployee(id: string, actor: ActorContext) {
  const current = await prisma.employee.findUnique({
    where: { id },
  });

  if (!current || current.deletedAt) {
    throw new Error("Data pegawai tidak ditemukan.");
  }

  const result = await prisma.$transaction(async (tx) => {
    // Soft delete employee and set status to TERMINATED
    const updated = await tx.employee.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: "TERMINATED",
      },
    });

    // Terminate all active contracts
    await tx.employmentContract.updateMany({
      where: { employeeId: id, status: "ACTIVE" },
      data: {
        status: "TERMINATED",
        endDate: new Date(),
      },
    });

    // Deactivate linked user account if exists
    if (current.userId) {
      await tx.user.update({
        where: { id: current.userId },
        data: { isActive: false },
      });
    }

    // Write audit log
    await writeAudit(
      {
        actorUserId: actor.id,
        actorEmail: actor.email,
        app: "hris",
        action: "DELETE",
        entityType: "Employee",
        entityId: id,
        before: {
          fullName: current.fullName,
          employeeNo: current.employeeNo,
          status: current.status,
        },
        after: {
          deletedAt: updated.deletedAt,
          status: updated.status,
        },
        ip: actor.ip,
        userAgent: actor.userAgent,
      },
      tx,
    );

    return updated;
  });

  return result;
}

export async function unmaskSensitiveField(
  employeeId: string,
  field: "nik" | "npwp" | "bankAccount",
  actor: ActorContext,
) {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: {
      id: true,
      fullName: true,
      employeeNo: true,
      nikEnc: true,
      npwpEnc: true,
      bankAccountEnc: true,
      deletedAt: true,
    },
  });

  if (!employee || employee.deletedAt) {
    throw new Error("Data pegawai tidak ditemukan.");
  }

  let rawEncrypted: string | null = null;
  let fieldLabel = "";

  if (field === "nik") {
    rawEncrypted = employee.nikEnc;
    fieldLabel = "NIK";
  } else if (field === "npwp") {
    rawEncrypted = employee.npwpEnc;
    fieldLabel = "NPWP";
  } else if (field === "bankAccount") {
    rawEncrypted = employee.bankAccountEnc;
    fieldLabel = "Nomor Rekening Bank";
  }

  if (!rawEncrypted) {
    return { decryptedValue: "-" };
  }

  const decryptedValue = decryptField(rawEncrypted);

  // Write audit log for sensitive viewing
  await writeAudit({
    actorUserId: actor.id,
    actorEmail: actor.email,
    app: "hris",
    action: "VIEW_SENSITIVE",
    entityType: "Employee",
    entityId: employee.id,
    before: {
      fieldAccessed: fieldLabel,
      employeeNo: employee.employeeNo,
      employeeName: employee.fullName,
    },
    ip: actor.ip,
    userAgent: actor.userAgent,
  });

  return { decryptedValue };
}
