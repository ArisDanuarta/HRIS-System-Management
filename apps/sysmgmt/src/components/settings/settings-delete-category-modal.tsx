"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { SerializedDocumentCategory } from "@/server/queries/settings.queries";
import { deleteDocumentCategoryAction } from "@/server/actions/settings.actions";
import { AlertTriangle, Loader2, X, Trash2, Info } from "lucide-react";

interface SettingsDeleteCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: SerializedDocumentCategory | null;
}

export function SettingsDeleteCategoryModal({
  isOpen,
  onClose,
  category,
}: SettingsDeleteCategoryModalProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !category) return null;

  const hasDocuments = category.documentCount > 0;

  const handleDelete = async () => {
    setIsDeleting(true);
    setErrorMsg(null);

    try {
      const res = await deleteDocumentCategoryAction({ id: category.id });
      if (!res.ok) {
        setErrorMsg(res.error);
        setIsDeleting(false);
        return;
      }

      router.refresh();
      onClose();
    } catch (err) {
      console.error("Gagal menghapus kategori:", err);
      setErrorMsg(err instanceof Error ? err.message : "Terjadi kesalahan sistem.");
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-rose-50/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
              <Trash2 className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                Hapus Kategori Dokumen
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Konfirmasi penghapusan master data</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMsg}</div>
            </div>
          )}

          <p className="text-xs text-slate-600 leading-relaxed">
            Apakah Anda yakin ingin menghapus kategori dokumen{" "}
            <strong className="text-slate-900 font-bold">&ldquo;{category.name}&rdquo;</strong> (Prefix:{" "}
            <code className="px-1.5 py-0.5 rounded-md bg-slate-100 font-mono text-[#102E50] font-bold">
              {category.codePrefix}
            </code>
            )?
          </p>

          {hasDocuments ? (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">
                Kategori ini saat ini digunakan oleh{" "}
                <strong className="font-bold">{category.documentCount} dokumen aktif</strong>. Sistem
                mencegah penghapusan demi menjaga integritas data penomoran dokumen lembaga. Silakan
                nonaktifkan kategori jika tidak ingin digunakan lagi.
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">
              Tindakan ini permanen dan akan dicatat dalam buku besar audit log.
            </p>
          )}

          {/* Action buttons */}
          <div className="pt-3 flex items-center justify-end gap-2.5">
            <button
              type="button"
              disabled={isDeleting}
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={isDeleting || hasDocuments}
              onClick={handleDelete}
              className="px-5 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
            >
              {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isDeleting ? "Menghapus..." : "Ya, Hapus Kategori"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
