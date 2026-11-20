"use server";

import { headers } from "next/headers";
import { getSession } from "@pspk/auth";
import {
  saveBroadcastDraftSchema,
  SaveBroadcastDraftInput,
  BroadcastDraftItem,
  saveBroadcastTemplateSchema,
  SaveBroadcastTemplateInput,
  BroadcastTemplateItem,
} from "../schemas/broadcast.schema";
import {
  getBroadcastSenderContext,
} from "../services/broadcast-email.service";
import {
  saveBroadcastDraft,
  listBroadcastDrafts,
  getBroadcastDraft,
  deleteBroadcastDraft,
  saveBroadcastTemplate,
  listBroadcastTemplates,
  deleteBroadcastTemplate,
} from "../services/broadcast-draft.service";

/**
 * Menyimpan atau memperbarui draf pengumuman pengguna aktif.
 */
export async function saveBroadcastDraftAction(
  rawInput: SaveBroadcastDraftInput,
): Promise<{
  success: boolean;
  data?: BroadcastDraftItem;
  error?: string;
}> {
  try {
    const reqHeaders = await headers();
    const session = await getSession(reqHeaders);

    if (!session?.user) {
      return { success: false, error: "Sesi telah berakhir. Harap login kembali." };
    }

    // Pastikan user memiliki hak modul broadcast
    await getBroadcastSenderContext(session.user.id);

    const parsed = saveBroadcastDraftSchema.parse(rawInput);
    const draft = await saveBroadcastDraft(session.user.id, parsed);

    return {
      success: true,
      data: draft,
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Gagal menyimpan draf pengumuman.";
    console.error("Gagal menjalankan saveBroadcastDraftAction:", err);
    return { success: false, error: message };
  }
}

/**
 * Mengambil daftar seluruh draf milik pengguna aktif.
 */
export async function listBroadcastDraftsAction(): Promise<{
  success: boolean;
  data?: BroadcastDraftItem[];
  error?: string;
}> {
  try {
    const reqHeaders = await headers();
    const session = await getSession(reqHeaders);

    if (!session?.user) {
      return { success: false, error: "Sesi telah berakhir. Harap login kembali." };
    }

    await getBroadcastSenderContext(session.user.id);
    const drafts = await listBroadcastDrafts(session.user.id);

    return { success: true, data: drafts };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Gagal memuat daftar draf.";
    console.error("Gagal menjalankan listBroadcastDraftsAction:", err);
    return { success: false, error: message };
  }
}

/**
 * Memuat rincian draf pengumuman berdasarkan ID.
 */
export async function getBroadcastDraftAction(
  draftId: string,
): Promise<{
  success: boolean;
  data?: BroadcastDraftItem;
  error?: string;
}> {
  try {
    const reqHeaders = await headers();
    const session = await getSession(reqHeaders);

    if (!session?.user) {
      return { success: false, error: "Sesi telah berakhir. Harap login kembali." };
    }

    await getBroadcastSenderContext(session.user.id);
    const draft = await getBroadcastDraft(session.user.id, draftId);

    return { success: true, data: draft };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Gagal memuat draf pengumuman.";
    console.error("Gagal menjalankan getBroadcastDraftAction:", err);
    return { success: false, error: message };
  }
}

/**
 * Menghapus draf pengumuman milik pengguna.
 */
export async function deleteBroadcastDraftAction(
  draftId: string,
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const reqHeaders = await headers();
    const session = await getSession(reqHeaders);

    if (!session?.user) {
      return { success: false, error: "Sesi telah berakhir. Harap login kembali." };
    }

    await getBroadcastSenderContext(session.user.id);
    await deleteBroadcastDraft(session.user.id, draftId);

    return { success: true };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Gagal menghapus draf.";
    console.error("Gagal menjalankan deleteBroadcastDraftAction:", err);
    return { success: false, error: message };
  }
}

/**
 * Menyimpan atau memperbarui template pengumuman.
 */
export async function saveBroadcastTemplateAction(
  rawInput: SaveBroadcastTemplateInput,
): Promise<{
  success: boolean;
  data?: BroadcastTemplateItem;
  error?: string;
}> {
  try {
    const reqHeaders = await headers();
    const session = await getSession(reqHeaders);

    if (!session?.user) {
      return { success: false, error: "Sesi telah berakhir. Harap login kembali." };
    }

    const senderCtx = await getBroadcastSenderContext(session.user.id);
    const parsed = saveBroadcastTemplateSchema.parse(rawInput);

    const clientIp =
      reqHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const userAgent = reqHeaders.get("user-agent") || "unknown";

    const template = await saveBroadcastTemplate(
      session.user.id,
      parsed,
      senderCtx.canSendAll,
      { ip: clientIp, userAgent, userEmail: session.user.email },
    );

    return { success: true, data: template };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Gagal menyimpan template pengumuman.";
    console.error("Gagal menjalankan saveBroadcastTemplateAction:", err);
    return { success: false, error: message };
  }
}

/**
 * Mengambil daftar template (template pribadi + template bersama).
 */
export async function listBroadcastTemplatesAction(): Promise<{
  success: boolean;
  data?: BroadcastTemplateItem[];
  error?: string;
}> {
  try {
    const reqHeaders = await headers();
    const session = await getSession(reqHeaders);

    if (!session?.user) {
      return { success: false, error: "Sesi telah berakhir. Harap login kembali." };
    }

    await getBroadcastSenderContext(session.user.id);
    const templates = await listBroadcastTemplates(session.user.id);

    return { success: true, data: templates };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Gagal memuat daftar template.";
    console.error("Gagal menjalankan listBroadcastTemplatesAction:", err);
    return { success: false, error: message };
  }
}

/**
 * Menghapus template pengumuman.
 */
export async function deleteBroadcastTemplateAction(
  templateId: string,
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const reqHeaders = await headers();
    const session = await getSession(reqHeaders);

    if (!session?.user) {
      return { success: false, error: "Sesi telah berakhir. Harap login kembali." };
    }

    const senderCtx = await getBroadcastSenderContext(session.user.id);
    const clientIp =
      reqHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const userAgent = reqHeaders.get("user-agent") || "unknown";

    await deleteBroadcastTemplate(
      session.user.id,
      templateId,
      senderCtx.canSendAll,
      { ip: clientIp, userAgent, userEmail: session.user.email },
    );

    return { success: true };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Gagal menghapus template.";
    console.error("Gagal menjalankan deleteBroadcastTemplateAction:", err);
    return { success: false, error: message };
  }
}
