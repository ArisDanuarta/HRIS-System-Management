"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getSession, getAuthContext } from "@pspk/auth";
import { assertCan } from "@pspk/rbac";
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

async function getAuthenticatedActor(): Promise<{ actor: ActorContext; authCtx: any }> {
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
  } catch (err: any) {
    console.error("createEmployeeAction error:", err);
    return { ok: false as const, error: err.message || "Gagal menambahkan pegawai." };
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
  } catch (err: any) {
    console.error("updateEmployeeAction error:", err);
    return { ok: false as const, error: err.message || "Gagal memperbarui data pegawai." };
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
  } catch (err: any) {
    console.error("deleteEmployeeAction error:", err);
    return { ok: false as const, error: err.message || "Gagal menonaktifkan pegawai." };
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
  } catch (err: any) {
    console.error("unmaskSensitiveFieldAction error:", err);
    return { ok: false as const, error: err.message || "Gagal membuka data sensitif." };
  }
}
