# Rencana Implementasi: [Tahap 3] Modul Manajemen Lisensi Perangkat Lunak (`apps/sysmgmt`)

> **Dokumen Referensi:**
> - `md/blue_print.md` / `AGENTS.md` (Spesifikasi Fase 3: Lisensi Software)
> - `md/design_stitch.md` (Layar S7: `/lisensi` — Lisensi Software)
> - Skema Database: `sysmgmt.prisma` (`SoftwareLicense`)
> - Aturan Keamanan & Audit: AES-256-GCM enkripsi kolom `licenseKeyEnc`, audit log wajib untuk mutasi data dan `VIEW_SENSITIVE` pada pembukaan kunci lisensi.
> - Aturan Pelaksanaan: **1 Tahapan 1 Respon** & Verifikasi/Crosscheck Ketat di Setiap Tahap.

---

## 1. Arsitektur & Spesifikasi Fungsional Modul Lisensi

Modul Lisensi Software mengelola seluruh langganan aplikasi/SaaS berbayar organisasi PSPK (*Google Workspace, Zoom, Figma, Microsoft 365, Adobe CC, Canva, JetBrains, ChatGPT Enterprise, Antivirus*):

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    MODUL MANAJEMEN LISENSI SOFTWARE (/lisensi)                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│ 1. Metrik Ringkasan Eksekutif (4 Indikator)                                     │
│    - Total Langganan Aktif                                                      │
│    - Total Alokasi Kursi (Seats Used vs Seats Total)                            │
│    - Lisensi Mendekati Penuh (> 80% Utilisasi)                                  │
│    - Peringatan Kedaluwarsa (<= 30 Hari atau Sudah Expired)                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│ 2. Direktori Tabel Lisensi & Visualisasi Interaktif                             │
│    - Nama Aplikasi & Vendor Penyedia                                            │
│    - Progress Bar Utilisasi Kursi (Hijau <80%, Kuning 80-99%, Merah 100%)       │
│    - Status Kedaluwarsa (Badge Hijau/Kuning/Merah/Abu-abu Lifetime)             │
│    - Masked Product Key (••••••••) + Tombol "Lihat Kunci" (Audited)             │
│    - Filter Cepat: Semua, Segera Berakhir, Kuota Penuh, Vendor                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│ 3. Keamanan Kunci Produk (Product Key / License Key)                            │
│    - Enkripsi Aplikasi: AES-256-GCM (`encryptField` & `decryptField`)           │
│    - Kunci tidak pernah diekspos dalam query daftar (mencegah kebocoran)        │
│    - Server Action `revealLicenseKeyAction` mewajibkan izin & mencatat log      │
│      audit kejadian: `VIEW_SENSITIVE` (Aktor, Timestamp, Entitas, IP)           │
├─────────────────────────────────────────────────────────────────────────────────┤
│ 4. Operasi CRUD & Audit Mutasi                                                  │
│    - Modal Tambah & Ubah Lisensi (Input Nama, Vendor, Kursi, Tanggal, Kunci)    │
│    - Konfirmasi Hapus Aman                                                      │
│    - Pencatatan Audit Log: `CREATE`, `UPDATE`, `DELETE` ke `core.audit_logs`     │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Rincian Pembagian Sub-Tahapan (1 Tahapan 1 Respon)

Tahap 3 dibagi menjadi **4 Sub-Tahapan Terukur**:

```
[Tahap 3: Manajemen Lisensi Sysmgmt]
  ├── Sub-Tahap 3A: Backend Schemas, Enkripsi, Queries, Actions & Unit Tests
  ├── Sub-Tahap 3B: Antarmuka Direktori Lisensi, Metrik Ringkasan & Tabel Interaktif (/lisensi)
  ├── Sub-Tahap 3C: Modal Tambah/Ubah Lisensi, Modal Buka Kunci (Audited), & Dialog Hapus
  └── Sub-Tahap 3D: Navigasi Navbar, Quick Action Dashboard, Crosscheck & Quality Gate
```

---

### Sub-Tahap 3A: Backend Schemas, Enkripsi, Queries, Actions & Unit Tests
*Fokus: Validasi Zod, query database teroptimasi, enkripsi AES-256-GCM, audit log `VIEW_SENSITIVE`, dan unit tests.*

* **Tugas Spesifik:**
  1. Membuat skema validasi Zod: `apps/sysmgmt/src/server/schemas/license.schema.ts`:
     - `createLicenseSchema`: `name`, `vendor`, `seatsTotal`, `seatsUsed`, `purchaseDate`, `expiresAt`, `licenseKey`, `notes`.
     - `updateLicenseSchema`: `id` + field parsial di atas.
     - `revealLicenseKeySchema`: `id`, `reason` (opsional untuk audit).
     - `deleteLicenseSchema`: `id`.
  2. Membuat query database: `apps/sysmgmt/src/server/queries/license.queries.ts`:
     - `getLicensesDirectory()`: Mengambil daftar lisensi dengan filter status (aktif, segera expired, penuh), filter vendor, pencarian teks (nama/vendor/notes), dan sortir.
       - *Penting:* Field `licenseKeyEnc` **tidak** di-decrypt di query ini, melainkan hanya mengembalikan `hasKey: boolean` dan status masked untuk keamanan.
     - `getLicenseStats()`: Menghitung total lisensi, total kursi dialokasikan (`seatsUsed`/`seatsTotal`), lisensi expired/mendekati expired (≤ 30 hari), dan lisensi kuota kritis (≥ 80%).
     - `getLicenseById(id)`: Mengambil 1 record lisensi untuk modal edit.
  3. Membuat Server Actions: `apps/sysmgmt/src/server/actions/license.actions.ts`:
     - Proteksi RBAC di level server: `sysmgmt.license.manage:all` dan `sysmgmt.license.read:all`.
     - `createLicenseAction`: Simpan lisensi baru; jika `licenseKey` diisi, lakukan `encryptField()` sebelum simpan. Catat audit log `CREATE SoftwareLicense`.
     - `updateLicenseAction`: Perbarui data; jika `licenseKey` baru diberikan, perbarui `licenseKeyEnc`. Catat audit log `UPDATE SoftwareLicense`.
     - `revealLicenseKeyAction`: Buka kunci lisensi terenkripsi dengan `decryptField()`. Catat audit log `VIEW_SENSITIVE` dengan detail nama & vendor lisensi.
     - `deleteLicenseAction`: Hapus lisensi aman + catat audit log `DELETE SoftwareLicense`.
  4. Membuat Unit Tests Vitest:
     - `apps/sysmgmt/src/server/queries/license.queries.test.ts`
     - `apps/sysmgmt/src/server/actions/license.actions.test.ts`

* **Checklist Verifikasi:**
  - [ ] Enkripsi dan dekripsi menggunakan AES-256-GCM dari `@pspk/shared`.
  - [ ] Kunci lisensi plain text **tidak pernah** masuk ke dalam detail audit log.
  - [ ] Seluruh unit test query & action lolos 100%.

---

### Sub-Tahap 3B: Antarmuka Direktori Lisensi, Metrik Ringkasan & Tabel Interaktif (`/lisensi`)
*Fokus: Rute `/lisensi`, kartu statistik utilisasi & peringatan, pencarian & filter, serta tabel lisensi.*

* **Tugas Spesifik:**
  1. Membuat rute halaman Server Component: `apps/sysmgmt/src/app/(app)/lisensi/page.tsx`:
     - Pengecekan sesi & hak akses `sysmgmt.license.read:all`.
     - Fetch data paralel: `getLicensesDirectory()` dan `getLicenseStats()`.
  2. Membangun komponen utama: `apps/sysmgmt/src/components/licenses/license-list-view.tsx`:
     - 4 Kartu Metrik Ringkasan:
       - Total Lisensi Aktif
       - Utilisasi Kursi Global (% terpakai)
       - Lisensi Kritis / Penuh (≥ 80%)
       - Peringatan Kedaluwarsa (≤ 30 Hari atau Kedaluwarsa)
     - Bilah Filter & Pencarian:
       - Input pencarian (Nama tools atau Vendor)
       - Filter Dropdown Status: Semua, Segera Berakhir (≤ 30 hari), Kuota Penuh (100%), Tersedia Kursi.
       - Filter Dropdown Vendor.
       - Tombol "Tambah Lisensi".
  3. Membangun komponen tabel: `apps/sysmgmt/src/components/licenses/license-table.tsx`:
     - Kolom:
       - **Perangkat Lunak & Vendor**: Ikon tools, nama lisensi, vendor penyedia.
       - **Kapasitas Kursi**: Teks `X dari Y kursi` + Progress Bar dinamis (warna: emerald `<80%`, amber `80-99%`, rose `100%`).
       - **Masa Berlaku**: Tanggal berakhir + Badge status (`Aktif`, `Segera Berakhir [H-X]`, `Kedaluwarsa`, `Langganan Tetap`).
       - **Kunci Produk**: Badge `••••••••` + Tombol mata *"Lihat Kunci"* (memicu aksi ter-audit).
       - **Aksi**: Menu dropdown (Ubah Data, Hapus Lisensi).

* **Checklist Verifikasi:**
  - [ ] Progress bar utilisasi kursi memiliki warna adaptif sesuai rasio.
  - [ ] Badge kedaluwarsa menghitung selisih hari dengan akurat (≤ 30 hari = amber, < 0 hari = rose).
  - [ ] Antarmuka responsif dan selaras dengan standar desain PSPK.

---

### Sub-Tahap 3C: Modal Tambah/Ubah Lisensi, Modal Buka Kunci (Audited), & Dialog Hapus
*Fokus: Formulir interaktif, alur pengungkapan kunci rahasia dengan audit trail, dan modal hapus.*

* **Tugas Spesifik:**
  1. Membangun `apps/sysmgmt/src/components/licenses/license-form-modal.tsx`:
     - Input Vendor (dengan saran otomatis: Google, Zoom, Microsoft, Figma, JetBrains, Canva, Adobe, OpenAI, dll).
     - Input Nama Software (contoh: Google Workspace Enterprise).
     - Input Kursi: Total Kursi & Kursi Terpakai (dengan validasi kursi terpakai ≤ total kursi atau warning).
     - Input Tanggal Pembelian & Tanggal Kedaluwarsa (opsional jika subscription tanpa akhir).
     - Input Kunci Lisensi / Serial Key (opsional): placeholder "Biarkan kosong jika tidak diubah" saat mode edit.
     - Input Catatan / ID Akun Pembayaran.
  2. Membangun `apps/sysmgmt/src/components/licenses/license-key-reveal-modal.tsx`:
     - Dialog peringatan keamanan: *"Membuka kunci lisensi ini akan dicatat ke dalam buku besar audit log sistem atas nama [Pengguna]."*
     - Tombol konfirmasi *"Tampilkan Kunci"*.
     - Area tampilan kunci lisensi terdekripsi dalam format monospaced tebal + Tombol *"Salin Kunci"* dengan feedback visual.
  3. Membangun `apps/sysmgmt/src/components/licenses/license-delete-modal.tsx`:
     - Dialog konfirmasi hapus aman dengan detail nama lisensi dan jumlah kursi aktif.

* **Checklist Verifikasi:**
  - [ ] Aksi buka kunci berhasil memanggil `revealLicenseKeyAction` dan mencatat entri log `VIEW_SENSITIVE`.
  - [ ] Fitur salin kunci ke clipboard berjalan mulus dengan notifikasi toast.
  - [ ] Form tambah & ubah menangani nilai tanggal dan enkripsi dengan aman.

---

### Sub-Tahap 3D: Navigasi Navbar, Quick Action Dashboard, Crosscheck & Quality Gate
*Fokus: Mengaktifkan menu Lisensi di navbar Sysmgmt, menghubungkan tombol Quick Action di Dashboard, dan verifikasi menyeluruh.*

* **Tugas Spesifik:**
  1. Memperbarui `apps/sysmgmt/src/components/shell/sysmgmt-navbar.tsx`:
     - Menambahkan menu *"Lisensi Software"* (`/lisensi`, icon `KeyRound` dari Lucide) pada daftar navigasi utama Sysmgmt.
  2. Menghubungkan pintasan pada Dashboard Eksekutif TI (`apps/sysmgmt/src/components/dashboard/dashboard-view.tsx`):
     - Memastikan kartu metrik "Lisensi Software" dan tombol quick action *"Input Lisensi"* mengarah tepat ke `/lisensi`.
  3. Menjalankan Quality Gate Monorepo:
     - `pnpm typecheck` (seluruh 9 paket).
     - `pnpm lint` (0 error).
     - `pnpm test` (seluruh test suites lolos).
     - `pnpm build` (memastikan build produksi sysmgmt & hris bebas kendala).
  4. Memperbarui catatan progres di `docs/PROGRESS.md`.

* **Checklist Verifikasi:**
  - [ ] Menu navbar `/lisensi` aktif dan menyorot rute aktif dengan tepat.
  - [ ] Seluruh skenario pengujian unit & integrasi lolos tanpa regresi.

---

## 3. Matriks Hak Akses (RBAC) & Audit Log untuk Modul Lisensi

| Aksi Pengguna | Permission yang Dicek | Aksi Audit Log (`core.audit_logs`) | Catatan Khusus |
| :--- | :--- | :--- | :--- |
| Membuka Halaman `/lisensi` | `sysmgmt.license.read:all` | — | Akses halaman terproteksi |
| Menambah Lisensi Baru | `sysmgmt.license.manage:all` | `CREATE SoftwareLicense` | Kunci dienkripsi, plain key **tidak** masuk log |
| Mengubah Data Lisensi | `sysmgmt.license.manage:all` | `UPDATE SoftwareLicense` | Mencatat perubahan nama, vendor, kursi, tgl expired |
| Melihat Kunci Lisensi (Unmask) | `sysmgmt.license.manage:all` | `VIEW_SENSITIVE` | **Wajib audit**, mencatat aktor, waktu, IP, & ID lisensi |
| Menghapus Lisensi | `sysmgmt.license.manage:all` | `DELETE SoftwareLicense` | Mencatat lisensi yang dihapus |

---

## 4. Rekomendasi Titik Mulai (Next Step)

Titik awal yang paling kokoh dan sesuai dengan metodologi TDD/clean architecture adalah:
👉 **Mulai dari Sub-Tahap 3A: Backend Schemas, Enkripsi, Queries, Actions & Unit Tests.**

Setelah fondasi backend, enkripsi AES-256-GCM, dan tes terverifikasi 100%, kita dapat langsung melangkah ke pembangunan antarmuka visual tabel dan modal di Sub-Tahap 3B & 3C.
