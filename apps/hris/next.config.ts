import path from "node:path";
import type { NextConfig } from "next";

// Reload config for Prisma client update - 2026-09-30 13:55
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
  async redirects() {
    return [
      {
        source: "/karyawan/organisasi",
        destination: "/tata-kelola?tab=organisasi",
        permanent: false,
      },
      {
        source: "/karyawan/ikatan-kerja",
        destination: "/tata-kelola?tab=ikatan-kerja",
        permanent: false,
      },
      {
        source: "/cuti/pengaturan",
        destination: "/tata-kelola?tab=jadwal-cuti",
        permanent: false,
      },
      {
        source: "/payroll/komponen",
        destination: "/tata-kelola?tab=payroll-komponen",
        permanent: false,
      },
      {
        source: "/payroll/pengaturan",
        destination: "/tata-kelola?tab=dokumen-bank",
        permanent: false,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
        ],
      },
    ];
  },
};

export default config;
