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
import { prisma } from "@pspk/db";
import {
  createEmployee,
  updateEmployee,
  deleteEmployee,
  unmaskSensitiveField,
  ActorContext,
} from "../services/employee.service";

export async function generateNextEmployeeNoAction(joinDate?: string) {
  try {
    const { authCtx } = await getAuthenticatedActor();
    assertCan(authCtx, "hris.employee.write:all");

    // Format target: PSPK-YYYYMM-XXX
    let year = new Date().getFullYear();
    let month = String(new Date().getMonth() + 1).padStart(2, "0");

    if (joinDate && joinDate.trim() !== "") {
      const parts = joinDate.split("-");
      if (parts[0] && parts[1]) {
        year = parseInt(parts[0], 10) || year;
        month = String(parseInt(parts[1], 10) || month).padStart(2, "0");
      }
    }

    const prefix = `PSPK-${year}${month}-`;

    const existing = await prisma.employee.findMany({
      where: {
        employeeNo: { startsWith: prefix },
      },
      select: { employeeNo: true },
    });

    let maxSeq = 0;
    for (const emp of existing) {
      const parts = emp.employeeNo.split("-");
      const seqPart = parts[2];
      if (seqPart) {
        const num = parseInt(seqPart, 10);
        if (!isNaN(num) && num > maxSeq) {
          maxSeq = num;
        }
      }
    }

    let nextSeq = maxSeq + 1;
    let candidate = `${prefix}${String(nextSeq).padStart(3, "0")}`;

    // Verifikasi agar tidak ada bentrok
    let exists = await prisma.employee.findUnique({
      where: { employeeNo: candidate },
    });
    while (exists) {
      nextSeq++;
      candidate = `${prefix}${String(nextSeq).padStart(3, "0")}`;
      exists = await prisma.employee.findUnique({
        where: { employeeNo: candidate },
      });
    }

    return {
      ok: true as const,
      data: { employeeNo: candidate },
    };
  } catch (err: unknown) {
    console.error("generateNextEmployeeNoAction error:", err);
    const msg = err instanceof Error ? err.message : "Gagal membuat NIP otomatis.";
    return { ok: false as const, error: msg };
  }
}

export async function checkEmployeeNoAvailabilityAction(
  employeeNo: string,
  currentEmployeeId?: string,
) {
  try {
    const trimmed = employeeNo.trim();
    if (!trimmed || trimmed.length < 3) {
      return { ok: false as const, error: "NIP terlalu pendek (minimal 3 karakter)." };
    }

    const existing = await prisma.employee.findUnique({
      where: { employeeNo: trimmed },
      select: { id: true, fullName: true, employeeNo: true },
    });

    if (existing && existing.id !== currentEmployeeId) {
      return {
        ok: true as const,
        available: false,
        message: `NIP '${trimmed}' sudah digunakan oleh ${existing.fullName}.`,
        existingName: existing.fullName,
      };
    }

    return {
      ok: true as const,
      available: true,
      message: `NIP '${trimmed}' tersedia dan dapat digunakan.`,
    };
  } catch (err: unknown) {
    console.error("checkEmployeeNoAvailabilityAction error:", err);
    return { ok: false as const, error: "Gagal memeriksa ketersediaan NIP." };
  }
}

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

    const { employee: newEmp, accountCreated, credentials } = await createEmployee(parsed.data, actor);
    revalidatePath("/karyawan");

    return {
      ok: true as const,
      data: {
        id: newEmp.id,
        employeeNo: newEmp.employeeNo,
        fullName: newEmp.fullName,
        accountCreated,
        credentials,
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
