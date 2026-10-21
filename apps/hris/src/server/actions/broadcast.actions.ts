"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getSession } from "@pspk/auth";
import { prisma } from "@pspk/db";
import {
  sendBroadcastSchema,
  SendBroadcastInput,
} from "../schemas/broadcast.schema";
import {
  getBroadcastSenderContext,
  executeSendBroadcast,
  BroadcastSenderContext,
} from "../services/broadcast-email.service";

export interface BroadcastFormData {
  senderCtx: BroadcastSenderContext;
  departments: Array<{ id: string; name: string }>;
  employees: Array<{
    id: string;
    fullName: string;
    workEmail: string;
    departmentName: string | null;
  }>;
  teamMembers: Array<{
    id: string;
    fullName: string;
    workEmail: string;
    positionTitle: string | null;
  }>;
}

/**
 * Mengambil metadata yang diperlukan formulir broadcast:
 * Konteks pengirim, daftar departemen, daftar pegawai (untuk HR), dan daftar bawahan (untuk Manajer).
 */
export async function getBroadcastFormDataAction(): Promise<{
  success: boolean;
  data?: BroadcastFormData;
  error?: string;
}> {
  try {
    const reqHeaders = await headers();
    const session = await getSession(reqHeaders);

    if (!session?.user) {
      return { success: false, error: "Sesi telah berakhir. Harap login kembali." };
    }

    const senderCtx = await getBroadcastSenderContext(session.user.id);

    // Ambil daftar departemen aktif
    const departments = await prisma.department.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    // Ambil daftar seluruh pegawai aktif (jika Admin HR/Super Admin)
    let employees: Array<{
      id: string;
      fullName: string;
      workEmail: string;
      departmentName: string | null;
    }> = [];

    if (senderCtx.isSuperAdmin || senderCtx.isAdminHr) {
      const allActive = await prisma.employee.findMany({
        where: { status: "ACTIVE" },
        select: {
          id: true,
          fullName: true,
          workEmail: true,
          currentDepartment: { select: { name: true } },
        },
        orderBy: { fullName: "asc" },
      });

      employees = allActive.map((e) => ({
        id: e.id,
        fullName: e.fullName,
        workEmail: e.workEmail,
        departmentName: e.currentDepartment?.name || null,
      }));
    }

    // Ambil daftar anggota tim bawahan langsung
    let teamMembers: Array<{
      id: string;
      fullName: string;
      workEmail: string;
      positionTitle: string | null;
    }> = [];

    if (senderCtx.employeeId) {
      const subordinates = await prisma.employee.findMany({
        where: {
          status: "ACTIVE",
          managerId: senderCtx.employeeId,
        },
        select: {
          id: true,
          fullName: true,
          workEmail: true,
          currentPosition: { select: { title: true } },
        },
        orderBy: { fullName: "asc" },
      });

      teamMembers = subordinates.map((s) => ({
        id: s.id,
        fullName: s.fullName,
        workEmail: s.workEmail,
        positionTitle: s.currentPosition?.title || null,
      }));
    }

    return {
      success: true,
      data: {
        senderCtx,
        departments,
        employees,
        teamMembers,
      },
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Gagal memuat data formulir";
    return { success: false, error: errorMsg };
  }
}

/**
 * Server action untuk mengirimkan broadcast pengumuman email.
 */
export async function sendBroadcastAction(
  rawInput: SendBroadcastInput,
): Promise<{
  success: boolean;
  message?: string;
  broadcastId?: string;
  error?: string;
}> {
  try {
    const reqHeaders = await headers();
    const session = await getSession(reqHeaders);

    if (!session?.user) {
      return { success: false, error: "Sesi tidak valid. Harap login kembali." };
    }

    // Validasi input skema Zod
    const parseResult = sendBroadcastSchema.safeParse(rawInput);
    if (!parseResult.success) {
      return {
        success: false,
        error: parseResult.error.issues[0]?.message || "Data formulir tidak valid.",
      };
    }

    const ip = reqHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const userAgent = reqHeaders.get("user-agent") || "unknown";

    const result = await executeSendBroadcast(session.user.id, parseResult.data, {
      ip,
      userAgent,
    });

    revalidatePath("/komunikasi/riwayat");
    revalidatePath("/notifikasi");

    return {
      success: true,
      message: result.message,
      broadcastId: result.broadcastId,
    };
  } catch (err: unknown) {
    console.error("Gagal menjalankan sendBroadcastAction:", err);
    const errorMsg = err instanceof Error ? err.message : "Terjadi kesalahan internal saat pengiriman broadcast.";
    return { success: false, error: errorMsg };
  }
}

/**
 * Server action untuk mengambil detail satu pengumuman broadcast dan rincian penerimanya.
 */
export async function getBroadcastDetailAction(broadcastId: string) {
  try {
    const reqHeaders = await headers();
    const session = await getSession(reqHeaders);

    if (!session?.user) {
      return { success: false, error: "Sesi telah berakhir. Harap login kembali." };
    }

    const { getBroadcastDetail } = await import("../queries/broadcast.queries");
    const detail = await getBroadcastDetail(session.user.id, broadcastId);

    return { success: true, data: detail };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Gagal memuat rincian pengumuman.";
    return { success: false, error: errorMsg };
  }
}

