import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@pspk/db";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  secret: process.env.AUTH_SECRET,
  baseURL: process.env.HRIS_URL || "http://localhost:3001",
  trustedOrigins: [
    process.env.HRIS_URL || "http://localhost:3001",
    process.env.SYSMGMT_URL || "http://localhost:3002",
  ],
});

import { toNextJsHandler } from "better-auth/next-js";

export const authHandlers = toNextJsHandler(auth);

export * from "./session";
