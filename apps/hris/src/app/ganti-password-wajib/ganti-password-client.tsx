"use client";

import React, { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "@pspk/auth/client";
import { PspkLockup } from "@pspk/ui";
import {
  ShieldCheck,
  KeyRound,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  LogOut,
  ArrowRight,
  Loader2,
  Lock,
} from "lucide-react";
import { forceChangePasswordAction } from "@/server/actions/profile.actions";

interface GantiPasswordWajibClientProps {
  userEmail: string;
  userName: string;
}

export function GantiPasswordWajibClient({
  userEmail,
  userName,
}: GantiPasswordWajibClientProps) {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Kriteria validasi real-time
  const criteria = useMemo(() => {
    return {
      minLength: newPassword.length >= 8,
      hasUpperLower: /[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword),
      hasNumber: /[0-9]/.test(newPassword),
      differentFromCurrent:
        currentPassword.length > 0 &&
        newPassword.length > 0 &&
        newPassword !== currentPassword,
      matchConfirm: confirmPassword.length > 0 && newPassword === confirmPassword,
    };
  }, [currentPassword, newPassword, confirmPassword]);

  // Kalkulasi kekuatan kata sandi
  const strength = useMemo(() => {
    if (!newPassword) {
      return { score: 0, label: "Belum diisi", color: "bg-slate-200", text: "text-slate-400" };
    }

    let score = 0;
    if (criteria.minLength) score++;
    if (criteria.hasUpperLower) score++;
    if (criteria.hasNumber) score++;
    if (/[^a-zA-Z0-9]/.test(newPassword)) score++;

    if (score <= 1) {
      return { score: 1, label: "Lemah", color: "bg-amber-500", text: "text-amber-600" };
    }
    if (score === 2) {
      return { score: 2, label: "Cukup", color: "bg-amber-600", text: "text-amber-700" };
    }
    if (score === 3) {
      return { score: 3, label: "Kuat", color: "bg-blue-600", text: "text-blue-700" };
    }
    return { score: 4, label: "Sangat Kuat", color: "bg-emerald-600", text: "text-emerald-700" };
  }, [newPassword, criteria]);

  const isFormValid =
    currentPassword.length > 0 &&
    criteria.minLength &&
    criteria.hasUpperLower &&
    criteria.hasNumber &&
    criteria.differentFromCurrent &&
    criteria.matchConfirm;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || isPending) return;

    setErrorMessage(null);
    setSuccessMessage(null);

    startTransition(async () => {
      const res = await forceChangePasswordAction({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      if (res.success) {
        setSuccessMessage(res.message || "Kata sandi berhasil diperbarui!");
        setTimeout(() => {
          router.push("/dashboard");
          router.refresh();
        }, 1200);
      } else {
        setErrorMessage(res.error || "Gagal memperbarui kata sandi.");
      }
    });
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await signOut();
      router.push("/login");
      router.refresh();
    } catch {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8 font-sans">
      {/* Top Header Logo */}
      <header className="max-w-md w-full mx-auto flex items-center justify-between">
        <PspkLockup />
        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut || isPending}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-red-700 transition-colors p-2 rounded-lg hover:bg-red-50 focus:outline-none"
          title="Keluar dari sesi saat ini"
        >
          {isLoggingOut ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <LogOut className="w-3.5 h-3.5" />
          )}
          <span>Keluar</span>
        </button>
      </header>

      {/* Main Content Card */}
      <main className="max-w-lg w-full mx-auto my-6">
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
          {/* Card Accent Top Bar */}
          <div className="h-2 bg-gradient-to-r from-[#102E50] via-[#F2AF3E] to-[#102E50]" />

          <div className="p-6 sm:p-8 space-y-6">
            {/* Header Title & Intro */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-amber-800 text-xs font-semibold">
                <ShieldCheck className="w-4 h-4 text-[#F2AF3E]" />
                <span>Pengamanan Akun Pertama Kali</span>
              </div>
              <h1 className="text-2xl font-bold font-serif text-[#102E50] tracking-tight">
                Buat Kata Sandi Baru
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Halo, <strong className="text-slate-900">{userName}</strong>! Demi menjaga keamanan akun
                dan data internal lembaga, silakan ubah kata sandi sementara yang Anda terima via
                email menjadi kata sandi pribadi sebelum melanjutkan ke portal.
              </p>
            </div>

            {/* User Account Info Chip */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 flex items-center justify-between text-xs text-slate-600">
              <span className="font-medium text-slate-500">Email Akun:</span>
              <span className="font-mono font-semibold text-slate-800">{userEmail}</span>
            </div>

            {/* Error Message Banner */}
            {errorMessage && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 animate-in fade-in">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm text-red-700 leading-normal">
                  {errorMessage}
                </div>
              </div>
            )}

            {/* Success Message Banner */}
            {successMessage && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3 animate-in fade-in">
                <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm font-semibold text-emerald-800">
                  {successMessage}
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Field 1: Kata Sandi Sementara */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Kata Sandi Sementara <span className="text-[#A8281C]">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type={showCurrent ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    placeholder="Masukkan kata sandi dari email"
                    className="w-full pl-9 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#102E50] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    tabIndex={-1}
                  >
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  Salin kata sandi sementara yang dikirimkan ke email pribadi Anda.
                </p>
              </div>

              {/* Field 2: Kata Sandi Baru */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Kata Sandi Baru <span className="text-[#A8281C]">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="Minimal 8 karakter kombinasi"
                    className="w-full pl-9 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#102E50] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    tabIndex={-1}
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {newPassword.length > 0 && (
                  <div className="pt-2 space-y-1.5 animate-in fade-in">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Kekuatan Kata Sandi:</span>
                      <span className={`font-semibold ${strength.text}`}>{strength.label}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex gap-1">
                      <div
                        className={`h-full transition-all duration-300 ${
                          strength.score >= 1 ? strength.color : "bg-transparent"
                        } w-1/4`}
                      />
                      <div
                        className={`h-full transition-all duration-300 ${
                          strength.score >= 2 ? strength.color : "bg-transparent"
                        } w-1/4`}
                      />
                      <div
                        className={`h-full transition-all duration-300 ${
                          strength.score >= 3 ? strength.color : "bg-transparent"
                        } w-1/4`}
                      />
                      <div
                        className={`h-full transition-all duration-300 ${
                          strength.score >= 4 ? strength.color : "bg-transparent"
                        } w-1/4`}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Field 3: Konfirmasi Kata Sandi Baru */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Konfirmasi Kata Sandi Baru <span className="text-[#A8281C]">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Ketik ulang kata sandi baru"
                    className="w-full pl-9 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#102E50] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Checklist Kriteria Keamanan */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2 text-xs">
                <span className="font-semibold text-slate-700 block">Kriteria Keamanan:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div
                    className={`flex items-center gap-1.5 ${
                      criteria.minLength ? "text-emerald-700 font-medium" : "text-slate-500"
                    }`}
                  >
                    <Check
                      className={`w-3.5 h-3.5 ${
                        criteria.minLength ? "text-emerald-600" : "text-slate-300"
                      }`}
                    />
                    <span>Minimal 8 karakter</span>
                  </div>
                  <div
                    className={`flex items-center gap-1.5 ${
                      criteria.hasUpperLower ? "text-emerald-700 font-medium" : "text-slate-500"
                    }`}
                  >
                    <Check
                      className={`w-3.5 h-3.5 ${
                        criteria.hasUpperLower ? "text-emerald-600" : "text-slate-300"
                      }`}
                    />
                    <span>Huruf besar &amp; kecil</span>
                  </div>
                  <div
                    className={`flex items-center gap-1.5 ${
                      criteria.hasNumber ? "text-emerald-700 font-medium" : "text-slate-500"
                    }`}
                  >
                    <Check
                      className={`w-3.5 h-3.5 ${
                        criteria.hasNumber ? "text-emerald-600" : "text-slate-300"
                      }`}
                    />
                    <span>Minimal 1 angka</span>
                  </div>
                  <div
                    className={`flex items-center gap-1.5 ${
                      criteria.differentFromCurrent
                        ? "text-emerald-700 font-medium"
                        : "text-slate-500"
                    }`}
                  >
                    <Check
                      className={`w-3.5 h-3.5 ${
                        criteria.differentFromCurrent ? "text-emerald-600" : "text-slate-300"
                      }`}
                    />
                    <span>Beda dari kata sandi lama</span>
                  </div>
                </div>
                {confirmPassword.length > 0 && (
                  <div
                    className={`pt-1 border-t border-slate-200/60 flex items-center gap-1.5 ${
                      criteria.matchConfirm ? "text-emerald-700 font-medium" : "text-red-600"
                    }`}
                  >
                    <Check
                      className={`w-3.5 h-3.5 ${
                        criteria.matchConfirm ? "text-emerald-600" : "text-red-400"
                      }`}
                    />
                    <span>
                      {criteria.matchConfirm
                        ? "Konfirmasi kata sandi cocok"
                        : "Konfirmasi kata sandi belum cocok"}
                    </span>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!isFormValid || isPending || isLoggingOut}
                className="w-full py-3 px-4 rounded-xl bg-[#102E50] hover:bg-[#0c243f] active:bg-[#08182b] text-white font-semibold text-sm shadow-sm transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#102E50] focus:ring-offset-2"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#F2AF3E]" />
                    <span>Menyimpan Kata Sandi...</span>
                  </>
                ) : (
                  <>
                    <span>Simpan Kata Sandi &amp; Buka Dashboard</span>
                    <ArrowRight className="w-4 h-4 text-[#F2AF3E]" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-md w-full mx-auto text-center text-xs text-slate-400">
        &copy; {new Date().getFullYear()} Pusat Studi Pendidikan dan Kebijakan (PSPK).
      </footer>
    </div>
  );
}
