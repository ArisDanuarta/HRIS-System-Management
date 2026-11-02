"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { SerializedCredential } from "@/server/queries/credential.queries";
import { revealCredentialPasswordAction } from "@/server/actions/credential.actions";
import {
  KeyRound,
  ShieldAlert,
  Loader2,
  X,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Timer,
  EyeOff,
} from "lucide-react";
import { CATEGORY_META } from "./credential-constants";

interface CredentialRevealModalProps {
  isOpen: boolean;
  onClose: () => void;
  credential: SerializedCredential | null;
}

const COUNTDOWN_SECONDS = 20;

export function CredentialRevealModal({
  isOpen,
  onClose,
  credential,
}: CredentialRevealModalProps) {
  const [reason, setReason] = useState("Akses operasional akun lembaga");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [revealedPassword, setRevealedPassword] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleModalClose = useCallback(() => {
    clearTimer();
    setRevealedPassword(null);
    setErrorMsg(null);
    setIsCopied(false);
    setCountdown(COUNTDOWN_SECONDS);
    onClose();
  }, [clearTimer, onClose]);

  // Countdown timer saat password sudah terbuka
  useEffect(() => {
    if (!revealedPassword) return;

    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearTimer();
          setRevealedPassword(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearTimer();
  }, [revealedPassword, clearTimer]);

  if (!isOpen || !credential) return null;

  const categoryMeta = CATEGORY_META[credential.category];

  const handleReveal = async () => {
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const res = await revealCredentialPasswordAction({
        id: credential.id,
        reason: reason.trim() || undefined,
      });

      if (!res.ok) {
        setErrorMsg(res.error || "Gagal membuka password akun.");
        setIsLoading(false);
        return;
      }

      setRevealedPassword(res.data?.password || "");
      setCountdown(COUNTDOWN_SECONDS);
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : "Terjadi kesalahan sistem saat mendekripsi password.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!revealedPassword) return;
    try {
      await navigator.clipboard.writeText(revealedPassword);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch (err) {
      console.error("Gagal menyalin password:", err);
    }
  };

  const progressPercent = (countdown / COUNTDOWN_SECONDS) * 100;

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
            Buka Password Akun / Kredensial
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Layanan: <span className="font-semibold text-slate-800">{credential.title}</span> (
            {categoryMeta?.label || credential.category})
          </p>

          {!revealedPassword ? (
            /* Langkah 1: Peringatan Keamanan & Alasan */
            <div className="space-y-4">
              <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl flex items-start gap-3 text-amber-900 text-xs">
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-amber-950 block">Pemberitahuan Audit Keamanan:</span>
                  <p className="leading-relaxed text-amber-800">
                    Password akun disimpan dengan enkripsi militer <strong>AES-256-GCM</strong>.
                    Tindakan membuka password ini <strong>akan dicatat ke dalam Audit Log Sistem (REVEAL_PASSWORD)</strong> lengkap dengan alamat IP, waktu akses, dan identitas akun Anda.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Alasan Membuka Password <span className="text-slate-400 font-normal">(Dicatat ke Audit Log)</span>
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Contoh: Login pembaruan konten Instagram resmi"
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
                      <span>Mendekripsi Password...</span>
                    </>
                  ) : (
                    <span>Saya Mengerti, Buka Password</span>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Langkah 2: Password Terbuka, Countdown & Salin Aman */
            <div className="space-y-4">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-2.5 text-emerald-800 text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Password berhasil didekripsi. Catatan audit <code>REVEAL_PASSWORD</code> telah disimpan.</span>
                </div>
              </div>

              {/* Progress Bar Countdown Timer */}
              <div className="space-y-1.5 bg-slate-50 border border-slate-200 p-3 rounded-xl">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                    <Timer className="w-3.5 h-3.5 text-amber-600" />
                    Penutupan Otomatis (Auto-Mask):
                  </span>
                  <span className="font-mono font-bold text-slate-800">{countdown} detik</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 transition-all duration-1000 ease-linear rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-400 block text-right">
                  Password akan disembunyikan otomatis demi keamanan
                </span>
              </div>

              <div>
                <span className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Password Akun:
                </span>
                <div className="relative group">
                  <pre className="w-full p-4 bg-slate-900 text-amber-300 font-mono text-base font-semibold rounded-xl border border-slate-800 overflow-x-auto whitespace-pre-wrap break-all shadow-inner select-all">
                    {revealedPassword}
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
                        <span>Salin Password</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Tautan URL Login Jika Ada */}
              {credential.url && (
                <div className="flex items-center justify-between p-3 bg-sky-50 border border-sky-100 rounded-xl text-xs">
                  <span className="text-sky-900 truncate max-w-[280px]">
                    URL Login: <strong className="font-mono">{credential.url}</strong>
                  </span>
                  <a
                    href={credential.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-sky-700 hover:text-sky-900 hover:underline shrink-0"
                  >
                    <span>Buka Portal</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    clearTimer();
                    setRevealedPassword(null);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-slate-600 hover:text-slate-800 text-xs font-semibold rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>Sembunyikan Sekarang</span>
                </button>
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
