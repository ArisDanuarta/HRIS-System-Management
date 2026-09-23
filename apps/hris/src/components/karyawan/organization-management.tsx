"use client";

import React, { useState } from "react";
import {
  Building2,
  Briefcase,
  Plus,
  Search,
  Edit2,
  Trash2,
  Users,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  ChevronRight,
} from "lucide-react";
import {
  createDepartmentAction,
  updateDepartmentAction,
  deleteDepartmentAction,
  createPositionAction,
  updatePositionAction,
  deletePositionAction,
} from "@/server/actions/organization.actions";

export interface DepartmentItem {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: Date;
  _count: {
    employees: number;
    positions: number;
  };
  positions: Array<{
    id: string;
    title: string;
    departmentId: string;
    createdAt: Date;
    _count: {
      employees: number;
    };
  }>;
}

interface OrganizationManagementProps {
  initialDepartments: DepartmentItem[];
}

export function OrganizationManagement({
  initialDepartments,
}: OrganizationManagementProps) {
  const [departments, setDepartments] = useState<DepartmentItem[]>(initialDepartments);
  const [selectedDeptId, setSelectedDeptId] = useState<string>(
    initialDepartments[0]?.id || "",
  );
  const [deptSearch, setDeptSearch] = useState("");
  const [posSearch, setPosSearch] = useState("");

  // Modal States
  const [deptModal, setDeptModal] = useState<{
    isOpen: boolean;
    mode: "create" | "edit";
    id?: string;
    name: string;
  }>({ isOpen: false, mode: "create", name: "" });

  const [posModal, setPosModal] = useState<{
    isOpen: boolean;
    mode: "create" | "edit";
    id?: string;
    title: string;
    departmentId: string;
  }>({ isOpen: false, mode: "create", title: "", departmentId: "" });

  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    type: "department" | "position";
    id: string;
    name: string;
  }>({ isOpen: false, type: "department", id: "", name: "" });

  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const selectedDepartment = departments.find((d) => d.id === selectedDeptId);

  // Filtered lists
  const filteredDepartments = departments.filter((d) =>
    d.name.toLowerCase().includes(deptSearch.toLowerCase()),
  );

  const filteredPositions = (selectedDepartment?.positions || []).filter((p) =>
    p.title.toLowerCase().includes(posSearch.toLowerCase()),
  );

  // Clear feedback after 4 seconds
  const showFeedback = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback(null);
    }, 4500);
  };

  // --- Handlers: Divisi ---
  const handleOpenCreateDept = () => {
    setDeptModal({ isOpen: true, mode: "create", name: "" });
  };

  const handleOpenEditDept = (dept: DepartmentItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeptModal({ isOpen: true, mode: "edit", id: dept.id, name: dept.name });
  };

  const handleSaveDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptModal.name.trim()) return;

    setIsLoading(true);
    setFeedback(null);

    if (deptModal.mode === "create") {
      const res = await createDepartmentAction({ name: deptModal.name.trim() });
      setIsLoading(false);
      if (res.ok && res.data) {
        const newDept: DepartmentItem = {
          ...res.data,
          createdAt: new Date(),
          _count: { employees: 0, positions: 0 },
          positions: [],
        };
        setDepartments((prev) => [...prev, newDept].sort((a, b) => a.name.localeCompare(b.name)));
        setSelectedDeptId(newDept.id);
        setDeptModal({ isOpen: false, mode: "create", name: "" });
        showFeedback("success", `Divisi "${newDept.name}" berhasil ditambahkan.`);
      } else {
        showFeedback("error", res.error || "Gagal menambahkan divisi.");
      }
    } else if (deptModal.mode === "edit" && deptModal.id) {
      const res = await updateDepartmentAction({
        id: deptModal.id,
        name: deptModal.name.trim(),
      });
      setIsLoading(false);
      if (res.ok && res.data) {
        setDepartments((prev) =>
          prev.map((d) => (d.id === deptModal.id ? { ...d, name: res.data.name } : d)),
        );
        setDeptModal({ isOpen: false, mode: "edit", name: "" });
        showFeedback("success", `Divisi berhasil diubah menjadi "${res.data.name}".`);
      } else {
        showFeedback("error", res.error || "Gagal mengubah divisi.");
      }
    }
  };

  // --- Handlers: Jabatan ---
  const handleOpenCreatePos = () => {
    if (!selectedDeptId) return;
    setPosModal({
      isOpen: true,
      mode: "create",
      title: "",
      departmentId: selectedDeptId,
    });
  };

  const handleOpenEditPos = (pos: { id: string; title: string; departmentId: string }) => {
    setPosModal({
      isOpen: true,
      mode: "edit",
      id: pos.id,
      title: pos.title,
      departmentId: pos.departmentId,
    });
  };

  const handleSavePos = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!posModal.title.trim() || !posModal.departmentId) return;

    setIsLoading(true);
    setFeedback(null);

    if (posModal.mode === "create") {
      const res = await createPositionAction({
        title: posModal.title.trim(),
        departmentId: posModal.departmentId,
      });
      setIsLoading(false);
      if (res.ok && res.data) {
        const newPos = {
          id: res.data.id,
          title: res.data.title,
          departmentId: res.data.departmentId,
          createdAt: new Date(),
          _count: { employees: 0 },
        };
        setDepartments((prev) =>
          prev.map((d) => {
            if (d.id === posModal.departmentId) {
              const updatedPositions = [...d.positions, newPos].sort((a, b) =>
                a.title.localeCompare(b.title),
              );
              return {
                ...d,
                _count: { ...d._count, positions: d._count.positions + 1 },
                positions: updatedPositions,
              };
            }
            return d;
          }),
        );
        setPosModal({ isOpen: false, mode: "create", title: "", departmentId: "" });
        showFeedback("success", `Jabatan "${newPos.title}" berhasil ditambahkan.`);
      } else {
        showFeedback("error", res.error || "Gagal menambahkan jabatan.");
      }
    } else if (posModal.mode === "edit" && posModal.id) {
      const res = await updatePositionAction({
        id: posModal.id,
        title: posModal.title.trim(),
        departmentId: posModal.departmentId,
      });
      setIsLoading(false);
      if (res.ok && res.data) {
        setDepartments((prev) =>
          prev.map((d) => {
            if (d.id === posModal.departmentId) {
              return {
                ...d,
                positions: d.positions.map((p) =>
                  p.id === posModal.id ? { ...p, title: res.data.title } : p,
                ),
              };
            }
            return d;
          }),
        );
        setPosModal({ isOpen: false, mode: "edit", title: "", departmentId: "" });
        showFeedback("success", `Jabatan berhasil diperbarui.`);
      } else {
        showFeedback("error", res.error || "Gagal memperbarui jabatan.");
      }
    }
  };

  // --- Handlers: Delete ---
  const handleExecuteDelete = async () => {
    if (!deleteConfirm.id) return;
    setIsLoading(true);
    setFeedback(null);

    if (deleteConfirm.type === "department") {
      const res = await deleteDepartmentAction(deleteConfirm.id);
      setIsLoading(false);
      if (res.ok) {
        const remaining = departments.filter((d) => d.id !== deleteConfirm.id);
        setDepartments(remaining);
        if (selectedDeptId === deleteConfirm.id) {
          setSelectedDeptId(remaining[0]?.id || "");
        }
        setDeleteConfirm({ isOpen: false, type: "department", id: "", name: "" });
        showFeedback("success", `Divisi "${deleteConfirm.name}" berhasil dihapus.`);
      } else {
        setDeleteConfirm((prev) => ({ ...prev, isOpen: false }));
        showFeedback("error", res.error || "Gagal menghapus divisi.");
      }
    } else if (deleteConfirm.type === "position") {
      const res = await deletePositionAction(deleteConfirm.id);
      setIsLoading(false);
      if (res.ok) {
        setDepartments((prev) =>
          prev.map((d) => {
            if (d.id === selectedDeptId) {
              return {
                ...d,
                _count: { ...d._count, positions: Math.max(0, d._count.positions - 1) },
                positions: d.positions.filter((p) => p.id !== deleteConfirm.id),
              };
            }
            return d;
          }),
        );
        setDeleteConfirm({ isOpen: false, type: "position", id: "", name: "" });
        showFeedback("success", `Jabatan "${deleteConfirm.name}" berhasil dihapus.`);
      } else {
        setDeleteConfirm((prev) => ({ ...prev, isOpen: false }));
        showFeedback("error", res.error || "Gagal menghapus jabatan.");
      }
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Toast Alert Feedback */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200 shadow-sm ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-red-50 border-red-200 text-red-900"
          }`}
        >
          <div className="flex items-center gap-2.5 text-xs font-semibold">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="p-1 hover:bg-black/5 rounded-md cursor-pointer transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* KOLOM KIRI: DAFTAR DIVISI (4 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200/80 shadow-xs flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-2 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#102E50]" />
              <h2 className="font-bold text-sm text-[#102E50] font-heading">
                Divisi & Departemen ({departments.length})
              </h2>
            </div>
            <button
              onClick={handleOpenCreateDept}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[#102E50] text-white hover:bg-[#0c233d] transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Divisi</span>
            </button>
          </div>

          {/* Search Divisi */}
          <div className="p-3 border-b border-slate-100 bg-white">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={deptSearch}
                onChange={(e) => setDeptSearch(e.target.value)}
                placeholder="Cari nama divisi..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50/70 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#102E50]"
              />
            </div>
          </div>

          {/* List Divisi */}
          <div className="divide-y divide-slate-100 max-h-[580px] overflow-y-auto">
            {filteredDepartments.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 italic">
                {deptSearch ? "Tidak ada divisi yang cocok." : "Belum ada divisi yang dibuat."}
              </div>
            ) : (
              filteredDepartments.map((dept) => {
                const isSelected = dept.id === selectedDeptId;
                return (
                  <div
                    key={dept.id}
                    onClick={() => setSelectedDeptId(dept.id)}
                    className={`p-3.5 flex items-center justify-between gap-3 transition-colors cursor-pointer group ${
                      isSelected
                        ? "bg-blue-50/70 border-l-4 border-l-[#102E50] text-slate-900"
                        : "hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="font-semibold text-xs truncate group-hover:text-[#102E50]">
                        {dept.name}
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                          <Briefcase className="w-3 h-3 text-slate-400" />
                          {dept._count.positions} Formasi
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                          <Users className="w-3 h-3 text-slate-400" />
                          {dept._count.employees} Pegawai
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => handleOpenEditDept(dept, e)}
                        className="p-1.5 text-slate-400 hover:text-[#102E50] hover:bg-white rounded-md transition-colors"
                        title="Ubah Nama Divisi"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirm({
                            isOpen: true,
                            type: "department",
                            id: dept.id,
                            name: dept.name,
                          });
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-white rounded-md transition-colors"
                        title="Hapus Divisi"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <ChevronRight
                        className={`w-4 h-4 ml-1 transition-transform ${
                          isSelected ? "text-[#102E50] translate-x-0.5" : "text-slate-300"
                        }`}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* KOLOM KANAN: DAFTAR JABATAN PADA DIVISI TERPILIH (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200/80 shadow-xs flex flex-col overflow-hidden">
          {selectedDepartment ? (
            <>
              {/* Header Kolom Kanan */}
              <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-[#102E50]" />
                    <h2 className="font-bold text-sm text-[#102E50] font-heading truncate">
                      {selectedDepartment.name}
                    </h2>
                  </div>
                  <span className="text-[11px] text-slate-500 mt-0.5">
                    Daftar formasi posisi & jabatan riset dalam divisi ini
                  </span>
                </div>

                <button
                  onClick={handleOpenCreatePos}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#102E50] text-white hover:bg-[#0c233d] transition-all cursor-pointer shadow-xs active:scale-95 shrink-0 self-start sm:self-auto"
                >
                  <Plus className="w-3.5 h-3.5 text-[#F2AF3E]" />
                  <span>Tambah Jabatan</span>
                </button>
              </div>

              {/* Search Jabatan */}
              <div className="p-3 border-b border-slate-100 bg-white">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={posSearch}
                    onChange={(e) => setPosSearch(e.target.value)}
                    placeholder="Cari formasi jabatan..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50/70 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#102E50]"
                  />
                </div>
              </div>

              {/* List Jabatan */}
              <div className="divide-y divide-slate-100 min-h-[300px] max-h-[580px] overflow-y-auto">
                {filteredPositions.length === 0 ? (
                  <div className="py-16 text-center text-xs text-slate-400 italic flex flex-col items-center gap-2">
                    <Briefcase className="w-8 h-8 text-slate-300" />
                    <span>
                      {posSearch
                        ? "Tidak ada jabatan yang cocok dengan pencarian."
                        : "Belum ada jabatan pada divisi ini. Klik 'Tambah Jabatan' di atas."}
                    </span>
                  </div>
                ) : (
                  filteredPositions.map((pos) => (
                    <div
                      key={pos.id}
                      className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                    >
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-xs text-slate-900 truncate">
                          {pos.title}
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              pos._count.employees > 0
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            <Users className="w-3 h-3" />
                            {pos._count.employees} Pegawai Aktif
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenEditPos(pos)}
                          className="p-1.5 text-slate-400 hover:text-[#102E50] hover:bg-white rounded-md transition-colors"
                          title="Ubah Judul Jabatan"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setDeleteConfirm({
                              isOpen: true,
                              type: "position",
                              id: pos.id,
                              name: pos.title,
                            })
                          }
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-white rounded-md transition-colors"
                          title="Hapus Jabatan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="py-24 text-center text-xs text-slate-400 italic">
              Pilih salah satu divisi di sebelah kiri untuk melihat daftar jabatan.
            </div>
          )}
        </div>
      </div>

      {/* --- MODAL DIVISI (CREATE / EDIT) --- */}
      {deptModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-[#102E50] font-heading">
                {deptModal.mode === "create" ? "Tambah Divisi Baru" : "Ubah Data Divisi"}
              </h3>
              <button
                type="button"
                onClick={() => setDeptModal((prev) => ({ ...prev, isOpen: false }))}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDept} className="mt-4 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Nama Divisi / Departemen <span className="text-[#A8281C]">*</span>
                </label>
                <input
                  type="text"
                  value={deptModal.name}
                  onChange={(e) => setDeptModal((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Contoh: Divisi Kebijakan Pembelajaran"
                  required
                  autoFocus
                  className="w-full px-3 py-2 text-xs bg-slate-50/70 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#102E50]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDeptModal((prev) => ({ ...prev, isOpen: false }))}
                  disabled={isLoading}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !deptModal.name.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-[#102E50] text-white hover:bg-[#0c233d] transition-all disabled:opacity-50"
                >
                  {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Simpan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL JABATAN (CREATE / EDIT) --- */}
      {posModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-[#102E50] font-heading">
                {posModal.mode === "create" ? "Tambah Jabatan Baru" : "Ubah Data Jabatan"}
              </h3>
              <button
                type="button"
                onClick={() => setPosModal((prev) => ({ ...prev, isOpen: false }))}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePos} className="mt-4 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Divisi Penempatan <span className="text-[#A8281C]">*</span>
                </label>
                <select
                  value={posModal.departmentId}
                  onChange={(e) =>
                    setPosModal((prev) => ({ ...prev, departmentId: e.target.value }))
                  }
                  required
                  className="w-full px-3 py-2 text-xs bg-slate-50/70 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#102E50]"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Judul Jabatan / Posisi Riset <span className="text-[#A8281C]">*</span>
                </label>
                <input
                  type="text"
                  value={posModal.title}
                  onChange={(e) => setPosModal((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Contoh: Peneliti Kebijakan Madya"
                  required
                  autoFocus
                  className="w-full px-3 py-2 text-xs bg-slate-50/70 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#102E50]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPosModal((prev) => ({ ...prev, isOpen: false }))}
                  disabled={isLoading}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !posModal.title.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-[#102E50] text-white hover:bg-[#0c233d] transition-all disabled:opacity-50"
                >
                  {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Simpan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL KONFIRMASI HAPUS --- */}
      {deleteConfirm.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 shadow-xl border border-slate-200">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <h3 className="font-bold text-sm text-slate-900 font-heading">
                  Hapus {deleteConfirm.type === "department" ? "Divisi" : "Jabatan"}?
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Apakah Anda yakin ingin menghapus <strong>&ldquo;{deleteConfirm.name}&rdquo;</strong>?
                  Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteConfirm((prev) => ({ ...prev, isOpen: false }))}
                disabled={isLoading}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Ya, Hapus</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
