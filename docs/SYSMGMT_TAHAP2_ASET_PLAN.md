# Rencana Implementasi: [Tahap 2] Modul Manajemen Aset & Inventaris Lembaga (`apps/sysmgmt`)

> **Dokumen Referensi:**
> - `md/blue_print.md` / `AGENTS.md` (Spesifikasi Fase 3: Manajemen Aset IT & Non-IT)
> - `md/design_stitch.md` (Layar S5: `/aset` — Daftar Aset, S6: `/aset/[id]` — Detail Aset)
> - Skema Database: `sysmgmt.prisma` (`Asset`, `AssetAssignment`, `AssetStatus`, `AssetCategory`)
> - Aturan Khusus Pengguna: **Modular & Feature-Flagged** — Sub-fitur Serah Terima dapat dihidup/matikan dari Tata Kelola Modul, fitur wajib aset dasar tetap berjalan optimal.
> - Aturan Pelaksanaan: **1 Tahapan 1 Respon** & Verifikasi/Crosscheck Ketat di Setiap Tahap.

---

## 1. Arsitektur Modular & Pembagian Fitur (Wajib vs Fleksibel)

Sesuai kebutuhan organisasi, fitur Manajemen Aset dirancang **modular**:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           MODUL INVENTARIS ASET (/aset)                         │
├───────────────────────────────────────┬─────────────────────────────────────────┤
│    FITUR INTI (Selalu Aktif)          │     SUB-FITUR MODULAR (Feature Flags)   │
├───────────────────────────────────────┼─────────────────────────────────────────┤
│ 1. CRUD Master Inventaris Aset        │ 1. Alur Serah Terima / Peminjaman Staf  │
│    (Tag Unik, Nama, Brand, Serial,    │    (Checkout ke Pegawai, Catat Kondisi  │
│    Harga, Kategori IT / Non-IT, Lokasi) Keluar conditionOut & Masuk conditionIn)│
│ 2. Filter Kategori, Status & Lokasi   │    ► Flag: module.asset_assignment      │
│ 3. Generator Otomatis Tag Aset Unik   │    ► Dapat di-OFF-kan jika belum butuh! │
│ 4. Ekspor & Impor Data Excel (.xlsx)  │ 2. Tab "Aset Pegawai" di HRIS           │
│ 5. Audit Log Transaksi Aset           │    ► Tampil otomatis di /karyawan/[id]  │
└───────────────────────────────────────┴─────────────────────────────────────────┘
```

Jika sub-fitur **"Alur Serah Terima"** dinonaktifkan di Tata Kelola Modul (`/pengguna?tab=modules`):
- Modul tetap berjalan 100% normal sebagai **Katalog & Inventaris Gudang/Kantor**.
- Tombol *"Serah Terima / Pinjamkan"* dan tab *"Riwayat Peminjaman"* disembunyikan secara elegan.
- Status aset disederhanakan (`IN_STOCK`, `MAINTENANCE`, `RETIRED`, `LOST`).

Jika sub-fitur **"Alur Serah Terima"** diaktifkan:
- Tombol *"Serah Terima / Checkout"* dan *"Terima Pengembalian / Checkin"* aktif.
- Menghubungkan pegawai aktif dari `hris.employees`.
- Tracking status `ASSIGNED` aktif.

---

## 2. Rincian Pembagian Sub-Tahapan (1 Tahapan 1 Respon)

Tahap 2 dibagi menjadi **5 Sub-Tahapan Terukur**:

```
[Tahap 2: Manajemen Aset Sysmgmt]
  ├── Sub-Tahap 2A: Feature Flags, Schema Verification & Backend Query/Action Dasar
  ├── Sub-Tahap 2B: Antarmuka Direktori Aset & Form Tambah/Ubah Aset (/aset)
  ├── Sub-Tahap 2C: Sub-Modul Serah Terima & Pengembalian Aset (Checkout & Checkin)
  ├── Sub-Tahap 2D: Generator Template & Wizard Impor Data Aset Excel (.xlsx)
  └── Sub-Tahap 2E: Integrasi Balik Tab Aset di HRIS, Crosscheck Menyeluruh, & Quality Gate
```

---

### Sub-Tahap 2A: Feature Flags, Schema Verification & Backend Query/Action Dasar
*Fokus: Pendaftaran flag modular di `@pspk/db`, query data aset, server action CRUD dasar, dan unit test.*

* **Tugas Spesifik:**
  1. Mendaftarkan definisi feature flag modular di [`packages/db/src/modules.ts`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/packages/db/src/modules.ts):
     - `module.asset_management.enabled`: Modul Inventaris Aset (Default: Aktif).
     - `module.asset_assignment.enabled`: Alur Serah Terima & Peminjaman Pegawai (Default: Aktif, namun dapat di-toggle off kapan saja).
  2. Membuat berkas query: `apps/sysmgmt/src/server/queries/asset.queries.ts`:
     - `getAssetsDirectory()`: Daftar aset dengan filter (kategori IT/Non-IT, status, search nama/tag/serial, pagination).
     - `getAssetById()`: Detail lengkap aset beserta relasi riwayat peminjaman (`assignments`).
     - `getAssetStats()`: Metrik total unit, in-stock, assigned, maintenance, retired.
     - `getNextAssetTag()`: Generator tag otomatis (format: `PSPK-IT-XXXX` atau `PSPK-NONIT-XXXX`).
  3. Membuat skema validasi Zod: `apps/sysmgmt/src/server/schemas/asset.schema.ts`.
  4. Membuat Server Actions: `apps/sysmgmt/src/server/actions/asset.actions.ts`:
     - `createAssetAction`: Tambah aset baru + audit log `CREATE Asset`.
     - `updateAssetAction`: Ubah aset + audit log `UPDATE Asset`.
     - `deleteAssetAction`: Hapus aset aman (dicegah jika sedang dipinjam).
  5. Membuat Unit Tests: `apps/sysmgmt/src/server/actions/asset.actions.test.ts` & `asset.queries.test.ts`.
* **Crosscheck & Checklist Verifikasi:**
  - [ ] Validasi tag aset unik (`assetTag`).
  - [ ] Serialisasi nilai `purchasePrice` (Prisma Decimal) ke angka/string yang aman.
  - [ ] Pengujian unit lolos via `pnpm test`.

---

### Sub-Tahap 2B: Antarmuka Direktori Aset & Form Tambah/Ubah Aset (`/aset`)
*Fokus: Halaman daftar inventaris aset (Layar S5), filter multi-dimensi, modal tambah & edit aset.*

* **Tugas Spesifik:**
  1. Membuat rute halaman Server Component: [`apps/sysmgmt/src/app/(app)/aset/page.tsx`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/sysmgmt/src/app/(app)/aset/page.tsx).
  2. Membangun komponen utama: `apps/sysmgmt/src/components/assets/asset-list-view.tsx`:
     - Kartu statistik ringkasan di bagian atas (Total Unit, Tersedia di Gudang, Sedang Dipinjam, Perbaikan).
     - Bilah pencarian instan (nama aset, nomor seri, tag aset, merek).
     - Filter tabs kategori (Semua, Perangkat IT, Aset Non-IT).
     - Filter dropdown status ketersediaan.
  3. Membangun tabel aset interaktif (`AssetTable`):
     - Kolom: Tag Aset, Nama & Merek, Kategori & Tipe, Status Ketersediaan (Badge Warna), Lokasi, Aksi.
  4. Membangun modal form tambah & edit (`AssetFormModal`):
     - Pilihan kategori (`IT` / `NON_IT`) & Tipe barang (Laptop, Monitor, Meja, Kendaraan, dll).
     - Tombol helper *"Buat Tag Otomatis"* dan input manual `assetTag`.
     - Nomor seri / serial number, tanggal pembelian, harga perolehan (Rupiah), lokasi penempatan, dan catatan.
  5. Memperbarui navbar [`SysmgmtNavbar`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/sysmgmt/src/components/shell/sysmgmt-navbar.tsx):
     - Menghilangkan badge nonaktif pada menu *"Inventaris Aset"* (`/aset`), menjadikannya menu aktif penuh.
* **Crosscheck & Checklist Verifikasi:**
  - [ ] CRUD data aset tersimpan aman di database PostgreSQL.
  - [ ] Desain visual konsisten dengan brand identity PSPK (Navy & Gold).
  - [ ] Validasi form client-side & server-side mencegah data tag duplikat.

---

### Sub-Tahap 2C: Sub-Modul Serah Terima & Pengembalian Aset (Modular Feature-Flagged)
*Fokus: Alur peminjaman ke staf HRIS, pencatatan kondisi keluar/masuk, riwayat peminjaman, dan kondisional feature flag.*

* **Tugas Spesifik:**
  1. Query pembantu peminjaman di `asset.queries.ts`:
     - `getActiveEmployeesForAssignment()`: Mengambil daftar staf aktif dari `hris.employees` untuk pilihan dropdown penerima.
  2. Server Actions alur serah terima di `asset.actions.ts`:
     - `checkoutAssetAction`: Menyerahkan aset ke pegawai (status $\to$ `ASSIGNED`, membuat record `AssetAssignment`, mencatat `conditionOut` dan tanggal keluar).
     - `checkinAssetAction`: Menerima pengembalian (menutup `returnedAt`, mencatat `conditionIn`, mengubah status aset ke `IN_STOCK` atau `MAINTENANCE` sesuai kondisi).
  3. Komponen modal interaktif:
     - `AssetCheckoutModal`: Memilih nama pegawai penerima, tanggal penyerahan, kondisi fisik awal, dan catatan penugasan.
     - `AssetCheckinModal`: Memilih tanggal pengembalian, kondisi fisik barang saat diterima kembali, dan opsi status lanjutan (Gudang / Servis).
  4. Halaman detail aset [`/aset/[id]`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/sysmgmt/src/app/(app)/aset/[id]/page.tsx):
     - Menampilkan spesifikasi aset lengkap, status pemegang saat ini, dan tabel kronologis riwayat peminjaman lampau.
  5. **Pengkondisian Feature Flag**:
     - Membaca flag `module.asset_assignment.enabled`. Jika nonaktif:
       - Tombol checkout/checkin disembunyikan.
       - Kolom pemegang barang di tabel digantikan status gudang.
       - Tab riwayat peminjaman disembunyikan.
* **Crosscheck & Checklist Verifikasi:**
  - [ ] Aset yang sedang `ASSIGNED` tidak bisa dipinjamkan ke staf lain (mencegah double-checkout).
  - [ ] Aset yang di-checkout otomatis mengupdate status di database dalam `$transaction`.
  - [ ] Mengubah status feature flag di `/pengguna?tab=modules` langsung merespons tampilan modul aset secara instan.

---

### Sub-Tahap 2D: Generator Template & Wizard Impor Data Aset Excel (`.xlsx`)
*Fokus: Impor massal data inventaris dari spreadsheet Excel lama ke sistem baru.*

* **Tugas Spesifik:**
  1. Membuat generator template Excel multi-sheet: `apps/sysmgmt/src/lib/excel-asset-templates.ts`:
     - Template resmi: `template-impor-aset-pspk.xlsx` (Sheet: *Data Aset*, *Panduan Pengisian*, *Kamus Kategori & Tipe*).
  2. Membuat parser & komponen modal impor: `AssetExcelImporterModal`:
     - Validasi file `.xlsx` di browser.
     - Pratinjau tabel baris sebelum eksekusi transaksi (deteksi tag duplikat, format harga, dll).
  3. Server action impor massal: `importAssetsBatchAction` dengan transaksi batch dan audit trail `IMPORT_ASSETS`.
* **Crosscheck & Checklist Verifikasi:**
  - [ ] Parser membaca file `.xlsx` biner tanpa masalah regional delimiter.
  - [ ] Laporan detail baris yang berhasil diimpor dan baris yang gagal.

---

### Sub-Tahap 2E: Integrasi Balik Tab Aset di HRIS, Crosscheck Menyeluruh, & Quality Gate
*Fokus: Pengecekan silang multi-aplikasi, tab aset di profil pegawai HRIS, dan verifikasi akhir.*

* **Tugas Spesifik:**
  1. Menambahkan tab informatif **"Aset yang Dibawa"** di profil pegawai HRIS ([`apps/hris/src/app/(app)/karyawan/[id]/page.tsx`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/app/(app)/karyawan/[id]/page.tsx)):
     - Menampilkan daftar perangkat kantor yang sedang dipinjam oleh staf tersebut (hanya muncul jika flag `asset_assignment` aktif).
     - Sangat bermanfaat untuk HR saat proses *offboarding / resign*.
  2. Menjalankan pemeriksaan kualitas penuh:
     - `pnpm typecheck` di seluruh 9 paket workspace.
     - `pnpm lint` memastikan 0 error.
     - `pnpm test` memastikan seluruh unit test hijau 100%.
     - `pnpm --filter @pspk/sysmgmt build` dan `pnpm --filter @pspk/hris build`.
  3. Memperbarui dokumentasi kemajuan di [`docs/PROGRESS.md`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/docs/PROGRESS.md).
* **Crosscheck & Checklist Verifikasi:**
  - [ ] 0 error TypeScript dan ESLint di seluruh workspace.
  - [ ] Keterkaitan HRIS $\leftrightarrow$ Sysmgmt terverifikasi tanpa *circular dependency*.
