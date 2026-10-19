"use client";

import React, { useState } from "react";
import { X, Briefcase, Upload, Loader2, AlertCircle, ArrowRight } from "lucide-react";
import { transferEmployeePositionAction } from "@/server/actions/organization.actions";
import { toDateString } from "@pspk/shared";
import { DEPT_TYPE_LABEL, DepartmentType } from "@/server/schemas/organization.schema";

interface TransferPositionModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: {
    id: string;
    fullName: string;
    employeeNo: string;
    currentDepartmentId?: string | null;
    currentDepartmentName?: string;
    currentPositionId?: string | null;
    currentPositionTitle?: string;
    managerId?: string | null;
    managerName?: string;
    currentEmploymentType?: "PERMANENT" | "FIXED_TERM" | "PART_TIME_PROJECT" | null;
    currentEmploymentTypeId?: string | null;
    currentEmploymentTypeName?: string;
    currentContractEndDate?: string | null;
    currentBaseSalary?: number | null;
  };
  departments: Array<{
    id: string;
    name: string;
    type?: DepartmentType;
    positions: Array<{ id: string; title: string }>;
  }>;
  managers: Array<{
    id: string;
    fullName: string;
    employeeNo: string;
    currentPosition?: { title: string } | null;
    currentDepartment?: { name: string } | null;
  }>;
  employmentTypes?: Array<{
    id: string;
    code: string;
    name: string;
    category: "PERMANENT" | "FIXED_TERM" | "PART_TIME_PROJECT";
    wageType: "MONTHLY" | "HOURLY";
    defaultHourlyRate?: number | null;
    description?: string | null;
  }>;
  onSuccess?: () => void;
}

export function TransferPositionModal({
  isOpen,
  onClose,
  employee,
  departments,
  managers,
  employmentTypes = [],
  onSuccess,
}: TransferPositionModalProps) {
  const [transferType, setTransferType] = useState<
    "PROMOTION" | "ROTATION" | "DEMOTION" | "ADJUSTMENT"
  >("PROMOTION");
  const [departmentId, setDepartmentId] = useState<string>(
    employee.currentDepartmentId || departments[0]?.id || "",
  );
  const [positionId, setPositionId] = useState<string>(employee.currentPositionId || "");
  const [managerId, setManagerId] = useState<string>(employee.managerId || "");
  const [effectiveDate, setEffectiveDate] = useState<string>(toDateString(new Date()));

  // State untuk Pembaruan Tipe Ikatan Kerja
  const [selectedEmploymentTypeId, setSelectedEmploymentTypeId] = useState<string>(
    employee.currentEmploymentTypeId ||
      employmentTypes.find((t) => t.category === (employee.currentEmploymentType || "FIXED_TERM"))
        ?.id ||
      "",
  );
  const [selectedCategory, setSelectedCategory] = useState<
    "PERMANENT" | "FIXED_TERM" | "PART_TIME_PROJECT"
  >(employee.currentEmploymentType || "FIXED_TERM");
  const [contractEndDate, setContractEndDate] = useState<string>(
    employee.currentContractEndDate ? employee.currentContractEndDate.substring(0, 10) : "",
  );
  const [newBaseSalary, setNewBaseSalary] = useState<string>(
    employee.currentBaseSalary ? String(employee.currentBaseSalary) : "",
  );

  const [skNumber, setSkNumber] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filter positions by selected department
  const currentDeptObj = departments.find((d) => d.id === departmentId);
  const availablePositions = currentDeptObj?.positions || [];

  // Filter out the employee themselves from manager options
  const eligibleManagers = managers.filter((m) => m.id !== employee.id);

  const handleDepartmentChange = (newDeptId: string) => {
    setDepartmentId(newDeptId);
    const deptObj = departments.find((d) => d.id === newDeptId);
    if (deptObj && deptObj.positions.length > 0) {
      setPositionId(deptObj.positions[0]?.id || "");
    } else {
      setPositionId("");
    }
  };

  const handleEmploymentTypeChange = (typeId: string) => {
    setSelectedEmploymentTypeId(typeId);
    const matched = employmentTypes.find((t) => t.id === typeId);
    if (matched) {
      setSelectedCategory(matched.category);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Lampiran SK / Kontrak harus berupa berkas PDF.");
      setSelectedFile(null);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Ukuran berkas PDF maksimal 10 MB.");
      setSelectedFile(null);
      return;
    }

    setError(null);
    setSelectedFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!departmentId) {
      setError("Pilih divisi tujuan.");
      return;
    }

    if (!positionId) {
      setError("Pilih jabatan/posisi baru.");
      return;
    }

    if (!effectiveDate) {
      setError("Pilih tanggal berlaku efektif.");
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("employeeId", employee.id);
      formData.append("departmentId", departmentId);
      formData.append("positionId", positionId);
      if (managerId) formData.append("managerId", managerId);
      formData.append("effectiveDate", effectiveDate);
      formData.append("transferType", transferType);

      // Informasi Ikatan Kerja Baru
      formData.append("employmentType", selectedCategory);
      if (selectedEmploymentTypeId) {
        formData.append("employmentTypeId", selectedEmploymentTypeId);
      }
      if (selectedCategory === "FIXED_TERM" && contractEndDate) {
        formData.append("contractEndDate", contractEndDate);
      }
      if (newBaseSalary.trim()) {
        formData.append("newBaseSalary", newBaseSalary.trim());
      }

      if (skNumber.trim()) formData.append("skNumber", skNumber.trim());
      if (notes.trim()) formData.append("notes", notes.trim());
      if (selectedFile) formData.append("documentFile", selectedFile);

      const res = await transferEmployeePositionAction(formData);

      setIsLoading(false);

      if (res.ok) {
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setError(res.error || "Gagal memproses mutasi pegawai.");
      }
    } catch (err: unknown) {
      setIsLoading(false);
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan pada sistem.";
      setError(msg);
    }
  };

  // Helper label ikatan kerja saat ini
  const currentStatusLabel =
    employee.currentEmploymentTypeName ||
    (employee.currentEmploymentType === "PERMANENT"
      ? "Pegawai Tetap (PKWTT)"
      : employee.currentEmploymentType === "FIXED_TERM"
        ? "Pegawai Kontrak (PKWT)"
        : employee.currentEmploymentType === "PART_TIME_PROJECT"
          ? "Mitra / Freelance / Paruh Waktu"
          : "Belum Ditentukan");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#102E50]/10 text-[#102E50] flex items-center justify-center shrink-0">
              <Briefcase className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <h2 className="font-bold text-base text-[#102E50] font-heading">
                Perbarui Jabatan / Mutasi Pegawai
              </h2>
              <span className="text-xs text-slate-500">
                {employee.fullName} ({employee.employeeNo})
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Position & Status Summary */}
        <div className="my-4 p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-2.5 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-slate-400">
                Posisi & Divisi Saat Ini
              </span>
              <span className="font-bold text-slate-800 mt-0.5">
                {employee.currentPositionTitle || "Belum ada jabatan"}
              </span>
              <span className="text-slate-500">
                {employee.currentDepartmentName || "Belum ada divisi"}
              </span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 shrink-0 mx-2" />
            <div className="flex flex-col text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400">Atasan Saat Ini</span>
              <span className="font-semibold text-slate-700 mt-0.5">
                {employee.managerName || "Tidak ada atasan"}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">Status Ikatan Kerja Saat Ini:</span>
            <span className="font-semibold text-[#102E50] bg-[#102E50]/10 px-2.5 py-0.5 rounded-full text-[11px]">
              {currentStatusLabel}
            </span>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-xs text-red-900">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs">
          {/* 1. Jenis Perubahan */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              Jenis Perubahan Karir <span className="text-[#A8281C]">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { key: "PROMOTION", label: "Promosi" },
                { key: "ROTATION", label: "Rotasi Divisi" },
                { key: "DEMOTION", label: "Demosi" },
                { key: "ADJUSTMENT", label: "Penyesuaian" },
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setTransferType(opt.key as typeof transferType)}
                  className={`py-2 px-3 rounded-lg border text-center font-semibold transition-all ${
                    transferType === opt.key
                      ? "bg-[#102E50] border-[#102E50] text-white shadow-xs"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Divisi Tujuan & Jabatan Baru */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                Divisi / Departemen Tujuan <span className="text-[#A8281C]">*</span>
              </label>
              <select
                value={departmentId}
                onChange={(e) => handleDepartmentChange(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50/70 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#102E50]"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.type ? `${DEPT_TYPE_LABEL[d.type]} - ` : ""}
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                Jabatan / Posisi Riset Baru <span className="text-[#A8281C]">*</span>
              </label>
              <select
                value={positionId}
                onChange={(e) => setPositionId(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50/70 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#102E50]"
              >
                {availablePositions.length === 0 ? (
                  <option value="">-- Belum ada formasi di divisi ini --</option>
                ) : (
                  availablePositions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* 3. Atasan Langsung & Tanggal Efektif */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                Atasan Langsung (Manager) Baru
              </label>
              <select
                value={managerId}
                onChange={(e) => setManagerId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50/70 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#102E50]"
              >
                <option value="">-- Tidak Ada Atasan (Direksi / Mandiri) --</option>
                {eligibleManagers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.fullName} ({m.currentPosition?.title || m.employeeNo})
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Menentukan alur persetujuan cuti & review kinerja
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                Tanggal Berlaku Efektif <span className="text-[#A8281C]">*</span>
              </label>
              <input
                type="date"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50/70 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#102E50]"
              />
            </div>
          </div>

          {/* 4. Pembaruan Tipe Ikatan Kerja (PKWT ke Pegawai Tetap, dsb.) */}
          <div className="p-3.5 bg-slate-50/80 border border-slate-200 rounded-xl flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#102E50] text-xs">
                Pembaruan Status / Tipe Ikatan Kerja
              </span>
              <span className="text-[11px] text-slate-500">
                Pilih status kerja baru untuk mutasi ini
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Status / Tipe Kerja Baru <span className="text-[#A8281C]">*</span>
                </label>
                {employmentTypes.length > 0 ? (
                  <select
                    value={selectedEmploymentTypeId}
                    onChange={(e) => handleEmploymentTypeChange(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#102E50]"
                  >
                    <option value="">-- Pertahankan Kategori Dasar --</option>
                    {employmentTypes.map((et) => (
                      <option key={et.id} value={et.id}>
                        {et.name} (
                        {et.category === "PERMANENT"
                          ? "Tetap"
                          : et.category === "FIXED_TERM"
                            ? "PKWT"
                            : "Mitra / Proyek"}
                        )
                      </option>
                    ))}
                  </select>
                ) : (
                  <select
                    value={selectedCategory}
                    onChange={(e) =>
                      setSelectedCategory(e.target.value as typeof selectedCategory)
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#102E50]"
                  >
                    <option value="PERMANENT">Pegawai Tetap (PKWTT)</option>
                    <option value="FIXED_TERM">Pegawai Kontrak (PKWT)</option>
                    <option value="PART_TIME_PROJECT">Mitra / Freelance / Paruh Waktu</option>
                  </select>
                )}
              </div>

              {selectedCategory === "FIXED_TERM" ? (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tanggal Berakhir Kontrak Baru
                  </label>
                  <input
                    type="date"
                    value={contractEndDate}
                    onChange={(e) => setContractEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#102E50]"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Bila kosong, masa kontrak mengikuti kebijakan sebelumnya
                  </span>
                </div>
              ) : (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Penyesuaian Gaji Pokok (Opsional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={newBaseSalary}
                    onChange={(e) => setNewBaseSalary(e.target.value)}
                    placeholder="Contoh: 8500000"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#102E50]"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Isi jika ada kenaikan/penyesuaian kompensasi
                  </span>
                </div>
              )}
            </div>

            {selectedCategory === "FIXED_TERM" && (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Penyesuaian Gaji Pokok (Opsional)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={newBaseSalary}
                  onChange={(e) => setNewBaseSalary(e.target.value)}
                  placeholder="Contoh: 8500000"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#102E50]"
                />
              </div>
            )}
          </div>

          {/* 5. Nomor SK / Kontrak & Upload PDF SK / Kontrak */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                Nomor SK / Perjanjian Kontrak Kerja
              </label>
              <input
                type="text"
                value={skNumber}
                onChange={(e) => setSkNumber(e.target.value)}
                placeholder="Contoh: 014/SK-DIR/PSPK/2026 atau 028/PKWT/HRD/2026"
                className="w-full px-3 py-2 bg-slate-50/70 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#102E50]"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                Lampiran Berkas SK / Kontrak (PDF Opsional)
              </label>
              <div className="flex items-center gap-2">
                <label className="flex-1 px-3 py-2 bg-slate-50 border border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors flex items-center justify-between truncate">
                  <span className="text-slate-500 truncate text-xs">
                    {selectedFile ? selectedFile.name : "Pilih berkas PDF SK / Kontrak..."}
                  </span>
                  <Upload className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1.5" />
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                {selectedFile && (
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100"
                    title="Hapus berkas"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Format PDF maksimal 10 MB
              </span>
            </div>
          </div>

          {/* 6. Catatan Tambahan */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              Catatan & Keterangan Tambahan
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Keterangan tambahan seputar mutasi, promosi, atau perubahan kontrak ini..."
              className="w-full px-3 py-2 bg-slate-50/70 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#102E50]"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 mt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 rounded-lg font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading || !departmentId || !positionId}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg font-semibold bg-[#102E50] text-white hover:bg-[#0c233d] transition-all cursor-pointer shadow-xs disabled:opacity-50"
            >
              {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Simpan Mutasi & Perubahan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
