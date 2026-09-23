"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getSession, getAuthContext } from "@pspk/auth";
import { assertCan, AuthContext } from "@pspk/rbac";
import { getStorageProvider } from "@pspk/storage";
import {
  createDepartmentSchema,
  updateDepartmentSchema,
  createPositionSchema,
  updatePositionSchema,
  transferEmployeePositionSchema,
  CreateDepartmentInput,
  UpdateDepartmentInput,
  CreatePositionInput,
  UpdatePositionInput,
} from "../schemas/organization.schema";
import {
  createDepartment,
  updateDepartment,
  deleteDepartment,
  createPosition,
  updatePosition,
  deletePosition,
  transferEmployeePosition,
} from "../services/organization.service";
import { ActorContext } from "../services/employee.service";

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
      userAgent: userAgent,
    },
    authCtx,
  };
}

/**
 * Server Actions: Divisi / Departemen
 */
export async function createDepartmentAction(input: CreateDepartmentInput) {
  try {
    const { actor, authCtx } = await getAuthenticatedActor();
    assertCan(authCtx, "hris.employee.write:all");

    const validated = createDepartmentSchema.parse(input);
    const department = await createDepartment(validated, actor);

    revalidatePath("/karyawan");
    revalidatePath("/karyawan/organisasi");
    revalidatePath("/karyawan/baru");

    return { ok: true as const, data: department };
  } catch (err: unknown) {
    console.error("createDepartmentAction error:", err);
    const msg = err instanceof Error ? err.message : "Gagal menambahkan divisi baru.";
    return { ok: false as const, error: msg };
  }
}

export async function updateDepartmentAction(input: UpdateDepartmentInput) {
  try {
    const { actor, authCtx } = await getAuthenticatedActor();
    assertCan(authCtx, "hris.employee.write:all");

    const validated = updateDepartmentSchema.parse(input);
    const department = await updateDepartment(validated, actor);

    revalidatePath("/karyawan");
    revalidatePath("/karyawan/organisasi");

    return { ok: true as const, data: department };
  } catch (err: unknown) {
    console.error("updateDepartmentAction error:", err);
    const msg = err instanceof Error ? err.message : "Gagal memperbarui data divisi.";
    return { ok: false as const, error: msg };
  }
}

export async function deleteDepartmentAction(id: string) {
  try {
    const { actor, authCtx } = await getAuthenticatedActor();
    assertCan(authCtx, "hris.employee.write:all");

    await deleteDepartment(id, actor);

    revalidatePath("/karyawan");
    revalidatePath("/karyawan/organisasi");
    revalidatePath("/karyawan/baru");

    return { ok: true as const };
  } catch (err: unknown) {
    console.error("deleteDepartmentAction error:", err);
    const msg = err instanceof Error ? err.message : "Gagal menghapus divisi.";
    return { ok: false as const, error: msg };
  }
}

/**
 * Server Actions: Jabatan / Posisi Riset
 */
export async function createPositionAction(input: CreatePositionInput) {
  try {
    const { actor, authCtx } = await getAuthenticatedActor();
    assertCan(authCtx, "hris.employee.write:all");

    const validated = createPositionSchema.parse(input);
    const position = await createPosition(validated, actor);

    revalidatePath("/karyawan");
    revalidatePath("/karyawan/organisasi");
    revalidatePath("/karyawan/baru");

    return { ok: true as const, data: position };
  } catch (err: unknown) {
    console.error("createPositionAction error:", err);
    const msg = err instanceof Error ? err.message : "Gagal menambahkan jabatan baru.";
    return { ok: false as const, error: msg };
  }
}

export async function updatePositionAction(input: UpdatePositionInput) {
  try {
    const { actor, authCtx } = await getAuthenticatedActor();
    assertCan(authCtx, "hris.employee.write:all");

    const validated = updatePositionSchema.parse(input);
    const position = await updatePosition(validated, actor);

    revalidatePath("/karyawan");
    revalidatePath("/karyawan/organisasi");

    return { ok: true as const, data: position };
  } catch (err: unknown) {
    console.error("updatePositionAction error:", err);
    const msg = err instanceof Error ? err.message : "Gagal memperbarui data jabatan.";
    return { ok: false as const, error: msg };
  }
}

export async function deletePositionAction(id: string) {
  try {
    const { actor, authCtx } = await getAuthenticatedActor();
    assertCan(authCtx, "hris.employee.write:all");

    await deletePosition(id, actor);

    revalidatePath("/karyawan");
    revalidatePath("/karyawan/organisasi");
    revalidatePath("/karyawan/baru");

    return { ok: true as const };
  } catch (err: unknown) {
    console.error("deletePositionAction error:", err);
    const msg = err instanceof Error ? err.message : "Gagal menghapus jabatan.";
    return { ok: false as const, error: msg };
  }
}

/**
 * Server Action: Mutasi / Promosi / Perubahan Jabatan Pegawai
 * Menerima FormData untuk mengakomodasi dokumen lampiran SK PDF opsional.
 */
export async function transferEmployeePositionAction(formData: FormData) {
  try {
    const { actor, authCtx } = await getAuthenticatedActor();
    assertCan(authCtx, "hris.contract.write:all");

    const employeeId = formData.get("employeeId") as string;
    const departmentId = formData.get("departmentId") as string;
    const positionId = formData.get("positionId") as string;
    const managerIdRaw = formData.get("managerId") as string | null;
    const managerId = managerIdRaw && managerIdRaw.trim() !== "" ? managerIdRaw.trim() : null;
    const effectiveDate = formData.get("effectiveDate") as string;
    const transferType = formData.get("transferType") as string;
    const skNumberRaw = formData.get("skNumber") as string | null;
    const notesRaw = formData.get("notes") as string | null;

    let documentKey: string | null = null;
    const file = formData.get("documentFile") as File | null;

    if (file && file.size > 0) {
      if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
        return { ok: false as const, error: "Lampiran SK harus berupa berkas PDF." };
      }
      if (file.size > 10 * 1024 * 1024) {
        return { ok: false as const, error: "Ukuran berkas PDF maksimal 10 MB." };
      }

      const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const storageKey = `sk-mutasi/${employeeId}_${Date.now()}_${safeFileName}`;
      const buffer = Buffer.from(await file.arrayBuffer());

      const storage = getStorageProvider();
      await storage.put(storageKey, buffer, { contentType: "application/pdf" });
      documentKey = storageKey;
    }

    const validated = transferEmployeePositionSchema.parse({
      employeeId,
      departmentId,
      positionId,
      managerId,
      effectiveDate,
      transferType,
      skNumber: skNumberRaw?.trim() || null,
      notes: notesRaw?.trim() || null,
      documentKey,
    });

    const result = await transferEmployeePosition(validated, actor);

    revalidatePath("/karyawan");
    revalidatePath(`/karyawan/${employeeId}`);

    return { ok: true as const, data: result };
  } catch (err: unknown) {
    console.error("transferEmployeePositionAction error:", err);
    const msg = err instanceof Error ? err.message : "Gagal memproses mutasi/perubahan jabatan pegawai.";
    return { ok: false as const, error: msg };
  }
}
