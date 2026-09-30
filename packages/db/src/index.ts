import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const createPrismaClient = () =>
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

const rawPrisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = rawPrisma;
}

export const prisma: PrismaClient =
  process.env.NODE_ENV === "production"
    ? rawPrisma
    : new Proxy(rawPrisma, {
        get(target, prop, receiver) {
          const value = Reflect.get(target, prop, receiver);
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
} from "@prisma/client";
export type * from "@prisma/client";
export * from "./audit";
