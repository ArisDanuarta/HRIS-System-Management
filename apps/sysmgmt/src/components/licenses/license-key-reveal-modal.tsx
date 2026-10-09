"use client";

import React, { useState } from "react";
import { SerializedSoftwareLicense } from "@/server/queries/license.queries";
import { revealLicenseKeyAction } from "@/server/actions/license.actions";
import {
  KeyRound,
  ShieldAlert,
  Loader2,
  X,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

interface LicenseKeyRevealModalProps {
  isOpen: boolean;
  onClose: () => void;
  license: SerializedSoftwareLicense | null;
}

export function LicenseKeyRevealModal({
  isOpen,
  onClose,
  license,
}: LicenseKeyRevealModalProps) {
  const [reason, setReason] = useState("Verifikasi serial lisensi perangkat lunak");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen || !license) return null;

  const handleReveal = async () => {
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const res = await revealLicenseKeyAction({
        id: license.id,
        reason: reason.trim() || undefined,
      });

      if (!res.ok) {
        setErrorMsg(res.error || "Gagal membuka kunci lisensi.");
        setIsLoading(false);
        return;
      }

      setRevealedKey(res.data?.key || "");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Terjadi kesalahan sistem.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!revealedKey) return;
    try {
      await navigator.clipboard.writeText(revealedKey);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch (err) {
      console.error("Gagal menyalin kunci:", err);
    }
  };

  const handleModalClose = () => {
    setRevealedKey(null);
    setErrorMsg(null);
    setIsCopied(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200 shadow-2xs">
              <KeyRound className="w-5 h-5" />
            </div>
            <button
              type="button"
              onClick={handleModalClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <h3 className="text-base font-bold text-slate-900 font-serif mb-1">
            Buka Kunci Produk (Serial Key)
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Lisensi: <span className="font-semibold text-slate-800">{license.name}</span> ({license.vendor || "Umum"})
          </p>

          {!revealedKey ? (
            /* Langkah 1: Peringatan Keamanan & Konfirmasi */
            <div className="space-y-4">
              <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl flex items-start gap-3 text-amber-900 text-xs">
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-amber-950 block">Pemberitahuan Audit Keamanan:</span>
                  <p className="leading-relaxed text-amber-800">
                    Kunci produk disimpan menggunakan enkripsi tingkat tinggi (AES-256-GCM).
                    Tindakan membuka kunci ini <strong>akan dicatat ke dalam Buku Besar Audit Log Sistem (VIEW_SENSITIVE)</strong> lengkap dengan alamat IP, waktu akses, dan identitas akun Anda.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Alasan Membuka Kunci <span className="text-slate-400 font-normal">(Dicatat ke Audit Log)</span>
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Contoh: Instalasi perangkat baru staf riset"
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50]"
                />
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-rose-700 text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleModalClose}
                  disabled={isLoading}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleReveal}
                  disabled={isLoading}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#102E50] text-white text-xs font-semibold rounded-xl hover:bg-[#1a4473] transition-colors disabled:opacity-50 shadow-xs"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Mendekripsi Kunci...</span>
                    </>
                  ) : (
                    <span>Saya Mengerti, Buka Kunci</span>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Langkah 2: Kunci Terungkap & Fitur Salin */
            <div className="space-y-4">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-emerald-800 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Kunci lisensi berhasil didekripsi. Catatan audit <code>VIEW_SENSITIVE</code> telah dibuat.</span>
              </div>

              <div>
                <span className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Kunci Produk (Serial / License Key):
                </span>
                <div className="relative group">
                  <pre className="w-full p-4 bg-slate-900 text-amber-300 font-mono text-sm rounded-xl border border-slate-800 overflow-x-auto whitespace-pre-wrap break-all shadow-inner select-all">
                    {revealedKey}
                  </pre>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-semibold rounded-lg border border-slate-700 transition-colors shadow-xs"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Kunci</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleModalClose}
                  className="px-5 py-2 bg-[#102E50] text-white text-xs font-semibold rounded-xl hover:bg-[#1a4473] transition-colors shadow-xs"
                >
                  Selesai
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
