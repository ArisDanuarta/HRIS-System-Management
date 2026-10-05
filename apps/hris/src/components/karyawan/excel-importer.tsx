"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import {
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Info,
  HelpCircle,
  Check,
  Copy,
  ChevronDown,
  Building2,
  Briefcase,
  RefreshCw,
} from "lucide-react";
import {
  importEmployeesBatchAction,
  ImportEmployeeRow,
} from "@/server/actions/employee.actions";
import {
  downloadEmployeeTemplateXlsx,
  downloadAttendanceTemplateXlsx,
  downloadOrganizationTemplateXlsx,
  DepartmentRef,
  EmploymentTypeRef,
} from "@/lib/excel-templates";
import { formatRupiah, toDateString } from "@pspk/shared";

interface ExcelImporterProps {
  departments?: DepartmentRef[];
  employmentTypes?: EmploymentTypeRef[];
}

interface ParsedPreviewRow extends ImportEmployeeRow {
  rowIndex: number;
  isValid: boolean;
  validationErrors: string[];
}

export function ExcelImporter({
  departments = [],
  employmentTypes = [],
}: ExcelImporterProps) {
  const router = useRouter();

  // Upload & File State
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedPreviewRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Active Guidance Tab
  const [activeGuideTab, setActiveGuideTab] = useState<"steps" | "dictionary" | "master">("steps");
  const [isTemplateMenuOpen, setIsTemplateMenuOpen] = useState(false);

  // Result state
  const [importResult, setImportResult] = useState<{
    importedCount: number;
    failedRows: { row: number; reason: string }[];
  } | null>(null);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // -------------------------------------------------------------
  // PARSER UNTUK BERKAS EXCEL (.xlsx / .xls) & CSV
  // -------------------------------------------------------------
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setFileSize((file.size / 1024).toFixed(1) + " KB");
    setParseError(null);
    setImportResult(null);

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const buffer = event.target?.result as ArrayBuffer;
        const workbook = XLSX.read(buffer, { type: "array", cellDates: true });

        // Ambil lembar kerja pertama (misal: "Data Pegawai" atau Sheet1)
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) {
          setParseError("File spreadsheet tidak memiliki lembar kerja (sheet).");
          return;
        }

        const worksheet = workbook.Sheets[sheetName];
        if (!worksheet) {
          setParseError("Lembar kerja kosong atau tidak dapat dibaca.");
          return;
        }

        // Konversi ke array of arrays
        const rawSheetData: (string | number | Date | null | undefined)[][] = XLSX.utils.sheet_to_json(
          worksheet,
          { header: 1, defval: "" },
        );

        if (!rawSheetData || rawSheetData.length <= 1) {
          setParseError("File spreadsheet kosong atau hanya memiliki baris header.");
          return;
        }

        // Baris 0 = Header
        const headerRow = rawSheetData[0]?.map((h) =>
          String(h || "")
            .trim()
            .toLowerCase()
            .replace(/[*_]/g, "")
            .replace(/\s+/g, " "),
        ) || [];

        // Pemetaan indeks kolom fleksibel (mendukung berbagai variasi penamaan)
        const getColIdx = (aliases: string[]) => {
          return headerRow.findIndex((h) => aliases.some((a) => h.includes(a)));
        };

        const idxFullName = getColIdx(["nama lengkap", "nama", "fullname"]);
        const idxNickname = getColIdx(["nama panggilan", "panggilan", "nickname"]);
        const idxNip = getColIdx(["nip", "nomor induk", "employeeno"]);
        const idxWorkEmail = getColIdx(["email kantor", "work email", "email resmi"]);
        const idxPersonalEmail = getColIdx(["email pribadi", "personal email"]);
        const idxPhone = getColIdx(["no hp", "whatsapp", "telepon", "phone"]);
        const idxDept = getColIdx(["divisi", "departemen", "department"]);
        const idxPos = getColIdx(["jabatan", "posisi", "position", "title"]);
        const idxContractType = getColIdx(["tipe ikatan kerja", "ikatan kerja", "tipe kontrak", "jenis kontrak"]);
        const idxWageType = getColIdx(["skema upah", "skema kompensasi", "wagetype"]);
        const idxSalary = getColIdx(["gaji pokok", "tarif", "upah", "salary", "hourly"]);
        const idxStartDate = getColIdx(["tanggal mulai", "mulai kerja", "startdate"]);
        const idxEndDate = getColIdx(["tanggal berakhir", "akhir kontrak", "enddate"]);
        const idxGender = getColIdx(["jenis kelamin", "gender"]);
        const idxMarital = getColIdx(["status pernikahan", "status nikah", "marital"]);
        const idxBankName = getColIdx(["nama bank", "bank"]);
        const idxBankAccountName = getColIdx(["nama pemilik rekening", "pemilik rekening"]);

        // Fallback urutan kolom jika header tidak terdeteksi spesifik (posisi 0 s.d 8)
        const colFullName = idxFullName !== -1 ? idxFullName : 0;
        const colNip = idxNip !== -1 ? idxNip : 2;
        const colWorkEmail = idxWorkEmail !== -1 ? idxWorkEmail : 3;

        const results: ParsedPreviewRow[] = [];

        for (let i = 1; i < rawSheetData.length; i++) {
          const row = rawSheetData[i];
          if (!row || row.every((c) => String(c).trim() === "")) continue;

          const rawFullName = String(row[colFullName] || "").trim();
          const rawNip = String(row[colNip] || "").trim();
          const rawWorkEmail = String(row[colWorkEmail] || "").trim();

          // Lewati baris kosong
          if (!rawFullName && !rawNip && !rawWorkEmail) continue;

          const rawNickname = idxNickname !== -1 ? String(row[idxNickname] || "").trim() : "";
          const rawPersonalEmail = idxPersonalEmail !== -1 ? String(row[idxPersonalEmail] || "").trim() : "";
          const rawPhone = idxPhone !== -1 ? String(row[idxPhone] || "").trim() : "";
          const rawDept = idxDept !== -1 ? String(row[idxDept] || "").trim() : "Divisi Riset";
          const rawPos = idxPos !== -1 ? String(row[idxPos] || "").trim() : "Staf Teknis Riset";
          const rawContractType = idxContractType !== -1 ? String(row[idxContractType] || "").trim() : "";
          const rawWageType = idxWageType !== -1 ? String(row[idxWageType] || "").trim() : "";
          const rawSalary = idxSalary !== -1 ? row[idxSalary] : 10000000;
          const rawStartDate = idxStartDate !== -1 ? row[idxStartDate] : "";
          const rawEndDate = idxEndDate !== -1 ? row[idxEndDate] : "";
          const rawGender = idxGender !== -1 ? String(row[idxGender] || "").trim() : "";
          const rawMarital = idxMarital !== -1 ? String(row[idxMarital] || "").trim() : "";
          const rawBankName = idxBankName !== -1 ? String(row[idxBankName] || "").trim() : "";
          const rawBankAccountName = idxBankAccountName !== -1 ? String(row[idxBankAccountName] || "").trim() : "";

          // Format Tanggal
          const parseDateVal = (val: unknown): string => {
            if (!val) return "";
            if (val instanceof Date && !isNaN(val.getTime())) {
              return toDateString(val);
            }
            const s = String(val).trim();
            if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
            // Coba parsing date string biasa
            const d = new Date(s);
            if (!isNaN(d.getTime())) return toDateString(d);
            return s;
          };

          const joinDate = parseDateVal(rawStartDate) || toDateString(new Date());
          const contractEndDate = parseDateVal(rawEndDate);

          // Normalisasi Gaji / Tarif
          let salaryNum = 10000000;
          if (typeof rawSalary === "number") {
            salaryNum = rawSalary;
          } else if (typeof rawSalary === "string") {
            const cleaned = rawSalary.replace(/[^0-9]/g, "");
            salaryNum = cleaned ? parseInt(cleaned, 10) : 10000000;
          }

          // Deteksi Skema Upah
          const isHourly =
            rawWageType.toLowerCase().includes("jam") ||
            rawWageType.toLowerCase().includes("hour") ||
            rawContractType.toLowerCase().includes("jam") ||
            rawContractType.toLowerCase().includes("freelance");

          const wageType: "MONTHLY" | "HOURLY" = isHourly ? "HOURLY" : "MONTHLY";

          // Kategori Sistem
          const contractTypeLower = rawContractType.toLowerCase();
          const employmentType: "PERMANENT" | "FIXED_TERM" | "PART_TIME_PROJECT" =
            contractTypeLower.includes("tetap") || contractTypeLower.includes("permanent")
              ? "PERMANENT"
              : contractTypeLower.includes("part") || contractTypeLower.includes("proyek") || contractTypeLower.includes("adhoc") || isHourly
              ? "PART_TIME_PROJECT"
              : "FIXED_TERM";

          // Validasi Baris
          const errors: string[] = [];
          if (!rawFullName) errors.push("Nama Lengkap wajib diisi");
          if (!rawNip) errors.push("NIP wajib diisi");
          if (!rawWorkEmail) {
            errors.push("Email Kantor wajib diisi");
          } else if (!rawWorkEmail.includes("@")) {
            errors.push("Format Email Kantor tidak valid");
          }

          results.push({
            rowIndex: i + 1,
            fullName: rawFullName,
            nickname: rawNickname || undefined,
            employeeNo: rawNip,
            workEmail: rawWorkEmail,
            personalEmail: rawPersonalEmail || undefined,
            phone: rawPhone || undefined,
            departmentName: rawDept || "Divisi Operasional & Finansial",
            positionTitle: rawPos || "Staf Teknis Riset",
            employmentType,
            employmentTypeNameOrCode: rawContractType || undefined,
            wageType,
            baseSalary: wageType === "MONTHLY" ? salaryNum : undefined,
            hourlyRate: wageType === "HOURLY" ? salaryNum : undefined,
            joinDate,
            contractEndDate: contractEndDate || undefined,
            gender: rawGender.toLowerCase().startsWith("p") ? "FEMALE" : "MALE",
            maritalStatus: rawMarital.toLowerCase().includes("nikah") ? "MARRIED" : "SINGLE",
            bankName: rawBankName || "Bank Mandiri",
            bankAccountName: rawBankAccountName || rawFullName,
            isValid: errors.length === 0,
            validationErrors: errors,
          });
        }

        if (results.length === 0) {
          setParseError("Tidak ada baris data pegawai yang valid ditemukan pada berkas.");
        } else {
          setParsedRows(results);
        }
      } catch (err: unknown) {
        console.error("Gagal membaca file Excel:", err);
        const errorMsg = err instanceof Error ? err.message : "Kesalahan format berkas";
        setParseError(`Gagal membaca berkas Excel: ${errorMsg}. Pastikan berkas berformat .xlsx, .xls, atau .csv.`);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // -------------------------------------------------------------
  // EKSEKUSI IMPOR KE DATABASE
  // -------------------------------------------------------------
  const handleExecuteImport = async () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) return;

    setIsImporting(true);
    setParseError(null);

    const payload: ImportEmployeeRow[] = validRows.map((r) => ({
      fullName: r.fullName,
      nickname: r.nickname,
      employeeNo: r.employeeNo,
      workEmail: r.workEmail,
      personalEmail: r.personalEmail,
      phone: r.phone,
      departmentName: r.departmentName,
      positionTitle: r.positionTitle,
      employmentType: r.employmentType,
      employmentTypeNameOrCode: r.employmentTypeNameOrCode,
      wageType: r.wageType,
      baseSalary: r.baseSalary,
      hourlyRate: r.hourlyRate,
      joinDate: r.joinDate,
      contractEndDate: r.contractEndDate,
      gender: r.gender,
      maritalStatus: r.maritalStatus,
      bankName: r.bankName,
      bankAccountName: r.bankAccountName,
    }));

    const res = await importEmployeesBatchAction(payload);
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

  const validCount = parsedRows.filter((r) => r.isValid).length;
  const invalidCount = parsedRows.filter((r) => !r.isValid).length;

  return (
    <div className="flex flex-col gap-6">
      {/* -------------------------------------------------------------
          CARD 1: HUB PUSAT UNDUHAN TEMPLATE EXCEL (.XLSX)
      -------------------------------------------------------------- */}
      <div className="bg-gradient-to-br from-slate-900 via-[#102E50] to-[#0c233d] text-white rounded-2xl p-6 shadow-md border border-slate-700/50 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        {/* Pattern Background Aksentuasi */}
        <div className="absolute right-0 top-0 w-80 h-full bg-white/5 pointer-events-none transform -skew-x-12 translate-x-20"></div>

        <div className="flex items-start gap-4 z-10">
          <div className="w-12 h-12 rounded-xl bg-white/10 text-[#F2AF3E] flex items-center justify-center shrink-0 border border-white/10 shadow-inner">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-base sm:text-lg text-white font-heading">
                Template Resmi Excel (.xlsx) PSPK
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F2AF3E] text-[#102E50]">
                Direkomendasikan
              </span>
            </div>
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              Berkas <strong>.xlsx</strong> multi-sheet rapi (bukan .csv). Berisi kolom berformat rapi, contoh konkret skema gaji bulanan & per jam, serta daftar master divisi dan ikatan kerja yang aktif saat ini.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 z-10 shrink-0 flex-wrap">
          {/* Tombol Utama: Unduh Template Pegawai */}
          <button
            type="button"
            onClick={() =>
              downloadEmployeeTemplateXlsx({
                departments,
                employmentTypes,
              })
            }
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#F2AF3E] text-[#102E50] hover:bg-[#e09e2d] transition-all cursor-pointer shadow-md hover:scale-[1.02] active:scale-[0.98]"
          >
            <Download className="w-4 h-4" />
            <span>Unduh Template Pegawai (.xlsx)</span>
          </button>

          {/* Dropdown Menu Template Lainnya */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsTemplateMenuOpen((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-white/10 text-white hover:bg-white/20 border border-white/20 transition-all cursor-pointer"
            >
              <span>Template Lainnya</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {isTemplateMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white text-slate-800 rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  Pilihan Template Excel
                </div>
                <button
                  type="button"
                  onClick={() => {
                    downloadAttendanceTemplateXlsx();
                    setIsTemplateMenuOpen(false);
                  }}
                  className="w-full text-left px-3.5 py-2 text-xs hover:bg-slate-50 flex items-center justify-between text-slate-700 hover:text-[#102E50]"
                >
                  <div className="flex flex-col">
                    <span className="font-semibold">Rekap Presensi (.xlsx)</span>
                    <span className="text-[10px] text-slate-400">Timesheet & log absensi</span>
                  </div>
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    downloadOrganizationTemplateXlsx();
                    setIsTemplateMenuOpen(false);
                  }}
                  className="w-full text-left px-3.5 py-2 text-xs hover:bg-slate-50 flex items-center justify-between text-slate-700 hover:text-[#102E50]"
                >
                  <div className="flex flex-col">
                    <span className="font-semibold">Struktur Organisasi (.xlsx)</span>
                    <span className="text-[10px] text-slate-400">Divisi & formasi jabatan</span>
                  </div>
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------
          CARD 2: PANDUAN PENGISIAN LENGKAP LANGSUNG DI SISTEM
      -------------------------------------------------------------- */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Tab Header Panduan */}
        <div className="flex items-center border-b border-slate-200 bg-slate-50/70 px-4 pt-2 gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveGuideTab("steps")}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeGuideTab === "steps"
                ? "border-[#102E50] text-[#102E50] bg-white rounded-t-lg"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5 text-[#102E50]" />
            <span>Petunjuk 4 Langkah</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveGuideTab("dictionary")}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeGuideTab === "dictionary"
                ? "border-[#102E50] text-[#102E50] bg-white rounded-t-lg"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Info className="w-3.5 h-3.5 text-blue-600" />
            <span>Kamus Kolom & Aturan Format</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveGuideTab("master")}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeGuideTab === "master"
                ? "border-[#102E50] text-[#102E50] bg-white rounded-t-lg"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-amber-600" />
            <span>Referensi Divisi & Ikatan Kerja PSPK ({departments.length} Divisi)</span>
          </button>
        </div>

        {/* Tab Content: 4 Langkah */}
        {activeGuideTab === "steps" && (
          <div className="p-5 grid grid-cols-1 sm:grid-cols-4 gap-4 animate-in fade-in duration-150">
            <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="w-7 h-7 rounded-full bg-[#102E50] text-white text-xs font-bold flex items-center justify-center">
                1
              </div>
              <span className="font-bold text-xs text-slate-800">Unduh Template .xlsx</span>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Gunakan tombol emas di atas untuk mendapatkan berkas Excel berformat standar.
              </p>
            </div>

            <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="w-7 h-7 rounded-full bg-[#102E50] text-white text-xs font-bold flex items-center justify-center">
                2
              </div>
              <span className="font-bold text-xs text-slate-800">Buka di Excel</span>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Isi pada lembar &ldquo;Data Pegawai&rdquo;. Format tanggal wajib <code>YYYY-MM-DD</code> (contoh: 2026-10-01).
              </p>
            </div>

            <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="w-7 h-7 rounded-full bg-[#102E50] text-white text-xs font-bold flex items-center justify-center">
                3
              </div>
              <span className="font-bold text-xs text-slate-800">Unggah & Pratinjau</span>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Tarik file ke area unggah di bawah. Sistem akan memvalidasi NIP, email, dan skema upah secara otomatis.
              </p>
            </div>

            <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="w-7 h-7 rounded-full bg-[#102E50] text-white text-xs font-bold flex items-center justify-center">
                4
              </div>
              <span className="font-bold text-xs text-slate-800">Eksekusi Impor</span>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Klik tombol &ldquo;Eksekusi Impor&rdquo;. Pegawai, kontrak, dan histori penempatan tersimpan rapi.
              </p>
            </div>
          </div>
        )}

        {/* Tab Content: Kamus Kolom */}
        {activeGuideTab === "dictionary" && (
          <div className="p-5 overflow-x-auto animate-in fade-in duration-150">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-2.5 px-3">Kolom</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Format / Aturan</th>
                  <th className="py-2.5 px-3">Contoh Valid</th>
                  <th className="py-2.5 px-3">Catatan Sistem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px] text-slate-600">
                <tr>
                  <td className="py-2 px-3 font-semibold text-slate-800">Nama Lengkap</td>
                  <td className="py-2 px-3"><span className="text-rose-600 font-bold">Wajib</span></td>
                  <td className="py-2 px-3">Teks lengkap beserta gelar</td>
                  <td className="py-2 px-3 font-mono">Dr. Aris Sudrajat M.Pd.</td>
                  <td className="py-2 px-3">Ditampilkan di seluruh laporan resmi</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold text-slate-800">NIP</td>
                  <td className="py-2 px-3"><span className="text-rose-600 font-bold">Wajib</span></td>
                  <td className="py-2 px-3">Unik di seluruh database</td>
                  <td className="py-2 px-3 font-mono">PSPK-202610-091</td>
                  <td className="py-2 px-3">Jika duplikat, baris akan dilewati demi keamanan</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold text-slate-800">Email Kantor</td>
                  <td className="py-2 px-3"><span className="text-rose-600 font-bold">Wajib</span></td>
                  <td className="py-2 px-3">Format email resmi valid</td>
                  <td className="py-2 px-3 font-mono">aris.sudrajat@pspk.id</td>
                  <td className="py-2 px-3">Digunakan sebagai username login</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold text-slate-800">No HP / WhatsApp</td>
                  <td className="py-2 px-3"><span className="text-rose-600 font-bold">Wajib</span></td>
                  <td className="py-2 px-3">Awalan 08 atau +62</td>
                  <td className="py-2 px-3 font-mono">081234567890</td>
                  <td className="py-2 px-3">Kontak operasional dan darurat</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold text-slate-800">Divisi</td>
                  <td className="py-2 px-3"><span className="text-rose-600 font-bold">Wajib</span></td>
                  <td className="py-2 px-3">Sesuai nama divisi resmi</td>
                  <td className="py-2 px-3 font-mono">Divisi Kebijakan Kurikulum</td>
                  <td className="py-2 px-3">Otomatis dibuatkan baru jika belum terdaftar</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold text-slate-800">Tipe Ikatan Kerja</td>
                  <td className="py-2 px-3"><span className="text-rose-600 font-bold">Wajib</span></td>
                  <td className="py-2 px-3">Nama atau Kode Ikatan Kerja</td>
                  <td className="py-2 px-3 font-mono">Pegawai Tetap / PKWT Riset</td>
                  <td className="py-2 px-3">Dicocokkan ke master data Ikatan Kerja HR</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold text-slate-800">Gaji Pokok / Tarif</td>
                  <td className="py-2 px-3"><span className="text-rose-600 font-bold">Wajib</span></td>
                  <td className="py-2 px-3">Angka murni tanpa titik atau Rp</td>
                  <td className="py-2 px-3 font-mono">18000000 atau 50000</td>
                  <td className="py-2 px-3">Nominal gaji bulanan atau tarif per jam</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold text-slate-800">Tanggal Mulai</td>
                  <td className="py-2 px-3"><span className="text-rose-600 font-bold">Wajib</span></td>
                  <td className="py-2 px-3">Format YYYY-MM-DD</td>
                  <td className="py-2 px-3 font-mono">2026-10-01</td>
                  <td className="py-2 px-3">Tanggal awal kerja efektif</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold text-slate-800">Tanggal Berakhir</td>
                  <td className="py-2 px-3">Kondisional</td>
                  <td className="py-2 px-3">Format YYYY-MM-DD</td>
                  <td className="py-2 px-3 font-mono">2027-09-30</td>
                  <td className="py-2 px-3">Wajib ada jika PKWT / Magang; Kosong jika Tetap</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Tab Content: Referensi Master Data */}
        {activeGuideTab === "master" && (
          <div className="p-5 space-y-4 animate-in fade-in duration-150">
            <div>
              <span className="font-bold text-xs text-[#102E50] block mb-2">
                Daftar Divisi Terdaftar di PSPK (Klik untuk Salin Nama):
              </span>
              <div className="flex flex-wrap gap-2">
                {departments.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => handleCopy(d.name)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs text-slate-700 transition-colors cursor-pointer"
                    title="Klik untuk menyalin nama divisi"
                  >
                    <Building2 className="w-3 h-3 text-slate-500" />
                    <span>{d.name}</span>
                    {copiedText === d.name ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Copy className="w-3 h-3 text-slate-400" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <span className="font-bold text-xs text-[#102E50] block mb-2">
                Daftar Master Tipe Ikatan Kerja Aktif:
              </span>
              <div className="flex flex-wrap gap-2">
                {employmentTypes.map((et) => (
                  <button
                    key={et.id}
                    type="button"
                    onClick={() => handleCopy(et.name)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-xs text-amber-900 transition-colors cursor-pointer"
                    title="Klik untuk menyalin tipe ikatan kerja"
                  >
                    <Briefcase className="w-3 h-3 text-amber-700" />
                    <span className="font-semibold">{et.name}</span>
                    <span className="text-[10px] text-amber-700/80">({et.wageType === "HOURLY" ? "Per Jam" : "Bulanan"})</span>
                    {copiedText === et.name ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Copy className="w-3 h-3 text-amber-600" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* -------------------------------------------------------------
          CARD 3: DROPZONE UNGGAH BERKAS (.xlsx, .xls, .csv)
      -------------------------------------------------------------- */}
      <div className="bg-white border-2 border-dashed border-slate-300 hover:border-[#102E50]/60 rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-3 transition-colors shadow-xs">
        <div className="w-14 h-14 rounded-2xl bg-[#102E50]/5 text-[#102E50] flex items-center justify-center border border-[#102E50]/10">
          <Upload className="w-7 h-7" />
        </div>
        <div className="flex flex-col gap-1 max-w-md">
          <span className="font-bold text-sm text-slate-800 font-heading">
            {fileName ? `Berkas Terpilih: ${fileName} (${fileSize})` : "Pilih atau Seret Berkas Spreadsheet ke Sini"}
          </span>
          <p className="text-xs text-slate-500">
            Mendukung berkas <strong>Microsoft Excel (.xlsx, .xls)</strong> dan <strong>CSV (.csv)</strong>.
          </p>
        </div>

        <label className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-[#102E50] text-white hover:bg-[#0c233d] transition-all cursor-pointer active:scale-[0.98] shadow-xs">
          <FileSpreadsheet className="w-4 h-4 text-[#F2AF3E]" />
          <span>{fileName ? "Ganti Berkas Excel" : "Pilih Berkas Excel (.xlsx)"}</span>
          <input
            type="file"
            accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>

      {/* Error Alert */}
      {parseError && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{parseError}</span>
          </div>
          <button
            type="button"
            onClick={() => setParseError(null)}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* -------------------------------------------------------------
          CARD 4: HASIL IMPOR SELESAI
      -------------------------------------------------------------- */}
      {importResult && (
        <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col gap-3 text-xs text-emerald-950 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-sm text-emerald-800">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <span>Proses Impor Pegawai Selesai</span>
            </div>
            <Link
              href="/karyawan"
              className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:underline"
            >
              <span>Buka Direktori Pegawai</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <p className="text-slate-700">
            Berhasil menambahkan <strong className="text-emerald-800 font-bold">{importResult.importedCount}</strong> data pegawai baru ke dalam sistem HRIS PSPK.
          </p>

          {importResult.failedRows.length > 0 && (
            <div className="mt-1 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 flex flex-col gap-1.5">
              <span className="font-bold text-[11px] flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                <span>{importResult.failedRows.length} Baris Data Dilewati (Gagal):</span>
              </span>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-950">
                {importResult.failedRows.map((f, idx) => (
                  <li key={idx}>
                    <strong>Baris {f.row}:</strong> {f.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                setFileName(null);
                setParsedRows([]);
                setImportResult(null);
              }}
              className="px-3.5 py-1.5 rounded-lg bg-white border border-emerald-300 text-emerald-800 text-xs font-semibold hover:bg-emerald-100/50 transition-colors"
            >
              Impor File Lainnya
            </button>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          CARD 5: PRATINJAU DATA SEBELUM EKSEKUSI IMPOR
      -------------------------------------------------------------- */}
      {parsedRows.length > 0 && !importResult && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col gap-3 animate-in fade-in duration-200">
          <div className="p-4 bg-slate-50/90 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-bold text-sm text-[#102E50] font-heading">
                Pratinjau Data ({parsedRows.length} Baris Terbaca)
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                {validCount} Siap Impor
              </span>
              {invalidCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                  {invalidCount} Perlu Perbaikan
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setParsedRows([]);
                  setFileName(null);
                }}
                className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-200/50"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={isImporting || validCount === 0}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#102E50] text-white hover:bg-[#0c233d] transition-all cursor-pointer shadow-sm active:scale-[0.98] disabled:opacity-50"
              >
                {isImporting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Menyimpan ke Database...</span>
                  </>
                ) : (
                  <>
                    <span>Eksekusi Impor ({validCount} Pegawai)</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#F2AF3E]" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Tabel Pratinjau */}
          <div className="overflow-x-auto max-h-[460px]">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 bg-slate-100 border-b border-slate-200 z-10 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3 text-center">Baris</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Pegawai</th>
                  <th className="py-2.5 px-3">NIP</th>
                  <th className="py-2.5 px-3">Divisi & Jabatan</th>
                  <th className="py-2.5 px-3">Ikatan Kerja</th>
                  <th className="py-2.5 px-3">Gaji / Tarif</th>
                  <th className="py-2.5 px-3">Mulai Kerja</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {parsedRows.map((r, idx) => (
                  <tr
                    key={idx}
                    className={`hover:bg-slate-50/70 transition-colors ${
                      !r.isValid ? "bg-rose-50/30" : ""
                    }`}
                  >
                    <td className="py-2 px-3 text-center font-mono text-slate-400">
                      {r.rowIndex}
                    </td>

                    <td className="py-2 px-3">
                      {r.isValid ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Check className="w-3 h-3" />
                          Valid
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200"
                          title={r.validationErrors.join(", ")}
                        >
                          <AlertCircle className="w-3 h-3" />
                          Gagal
                        </span>
                      )}
                    </td>

                    <td className="py-2 px-3">
                      <div className="font-semibold text-slate-900">{r.fullName}</div>
                      <div className="text-[11px] text-slate-400">{r.workEmail}</div>
                      {r.validationErrors.length > 0 && (
                        <div className="text-[10px] text-rose-600 mt-0.5 font-medium">
                          {r.validationErrors.join("; ")}
                        </div>
                      )}
                    </td>

                    <td className="py-2 px-3 font-mono font-medium text-slate-700">
                      {r.employeeNo || "-"}
                    </td>

                    <td className="py-2 px-3">
                      <div className="text-slate-800 font-medium">{r.positionTitle}</div>
                      <div className="text-[11px] text-slate-500">{r.departmentName}</div>
                    </td>

                    <td className="py-2 px-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                        {r.employmentTypeNameOrCode || r.employmentType}
                      </span>
                    </td>

                    <td className="py-2 px-3 font-mono font-semibold text-slate-800">
                      {r.wageType === "HOURLY"
                        ? `${formatRupiah(r.hourlyRate || 0)} / jam`
                        : formatRupiah(r.baseSalary || 0)}
                    </td>

                    <td className="py-2 px-3 font-mono text-slate-600">
                      {r.joinDate}
                    </td>
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
