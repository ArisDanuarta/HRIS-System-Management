import path from "node:path";
import type { NextConfig } from "next";

// Reload config for Prisma client update - 2026-09-24
const config: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(process.cwd(), "../../"),
  transpilePackages: [
    "@pspk/ui",
    "@pspk/shared",
    "@pspk/db",
    "@pspk/auth",
    "@pspk/rbac",
    "@pspk/storage",
  ],
  serverExternalPackages: ["@prisma/client"],
};

export default config;
