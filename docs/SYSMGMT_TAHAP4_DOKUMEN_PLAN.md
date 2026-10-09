# Rencana Implementasi: Tahap 4 — Modul Dokumen Kebijakan & SOP Lembaga (`apps/sysmgmt`)

> **Dokumen Referensi:**
> - *Dokumen Analisis & Blueprint Sistem HRIS & System Management PSPK* (September 2026)
> - `AGENTS.md` (Pasal 8.4 Dokumen/SOP, Pasal 9.1 Storage, Pasal 9.2 Audit Log)
> - `md/design_stitch.md` (Layar P-S8: Dokumen & SOP Repository, Layar P-S9: Detail Dokumen & Riwayat Versi)
> - `packages/db/prisma/schema/sysmgmt.prisma` (Model `Document` & `DocumentVersion`)
> - `packages/storage` (Abstraksi `StorageProvider` & `LocalDiskStorage`)

---

## 1. Ringkasan Modul & Tujuan Bisnis

Modul **Dokumen Kebijakan & SOP Lembaga** adalah pusat repositori terpadu tata kelola dokumen resmi PSPK (Surat Keputusan, Kebijakan Kelembagaan, Standar Operasional Prosedur HR, SOP IT, SOP Keuangan, dan Panduan Operasional Umum).

### Karakteristik & Fitur Kunci:
1. **Multi-Versi Terpelihara (*Versioned Document Repository*):**
   - Setiap dokumen memiliki satu induk (`Document`) dan banyak anak versi (`DocumentVersion`).
   - Setiap pembaruan dokumen menghasilkan baris `DocumentVersion` baru dengan nomor versi inkremental (`v1` $\to$ `v2` $\to$ `v3`) dan catatan perubahan (*change notes*) wajib.
   - Versi-versi lama bersifat *read-only* (abadi) dan tetap dapat diakses/diunduh oleh personel yang berwenang untuk kebutuhan audit & penelusuran histori kebijakan.
2. **Kontrol Visibilitas Berlapis (*Visibility Guard*):**
   - `ALL_STAFF`: Dokumen umum yang dapat dilihat dan diunduh oleh seluruh pegawai PSPK.
   - `MANAGERS`: Dokumen manajerial (panduan review staf, persetujuan anggaran) hanya untuk Lead/Manager, Admin HR, dan Super Admin.
   - `HR_ONLY`: Dokumen khusus HR (pedoman penggajian, rekrutmen sensitif) hanya untuk Admin HR dan Super Admin.
   - `IT_ONLY`: Dokumen infrastruktur & keamanan TI hanya untuk Admin IT dan Super Admin.
3. **Penyimpanan Terisolasi & Streaming Terautentikasi:**
   - Berkas fisik (PDF, DOCX, XLSX) disimpan di disk lokal via `@pspk/storage` (`LocalDiskStorage`), bebas dari risiko *path traversal*.
   - Tidak ada URL publik terbuka. Seluruh unduhan berkas melalui endpoint terproteksi (`/api/documents/[versionId]/download`) yang memverifikasi sesi aktif dan izin visibilitas pengguna.
   - Verifikasi integritas berkas menggunakan checksum **SHA-256** dan pencatatan ukuran berkas *bytes*.
4. **Audit Trail Lengkap:**
   - Seluruh mutasi dokumen (`CREATE`, `UPDATE`, `NEW_VERSION`, `ARCHIVE`) dan aksi pengunduhan dokumen sensitif dicatat ke `core.audit_logs`.

---

## 2. Struktur Arsitektur & File yang Akan Dibangun

```
apps/sysmgmt/
├─ src/
│  ├─ app/
│  │  ├─ (app)/
│  │  │  ├─ dokumen/
│  │  │  │  ├─ page.tsx                        # Layar S8: Direktori Repository Dokumen & SOP
│  │  │  │  └─ [id]/
│  │  │  │     └─ page.tsx                     # Layar S9: Detail Dokumen & Riwayat Versi
│  │  └─ api/
│  │     └─ documents/
│  │        └─ [versionId]/
│  │           └─ download/route.ts            # Secure Authenticated Streaming Endpoint
│  ├─ server/
│  │  ├─ schemas/
│  │  │  └─ document.schema.ts                 # Validasi Zod: create, update, newVersion, archive
│  │  ├─ queries/
│  │  │  ├─ document.queries.ts                # Directory query, getById, stats, nextCode
│  │  │  └─ document.queries.test.ts           # Unit tests query & visibility filter
│  │  └─ actions/
│  │     ├─ document.actions.ts                # Server Actions ber-audit trail & storage put
│  │     └─ document.actions.test.ts           # Unit tests mutasi dokumen & versioning
│  └─ components/
│     └─ documents/
│        ├─ document-list-view.tsx             # Kontainer utama Layar S8
│        ├─ document-stats-cards.tsx           # 4 Kartu metrik repositori dokumen
│        ├─ document-category-tree.tsx         # Filter panel kategori & visibilitas
│        ├─ document-table.tsx                 # Tabel repositori dokumen + badge versi & visibilitas
│        ├─ document-create-modal.tsx          # Modal unggah dokumen baru (v1)
│        ├─ document-detail-view.tsx           # Kontainer utama Layar S9
│        ├─ document-preview-card.tsx          # Card informasi & pratinjau berkas terkini
│        ├─ document-version-timeline.tsx      # Timeline vertikal riwayat seluruh versi
│        ├─ document-new-version-modal.tsx     # Modal unggah versi baru (vCurrent + 1)
│        ├─ document-edit-modal.tsx            # Modal ubah metadata dokumen
│        └─ document-archive-modal.tsx         # Modal arsip dokumen
```

---

## 3. Rincian Pembagian Sub-Tahap Eksekusi

Sesuai aturan kerja *"1 Tahapan 1 Respon"*, implementasi Tahap 4 dipecah menjadi 5 sub-tahap terukur:

### Sub-Tahap 4A — Backend Engine & Storage Integration
1. **Zod Validation (`document.schema.ts`):**
   - `createDocumentSchema`: `code`, `title`, `category`, `visibility`, `effectiveDate`, `changeNote`, dan berkas file.
   - `uploadVersionSchema`: `documentId`, `effectiveDate`, `changeNote` (required), dan berkas file.
   - `updateDocumentMetadataSchema`: `id`, `title`, `category`, `visibility`, `status`.
   - `archiveDocumentSchema`: `id`, `reason`.
2. **Query Database (`document.queries.ts`):**
   - `getDocumentsDirectory(params, userContext)`: Mendukung pencarian instan, filter kategori, status, visibilitas (dengan role-based visibility filter otomatis), sorting, dan paginasi.
   - `getDocumentById(id, userContext)`: Mengambil dokumen + riwayat versi lengkap (`versions` terurut `versionNo DESC`) dengan guard otorisasi.
   - `getDocumentStats(userContext)`: Agregasi metrik (Total Dokumen Aktif, Kebijakan, SOP, Draf & Arsip).
   - `getNextDocumentCode(category)`: Auto-generator saran kode dokumen unik (`SOP-HR-001`, `SOP-IT-001`, `KBJ-2026-001`).
3. **Server Actions (`document.actions.ts`):**
   - `createDocumentAction`: Unggah berkas via `StorageProvider.put()`, hitung SHA-256 & ukuran, buat `Document` + `DocumentVersion (v1)`, audit log `CREATE Document`.
   - `uploadDocumentVersionAction`: Unggah berkas baru, ambil versi terakhir + 1, buat `DocumentVersion`, update `currentVersionId`, audit log `CREATE DocumentVersion`.
   - `updateDocumentMetadataAction`: Update data induk dokumen, audit log `UPDATE Document`.
   - `archiveDocumentAction`: Ubah status menjadi `ARCHIVED`, audit log `ARCHIVE Document`.
4. **Authenticated Streaming Route (`api/documents/[versionId]/download/route.ts`):**
   - Verifikasi sesi login & role pengguna terhadap visibilitas dokumen.
   - Ambil stream berkas dari `StorageProvider.get(version.fileKey)`.
   - Set header `Content-Type`, `Content-Disposition`, dan `Content-Length`.
   - Catat audit log `DOWNLOAD DocumentVersion`.
5. **Unit Tests:**
   - `document.queries.test.ts`: Pengujian filter visibilitas per peran pengguna (staf tidak bisa akses HR_ONLY/IT_ONLY), pencarian kode, dan pengurutan timeline.
   - `document.actions.test.ts`: Pengujian upload berkas, auto-increment nomor versi, pencegahan file over-limit, dan audit trail.

---

### Sub-Tahap 4B — Layar S8: Antarmuka Direktori & Repositori Dokumen
1. **Server Component (`apps/sysmgmt/src/app/(app)/dokumen/page.tsx`):**
   - Proteksi sesi login & RBAC `sysmgmt.document.read:own` / `:all`.
   - Parallel fetch data direktori, statistik repositori, dan kategori.
2. **Header & 4 Kartu Metrik (`document-stats-cards.tsx`):**
   - Total Dokumen Aktif
   - Kebijakan Lembaga
   - SOP Operasional (HR & IT)
   - Dokumen Terbatas & Draf
3. **Kategori Tree & Filter Toolbar (`document-category-tree.tsx` & `document-filter-toolbar.tsx`):**
   - Panel kategori di sisi kiri atau tab navigasi kategori (Kebijakan, SOP HR, SOP IT, Keuangan, Umum).
   - Bilah pencarian instan (kode/judul), filter status (`ACTIVE`, `DRAFT`, `ARCHIVED`), dan filter visibilitas.
4. **Tabel Interaktif Dokumen (`document-table.tsx`):**
   - Kolom Kode Dokumen (badge tebal e.g. `SOP-HR-001`), Judul Dokumen, Kategori, Versi Saat Ini (`v3`), Visibilitas (`Semua Staf`, `Hanya HR`, `Hanya IT`, `Manajer`), Tanggal Berlaku, dan Aksi Cepat.
   - Aksi: Tombol Unduh Cepat (`Download`) & Tombol Detail (`Buka Riwayat Versi`).

---

### Sub-Tahap 4C — Layar S9: Detail Dokumen, Pratinjau & Riwayat Versi
1. **Server Component (`apps/sysmgmt/src/app/(app)/dokumen/[id]/page.tsx`):**
   - Ambil data dokumen dan seluruh riwayat versi melalui `getDocumentById`.
   - Verifikasi hak akses pengguna terhadap visibilitas dokumen tersebut.
2. **Header Detail Dokumen (`document-detail-header.tsx`):**
   - Kode, Judul, Kategori badge, Status badge, Visibilitas badge.
   - Tombol Aksi: *"Unduh Versi Saat Ini"*, *"Unggah Versi Baru"*, *"Ubah Dokumen"*, dan *"Arsipkan"*.
3. **Area Pratinjau Berkas Terkini (`document-preview-card.tsx`):**
   - Informasi berkas: nama file asli, ukuran (KB/MB), MIME type, SHA-256 hash, tanggal efektif berlaku, pengunggah.
   - Viewer info & tombol pratinjau inline / buka tab baru.
4. **Garis Waktu Riwayat Versi (`document-version-timeline.tsx`):**
   - Timeline vertikal kronologis (`v3 Saat Ini`, `v2`, `v1`).
   - Setiap entri versi menampilkan: nomor versi, badge status aktif vs terdahulu, tanggal berlaku, nama pengunggah, catatan perubahan (*change notes*), dan tombol unduh versi tersebut.

---

### Sub-Tahap 4D — Dialog Modal Interaktif
1. **Modal Unggah Dokumen Baru (`document-create-modal.tsx`):**
   - Input Kode Dokumen (dengan generator otomatis), Judul, Kategori, Visibilitas, Tanggal Berlaku, Catatan Rilis Awal.
   - Drag & drop file (PDF/DOCX/XLSX, maks 25 MB) dengan validasi tipe berkas.
2. **Modal Unggah Versi Baru (`document-new-version-modal.tsx`):**
   - Nomor versi otomatis (`vCurrent + 1`).
   - Drag & drop berkas baru.
   - Catatan Perubahan (*Required*, misal apa pasal/poin yang direvisi).
   - Tanggal Berlaku Versi Baru.
3. **Modal Edit Metadata (`document-edit-modal.tsx`):**
   - Formulir pengubahan judul, kategori, visibilitas, atau status.
4. **Modal Arsipkan Dokumen (`document-archive-modal.tsx`):**
   - Dialog konfirmasi pengarsipan aman.

---

### Sub-Tahap 4E — Integrasi Navigasi, Dashboard & Quality Gate
1. **Navigasi Navbar (`sysmgmt-navbar.tsx`):**
   - Hapus badge `"Fase 7"` pada menu *"Dokumen & SOP"*, jadikan menu aktif penuh.
2. **Dashboard Eksekutif TI (`dashboard-view.tsx`):**
   - Tambahkan tombol aksi cepat *"Unggah Dokumen / SOP"* di bilah Aksi Cepat.
   - Pastikan kartu metrik *Dokumen & SOP* tersambung mulus ke `/dokumen`.
3. **Quality Gate Monorepo:**
   - `pnpm typecheck`: Wajib lolos 0 error.
   - `pnpm lint`: Wajib lolos 0 error.
   - `pnpm test`: Seluruh test suite lolos 100%.
   - `pnpm build`: Build standalone `@pspk/sysmgmt` sukses.
4. **Dokumentasi:**
   - Perbarui `docs/PROGRESS.md` dengan pencapaian Tahap 4.

---

## 4. Matriks Hak Akses & Visibilitas Dokumen

| Peran Pengguna | `ALL_STAFF` | `MANAGERS` | `HR_ONLY` | `IT_ONLY` | Hak Kelola Dokumen (`manage`) |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Super Admin** | ✅ Lihat & Unduh | ✅ Lihat & Unduh | ✅ Lihat & Unduh | ✅ Lihat & Unduh | ✅ Penuh (Semua Kategori & Versi) |
| **Admin IT** | ✅ Lihat & Unduh | ✅ Lihat & Unduh | ❌ Tersembunyi | ✅ Lihat & Unduh | ✅ Penuh (`sysmgmt.document.manage:all`) |
| **Admin HR** | ✅ Lihat & Unduh | ✅ Lihat & Unduh | ✅ Lihat & Unduh | ❌ Tersembunyi | ✅ Dokumen HR & Umum (`manage:hr`) |
| **Manager / Lead** | ✅ Lihat & Unduh | ✅ Lihat & Unduh | ❌ Tersembunyi | ❌ Tersembunyi | ❌ Hanya Baca / Unduh |
| **Staff / Peneliti** | ✅ Lihat & Unduh | ❌ Tersembunyi | ❌ Tersembunyi | ❌ Tersembunyi | ❌ Hanya Baca / Unduh |
