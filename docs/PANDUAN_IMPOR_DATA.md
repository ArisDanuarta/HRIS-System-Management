# Panduan Resmi Impor Data & Template Excel (.xlsx) HRIS PSPK

Dokumen ini merupakan panduan operasional bagi Tim HR (Human Resources) dan Administrator Sistem PSPK dalam mempersiapkan, mengisi, dan mengimpor data ke dalam sistem HRIS PSPK menggunakan format **Microsoft Excel Workbook (`.xlsx`)**.

---

## 1. Alasan Penggunaan Format `.xlsx` (Bukan `.csv`)

Sistem HRIS PSPK secara resmi mengadopsi format **`.xlsx` (Excel Workbook)** murni dan tidak lagi merekomendasikan `.csv` mentah untuk pengisian manual oleh pengguna, karena alasan-alasan berikut:

1. **Masalah Delimiter Regional di Microsoft Excel:**
   Pada sistem operasi macOS dan Windows dengan pengaturan regional bahasa Indonesia atau Eropa, Microsoft Excel secara bawaan menggunakan pemisah titik-koma (`;`), bukan koma (`,`). Akibatnya, saat berkas `.csv` dibuka langsung di Excel, seluruh data menggumpal menjadi satu teks panjang di **Kolom A** dan kolom-kolomnya tidak terpisah.
2. **Kehilangan Format Teks & Angka Kritis:**
   Pada berkas `.csv`, angka yang diawali angka nol (seperti nomor telepon `0812...` atau kode NIP) sering kali otomatis dipotong oleh Excel menjadi angka biasa tanpa nol di depan, atau diubah menjadi notasi ilmiah (_scientific notation_).
3. **Dukungan Lembar Kerja Multi-Sheet:**
   Format `.xlsx` memungkinkan sistem menyediakan **3 Sheet sekaligus** dalam satu berkas template:
   - **Sheet 1 (`Data Pegawai`):** Kolom formulir input yang rapi dengan lebar kolom teratur dan 3 baris data contoh konkret.
   - **Sheet 2 (`Panduan Pengisian`):** Kamus data yang menjelaskan detail sifat kolom, format, dan aturan bisnis.
   - **Sheet 3 (`Referensi Master Data`):** Daftar nama divisi resmi, formasi jabatan, dan tipe ikatan kerja aktif yang diambil langsung dari database PSPK saat template diunduh.

---

## 2. Template yang Tersedia di Sistem HRIS

Sistem menyediakan 3 jenis template `.xlsx` resmi yang dapat diunduh langsung melalui menu **Direktori Pegawai → Impor Excel** (`/karyawan/impor`):

### A. Template Impor Data Pegawai (`template-impor-pegawai-pspk.xlsx`)

Digunakan untuk mendaftarkan pegawai baru secara massal ke dalam database lembaga, lengkap dengan pembuatan kontrak kerja perdana dan histori penempatan.

#### Daftar 18 Kolom Formulir:

|   No   | Nama Kolom Header              |    Sifat    | Tipe Data & Format     | Contoh Pengisian                            | Keterangan & Aturan Sistem                                                |
| :----: | :----------------------------- | :---------: | :--------------------- | :------------------------------------------ | :------------------------------------------------------------------------ |
| **1**  | `Nama Lengkap *`               |  **Wajib**  | Teks                   | `Dr. Aris Sudrajat M.Pd.`                   | Nama resmi pegawai beserta gelar akademik.                                |
| **2**  | `Nama Panggilan`               |  Opsional   | Teks Singkat           | `Aris`                                      | Nama panggilan untuk sapaan di dashboard.                                 |
| **3**  | `NIP *`                        |  **Wajib**  | Teks Unik              | `PSPK-202610-091`                           | Nomor Induk Pegawai unik lembaga PSPK. Tidak boleh duplikat.              |
| **4**  | `Email Kantor *`               |  **Wajib**  | Email Valid            | `aris.sudrajat@pspk.id`                     | Email institusi untuk kredensial login dan notifikasi.                    |
| **5**  | `Email Pribadi`                |  Opsional   | Email Valid            | `aris.personal@gmail.com`                   | Email pribadi untuk darurat/kontak alternatif.                            |
| **6**  | `No HP / WhatsApp *`           |  **Wajib**  | Nomor Telepon          | `081234567890`                              | Nomor seluler aktif atau WhatsApp yang dapat dihubungi.                   |
| **7**  | `Divisi / Departemen *`        |  **Wajib**  | Teks Divisi            | `Divisi Kebijakan Kurikulum & Pembelajaran` | Nama divisi kerja. Sesuai sheet Referensi Master Data.                    |
| **8**  | `Jabatan / Posisi *`           |  **Wajib**  | Teks Jabatan           | `Peneliti Kebijakan Kurikulum Utama`        | Formasi jabatan dalam unit kerja terkait.                                 |
| **9**  | `Tipe Ikatan Kerja *`          |  **Wajib**  | Teks Ikatan Kerja      | `Pegawai Tetap` atau `PKWT Riset`           | Master ikatan kerja (dicocokkan otomatis ke sistem).                      |
| **10** | `Skema Upah *`                 |  **Wajib**  | Pilihan                | `Gaji Bulanan` atau `Per Jam`               | Menentukan metode perhitungan kompensasi.                                 |
| **11** | `Gaji Pokok / Tarif Per Jam *` |  **Wajib**  | Angka Murni            | `18000000` atau `50000`                     | **Hanya angka tanpa Rp dan tanpa titik.** Nominal bulanan atau tarif/jam. |
| **12** | `Tanggal Mulai Kerja *`        |  **Wajib**  | Tanggal (`YYYY-MM-DD`) | `2026-10-01`                                | Tanggal efektif mulai bekerja di lingkungan PSPK.                         |
| **13** | `Tanggal Berakhir Kontrak`     | Kondisional | Tanggal (`YYYY-MM-DD`) | `2027-09-30`                                | **Wajib diisi jika PKWT/Magang.** Kosongkan jika Pegawai Tetap.           |
| **14** | `Jenis Kelamin`                |  Opsional   | Pilihan                | `Laki-laki` atau `Perempuan`                | Data demografi kepegawaian.                                               |
| **15** | `Status Pernikahan`            |  Opsional   | Pilihan                | `Menikah` atau `Lajang`                     | Acuan profil tunjangan/PTKP pajak.                                        |
| **16** | `Nama Bank`                    |  Opsional   | Teks Bank              | `Bank Mandiri`                              | Bank payroll lembaga (bawaan: Bank Mandiri).                              |
| **17** | `Nomor Rekening Bank`          |  Opsional   | Angka Rekening         | `1230009876543`                             | Rekening payroll pegawai (dienkripsi aman AES-256).                       |
| **18** | `Nama Pemilik Rekening`        |  Opsional   | Teks                   | `Aris Sudrajat`                             | Nama nasabah tercantum pada buku rekening.                                |

---

### B. Template Rekap Presensi & Timesheet (`template-impor-presensi-pspk.xlsx`)

Digunakan untuk mengimpor log presensi harian dari sistem absensi eksternal, kartu akses, atau rekapitulasi jam kerja proyek:

| Nama Kolom           |  Sifat   | Format           | Contoh                                                                |
| :------------------- | :------: | :--------------- | :-------------------------------------------------------------------- |
| `NIP Pegawai *`      |  Wajib   | Teks Unik        | `PSPK-202610-091`                                                     |
| `Nama Pegawai`       | Opsional | Teks             | `Dr. Aris Sudrajat M.Pd.`                                             |
| `Tanggal Presensi *` |  Wajib   | `YYYY-MM-DD`     | `2026-10-05`                                                          |
| `Jam Masuk *`        |  Wajib   | `HH:mm` (24 Jam) | `08:30`                                                               |
| `Jam Keluar`         | Opsional | `HH:mm` (24 Jam) | `17:30`                                                               |
| `Status Presensi *`  |  Wajib   | Status           | `HADIR`, `TERLAMBAT`, `PULANG_CEPAT`, `IZIN`, `SAKIT`, `CUTI`, `ALFA` |
| `Total Durasi Kerja` | Opsional | Angka Desimal    | `8.0`                                                                 |
| `Catatan Kegiatan`   | Opsional | Teks             | `Riset lapangan kurikulum fase A`                                     |

---

### C. Template Struktur Organisasi & Jabatan (`template-impor-organisasi-pspk.xlsx`)

Digunakan untuk menyiapkan atau menyelaraskan bagan organisasi unit riset:

| Nama Kolom                   |  Sifat   | Format / Nilai yang Valid                                            |
| :--------------------------- | :------: | :------------------------------------------------------------------- |
| `Nama Divisi *`              |  Wajib   | Teks nama unit/divisi operasional                                    |
| `Tipe Divisi *`              |  Wajib   | Salah satu dari: `GOVERNANCE`, `LEADERSHIP`, `INITIATIVE`, `SUPPORT` |
| `Nama Formasi Jabatan *`     |  Wajib   | Teks formasi jabatan riset/operasional                               |
| `Pimpinan Unit (YA / TIDAK)` |  Wajib   | `YA` jika merupakan kepala divisi/unit, `TIDAK` jika bukan           |
| `Keterangan`                 | Opsional | Deskripsi ruang lingkup kerja                                        |

---

## 3. Alur Kerja Langkah demi Langkah di Aplikasi

1. **Masuk ke Halaman Impor:**
   - Buka menu **Direktori Pegawai** (`/karyawan`) dengan akun berhak akses **Admin HR** atau **Super Admin**.
   - Klik tombol **Impor Excel** di sudut kanan atas untuk membuka halaman `/karyawan/impor`.
2. **Unduh Template:**
   - Klik tombol emas **Unduh Template Pegawai (.xlsx)**. Berkas `.xlsx` yang diunduh akan otomatis memuat daftar divisi dan tipe ikatan kerja riil yang aktif di sistem saat itu.
3. **Pengisian Data di Microsoft Excel:**
   - Buka berkas dengan Microsoft Excel, Apple Numbers, LibreOffice Calc, atau Google Sheets.
   - Buka lembar kerja (sheet) **`Data Pegawai`**.
   - Anda dapat menghapus 3 baris data contoh atau menggantinya dengan data pegawai asli.
   - Pastikan format tanggal adalah **Tahun-Bulan-Hari (`2026-10-01`)** dan nominal gaji/tarif adalah **angka murni tanpa titik**.
   - Simpan berkas (format tetap `.xlsx`).
4. **Unggah Berkas ke Sistem:**
   - Seret atau klik area dropzone untuk memilih berkas `.xlsx` yang telah diisi.
   - Sistem akan memproses dan memvalidasi setiap baris secara instan di peramban (browser).
5. **Pemeriksaan Pratinjau (Preview Validation):**
   - Periksa tabel pratinjau:
     - Baris berstatus **Valid (Hijau)** menandakan seluruh kolom wajib terisi dengan benar.
     - Baris berstatus **Gagal (Merah)** akan menampilkan keterangan kesalahan spesifik (misal: "Format email tidak valid", "NIP wajib diisi").
6. **Eksekusi Impor:**
   - Klik tombol **Eksekusi Impor**. Sistem akan menyimpan transaksi massal ke database dan mencatat _audit trail_ lengkap.
   - Sistem menampilkan ringkasan jumlah pegawai yang berhasil didaftarkan dan daftar baris yang dilewati (jika ada).

---

## 4. Tanya Jawab & Troubleshooting (FAQ)

### Q1: Mengapa ada baris data yang dilewati saat eksekusi impor?

**Jawaban:**
Sistem memproteksi database dari duplikasi. Jika NIP atau Email Kantor pada baris data tersebut **sudah terdaftar** pada database pegawai PSPK sebelumnya, sistem akan otomatis melewati baris tersebut dan melaporkannya pada kotak hasil impor tanpa membatalkan baris lainnya yang valid.

### Q2: Bagaimana cara menulis nomor handphone agar angka `0` di depan tidak hilang di Excel?

**Jawaban:**
Pada Microsoft Excel, Anda dapat mengetik tanda petik satu (`'`) sebelum angka, misalnya: `'081234567890`. Tanda petik tersebut memastikan Excel memperlakukannya sebagai teks sehingga angka nol di depan tidak akan hilang.

### Q3: Bagaimana jika divisi atau jabatan pegawai belum terdaftar di sistem?

**Jawaban:**
Sistem memiliki mekanisme toleransi cerdas (_auto-create_). Jika nama divisi atau jabatan yang Anda tulis di template belum ada di sistem, sistem akan otomatis mendaftarkan divisi dan formasi jabatan baru tersebut ke dalam struktur organisasi saat proses impor dieksekusi. Namun, sangat disarankan menggunakan nama yang seragam sesuai sheet **Referensi Master Data**.

### Q4: Apakah sistem tetap bisa menerima file CSV lama?

**Jawaban:**
Ya, parser sistem kami fleksibel dan tetap dapat membaca file `.csv` atau `.xls` sebagai alternatif cadangan. Namun, untuk hasil terbaik dan bebas dari masalah pemisahan kolom, selalu gunakan format `.xlsx`.
