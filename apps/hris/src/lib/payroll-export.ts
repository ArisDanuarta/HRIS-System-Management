import ExcelJS from "exceljs";
import { prisma } from "@pspk/db";
import { decryptField } from "@pspk/shared";

// PSPK Official Brand Color Palette (Hex ARGB)
const PSPK_NAVY = "FF102E50"; // Brand Navy Primary
const PSPK_GOLD = "FFF2AF3E"; // Brand Gold Accent
const NAVY_SUBHEADER = "FF1E3A5F"; // Deep Slate Blue for subheaders
const BORDER_COLOR = "FFCBD5E1"; // Slate 300
const HEADER_BORDER = "FF94A3B8"; // Slate 400
const ZEBRA_ROW = "FFF8FAFC"; // Slate 50
const SUMMARY_BG = "FFF1F5F9"; // Slate 100
const SENDER_BG = "FFFEF3C7"; // Amber 100

const thinBorder: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: BORDER_COLOR } },
  left: { style: "thin", color: { argb: BORDER_COLOR } },
  bottom: { style: "thin", color: { argb: BORDER_COLOR } },
  right: { style: "thin", color: { argb: BORDER_COLOR } },
};

const doubleBottomBorder: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: BORDER_COLOR } },
  left: { style: "thin", color: { argb: BORDER_COLOR } },
  bottom: { style: "double", color: { argb: PSPK_NAVY } },
  right: { style: "thin", color: { argb: BORDER_COLOR } },
};

const headerBorder: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: HEADER_BORDER } },
  left: { style: "thin", color: { argb: HEADER_BORDER } },
  bottom: { style: "thin", color: { argb: HEADER_BORDER } },
  right: { style: "thin", color: { argb: HEADER_BORDER } },
};

const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export interface GeneratePayrollExcelResult {
  filename: string;
  base64: string;
}

/**
 * Menghasilkan berkas Excel resmi (.xlsx) berstandar Enterprise
 * untuk Rekapitulasi Penggajian & Transfer Perbankan PSPK:
 * 1. Rekap Transfer Bank (Disbursement List siap diajukan ke Bank)
 * 2. Rincian Komponen Gaji (Payroll Ledger lengkap dengan formula breakdown)
 * 3. Ringkasan Eksekutif (Executive Summary & rekapitulasi per unit kerja/divisi)
 */
export async function generatePayrollExcelExport(periodId: string): Promise<GeneratePayrollExcelResult> {
  const [period, setting] = await Promise.all([
    prisma.payrollPeriod.findUnique({
      where: { id: periodId },
      include: {
        payslips: {
          include: {
            employee: {
              include: {
                currentDepartment: true,
                currentPosition: true,
              },
            },
            lines: true,
          },
          orderBy: [
            { employee: { employeeNo: "asc" } },
          ],
        },
      },
    }),
    prisma.payrollSetting.findFirst(),
  ]);

  if (!period) {
    throw new Error("Periode penggajian tidak ditemukan.");
  }

  const monthLabel = MONTH_NAMES[period.month - 1] || `Bulan ${period.month}`;
  const periodTitle = `Gaji ${period.kind === "REGULAR" ? "Reguler" : period.kind} - ${monthLabel} ${period.year}`;
  const currentDateFormatted = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Dekripsi rekening pengirim (kantor PSPK)
  let senderAccount = "-";
  if (setting?.senderBankAccountEnc) {
    try {
      senderAccount = decryptField(setting.senderBankAccountEnc);
    } catch {
      senderAccount = "[Terenkripsi]";
    }
  }

  const institutionName = setting?.institutionName || "Pusat Studi Pendidikan & Kebijakan";
  const senderBankInfo = `${setting?.senderBankName || "Bank Mandiri / BNI"} — No. Rek: ${senderAccount} a.n. ${setting?.senderAccountName || institutionName} (${setting?.senderBranch || "Kantor Pusat"})`;

  const wb = new ExcelJS.Workbook();
  wb.creator = "Portal HRIS PSPK";
  wb.lastModifiedBy = "Portal HRIS PSPK";
  wb.created = new Date();
  wb.modified = new Date();

  // =========================================================================
  // SHEET 1: REKAP TRANSFER BANK (DISBURSEMENT LIST)
  // =========================================================================
  const wsBank = wb.addWorksheet("Rekap Transfer Bank", {
    views: [{ state: "frozen", ySplit: 6 }],
  });

  const TOTAL_BANK_COLS = 11;

  // 1. Banner Kop Lembaga
  wsBank.mergeCells(1, 1, 1, TOTAL_BANK_COLS);
  const title1 = wsBank.getCell(1, 1);
  title1.value = institutionName.toUpperCase();
  title1.font = { name: "Calibri", size: 13, bold: true, color: { argb: "FFFFFFFF" } };
  title1.fill = { type: "pattern", pattern: "solid", fgColor: { argb: PSPK_NAVY } };
  title1.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  wsBank.getRow(1).height = 32;

  // 2. Judul Laporan Transfer
  wsBank.mergeCells(2, 1, 2, TOTAL_BANK_COLS);
  const title2 = wsBank.getCell(2, 1);
  title2.value = `DAFTAR INSTRUKSI TRANSFER PAYROLL GAJI KARYAWAN — ${periodTitle.toUpperCase()}`;
  title2.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
  title2.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY_SUBHEADER } };
  title2.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  wsBank.getRow(2).height = 24;

  // 3. Subtitle Metadata
  wsBank.mergeCells(3, 1, 3, TOTAL_BANK_COLS);
  const subMeta = wsBank.getCell(3, 1);
  const cutoffLabel = period.cutoffDate
    ? new Date(period.cutoffDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
    : "Akhir Bulan";
  subMeta.value = `Periode: ${monthLabel} ${period.year} (${period.kind}) | Cut-Off: ${cutoffLabel} | Status: ${period.status} | Total Diproses: ${period.payslips.length} Pegawai | Dicetak: ${currentDateFormatted}`;
  subMeta.font = { name: "Calibri", size: 9, italic: true, color: { argb: "FF334155" } };
  subMeta.fill = { type: "pattern", pattern: "solid", fgColor: { argb: SUMMARY_BG } };
  subMeta.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  wsBank.getRow(3).height = 20;

  // 4. Baris Sumber Rekening Lembaga
  wsBank.mergeCells(4, 1, 4, TOTAL_BANK_COLS);
  const bankMeta = wsBank.getCell(4, 1);
  bankMeta.value = `Rekening Sumber Dana Lembaga: ${senderBankInfo}`;
  bankMeta.font = { name: "Calibri", size: 9.5, bold: true, color: { argb: "FF92400E" } };
  bankMeta.fill = { type: "pattern", pattern: "solid", fgColor: { argb: SENDER_BG } };
  bankMeta.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  wsBank.getRow(4).height = 22;

  // 5. Spacing
  wsBank.getRow(5).height = 8;

  // 6. Header Kolom
  const bankHeaders = [
    { header: "No", key: "no", width: 6, align: "center" as const },
    { header: "NIP", key: "nip", width: 18, align: "center" as const },
    { header: "Nama Lengkap Pegawai", key: "name", width: 28, align: "left" as const },
    { header: "Divisi / Unit Kerja", key: "dept", width: 32, align: "left" as const },
    { header: "Jabatan", key: "pos", width: 24, align: "left" as const },
    { header: "Skema Kerja", key: "scheme", width: 16, align: "center" as const },
    { header: "Nama Bank Penerima", key: "bank", width: 22, align: "left" as const },
    { header: "Nomor Rekening", key: "account", width: 22, align: "center" as const },
    { header: "Atas Nama Rekening", key: "accountName", width: 28, align: "left" as const },
    { header: "Nominal Transfer (Rp)", key: "amount", width: 24, align: "right" as const },
    { header: "Keterangan / Berita Transfer", key: "note", width: 34, align: "left" as const },
  ];

  const headerRow = wsBank.getRow(6);
  headerRow.height = 28;

  bankHeaders.forEach((col, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = col.header;
    cell.font = { name: "Calibri", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: PSPK_NAVY } };
    cell.alignment = { vertical: "middle", horizontal: col.align };
    cell.border = headerBorder;
    wsBank.getColumn(idx + 1).width = col.width;
  });

  // 7. Pengisian Baris Data
  const startRow = 7;
  period.payslips.forEach((p, idx) => {
    const rowIdx = startRow + idx;
    const row = wsBank.getRow(rowIdx);
    row.height = 22;

    const isZebra = idx % 2 === 1;
    const rowBg = isZebra ? ZEBRA_ROW : "FFFFFFFF";

    let plainAccount = "-";
    if (p.employee.bankAccountEnc) {
      try {
        plainAccount = decryptField(p.employee.bankAccountEnc);
      } catch {
        plainAccount = "[Terenkripsi]";
      }
    }

    const schemeLabel = p.wageType === "HOURLY" ? "Per Jam (PKWT)" : "Bulanan";
    const transferNote = p.wageType === "HOURLY"
      ? `Upah Timesheet PSPK ${monthLabel} ${period.year} - ${p.employee.employeeNo}`
      : `Payroll PSPK ${monthLabel} ${period.year} - ${p.employee.employeeNo}`;

    const values = [
      idx + 1,
      p.employee.employeeNo,
      p.employee.fullName,
      p.employee.currentDepartment?.name || "-",
      p.employee.currentPosition?.title || "-",
      schemeLabel,
      p.employee.bankName || "-",
      plainAccount,
      p.employee.bankAccountName || p.employee.fullName,
      Number(p.netAmount),
      transferNote,
    ];

    values.forEach((val, colIdx) => {
      const cell = row.getCell(colIdx + 1);
      const colDef = bankHeaders[colIdx];
      cell.value = val;
      cell.font = { name: "Calibri", size: 9.5, color: { argb: "FF0F172A" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: rowBg } };
      cell.border = thinBorder;
      cell.alignment = {
        vertical: "middle",
        horizontal: colDef?.align || "left",
        indent: colDef?.align === "left" ? 1 : 0,
      };

      // Format khusus teks untuk nomor rekening agar angka 0 di depan tidak hilang & tidak terpotong ilmiah
      if (colIdx === 7) {
        cell.numFmt = "@";
      }

      // Format angka rupiah untuk nominal transfer
      if (colIdx === 9) {
        cell.numFmt = "#,##0";
        cell.font = { name: "Calibri", size: 9.5, bold: true, color: { argb: "FF0F172A" } };
      }
    });
  });

  const endRow = startRow + period.payslips.length - 1;
  const totalRowIdx = endRow + 1;
  const totalRow = wsBank.getRow(totalRowIdx);
  totalRow.height = 26;

  // Merge A s/d I untuk label Total
  wsBank.mergeCells(totalRowIdx, 1, totalRowIdx, 9);
  const totalLabelCell = wsBank.getCell(totalRowIdx, 1);
  totalLabelCell.value = "TOTAL DIBAYARKAN (TRANSFER GAJI NETTO)";
  totalLabelCell.font = { name: "Calibri", size: 10, bold: true, color: { argb: PSPK_NAVY } };
  totalLabelCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: SUMMARY_BG } };
  totalLabelCell.alignment = { vertical: "middle", horizontal: "right", indent: 1 };
  totalLabelCell.border = thinBorder;

  // Border untuk cells yang ter-merge
  for (let c = 2; c <= 9; c++) {
    totalRow.getCell(c).border = thinBorder;
  }

  // Cell Kolom J: Formula SUM
  const totalSumCell = totalRow.getCell(10);
  if (period.payslips.length > 0) {
    totalSumCell.value = { formula: `SUM(J${startRow}:J${endRow})` };
  } else {
    totalSumCell.value = 0;
  }
  totalSumCell.font = { name: "Calibri", size: 11, bold: true, color: { argb: PSPK_NAVY } };
  totalSumCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: SUMMARY_BG } };
  totalSumCell.alignment = { vertical: "middle", horizontal: "right" };
  totalSumCell.numFmt = "#,##0";
  totalSumCell.border = doubleBottomBorder;

  // Cell Kolom K: Catatan total penerima
  const totalNoteCell = totalRow.getCell(11);
  totalNoteCell.value = `${period.payslips.length} Pegawai Penerima`;
  totalNoteCell.font = { name: "Calibri", size: 9.5, italic: true, color: { argb: "FF475569" } };
  totalNoteCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: SUMMARY_BG } };
  totalNoteCell.alignment = { vertical: "middle", horizontal: "center" };
  totalNoteCell.border = thinBorder;

  // 8. Bagian Pengesahan / Tanda Tangan
  const signStartRow = totalRowIdx + 3;
  wsBank.getCell(signStartRow, 2).value = "Dibuat & Diverifikasi Oleh:";
  wsBank.getCell(signStartRow, 2).font = { name: "Calibri", size: 9.5, bold: true, color: { argb: "FF334155" } };

  wsBank.getCell(signStartRow + 1, 2).value = "HR Administrator PSPK";
  wsBank.getCell(signStartRow + 1, 2).font = { name: "Calibri", size: 9, color: { argb: "FF64748B" } };

  const signerName = setting?.authorizedSignerName || "Vinda Permata Andini";
  wsBank.getCell(signStartRow + 5, 2).value = `( ${signerName} )`;
  wsBank.getCell(signStartRow + 5, 2).font = { name: "Calibri", size: 9.5, bold: true, color: { argb: "FF0F172A" } };

  wsBank.getCell(signStartRow + 6, 2).value = `Tanggal: ${currentDateFormatted}`;
  wsBank.getCell(signStartRow + 6, 2).font = { name: "Calibri", size: 8.5, italic: true, color: { argb: "FF64748B" } };

  // Penyetuju Keuangan / Operations Lead
  wsBank.getCell(signStartRow, 8).value = "Disetujui & Diteruskan ke Bank:";
  wsBank.getCell(signStartRow, 8).font = { name: "Calibri", size: 9.5, bold: true, color: { argb: "FF334155" } };

  wsBank.getCell(signStartRow + 1, 8).value = "Finance & Operations Lead PSPK";
  wsBank.getCell(signStartRow + 1, 8).font = { name: "Calibri", size: 9, color: { argb: "FF64748B" } };

  wsBank.getCell(signStartRow + 5, 8).value = "( Jody Fathurachman )";
  wsBank.getCell(signStartRow + 5, 8).font = { name: "Calibri", size: 9.5, bold: true, color: { argb: "FF0F172A" } };

  wsBank.getCell(signStartRow + 6, 8).value = `Tanggal: ${currentDateFormatted}`;
  wsBank.getCell(signStartRow + 6, 8).font = { name: "Calibri", size: 8.5, italic: true, color: { argb: "FF64748B" } };

  // =========================================================================
  // SHEET 2: RINCIAN KOMPONEN GAJI (PAYROLL LEDGER)
  // =========================================================================
  const wsLedger = wb.addWorksheet("Rincian Komponen Gaji", {
    views: [{ state: "frozen", xSplit: 3, ySplit: 6 }],
  });

  const TOTAL_LEDGER_COLS = 19;

  // 1. Banner Judul
  wsLedger.mergeCells(1, 1, 1, TOTAL_LEDGER_COLS);
  const lTitle1 = wsLedger.getCell(1, 1);
  lTitle1.value = institutionName.toUpperCase();
  lTitle1.font = { name: "Calibri", size: 13, bold: true, color: { argb: "FFFFFFFF" } };
  lTitle1.fill = { type: "pattern", pattern: "solid", fgColor: { argb: PSPK_NAVY } };
  lTitle1.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  wsLedger.getRow(1).height = 32;

  wsLedger.mergeCells(2, 1, 2, TOTAL_LEDGER_COLS);
  const lTitle2 = wsLedger.getCell(2, 1);
  lTitle2.value = `RINCIAN PERHITUNGAN KOMPONEN PENGGAJIAN LENGKAP (PAYROLL LEDGER) — ${periodTitle.toUpperCase()}`;
  lTitle2.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
  lTitle2.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY_SUBHEADER } };
  lTitle2.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  wsLedger.getRow(2).height = 24;

  wsLedger.mergeCells(3, 1, 3, TOTAL_LEDGER_COLS);
  const lMeta = wsLedger.getCell(3, 1);
  lMeta.value = `Audit Ledger Resmi | Total Tenaga Kerja: ${period.payslips.length} Pegawai | Mata Uang: IDR (Rupiah) | Dicetak: ${currentDateFormatted}`;
  lMeta.font = { name: "Calibri", size: 9, italic: true, color: { argb: "FF334155" } };
  lMeta.fill = { type: "pattern", pattern: "solid", fgColor: { argb: SUMMARY_BG } };
  lMeta.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  wsLedger.getRow(3).height = 20;

  wsLedger.getRow(4).height = 8;

  // Header Baris 1 (Grup Kategori)
  const lRow5 = wsLedger.getRow(5);
  lRow5.height = 22;

  // Grup 1: Info Pegawai (A-G)
  wsLedger.mergeCells(5, 1, 5, 7);
  const gEmp = wsLedger.getCell(5, 1);
  gEmp.value = "INFORMASI PEGAWAI & KONTRAK";
  gEmp.font = { name: "Calibri", size: 9.5, bold: true, color: { argb: "FFFFFFFF" } };
  gEmp.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF334155" } }; // Slate 700
  gEmp.alignment = { vertical: "middle", horizontal: "center" };
  gEmp.border = headerBorder;

  // Grup 2: Komponen Penghasilan (H-L)
  wsLedger.mergeCells(5, 8, 5, 12);
  const gEarn = wsLedger.getCell(5, 8);
  gEarn.value = "KOMPONEN PENGHASILAN (EARNINGS)";
  gEarn.font = { name: "Calibri", size: 9.5, bold: true, color: { argb: "FFFFFFFF" } };
  gEarn.fill = { type: "pattern", pattern: "solid", fgColor: { argb: PSPK_NAVY } };
  gEarn.alignment = { vertical: "middle", horizontal: "center" };
  gEarn.border = headerBorder;

  // Grup 3: Total Gross (M)
  const gGross = wsLedger.getCell(5, 13);
  gGross.value = "TOTAL BRUTO";
  gGross.font = { name: "Calibri", size: 9.5, bold: true, color: { argb: "FFFFFFFF" } };
  gGross.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF065F46" } }; // Emerald 800
  gGross.alignment = { vertical: "middle", horizontal: "center" };
  gGross.border = headerBorder;

  // Grup 4: Komponen Potongan (N-Q)
  wsLedger.mergeCells(5, 14, 5, 17);
  const gDed = wsLedger.getCell(5, 14);
  gDed.value = "KOMPONEN PENGURANG (DEDUCTIONS)";
  gDed.font = { name: "Calibri", size: 9.5, bold: true, color: { argb: "FFFFFFFF" } };
  gDed.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF881337" } }; // Rose 900
  gDed.alignment = { vertical: "middle", horizontal: "center" };
  gDed.border = headerBorder;

  // Grup 5: Total Potongan (R)
  const gTotDed = wsLedger.getCell(5, 18);
  gTotDed.value = "TOTAL POTONGAN";
  gTotDed.font = { name: "Calibri", size: 9.5, bold: true, color: { argb: "FFFFFFFF" } };
  gTotDed.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF9F1239" } }; // Rose 800
  gTotDed.alignment = { vertical: "middle", horizontal: "center" };
  gTotDed.border = headerBorder;

  // Grup 6: Net Pay (S)
  const gNet = wsLedger.getCell(5, 19);
  gNet.value = "GAJI BERSIH (NET)";
  gNet.font = { name: "Calibri", size: 9.5, bold: true, color: { argb: PSPK_GOLD } };
  gNet.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F172A" } }; // Dark Slate
  gNet.alignment = { vertical: "middle", horizontal: "center" };
  gNet.border = headerBorder;

  // Header Baris 2 (Nama Kolom Detail)
  const ledgerCols = [
    { header: "No", width: 5, align: "center" as const },
    { header: "NIP", width: 16, align: "center" as const },
    { header: "Nama Lengkap Pegawai", width: 26, align: "left" as const },
    { header: "Divisi / Unit Kerja", width: 26, align: "left" as const },
    { header: "Jabatan", width: 22, align: "left" as const },
    { header: "Skema Kerja", width: 14, align: "center" as const },
    { header: "Jam / Catatan", width: 18, align: "center" as const },
    // Earnings
    { header: "Gaji Pokok / Upah Jam", width: 18, align: "right" as const },
    { header: "Tunj. Jabatan", width: 16, align: "right" as const },
    { header: "Tunj. Komunikasi", width: 16, align: "right" as const },
    { header: "Tunj. Transport", width: 16, align: "right" as const },
    { header: "Tunj. Lain-lain", width: 15, align: "right" as const },
    { header: "Total Bruto (Rp)", width: 18, align: "right" as const },
    // Deductions
    { header: "BPJS Kes (1%)", width: 15, align: "right" as const },
    { header: "BPJS TK (2%)", width: 15, align: "right" as const },
    { header: "PPh 21 (Pajak)", width: 15, align: "right" as const },
    { header: "Potongan Lain", width: 15, align: "right" as const },
    { header: "Total Potongan (Rp)", width: 18, align: "right" as const },
    // Net
    { header: "Gaji Bersih / Netto (Rp)", width: 20, align: "right" as const },
  ];

  const lRow6 = wsLedger.getRow(6);
  lRow6.height = 26;
  ledgerCols.forEach((col, idx) => {
    const cell = lRow6.getCell(idx + 1);
    cell.value = col.header;
    cell.font = { name: "Calibri", size: 9.5, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY_SUBHEADER } };
    cell.alignment = { vertical: "middle", horizontal: col.align };
    cell.border = headerBorder;
    wsLedger.getColumn(idx + 1).width = col.width;
  });

  // Data Ledger
  const lStartRow = 7;
  period.payslips.forEach((p, idx) => {
    const rowIdx = lStartRow + idx;
    const row = wsLedger.getRow(rowIdx);
    row.height = 22;
    const isZebra = idx % 2 === 1;
    const rowBg = isZebra ? ZEBRA_ROW : "FFFFFFFF";

    // Klasifikasi komponen gaji dari payslip lines
    let baseSalaryAmount = 0;
    let tunjJabatan = 0;
    let tunjKomunikasi = 0;
    let tunjTransport = 0;
    let tunjLain = 0;

    let bpjsKes = 0;
    let bpjsTk = 0;
    let pph21 = 0;
    let potLain = 0;

    p.lines.forEach((line) => {
      const amt = Number(line.amount);
      const labelLower = line.label.toLowerCase();

      if (line.type === "EARNING") {
        if (labelLower.includes("gaji pokok") || labelLower.includes("upah jam")) {
          baseSalaryAmount += amt;
        } else if (labelLower.includes("jabatan") || labelLower.includes("keahlian")) {
          tunjJabatan += amt;
        } else if (labelLower.includes("komunikasi") || labelLower.includes("internet")) {
          tunjKomunikasi += amt;
        } else if (labelLower.includes("transport") || labelLower.includes("mobilitas")) {
          tunjTransport += amt;
        } else {
          tunjLain += amt;
        }
      } else if (line.type === "DEDUCTION") {
        if (labelLower.includes("kesehatan") || labelLower.includes("bpjs kes")) {
          bpjsKes += amt;
        } else if (labelLower.includes("ketenagakerjaan") || labelLower.includes("bpjs tk")) {
          bpjsTk += amt;
        } else if (labelLower.includes("pph") || labelLower.includes("pajak")) {
          pph21 += amt;
        } else {
          potLain += amt;
        }
      }
    });

    const schemeText = p.wageType === "HOURLY" ? "Per Jam" : "Bulanan";
    const hoursNote = p.wageType === "HOURLY"
      ? `${Number(p.totalHours || 0)} jam @ Rp ${Number(p.hourlyRate || 0).toLocaleString("id-ID")}`
      : "-";

    const ledgerValues = [
      idx + 1,
      p.employee.employeeNo,
      p.employee.fullName,
      p.employee.currentDepartment?.name || "-",
      p.employee.currentPosition?.title || "-",
      schemeText,
      hoursNote,
      // Earnings (H-L)
      baseSalaryAmount,
      tunjJabatan,
      tunjKomunikasi,
      tunjTransport,
      tunjLain,
      // Gross Formula M = SUM(H:L)
      { formula: `SUM(H${rowIdx}:L${rowIdx})` },
      // Deductions (N-Q)
      bpjsKes,
      bpjsTk,
      pph21,
      potLain,
      // Total Deductions Formula R = SUM(N:Q)
      { formula: `SUM(N${rowIdx}:Q${rowIdx})` },
      // Net Pay Formula S = M - R
      { formula: `M${rowIdx}-R${rowIdx}` },
    ];

    ledgerValues.forEach((val, cIdx) => {
      const cell = row.getCell(cIdx + 1);
      const colDef = ledgerCols[cIdx];
      cell.value = val;
      cell.font = { name: "Calibri", size: 9.5, color: { argb: "FF0F172A" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: rowBg } };
      cell.border = thinBorder;
      cell.alignment = {
        vertical: "middle",
        horizontal: colDef?.align || "left",
        indent: colDef?.align === "left" ? 1 : 0,
      };

      // Format Angka Rupiah untuk kolom H sampai S
      if (cIdx >= 7) {
        cell.numFmt = "#,##0";
      }

      // Highlight Total Bruto
      if (cIdx === 12) {
        cell.font = { name: "Calibri", size: 9.5, bold: true, color: { argb: "FF065F46" } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: isZebra ? "FFE8F5E9" : "FFF1F8E9" } };
      }

      // Highlight Total Deductions
      if (cIdx === 17) {
        cell.font = { name: "Calibri", size: 9.5, bold: true, color: { argb: "FF9F1239" } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: isZebra ? "FFFFEBEE" : "FFFDF2F4" } };
      }

      // Highlight Net Pay
      if (cIdx === 18) {
        cell.font = { name: "Calibri", size: 10, bold: true, color: { argb: PSPK_NAVY } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: isZebra ? "FFE0E7FF" : "FFEEF2FF" } };
      }
    });
  });

  // Summary Row untuk Ledger
  const lEndRow = lStartRow + period.payslips.length - 1;
  const lTotalRowIdx = lEndRow + 1;
  const lTotalRow = wsLedger.getRow(lTotalRowIdx);
  lTotalRow.height = 26;

  wsLedger.mergeCells(lTotalRowIdx, 1, lTotalRowIdx, 7);
  const lTotalLabel = wsLedger.getCell(lTotalRowIdx, 1);
  lTotalLabel.value = "TOTAL KESELURUHAN (IDR)";
  lTotalLabel.font = { name: "Calibri", size: 10, bold: true, color: { argb: PSPK_NAVY } };
  lTotalLabel.fill = { type: "pattern", pattern: "solid", fgColor: { argb: SUMMARY_BG } };
  lTotalLabel.alignment = { vertical: "middle", horizontal: "right", indent: 1 };
  lTotalLabel.border = thinBorder;

  for (let c = 2; c <= 7; c++) {
    lTotalRow.getCell(c).border = thinBorder;
  }

  // Formula SUM untuk tiap kolom H sampai S
  const amountCols = ["H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S"];
  amountCols.forEach((colLetter, idx) => {
    const colNumber = 8 + idx;
    const cell = lTotalRow.getCell(colNumber);
    if (period.payslips.length > 0) {
      cell.value = { formula: `SUM(${colLetter}${lStartRow}:${colLetter}${lEndRow})` };
    } else {
      cell.value = 0;
    }
    cell.font = { name: "Calibri", size: 10, bold: true, color: { argb: PSPK_NAVY } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: SUMMARY_BG } };
    cell.alignment = { vertical: "middle", horizontal: "right" };
    cell.numFmt = "#,##0";
    cell.border = doubleBottomBorder;
  });

  // =========================================================================
  // SHEET 3: RINGKASAN EKSEKUTIF (EXECUTIVE SUMMARY)
  // =========================================================================
  const wsSummary = wb.addWorksheet("Ringkasan Eksekutif");
  wsSummary.views = [{ showGridLines: true }];

  // 1. Header Banner
  wsSummary.mergeCells("A1:G1");
  const sTitle1 = wsSummary.getCell("A1");
  sTitle1.value = institutionName.toUpperCase();
  sTitle1.font = { name: "Calibri", size: 13, bold: true, color: { argb: "FFFFFFFF" } };
  sTitle1.fill = { type: "pattern", pattern: "solid", fgColor: { argb: PSPK_NAVY } };
  sTitle1.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  wsSummary.getRow(1).height = 32;

  wsSummary.mergeCells("A2:G2");
  const sTitle2 = wsSummary.getCell("A2");
  sTitle2.value = `RINGKASAN EKSEKUTIF PENGGAJIAN — ${periodTitle.toUpperCase()}`;
  sTitle2.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
  sTitle2.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY_SUBHEADER } };
  sTitle2.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  wsSummary.getRow(2).height = 24;

  // 2. Metadata Info Periode
  wsSummary.mergeCells("A3:G3");
  const sMeta = wsSummary.getCell("A3");
  sMeta.value = `Tanggal Terbit: ${currentDateFormatted} | Status: ${period.status} | Rekening Pengirim: ${senderBankInfo}`;
  sMeta.font = { name: "Calibri", size: 9, italic: true, color: { argb: "FF334155" } };
  sMeta.fill = { type: "pattern", pattern: "solid", fgColor: { argb: SUMMARY_BG } };
  sMeta.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  wsSummary.getRow(3).height = 20;

  wsSummary.getRow(4).height = 12;

  // 3. Statistik Utama (KPI Table)
  const monthlyCount = period.payslips.filter((p) => p.wageType === "MONTHLY").length;
  const hourlyCount = period.payslips.filter((p) => p.wageType === "HOURLY").length;
  const grandGross = period.payslips.reduce((sum, p) => sum + Number(p.grossAmount), 0);
  const grandDeduction = period.payslips.reduce((sum, p) => sum + Number(p.totalDeduction), 0);
  const grandNet = period.payslips.reduce((sum, p) => sum + Number(p.netAmount), 0);

  // Hitung akumulasi BPJS & PPh
  let totalBpjsKes = 0;
  let totalBpjsTk = 0;
  let totalPph21 = 0;

  period.payslips.forEach((p) => {
    p.lines.forEach((l) => {
      const amt = Number(l.amount);
      const lbl = l.label.toLowerCase();
      if (lbl.includes("kesehatan") || lbl.includes("bpjs kes")) totalBpjsKes += amt;
      else if (lbl.includes("ketenagakerjaan") || lbl.includes("bpjs tk")) totalBpjsTk += amt;
      else if (lbl.includes("pph") || lbl.includes("pajak")) totalPph21 += amt;
    });
  });

  wsSummary.mergeCells("B5:F5");
  const kpiHeader = wsSummary.getCell("B5");
  kpiHeader.value = "INDIKATOR UTAMA PENGGAJIAN (KEY METRICS)";
  kpiHeader.font = { name: "Calibri", size: 10.5, bold: true, color: { argb: "FFFFFFFF" } };
  kpiHeader.fill = { type: "pattern", pattern: "solid", fgColor: { argb: PSPK_NAVY } };
  kpiHeader.alignment = { vertical: "middle", horizontal: "center" };
  wsSummary.getRow(5).height = 24;

  const kpiRows = [
    { label: "Total Karyawan Diproses", value: `${period.payslips.length} Orang`, isCurrency: false },
    { label: "• Karyawan Bulanan (Tetap/PKWT)", value: `${monthlyCount} Orang`, isCurrency: false },
    { label: "• Karyawan Per Jam (PKWT Freelance)", value: `${hourlyCount} Orang`, isCurrency: false },
    { label: "Total Beban Gaji Bruto (Gross Amount)", value: grandGross, isCurrency: true },
    { label: "• Total Iuran BPJS Kesehatan (1%)", value: totalBpjsKes, isCurrency: true },
    { label: "• Total Iuran BPJS Ketenagakerjaan (2%)", value: totalBpjsTk, isCurrency: true },
    { label: "• Total Estimasi PPh Pasal 21", value: totalPph21, isCurrency: true },
    { label: "Total Potongan Pegawai (Deductions)", value: grandDeduction, isCurrency: true },
    { label: "TOTAL KAS DIBAYARKAN (NET DISBURSEMENT)", value: grandNet, isCurrency: true, isHighlight: true },
  ];

  kpiRows.forEach((item, kIdx) => {
    const rowIdx = 6 + kIdx;
    wsSummary.getRow(rowIdx).height = 22;

    wsSummary.mergeCells(rowIdx, 2, rowIdx, 4);
    const lblCell = wsSummary.getCell(rowIdx, 2);
    lblCell.value = item.label;
    lblCell.font = {
      name: "Calibri",
      size: item.isHighlight ? 10.5 : 9.5,
      bold: item.isHighlight || item.label.startsWith("Total"),
      color: { argb: item.isHighlight ? PSPK_NAVY : "FF1E293B" },
    };
    lblCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: item.isHighlight ? "FFFEF3C7" : kIdx % 2 === 1 ? ZEBRA_ROW : "FFFFFFFF" },
    };
    lblCell.border = thinBorder;
    lblCell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };

    for (let c = 3; c <= 4; c++) wsSummary.getCell(rowIdx, c).border = thinBorder;

    wsSummary.mergeCells(rowIdx, 5, rowIdx, 6);
    const valCell = wsSummary.getCell(rowIdx, 5);
    valCell.value = item.value;
    valCell.font = {
      name: "Calibri",
      size: item.isHighlight ? 11 : 9.5,
      bold: item.isHighlight || item.label.startsWith("Total"),
      color: { argb: item.isHighlight ? PSPK_NAVY : "FF0F172A" },
    };
    valCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: item.isHighlight ? "FFFEF3C7" : kIdx % 2 === 1 ? ZEBRA_ROW : "FFFFFFFF" },
    };
    valCell.border = thinBorder;
    valCell.alignment = { vertical: "middle", horizontal: item.isCurrency ? "right" : "center", indent: 1 };
    if (item.isCurrency) {
      valCell.numFmt = "#,##0";
    }

    wsSummary.getCell(rowIdx, 6).border = thinBorder;
  });

  // 4. Rekapitulasi Berdasarkan Divisi / Unit Kerja
  const deptMap = new Map<string, { count: number; gross: number; deduction: number; net: number }>();
  period.payslips.forEach((p) => {
    const deptName = p.employee.currentDepartment?.name || "Lintas Inisiatif / Operasional";
    const existing = deptMap.get(deptName) || { count: 0, gross: 0, deduction: 0, net: 0 };
    existing.count += 1;
    existing.gross += Number(p.grossAmount);
    existing.deduction += Number(p.totalDeduction);
    existing.net += Number(p.netAmount);
    deptMap.set(deptName, existing);
  });

  const deptStartRow = 6 + kpiRows.length + 2;
  wsSummary.getRow(deptStartRow).height = 24;
  wsSummary.mergeCells(deptStartRow, 2, deptStartRow, 6);
  const dHeader = wsSummary.getCell(deptStartRow, 2);
  dHeader.value = "DISTRIBUSI BIAYA GAJI PER UNIT KERJA / DIVISI";
  dHeader.font = { name: "Calibri", size: 10.5, bold: true, color: { argb: "FFFFFFFF" } };
  dHeader.fill = { type: "pattern", pattern: "solid", fgColor: { argb: PSPK_NAVY } };
  dHeader.alignment = { vertical: "middle", horizontal: "center" };

  const deptCols = [
    { header: "Unit Kerja / Divisi", colStart: 2, colEnd: 3, width: 34, align: "left" as const },
    { header: "Jml Pegawai", colStart: 4, colEnd: 4, width: 14, align: "center" as const },
    { header: "Total Netto (Rp)", colStart: 5, colEnd: 5, width: 20, align: "right" as const },
    { header: "Porsi Biaya", colStart: 6, colEnd: 6, width: 14, align: "center" as const },
  ];

  const dSubHeaderRow = wsSummary.getRow(deptStartRow + 1);
  dSubHeaderRow.height = 22;
  deptCols.forEach((col) => {
    if (col.colStart !== col.colEnd) {
      wsSummary.mergeCells(deptStartRow + 1, col.colStart, deptStartRow + 1, col.colEnd);
    }
    const cell = wsSummary.getCell(deptStartRow + 1, col.colStart);
    cell.value = col.header;
    cell.font = { name: "Calibri", size: 9.5, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY_SUBHEADER } };
    cell.alignment = { vertical: "middle", horizontal: col.align };
    cell.border = headerBorder;
    if (col.colStart !== col.colEnd) {
      wsSummary.getCell(deptStartRow + 1, col.colEnd).border = headerBorder;
    }
  });

  let deptCurrentRow = deptStartRow + 2;
  const deptEntries = Array.from(deptMap.entries()).sort((a, b) => b[1].net - a[1].net);

  deptEntries.forEach(([dName, stats], dIdx) => {
    const row = wsSummary.getRow(deptCurrentRow);
    row.height = 20;
    const isZebra = dIdx % 2 === 1;
    const rowBg = isZebra ? ZEBRA_ROW : "FFFFFFFF";
    const sharePercent = grandNet > 0 ? (stats.net / grandNet) * 100 : 0;

    wsSummary.mergeCells(deptCurrentRow, 2, deptCurrentRow, 3);
    const nameCell = wsSummary.getCell(deptCurrentRow, 2);
    nameCell.value = dName;
    nameCell.font = { name: "Calibri", size: 9.5, color: { argb: "FF0F172A" } };
    nameCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: rowBg } };
    nameCell.border = thinBorder;
    nameCell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
    wsSummary.getCell(deptCurrentRow, 3).border = thinBorder;

    const countCell = wsSummary.getCell(deptCurrentRow, 4);
    countCell.value = `${stats.count} Orang`;
    countCell.font = { name: "Calibri", size: 9.5, color: { argb: "FF0F172A" } };
    countCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: rowBg } };
    countCell.border = thinBorder;
    countCell.alignment = { vertical: "middle", horizontal: "center" };

    const netCell = wsSummary.getCell(deptCurrentRow, 5);
    netCell.value = stats.net;
    netCell.font = { name: "Calibri", size: 9.5, bold: true, color: { argb: "FF0F172A" } };
    netCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: rowBg } };
    netCell.border = thinBorder;
    netCell.alignment = { vertical: "middle", horizontal: "right" };
    netCell.numFmt = "#,##0";

    const shareCell = wsSummary.getCell(deptCurrentRow, 6);
    shareCell.value = `${sharePercent.toFixed(1)}%`;
    shareCell.font = { name: "Calibri", size: 9.5, color: { argb: "FF475569" } };
    shareCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: rowBg } };
    shareCell.border = thinBorder;
    shareCell.alignment = { vertical: "middle", horizontal: "center" };

    deptCurrentRow++;
  });

  // Total Divisi Row
  const dTotRow = wsSummary.getRow(deptCurrentRow);
  dTotRow.height = 24;

  wsSummary.mergeCells(deptCurrentRow, 2, deptCurrentRow, 3);
  const dTotLabel = wsSummary.getCell(deptCurrentRow, 2);
  dTotLabel.value = "TOTAL PEMBAYARAN KESELURUHAN";
  dTotLabel.font = { name: "Calibri", size: 10, bold: true, color: { argb: PSPK_NAVY } };
  dTotLabel.fill = { type: "pattern", pattern: "solid", fgColor: { argb: SUMMARY_BG } };
  dTotLabel.alignment = { vertical: "middle", horizontal: "right", indent: 1 };
  dTotLabel.border = thinBorder;
  wsSummary.getCell(deptCurrentRow, 3).border = thinBorder;

  const dTotCount = wsSummary.getCell(deptCurrentRow, 4);
  dTotCount.value = `${period.payslips.length} Orang`;
  dTotCount.font = { name: "Calibri", size: 10, bold: true, color: { argb: PSPK_NAVY } };
  dTotCount.fill = { type: "pattern", pattern: "solid", fgColor: { argb: SUMMARY_BG } };
  dTotCount.border = thinBorder;
  dTotCount.alignment = { vertical: "middle", horizontal: "center" };

  const dTotNet = wsSummary.getCell(deptCurrentRow, 5);
  dTotNet.value = grandNet;
  dTotNet.font = { name: "Calibri", size: 10.5, bold: true, color: { argb: PSPK_NAVY } };
  dTotNet.fill = { type: "pattern", pattern: "solid", fgColor: { argb: SUMMARY_BG } };
  dTotNet.border = doubleBottomBorder;
  dTotNet.alignment = { vertical: "middle", horizontal: "right" };
  dTotNet.numFmt = "#,##0";

  const dTotPct = wsSummary.getCell(deptCurrentRow, 6);
  dTotPct.value = "100.0%";
  dTotPct.font = { name: "Calibri", size: 10, bold: true, color: { argb: PSPK_NAVY } };
  dTotPct.fill = { type: "pattern", pattern: "solid", fgColor: { argb: SUMMARY_BG } };
  dTotPct.border = thinBorder;
  dTotPct.alignment = { vertical: "middle", horizontal: "center" };

  // Set lebar kolom sheet summary
  wsSummary.getColumn(1).width = 4;
  wsSummary.getColumn(2).width = 24;
  wsSummary.getColumn(3).width = 20;
  wsSummary.getColumn(4).width = 16;
  wsSummary.getColumn(5).width = 24;
  wsSummary.getColumn(6).width = 16;
  wsSummary.getColumn(7).width = 4;

  // =========================================================================
  // EXPORT WORKBOOK KE BUFFER & BASE64
  // =========================================================================
  const rawBuffer = await wb.xlsx.writeBuffer();
  const buffer = Buffer.from(rawBuffer);
  const base64 = buffer.toString("base64");
  const filename = `Rekap_Payroll_PSPK_${period.year}_${String(period.month).padStart(2, "0")}_${period.kind}.xlsx`;

  return {
    filename,
    base64,
  };
}
