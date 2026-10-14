import React from "react";
import type { Metadata } from "next";
import { HelpCenterView } from "@pspk/ui";

export const metadata: Metadata = {
  title: "Pusat Bantuan - HRIS PSPK",
  description:
    "Pusat bantuan resmi, solusi akun, panduan presensi harian, cuti kerja, slip gaji, dan kontak Helpdesk IT PSPK",
};

export default function HrisHelpPage() {
  return (
    <HelpCenterView
      currentApp="hris"
      loginUrl="/login"
      dashboardUrl="/dashboard"
    />
  );
}
