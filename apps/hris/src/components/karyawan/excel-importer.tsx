"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import {
  importEmployeesBatchAction,
  ImportEmployeeRow,
} from "@/server/actions/employee.actions";

export function ExcelImporter() {
  const router = useRouter();
  const [parsedRows, setParsedRows] = useState<ImportEmployeeRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    importedCount: number;
    failedRows: { row: number; reason: string }[];
  } | null>(null);

  // Download template CSV
  const handleDownloadTemplate = () => {
    const csvContent =
      "Nama Lengkap,NIP,Email Kantor,No HP,Divisi,Posisi,Tipe Kontrak,Gaji Pokok,Tanggal Mulai\n" +
      "Dr. Aris Sudrajat M.Pd.,PSPK-202610-091,aris.sudrajat@pspk.example,+628123456789,Divisi Kebijakan Kurikulum & Pembelajaran,Peneliti Kebijakan Kurikulum Utama,PERMANENT,18000000,2026-10-01\n" +
      "Nadia Utami S.Si.,PSPK-202610-092,nadia.utami@pspk.example,+628987654321,Divisi Asesmen & Standar Pendidikan,Spesialis Asesmen & Evaluasi,FIXED_TERM,12000000,2026-10-01\n";

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "template-impor-pegawai-pspk.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Parse CSV File
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setParseError(null);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");

        if (lines.length <= 1) {
          setParseError("File CSV kosong atau hanya berisi header.");
          return;
        }

        // Header: Nama Lengkap, NIP, Email Kantor, No HP, Divisi, Posisi, Tipe Kontrak, Gaji Pokok, Tanggal Mulai
        const rows: ImportEmployeeRow[] = [];

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i];
          if (!line) continue;
          const cols = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));

          if (cols.length < 5) continue;

          const fullName = cols[0] || "";
          const employeeNo = cols[1] || "";
          const workEmail = cols[2] || "";
          const phone = cols[3] || "";
          const departmentName = cols[4] || "Divisi Operasional & Sumber Daya Manusia";
          const positionTitle = cols[5] || "Staf Teknis Riset";
          const contractTypeRaw = (cols[6] || "").toUpperCase();
          const employmentType: "PERMANENT" | "FIXED_TERM" | "PART_TIME_PROJECT" =
            contractTypeRaw.includes("FIXED") || contractTypeRaw.includes("PKWT")
              ? "FIXED_TERM"
              : contractTypeRaw.includes("PART") || contractTypeRaw.includes("PROYEK")
                ? "PART_TIME_PROJECT"
                : "PERMANENT";
          const baseSalary = cols[7] ? Number(cols[7].replace(/[^0-9]/g, "")) : 10000000;
          const joinDate = cols[8] || new Date().toISOString().split("T")[0];

          if (fullName && employeeNo && workEmail) {
            rows.push({
              fullName,
              employeeNo,
              workEmail,
              phone,
              departmentName,
              positionTitle,
              employmentType,
              baseSalary,
              joinDate: joinDate || new Date().toISOString().slice(0, 10),
            });
          }
        }

        if (rows.length === 0) {
          setParseError("Tidak ada baris data yang valid ditemukan pada file.");
        } else {
          setParsedRows(rows);
        }
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : "Kesalahan format file";
        setParseError(`Gagal membaca file: ${errorMsg}`);
      }
    };

    reader.readAsText(file);
  };

  const handleExecuteImport = async () => {
    if (parsedRows.length === 0) return;

    setIsImporting(true);
    setParseError(null);

    const res = await importEmployeesBatchAction(parsedRows);
    setIsImporting(false);

    if (res.ok && res.data) {
      setImportResult(res.data);
      if (res.data.importedCount > 0) {
        router.refresh();
      }
    } else {
      setParseError(res.error || "Gagal mengeksekusi impor data.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Action Banner: Download Template */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#102E50]/10 text-[#102E50] flex items-center justify-center shrink-0">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm text-slate-800 font-heading">
              Gunakan Format Template Resmi PSPK
            </span>
            <span className="text-xs text-slate-500">
              Unduh berkas template spreadsheet (.csv) agar pemetaan kolom data sesuai dengan sistem HRIS.
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDownloadTemplate}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 transition-all cursor-pointer shrink-0 shadow-xs active:scale-[0.98]"
        >
          <Download className="w-3.5 h-3.5 text-[#102E50]" />
          <span>Unduh Template CSV</span>
        </button>
      </div>

      {/* Upload Dropzone */}
      <div className="bg-white border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center text-center gap-3 hover:border-[#102E50]/50 transition-colors">
        <div className="w-12 h-12 rounded-full bg-[#102E50]/5 text-[#102E50] flex items-center justify-center">
          <Upload className="w-6 h-6" />
        </div>
        <div className="flex flex-col gap-1 max-w-sm">
          <span className="font-semibold text-sm text-slate-800">
            {fileName ? `File terpilih: ${fileName}` : "Pilih atau Seret Berkas Spreadsheet ke Sini"}
          </span>
          <span className="text-xs text-slate-400">
            Mendukung berkas CSV terpisah koma (.csv) dengan header kolom yang sesuai
          </span>
        </div>

        <label className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#102E50] text-white hover:bg-[#0c233d] transition-all cursor-pointer active:scale-[0.98] shadow-xs">
          <span>{fileName ? "Ganti Berkas" : "Pilih Berkas CSV"}</span>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>

      {parseError && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-[#A8281C] text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{parseError}</span>
        </div>
      )}

      {/* Import Results Banner */}
      {importResult && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col gap-2 text-xs text-emerald-950">
          <div className="flex items-center gap-2 font-bold text-sm text-emerald-800">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>Proses Impor Selesai</span>
          </div>
          <p>
            Berhasil menambahkan <strong>{importResult.importedCount}</strong> pegawai baru ke dalam database.
          </p>

          {importResult.failedRows.length > 0 && (
            <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 flex flex-col gap-1">
              <span className="font-bold text-[11px]">
                {importResult.failedRows.length} Baris Data Dilewati (Gagal):
              </span>
              <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                {importResult.failedRows.map((f, idx) => (
                  <li key={idx}>
                    Baris {f.row}: {f.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Data Preview Table */}
      {parsedRows.length > 0 && !importResult && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col gap-3">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-[#102E50] font-heading">
                Pratinjau Data ({parsedRows.length} Pegawai Siap Diimpor)
              </span>
            </div>

            <button
              type="button"
              onClick={handleExecuteImport}
              disabled={isImporting}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#feba48] text-[#102E50] hover:bg-[#e5a63d] transition-all cursor-pointer shadow-xs active:scale-[0.98] disabled:opacity-50"
            >
              <span>{isImporting ? "Memproses Transaksi..." : "Eksekusi Impor ke Database"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                  <th className="py-2.5 px-3">No</th>
                  <th className="py-2.5 px-3">Nama Lengkap</th>
                  <th className="py-2.5 px-3">NIP</th>
                  <th className="py-2.5 px-3">Email Kantor</th>
                  <th className="py-2.5 px-3">Divisi</th>
                  <th className="py-2.5 px-3">Posisi</th>
                  <th className="py-2.5 px-3">Kontrak</th>
                  <th className="py-2.5 px-3">Tgl Mulai</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {parsedRows.map((r, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70">
                    <td className="py-2 px-3 text-slate-400 font-sans">{idx + 1}</td>
                    <td className="py-2 px-3 font-semibold text-slate-800 font-sans">
                      {r.fullName}
                    </td>
                    <td className="py-2 px-3 font-bold text-[#102E50]">{r.employeeNo}</td>
                    <td className="py-2 px-3 text-slate-600">{r.workEmail}</td>
                    <td className="py-2 px-3 text-slate-600 font-sans">{r.departmentName}</td>
                    <td className="py-2 px-3 text-slate-600 font-sans">{r.positionTitle}</td>
                    <td className="py-2 px-3 font-sans">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {r.employmentType}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-500">{r.joinDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
