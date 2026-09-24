"use client";

import React, { useState, useMemo, useTransition } from "react";
import {
  Eye,
  EyeOff,
  Lock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ShieldCheck,
  KeyRound,
  Check,
  RefreshCw,
} from "lucide-react";
import { changePasswordAction } from "@/server/actions/profile.actions";

export function ChangePasswordTab() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Requirements checklist validation
  const criteria = useMemo(() => {
    return {
      minLength: newPassword.length >= 12,
      hasUpperLower: /[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword),
      hasNumber: /[0-9]/.test(newPassword),
      hasSymbol: /[^a-zA-Z0-9]/.test(newPassword),
      matchConfirm: confirmPassword.length > 0 && newPassword === confirmPassword,
    };
  }, [newPassword, confirmPassword]);

  // Password strength calculation
  const strength = useMemo(() => {
    if (!newPassword) return { score: 0, label: "Belum diisi", color: "bg-slate-200", text: "text-slate-400" };

    let passedCount = 0;
    if (criteria.minLength) passedCount++;
    if (criteria.hasUpperLower) passedCount++;
    if (criteria.hasNumber) passedCount++;
    if (criteria.hasSymbol) passedCount++;

    if (passedCount <= 1) {
      return { score: 1, label: "Lemah", color: "bg-rose-500", text: "text-rose-600" };
    }
    if (passedCount === 2) {
      return { score: 2, label: "Cukup", color: "bg-amber-500", text: "text-amber-600" };
    }
    if (passedCount === 3) {
      return { score: 3, label: "Kuat", color: "bg-blue-600", text: "text-blue-600" };
    }
    return { score: 4, label: "Sangat Kuat", color: "bg-emerald-600", text: "text-emerald-600" };
  }, [newPassword, criteria]);

  const isFormValid =
    currentPassword.length > 0 &&
    criteria.minLength &&
    criteria.hasUpperLower &&
    criteria.hasNumber &&
    criteria.hasSymbol &&
    criteria.matchConfirm;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || isPending) return;

    setErrorMessage(null);
    setSuccessMessage(null);

    startTransition(async () => {
      const res = await changePasswordAction({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      if (res.success) {
        setSuccessMessage(res.message || "Kata sandi Anda berhasil diperbarui.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setErrorMessage(res.error || "Gagal memperbarui kata sandi.");
      }
    });
  };

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-50 text-amber-900 border border-amber-200/80">
            <KeyRound className="w-4 h-4 text-amber-700" />
          </div>
          <h2 className="text-xl font-bold font-serif text-[#102E50]">
            Perbarui Kata Sandi Akun
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 max-w-xl">
          Gunakan kata sandi yang kuat dan unik untuk menjaga keamanan akun dan data operasional
          PSPK Anda. Sesi pada perangkat lain akan diputus setelah kata sandi diubah.
        </p>
      </div>

      {/* Success Banner */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="text-xs sm:text-sm font-bold text-emerald-900">
              Kata Sandi Berhasil Diperbarui
            </p>
            <p className="text-xs text-emerald-700">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="text-xs sm:text-sm font-bold text-rose-900">
              Pembaruan Kata Sandi Gagal
            </p>
            <p className="text-xs text-rose-700">{errorMessage}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 max-w-xl">
        {/* 1. Kata Sandi Saat Ini */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700">
            Kata Sandi Saat Ini <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type={showCurrent ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Masukkan kata sandi lama Anda"
              required
              className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50] transition-all"
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              title={showCurrent ? "Sembunyikan" : "Tampilkan"}
            >
              {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* 2. Kata Sandi Baru */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700">
            Kata Sandi Baru <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type={showNew ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimal 12 karakter kombinasi"
              required
              className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50] transition-all"
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              title={showNew ? "Sembunyikan" : "Tampilkan"}
            >
              {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Password Strength Meter */}
          {newPassword.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Kekuatan Kata Sandi:</span>
                <span className={`font-bold ${strength.text}`}>{strength.label}</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden p-0.5">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`h-full rounded-full transition-all duration-300 ${
                      step <= strength.score ? strength.color : "bg-transparent"
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 3. Konfirmasi Kata Sandi Baru */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700">
            Konfirmasi Kata Sandi Baru <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type={showConfirm ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Ketik ulang kata sandi baru"
              required
              className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50] transition-all"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              title={showConfirm ? "Sembunyikan" : "Tampilkan"}
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Requirements Checklist Card */}
        <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-2.5 text-xs">
          <div className="font-bold text-slate-700 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#102E50]" />
            <span>Kriteria Keamanan Kata Sandi PSPK:</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
            <div className="flex items-center gap-2">
              {criteria.minLength ? (
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 ml-1 mr-1 shrink-0" />
              )}
              <span className={criteria.minLength ? "text-slate-800 font-semibold" : "text-slate-500"}>
                Minimal 12 karakter
              </span>
            </div>

            <div className="flex items-center gap-2">
              {criteria.hasUpperLower ? (
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 ml-1 mr-1 shrink-0" />
              )}
              <span className={criteria.hasUpperLower ? "text-slate-800 font-semibold" : "text-slate-500"}>
                Huruf besar & huruf kecil
              </span>
            </div>

            <div className="flex items-center gap-2">
              {criteria.hasNumber ? (
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 ml-1 mr-1 shrink-0" />
              )}
              <span className={criteria.hasNumber ? "text-slate-800 font-semibold" : "text-slate-500"}>
                Memuat minimal satu angka (0-9)
              </span>
            </div>

            <div className="flex items-center gap-2">
              {criteria.hasSymbol ? (
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 ml-1 mr-1 shrink-0" />
              )}
              <span className={criteria.hasSymbol ? "text-slate-800 font-semibold" : "text-slate-500"}>
                Memuat simbol (!@#$%^&*)
              </span>
            </div>

            {confirmPassword.length > 0 && (
              <div className="flex items-center gap-2 col-span-1 sm:col-span-2 pt-1 border-t border-slate-200/60">
                {criteria.matchConfirm ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                )}
                <span
                  className={
                    criteria.matchConfirm
                      ? "text-emerald-700 font-semibold"
                      : "text-rose-600 font-medium"
                  }
                >
                  {criteria.matchConfirm
                    ? "Konfirmasi kata sandi cocok"
                    : "Konfirmasi kata sandi belum sama"}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={!isFormValid || isPending}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all shadow-xs cursor-pointer ${
              !isFormValid || isPending
                ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                : "bg-[#102E50] hover:bg-[#1a4473] text-white"
            }`}
          >
            {isPending ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Menyimpan Perubahan...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Simpan Kata Sandi Baru</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
