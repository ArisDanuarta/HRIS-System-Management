import React from "react";
import type { Metadata } from "next";
import { HelpCenterView } from "@pspk/ui";

export const metadata: Metadata = {
  title: "Pusat Bantuan - PSPK System Management",
  description:
    "Pusat bantuan resmi, tata kelola pengguna, hak akses RBAC, aset lembaga, SOP internal, dan kontak Helpdesk IT PSPK",
};

export default function SysmgmtHelpPage() {
  return (
    <HelpCenterView
      currentApp="sysmgmt"
      loginUrl="/login"
      dashboardUrl="/dashboard"
    />
  );
}
