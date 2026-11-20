"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { getSession, getAuthContext } from "@pspk/auth";
import { can } from "@pspk/rbac";
import { prisma, BroadcastStatus } from "@pspk/db";
import {
  sendBroadcastSchema,
  SendBroadcastInput,
  sendTestBroadcastSchema,
  SendTestBroadcastInput,
} from "../schemas/broadcast.schema";
import {
  getBroadcastSenderContext,
  enqueueBroadcast,
  processBroadcast,
  sendTestBroadcast,
  resendFailedRecipients,
  deleteBroadcastAttachment,
  cancelScheduledBroadcast,
  markBroadcastAsRead,
  remindUnreadRecipients,
  BroadcastSenderContext,
} from "../services/broadcast-email.service";

export interface BroadcastFormData {
  senderCtx: BroadcastSenderContext;
  departments: Array<{ id: string; name: string }>;
  employees: Array<{
    id: string;
    fullName: string;
    workEmail: string;
    departmentId: string | null;
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

    // Ambil daftar seluruh pegawai aktif (jika memiliki hak canSendAll)
    let employees: BroadcastFormData["employees"] = [];

    if (senderCtx.canSendAll) {
      const allActive = await prisma.employee.findMany({
        where: { status: "ACTIVE" },
        select: {
          id: true,
          fullName: true,
          workEmail: true,
          currentDepartmentId: true,
          currentDepartment: { select: { name: true } },
        },
        orderBy: { fullName: "asc" },
      });

      employees = allActive.map((e) => ({
        id: e.id,
        fullName: e.fullName,
        workEmail: e.workEmail,
        departmentId: e.currentDepartmentId ?? null,
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

    const result = await enqueueBroadcast(session.user.id, parseResult.data, {
      ip,
      userAgent,
    });

    // Jalankan pengiriman di background worker menggunakan after() dari next/server HANYA jika bukan scheduled
    if (!result.scheduled) {
      after(async () => {
        try {
          await processBroadcast(result.broadcastId);
        } catch (err: unknown) {
          console.error("Gagal menjalankan background broadcast processor:", err);
        }
      });
    }

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
 * Server action untuk mengambil status progres pengiriman broadcast terkini.
 */
export async function getBroadcastProgressAction(broadcastId: string): Promise<{
  success: boolean;
  data?: {
    status: BroadcastStatus;
    totalRecipients: number;
    sentCount: number;
    failedCount: number;
  };
  error?: string;
}> {
  try {
    const reqHeaders = await headers();
    const session = await getSession(reqHeaders);

    if (!session?.user) {
      return { success: false, error: "Sesi telah berakhir. Harap login kembali." };
    }

    const broadcast = await prisma.emailBroadcast.findUnique({
      where: { id: broadcastId },
      select: {
        id: true,
        senderUserId: true,
        status: true,
        totalRecipients: true,
        sentCount: true,
        failedCount: true,
      },
    });

    if (!broadcast) {
      return { success: false, error: "Data broadcast tidak ditemukan." };
    }

    const authCtx = await getAuthContext(session.user.id);
    const isSuperAdmin = authCtx?.roles.includes("super_admin") || false;
    const isAdminHr = authCtx?.roles.includes("admin_hr") || false;
    const isAuthor = broadcast.senderUserId === session.user.id;
    const hasReadPerm = authCtx ? can(authCtx, "hris.broadcast.read:all") : false;

    if (!isSuperAdmin && !isAdminHr && !isAuthor && !hasReadPerm) {
      return { success: false, error: "Akses ditolak: Anda tidak memiliki izin untuk melihat progres broadcast ini." };
    }

    return {
      success: true,
      data: {
        status: broadcast.status,
        totalRecipients: broadcast.totalRecipients,
        sentCount: broadcast.sentCount,
        failedCount: broadcast.failedCount,
      },
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Gagal mengambil progres broadcast.";
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

/**
 * Server action untuk mengirimkan email uji pengumuman ke akun email sendiri.
 */
export async function sendTestBroadcastAction(rawInput: SendTestBroadcastInput): Promise<{
  success: boolean;
  message?: string;
  simulated?: boolean;
  error?: string;
}> {
  try {
    const reqHeaders = await headers();
    const session = await getSession(reqHeaders);

    if (!session?.user) {
      return { success: false, error: "Sesi tidak valid. Harap login kembali." };
    }

    const parseResult = sendTestBroadcastSchema.safeParse(rawInput);
    if (!parseResult.success) {
      return {
        success: false,
        error: parseResult.error.issues[0]?.message || "Data email uji tidak valid.",
      };
    }

    const ip = reqHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const userAgent = reqHeaders.get("user-agent") || "unknown";

    const result = await sendTestBroadcast(session.user.id, parseResult.data, {
      ip,
      userAgent,
    });

    return {
      success: true,
      message: result.message,
      simulated: result.simulated,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Gagal mengirimkan email uji.";
    return { success: false, error: errorMsg };
  }
}

/**
 * Server action untuk mengirimkan ulang broadcast ke penerima yang berstatus gagal (FAILED).
 */
export async function resendFailedBroadcastAction(broadcastId: string): Promise<{
  success: boolean;
  message?: string;
  retriedCount?: number;
  error?: string;
}> {
  try {
    const reqHeaders = await headers();
    const session = await getSession(reqHeaders);

    if (!session?.user) {
      return { success: false, error: "Sesi telah berakhir. Harap login kembali." };
    }

    const ip = reqHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const userAgent = reqHeaders.get("user-agent") || "unknown";

    const result = await resendFailedRecipients(session.user.id, broadcastId, {
      ip,
      userAgent,
    });

    // Jalankan pemrosesan ulang di background worker
    after(async () => {
      try {
        await processBroadcast(broadcastId);
      } catch (err: unknown) {
        console.error("Gagal menjalankan background broadcast resend processor:", err);
      }
    });

    revalidatePath("/komunikasi/riwayat");

    return {
      success: true,
      message: result.message,
      retriedCount: result.retriedCount,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Gagal mengirimkan ulang broadcast.";
    return { success: false, error: errorMsg };
  }
}

/**
 * Server action untuk menghapus berkas lampiran yang diunggah oleh pengguna.
 */
export async function deleteBroadcastAttachmentAction(attachmentId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const reqHeaders = await headers();
    const session = await getSession(reqHeaders);

    if (!session?.user) {
      return { success: false, error: "Sesi telah berakhir. Harap login kembali." };
    }

    await deleteBroadcastAttachment(session.user.id, attachmentId);
    return { success: true };
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : "Gagal menghapus berkas lampiran.";
    return { success: false, error: errorMsg };
  }
}

/**
 * Server action untuk membatalkan pengumuman yang masih berstatus terjadwal (SCHEDULED).
 */
export async function cancelScheduledBroadcastAction(broadcastId: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const reqHeaders = await headers();
    const session = await getSession(reqHeaders);

    if (!session?.user) {
      return {
        success: false,
        error: "Sesi telah berakhir. Harap login kembali.",
      };
    }

    const ip =
      reqHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const userAgent = reqHeaders.get("user-agent") || "unknown";

    const res = await cancelScheduledBroadcast(session.user.id, broadcastId, {
      ip,
      userAgent,
    });

    revalidatePath("/komunikasi/riwayat");

    return {
      success: true,
      message: res.message,
    };
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error
        ? err.message
        : "Gagal membatalkan jadwal pengumuman.";
    return { success: false, error: errorMsg };
  }
}

/**
 * Server action untuk menandai penerima telah membaca pengumuman broadcast di portal HRIS.
 */
export async function markBroadcastAsReadAction(broadcastId: string): Promise<{
  success: boolean;
  readAt?: Date;
  error?: string;
}> {
  try {
    const reqHeaders = await headers();
    const session = await getSession(reqHeaders);

    if (!session?.user) {
      return { success: false, error: "Sesi telah berakhir. Harap login kembali." };
    }

    const ip =
      reqHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const userAgent = reqHeaders.get("user-agent") || "unknown";

    const res = await markBroadcastAsRead(session.user.id, broadcastId, {
      ip,
      userAgent,
    });

    revalidatePath(`/pengumuman/${broadcastId}`);
    revalidatePath("/komunikasi/riwayat");

    return {
      success: true,
      readAt: res.readAt,
    };
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error
        ? err.message
        : "Gagal mengonfirmasi pembacaan pengumuman.";
    return { success: false, error: errorMsg };
  }
}

/**
 * Server action untuk mengirimkan notifikasi in-app pengingat kepada penerima yang belum membaca pengumuman.
 */
export async function remindUnreadRecipientsAction(broadcastId: string): Promise<{
  success: boolean;
  remindedCount?: number;
  message?: string;
  error?: string;
}> {
  try {
    const reqHeaders = await headers();
    const session = await getSession(reqHeaders);

    if (!session?.user) {
      return { success: false, error: "Sesi telah berakhir. Harap login kembali." };
    }

    const ip =
      reqHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const userAgent = reqHeaders.get("user-agent") || "unknown";

    const res = await remindUnreadRecipients(session.user.id, broadcastId, {
      ip,
      userAgent,
    });

    revalidatePath("/komunikasi/riwayat");

    return {
      success: true,
      remindedCount: res.remindedCount,
      message: res.message,
    };
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : "Gagal mengirimkan pengingat.";
    return { success: false, error: errorMsg };
  }
}


