"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getSession, getAuthContext } from "@pspk/auth";
import {
  createEmploymentType,
  updateEmploymentType,
  deleteEmploymentType,
  toggleEmploymentTypeStatus,
  CreateEmploymentTypeDTO,
  UpdateEmploymentTypeDTO,
} from "../services/employment-type.service";

async function getActorInfo() {
  const reqHeaders = await headers();
  const session = await getSession(reqHeaders);

  if (!session?.user) {
    throw new Error("Sesi Anda telah kedaluwarsa. Silakan masuk kembali.");
  }

  const authCtx = await getAuthContext(session.user.id);
  if (!authCtx) {
    throw new Error("Pengguna tidak aktif atau hak akses tidak valid.");
  }

  const isSuperAdmin = authCtx.roles.includes("super_admin");
  const isAdminHr = authCtx.roles.includes("admin_hr");

  if (!isSuperAdmin && !isAdminHr) {
    throw new Error("Hanya Admin HR atau Super Admin yang berwenang mengelola data ikatan kerja.");
  }

  const ip = reqHeaders.get("x-forwarded-for") || reqHeaders.get("x-real-ip") || "127.0.0.1";
  const userAgent = reqHeaders.get("user-agent") || "unknown";

  return {
    userId: session.user.id,
    email: session.user.email,
    ip,
    userAgent,
  };
}

export async function createEmploymentTypeAction(input: CreateEmploymentTypeDTO) {
  try {
    const actor = await getActorInfo();
    const result = await createEmploymentType(input, actor);

    revalidatePath("/karyawan/organisasi");
    revalidatePath("/karyawan/baru");

    return {
      ok: true as const,
      data: result,
      message: `Tipe ikatan kerja '${result.name}' berhasil ditambahkan.`,
    };
  } catch (err: unknown) {
    console.error("createEmploymentTypeAction error:", err);
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Gagal menambahkan tipe ikatan kerja.",
    };
  }
}

export async function updateEmploymentTypeAction(input: UpdateEmploymentTypeDTO) {
  try {
    const actor = await getActorInfo();
    const result = await updateEmploymentType(input, actor);

    revalidatePath("/karyawan/organisasi");
    revalidatePath("/karyawan/baru");

    return {
      ok: true as const,
      data: result,
      message: `Tipe ikatan kerja '${result.name}' berhasil diperbarui.`,
    };
  } catch (err: unknown) {
    console.error("updateEmploymentTypeAction error:", err);
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Gagal memperbarui tipe ikatan kerja.",
    };
  }
}

export async function deleteEmploymentTypeAction(id: string) {
  try {
    const actor = await getActorInfo();
    const result = await deleteEmploymentType(id, actor);

    revalidatePath("/karyawan/organisasi");
    revalidatePath("/karyawan/baru");

    return {
      ok: true as const,
      deactivated: result.deactivated,
      message: result.message,
    };
  } catch (err: unknown) {
    console.error("deleteEmploymentTypeAction error:", err);
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Gagal menghapus tipe ikatan kerja.",
    };
  }
}

export async function toggleEmploymentTypeStatusAction(id: string, isActive: boolean) {
  try {
    const actor = await getActorInfo();
    const result = await toggleEmploymentTypeStatus(id, isActive, actor);

    revalidatePath("/karyawan/organisasi");
    revalidatePath("/karyawan/baru");

    return {
      ok: true as const,
      message: `Status tipe ikatan kerja '${result.name}' berhasil diubah menjadi ${
        isActive ? "Aktif" : "Nonaktif"
      }.`,
    };
  } catch (err: unknown) {
    console.error("toggleEmploymentTypeStatusAction error:", err);
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Gagal mengubah status tipe ikatan kerja.",
    };
  }
}
