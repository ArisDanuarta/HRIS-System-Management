import ExcelJS from "exceljs";

export interface AttendanceExportEmployee {
  id: string;
  employeeNo: string;
  fullName: string;
  currentPosition?: { title: string } | null;
  currentDepartment?: { id: string; name: string } | null;
}

export interface AttendanceExportStats {
  present: number;
  late: number;
  leave: number;
  absent: number;
  wfh?: number;
  totalDays: number;
}

export interface AttendanceRecordItem {
  id: string;
  employeeId: string;
  date: Date | string;
  checkInAt: Date | string | null;
  checkOutAt: Date | string | null;
  status: string;
  source: string;
  correctionReason?: string | null;
}

export interface AttendanceExportParams {
  employees: AttendanceExportEmployee[];
  dailyMap?: Map<string, Map<number, AttendanceRecordItem>>;
  statsMap: Map<string, AttendanceExportStats>;
  year: number;
  month: number;
  monthLabel: string;
  departmentName?: string;
}

// PSPK Official Brand Color Palette (Hex ARGB)
const PSPK_NAVY = "FF102E50"; // Brand Navy Primary
const PSPK_GOLD = "FFF2AF3E"; // Brand Gold Accent
const NAVY_SUBHEADER = "FF1E3A5F"; // Deep Slate Blue for subheaders
const NAVY_LIGHT = "FF254870"; // Mid Navy
const BORDER_COLOR = "FFCBD5E1"; // Slate 300
const HEADER_BORDER = "FF94A3B8"; // Slate 400
const ZEBRA_ROW = "FFF8FAFC"; // Slate 50
const WEEKEND_BG = "FFF1F5F9"; // Slate 100 for weekend cells
const WEEKEND_HEADER_BG = "FF334155"; // Slate 700 for weekend header

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

// Styling badge tematik untuk kode kehadiran pada matriks harian
interface StatusStyle {
  text: string;
  fgColor: string;
  bgColor: string;
}

const STATUS_STYLES: Record<string, StatusStyle> = {
  PRESENT: { text: "H", bgColor: "FFE8F5E9", fgColor: "FF2E7D32" }, // Hadir (Hijau lembut)
  LATE: { text: "T", bgColor: "FFFFF3E0", fgColor: "FFE65100" }, // Terlambat (Oranye lembut)
  WFH: { text: "W", bgColor: "FFE1F5FE", fgColor: "FF0277BD" }, // WFH (Biru muda lembut)
  LEAVE: { text: "C", bgColor: "FFFFF8E1", fgColor: "FFB78103" }, // Cuti / Izin (Amber lembut)
  ABSENT: { text: "A", bgColor: "FFFFEBEE", fgColor: "FFC62828" }, // Alpa (Merah lembut)
};

/**
 * Menghasilkan dan mengunduh berkas Excel resmi (.xlsx) berstandar Enterprise
 * untuk Rekapitulasi Presensi PSPK dengan 3 sheet terstruktur:
 * 1. Matriks Presensi Harian (Hari 1 s/d 31 lengkap dengan freeze pane & kode warna)
 * 2. Rekapitulasi Eksekutif (Tabel ringkasan siap cetak / audit payroll)
 * 3. Parameter & Panduan (Glosarium kode & metadata resmi lembaga)
 */
export async function exportAttendanceRekapXlsx({
  employees,
  dailyMap,
  statsMap,
  year,
  month,
  monthLabel,
  departmentName = "Semua Divisi",
}: AttendanceExportParams) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Portal HRIS PSPK";
  wb.lastModifiedBy = "Portal HRIS PSPK";
  wb.created = new Date();
  wb.modified = new Date();

  // Hitung jumlah hari dalam bulan dan data kalender
  const daysCount = new Date(year, month, 0).getDate();
  const daysInfo = Array.from({ length: daysCount }, (_, idx) => {
    const dayNum = idx + 1;
    const d = new Date(Date.UTC(year, month - 1, dayNum));
    const dayOfWeek = d.getUTCDay(); // 0 = Min, 6 = Sab
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const dayShort = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"][dayOfWeek] || "";
    return { dayNum, dayShort, isWeekend };
  });

  const totalDailyCols = 5 + daysCount + 6; // 5 info awal + N hari + 6 kolom ringkasan

  // =========================================================================
  // SHEET 1: MATRIKS PRESENSI HARIAN (1 - 31)
  // =========================================================================
  const wsMatrix = wb.addWorksheet("Matriks Presensi Harian", {
    views: [{ state: "frozen", xSplit: 5, ySplit: 5 }],
  });

  // 1. Banner Judul Kop Resmi PSPK
  wsMatrix.mergeCells(1, 1, 1, totalDailyCols);
  const cellTitle1 = wsMatrix.getCell(1, 1);
  cellTitle1.value = `REKAPITULASI MATRIKS PRESENSI HARIAN PEGAWAI PSPK — PERIODE ${monthLabel.toUpperCase()} ${year}`;
  cellTitle1.font = { name: "Calibri", size: 13, bold: true, color: { argb: "FFFFFFFF" } };
  cellTitle1.fill = { type: "pattern", pattern: "solid", fgColor: { argb: PSPK_NAVY } };
  cellTitle1.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  wsMatrix.getRow(1).height = 34;

  // 2. Baris Subtitle Metadata
  wsMatrix.mergeCells(2, 1, 2, totalDailyCols);
  const cellSub1 = wsMatrix.getCell(2, 1);
  cellSub1.value = `Cakupan Unit Kerja: ${departmentName} | Total Pegawai Terdata: ${employees.length} Orang | Dicetak: ${new Date().toLocaleDateString("id-ID", { dateStyle: "full" })} | Sumber: Portal HRIS PSPK`;
  cellSub1.font = { name: "Calibri", size: 9.5, italic: true, color: { argb: "FF334155" } };
  cellSub1.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
  cellSub1.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  wsMatrix.getRow(2).height = 20;

  // 3. Baris Pemisah
  wsMatrix.getRow(3).height = 8;

  // 4. Header Ganda (Dual-Row Headers: Baris 4 & 5)
  wsMatrix.getRow(4).height = 20;
  wsMatrix.getRow(5).height = 20;

  // Header Kolom Pegawai (A s/d E)
  const fixedHeaders = [
    { col: 1, title: "No" },
    { col: 2, title: "NIP" },
    { col: 3, title: "Nama Lengkap Pegawai" },
    { col: 4, title: "Divisi / Departemen" },
    { col: 5, title: "Jabatan / Posisi" },
  ];

  fixedHeaders.forEach(({ col, title }) => {
    wsMatrix.mergeCells(4, col, 5, col);
    const cell = wsMatrix.getCell(4, col);
    cell.value = title;
    cell.font = { name: "Calibri", size: 9.5, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: PSPK_NAVY } };
    cell.alignment = {
      vertical: "middle",
      horizontal: col === 1 || col === 2 ? "center" : "left",
      indent: col >= 3 ? 1 : 0,
    };
    cell.border = {
      top: { style: "medium", color: { argb: PSPK_NAVY } },
      bottom: { style: "medium", color: { argb: PSPK_NAVY } },
      left: { style: "thin", color: { argb: HEADER_BORDER } },
      right: { style: "thin", color: { argb: HEADER_BORDER } },
    };
  });

  // Header Tanggal (Kolom 6 s/d 5 + daysCount)
  daysInfo.forEach((day, idx) => {
    const colIdx = 6 + idx;
    const headerBg = day.isWeekend ? WEEKEND_HEADER_BG : PSPK_NAVY;

    // Baris 4: Nama Hari (Min, Sen, Sel, ...)
    const cellDayName = wsMatrix.getCell(4, colIdx);
    cellDayName.value = day.dayShort;
    cellDayName.font = { name: "Calibri", size: 8.5, bold: true, color: { argb: "FFFFFFFF" } };
    cellDayName.fill = { type: "pattern", pattern: "solid", fgColor: { argb: headerBg } };
    cellDayName.alignment = { vertical: "middle", horizontal: "center" };
    cellDayName.border = {
      top: { style: "medium", color: { argb: headerBg } },
      bottom: { style: "thin", color: { argb: HEADER_BORDER } },
      left: { style: "thin", color: { argb: HEADER_BORDER } },
      right: { style: "thin", color: { argb: HEADER_BORDER } },
    };

    // Baris 5: Nomor Tanggal (1, 2, 3, ...)
    const cellDayNum = wsMatrix.getCell(5, colIdx);
    cellDayNum.value = day.dayNum;
    cellDayNum.font = { name: "Calibri", size: 9.5, bold: true, color: { argb: "FFFFFFFF" } };
    cellDayNum.fill = { type: "pattern", pattern: "solid", fgColor: { argb: headerBg } };
    cellDayNum.alignment = { vertical: "middle", horizontal: "center" };
    cellDayNum.border = {
      top: { style: "thin", color: { argb: HEADER_BORDER } },
      bottom: { style: "medium", color: { argb: headerBg } },
      left: { style: "thin", color: { argb: HEADER_BORDER } },
      right: { style: "thin", color: { argb: HEADER_BORDER } },
    };
  });

  // Header Ringkasan di Sisi Kanan Matriks
  const summaryHeaders = [
    { title: "Hadir", bg: "FF1E4D80", fg: "FFFFFFFF" },
    { title: "Terlambat", bg: "FF1E4D80", fg: "FFFFFFFF" },
    { title: "Cuti / Izin", bg: "FF1E4D80", fg: "FFFFFFFF" },
    { title: "Alpa", bg: "FF1E4D80", fg: "FFFFFFFF" },
    { title: "Total Hari", bg: PSPK_NAVY, fg: "FFFFFFFF" },
    { title: "% Kehadiran", bg: PSPK_GOLD, fg: "FF102E50" }, // Brand Gold header!
  ];

  summaryHeaders.forEach((sh, idx) => {
    const colIdx = 6 + daysCount + idx;
    wsMatrix.mergeCells(4, colIdx, 5, colIdx);
    const cell = wsMatrix.getCell(4, colIdx);
    cell.value = sh.title;
    cell.font = { name: "Calibri", size: 9.5, bold: true, color: { argb: sh.fg } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: sh.bg } };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = {
      top: { style: "medium", color: { argb: sh.bg } },
      bottom: { style: "medium", color: { argb: sh.bg } },
      left: { style: "thin", color: { argb: HEADER_BORDER } },
      right: { style: "thin", color: { argb: HEADER_BORDER } },
    };
  });

  // 5. Data Rows (Pegawai)
  const dailyPresentCounters = new Array(daysCount).fill(0);
  let grandPresent = 0;
  let grandLate = 0;
  let grandLeave = 0;
  let grandAbsent = 0;
  let grandDays = 0;

  employees.forEach((emp, i) => {
    const rowIdx = 6 + i;
    wsMatrix.getRow(rowIdx).height = 21;
    const isZebra = i % 2 === 1;
    const defaultBg = isZebra ? ZEBRA_ROW : "FFFFFFFF";

    // Info Pegawai
    const c1 = wsMatrix.getCell(rowIdx, 1);
    c1.value = i + 1;
    c1.alignment = { vertical: "middle", horizontal: "center" };
    c1.font = { name: "Calibri", size: 9.5 };
    c1.fill = { type: "pattern", pattern: "solid", fgColor: { argb: defaultBg } };
    c1.border = thinBorder;

    const c2 = wsMatrix.getCell(rowIdx, 2);
    c2.value = emp.employeeNo || "-";
    c2.alignment = { vertical: "middle", horizontal: "center" };
    c2.font = { name: "Consolas", size: 9 };
    c2.fill = { type: "pattern", pattern: "solid", fgColor: { argb: defaultBg } };
    c2.border = thinBorder;

    const c3 = wsMatrix.getCell(rowIdx, 3);
    c3.value = emp.fullName;
    c3.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
    c3.font = { name: "Calibri", size: 9.5, bold: true, color: { argb: "FF0F172A" } };
    c3.fill = { type: "pattern", pattern: "solid", fgColor: { argb: defaultBg } };
    c3.border = thinBorder;

    const c4 = wsMatrix.getCell(rowIdx, 4);
    c4.value = emp.currentDepartment?.name || "Divisi Riset";
    c4.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
    c4.font = { name: "Calibri", size: 9, color: { argb: "FF334155" } };
    c4.fill = { type: "pattern", pattern: "solid", fgColor: { argb: defaultBg } };
    c4.border = thinBorder;

    const c5 = wsMatrix.getCell(rowIdx, 5);
    c5.value = emp.currentPosition?.title || "Staf";
    c5.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
    c5.font = { name: "Calibri", size: 9, color: { argb: "FF334155" } };
    c5.fill = { type: "pattern", pattern: "solid", fgColor: { argb: defaultBg } };
    c5.border = thinBorder;

    // Data Harian
    daysInfo.forEach((day, idx) => {
      const colIdx = 6 + idx;
      const cell = wsMatrix.getCell(rowIdx, colIdx);
      const record = dailyMap?.get(emp.id)?.get(day.dayNum);

      if (record) {
        const style = STATUS_STYLES[record.status] || {
          text: "•",
          bgColor: "FFF1F5F9",
          fgColor: "FF475569",
        };
        cell.value = style.text;
        cell.font = { name: "Calibri", size: 9, bold: true, color: { argb: style.fgColor } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: style.bgColor } };
        cell.alignment = { vertical: "middle", horizontal: "center" };
        cell.border = thinBorder;

        if (record.status === "PRESENT" || record.status === "LATE" || record.status === "WFH") {
          dailyPresentCounters[idx] = (dailyPresentCounters[idx] || 0) + 1;
        }
      } else {
        if (day.isWeekend) {
          cell.value = "·";
          cell.font = { name: "Calibri", size: 9, color: { argb: "FF94A3B8" } };
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: WEEKEND_BG } };
          cell.alignment = { vertical: "middle", horizontal: "center" };
          cell.border = thinBorder;
        } else {
          cell.value = "-";
          cell.font = { name: "Calibri", size: 9, color: { argb: "FFCBD5E1" } };
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: defaultBg } };
          cell.alignment = { vertical: "middle", horizontal: "center" };
          cell.border = thinBorder;
        }
      }
    });

    // Data Ringkasan Per Pegawai
    const stats = statsMap.get(emp.id) || {
      present: 0,
      late: 0,
      leave: 0,
      absent: 0,
      totalDays: 0,
    };

    grandPresent += stats.present;
    grandLate += stats.late;
    grandLeave += stats.leave;
    grandAbsent += stats.absent;
    grandDays += stats.totalDays;

    const rate = stats.totalDays > 0 ? (stats.present + stats.late) / stats.totalDays : 0;

    const summaryValues = [
      { val: stats.present, bold: true },
      { val: stats.late, bold: false },
      { val: stats.leave, bold: false },
      { val: stats.absent, bold: false },
      { val: stats.totalDays, bold: true },
    ];

    summaryValues.forEach((sv, idx) => {
      const colIdx = 6 + daysCount + idx;
      const cell = wsMatrix.getCell(rowIdx, colIdx);
      cell.value = sv.val;
      cell.font = { name: "Calibri", size: 9.5, bold: sv.bold };
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: defaultBg } };
      cell.border = thinBorder;
    });

    // Kolom Persentase
    const cellRate = wsMatrix.getCell(rowIdx, 6 + daysCount + 5);
    cellRate.value = rate;
    cellRate.numFmt = "0.0%";
    cellRate.font = {
      name: "Calibri",
      size: 9.5,
      bold: true,
      color: { argb: rate >= 0.85 ? "FF166534" : rate < 0.7 ? "FFB91C1C" : "FF1E293B" },
    };
    cellRate.alignment = { vertical: "middle", horizontal: "center" };
    cellRate.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: isZebra ? "FFF1F5F9" : "FFFFFFFF" },
    };
    cellRate.border = thinBorder;
  });

  // 6. Baris Total Akumulasi Lembaga (Grand Total Row)
  const totalRowIdx = 6 + employees.length;
  wsMatrix.getRow(totalRowIdx).height = 24;

  wsMatrix.mergeCells(totalRowIdx, 1, totalRowIdx, 5);
  const cellTotalLabel = wsMatrix.getCell(totalRowIdx, 1);
  cellTotalLabel.value = "TOTAL & RATA-RATA LEMBAGA";
  cellTotalLabel.font = { name: "Calibri", size: 9.5, bold: true, color: { argb: "FFFFFFFF" } };
  cellTotalLabel.fill = { type: "pattern", pattern: "solid", fgColor: { argb: PSPK_NAVY } };
  cellTotalLabel.alignment = { vertical: "middle", horizontal: "right", indent: 1 };
  cellTotalLabel.border = doubleBottomBorder;

  // Akumulasi Harian
  daysInfo.forEach((day, idx) => {
    const colIdx = 6 + idx;
    const cell = wsMatrix.getCell(totalRowIdx, colIdx);
    const count = dailyPresentCounters[idx] || 0;
    cell.value = day.isWeekend && count === 0 ? "·" : count;
    cell.font = { name: "Calibri", size: 8.5, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY_SUBHEADER } };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = doubleBottomBorder;
  });

  // Akumulasi Ringkasan
  const summaryTotals = [grandPresent, grandLate, grandLeave, grandAbsent, grandDays];
  summaryTotals.forEach((totalVal, idx) => {
    const colIdx = 6 + daysCount + idx;
    const cell = wsMatrix.getCell(totalRowIdx, colIdx);
    cell.value = totalVal;
    cell.font = { name: "Calibri", size: 9.5, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY_LIGHT } };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = doubleBottomBorder;
  });

  // Rata-rata Lembaga
  const cellGrandRate = wsMatrix.getCell(totalRowIdx, 6 + daysCount + 5);
  const orgAverageRate = grandDays > 0 ? (grandPresent + grandLate) / grandDays : 0;
  cellGrandRate.value = orgAverageRate;
  cellGrandRate.numFmt = "0.0%";
  cellGrandRate.font = { name: "Calibri", size: 10, bold: true, color: { argb: "FF102E50" } };
  cellGrandRate.fill = { type: "pattern", pattern: "solid", fgColor: { argb: PSPK_GOLD } };
  cellGrandRate.alignment = { vertical: "middle", horizontal: "center" };
  cellGrandRate.border = doubleBottomBorder;

  // Lebar Kolom Sheet 1
  wsMatrix.getColumn(1).width = 5; // No
  wsMatrix.getColumn(2).width = 17; // NIP
  wsMatrix.getColumn(3).width = 28; // Nama
  wsMatrix.getColumn(4).width = 30; // Divisi
  wsMatrix.getColumn(5).width = 24; // Jabatan

  for (let i = 0; i < daysCount; i++) {
    wsMatrix.getColumn(6 + i).width = 4.8; // Lebar sel harian persegi
  }

  wsMatrix.getColumn(6 + daysCount).width = 9; // Hadir
  wsMatrix.getColumn(6 + daysCount + 1).width = 10; // Terlambat
  wsMatrix.getColumn(6 + daysCount + 2).width = 11; // Cuti
  wsMatrix.getColumn(6 + daysCount + 3).width = 9; // Alpa
  wsMatrix.getColumn(6 + daysCount + 4).width = 12; // Total Hari
  wsMatrix.getColumn(6 + daysCount + 5).width = 13; // % Kehadiran

  // =========================================================================
  // SHEET 2: REKAPITULASI EKSEKUTIF (TABEL RINGKASAN RESMI)
  // =========================================================================
  const wsSummary = wb.addWorksheet("Rekapitulasi Eksekutif", {
    views: [{ state: "frozen", xSplit: 0, ySplit: 4 }],
  });

  const totalSumCols = 11;

  // 1. Banner Judul
  wsSummary.mergeCells(1, 1, 1, totalSumCols);
  const cellTitle2 = wsSummary.getCell(1, 1);
  cellTitle2.value = `REKAPITULASI EKSEKUTIF KEHADIRAN PEGAWAI PSPK — PERIODE ${monthLabel.toUpperCase()} ${year}`;
  cellTitle2.font = { name: "Calibri", size: 13, bold: true, color: { argb: "FFFFFFFF" } };
  cellTitle2.fill = { type: "pattern", pattern: "solid", fgColor: { argb: PSPK_NAVY } };
  cellTitle2.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  wsSummary.getRow(1).height = 34;

  // 2. Baris Subtitle
  wsSummary.mergeCells(2, 1, 2, totalSumCols);
  const cellSub2 = wsSummary.getCell(2, 1);
  cellSub2.value = `Unit Kerja: ${departmentName} | Total Pegawai Terdata: ${employees.length} Orang | Dicetak: ${new Date().toLocaleDateString("id-ID", { dateStyle: "full" })}`;
  cellSub2.font = { name: "Calibri", size: 9.5, italic: true, color: { argb: "FF334155" } };
  cellSub2.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
  cellSub2.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  wsSummary.getRow(2).height = 20;

  // 3. Baris Pemisah
  wsSummary.getRow(3).height = 8;

  // 4. Header Kolom
  const summaryColDefs = [
    { col: 1, title: "No", width: 6, align: "center" as const },
    { col: 2, title: "NIP", width: 18, align: "center" as const },
    { col: 3, title: "Nama Lengkap Pegawai", width: 30, align: "left" as const },
    { col: 4, title: "Divisi / Departemen", width: 34, align: "left" as const },
    { col: 5, title: "Jabatan / Posisi", width: 28, align: "left" as const },
    { col: 6, title: "Hadir Tepat", width: 15, align: "center" as const },
    { col: 7, title: "Terlambat", width: 14, align: "center" as const },
    { col: 8, title: "Cuti / Izin", width: 15, align: "center" as const },
    { col: 9, title: "Alpa / Tanpa Ket.", width: 17, align: "center" as const },
    { col: 10, title: "Total Hari Kerja", width: 16, align: "center" as const },
    { col: 11, title: "Tingkat Kehadiran (%)", width: 22, align: "center" as const },
  ];

  wsSummary.getRow(4).height = 26;
  summaryColDefs.forEach(({ col, title, width, align }) => {
    wsSummary.getColumn(col).width = width;
    const cell = wsSummary.getCell(4, col);
    cell.value = title;
    cell.font = {
      name: "Calibri",
      size: 10,
      bold: true,
      color: { argb: col === 11 ? "FF102E50" : "FFFFFFFF" },
    };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: col === 11 ? PSPK_GOLD : PSPK_NAVY },
    };
    cell.alignment = {
      vertical: "middle",
      horizontal: align,
      indent: align === "left" ? 1 : 0,
    };
    cell.border = {
      top: { style: "medium", color: { argb: PSPK_NAVY } },
      bottom: { style: "medium", color: { argb: PSPK_NAVY } },
      left: { style: "thin", color: { argb: HEADER_BORDER } },
      right: { style: "thin", color: { argb: HEADER_BORDER } },
    };
  });

  // 5. Data Baris
  employees.forEach((emp, i) => {
    const rowIdx = 5 + i;
    wsSummary.getRow(rowIdx).height = 22;
    const isZebra = i % 2 === 1;
    const defaultBg = isZebra ? ZEBRA_ROW : "FFFFFFFF";

    const stats = statsMap.get(emp.id) || {
      present: 0,
      late: 0,
      leave: 0,
      absent: 0,
      totalDays: 0,
    };
    const rate = stats.totalDays > 0 ? (stats.present + stats.late) / stats.totalDays : 0;

    const rowData = [
      { val: i + 1, align: "center" as const, font: { name: "Calibri", size: 9.5 } },
      { val: emp.employeeNo || "-", align: "center" as const, font: { name: "Consolas", size: 9 } },
      {
        val: emp.fullName,
        align: "left" as const,
        font: { name: "Calibri", size: 9.5, bold: true, color: { argb: "FF0F172A" } },
      },
      {
        val: emp.currentDepartment?.name || "Divisi Riset",
        align: "left" as const,
        font: { name: "Calibri", size: 9.5, color: { argb: "FF334155" } },
      },
      {
        val: emp.currentPosition?.title || "Staf",
        align: "left" as const,
        font: { name: "Calibri", size: 9.5, color: { argb: "FF334155" } },
      },
      { val: stats.present, align: "center" as const, font: { name: "Calibri", size: 9.5, bold: true } },
      { val: stats.late, align: "center" as const, font: { name: "Calibri", size: 9.5 } },
      { val: stats.leave, align: "center" as const, font: { name: "Calibri", size: 9.5 } },
      { val: stats.absent, align: "center" as const, font: { name: "Calibri", size: 9.5 } },
      { val: stats.totalDays, align: "center" as const, font: { name: "Calibri", size: 9.5, bold: true } },
    ];

    rowData.forEach((item, colIdx) => {
      const cell = wsSummary.getCell(rowIdx, colIdx + 1);
      cell.value = item.val;
      cell.font = item.font;
      cell.alignment = {
        vertical: "middle",
        horizontal: item.align,
        indent: item.align === "left" ? 1 : 0,
      };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: defaultBg } };
      cell.border = thinBorder;
    });

    // Kolom Persentase Kehadiran
    const cellRate = wsSummary.getCell(rowIdx, 11);
    cellRate.value = rate;
    cellRate.numFmt = "0.0%";
    cellRate.font = {
      name: "Calibri",
      size: 9.5,
      bold: true,
      color: { argb: rate >= 0.85 ? "FF166534" : rate < 0.7 ? "FFB91C1C" : "FF1E293B" },
    };
    cellRate.alignment = { vertical: "middle", horizontal: "center" };
    cellRate.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: isZebra ? "FFF1F5F9" : "FFFFFFFF" },
    };
    cellRate.border = thinBorder;
  });

  // 6. Baris Total Eksekutif
  const totalRowSumIdx = 5 + employees.length;
  wsSummary.getRow(totalRowSumIdx).height = 25;

  wsSummary.mergeCells(totalRowSumIdx, 1, totalRowSumIdx, 5);
  const cellSumLabel = wsSummary.getCell(totalRowSumIdx, 1);
  cellSumLabel.value = "TOTAL / RATA-RATA KESELURUHAN LEMBAGA";
  cellSumLabel.font = { name: "Calibri", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
  cellSumLabel.fill = { type: "pattern", pattern: "solid", fgColor: { argb: PSPK_NAVY } };
  cellSumLabel.alignment = { vertical: "middle", horizontal: "right", indent: 1 };
  cellSumLabel.border = doubleBottomBorder;

  const executiveTotals = [grandPresent, grandLate, grandLeave, grandAbsent, grandDays];
  executiveTotals.forEach((val, idx) => {
    const colIdx = 6 + idx;
    const cell = wsSummary.getCell(totalRowSumIdx, colIdx);
    cell.value = val;
    cell.font = { name: "Calibri", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY_LIGHT } };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = doubleBottomBorder;
  });

  const cellExecRate = wsSummary.getCell(totalRowSumIdx, 11);
  cellExecRate.value = orgAverageRate;
  cellExecRate.numFmt = "0.0%";
  cellExecRate.font = { name: "Calibri", size: 10, bold: true, color: { argb: "FF102E50" } };
  cellExecRate.fill = { type: "pattern", pattern: "solid", fgColor: { argb: PSPK_GOLD } };
  cellExecRate.alignment = { vertical: "middle", horizontal: "center" };
  cellExecRate.border = doubleBottomBorder;

  // =========================================================================
  // SHEET 3: PARAMETER & KETENTUAN RESMI
  // =========================================================================
  const wsInfo = wb.addWorksheet("Parameter & Panduan");
  wsInfo.getColumn(1).width = 28;
  wsInfo.getColumn(2).width = 75;

  // Judul Parameter
  wsInfo.mergeCells("A1:B1");
  const cInfoTitle = wsInfo.getCell("A1");
  cInfoTitle.value = "INFORMASI EKSPOR PRESENSI & PARAMETER LEMBAGA";
  cInfoTitle.font = { name: "Calibri", size: 12, bold: true, color: { argb: "FFFFFFFF" } };
  cInfoTitle.fill = { type: "pattern", pattern: "solid", fgColor: { argb: PSPK_NAVY } };
  cInfoTitle.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  wsInfo.getRow(1).height = 30;

  const infoRows = [
    { k: "Lembaga", v: "Pusat Studi Pendidikan dan Kebijakan (PSPK)" },
    { k: "Periode Laporan", v: `${monthLabel} ${year} (Bulan ${month})` },
    { k: "Cakupan Divisi / Unit Kerja", v: departmentName },
    { k: "Total Pegawai Terdata", v: `${employees.length} Orang Pegawai` },
    { k: "Waktu Ekspor Berkas", v: new Date().toLocaleString("id-ID") },
    { k: "Sistem Asal", v: "Portal Terpadu HRIS & System Management PSPK (Terverifikasi)" },
  ];

  infoRows.forEach((item, idx) => {
    const rowIdx = 2 + idx;
    wsInfo.getRow(rowIdx).height = 20;

    const cK = wsInfo.getCell(rowIdx, 1);
    cK.value = item.k;
    cK.font = { name: "Calibri", size: 9.5, bold: true, color: { argb: "FF1E293B" } };
    cK.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };
    cK.border = thinBorder;
    cK.alignment = { vertical: "middle", horizontal: "left", indent: 1 };

    const cV = wsInfo.getCell(rowIdx, 2);
    cV.value = item.v;
    cV.font = { name: "Calibri", size: 9.5, color: { argb: "FF334155" } };
    cV.border = thinBorder;
    cV.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  });

  // Glosarium Status
  const legendStartRow = 10;
  wsInfo.mergeCells(legendStartRow, 1, legendStartRow, 2);
  const cLegendTitle = wsInfo.getCell(legendStartRow, 1);
  cLegendTitle.value = "GLOSARIUM & KETENTUAN STATUS PRESENSI:";
  cLegendTitle.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
  cLegendTitle.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY_SUBHEADER } };
  cLegendTitle.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  wsInfo.getRow(legendStartRow).height = 26;

  const legendItems = [
    {
      code: "[H] Hadir Tepat Waktu",
      desc: "Presensi masuk tercatat sebelum atau tepat pada batas jam masuk operasional kantor lembaga.",
    },
    {
      code: "[T] Terlambat",
      desc: "Presensi masuk tercatat melewati batas toleransi jam operasional kantor lembaga.",
    },
    {
      code: "[W] WFH / Remote",
      desc: "Presensi dengan mode kerja jarak jauh (Work From Home) yang telah disetujui atasan / HR.",
    },
    {
      code: "[C] Cuti / Izin Resmi",
      desc: "Terisi otomatis dari permohonan cuti resmi yang telah disetujui (Approved) oleh atasan & HR.",
    },
    {
      code: "[A] Alpa / Tanpa Keterangan",
      desc: "Hari kerja operasional resmi tanpa catatan presensi masuk dan tanpa pengajuan izin cuti resmi.",
    },
    {
      code: "[·] Hari Libur / Akhir Pekan",
      desc: "Hari istirahat mingguan resmi (Sabtu & Minggu) atau hari libur nasional resmi.",
    },
  ];

  legendItems.forEach((item, idx) => {
    const rowIdx = legendStartRow + 1 + idx;
    wsInfo.getRow(rowIdx).height = 22;

    const cCode = wsInfo.getCell(rowIdx, 1);
    cCode.value = item.code;
    cCode.font = { name: "Calibri", size: 9.5, bold: true, color: { argb: "FF0F172A" } };
    cCode.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };
    cCode.border = thinBorder;
    cCode.alignment = { vertical: "middle", horizontal: "left", indent: 1 };

    const cDesc = wsInfo.getCell(rowIdx, 2);
    cDesc.value = item.desc;
    cDesc.font = { name: "Calibri", size: 9.5, color: { argb: "FF334155" } };
    cDesc.border = thinBorder;
    cDesc.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  });

  // =========================================================================
  // EKSEKUSI UNDUH BERKAS (.XLSX) DI BROWSER
  // =========================================================================
  const cleanDept = departmentName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-");
  const fileName = `rekap-presensi-pspk-${cleanDept}-${monthLabel.toLowerCase()}-${year}.xlsx`;

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
