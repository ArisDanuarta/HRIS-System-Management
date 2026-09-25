"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getSession, getAuthContext } from "@pspk/auth";
import {
  workScheduleSchema,
  WorkScheduleInput,
} from "../schemas/work-schedule.schema";
import { updateWorkSchedule } from "../services/work-schedule.service";

/**
 * Server Action: Update Work Schedule Setting
 * Restricted strictly to Admin HR and Super Admin.
 */
export async function updateWorkScheduleAction(input: WorkScheduleInput) {
  try {
    const reqHeaders = await headers();
    const session = await getSession(reqHeaders);

    if (!session?.user) {
      return {
        success: false,
        message: "Sesi Anda telah berakhir. Silakan masuk kembali.",
      };
    }

    const authCtx = await getAuthContext(session.user.id);
    if (!authCtx) {
      return {
        success: false,
        message: "Hak akses tidak valid atau pengguna tidak aktif.",
      };
    }

    const isAuthorized =
      authCtx.roles.includes("super_admin") || authCtx.roles.includes("admin_hr");

    if (!isAuthorized) {
      return {
        success: false,
        message: "Anda tidak memiliki wewenang untuk mengubah pengaturan jadwal kerja kantor.",
      };
    }

    const validated = workScheduleSchema.parse(input);
    const updated = await updateWorkSchedule(validated, session.user.id);

    revalidatePath("/cuti/pengaturan");
    revalidatePath("/absensi");
    revalidatePath("/absensi/rekap");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: "Pengaturan jam kerja dan toleransi kehadiran berhasil disimpan!",
      data: updated,
    };
  } catch (err) {
    console.error("Gagal memperbarui work schedule:", err);
    return {
      success: false,
      message:
        err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan pengaturan jadwal.",
    };
  }
}
