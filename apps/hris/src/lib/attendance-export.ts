import * as XLSX from "xlsx";

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
  totalDays: number;
}

export interface AttendanceExportParams {
  employees: AttendanceExportEmployee[];
  statsMap: Map<string, AttendanceExportStats>;
  year: number;
  month: number;
  monthLabel: string;
  departmentName?: string;
}

/**
 * Menghasilkan dan mengunduh berkas Excel resmi (.xlsx) untuk Rekapitulasi Presensi PSPK.
 * Workbook terdiri dari 2 sheet:
 * 1. Rekapitulasi Presensi (Tabel statistik kehadiran per pegawai)
 * 2. Parameter & Ketentuan (Metadata periode, tanggal unduh, dan catatan resmi)
 */
export function exportAttendanceRekapXlsx({
  employees,
  statsMap,
  year,
  month,
  monthLabel,
  departmentName = "Semua Divisi",
}: AttendanceExportParams) {
  const wb = XLSX.utils.book_new();

  // -------------------------------------------------------------
  // SHEET 1: REKAPITULASI PRESENSI
  // -------------------------------------------------------------
  const headers = [
    "No",
    "NIP",
    "Nama Lengkap Pegawai",
    "Divisi / Departemen",
    "Jabatan / Posisi",
    "Hadir Tepat Waktu",
    "Terlambat",
    "Cuti / Izin Resmi",
    "Alpa / Tanpa Ket.",
    "Total Hari Kerja",
    "Tingkat Kehadiran (%)",
  ];

  const rows = employees.map((emp, index) => {
    const stats = statsMap.get(emp.id) || {
      present: 0,
      late: 0,
      leave: 0,
      absent: 0,
      totalDays: 0,
    };

    const effectiveDays = stats.totalDays > 0 ? stats.totalDays : 1;
    const attendancePercentage = Math.round(
      ((stats.present + stats.late) / effectiveDays) * 100,
    );

    return [
      index + 1,
      emp.employeeNo || "-",
      emp.fullName,
      emp.currentDepartment?.name || "Divisi Riset",
      emp.currentPosition?.title || "Staf Riset",
      stats.present,
      stats.late,
      stats.leave,
      stats.absent,
      stats.totalDays,
      `${attendancePercentage}%`,
    ];
  });

  const wsRekap = XLSX.utils.aoa_to_sheet([
    [`REKAPITULASI PRESENSI PEGAWAI PSPK - PERIODE ${monthLabel.toUpperCase()} ${year}`],
    [`Divisi / Unit Kerja: ${departmentName} | Dicetak: ${new Date().toLocaleDateString("id-ID")}`],
    [],
    headers,
    ...rows,
  ]);

  // Lebar kolom terukur
  wsRekap["!cols"] = [
    { wch: 6 },  // No
    { wch: 18 }, // NIP
    { wch: 30 }, // Nama
    { wch: 36 }, // Divisi
    { wch: 32 }, // Jabatan
    { wch: 18 }, // Hadir Tepat
    { wch: 14 }, // Terlambat
    { wch: 18 }, // Cuti
    { wch: 18 }, // Alpa
    { wch: 18 }, // Total Hari
    { wch: 22 }, // %
  ];

  XLSX.utils.book_append_sheet(wb, wsRekap, "Rekap Presensi");

  // -------------------------------------------------------------
  // SHEET 2: PARAMETER & KETERANGAN
  // -------------------------------------------------------------
  const infoRows = [
    ["INFORMASI EKSPOR PRESENSI PSPK"],
    [],
    ["Parameter", "Keterangan"],
    ["Lembaga", "Pusat Studi Pendidikan dan Kebijakan (PSPK)"],
    ["Periode Bulan", `${monthLabel} (Bulan ${month})`],
    ["Tahun", String(year)],
    ["Cakupan Divisi", departmentName],
    ["Total Pegawai Terdata", `${employees.length} Pegawai`],
    ["Waktu Ekspor Berkas", new Date().toLocaleString("id-ID")],
    [],
    ["KETENTUAN STATUS PRESENSI:"],
    ["1. Hadir Tepat Waktu: Presensi masuk tercatat sebelum atau tepat pada batas jam masuk operasional kantor."],
    ["2. Terlambat: Presensi masuk tercatat melewati batas toleransi jam masuk kantor."],
    ["3. Cuti / Izin Resmi: Terisi otomatis dari permohonan cuti yang telah disetujui (Approved) oleh atasan & HR."],
    ["4. Alpa: Hari kerja resmi tanpa catatan presensi masuk dan tanpa pengajuan cuti resmi."],
  ];

  const wsInfo = XLSX.utils.aoa_to_sheet(infoRows);
  wsInfo["!cols"] = [{ wch: 25 }, { wch: 80 }];
  XLSX.utils.book_append_sheet(wb, wsInfo, "Parameter & Ketentuan");

  // Format nama berkas bersih
  const cleanDept = departmentName.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
  const fileName = `rekap-presensi-pspk-${cleanDept}-${monthLabel.toLowerCase()}-${year}.xlsx`;

  XLSX.writeFile(wb, fileName);
}
