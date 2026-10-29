import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };


const isOutdated = (client?: PrismaClient): boolean => {
  if (!client) return true;
  const c = client as unknown as Record<string, unknown>;
  if (!c.employeeDocument || !c.emailBroadcast) return true;

  const runtimeModel = (client as unknown as {
    _runtimeDataModel?: {
      models?: Record<string, { fields?: Array<{ name: string }> }>;
    };
  })?._runtimeDataModel;
  const leaveTypeFields = runtimeModel?.models?.LeaveType?.fields;
  if (leaveTypeFields && !leaveTypeFields.some((f) => f.name === "applicableGender")) {
    return true;
  }

  return false;
};

const createPrismaClient = () => {
  if (process.env.NODE_ENV === "development" && typeof require !== "undefined" && require.cache) {
    try {
      Object.keys(require.cache).forEach((k) => {
        if (k.includes(".prisma") || k.includes("@prisma")) {
          delete require.cache[k];
        }
      });
    } catch {
      // ignore
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaClient: ClientConstructor } = require("@prisma/client");
  return new ClientConstructor({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
};

const rawPrisma =
  globalForPrisma.prisma && !isOutdated(globalForPrisma.prisma)
    ? globalForPrisma.prisma
    : createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = rawPrisma;
}

export const prisma: PrismaClient =
  process.env.NODE_ENV === "production"
    ? rawPrisma
    : new Proxy(rawPrisma, {
        get(target, prop, receiver) {
          if (isOutdated(globalForPrisma.prisma)) {
            const fresh = createPrismaClient();
            globalForPrisma.prisma = fresh;
            return Reflect.get(fresh, prop, receiver);
          }

          const currentTarget = globalForPrisma.prisma ?? target;
          const value = Reflect.get(currentTarget, prop, receiver);
          if (
            value === undefined &&
            typeof prop === "string" &&
            !prop.startsWith("$") &&
            !prop.startsWith("_")
          ) {
            // Model baru mungkin baru digenerate saat dev server masih berjalan
            const fresh = createPrismaClient();
            globalForPrisma.prisma = fresh;
            return Reflect.get(fresh, prop, receiver);
          }
          return value;
        },
      });

export {
  PrismaClient,
  Prisma,
  EmployeeStatus,
  EmploymentType,
  Gender,
  MaritalStatus,
  AttendanceStatus,
  AttendanceSource,
  LeaveStatus,
  ContractStatus,
  AssetCategory,
  AssetStatus,
  DocumentVisibility,
  DocumentStatus,
  BroadcastScope,
  BroadcastStatus,
  BroadcastDeliveryStatus,
} from "@prisma/client";
export type * from "@prisma/client";
export * from "./audit";
export * from "./modules";
