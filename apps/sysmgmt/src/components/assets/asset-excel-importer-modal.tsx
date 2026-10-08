"use client";

import React, { useState, useRef } from "react";
import * as XLSX from "xlsx";
import {
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  X,
  FileUp,
  RefreshCw,
  Info,
  Check,
  AlertTriangle,
  Layers,
  ArrowRight,
} from "lucide-react";
import {
  importAssetsBatchAction,
  ImportAssetsBatchInput,
  FailedImportRow,
} from "@/server/actions/asset.actions";
import { downloadAssetTemplateXlsx } from "@/lib/excel-asset-templates";
import { formatRupiah } from "@pspk/shared";

interface AssetExcelImporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface ParsedAssetRow {
  rowIndex: number;
  assetTag: string;
  name: string;
  category: "IT" | "NON_IT";
  type: string;
  brand: string;
  model: string;
  serialNumber: string;
  status: "IN_STOCK" | "ASSIGNED" | "MAINTENANCE" | "RETIRED" | "LOST";
  purchaseDate: string;
  purchasePrice: number | null;
  location: string;
  notes: string;
  isValid: boolean;
  validationErrors: string[];
}

export function AssetExcelImporterModal({
  isOpen,
  onClose,
  onSuccess,
}: AssetExcelImporterModalProps) {
  // File state
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedAssetRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [previewFilter, setPreviewFilter] = useState<"ALL" | "VALID" | "INVALID">("ALL");

  // Result state
  const [importResult, setImportResult] = useState<{
    importedCount: number;
    failedRows: FailedImportRow[];
    totalProcessed: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleReset = () => {
    setFileName(null);
    setFileSize(null);
    setParsedRows([]);
    setParseError(null);
    setImportResult(null);
    setPreviewFilter("ALL");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  // -------------------------------------------------------------
  // PARSER UNTUK BERKAS EXCEL (.xlsx / .xls / .csv)
  // -------------------------------------------------------------
  const handleFileUpload = (file: File) => {
    if (!file) return;

    const sizeInKb = (file.size / 1024).toFixed(1);
    setFileName(file.name);
    setFileSize(`${sizeInKb} KB`);
    setParseError(null);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });

        // Ambil lembar kerja pertama (default: "Data Aset")
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          throw new Error("Berkas Excel tidak memiliki lembar kerja (worksheet).");
        }

        const worksheet = workbook.Sheets[firstSheetName];
        if (!worksheet) {
          throw new Error("Gagal membaca lembar kerja data aset.");
        }

        const rawSheetData: unknown[][] = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: "",
        });

        if (rawSheetData.length <= 1) {
          throw new Error(
            "Berkas tidak memuat data aset (hanya baris header atau lembar kosong)."
          );
        }

        // Baca header baris pertama
        const headerRow = (rawSheetData[0] || []).map((h) =>
          String(h).trim().toLowerCase()
        );

        const getColIdx = (aliases: string[]) => {
          return headerRow.findIndex((col) =>
            aliases.some((alias) => col === alias || col.includes(alias))
          );
        };

        const idxTag = getColIdx(["tag aset", "asset tag", "tag", "kode aset"]);
        const idxName = getColIdx(["nama aset", "nama", "name", "asset name", "perangkat"]);
        const idxCategory = getColIdx(["kategori", "category"]);
        const idxType = getColIdx(["tipe aset", "tipe", "type", "jenis aset", "jenis"]);
        const idxBrand = getColIdx(["merek", "brand", "pabrikan"]);
        const idxModel = getColIdx(["model", "model / seri", "seri", "varian"]);
        const idxSerial = getColIdx(["nomor seri", "serial number", "serial", "sn", "serial no"]);
        const idxStatus = getColIdx(["status ketersediaan", "status"]);
        const idxDate = getColIdx([
          "tanggal pembelian",
          "purchase date",
          "tgl beli",
          "tanggal perolehan",
        ]);
        const idxPrice = getColIdx([
          "harga perolehan",
          "harga pembelian",
          "harga",
          "purchase price",
          "nominal",
        ]);
        const idxLocation = getColIdx(["lokasi fisik", "lokasi", "location", "penempatan"]);
        const idxNotes = getColIdx(["catatan tambahan", "catatan", "notes", "keterangan"]);

        const parseDateVal = (val: unknown): string => {
          if (!val) return "";
          if (val instanceof Date && !isNaN(val.getTime())) {
            return val.toISOString().split("T")[0]!;
          }
          if (typeof val === "number" && val > 20000 && val < 70000) {
            const jsDate = new Date((val - (25567 + 2)) * 86400 * 1000);
            if (!isNaN(jsDate.getTime())) {
              return jsDate.toISOString().split("T")[0]!;
            }
          }
          const s = String(val).trim();
          if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
          const dmy = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
          if (dmy && dmy[1] && dmy[2] && dmy[3]) {
            return `${dmy[3]}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`;
          }
          const d = new Date(s);
          if (!isNaN(d.getTime())) {
            return d.toISOString().split("T")[0]!;
          }
          return "";
        };

        const parsePriceVal = (val: unknown): number | null => {
          if (val === null || val === undefined || val === "") return null;
          if (typeof val === "number") return val >= 0 ? val : null;
          const cleaned = String(val).replace(/[^0-9]/g, "");
          return cleaned ? parseInt(cleaned, 10) : null;
        };

        const parseCategoryVal = (val: unknown): "IT" | "NON_IT" => {
          const s = String(val || "").toUpperCase().trim();
          if (s.includes("NON") || s === "NON_IT" || s === "NON-IT") return "NON_IT";
          return "IT";
        };

        const parseStatusVal = (
          val: unknown
        ): "IN_STOCK" | "ASSIGNED" | "MAINTENANCE" | "RETIRED" | "LOST" => {
          const s = String(val || "").toUpperCase().trim();
          if (s.includes("PINJAM") || s === "ASSIGNED") return "ASSIGNED";
          if (s.includes("PERBAIKAN") || s.includes("SERVIS") || s === "MAINTENANCE")
            return "MAINTENANCE";
          if (s.includes("PENSIUN") || s.includes("RUSAK") || s === "RETIRED") return "RETIRED";
          if (s.includes("HILANG") || s === "LOST") return "LOST";
          return "IN_STOCK";
        };

        const rows: ParsedAssetRow[] = [];
        const seenTagsInFile = new Set<string>();

        for (let i = 1; i < rawSheetData.length; i++) {
          const row = rawSheetData[i];
          if (!row || row.every((c) => String(c).trim() === "")) continue;

          const rawTag = idxTag !== -1 ? String(row[idxTag] || "").trim() : "";
          const rawName = idxName !== -1 ? String(row[idxName] || "").trim() : "";
          const rawType = idxType !== -1 ? String(row[idxType] || "").trim() : "";
          const rawLocation = idxLocation !== -1 ? String(row[idxLocation] || "").trim() : "";

          // Abaikan baris jika nama dan tipe sama-sama kosong
          if (!rawName && !rawType && !rawTag) continue;

          const rawCat = idxCategory !== -1 ? row[idxCategory] : "IT";
          const rawBrand = idxBrand !== -1 ? String(row[idxBrand] || "").trim() : "";
          const rawModel = idxModel !== -1 ? String(row[idxModel] || "").trim() : "";
          const rawSerial = idxSerial !== -1 ? String(row[idxSerial] || "").trim() : "";
          const rawStatus = idxStatus !== -1 ? row[idxStatus] : "IN_STOCK";
          const rawDate = idxDate !== -1 ? row[idxDate] : "";
          const rawPrice = idxPrice !== -1 ? row[idxPrice] : null;
          const rawNotes = idxNotes !== -1 ? String(row[idxNotes] || "").trim() : "";

          const category = parseCategoryVal(rawCat);
          const status = parseStatusVal(rawStatus);
          const purchaseDate = parseDateVal(rawDate);
          const purchasePrice = parsePriceVal(rawPrice);

          const errors: string[] = [];

          if (!rawName || rawName.length < 2) {
            errors.push("Nama aset minimal 2 karakter.");
          }
          if (!rawType || rawType.length < 1) {
            errors.push("Tipe aset (mis. Laptop, Monitor, Meja) wajib diisi.");
          }
          if (!rawLocation || rawLocation.length < 1) {
            errors.push("Lokasi fisik penempatan wajib diisi.");
          }

          if (rawTag) {
            const upper = rawTag.toUpperCase();
            if (seenTagsInFile.has(upper)) {
              errors.push(`Tag "${rawTag}" duplikat di dalam berkas.`);
            } else {
              seenTagsInFile.add(upper);
            }
          }

          rows.push({
            rowIndex: i + 1,
            assetTag: rawTag,
            name: rawName,
            category,
            type: rawType || "Perangkat Kantor",
            brand: rawBrand,
            model: rawModel,
            serialNumber: rawSerial,
            status,
            purchaseDate,
            purchasePrice,
            location: rawLocation,
            notes: rawNotes,
            isValid: errors.length === 0,
            validationErrors: errors,
          });
        }

        if (rows.length === 0) {
          throw new Error("Tidak ada baris data aset yang valid ditemukan.");
        }

        setParsedRows(rows);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Gagal memproses berkas Excel.";
        setParseError(msg);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  };

  // -------------------------------------------------------------
  // EKSEKUSI IMPOR KE SERVER ACTION
  // -------------------------------------------------------------
  const handleExecuteImport = async () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) return;

    setIsImporting(true);
    setParseError(null);

    try {
      const payload: ImportAssetsBatchInput = {
        rows: validRows.map((r) => ({
          assetTag: r.assetTag || undefined,
          name: r.name,
          category: r.category,
          type: r.type,
          brand: r.brand || undefined,
          model: r.model || undefined,
          serialNumber: r.serialNumber || undefined,
          status: r.status,
          purchaseDate: r.purchaseDate || undefined,
          purchasePrice: r.purchasePrice !== null ? r.purchasePrice : undefined,
          location: r.location,
          notes: r.notes || undefined,
        })),
      };

      const result = await importAssetsBatchAction(payload);

      if (!result.ok) {
        setParseError(result.error);
      } else {
        setImportResult({
          importedCount: result.importedCount,
          failedRows: result.failedRows,
          totalProcessed: result.totalProcessed,
        });
        if (onSuccess) onSuccess();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat mengimpor aset.";
      setParseError(msg);
    } finally {
      setIsImporting(false);
    }
  };

  const validCount = parsedRows.filter((r) => r.isValid).length;
  const invalidCount = parsedRows.filter((r) => !r.isValid).length;

  const displayedRows = parsedRows.filter((r) => {
    if (previewFilter === "VALID") return r.isValid;
    if (previewFilter === "INVALID") return !r.isValid;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden my-6">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#102E50]/10 text-[#102E50] flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-[#102E50]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 font-serif">
                Impor Massal Inventaris Aset
              </h2>
              <p className="text-xs text-slate-500">
                Unggah spreadsheet Excel (.xlsx) untuk mendaftarkan aset dan inventaris lembaga secara massal.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Isi Modal */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* Skenario 1: Hasil Impor Selesai */}
          {importResult ? (
            <div className="space-y-6 py-4 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-serif">
                  Impor Aset Selesai Diproses!
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Berhasil menyimpan{" "}
                  <strong className="text-emerald-700 font-semibold">
                    {importResult.importedCount} aset baru
                  </strong>{" "}
                  ke dalam katalog inventaris PSPK.
                </p>
              </div>

              {/* Detail baris gagal jika ada */}
              {importResult.failedRows.length > 0 && (
                <div className="text-left bg-rose-50 border border-rose-200 rounded-xl p-4 max-w-2xl mx-auto space-y-2">
                  <div className="flex items-center gap-2 text-rose-800 text-xs font-bold">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>
                      {importResult.failedRows.length} Baris Gagal Disimpan (Dilewati):
                    </span>
                  </div>
                  <div className="max-h-40 overflow-y-auto divide-y divide-rose-100 text-[11px] text-rose-700">
                    {importResult.failedRows.map((f, idx) => (
                      <div key={idx} className="py-1.5 flex items-start justify-between gap-4">
                        <span>
                          <strong>Baris #{f.row}</strong> ({f.name}): {f.reason}
                        </span>
                        {f.assetTag && (
                          <span className="font-mono text-rose-900 shrink-0">{f.assetTag}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-6 py-2.5 bg-[#102E50] text-white text-xs font-semibold rounded-lg hover:bg-[#1a4473] transition-colors shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4 text-[#F2AF3E]" />
                  <span>Selesai & Lihat Katalog Aset</span>
                </button>
              </div>
            </div>
          ) : parsedRows.length === 0 ? (
            /* Skenario 2: Belum Unggah File */
            <div className="space-y-6">
              {/* Card Banner Unduh Template */}
              <div className="bg-[#102E50]/5 border border-[#102E50]/15 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#102E50] text-white flex items-center justify-center shrink-0">
                    <Download className="w-5 h-5 text-[#F2AF3E]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#102E50]">
                      Belum Memiliki Format Spreadsheet yang Tepat?
                    </h4>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Gunakan template resmi Microsoft Excel (.xlsx) PSPK lengkap dengan panduan kolom dan kamus kategori IT/Non-IT.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={downloadAssetTemplateXlsx}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#102E50] text-white text-xs font-semibold rounded-lg hover:bg-[#1a4473] transition-colors shadow-2xs shrink-0 self-stretch sm:self-auto justify-center"
                >
                  <Download className="w-3.5 h-3.5 text-[#F2AF3E]" />
                  <span>Unduh Template .xlsx</span>
                </button>
              </div>

              {/* Area Drag & Drop */}
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-[#102E50] hover:bg-slate-50/70 transition-all rounded-2xl p-8 text-center cursor-pointer flex flex-col items-center justify-center gap-3 group"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleInputChange}
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                />
                <div className="w-14 h-14 rounded-full bg-slate-100 group-hover:bg-[#102E50]/10 text-slate-500 group-hover:text-[#102E50] transition-colors flex items-center justify-center">
                  <FileUp className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    Pilih Berkas Spreadsheet atau Seret ke Sini
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Mendukung format Microsoft Excel <strong>.xlsx</strong>, <strong>.xls</strong>, dan berkas <strong>.csv</strong> (Maksimal 10 MB)
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 group-hover:bg-[#102E50] text-slate-700 group-hover:text-white text-xs font-semibold transition-colors mt-2">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Jelajahi Berkas Komputer</span>
                </span>
              </div>

              {/* Info Tips & Aturan */}
              <div className="rounded-xl border border-slate-200 p-4 bg-slate-50 text-[11px] text-slate-600 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <Info className="w-3.5 h-3.5 text-[#102E50]" />
                  <span>Petunjuk Penting Sebelum Mengimpor:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1">
                  <li>
                    Kolom <strong>Nama Aset</strong>, <strong>Kategori (IT / NON_IT)</strong>, <strong>Tipe Aset</strong>, dan <strong>Lokasi Fisik</strong> wajib diisi.
                  </li>
                  <li>
                    Kolom <strong>Tag Aset</strong> dapat dikosongkan jika Anda ingin sistem PSPK membuatkan kode unik otomatis secara berurutan.
                  </li>
                  <li>
                    Format tanggal yang didukung adalah <code>YYYY-MM-DD</code> (mis. <code>2026-01-15</code>) atau tanggal kalender bawaan Excel.
                  </li>
                  <li>
                    Harga perolehan cukup diisi angka murni tanpa simbol Rupiah atau tanda titik pemisah ribuan.
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            /* Skenario 3: Pratinjau Tabel Data Aset */
            <div className="space-y-4">
              {/* Ringkasan Berkas & Baris */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#102E50] text-white flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="w-5 h-5 text-[#F2AF3E]" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block truncate max-w-xs sm:max-w-md">
                      {fileName}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Ukuran: {fileSize} • Terdeteksi: <strong>{parsedRows.length} baris</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:text-rose-600 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Ganti Berkas</span>
                  </button>
                </div>
              </div>

              {/* Filter Tabs Baris */}
              <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewFilter("ALL")}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                      previewFilter === "ALL"
                        ? "bg-[#102E50] text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    Semua ({parsedRows.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewFilter("VALID")}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                      previewFilter === "VALID"
                        ? "bg-emerald-600 text-white"
                        : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    }`}
                  >
                    <Check className="w-3 h-3" />
                    <span>Siap Impor ({validCount})</span>
                  </button>
                  {invalidCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setPreviewFilter("INVALID")}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                        previewFilter === "INVALID"
                          ? "bg-rose-600 text-white"
                          : "bg-rose-50 text-rose-700 hover:bg-rose-100"
                      }`}
                    >
                      <AlertCircle className="w-3 h-3" />
                      <span>Bermasalah ({invalidCount})</span>
                    </button>
                  )}
                </div>

                <span className="text-[11px] text-slate-500 hidden sm:inline">
                  {validCount} dari {parsedRows.length} baris siap disimpan
                </span>
              </div>

              {/* Tabel Pratinjau Baris */}
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-600 sticky top-0 border-b border-slate-200 z-10">
                    <tr>
                      <th className="py-2.5 px-3 font-semibold text-center w-12">#</th>
                      <th className="py-2.5 px-3 font-semibold w-24">Status</th>
                      <th className="py-2.5 px-3 font-semibold">Tag Aset</th>
                      <th className="py-2.5 px-3 font-semibold">Nama & Tipe</th>
                      <th className="py-2.5 px-3 font-semibold">Merek / Seri</th>
                      <th className="py-2.5 px-3 font-semibold">Harga</th>
                      <th className="py-2.5 px-3 font-semibold">Lokasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayedRows.map((row) => (
                      <tr
                        key={row.rowIndex}
                        className={row.isValid ? "hover:bg-slate-50/70" : "bg-rose-50/40 hover:bg-rose-50/70"}
                      >
                        <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px]">
                          {row.rowIndex}
                        </td>
                        <td className="py-2 px-3">
                          {row.isValid ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              <Check className="w-2.5 h-2.5" />
                              Valid
                            </span>
                          ) : (
                            <span
                              title={row.validationErrors.join(", ")}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 cursor-help"
                            >
                              <AlertCircle className="w-2.5 h-2.5" />
                              Error
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 font-mono text-[11px]">
                          {row.assetTag ? (
                            <span className="font-semibold text-slate-800">{row.assetTag}</span>
                          ) : (
                            <span className="italic text-slate-400 text-[10px]">Auto-Tag</span>
                          )}
                        </td>
                        <td className="py-2 px-3">
                          <span className="font-semibold text-slate-900 block truncate max-w-[200px]">
                            {row.name}
                          </span>
                          <span className="text-[10px] text-slate-500 flex items-center gap-1">
                            <span className="font-medium text-[#102E50]">{row.category}</span> • {row.type}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-600">
                          <span className="block truncate max-w-[140px]">
                            {row.brand || "-"}
                          </span>
                          {row.model && (
                            <span className="text-[10px] text-slate-400 block truncate max-w-[140px]">
                              {row.model}
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-slate-700 whitespace-nowrap">
                          {row.purchasePrice !== null ? formatRupiah(row.purchasePrice) : "-"}
                        </td>
                        <td className="py-2 px-3 text-slate-600 truncate max-w-[140px]">
                          {row.location}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Alert jika ada baris bermasalah */}
              {invalidCount > 0 && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">
                      Terdapat {invalidCount} baris data yang bermasalah.
                    </span>{" "}
                    Baris yang bermasalah akan dilewati secara otomatis saat proses impor dijalankan.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Pesan Kesalahan Global jika ada */}
          {parseError && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{parseError}</span>
            </div>
          )}
        </div>

        {/* Footer Aksi Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200/80 bg-slate-50/50">
          <button
            type="button"
            onClick={handleClose}
            disabled={isImporting}
            className="px-4 py-2 border border-slate-200 text-slate-600 hover:text-slate-800 text-xs font-semibold rounded-lg hover:bg-slate-100 transition-colors"
          >
            {importResult ? "Tutup" : "Batal"}
          </button>

          {!importResult && parsedRows.length > 0 && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={isImporting || validCount === 0}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#102E50] text-white text-xs font-semibold rounded-lg hover:bg-[#1a4473] disabled:opacity-50 transition-colors shadow-xs"
              >
                {isImporting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#F2AF3E]" />
                    <span>Mengimpor {validCount} Aset...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#F2AF3E]" />
                    <span>Mulai Impor ({validCount} Aset Valid)</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
