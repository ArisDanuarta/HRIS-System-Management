"use client";

import React, { useState } from "react";
import {
  Download,
  X,
  Archive,
  ShieldAlert,
  AlertTriangle,
  Loader2,
  FileText,
  Lock,
  CheckCheck,
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

  // Tombol aksi cepat: Pilih Semua / Batal Semua Bagian Dasar
  const handleSelectAllStandard = () => {
    setIncludePersonal(true);
    setIncludeAddress(true);
    setIncludeFamily(true);
    setIncludeEducation(true);
    setIncludeEmployment(true);
    setIncludeContracts(true);
    setIncludeAttendance(true);
    setIncludeDocuments(true);
    setIncludeAssets(true);
  };

  const handleDeselectAllStandard = () => {
    setIncludePersonal(false);
    setIncludeAddress(false);
    setIncludeFamily(false);
    setIncludeEducation(false);
    setIncludeEmployment(false);
    setIncludeContracts(false);
    setIncludeAttendance(false);
    setIncludeDocuments(false);
    setIncludeAssets(false);
  };

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

      // Picu request pengunduhan berkas ke server
      const response = await fetch(exportUrl);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            `Gagal memproses ekspor profil karyawan (HTTP ${response.status}).`,
        );
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
      <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl p-4 sm:p-6 flex flex-col gap-4 max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-150">
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#102E50]/10 text-[#102E50] flex items-center justify-center shrink-0">
              <Download className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-[#102E50] font-heading truncate">
                Ekspor Profil Lengkap Karyawan
              </h3>
              <p className="text-xs text-slate-500 truncate">
                {employeeName} • <span className="font-mono">NIP: {employeeNo}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={isDownloading}
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Banner jika gagal ekspor */}
        {downloadError && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
            <div className="flex flex-col gap-0.5">
              <span className="font-bold">Gagal Mengunduh Dokumen</span>
              <span className="leading-relaxed">{downloadError}</span>
            </div>
          </div>
        )}

        {/* Form Pilihan Ekspor */}
        <form onSubmit={handleExportSubmit} className="flex flex-col gap-4 text-xs">
          {/* Kelompok 1: Bagian Data Profil */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="font-bold text-slate-700">
                Bagian Profil yang Disertakan:
              </span>
              <div className="flex items-center gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={handleSelectAllStandard}
                  className="text-[#102E50] hover:underline font-semibold cursor-pointer"
                >
                  Pilih Semua
                </button>
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  onClick={handleDeselectAllStandard}
                  className="text-slate-500 hover:text-slate-700 hover:underline font-semibold cursor-pointer"
                >
                  Batal Semua
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-slate-50/70 rounded-xl border border-slate-200/80">
              <label className="flex items-center gap-2.5 py-1 px-1 rounded-lg hover:bg-slate-100/70 cursor-pointer select-none transition-colors min-h-[36px]">
                <input
                  type="checkbox"
                  checked={includePersonal}
                  onChange={(e) => setIncludePersonal(e.target.checked)}
                  className="w-4 h-4 rounded text-[#102E50] focus:ring-[#102E50] cursor-pointer"
                />
                <span className="font-medium text-slate-700">1. Biodata & Data Diri</span>
              </label>

              <label className="flex items-center gap-2.5 py-1 px-1 rounded-lg hover:bg-slate-100/70 cursor-pointer select-none transition-colors min-h-[36px]">
                <input
                  type="checkbox"
                  checked={includeAddress}
                  onChange={(e) => setIncludeAddress(e.target.checked)}
                  className="w-4 h-4 rounded text-[#102E50] focus:ring-[#102E50] cursor-pointer"
                />
                <span className="font-medium text-slate-700">2. Alamat KTP & Domisili</span>
              </label>

              <label className="flex items-center gap-2.5 py-1 px-1 rounded-lg hover:bg-slate-100/70 cursor-pointer select-none transition-colors min-h-[36px]">
                <input
                  type="checkbox"
                  checked={includeFamily}
                  onChange={(e) => setIncludeFamily(e.target.checked)}
                  className="w-4 h-4 rounded text-[#102E50] focus:ring-[#102E50] cursor-pointer"
                />
                <span className="font-medium text-slate-700">3. Susunan Anggota Keluarga</span>
              </label>

              <label className="flex items-center gap-2.5 py-1 px-1 rounded-lg hover:bg-slate-100/70 cursor-pointer select-none transition-colors min-h-[36px]">
                <input
                  type="checkbox"
                  checked={includeEducation}
                  onChange={(e) => setIncludeEducation(e.target.checked)}
                  className="w-4 h-4 rounded text-[#102E50] focus:ring-[#102E50] cursor-pointer"
                />
                <span className="font-medium text-slate-700">4. Pendidikan & Pelatihan</span>
              </label>

              <label className="flex items-center gap-2.5 py-1 px-1 rounded-lg hover:bg-slate-100/70 cursor-pointer select-none transition-colors min-h-[36px]">
                <input
                  type="checkbox"
                  checked={includeEmployment}
                  onChange={(e) => setIncludeEmployment(e.target.checked)}
                  className="w-4 h-4 rounded text-[#102E50] focus:ring-[#102E50] cursor-pointer"
                />
                <span className="font-medium text-slate-700">5. Penempatan & Mutasi Jabatan</span>
              </label>

              <label className="flex items-center gap-2.5 py-1 px-1 rounded-lg hover:bg-slate-100/70 cursor-pointer select-none transition-colors min-h-[36px]">
                <input
                  type="checkbox"
                  checked={includeContracts}
                  onChange={(e) => setIncludeContracts(e.target.checked)}
                  className="w-4 h-4 rounded text-[#102E50] focus:ring-[#102E50] cursor-pointer"
                />
                <span className="font-medium text-slate-700">6. Riwayat Kontrak Kerja (PKWT/SK)</span>
              </label>

              <label className="flex items-center gap-2.5 py-1 px-1 rounded-lg hover:bg-slate-100/70 cursor-pointer select-none transition-colors min-h-[36px]">
                <input
                  type="checkbox"
                  checked={includeDocuments}
                  onChange={(e) => setIncludeDocuments(e.target.checked)}
                  className="w-4 h-4 rounded text-[#102E50] focus:ring-[#102E50] cursor-pointer"
                />
                <span className="font-medium text-slate-700">7. Daftar Berkas Dokumen</span>
              </label>

              <label className="flex items-center gap-2.5 py-1 px-1 rounded-lg hover:bg-slate-100/70 cursor-pointer select-none transition-colors min-h-[36px]">
                <input
                  type="checkbox"
                  checked={includeAssets}
                  onChange={(e) => setIncludeAssets(e.target.checked)}
                  className="w-4 h-4 rounded text-[#102E50] focus:ring-[#102E50] cursor-pointer"
                />
                <span className="font-medium text-slate-700">8. Inventaris Aset Kantor</span>
              </label>
            </div>
          </div>

          {/* Kelompok 2: Rekapitulasi Absensi & Saldo Cuti */}
          <div className="flex flex-col gap-2 p-3 bg-slate-50/70 rounded-xl border border-slate-200/80">
            <label className="flex items-center gap-2.5 cursor-pointer select-none min-h-[36px]">
              <input
                type="checkbox"
                checked={includeAttendance}
                onChange={(e) => setIncludeAttendance(e.target.checked)}
                className="w-4 h-4 rounded text-[#102E50] focus:ring-[#102E50] cursor-pointer"
              />
              <span className="font-bold text-slate-800">
                9. Sertakan Rekapitulasi Absensi & Saldo Cuti
              </span>
            </label>

            {includeAttendance && (
              <div className="flex flex-col sm:flex-row gap-3 pt-2.5 border-t border-slate-200/60 mt-0.5">
                <div className="flex flex-col gap-1 flex-1">
                  <span className="text-[11px] text-slate-500 font-medium">Dari Tanggal:</span>
                  <input
                    type="date"
                    required={includeAttendance}
                    value={attendanceFrom}
                    onChange={(e) => setAttendanceFrom(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono text-xs focus:ring-2 focus:ring-[#102E50] focus:outline-none min-h-[40px]"
                  />
                </div>
                <div className="flex flex-col gap-1 flex-1">
                  <span className="text-[11px] text-slate-500 font-medium">Sampai Tanggal:</span>
                  <input
                    type="date"
                    required={includeAttendance}
                    value={attendanceTo}
                    onChange={(e) => setAttendanceTo(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono text-xs focus:ring-2 focus:ring-[#102E50] focus:outline-none min-h-[40px]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Kelompok 3: Opsi Data Terlindungi (Proteksi Hak Akses Role) */}
          <div className="flex flex-col gap-2 p-3.5 bg-amber-50/50 rounded-xl border border-amber-200/70">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1.5 text-amber-950 font-bold">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Opsi Data Terlindungi (Memerlukan Hak Akses)</span>
              </div>
              {!canAccessSensitive && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
                  <Lock className="w-3 h-3 text-slate-500" />
                  <span>Terkunci untuk Manager</span>
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1.5">
              <label
                className={`flex items-start gap-2.5 p-2 rounded-xl border transition-all select-none ${
                  canAccessSensitive
                    ? includeSensitive
                      ? "bg-amber-100/60 border-amber-300 cursor-pointer"
                      : "bg-white border-amber-200/60 hover:bg-amber-50/40 cursor-pointer"
                    : "bg-slate-100/70 border-slate-200 opacity-60 cursor-not-allowed"
                }`}
              >
                <input
                  type="checkbox"
                  disabled={!canAccessSensitive}
                  checked={includeSensitive}
                  onChange={handleToggleSensitive}
                  className="w-4 h-4 rounded text-[#102E50] focus:ring-[#102E50] mt-0.5 cursor-pointer disabled:cursor-not-allowed"
                />
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-slate-800 flex items-center gap-1">
                    <span>Data Sensitif (NIK, NPWP, Rekening)</span>
                    <Lock className="w-3 h-3 text-amber-700 shrink-0" />
                  </span>
                  <span className="text-[10.5px] text-slate-500 mt-0.5 leading-snug">
                    {!canAccessSensitive
                      ? "Akses ditutup untuk peran Manajer."
                      : "Pembukaan dicatat di Audit Trail Lembaga."}
                  </span>
                </div>
              </label>

              <label
                className={`flex items-start gap-2.5 p-2 rounded-xl border transition-all select-none ${
                  canAccessSensitive
                    ? includeCompensation
                      ? "bg-amber-100/60 border-amber-300 cursor-pointer"
                      : "bg-white border-amber-200/60 hover:bg-amber-50/40 cursor-pointer"
                    : "bg-slate-100/70 border-slate-200 opacity-60 cursor-not-allowed"
                }`}
              >
                <input
                  type="checkbox"
                  disabled={!canAccessSensitive}
                  checked={includeCompensation}
                  onChange={(e) => setIncludeCompensation(e.target.checked)}
                  className="w-4 h-4 rounded text-[#102E50] focus:ring-[#102E50] mt-0.5 cursor-pointer disabled:cursor-not-allowed"
                />
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-slate-800 flex items-center gap-1">
                    <span>Struktur Kompensasi & Gaji Pokok</span>
                    <Lock className="w-3 h-3 text-amber-700 shrink-0" />
                  </span>
                  <span className="text-[10.5px] text-slate-500 mt-0.5 leading-snug">
                    {!canAccessSensitive
                      ? "Akses ditutup untuk peran Manajer."
                      : "Rincian gaji pokok & tunjangan bulanan."}
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Kelompok 4: Pengemasan Berkas & Dokumen Asli (.ZIP) */}
          <div
            onClick={() => setPackageZip(!packageZip)}
            className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-3 select-none ${
              packageZip
                ? "border-[#102E50] bg-blue-50/60 shadow-xs"
                : "border-dashed border-slate-300 hover:border-slate-400 bg-slate-50/50"
            }`}
          >
            <input
              type="checkbox"
              id="packageZip"
              checked={packageZip}
              onChange={(e) => setPackageZip(e.target.checked)}
              onClick={(e) => e.stopPropagation()}
              className="w-4 h-4 mt-0.5 rounded text-[#102E50] focus:ring-[#102E50] cursor-pointer shrink-0"
            />
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-[#102E50] text-xs flex items-center gap-1.5 flex-wrap">
                <Archive className="w-4 h-4 text-[#102E50] shrink-0" />
                <span>Unduh sebagai Paket Arsip Lengkap (.ZIP)</span>
                {packageZip && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#102E50] text-[#ffddb0]">
                    Arsip Aktif
                  </span>
                )}
              </span>
              <span className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                Menghasilkan berkas <strong>.ZIP</strong> yang memuat dokumen resmi PDF profil serta
                folder <code>Dokumen_Lampiran/</code> berisi seluruh berkas foto KTP, NPWP, Ijazah, dan
                kontrak asli pegawai.
              </span>
            </div>
          </div>

          {/* Format Pilihan Preview Strip */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100/80 border border-slate-200/80 text-[11px] text-slate-700">
            <span className="text-slate-500">Format Dokumen Akhir:</span>
            <div className="flex items-center gap-1.5 font-bold">
              {packageZip ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-100 text-[#102E50] border border-blue-200 font-mono">
                  <Archive className="w-3.5 h-3.5" />
                  <span>PAKET ARSIP (.ZIP)</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-200 font-mono">
                  <FileText className="w-3.5 h-3.5 text-emerald-700" />
                  <span>DOKUMEN RESMI (.PDF)</span>
                </span>
              )}
            </div>
          </div>

          {/* Footer Modal Actions */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isDownloading}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50 min-h-[44px]"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={isDownloading}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#102E50] text-[#ffddb0] font-bold hover:bg-[#0c233d] transition-all shadow-xs cursor-pointer active:scale-[0.98] disabled:opacity-50 min-h-[44px]"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyiapkan Berkas...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Unduh Data</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Modal Peringatan Audit saat Membuka Data Sensitif */}
        {showSensitiveAuditWarning && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl max-w-md w-full border border-amber-300 shadow-2xl p-5 sm:p-6 flex flex-col gap-4 animate-in zoom-in-95">
              <div className="flex items-center gap-3 text-amber-800">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h4 className="font-bold text-sm sm:text-base text-[#102E50] font-heading">
                    Peringatan Keamanan Audit
                  </h4>
                  <p className="text-xs text-slate-500">Data Terenkripsi Tingkat Tinggi</p>
                </div>
              </div>

              <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200/80 text-xs text-amber-950 leading-relaxed space-y-2">
                <p>
                  Anda memilih untuk membuka dan mencetak data sensitif (NIK, NPWP, Rekening Bank).
                </p>
                <p>
                  Tindakan ekspor ini akan{" "}
                  <strong className="text-amber-950">dicatat di Audit Trail Lembaga</strong> dengan
                  identitas pengguna Anda, alamat IP, dan stempel waktu.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSensitiveAuditWarning(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer min-h-[40px]"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSensitiveAudit}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-700 text-white text-xs font-bold hover:bg-amber-800 transition-colors shadow-xs cursor-pointer min-h-[40px]"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span>Saya Mengerti, Lanjutkan</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
