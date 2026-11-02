"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { SerializedCredential } from "@/server/queries/credential.queries";
import { deleteCredentialAction } from "@/server/actions/credential.actions";
import { Trash2, AlertTriangle, Loader2, X } from "lucide-react";
import { CATEGORY_META } from "./credential-constants";

interface CredentialDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  credential: SerializedCredential | null;
}

export function CredentialDeleteModal({
  isOpen,
  onClose,
  credential,
}: CredentialDeleteModalProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !credential) return null;

  const categoryMeta = CATEGORY_META[credential.category];

  const handleDelete = async () => {
    setErrorMsg(null);
    setIsDeleting(true);

    try {
      const res = await deleteCredentialAction({ id: credential.id });
      if (!res.ok) {
        setErrorMsg(res.error || "Gagal menghapus data akun kredensial.");
        setIsDeleting(false);
        return;
      }

      router.refresh();
      onClose();
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan sistem saat menghapus kredensial.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200">
              <Trash2 className="w-5 h-5" />
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <h3 className="text-base font-bold text-slate-900 font-serif mb-1.5">
            Hapus Akun Kredensial?
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed mb-4">
            Tindakan ini akan menghapus catatan kredensial secara permanen dari sistem.
            Seluruh mutasi ini akan dicatat ke dalam audit log lembaga.
          </p>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 mb-4 text-xs space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Nama Akun / Layanan:</span>
              <span className="font-bold text-[#102E50] text-right truncate max-w-[200px]">
                {credential.title}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Kategori:</span>
              <span className="font-semibold text-slate-700">
                {categoryMeta?.label || credential.category}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Identitas Login:</span>
              <span className="font-mono text-slate-700 truncate max-w-[200px]">
                {credential.username || credential.email || "-"}
              </span>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-rose-700 text-xs mb-4">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 text-white text-xs font-semibold rounded-lg hover:bg-rose-700 transition-colors disabled:opacity-50 shadow-xs"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Menghapus...</span>
                </>
              ) : (
                <span>Hapus Akun Kredensial</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
