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
  - **H9 Absensi & Kehadiran Saya (`/absensi`)**:
    - `today-attendance-card.tsx`: Jam digital interaktif real-time WIB, status kehadiran hari ini, tombol *Catat Kehadiran Masuk* / *Catat Kehadiran Pulang*, dan input catatan aktivitas kerja. Stempel waktu diambil dari server (`TIMESTAMPTZ`), toleransi keterlambatan otomatis (lewat 09:00 WIB berstatus `LATE`).
    - Widget ringkasan bulanan: Tepat Waktu, Terlambat, Izin/Cuti, dan Akumulasi Jam Kerja.
    - `attendance-table.tsx`: Tabel log kehadiran harian sebulan penuh dengan badge status berlabel warna dan catatan koreksi jika ada.
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

## Cara Menjalankan Lingkungan Lokal

```bash
# 1. Pastikan PostgreSQL lokal (Postgres.app / service) aktif di port 5432
# Database: pspk_platform, User: pspk, Password: pspk_dev_password

# 2. Jalankan aplikasi pengembangan
pnpm dev
# HRIS: http://localhost:3001
# System Management: http://localhost:3002

# 3. Jalankan pengujian
pnpm test          # Menjalankan 29 unit test (Vitest)
pnpm lint          # ESLint
pnpm typecheck     # TypeScript check di seluruh workspace
pnpm build         # Next.js standalone build
```

