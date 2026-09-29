# Status Kemajuan Pengembangan PSPK Platform

Dokumen ini diperbarui secara berkala pada setiap akhir fase/tugas.

---

## Fase 1 — Setup Awal Monorepo & Fondasi Sistem
- **Status:** Selesai (Completed)
- **Capaian:**
  - Struktur monorepo Turborepo + pnpm workspace telah disiapkan dan diselaraskan.
  - 7 packages bersama terkonfigurasi dan saling terhubung (`@pspk/config`, `@pspk/shared`, `@pspk/db`, `@pspk/rbac`, `@pspk/auth`, `@pspk/storage`, `@pspk/ui`).
  - 2 aplikasi Next.js mandiri terhubung ke monorepo:
    - `apps/hris` (`@pspk/hris`, port 3001)
    - `apps/sysmgmt` (`@pspk/sysmgmt`, port 3002)
  - Database PostgreSQL lokal terhubung dengan 3 skema terpisah (`core`, `hris`, `sysmgmt`).
  - Skema Prisma multi-schema dibuat, migrasi pertama (`20260921000000_init_core`) diaplikasikan ke database.
  - Seeding idempotent berhasil: 56 permission, 5 peran sistem (`super_admin`, `admin_hr`, `admin_it`, `manager`, `staff`), akun super admin awal (`admin@pspk.example`), dan 4 jenis cuti default.
  - Identitas brand PSPK (warna navy `#102E50`, gold `#F2AF3E`, maroon `#A8281C`, font Lora & Rubik) diterapkan melalui `@pspk/ui/brand.css`.
  - Komponen `AppSwitcher` berfungsi untuk navigasi antar aplikasi.
  - Konfigurasi Docker produksi (`Dockerfile.next`, `Dockerfile.migrate`, `docker-compose.prod.yml`, `Caddyfile`, `scripts/backup.sh`, `scripts/restore.md`) siap untuk deployment VPS.
  - Seluruh pengujian kualitas hijau: `pnpm lint`, `pnpm typecheck`, `pnpm test` (14 unit test), `pnpm build`.

### Checklist Fase 1 (100% Terpenuhi):
- [x] Repo, workspace, Turborepo, Prettier, ESLint, `tsconfig` bersama berjalan; `pnpm lint`, `typecheck`, `build` hijau.
- [x] `apps/hris` (3001) dan `apps/sysmgmt` (3002) berjalan dengan `pnpm dev`; `/api/health` OK di keduanya (`{"status":"ok"}`).
- [x] PostgreSQL lokal berjalan; `DATABASE_URL` dari `.env`.
- [x] Migration `init_core` + seed idempotent berhasil; skema `core`, `hris`, `sysmgmt` ada di database.
- [x] Kerangka semua package (`config`, `db`, `auth`, `rbac`, `storage`, `shared`, `ui`) terhubung dan ter-import dari kedua app.
- [x] Brand (warna + font Lora/Rubik) tampil di halaman kedua app.
- [x] Akun login dasar super admin hasil seed tersimpan aman di database.
- [x] Konfigurasi stack produksi siap di lokal.
- [x] `docs/PROGRESS.md`, `docs/DECISIONS.md`, `docs/OPEN_QUESTIONS.md`, `docs/data-audit.md` dibuat.

---

## Layar P-C1 — Halaman Login Bersama (PSPK Platform)
- **Status:** Selesai (Completed)
- **Sumber Desain:** Stitch AI Screen P-C1 (Project ID: `9384324621089398179`, Screen ID: `d1ac364d517f42948a50aa4aab3f89d8`)
- **Implementasi:**
  - Ditulis ulang 100% murni dalam React & Tailwind CSS (`packages/ui/src/login-page.tsx`).
  - Fitur Pengalih Portal (Slide Switcher): Ditambahkan segmented pill control interaktif di bagian atas untuk berpindah mulus antar *Portal HRIS* (`:3001/login`) dan *System Management* (`:3002/login`).
  - Identitas Khas Tiap Portal:
    - **HRIS**: Nuansa aksen emas `#feba48`, label *Akses Masuk Pegawai HRIS*, headline fokus ke manajemen absensi, cuti, dan kepegawaian tim riset PSPK.
    - **System Management**: Nuansa aksen teknologi biru `#60a5fa`, label *Akses Administrator Sistem*, headline fokus ke kontrol hak akses RBAC, inventarisasi aset, dan audit trail.
  - Desain 1 Layar Penuh: Layout terkunci rapi pada 100vh tanpa scrollbar, responsif di resolusi laptop/desktop.
  - Integrasi Better Auth:
    - Route handlers di `apps/hris/src/app/api/auth/[...all]/route.ts` dan `apps/sysmgmt/src/app/api/auth/[...all]/route.ts`.
    - Client Better Auth di `packages/auth/src/client.ts`.
    - Migrasi Prisma `20260921084144_add_account_id_token` menambahkan kolom `idToken` pada tabel `core.accounts`.
    - Helper hashing Better Auth `hashPassword` diterapkan pada seed super admin.
  - Rute aktif di kedua aplikasi:
    - `http://localhost:3001/login` (HRIS)
    - `http://localhost:3002/login` (System Management)
  - Hasil Uji: Autentikasi kredensial `admin@pspk.example` / `AdminPSPK2026!#` berhasil memverifikasi, mengembalikan token sesi, dan menyimpan sesi ke tabel `core.sessions` di database.

---

## Layar P-1A, P-1B, P-1C — HRIS App Shell & Dashboard Multiperan
- **Status:** Selesai (Completed)
- **Sumber Desain:** Stitch AI Screens:
  - P-1A: Shell HRIS — Admin HR (`e2ae48ce397a44bda712ef8d1543336c`)
  - P-1B: Shell HRIS — Karyawan Staff (`7433085caed843c399c01a1b07d776a1`)
  - P-1C: Shell HRIS — Manajer (`3a75c17c3b1647c59efe516dff07f69b`)
- **Implementasi:**
  - **App Shell Terpadu**:
    - Sidebar dinamis collapsible (`apps/hris/src/components/shell/app-sidebar.tsx`) dengan warna navy `#102E50`, logo monogram PSPK, dan filter menu otomatis berdasarkan role (Admin HR, Manajer, Staff).
    - Topbar terapung (`app-topbar.tsx`) dengan breadcrumbs dinamis, AppSwitcher, tombol notifikasi berpenghitung merah, dan UserNav.
    - AppSwitcher (`app-switcher.tsx`): Dropdown beralih antara HRIS (`:3001`) dan System Management (`:3002`).
    - UserNav (`user-nav.tsx`): Menampilkan inisial avatar, nama, badge role institusi, dan tombol *Keluar* terhubung ke Better Auth `signOut()`.
  - **Layout Terproteksi**:
    - `apps/hris/src/app/(app)/layout.tsx`: Memvalidasi sesi Better Auth di server via `getSession(headers)`. Pengguna tanpa sesi otomatis di-redirect ke `/login`.
    - `apps/hris/src/app/page.tsx`: Otomatis me-redirect pengguna ke `/dashboard` jika sudah login atau ke `/login` jika belum.
  - **Dashboard Adaptif Multiperan (`/dashboard`)**:
    - `apps/hris/src/app/(app)/dashboard/page.tsx`: Menggabungkan ketiga rancangan layar Stitch:
      - **Admin HR (P-1A)**: Direktori staf, tombol tambah pegawai & impor data Excel, 3 stat cards (148 pegawai aktif, 5 pengajuan cuti, 32 peneliti lapangan), dan search filter bar.
      - **Manajer (P-1C)**: 4 metrik tim (pending, kapasitas aktif 87.5%, disetujui, respon) dan kartu daftar permohonan cuti anggota tim dengan aksi *Setujui* dan *Tolak*.
      - **Karyawan / Staff (P-1B)**: Kartu identitas pegawai (Made Wirawan), 3 stat cards (sisa cuti 8 hari, presensi 98.5%, peneliti muda aktif), data induk pegawai, dan presensi masuk.
      - Dilengkapi quick perspective switcher di bagian atas untuk menguji ketiga perspektif tampilan.
  - **Hasil Pengujian**:
    - `pnpm typecheck` lolos (9/9 packages).
    - `pnpm lint` lolos dengan 0 error.
    - `pnpm test` lolos (14 unit test hijau).
    - Pengujian curl redirect dan auth session: `/dashboard` mengembalikan HTTP 307 ke `/login` jika anonim, dan HTTP 200 jika terautentikasi.

---

## Tahap 1 — HRIS Admin HR: Manajemen Data Karyawan & Organisasi

- **Tanggal Selesai**: 22 September 2026
- **Status**: Selesai ✅ (Semua fungsi CRUD teruji langsung ke PostgreSQL)
- **Fokus Prioritas**: Admin HR (Kelola Direktori Pegawai, Kontrak, Enkripsi Data Sensitif, Impor Excel, Audit Log)
- **Rincian Implementasi & Layar**:
  - **Aturan Frontend (`.agents/rules/`)**:
    - `.agents/rules/frontend-brand.md`: Konsistensi warna PSPK (Navy `#102E50`, Gold `#F2AF3E`/`#FEBA48`, Maroon `#A8281C`), tipografi (Lora untuk heading, Rubik untuk body), dan token radius.
    - `.agents/rules/frontend-design-taste.md`: Panduan anti-slop, kontras warna, micro-interactions, layout berbasis ritme visual 4px/8px.
    - `.agents/rules/frontend-components-ux.md`: Standar interaksi tabel, modal konfirmasi, badge status, form wizard, dan feedback toast.
    - `.agents/rules/frontend-a11y-perf.md`: Aksesibilitas (ARIA, keyboard nav, screen reader) dan optimasi performa Next.js.
  - **H4 Direktori Karyawan (`/karyawan`)**:
    - Tabel direktori pegawai interaktif (`employee-table.tsx`): avatar, NIP, nama lengkap, posisi/jabatan, divisi, tipe kontrak berlabel warna, status kepegawaian (`status-badge.tsx`), dan countdown masa berlaku kontrak aktif.
    - Filter bar komprehensif (`employee-filter-bar.tsx`): pencarian instan (nama/NIP/email), dropdown divisi dinamis dari database, filter status (`ACTIVE`, `PROBATION`, `RESIGNED`), dan filter tipe kontrak (`PKWT`, `PKWTT`, `INTERNSHIP`, `CONSULTANT`).
    - Alert banner kontrak segera berakhir (`expiring-contract-alert.tsx`): otomatis mendeteksi pegawai dengan sisa kontrak <= 30 hari (tervalidasi dengan data seed Anita Wijaya PKWT sisa 23 hari).
    - Tombol aksi cepat: Impor Excel, Tambah Karyawan Baru, Export.
  - **H6 Tambah Karyawan Baru / Multi-step Wizard (`/karyawan/baru`)**:
    - 4 Langkah form terstruktur (`wizard-employee-form.tsx`):
      1. Data Pribadi (Nama, Panggilan, Email, NIK, No HP, Tempat/Tgl Lahir, Jenis Kelamin, Agama, Alamat).
      2. Pekerjaan & Organisasi (NIP, Divisi, Jabatan, Manajer Langsung, Tgl Masuk).
      3. Kontrak & Penggajian (Tipe Kontrak, Nomor Kontrak, Tgl Mulai, Tgl Berakhir, Status Kontrak, NPWP, Nama Bank, No Rekening, Atas Nama).
      4. Review & Konfirmasi lengkap sebelum simpan.
    - Validasi Zod di client & server (`employee.schema.ts`).
    - Penyimpanan atomik `$transaction` membuat `Employee` dan `EmploymentContract` sekaligus.
  - **H5 Detail Karyawan (`/karyawan/[id]`)**:
    - Header profil lengkap dengan avatar, NIP, status kepegawaian, tombol ubah data & aksi.
    - Tab navigasi: Ringkasan, Data Pribadi, Riwayat Kontrak & Jabatan, Dokumen.
    - Proteksi & Unmasking Data Sensitif (`sensitive-field-view.tsx`):
      - NIK, NPWP, dan No Rekening terenkripsi AES-256-GCM di database PostgreSQL.
      - Ditampilkan ter-masking (`•••• •••• •••• 1234`).
      - Tombol buka masking (unmask) dengan modal konfirmasi alasan audit log dan pencatatan audit log otomatis (`unmaskSensitiveFieldAction`).
    - Riwayat kontrak kerja terdaftar dari database.
  - **H7 Ubah Data Karyawan (`/karyawan/[id]/ubah`)**:
    - Form edit data lengkap pre-populated dengan data riil dari database.
    - Update data pegawai dan kontrak aktif dengan validasi ketat.
  - **H23 Impor Massal Excel/CSV (`/karyawan/impor`)**:
    - Fitur upload file spreadsheet (`.xlsx`, `.xls`, `.csv`).
    - Penguraian client-side dengan validasi format kolom PSPK.
    - Preview tabel data sebelum diimpor dengan validasi baris & deteksi error.
    - Batch action server (`importEmployeesBatchAction`) memproses dan menyimpan pegawai ke PostgreSQL dalam batch.
    - Unduh template Excel standar PSPK.
  - **Navigasi & Shell Terintegrasi**:
    - Badge counter jumlah karyawan aktif di menu sidebar terhubung dinamis ke total pegawai di database via `ShellContainer`.
- **Backend & Keamanan**:
  - `packages/shared/src/crypto.ts`: Enkripsi & dekripsi AES-256-GCM dengan authentication tag.
  - `packages/db/src/audit.ts`: Helper pencatatan audit log mutasi dan pembacaan data sensitif.
  - `apps/hris/src/server/services/employee.service.ts`: Semua operasi Create, Update, Delete (Soft-Delete dengan pembatalan kontrak aktif), dan Unmask dilakukan dalam Prisma `$transaction` dan menulis `AuditLog`.
  - `apps/hris/src/server/actions/employee.actions.ts`: Server Actions terproteksi dengan validasi sesi dan izin `EMPLOYEE_CREATE`, `EMPLOYEE_UPDATE`, `EMPLOYEE_DELETE`.
- **Pengujian & Validasi Kualitas**:
  - `pnpm typecheck`: ✅ 9/9 packages pass.
  - `pnpm --filter @pspk/hris lint`: ✅ 0 errors.
  - `pnpm test`: ✅ 14 unit test lolos.
  - `pnpm --filter @pspk/hris build`: ✅ Next.js standalone build berhasil tanpa error, 10 rute terkompilasi.
  - **Pengujian Nyata CRUD Database PostgreSQL (Semua Lulus)**:
    - **READ**: Query direktori dengan relasi departemen, jabatan, dan kontrak aktif ✅
    - **CREATE**: Penambahan pegawai baru beserta kontrak aktif via `$transaction` ✅
    - **UPDATE**: Pembaharuan data pegawai tersimpan di DB ✅
    - **DELETE**: Soft-delete (status RESIGNED, deletedAt terisi, status kontrak TERMINATED) ✅
    - **VERIFY**: Pegawai soft-deleted tidak muncul di query direktori aktif ✅
- **Pembersihan Antarmuka Siap Produksi (Header & Dashboard)**:
  - Header (`app-topbar.tsx`): Menghapus seluruh tombol prototipe `Tampilan: Admin HR | Manajer | Staff` dan elemen trigger `HRIS PSPK [Aktif]`. Header kini bersih dan profesional hanya memuat breadcrumbs, notifikasi sistem, dan UserNav.
  - Aksesibilitas Lintas Portal: Tautan menuju portal *System Management* ditempatkan rapi di dalam dropdown akun pengguna (`UserNav`).
  - Dashboard Eksekutif Admin HR (`dashboard/page.tsx`): Menghapus selector prototipe `Mode Tampilan Dashboard: Admin HR (P-1A) | ...`. Halaman diubah menjadi Server Component terhubung penuh ke database PostgreSQL dengan metrik pegawai aktif, masa percobaan, alert kontrak kerja $\le$ 30 hari, distribusi divisi, dan tabel pegawai terdaftar terkini.

---

## Tahap 2 — Manajemen Waktu & Kehadiran (Presensi & Cuti)

- **Tanggal Selesai**: 22 September 2026
- **Status**: Selesai ✅ (Semua fungsi CRUD dan transaksi atomik teruji langsung ke PostgreSQL)
- **Fokus Prioritas**: Admin HR, Manajer & Staf (Pencatatan Presensi Real-time, Koreksi Manual HR, Perhitungan Hari Kerja Murni, Kuota & Saldo Cuti, Persetujuan Atomik, Kalender Bersama, Audit Log Mutasi)
- **Rincian Implementasi & Layar**:
  - **Kalkulasi Hari Kerja Murni & Pengujian Unit (`packages/shared/src/leave.ts`)**:
    - `calculateWorkingDays(startDate, endDate, holidayDates)`: Menghitung hari kerja efektif dengan mengecualikan hari Sabtu (6), Minggu (0), dan hari libur nasional resmi.
    - `isDateOverlapping(startA, endA, startB, endB)`: Proteksi pencegahan permohonan cuti bertabrakan/tumpang tindih.
    - `hasSufficientLeaveBalance(quota, used, requested)`: Validasi sisa kuota cuti pegawai.
    - `packages/shared/src/leave.test.ts`: **15 unit test baru** menguji rentang hari kerja, libur berurutan, akhir pekan, overlap, dan saldo. Total unit test monorepo: **29/29 tests passed (100% hijau)**.
  - **Seed Database (`packages/db/prisma/seed.ts`)**:
    - 19 Hari Libur Nasional & Cuti Bersama 2026 disimpan di tabel `Holiday`.
    - Saldo cuti tahun 2026 (`LeaveBalance`) untuk seluruh pegawai benih (Tahunan: 12, Sakit: 14, Penting: 5, Melahirkan: 90).
    - Data presensi contoh bulan September 2026 dan 1 pengajuan cuti berstatus `PENDING` untuk verifikasi approval.
    - `today-attendance-card.tsx`: Jam digital interaktif multi-zona waktu dinamis (auto-detect zona browser seperti WITA/WIT/WIB + dropdown switcher zona waktu mandiri + dual-clock tersinkronisasi Waktu Lokal & Kantor Pusat WIB), konversi jam operasional kantor (09:00–17:00 WIB) ke jam lokal staf, status kehadiran harian, tombol *Catat Kehadiran Masuk* / *Catat Kehadiran Pulang*, dan catatan kerja. Stempel waktu berbasis `TIMESTAMPTZ` dengan proteksi offset UTC.
    - Widget ringkasan bulanan: Tepat Waktu, Terlambat, Izin/Cuti, dan Akumulasi Jam Kerja.
    - `attendance-table.tsx`: Tabel log kehadiran harian sebulan penuh dengan badge status berlabel warna, indikator zona waktu dinamis, dan catatan koreksi jika ada.
  - **H10 Rekap Absensi Staf & Koreksi HR (`/absensi/rekap`)**:
    - Akses terproteksi untuk Admin HR dan Manajer.
    - `attendance-rekap-view.tsx`: Filter berdasarkan bulan, tahun, divisi/departemen, dan pencarian nama/NIP pegawai.
    - Ringkasan metrik agregat tim: Total Hadir, Terlambat, Izin/Cuti, Alpa, dan Rata-rata Kehadiran.
    - `attendance-correction-modal.tsx`: Modal koreksi manual presensi oleh Admin HR dengan input stempel waktu masuk/keluar, status, dan **alasan koreksi wajib** yang terekam ke `core.AuditLog`.
  - **H11 Cuti & Izin Karyawan (`/cuti`)**:
    - Subnavigasi terpadu: Cuti Saya, Persetujuan Cuti (dengan badge merah permohonan pending), Kalender Cuti, dan Pengaturan Kuota & Libur.
    - `leave-balance-cards.tsx`: Visualisasi saldo kuota tahun 2026 (Tahunan, Sakit, Melahirkan, Penting) dengan progress bar persentase pemakaian dan sisa hari.
    - `leave-request-table.tsx`: Riwayat pengajuan cuti pribadi, status badge (`PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`), catatan keputusan approver, dan tombol pembatalan cuti.
  - **H12 Formulir Pengajuan Cuti (`/cuti/ajukan`)**:
    - `leave-request-form.tsx`: Pemilihan tipe cuti, pemilih tanggal mulai dan selesai, kalkulasi otomatis hari kerja aktif secara reaktif di sisi client.
    - Deteksi otomatis sisa saldo dan validasi ketercukupan kuota sebelum submit.
    - Validasi dokumen lampiran untuk tipe cuti yang mewajibkan berkas (misal: Surat Dokter untuk Cuti Sakit).
  - **H13 Persetujuan Cuti (`/cuti/persetujuan`)**:
    - `leave-approval-view.tsx`: Tab navigasi *Menunggu Persetujuan*, *Disetujui*, *Ditolak*, dan *Semua*.
    - Menampilkan kartu/tabel permohonan dengan identitas pegawai, divisi, durasi hari kerja, dan alasan.
    - Modal persetujuan dan penolakan dengan catatan keputusan wajib.
    - **Transaksi Atomik (`approveLeaveRequest`)**:
      1. Status permohonan diubah ke `APPROVED`.
      2. Saldo cuti `LeaveBalance.usedDays` dipotong secara atomik via `increment`.
      3. Catatan presensi `Attendance` harian berstatus `LEAVE` dibuat otomatis untuk seluruh hari kerja dalam rentang cuti.
      4. Log mutasi dicatat ke `core.AuditLog`.
  - **H14 Kalender Cuti & Hari Libur Bersama (`/cuti/kalender`)**:
    - `leave-calendar-view.tsx`: Kalender grid bulanan dinamis yang menampilkan jadwal cuti staf yang telah disetujui, cuti bersama, dan hari libur nasional resmi.
    - Kontrol navigasi bulan dan tahun interaktif.
  - **H15 Pengaturan Kuota & Hari Libur (`/cuti/pengaturan`)**:
    - `leave-settings-view.tsx`: Tab manajemen master jenis cuti (ubah kuota default tahunan, status aktif, kewajiban lampiran) dan tab kalender libur nasional (tambah hari libur baru dengan penanda cuti bersama).
- **Backend & Keamanan**:
  - `apps/hris/src/server/services/attendance.service.ts`: `recordCheckIn`, `recordCheckOut`, `correctAttendance` (semua mutasi menggunakan Prisma `$transaction` dan menulis `AuditLog`).
  - `apps/hris/src/server/services/leave.service.ts`: `submitLeaveRequest`, `approveLeaveRequest`, `rejectLeaveRequest`, `cancelLeaveRequest` (restore saldo dan reset kehadiran LEAVE jika permohonan yang disetujui dibatalkan).
  - `apps/hris/src/server/actions/attendance.actions.ts` & `leave.actions.ts`: Server Actions terproteksi sesi autentikasi dan validasi Zod.
- **Pengujian & Validasi Kualitas**:
  - `pnpm typecheck`: ✅ 9/9 packages pass.
  - `pnpm --filter @pspk/hris lint`: ✅ 0 errors (3 warnings standard non-blocking).
  - `pnpm test`: ✅ **29 unit test lolos (100% passing)**.
  - `pnpm --filter @pspk/hris build`: ✅ Next.js standalone build berhasil tanpa error, 17 rute dinamis terkompilasi.
  - **Pengujian Nyata Integrasi Database PostgreSQL (`verify_tahap2.ts`)**:
    - **Check-In & Check-Out**: Pencatatan jam masuk & pulang server-side sukses ✅
    - **Koreksi HR**: Penyesuaian manual catatan presensi dengan alasan koreksi sukses ✅
    - **Pengajuan Cuti**: Pengecekan saldo, overlap, dan kalkulasi 3 hari kerja sukses ✅
    - **Persetujuan Atomik**: Status `APPROVED`, saldo terpotong 3 hari, 3 record kehadiran `LEAVE` terisi otomatis ✅
    - **Pembatalan Cuti**: Status `CANCELLED`, saldo kembali utuh (refund), dan 3 record kehadiran `LEAVE` terhapus kembali ✅
    - **Audit Log**: 6 entri mutasi terverifikasi masuk ke tabel `core.AuditLog` ✅

---

## Perombakan Beranda / Dashboard per Role (HRIS PSPK)
- **Status:** Selesai (Completed)
- **Implementasi:**
  - **Arsitektur Query Terproteksi (`apps/hris/src/server/queries/dashboard/`)**:
    - `staff-dashboard.ts`: Query terisolasi `own` scope dengan validasi `assertCan(ctx, "hris.attendance.read:own")`.
    - `manager-dashboard.ts`: Query terisolasi `team` scope (`managerId = ctx.employeeId`) dengan validasi `assertCan(ctx, "hris.leave.read:team")`.
    - `hr-dashboard.ts`: Query agregat organisasi `all` scope dengan validasi `assertCan(ctx, "hris.employee.read:all")` dan `assertCan(ctx, "hris.attendance.read:all")`.
  - **Dashboard Staff (`staff-dashboard.tsx`)**:
    - Kartu presensi interaktif real-time dengan jam server dinamis dan tombol check-in/out.
    - Metrik sisa cuti tahunan, status cuti pending, dan status slip gaji terbaru.
    - Rincian kartu kuota per jenis cuti dengan progress bar.
    - Riwayat 5 pengajuan cuti terakhir dan panduan SOP kepegawaian.
  - **Dashboard Manajer (`manager-dashboard.tsx`)**:
    - 3 kartu metrik tim: Total Anggota Tim, Tim Hadir Hari Ini, Antrean Persetujuan Cuti.
    - **Widget Utama Actionable Approval List**: Daftar permohonan cuti tim dengan tombol cepat **Setujui** (konfirmasi cepat) dan tombol **Tolak** (membuka modal dialog dengan alasan penolakan wajib minimal 3 karakter).
    - Kalender tim mingguan (Senin-Jumat) visual ringkas.
    - Bagian bawah: Presensi dan saldo cuti pribadi milik manajer sendiri.
  - **Dashboard Admin HR & Super Admin (`hr-dashboard.tsx`)**:
    - 4 kartu metrik organisasi: Total Pegawai Aktif, Hadir Hari Ini (jumlah & %), Cuti Menunggu Seluruh Lembaga, Kontrak Berakhir ≤ 30 Hari.
    - **Grafik Batang Kehadiran 7 Hari Terakhir** (Hadir, Telat, Cuti) responsif dan visual komposisi ikatan kerja (Tetap vs PKWT vs Proyek).
    - Pusat Aksi "Perlu Tindakan" (cuti pending > 2 hari, kontrak segera habis) dan daftar pegawai cuti hari ini.
    - Banner kendali Super Admin dengan tautan pintas ke portal System Management.
  - **Dashboard IT Admin (`it-dashboard.tsx`)**:
    - Tampilan minimalis pencarian direktori karyawan tanpa metrik operasional HR.
  - **Penanganan Khusus Super Admin (`unlinked-employee-notice.tsx`)**:
    - Tampilan fallback informatif jika akun Super Admin belum ditautkan ke data pegawai saat beralih ke pratinjau Staff atau Manajer.
  - **Resolusi Role & Keamanan Server (`dashboard/page.tsx`)**:
    - Resolusi role di tingkat Server Component menggunakan `getAuthContext(session.user.id)`.
    - Cookie `pspk_role_view` hanya diakui jika role database pengguna terverifikasi memiliki `super_admin`.
- **Perbaikan Konfigurasi & Kualitas Monorepo**:
  - Eliminasi peringatan Turbopack Next.js CommonJS `@prisma/client` melalui explicit named & type-only exports.
  - Penambahan `tsconfig.json` root dan `@types/node` untuk resolusi modul dan skrip scratch di tingkat monorepo.
  - Hasil pengujian: `pnpm typecheck` (9/9 packages pass), `pnpm test` (29/29 unit tests pass), `pnpm --filter @pspk/hris build` (0 warning, 0 error).

---

## Modul HRIS: Pendaftaran Karyawan, Master Organisasi & Manajemen Mutasi Jabatan
- **Status:** Selesai (Completed)
- **Capaian:**
  - **Pendaftaran Karyawan Baru & Pembuatan Akun Otomatis (`/karyawan/baru`)**:
    - Validasi email kantor wajib berakhiran `@pspk.id` dan email pribadi karyawan non-`@pspk.id`.
    - Pembuatan akun login otomatis pada skema `core.User` dan `core.Account` (`providerId: "credential"`) dengan password acak aman (13 karakter: kombinasi huruf besar, kecil, angka, dan simbol).
    - Otomatisasi penetapan role akun (`staff`, `manager`, `admin_hr`, `admin_it`).
    - Modul pengiriman kredensial via `nodemailer` (SMTP) dengan template email resmi PSPK dan fallback simulasi di layar Admin HR saat SMTP belum disetel.
    - Tombol **"Buat NIP Otomatis"** berformat `PSPK-YYYYMM-XXX` dan pengecekan duplikasi NIP secara *real-time* (debounced 350ms) dengan indikator visual dan pencegahan *guard*.
    - Perbaikan isolasi submit multi-step form (mencegah skip/submit saat menekan Enter atau navigasi ke langkah 4).
  - **Master Struktur Organisasi (`/karyawan/organisasi`)**:
    - CRUD Divisi / Departemen (Tambah, Ubah Nama, Hapus aman dengan validasi integritas).
    - CRUD Formasi Jabatan / Posisi Riset (Tambah, Ubah, Hapus aman terikat ke divisi).
    - Tampilan interaktif 2 kolom dengan filter pencarian instan dan kartu metrik statistik organisasi.
    - **Proteksi Integritas Hapus**: Menolak penghapusan divisi atau jabatan yang masih memiliki pegawai aktif di dalamnya.
  - **Manajemen Mutasi & Promosi Pegawai (`/karyawan/[id]`)**:
    - Fitur **"Mutasi / Promosi Jabatan"** pada Tab 4 (*Jabatan & Tim*) di halaman detail pegawai.
    - Modal mutasi terpadu: Kategori (Promosi, Rotasi, Demosi, Penyesuaian), Divisi Baru, Jabatan Baru, Atasan Baru (dengan pencegahan relasi melingkar/circular reporting), Tanggal Efektif, Nomor SK, dan Catatan.
    - **Lampiran Berkas SK (PDF Opsional)**: Penyimpanan berkas PDF SK mutasi (maks. 10MB) via `StorageProvider` ke disk lokal.
    - Route handler streaming aman untuk mengunduh/melihat berkas SK (`/api/documents/[...path]`).
    - Timeline riwayat mutasi otomatis diperbarui dengan menutup periode posisi sebelumnya dan mencatat entri riwayat baru (`EmploymentHistory`).
    - Migrasi Prisma `20260923031351_add_employment_history_relations` menambahkan relasi `position`, `department`, dan kolom `documentKey` pada `EmploymentHistory`.
    - Penambahan permission `hris.org.manage:all` pada peran `admin_hr` dan `super_admin`.

---

## Modul Tata Kelola Akun & Hak Akses (RBAC Hibrida: HRIS & System Management)
- **Status:** Selesai (Completed)
- **Capaian:**
  - **Arsitektur Wewenang & Separation of Duties**:
    - **Super Admin**: Akses penuh ke seluruh peran (`staff`, `manager`, `admin_hr`, `admin_it`, `super_admin`).
    - **Admin IT**: Mengelola peran dan aktivasi operasional pengguna di System Management. Dilarang menugaskan atau mencabut peran Super Admin.
    - **Admin HR**: Saat mendaftarkan karyawan baru di `/karyawan/baru`, dibatasi hanya memilih peran `staff` atau `manager` (mencegah *privilege escalation*).
    - **Proteksi Anti-Lockout**: Sistem menolak pencabutan atau penonaktifan Super Admin terakhir, dan mencegah pengguna menonaktifkan akunnya sendiri.
  - **HRIS (`apps/hris`)**:
    - Tab baru **"Akun & Hak Akses"** pada detail pegawai (`/karyawan/[id]?tab=akun`).
    - **Kartu Identitas Akun Login**: Surel login kantor (`@pspk.id`), status aktif (dot hijau/merah), dan daftar badges peran.
    - **Modal "Kelola Peran (RBAC)"**: Multi-role assignment dengan audit log.
    - **Modal "Buatkan Akun Login"**: Pembuatan akun instan untuk pegawai lama yang belum memiliki akun, dilengkapi generate sandi sementara acak dan pengiriman kredensial ke email pribadi.
  - **System Management (`apps/sysmgmt`)**:
    - **Master Manajemen Pengguna (`/pengguna`)**:
      - 6 kartu statistik metrik pengguna (Total Akun, Aktif, Super Admin, Admin IT, Admin HR, Manajer, Staf).
      - Filter pencarian (nama, surel, NIP) dan dropdown filter peran serta status akun.
      - Aksi cepat: Toggle status aktif/nonaktif akun secara langsung.
      - Modal **"Kelola Peran (RBAC)"** multi-role terhubung ke `core.user_roles`.
      - Modal **"Reset Kata Sandi"** dengan hashing Better Auth dan tampilan kredensial sementara satu-klik salin.
      - Tautan pembuka profil pegawai terhubung di HRIS (`/karyawan/[id]?tab=akun`).
    - **Shell Navigasi Sysmgmt**: Topbar profesional dengan logo PSPK horizontal terbaru, AppSwitcher (beralih antara HRIS :3001 dan SysMgmt :3002), dan profil pengguna dengan fungsi keluar sistem (`signOut`).
  - **Audit Log Terpadu**:
    - Semua mutasi peran (`UserRole`), perubahan status aktivasi (`UserStatus`), dan reset kata sandi (`UserPasswordReset`) dicatat ke `core.audit_logs` dengan IP dan User-Agent. Sandi plaintext tidak pernah disimpan di audit log.
  - **Kualitas & Uji**:
    - `pnpm typecheck` (9/9 packages lolos).
    - `pnpm lint` (0 error).
    - `pnpm build` (Kompilasi standalone sukses untuk `@pspk/hris` dan `@pspk/sysmgmt`).

---

## Modul Payroll & Penggajian (Role Admin HR)
- **Status:** Selesai (Completed)
- **Capaian:**
  - **Siklus Status Periode Penggajian**:
    - Alur 5 tahap: `DRAFT` $\to$ `CALCULATED` $\to$ `APPROVED` $\to$ `PUBLISHED` $\to$ `LOCKED`.
    - Pilihan jenis siklus: Gaji Reguler Bulanan dan Tunjangan Hari Raya (THR).
    - Penetapan tanggal cut-off presensi/dokumen.
  - **Kalkulasi Payroll Massal Otomatis**:
    - Menghitung seluruh pegawai aktif secara paralel dalam Prisma Transaction.
    - Menghubungkan gaji pokok dari kontrak kerja aktif (`EmploymentContract.baseSalary`).
    - Mengintegrasikan tunjangan tetap & fungsional (Transportasi, Komunikasi, Jabatan Riset).
    - Menghitung potongan persentase BPJS Kesehatan (1%), BPJS Ketenagakerjaan JHT (2%), BPJS Ketenagakerjaan JP (1%), dan estimasi PPh 21.
    - Menyimpan snapshot rincian baris pendapatan dan potongan di `PayslipLine` agar kebal dari perubahan tarif di masa mendatang.
  - **Pemisahan Wewenang (Separation of Duties)**:
    - Akses `/payroll` dan `/payroll/[id]` hanya untuk **Admin HR** dan **Super Admin**.
    - Manajer dan staf umum dibatasi dan tidak dapat melihat nominal gaji rekan/tim.
  - **Ekspor Rekap Perbankan**:
    - Generator berkas CSV transfer perbankan siap upload (NIP, Nama, Bank, Nomor Rekening terdekripsi, Nominal Bersih).
  - **Master Komponen Gaji (`/payroll/komponen`)**:
    - Konfigurasi master tunjangan (*Earnings*) dan potongan (*Deductions*).
    - Pilihan metode kalkulasi: Nominal Tetap (*Fixed*), Persentase dari Gaji Pokok (*Percent of Base*), dan Input Manual.
  - **Kepatuhan Audit Log**:
    - Seluruh aksi kalkulasi massal, persetujuan, publikasi slip ke pegawai, penguncian permanen, dan ekspor data tercatat di `core.audit_logs`.
  - **Hasil Uji & Kualitas**:
    - `pnpm --filter @pspk/hris typecheck`: Lolos (0 error).
    - `pnpm lint`: Lolos (0 error).
    - `pnpm test`: Lolos (33 unit tests hijau).
    - `pnpm build`: Standalone build berhasil untuk kedua aplikasi.

### Fitur Khusus: Dukungan PKWT Per Jam (Timesheet) & "No Work, No Pay"
- **Status:** Selesai (Completed)
- **Implementasi**:
  - Model data `hris.contracts` mendukung `wageType: HOURLY` dan tarif per jam `hourlyRate`.
  - Model data `hris.payslips` menyimpan snapshot `wageType`, `totalHours`, `hourlyRate`, dan `timesheetKey`.
  - Logika kalkulasi: $\text{Upah Jam Kerja} = \text{Total Jam Kerja Valid} \times \text{Tarif per Jam}$. Jika jam kerja 0 (belum ada timesheet), upah Rp 0 (*No Work, No Pay*).
  - Modal `TimesheetInputModal`: Admin HR dapat menginput jam kerja dan melampirkan berkas bukti spreadsheet/PDF yang sudah ditandatangani dan di-acc Project Lead per tanggal 20.
  - Tautan berkas bukti timesheet dapat langsung diunduh dari tabel maupun modal slip gaji melalui rute streaming aman `/api/documents/[...path]`.
  - Audit log tercatat otomatis untuk setiap pembaruan timesheet (`UPDATE PayslipTimesheet`).
  - Arsitektur *future-proof*: saat modul pengisian timesheet mandiri staf dibangun di web HRIS, sistem payroll siap mengambil jam terverifikasi otomatis.

## Modul Kinerja & Riset (Role Admin HR — Layar P-H20)
- **Status:** Selesai (Completed)
- **Capaian:**
  - **Manajemen Siklus Periode Kinerja (`PerformancePeriod`)**:
    - Alur status: Buka Pengisian (`OPEN`) $\leftrightarrow$ Kunci/Selesai (`CLOSED`).
    - Modal pembuatan periode baru (`PerformancePeriodModal`) yang secara otomatis menginisialisasi draf penilaian untuk seluruh pegawai aktif di organisasi dan menetapkan atasan langsung sebagai penilai utama.
    - Periode awal terisi: *"Semester Ganjil 2026 — Riset & Advokasi Kebijakan"*.
  - **Dashboard Metrik & Ringkasan Lembaga (`PerformanceStatsCards`)**:
    - 4 kartu metrik utama: Total Pegawai Dievaluasi, Status Evaluasi Diri (Self-Review), Menunggu Penilaian Atasan (Manager-Review), serta Kinerja Selesai & Terkunci (Finalized).
    - Menghitung rata-rata skor lembaga secara agregat dan persentase kelengkapan target berbobot 100%.
  - **Direktori & Monitoring Penilaian Pegawai (`PerformanceTable`)**:
    - Pencarian instan (nama, NIP, email).
    - Filter berdasarkan Divisi Riset dan Status Alur (`DRAFT`, `SELF_REVIEW`, `MANAGER_REVIEW`, `FINALIZED`).
    - Indikator status kelengkapan target (bobot pas 100% vs peringatan belum lengkap).
    - Tampilan predikat nilai akhir (Sangat Baik $\ge 90$, Baik $\ge 80$, Cukup $\ge 70$, Perlu Perbaikan $< 70$).
  - **Modal Detail Review Komparatif & Penguncian Nilai (`PerformanceDetailModal`)**:
    - Menampilkan daftar sasaran kerja & riset (OKR): Judul target, deskripsi, bobot (%), target indikator, dan capaian riil.
    - Tampilan komparasi berdampingan (*Side-by-Side*): Evaluasi Diri Staf (skor + refleksi mandiri) vs Penilaian Atasan (skor + catatan rekomendasi manajer).
    - Fitur Finalisasi & Kunci Skor (*Locking*) resmi oleh Admin HR/Pimpinan (`finalizePerformanceReviewAction`).
  - **Fitur Ekspor Rekap Kinerja**:
    - Ekspor data evaluasi kinerja seluruh pegawai ke dalam format CSV untuk laporan berkala direksi.
  - **Kepatuhan RBAC & Audit Log**:
    - Akses `/kinerja` terproteksi di tingkat server untuk Admin HR dan Super Admin.
    - Setiap mutasi periode (`CREATE PerformancePeriod`, `UPDATE PerformancePeriodStatus`), finalisasi nilai (`FINALIZE PerformanceReview`), dan ekspor data (`EXPORT PerformanceReport`) dicatat ke `core.audit_logs`.
  - **Hasil Uji & Kualitas (Quality Gate)**:
    - `pnpm typecheck`: 9/9 packages lolos (0 error).
    - `pnpm lint`: Lolos (0 error).
    - `pnpm test`: Lolos (33 unit tests hijau).
    - `pnpm build`: Standalone build Next.js sukses untuk `@pspk/hris` dan `@pspk/sysmgmt`.
- **Catatan Penting untuk Pengembangan Tahap Berikutnya**:
  - *Portal Karyawan (Staff View)*: Mengembangkan antarmuka penyusunan target OKR mandiri dan pengisian form refleksi diri (*Self-Review*).
  - *Portal Manajer (Manager View)*: Mengembangkan antarmuka penilaian bawahan langsung bagi kepala divisi riset (*Manager-Review*).
  - *Integrasi Payroll*: Menghubungkan skor kinerja final semesteran sebagai variabel pengali bonus tahunan atau penyesuaian gaji berkala bila disepakati HR.

---

## Modul Notifikasi Terpadu (Semua Role — Layar P-C3)
- **Status:** Selesai (Completed)
- **Sumber Desain:** Stitch AI Screen P-C3 (`md/design_stitch.md`)
- **Capaian:**
  - **Prisma Model & Migrasi Skema Core (`core.notifications`)**:
    - Ditempatkan di skema `core` agar universal dapat diakses oleh Portal HRIS (`apps/hris`) maupun System Management (`apps/sysmgmt`).
    - Atribut lengkap: `id`, `userId`, `title`, `message`, `type` (`INFO`, `SUCCESS`, `WARNING`, `ACTION_REQUIRED`), `category` (`LEAVE`, `ATTENDANCE`, `PAYROLL`, `CONTRACT`, `PERFORMANCE`, `SYSTEM`), `link`, `isRead`, `createdAt`.
    - Migrasi `20260924055341_add_notifications` diaplikasikan ke database.
  - **Dropdown Live Topbar (`NotificationBell`)**:
    - Terintegrasi di navbar `app-topbar.tsx`.
    - Badge hitungan notifikasi belum dibaca (*Unread Count Badge*) dengan animasi berdenyut dinamis.
    - Panel popover memuat 5 notifikasi terbaru, ikon kategori, badge tipe, waktu relatif format Bahasa Indonesia (`formatRelativeTime`), dan tombol "Tandai Semua Dibaca".
    - Navigasi instan ke halaman penuh via tautan *"Lihat Semua Notifikasi"*.
  - **Halaman Pusat Notifikasi Mandiri (`/notifikasi` — Layar P-C3)**:
    - Desain premium mengikuti PSPK Design System (Navy `#102E50`, Gold `#F2AF3E`, Maroon `#A8281C`, font Lora & Rubik).
    - **Pengelompokan Kronologis**: "Hari Ini", "Kemarin", dan "Sebelumnya" dengan pemisah seksi yang rapi.
    - **Filter Multi-dimensi**:
      - Tab status: "Semua" vs "Belum Dibaca".
      - Filter kategori (pills): Cuti, Presensi, Penggajian, Kinerja, Kontrak, Sistem beserta penghitung dinamis.
      - Bilah pencarian instan: Filter real-time judul atau isi pesan notifikasi.
    - **Kartu Metrik Ringkasan**: Total Notifikasi, Belum Dibaca, Cuti/Presensi, dan Payroll/Kinerja.
    - **Aksi Cepat & Optimistic UI**: Tombol "Tandai Semua Dibaca" dan per-item "Tandai Dibaca" yang memperbarui antarmuka secara instan.
    - **Deep Linking**: Tautan langsung *"Lihat Dokumen Terkait"* yang mengarahkan pengguna ke modul target (mis. `/cuti`, `/kinerja`, `/slip-gaji`).
    - **Empty State Elegan**: Tampilan ramah ketika tidak ada notifikasi yang cocok dengan kriteria pencarian/filter.
  - **Integrasi Pemicu (*Event Triggers*) Lintas Modul**:
    - *Modul Cuti*: Pengajuan cuti baru mengirim notifikasi `ACTION_REQUIRED` ke Manajer atasan dan Admin HR; Persetujuan/penolakan cuti mengirim notifikasi ke pegawai pemohon.
    - *Modul Payroll*: Publikasi siklus gaji (`publishPayrollAction`) mengirim notifikasi `SUCCESS` ke seluruh karyawan penerima slip gaji dengan tautan ke `/slip-gaji`.
    - *Modul Kinerja*: Pembukaan periode review baru mengirim notifikasi ke seluruh staf aktif; Finalisasi evaluasi kinerja mengirim notifikasi ke pegawai terkait.
  - **Hasil Uji & Kualitas (Quality Gate)**:
    - `pnpm typecheck`: 9/9 packages lolos (0 error).
    - `pnpm lint`: Lolos (0 error).
    - `pnpm test`: Lolos (37 unit tests hijau termasuk 4 tes baru untuk `formatRelativeTime`).
    - `pnpm build`: Standalone build Next.js sukses untuk `@pspk/hris` dan `@pspk/sysmgmt`.

---

## Fitur Umum: Navigasi & Error (Semua Role — Layar P-C4 & App Switcher)
- **Status:** Selesai (Completed)
- **Sumber Desain:** Stitch AI Screen P-C4 (`md/design_stitch.md`)
- **Capaian:**
  - **Komponen Bersama di `@pspk/ui`**:
    - **`AppSwitcher`**: Pemindah portal ekosistem PSPK dengan kontrol hak akses cerdas.
      - Menampilkan status portal aktif (*Sedang Aktif*).
      - Menampilkan peran akun saat ini.
      - Deteksi hak akses: Jika akun adalah `super_admin` atau `admin_it`, portal *System Management* dapat diklik untuk beralih. Jika akun adalah staf/manajer biasa tanpa wewenang TI, opsi *System Management* ditampilkan dalam keadaan nonaktif dengan badge gembok dan keterangan *"Khusus Admin TI"*.
    - **`NotFoundView` (404)**: Tampilan halaman tidak ditemukan dengan ikon garis `Compass`, badge status `404`, headline Lora, pesan ramah, tombol *"Kembali ke Beranda"*, dan tombol *"Halaman Sebelumnya"*.
    - **`ForbiddenView` (403)**: Tampilan akses ditolak dengan ikon garis `ShieldAlert`, badge status `403` marun (`#A8281C`), rincian peran akun saat ini vs wewenang yang dibutuhkan, tombol *"Kembali ke Beranda"*, dan petunjuk eskalasi ke administrator.
    - **`ServerErrorView` (500)**: Tampilan error boundary dengan ikon `AlertTriangle`, tombol *"Coba Muat Ulang"* (`reset()`), dan kode referensi digest.
    - **`EmptyStateView`**: Tampilan standar untuk daftar/tabel data yang masih kosong.
  - **Integrasi pada Portal HRIS (`apps/hris`)**:
    - `AppSwitcher` terpasang rapi di topbar navigasi [`app-topbar.tsx`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/components/shell/app-topbar.tsx) berdampingan dengan notification bell dan profil pengguna.
    - Halaman 404 in-shell: [`apps/hris/src/app/(app)/not-found.tsx`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/app/%28app%29/not-found.tsx) (mempertahankan sidebar dan topbar agar pengguna tidak kehilangan konteks navigasi).
    - Halaman 404 global: [`apps/hris/src/app/not-found.tsx`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/app/not-found.tsx).
    - Halaman 403 resmi: [`apps/hris/src/app/(app)/forbidden/page.tsx`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/app/%28app%29/forbidden/page.tsx) dan [`apps/hris/src/app/forbidden.tsx`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/app/forbidden.tsx).
    - In-shell Error Boundary: [`apps/hris/src/app/(app)/error.tsx`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/app/%28app%29/error.tsx).
  - **Integrasi pada System Management (`apps/sysmgmt`)**:
    - `AppSwitcher` diperbarui di [`sysmgmt-navbar.tsx`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/sysmgmt/src/components/shell/sysmgmt-navbar.tsx).
    - Halaman 404 in-shell: [`apps/sysmgmt/src/app/(app)/not-found.tsx`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/sysmgmt/src/app/%28app%29/not-found.tsx) dan 404 global [`apps/sysmgmt/src/app/not-found.tsx`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/sysmgmt/src/app/not-found.tsx).
    - Halaman 403: [`apps/sysmgmt/src/app/(app)/forbidden/page.tsx`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/sysmgmt/src/app/%28app%29/forbidden/page.tsx) dan [`apps/sysmgmt/src/app/forbidden.tsx`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/sysmgmt/src/app/forbidden.tsx).
    - In-shell Error Boundary: [`apps/sysmgmt/src/app/(app)/error.tsx`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/sysmgmt/src/app/%28app%29/error.tsx).
  - **Hasil Uji & Kualitas (Quality Gate)**:
    - `pnpm typecheck`: 9/9 packages lolos (0 error).
    - `pnpm lint`: Lolos (0 error).
    - `pnpm test`: Lolos (37 unit tests hijau).
    - `pnpm build`: Standalone build Next.js sukses 100% untuk `@pspk/hris` dan `@pspk/sysmgmt`.

---

## Layar P-C2 — Profil Saya & Keamanan Akun (`/profil` — Semua Role)
- **Status:** Selesai (Completed)
- **Sumber Desain:** Blueprint & Panduan Desain PSPK (Layar P-C2 — Profil Pengguna, Ganti Kata Sandi, & Keamanan Sesi)
- **Deskripsi:** Halaman profil terpadu untuk semua peran (Staf Karyawan, Manajer, Admin HR, Super Admin) yang dapat diakses langsung dari menu navigasi profil pengguna (`UserNav`).
- **Implementasi:**
  - **Endpoint & Routing**:
    - URL: `http://localhost:3001/profil` (in-shell protected route di `apps/hris/src/app/(app)/profil/page.tsx` & `loading.tsx`).
    - Sinkronisasi URL Hash: navigasi tab otomatis membaca dan memperbarui hash (`#identitas`, `#keamanan`, `#sesi`). Tautan cepat dropdown *"Ganti Kata Sandi"* (`/profil#keamanan`) langsung membuka formulir keamanan.
  - **Komponen & Desain**:
    - **Header Profil**: Banner gradient PSPK Navy (`#102E50`), container avatar dengan tombol unggah foto kamera interaktif, nama lengkap Lora, email resmi, jabatan, departemen, serta deretan lencana peran sistem RBAC.
    - **Tab 1: Identitas & Kepegawaian** (`ProfileInfoTab`):
      - Kartu resmi kepegawaian PSPK: NIP, nama lengkap KTP/SK, nama panggilan, email kerja, nomor kontak WhatsApp, departemen/divisi riset, jabatan/posisi, jenis hubungan kerja (PKWTT/PKWT/Magang), status kepegawaian, tanggal bergabung (*join date*), dan penghitungan otomatis masa kerja (tenure).
      - Kartu akun sistem & RBAC: email login, status akun, tanggal pendaftaran, dan daftar wewenang/peran.
      - Penanganan khusus untuk akun pengelola murni tanpa data kepegawaian internal HRIS dengan kartu penjelasan yang informatif.
    - **Tab 2: Keamanan & Kata Sandi** (`ChangePasswordTab`):
      - Formulir ganti kata sandi dengan input sandi saat ini, sandi baru, dan konfirmasi sandi dengan tombol tampilkan/sembunyikan (*toggle visibility*).
      - *Password Strength Meter*: Visualisasi kekuatan kata sandi 4 tingkat (*Lemah*, *Cukup*, *Kuat*, *Sangat Kuat*) dengan indikator warna dinamis.
      - *Security Criteria Checklist* Real-time: Minimal 12 karakter, huruf besar & kecil, angka, karakter simbol khusus, dan kecocokan konfirmasi sandi.
      - Fitur Pemutusan Sesi Otomatis: Mengubah kata sandi secara otomatis memutuskan seluruh sesi aktif di perangkat lain (*revoke other sessions*) demi keamanan akun.
    - **Tab 3: Riwayat Sesi Aktif** (`SessionHistoryTab`):
      - Menampilkan seluruh sesi aktif dari tabel `core.sessions`.
      - Pengurai User-Agent cerdas: Mendeteksi jenis perangkat (Laptop/Desktop vs Ponsel Pintar), sistem operasi (macOS, Windows, Linux, Android, iOS), dan peramban web (Chrome, Safari, Firefox, Edge, Opera).
      - Menampilkan alamat IP klien, waktu login awal (*relative & exact*), masa berlaku sesi, dan badge pembeda hijau *"Sesi Perangkat Ini"* vs *"Perangkat Terhubung"*.
    - **Unggah & Ganti Foto Profil Langsung**:
      - Server Action `uploadAvatarAction` menerima berkas gambar (JPG, PNG, WEBP hingga 2MB), menyimpannya via `StorageProvider` (`avatars/...`), memperbarui `user.image` serta `employee.photoKey`, dan mencatat audit trail `UPDATE UserAvatar`.
      - Endpoint dokumen `apps/hris/src/app/api/documents/[...path]/route.ts` dikonfigurasi melayani berkas gambar dengan Content-Type yang tepat.
  - **Audit Log Terpusat**:
    - Setiap pergantian kata sandi dicatat ke `core.audit_logs` dengan aksi `UPDATE` pada entitas `UserPassword` (`event: USER_CHANGE_PASSWORD`).
    - Setiap penggantian foto avatar dicatat ke `core.audit_logs` dengan aksi `UPDATE` pada entitas `UserAvatar`.
  - **Hasil Uji & Kualitas (Quality Gate)**:
    - `pnpm typecheck`: 9/9 packages lolos (0 error).
    - `pnpm lint`: Lolos (0 error).
    - `pnpm test`: Lolos (37 unit tests hijau).
    - `pnpm build`: Standalone build Next.js sukses 100% untuk `@pspk/hris` (termasuk rute dinamis `/profil`).

---

## Penyelarasan & Integrasi Terpadu Modul Kehadiran & Cuti (Admin HR & Super Admin)
- **Status:** Selesai (Completed)
- **Deskripsi:** Mengatasi pemisahan rute kehadiran dan cuti pada role Admin HR dan Super Admin. Seluruh fitur kehadiran (rekap presensi lembaga, koreksi HR, absensi mandiri) dan fitur cuti (saldo pribadi, pengajuan, persetujuan, kalender bersama, pengaturan kuota & libur) kini disatukan ke dalam satu ekosistem navigasi terpadu.
- **Implementasi:**
  - **Komponen Subnavigasi Terpadu (`AttendanceLeaveSubnav`)**:
    - Dibuat di `apps/hris/src/components/shell/attendance-leave-subnav.tsx`.
    - Menampilkan tab interaktif berbasis role & hak akses pengguna:
      1. 📋 *Rekap Kehadiran* (`/absensi/rekap`) — Akses Admin HR, Super Admin, dan Manajer (monitoring presensi seluruh staf lembaga, filter divisi/periode, dan modal koreksi absensi manual HR).
      2. ⏱️ *Presensi Saya* (`/absensi`) — Jam server real-time WIB, kartu check-in/out hari ini, dan riwayat presensi harian.
      3. 🏖️ *Cuti Saya* (`/cuti`) — Saldo kuota cuti tahunan 2026 dan riwayat permohonan izin kerja.
      4. ✅ *Persetujuan Cuti* (`/cuti/persetujuan`) — Verifikasi permohonan cuti tim/organisasi dengan badge dinamis jumlah pengajuan pending.
      5. 📅 *Kalender Cuti* (`/cuti/kalender`) — Kalender bulanan jadwal cuti bersama dan hari libur nasional resmi.
      6. ⚙️ *Pengaturan Kuota & Libur* (`/cuti/pengaturan`) — Pengelolaan master tipe cuti dan hari libur lembaga khusus Admin HR & Super Admin.
  - **Penyelarasan Sidebar (`app-sidebar.tsx`)**:
    - Menu *"Kehadiran & Cuti"* untuk Admin HR kini langsung mengarahkan ke `/absensi/rekap` sebagai halaman kerja operasional utama HR.
    - Status aktif (`isActive`) menyala ketika pengguna berada di seluruh sub-rute `/absensi*` maupun `/cuti*`.
  - **Penyelarasan Breadcrumbs (`app-topbar.tsx`)**:
    - Breadcrumb pada header secara konsisten menampilkan kategori *"Kehadiran & Cuti"* untuk semua sub-halaman di bawah `/absensi` dan `/cuti`.
  - **Pemasangan di Seluruh Halaman Terkait**:
    - Terpasang rapi dan menggantikan sub-tab hardcoded pada `/absensi/rekap`, `/absensi`, `/cuti`, `/cuti/persetujuan`, `/cuti/kalender`, dan `/cuti/pengaturan`.
  - **Hasil Uji & Kualitas (Quality Gate)**:
    - `pnpm typecheck`: 9/9 packages lolos (0 error).
    - `pnpm --filter @pspk/hris lint`: Lolos (0 error, 0 unused imports pada file terkait).
    - `pnpm test`: Lolos (37 unit tests passing).
    - `pnpm --filter @pspk/hris build`: Standalone Next.js build sukses 100% (semua 18 rute terkompilasi).
    - Health check `/api/health`: HTTP 200 `{"status":"ok"}`.

---

## Modul Pengaturan Jam Kerja & Toleransi Keterlambatan (Work Schedule & Grace Period)
- **Status:** Selesai (Completed)
- **Deskripsi:** Menghilangkan seluruh nilai jam kerja dan toleransi yang sebelumnya di-hardcode. Kini Admin HR dan Super Admin dapat mengonfigurasi jam masuk kerja resmi, jam pulang, toleransi keterlambatan (*grace period*), hari kerja aktif, dan jam fleksibel secara dinamis dengan audit log lengkap.
- **Implementasi:**
  - **Skema & Migrasi Database (`@pspk/db`)**:
    - Model `WorkScheduleSetting` pada skema `hris` (`packages/db/prisma/schema/hris.prisma`).
    - Field: `id`, `name`, `workStartTime` ("09:00"), `workEndTime` ("17:00"), `gracePeriodMins` (15), `workingDays` ([1, 2, 3, 4, 5]), `isFlexible` (false), `isDefault` (true), `departmentId` (relasi opsional).
    - Migrasi Prisma: `20260925065131_add_work_schedule_settings` diaplikasikan ke database PostgreSQL lokal.
    - Seeding default jadwal kantor resmi PSPK: "Jadwal Kerja Reguler PSPK" (09:00 - 17:00 WIB, toleransi 15 menit, Senin-Jumat).
  - **Backend Service & Validasi**:
    - Skema Zod `workScheduleSchema` (`apps/hris/src/server/schemas/work-schedule.schema.ts`).
    - Service `getActiveWorkSchedule()` dan `updateWorkSchedule()` (`apps/hris/src/server/services/work-schedule.service.ts`).
    - Integrasi Audit Log: Perubahan jadwal kerja mencatat audit trail di tabel `core.audit_logs` dengan `entityType: "WorkScheduleSetting"`, `action: "UPDATE"`, serta state `before` dan `after`.
    - Server Action `updateWorkScheduleAction` (`apps/hris/src/server/actions/work-schedule.actions.ts`) terproteksi ketat server-side hanya untuk role `admin_hr` dan `super_admin`.
  - **Kalkulasi Presensi Dinamis**:
    - Fungsi `checkIn` pada `apps/hris/src/server/services/attendance.service.ts` kini memanggil `getActiveWorkSchedule()` secara dinamis.
    - Karyawan check-in sebelum batas `workStartTime + gracePeriodMins` (mis. 09:15 WIB) berstatus `PRESENT` (Tepat Waktu).
    - Karyawan check-in setelah batas tersebut otomatis berstatus `LATE` (Terlambat).
  - **Antarmuka Pengaturan HR (`/cuti/pengaturan`)**:
    - Tab baru terdepan: `⏰ Jadwal Kerja & Jam Masuk` di dalam `apps/hris/src/components/cuti/leave-settings-view.tsx`.
    - Komponen interaktif `WorkScheduleSettingsView`:
      - Input nama kebijakan, jam masuk & pulang format `HH:mm` WIB.
      - Quick preset buttons untuk toleransi: *0 Menit (Ketat)*, *5 Menit*, *10 Menit*, *15 Menit (Standar PSPK)*, *30 Menit*.
      - Pilihan interaktif hari kerja aktif organisasi (Senin - Minggu) beserta tombol cepat 5 hari & 6 hari kerja.
      - *Live Simulator & Timeline*: Menghitung otomatis batas tepat waktu, total durasi kerja harian, dan simulator uji coba jam check-in interaktif.
  - **Sinkronisasi Antarmuka Karyawan (`/absensi`)**:
    - Kartu `TodayAttendanceCard` dan ringkasan bulanan di `apps/hris/src/app/(app)/absensi/page.tsx` menampilkan jadwal kerja kantor dan batas toleransi tepat waktu secara dinamis dari database.

---

## Peningkatan Multi-Zona Waktu (WIB, WITA, WIT) & Presensi Terdistribusi
- **Status:** Selesai (Completed)
- **Implementasi:**
  - **Perbaikan Format Jam Dinamis (`@pspk/shared/formatters.ts`)**:
    - Memperbaiki bug pada `formatTimeInZone` dan `formatDateInZone` di mana `timeZone` tertimpa jika `options` dikirim, menyebabkan jam digital tetap membaca waktu lokal browser alih-alih zona yang dipilih pada *dropdown*.
    - Menambahkan unit test di `formatters.test.ts` memverifikasi ketepatan perbedaan jam WIB, WITA, dan WIT. Total 41 unit tests lulus 100%.
  - **Tagging Metadata Zona Presensi (`TodayAttendanceCard`)**:
    - Tombol *Masuk Kerja (Check-In)* dan *Pulang Kerja (Check-Out)* otomatis menyematkan metadata zona waktu asal (mis. `[WITA]`) ke dalam `Attendance.notes` dan `core.audit_logs`.
  - **Tampilan Waktu Ganda (*Dual-Time Display*) (`AttendanceTable`)**:
    - Kolom Jam Masuk dan Jam Pulang pada tabel riwayat absensi kini menampilkan waktu dalam zona lokal karyawan (`13:20 WITA`) dan di bawahnya menyertakan konversi waktu kantor pusat (`12:20 WIB`) jika staf berada di luar zona WIB.
    - Menghilangkan potensi salah paham (*dispute*) antara staf remote dan admin HR di kantor pusat Jakarta.
  - **Refactoring Layout Kartu Presensi & Tombol (`TodayAttendanceCard` & `/absensi`)**:
    - **Penyebab masalah sebelumnya**: Pada halaman `/absensi`, komponen `TodayAttendanceCard` ditempatkan dalam kolom sempit 5-span (`lg:col-span-5` ~400px), sehingga flex horizontal menyebabkan teks tombol `"Masuk Kerja (Check-In)"` patah menjadi 4 baris sempit dan tombol catatan tertekan.
    - **Perubahan Arsitektur Tampilan (Sesuai Blueprint P-H9)**:
      - Menjadikan `TodayAttendanceCard` sebagai kartu *Hero* mandiri satu layar penuh (`col-span-12`) di bagian paling atas.
      - Bagian atas kartu memuat *Meta Bar* elegan: tanggal, pemilih zona waktu (*timezone dropdown*), serta lencana status kehadiran (*Status Pill*) di pojok kanan.
      - Bagian tengah memisahkan secara proporsional antara panel jam digital tabular besar + konteks jadwal kantor di sebelah kiri, dan panel aksi presensi di sebelah kanan.
      - Tombol aksi utama (*Check-In* / *Check-Out*) diberi aturan `whitespace-nowrap` dan `min-w-[210px]`, sehingga teks tidak akan pernah terpotong atau terlipat di layar mana pun.
      - Tombol catatan (*+ Catatan*) ditingkatkan dari sekadar tautan teks tipis menjadi tombol sekunder berbentuk *pill* yang rapi dengan ikon `FileText` dan input terintegrasi yang bersih.
      - Di bawah kartu utama, ringkasan statistik bulanan (4 kartu metrik) dan kartu ketentuan jam kerja disandingkan secara seimbang dalam grid 8-4.
    - **Berlaku di Semua Peran**: Perbaikan ini otomatis mempercantik tampilan presensi untuk seluruh peran (Staff, Manajer pada *dashboard* mereka, HR Admin, dan Super Admin).
  - **Hasil Uji & Kualitas**:
    - `pnpm typecheck`: 9/9 packages lolos (0 error).
    - `pnpm test`: 41 unit tests lolos (100%).
    - `pnpm lint`: Lolos (0 error).
    - `pnpm build`: Standalone build berhasil.

---

## Audit Menyeluruh & Standardisasi Penanganan Zona Waktu Lintas Modul
- **Status:** Selesai (Completed)
- **Tujuan:** Memastikan seluruh modul penting (Presensi, Cuti, Kalender, Jadwal Kerja, Dasbor Multiperan, Log Audit, Koreksi HR, dan Karyawan) bebas dari masalah pergeseran tanggal/waktu (*timezone shift* / *offset bug*).
- **Temuan & Perbaikan yang Diterapkan:**
  1. **Dasbor Eksekutif HR (`apps/hris/src/server/queries/dashboard/hr-dashboard.ts`)**:
     - *Masalah*: Angka "Hadir Hari Ini" bernilai 0 dan grafik 7 hari kosong untuk hari aktif meskipun staf dan HR telah presensi.
     - *Penyebab*: `today.setHours(0, 0, 0, 0)` menghasilkan tengah malam lokal (WITA = `16:00:00.000Z` kemarin), sedangkan baris presensi tersimpan dengan tanggal UTC (`00:00:00.000Z`).
     - *Solusi*: Menggunakan `toDateString(new Date())` dan `new Date(todayStr)` untuk mencocokkan tanggal UTC secara presisi, serta menyelaraskan perhitungan grafik 7 hari dan filter status kehadiran (`PRESENT`, `LATE`, `WFH`).
  2. **Dasbor Manajer (`apps/hris/src/server/queries/dashboard/manager-dashboard.ts` & `components/dashboard/manager-dashboard.tsx`)**:
     - Memperbaiki perhitungan kalender mingguan (Senin–Jumat) menggunakan `getUTCDay()`, `setUTCDate()`, dan `timeZone: "UTC"`.
     - Menggantikan komparasi `toISOString().split("T")[0]` dengan `toDateString(d)` untuk memastikan highlight hari aktif (*isToday*) tidak melompat sebelum jam 07:00 pagi.
  3. **Kueri Presensi & Rekap Bulanan (`apps/hris/src/server/queries/attendance.queries.ts`)**:
     - Menstandarkan batas awal dan akhir bulan menggunakan `Date.UTC(year, month - 1, 1, 0, 0, 0, 0)` dan `Date.UTC(year, month, 0, 23, 59, 59, 999)`.
  4. **Modul Cuti & Kalender Libur (`apps/hris/src/server/queries/leave.queries.ts`, `leave.service.ts`, `packages/shared/src/leave.ts`)**:
     - Memastikan kalkulasi hari kerja aktif (`calculateWorkingDays`) dan loop pembuatan catatan presensi cuti disetujui (`leave.service.ts`) menggunakan iterasi UTC (`getUTCDay()`, `setUTCDate()`), sehingga cuti yang diajukan di WITA/WIT tidak terpotong atau bergeser 1 hari.
     - Mengharmonisasi `apps/hris/src/server/services/leave-calculator.ts` agar mere-ekspor murni dari `@pspk/shared` (mencegah duplikasi implementasi).
  5. **Modal Koreksi Presensi HR (`attendance-correction-modal.tsx`)**:
     - Menghilangkan offset hardcoded `+07:00`.
     - Menambahkan fungsi `getTimezoneOffsetString()` di `@pspk/shared` untuk menghitung offset ISO (`+07:00`, `+08:00`, `+09:00`) secara dinamis.
     - Menyediakan pemilih zona waktu pada formulir koreksi agar HR admin dapat menentukan dengan jelas apakah jam yang diinput adalah WIB, WITA, atau WIT, serta mencatat tag zona ke audit log.
  6. **Pencatatan Presensi Server (`attendance.service.ts`)**:
     - Mengganti parsing string lokal dengan `Intl.DateTimeFormat formatToParts` dengan `hourCycle: "h23"` untuk penentuan keterlambatan yang 100% konsisten lintas OS.
  7. **Komponen Form & Wizard (`wizard-employee-form.tsx`, `transfer-position-modal.tsx`, `excel-importer.tsx`, `performance-period-modal.tsx`)**:
     - Menstandarkan inisialisasi tanggal form dengan `toDateString()` agar konsisten di zona waktu manapun browser berjalan.
- **Hasil Uji & Kualitas**:
  - `pnpm test`: 42/42 unit test lulus (100%).
  - `pnpm typecheck`: 9/9 package lolos tanpa error.
  - `pnpm lint`: Lolos (0 error).

---

## Penyesuaian Hak Akses Tombol Pengalih Portal (*App Switcher & User Nav*)
- **Status:** Selesai (Completed)
- **Implementasi:**
  - **Prinsip RBAC**: Tombol *AppSwitcher* (`Portal HRIS AKTIF ^`) dan tautan `System Management` di dropdown profil (`UserNav`) kini **hanya muncul bagi akun yang memang memiliki hak akses** (`super_admin` atau `admin_it`).
  - **Penyembunyian Bersih untuk Peran Non-IT**:
    - Akun dengan peran `admin_hr` (seperti Dewi Permata), `manager`, dan `staff` tidak lagi melihat tombol pengalih portal maupun item menu `System Management`.
    - Menghilangkan dropdown tidak perlu yang sebelumnya menampilkan item terkunci (*lock* "Khusus Admin TI").
    - Mengintegrasikan pemeriksaan hak akses `canAccessSysmgmt` dari layout HRIS ke `AppTopbar` dan `UserNav`, serta `canAccessHris` di `SysmgmtNavbar`.
- **Hasil Uji & Kualitas**:
  - `pnpm test`: 42/42 unit test lulus (100%).
  - `pnpm typecheck`: 9/9 package lolos tanpa error.
## Modul Kinerja & Riset — Implementasi Role Staf (Self-Review & Scorecard)
- **Status:** Selesai (Completed)
- **Tujuan:** Membuka akses evaluasi kinerja untuk peran Staf (Karyawan & Peneliti) dengan alur pengisian mandiri (*self-review*), peninjauan realisasi sasaran riset (OKR), visual stepper status, dan lembar rapor resmi (*scorecard*).
- **Rincian Implementasi:**
  1. **Validasi Skema Zod (`performance.schema.ts`)**:
     - `submitStaffSelfReviewSchema`: Validasi ID review, skor mandiri (0–100), teks refleksi minimal 10 karakter, dan array capaian aktual target kerja (`goalActuals`).
  2. **Kueri Data Staf (`performance.queries.ts`)**:
     - `getStaffPerformanceReview`: Mengambil review aktif, data atasan penilai, daftar sasaran riset (`PerformanceGoal`) beserta bobot %, kalkulasi kelengkapan bobot, dan predikat dinamis. Otomatis membuat draf review jika belum ada saat periode `OPEN`.
     - `getStaffPerformancePeriods`: Mengambil riwayat periode evaluasi lampau yang diikuti oleh pegawai untuk arsip dan dropdown periode.
  3. **Server Action Terproteksi (`performance.actions.ts`)**:
     - `submitStaffSelfReviewAction`:
       - *Server-Side Authorization & Ownership Check*: Memvalidasi sesi, permission `hris.performance.review:own`, dan memastikan review milik pegawai bersangkutan (`review.employeeId === session.employeeId`).
       - Validasi status transaksi: status review harus `DRAFT` dan periode harus `OPEN`.
       - Database transaction: memperbarui `actual` pada `PerformanceGoal`, menyimpan `selfScore` & `selfComment`, dan mengubah status ke `SELF_REVIEW`.
       - *Audit Log*: Mencatat `writeAudit` dengan aksi `SUBMIT_SELF_REVIEW`.
       - *Notifikasi In-App*: Mengirimkan notifikasi ke atasan penilai (`reviewerId`) bahwa staf telah menyelesaikan evaluasi mandiri.
  4. **Antarmuka Pengguna Interaktif (UI)**:
     - `StaffSelfReviewForm`: Formulir interaktif pengisian capaian per sasaran riset, slider & input numerik skor mandiri 0–100 dengan badge predikat dinamis (*Sangat Baik*, *Baik*, *Cukup*, *Perlu Peningkatan*), textarea refleksi diri, dan dialog konfirmasi sebelum submit.
     - **Manajemen Sasaran Mandiri (`AddGoalModal`)**: Dilengkapi tombol `+ Tambah Sasaran Riset` untuk memungkinkan staf mendaftarkan target riset mereka secara mandiri pada periode aktif, mengatur bobot %, target, dan satuan, lengkap dengan penghitung alokasi bobot total real-time (`Bobot: X% / 100%`) serta tombol hapus sasaran.
     - `PerformanceScorecard`: Tampilan rapor kinerja resmi khas brand PSPK (Navy & Gold) saat status `FINALIZED`, mencakup perbandingan 3 skor (Mandiri, Atasan, Resmi), rincian pencapaian target, dan catatan evaluasi kualitatif.
     - `StaffPerformanceView`: Visual stepper 4 tahap (`DRAFT` → `SELF_REVIEW` → `MANAGER_REVIEW` → `FINALIZED`), pemilih periode aktif/lampau, dan kontainer adaptif sesuai status review.
  5. **Routing Multi-Peran (`apps/hris/src/app/(app)/kinerja/page.tsx`)**:
     - Menghapus pesan hard-block `HakAksesTerbatas`.
     - Mendeteksi role aktif dan cookie role preview (`pspk_role_view`). Jika peran adalah `staff` (atau manajer mengisi evaluasi mandiri), merender `StaffPerformanceView`. Jika Admin HR / Super Admin, tetap menyajikan dashboard organisasi `PerformanceClientWrapper`.
     - Proteksi akun tanpa relasi pegawai via `UnlinkedEmployeeNotice`.
  6. **Server Action Manajemen Sasaran (`performance.actions.ts`)**:
     - `createGoalAction`: Menambahkan sasaran riset baru dengan validasi total bobot maksimal 100% dan pencatatan audit log `CREATE`.
     - `deleteGoalAction`: Menghapus sasaran riset selama periode masih `OPEN` dan status belum `FINALIZED` dengan pencatatan audit log `DELETE`.
- **Hasil Uji & Kualitas**:
  - `pnpm typecheck`: 9/9 packages lolos tanpa error.
  - `pnpm test`: 42/42 unit test lulus (100%).
  - `pnpm --filter @pspk/hris build`: Berhasil mengompilasi halaman `/kinerja` sebagai dynamic route teroptimasi.

---

## Penyesuaian Dinamis Atasan Langsung & Notifikasi Staf
- **Status:** Selesai (Completed)
- **Konteks:** Perubahan atasan langsung (*manager*) di tengah kontrak kerja yang sedang berjalan oleh Admin HR melalui form ubah pegawai (`/karyawan/[id]/ubah`).
- **Rincian Implementasi:**
  1. **Sinkronisasi Dinamis & Notifikasi Otomatis (`employee.service.ts`)**:
     - Deteksi otomatis perubahan atasan (`isManagerChanged` antara `data.managerId` dan `current.managerId`).
     - Notifikasi in-app otomatis dikirim ke akun staf bersangkutan (`core.Notification`):
       *"Pembaruan Atasan Langsung: Atasan langsung Anda telah diperbarui menjadi [Nama Atasan] ([Jabatan]). Seluruh koordinasi dan proses evaluasi kinerja kini terhubung ke atasan baru."*
     - Notifikasi in-app otomatis dikirim ke atasan baru:
       *"Penetapan Anggota Tim Baru: [Nama Pegawai] kini telah ditetapkan berada di bawah supervisi/koordinasi Anda."*
     - Sinkronisasi instan penilai evaluasi kinerja (`PerformanceReview`): mereassign `reviewerId` ke atasan baru untuk evaluasi aktif yang belum difinalisasi (`DRAFT` / `SELF_REVIEW` pada periode `OPEN`).
     - Audit log mencatat riwayat perubahan `managerId` pada field `before` dan `after`.
  2. **Invalidasi Cache Instan (`employee.actions.ts`)**:
     - `revalidatePath` dipanggil untuk rute `/profil`, `/dashboard`, `/kinerja`, `/notifikasi`, `/karyawan`, dan `/karyawan/[id]`, memastikan akun staf langsung melihat data teranyar tanpa harus relogin.
  3. **Tampilan Dinamis di Seluruh Sisi Akun Staf**:
     - **Profil Karyawan (`profile-info-tab.tsx` & `profile.queries.ts`)**: Kartu resmi menampilkan atasan langsung lengkap dengan nama, jabatan, dan NIP.
     - **Dashboard Staf (`staff-dashboard.tsx` & `staff-dashboard.ts`)**: Widget info atasan langsung dengan ikon `UserCheck` dan tautan cepat ke profil.
     - **Modul Kinerja (`performance.queries.ts`)**: Penilai aktif otomatis mencerminkan atasan baru, baik saat evaluasi dibuat maupun sinkronisasi dinamis runtime.
- **Hasil Verifikasi:**
  - `pnpm typecheck`: 9/9 packages lolos tanpa error.
---

## Modul Kalender — Penanda Hari Ini & Modal Rincian Ketidakhadiran (Cuti/Izin/Sakit)
- **Status:** Selesai (Completed)
- **Tujuan:** Menyediakan penanda visual yang tegas untuk tanggal hari ini, mempermudah navigasi kalender, memperbaiki pemotongan nama pegawai pada badge kalender, serta menampilkan dialog rincian lengkap saat entri izin/sakit/cuti diklik.
- **Rincian Implementasi:**
  1. **Penyelarasan Kueri & Serialization Data (`leave.queries.ts`)**:
     - `getLeaveCalendarEvents` diperkaya dengan field detail permohonan: `reason`, `attachmentKey`, `status`, `decisionNote`, `decidedAt`, nama jabatan & divisi pemohon (`currentDepartment`, `currentPosition`), dan status berbayar (`leaveType.isPaid`).
     - Seluruh data dikonversi secara aman ke *plain serializable object* (termasuk `Number(l.days)`) bebas error serialization Next.js.
  2. **Komponen Modal Detail Cuti (`leave-detail-modal.tsx`)**:
     - Komponen modal baru dengan animasi fade-in & backdrop blur, penutup via tombol Esc atau klik backdrop.
     - Menampilkan identitas pemohon (Avatar inisial, Nama Lengkap, NIP, Departemen, Posisi/Jabatan).
     - Rincian izin/cuti: Badge tipe berbayar/tanpa gaji, durasi hari kerja, rentang tanggal (mulai s/d selesai).
     - Alasan tertulis pemohon dalam format kutipan rapi.
     - Berkas lampiran / surat keterangan dokter (jika tersedia) lengkap dengan tombol langsung buka berkas (`/api/documents/${attachmentKey}`).
     - Status persetujuan resmi dan catatan persetujuan dari atasan/HR jika ada.
  3. **Penyempurnaan Tampilan Kalender (`leave-calendar-view.tsx`)**:
     - **Penanda Hari Ini (Today Indicator)**:
       - Border tebal navy khas brand PSPK (`border-2 border-[#102e50]`), background gradient halus, dan ring highlight.
       - Angka tanggal dilingkari kontras warna navy dan teks gold PSPK (`#f2af3e`), disertai badge penanda `"Hari Ini"`.
     - **Tombol Pintas "Hari Ini"**: Tombol shortcut di header kalender untuk langsung melompat kembali ke bulan dan hari berjalan.
     - **Perbaikan Label Nama & Warna Pill**:
       - Mengatasi pemotongan nama satu huruf (mis. *"I Made"* bukan hanya *"I"*).
       - Diferensiasi warna tematik: 🩺 Rose untuk Sakit, 🏖️ Biru untuk Cuti Tahunan, 📋 Ungu/Kuning untuk Izin/Penting.
       - Pill interaktif dengan cursor pointer dan trigger untuk membuka `LeaveDetailModal`.
     - **Penanganan Banyak Cuti**: Badge `+X lainnya` yang memunculkan daftar lengkap pegawai yang tidak hadir pada tanggal tersebut.
- **Hasil Verifikasi:**
  - `pnpm typecheck`: 9/9 packages lolos tanpa error.
  - `pnpm lint`: lolos dengan 0 error.
  - `pnpm test`: 42/42 unit test lulus (100%).

---

## Perbaikan Penanganan & Tampilan IP Address Client (Riwayat Sesi & Audit Log)
- **Status:** Selesai (Completed)
- **Akar Masalah (Root Cause):**
  1. Pada lingkungan lokal Next.js, header `x-forwarded-for` mengirimkan `::1` (IPv6 loopback).
  2. Better Auth secara bawaan menerapkan `normalizeIPv6(ip, 64)`. Karena bit `::1` berada di grup paling akhir (bit 127), pemotongan subnet `/64` mengubah `::1` menjadi `0000:0000:0000:0000:0000:0000:0000:0000`. Nilai ini yang tersimpan di kolom `core.sessions.ip_address`.
  3. Pada lingkungan multi-hop proxy (Caddy / Cloudflare / Docker), tanpa daftar `trustedProxies`, fungsi bawaan `getIPFromHeader` mengembalikan `null` jika terdapat lebih dari satu hop IP di header `x-forwarded-for`.
  4. Komponen UI (`session-history-tab.tsx`) dan query `getUserSessions` menampilkan IP mentah tanpa sanitasi dan penamaan yang informatif.
- **Implementasi Solusi:**
  1. **Helper IP di `@pspk/shared` (`formatters.ts`)**:
     - `cleanIpAddress(ip)`: Mendeteksi dan menormalkan loopback IPv6 (`::1`, `::`, `0000:...`), `localhost`, serta menghapus prefix IPv4-mapped (`::ffff:`). Menghasilkan `127.0.0.1` untuk loopback lokal.
     - `extractClientIp(headers)`: Mengekstrak IP klien asli dari header proxy dengan urutan prioritas terpercaya (`cf-connecting-ip` -> `x-real-ip` -> `true-client-ip` -> hop pertama `x-forwarded-for`), dan membersihkan hasilnya.
     - `formatIpAddress(ip)`: Menghasilkan label ramah pengguna untuk UI (misal: `127.0.0.1 (Lokal)` atau `192.168.x.x (Jaringan Privat)`).
  2. **Konfigurasi Better Auth (`packages/auth/src/index.ts`)**:
     - Menambahkan konfigurasi `advanced.ipAddress`:
       - `ipAddressHeaders`: `["cf-connecting-ip", "x-real-ip", "true-client-ip", "x-client-ip", "x-forwarded-for"]`
       - `trustedProxies`: `["127.0.0.1", "::1", "10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"]`
       - `ipv6Subnet: 128` (mencegah pemotongan grup bit IPv6 menjadi all-zeros).
     - Menambahkan `databaseHooks.session.create.before` untuk memastikan `ipAddress` selalu disanitasi sebelum disimpan ke PostgreSQL.
  3. **Pembersihan Log Audit (`packages/db/src/audit.ts`)**:
     - `writeAudit` otomatis menormalkan IP klien melalui `cleanIpAddress` sebelum disimpan ke `core.audit_logs`.
  4. **Pembaruan Seluruh Server Actions**:
     - Server Actions di `employee.actions.ts`, `payroll.actions.ts`, `performance.actions.ts`, `organization.actions.ts`, `employment-type.actions.ts`, `user-role.actions.ts`, dan `apps/sysmgmt/src/server/actions/user.actions.ts` kini memanggil `extractClientIp(reqHeaders)`.
  5. **Tampilan UI Profil (`session-history-tab.tsx` & `profile.queries.ts`)**:
     - Menggunakan `formatIpAddress(s.ipAddress)` sehingga tidak lagi menampilkan `0000:0000:...`, melainkan `127.0.0.1 (Lokal)`.
  6. **Migrasi Data Legacy**:
     - Rekord legacy sesi dan audit log di database yang sebelumnya berisi `0000:...` atau `::1` telah diperbarui ke `127.0.0.1`.
- **Hasil Verifikasi:**
  - `pnpm typecheck`: 9/9 package lolos tanpa error.
  - `pnpm lint`: lolos dengan 0 error (hanya peringatan styling lama).
  - `pnpm test`: 45/45 unit test lulus (termasuk 16 unit test di `formatters.test.ts`).

---

## Cara Menjalankan Lingkungan Lokal

```bash
# 1. Pastikan PostgreSQL lokal (Postgres.app / service) aktif di port 5432
# Database: pspk_platform, User: pspk, Password: pspk_dev_password

# 2. Jalankan aplikasi pengembangan
pnpm dev
# HRIS: http://localhost:3001
# System Management: http://localhost:3002

# 3. Jalankan pengujian
pnpm test          # Menjalankan 45 unit test (Vitest)
pnpm lint          # ESLint
pnpm typecheck     # TypeScript check di seluruh workspace
pnpm build         # Next.js standalone build
```




