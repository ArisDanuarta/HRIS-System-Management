import type { Metadata } from "next";
import { LoginPageClient } from "./login-client";

export const metadata: Metadata = {
  title: "Masuk - System Management PSPK",
  description: "Halaman login Sistem Manajemen PSPK",
  robots: { index: false, follow: false },
};

export default function SysmgmtLoginPage() {
  return <LoginPageClient />;
}
