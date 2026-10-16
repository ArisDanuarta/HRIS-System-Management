import type { Metadata } from "next";
import { LoginPageClient } from "./login-client";

export const metadata: Metadata = {
  title: "Masuk - HRIS PSPK",
  description: "Halaman login Sistem Informasi SDM PSPK",
  robots: { index: false, follow: false },
};

export default function HrisLoginPage() {
  return <LoginPageClient />;
}
