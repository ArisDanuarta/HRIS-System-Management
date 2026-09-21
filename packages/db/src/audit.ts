import { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "./index";

export type AuditLogInput = {
  actorUserId?: string | null;
  actorEmail: string;
  app: "hris" | "sysmgmt" | "system";
  action:
    | "CREATE"
    | "UPDATE"
    | "DELETE"
    | "LOGIN"
    | "LOGOUT"
    | "LOGIN_FAILED"
    | "EXPORT"
    | "VIEW_SENSITIVE"
    | "PERMISSION_CHANGE"
    | "IMPORT"
    | string;
  entityType: string;
  entityId?: string | null;
  before?: Prisma.InputJsonValue;
  after?: Prisma.InputJsonValue;
  ip?: string | null;
  userAgent?: string | null;
  requestId?: string | null;
};

/**
 * Appends an entry to core.AuditLog.
 * Can be executed inside an existing Prisma transaction or standalone.
 */
export async function writeAudit(
  data: AuditLogInput,
  tx?: Prisma.TransactionClient | PrismaClient,
): Promise<void> {
  const client = tx ?? prisma;

  try {
    await client.auditLog.create({
      data: {
        actorUserId: data.actorUserId ?? null,
        actorEmail: data.actorEmail,
        app: data.app,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId ?? null,
        before: data.before ?? Prisma.DbNull,
        after: data.after ?? Prisma.DbNull,
        ip: data.ip ?? null,
        userAgent: data.userAgent ?? null,
        requestId: data.requestId ?? null,
      },
    });
  } catch (error) {
    console.error("❌ Failed to write audit log:", error);
    // In production, we should avoid throwing to not break the primary operation if audit fails,
    // but log the critical error.
  }
}
