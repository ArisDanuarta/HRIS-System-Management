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

## Cara Menjalankan Lingkungan Lokal

```bash
# 1. Pastikan PostgreSQL lokal (Postgres.app / service) aktif di port 5432
# Database: pspk_platform, User: pspk, Password: pspk_dev_password

# 2. Jalankan aplikasi pengembangan
pnpm dev
# HRIS: http://localhost:3001
# System Management: http://localhost:3002

# 3. Jalankan pengujian
pnpm test          # Menjalankan 37 unit test (Vitest)
pnpm lint          # ESLint
pnpm typecheck     # TypeScript check di seluruh workspace
pnpm build         # Next.js standalone build
```


