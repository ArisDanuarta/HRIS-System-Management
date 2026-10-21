import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Mail, ChevronRight, History } from "lucide-react";
import { getBroadcastFormDataAction } from "../../../../server/actions/broadcast.actions";
import { BroadcastCreateForm } from "../../../../components/broadcast/broadcast-create-form";

export const metadata: Metadata = {
  title: "Tulis Pengumuman & Broadcast Email",
  description:
    "Penyusunan dan pengiriman pengumuman email resmi PSPK via no-reply@pspk.id",
};

export default async function KomunikasiBaruPage() {
  const result = await getBroadcastFormDataAction();

  if (!result.success || !result.data) {
    if (result.error?.includes("Sesi")) {
      redirect("/login");
    }

    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center space-y-3">
          <h2 className="text-base font-bold text-red-900">Akses Ditolak</h2>
          <p className="text-xs text-red-700">
            {result.error ||
              "Anda tidak memiliki hak akses untuk membuka modul penulisan broadcast email."}
          </p>
          <div className="pt-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center px-4 py-2 bg-navy-900 text-white rounded-xl text-xs font-semibold hover:bg-navy-950 transition-colors"
            >
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-6">
      {/* BREADCRUMB & HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Link href="/dashboard" className="hover:text-navy-900 transition-colors">
              Beranda
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">Komunikasi</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold text-navy-900">Tulis Pengumuman</span>
          </div>
          <h1 className="text-2xl font-bold text-navy-900 tracking-tight font-serif flex items-center gap-2.5">
            <Mail className="w-6 h-6 text-navy-800" />
            <span>Tulis Pengumuman &amp; Broadcast Email</span>
          </h1>
          <p className="text-xs text-slate-500">
            Kirimkan informasi atau edaran resmi melalui email lembaga (
            <code className="text-navy-800 font-semibold">no-reply@pspk.id</code>) dengan alamat balasan ke email Anda.
          </p>
        </div>

        <div>
          <Link
            href="/komunikasi/riwayat"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:text-navy-900 hover:border-slate-300 rounded-xl text-xs font-semibold shadow-2xs hover:shadow-xs transition-all"
          >
            <History className="w-4 h-4 text-slate-500" />
            <span>Riwayat Pengumuman</span>
          </Link>
        </div>
      </div>

      {/* FORM WRAPPER */}
      <BroadcastCreateForm initialData={result.data} />
    </div>
  );
}
