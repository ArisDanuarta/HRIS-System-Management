"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { CredentialCategory, TwoFactorType } from "@pspk/db";
import {
  SerializedCredential,
  ActiveEmployeePicOption,
} from "@/server/queries/credential.queries";
import {
  createCredentialAction,
  updateCredentialAction,
} from "@/server/actions/credential.actions";
import {
  KeyRound,
  Loader2,
  X,
  AlertTriangle,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  Check,
} from "lucide-react";
import {
  CATEGORY_META,
  TWO_FACTOR_META,
  generateStrongPassword,
  evaluatePasswordStrength,
} from "./credential-constants";

interface CredentialFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: SerializedCredential | null;
  picEmployees?: ActiveEmployeePicOption[];
}

export function CredentialFormModal({
  isOpen,
  onClose,
  initialData,
  picEmployees = [],
}: CredentialFormModalProps) {
  if (!isOpen) return null;

  return (
    <CredentialFormInnerModal
      onClose={onClose}
      initialData={initialData}
      picEmployees={picEmployees}
    />
  );
}

function CredentialFormInnerModal({
  onClose,
  initialData,
  picEmployees,
}: {
  onClose: () => void;
  initialData?: SerializedCredential | null;
  picEmployees: ActiveEmployeePicOption[];
}) {
  const router = useRouter();
  const isEditing = Boolean(initialData);

  const [title, setTitle] = useState(initialData?.title || "");
  const [category, setCategory] = useState<CredentialCategory>(
    initialData?.category || CredentialCategory.SAAS_TOOL,
  );
  const [url, setUrl] = useState(initialData?.url || "");
  const [username, setUsername] = useState(initialData?.username || "");
  const [email, setEmail] = useState(initialData?.email || "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [twoFactorType, setTwoFactorType] = useState<TwoFactorType>(
    initialData?.twoFactorType || TwoFactorType.NONE,
  );
  const [recoveryEmail, setRecoveryEmail] = useState(initialData?.recoveryEmail || "");
  const [recoveryPhone, setRecoveryPhone] = useState(initialData?.recoveryPhone || "");
  const [picEmployeeId, setPicEmployeeId] = useState(initialData?.picEmployeeId || "");
  const [notes, setNotes] = useState(initialData?.notes || "");
  const [isActive, setIsActive] = useState(initialData ? initialData.isActive : true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedGenerated, setCopiedGenerated] = useState(false);

  const passwordStrength = evaluatePasswordStrength(password);

  const handleGeneratePassword = () => {
    const generated = generateStrongPassword(20);
    setPassword(generated);
    setShowPassword(true);
    setCopiedGenerated(true);
    setTimeout(() => setCopiedGenerated(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!title.trim()) {
      setErrorMsg("Nama akun atau layanan wajib diisi.");
      return;
    }

    if (!username.trim() && !email.trim()) {
      setErrorMsg("Minimal salah satu dari Username atau Email Login harus diisi.");
      return;
    }

    if (!isEditing && !password.trim()) {
      setErrorMsg("Password akun wajib diisi untuk kredensial baru.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditing && initialData) {
        const res = await updateCredentialAction({
          id: initialData.id,
          title: title.trim(),
          category,
          url: url.trim() || null,
          username: username.trim() || null,
          email: email.trim() || null,
          password: password.trim() ? password.trim() : undefined,
          twoFactorType,
          recoveryEmail: recoveryEmail.trim() || null,
          recoveryPhone: recoveryPhone.trim() || null,
          picEmployeeId: picEmployeeId || null,
          notes: notes.trim() || null,
          isActive,
        });

        if (!res.ok) {
          setErrorMsg(res.error || "Gagal memperbarui data kredensial.");
          setIsSubmitting(false);
          return;
        }
      } else {
        const res = await createCredentialAction({
          title: title.trim(),
          category,
          url: url.trim() || undefined,
          username: username.trim() || undefined,
          email: email.trim() || undefined,
          password: password.trim(),
          twoFactorType,
          recoveryEmail: recoveryEmail.trim() || undefined,
          recoveryPhone: recoveryPhone.trim() || undefined,
          picEmployeeId: picEmployeeId || undefined,
          notes: notes.trim() || undefined,
          isActive,
        });

        if (!res.ok) {
          setErrorMsg(res.error || "Gagal menambahkan akun kredensial.");
          setIsSubmitting(false);
          return;
        }
      }

      router.refresh();
      onClose();
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : "Terjadi kesalahan sistem saat menyimpan kredensial.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-200 shrink-0 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#102E50]/10 text-[#102E50] flex items-center justify-center border border-[#102E50]/20 shadow-2xs">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 font-serif leading-tight">
                {isEditing ? "Edit Akun Kredensial" : "Tambah Akun & Kredensial Baru"}
              </h3>
              <p className="text-xs text-slate-500">
                {isEditing
                  ? "Perbarui metadata akun atau lakukan rotasi password terenkripsi."
                  : "Daftarkan akun eksternal lembaga ke dalam brankas aman terenkripsi AES-256."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-rose-700 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Informasi Dasar Akun */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
              <span className="w-2 h-2 rounded-full bg-[#102E50]" />
              Informasi Umum Layanan
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nama Akun / Layanan */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Akun / Layanan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Instagram Resmi PSPK"
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50]"
                />
              </div>

              {/* Kategori Akun */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kategori Layanan <span className="text-rose-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as CredentialCategory)}
                  className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50]"
                >
                  {Object.entries(CATEGORY_META).map(([key, meta]) => (
                    <option key={key} value={key}>
                      {meta.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* URL Login */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                URL Login / Website Portal <span className="text-slate-400 font-normal">(Opsional)</span>
              </label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Contoh: https://instagram.com atau https://admin.google.com"
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50]"
              />
            </div>
          </div>

          {/* Section 2: Kredensial Login */}
          <div className="space-y-4 pt-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Kredensial & Autentikasi
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Username */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Username Akun
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Contoh: pspk.id atau admin_pspk"
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50]"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Akun Terdaftar
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Contoh: media@pspk.id"
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50]"
                />
              </div>
            </div>
            <p className="text-[11px] text-slate-400 -mt-2">
              * Minimal salah satu antara Username atau Email harus diisi sebagai identitas akun.
            </p>

            {/* Password Field + Generator */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-600" />
                  <span>
                    {isEditing ? "Ganti Password (Rotasi)" : "Password Akun"}
                    {!isEditing && <span className="text-rose-500"> *</span>}
                  </span>
                </label>
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#102E50] hover:text-[#1a4473] bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs hover:bg-slate-50 transition-colors"
                >
                  {copiedGenerated ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-500" />
                      <span className="text-emerald-600">Dibuat & Diterapkan</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>Buat Password Kuat</span>
                    </>
                  )}
                </button>
              </div>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={
                    isEditing
                      ? "Biarkan kosong jika tidak ingin mengubah password saat ini"
                      : "Masukkan password akun atau gunakan tombol buat otomatis"
                  }
                  className="w-full text-xs px-3.5 py-2.5 pr-10 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50] font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {password.length > 0 && (
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-500">Kekuatan Password:</span>
                    <span className={`font-semibold ${passwordStrength.colorClass}`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${passwordStrength.barWidthClass}`}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Keamanan 2FA & Pemulihan */}
          <div className="space-y-4 pt-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Proteksi Two-Factor Authentication (2FA) & Pemulihan
            </h4>

            {/* 2FA Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Metode Two-Factor Authentication (2FA)
              </label>
              <select
                value={twoFactorType}
                onChange={(e) => setTwoFactorType(e.target.value as TwoFactorType)}
                className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50]"
              >
                {Object.entries(TWO_FACTOR_META).map(([key, meta]) => (
                  <option key={key} value={key}>
                    {meta.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Recovery Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Pemulihan (Recovery) <span className="text-slate-400 font-normal">(Opsional)</span>
                </label>
                <input
                  type="email"
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  placeholder="Contoh: backup-it@pspk.id"
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50]"
                />
              </div>

              {/* Recovery Phone */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nomor HP Pemulihan / OTP <span className="text-slate-400 font-normal">(Opsional)</span>
                </label>
                <input
                  type="text"
                  value={recoveryPhone}
                  onChange={(e) => setRecoveryPhone(e.target.value)}
                  placeholder="Contoh: 081234567890 (HP Operasional)"
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50]"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Penanggung Jawab & Status */}
          <div className="space-y-4 pt-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              Penanggung Jawab (PIC) & Operasional
            </h4>

            {/* PIC Pegawai */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                PIC Penanggung Jawab Akun <span className="text-slate-400 font-normal">(Pegawai Aktif)</span>
              </label>
              <select
                value={picEmployeeId}
                onChange={(e) => setPicEmployeeId(e.target.value)}
                className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50]"
              >
                <option value="">-- Tidak Ditentukan / Milik Bersama Lembaga --</option>
                {initialData?.picEmployee &&
                  !picEmployees.some((e) => e.id === initialData.picEmployee?.id) && (
                    <option value={initialData.picEmployee.id}>
                      {initialData.picEmployee.fullName} ({initialData.picEmployee.employeeNo}) [Nonaktif / Mutasi]
                    </option>
                  )}
                {picEmployees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.fullName} ({emp.employeeNo})
                    {emp.departmentName ? ` - ${emp.departmentName}` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Catatan / Keterangan */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Catatan Khusus / Prosedur Akses <span className="text-slate-400 font-normal">(Opsional)</span>
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Akun ini khusus dipakai staf komunikasi untuk jadwal rilis mingguan. Jangan reset cookie browser."
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50] resize-none"
              />
            </div>

            {/* Status Aktif */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isActiveCheckbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 text-[#102E50] rounded border-slate-300 focus:ring-[#102E50]"
              />
              <label htmlFor="isActiveCheckbox" className="text-xs font-medium text-slate-700 cursor-pointer">
                Akun ini aktif dan digunakan dalam operasional lembaga
              </label>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-[#102E50] text-white text-xs font-semibold rounded-xl hover:bg-[#1a4473] transition-colors disabled:opacity-50 shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyimpan Kredensial...</span>
                </>
              ) : (
                <span>{isEditing ? "Simpan Perubahan" : "Simpan ke Brankas"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
