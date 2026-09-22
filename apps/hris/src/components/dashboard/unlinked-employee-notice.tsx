import React from "react";
import Link from "next/link";
import { UserX, ArrowRight, ShieldCheck, Users } from "lucide-react";

interface UnlinkedEmployeeNoticeProps {
  roleName: string;
}

export function UnlinkedEmployeeNotice({ roleName }: UnlinkedEmployeeNoticeProps) {
  return (
    <div className="w-full max-w-2xl mx-auto my-12 p-8 bg-white rounded-2xl border border-amber-200 shadow-sm flex flex-col items-center text-center gap-4 animate-in fade-in duration-200">
      <div className="w-14 h-14 rounded-2xl bg-amber-50 text-[#805600] flex items-center justify-center border border-amber-200 shadow-xs">
        <UserX className="w-7 h-7" />
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/70 text-[#805600] text-xs font-bold w-fit mx-auto">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Mode Pratinjau Role: {roleName}</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[#102e50] font-heading mt-2">
          Akun Belum Tertaut ke Data Pegawai
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
          Dashboard <strong>{roleName}</strong> membutuhkan identitas profil karyawan untuk menampilkan presensi pribadi, saldo cuti, atau daftar tim bawahan. Saat ini akun Super Admin ini belum ditautkan ke data pegawai.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3 mt-4">
        <Link
          href="/karyawan"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#102e50] text-white text-xs font-semibold hover:bg-[#0c233d] transition-all shadow-xs cursor-pointer"
        >
          <Users className="w-4 h-4 text-[#ffddb0]" />
          <span>Buka Direktori Karyawan</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
