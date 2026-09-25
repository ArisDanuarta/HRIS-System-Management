import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const createPrismaClient = () =>
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  if (
    !globalForPrisma.prisma ||
    !("notification" in (globalForPrisma.prisma as object)) ||
    !("workScheduleSetting" in (globalForPrisma.prisma as object))
  ) {
    globalForPrisma.prisma = createPrismaClient();
  }
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

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
