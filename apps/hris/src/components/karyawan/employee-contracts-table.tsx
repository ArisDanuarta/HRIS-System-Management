"use client";

import React, { useState } from "react";
import { formatDate, formatRupiah } from "@pspk/shared";
import { EmploymentType, WageType } from "@pspk/db";
import { ContractTypeBadge } from "@/components/karyawan/status-badge";
import {
  FileText,
  Download,
  UploadCloud,
  FileCheck,
  Trash2,
  AlertCircle,
  CheckCircle2,
  X,
  Loader2,
  FileUp,
  Info,
} from "lucide-react";
import { attachContractDocumentAction } from "@/server/actions/employee.actions";

export interface SerializedEmploymentContract {
  id: string;
  type: EmploymentType | string;
  wageType: WageType | string;
  hourlyRate?: number | string | null;
  baseSalary?: number | string | null;
  startDate: Date | string;
  endDate?: Date | string | null;
  status: string;
  documentKey?: string | null;
  notes?: string | null;
  employmentTypeMaster?: {
    name: string;
    code: string;
  } | null;
}

interface EmployeeContractsTableProps {
  employeeId: string;
  employeeName: string;
  isHrOrAdmin: boolean;
  contracts: SerializedEmploymentContract[];
}

export function EmployeeContractsTable({
  employeeId,
  employeeName,
  isHrOrAdmin,
  contracts,
}: EmployeeContractsTableProps) {
  // Modal state
  const [activeModalContract, setActiveModalContract] =
    useState<SerializedEmploymentContract | null>(null);
  const [modalContractNumber, setModalContractNumber] = useState("");
  const [modalNotes, setModalNotes] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Helper untuk mengekstrak nomor kontrak dari catatan [Nomor: ...]
  const extractContractNumber = (notesStr?: string | null) => {
    if (!notesStr) return "";
    const match = notesStr.match(/\[Nomor:\s*([^\]]+)\]/);
    return match && match[1] ? match[1].trim() : "";
  };

  // Helper untuk membersihkan catatan dari tag [Nomor: ...]
  const cleanContractNotes = (notesStr?: string | null) => {
    if (!notesStr) return "";
    return notesStr.replace(/\[Nomor:\s*[^\]]+\]\s*/, "").trim();
  };

  const handleOpenModal = (contract: SerializedEmploymentContract) => {
    setActiveModalContract(contract);
    setModalContractNumber(extractContractNumber(contract.notes));
    setModalNotes(cleanContractNotes(contract.notes));
    setSelectedFile(null);
    setFileError(null);
    setServerError(null);
  };

  const handleCloseModal = () => {
    if (isSubmitting) return;
    setActiveModalContract(null);
    setSelectedFile(null);
    setFileError(null);
    setServerError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setFileError("Format berkas harus berupa dokumen PDF (.pdf).");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setFileError("Ukuran berkas melebihi batas maksimal 10 MB.");
      return;
    }

    setSelectedFile(file);
  };

  const handleSubmitModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModalContract) return;

    if (!selectedFile && !activeModalContract.documentKey) {
      setFileError("Silakan pilih berkas PDF kontrak yang telah ditandatangani.");
      return;
    }

    setIsSubmitting(true);
    setServerError(null);

    try {
      const formData = new FormData();
      formData.append("contractId", activeModalContract.id);
      formData.append("employeeId", employeeId);
      formData.append("contractNumber", modalContractNumber.trim());
      formData.append("notes", modalNotes.trim());

      if (selectedFile) {
        formData.append("file", selectedFile);
      } else if (activeModalContract.documentKey) {
        formData.append("documentKey", activeModalContract.documentKey);
      }

      const res = await attachContractDocumentAction(formData);

      if (res.ok) {
        setSuccessMessage(
          `Berkas kontrak '${activeModalContract.employmentTypeMaster?.name || activeModalContract.type}' berhasil disimpan.`,
        );
        handleCloseModal();
        setTimeout(() => setSuccessMessage(null), 5000);
      } else {
        setServerError(res.error);
      }
    } catch (err: unknown) {
      console.error("handleSubmitModal error:", err);
      setServerError(
        err instanceof Error ? err.message : "Terjadi kesalahan saat mengunggah berkas kontrak.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-base text-[#102E50] font-heading">
            Riwayat Kontrak Kerja
          </h3>
          <p className="text-xs text-slate-500">
            {isHrOrAdmin
              ? "Daftar perjanjian ikatan kerja, masa berlaku, dan nilai kompensasi pokok"
              : "Daftar perjanjian ikatan kerja dan masa berlaku kontrak"}
          </p>
        </div>

        {isHrOrAdmin && (
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-lg">
            <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>Staf baru dapat menandatangani kontrak, lalu HR mengunggah lembar PDF di sini.</span>
          </div>
        )}
      </div>

      {/* Success Alert Banner */}
      {successMessage && (
        <div className="m-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-slate-400 hover:text-slate-600 p-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              <th className="py-3 px-4">Tipe Kontrak</th>
              <th className="py-3 px-4">Nomor Kontrak</th>
              <th className="py-3 px-4">Tanggal Mulai</th>
              <th className="py-3 px-4">Tanggal Berakhir</th>
              {isHrOrAdmin && <th className="py-3 px-4">Gaji Pokok / Tarif</th>}
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Berkas SK / Kontrak</th>
              <th className="py-3 px-4">Catatan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {contracts.length === 0 ? (
              <tr>
                <td
                  colSpan={isHrOrAdmin ? 8 : 7}
                  className="py-8 text-center text-slate-400 italic"
                >
                  Belum ada riwayat kontrak kerja
                </td>
              </tr>
            ) : (
              contracts.map((contract) => {
                const contractNo = extractContractNumber(contract.notes);
                const displayNotes = cleanContractNotes(contract.notes);

                return (
                  <tr key={contract.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-semibold">
                      <ContractTypeBadge
                        type={contract.type}
                        label={contract.employmentTypeMaster?.name}
                      />
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-700">
                      {contractNo ? (
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[11px] border border-slate-200 font-semibold">
                          {contractNo}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono">{formatDate(contract.startDate)}</td>
                    <td className="py-3 px-4 font-mono">
                      {contract.endDate ? formatDate(contract.endDate) : "Tidak Terbatas (Tetap)"}
                    </td>
                    {isHrOrAdmin && (
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {contract.wageType === "HOURLY" && contract.hourlyRate
                          ? `${formatRupiah(Number(contract.hourlyRate))} / jam`
                          : contract.baseSalary
                            ? formatRupiah(Number(contract.baseSalary))
                            : "-"}
                      </td>
                    )}
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          contract.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {contract.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {contract.documentKey ? (
                          <>
                            <a
                              href={`/api/documents/${contract.documentKey}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-[11px] transition-colors border border-blue-200/60 shadow-2xs"
                              title="Unduh Berkas SK / Perjanjian Kontrak Kerja"
                            >
                              <FileText className="w-3.5 h-3.5 text-blue-600" />
                              <span>Unduh PDF</span>
                              <Download className="w-3 h-3 ml-0.5 text-blue-500" />
                            </a>
                            {isHrOrAdmin && (
                              <button
                                type="button"
                                onClick={() => handleOpenModal(contract)}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-slate-600 hover:text-[#102E50] hover:bg-slate-100 transition-colors"
                                title="Perbarui lembar dokumen kontrak"
                              >
                                <FileUp className="w-3 h-3" />
                                <span>Ganti</span>
                              </button>
                            )}
                          </>
                        ) : isHrOrAdmin ? (
                          <button
                            type="button"
                            onClick={() => handleOpenModal(contract)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#102E50]/10 hover:bg-[#102E50]/20 text-[#102E50] font-bold text-[11px] transition-colors border border-[#102E50]/20 cursor-pointer shadow-2xs"
                            title="Unggah berkas kontrak bertandatangan"
                          >
                            <FileUp className="w-3.5 h-3.5 text-[#102E50]" />
                            <span>+ Unggah Berkas</span>
                          </button>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">-</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                      {displayNotes || "-"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Dialog: Unggah / Perbarui Berkas Kontrak */}
      {activeModalContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-[#102E50] font-heading">
                  {activeModalContract.documentKey
                    ? "Perbarui Berkas Kontrak Kerja"
                    : "Unggah Berkas Kontrak Kerja"}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pegawai: <strong className="text-slate-700">{employeeName}</strong> (
                  {activeModalContract.employmentTypeMaster?.name || activeModalContract.type})
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={isSubmitting}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitModal} className="p-6 flex flex-col gap-4 text-xs">
              {serverError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{serverError}</span>
                </div>
              )}

              {/* Input Nomor Kontrak */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Nomor Kontrak Kerja / Surat Perjanjian
                </label>
                <input
                  type="text"
                  value={modalContractNumber}
                  onChange={(e) => setModalContractNumber(e.target.value)}
                  placeholder="Contoh: 018/PKWT/PSPK/X/2026 atau No. SK Direksi"
                  className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#102E50]"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Nomor resmi yang tercantum di lembar perjanjian ikatan kerja
                </span>
              </div>

              {/* Upload File PDF Box */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-semibold text-slate-700">
                    Lembar Dokumen Kontrak (PDF) <span className="text-[#A8281C]">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400">Maks. 10 MB</span>
                </div>

                {activeModalContract.documentKey && !selectedFile && (
                  <div className="mb-2.5 p-2.5 bg-blue-50/70 border border-blue-200 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="text-[11px] text-blue-900 font-medium truncate">
                        Telah terunggah sebelumnya ({activeModalContract.documentKey})
                      </span>
                    </div>
                    <span className="text-[10px] text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded font-semibold">
                      Tersimpan
                    </span>
                  </div>
                )}

                <div className="p-4 bg-slate-50/70 border-2 border-dashed border-slate-200 hover:border-slate-300 rounded-xl transition-all">
                  {!selectedFile ? (
                    <label className="flex flex-col items-center justify-center cursor-pointer py-2">
                      <UploadCloud className="w-8 h-8 text-slate-400 mb-1.5 group-hover:text-[#102E50]" />
                      <span className="text-xs font-bold text-slate-700 mb-0.5">
                        Pilih berkas PDF kontrak bertandatangan
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Format PDF (.pdf) ukuran maksimal 10 MB
                      </span>
                      <input
                        type="file"
                        accept="application/pdf,.pdf"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  ) : (
                    <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
                          <FileCheck className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold text-slate-800 truncate">
                            {selectedFile.name}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Siap disimpan
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedFile(null)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                        title="Hapus pilihan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {fileError && (
                    <p className="text-xs text-rose-600 font-semibold mt-2 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{fileError}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Catatan Tambahan */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Catatan / Keterangan Tambahan
                </label>
                <textarea
                  rows={2}
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  placeholder="Klausul penugasan khusus atau catatan verifikasi HR..."
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#102E50]"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-[#102E50] text-white hover:bg-[#102E50]/90 transition-all cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan Dokumen...</span>
                    </>
                  ) : (
                    <>
                      <FileCheck className="w-3.5 h-3.5 text-[#F2AF3E]" />
                      <span>Simpan & Tautkan Berkas</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
