import * as XLSX from "xlsx";
import { SerializedAsset } from "@/server/queries/asset.queries";

/**
 * Membuat dan mengunduh Template Resmi Excel (.xlsx) untuk Impor Data Aset PSPK.
 * Workbook berisi 3 Lembar Kerja (Sheet):
 * 1. Data Aset (Formulir pengisian berkolom rapi + 5 baris data contoh konkret IT & Non-IT)
 * 2. Panduan Pengisian (Penjelasan detail setiap kolom, tipe data, aturan bisnis)
 * 3. Kamus Kategori & Tipe (Nilai sah kategori, tipe barang standar, dan status aset)
 */
export function downloadAssetTemplateXlsx() {
  const wb = XLSX.utils.book_new();

  // -------------------------------------------------------------
  // SHEET 1: DATA ASET
  // -------------------------------------------------------------
  const headers = [
    "Tag Aset (Kosongkan utk Auto-Tag)",
    "Nama Aset *",
    "Kategori (IT / NON_IT) *",
    "Tipe Aset *",
    "Merek / Brand",
    "Model / Seri",
    "Nomor Seri (Serial No)",
    "Status Ketersediaan",
    "Tanggal Pembelian (YYYY-MM-DD)",
    "Harga Perolehan (Rupiah)",
    "Lokasi Fisik *",
    "Catatan Tambahan",
  ];

  const exampleRows = [
    [
      "PSPK-IT-2026-0001",
      "MacBook Pro 14 M3 Pro",
      "IT",
      "Laptop",
      "Apple",
      "MBP 14 18GB/512GB Space Black",
      "C02XYZ123456",
      "Tersedia di Gudang",
      "2026-01-15",
      28500000,
      "Ruang IT / Server Lt. 2",
      "Garansi resmi AppleCare s/d Jan 2029",
    ],
    [
      "", // Sengaja dikosongkan untuk contoh auto-tag
      "Dell UltraSharp 27 4K",
      "IT",
      "Monitor",
      "Dell",
      "U2723QE",
      "CN-098765-ABC",
      "Tersedia di Gudang",
      "2026-02-10",
      8200000,
      "Ruang IT / Server Lt. 2",
      "Termasuk kabel USB-C bawaan pabrik",
    ],
    [
      "PSPK-NON_IT-2026-0001",
      "Meja Kerja Ergonomis Standing Desk",
      "NON_IT",
      "Meja Kerja",
      "Stramm",
      "Electric Dual Motor 140x70",
      "STR-2026-881",
      "Tersedia di Gudang",
      "2025-11-20",
      4750000,
      "Lantai 1 - Area Riset",
      "Dilengkapi kontrol memori ketinggian digital",
    ],
    [
      "", // Contoh auto-tag Non-IT
      "Kursi Kerja Ergonomis Jaring",
      "NON_IT",
      "Kursi Kerja",
      "Informa",
      "ErgoMesh HighBack",
      "",
      "Tersedia di Gudang",
      "2025-11-20",
      1850000,
      "Lantai 1 - Area Riset",
      "Beban maksimal 120 kg, warna hitam",
    ],
    [
      "",
      "MikroTik Cloud Core Router",
      "IT",
      "Server & Jaringan",
      "MikroTik",
      "CCR2004-16G-2S+",
      "8937210948",
      "Tersedia di Gudang",
      "2025-08-05",
      7250000,
      "Rak Server Utama Lt. 2",
      "Router core gateway jaringan utama kantor PSPK",
    ],
  ];

  const wsData = XLSX.utils.aoa_to_sheet([headers, ...exampleRows]);

  // Lebar kolom rapi
  wsData["!cols"] = [
    { wch: 30 }, // Tag Aset
    { wch: 32 }, // Nama Aset
    { wch: 22 }, // Kategori
    { wch: 18 }, // Tipe Aset
    { wch: 16 }, // Merek
    { wch: 26 }, // Model / Seri
    { wch: 22 }, // Serial Number
    { wch: 20 }, // Status
    { wch: 24 }, // Tanggal Pembelian
    { wch: 22 }, // Harga Perolehan
    { wch: 26 }, // Lokasi Fisik
    { wch: 36 }, // Catatan
  ];

  XLSX.utils.book_append_sheet(wb, wsData, "Data Aset");

  // -------------------------------------------------------------
  // SHEET 2: PANDUAN PENGISIAN
  // -------------------------------------------------------------
  const guidanceHeaders = [
    "Nama Kolom",
    "Wajib / Opsional",
    "Tipe Data / Format",
    "Keterangan & Aturan Pengisian",
  ];

  const guidanceRows = [
    [
      "Tag Aset",
      "Opsional",
      "Teks Unik",
      "Kode inventaris unik aset. Jika dikosongkan, sistem PSPK akan otomatis membuatkan tag resmi (format: PSPK-IT-YYYY-XXXX atau PSPK-NON_IT-YYYY-XXXX). Jika diisi manual, pastikan belum pernah terdaftar.",
    ],
    [
      "Nama Aset",
      "Wajib (*)",
      "Teks",
      "Nama identifikasi aset secara jelas dan spesifik (mis. 'MacBook Pro 14 M3 Pro', 'Monitor Dell UltraSharp 27', 'Meja Kerja Ergonomis').",
    ],
    [
      "Kategori",
      "Wajib (*)",
      "Pilihan: IT / NON_IT",
      "Gunakan 'IT' untuk perangkat komputer, laptop, monitor, printer, server/jaringan. Gunakan 'NON_IT' untuk perabot kantor, kendaraan, perlengkapan ruang rapat, dsb.",
    ],
    [
      "Tipe Aset",
      "Wajib (*)",
      "Teks Bebas / Standar",
      "Kategori jenis barang (mis. Laptop, Monitor, Desktop PC, Meja Kerja, Kursi Kerja, Kendaraan, Server & Jaringan, Printer & Scanner).",
    ],
    [
      "Merek / Brand",
      "Opsional",
      "Teks",
      "Nama merek produsen atau pabrikan barang (mis. Apple, Dell, Lenovo, Informa, Stramm, Toyota).",
    ],
    [
      "Model / Seri",
      "Opsional",
      "Teks",
      "Tipe varian, spesifikasi singkat, atau nomor model barang (mis. 'U2723QE', 'ThinkPad T14 Gen 4', 'Avanza 1.5 G MT').",
    ],
    [
      "Nomor Seri (Serial No)",
      "Opsional (Sangat Dianjurkan utk IT)",
      "Teks",
      "Serial Number resmi dari pabrikan perangkat keras (membantu klaim garansi dan audit fisik).",
    ],
    [
      "Status Ketersediaan",
      "Opsional (Default: Tersedia di Gudang)",
      "Pilihan Status",
      "Status fisik aset saat ini. Pilihan: 'Tersedia di Gudang' (IN_STOCK), 'Dalam Perbaikan' (MAINTENANCE), 'Dipensiunkan / Rusak' (RETIRED), atau 'Hilang' (LOST). Catatan: Status peminjaman (ASSIGNED) disarankan diproses melalui fitur Serah Terima setelah impor.",
    ],
    [
      "Tanggal Pembelian",
      "Opsional",
      "Format YYYY-MM-DD",
      "Tanggal pengadaan atau pembelian barang. Contoh penulisan yang benar: 2026-01-15.",
    ],
    [
      "Harga Perolehan",
      "Opsional",
      "Angka Murni (Tanpa Titik/Rp)",
      "Nominal harga pembelian barang dalam Rupiah. Masukkan hanya angka murni tanpa simbol Rp atau titik ribuan (contoh: 28500000).",
    ],
    [
      "Lokasi Fisik",
      "Wajib (*)",
      "Teks",
      "Lokasi penempatan barang saat ini (mis. 'Ruang IT / Server Lt. 2', 'Gudang Utama', 'Lantai 1 - Area Riset', 'Kantor PSPK Jakarta').",
    ],
    [
      "Catatan Tambahan",
      "Opsional",
      "Teks Bebas",
      "Informasi riwayat garansi, kelengkapan aksesoris, spesifikasi tambahan, atau kondisi khusus.",
    ],
  ];

  const wsGuidance = XLSX.utils.aoa_to_sheet([guidanceHeaders, ...guidanceRows]);
  wsGuidance["!cols"] = [
    { wch: 24 }, // Nama Kolom
    { wch: 20 }, // Wajib / Opsional
    { wch: 24 }, // Tipe Data
    { wch: 70 }, // Keterangan
  ];

  XLSX.utils.book_append_sheet(wb, wsGuidance, "Panduan Pengisian");

  // -------------------------------------------------------------
  // SHEET 3: KAMUS KATEGORI & TIPE
  // -------------------------------------------------------------
  const dictRows = [
    ["=== KAMUS KATEGORI RESMI PSPK ==="],
    ["Kode Kategori", "Keterangan Cakupan Barang"],
    ["IT", "Seluruh perangkat komputer, laptop, tablet, monitor, server, router, switch, printer, proyektor, dan aksesoris teknologi."],
    ["NON_IT", "Perabot kantor (meja, kursi, lemari), kendaraan operasional dinas, peralatan pendingin ruangan (AC), dan fasilitas umum kantor."],
    [],
    ["=== CONTOH TIPE ASET POPULER ==="],
    ["Kategori", "Rekomendasi Tipe Aset"],
    ["IT", "Laptop"],
    ["IT", "Desktop PC"],
    ["IT", "Monitor"],
    ["IT", "Tablet"],
    ["IT", "Smartphone"],
    ["IT", "Server & Jaringan"],
    ["IT", "Printer & Scanner"],
    ["IT", "Proyektor & Layar"],
    ["IT", "Aksesoris IT"],
    ["NON_IT", "Meja Kerja"],
    ["NON_IT", "Kursi Kerja"],
    ["NON_IT", "Lemari / Rak Dokumen"],
    ["NON_IT", "Kendaraan Operasional"],
    ["NON_IT", "Peralatan Kantor"],
    [],
    ["=== STATUS KETERSEDIAAN ASET ==="],
    ["Label Bahasa Indonesia", "Kode Sistem", "Keterangan"],
    ["Tersedia di Gudang", "IN_STOCK", "Barang siap dipinjamkan atau digunakan di kantor."],
    ["Sedang Dipinjam", "ASSIGNED", "Barang sedang dibawa/digunakan oleh pegawai PSPK."],
    ["Dalam Perbaikan", "MAINTENANCE", "Barang mengalami kendala dan sedang diperbaiki di service center."],
    ["Dipensiunkan / Rusak", "RETIRED", "Barang sudah aus, rusak total, atau tidak lagi layak digunakan."],
    ["Hilang", "LOST", "Barang hilang saat penugasan atau tidak ditemukan saat audit fisik."],
  ];

  const wsDict = XLSX.utils.aoa_to_sheet(dictRows);
  wsDict["!cols"] = [{ wch: 28 }, { wch: 24 }, { wch: 60 }];

  XLSX.utils.book_append_sheet(wb, wsDict, "Kamus Kategori & Tipe");

  // Unduh berkas ke browser
  XLSX.writeFile(wb, "template-impor-aset-pspk.xlsx");
}

/**
 * Mengekspor daftar aset yang sedang difilter/tampil ke berkas spreadsheet Excel (.xlsx) resmi.
 */
export function exportAssetsToXlsx(assets: SerializedAsset[], customFilename?: string) {
  const wb = XLSX.utils.book_new();

  const headers = [
    "Tag Aset",
    "Nama Aset",
    "Kategori",
    "Tipe Aset",
    "Merek",
    "Model / Seri",
    "Nomor Seri",
    "Status",
    "Pemegang Saat Ini",
    "Tanggal Pembelian",
    "Harga Perolehan (Rp)",
    "Lokasi Fisik",
    "Catatan",
    "Tanggal Didaftarkan",
  ];

  const rows = assets.map((a) => {
    let statusLabel = a.status as string;
    switch (a.status) {
      case "IN_STOCK":
        statusLabel = "Tersedia di Gudang";
        break;
      case "ASSIGNED":
        statusLabel = "Sedang Dipinjam";
        break;
      case "MAINTENANCE":
        statusLabel = "Dalam Perbaikan";
        break;
      case "RETIRED":
        statusLabel = "Dipensiunkan";
        break;
      case "LOST":
        statusLabel = "Hilang";
        break;
    }

    const holder = a.activeAssignment?.employee
      ? `${a.activeAssignment.employee.fullName} (${a.activeAssignment.employee.employeeNo})`
      : "-";

    const purchaseDateStr = a.purchaseDate
      ? new Date(a.purchaseDate).toISOString().split("T")[0]
      : "-";

    const createdAtStr = new Date(a.createdAt).toISOString().split("T")[0];

    return [
      a.assetTag,
      a.name,
      a.category === "IT" ? "Perangkat IT" : "Aset Non-IT",
      a.type,
      a.brand || "-",
      a.model || "-",
      a.serialNumber || "-",
      statusLabel,
      holder,
      purchaseDateStr,
      a.purchasePrice !== null ? a.purchasePrice : "-",
      a.location || "-",
      a.notes || "-",
      createdAtStr,
    ];
  });

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  ws["!cols"] = [
    { wch: 24 }, // Tag Aset
    { wch: 32 }, // Nama Aset
    { wch: 18 }, // Kategori
    { wch: 18 }, // Tipe Aset
    { wch: 16 }, // Merek
    { wch: 24 }, // Model
    { wch: 22 }, // Nomor Seri
    { wch: 20 }, // Status
    { wch: 30 }, // Pemegang Saat Ini
    { wch: 18 }, // Tanggal Pembelian
    { wch: 20 }, // Harga Perolehan
    { wch: 24 }, // Lokasi
    { wch: 32 }, // Catatan
    { wch: 18 }, // Tanggal Terdaftar
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Katalog Aset PSPK");

  const todayStr = new Date().toISOString().split("T")[0];
  const fileName = customFilename || `inventaris-aset-pspk-${todayStr}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
