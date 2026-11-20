import { prisma, writeAudit } from "@pspk/db";
import {
  SaveBroadcastDraftInput,
  BroadcastDraftItem,
  SaveBroadcastTemplateInput,
  BroadcastTemplateItem,
  BroadcastScope,
  SenderPersona,
  ReplyToMode,
} from "../schemas/broadcast.schema";
import { sanitizeBroadcastContent } from "./broadcast-email.service";

const MAX_DRAFTS_PER_USER = 50;
const MAX_TEMPLATES_PER_USER = 100;

export async function saveBroadcastDraft(
  userId: string,
  input: SaveBroadcastDraftInput,
): Promise<BroadcastDraftItem> {
  const sanitizedContent = sanitizeBroadcastContent(input.contentHtml || "");
  const draftTitle =
    input.title?.trim() ||
    input.subject?.trim() ||
    "Draf Pengumuman Tanpa Judul";

  if (input.id) {
    const existing = await prisma.broadcastDraft.findUnique({
      where: { id: input.id },
    });

    if (!existing || existing.ownerUserId !== userId) {
      throw new Error(
        "Akses ditolak: Draf tidak ditemukan atau Anda bukan pemilik draf ini.",
      );
    }

    const updated = await prisma.broadcastDraft.update({
      where: { id: input.id },
      data: {
        title: draftTitle,
        subject: input.subject || "",
        contentHtml: sanitizedContent,
        targetScope: input.targetScope as BroadcastScope,
        targetDepartmentIds: input.targetDepartmentIds || [],
        customEmployeeIds: input.customEmployeeIds || [],
        excludedEmployeeIds: input.excludedEmployeeIds || [],
        senderPersona: input.senderPersona,
        customSenderName: input.customSenderName || null,
        replyToMode: input.replyToMode,
        customReplyToEmail: input.customReplyToEmail || null,
        sendInApp: input.sendInApp,
      },
      include: {
        attachments: true,
      },
    });

    if (input.attachmentIds) {
      await prisma.emailBroadcastAttachment.updateMany({
        where: { draftId: input.id, id: { notIn: input.attachmentIds } },
        data: { draftId: null },
      });
      if (input.attachmentIds.length > 0) {
        await prisma.emailBroadcastAttachment.updateMany({
          where: { id: { in: input.attachmentIds }, uploadedBy: userId },
          data: { draftId: input.id },
        });
      }
    }

    const currentAttachments = await prisma.emailBroadcastAttachment.findMany({
      where: { draftId: updated.id },
      orderBy: { createdAt: "asc" },
    });

    return {
      id: updated.id,
      ownerUserId: updated.ownerUserId,
      title: updated.title,
      subject: updated.subject,
      contentHtml: updated.contentHtml,
      targetScope: updated.targetScope as BroadcastScope,
      targetDepartmentIds: updated.targetDepartmentIds,
      customEmployeeIds: updated.customEmployeeIds,
      excludedEmployeeIds: updated.excludedEmployeeIds,
      senderPersona: updated.senderPersona as SenderPersona,
      customSenderName: updated.customSenderName,
      replyToMode: updated.replyToMode as ReplyToMode,
      customReplyToEmail: updated.customReplyToEmail,
      sendInApp: updated.sendInApp,
      attachmentIds: currentAttachments.map((a) => a.id),
      attachments: currentAttachments.map((a) => ({
        id: a.id,
        fileName: a.fileName,
        mimeType: a.mimeType,
        sizeBytes: a.sizeBytes,
        key: a.key,
        url: `/api/documents/${a.key}`,
        createdAt: a.createdAt,
      })),
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  // Cek kuota draf per pengguna
  const draftCount = await prisma.broadcastDraft.count({
    where: { ownerUserId: userId },
  });

  if (draftCount >= MAX_DRAFTS_PER_USER) {
    throw new Error(
      `Batas maksimal ${MAX_DRAFTS_PER_USER} draf telah tercapai. Harap hapus draf lama sebelum membuat yang baru.`,
    );
  }

  const created = await prisma.broadcastDraft.create({
    data: {
      ownerUserId: userId,
      title: draftTitle,
      subject: input.subject || "",
      contentHtml: sanitizedContent,
      targetScope: input.targetScope as BroadcastScope,
      targetDepartmentIds: input.targetDepartmentIds || [],
      customEmployeeIds: input.customEmployeeIds || [],
      excludedEmployeeIds: input.excludedEmployeeIds || [],
      senderPersona: input.senderPersona,
      customSenderName: input.customSenderName || null,
      replyToMode: input.replyToMode,
      customReplyToEmail: input.customReplyToEmail || null,
      sendInApp: input.sendInApp,
    },
  });

  if (input.attachmentIds && input.attachmentIds.length > 0) {
    await prisma.emailBroadcastAttachment.updateMany({
      where: { id: { in: input.attachmentIds }, uploadedBy: userId },
      data: { draftId: created.id },
    });
  }

  const createdAttachments = await prisma.emailBroadcastAttachment.findMany({
    where: { draftId: created.id },
    orderBy: { createdAt: "asc" },
  });

  return {
    id: created.id,
    ownerUserId: created.ownerUserId,
    title: created.title,
    subject: created.subject,
    contentHtml: created.contentHtml,
    targetScope: created.targetScope as BroadcastScope,
    targetDepartmentIds: created.targetDepartmentIds,
    customEmployeeIds: created.customEmployeeIds,
    excludedEmployeeIds: created.excludedEmployeeIds,
    senderPersona: created.senderPersona as SenderPersona,
    customSenderName: created.customSenderName,
    replyToMode: created.replyToMode as ReplyToMode,
    customReplyToEmail: created.customReplyToEmail,
    sendInApp: created.sendInApp,
    attachmentIds: createdAttachments.map((a) => a.id),
    attachments: createdAttachments.map((a) => ({
      id: a.id,
      fileName: a.fileName,
      mimeType: a.mimeType,
      sizeBytes: a.sizeBytes,
      key: a.key,
      url: `/api/documents/${a.key}`,
      createdAt: a.createdAt,
    })),
    createdAt: created.createdAt,
    updatedAt: created.updatedAt,
  };
}

export async function listBroadcastDrafts(
  userId: string,
): Promise<BroadcastDraftItem[]> {
  const drafts = await prisma.broadcastDraft.findMany({
    where: { ownerUserId: userId },
    include: {
      attachments: {
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return drafts.map((d) => ({
    id: d.id,
    ownerUserId: d.ownerUserId,
    title: d.title,
    subject: d.subject,
    contentHtml: d.contentHtml,
    targetScope: d.targetScope as BroadcastScope,
    targetDepartmentIds: d.targetDepartmentIds,
    customEmployeeIds: d.customEmployeeIds,
    excludedEmployeeIds: d.excludedEmployeeIds,
    senderPersona: d.senderPersona as SenderPersona,
    customSenderName: d.customSenderName,
    replyToMode: d.replyToMode as ReplyToMode,
    customReplyToEmail: d.customReplyToEmail,
    sendInApp: d.sendInApp,
    attachmentIds: d.attachments.map((a) => a.id),
    attachments: d.attachments.map((a) => ({
      id: a.id,
      fileName: a.fileName,
      mimeType: a.mimeType,
      sizeBytes: a.sizeBytes,
      key: a.key,
      url: `/api/documents/${a.key}`,
      createdAt: a.createdAt,
    })),
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  }));
}

export async function getBroadcastDraft(
  userId: string,
  draftId: string,
): Promise<BroadcastDraftItem> {
  const draft = await prisma.broadcastDraft.findUnique({
    where: { id: draftId },
    include: {
      attachments: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!draft || draft.ownerUserId !== userId) {
    throw new Error(
      "Akses ditolak: Draf tidak ditemukan atau Anda tidak memiliki akses ke draf ini.",
    );
  }

  return {
    id: draft.id,
    ownerUserId: draft.ownerUserId,
    title: draft.title,
    subject: draft.subject,
    contentHtml: draft.contentHtml,
    targetScope: draft.targetScope as BroadcastScope,
    targetDepartmentIds: draft.targetDepartmentIds,
    customEmployeeIds: draft.customEmployeeIds,
    excludedEmployeeIds: draft.excludedEmployeeIds,
    senderPersona: draft.senderPersona as SenderPersona,
    customSenderName: draft.customSenderName,
    replyToMode: draft.replyToMode as ReplyToMode,
    customReplyToEmail: draft.customReplyToEmail,
    sendInApp: draft.sendInApp,
    attachmentIds: draft.attachments.map((a) => a.id),
    attachments: draft.attachments.map((a) => ({
      id: a.id,
      fileName: a.fileName,
      mimeType: a.mimeType,
      sizeBytes: a.sizeBytes,
      key: a.key,
      url: `/api/documents/${a.key}`,
      createdAt: a.createdAt,
    })),
    createdAt: draft.createdAt,
    updatedAt: draft.updatedAt,
  };
}

export async function deleteBroadcastDraft(
  userId: string,
  draftId: string,
): Promise<{ success: boolean }> {
  const draft = await prisma.broadcastDraft.findUnique({
    where: { id: draftId },
    select: { id: true, ownerUserId: true },
  });

  if (!draft || draft.ownerUserId !== userId) {
    throw new Error(
      "Akses ditolak: Draf tidak ditemukan atau Anda tidak memiliki izin untuk menghapusnya.",
    );
  }

  await prisma.broadcastDraft.delete({
    where: { id: draftId },
  });

  return { success: true };
}

export async function saveBroadcastTemplate(
  userId: string,
  input: SaveBroadcastTemplateInput,
  canSendAll: boolean,
  reqMeta?: { ip?: string; userAgent?: string; userEmail?: string },
): Promise<BroadcastTemplateItem> {
  if (input.isShared && !canSendAll) {
    throw new Error(
      "Akses ditolak: Hanya Super Admin dan Admin HR yang dapat membagikan template ke semua pengirim.",
    );
  }

  const sanitizedContent = sanitizeBroadcastContent(input.contentHtml);
  const actorEmail =
    reqMeta?.userEmail ||
    (
      await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      })
    )?.email ||
    "unknown@pspk.id";

  if (input.id) {
    const existing = await prisma.broadcastTemplate.findUnique({
      where: { id: input.id },
    });

    if (!existing) {
      throw new Error("Template tidak ditemukan.");
    }

    if (existing.isShared && !canSendAll) {
      throw new Error(
        "Akses ditolak: Anda tidak memiliki wewenang untuk mengubah template bersama.",
      );
    }

    if (!existing.isShared && existing.createdByUserId !== userId) {
      throw new Error(
        "Akses ditolak: Anda bukan pemilik template pribadi ini.",
      );
    }

    const updated = await prisma.broadcastTemplate.update({
      where: { id: input.id },
      data: {
        name: input.name.trim(),
        category: input.category?.trim() || null,
        subject: input.subject.trim(),
        contentHtml: sanitizedContent,
        isShared: canSendAll ? Boolean(input.isShared) : existing.isShared,
      },
    });

    if (updated.isShared || existing.isShared) {
      await writeAudit({
        actorUserId: userId,
        actorEmail,
        app: "hris",
        action: "BROADCAST_TEMPLATE_UPDATE",
        entityType: "BroadcastTemplate",
        entityId: updated.id,
        after: {
          name: updated.name,
          category: updated.category,
          isShared: updated.isShared,
        },
        ip: reqMeta?.ip || "127.0.0.1",
        userAgent: reqMeta?.userAgent || "unknown",
      });
    }

    return {
      id: updated.id,
      name: updated.name,
      category: updated.category,
      subject: updated.subject,
      contentHtml: updated.contentHtml,
      isShared: updated.isShared,
      createdByUserId: updated.createdByUserId,
      isOwner: updated.createdByUserId === userId,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  // Cek kuota template
  const templateCount = await prisma.broadcastTemplate.count({
    where: { createdByUserId: userId },
  });

  if (templateCount >= MAX_TEMPLATES_PER_USER) {
    throw new Error(
      `Batas maksimal ${MAX_TEMPLATES_PER_USER} template telah tercapai. Harap hapus template lama sebelum membuat yang baru.`,
    );
  }

  const created = await prisma.broadcastTemplate.create({
    data: {
      name: input.name.trim(),
      category: input.category?.trim() || null,
      subject: input.subject.trim(),
      contentHtml: sanitizedContent,
      isShared: canSendAll ? Boolean(input.isShared) : false,
      createdByUserId: userId,
    },
  });

  if (created.isShared) {
    await writeAudit({
      actorUserId: userId,
      actorEmail,
      app: "hris",
      action: "BROADCAST_TEMPLATE_CREATE",
      entityType: "BroadcastTemplate",
      entityId: created.id,
      after: {
        name: created.name,
        category: created.category,
        isShared: created.isShared,
      },
      ip: reqMeta?.ip || "127.0.0.1",
      userAgent: reqMeta?.userAgent || "unknown",
    });
  }

  return {
    id: created.id,
    name: created.name,
    category: created.category,
    subject: created.subject,
    contentHtml: created.contentHtml,
    isShared: created.isShared,
    createdByUserId: created.createdByUserId,
    isOwner: true,
    createdAt: created.createdAt,
    updatedAt: created.updatedAt,
  };
}

export async function listBroadcastTemplates(
  userId: string,
): Promise<BroadcastTemplateItem[]> {
  const templates = await prisma.broadcastTemplate.findMany({
    where: {
      OR: [{ createdByUserId: userId }, { isShared: true }],
    },
    orderBy: { updatedAt: "desc" },
  });

  return templates.map((t) => ({
    id: t.id,
    name: t.name,
    category: t.category,
    subject: t.subject,
    contentHtml: t.contentHtml,
    isShared: t.isShared,
    createdByUserId: t.createdByUserId,
    isOwner: t.createdByUserId === userId,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  }));
}

export async function deleteBroadcastTemplate(
  userId: string,
  templateId: string,
  canSendAll: boolean,
  reqMeta?: { ip?: string; userAgent?: string; userEmail?: string },
): Promise<{ success: boolean }> {
  const template = await prisma.broadcastTemplate.findUnique({
    where: { id: templateId },
  });

  if (!template) {
    throw new Error("Template tidak ditemukan.");
  }

  if (template.isShared) {
    if (!canSendAll) {
      throw new Error(
        "Akses ditolak: Hanya Super Admin dan Admin HR yang dapat menghapus template bersama.",
      );
    }

    await prisma.broadcastTemplate.delete({
      where: { id: templateId },
    });

    const actorEmail =
      reqMeta?.userEmail ||
      (
        await prisma.user.findUnique({
          where: { id: userId },
          select: { email: true },
        })
      )?.email ||
      "unknown@pspk.id";

    await writeAudit({
      actorUserId: userId,
      actorEmail,
      app: "hris",
      action: "BROADCAST_TEMPLATE_DELETE",
      entityType: "BroadcastTemplate",
      entityId: templateId,
      before: {
        name: template.name,
        isShared: true,
      },
      ip: reqMeta?.ip || "127.0.0.1",
      userAgent: reqMeta?.userAgent || "unknown",
    });

    return { success: true };
  }

  if (template.createdByUserId !== userId) {
    throw new Error(
      "Akses ditolak: Anda bukan pemilik template pribadi ini.",
    );
  }

  await prisma.broadcastTemplate.delete({
    where: { id: templateId },
  });

  return { success: true };
}
