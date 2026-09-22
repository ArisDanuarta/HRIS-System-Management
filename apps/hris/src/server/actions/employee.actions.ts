"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getSession, getAuthContext } from "@pspk/auth";
import { assertCan, AuthContext } from "@pspk/rbac";
import {
  createEmployeeSchema,
  updateEmployeeSchema,
  unmaskFieldSchema,
  CreateEmployeeInput,
  UpdateEmployeeInput,
  UnmaskFieldInput,
} from "../schemas/employee.schema";
import {
  createEmployee,
  updateEmployee,
  deleteEmployee,
  unmaskSensitiveField,
  ActorContext,
} from "../services/employee.service";

async function getAuthenticatedActor(): Promise<{ actor: ActorContext; authCtx: AuthContext }> {
  const reqHeaders = await headers();
  const session = await getSession(reqHeaders);

  if (!session?.user) {
    throw new Error("Sesi Anda telah kedaluwarsa. Silakan masuk kembali.");
  }

  const authCtx = await getAuthContext(session.user.id);
  if (!authCtx) {
    throw new Error("Pengguna tidak aktif atau hak akses tidak valid.");
  }

  const clientIp = reqHeaders.get("x-forwarded-for") || reqHeaders.get("x-real-ip") || null;
  const userAgent = reqHeaders.get("user-agent") || null;

  return {
    actor: {
      id: session.user.id,
      email: session.user.email,
      ip: clientIp,
      userAgent,
    },
    authCtx,
  };
}

export async function createEmployeeAction(input: CreateEmployeeInput) {
  try {
    const { actor, authCtx } = await getAuthenticatedActor();
    assertCan(authCtx, "hris.employee.write:all");

    const parsed = createEmployeeSchema.safeParse(input);
    if (!parsed.success) {
      const errorMsg = parsed.error.issues[0]?.message || "Validasi data pegawai gagal.";
      return { ok: false as const, error: errorMsg };
    }

    const newEmp = await createEmployee(parsed.data, actor);
    revalidatePath("/karyawan");

    return {
      ok: true as const,
      data: {
        id: newEmp.id,
        employeeNo: newEmp.employeeNo,
      },
      message: `Pegawai ${newEmp.fullName} (${newEmp.employeeNo}) berhasil ditambahkan.`,
    };
  } catch (err: unknown) {
    console.error("createEmployeeAction error:", err);
    const errorMsg = err instanceof Error ? err.message : "Gagal menambahkan pegawai.";
    return { ok: false as const, error: errorMsg };
  }
}

export async function updateEmployeeAction(input: UpdateEmployeeInput) {
  try {
    const { actor, authCtx } = await getAuthenticatedActor();
    assertCan(authCtx, "hris.employee.write:all");

    const parsed = updateEmployeeSchema.safeParse(input);
    if (!parsed.success) {
      const errorMsg = parsed.error.issues[0]?.message || "Validasi data pegawai gagal.";
      return { ok: false as const, error: errorMsg };
    }

    const updated = await updateEmployee(parsed.data, actor);
    revalidatePath("/karyawan");
    revalidatePath(`/karyawan/${updated.id}`);

    return {
      ok: true as const,
      data: { id: updated.id },
      message: `Data pegawai ${updated.fullName} berhasil diperbarui.`,
    };
  } catch (err: unknown) {
    console.error("updateEmployeeAction error:", err);
    const errorMsg = err instanceof Error ? err.message : "Gagal memperbarui data pegawai.";
    return { ok: false as const, error: errorMsg };
  }
}

export async function deleteEmployeeAction(id: string) {
  try {
    const { actor, authCtx } = await getAuthenticatedActor();
    assertCan(authCtx, "hris.employee.write:all");

    const deleted = await deleteEmployee(id, actor);
    revalidatePath("/karyawan");

    return {
      ok: true as const,
      data: { id: deleted.id },
      message: `Pegawai ${deleted.fullName} berhasil dinonaktifkan.`,
    };
  } catch (err: unknown) {
    console.error("deleteEmployeeAction error:", err);
    const errorMsg = err instanceof Error ? err.message : "Gagal menonaktifkan pegawai.";
    return { ok: false as const, error: errorMsg };
  }
}

export async function unmaskSensitiveFieldAction(input: UnmaskFieldInput) {
  try {
    const { actor, authCtx } = await getAuthenticatedActor();
    assertCan(authCtx, "hris.employee.read:all");

    const parsed = unmaskFieldSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false as const, error: "Permintaan data tidak valid." };
    }

    const result = await unmaskSensitiveField(parsed.data.employeeId, parsed.data.field, actor);

    return {
      ok: true as const,
      data: result,
    };
  } catch (err: unknown) {
    console.error("unmaskSensitiveFieldAction error:", err);
    const errorMsg = err instanceof Error ? err.message : "Gagal membuka data sensitif.";
    return { ok: false as const, error: errorMsg };
  }
}

export type ImportEmployeeRow = {
  fullName: string;
  employeeNo: string;
  workEmail: string;
  phone?: string;
  departmentName: string;
  positionTitle: string;
  employmentType: "PERMANENT" | "FIXED_TERM" | "PART_TIME_PROJECT";
  baseSalary?: number;
  joinDate: string;
};

export async function importEmployeesBatchAction(rows: ImportEmployeeRow[]) {
  try {
    const { actor, authCtx } = await getAuthenticatedActor();
    assertCan(authCtx, "hris.employee.import:all");

    if (!rows || rows.length === 0) {
      return { ok: false as const, error: "Tidak ada baris data yang diunggah." };
    }

    const { prisma, writeAudit } = await import("@pspk/db");

    // Pre-fetch departments and positions
    const departments = await prisma.department.findMany({
      include: { positions: true },
    });

    const results = await prisma.$transaction(async (tx) => {
      let importedCount = 0;
      const failedRows: { row: number; reason: string }[] = [];

      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        if (!r) continue;

        // Check if NIP or email already exists
        const existing = await tx.employee.findFirst({
          where: {
            OR: [
              { employeeNo: r.employeeNo.trim() },
              { workEmail: r.workEmail.toLowerCase().trim() },
            ],
          },
        });

        if (existing) {
          failedRows.push({
            row: i + 1,
            reason: `NIP ${r.employeeNo} atau Email ${r.workEmail} sudah ada di database`,
          });
          continue;
        }

        // Find or create department
        const dept = departments.find(
          (d) => d.name.toLowerCase() === r.departmentName.trim().toLowerCase(),
        );
        let deptId = dept?.id;
        if (!deptId) {
          const newDept = await tx.department.create({
            data: { name: r.departmentName.trim() },
          });
          deptId = newDept.id;
        }

        // Find or create position
        const pos = dept?.positions.find(
          (p) => p.title.toLowerCase() === r.positionTitle.trim().toLowerCase(),
        );
        let posId = pos?.id;
        if (!posId) {
          const newPos = await tx.position.create({
            data: { title: r.positionTitle.trim(), departmentId: deptId },
          });
          posId = newPos.id;
        }

        // Create employee
        await tx.employee.create({
          data: {
            employeeNo: r.employeeNo.trim(),
            fullName: r.fullName.trim(),
            workEmail: r.workEmail.toLowerCase().trim(),
            phone: r.phone?.trim() || null,
            joinDate: new Date(r.joinDate),
            status: "ACTIVE",
            currentDepartmentId: deptId,
            currentPositionId: posId,
            contracts: {
              create: {
                type: r.employmentType || "PERMANENT",
                startDate: new Date(r.joinDate),
                baseSalary: r.baseSalary ? Number(r.baseSalary) : null,
                status: "ACTIVE",
                notes: "Diimpor massal dari spreadsheet",
              },
            },
            histories: {
              create: {
                departmentId: deptId,
                positionId: posId,
                startDate: new Date(r.joinDate),
                notes: "Penempatan awal via impor massal",
              },
            },
          },
        });

        importedCount++;
      }

      await writeAudit(
        {
          actorUserId: actor.id,
          actorEmail: actor.email,
          app: "hris",
          action: "IMPORT",
          entityType: "Employee",
          before: { totalSubmittedRows: rows.length },
          after: { importedCount, failedCount: failedRows.length },
          ip: actor.ip,
          userAgent: actor.userAgent,
        },
        tx,
      );

      return { importedCount, failedRows };
    });

    revalidatePath("/karyawan");

    return {
      ok: true as const,
      data: results,
      message: `Berhasil mengimpor ${results.importedCount} pegawai.`,
    };
  } catch (err: unknown) {
    console.error("importEmployeesBatchAction error:", err);
    const errorMsg = err instanceof Error ? err.message : "Gagal mengimpor data pegawai.";
    return { ok: false as const, error: errorMsg };
  }
}
