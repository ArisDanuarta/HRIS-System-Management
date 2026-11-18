# Rencana Implementasi: Detail Karyawan 360° & Ekspor Profil (PDF & ZIP Package)

> **Untuk Pekerja Agentic:** WAJIB menggunakan alur kerja bertahap: **1 respons per 1 task**.  
> **Aturan Wajib Tiap Task:**  
> 1. **Pengecekan Sebelum Pengeditan:** Periksa file sumber, tipe data, skema, dan kontrak interfaces. Dilarang mengedit sebelum kondisi awal diverifikasi.  
> 2. **Implementasi Terarah:** Tulis kode bersih, minim perubahan sampingan, sesuai standar PSPK.  
> 3. **Crosscheck Setelah Pengeditan:** Jalankan verifikasi teknis (`pnpm typecheck`, `pnpm lint`), pastikan tidak ada data yang terputus, dan konfirmasi keterhubungan dengan task sebelumnya dan task berikutnya sebelum beralih ke task baru.

**Goal:** Membangun antarmuka terpadu halaman detail karyawan 360° di `/karyawan/[id]` (dashboard ringkasan, biodata lengkap multi-tabel, log absensi & cuti bulanan, checklist dokumen, aset aktif) yang terhubung 100% langsung ke database, serta fitur ekspor profil resmi dalam format **Dokumen PDF** atau **Paket Arsip ZIP (.zip)** lengkap dengan lampiran dokumen asli.

**Arsitektur:** Next.js App Router (Server Component `page.tsx` + subkomponen modular), terintegrasi dengan Prisma multi-schema (`hris`, `core`, `sysmgmt`), Better Auth + RBAC, storage provider lokal, serta API Route Handler untuk streaming PDF (`@react-pdf/renderer` + `pdf-lib`) dan arsip ZIP (`archiver`).

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Prisma ORM, Better Auth, `@react-pdf/renderer`, `pdf-lib`, `archiver`, Lucide Icons.

**Spec Ref:** [`docs/rombak_redisgn_detail_karyawan.md`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/docs/rombak_redisgn_detail_karyawan.md)

---

## Global Constraints

- **Brand PSPK:** Warna utama Deep Navy `#102E50`, Warm Gold `#F2AF3E`, Accent Maroon `#A8281C`. Font Lora (heading) dan Rubik (body).
- **No Mock/Dummy Leftover:** Seluruh tab dan komponen wajib terhubung ke skema Prisma riil (`Employee`, `Attendance`, `LeaveBalance`, `EmployeeAddress`, `EmployeeFamilyMember`, `EmployeeEducation`, `EmployeeTraining`, `EmployeeWorkExperience`, `EmployeeDocument`, dll.).
- **RBAC & Data Privacy:** Manager hanya dapat melihat tim/divisinya dan **dilarang melihat/mengekspor data gaji/sensitif**. NIK, NPWP, Rekening dienkripsi AES-256-GCM.
- **Solusi ZIP:** Jika opsi berkas lampiran dicentang, hasil unduhan berupa file `.zip` berisi PDF profil + folder `Dokumen_Lampiran/` berisi file dokumen asli. Jika tidak dicentang, unduh langsung file `.pdf`.
- **Aset Gambar PDF:** Header Logo `apps/hris/public/images/logo_pspk_horizontal.png`, Watermark `apps/hris/public/images/icon_pspk.jpg`, Avatar Fallback `Avatar_Wanita.jpg` (wanita) dan `Avatar_Pria.jpg` (pria).
- **Aturan Eksekusi:** **1 Task per 1 Respons**. Selesaikan dan verifikasi satu task secara menyeluruh sebelum melanjutkan ke task berikutnya.

---

## Review Focus (Kondisi Kritis yang Wajib Diwaspadai)

1. **Fallback Alamat:** Pegawai lama yang belum memiliki baris di `employee_addresses` harus otomatis fallback ke `employee.address` agar alamat tidak kosong.
2. **Karyawan Tanpa Foto:** Jika `photoKey` kosong, PDF dan Hero Card wajib menampilkan avatar default sesuai gender (`Avatar_Wanita.jpg` / `Avatar_Pria.jpg`).
3. **Penyaringan Absensi:** Log absensi bulanan harus ter-filter presisi berdasarkan rentang tanggal bulan aktif untuk mencegah kebocoran data bulan lain atau beban memori berlebih.
4. **Otorisasi Server Ekspor:** Validasi role Manager di Route Handler harus menolak/mengabaikan opsi data sensitif dan gaji meskipun client memanipulasi form.
5. **Penanganan Berkas Non-PDF di ZIP:** Dokumen karyawan berformat gambar (JPG/PNG) atau scan dokumen harus tetap dapat dimasukkan ke dalam arsip ZIP tanpa korupsi berkas.

---

## Rincian Task Implementasi

```
Task 1: Backend Data Queries & Helper Expansion
   ↓
Task 2: Tab 1 "Ringkasan" (Overview 360° - Default View)
   ↓
Task 3: Tab 2 "Biodata & Riwayat Terpadu" (Alamat, Keluarga, Pendidikan, Pelatihan, Pengalaman)
   ↓
Task 4: Tab 3 "Absensi & Cuti" (Kalender Bulanan, Log Harian, Saldo Cuti)
   ↓
Task 5: Tab 6 "Dokumen Digital" Enhancement (Checklist 7 Dokumen Wajib)
   ↓
Task 6: Hero Profile Card & Main Page Integration (`/karyawan/[id]/page.tsx`)
   ↓
Task 7: Modal Ekspor Profil (`ExportProfileModal`)
   ↓
Task 8: Route Handler Export & PDF Generation Engine (Single PDF + Watermark)
   ↓
Task 9: ZIP Packaging Engine (Full Archive Download + Dokumen Lampiran)
   ↓
Task 10: End-to-End Verification, Crosscheck & Quality Assurance
```

---

### Task 1: Backend Data Queries & Helper Expansion

**Tujuan:** Menyediakan fungsi query database terintegrasi untuk absensi bulanan, saldo cuti, dan kalkulator kelengkapan profil karyawan.

**Files:**
- Modify: `apps/hris/src/server/queries/employee.queries.ts`
- Create / Modify: `apps/hris/src/server/queries/attendance-leave.queries.ts` (atau satukan di module query terkait)
- Create: `apps/hris/src/lib/profile-completeness.ts`

**Interfaces:**
- Consumes: Prisma Client (`@pspk/db`), model `Employee`, `Attendance`, `LeaveBalance`, `LeaveRequest`, `Holiday`, `TimesheetSubmission`.
- Produces:
  - `getEmployeeMonthlyAttendance(employeeId: string, year: number, month: number): Promise<MonthlyAttendanceData>`
  - `getEmployeeLeaveBalances(employeeId: string, year: number): Promise<EmployeeLeaveBalanceData[]>`
  - `calculateProfileCompleteness(employee: any): { percentage: number; missingFields: string[]; completedCount: number; totalCount: number }`

- [x] **Langkah 1 (Pengecekan Sebelum Pengeditan):**
  - Cek struktur model `Attendance`, `LeaveBalance`, `LeaveRequest`, `Holiday`, dan `TimesheetSubmission` di `packages/db/prisma/schema/hris.prisma`.
  - Verifikasi query `getEmployeeById` di `apps/hris/src/server/queries/employee.queries.ts` memastikan relasi `addresses`, `familyMembers`, `educations`, `trainings`, dan `workExperiences` sudah dipanggil dengan benar.
- [x] **Langkah 2 (Implementasi):**
  - Buat helper kalkulasi kelengkapan profil `calculateProfileCompleteness` di `apps/hris/src/lib/profile-completeness.ts` (memeriksa 12 komponen vital: foto, alamat KTP, domisili, kontak darurat, keluarga, pendidikan, pengalaman kerja, KTP, NPWP, ijazah, CV, rekening bank).
  - Buat query `getEmployeeMonthlyAttendanceOverview` di `apps/hris/src/server/queries/attendance.queries.ts` untuk mengambil log kehadiran bulan tertentu, status cuti yang disetujui, hari libur nasional, total jam timesheet paruh waktu, dan saldo cuti tahunan.
  - Buat server action `getEmployeeMonthlyAttendanceAction` di `apps/hris/src/server/actions/attendance.actions.ts` dengan otorisasi RBAC ketat.
- [x] **Langkah 3 (Crosscheck Setelah Pengeditan):**
  - Jalankan `pnpm --filter @pspk/hris typecheck` dan `pnpm --filter @pspk/hris lint`.
  - Buat unit test `apps/hris/src/lib/profile-completeness.test.ts` dan jalankan vitest (semua lolos 100%).
  - Verifikasi bahwa fungsi siap dikonsumsi oleh Task 2, Task 3, dan Task 4.

---

### Task 2: Tab 1 "Ringkasan" (Overview 360° — Default View)

**Tujuan:** Membangun antarmuka landing tab pertama yang menyajikan kartu skor KPI eksekutif dan progress kelengkapan profil karyawan.

**Files:**
- Create: `apps/hris/src/components/karyawan/tabs/employee-overview-tab.tsx`

**Interfaces:**
- Consumes: Data `employee` dari `getEmployeeById`, data absensi bulan berjalan dari Task 1, data saldo cuti dari Task 1, dan helper `calculateProfileCompleteness`.
- Produces: Komponen React `<EmployeeOverviewTab />`.

- [x] **Langkah 1 (Pengecekan Sebelum Pengeditan):**
  - Periksa props yang dibutuhkan oleh komponen overview: `employee`, `attendanceSummary`, `leaveSummary`, `activeAssetsCount`.
  - Pastikan desain kartu KPI selaras dengan palet brand PSPK (`#102E50`, `#F2AF3E`).
- [x] **Langkah 2 (Implementasi):**
  - Implementasikan 4 Kartu Skor KPI:
    1. Masa Kerja (format tahun & bulan dari `joinDate`).
    2. Kehadiran Bulan Ini (persentase hadir tepat waktu).
    3. Sisa Cuti Tahunan (total sisa hari cuti aktif).
    4. Aset Kantor Aktif (jumlah unit yang dipinjam).
  - Implementasikan Card Kelengkapan Profil (%) dengan progress bar visual dan collapsible checklist bagian yang belum lengkap.
  - Implementasikan Ringkasan Penempatan & Pengingat Akhir Kontrak (peringatan jika kontrak berakhir dalam 30 hari).
- [x] **Langkah 3 (Crosscheck Setelah Pengeditan):**
  - Jalankan `pnpm --filter @pspk/hris typecheck` dan `pnpm --filter @pspk/hris lint`.
  - Pastikan kalkulasi masa kerja tepat menangani pegawai baru (< 1 bulan) dan pegawai lama.
  - Pastikan komponen siap dimuat di `page.tsx` pada Task 6.

---

### Task 3: Tab 2 "Biodata & Riwayat Terpadu" (Alamat, Keluarga, Pendidikan, Pelatihan, Pengalaman)

**Tujuan:** Menyajikan seluruh data pribadi, keluarga, dan rekam jejak karir/akademik yang telah diinput di formulir pendaftaran ke dalam format tabel bergaris rapi.

**Files:**
- Create: `apps/hris/src/components/karyawan/tabs/employee-biodata-tab.tsx`
- Create / Update helper label enum: `apps/hris/src/lib/enum-labels.ts`

**Interfaces:**
- Consumes: `employee.addresses`, `employee.familyMembers`, `employee.educations`, `employee.trainings`, `employee.workExperiences`, dan field pribadi lengkap.
- Produces: Komponen React `<EmployeeBiodataTab />`.

- [x] **Langkah 1 (Pengecekan Sebelum Pengeditan):**
  - Periksa struktur kolom `EmployeeAddress`, `EmployeeFamilyMember`, `EmployeeEducation`, `EmployeeTraining`, `EmployeeWorkExperience`.
  - Identifikasi enum bahasa Inggris (`SINGLE`, `MARRIED`, `FATHER`, `MOTHER`, `SPOUSE`, `CHILD`, `SD`..`S3`) dan siapkan pemetaan label bahasa Indonesia.
- [x] **Langkah 2 (Implementasi):**
  - Buat pemetaan label kamus enum Indonesia di `apps/hris/src/lib/enum-labels.ts`.
  - Implementasikan Kartu Identitas Pribadi (nama ibu kandung, telepon rumah, agama, kewarganegaraan, gol. darah, kontak darurat + hubungan).
  - Implementasikan Tabel Alamat KTP & Domisili (dengan fallback otomatis ke `employee.address`).
  - Implementasikan Tabel Anggota Keluarga & Tanggungan (`isDependent`).
  - Implementasikan Tabel Riwayat Pendidikan Formal & Nilai IPK.
  - Implementasikan Tabel Riwayat Pelatihan & Sertifikasi.
  - Implementasikan Tabel Riwayat Pengalaman Kerja Terdahulu (jika `endDate == null`, tampilkan badge hijau *"Sekarang / Aktif"*).
  - Terapkan standar responsivitas menyeluruh: overflow-x guard untuk PWA/mobile, touch-friendly wrapping, dan tablet grid.
- [x] **Langkah 3 (Crosscheck Setelah Pengeditan):**
  - Jalankan `pnpm --filter @pspk/hris typecheck` dan `pnpm --filter @pspk/hris lint`.
  - Buat unit test `apps/hris/src/lib/enum-labels.test.ts` dan jalankan vitest (semua lolos 100%).
  - Pastikan kondisi data kosong (array `[]` atau field `null`) menampilkan placeholder ramah ("Belum dicatat") dan tidak merusak layout tabel.
  - Pastikan terhubung mulus dengan data dari `page.tsx` pada Task 6.

---

### Task 4: Tab 3 "Absensi & Cuti" (Kalender Bulanan, Log Harian, Saldo Cuti)

**Tujuan:** Membangun antarmuka manajemen presensi dan cuti karyawan per bulan dengan pemilih bulan/tahun dinamis yang terhubung ke query database riil.

**Files:**
- Create: `apps/hris/src/components/karyawan/tabs/employee-attendance-tab.tsx`
- Create / Update server action untuk fetch attendance: `apps/hris/src/server/actions/attendance-query.actions.ts`

**Interfaces:**
- Consumes: Query Task 1 (`getEmployeeMonthlyAttendance`, `getEmployeeLeaveBalances`).
- Produces: Komponen React `<EmployeeAttendanceTab />`.

- [x] **Langkah 1 (Pengecekan Sebelum Pengeditan):**
  - Periksa enum `AttendanceStatus` (`PRESENT`, `LATE`, `ABSENT`, `LEAVE`, `HOLIDAY`, `WFH`) dan format tanggal kalender bulanan.
  - Tentukan mekanisme pergantian bulan (Client state + Server Action `getEmployeeMonthlyAttendanceAction`).
- [x] **Langkah 2 (Implementasi):**
  - Buat bilah pemilih Bulan & Tahun dinamis dengan tombol *Prev*, *Next*, dan tombol *"Bulan Ini"*.
  - Buat kartu ringkasan kehadiran bulanan (Hadir, Telat, WFH, Izin, Alpha, % Kehadiran, Jam Timesheet).
  - Buat visual grid kalender mini 7-hari (Senin s.d. Minggu) dengan kode warna status, indikator hari ini, dan penanda libur nasional.
  - Buat tabel detail presensi harian (Tanggal, Jam Masuk, Jam Pulang, Durasi, Status, Sumber, Catatan/Koreksi).
  - Buat tabel izin cuti bulan tersebut dan tabel saldo cuti tahunan (`quotaDays`, `usedDays`, sisa).
  - Terapkan standar responsivitas optimal: kontrol tombol ramah sentuhan PWA/mobile, grid kalender elastis, dan horizontal scroll protection pada tabel log presensi.
- [x] **Langkah 3 (Crosscheck Setelah Pengeditan):**
  - Jalankan `pnpm --filter @pspk/hris typecheck` dan `pnpm --filter @pspk/hris lint`.
  - Verifikasi transisi pergantian bulan berjalan mulus tanpa error rendering.
  - Pastikan data terhubung ke model `Attendance` riil dan siap dikonsumsi di `page.tsx` pada Task 6.

---

### Task 5: Tab 6 "Dokumen Digital" Enhancement (Checklist 7 Dokumen Wajib)

**Tujuan:** Melengkapi tab dokumen dengan panel checklist kelengkapan dokumen pendaftaran wajib dan badge dokumen tertaut ke pendidikan/pelatihan.

**Files:**
- Modify: `apps/hris/src/components/karyawan/employee-documents-card.tsx`

**Interfaces:**
- Consumes: `documents: EmployeeDocumentItem[]`, kategori dokumen (`KTP`, `NPWP`, `CV`, `DIPLOMA`, `CONTRACT`, dll.).
- Produces: Tampilan checklist kelengkapan dokumen wajib & tautan sertifikat.

- [x] **Langkah 1 (Pengecekan Sebelum Pengeditan):**
  - Periksa implementasi eksisting di `apps/hris/src/components/karyawan/employee-documents-card.tsx`.
  - Identifikasi 7 dokumen wajib pendaftaran: KTP, NPWP, Kartu Keluarga, Ijazah, CV, Surat Pengalaman, Kontrak Kerja.
- [x] **Langkah 2 (Implementasi):**
  - Tambahkan banner checklist status dokumen wajib di bagian atas kartu dokumen (menampilkan persentase kelengkapan berkas dan indikator mana yang sudah / belum diunggah).
  - Tambahkan penanda badge jika dokumen tertaut ke entitas pendidikan (`educationId`) atau pelatihan (`trainingId`).
- [x] **Langkah 3 (Crosscheck Setelah Pengeditan):**
  - Jalankan `pnpm --filter @pspk/hris typecheck`.
  - Pastikan fungsi upload, preview modal, unduh, dan hapus berkas tetap berfungsi normal tanpa regresi.

---

### Task 6: Hero Profile Card & Main Page Integration (`/karyawan/[id]/page.tsx`)

**Tujuan:** Mengintegrasikan seluruh tab baru ke halaman utama `/karyawan/[id]`, memperbarui Hero Profile Card dengan tombol "Export Profil", dan menerapkan fallback avatar gender.

**Files:**
- Modify: `apps/hris/src/app/(app)/karyawan/[id]/page.tsx`
- Modify: `apps/hris/src/components/karyawan/employee-avatar.tsx`

**Interfaces:**
- Consumes: Semua tab dari Task 2, 3, 4, 5, query Task 1, dan modal ekspor dari Task 7.
- Produces: Halaman detail karyawan 360° yang utuh dan terintegrasi.

- [x] **Langkah 1 (Pengecekan Sebelum Pengeditan):**
  - Periksa `page.tsx` saat ini, alur sanitasi tab URL, dan proteksi hak akses berbasis peran (Super Admin, Admin HR, Admin IT, Manager, Staff).
  - Pastikan tab `ringkasan` menjadi default (`const { tab = "ringkasan" } = await searchParams;`).
- [x] **Langkah 2 (Implementasi):**
  - Update `EmployeeAvatar` agar mendukung prop `gender` dan otomatis memanggil fallback avatar (`/images/Avatar_Wanita.jpg` untuk perempuan, `/images/Avatar_Pria.jpg` untuk laki-laki/default) jika foto profil belum diunggah.
  - Pasang tombol **"Export Profil"** di Hero Card di samping tombol "Ubah Profil" (hanya muncul untuk HR/Admin dan Manager yang berhak).
  - Daftarkan tab navigasi lengkap: `Ringkasan` (default), `Biodata`, `Absensi`, `Kontrak`, `Jabatan & Tim`, `Dokumen`, `Aset` (modular), `Data Sensitif` (khusus HR), dan `Akun & Akses` (khusus HR/IT).
  - Hubungkan data server ke masing-masing subkomponen tab.
- [x] **Langkah 3 (Crosscheck Setelah Pengeditan):**
  - Jalankan `pnpm --filter @pspk/hris typecheck` dan `pnpm --filter @pspk/hris lint`.
  - Pastikan navigasi antar tab berjalan mulus via URL query `?tab=...`.
  - Pastikan proteksi hak akses Manager tetap aman dan tidak bocor.

---

### Task 7: Modal Ekspor Profil (`ExportProfileModal`)

**Tujuan:** Membangun antarmuka modal pemilihan opsi ekspor data karyawan (pilihan bagian profil, rentang tanggal absensi, opsi data sensitif, opsi kompensasi, dan opsi pengemasan berkas ZIP).

**Files:**
- Create: `apps/hris/src/components/karyawan/export-profile-modal.tsx`

**Interfaces:**
- Consumes: `employeeId`, `employeeName`, `employeeNo`, `userRole` (isHrOrAdmin, isManager).
- Produces: Komponen modal pemicu unduhan PDF / ZIP ke endpoint `/api/karyawan/[id]/export`.

- [x] **Langkah 1 (Pengecekan Sebelum Pengeditan):**
  - Periksa spesifikasi modal pada Bagian 3.1 dokumen `rombak_redisgn_detail_karyawan.md`.
  - Pastikan checkbox opsi sensitif & kompensasi otomatis berstatus `disabled` dengan tooltip peringatan jika dibuka oleh pengguna ber-role Manager.
- [x] **Langkah 2 (Implementasi):**
  - Implementasikan form checkbox multi-opsi (data pribadi, alamat, keluarga, penempatan, kontrak, absensi, dokumen, aset).
  - Implementasikan date picker rentang tanggal absensi (Dari – Sampai).
  - Implementasikan checkbox data sensitif & kompensasi dengan modal konfirmasi keamanan audit saat dicentang.
  - Implementasikan checkbox **"Unduh sebagai Paket Arsip Lengkap (.ZIP)"** dengan deskripsi bahwa PDF dan berkas dokumen asli akan dikemas bersama.
  - Tambahkan tombol "Unduh Data" yang melakukan request unduhan ke Route Handler export dengan indikator loading status.
- [x] **Langkah 3 (Crosscheck Setelah Pengeditan):**
  - Jalankan `pnpm --filter @pspk/hris typecheck`.
  - Verifikasi interaksi modal: buka/tutup, toggle checkbox, dan peringatan konfirmasi audit.
  - Pastikan payload parameter siap dikirim ke Route Handler pada Task 8 dan 9.

---

### Task 8: Route Handler Export & PDF Generation Engine (Single PDF + Watermark)

**Tujuan:** Membangun endpoint server `/api/karyawan/[id]/export` dan template dokumen PDF resmi dengan logo PSPK, watermark transparan, avatar foto/fallback, serta tata letak tabel data yang rapi dan terstruktur.

**Files:**
- Create: `apps/hris/src/app/api/karyawan/[id]/export/route.ts`
- Create: `apps/hris/src/lib/pdf/employee-profile-pdf.tsx` (atau pdf generator engine)
- Verify dependencies: instalasi `@react-pdf/renderer` dan `pdf-lib` jika belum terpasang.

**Interfaces:**
- Consumes: Query data lengkap karyawan, request params (bagian yang dicentang, rentang tanggal absensi, opsi sensitif).
- Produces: Streaming response file PDF (`Content-Type: application/pdf`).

- [x] **Langkah 1 (Pengecekan Sebelum Pengeditan):**
  - Cek ketersediaan aset gambar di `apps/hris/public/images/`: `logo_pspk_horizontal.png`, `icon_pspk.jpg`, `Avatar_Wanita.jpg`, `Avatar_Pria.jpg`.
  - Cek otentikasi sesi Better Auth dan hak akses RBAC aktor yang melakukan request di server.
- [x] **Langkah 2 (Implementasi):**
  - Buat template PDF resmi menggunakan PDFKit stream engine:
    - Kop logo horizontal PSPK & watermark logo ikon transparan (6%).
    - Halaman 1: Sampul ringkasan eksekutif, foto profil / fallback avatar gender, data inti, kontak.
    - Halaman 2: Tabel alamat KTP & domisili, tabel susunan anggota keluarga & tanggungan.
    - Halaman 3: Tabel riwayat pendidikan, pelatihan, dan pengalaman kerja terdahulu.
    - Halaman 4: Tabel penempatan, riwayat mutasi jabatan, tabel kontrak kerja, tabel kompensasi/pajak (jika diizinkan), data sensitif (jika diizinkan; jika tidak nilai "— DILINDUNGI —").
    - Halaman 5: Rekapitulasi absensi dalam rentang tanggal & tabel saldo cuti.
    - Halaman 6: Daftar dokumen kepegawaian, aset inventaris kantor, dan 2 kolom tanda tangan resmi (HR Administrator & Atasan Langsung).
  - Terapkan pencatatan log audit: `EXPORT_PROFILE` dan `VIEW_SENSITIVE` (jika data sensitif dibuka) pada `core.audit_logs`.
- [x] **Langkah 3 (Crosscheck Setelah Pengeditan):**
  - Jalankan `pnpm --filter @pspk/hris typecheck`.
  - Uji endpoint ekspor PDF untuk memastikan respon mengalirkan binary PDF yang valid dan dapat dibuka di PDF viewer.
  - Pastikan watermark dan logo muncul dengan tajam dan rapi.

---

### Task 9: ZIP Packaging Engine (Full Archive Download + Dokumen Lampiran)

**Tujuan:** Mengintegrasikan pembuatan paket arsip `.zip` ketika opsi unduh berkas lampiran dicentang di modal ekspor.

**Files:**
- Modify: `apps/hris/src/app/api/karyawan/[id]/export/route.ts`
- Verify dependencies: library `archiver` atau `jszip`.

**Interfaces:**
- Consumes: Binary stream PDF profil dari Task 8, seluruh file fisik dokumen dari `StorageProvider` berdasarkan `fileKey` di tabel `EmployeeDocument`.
- Produces: Streaming response file ZIP (`Content-Type: application/zip`).

- [x] **Langkah 1 (Pengecekan Sebelum Pengeditan):**
  - Periksa interface `StorageProvider` di `@pspk/storage` untuk membaca buffer file dari `fileKey`.
  - Periksa mekanisme streaming ZIP di Next.js Route Handler agar efisien dan tidak menumpuk di heap memori.
- [x] **Langkah 2 (Implementasi):**
  - Jika parameter `packageZip === "true"`:
    1. Render PDF profil utama di memori buffer.
    2. Buat arsip ZIP stream.
    3. Masukkan `[NIP]_[Nama_Karyawan]_Profil.pdf` ke root arsip.
    4. Ambil seluruh berkas dokumen aktif milik karyawan dari storage provider dan masukkan ke dalam subfolder `Dokumen_Lampiran/` dengan nama file yang bersih (`01_KTP_[Nama].pdf`, `02_Ijazah_[Nama].pdf`, dll.).
    5. Kirim response stream dengan header `Content-Type: application/zip` dan `filename="[NIP]_[Nama]_Profil_Lengkap.zip"`.
- [x] **Langkah 3 (Crosscheck Setelah Pengeditan):**
  - Jalankan `pnpm --filter @pspk/hris typecheck`.
  - Uji unduhan ZIP pada karyawan yang memiliki berkas dokumen dan foto, ekstrak berkas hasil unduhan, dan pastikan seluruh isi file utuh tanpa korupsi.

---

### Task 10: End-to-End Verification, Crosscheck & Quality Assurance

**Tujuan:** Memverifikasi seluruh alur dari UI hingga database, memastikan tidak ada regresi, menguji responsivitas antarmuka, dan memastikan seluruh checklist Definition of Done terpenuhi.

**Files:**
- Seluruh file yang dibuat dan diubah pada Task 1 s.d. Task 9.

- [ ] **Langkah 1 (Pengecekan Sebelum Pengeditan):**
  - Pastikan dev server berjalan tanpa error log.
- [ ] **Langkah 2 (Eksekusi Pengujian Menyeluruh):**
  - Jalankan verifikasi statis proyek:
    ```bash
    pnpm --filter @pspk/hris typecheck
    pnpm --filter @pspk/hris lint
    pnpm --filter @pspk/hris build
    ```
  - Uji alur UI pada browser / dev server:
    - Tab Ringkasan: KPI dan persentase kelengkapan terhitung akurat.
    - Tab Biodata: Seluruh tabel (alamat, keluarga, pendidikan, pelatihan, pengalaman) tampil rapi dan responsif.
    - Tab Absensi: Pemilih bulan berfungsi, kalender berwarna muncul, log harian tertera.
    - Tab Dokumen: Checklist dokumen wajib tampil akurat.
    - Hero Card: Tombol "Export Profil" memicu modal dengan sempurna.
    - Modal Ekspor: Uji ekspor PDF langsung dan uji ekspor paket ZIP.
  - Verifikasi tabel `core.audit_logs` memastikan aktivitas `EXPORT_PROFILE` tercatat rapi.
- [ ] **Langkah 3 (Crosscheck Final):**
  - Pastikan seluruh kode bersih, rapi, dan tidak ada file sementara (*scratch*) yang tertinggal.
  - Buat laporan ringkas pencapaian kepada pengguna.

---

## Aturan Eksekusi Handoff

Sesuai instruksi Anda: **1 task diselesaikan dalam 1 respons**.  
Setiap task wajib melalui tahapan:
1. **Pengecekan awal**
2. **Implementasi**
3. **Crosscheck menyeluruh & verifikasi keterhubungan**

Sebelum kita mulai menyentuh kode untuk **Task 1**, silakan tinjau rencana implementasi ini. Jika sudah sesuai, beri konfirmasi agar saya langsung mengeksekusi **Task 1: Backend Data Queries & Helper Expansion**.
