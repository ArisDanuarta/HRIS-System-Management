"use client";

import React, { useState } from "react";
import {
  Download,
  X,
  FileText,
  Archive,
  ShieldAlert,
  Calendar,
  CheckSquare,
  Square,
  AlertTriangle,
} from "lucide-react";

export interface ExportProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string;
  employeeName: string;
  employeeNo: string;
  isHrOrAdmin?: boolean;
  isManager?: boolean;
}

export function ExportProfileModal({
  isOpen,
  onClose,
  employeeId,
  employeeName,
  employeeNo,
  isHrOrAdmin = false,
  isManager = false,
}: ExportProfileModalProps) {
  // Pilihan Bagian Profil
  const [includePersonal, setIncludePersonal] = useState(true);
  const [includeAddress, setIncludeAddress] = useState(true);
  const [includeFamily, setIncludeFamily] = useState(true);
  const [includeEducation, setIncludeEducation] = useState(true);
  const [includeEmployment, setIncludeEmployment] = useState(true);
  const [includeContracts, setIncludeContracts] = useState(true);
  const [includeAttendance, setIncludeAttendance] = useState(true);
  const [includeDocuments, setIncludeDocuments] = useState(true);
  const [includeAssets, setIncludeAssets] = useState(true);

  // Bagian Sensitif & Kompensasi (Khusus HR/Admin; disabled jika Manager)
  const canAccessSensitive = isHrOrAdmin && !isManager;
  const [includeSensitive, setIncludeSensitive] = useState(false);
  const [includeCompensation, setIncludeCompensation] = useState(false);

  // Rentang Tanggal Absensi (Default: 30 hari terakhir)
  const now = new Date();
  const past30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const [attendanceFrom, setAttendanceFrom] = useState(past30Days.toISOString().split("T")[0]);
  const [attendanceTo, setAttendanceTo] = useState(now.toISOString().split("T")[0]);

  // Opsi Format Ekspor: ZIP (PDF + Dokumen Asli) atau PDF Saja
  const [packageZip, setPackageZip] = useState(false);

  // State Konfirmasi Audit untuk Data Sensitif
  const [showSensitiveAuditWarning, setShowSensitiveAuditWarning] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleToggleSensitive = () => {
    if (!canAccessSensitive) return;
    if (!includeSensitive) {
      setShowSensitiveAuditWarning(true);
    } else {
      setIncludeSensitive(false);
    }
  };

  const handleConfirmSensitiveAudit = () => {
    setIncludeSensitive(true);
    setShowSensitiveAuditWarning(false);
  };

  const handleExportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsDownloading(true);
    setDownloadError(null);

    try {
      const queryParams = new URLSearchParams({
        personal: String(includePersonal),
        address: String(includeAddress),
        family: String(includeFamily),
        education: String(includeEducation),
        employment: String(includeEmployment),
        contracts: String(includeContracts),
        attendance: String(includeAttendance),
        documents: String(includeDocuments),
        assets: String(includeAssets),
        sensitive: String(canAccessSensitive && includeSensitive),
        compensation: String(canAccessSensitive && includeCompensation),
        attendanceFrom: attendanceFrom || "",
        attendanceTo: attendanceTo || "",
        format: packageZip ? "zip" : "pdf",
      });

      const exportUrl = `/api/karyawan/${employeeId}/export?${queryParams.toString()}`;

      // Picu pengunduhan berkas langsung
      const response = await fetch(exportUrl);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Gagal mengunduh berkas ekspor karyawan.");
      }

      const blob = await response.blob();
      const downloadLink = document.createElement("a");
      const objectUrl = window.URL.createObjectURL(blob);
      downloadLink.href = objectUrl;

      const fileExtension = packageZip ? "zip" : "pdf";
      const sanitizedName = employeeName.replace(/[^a-zA-Z0-9_-]/g, "_");
      downloadLink.download = `Profil_Lengkap_${employeeNo}_${sanitizedName}.${fileExtension}`;

      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      window.URL.revokeObjectURL(objectUrl);

      onClose();
    } catch (err) {
      console.error("Export error:", err);
      setDownloadError(
        err instanceof Error ? err.message : "Terjadi kesalahan saat memproses ekspor profil.",
      );
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl p-5 sm:p-6 flex flex-col gap-4 max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-150">
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#102E50]/10 text-[#102E50] flex items-center justify-center shrink-0">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#102E50] font-heading">
                Ekspor Profil Lengkap Karyawan
              </h3>
              <p className="text-xs text-slate-500">
                {employeeName} • NIP: {employeeNo}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {downloadError && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{downloadError}</span>
          </div>
        )}

        {/* Form Pilihan Ekspor */}
        <form onSubmit={handleExportSubmit} className="flex flex-col gap-4 text-xs">
          {/* Kelompok 1: Bagian Data Profil */}
          <div className="flex flex-col gap-2">
            <span className="font-bold text-slate-700 flex items-center justify-between">
              <span>Pilih Data yang Akan Dicantumkan:</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-slate-50/70 rounded-xl border border-slate-200/80">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includePersonal}
                  onChange={(e) => setIncludePersonal(e.target.checked)}
                  className="rounded text-[#102E50] focus:ring-[#102E50]"
                />
                <span className="font-medium text-slate-700">Biodata & Identitas Pribadi</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeAddress}
                  onChange={(e) => setIncludeAddress(e.target.checked)}
                  className="rounded text-[#102E50] focus:ring-[#102E50]"
                />
                <span className="font-medium text-slate-700">Alamat KTP & Domisili</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeFamily}
                  onChange={(e) => setIncludeFamily(e.target.checked)}
                  className="rounded text-[#102E50] focus:ring-[#102E50]"
                />
                <span className="font-medium text-slate-700">Susunan Keluarga & Tanggungan</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeEducation}
                  onChange={(e) => setIncludeEducation(e.target.checked)}
                  className="rounded text-[#102E50] focus:ring-[#102E50]"
                />
                <span className="font-medium text-slate-700">Pendidikan & Sertifikasi Pelatihan</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeEmployment}
                  onChange={(e) => setIncludeEmployment(e.target.checked)}
                  className="rounded text-[#102E50] focus:ring-[#102E50]"
                />
                <span className="font-medium text-slate-700">Penempatan & Riwayat Jabatan</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeContracts}
                  onChange={(e) => setIncludeContracts(e.target.checked)}
                  className="rounded text-[#102E50] focus:ring-[#102E50]"
                />
                <span className="font-medium text-slate-700">Riwayat Kontrak Kerja (PKWT/SK)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeDocuments}
                  onChange={(e) => setIncludeDocuments(e.target.checked)}
                  className="rounded text-[#102E50] focus:ring-[#102E50]"
                />
                <span className="font-medium text-slate-700">Daftar Dokumen Arsip</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeAssets}
                  onChange={(e) => setIncludeAssets(e.target.checked)}
                  className="rounded text-[#102E50] focus:ring-[#102E50]"
                />
                <span className="font-medium text-slate-700">Daftar Aset Kantor Terkait</span>
              </label>
            </div>
          </div>

          {/* Kelompok 2: Rekapitulasi Absensi & Cuti */}
          <div className="flex flex-col gap-2 p-3 bg-slate-50/70 rounded-xl border border-slate-200/80">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeAttendance}
                onChange={(e) => setIncludeAttendance(e.target.checked)}
                className="rounded text-[#102E50] focus:ring-[#102E50]"
              />
              <span className="font-bold text-slate-800">
                Sertakan Log Absensi & Rekap Kehadiran
              </span>
            </label>

            {includeAttendance && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-slate-200/60 mt-1">
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] text-slate-500 font-medium">Dari Tanggal:</span>
                  <input
                    type="date"
                    value={attendanceFrom}
                    onChange={(e) => setAttendanceFrom(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-mono text-xs focus:ring-1 focus:ring-[#102E50]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] text-slate-500 font-medium">Sampai Tanggal:</span>
                  <input
                    type="date"
                    value={attendanceTo}
                    onChange={(e) => setAttendanceTo(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-mono text-xs focus:ring-1 focus:ring-[#102E50]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Kelompok 3: Data Sensitif & Kompensasi (Proteksi Peran) */}
          <div className="flex flex-col gap-2 p-3 bg-amber-50/40 rounded-xl border border-amber-200/70">
            <div className="flex items-center gap-1.5 text-amber-900 font-bold">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Data Sensitif & Kompensasi (Terkunci & Diaudit)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <label
                className={`flex items-start gap-2 select-none ${
                  canAccessSensitive ? "cursor-pointer" : "opacity-60 cursor-not-allowed"
                }`}
              >
                <input
                  type="checkbox"
                  disabled={!canAccessSensitive}
                  checked={includeSensitive}
                  onChange={handleToggleSensitive}
                  className="rounded text-[#102E50] focus:ring-[#102E50] mt-0.5"
                />
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-800">Buka NIK, NPWP, Rekening</span>
                  <span className="text-[10px] text-slate-500">
                    {!canAccessSensitive
                      ? "Khusus Admin HR / Super Admin"
                      : "Pencetakan dicatat di audit log"}
                  </span>
                </div>
              </label>

              <label
                className={`flex items-start gap-2 select-none ${
                  canAccessSensitive ? "cursor-pointer" : "opacity-60 cursor-not-allowed"
                }`}
              >
                <input
                  type="checkbox"
                  disabled={!canAccessSensitive}
                  checked={includeCompensation}
                  onChange={(e) => setIncludeCompensation(e.target.checked)}
                  className="rounded text-[#102E50] focus:ring-[#102E50] mt-0.5"
                />
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-800">Gaji Pokok & Tunjangan</span>
                  <span className="text-[10px] text-slate-500">
                    {!canAccessSensitive
                      ? "Khusus Admin HR / Super Admin"
                      : "Paket gaji pada kontrak kerja"}
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Kelompok 4: Opsi Paket Unduhan (PDF atau ZIP dengan Dokumen Asli) */}
          <div className="p-3.5 rounded-xl border-2 border-dashed border-[#102E50]/30 bg-blue-50/30 flex items-start gap-3">
            <input
              type="checkbox"
              id="packageZip"
              checked={packageZip}
              onChange={(e) => setPackageZip(e.target.checked)}
              className="mt-0.5 rounded text-[#102E50] focus:ring-[#102E50]"
            />
            <label htmlFor="packageZip" className="flex flex-col cursor-pointer select-none">
              <span className="font-bold text-[#102E50] text-xs flex items-center gap-1.5">
                <Archive className="w-4 h-4 text-[#102E50]" />
                <span>Unduh sebagai Paket Arsip Lengkap (.ZIP)</span>
              </span>
              <span className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                Menghasilkan berkas <strong>.ZIP</strong> yang memuat dokumen resmi PDF profil serta
                folder <code>Dokumen_Lampiran/</code> berisi seluruh berkas foto KTP, NPWP, Ijazah, dan
                kontrak asli pegawai.
              </span>
            </label>
          </div>

          {/* Footer Modal Actions */}
          <div className="flex items-center justify-between gap-2.5 pt-3 border-t border-slate-200">
            <span className="text-[11px] text-slate-500">
              Format: {packageZip ? "Paket Arsip ZIP (.zip)" : "Dokumen Resmi PDF (.pdf)"}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isDownloading}
                className="px-3.5 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isDownloading}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#102E50] text-[#ffddb0] font-bold hover:bg-[#0c233d] transition-all shadow-xs cursor-pointer active:scale-[0.98] disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{isDownloading ? "Menyiapkan Berkas..." : "Unduh Data"}</span>
              </button>
            </div>
          </div>
        </form>

        {/* Modal Peringatan Audit saat Membuka Data Sensitif */}
        {showSensitiveAuditWarning && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl max-w-md w-full border border-amber-300 shadow-2xl p-5 flex flex-col gap-3.5 animate-in zoom-in-95">
              <div className="flex items-center gap-2.5 text-amber-800">
                <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#102E50] font-heading">
                    Peringatan Keamanan Audit
                  </h4>
                  <p className="text-[11px] text-slate-500">Data Terenkripsi Tingkat Tinggi</p>
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 text-xs text-amber-950 leading-relaxed">
                Anda memilih untuk membuka dan mencetak data sensitif (NIK, NPWP, Rekening Bank).
                Tindakan ekspor ini akan <strong>dicatat di Audit Trail Lembaga</strong> dengan
                identitas pengguna Anda, alamat IP, dan stempel waktu.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSensitiveAuditWarning(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSensitiveAudit}
                  className="px-4 py-1.5 rounded-lg bg-amber-700 text-white text-xs font-bold hover:bg-amber-800 transition-colors shadow-xs"
                >
                  Saya Mengerti, Lanjutkan
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
