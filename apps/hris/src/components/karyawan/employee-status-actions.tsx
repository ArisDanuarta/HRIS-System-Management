"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserCheck, UserX, AlertCircle, RotateCcw } from "lucide-react";
import {
  deleteEmployeeAction,
  reactivateEmployeeAction,
} from "@/server/actions/employee.actions";

interface EmployeeStatusActionsProps {
  employeeId: string;
  employeeName: string;
  employeeNo: string;
  isTerminated: boolean;
  variant?: "header" | "banner";
}

export function EmployeeStatusActions({
  employeeId,
  employeeName,
  employeeNo,
  isTerminated,
  variant = "header",
}: EmployeeStatusActionsProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showReactivateModal, setShowReactivateModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleDeactivate = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    const res = await deleteEmployeeAction(employeeId);
    setIsLoading(false);

    if (res.ok) {
      setShowDeactivateModal(false);
      startTransition(() => {
        router.refresh();
      });
    } else {
      setErrorMsg(res.error || "Gagal menonaktifkan pegawai.");
    }
  };

  const handleReactivate = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    const res = await reactivateEmployeeAction(employeeId);
    setIsLoading(false);

    if (res.ok) {
      setShowReactivateModal(false);
      startTransition(() => {
        router.refresh();
      });
    } else {
      setErrorMsg(res.error || "Gagal mengaktifkan kembali pegawai.");
    }
  };

  return (
    <>
      {errorMsg && (
        <div className="fixed top-4 right-4 z-50 p-3.5 bg-red-50 border border-red-200 text-[#A8281C] text-xs rounded-xl shadow-lg flex items-center gap-2 max-w-md animate-in slide-in-from-top-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            className="ml-auto text-slate-400 hover:text-slate-600 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {isTerminated ? (
        <button
          type="button"
          onClick={() => {
            setErrorMsg(null);
            setShowReactivateModal(true);
          }}
          className={
            variant === "banner"
              ? "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-all cursor-pointer active:scale-[0.98] shadow-xs shrink-0"
              : "inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-all cursor-pointer active:scale-[0.98] shadow-xs"
          }
          title="Aktifkan Kembali Pegawai"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Aktifkan Kembali Pegawai</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => {
            setErrorMsg(null);
            setShowDeactivateModal(true);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-500 hover:text-[#A8281C] hover:bg-red-50 border border-slate-200 transition-all cursor-pointer active:scale-[0.98]"
          title="Nonaktifkan Pegawai"
        >
          <UserX className="w-3.5 h-3.5" />
          <span>Nonaktifkan Pegawai</span>
        </button>
      )}

      {/* Modal Deactivate */}
      {showDeactivateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-[#A8281C] shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <h3 className="text-base font-bold text-slate-900 font-heading">
                  Konfirmasi Nonaktifkan Pegawai
                </h3>
                <span className="text-xs text-slate-500">
                  Tindakan ini memerlukan perhatian khusus
                </span>
              </div>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin menonaktifkan pegawai{" "}
              <strong className="text-slate-900">{employeeName}</strong> ({employeeNo})?
            </p>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 leading-relaxed">
              Penonaktifan akan mengubah status menjadi <strong>TERMINATED</strong>, menghentikan
              seluruh kontrak aktif yang berjalan, dan menonaktifkan hak akses akun login pengguna terkait.
              Seluruh riwayat akan tetap tersimpan dan dapat diaktifkan kembali sewaktu-waktu.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowDeactivateModal(false)}
                disabled={isLoading}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeactivate}
                disabled={isLoading}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#A8281C] text-white hover:bg-[#851e14] transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50"
              >
                {isLoading ? "Memproses..." : "Ya, Nonaktifkan Pegawai"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Reactivate */}
      {showReactivateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <UserCheck className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <h3 className="text-base font-bold text-slate-900 font-heading">
                  Konfirmasi Aktifkan Kembali Pegawai
                </h3>
                <span className="text-xs text-slate-500">
                  Kembalikan status pegawai menjadi aktif
                </span>
              </div>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin mengaktifkan kembali pegawai{" "}
              <strong className="text-slate-900">{employeeName}</strong> ({employeeNo})?
            </p>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 leading-relaxed">
              Pengaktifan kembali akan mengubah status menjadi <strong>ACTIVE</strong>, memulihkan status
              kontrak terakhir pegawai, dan mengaktifkan kembali akses akun login pengguna terkait.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowReactivateModal(false)}
                disabled={isLoading}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleReactivate}
                disabled={isLoading}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50"
              >
                {isLoading ? "Memproses..." : "Ya, Aktifkan Kembali Pegawai"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
