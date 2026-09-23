"use client";

import React, { useState, useTransition } from "react";
import {
  Users,
  UserCheck,
  ShieldAlert,
  Search,
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Lock,
  Power,
  RefreshCw,
  Building2,
  Briefcase,
  ExternalLink,
} from "lucide-react";
import {
  updateUserRolesSysAction,
  toggleUserStatusAction,
  resetUserPasswordAction,
} from "../../server/actions/user.actions";

interface SystemRole {
  id: string;
  key: string;
  name: string;
  description: string | null;
  isSystem: boolean;
}

interface UserItem {
  id: string;
  name: string | null;
  email: string;
  isActive: boolean;
  createdAt: Date | string;
  roles: {
    role: SystemRole;
  }[];
  employee: {
    id: string;
    employeeNo: string;
    fullName: string;
    status: string;
    currentDepartment: { id: string; name: string } | null;
    currentPosition: { id: string; title: string } | null;
  } | null;
}

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  superAdminCount: number;
  adminHrCount: number;
  adminItCount: number;
  managerCount: number;
  staffCount: number;
}

interface UserManagementTableProps {
  users: UserItem[];
  stats: UserStats;
  allRoles: SystemRole[];
  currentUserId: string;
  isSuperAdmin: boolean;
  isAdminIt: boolean;
}

export function UserManagementTable({
  users,
  stats,
  allRoles,
  currentUserId,
  isSuperAdmin,
  isAdminIt,
}: UserManagementTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("ALL");

  // Modal State: Kelola Peran
  const [roleModalUser, setRoleModalUser] = useState<UserItem | null>(null);
  const [selectedRoleKeys, setSelectedRoleKeys] = useState<string[]>([]);
  const [roleModalError, setRoleModalError] = useState<string | null>(null);
  const [roleModalSuccess, setRoleModalSuccess] = useState<string | null>(null);

  // Modal State: Reset Password
  const [resetModalUser, setResetModalUser] = useState<UserItem | null>(null);
  const [resetResult, setResetResult] = useState<{ email: string; temporaryPassword: string } | null>(null);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  // Modal State: Toggle Status
  const [statusConfirmUser, setStatusConfirmUser] = useState<UserItem | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  // Filter Pengguna di Client
  const filteredUsers = users.filter((u) => {
    const q = searchTerm.toLowerCase().trim();
    const matchSearch =
      q === "" ||
      u.name?.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.employee?.fullName.toLowerCase().includes(q) ||
      u.employee?.employeeNo.toLowerCase().includes(q);

    const matchRole =
      selectedRoleFilter === "ALL" ||
      u.roles.some((r) => r.role.key === selectedRoleFilter);

    const matchStatus =
      selectedStatusFilter === "ALL" ||
      (selectedStatusFilter === "ACTIVE" && u.isActive) ||
      (selectedStatusFilter === "INACTIVE" && !u.isActive);

    return matchSearch && matchRole && matchStatus;
  });

  // Handler Open Modal Role
  const handleOpenRoleModal = (user: UserItem) => {
    setRoleModalUser(user);
    setSelectedRoleKeys(user.roles.map((r) => r.role.key));
    setRoleModalError(null);
    setRoleModalSuccess(null);
  };

  // Toggle selection role
  const handleToggleRoleKey = (key: string) => {
    if (selectedRoleKeys.includes(key)) {
      if (selectedRoleKeys.length === 1) {
        setRoleModalError("Pengguna wajib memiliki minimal satu peran.");
        return;
      }
      setSelectedRoleKeys(selectedRoleKeys.filter((k) => k !== key));
    } else {
      setSelectedRoleKeys([...selectedRoleKeys, key]);
    }
    setRoleModalError(null);
  };

  // Submit Simpan Peran
  const handleSaveRoles = () => {
    if (!roleModalUser) return;
    setRoleModalError(null);
    setRoleModalSuccess(null);

    startTransition(async () => {
      const res = await updateUserRolesSysAction({
        userId: roleModalUser.id,
        roleKeys: selectedRoleKeys,
      });

      if (!res.ok) {
        setRoleModalError(res.error);
      } else {
        setRoleModalSuccess(res.message);
        setTimeout(() => {
          setRoleModalUser(null);
        }, 1200);
      }
    });
  };

  // Submit Reset Password
  const handleConfirmResetPassword = () => {
    if (!resetModalUser) return;
    setResetError(null);

    startTransition(async () => {
      const res = await resetUserPasswordAction({
        userId: resetModalUser.id,
      });

      if (!res.ok) {
        setResetError(res.error);
      } else if (res.credentials) {
        setResetResult(res.credentials);
      }
    });
  };

  // Copy password
  const handleCopyPassword = () => {
    if (resetResult?.temporaryPassword) {
      navigator.clipboard.writeText(resetResult.temporaryPassword);
      setCopiedPassword(true);
      setTimeout(() => setCopiedPassword(false), 2000);
    }
  };

  // Submit Toggle Status
  const handleConfirmToggleStatus = () => {
    if (!statusConfirmUser) return;
    setStatusError(null);

    startTransition(async () => {
      const res = await toggleUserStatusAction({
        userId: statusConfirmUser.id,
        isActive: !statusConfirmUser.isActive,
      });

      if (!res.ok) {
        setStatusError(res.error);
      } else {
        setStatusConfirmUser(null);
      }
    });
  };

  // Helper badge warna role
  const getRoleBadge = (roleKey: string, roleName: string) => {
    switch (roleKey) {
      case "super_admin":
        return (
          <span
            key={roleKey}
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200"
          >
            <ShieldCheck className="w-3 h-3 text-amber-600" />
            {roleName}
          </span>
        );
      case "admin_it":
        return (
          <span
            key={roleKey}
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-50 text-cyan-800 border border-cyan-200"
          >
            <Key className="w-3 h-3 text-cyan-600" />
            {roleName}
          </span>
        );
      case "admin_hr":
        return (
          <span
            key={roleKey}
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200"
          >
            <Users className="w-3 h-3 text-blue-600" />
            {roleName}
          </span>
        );
      case "manager":
        return (
          <span
            key={roleKey}
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200"
          >
            <Briefcase className="w-3 h-3 text-emerald-600" />
            {roleName}
          </span>
        );
      default:
        return (
          <span
            key={roleKey}
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200"
          >
            {roleName}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. KARTU STATISTIK PENGGUNA */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Users className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-medium">Total Akun</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.totalUsers}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">
            {stats.activeUsers} akun aktif
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 text-amber-700 mb-1">
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-medium">Super Admin</span>
          </div>
          <div className="text-2xl font-bold text-amber-900">{stats.superAdminCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Akses root sistem</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 text-cyan-700 mb-1">
            <Key className="w-4 h-4 text-cyan-600" />
            <span className="text-xs font-medium">Admin IT</span>
          </div>
          <div className="text-2xl font-bold text-cyan-900">{stats.adminItCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Pengelola sistem & user</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 text-blue-700 mb-1">
            <Users className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-medium">Admin HR</span>
          </div>
          <div className="text-2xl font-bold text-blue-900">{stats.adminHrCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Pengelola kepegawaian</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 text-emerald-700 mb-1">
            <Briefcase className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-medium">Manajer</span>
          </div>
          <div className="text-2xl font-bold text-emerald-900">{stats.managerCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Pimpinan divisi / approval</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 text-slate-600 mb-1">
            <UserCheck className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-medium">Staf Pegawai</span>
          </div>
          <div className="text-2xl font-bold text-slate-800">{stats.staffCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Akses mandiri (self-service)</div>
        </div>
      </div>

      {/* 2. FILTER & PENCARIAN */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama akun, surel login, nama pegawai, atau NIP..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50] transition-colors"
          />
        </div>

        <div className="flex items-center gap-3">
          {/* Filter Peran */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-500 whitespace-nowrap">
              Peran:
            </label>
            <select
              value={selectedRoleFilter}
              onChange={(e) => setSelectedRoleFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50]"
            >
              <option value="ALL">Semua Peran</option>
              {allRoles.map((r) => (
                <option key={r.key} value={r.key}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Status */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-500 whitespace-nowrap">
              Status:
            </label>
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50]"
            >
              <option value="ALL">Semua Status</option>
              <option value="ACTIVE">Aktif</option>
              <option value="INACTIVE">Nonaktif</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. TABEL DATA PENGGUNA */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Pengguna Akun</th>
                <th className="py-3 px-4">Profil Pegawai PSPK</th>
                <th className="py-3 px-4">Peran (RBAC)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Aksi Manajemen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <Users className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-1" />
                    Tidak ada akun pengguna yang sesuai dengan kriteria filter.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isCurrentActor = u.id === currentUserId;
                  const isTargetSuperAdmin = u.roles.some((r) => r.role.key === "super_admin");
                  const canManageThisUser =
                    isSuperAdmin || (isAdminIt && !isTargetSuperAdmin);

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-50/60 transition-colors group"
                    >
                      {/* Kolom Pengguna */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#102E50] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                            {(u.name || u.email).substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-900">
                                {u.name || "Tanpa Nama"}
                              </span>
                              {isCurrentActor && (
                                <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold px-1.5 py-0.2 rounded">
                                  Anda
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 font-mono">
                              {u.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Kolom Pegawai Terhubung */}
                      <td className="py-3.5 px-4">
                        {u.employee ? (
                          <div>
                            <div className="font-medium text-slate-800 text-xs">
                              {u.employee.fullName}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                              <span className="font-mono bg-slate-100 px-1 py-0.2 rounded text-[10px]">
                                {u.employee.employeeNo}
                              </span>
                              {u.employee.currentDepartment && (
                                <span className="flex items-center gap-1">
                                  <Building2 className="w-3 h-3 text-slate-400" />
                                  {u.employee.currentDepartment.name}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">
                            Akun Sistem (Tanpa Data Pegawai)
                          </span>
                        )}
                      </td>

                      {/* Kolom Peran */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1.5 max-w-xs">
                          {u.roles.map((r) =>
                            getRoleBadge(r.role.key, r.role.name),
                          )}
                        </div>
                      </td>

                      {/* Kolom Status */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          disabled={!canManageThisUser || isCurrentActor}
                          onClick={() => setStatusConfirmUser(u)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                            u.isActive
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                              : "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
                          } ${
                            !canManageThisUser || isCurrentActor
                              ? "opacity-80 cursor-not-allowed"
                              : "cursor-pointer"
                          }`}
                          title={
                            isCurrentActor
                              ? "Anda tidak dapat menonaktifkan akun sendiri"
                              : !canManageThisUser
                              ? "Hanya Super Admin yang dapat mengubah status akun ini"
                              : "Klik untuk mengubah status aktif"
                          }
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              u.isActive ? "bg-emerald-500" : "bg-rose-500"
                            }`}
                          />
                          {u.isActive ? "Aktif" : "Nonaktif"}
                        </button>
                      </td>

                      {/* Kolom Aksi */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Kelola Peran */}
                          <button
                            type="button"
                            disabled={!canManageThisUser}
                            onClick={() => handleOpenRoleModal(u)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                              canManageThisUser
                                ? "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-[#102E50] hover:border-[#102E50]/30 shadow-2xs"
                                : "bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed"
                            }`}
                            title={
                              canManageThisUser
                                ? "Ubah penugasan peran sistem"
                                : "Wewenang tidak mencukupi"
                            }
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-[#F2AF3E]" />
                            <span>Peran</span>
                          </button>

                          {/* Reset Kata Sandi */}
                          <button
                            type="button"
                            disabled={!canManageThisUser}
                            onClick={() => {
                              setResetModalUser(u);
                              setResetResult(null);
                              setResetError(null);
                            }}
                            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                              canManageThisUser
                                ? "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-[#102E50] hover:border-[#102E50]/30 shadow-2xs"
                                : "bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed"
                            }`}
                            title={
                              canManageThisUser
                                ? "Atur ulang kata sandi pengguna"
                                : "Wewenang tidak mencukupi"
                            }
                          >
                            <Lock className="w-3.5 h-3.5 text-slate-500" />
                            <span>Reset Sandi</span>
                          </button>

                          {/* Tautan ke Detail Pegawai di HRIS jika terhubung */}
                          {u.employee && (
                            <a
                              href={`http://localhost:3001/karyawan/${u.employee.id}?tab=akun`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-[#102E50] hover:bg-slate-100 transition-colors"
                              title="Buka profil pegawai di HRIS"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. MODAL: KELOLA PERAN PENGGUNA (RBAC) */}
      {/* ========================================================================= */}
      {roleModalUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Kelola Peran Pengguna (RBAC)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Atur hak akses otorisasi sistem untuk akun ini
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRoleModalUser(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Info Akun Sasaran */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 mb-4 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Nama Pengguna:</span>
                <span className="font-semibold text-slate-800">
                  {roleModalUser.name || "Tanpa Nama"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Surel Login:</span>
                <span className="font-mono text-slate-800 font-medium">
                  {roleModalUser.email}
                </span>
              </div>
              {roleModalUser.employee && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Pegawai PSPK:</span>
                  <span className="text-slate-800">
                    {roleModalUser.employee.fullName} ({roleModalUser.employee.employeeNo})
                  </span>
                </div>
              )}
            </div>

            {/* Pesan Error / Sukses */}
            {roleModalError && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <span>{roleModalError}</span>
              </div>
            )}

            {roleModalSuccess && (
              <div className="p-3 mb-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                <span>{roleModalSuccess}</span>
              </div>
            )}

            {/* Daftar Pilihan Peran */}
            <div className="space-y-2.5 mb-6 max-h-72 overflow-y-auto pr-1">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                Pilih Peran Sistem (Dapat Multi-Role):
              </label>

              {allRoles.map((r) => {
                const isChecked = selectedRoleKeys.includes(r.key);
                const isSuperAdminRole = r.key === "super_admin";
                const isRestrictedForAdminIt = !isSuperAdmin && isSuperAdminRole;

                return (
                  <label
                    key={r.id}
                    className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                      isRestrictedForAdminIt
                        ? "bg-slate-100/60 border-slate-200 opacity-60 cursor-not-allowed"
                        : isChecked
                        ? "bg-amber-50/40 border-amber-300 ring-1 ring-amber-300/40 cursor-pointer"
                        : "bg-white border-slate-200 hover:border-slate-300 cursor-pointer"
                    }`}
                  >
                    <input
                      type="checkbox"
                      disabled={isRestrictedForAdminIt}
                      checked={isChecked}
                      onChange={() => handleToggleRoleKey(r.key)}
                      className="mt-0.5 w-4 h-4 rounded text-[#102E50] border-slate-300 focus:ring-[#102E50]"
                    />
                    <div className="flex-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">{r.name}</span>
                        <span className="font-mono text-[10px] text-slate-400">
                          {r.key}
                        </span>
                      </div>
                      <p className="text-slate-500 mt-0.5 text-[11px] leading-relaxed">
                        {r.description || "Peran fungsional operasional sistem PSPK."}
                      </p>
                      {isRestrictedForAdminIt && (
                        <p className="text-[10px] text-amber-700 font-medium mt-1">
                          🔒 Hanya Super Admin yang berhak menugaskan peran ini.
                        </p>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>

            {/* Tombol Aksi */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                disabled={isPending}
                onClick={() => setRoleModalUser(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isPending || selectedRoleKeys.length === 0}
                onClick={handleSaveRoles}
                className="px-5 py-2 text-xs font-semibold text-white bg-[#102E50] hover:bg-[#1a4473] disabled:opacity-50 rounded-lg transition-all shadow-xs flex items-center gap-2"
              >
                {isPending && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Simpan Peran</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MODAL: RESET KATA SANDI PENGGUNA */}
      {/* ========================================================================= */}
      {resetModalUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 flex items-center justify-center">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Reset Kata Sandi
                  </h3>
                  <p className="text-xs text-slate-500">
                    Hasilkan kata sandi sementara baru
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setResetModalUser(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {resetError && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <span>{resetError}</span>
              </div>
            )}

            {!resetResult ? (
              <div>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Apakah Anda yakin ingin mengatur ulang kata sandi untuk akun{" "}
                  <strong className="text-slate-900">{resetModalUser.email}</strong>?
                </p>
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl mb-6 text-[11px] text-amber-800 space-y-1">
                  <div className="font-semibold flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                    Konsekuensi Tindakan:
                  </div>
                  <ul className="list-disc pl-4 space-y-0.5 text-amber-700">
                    <li>Semua sesi login aktif pengguna ini akan otomatis terputus.</li>
                    <li>Sistem akan men-generate kata sandi sementara acak baru.</li>
                    <li>
                      Tindakan ini akan dicatat ke dalam buku besar Audit Log.
                    </li>
                  </ul>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => setResetModalUser(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={handleConfirmResetPassword}
                    className="px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-lg transition-all shadow-xs flex items-center gap-2"
                  >
                    {isPending && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>Lanjutkan Reset Sandi</span>
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="p-3 mb-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                  <span>
                    Kata sandi baru berhasil digenerate! Harap salin dan serahkan
                    kepada pengguna dengan aman.
                  </span>
                </div>

                <div className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs space-y-3 mb-6">
                  <div>
                    <span className="text-slate-400 text-[10px] block uppercase tracking-wider">
                      Surel Akun:
                    </span>
                    <span className="text-emerald-400 font-bold">{resetResult.email}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block uppercase tracking-wider">
                      Kata Sandi Sementara:
                    </span>
                    <div className="flex items-center justify-between mt-1 bg-slate-800/80 px-3 py-2 rounded-lg border border-slate-700">
                      <span className="text-amber-300 font-bold text-sm tracking-wider">
                        {resetResult.temporaryPassword}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyPassword}
                        className="inline-flex items-center gap-1 text-[11px] px-2 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded font-sans transition-colors"
                      >
                        {copiedPassword ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Tersalin!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Salin</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setResetModalUser(null);
                      setResetResult(null);
                    }}
                    className="px-5 py-2 text-xs font-semibold text-white bg-[#102E50] hover:bg-[#1a4473] rounded-lg transition-colors shadow-xs"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. MODAL: KONFIRMASI STATUS PENGGUNA (AKTIF / NONAKTIF) */}
      {/* ========================================================================= */}
      {statusConfirmUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 mb-4">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  statusConfirmUser.isActive
                    ? "bg-rose-50 text-rose-700 border border-rose-200"
                    : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                }`}
              >
                <Power className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  {statusConfirmUser.isActive
                    ? "Nonaktifkan Akun Pengguna?"
                    : "Aktifkan Akun Pengguna?"}
                </h3>
                <p className="text-xs text-slate-500">Konfirmasi perubahan status akses login</p>
              </div>
            </div>

            {statusError && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <span>{statusError}</span>
              </div>
            )}

            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              Apakah Anda yakin ingin{" "}
              <strong>
                {statusConfirmUser.isActive ? "menonaktifkan" : "mengaktifkan"}
              </strong>{" "}
              akses login untuk pengguna{" "}
              <strong className="text-slate-900">
                {statusConfirmUser.name || statusConfirmUser.email}
              </strong>
              ?{" "}
              {statusConfirmUser.isActive
                ? "Pengguna tidak akan dapat masuk ke aplikasi HRIS maupun System Management setelah dinonaktifkan."
                : "Pengguna akan dapat kembali masuk dan menggunakan hak akses sesuai perannya."}
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                disabled={isPending}
                onClick={() => setStatusConfirmUser(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleConfirmToggleStatus}
                className={`px-5 py-2 text-xs font-semibold text-white rounded-lg transition-all shadow-xs flex items-center gap-2 ${
                  statusConfirmUser.isActive
                    ? "bg-rose-600 hover:bg-rose-700"
                    : "bg-emerald-600 hover:bg-emerald-700"
                } disabled:opacity-50`}
              >
                {isPending && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>
                  {statusConfirmUser.isActive ? "Ya, Nonaktifkan" : "Ya, Aktifkan"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
