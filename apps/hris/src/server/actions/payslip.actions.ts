"use server";

import { headers } from "next/headers";
import { getSession, getAuthContext } from "@pspk/auth";
import { getMyPayslipDetail } from "../queries/payslip.queries";

/**
 * Server Action untuk mengambil rincian slip gaji staf (termasuk item penerimaan & potongan)
 */
export async function getMyPayslipDetailAction(payslipId: string) {
  const reqHeaders = await headers();
  const session = await getSession(reqHeaders);

  if (!session?.user) {
    return { ok: false as const, error: "Sesi Anda telah berakhir. Silakan masuk kembali." };
  }

  const ctx = await getAuthContext(session.user.id);
  if (!ctx) {
    return { ok: false as const, error: "Profil pengguna tidak valid atau tidak aktif." };
  }

  try {
    const detail = await getMyPayslipDetail(ctx, payslipId);
    if (!detail) {
      return {
        ok: false as const,
        error: "Slip gaji tidak ditemukan, milik pegawai lain, atau belum resmi dipublikasikan.",
      };
    }
    return { ok: true as const, data: detail };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal memuat rincian slip gaji.";
    return { ok: false as const, error: msg };
  }
}
