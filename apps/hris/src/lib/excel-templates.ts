import * as XLSX from "xlsx";

export interface DepartmentRef {
  id: string;
  name: string;
  positions?: { id: string; title: string }[];
}

export interface EmploymentTypeRef {
  id: string;
  code: string;
  name: string;
  category: string;
  wageType: string;
  defaultHourlyRate?: number | null;
}

/**
 * Membuat dan mengunduh Template Resmi Excel (.xlsx) untuk Impor Data Pegawai PSPK.
 * Workbook berisi 3 Lembar Kerja (Sheet):
 * 1. Data Pegawai (Formulir pengisian berkolom rapi + 3 baris data contoh konkret)
 * 2. Panduan Pengisian (Penjelasan detail setiap kolom, tipe data, aturan bisnis)
 * 3. Referensi Master Data (Daftar Divisi, Posisi, dan Ikatan Kerja aktif dari database)
 */
export function downloadEmployeeTemplateXlsx(params: {
  departments?: DepartmentRef[];
  employmentTypes?: EmploymentTypeRef[];
}) {
  const wb = XLSX.utils.book_new();

  // -------------------------------------------------------------
  // SHEET 1: DATA PEGAWAI
  // -------------------------------------------------------------
  const headers = [
    "Nama Lengkap *",
    "Nama Panggilan",
    "NIP *",
    "Email Kantor *",
    "Email Pribadi",
    "No HP / WhatsApp *",
    "Divisi / Departemen *",
    "Jabatan / Posisi *",
    "Tipe Ikatan Kerja *",
    "Skema Upah *",
    "Gaji Pokok / Tarif Per Jam *",
    "Tanggal Mulai Kerja *",
    "Tanggal Berakhir Kontrak",
    "Jenis Kelamin",
    "Status Pernikahan",
    "Nama Bank",
    "Nomor Rekening Bank",
    "Nama Pemilik Rekening",
  ];

  const exampleRows = [
    // Contoh 1: Pegawai Tetap (Bulanan, tanpa tanggal akhir)
    [
      "Dr. Aris Sudrajat M.Pd.",
      "Aris",
      "PSPK-202610-091",
      "aris.sudrajat@pspk.id",
      "aris.personal@gmail.com",
      "081234567890",
      params.departments?.[0]?.name || "Divisi Kebijakan Kurikulum & Pembelajaran",
      params.departments?.[0]?.positions?.[0]?.title || "Peneliti Kebijakan Kurikulum Utama",
      "Pegawai Tetap",
      "Gaji Bulanan",
      18000000,
      "2026-10-01",
      "", // Tetap = kosong
      "Laki-laki",
      "Menikah",
      "Bank Mandiri",
      "1230009876543",
      "Aris Sudrajat",
    ],
    // Contoh 2: PKWT Riset (Bulanan, berjangka 1 tahun)
    [
      "Nadia Utami S.Si.",
      "Nadia",
      "PSPK-202610-092",
      "nadia.utami@pspk.id",
      "nadia.utami@yahoo.com",
      "089876543210",
      params.departments?.[1]?.name || params.departments?.[0]?.name || "Divisi Asesmen & Standar Pendidikan",
      params.departments?.[1]?.positions?.[0]?.title || "Spesialis Asesmen & Evaluasi",
      "PKWT Riset",
      "Gaji Bulanan",
      12000000,
      "2026-10-01",
      "2027-09-30", // Wajib ada untuk PKWT
      "Perempuan",
      "Lajang",
      "Bank Mandiri",
      "1230004567890",
      "Nadia Utami",
    ],
    // Contoh 3: Freelance / Paruh Waktu (Skema Upah Per Jam)
    [
      "Budi Santoso M.T.",
      "Budi",
      "PSPK-202610-093",
      "budi.santoso@pspk.id",
      "budi.santoso.dev@gmail.com",
      "085612345678",
      params.departments?.[0]?.name || "Divisi PEMANTIK",
      params.departments?.[0]?.positions?.[1]?.title || "Spesialis Analis Data Riset",
      "Part-Time / Proyek Ad-Hoc",
      "Per Jam",
      50000, // Tarif per jam
      "2026-10-01",
      "2027-03-31",
      "Laki-laki",
      "Menikah",
      "Bank BCA",
      "5420192837",
      "Budi Santoso",
    ],
  ];

  const wsData = XLSX.utils.aoa_to_sheet([headers, ...exampleRows]);

  // Set lebar kolom yang proporsional agar terbaca rapi saat dibuka di Excel
  wsData["!cols"] = [
    { wch: 28 }, // Nama Lengkap
    { wch: 16 }, // Nama Panggilan
    { wch: 18 }, // NIP
    { wch: 26 }, // Email Kantor
    { wch: 26 }, // Email Pribadi
    { wch: 18 }, // No HP
    { wch: 36 }, // Divisi
    { wch: 34 }, // Posisi
    { wch: 24 }, // Tipe Ikatan Kerja
    { wch: 16 }, // Skema Upah
    { wch: 26 }, // Gaji / Tarif
    { wch: 20 }, // Tanggal Mulai
    { wch: 22 }, // Tanggal Berakhir
    { wch: 15 }, // Gender
    { wch: 18 }, // Status Nikah
    { wch: 16 }, // Bank
    { wch: 22 }, // Rekening
    { wch: 24 }, // Pemilik Rekening
  ];

  XLSX.utils.book_append_sheet(wb, wsData, "Data Pegawai");

  // -------------------------------------------------------------
  // SHEET 2: PANDUAN PENGISIAN
  // -------------------------------------------------------------
  const guidanceHeaders = [
    "No",
    "Nama Kolom",
    "Sifat",
    "Format / Tipe Data",
    "Contoh Pengisian",
    "Keterangan & Aturan Sistem",
  ];

  const guidanceRows = [
    [
      1,
      "Nama Lengkap *",
      "Wajib",
      "Teks (Huruf)",
      "Dr. Aris Sudrajat M.Pd.",
      "Nama resmi pegawai beserta gelar akademik jika ada.",
    ],
    [
      2,
      "Nama Panggilan",
      "Opsional",
      "Teks Singkat",
      "Aris",
      "Nama panggilan akrab untuk tampilan sapaan di dashboard.",
    ],
    [
      3,
      "NIP *",
      "Wajib",
      "Teks Kode Unik",
      "PSPK-202610-091",
      "Nomor Induk Pegawai unik. Tidak boleh sama dengan pegawai yang sudah ada.",
    ],
    [
      4,
      "Email Kantor *",
      "Wajib",
      "Format Email Valid",
      "nama@pspk.id",
      "Email institusi resmi untuk login akun dan notifikasi sistem.",
    ],
    [
      5,
      "Email Pribadi",
      "Opsional",
      "Format Email Valid",
      "nama@gmail.com",
      "Alamat email pribadi untuk pengiriman darurat atau kredensial akun awal.",
    ],
    [
      6,
      "No HP / WhatsApp *",
      "Wajib",
      "Format Angka / Nomor",
      "081234567890",
      "Nomor kontak seluler aktif atau nomor WhatsApp yang dapat dihubungi.",
    ],
    [
      7,
      "Divisi / Departemen *",
      "Wajib",
      "Teks Nama Divisi",
      "Divisi Kebijakan Kurikulum & Pembelajaran",
      "Nama divisi kerja. Lihat sheet 'Referensi Master Data' untuk daftar yang valid.",
    ],
    [
      8,
      "Jabatan / Posisi *",
      "Wajib",
      "Teks Formasi Jabatan",
      "Peneliti Kebijakan Kurikulum Utama",
      "Formasi penempatan jabatan kerja di dalam divisi terkait.",
    ],
    [
      9,
      "Tipe Ikatan Kerja *",
      "Wajib",
      "Teks Master Ikatan Kerja",
      "Pegawai Tetap / PKWT Riset / Part-Time / Proyek Ad-Hoc",
      "Perjanjian ikatan kerja. Sistem mencocokkan otomatis ke master ikatan kerja PSPK.",
    ],
    [
      10,
      "Skema Upah *",
      "Wajib",
      "Pilihan: 'Gaji Bulanan' atau 'Per Jam'",
      "Gaji Bulanan",
      "Gaji Bulanan = perhitungan gaji pokok bulanan tetap; Per Jam = upah berbasis timesheet.",
    ],
    [
      11,
      "Gaji Pokok / Tarif Per Jam *",
      "Wajib",
      "Angka Murni (Tanpa Rp / Titik)",
      "18000000",
      "Untuk Skema Bulanan isi nominal gaji pokok; untuk Skema Per Jam isi tarif per jam (contoh: 50000).",
    ],
    [
      12,
      "Tanggal Mulai Kerja *",
      "Wajib",
      "Format YYYY-MM-DD",
      "2026-10-01",
      "Tanggal efektif pegawai mulai bekerja di lingkungan PSPK.",
    ],
    [
      13,
      "Tanggal Berakhir Kontrak",
      "Kondisional",
      "Format YYYY-MM-DD",
      "2027-09-30",
      "Wajib diisi jika Tipe Ikatan Kerja adalah PKWT Berjangka atau Magang. Kosongkan jika Pegawai Tetap.",
    ],
    [
      14,
      "Jenis Kelamin",
      "Opsional",
      "Pilihan: 'Laki-laki' atau 'Perempuan'",
      "Laki-laki",
      "Data demografi untuk kelengkapan biodata kepegawaian.",
    ],
    [
      15,
      "Status Pernikahan",
      "Opsional",
      "Pilihan: 'Lajang', 'Menikah', dll.",
      "Menikah",
      "Data status pernikahan untuk acuan tunjangan dan profil pajak PTKP.",
    ],
    [
      16,
      "Nama Bank",
      "Opsional",
      "Teks Nama Bank",
      "Bank Mandiri",
      "Bank penyalur payroll lembaga (bawaan: Bank Mandiri).",
    ],
    [
      17,
      "Nomor Rekening Bank",
      "Opsional",
      "Angka Rekening",
      "1230009876543",
      "Nomor rekening payroll pegawai (disimpan terenkripsi aman AES-256).",
    ],
    [
      18,
      "Nama Pemilik Rekening",
      "Opsional",
      "Teks Sesuai Buku Rekening",
      "Aris Sudrajat",
      "Nama nasabah yang tercantum pada buku tabungan bank.",
    ],
  ];

  const wsGuidance = XLSX.utils.aoa_to_sheet([
    ["PANDUAN & KETENTUAN PENGISIAN TEMPLATE IMPOR PEGAWAI PSPK"],
    ["Harap baca dan perhatikan petunjuk di bawah ini sebelum mengunggah file ke sistem:"],
    [],
    guidanceHeaders,
    ...guidanceRows,
    [],
    ["CATATAN TEKNIS PENTING:"],
    ["1. Jangan mengubah, menambah, atau menghapus urutan kolom pada Sheet 'Data Pegawai'."],
    ["2. Format tanggal harus tepat Tahun-Bulan-Hari (YYYY-MM-DD), contohnya 2026-10-01."],
    ["3. Kolom nominal gaji/tarif hanya boleh berisi angka bulat tanpa simbol mata uang (Rp) maupun titik pemisah."],
    ["4. Sistem akan otomatis melewati baris yang memiliki NIP atau Email Kantor yang sudah terdaftar di database."],
  ]);

  wsGuidance["!cols"] = [
    { wch: 6 },
    { wch: 28 },
    { wch: 14 },
    { wch: 25 },
    { wch: 28 },
    { wch: 60 },
  ];

  XLSX.utils.book_append_sheet(wb, wsGuidance, "Panduan Pengisian");

  // -------------------------------------------------------------
  // SHEET 3: REFERENSI MASTER DATA
  // -------------------------------------------------------------
  const refRows: (string | number)[][] = [
    ["DAFTAR DIVISI & FORMASI JABATAN RESMI PSPK"],
    ["Gunakan nama divisi dan jabatan berikut ini pada Sheet 'Data Pegawai' agar data langsung terhubung:"],
    [],
    ["Nama Divisi", "Nama Formasi Jabatan Terdaftar"],
  ];

  if (params.departments && params.departments.length > 0) {
    for (const d of params.departments) {
      if (d.positions && d.positions.length > 0) {
        for (const p of d.positions) {
          refRows.push([d.name, p.title]);
        }
      } else {
        refRows.push([d.name, "(Belum ada jabatan khusus)"]);
      }
    }
  } else {
    refRows.push(
      ["Divisi Kebijakan Kurikulum & Pembelajaran", "Peneliti Kebijakan Kurikulum Utama"],
      ["Divisi Asesmen & Standar Pendidikan", "Spesialis Asesmen & Evaluasi"],
      ["Divisi Riset Kebijakan Guru", "Peneliti Kebijakan Pendidik"],
      ["Divisi Operasional & Finansial", "Spesialis Keuangan & Kepatuhan"],
      ["Divisi PEMANTIK", "Staf Teknis Riset"],
    );
  }

  refRows.push([], ["DAFTAR TIPE IKATAN KERJA TERDAFTAR DI SISTEM"], ["Kode Ikatan Kerja", "Nama Ikatan Kerja", "Kategori Sistem", "Skema Upah", "Tarif Acuan / Jam"]);

  if (params.employmentTypes && params.employmentTypes.length > 0) {
    for (const et of params.employmentTypes) {
      refRows.push([
        et.code,
        et.name,
        et.category,
        et.wageType === "HOURLY" ? "Per Jam" : "Gaji Bulanan",
        et.defaultHourlyRate ? et.defaultHourlyRate : "-",
      ]);
    }
  } else {
    refRows.push(
      ["TETAP", "Pegawai Tetap", "PERMANENT", "Gaji Bulanan", "-"],
      ["PKWT_RISET", "PKWT Riset", "FIXED_TERM", "Gaji Bulanan", "-"],
      ["PART_TIME", "Part-Time / Proyek Ad-Hoc", "PART_TIME_PROJECT", "Per Jam", 30000],
    );
  }

  const wsRef = XLSX.utils.aoa_to_sheet(refRows);
  wsRef["!cols"] = [
    { wch: 40 },
    { wch: 38 },
    { wch: 20 },
    { wch: 18 },
    { wch: 20 },
  ];

  XLSX.utils.book_append_sheet(wb, wsRef, "Referensi Master Data");

  // Unduh berkas .xlsx ke komputer pengguna
  XLSX.writeFile(wb, "template-impor-pegawai-pspk.xlsx");
}

/**
 * Membuat dan mengunduh Template Resmi Excel (.xlsx) untuk Impor Rekap Kehadiran / Timesheet PSPK.
 */
export function downloadAttendanceTemplateXlsx() {
  const wb = XLSX.utils.book_new();

  const headers = [
    "NIP Pegawai *",
    "Nama Pegawai",
    "Tanggal Presensi *",
    "Jam Masuk (HH:mm) *",
    "Jam Keluar (HH:mm)",
    "Status Presensi *",
    "Total Durasi Kerja (Jam)",
    "Catatan Kegiatan / Lokasi",
  ];

  const exampleRows = [
    ["PSPK-202610-091", "Dr. Aris Sudrajat M.Pd.", "2026-10-05", "08:30", "17:30", "HADIR", 8.0, "Kantor PSPK Jakarta"],
    ["PSPK-202610-092", "Nadia Utami S.Si.", "2026-10-05", "08:45", "17:45", "HADIR", 8.0, "WFA / Riset Daring"],
    ["PSPK-202610-093", "Budi Santoso M.T.", "2026-10-05", "09:00", "15:00", "HADIR", 6.0, "FGD Kebijakan Pembelajaran"],
  ];

  const wsData = XLSX.utils.aoa_to_sheet([headers, ...exampleRows]);
  wsData["!cols"] = [
    { wch: 18 },
    { wch: 28 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 18 },
    { wch: 24 },
    { wch: 35 },
  ];

  XLSX.utils.book_append_sheet(wb, wsData, "Rekap Presensi");

  const guidance = [
    ["PANDUAN IMPOR REKAP PRESENSI & TIMESHEET PSPK"],
    [],
    ["1. NIP Pegawai wajib cocok dengan NIP yang terdaftar pada sistem."],
    ["2. Format Tanggal wajib YYYY-MM-DD (contoh: 2026-10-05)."],
    ["3. Format Jam wajib HH:mm 24 jam (contoh: 08:30 atau 17:00)."],
    ["4. Status Presensi yang didukung: HADIR, TERLAMBAT, PULANG_CEPAT, IZIN, SAKIT, CUTI, ALFA."],
    ["5. Kolom Total Durasi Kerja opsional; jika kosong sistem menghitung otomatis dari selisih jam masuk dan keluar."],
  ];

  const wsGuide = XLSX.utils.aoa_to_sheet(guidance);
  wsGuide["!cols"] = [{ wch: 80 }];
  XLSX.utils.book_append_sheet(wb, wsGuide, "Panduan Presensi");

  XLSX.writeFile(wb, "template-impor-presensi-pspk.xlsx");
}

/**
 * Membuat dan mengunduh Template Resmi Excel (.xlsx) untuk Impor Struktur Organisasi & Jabatan PSPK.
 */
export function downloadOrganizationTemplateXlsx() {
  const wb = XLSX.utils.book_new();

  const headers = [
    "Nama Divisi *",
    "Tipe Divisi *",
    "Nama Formasi Jabatan *",
    "Pimpinan Unit (YA / TIDAK)",
    "Keterangan Divisi / Jabatan",
  ];

  const exampleRows = [
    ["Divisi Kebijakan Kurikulum & Pembelajaran", "INITIATIVE", "Kepala Divisi Kebijakan Kurikulum", "YA", "Memimpin inisiatif riset kurikulum nasional"],
    ["Divisi Kebijakan Kurikulum & Pembelajaran", "INITIATIVE", "Peneliti Kebijakan Kurikulum Utama", "TIDAK", "Peneliti senior kurikulum"],
    ["Divisi Asesmen & Standar Pendidikan", "INITIATIVE", "Kepala Divisi Asesmen", "YA", "Memimpin riset asesmen dan standar mutu"],
    ["Divisi Operasional & Finansial", "SUPPORT", "Manajer Operasional & Keuangan", "YA", "Manajemen operasional kantor dan keuangan"],
  ];

  const wsData = XLSX.utils.aoa_to_sheet([headers, ...exampleRows]);
  wsData["!cols"] = [
    { wch: 38 },
    { wch: 18 },
    { wch: 38 },
    { wch: 26 },
    { wch: 45 },
  ];

  XLSX.utils.book_append_sheet(wb, wsData, "Struktur Divisi & Jabatan");

  const guidance = [
    ["PANDUAN IMPOR STRUKTUR DIVISI & FORMASI JABATAN PSPK"],
    [],
    ["1. Tipe Divisi wajib salah satu dari: GOVERNANCE, LEADERSHIP, INITIATIVE, atau SUPPORT."],
    ["2. Baris dengan nama Divisi yang sama akan dikelompokkan ke divisi yang sama."],
    ["3. Kolom Pimpinan Unit: isi YA jika jabatan tersebut memegang posisi kepala divisi/unit."],
  ];

  const wsGuide = XLSX.utils.aoa_to_sheet(guidance);
  wsGuide["!cols"] = [{ wch: 80 }];
  XLSX.utils.book_append_sheet(wb, wsGuide, "Panduan Organisasi");

  XLSX.writeFile(wb, "template-impor-organisasi-pspk.xlsx");
}
