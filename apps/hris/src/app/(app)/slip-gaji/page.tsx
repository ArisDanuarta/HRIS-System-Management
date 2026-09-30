import React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession, getAuthContext } from "@pspk/auth";
import { getMyPayslips } from "@/server/queries/payslip.queries";
import { PayslipListView } from "@/components/slip-gaji/payslip-list-view";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Slip Gaji Saya — HRIS PSPK",
  description: "Arsip resmi slip gaji dan bukti penerimaan pembayaran pegawai PSPK",
};

interface SlipGajiPageProps {
  searchParams: Promise<{
    year?: string;
    kind?: string;
  }>;
}

export default async function SlipGajiPage({ searchParams }: SlipGajiPageProps) {
  const reqHeaders = await headers();
  const session = await getSession(reqHeaders);

  if (!session?.user) {
    redirect("/login");
  }

  const ctx = await getAuthContext(session.user.id);
  if (!ctx || !ctx.employeeId) {
    redirect("/forbidden");
  }

  const resolvedParams = await searchParams;
  const yearFilter = resolvedParams.year ? parseInt(resolvedParams.year, 10) : undefined;
  const kindFilter = resolvedParams.kind || undefined;

  const summary = await getMyPayslips(ctx, {
    year: yearFilter,
    kind: kindFilter,
  });

  return (
    <PayslipListView
      summary={summary}
      employeeName={session.user.name || "Karyawan"}
    />
  );
}
