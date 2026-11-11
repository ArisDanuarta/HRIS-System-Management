# Rencana Perbaikan UI/UX & Tata Letak System Management PSPK

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mengoptimalkan tata letak layout, ergonomi data, penataan tombol aksi, responsivitas breakpoint, dan konsistensi alur fallback pada seluruh modul web System Management PSPK (`apps/sysmgmt`).

**Architecture:** Menerapkan perbaikan presentation layer berbasis Next.js App Router (React Server Components + Client Components) dengan Tailwind CSS v4, Radix UI, dan token brand PSPK (`@pspk/ui`), tanpa mengubah skema basis data atau kontrak API server actions yang sudah ada.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript strict, Tailwind CSS 4, Lucide React, `@pspk/ui`, `@pspk/shared`.

**Spec:** Dokumen Analisis UI/UX & AGENTS.md (September 2026 / November 2026).

## Global Constraints

- Warna primer institusi: PSPK Navy `#102E50`, Gold `#F2AF3E`, Maroon `#A8281C`.
- Tipografi: Heading menggunakan Lora (`font-serif`), Body teks menggunakan Rubik (`font-sans`).
- Bahasa teks antarmuka: Bahasa Indonesia yang baku, profesional, dan ramah pengguna.
- Tidak mengubah logika otorisasi RBAC atau signature database skema Prisma.
- Aturan wajib: Dilarang melakukan git push atau git commit otomatis tanpa persetujuan pengguna.
- Seluruh verifikasi wajib lolos typecheck (`pnpm --filter @pspk/sysmgmt typecheck`) dan lint.

## Review Focus

1. **Responsivitas Layar Laptop Kecil (1024px–1280px):** Kartu metrik KPI dan tombol aksi tidak boleh terpotong atau menghasilkan whitespace ganjil.
2. **Konsistensi Navigasi Error/Fallback:** Rute 404, 403, dan 500 harus mengarahkan pengguna kembali ke `/dashboard`, bukan ke `/pengguna`.
3. **Ergonomi Penanganan Data Padat:** Kolom tindakan pada tabel data tetap terjangkau dan tidak tertutup saat tabel di-scroll secara horizontal.
4. **Kejelasan Status & Visual Feedback:** Progres bar kuota lisensi harus memberikan indikator warna kapasitas yang intuitif (hijau/kuning/merah).
5. **Akurasi Helper Text Form:** Input konfigurasi waktu harus menampilkan terjemahan durasi riil secara langsung.

---

### Task 1: Perbaikan Fallback Routing & Tautan Error Shell

**Files:**
- Modify: `apps/sysmgmt/src/app/(app)/error.tsx:18-28`
- Modify: `apps/sysmgmt/src/app/(app)/forbidden/page.tsx:24-37`
- Modify: `apps/sysmgmt/src/app/(app)/not-found.tsx:12-20`
- Modify: `apps/sysmgmt/src/app/forbidden.tsx:6-15`

**Interfaces:**
- Consumes: `@pspk/ui` (`ForbiddenView`, `NotFoundView`, `ServerErrorView`).
- Produces: Properti `homeUrl="/dashboard"` dan `homeLabel="Kembali ke Dashboard Administrator"`.

- [x] **Step 1: Perbarui tautan fallback di `apps/sysmgmt/src/app/(app)/error.tsx`**
  Ganti `homeUrl="/pengguna"` menjadi `homeUrl="/dashboard"` dan sesuaikan pesan fallback.

- [x] **Step 2: Perbarui tautan fallback di `apps/sysmgmt/src/app/(app)/forbidden/page.tsx` dan `forbidden.tsx`**
  Arahkan tombol kembali ke `/dashboard` dengan label `"Kembali ke Dashboard Administrator"`.

- [x] **Step 3: Perbarui tautan fallback di `apps/sysmgmt/src/app/(app)/not-found.tsx`**
  Arahkan tombol kembali ke `/dashboard` dengan label `"Kembali ke Dashboard Administrator"`.

- [x] **Step 4: Jalankan typecheck verifikasi**
  Run: `pnpm --filter @pspk/sysmgmt typecheck`
  Expected: PASS tanpa error tipe pada view fallback.

---

### Task 2: Penyeimbangan Tata Letak Grid Kartu Metrik & Quick Actions Dashboard

**Files:**
- Modify: `apps/sysmgmt/src/components/dashboard/dashboard-view.tsx:83-200`

**Interfaces:**
- Consumes: `SysmgmtDashboardStats` dari `@/server/queries/dashboard.queries`.
- Produces: Tampilan kartu metrik responsif seimbang dan bilah aksi cepat yang terorganisir per kelompok.

- [x] **Step 1: Rapikan bilah Aksi Cepat (Quick Action Pills)**
  Pisahkan pill aksi cepat menjadi dua kelompok logis di dalam header sambutan:
  1. *Inventaris & Layanan* (Aset, Lisensi, Kredensial, Dokumen).
  2. *Keamanan & Konfigurasi* (Pengguna, Matriks RBAC, Audit Log, Pengaturan).

- [x] **Step 2: Selaraskan breakpoint grid 5 kartu metrik utama**
  Ubah grid dari `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5` menjadi:
  `grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 xl:grid-cols-5 gap-4`
  Di mana pada breakpoint `lg`, kartu pertama (Akses & Pengguna) mengambil `lg:col-span-2` dan kartu berikutnya mengambil span yang proporsional sehingga tidak ada baris menggantung dengan whitespace kosong.

- [x] **Step 3: Jalankan verifikasi tampilan dan typecheck**
  Run: `pnpm --filter @pspk/sysmgmt typecheck`
  Expected: PASS

---

### Task 3: Penataan Tombol Header Aksi & Menu Dropdown Berkas Excel pada Inventaris Aset

**Files:**
- Modify: `apps/sysmgmt/src/components/assets/asset-list-view.tsx:186-230`

**Interfaces:**
- Consumes: `exportAssetsToXlsx`, `canImport`, `canWrite`.
- Produces: Dropdown menu popover rapi untuk opsi ekspor/impor Excel yang ringkas.

- [x] **Step 1: Buat state dropdown menu berkas Excel**
  Tambahkan state `isExcelMenuOpen` dan ref tombol untuk menutup popover saat diklik di luar.

- [x] **Step 2: Satukan tombol Ekspor & Impor ke dalam satu tombol grup "Kelola Data Excel"**
  Ganti tombol ganda yang memanjang di header dengan satu tombol dropdown sekunder yang memuat opsi:
  - Unduh Format / Ekspor Data (.xlsx)
  - Unggah / Impor Data (.xlsx)
  Pertahankan tombol primer *"Catat Aset Baru"* (`#102E50`) di posisi paling kanan.

- [x] **Step 3: Jalankan verifikasi typecheck**
  Run: `pnpm --filter @pspk/sysmgmt typecheck`
  Expected: PASS

---

### Task 4: Peningkatan Indikator Visual & Ergonomi Data pada Lisensi & Kredensial

**Files:**
- Modify: `apps/sysmgmt/src/components/licenses/license-table.tsx:130-220`
- Modify: `apps/sysmgmt/src/components/credentials/credential-table.tsx:90-180`

**Interfaces:**
- Consumes: Data `SerializedSoftwareLicense` dan `SerializedCredential`.
- Produces: Progress bar lisensi dinamis, penanda visual kedaluwarsa, dan tombol quick-copy surel login.

- [x] **Step 1: Terapkan warna dinamis pada progress bar utilisasi kursi lisensi**
  Pada `license-table.tsx`:
  - < 70%: `bg-emerald-500`
  - 70% - 89%: `bg-amber-500`
  - >= 90% atau penuh: `bg-rose-500`

- [x] **Step 2: Tambahkan indikator aksen baris untuk lisensi yang segera habis**
  Berikan garis tepi kiri tebal (`border-l-4 border-l-rose-500 bg-rose-50/20`) pada baris lisensi yang memiliki status segera kedaluwarsa (< 30 hari).

- [x] **Step 3: Sediakan tombol quick-copy pada identitas login kredensial**
  Pada `credential-table.tsx`, tambahkan ikon salin kecil di samping teks alamat surel login dengan indikator tooltip dan status tersalin (*copied*) 2 detik.

- [x] **Step 4: Jalankan verifikasi typecheck**
  Run: `pnpm --filter @pspk/sysmgmt typecheck`
  Expected: PASS

---

### Task 5: Ergonomi Tabel Pengguna & Matriks RBAC (Sticky Actions & Counter Akordion)

**Files:**
- Modify: `apps/sysmgmt/src/components/users/user-management-table.tsx:410-480`
- Modify: `apps/sysmgmt/src/components/roles/role-matrix-view.tsx:640-700`

**Interfaces:**
- Consumes: Data matriks peran RBAC dan tabel akun pengguna.
- Produces: Kolom aksi tabel pengguna yang tetap terlihat (sticky right) dan indikator jumlah izin pada akordion tertutup.

- [x] **Step 1: Jadikan kolom aksi manajemen pengguna sticky di tepi kanan**
  Tambahkan kelas `sticky right-0 bg-white/95 backdrop-blur-xs shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.06)]` pada sel th dan td aksi manajemen di `user-management-table.tsx`.

- [x] **Step 2: Tambahkan counter badge pada baris akordion kategori RBAC tertutup**
  Pada `role-matrix-view.tsx`, tampilkan badge pill kecil bertuliskan `${category.permissions.length} wewenang` saat kondisi `isCollapsed` bernilai `true`.

- [x] **Step 3: Jalankan verifikasi typecheck**
  Run: `pnpm --filter @pspk/sysmgmt typecheck`
  Expected: PASS

---

### Task 6: Penyempurnaan Hirarki Visual Tab Pengaturan & Helper Text Konversi Waktu

**Files:**
- Modify: `apps/sysmgmt/src/components/settings/settings-view.tsx:45-120`
- Modify: `apps/sysmgmt/src/components/settings/settings-assets-tab.tsx:40-90`
- Modify: `apps/sysmgmt/src/components/settings/settings-preferences-tab.tsx:90-180`

**Interfaces:**
- Consumes: `SystemPreferencesData`, `SettingsStats`.
- Produces: Gaya tab bertingkat yang kontras dan live helper text perhitungan durasi sesi.

- [x] **Step 1: Bedakan styling antara tab level 1 dan sub-tab level 2**
  Ubah sub-tab Tipe Aset vs Lokasi Aset di `settings-assets-tab.tsx` menjadi format segmented control pill (`bg-slate-100 p-1 rounded-xl`) agar tidak tertukar dengan tab navigasi utama.

- [x] **Step 2: Tambahkan kalkulasi konversi waktu otomatis di form preferensi**
  Pada input `sessionTimeoutMins` di `settings-preferences-tab.tsx`, tambahkan teks bantuan real-time:
  Contoh: *"Setara dengan: 1 hari 0 jam (24 jam)"* berdasarkan angka menit yang diketikkan pengguna.

- [x] **Step 3: Jalankan verifikasi typecheck**
  Run: `pnpm --filter @pspk/sysmgmt typecheck`
  Expected: PASS

---

### Task 7: Verifikasi Akhir Seluruh Aplikasi

**Files:**
- Scope: Seluruh aplikasi `apps/sysmgmt`

- [x] **Step 1: Jalankan typecheck menyeluruh**
  Run: `pnpm --filter @pspk/sysmgmt typecheck`
  Expected: Exit code 0, 0 error.

- [x] **Step 2: Jalankan linting**
  Run: `pnpm --filter @pspk/sysmgmt lint`
  Expected: Exit code 0, 0 error.

- [x] **Step 3: Jalankan production build test**
  Run: `pnpm --filter @pspk/sysmgmt build`
  Expected: Build Next.js standalone berhasil tanpa kegagalan compile.

