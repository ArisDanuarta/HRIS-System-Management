"use client";

import React, { useState, useTransition } from "react";
import {
  Briefcase,
  Plus,
  Search,
  Edit2,
  Trash2,
  Users,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  HelpCircle,
  ShieldCheck,
} from "lucide-react";
import { formatRupiah } from "@pspk/shared";
import {
  createEmploymentTypeAction,
  updateEmploymentTypeAction,
  deleteEmploymentTypeAction,
  toggleEmploymentTypeStatusAction,
} from "@/server/actions/employment-type.actions";
import { EmploymentTypeDetail } from "@/server/queries/employment-type.queries";

interface EmploymentTypeManagementProps {
  initialTypes: EmploymentTypeDetail[];
}

export function EmploymentTypeManagement({ initialTypes }: EmploymentTypeManagementProps) {
  const [types, setTypes] = useState<EmploymentTypeDetail[]>(initialTypes);
  const [searchTerm, setSearchTerm] = useState("");
  const [isPending, startTransition] = useTransition();

  // Feedback notifications
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Modal State
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    mode: "create" | "edit";
    id?: string;
    code: string;
    name: string;
    category: "PERMANENT" | "FIXED_TERM" | "PART_TIME_PROJECT";
    wageType: "MONTHLY" | "HOURLY";
    defaultHourlyRate: string;
    description: string;
    isActive: boolean;
  }>({
    isOpen: false,
    mode: "create",
    code: "",
    name: "",
    category: "FIXED_TERM",
    wageType: "MONTHLY",
    defaultHourlyRate: "30000",
    description: "",
    isActive: true,
  });

  const filteredTypes = types.filter((t) => {
    const q = searchTerm.toLowerCase().trim();
    return (
      q === "" ||
      t.name.toLowerCase().includes(q) ||
      t.code.toLowerCase().includes(q) ||
      (t.description && t.description.toLowerCase().includes(q))
    );
  });

  const handleOpenCreateModal = () => {
    setModalState({
      isOpen: true,
      mode: "create",
      code: "",
      name: "",
      category: "FIXED_TERM",
      wageType: "MONTHLY",
      defaultHourlyRate: "30000",
      description: "",
      isActive: true,
    });
  };

  const handleOpenEditModal = (t: EmploymentTypeDetail) => {
    setModalState({
      isOpen: true,
      mode: "edit",
      id: t.id,
      code: t.code,
      name: t.name,
      category: t.category,
      wageType: t.wageType,
      defaultHourlyRate: t.defaultHourlyRate ? String(t.defaultHourlyRate) : "30000",
      description: t.description || "",
      isActive: t.isActive,
    });
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);

    const parsedRate =
      modalState.wageType === "HOURLY"
        ? Math.max(0, parseFloat(modalState.defaultHourlyRate) || 0)
        : null;

    startTransition(async () => {
      if (modalState.mode === "create") {
        const res = await createEmploymentTypeAction({
          code: modalState.code,
          name: modalState.name,
          category: modalState.category,
          wageType: modalState.wageType,
          defaultHourlyRate: parsedRate,
          description: modalState.description,
          isActive: modalState.isActive,
        });

        if (!res.ok) {
          setAlert({ type: "error", message: res.error });
        } else {
          setAlert({ type: "success", message: res.message });
          setTypes((prev) => [
            ...prev,
            {
              id: res.data.id,
              code: res.data.code,
              name: res.data.name,
              category: res.data.category,
              wageType: res.data.wageType,
              defaultHourlyRate: res.data.defaultHourlyRate ? Number(res.data.defaultHourlyRate) : null,
              description: res.data.description,
              isActive: res.data.isActive,
              createdAt: res.data.createdAt.toISOString(),
              updatedAt: res.data.updatedAt.toISOString(),
              _count: { contracts: 0 },
            },
          ]);
          setModalState((prev) => ({ ...prev, isOpen: false }));
        }
      } else if (modalState.mode === "edit" && modalState.id) {
        const res = await updateEmploymentTypeAction({
          id: modalState.id,
          name: modalState.name,
          category: modalState.category,
          wageType: modalState.wageType,
          defaultHourlyRate: parsedRate,
          description: modalState.description,
          isActive: modalState.isActive,
        });

        if (!res.ok) {
          setAlert({ type: "error", message: res.error });
        } else {
          setAlert({ type: "success", message: res.message });
          setTypes((prev) =>
            prev.map((item) =>
              item.id === modalState.id
                ? {
                    ...item,
                    name: res.data.name,
                    category: res.data.category,
                    wageType: res.data.wageType,
                    defaultHourlyRate: res.data.defaultHourlyRate ? Number(res.data.defaultHourlyRate) : null,
                    description: res.data.description,
                    isActive: res.data.isActive,
                  }
                : item,
            ),
          );
          setModalState((prev) => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const handleToggleStatus = (t: EmploymentTypeDetail) => {
    const nextStatus = !t.isActive;
    setAlert(null);

    startTransition(async () => {
      const res = await toggleEmploymentTypeStatusAction(t.id, nextStatus);
      if (!res.ok) {
        setAlert({ type: "error", message: res.error });
      } else {
        setAlert({ type: "success", message: res.message });
        setTypes((prev) =>
          prev.map((item) => (item.id === t.id ? { ...item, isActive: nextStatus } : item)),
        );
      }
    });
  };

  const handleDelete = (t: EmploymentTypeDetail) => {
    const confirmText =
      t._count.contracts > 0
        ? `Tipe ikatan kerja '${t.name}' sudah digunakan oleh ${t._count.contracts} kontrak pegawai. Tipe ini akan dinonaktifkan (arsip) dan tidak dihapus permanen. Lanjutkan?`
        : `Hapus tipe ikatan kerja '${t.name}' secara permanen?`;

    if (!window.confirm(confirmText)) return;
    setAlert(null);

    startTransition(async () => {
      const res = await deleteEmploymentTypeAction(t.id);
      if (!res.ok) {
        setAlert({ type: "error", message: res.error });
      } else {
        setAlert({ type: "success", message: res.message });
        if (res.deactivated) {
          setTypes((prev) =>
            prev.map((item) => (item.id === t.id ? { ...item, isActive: false } : item)),
          );
        } else {
          setTypes((prev) => prev.filter((item) => item.id !== t.id));
        }
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Alert Notifikasi */}
      {alert && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs animate-in fade-in duration-200 ${
            alert.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {alert.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            )}
            <span>{alert.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setAlert(null)}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Kontrol Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari tipe ikatan kerja atau kode..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50]"
          />
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#102E50] text-white hover:bg-[#102E50]/90 rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4 text-[#F2AF3E]" />
          <span>Tambah Tipe Ikatan Kerja</span>
        </button>
      </div>

      {/* Tabel Master Tipe Ikatan Kerja */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Nama Ikatan Kerja</th>
                <th className="py-3 px-4">Kategori Sistem</th>
                <th className="py-3 px-4">Skema Upah</th>
                <th className="py-3 px-4">Tarif Acuan / Jam</th>
                <th className="py-3 px-4 text-center">Pegawai Aktif</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTypes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    Tidak ada tipe ikatan kerja yang sesuai dengan pencarian.
                  </td>
                </tr>
              ) : (
                filteredTypes.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/60 transition-colors group">
                    {/* Nama & Kode */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{t.name}</span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                        Kode: {t.code}
                      </div>
                      {t.description && (
                        <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1 max-w-sm">
                          {t.description}
                        </div>
                      )}
                    </td>

                    {/* Kategori Sistem */}
                    <td className="py-3 px-4">
                      {t.category === "PERMANENT" && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          Pegawai Tetap
                        </span>
                      )}
                      {t.category === "FIXED_TERM" && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                          PKWT Berjangka
                        </span>
                      )}
                      {t.category === "PART_TIME_PROJECT" && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-purple-800 border border-purple-200">
                          Paruh Waktu / Ad-Hoc
                        </span>
                      )}
                    </td>

                    {/* Skema Upah */}
                    <td className="py-3 px-4">
                      {t.wageType === "HOURLY" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-300">
                          <Clock className="w-3 h-3 text-amber-600" />
                          Per Jam (Timesheet)
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          Gaji Bulanan
                        </span>
                      )}
                    </td>

                    {/* Tarif Acuan */}
                    <td className="py-3 px-4 font-mono text-xs text-slate-700">
                      {t.wageType === "HOURLY" && t.defaultHourlyRate
                        ? `${formatRupiah(t.defaultHourlyRate)} / jam`
                        : "-"}
                    </td>

                    {/* Pegawai Aktif */}
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-full font-mono text-[11px] font-semibold">
                        <Users className="w-3 h-3 text-slate-400" />
                        {t._count.contracts}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(t)}
                        disabled={isPending}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
                          t.isActive
                            ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                        }`}
                      >
                        {t.isActive ? "Aktif" : "Nonaktif"}
                      </button>
                    </td>

                    {/* Aksi */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(t)}
                          className="p-1.5 text-slate-500 hover:text-[#102E50] hover:bg-slate-100 rounded-lg transition-colors"
                          title="Ubah Ikatan Kerja"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(t)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Hapus / Nonaktifkan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah / Edit */}
      {modalState.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#102E50]/10 text-[#102E50] flex items-center justify-center font-bold">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm leading-tight">
                    {modalState.mode === "create"
                      ? "Tambah Tipe Ikatan Kerja Baru"
                      : "Ubah Tipe Ikatan Kerja"}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Konfigurasi skema perjanjian kerja dan basis kompensasi
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalState((prev) => ({ ...prev, isOpen: false }))}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-3.5">
              {/* Kode */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kode Ikatan Kerja <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  disabled={modalState.mode === "edit"}
                  value={modalState.code}
                  onChange={(e) =>
                    setModalState((prev) => ({
                      ...prev,
                      code: e.target.value.toUpperCase().replace(/\s+/g, "_"),
                    }))
                  }
                  placeholder="Contoh: PKWT_FREELANCE"
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50] disabled:bg-slate-100 disabled:text-slate-500"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Identifikasi unik dalam sistem (huruf kapital & underscore)
                </span>
              </div>

              {/* Nama */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Ikatan Kerja <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={modalState.name}
                  onChange={(e) => setModalState((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Contoh: PKWT Freelance / Peneliti Lepas"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50]"
                />
              </div>

              {/* Kategori Sistem & Skema Upah */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kategori Laporan <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={modalState.category}
                    onChange={(e) =>
                      setModalState((prev) => ({
                        ...prev,
                        category: e.target.value as "PERMANENT" | "FIXED_TERM" | "PART_TIME_PROJECT",
                      }))
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="PERMANENT">Pegawai Tetap</option>
                    <option value="FIXED_TERM">PKWT Berjangka</option>
                    <option value="PART_TIME_PROJECT">Paruh Waktu</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Skema Upah <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={modalState.wageType}
                    onChange={(e) =>
                      setModalState((prev) => ({
                        ...prev,
                        wageType: e.target.value as "MONTHLY" | "HOURLY",
                      }))
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white font-medium"
                  >
                    <option value="MONTHLY">Gaji Bulanan</option>
                    <option value="HOURLY">Per Jam (Timesheet)</option>
                  </select>
                </div>
              </div>

              {/* Tarif Acuan Per Jam (Muncul jika HOURLY) */}
              {modalState.wageType === "HOURLY" && (
                <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 text-xs animate-in fade-in duration-150">
                  <label className="block text-xs font-semibold text-amber-950 mb-1">
                    Tarif Acuan Per Jam Bawaan (Rp) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min="1000"
                      step="1000"
                      value={modalState.defaultHourlyRate}
                      onChange={(e) =>
                        setModalState((prev) => ({ ...prev, defaultHourlyRate: e.target.value }))
                      }
                      placeholder="30000"
                      className="w-full pl-3 pr-12 py-2 text-xs font-mono border border-amber-300 bg-white rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-amber-700 font-medium">
                      / jam
                    </span>
                  </div>
                  <span className="text-[10px] text-amber-800/90 mt-1 block">
                    Tarif default yang otomatis terisi saat Admin HR mendaftarkan pegawai dengan ikatan kerja ini.
                  </span>
                </div>
              )}

              {/* Deskripsi */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Deskripsi / Keterangan
                </label>
                <textarea
                  rows={2}
                  value={modalState.description}
                  onChange={(e) =>
                    setModalState((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Keterangan peruntukan ikatan kerja..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#102E50]/20 focus:border-[#102E50]"
                />
              </div>

              {/* Status Aktif */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  id="isActiveCheck"
                  type="checkbox"
                  checked={modalState.isActive}
                  onChange={(e) =>
                    setModalState((prev) => ({ ...prev, isActive: e.target.checked }))
                  }
                  className="rounded text-[#102E50] focus:ring-[#102E50] h-4 w-4"
                />
                <label htmlFor="isActiveCheck" className="text-xs text-slate-700 font-medium">
                  Tipe ikatan kerja aktif (dapat dipilih pada formulir pegawai baru)
                </label>
              </div>

              {/* Tombol Simpan */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalState((prev) => ({ ...prev, isOpen: false }))}
                  disabled={isPending}
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-[#102E50] text-white hover:bg-[#102E50]/90 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Simpan Ikatan Kerja</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
