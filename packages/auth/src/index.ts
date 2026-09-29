import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@pspk/db";
import { cleanIpAddress } from "@pspk/shared";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,
  },
  secret: process.env.BETTER_AUTH_SECRET || process.env.AUTH_SECRET,
  baseURL: process.env.HRIS_URL || "http://localhost:3001",
  trustedOrigins: [
    process.env.HRIS_URL || "http://localhost:3001",
    process.env.SYSMGMT_URL || "http://localhost:3002",
  ],
  advanced: {
    ipAddress: {
      ipAddressHeaders: [
        "cf-connecting-ip",
        "x-real-ip",
        "true-client-ip",
        "x-client-ip",
        "x-forwarded-for",
      ],
      trustedProxies: [
        "127.0.0.1",
        "::1",
        "10.0.0.0/8",
        "172.16.0.0/12",
        "192.168.0.0/16",
      ],
      ipv6Subnet: 128,
    },
  },
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          return {
            data: {
              ...session,
              ipAddress: cleanIpAddress(session.ipAddress),
            },
          };
        },
      },
    },
  },
});

import { toNextJsHandler } from "better-auth/next-js";

export const authHandlers = toNextJsHandler(auth);

export { hashPassword } from "better-auth/crypto";

export * from "./session";
