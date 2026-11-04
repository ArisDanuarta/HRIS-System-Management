# Master Plan: Implementasi PWA & Web Responsif HRIS PSPK

> **Status:** Siap Dieksekusi (Tahap demi Tahap: 1 Respon = 1 Tahapan)  
> **Target Aplikasi:** `apps/hris` (Portal HRIS PSPK)  
> **Framework:** Next.js 16 (App Router), React 19, Tailwind CSS v4, Prisma ORM  

---

## 1. Latar Belakang & Sasaran

Sistem HRIS PSPK saat ini memiliki fondasi fungsional yang kuat dan lengkap. Namun, antarmuka shell utama (`shell-container.tsx`) masih mengunci padding kiri (`pl-[264px]`) untuk sidebar desktop, sehingga di layar smartphone (< 768px) area konten utama menjadi sangat sempit (~110px).

Mayoritas pegawai PSPK berinteraksi dengan HRIS untuk kegiatan harian mendesak seperti:
1. **Presensi Harian (Clock In / Clock Out)** di pagi dan sore hari langsung dari ponsel.
2. **Pengajuan Izin / Cuti Sakit Mendadak** saat tidak berada di depan laptop.
3. **Persetujuan (Approval) Cuti oleh Manajer** secara cepat melalui smartphone.
4. **Pengecekan Slip Gaji** bulanan.

Dengan menjadikan HRIS sebagai **Progressive Web App (PWA)** dan **Responsif Penuh**, pegawai dapat menambahkan HRIS ke layar utama smartphone (*Add to Home Screen*) tanpa bar URL browser, merasakan navigasi secepat aplikasi native, dan tetap mendapatkan pengalaman informatif saat koneksi internet offline.

---

## 2. Arsitektur Solusi & Aturan Kerja

* **Prinsip 1 Tahapan = 1 Respon:** Setiap tahapan dieksekusi secara terpisah dan tuntas agar perubahan kode terukur, mudah direview, dan tidak menimbulkan regresi.
* **Tidak Merusak Desktop UX:** Layout desktop (sidebar lebar/collapse) tetap dipertahankan 100%. Mode responsif menggunakan pendekatan adaptif berbasis breakpoint Tailwind (`md:` / 768px).
* **Zero Cost Infra:** PWA dibangun secara native menggunakan standar Web App Manifest dan Service Worker bawaan browser modern, sepenuhnya berjalan di container Docker VPS tanpa ketergantungan cloud berbayar.
* **Brand Guidelines PSPK:** Tetap mematuhi warna resmi (#102E50 Navy, #F2AF3E Gold, #A8281C Maroon) dan tipografi (Lora untuk heading, Rubik untuk body).

```mermaid
flowchart TD
    A["Tahap 1: Shell & Navigasi Responsif"] --> B["Tahap 2: Konfigurasi PWA Core & Aset Ikon"]
    B --> C["Tahap 3: Service Worker, Caching & Offline Fallback"]
    C --> D["Tahap 4: Optimasi Responsif Modul Kritis (Presensi & Cuti)"]
    D --> E["Tahap 5 (Akhir): Audit Kueri Database, Bug & Performa"]
```

---

## 3. Rincian 5 Tahapan Pengembangan

### Tahap 1: Pondasi Shell & Navigasi Responsif Mobile ✅ (Selesai)
**Status:** **SELESAI (100% Terverifikasi)**  
**Tujuan:** Membebaskan layout dari batasan desktop sehingga konten dapat terbuka penuh dan rapi di semua ukuran layar ponsel/tablet.

* **Pekerjaan Teknis yang Telah Diterapkan:**
  1. **`shell-container.tsx` (`apps/hris/src/components/shell/`):**
     * Padding kiri kontainer utama menjadi adaptif: `pl-0 md:pl-20 md:pl-[264px]`.
     * State `mobileNavOpen` dengan penangan memoized `useCallback`.
     * Safe bottom padding `pb-20 md:pb-6` agar konten tidak tertutup bilah navigasi bawah ponsel.
  2. **`app-topbar.tsx` (`apps/hris/src/components/shell/`):**
     * Offset bilah atas menjadi `left-0 md:left-20 md:left-[264px]`.
     * Tombol **Hamburger Menu** (`<Menu className="w-5 h-5" />`) pada mobile (`md:hidden`).
     * Breadcrumb teks dirapikan dengan text truncation agar judul halaman tidak terpotong.
     * Mode Pratinjau Super Admin disembunyikan di layar mobile (`hidden md:flex`) untuk mencegah tabrakan UI.
  3. **`app-sidebar.tsx` (`apps/hris/src/components/shell/`):**
     * Kemampuan **Mobile Slide-Over Drawer**: meluncur halus dari kiri (`-translate-x-full md:translate-x-0` saat tertutup, `translate-x-0` saat terbuka) dengan backdrop gelap (`bg-slate-950/60 backdrop-blur-xs`).
     * Tombol tutup `X` khusus mobile.
     * Auto-close drawer saat rute berpindah atau saat menekan tombol Escape.
     * Tombol collapse desktop disembunyikan di perangkat mobile (`hidden md:inline-flex`).
  4. **Komponen Baru `mobile-bottom-nav.tsx` (`apps/hris/src/components/shell/`):**
     * Navigasi bawah tetap (*fixed bottom-0*) khusus mobile (`md:hidden`) dengan 4 akses cepat ramah jangkauan jempol:
       * 🏠 **Beranda** (`/dashboard`)
       * ⏱️ **Presensi** (`/absensi`)
       * 📅 **Cuti** (`/cuti`) dengan badge approval tertunda
       * 👤 **Profil** (`/profil`)
* **Kriteria Keberhasilan (DoD):**
  * ✅ `pnpm typecheck` lolos (9/9 paket).
  * ✅ `pnpm lint` lolos (0 error, 0 warning).
  * ✅ `pnpm test` lolos (42 test suites, 284 test passed).

---

### Tahap 2: Konfigurasi PWA Core & Aset Ikon ✅ (Selesai)
**Status:** **SELESAI (100% Terverifikasi)**  
**Tujuan:** Mengaktifkan kapabilitas instalasi PWA di Android dan iOS dengan identitas brand PSPK yang lengkap.

* **Pekerjaan Teknis yang Telah Diterapkan:**
  1. **`apps/hris/src/app/manifest.ts`:**
     * Implementasi `MetadataRoute.Manifest` resmi Next.js App Router:
       * `name`: "PSPK HRIS - Sistem Kepegawaian"
       * `short_name`: "PSPK HRIS"
       * `display`: "standalone" (menghilangkan bilah navigasi browser)
       * `theme_color`: "#102e50"
       * `background_color`: "#f8f9ff"
       * `orientation`: "portrait"
       * Pendaftaran ikon 192x192, 512x512, dan maskable icon.
  2. **Metadata Viewport & Apple Meta di `layout.tsx` (`apps/hris/src/app/`):**
     * Ekspor konstanta `viewport`:
       ```ts
       export const viewport: Viewport = {
         themeColor: "#102e50",
         width: "device-width",
         initialScale: 1,
         maximumScale: 1,
         userScalable: false,
         viewportFit: "cover",
       };
       ```
     * Tag meta Apple Web App: `capable: true`, `statusBarStyle: "default"`, `title: "HRIS PSPK"`.
  3. **Penyediaan Aset Ikon PWA Standar di `apps/hris/public/icons/`:**
     * Dibuat dari sumber resmi `apps/hris/public/images/logo_pspk_vertikal.jpg`:
       * `icon-192.png` (192 × 192 px)
       * `icon-512.png` (512 × 512 px)
       * `icon-maskable.png` (512 × 512 px)
       * `apple-touch-icon.png` (180 × 180 px)
* **Kriteria Keberhasilan (DoD):**
  * ✅ `pnpm typecheck` lolos (9/9 paket).
  * ✅ `pnpm lint` lolos (0 error, 0 warning).
  * ✅ `pnpm test` lolos (42 test suites, 284 test passed).
  * ✅ `pnpm --filter @pspk/hris build` lolos (rute `/manifest.webmanifest` berhasil digenerate statis).

---

### Tahap 3: Service Worker, Caching Strategy & Offline Fallback ✅ (Selesai)
**Status:** **SELESAI (100% Terverifikasi)**  
**Tujuan:** Memberikan performa pemuatan instan (*instant load*) dan ketahanan aplikasi saat internet lambat atau terputus.

* **Pekerjaan Teknis yang Telah Diterapkan:**
  1. **Service Worker (`apps/hris/public/sw.js`):**
     * **Strategi Network-First:** Digunakan untuk semua navigasi halaman HTML dengan fallback ke `/offline` jika jaringan mati.
     * **Strategi Cache-First / Stale-While-Revalidate:** Digunakan untuk aset statis (`/_next/static/`, `/icons/`, `/images/`, fonts, CSS, JS).
     * **Bypass Dynamic Data:** Permintaan non-GET, `/api/`, dan Server Actions Next.js dilewati tanpa caching agar data kepegawaian selalu real-time.
  2. **Halaman Offline Fallback (`apps/hris/src/app/offline/page.tsx`):**
     * Tampilan ramah dan berwibawa bergaya brand PSPK dengan tombol "Coba Muat Ulang" dan "Ke Beranda". Terkompilasi statis `○ /offline`.
  3. **Komponen PwaInstaller (`apps/hris/src/components/shell/pwa-installer.tsx`):**
     * Registrasi `/sw.js` otomatis.
     * Event listener `beforeinstallprompt` dengan banner instalasi interaktif ("Pasang Sekarang" & "Nanti Saja").
     * Deteksi online/offline reaktif via `useSyncExternalStore` dengan bilah peringatan saat koneksi terputus dan toast hijau saat online kembali.
     * Terintegrasi secara global di `apps/hris/src/app/layout.tsx`.
* **Kriteria Keberhasilan (DoD):**
  * ✅ `pnpm typecheck` lolos (9/9 paket).
  * ✅ `pnpm lint` lolos (0 error, 0 warning).
  * ✅ `pnpm test` lolos (42 test suites, 284 test passed).
  * ✅ `pnpm --filter @pspk/hris build` lolos (`/offline` dan `/manifest.webmanifest` digenerate statis).

---

### Tahap 4: Optimasi Responsif Modul Kritis ✅ (Selesai)
**Status:** **SELESAI (100% Terverifikasi)**  
**Tujuan:** Memastikan modul yang paling sering dibuka di ponsel memiliki pengalaman pengguna yang cepat, mudah disentuh, dan bebas kendala.

* **Pekerjaan Teknis yang Telah Diterapkan:**
  1. **Modul Presensi (`today-attendance-card.tsx`):**
     * Optimasi ukuran tombol Clock In / Clock Out dengan target sentuhan jempol minimal 48 × 48 px (`min-h-[48px]`).
     * Penataan dropdown pemilih zona waktu (WIB, WITA, WIT) agar aman dari clipping di layar sempit (`max-w-[calc(100vw-32px)] sm:max-w-xs`).
     * Mencegah auto-zoom iOS Safari pada kolom catatan dengan ukuran font `text-sm sm:text-xs`.
  2. **Modul Pengajuan Cuti (`leave-request-form.tsx`):**
     * Penambahan indikator langkah mobile (*"Langkah X dari 4: Nama Langkah"*) di bawah stepper desktop.
     * Penyesuaian formulir tanggal, catatan, dan unggah lampiran dengan input size `text-sm sm:text-xs` dan target sentuh minimal 46-48 px.
  3. **Tabel Data Karyawan, Cuti, Kehadiran & Timesheet (Dual-View: Card View Mobile + Table View Desktop):**
     * `employee-table.tsx`: Tampilan kartu mobile (`sm:hidden`) dengan `EmployeeAvatar` fallback, chip status, dan bottom action sheet; tetap tabel penuh pada desktop (`hidden sm:block`).
     * `attendance-table.tsx`: Tampilan kartu mobile (`sm:hidden`) menampilkan jam masuk/pulang, badge status kehadiran, dan durasi kerja; tampilan tabel pada desktop (`hidden sm:block`).
     * `leave-request-table.tsx`: Tampilan kartu mobile (`sm:hidden`) menampilkan tipe cuti, rentang tanggal, durasi hari, status badge, dan tombol batal jika pending.
     * `timesheet-table.tsx`: Tampilan kartu mobile (`sm:hidden`) menampilkan tanggal, proyek, jam kerja, dan status verifikasi.
  4. **Pratinjau Slip Gaji (`payslip-printable-modal.tsx`):**
     * Padding modal responsif (`p-4 sm:p-8`), kop surat/header fleksibel (`flex-col sm:flex-row`), dan fallback gambar cap/tanda tangan jika error.
* **Kriteria Keberhasilan (DoD):**
  * ✅ `pnpm typecheck` lolos (9/9 paket).
  * ✅ `pnpm lint` lolos (0 error, 0 warning).
  * ✅ `pnpm test` lolos (42 test suites, 284 test passed).
  * ✅ `pnpm build` lolos (kedua app `@pspk/hris` dan `@pspk/sysmgmt` sukses terkompilasi).
  * ✅ Seluruh alur utama staf (absen datang, absen pulang, cek saldo cuti, ajukan cuti, cek slip gaji) ramah perangkat mobile dan sentuhan satu tangan.

---

### Tahap 5 (Tahap Akhir): Eksekusi Perbaikan Kueri Database, Bug, Performa & Skala Ribuan Data
**Status:** **SEDANG BERJALAN (Rencana Eksekusi Bertahap: 1 Respon = 1 Sub-Tahapan)**  
**Tujuan:** Menjamin keandalan data saat skala ribuan data, ketiadaan kebocoran memori/kueri lambat, keamanan data sensitif, dan ketahanan aplikasi di berbagai skenario jaringan.

#### Rencana Eksekusi Sub-Tahapan:

* **Sub-tahap 5.1: Optimasi Indeks Database & Migrasi Prisma (Skala Ribuan Data)**
  * **Masalah:** Full table scan pada `leave_requests` (filter `status = 'PENDING'`), `payslips` (filter `employeeId` + `status`), dan `employee_salary_components` (filter `employeeId`).
  * **Pra-cek:** Analisis skema Prisma, struktur indeks komposit yang ada, dan konvensi nama indeks PostgreSQL.
  * **Eksekusi:** Tambahkan `@@index([status])` di `LeaveRequest`, `@@index([employeeId, status])` di `Payslip`, dan `@@index([employeeId])` di `EmployeeSalaryComponent`. Generate dan terapkan migrasi Prisma (`add_performance_indexes_hris`).
  * **Cross-check & Pengujian Skala Ribuan Data:** Verifikasi skema Prisma tersinkronisasi, periksa `pnpm typecheck`, dan pastikan indeks B-Tree aktif untuk kueri skala besar.

* **Sub-tahap 5.2: Proteksi Overfetching & Pembersihan Kolom Sensitif (Data Minimization)**
  * **Masalah:** `baseSalary` terekspos di payload network direktori pegawai (`getEmployeesDirectory`), dan `nikEnc`/`npwpEnc`/`bankAccountEnc` terbawa di `getEmployeeById`.
  * **Pra-cek:** Audit seluruh komponen pemanggil (`EmployeeTable`, `SensitiveFieldView`, wizard pegawai) untuk memastikan tidak ada komponen yang bergantung pada field tersebut.
  * **Eksekusi:** Hapus `baseSalary` dari `select` kontrak di `getEmployeesDirectory`; hapus `nikEnc`, `npwpEnc`, dan `bankAccountEnc` dari return payload `getEmployeeById`.
  * **Cross-check & Pengujian Skala Ribuan Data:** Uji muatan payload direktori (pengurangan ukuran transfer data secara signifikan untuk ribuan pegawai), pastikan fungsi penyamaran data (masking) dan buka audit (unmasking) tetap berfungsi 100%.

* **Sub-tahap 5.3: Paralelisasi Kueri Dashboard & Efisiensi In-Memory Slip Gaji**
  * **Masalah:** Kueri ganda sekuensial pada `getMyPayslips` dan pemanggilan sekuensial antrean timesheet di `manager-dashboard.ts`.
  * **Pra-cek:** Tinjau tipe data pengembalian `MyPayslipsSummary` dan `ManagerDashboardData`.
  * **Eksekusi:** Optimasi `getMyPayslips` dengan in-memory filtering pada dataset yang sudah diambil; masukkan kueri `prisma.timesheetReviewer.findMany` ke dalam blok `Promise.all` di `manager-dashboard.ts`.
  * **Cross-check & Pengujian Skala Ribuan Data:** Simulasi akun manajer dengan puluhan bawahan dan riwayat timesheet masif; verifikasi TTFB berkurang dan tidak ada I/O blocking.

* **Sub-tahap 5.4: Ketahanan Edge Case Jaringan (Offline Transition) & Safe Area Inset**
  * **Masalah:** *Unhandled Promise Rejection* saat transisi offline ketika menekan Clock In/Out dan kirim form cuti; padding bawah `shell-container.tsx` berpotensi mepet pada iPhone bertakik (Dynamic Island).
  * **Pra-cek:** Analisis blok `startTransition` di `today-attendance-card.tsx` dan `leave-request-form.tsx`; cek nilai `safe-area-inset-bottom`.
  * **Eksekusi:** Bungkus Server Action calls dengan `try ... catch` dan pesan error ramah pengguna; ubah padding bawah kontainer menjadi `pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-6`.
  * **Cross-check & Pengujian Skala Ribuan Data:** Simulasi koneksi terputus tiba-tiba di tengah ribuan transaksi harian; pastikan antarmuka tidak freeze dan memberikan umpan balik instan.

* **Sub-tahap 5.5: Verifikasi Menyeluruh Akhir (End-to-End DoD)**
  * **Eksekusi:** Menjalankan `pnpm typecheck`, `pnpm lint`, `pnpm test`, dan `pnpm build`.
  * **Pembaruan Dokumen:** Tandai seluruh Master Plan sebagai selesai di `docs/HRIS_PWA_RESPONSIVE_PLAN.md` dan catat riwayatnya di `docs/PROGRESS.md`.
* **Kriteria Keberhasilan (DoD):**
  * ✅ Seluruh kueri database teroptimasi dengan indeks B-Tree yang tepat untuk skala ribuan data.
  * ✅ Tidak ada kebocoran data sensitif pada network payload.
  * ✅ Penanganan offline error bekerja mulus tanpa uncaught exceptions.
  * ✅ Tampilan 100% aman dari notch/Dynamic Island di seluruh perangkat iOS/Android.
  * ✅ Seluruh tes unit/integrasi dan build produksi lolos 100%.

---

## 4. Alur Persetujuan & Eksekusi

Sesuai aturan **1 tahapan per 1 respon**, alur kerja kita adalah:
1. **Respon Berikutnya:** Mengeksekusi secara tuntas **Tahap 1 (Pondasi Shell & Navigasi Responsif Mobile)**, melakukan verifikasi teknis, dan melapor ke Anda.
2. Anda meninjau hasil Tahap 1, lalu memberikan instruksi lanjut ke Tahap 2, dan seterusnya hingga Tahap 5.

