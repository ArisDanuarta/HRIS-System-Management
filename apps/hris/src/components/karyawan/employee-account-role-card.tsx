"use client";

import React, { useState, useTransition } from "react";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  UserCheck,
  UserX,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Plus,
} from "lucide-react";
import {
  updateEmployeeRolesAction,
  createEmployeeLoginAccountAction,
  getSystemRolesAction,
} from "@/server/actions/user-role.actions";

export interface EmployeeAccountRoleCardProps {
  employeeId: string;
  fullName: string;
  workEmail: string;
  personalEmail?: string | null;
  user: {
    id: string;
    email: string;
    isActive: boolean;
    roles: {
      role: {
        id: string;
        key: string;
        name: string;
        description: string | null;
      };
    }[];
  } | null;
  isSuperAdmin: boolean;
  isAdminIt: boolean;
  isAdminHr: boolean;
}

interface RoleOption {
  id: string;
  key: string;
  name: string;
  description: string | null;
}

export function EmployeeAccountRoleCard({
  employeeId,
  fullName,
  workEmail,
  personalEmail,
  user,
  isSuperAdmin,
  isAdminIt,
  isAdminHr,
}: EmployeeAccountRoleCardProps) {
  // Modal states
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isCreateAccountModalOpen, setIsCreateAccountModalOpen] = useState(false);

  // System roles list
  const [allRoles, setAllRoles] = useState<RoleOption[]>([]);
  const [selectedRoleKeys, setSelectedRoleKeys] = useState<string[]>([]);
  const [newAccountRoleKey, setNewAccountRoleKey] = useState<string>("staff");

  // Feedback & Transition states
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null,
  );
  const [createdCredentials, setCreatedCredentials] = useState<{
    workEmail: string;
    temporaryPassword: string;
    roleName: string;
    personalEmail?: string | null;
    emailSent: boolean;
    emailMessage: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Active roles mapping
  const activeRoles = user?.roles.map((r) => r.role) || [];
  const activeRoleKeys = activeRoles.map((r) => r.key);

  const canManageRoles = isSuperAdmin || isAdminIt;
  const canCreateAccount = isSuperAdmin || isAdminHr || isAdminIt;

  const handleOpenRoleModal = async () => {
    setFeedback(null);
    setSelectedRoleKeys(activeRoleKeys);

    // Fetch system roles from database
    const res = await getSystemRolesAction();
    if (res.ok && res.data) {
      setAllRoles(res.data);
    }
    setIsRoleModalOpen(true);
  };

  const handleOpenCreateAccountModal = async () => {
    setFeedback(null);
    setCreatedCredentials(null);
    setNewAccountRoleKey("staff");

    const res = await getSystemRolesAction();
    if (res.ok && res.data) {
      // Filter roles based on privileges: Admin HR can only assign staff or manager
      if (isSuperAdmin) {
        setAllRoles(res.data);
      } else {
        setAllRoles(res.data.filter((r) => r.key === "staff" || r.key === "manager"));
      }
    }
    setIsCreateAccountModalOpen(true);
  };

  const handleToggleRoleKey = (key: string) => {
    // Only super admin can toggle super_admin role
    if (key === "super_admin" && !isSuperAdmin) {
      return;
    }

    setSelectedRoleKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const handleSaveRoles = () => {
    setFeedback(null);
    if (selectedRoleKeys.length === 0) {
      setFeedback({
        type: "error",
        message: "Pegawai wajib memiliki minimal satu peran sistem aktif.",
      });
      return;
    }

    startTransition(async () => {
      const res = await updateEmployeeRolesAction({
        employeeId,
        roleKeys: selectedRoleKeys,
      });

      if (res.ok) {
        setFeedback({ type: "success", message: res.message });
        setTimeout(() => {
          setIsRoleModalOpen(false);
        }, 1500);
      } else {
        setFeedback({ type: "error", message: res.error });
      }
    });
  };

  const handleCreateAccount = () => {
    setFeedback(null);
    startTransition(async () => {
      const res = await createEmployeeLoginAccountAction({
        employeeId,
        roleKey: newAccountRoleKey,
      });

      if (res.ok && res.credentials) {
        setCreatedCredentials(res.credentials);
        setFeedback({ type: "success", message: res.message });
      } else {
        setFeedback({ type: "error", message: res.error || "Gagal membuat akun." });
      }
    });
  };

  const handleCopyCredentials = () => {
    if (!createdCredentials) return;
    const text = `Kredensial Akun HRIS PSPK:\nEmail: ${createdCredentials.workEmail}\nPassword: ${createdCredentials.temporaryPassword}\nPeran: ${createdCredentials.roleName}\nTautan: http://localhost:3001/login`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getRoleBadgeColor = (key: string) => {
    switch (key) {
      case "super_admin":
        return "bg-[#102E50] text-white border-[#102E50]";
      case "admin_hr":
        return "bg-[#F2AF3E]/15 text-[#805600] border-[#F2AF3E]/40";
      case "manager":
        return "bg-amber-50 text-amber-900 border-amber-300";
      case "admin_it":
        return "bg-blue-50 text-blue-900 border-blue-200";
      case "staff":
      default:
        return "bg-slate-100 text-slate-700 border-slate-300";
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Feedback Notification */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs font-medium flex items-start gap-2.5 transition-all ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
              : "bg-red-50 text-red-900 border border-red-200"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Main Account Status Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#102E50]/10 text-[#102E50] flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#102E50] font-heading">
                Status Akun & Hak Akses Portal
              </h3>
              <p className="text-xs text-slate-500">
                Informasi kredensial login, peran RBAC, dan tingkat otorisasi akses pegawai di sistem PSPK.
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {!user && canCreateAccount && (
              <button
                type="button"
                onClick={handleOpenCreateAccountModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#102E50] text-white hover:bg-[#0c233d] text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-[0.98]"
              >
                <Plus className="w-3.5 h-3.5 text-[#F2AF3E]" />
                <span>Buatkan Akun Login</span>
              </button>
            )}

            {user && canManageRoles && (
              <button
                type="button"
                onClick={handleOpenRoleModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#102E50] text-[#102E50] hover:bg-[#102E50]/5 text-xs font-bold transition-all cursor-pointer active:scale-[0.98]"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Kelola Peran (RBAC)</span>
              </button>
            )}
          </div>
        </div>

        {/* Account Details View */}
        {user ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Email & Account Status */}
            <div className="flex flex-col gap-3 p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 text-xs">
              <div className="font-bold text-slate-700 flex items-center justify-between">
                <span>Rincian Akun Login:</span>
                {user.isActive ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <UserCheck className="w-3 h-3 text-emerald-600" />
                    Akun Aktif
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                    <UserX className="w-3 h-3" />
                    Nonaktif
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1 mt-1">
                <span className="text-[11px] text-slate-400 font-medium">Alamat Surel Kantor (ID Pengguna)</span>
                <span className="font-mono font-bold text-slate-800 text-sm">{user.email}</span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[11px] text-slate-400 font-medium">Email Notifikasi Pribadi</span>
                <span className="text-slate-600 font-medium">{personalEmail || "Tidak dicantumkan"}</span>
              </div>
            </div>

            {/* Right: Active Roles */}
            <div className="flex flex-col gap-3 p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 text-xs">
              <div className="font-bold text-slate-700 flex items-center justify-between">
                <span>Hak Akses Peran Aktif:</span>
                <span className="text-[11px] text-slate-400 font-normal">
                  {activeRoles.length} Peran Diberikan
                </span>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {activeRoles.map((role) => (
                  <span
                    key={role.key}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border shadow-2xs ${getRoleBadgeColor(
                      role.key,
                    )}`}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>{role.name}</span>
                  </span>
                ))}
              </div>

              <div className="mt-2 pt-2 border-t border-slate-200/80 text-[11px] text-slate-500 flex flex-col gap-1">
                {activeRoles.map((role) => (
                  <div key={role.key} className="flex items-start gap-1.5">
                    <span className="font-bold text-slate-700 shrink-0">• {role.name}:</span>
                    <span>{role.description || "Hak akses standar."}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Empty Account Notice */
          <div className="p-6 rounded-xl border border-dashed border-amber-300 bg-amber-50/40 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="max-w-md">
              <h4 className="text-sm font-bold text-amber-900">
                Pegawai Belum Memiliki Akun Login Portal
              </h4>
              <p className="text-xs text-amber-800/80 mt-1 leading-relaxed">
                Pegawai ini tercatat dalam basis data kepegawaian namun belum memiliki kredensial akun pengguna aktif untuk masuk ke portal HRIS.
              </p>
            </div>
            {canCreateAccount && (
              <button
                type="button"
                onClick={handleOpenCreateAccountModal}
                className="mt-1 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#102E50] text-white hover:bg-[#0c233d] text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-[#F2AF3E]" />
                <span>Buatkan Akun Login Sekarang</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* MODAL 1: KELOLA PERAN (RBAC) */}
      {isRoleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 flex flex-col gap-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-[#102E50]/10 text-[#102E50] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#102E50] font-heading">
                  Kelola Peran & Hak Akses Pegawai
                </h3>
                <p className="text-xs text-slate-500">
                  Pilih peran sistem yang diberikan kepada: <strong className="text-slate-800">{fullName}</strong>
                </p>
              </div>
            </div>

            {feedback && (
              <div
                className={`p-3 rounded-lg text-xs font-medium ${
                  feedback.type === "success"
                    ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
                    : "bg-red-50 text-red-900 border border-red-200"
                }`}
              >
                {feedback.message}
              </div>
            )}

            <div className="flex flex-col gap-2.5 max-h-[60vh] overflow-y-auto pr-1">
              {allRoles.map((role) => {
                const isSelected = selectedRoleKeys.includes(role.key);
                const isSuperAdminRole = role.key === "super_admin";
                const isDisabled = isSuperAdminRole && !isSuperAdmin;

                return (
                  <label
                    key={role.key}
                    onClick={() => !isDisabled && handleToggleRoleKey(role.key)}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                      isSelected
                        ? "bg-[#102E50]/5 border-[#102E50] shadow-xs"
                        : "bg-slate-50/50 border-slate-200 hover:bg-slate-50"
                    } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={isDisabled}
                      onChange={() => {}}
                      className="mt-0.5 w-4 h-4 rounded text-[#102E50] focus:ring-[#102E50]"
                    />
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{role.name}</span>
                        {isSuperAdminRole && (
                          <span className="text-[10px] bg-red-100 text-red-800 font-bold px-1.5 py-0.2 rounded">
                            Super Admin
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        {role.description}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsRoleModalOpen(false)}
                disabled={isPending}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveRoles}
                disabled={isPending}
                className="px-5 py-2 rounded-lg text-xs font-bold bg-[#102E50] text-white hover:bg-[#0c233d] transition-all shadow-xs disabled:opacity-50"
              >
                {isPending ? "Menyimpan..." : "Simpan Perubahan Peran"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: BUATKAN AKUN LOGIN */}
      {isCreateAccountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 flex flex-col gap-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-[#102E50]/10 text-[#102E50] flex items-center justify-center">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#102E50] font-heading">
                  Buatkan Akun Login Portal
                </h3>
                <p className="text-xs text-slate-500">
                  Untuk pegawai: <strong className="text-slate-800">{fullName}</strong>
                </p>
              </div>
            </div>

            {feedback && !createdCredentials && (
              <div
                className={`p-3 rounded-lg text-xs font-medium ${
                  feedback.type === "success"
                    ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
                    : "bg-red-50 text-red-900 border border-red-200"
                }`}
              >
                {feedback.message}
              </div>
            )}

            {!createdCredentials ? (
              <div className="flex flex-col gap-4">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs flex flex-col gap-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Email Login Resmi:</span>
                    <span className="font-mono font-bold text-slate-800">{workEmail}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Email Kirim Kredensial:</span>
                    <span className="font-medium text-slate-700">{personalEmail || "(Belum ada)"}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Pilih Peran Sistem Awal <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newAccountRoleKey}
                    onChange={(e) => setNewAccountRoleKey(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#102E50]"
                  >
                    {allRoles.map((r) => (
                      <option key={r.key} value={r.key}>
                        {r.name} — {r.description}
                      </option>
                    ))}
                  </select>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Kata sandi acak yang aman akan digenerate otomatis dan akun langsung aktif.
                  </span>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsCreateAccountModalOpen(false)}
                    disabled={isPending}
                    className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateAccount}
                    disabled={isPending}
                    className="px-5 py-2 rounded-lg text-xs font-bold bg-[#102E50] text-white hover:bg-[#0c233d] transition-all shadow-xs disabled:opacity-50"
                  >
                    {isPending ? "Membuat Akun..." : "Buat Akun Sekarang"}
                  </button>
                </div>
              </div>
            ) : (
              /* Success & Credential Display */
              <div className="flex flex-col gap-4">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>Akun Berhasil Dibuat!</span>
                  </div>

                  <div className="bg-white p-3.5 rounded-lg border border-emerald-200/80 flex flex-col gap-2 font-mono text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold font-sans">
                        Email Login Kantor
                      </span>
                      <span className="font-bold text-slate-800">{createdCredentials.workEmail}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold font-sans">
                        Kata Sandi Sementara
                      </span>
                      <span className="font-bold text-[#102E50] text-sm bg-slate-100 px-2 py-0.5 rounded">
                        {createdCredentials.temporaryPassword}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold font-sans">
                        Peran Diberikan
                      </span>
                      <span className="font-sans font-bold text-slate-800">
                        {createdCredentials.roleName}
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-emerald-800 leading-relaxed font-sans">
                    {createdCredentials.emailSent
                      ? `Kredensial login telah dikirimkan ke email pribadi staf (${createdCredentials.personalEmail}).`
                      : "Salin kredensial di atas untuk diberikan kepada pegawai secara langsung."}
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleCopyCredentials}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all cursor-pointer shadow-xs"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? "Tersalin!" : "Salin Kredensial"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreateAccountModalOpen(false)}
                    className="px-5 py-2 rounded-lg bg-[#102E50] text-white hover:bg-[#0c233d] text-xs font-bold transition-all shadow-xs"
                  >
                    Selesai
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
