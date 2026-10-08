# Status Kemajuan Pengembangan PSPK Platform

Dokumen ini diperbarui secara berkala pada setiap akhir fase/tugas.

## [Tahap 1] Shell & Dashboard System Management (`apps/sysmgmt`) — 2026-10-08

- **Status:** Selesai
- **Scope & Solusi:**
  1. **Backend Aggregator & Queries ([`dashboard.queries.ts`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/sysmgmt/src/server/queries/dashboard.queries.ts)):**
     - Fungsi `getSysmgmtDashboardStats()` merangkum metrik ringkasan lintas skema database: total pengguna & verifikasi, total aset & utilisasi peminjaman, lisensi software & persentase kursi, dokumen/SOP aktif & draft, serta 10 feed log audit sistem terkini.
     - Penanganan database kosong yang tangguh (*clean slate resilience*): kalkulasi utilisasi lisensi software dicegah dari *division by zero* / `NaN`.
     - Unit tests [`dashboard.queries.test.ts`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/sysmgmt/src/server/queries/dashboard.queries.test.ts) (3 skenario pengujian lolos 100%).
  2. **Rute & Proteksi Halaman ([`dashboard/page.tsx`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/sysmgmt/src/app/(app)/dashboard/page.tsx)):**
     - Halaman Dashboard dilindungi autentikasi sesi dan RBAC server-side (`sysmgmt.dashboard.read:all`, `sysmgmt.user.*`).
     - Halaman root [`page.tsx`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/sysmgmt/src/app/page.tsx) otomatis mengarahkan (`redirect`) sesi yang valid ke `/dashboard`.
     - Menu Dashboard pada navbar [`SysmgmtNavbar`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/sysmgmt/src/components/shell/sysmgmt-navbar.tsx) diaktifkan penuh tanpa badge "Coming Soon".
  3. **Antarmuka Visual Eksekutif TI ([`dashboard-view.tsx`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/sysmgmt/src/components/dashboard/dashboard-view.tsx)):**
     - Sesuai spesifikasi Layar S1 (`md/design_stitch.md`):
       - Header eksekutif dengan salam personal dan status kesehatan sistem real-time.
       - 4 Kartu Statistik Metrik: Pengguna Sistem (dengan rasio 2FA/login), Inventaris Aset (dengan rasio peminjaman), Lisensi Software (dengan progress bar alokasi kursi), dan Dokumen & SOP (dengan rasio draft vs aktif).
       - Bilah Akses Cepat (*Quick Action Pills*): Tambah Pengguna Baru, Catat Aset, Input Lisensi, Unggah SOP, dan Audit Log.
       - Grid 12-kolom: Feed Log Audit Sistem Terkini (8-kolom) dengan badge aksi warna-warni, serta Panel Status Infrastruktur & Layanan PSPK (4-kolom).
- **Verifikasi Kualitas:**
  - `pnpm typecheck`: ✅ Lolos 9 paket tanpa error
  - `pnpm lint`: ✅ Lolos 0 error
  - `pnpm test`: ✅ Lolos 14 test suite (95 tests lolos 100%)

---

## Tahap B (System Management & HRIS): Tata Kelola Modul Sistem & Feature Flags Dinamis — 2026-10-07

- **Status:** Selesai
- **Scope & Arsitektur:**
  1. **Model Database & Migrasi Prisma ([`core.prisma`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/packages/db/prisma/schema/core.prisma)):**
     - Model `SystemSetting` pada skema `core` (`key`, `value`, `description`, `updatedAt`, `updatedBy`).
     - Migrasi `20261007085936_add_system_settings` diterapkan ke PostgreSQL.
     - Seeding 6 modul standar PSPK:
       - `org_chart` (Bagan Struktur Pohon Organisasi - default: Aktif)
       - `organization_structure` (Master Kelola Divisi & Jabatan - default: Aktif)
       - `performance` (Evaluasi Kinerja Riset & OKR - default: Aktif)
       - `timesheet` (Timesheet Lembar Jam Kerja Freelance - default: Aktif)
       - `recruitment` (Portal Rekrutmen & Pelamar - default: Nonaktif)
       - `training` (Pelatihan & Pengembangan Pegawai - default: Nonaktif)
     - Helper `@pspk/db/src/modules.ts`: `getModuleFlags(prisma)` dan `isModuleActive(flags, key)` dengan fallback aman jika koneksi/tabel kosong.
     - Unit test [`modules.test.ts`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/packages/db/src/modules.test.ts) (3 pengujian).
  2. **Query & Server Actions di System Management:**
     - [`module.queries.ts`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/sysmgmt/src/server/queries/module.queries.ts): `getSystemModulesConfig()` menyusun daftar modul dengan status aktif dan metadata lengkap.
     - [`module.actions.ts`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/sysmgmt/src/server/actions/module.actions.ts):
       - `toggleModuleAction`: Mengubah status aktif modul dengan proteksi izin `sysmgmt.module.toggle` dan audit log `MODULE_STATUS_UPDATE`.
       - `resetAllModulesToDefaultAction`: Mengembalikan seluruh modul ke standar awal PSPK dengan audit log `MODULES_RESET_DEFAULT`.
     - Unit tests [`module.queries.test.ts`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/sysmgmt/src/server/queries/module.queries.test.ts) (2 pengujian) & [`module.actions.test.ts`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/sysmgmt/src/server/actions/module.actions.test.ts) (5 pengujian).
  3. **Antarmuka Tata Kelola Modul di System Management:**
     - Subnavigasi Tata Kelola Pengguna ([`user-governance-subnav.tsx`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/sysmgmt/src/components/shell/user-governance-subnav.tsx)) dilengkapi tab `"Tata Kelola Modul"` (`/pengguna?tab=modules`).
     - Komponen grid kartu modul interaktif ([`module-governance-view.tsx`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/sysmgmt/src/components/modules/module-governance-view.tsx)):
       - Toggle switch instan per modul dengan indikator status aktif/nonaktif.
       - Badge penanda `Wajib / Inti` atau `Opsional`.
       - Filter pencarian instan dan penyaring status (_Semua, Aktif, Nonaktif_).
       - Modal konfirmasi reset ke default PSPK.
  4. **Integrasi Reaktif di HRIS (`apps/hris`):**
     - **Navigasi Sidebar:** Mengondisikan menu Bagan Organisasi, Struktur Organisasi, Kinerja, dan Timesheet agar tidak muncul jika dinonaktifkan di seluruh kelompok peran (Admin HR, Manajer Tim, Staf, Layanan Mandiri).
     - **Route Guards Halaman:**
       - `/karyawan/struktur` (Bagan Organisasi) $\to$ redirect `/karyawan` jika nonaktif.
       - `/karyawan/organisasi` (Struktur Organisasi) $\to$ redirect `/karyawan` jika nonaktif.
       - `/kinerja` (Kinerja & Riset) $\to$ redirect `/dashboard` jika nonaktif.
       - `/timesheet` & `/timesheet/persetujuan` (Timesheet) $\to$ redirect `/dashboard` jika nonaktif.
     - **Direktori Pegawai (`/karyawan`):** Tombol pintasan "Bagan Organisasi" dan "Struktur Organisasi" otomatis disembunyikan jika modul dinonaktifkan.
- **Verifikasi Kualitas:**
  - `pnpm typecheck`: ✅ Lolos 9 paket tanpa error
  - `pnpm lint`: ✅ Lolos 0 error di seluruh workspace
  - `pnpm test`: ✅ Lolos 13 test suite (92 tests lolos 100%)
  - `pnpm build`: ✅ Lolos standalone production build untuk `@pspk/hris` dan `@pspk/sysmgmt`

---

## Tahap A-Lanjutan (System Management): Mode Edit Interaktif Matriks RBAC & Fleksibilitas Keterangan Izin — 2026-10-07

- **Status:** Selesai
- **Scope & Solusi:**
  1. **Server Actions Mutasi RBAC ([`role.actions.ts`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/sysmgmt/src/server/actions/role.actions.ts)):**
     - `updateRolePermissionsAction`: Pembaruan daftar izin untuk satu peran operasional dengan perlindungan mutlak Super Admin.
     - `batchUpdateRoleMatrixAction`: Penyimpanan batch sekaligus untuk banyak peran dalam satu transaksi database atomik.
     - `resetRolePermissionsToDefaultAction`: Pemulihan wewenang peran ke standar awal blueprint PSPK berbasis kamus default.
     - `updatePermissionDescriptionAction`: Fleksibilitas pengubahan teks keterangan/deskripsi izin (min 3, max 255 karakter).
     - Seluruh mutasi dilindungi audit log atomik (`PERMISSION_UPDATE`, `ROLE_PERMISSIONS_RESET`, `PERMISSION_DESCRIPTION_UPDATE`).
  2. **Unit Tests Mutasi Peran ([`role.actions.test.ts`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/sysmgmt/src/server/actions/role.actions.test.ts)):**
     - 5 skenario komprehensif menguji pencegahan pengeditan Super Admin, transaksi batch, reset wewenang, dan sanitasi input deskripsi izin.
  3. **Antarmuka Interaktif Matriks RBAC ([`role-matrix-view.tsx`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/sysmgmt/src/components/roles/role-matrix-view.tsx)):**
     - Mode edit interaktif dengan toggle sel per role & permission.
     - Floating bottom bar penyimpan perubahan dengan counter perubahan dan tombol batal.
     - Modal verifikasi ganda "Reset ke Default PSPK".
     - Modal inline untuk mengubah teks keterangan wewenang izin dengan validasi realtime.
- **Verifikasi Kualitas:**
  - `pnpm typecheck`: ✅ Lolos 9 paket
  - `pnpm lint`: ✅ Lolos 0 error
  - `pnpm test`: ✅ Lolos 10 test suite (82 tests)

---

## Tahap A (System Management): Optimalisasi RBAC, Sub-Navigasi Tata Kelola & Matriks Grid Hak Akses — 2026-10-07

- **Status:** Selesai
- **Scope & Arsitektur:**
  1. **Server & Data Query Layer RBAC ([`apps/sysmgmt/src/server/queries/role.queries.ts`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/sysmgmt/src/server/queries/role.queries.ts)):**
     - Parser kunci permission terstandarisasi (`parsePermissionKey`) format `<modul>.<resource>.<aksi>:<scope>`.
     - Kamus `RESOURCE_METADATA` memetakan 56+ permission ke 19 kategori modul berbahasa Indonesia.
     - Query `getRolesWithPermissions()` dan `getRoleMatrixData()` menyusun data 2D matriks peran silang dengan lookup akses $O(1)$.
     - Unit test [`role.queries.test.ts`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/sysmgmt/src/server/queries/role.queries.test.ts) (4 skenario) memverifikasi seluruh permission terpetakan tanpa celah.
  2. **Sub-Navigasi Tata Kelola Pengguna ([`user-governance-subnav.tsx`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/sysmgmt/src/components/shell/user-governance-subnav.tsx)):**
     - Tab navigasi terpadu: `Akun Pengguna` (`/pengguna`) dan `Matriks Peran & Hak Akses` (`/pengguna?tab=roles`).
     - Siap untuk tab lanjutan `Tata Kelola Modul` pada Tahap B.
     - Integrasi pada Server Component [`pengguna/page.tsx`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/sysmgmt/src/app/%28app%29/pengguna/page.tsx) dengan pembacaan dinamis parameter URL `searchParams`.
  3. **Komponen Visual Matriks Grid RBAC Interaktif ([`role-matrix-view.tsx`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/sysmgmt/src/components/roles/role-matrix-view.tsx)):**
     - Visualisasi tabel 2D silang 5 Peran Sistem (`Super Admin`, `Admin IT`, `Admin HR`, `Manajer`, `Staf`) $\times$ 56 Permission.
     - Accordion buka/tutup per kategori modul dan kontrol cepat "Buka Semua" / "Tutup Semua".
     - Bilah pencarian instan realtime dan filter tab modul (_Semua_, _HRIS_, _System Management_).
     - Lencana wewenang berwarna ramah pengguna: Penuh (`:all`), Tim (`:team`), Mandiri (`:own`), Khusus (`:sync/:connect/:hr`), dan Terkunci (`—`).
  4. **Proteksi Keamanan Backend & Audit Logging ([`user.actions.ts`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/sysmgmt/src/server/actions/user.actions.ts) & [`can.test.ts`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/packages/rbac/src/can.test.ts)):**
     - Penegakan `assertCan(actor.authCtx, "sysmgmt.user.manage")` di seluruh server actions mutasi.
     - Proteksi Super Admin terakhir (tidak bisa di-demote atau dinonaktifkan jika `count <= 1`).
     - Pencegahan self-lockout dan hierarki perlindungan akun root dari Admin IT.
     - Pencatatan transaksi audit log atomik ke `core.audit_logs`.
     - Unit test `can.test.ts` bertambah 3 pengujian wewenang `sysmgmt`.
- **Verifikasi Kualitas:**
  - `pnpm typecheck`: ✅ Lolos 9 paket
  - `pnpm lint`: ✅ Lolos 0 error di seluruh workspace
  - `pnpm test`: ✅ Lolos 9 test suite (77 tests)
  - `pnpm build`: ✅ Lolos standalone production build untuk `@pspk/hris` dan `@pspk/sysmgmt`

---

## Tahap 6 (Penyempurnaan Saldo Cuti): Saldo Kuota Cuti Dinamis & Auto-Provisioning Tipe Cuti — 2026-10-06

- **Status:** Selesai
- **Scope & Perbaikan:**
  1. **Tahun & Periode Dinamis:** Menghilangkan hardcode tahun `2026` pada modul Cuti (`/cuti`, `/cuti/ajukan`, `/cuti/pengaturan`, dan shell `layout.tsx`). Tahun periode kini otomatis mengikuti tahun berjalan (`new Date().getFullYear()`) sehingga label `"Periode: 01 Jan {tahun} — 31 Des {tahun}"` selalu akurat dan berganti sendiri secara otomatis di masa depan.
  2. **Auto-Display Saldo Cuti Aktif (`getEmployeeLeaveBalances`):** Memperbaiki query di `leave.queries.ts` agar memetakan seluruh jenis cuti yang aktif (`Cuti Tahunan`, `Cuti Sakit`, `Cuti Melahirkan`, `Cuti Penting`). Pegawai yang baru dibuat atau belum pernah disesuaikan kuotanya secara kustom oleh HR kini otomatis menampilkan kartu kuota bawaan (`defaultQuotaDays`) dengan sisa saldo utuh.
  3. **Empty State & UI Fallback:** Menambahkan fallback visual di `leave-balance-cards.tsx` jika belum ada master jenis cuti aktif.
- **Verifikasi Kualitas:**
  - `pnpm typecheck`: ✅ Lolos 9 paket
  - `pnpm lint`: ✅ Lolos 0 error
  - `pnpm test`: ✅ Lolos 8 test suite (70 tests)

---

## Tahap 6 (Penyempurnaan Navigasi): Unifikasi Kalender Kerja & Penghapusan Tab Redundan Kalender Cuti — 2026-10-06

- **Status:** Selesai
- **Scope & Perubahan:**
  1. **Penghapusan Tab Redundan:** Tab "Kalender Cuti" dihapus secara permanen dari subnavigasi Cuti & Presensi ([`AttendanceLeaveSubnav`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/components/shell/attendance-leave-subnav.tsx)).
  2. **Konsolidasi Single Source of Truth:** Seluruh visibilitas jadwal kerja, cuti rekan kerja & diri sendiri yang disetujui, hari libur bersama, peringatan nasional, serta rapat Google Meet kini terpusat 100% di menu utama **Kalender Kerja** (`/kalender`).
  3. **Auto-Redirect Aman:** Halaman rute lama [`/cuti/kalender`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/app/%28app%29/cuti/kalender/page.tsx) otomatis melakukan redirect HTTP ke `/kalender` dengan tetap mempertahankan query param `year` dan `month`.
  4. **Pembersihan Komponen Usang:** Menghapus komponen mati `leave-calendar-view.tsx` dan `leave-detail-modal.tsx`, serta memperbarui tautan kalender di `manager-dashboard.tsx` dan invalidasi cache `revalidatePath("/kalender")` di `leave.actions.ts`.
- **Verifikasi Kualitas:**
  - `pnpm typecheck`: ✅ Lolos 9 paket
  - `pnpm lint`: ✅ Lolos 0 error
  - `pnpm test`: ✅ Lolos 8 test suite (70 tests)

---

## Tahap 6 (Fitur Tambahan): Hari Peringatan Nasional Indonesia di Kalender Kerja — 2026-10-06

- **Status:** Selesai
- **Scope & Arsitektur:**
  1. **Dataset Kurasi Hari Peringatan Nasional (`packages/shared/src/observances.ts`):**
     - Memuat 50+ Hari Peringatan Nasional resmi Indonesia dari Januari s.d. Desember (Hardiknas 2 Mei, Hari Kartini 21 Apr, Hari Guru Nasional 25 Nov, Harkitnas 20 Mei, Hari Anak Nasional 23 Juli, Hari Sumpah Pemuda 28 Okt, Hari Pahlawan 10 Nov, Hari Pramuka, Hari Santri, Hari Ibu, dll).
     - **Pemisahan Logika Bisnis:** Hari peringatan bukan hari libur/tanggal merah (hari kerja normal), sehingga sengaja dikelola di layer aplikasi kurasi `@pspk/shared` dan tidak mencemari tabel `holidays` (agar kalkulasi hari kerja untuk payroll & kuota cuti tetap 100% akurat).
     - **Tersedia 100% Offline:** Selalu muncul di kalender meskipun pengguna belum menghubungkan akun Google atau Google Calendar API sedang offline.
     - Fungsi utilitas: `getIndonesianObservancesForMonth(year, month)` dan `getIndonesianObservancesForDate(year, month, day)`.
  2. **Query & Integrasi Server Kalender:**
     - [`apps/hris/src/server/queries/calendar.queries.ts`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/server/queries/calendar.queries.ts): `getWorkCalendarEvents()` menyertakan array `observances: WorkCalendarObservance[]`.
     - [`apps/hris/src/app/(app)/kalender/page.tsx`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/app/%28app%29/kalender/page.tsx): Meneruskan props observances ke `<WorkCalendarView />`.
  3. **Visual & Interaksi UI Kalender Kerja (`work-calendar-view.tsx`):**
     - Filter bar: Ditambahkan opsi filter `Peringatan (N)`.
     - Penanda sel kalender:
       - Border & aksen warm amber (`bg-amber-50/30 border-amber-200/90`).
       - Titik oranye (dot indicator) di samping angka tanggal.
       - Badge tag khusus `Peringatan` berikon bendera (`Flag`) di pojok sel.
       - Chip peringatan interaktif berwarna amber dengan nama hari peringatan.
     - Modal interaktif lengkap:
       - Modal Detail Tanggal (`selectedDayData`): Menampilkan card Hari Peringatan Nasional dengan kategori, deskripsi sejarah & makna peringatan, serta badge penjelas "Hari Kerja Normal (Bukan Tanggal Merah)".
       - Modal Detail Peringatan Mandiri (`selectedObservanceDetail`): Muncul langsung saat chip peringatan diklik di kalender.
       - Legenda kalender dilengkapi indikator `Peringatan Nasional (Hari Kerja)`.
  4. **Pengujian:**
     - Unit test [`packages/shared/src/observances.test.ts`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/packages/shared/src/observances.test.ts) (5 pengujian mencakup penemuan hari penting, format tanggal, isolasi bulan, dll).
     - `pnpm test`: Lolos 8 test suite (70 tests)
     - `pnpm typecheck`: Lolos 9 paket
     - `pnpm lint`: Lolos 0 error

---

## Tahap 6 (Fase C): Google OAuth per Karyawan & Integrasi Meeting Google Meet — 2026-10-06

- **Status:** Selesai (Seluruh 3 Fase Modul Kalender Kerja Rampung)
- **Scope Fase C (Integrasi OAuth Pribadi, Enkripsi Token, Google Meet Event):**
  1. **Skema Database & Prisma Migration:**
     - Menambahkan enum `CalendarEventType` (`MEETING`, `LEAVE`, `HOLIDAY`), `CalendarEventSource` (`GOOGLE_CALENDAR`, `HRIS_SYSTEM`), dan model `CalendarEvent` di [`packages/db/prisma/schema/hris.prisma`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/packages/db/prisma/schema/hris.prisma).
     - Menghubungkan relasi `calendarEvents` pada model `Employee`.
     - Migration dijalankan via `pnpm db:migrate --name add_calendar_events` (`20261006062920_add_calendar_events.sql`).
  2. **Service Google Calendar & Manajemen Token (`google-calendar.service.ts`):**
     - [`apps/hris/src/server/services/google-calendar.service.ts`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/server/services/google-calendar.service.ts):
       - `checkGoogleConnected(userId)`: Memeriksa status sambungan akun Google karyawan di tabel `Account`.
       - `syncEmployeeGoogleEvents(employeeId, userId)`: Mengambil agenda kalender Google (rentang -30 hari s.d. +60 hari), mendeteksi tautan Google Meet (`hangoutLink` / `conferenceData` / deskripsi), meng-upsert event berstatus `MEETING`, dan membersihkan agenda yang telah dibatalkan/dihapus di Google Calendar.
       - `refreshGoogleAccessToken(accountId, encryptedRefreshToken)`: Otomatis menyegarkan `access_token` jika sudah kedaluwarsa.
       - `disconnectGoogleCalendar(userId, employeeId)`: Menghapus token dari tabel `Account` dan menghapus data agenda meeting Google milik karyawan yang login.
       - **Keamanan Token:** Seluruh token (`access_token`, `refresh_token`) wajib dienkripsi sebelum disimpan ke DB menggunakan `encryptField` (AES-256-GCM via `DATA_ENCRYPTION_KEY`) dan didekripsi on-the-fly via `decryptField`.
  3. **Alur Autentikasi OAuth 2.0 (Connect & Callback):**
     - [`apps/hris/src/app/api/calendar/google/connect/route.ts`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/app/api/calendar/google/connect/route.ts): Menginisiasi alur OAuth, menyusun URL consent Google dengan scope `calendar.events.readonly`, serta menyetel cookie anti-CSRF `pspk_gcal_oauth_state` (httpOnly).
     - [`apps/hris/src/app/api/calendar/google/callback/route.ts`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/app/api/calendar/google/callback/route.ts): Memvalidasi state anti-CSRF, menukar authorization code dengan token Google, mengenkripsi token, menyimpannya ke tabel `Account`, menjalankan initial sync meeting, dan mengalihkan user kembali ke `/kalender?connected=true`.
  4. **Server Actions & Query Kalender:**
     - [`apps/hris/src/server/actions/calendar.actions.ts`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/server/actions/calendar.actions.ts): Ditambahkan `syncMyGoogleCalendarAction()` dan `disconnectGoogleCalendarAction()` dengan proteksi RBAC `hris.calendar.google:connect` dan audit log `writeAudit`.
     - [`apps/hris/src/server/queries/calendar.queries.ts`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/server/queries/calendar.queries.ts): Diperluas untuk menyertakan `meetings: WorkCalendarMeeting[]` yang secara eksklusif hanya memuat meeting milik karyawan yang login (privat).
  5. **Pembaruan UI Kalender Kerja:**
     - [`apps/hris/src/components/kalender/google-connect-banner.tsx`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/components/kalender/google-connect-banner.tsx): Tombol "Hubungkan Google Calendar" kini aktif mengarah ke `/api/calendar/google/connect`.
     - [`apps/hris/src/components/kalender/work-calendar-view.tsx`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/components/kalender/work-calendar-view.tsx):
       - Filter bar: Ditambahkan filter dinamis "Meeting Saya (N)".
       - Grid kalender: Menampilkan chip meeting (warna indigo) dengan icon kamera `Video`, judul rapat, dan jam pelaksanaan WIB.
       - Modal Detail Meeting: Klik meeting chip memunculkan dialog rincian agenda, waktu pelaksanaan, dan tombol CTA utama "Buka Google Meet" yang membuka Google Meet langsung di tab baru.
       - Status bar akun terhubung: Menampilkan badge email Google yang terhubung, tombol "Sync Meeting", dan tombol "Putuskan Sambungan".
  6. **Konfigurasi Environment:**
     - [`.env.example`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/.env.example) dilengkapi `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, dan `GOOGLE_OAUTH_REDIRECT_URI`.
- **Verifikasi Kualitas:**
  - `Prisma Migration`: ✅ Sukses (`20261006062920_add_calendar_events`)
  - `pnpm typecheck`: ✅ Lolos 9 paket tanpa error
  - `pnpm lint`: ✅ Lolos 0 error
  - `pnpm test`: ✅ Lolos 7 test suite (65 unit tests)
  - Endpoint tests (`/api/calendar/google/connect` & `/callback`): ✅ HTTP 307 Redirect aman

---

## Tahap 6 (Fase B): Auto-Sync Libur Nasional via Google Calendar API — 2026-10-06

- **Status:** Selesai (Fase B dari 3 Fase)
- **Scope Fase B (Sinkronisasi Libur Nasional Indonesia Tanpa Login Pengguna):**
  1. **Service Sinkronisasi Libur Nasional:**
     - [`apps/hris/src/server/services/holiday-sync.service.ts`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/server/services/holiday-sync.service.ts):
       - `syncIndonesianHolidays(year)` memanggil Google Calendar Public API menggunakan API Key (tanpa OAuth).
       - Menargetkan kalender resmi Indonesia (`id.indonesian#holiday@group.v.calendar.google.com` dengan fallback `en.indonesian#holiday@group.v.calendar.google.com`).
       - Mem-parsing event, mendeteksi rentang hari (all-day span), dan menandai status `isCollectiveLeave` secara otomatis untuk Cuti Bersama.
       - Melakukan `upsert` ke model `Holiday` di PostgreSQL tanpa duplikasi.
       - Mengotomatisasi pembersihan cache melalui `revalidatePath` untuk `/kalender`, `/cuti/kalender`, `/cuti/pengaturan`, dan `/cuti/ajukan`.
  2. **Server Action & Route Handler API:**
     - [`apps/hris/src/server/actions/calendar.actions.ts`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/server/actions/calendar.actions.ts):
       - `syncHolidaysAction(year)` dengan pengecekan sesi & guard izin `hris.calendar.holiday:sync`, serta pencatatan audit log `writeAudit`.
     - [`apps/hris/src/app/api/calendar/holidays/sync/route.ts`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/app/api/calendar/holidays/sync/route.ts):
       - Route handler `POST` yang mendukung 2 jalur otorisasi: header `x-cron-secret` untuk scheduler/cron otomatis atau sesi user dengan izin HR/Admin.
  3. **UI Tombol Sinkronisasi HR:**
     - [`apps/hris/src/components/kalender/work-calendar-view.tsx`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/components/kalender/work-calendar-view.tsx):
       - Tombol "Sync Libur Nasional" muncul khusus untuk peran dengan izin `hris.calendar.holiday:sync` (Admin HR & Super Admin).
       - Dilengkapi animasi spinner saat proses sinkronisasi berjalan, banner feedback notifikasi (sukses/gagal), dan auto-refresh tampilan kalender.
  4. **Seeding & Konfigurasi Lingkungan:**
     - [`packages/db/prisma/seed.ts`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/packages/db/prisma/seed.ts) diperbarui untuk memuat data dasar 48 hari libur nasional & cuti bersama resmi 2025–2026, serta otomatis sinkronisasi ke Google Calendar jika `GOOGLE_CALENDAR_API_KEY` terisi.
     - [`.env.example`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/.env.example) ditambahkan variabel `GOOGLE_CALENDAR_API_KEY` dan `CRON_SECRET`.
- **Verifikasi Kualitas:**
  - `pnpm db:seed`: ✅ Sukses (48 hari libur nasional 2025-2026 tersimpan di PostgreSQL)
  - `pnpm typecheck`: ✅ Lolos 9 paket tanpa error
  - `pnpm lint`: ✅ Lolos 0 error
  - `pnpm test`: ✅ Lolos 7 test suite (65 unit tests)
  - Endpoint test (`curl /api/calendar/holidays/sync`): ✅ HTTP 401 Unauthorized saat tanpa kredensial

---

## Tahap 6 (Fase A): Modul Kalender Kerja Terpadu (Work Calendar) — 2026-10-06

- **Status:** Selesai (Fase A dari 3 Fase)
- **Scope Fase A (Struktur Menu, RBAC, Data DB Cuti & Libur):**
  1. **RBAC & Hak Akses:**
     - Ditambahkan 4 permission baru di [`packages/rbac/src/permissions.ts`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/packages/rbac/src/permissions.ts):
       - `hris.calendar.read:own`
       - `hris.calendar.read:all`
       - `hris.calendar.holiday:sync`
       - `hris.calendar.google:connect`
     - Mapping role di [`packages/rbac/src/roles.ts`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/packages/rbac/src/roles.ts) untuk `admin_hr`, `manager`, `staff`, dan `super_admin`.
     - Seed database dijalankan via `pnpm db:seed` (65 permissions & 5 roles tersinkronisasi).
  2. **Query Server Kalender Kerja:**
     - [`apps/hris/src/server/queries/calendar.queries.ts`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/server/queries/calendar.queries.ts):
       - `getWorkCalendarEvents(year, month)` mengambil data cuti tim yang berstatus `APPROVED` serta hari libur resmi dan cuti bersama dari tabel `Holiday` untuk bulan yang dipilih.
  3. **Komponen UI Kalender Kerja:**
     - [`apps/hris/src/components/kalender/work-calendar-view.tsx`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/components/kalender/work-calendar-view.tsx):
       - Grid 7-kolom (Senin–Minggu) interaktif dengan indikator hari ini (_today badge_).
       - Navigasi bulan (Maju/Mundur/Hari Ini) dengan URL query params `?year=&month=`.
       - Filter pill: Semua Event, Cuti Tim, Hari Libur Nasional.
       - Modal dialog daftar kegiatan harian saat tanggal diklik.
       - Modal detail cuti rekan kerja (karyawan, departemen, jenis cuti, durasi, alasan).
     - [`apps/hris/src/components/kalender/google-connect-banner.tsx`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/components/kalender/google-connect-banner.tsx):
       - Banner ajakan integrasi Google Calendar & Google Meet (siap diaktifkan pada Fase C).
  4. **Halaman Rute & Navigasi Sidebar:**
     - Halaman baru [`apps/hris/src/app/(app)/kalender/page.tsx`](<file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/app/(app)/kalender/page.tsx>) dengan Server Component `dynamic = "force-dynamic"`, pengecekan session, dan proteksi RBAC `hris.calendar.read:own`.
     - Menu "Kalender Kerja" mandiri ditambahkan ke Sidebar ([`apps/hris/src/components/shell/app-sidebar.tsx`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/components/shell/app-sidebar.tsx)) untuk seluruh peran (Admin HR, Manager, Staff) tepat di bawah menu Beranda.
- **Verifikasi Kualitas:**
  - `pnpm db:seed`: ✅ Sukses (65 permissions & 5 roles)
  - `pnpm typecheck`: ✅ Lolos 9 paket tanpa error
  - `pnpm lint`: ✅ Lolos 0 error
  - `pnpm test`: ✅ Lolos 7 test suite (65 unit tests)
  - Endpoint dev server: ✅ HTTP 307 redirect ke login saat unauthenticated

---

## Tahap 5: Modul Evaluasi Kinerja & Riset (Full Workflow) — 2026-10-05

- **Status:** Selesai
- **Scope:**
  1. **Logika Bisnis Bersama (`@pspk/shared`):**
     - [`packages/shared/src/performance.ts`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/packages/shared/src/performance.ts): Fungsi murni `calculatePerformancePredicate()` (Grade A/B/C/D + kelas badge), `calculateRecommendedFinalScore()` (nilai atasan langsung = bobot utama), dan `validateGoalWeights()`.
     - [`packages/shared/src/performance.test.ts`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/packages/shared/src/performance.test.ts): Unit test lengkap untuk seluruh logika kinerja.

  2. **Schema Validasi Zod (`performance.schema.ts`):**
     - `updateGoalSchema`, `submitManagerReviewSchema`, `requestReviewRevisionSchema`, `unlockPerformanceReviewSchema` ditambahkan untuk mendukung semua transisi status evaluasi.

  3. **Server Actions (`performance.actions.ts`) — Workflow Penuh:**
     - `updateGoalAction`: Update sasaran OKR oleh staf/atasan/HR (validasi bobot total ≤ 100%).
     - `submitManagerReviewAction`: Atasan langsung atau Admin HR mengisi nilai & catatan (SELF_REVIEW → MANAGER_REVIEW).
     - `requestReviewRevisionAction`: Atasan/Admin HR mengembalikan evaluasi ke DRAFT dengan alasan (reset skor self & manager).
     - `unlockPerformanceReviewAction`: Admin HR membuka kunci evaluasi yang sudah FINALIZED (→ MANAGER_REVIEW), khusus koreksi.
     - Semua aksi dilengkapi: guard RBAC berlapis, validasi status enum, audit log lengkap.

  4. **UI Modal Evaluasi ([`performance-detail-modal.tsx`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/components/kinerja/performance-detail-modal.tsx)) — Overhauled:**
     - **Tab-panel aksi dinamis** berdasarkan peran dan status evaluasi saat ini:
       - 📋 Detail Evaluasi (default semua role)
       - ⭐ Isi Penilaian Atasan (muncul hanya untuk atasan/HR jika status SELF_REVIEW)
       - 🔄 Minta Revisi (muncul untuk atasan/HR jika status SELF_REVIEW atau MANAGER_REVIEW)
       - 🔒 Finalisasi Nilai (muncul di panel Detail untuk HR jika status MANAGER_REVIEW)
       - 🔓 Buka Kunci (muncul untuk HR jika status FINALIZED)
     - **Formulir Penilaian Atasan (`ManagerReviewForm`):** Input skor 0–100, predicate live preview, textarea catatan wajib (≥10 karakter).
     - **Formulir Minta Revisi (`RequestRevisionForm`):** Warning box, textarea alasan, konfirmasi destruktif.
     - **Panel Buka Kunci (`UnlockPanel`):** Warning risiko, catatan alasan wajib, confirm dialog.
     - **Komparasi Self vs Manager Review:** Side-by-side card biru (staf) vs amber (atasan) dengan skor dan komentar masing-masing.
     - **Finalisasi HR (`FinalizeReviewForm`):** Rekomendasi skor otomatis, preview predicate, input override skor final.

  5. **Prop Threading untuk RBAC UI:**
     - `currentEmployeeId` dan `isHrOrAdmin` diteruskan dari `page.tsx` → `PerformanceClientWrapper` → `PerformanceTable` → `PerformanceDetailModal` agar aksi kontekstual muncul sesuai hak akses pengguna yang login.

- **Verifikasi Kualitas:**
  - `pnpm typecheck`: ✅ Lolos tanpa error
  - `pnpm lint`: ✅ 0 error (15 warnings pre-existing — `<img>` tag di komponen profil, unused vars di file lama)
  - `pnpm test (@pspk/shared)`: ✅ Semua unit test logika kinerja lolos

---

## Tahap 4: Bagan Hierarki Organisasi & Visual Interaktif Divisi/Manajer (Opsi A Core HRIS) — 2026-10-05

- **Status:** Selesai
- **Scope:**
  1. Sub-tahap 4A: Engine Pembentukan Pohon Hierarki Organisasi ([`apps/hris/src/server/queries/org-chart.queries.ts`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/server/queries/org-chart.queries.ts)):
     - Query seluruh pegawai aktif beserta kontrak aktif, divisi, jabatan struktural, dan atasan langsung (`managerId`).
     - Algoritma resolusi simpul pohon (`OrgChartNode`), identifikasi pimpinan puncak (`rootNodes`), komputasi kedalaman tingkat (`level` & `maxDepth`), kalkulasi rekursif jumlah bawahan langsung maupun bawahan tidak langsung (`totalSubordinatesCount`), pengelompokan ringkasan divisi, serta pelacakan pegawai aktif yang belum memiliki atasan atau atasan tidak ditemukan (`unassignedEmployees`).
  2. Sub-tahap 4B: Komponen Visual Pohon Organisasi Interaktif ([`apps/hris/src/components/karyawan/org-chart-view.tsx`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/components/karyawan/org-chart-view.tsx)):
     - Dua Mode Tampilan:
       - **Visual Tree**: Visualisasi bagan pohon bertingkat dengan garis konektor CSS rapi, kartu pegawai dengan foto profil/inisial brand PSPK, status keaktifan pegawai, badge divisi & ikatan kerja, jumlah bawahan, tombol buka/tutup cabang (_expand/collapse_), serta kontrol zoom (50% s.d. 150%) dan reset ukuran.
       - **Hierarchical Accordion List**: Tampilan daftar berjenjang dengan indentasi hierarkis dinamis untuk navigasi cepat dan ramah perangkat layar kecil/mobile.
     - Pencarian Instan Terarah: Mencari pegawai berdasarkan nama, nama panggilan, nomor pegawai (NIP), jabatan, atau divisi dengan otomatis membuka seluruh rantai atasan (_ancestor chain_) dan memberikan efek penyorotan visual (_amber border & pulse highlight_).
     - Filter Divisi: Memfilter cabang bagan per unit kerja/divisi tertentu.
     - Drawer Khusus "Pegawai Belum Terpetakan": Panel modal interaktif untuk mendeteksi pegawai aktif yang belum memiliki atasan langsung (`managerId === null`), dilengkapi indikator jabatan dan tombol tautan cepat khusus Admin HR untuk segera mengatur atasan di formulir profil.
  3. Sub-tahap 4C: Halaman Bagan Struktur Organisasi & Integrasi Navigasi ([`apps/hris/src/app/(app)/karyawan/struktur/page.tsx`](<file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/app/(app)/karyawan/struktur/page.tsx>)):
     - Dapat diakses oleh **seluruh peran** (`admin_hr`, `manager`, `staff`) untuk menjaga transparansi koordinasi internal organisasi.
     - Integrasi Menu Sidebar ([`apps/hris/src/components/shell/app-sidebar.tsx`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/components/shell/app-sidebar.tsx)) dengan ikon `Network` pada seluruh section peran dan penanda tautan aktif (`isNavActive`).
     - Integrasi Breadcrumb Topbar ([`apps/hris/src/components/shell/app-topbar.tsx`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/components/shell/app-topbar.tsx)).
     - Tombol Cepat Aksi: Tautan langsung "Bagan Organisasi ↗" di halaman Direktori Pegawai ([`apps/hris/src/app/(app)/karyawan/page.tsx`](<file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/app/(app)/karyawan/page.tsx>)) dan "Visual Bagan Pohon Organisasi ↗" di halaman Kelola Organisasi ([`apps/hris/src/app/(app)/karyawan/organisasi/page.tsx`](<file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/app/(app)/karyawan/organisasi/page.tsx>)).
- **Ketahanan Cache Prisma Development:**
  - Menambahkan deteksi _outdated client_ pada singleton Prisma ([`packages/db/src/index.ts`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/packages/db/src/index.ts)) menggunakan proxy trap agar saat model schema mengalami penambahan migrasi baru di sesi Turbopack dev, client langsung di-instansiasi ulang secara transparan tanpa terjadi `PrismaClientValidationError`.
- **Verifikasi Kualitas:**
  - `pnpm typecheck`: ✅ 9/9 package lolos tanpa error (0 error)
  - `pnpm lint`: ✅ 0 error
  - `pnpm test`: ✅ 54/54 test lolos (100%)
  - Endpoint dev server `/api/health`: ✅ status 200 OK (`{"status":"ok"}`)

---

## Tahap 3: Vault Dokumen & Berkas Digital Pegawai (Opsi A Core HRIS) — 2026-10-05

- **Status:** Selesai
- **Scope:**
  1. Sub-tahap 3A: Skema Database & Migrasi Prisma untuk Berkas Digital Pegawai (`EmployeeDocument` di skema `hris`).
  2. Sub-tahap 3B: Server Actions Upload & Hapus Dokumen (`uploadEmployeeDocumentAction`, `deleteEmployeeDocumentAction`) dengan validasi MIME/ukuran file, penyimpanan aman ke `@pspk/storage`, otorisasi akses berjenjang (Aturan Khusus: Berkas Kontrak Kerja `CONTRACT` wajib diunggah/diperbarui/dihapus hanya oleh Admin HR / Super Admin sedangkan staf hanya bisa melihat dan mengunduh; Berkas non-kontrak seperti KTP, NPWP, Ijazah, CV, Sertifikat, dll. dapat diisi/diunggah mandiri oleh pegawai pemilik akun atau oleh HR), dan pencatatan audit log `UPLOAD_DOCUMENT` & `DELETE_DOCUMENT`.
  3. Sub-tahap 3C: Komponen Vault Berkas Digital Interaktif ([`EmployeeDocumentsCard`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/components/karyawan/employee-documents-card.tsx)) yang diintegrasikan di dua tempat:
     - Halaman detail pegawai ([`apps/hris/src/app/(app)/karyawan/[id]`](<file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/app/(app)/karyawan/[id]/page.tsx>)) pada tab "Dokumen & Berkas" untuk Admin HR dan Manajer.
     - Halaman Profil Saya ([`apps/hris/src/app/(app)/profil`](<file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/app/(app)/profil/page.tsx>) & [`ProfileView`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/components/profil/profile-view.tsx)) pada tab "Dokumen & Berkas" untuk Layanan Mandiri Karyawan (ESS / Employee Self-Service).
- **Perubahan Utama:**
  - Skema & Relasi Database: Menambahkan model `EmployeeDocument` pada [`packages/db/prisma/schema/hris.prisma`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/packages/db/prisma/schema/hris.prisma) dengan atribut `id`, `employeeId`, `category` (KTP/KK, Ijazah & CV, Kontrak Fisik, Sertifikat, Lainnya), `title`, `fileName`, `fileKey`, `fileSize`, `mimeType`, `uploadedById`, dan `createdAt`. Migration `20261005071240_add_employee_documents` berhasil dieksekusi ke PostgreSQL.
  - Query Data Pegawai & Profil: Memperbarui [`getEmployeeById`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/server/queries/employee.queries.ts) dan [`getCurrentUserProfile`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/server/queries/profile.queries.ts) untuk menyertakan relasi `documents` terurut tanggal unggah terbaru (`orderBy: { createdAt: "desc" }`).
  - Aksi Server & Validasi Ketat: Mengembangkan [`apps/hris/src/server/actions/document.actions.ts`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/server/actions/document.actions.ts):
    - Aturan Kontrak Kerja: Kategori `CONTRACT` diproteksi ketat pada backend; jika bukan Admin HR / Super Admin yang mengunggah atau menghapus, aksi ditolak otomatis dengan pesan error jelas.
    - Hak Akses Dokumen Mandiri: Pegawai pemilik akun (`isSelf`) berhak mengunggah berkas identitas, ijazah, CV, sertifikat, dan menghapus berkas mandirinya jika perlu diperbarui.
    - Pembatasan ukuran maksimum berkas sebesar 25MB serta validasi tipe MIME berkas (`application/pdf`, `image/png`, `image/jpeg`, `image/webp`).
    - Penyimpanan file fisik secara terisolasi ke volume lokal melalui abstraksi `StorageProvider` (`@pspk/storage`).
    - Pencatatan jejak audit mendalam ke tabel `audit_logs` (`UPLOAD_DOCUMENT` dan `DELETE_DOCUMENT`).
  - Komponen Vault Dokumen Interaktif: Membuat [`apps/hris/src/components/karyawan/employee-documents-card.tsx`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/components/karyawan/employee-documents-card.tsx) dengan prop `isHrOrAdmin`:
    - Tab penyaring berkas per kategori (Semua, Identitas, Ijazah & CV, Kontrak Fisik, Sertifikat, Dokumen Lainnya).
    - Modal upload drag-and-drop dengan progress state, preview ukuran & nama file sebelum disimpan, serta penyembunyian opsi kategori Kontrak jika yang mengunggah bukan Admin HR.
    - Modal pratinjau berkas terintegrasi: rendering gambar dan iframe PDF tanpa perlu membuka tab luar secara manual.
    - Tombol unduh file instan via streaming terproteksi `/api/documents/${fileKey}?download=true`.
    - Perlindungan berkas Kontrak di kartu: tombol hapus disembunyikan bagi non-HR dan digantikan badge penanda "Resmi HR".
  - Integrasi Layanan Mandiri Pegawai (ESS): Menambahkan tab "Dokumen & Berkas" di [`ProfileView`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/components/profil/profile-view.tsx) agar staf baru maupun lama dapat mengunggah berkas kelengkapan administrasi mereka sendiri secara mandiri.
- **Verifikasi Kualitas:**
  - `pnpm typecheck`: ✅ 9/9 package lolos tanpa error (0 error)
  - `pnpm lint`: ✅ 0 error
  - `pnpm test`: ✅ 54/54 test lolos (100%)
  - Endpoint dev server `/api/health`: ✅ status 200 OK (`{"status":"ok"}`)

---

## Tahap 2: Koreksi & Override Keputusan Cuti oleh Admin HR (Opsi A Core HRIS) — 2026-10-05

- **Status:** Selesai
- **Scope:**
  1. Sub-tahap 2A: Layanan & Server Action Koreksi/Override Keputusan Cuti (`overrideLeaveDecision` & `overrideLeaveDecisionAction`) dengan otorisasi khusus `super_admin` & `admin_hr` (`hris.leave.configure:all`). Menangani sinkronisasi kuota saldo cuti secara otomatis (pengembalian hari cuti bila status dibatalkan/ditolak dari disetujui, atau pemotongan kuota & validasi sisa saldo/jadwal bentrok bila status diubah menjadi disetujui), sinkronisasi log status presensi kerja/LEAVE, dan audit log mendalam `OVERRIDE` pada entitas `LeaveRequest`.
  2. Sub-tahap 2B: Antarmuka Interaktif Override Keputusan Cuti pada tab riwayat persetujuan di [`apps/hris/src/app/(app)/cuti/persetujuan`](<file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/app/(app)/cuti/persetujuan/page.tsx>) dan [`leave-approval-view.tsx`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/components/cuti/leave-approval-view.tsx), dilengkapi tombol "Override" khusus Admin HR, modal interaktif, kartu pratinjau kalkulasi saldo otomatis, dan formulir alasan wajib (min. 5 karakter).
- **Perubahan Utama:**
  - Skema Validasi: Menambahkan [`overrideLeaveDecisionSchema`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/server/schemas/leave.schema.ts) dengan validasi Zod untuk ID permohonan cuti, enum status tujuan (`APPROVED`, `REJECTED`, `CANCELLED`), dan alasan koreksi tertulis.
  - Helper & Unit Testing: Menambahkan fungsi murni [`getLeaveOverrideImpact`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/packages/shared/src/leave.ts) dan rangkaian unit test di [`packages/shared/src/leave.test.ts`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/packages/shared/src/leave.test.ts) untuk menguji kalkulasi delta saldo (refund vs deduct) dan kebutuhan sinkronisasi presensi.
  - Layanan Bisnis Transaksional: Mengembangkan [`overrideLeaveDecision`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/server/services/leave.service.ts) di dalam `prisma.$transaction`:
    - Transisi ke `APPROVED`: Validasi kecukupan sisa kuota, cek bentrok jadwal (_overlap_) dengan cuti lain, potong `usedDays` di `LeaveBalance`, dan tandai presensi sebagai `LEAVE` pada hari kerja non-libur.
    - Transisi keluar dari `APPROVED` (ke `REJECTED` atau `CANCELLED`): Kembalikan saldo cuti pegawai (`decrement usedDays`) dan bersihkan status presensi `LEAVE` pada rentang tanggal terkait.
    - Pembaruan status permohonan dengan catatan `[Override HR] <alasan>` dan pencatatan audit log `OVERRIDE`.
  - Aksi Server & Revalidasi: Menambahkan [`overrideLeaveDecisionAction`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/server/actions/leave.actions.ts) dengan revalidasi path `/cuti`, `/cuti/persetujuan`, `/cuti/pengaturan`, dan `/absensi`.
  - Komponen UI Persetujuan: Memperkaya [`LeaveApprovalView`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/components/cuti/leave-approval-view.tsx) dengan tombol aksi koreksi serta modal override responsif.
- **Verifikasi Kualitas:**
  - `pnpm typecheck`: ✅ 9/9 package lolos tanpa error
  - `pnpm lint`: ✅ 0 error
  - `pnpm test`: ✅ 54/54 test lolos (100%)
  - Endpoint dev server `/api/health`: ✅ status 200 OK (`{"status":"ok"}`)

---

## Tahap 1: Penyempurnaan Modul Presensi & Saldo Cuti (Opsi A Core HRIS) — 2026-10-05

- **Status:** Selesai
- **Scope:**
  1. Sub-tahap 1A: Ekspor Rekap Presensi Bulanan ke Format Excel Resmi (`.xlsx`) dengan lembar kerja ganda (_Rekap Presensi_ dengan 11 kolom pengukuran + lembar _Parameter & Ketentuan_), terintegrasi ke `/absensi/rekap`, tombol aksi download, dan pencatatan audit log `EXPORT` pada entitas `Attendance`.
  2. Sub-tahap 1B: Manajemen & Penyesuaian Saldo Cuti Pegawai (`LeaveBalance`) di `/cuti/pengaturan` (Tab "Saldo Cuti Pegawai" dengan badge jumlah pegawai, kartu ringkasan kuota/terpakai, pencarian instan, filter divisi, modal interaktif penyesuaian kuota dengan mode `ADD`, `DEDUCT`, `SET`, validasi proteksi sisa cuti, audit log `UPDATE` lengkap dengan alasan wajib, serta unit test terisolasi).
- **Perubahan Utama:**
  - Pustaka Ekspor Excel Presensi: Membuat [`apps/hris/src/lib/attendance-export.ts`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/lib/attendance-export.ts) yang mengonversi data presensi bulanan menjadi workbook Excel rapi dengan sheet ringkasan dan referensi aturan jam kerja.
  - Aksi Server & Audit Ekspor: Menambahkan [`logAttendanceExportAction`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/server/actions/attendance.actions.ts) untuk mencatat aktivitas ekspor presensi oleh admin/manajer ke tabel audit log.
  - Integrasi UI Rekap Presensi: Menambahkan tombol "Ekspor Rekap (.xlsx)" pada [`apps/hris/src/components/absensi/attendance-rekap-view.tsx`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/components/absensi/attendance-rekap-view.tsx).
  - Query Saldo Cuti Pegawai: Menambahkan [`getAllEmployeeLeaveBalances`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/server/queries/leave.queries.ts) yang memuat seluruh saldo cuti tahun berjalan aktif per pegawai lengkap dengan kuota, terpakai, dan sisa.
  - Fungsi Murni & Unit Test: Menambahkan fungsi murni [`calculateAdjustedLeaveQuota`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/packages/shared/src/leave.ts) dan unit test di [`packages/shared/src/leave.test.ts`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/packages/shared/src/leave.test.ts) untuk memvalidasi seluruh mode kalkulasi kuota (`ADD`, `DEDUCT`, `SET`) dan mencegah kuota dipotong di bawah hari yang sudah terpakai.
  - Aksi Server Penyesuaian Saldo: Membuat [`adjustEmployeeLeaveBalanceAction`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/server/actions/leave.actions.ts) dengan validasi izin `hris.leave.configure:all`, input alasan minimal 5 karakter, upsert `LeaveBalance`, audit log perbandingan nilai sebelum/sesudah, dan revalidasi path `/cuti` & `/cuti/pengaturan`.
  - Komponen UI Saldo Cuti: Membangun [`apps/hris/src/components/cuti/employee-leave-balances-view.tsx`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/components/cuti/employee-leave-balances-view.tsx) dan mengintegrasikannya ke tab "Saldo Cuti Pegawai" di [`LeaveSettingsView`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/components/cuti/leave-settings-view.tsx) dan [`apps/hris/src/app/(app)/cuti/pengaturan/page.tsx`](<file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/app/(app)/cuti/pengaturan/page.tsx>).
- **Verifikasi Kualitas:**
  - `pnpm typecheck`: ✅ 9/9 package lolos tanpa error
  - `pnpm lint`: ✅ 0 error
  - `pnpm test`: ✅ 51/51 test lolos (100%)
  - Endpoint dev server `/api/health`: ✅ status 200 OK (`{"status":"ok"}`)

---

## Task: Migrasi Template Impor ke Format Excel Murni (.xlsx) & Panduan Operasional — 2026-10-05

- **Status:** Selesai
- **Scope:** Menggantikan template impor berbasis `.csv` yang bermasalah (terpotong atau menggumpal dalam 1 kolom pada Excel regional Indonesia/Mac) dengan format resmi **Microsoft Excel Workbook (`.xlsx`)** multi-sheet. Menambahkan generator template dinamis dengan data master terkini (divisi, posisi, ikatan kerja), parser file `.xlsx` di browser menggunakan pustaka `xlsx`, pratinjau validasi baris sebelum transaksi, serta buku panduan resmi operasional di web dan dokumen markdown.
- **Perubahan Utama:**
  - Pustaka Excel: Mengintegrasikan `xlsx` (SheetJS) ke `@pspk/hris` untuk pembuatan dan pembacaan berkas Excel murni `.xlsx` dan `.xls`.
  - Generator Template Multi-Sheet: Membuat [`apps/hris/src/lib/excel-templates.ts`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/lib/excel-templates.ts) dengan 3 jenis template:
    1. `template-impor-pegawai-pspk.xlsx` (Sheet: Data Pegawai, Panduan Pengisian, Referensi Master Data)
    2. `template-impor-presensi-pspk.xlsx` (Sheet: Rekap Presensi, Panduan Presensi)
    3. `template-impor-organisasi-pspk.xlsx` (Sheet: Struktur Divisi & Jabatan, Panduan Organisasi)
  - Parser & Komponen Impor: Memperbarui [`apps/hris/src/components/karyawan/excel-importer.tsx`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/components/karyawan/excel-importer.tsx) untuk membaca `.xlsx` biner, validasi kolom fleksibel, deteksi skema upah bulanan/per jam, dan kartu unduh template dengan dropdown.
  - Perbaikan Tampilan Dropdown Template: Memperbaiki kontainer banner kartu unduh agar tidak memotong dropdown menu (`overflow-hidden` diisolasi khusus ke latar belakang dekoratif, menambahkan ref serta event listener klik luar / tombol Escape untuk menutup dropdown secara mulus).
  - Integrasi Data Rekening Bank & Normalisasi HP: Menambahkan ekstraksi kolom Nomor Rekening Bank dari file Excel yang otomatis dienkripsi secara aman dengan algoritma AES-256 (`encryptField`) ke `bankAccountEnc`, serta otomatis menormalisasi nomor telepon/WhatsApp jika angka nol awal terpotong oleh Excel (misal `812...` menjadi `0812...`).
  - Buku Panduan Interaktif di Halaman: Menyediakan tab petunjuk 4 langkah, kamus data 18 kolom, dan referensi nama divisi/ikatan kerja interaktif dengan tombol salin (copy-to-clipboard).
  - Ekstensi Aksi Server: Memperkaya [`importEmployeesBatchAction`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/server/actions/employee.actions.ts) untuk mencocokkan master tipe ikatan kerja (`EmploymentTypeMaster`), tanggal berakhir kontrak PKWT, dan data akun perbankan terenkripsi.
  - Dokumen Panduan: Menyusun panduan operasional komprehensif di [`docs/PANDUAN_IMPOR_DATA.md`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/docs/PANDUAN_IMPOR_DATA.md).
- **Verifikasi Kualitas:**
  - `pnpm typecheck`: ✅ 9/9 package lolos tanpa error
  - `pnpm lint`: ✅ 0 error
  - `pnpm test`: ✅ 47/47 test lolos (100%)
  - `pnpm build`: ✅ Kompilasi Next.js production sukses (0 error)

---

## Task: Pengelolaan Penuh CRUD Tipe Ikatan Kerja (Master Employment Types) — 2026-10-05

- **Status:** Selesai
- **Scope:** Menyediakan modul master data dan antarmuka manajemen CRUD lengkap untuk Tipe Ikatan Kerja pegawai (Pegawai Tetap, PKWT Berjangka, Freelance Upah Per Jam, Magang, dll.) sehingga Admin HR dapat membuat, memperbarui, mengaktifkan/menonaktifkan, serta menghapus/mengarsipkan ikatan kerja secara fleksibel tanpa hardcoding. Terintegrasi penuh ke formulir pendaftaran/edit pegawai, tabel direktori, dan profil pegawai.
- **Perubahan Utama:**
  - Halaman Master Khusus: `/karyawan/ikatan-kerja` (`apps/hris/src/app/(app)/karyawan/ikatan-kerja/page.tsx`) dengan guard otorisasi server-side (`super_admin` & `admin_hr`), kartu ringkasan metrik (Total Ikatan Kerja, Skema Per Jam, Skema Bulanan), dan breadcrumb navigasi.
  - Komponen Manajemen CRUD: `apps/hris/src/components/karyawan/employment-type-management.tsx` dengan fitur pencarian instan, modal tambah & edit tipe dengan validasi kode/nama unik, kategori sistem (`PERMANENT`, `FIXED_TERM`, `PART_TIME_PROJECT`), skema upah (`MONTHLY`, `HOURLY`), tarif acuan per jam, deskripsi, toggle status aktif/nonaktif, dan proteksi hapus (soft-deactivate bila sudah terhubung ke kontrak pegawai).
  - Integrasi Formulir Pegawai (Wizard): `apps/hris/src/components/karyawan/wizard-employee-form.tsx` dilengkapi tombol `+ Tambah Tipe Baru` (modal quick-add in-place dengan auto-select), tautan ke pengaturan master, validasi langkah 3, dan penanganan sinkronisasi upah per jam vs gaji bulanan.
  - Sinkronisasi Kontrak Pegawai: `employee.service.ts` disempurnakan untuk memperbarui/upsert `EmploymentContract` (termasuk `employmentTypeId`, `wageType`, `hourlyRate`) saat pegawai diedit.
  - Penyempurnaan Tampilan Direktori & Profil: `apps/hris/src/components/karyawan/status-badge.tsx`, `employee-table.tsx`, dan `apps/hris/src/app/(app)/karyawan/[id]/page.tsx` diselaraskan agar menampilkan nama tipe ikatan kerja spesifik (`employmentTypeMaster.name`) dan mendukung tarif per jam di tabel riwayat kontrak.
  - Navigasi & Shell: Menu navigasi "Tipe Ikatan Kerja" di `app-sidebar.tsx` dan `app-topbar.tsx`, serta tab switcher di `/karyawan/organisasi`.
- **Verifikasi Kualitas:**
  - `pnpm typecheck`: ✅ 9/9 package lolos tanpa error
  - `pnpm lint`: ✅ 0 error
  - `pnpm test`: ✅ 47/47 test lolos (100%)
  - `pnpm build`: ✅ Kompilasi Next.js production sukses (0 error)

---

## Task: Standarisasi Sidebar Navigasi 2-Tier (Opsi 1) — 2026-10-02

- **Status:** Selesai
- **Scope:** Menyeragamkan dan menata struktur sidebar navigasi di seluruh peran (`admin_hr`, `manager`, `staff`) menggunakan arsitektur 2-Tier yang konsisten: seksi atas untuk tugas operasional/manajerial dan seksi bawah untuk "Layanan Mandiri" (ESS - Employee Self-Service).
- **Perubahan:**
  - `apps/hris/src/components/shell/app-sidebar.tsx`:
    - Mengelompokkan menu Admin HR ke dalam 2 seksi: **Manajemen Organisasi** (badge `HR ADMIN`) dan **Layanan Mandiri** (Profil Saya, Absensi Saya, Cuti Saya, Slip Gaji, Timesheet Saya).
    - Menyeragamkan seksi Manajer: **Manajemen Tim** (badge `LEAD`) dan **Layanan Mandiri**.
    - Merapikan seksi Staf: **Ringkasan** (badge `STAFF`, Beranda) dan **Layanan Mandiri** (termasuk Kinerja Saya).
    - Memperbaiki ketepatan `isNavActive` agar rute `/absensi/rekap`, `/cuti/persetujuan`, `/cuti`, dan `/absensi` tidak tumpang tindih.
  - `apps/hris/src/components/shell/shell-container.tsx`: Meneruskan prop `remainingLeaveDays` ke `AppSidebar`.
  - `apps/hris/src/app/(app)/layout.tsx`: Mengambil sisa saldo cuti tahunan real dari `prisma.leaveBalance` untuk pegawai yang sedang aktif dan meneruskannya ke `ShellContainer`.
  - `apps/hris/src/components/shell/app-topbar.tsx`: Menyelaraskan breadcrumb `getPageTitle()` dengan label menu dan peran aktif.
- **Verifikasi:** `pnpm typecheck` ✅ 9/9 lulus · `pnpm lint` ✅ 0 errors

---

## Task: Tambah `DepartmentType` & `isUnitHead` pada Divisi/Jabatan — 2026-10-02

- **Status:** Selesai
- **Scope:** Menambahkan enum `DepartmentType` (`GOVERNANCE`, `LEADERSHIP`, `INITIATIVE`, `SUPPORT`) dan field `type` (default `INITIATIVE`) pada model `Department`, serta flag `isUnitHead` (default `false`) pada model `Position`.
- **File yang diubah:**
  - `packages/db/prisma/schema/hris.prisma` — tambah enum `DepartmentType`, field `type` di `Department`, field `isUnitHead` di `Position`
  - `packages/db/prisma/migrations/20261002063827_add_department_type_and_unit_head/` — migration baru diaplikasikan
  - `apps/hris/src/server/schemas/organization.schema.ts` — tambah `DepartmentTypeEnum`, `DEPT_TYPE_LABEL`, `TYPE_ORDER`, field `type` di create/update dept schema, `isUnitHead` di create/update pos schema
  - `apps/hris/src/server/services/organization.service.ts` — teruskan `type` dan `isUnitHead` ke Prisma create/update
  - `apps/hris/src/server/queries/employee.queries.ts` — tambah `sortByTypeOrder()`, sort dept, stats `byType`
  - `apps/hris/src/components/karyawan/organization-management.tsx` — full update: badge tipe, filter tipe, modal dept dengan select tipe, modal jabatan dengan toggle `isUnitHead`, badge "Pimpinan Unit" di list jabatan
  - `apps/hris/src/components/karyawan/organization-page-view.tsx` — tambah `byType?` ke stats interface
  - `apps/hris/src/components/karyawan/transfer-position-modal.tsx` — tambah `type?` ke dept interface, tampilkan label tipe di dropdown
- **Keputusan desain:**
  - Data lama otomatis `INITIATIVE` (default Prisma)
  - `parentId` di `Department` tidak diubah/dipakai
  - Sorting divisi: GOVERNANCE → LEADERSHIP → INITIATIVE → SUPPORT, lalu A-Z nama
  - `isUnitHead` di `Position` = Fase B, sudah diimplementasi karena tidak menambah complexity
- **Verifikasi:** `typecheck` ✅ 0 errors · `lint` ✅ 0 errors

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
  - Fitur Pengalih Portal (Slide Switcher): Ditambahkan segmented pill control interaktif di bagian atas untuk berpindah mulus antar _Portal HRIS_ (`:3001/login`) dan _System Management_ (`:3002/login`).
  - Identitas Khas Tiap Portal:
    - **HRIS**: Nuansa aksen emas `#feba48`, label _Akses Masuk Pegawai HRIS_, headline fokus ke manajemen absensi, cuti, dan kepegawaian tim riset PSPK.
    - **System Management**: Nuansa aksen teknologi biru `#60a5fa`, label _Akses Administrator Sistem_, headline fokus ke kontrol hak akses RBAC, inventarisasi aset, dan audit trail.
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
    - UserNav (`user-nav.tsx`): Menampilkan inisial avatar, nama, badge role institusi, dan tombol _Keluar_ terhubung ke Better Auth `signOut()`.
  - **Layout Terproteksi**:
    - `apps/hris/src/app/(app)/layout.tsx`: Memvalidasi sesi Better Auth di server via `getSession(headers)`. Pengguna tanpa sesi otomatis di-redirect ke `/login`.
    - `apps/hris/src/app/page.tsx`: Otomatis me-redirect pengguna ke `/dashboard` jika sudah login atau ke `/login` jika belum.
  - **Dashboard Adaptif Multiperan (`/dashboard`)**:
    - `apps/hris/src/app/(app)/dashboard/page.tsx`: Menggabungkan ketiga rancangan layar Stitch:
      - **Admin HR (P-1A)**: Direktori staf, tombol tambah pegawai & impor data Excel, 3 stat cards (148 pegawai aktif, 5 pengajuan cuti, 32 peneliti lapangan), dan search filter bar.
      - **Manajer (P-1C)**: 4 metrik tim (pending, kapasitas aktif 87.5%, disetujui, respon) dan kartu daftar permohonan cuti anggota tim dengan aksi _Setujui_ dan _Tolak_.
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
  - Aksesibilitas Lintas Portal: Tautan menuju portal _System Management_ ditempatkan rapi di dalam dropdown akun pengguna (`UserNav`).
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
    - `today-attendance-card.tsx`: Jam digital interaktif multi-zona waktu dinamis (auto-detect zona browser seperti WITA/WIT/WIB + dropdown switcher zona waktu mandiri + dual-clock tersinkronisasi Waktu Lokal & Kantor Pusat WIB), konversi jam operasional kantor (09:00–17:00 WIB) ke jam lokal staf, status kehadiran harian, tombol _Catat Kehadiran Masuk_ / _Catat Kehadiran Pulang_, dan catatan kerja. Stempel waktu berbasis `TIMESTAMPTZ` dengan proteksi offset UTC.
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
    - `leave-approval-view.tsx`: Tab navigasi _Menunggu Persetujuan_, _Disetujui_, _Ditolak_, dan _Semua_.
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
    - Tombol **"Buat NIP Otomatis"** berformat `PSPK-YYYYMM-XXX` dan pengecekan duplikasi NIP secara _real-time_ (debounced 350ms) dengan indikator visual dan pencegahan _guard_.
    - Perbaikan isolasi submit multi-step form (mencegah skip/submit saat menekan Enter atau navigasi ke langkah 4).
  - **Master Struktur Organisasi (`/karyawan/organisasi`)**:
    - CRUD Divisi / Departemen (Tambah, Ubah Nama, Hapus aman dengan validasi integritas).
    - CRUD Formasi Jabatan / Posisi Riset (Tambah, Ubah, Hapus aman terikat ke divisi).
    - Tampilan interaktif 2 kolom dengan filter pencarian instan dan kartu metrik statistik organisasi.
    - **Proteksi Integritas Hapus**: Menolak penghapusan divisi atau jabatan yang masih memiliki pegawai aktif di dalamnya.
  - **Manajemen Mutasi & Promosi Pegawai (`/karyawan/[id]`)**:
    - Fitur **"Mutasi / Promosi Jabatan"** pada Tab 4 (_Jabatan & Tim_) di halaman detail pegawai.
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
    - **Admin HR**: Saat mendaftarkan karyawan baru di `/karyawan/baru`, dibatasi hanya memilih peran `staff` atau `manager` (mencegah _privilege escalation_).
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
    - Konfigurasi master tunjangan (_Earnings_) dan potongan (_Deductions_).
    - Pilihan metode kalkulasi: Nominal Tetap (_Fixed_), Persentase dari Gaji Pokok (_Percent of Base_), dan Input Manual.
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
  - Logika kalkulasi: $\text{Upah Jam Kerja} = \text{Total Jam Kerja Valid} \times \text{Tarif per Jam}$. Jika jam kerja 0 (belum ada timesheet), upah Rp 0 (_No Work, No Pay_).
  - Modal `TimesheetInputModal`: Admin HR dapat menginput jam kerja dan melampirkan berkas bukti spreadsheet/PDF yang sudah ditandatangani dan di-acc Project Lead per tanggal 20.
  - Tautan berkas bukti timesheet dapat langsung diunduh dari tabel maupun modal slip gaji melalui rute streaming aman `/api/documents/[...path]`.
  - Audit log tercatat otomatis untuk setiap pembaruan timesheet (`UPDATE PayslipTimesheet`).
  - Arsitektur _future-proof_: saat modul pengisian timesheet mandiri staf dibangun di web HRIS, sistem payroll siap mengambil jam terverifikasi otomatis.

## Modul Kinerja & Riset (Role Admin HR — Layar P-H20)

- **Status:** Selesai (Completed)
- **Capaian:**
  - **Manajemen Siklus Periode Kinerja (`PerformancePeriod`)**:
    - Alur status: Buka Pengisian (`OPEN`) $\leftrightarrow$ Kunci/Selesai (`CLOSED`).
    - Modal pembuatan periode baru (`PerformancePeriodModal`) yang secara otomatis menginisialisasi draf penilaian untuk seluruh pegawai aktif di organisasi dan menetapkan atasan langsung sebagai penilai utama.
    - Periode awal terisi: _"Semester Ganjil 2026 — Riset & Advokasi Kebijakan"_.
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
    - Tampilan komparasi berdampingan (_Side-by-Side_): Evaluasi Diri Staf (skor + refleksi mandiri) vs Penilaian Atasan (skor + catatan rekomendasi manajer).
    - Fitur Finalisasi & Kunci Skor (_Locking_) resmi oleh Admin HR/Pimpinan (`finalizePerformanceReviewAction`).
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
  - _Portal Karyawan (Staff View)_: Mengembangkan antarmuka penyusunan target OKR mandiri dan pengisian form refleksi diri (_Self-Review_).
  - _Portal Manajer (Manager View)_: Mengembangkan antarmuka penilaian bawahan langsung bagi kepala divisi riset (_Manager-Review_).
  - _Integrasi Payroll_: Menghubungkan skor kinerja final semesteran sebagai variabel pengali bonus tahunan atau penyesuaian gaji berkala bila disepakati HR.

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
    - Badge hitungan notifikasi belum dibaca (_Unread Count Badge_) dengan animasi berdenyut dinamis.
    - Panel popover memuat 5 notifikasi terbaru, ikon kategori, badge tipe, waktu relatif format Bahasa Indonesia (`formatRelativeTime`), dan tombol "Tandai Semua Dibaca".
    - Navigasi instan ke halaman penuh via tautan _"Lihat Semua Notifikasi"_.
  - **Halaman Pusat Notifikasi Mandiri (`/notifikasi` — Layar P-C3)**:
    - Desain premium mengikuti PSPK Design System (Navy `#102E50`, Gold `#F2AF3E`, Maroon `#A8281C`, font Lora & Rubik).
    - **Pengelompokan Kronologis**: "Hari Ini", "Kemarin", dan "Sebelumnya" dengan pemisah seksi yang rapi.
    - **Filter Multi-dimensi**:
      - Tab status: "Semua" vs "Belum Dibaca".
      - Filter kategori (pills): Cuti, Presensi, Penggajian, Kinerja, Kontrak, Sistem beserta penghitung dinamis.
      - Bilah pencarian instan: Filter real-time judul atau isi pesan notifikasi.
    - **Kartu Metrik Ringkasan**: Total Notifikasi, Belum Dibaca, Cuti/Presensi, dan Payroll/Kinerja.
    - **Aksi Cepat & Optimistic UI**: Tombol "Tandai Semua Dibaca" dan per-item "Tandai Dibaca" yang memperbarui antarmuka secara instan.
    - **Deep Linking**: Tautan langsung _"Lihat Dokumen Terkait"_ yang mengarahkan pengguna ke modul target (mis. `/cuti`, `/kinerja`, `/slip-gaji`).
    - **Empty State Elegan**: Tampilan ramah ketika tidak ada notifikasi yang cocok dengan kriteria pencarian/filter.
  - **Integrasi Pemicu (_Event Triggers_) Lintas Modul**:
    - _Modul Cuti_: Pengajuan cuti baru mengirim notifikasi `ACTION_REQUIRED` ke Manajer atasan dan Admin HR; Persetujuan/penolakan cuti mengirim notifikasi ke pegawai pemohon.
    - _Modul Payroll_: Publikasi siklus gaji (`publishPayrollAction`) mengirim notifikasi `SUCCESS` ke seluruh karyawan penerima slip gaji dengan tautan ke `/slip-gaji`.
    - _Modul Kinerja_: Pembukaan periode review baru mengirim notifikasi ke seluruh staf aktif; Finalisasi evaluasi kinerja mengirim notifikasi ke pegawai terkait.
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
      - Menampilkan status portal aktif (_Sedang Aktif_).
      - Menampilkan peran akun saat ini.
      - Deteksi hak akses: Jika akun adalah `super_admin` atau `admin_it`, portal _System Management_ dapat diklik untuk beralih. Jika akun adalah staf/manajer biasa tanpa wewenang TI, opsi _System Management_ ditampilkan dalam keadaan nonaktif dengan badge gembok dan keterangan _"Khusus Admin TI"_.
    - **`NotFoundView` (404)**: Tampilan halaman tidak ditemukan dengan ikon garis `Compass`, badge status `404`, headline Lora, pesan ramah, tombol _"Kembali ke Beranda"_, dan tombol _"Halaman Sebelumnya"_.
    - **`ForbiddenView` (403)**: Tampilan akses ditolak dengan ikon garis `ShieldAlert`, badge status `403` marun (`#A8281C`), rincian peran akun saat ini vs wewenang yang dibutuhkan, tombol _"Kembali ke Beranda"_, dan petunjuk eskalasi ke administrator.
    - **`ServerErrorView` (500)**: Tampilan error boundary dengan ikon `AlertTriangle`, tombol _"Coba Muat Ulang"_ (`reset()`), dan kode referensi digest.
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
    - Sinkronisasi URL Hash: navigasi tab otomatis membaca dan memperbarui hash (`#identitas`, `#keamanan`, `#sesi`). Tautan cepat dropdown _"Ganti Kata Sandi"_ (`/profil#keamanan`) langsung membuka formulir keamanan.
  - **Komponen & Desain**:
    - **Header Profil**: Banner gradient PSPK Navy (`#102E50`), container avatar dengan tombol unggah foto kamera interaktif, nama lengkap Lora, email resmi, jabatan, departemen, serta deretan lencana peran sistem RBAC.
    - **Tab 1: Identitas & Kepegawaian** (`ProfileInfoTab`):
      - Kartu resmi kepegawaian PSPK: NIP, nama lengkap KTP/SK, nama panggilan, email kerja, nomor kontak WhatsApp, departemen/divisi riset, jabatan/posisi, jenis hubungan kerja (PKWTT/PKWT/Magang), status kepegawaian, tanggal bergabung (_join date_), dan penghitungan otomatis masa kerja (tenure).
      - Kartu akun sistem & RBAC: email login, status akun, tanggal pendaftaran, dan daftar wewenang/peran.
      - Penanganan khusus untuk akun pengelola murni tanpa data kepegawaian internal HRIS dengan kartu penjelasan yang informatif.
    - **Tab 2: Keamanan & Kata Sandi** (`ChangePasswordTab`):
      - Formulir ganti kata sandi dengan input sandi saat ini, sandi baru, dan konfirmasi sandi dengan tombol tampilkan/sembunyikan (_toggle visibility_).
      - _Password Strength Meter_: Visualisasi kekuatan kata sandi 4 tingkat (_Lemah_, _Cukup_, _Kuat_, _Sangat Kuat_) dengan indikator warna dinamis.
      - _Security Criteria Checklist_ Real-time: Minimal 12 karakter, huruf besar & kecil, angka, karakter simbol khusus, dan kecocokan konfirmasi sandi.
      - Fitur Pemutusan Sesi Otomatis: Mengubah kata sandi secara otomatis memutuskan seluruh sesi aktif di perangkat lain (_revoke other sessions_) demi keamanan akun.
    - **Tab 3: Riwayat Sesi Aktif** (`SessionHistoryTab`):
      - Menampilkan seluruh sesi aktif dari tabel `core.sessions`.
      - Pengurai User-Agent cerdas: Mendeteksi jenis perangkat (Laptop/Desktop vs Ponsel Pintar), sistem operasi (macOS, Windows, Linux, Android, iOS), dan peramban web (Chrome, Safari, Firefox, Edge, Opera).
      - Menampilkan alamat IP klien, waktu login awal (_relative & exact_), masa berlaku sesi, dan badge pembeda hijau _"Sesi Perangkat Ini"_ vs _"Perangkat Terhubung"_.
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
      1. 📋 _Rekap Kehadiran_ (`/absensi/rekap`) — Akses Admin HR, Super Admin, dan Manajer (monitoring presensi seluruh staf lembaga, filter divisi/periode, dan modal koreksi absensi manual HR).
      2. ⏱️ _Presensi Saya_ (`/absensi`) — Jam server real-time WIB, kartu check-in/out hari ini, dan riwayat presensi harian.
      3. 🏖️ _Cuti Saya_ (`/cuti`) — Saldo kuota cuti tahunan 2026 dan riwayat permohonan izin kerja.
      4. ✅ _Persetujuan Cuti_ (`/cuti/persetujuan`) — Verifikasi permohonan cuti tim/organisasi dengan badge dinamis jumlah pengajuan pending.
      5. 📅 _Kalender Cuti_ (`/cuti/kalender`) — Kalender bulanan jadwal cuti bersama dan hari libur nasional resmi.
      6. ⚙️ _Pengaturan Kuota & Libur_ (`/cuti/pengaturan`) — Pengelolaan master tipe cuti dan hari libur lembaga khusus Admin HR & Super Admin.
  - **Penyelarasan Sidebar (`app-sidebar.tsx`)**:
    - Menu _"Kehadiran & Cuti"_ untuk Admin HR kini langsung mengarahkan ke `/absensi/rekap` sebagai halaman kerja operasional utama HR.
    - Status aktif (`isActive`) menyala ketika pengguna berada di seluruh sub-rute `/absensi*` maupun `/cuti*`.
  - **Penyelarasan Breadcrumbs (`app-topbar.tsx`)**:
    - Breadcrumb pada header secara konsisten menampilkan kategori _"Kehadiran & Cuti"_ untuk semua sub-halaman di bawah `/absensi` dan `/cuti`.
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
- **Deskripsi:** Menghilangkan seluruh nilai jam kerja dan toleransi yang sebelumnya di-hardcode. Kini Admin HR dan Super Admin dapat mengonfigurasi jam masuk kerja resmi, jam pulang, toleransi keterlambatan (_grace period_), hari kerja aktif, dan jam fleksibel secara dinamis dengan audit log lengkap.
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
      - Quick preset buttons untuk toleransi: _0 Menit (Ketat)_, _5 Menit_, _10 Menit_, _15 Menit (Standar PSPK)_, _30 Menit_.
      - Pilihan interaktif hari kerja aktif organisasi (Senin - Minggu) beserta tombol cepat 5 hari & 6 hari kerja.
      - _Live Simulator & Timeline_: Menghitung otomatis batas tepat waktu, total durasi kerja harian, dan simulator uji coba jam check-in interaktif.
  - **Sinkronisasi Antarmuka Karyawan (`/absensi`)**:
    - Kartu `TodayAttendanceCard` dan ringkasan bulanan di `apps/hris/src/app/(app)/absensi/page.tsx` menampilkan jadwal kerja kantor dan batas toleransi tepat waktu secara dinamis dari database.

---

## Peningkatan Multi-Zona Waktu (WIB, WITA, WIT) & Presensi Terdistribusi

- **Status:** Selesai (Completed)
- **Implementasi:**
  - **Perbaikan Format Jam Dinamis (`@pspk/shared/formatters.ts`)**:
    - Memperbaiki bug pada `formatTimeInZone` dan `formatDateInZone` di mana `timeZone` tertimpa jika `options` dikirim, menyebabkan jam digital tetap membaca waktu lokal browser alih-alih zona yang dipilih pada _dropdown_.
    - Menambahkan unit test di `formatters.test.ts` memverifikasi ketepatan perbedaan jam WIB, WITA, dan WIT. Total 41 unit tests lulus 100%.
  - **Tagging Metadata Zona Presensi (`TodayAttendanceCard`)**:
    - Tombol _Masuk Kerja (Check-In)_ dan _Pulang Kerja (Check-Out)_ otomatis menyematkan metadata zona waktu asal (mis. `[WITA]`) ke dalam `Attendance.notes` dan `core.audit_logs`.
  - **Tampilan Waktu Ganda (_Dual-Time Display_) (`AttendanceTable`)**:
    - Kolom Jam Masuk dan Jam Pulang pada tabel riwayat absensi kini menampilkan waktu dalam zona lokal karyawan (`13:20 WITA`) dan di bawahnya menyertakan konversi waktu kantor pusat (`12:20 WIB`) jika staf berada di luar zona WIB.
    - Menghilangkan potensi salah paham (_dispute_) antara staf remote dan admin HR di kantor pusat Jakarta.
  - **Refactoring Layout Kartu Presensi & Tombol (`TodayAttendanceCard` & `/absensi`)**:
    - **Penyebab masalah sebelumnya**: Pada halaman `/absensi`, komponen `TodayAttendanceCard` ditempatkan dalam kolom sempit 5-span (`lg:col-span-5` ~400px), sehingga flex horizontal menyebabkan teks tombol `"Masuk Kerja (Check-In)"` patah menjadi 4 baris sempit dan tombol catatan tertekan.
    - **Perubahan Arsitektur Tampilan (Sesuai Blueprint P-H9)**:
      - Menjadikan `TodayAttendanceCard` sebagai kartu _Hero_ mandiri satu layar penuh (`col-span-12`) di bagian paling atas.
      - Bagian atas kartu memuat _Meta Bar_ elegan: tanggal, pemilih zona waktu (_timezone dropdown_), serta lencana status kehadiran (_Status Pill_) di pojok kanan.
      - Bagian tengah memisahkan secara proporsional antara panel jam digital tabular besar + konteks jadwal kantor di sebelah kiri, dan panel aksi presensi di sebelah kanan.
      - Tombol aksi utama (_Check-In_ / _Check-Out_) diberi aturan `whitespace-nowrap` dan `min-w-[210px]`, sehingga teks tidak akan pernah terpotong atau terlipat di layar mana pun.
      - Tombol catatan (_+ Catatan_) ditingkatkan dari sekadar tautan teks tipis menjadi tombol sekunder berbentuk _pill_ yang rapi dengan ikon `FileText` dan input terintegrasi yang bersih.
      - Di bawah kartu utama, ringkasan statistik bulanan (4 kartu metrik) dan kartu ketentuan jam kerja disandingkan secara seimbang dalam grid 8-4.
    - **Berlaku di Semua Peran**: Perbaikan ini otomatis mempercantik tampilan presensi untuk seluruh peran (Staff, Manajer pada _dashboard_ mereka, HR Admin, dan Super Admin).
  - **Hasil Uji & Kualitas**:
    - `pnpm typecheck`: 9/9 packages lolos (0 error).
    - `pnpm test`: 41 unit tests lolos (100%).
    - `pnpm lint`: Lolos (0 error).
    - `pnpm build`: Standalone build berhasil.

---

## Audit Menyeluruh & Standardisasi Penanganan Zona Waktu Lintas Modul

- **Status:** Selesai (Completed)
- **Tujuan:** Memastikan seluruh modul penting (Presensi, Cuti, Kalender, Jadwal Kerja, Dasbor Multiperan, Log Audit, Koreksi HR, dan Karyawan) bebas dari masalah pergeseran tanggal/waktu (_timezone shift_ / _offset bug_).
- **Temuan & Perbaikan yang Diterapkan:**
  1. **Dasbor Eksekutif HR (`apps/hris/src/server/queries/dashboard/hr-dashboard.ts`)**:
     - _Masalah_: Angka "Hadir Hari Ini" bernilai 0 dan grafik 7 hari kosong untuk hari aktif meskipun staf dan HR telah presensi.
     - _Penyebab_: `today.setHours(0, 0, 0, 0)` menghasilkan tengah malam lokal (WITA = `16:00:00.000Z` kemarin), sedangkan baris presensi tersimpan dengan tanggal UTC (`00:00:00.000Z`).
     - _Solusi_: Menggunakan `toDateString(new Date())` dan `new Date(todayStr)` untuk mencocokkan tanggal UTC secara presisi, serta menyelaraskan perhitungan grafik 7 hari dan filter status kehadiran (`PRESENT`, `LATE`, `WFH`).
  2. **Dasbor Manajer (`apps/hris/src/server/queries/dashboard/manager-dashboard.ts` & `components/dashboard/manager-dashboard.tsx`)**:
     - Memperbaiki perhitungan kalender mingguan (Senin–Jumat) menggunakan `getUTCDay()`, `setUTCDate()`, dan `timeZone: "UTC"`.
     - Menggantikan komparasi `toISOString().split("T")[0]` dengan `toDateString(d)` untuk memastikan highlight hari aktif (_isToday_) tidak melompat sebelum jam 07:00 pagi.
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

## Penyesuaian Hak Akses Tombol Pengalih Portal (_App Switcher & User Nav_)

- **Status:** Selesai (Completed)
- **Implementasi:**
  - **Prinsip RBAC**: Tombol _AppSwitcher_ (`Portal HRIS AKTIF ^`) dan tautan `System Management` di dropdown profil (`UserNav`) kini **hanya muncul bagi akun yang memang memiliki hak akses** (`super_admin` atau `admin_it`).
  - **Penyembunyian Bersih untuk Peran Non-IT**:
    - Akun dengan peran `admin_hr` (seperti Dewi Permata), `manager`, dan `staff` tidak lagi melihat tombol pengalih portal maupun item menu `System Management`.
    - Menghilangkan dropdown tidak perlu yang sebelumnya menampilkan item terkunci (_lock_ "Khusus Admin TI").
    - Mengintegrasikan pemeriksaan hak akses `canAccessSysmgmt` dari layout HRIS ke `AppTopbar` dan `UserNav`, serta `canAccessHris` di `SysmgmtNavbar`.
- **Hasil Uji & Kualitas**:
  - `pnpm test`: 42/42 unit test lulus (100%).
  - `pnpm typecheck`: 9/9 package lolos tanpa error.

## Modul Kinerja & Riset — Implementasi Role Staf (Self-Review & Scorecard)

- **Status:** Selesai (Completed)
- **Tujuan:** Membuka akses evaluasi kinerja untuk peran Staf (Karyawan & Peneliti) dengan alur pengisian mandiri (_self-review_), peninjauan realisasi sasaran riset (OKR), visual stepper status, dan lembar rapor resmi (_scorecard_).
- **Rincian Implementasi:**
  1. **Validasi Skema Zod (`performance.schema.ts`)**:
     - `submitStaffSelfReviewSchema`: Validasi ID review, skor mandiri (0–100), teks refleksi minimal 10 karakter, dan array capaian aktual target kerja (`goalActuals`).
  2. **Kueri Data Staf (`performance.queries.ts`)**:
     - `getStaffPerformanceReview`: Mengambil review aktif, data atasan penilai, daftar sasaran riset (`PerformanceGoal`) beserta bobot %, kalkulasi kelengkapan bobot, dan predikat dinamis. Otomatis membuat draf review jika belum ada saat periode `OPEN`.
     - `getStaffPerformancePeriods`: Mengambil riwayat periode evaluasi lampau yang diikuti oleh pegawai untuk arsip dan dropdown periode.
  3. **Server Action Terproteksi (`performance.actions.ts`)**:
     - `submitStaffSelfReviewAction`:
       - _Server-Side Authorization & Ownership Check_: Memvalidasi sesi, permission `hris.performance.review:own`, dan memastikan review milik pegawai bersangkutan (`review.employeeId === session.employeeId`).
       - Validasi status transaksi: status review harus `DRAFT` dan periode harus `OPEN`.
       - Database transaction: memperbarui `actual` pada `PerformanceGoal`, menyimpan `selfScore` & `selfComment`, dan mengubah status ke `SELF_REVIEW`.
       - _Audit Log_: Mencatat `writeAudit` dengan aksi `SUBMIT_SELF_REVIEW`.
       - _Notifikasi In-App_: Mengirimkan notifikasi ke atasan penilai (`reviewerId`) bahwa staf telah menyelesaikan evaluasi mandiri.
  4. **Antarmuka Pengguna Interaktif (UI)**:
     - `StaffSelfReviewForm`: Formulir interaktif pengisian capaian per sasaran riset, slider & input numerik skor mandiri 0–100 dengan badge predikat dinamis (_Sangat Baik_, _Baik_, _Cukup_, _Perlu Peningkatan_), textarea refleksi diri, dan dialog konfirmasi sebelum submit.
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
- **Konteks:** Perubahan atasan langsung (_manager_) di tengah kontrak kerja yang sedang berjalan oleh Admin HR melalui form ubah pegawai (`/karyawan/[id]/ubah`).
- **Rincian Implementasi:**
  1. **Sinkronisasi Dinamis & Notifikasi Otomatis (`employee.service.ts`)**:
     - Deteksi otomatis perubahan atasan (`isManagerChanged` antara `data.managerId` dan `current.managerId`).
     - Notifikasi in-app otomatis dikirim ke akun staf bersangkutan (`core.Notification`):
       _"Pembaruan Atasan Langsung: Atasan langsung Anda telah diperbarui menjadi [Nama Atasan] ([Jabatan]). Seluruh koordinasi dan proses evaluasi kinerja kini terhubung ke atasan baru."_
     - Notifikasi in-app otomatis dikirim ke atasan baru:
       _"Penetapan Anggota Tim Baru: [Nama Pegawai] kini telah ditetapkan berada di bawah supervisi/koordinasi Anda."_
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
     - Seluruh data dikonversi secara aman ke _plain serializable object_ (termasuk `Number(l.days)`) bebas error serialization Next.js.
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
       - Mengatasi pemotongan nama satu huruf (mis. _"I Made"_ bukan hanya _"I"_).
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

## Peningkatan UX & Keamanan: Profil Atasan Langsung & Breadcrumb Staf

- **Tanggal Selesai**: 30 September 2026
- **Status**: Selesai ✅
- **Latar Belakang & Masalah**:
  - Tombol pada kartu _Atasan Langsung_ di dashboard staf sebelumnya mengarah ke `/profil` (profil sendiri), membingungkan karyawan. Di sisi lain, halaman `/karyawan/[id]` memuat data sensitif (gaji, rekening, NIK) yang tidak boleh diakses oleh staf.
  - Teks breadcrumb topbar staf di `/dashboard` sebelumnya menampilkan `Profil Saya & Portofolio` padahal menu sidebar aktif adalah `Beranda`.
- **Implementasi**:
  1. **Prisma Safe DTO (`staff-dashboard.ts`)**:
     - Memperluas query `manager` di `getStaffDashboard` hanya untuk field non-sensitif: `nickname`, `workEmail`, `phone`, `photoKey`, `status`, `currentDepartment.name`, `currentPosition.title`.
     - Data sensitif (`nikEnc`, `bankAccountEnc`, `salaryComponents`, dll.) terproteksi di tingkat database query (zero-leakage).
  2. **Komponen Modal Kontak Atasan (`supervisor-profile-modal.tsx`)**:
     - Modal interaktif dengan identitas brand PSPK (Navy & Gold), menampilkan avatar, nama, NIP, status aktif, jabatan, divisi, dan saluran komunikasi resmi (email kerja dengan tombol salin & kirim, telepon/WA).
     - Penjelasan peran atasan sebagai approver cuti & penilai kinerja.
     - Proteksi keyboard ESC dan backdrop click.
  3. **Integrasi Dashboard Staf (`staff-dashboard.tsx`)**:
     - Mengubah tombol di kartu atasan menjadi `Lihat Profil Atasan` yang membuka modal interaktif secara mulus tanpa berpindah halaman.
  4. **Penyelarasan Breadcrumb (`app-topbar.tsx`)**:
     - Menyelaraskan breadcrumb staff di `/dashboard` menjadi `Beranda`.
- **Hasil Verifikasi**:
  - `pnpm typecheck` lolos 9/9 package.
  - `pnpm lint` lolos dengan 0 error.
  - `pnpm test` lolos 45/45 unit test.
  - `pnpm build` sukses standalone build untuk `@pspk/hris` dan `@pspk/sysmgmt`.

---

## Modul Slip Gaji Mandiri Karyawan (Role Staf)

- **Tanggal Selesai**: 30 September 2026
- **Status**: Selesai ✅
- **Fokus Prioritas**: Role Staf (Self-service Slip Gaji, Keamanan Data Finansial, Arsip Digital & Siap Cetak A4)
- **Implementasi**:
  1. **Helper Terbilang Angka Rupiah (`packages/shared/src/formatters.ts`)**:
     - Fungsi `angkaTerbilang(amount)` mengonversi nominal gaji ke teks bahasa Indonesia resmi (misal: `"Tiga Juta Enam Ratus Ribu Rupiah"`).
     - Teruji dengan 2 unit test baru di `formatters.test.ts` (total 47 unit test hijau).
  2. **Query Server-Side Terisolasi (`payslip.queries.ts`)**:
     - `getMyPayslips`: Membaca seluruh arsip slip gaji milik karyawan bersangkutan dengan batasan mutlak status `PUBLISHED` atau `LOCKED`. Slip yang masih berstatus `DRAFT`/`CALCULATED`/`APPROVED` di modul HR terisolasi dan tidak bocor ke staf.
     - `getMyPayslipDetail`: Mengambil rincian pendapatan (_Earnings_) dan potongan (_Deductions_), serta menerapkan _masking_ nomor rekening bank (misal: `BCA •••• 5678`).
     - Server Action `getMyPayslipDetailAction` di `payslip.actions.ts`.
  3. **Komponen Antarmuka Daftar Slip Gaji (`payslip-list-view.tsx`)**:
     - 3 Kartu Metrik Utama (_Hero Cards_): Slip Gaji Terakhir, Akumulasi Bersih YTD, dan Total Dokumen Tersedia.
     - Filter Bar interaktif: filter tahun dinamis dan filter jenis (_Gaji Reguler_ / _THR_).
     - Tabel arsip slip gaji dengan status badge, rincian bruto, potongan, dan nominal bersih (_Take Home Pay_).
     - _Empty State_ ramah jika belum ada slip yang dipublikasikan.
  4. **Komponen Modal Slip Gaji Resmi & Siap Cetak (`payslip-printable-modal.tsx`)**:
     - Standar format dokumen resmi berlogo & berkop surat PSPK (_Pusat Studi Pendidikan dan Kebijakan_).
     - Badge kerahasiaan `RAHASIA / CONFIDENTIAL`.
     - Tabel 2 kolom terstruktur: Penerimaan (_Earnings_) vs Potongan (_Deductions_).
     - Kotak _Take Home Pay_ tebal dengan kalimat terbilang rupiah.
     - Fitur **Cetak / Unduh PDF** yang siap cetak selembar A4 (`@media print` CSS otomatis menyembunyikan sidebar dan backdrop modal).
  5. **Rute Server Component (`apps/hris/src/app/(app)/slip-gaji/page.tsx`)**:
     - Terhubung dengan proteksi sesi Better Auth & permission `hris.payslip.read:own`.
  6. **Integrasi Widget Beranda Staf (`staff-dashboard.tsx`)**:
     - Kartu _Slip Gaji Terbaru_ di dashboard staf kini dinamis menampilkan nominal _Take Home Pay_ jika ada slip terbit dan tautan mulus ke `/slip-gaji`.
  7. **Penyempurnaan Kontrak PKWT Per Jam (Timesheet)**:
     - Menampilkan skema kontrak "PKWT Per Jam", total jam kerja disetujui HR (`totalHours`), dan tarif per jam (`hourlyRate`) pada grid data slip gaji.
     - Menambahkan banner informatif _Dasar Perhitungan Timesheet HR_ pada dokumen cetak slip gaji (`{totalHours} Jam × {hourlyRate}/jam = {subtotal}`).
     - Menambahkan badge jam kerja pada tabel riwayat slip dan kartu ringkasan slip terbaru.
  8. **Perbaikan Cetak / PDF Slip Gaji (Fix Blank White Page)**:
     - **Akar Masalah:** Sebelumnya menggunakan `visibility: hidden` pada `body *` di dalam modal bersarang yang memiliki `position: fixed`, `overflow-y: auto`, `max-height`, dan `overflow: hidden`. Hal ini menyebabkan browser tetap menghitung dimensi konten halaman latar belakang (~2 lembar kosong) dan memotong (_clip_) elemen slip gaji menjadi kosong (blank putih).
     - **Solusi Arsitektur:**
       - Memindahkan rendering modal ke level `document.body` menggunakan React `createPortal` (`#payslip-modal-portal`) dengan proteksi hidrasi `useSyncExternalStore`.
       - Menambahkan CSS `@media print` terpusat di `apps/hris/src/app/globals.css` dengan aturan `@page { size: A4 portrait; margin: 8mm 10mm; }`.
       - Menggunakan `body.payslip-modal-open > *:not(#payslip-modal-portal) { display: none !important; }` sehingga seluruh shell aplikasi latar belakang benar-benar dihilangkan dari dokumen cetak (0 lembar tambahan).
       - Menghilangkan pembatasan `overflow`, `max-height`, bayangan, dan transform dialog saat dicetak, serta mengaktifkan `print-color-adjust: exact !important` untuk menjaga akurasi warna brand, logo, kop, stempel, dan tanda tangan elektronik.
       - Memastikan seluruh dokumen slip gaji pas secara rapi dalam **1 lembar kertas A4**.
     - **Penyempurnaan 1 Halaman A4 & Solusi Urutan Terbalik (2 Halaman):**
       - **Penyebab:** Pada browser Chromium/Chrome, saat pengguna men-scroll modal slip gaji ke bawah sebelum menekan tombol cetak, elemen `#printable-payslip-sheet` memiliki nilai `scrollTop > 0`. Saat dialog cetak aktif, browser mulai mencetak dari posisi scroll tersebut ke Halaman 1 (bagian bawah slip gaji), sementara sisa konten atas (Kop Surat & Header) berbalik (_wrap_) ke Halaman 2. Selain itu, lebar cetak A4 (~718px) berada di bawah breakpoint `md` (768px), menyebabkan tabel penerimaan dan potongan tertumpuk ke bawah menjadi 1 kolom.
       - **Solusi & Perbaikan:**
         - Menambahkan reset scroll otomatis (`scrollTop = 0`) pada container slip gaji dan seluruh elemen wrapper sebelum `window.print()` dijalankan dan pada event `beforeprint`.
         - Mengunci tata letak 2 kolom berdampingan secara eksplisit pada `@media print` untuk rincian pendapatan & potongan (`.payslip-breakdown-grid`) serta ringkasan informasi karyawan (`.payslip-info-grid`).
         - Merampingkan padding dan jarak vertikal (`margin-top: 5px !important`), serta menetapkan `break-inside: avoid !important; page-break-inside: avoid !important;` pada seluruh sheet dokumen.
         - Total tinggi dokumen menjadi ~400px (jauh di bawah batas printable area A4 ~1060px), menjamin slip gaji tercetak utuh dalam **tepat 1 lembar A4**.
- **Hasil Verifikasi**:
  - `pnpm typecheck` lolos 9/9 package (0 error).
  - `pnpm lint` lolos dengan 0 error.
  - `pnpm test` lolos 47/47 unit test (100%).
  - `pnpm build` sukses mengompilasi rute `/slip-gaji` dalam mode Next.js standalone.

---

## Pengaturan Dokumen & Rekening Bank Operasional Penggajian PSPK

- **Status:** Selesai (Completed)
- **Implementasi:**
  1. **Model Prisma & Migrasi (`hris.payroll_settings`)**:
     - Model `PayrollSetting` menyimpan konfigurasi identitas dokumen lembaga (`institutionName`, `subHeader`, `addressLine`, `logoKey`, `headerBannerKey`, `borderStyle`, `disclaimerText`).
     - Menyimpan konfigurasi rekening bank operasional penyalur gaji PSPK (`senderBankName`, `senderBankAccountEnc` dengan enkripsi AES-256-GCM, `senderAccountName`, `senderBranch`, `payrollTransferNote`).
     - Pejabat penandatangan resmi dokumen (`authorizedSignerName`, `authorizedSignerTitle`).
     - Migrasi Prisma `20260930053530_add_payroll_settings` diaplikasikan ke database lokal.
     - Idempotent seed default PSPK (BCA Giro Operasional PSPK terenkripsi) di `packages/db/prisma/seed.ts`.
  2. **Lapisan Server & Keamanan Finansial**:
     - Query `getPayrollSettings()` dengan dekripsi aman dan masking digit rekening (`•••• 3456`).
     - Server Actions `updatePayrollSettingsAction()` dengan validasi Zod, proteksi hak akses Admin HR & Super Admin, serta pencatatan audit trail ke `core.audit_logs`.
     - Server Actions `uploadPayrollBrandingAction()` dan `deletePayrollBrandingAction()` untuk upload logo institusi & header banner kop surat via `@pspk/storage` (maks. 2 MB, validasi MIME gambar).
  3. **Antarmuka Pengaturan HR (`/payroll/pengaturan`)**:
     - Tab 1: **Rekening Bank Pengirim** — pemilih bank populer / kustom, nomor rekening dengan tombol toggle sembunyikan/lihat digit asli, atas nama lembaga, kantor cabang, dan catatan transfer default.
     - Tab 2: **Kop & Desain Dokumen Resmi** — 4 preset garis border kop surat (_Navy Solid_, _Navy & Gold Accent_, _Double Line_, _Clean Minimalist_), upload logo PNG/JPG/WEBP, upload banner kop memanjang, nama lembaga, alamat kantor, pejabat penandatangan, dan disclaimer legalitas.
     - **Live Preview Real-Time (`payroll-document-preview.tsx`)** — panel simulasi dokumen cetak A4 mini yang langsung merespons setiap perubahan form secara visual.
     - Tombol akses cepat _"Pengaturan Dokumen & Bank"_ pada header utama `/payroll`.
  4. **Integrasi Dinamis ke Slip Gaji Karyawan (`PayslipPrintableModal`)**:
     - Modal slip gaji staf membaca dan menerapkan logo kustom, banner kop jika ada, nama lembaga dinamis, gaya border kop yang dipilih HR, informasi bank penyalur resmi PSPK, penandatangan resmi, dan teks disclaimer.
  5. **Peningkatan Resiliensi Prisma Dev Mode (`@pspk/db`)**:
     - Menambahkan dynamic `Proxy` pada singleton `prisma` di mode development: jika model baru (seperti `payrollSetting`) diakses sebelum proses server di-restart, Proxy secara otomatis mendeteksi ketiadaan properti dan menginisialisasi ulang instance PrismaClient segar ke `globalThis.prisma`.
  6. **Upload Tanda Tangan Digital & Stempel Resmi Lembaga**:
     - Kolom `signature_key` dan `stamp_key` pada skema `hris.payroll_settings` via migrasi `20260930061010_add_signature_and_stamp_to_payroll_settings`.
     - Fitur upload & hapus gambar tanda tangan (PNG transparan) dan stempel basah resmi lembaga di tab pengaturan HR.
     - Tampilan terintegrasi dan live preview: stempel lembaga dan tanda tangan tampil berpadu secara proporsional dan elegan di atas nama pejabat penandatangan baik di layar web maupun pada cetak PDF/kertas A4.
- **Hasil Verifikasi**:
  - `pnpm typecheck` lolos 9/9 packages (0 error).
  - `pnpm lint` lolos dengan 0 error.
  - `pnpm test` lolos 47/47 unit test (100%).
  - `pnpm build` sukses mengompilasi rute baru `/payroll/pengaturan` dan seluruh rute dalam mode Next.js standalone.

---

## Manajemen Anggota Tim Saya (Manajer / Lead Divisi) — Tahap 1 & 2

- **Status:** Selesai (Tahap 1 & 2 dari 3)
- **Implementasi:**
  1. **Tahap 1 — Ekstensi Parameter Query `getEmployeesDirectory`**:
     - Menambahkan parameter `teamManagerId?: string`, `managerDepartmentId?: string`, dan `excludeEmployeeId?: string` pada `GetEmployeesParams`.
     - Menyusun klausul Prisma `where.AND` yang menggabungkan batasan skop tim (karyawan bawahan langsung via `managerId` ATAU yang berada di divisi yang dipimpin `currentDepartmentId`), sambil mengecualikan ID manajer itu sendiri agar tidak menjadi bawahan dirinya sendiri.
     - Menyelaraskan query hitung statistik (`stats.totalActive`, `stats.totalProbation`, `stats.totalContractsExpiring`) agar menghitung berdasarkan skop tim aktif yang sama (bukan menghitung seluruh pegawai institusi).
     - Menambahkan fungsi helper `getManagerTeamInfo(employeeId)` untuk memuat informasi divisi dan posisi manajer.
  2. **Tahap 2 — Adaptasi Halaman UI & Pengkondisian Hak Akses (`/karyawan`)**:
     - Mengintegrasikan deteksi sesi dan peran (`getSession` + `getUserProfile`) di `apps/hris/src/app/(app)/karyawan/page.tsx`.
     - Mengaktifkan mode tim (`isTeamView`) secara otomatis ketika parameter `?view=team` aktif atau ketika pengguna adalah Manajer (non-HR).
     - Menyesuaikan Header: Judul berubah menjadi **"Anggota Tim Saya"** dengan badge dinamis nama Divisi Manajer (mis. _Divisi Riset Kurikulum & Pembelajaran_).
     - Menyembunyikan tombol wewenang administratif HR tingkat organisasi (**"Tambah Pegawai"** dan **"Impor Excel"**).
     - Menyesuaikan `EmployeeFilterBar` dengan badge divisi yang terkunci pada mode tim dan menjaga parameter `?view=team` saat filter direset.
     - Menyesuaikan `EmployeeTable`: Menyembunyikan tombol ubah data dan nonaktifkan pegawai untuk Manajer (hanya menampilkan tombol _"Lihat Detail Profil"_).
- **Hasil Verifikasi**:
  - `pnpm typecheck` lolos 9/9 package (0 error).
  - `pnpm lint` lolos dengan 0 error.
  - `pnpm test` lolos 47/47 unit test (100%).

---

## Rekapitulasi Absensi Tim & Perbaikan Navigasi Sidebar (Manajer / Lead) — Tahap 1

- **Status:** Selesai (Tahap 1 dari 2)
- **Implementasi:**
  1. **Perbaikan Status Aktif Ganda pada Sidebar (`AppSidebar`)**:
     - Memperbaiki helper `isNavActive` di `apps/hris/src/components/shell/app-sidebar.tsx` untuk rute `/absensi` dan `/cuti`.
     - Rute `/absensi` (Presensi Saya) kini mengecualikan prefix `/absensi/rekap` sehingga saat berada di halaman Rekap Absensi Tim (`/absensi/rekap`), hanya menu **"Absensi Tim"** yang aktif bersinar, dan **"Absensi Saya"** tetap netral.
     - Penanganan serupa diselaraskan untuk `/cuti` yang mengecualikan `/cuti/persetujuan`.
  2. **Isolasi Data Skop Tim pada Query Rekap Absensi (`getAttendanceRekap`)**:
     - Menambahkan parameter `teamManagerId?: string`, `managerDepartmentId?: string`, dan `excludeEmployeeId?: string` pada `getAttendanceRekap` di `apps/hris/src/server/queries/attendance.queries.ts`.
     - Menggunakan klausul Prisma `where.AND` yang menggabungkan batasan skop tim (karyawan bawahan via `managerId` atau divisi yang dipimpin `currentDepartmentId`), dan membatasi query catatan absensi hanya untuk ID anggota tim yang bersangkutan.
  3. **Adaptasi Halaman UI & Keamanan Wewenang Koreksi (`/absensi/rekap`)**:
     - Mengintegrasikan deteksi manajer (`isManager && !isHrOrAdmin`) pada `apps/hris/src/app/(app)/absensi/rekap/page.tsx`.
     - Mengubah header halaman secara adaptif: judul menjadi **"Rekap Kehadiran Tim"** dengan badge dinamis nama Divisi Manajer serta deskripsi monitoring tim.
     - Menyesuaikan komponen `AttendanceRekapView`:
       - Menyembunyikan kolom dan tombol **"Aksi HR: Koreksi"** untuk peran Manajer (koreksi absensi manual hanya dapat dilakukan oleh Admin HR / Super Admin).
       - Mengunci dropdown pilihan divisi menjadi badge divisi yang dipimpin manajer.
       - Menampilkan label ringkasan tabel yang sesuai (mis. _"Rekapitulasi Kehadiran: X Anggota Tim Terdata"_).
- **Hasil Verifikasi**:
  - `pnpm typecheck` lolos 9/9 package (0 error).
  - `pnpm lint` lolos dengan 0 error.
  - `pnpm test` lolos 100%.

---

## Proteksi Detail Karyawan & Kerahasiaan Finansial (`/karyawan/[id]`) — Tahap 2 (Opsional Selesai)

- **Status:** Selesai (Completed ✅)
- **Implementasi:**
  1. **Proteksi Otorisasi Server di `/karyawan/[id]`**:
     - Memverifikasi sesi dan hak akses di Server Component `EmployeeDetailPage`.
     - Untuk peran Manajer: membatasi akses hanya untuk melihat profil dirinya sendiri (`isSelf`), bawahan langsung (`isDirectReport`), atau pegawai di divisi yang dipimpinnya (`isSameDepartment` via `managerTeamInfo.currentDepartmentId`).
     - Jika Manajer mencoba mengakses ID pegawai di luar timnya melalui URL, server otomatis me-redirect ke `/karyawan?view=team`.
     - Untuk peran Staff biasa: jika mencoba mengakses halaman kelola ID pegawai lain, otomatis dialihkan ke `/profil` atau `/dashboard`.
  2. **Proteksi Tab Data Sensitif & Akun**:
     - Tab **"Data Sensitif & Bank"** (NIK, NPWP, Nomor Rekening Bank) dan tab **"Akun & Hak Akses"** disembunyikan sepenuhnya dari navigasi tab Manajer.
     - Server melakukan sanitasi query tab (`effectiveTab`): jika Manajer memaksakan parameter `?tab=sensitif` atau `?tab=akun` di URL, server otomatis mengalihkannya kembali ke tab `"biodata"`.
  3. **Proteksi Nominal Gaji Pokok pada Tab Kontrak Kerja**:
     - Kolom **"Gaji Pokok"** pada tabel riwayat kontrak kerja hanya dirender untuk Admin HR / Super Admin (`isHrOrAdmin`).
     - Manajer tetap dapat melihat tipe kontrak (PKWT, PKWTT, dll), tanggal mulai, tanggal berakhir, dan status aktif, namun nominal kompensasi finansial tidak dikirim ke client HTML.
  4. **Proteksi Aksi Administratif Organisasi**:
     - Tombol **"Ubah Profil"** pada kartu profil utama disembunyikan untuk peran Manajer (hanya tampil untuk Admin HR / Super Admin).
     - Rute formulir edit [`/karyawan/[id]/ubah`](<file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/app/(app)/karyawan/[id]/ubah/page.tsx>) diproteksi di sisi server: pengguna non-HR/Admin otomatis di-redirect kembali ke profil pegawai.
     - Tombol **"Mutasi / Promosi Jabatan"** pada kartu riwayat jabatan disembunyikan untuk peran Manajer (`CareerHistoryCard` menerima properti `isHrOrAdmin`).
     - Tombol tautan kembali (_Back Link_) disesuaikan: untuk Manajer bertuliskan _"Kembali ke Tim Saya"_ dan mengarah ke `/karyawan?view=team`.
- **Hasil Verifikasi**:
  - `pnpm typecheck` lolos 9/9 package (0 error).
  - `pnpm lint` lolos dengan 0 error.

---

## Modul Kinerja — Tahap 1: Isolasi Skop Tim & Dasbor Kinerja Tim untuk Lead / Manajer

- **Status:** Selesai (Completed)
- **Capaian & Perubahan**:
  1. **Ekstensi Query Backend Berbasis Skop Tim**:
     - `getPerformanceOverviewStats` dan `getPerformanceReviewsByPeriod` pada [`performance.queries.ts`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/server/queries/performance.queries.ts) kini mendukung parameter `teamManagerId`, `managerDepartmentId`, dan `excludeEmployeeId`.
     - Statistik ringkasan (Total Pegawai, Sasaran 100%, Evaluasi Mandiri, Review Atasan, Selesai, Rata-rata Skor) serta daftar pegawai yang dievaluasi otomatis terisolasi hanya untuk anggota divisi yang dipimpin manajer.
  2. **Resolusi Peran & Tab Navigasi Ganda di Server Component ([`/kinerja/page.tsx`](<file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/app/(app)/kinerja/page.tsx>))**:
     - Resolusi peran membedakan peran `admin`, `manager`, dan `staff` secara definitif, serta tetap mendukung pengujian peran melalui cookie preview Super Admin.
     - Untuk peran Manajer:
       - Default tampilan diarahkan ke **Kinerja Tim** (`?tab=team`), menampilkan dasbor monitoring dan tabel penilaian bawahan dalam divisinya.
       - Tersedia navigasi tab **Kinerja Saya** (`?tab=mine`), memungkinkan manajer mengisi evaluasi mandiri pribadinya untuk dinilai oleh Direktur / atasan langsungnya.
  3. **Adaptasi Header & Hak Akses Kontrol Periode**:
     - Komponen `PerformanceHeader` menampilkan judul _"Kinerja Tim"_ berserta lencana divisi manajer (mis. _Divisi Riset Kebijakan_).
     - Tombol konfigurasi administratif tingkat organisasi (_"Buat Periode"_ dan _"Tutup/Buka Periode"_) disembunyikan sepenuhnya dari pandangan manajer.
     - Tombol _Ekspor Rekap_ dan selektor periode tetap dapat digunakan oleh manajer.
  4. **Proteksi Finalisasi & Penguncian Nilai di Detail Modal**:
     - Pada `PerformanceDetailModal`, form finalisasi skor resmi (_FinalizeReviewForm_) disembunyikan dari manajer dan digantikan indikator status progres yang informatif. Hak finalisasi dan penguncian nilai resmi tetap eksklusif di tangan Admin HR / Super Admin.
- **Hasil Verifikasi**:
  - `pnpm typecheck`: 9/9 paket berhasil tanpa error.

---

## Modul Timesheet Freelance — Tahap 1: Desain Skema Database, Relasi Multi-Reviewer, RBAC, & Kueri Dasar

- **Status:** Selesai (Completed)
- **Capaian & Perubahan**:
  1. **Desain Skema Database Prisma ([`hris.prisma`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/packages/db/prisma/schema/hris.prisma))**:
     - Menambahkan enum `TimesheetStatus` (`PENDING`, `IN_REVIEW`, `APPROVED`, `REVISION_REQUESTED`, `REJECTED`) dan `ReviewerStatus` (`PENDING`, `IN_REVIEW`, `APPROVED`, `REJECTED`).
     - Membuat model `TimesheetSubmission`: mencakup informasi periode bulan/tahun, judul tugas, URL Google Spreadsheet, total jam kerja, deskripsi, relasi ke karyawan pengaju, dan tautan periode payroll.
     - Membuat model `TimesheetReviewer`: mendukung skenario **Multi-Lead / Multi-Reviewer** (1 pengajuan timesheet bisa meminta persetujuan dari $> 1$ atasan proyek yang berbeda). Menyimpan status review individual, catatan atasan, dan riwayat waktu aksi.
     - Migrasi Prisma `20261001050248_add_timesheet_models` diaplikasikan ke database PostgreSQL lokal dan Prisma Client ter-regenerasi.
  2. **RBAC & Matriks Peran ([`permissions.ts`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/packages/rbac/src/permissions.ts) & [`roles.ts`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/packages/rbac/src/roles.ts))**:
     - Mendaftarkan permission timesheet: `hris.timesheet.read:own`, `hris.timesheet.create:own`, `hris.timesheet.review:team`, `hris.timesheet.read:all`.
     - Memetakan permission ke peran `staff` (pengajuan & riwayat mandiri), `manager` (review tim), `admin_hr` (rekap seluruh organisasi), dan `super_admin`.
     - Seeding idempotent berhasil mengeksekusi 61 permission di PostgreSQL.
  3. **Kueri Dasar & Validasi Payroll ([`timesheet.queries.ts`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/server/queries/timesheet.queries.ts))**:
     - `getTimesheetSubmissionsByEmployee`: riwayat & ringkasan jam kerja staf.
     - `getTimesheetSubmissionsForReviewer`: antrean timesheet tim yang ditugaskan ke atasan tertentu.
     - `getTimesheetSubmissionDetail`: detail pengajuan beserta daftar atasan dan status persetujuannya.
     - `getEligibleReviewers`: daftar atasan/lead yang berhak dipilih sebagai reviewer.
     - `getTimesheetValidationForPayroll`: validasi _strict blocker_ sebelum kalkulasi payroll, mengidentifikasi pegawai PKWT per jam yang timesheet-nya belum di-ACC beserta daftar nama atasan penilai yang belum menyelesaikan proses.
- **Hasil Verifikasi**:
  - `pnpm typecheck`: 9/9 paket berhasil (0 error).
  - `pnpm --filter @pspk/hris lint`: 0 error.
  - `pnpm test`: 47/47 unit test lolos 100%.

---

## Modul Timesheet Freelance — Tahap 2: Portal Staf & Formulir Pengajuan Jam Kerja Freelance

- **Status:** Selesai (Completed)
- **Capaian & Fitur yang Diterapkan**:
  1. **Server Actions Terproteksi ([`timesheet.actions.ts`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/server/actions/timesheet.actions.ts))**:
     - `submitTimesheetAction`:
       - Validasi skema input dengan Zod (bulan 1-12, tahun, judul min 5 karakter, valid URL Google Spreadsheet, total jam kerja > 0 & <= 744 jam, minimal memilih 1 atasan reviewer).
       - Pencegahan _self-selection_: Pegawai dilarang memilih dirinya sendiri sebagai reviewer.
       - Pencegahan duplikasi pengajuan: Memastikan belum ada timesheet berstatus `APPROVED` pada bulan dan tahun yang sama.
       - Transaksi Prisma atomik: Menyimpan `TimesheetSubmission` dan seluruh entri `TimesheetReviewer`.
       - Notifikasi In-App otomatis: Mengirim notifikasi ke seluruh lead/atasan terpilih bahwa ada pengajuan timesheet baru yang perlu di-review.
       - Pencatatan Audit Trail lengkap (`core.audit_logs`).
     - `cancelTimesheetSubmissionAction`:
       - Memungkinkan staf membatalkan pengajuan yang masih berstatus `PENDING`.
  2. **Komponen Antarmuka Portal Timesheet Staf**:
     - **Kartu Statistik Ringkasan ([`timesheet-stats-cards.tsx`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/components/timesheet/timesheet-stats-cards.tsx))**: Menampilkan Jam Disetujui (ACC), Jam Menunggu Review, Total Pengajuan, dan Estimasi Honor ACC (dihitung otomatis dari `hourlyRate` pada kontrak PKWT aktif).
     - **Formulir Pengajuan Modal ([`timesheet-submission-modal.tsx`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/components/timesheet/timesheet-submission-modal.tsx))**:
       - Input Bulan & Tahun periode kerja.
       - Input Judul ringkas pekerjaan.
       - Input URL Google Spreadsheet dilengkapi tombol helper _"Uji Buka Link"_ (membuka tab baru untuk memastikan link spreadsheet dapat diakses/tidak restricted).
       - Input Total Jam Kerja (angka desimal).
       - Multi-Select Atasan Penilai / Lead Reviewer dengan pencarian instan (nama/NIP/divisi) dan lencana terpilih yang mudah dihapus/dipilih kembali.
       - Catatan / Deskripsi pekerjaan.
       - Tombol _"Kumpulkan Timesheet"_ dan _"Batal"_.
     - **Tabel Riwayat & Status Penilai ([`timesheet-table.tsx`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/components/timesheet/timesheet-table.tsx))**:
       - Filter status & pencarian judul/keterangan.
       - Tautan langsung ke Google Spreadsheet.
       - Indikator status per reviewer (_pills_ status masing-masing atasan penilai).
       - Tombol aksi detail dan pembatalan (jika masih `PENDING`).
     - **Modal Detail Status Multi-Reviewer ([`timesheet-detail-modal.tsx`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/components/timesheet/timesheet-detail-modal.tsx))**: Memeriksa status transparansi proses review tiap atasan penilai lengkap beserta catatan evaluasi dan waktu ACC/review.
     - **Halaman Utama ([`/timesheet/page.tsx`](<file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/app/(app)/timesheet/page.tsx>))**: Server component memuat data pengajuan karyawan aktif, kontrak aktif (`wageType`, `hourlyRate`), dan daftar reviewer yang memenuhi syarat.
  3. **Integrasi Navigasi App Shell ([`app-sidebar.tsx`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/components/shell/app-sidebar.tsx))**:
     - Menambahkan rute dan ikon `Clock` untuk _"Timesheet Saya"_ pada menu staf dan menu personal manajer.
     - Memastikan `isNavActive` mengisolasi rute `/timesheet` agar tidak bentrok dengan `/timesheet/persetujuan`.
- **Hasil Verifikasi**:
  - `pnpm --filter @pspk/hris typecheck`: 0 error.
  - `pnpm --filter @pspk/hris lint`: 0 error.
  - `pnpm test`: 47/47 unit test lolos 100%.

---

## Modul Timesheet Freelance — Tahap 3: Portal Persetujuan Manajer / Lead (`/timesheet/persetujuan`)

- **Status:** Selesai (Completed)
- **Capaian & Fitur yang Diterapkan**:
  1. **Server Actions Review & Konsolidasi Status Multi-Lead ([`timesheet.actions.ts`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/server/actions/timesheet.actions.ts))**:
     - `startTimesheetReviewAction`:
       - Mengubah status reviewer dari `PENDING` $\to$ `IN_REVIEW`.
       - Mengubah parent `TimesheetSubmission.status` menjadi `IN_REVIEW` (jika sebelumnya `PENDING`), sehingga staf langsung mengetahui lembar kerjanya sedang dicek.
       - Mengirimkan In-App Notification kepada staf: _"Atasan [Nama] mulai memeriksa timesheet [Judul]"_.
       - Pencatatan Audit Trail (`UPDATE TimesheetReviewer`).
     - `submitReviewDecisionAction`:
       - Mendukung keputusan `APPROVE` (ACC) atau `REJECT` (Tolak / Minta Revisi).
       - Validasi alasan penolakan wajib minimal 5 karakter jika memilih opsi tolak.
       - **Konsolidasi Status Induk Atomik**:
         - Mengevaluasi seluruh status reviewer pada pengajuan tersebut.
         - Jika ada salah satu atasan menolak (`REJECTED`), parent status menjadi `REJECTED`.
         - Jika **SEMUA** atasan penilai telah memberikan ACC (`APPROVED`), parent status otomatis menjadi `APPROVED` dan tanggal `approvedAt` terkunci.
         - Jika salah satu atasan telah ACC namun atasan lain masih belum mereview, parent status tetap `IN_REVIEW`.
       - Mengirimkan In-App Notification berkategori `PAYROLL` kepada staf dengan pesan transparan mengenai status persetujuan atasan terkait.
       - Pencatatan Audit Trail lengkap (`core.audit_logs`).
  2. **Komponen Antarmuka Persetujuan Timesheet Atasan**:
     - **Kartu Statistik Antrean Review ([`timesheet-approval-view.tsx`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/components/timesheet/approval/timesheet-approval-view.tsx))**: Menampilkan jumlah antrean Menunggu Review (beserta total jam tertunda), Sudah Di-ACC (beserta total jam disetujui), Ditolak/Perlu Revisi, dan Total Tugas Review.
     - **Tabel Daftar Tugas Review Tim ([`timesheet-approval-table.tsx`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/components/timesheet/approval/timesheet-approval-table.tsx))**:
       - Filter Segmented Tabs: _"Butuh Review"_ (default), _"Sudah Disetujui (ACC)"_, _"Ditolak"_, dan _"Semua"_.
       - Fitur pencarian instan nama pegawai freelance, NIP, judul proyek, atau divisi.
       - Kolom Status Review Saya vs Status Rekan Penilai Lainnya (menampilkan dots & status masing-masing reviewer).
       - Tautan langsung ke Google Spreadsheet.
       - Tombol aksi _"Review"_ / _"Lihat"_.
     - **Modal Interaktif Keputusan Review ([`timesheet-approval-modal.tsx`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/components/timesheet/approval/timesheet-approval-modal.tsx))**:
       - Ringkasan profil pegawai freelance, periode kerja, dan jam kerja.
       - Banner interaktif Google Spreadsheet dengan tombol _"Buka Sheet"_.
       - Tombol aksi _"Mulai Review"_ bila status masih pending.
       - Daftar status rekan atasan penilai lainnya (transparansi multi-lead).
       - Field catatan evaluasi/apresiasi/alasan revisi.
       - Tombol _"Setujui Timesheet (ACC)"_ dan _"Tolak / Perlu Revisi"_ (dengan konfirmasi modal aman).
     - **Halaman Utama Rute ([`/timesheet/persetujuan/page.tsx`](<file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/app/(app)/timesheet/persetujuan/page.tsx>))**: Server component dengan proteksi otorisasi peran Manajer, Admin HR, atau Super Admin.
  3. **Integrasi Navigasi App Shell ([`app-sidebar.tsx`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/components/shell/app-sidebar.tsx))**:
     - Menambahkan NavItem _"Persetujuan Timesheet"_ pada menu "Tim & Approval" milik Manajer.
     - Menambahkan NavItem _"Timesheet Freelance"_ pada menu navigasi Admin HR.
     - Memperbarui `isNavActive` agar rute `/timesheet/persetujuan` tidak tertukar dengan `/timesheet`.
- **Hasil Verifikasi**:
  - `pnpm --filter @pspk/hris typecheck`: 0 error (TypeScript strict lolos).
  - `pnpm --filter @pspk/hris lint`: 0 error.
  - `pnpm test`: 47/47 unit test lolos 100%.
  - `pnpm --filter @pspk/hris build`: Berhasil mengompilasi rute `/timesheet` dan `/timesheet/persetujuan` sebagai rute dinamis siap produksi.

---

## Modul Timesheet Freelance — Tahap 4: Integrasi Validasi Blocker Payroll HR & Injeksi Jam Kerja ke Payslip

- **Status:** Selesai (Completed)
- **Capaian & Fitur yang Diterapkan**:
  1. **Strict Blocker Validasi Payroll ([`payroll.service.ts`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/server/services/payroll.service.ts))**:
     - Memanggil `getTimesheetValidationForPayroll` sebelum siklus kalkulasi dimulai.
     - Jika terdapat staf freelance per jam (`wageType === "HOURLY"`) yang belum mengumpulkan timesheet atau timesheet-nya belum disetujui (ACC) oleh seluruh atasan proyeknya, kalkulasi otomatis ditangguhkan.
     - Sistem melempar pesan error informatif yang merinci nama pegawai, NIP, serta daftar nama atasan penilai yang belum menyelesaikan proses ACC.
  2. **Injeksi Jam Kerja & Tautan Periode Penggajian Atomik**:
     - Sistem mengambil timesheet resmi berstatus `APPROVED` pada bulan dan tahun periode terkait.
     - Nilai jam kerja (`totalHours`) otomatis diinjeksikan ke `Payslip.totalHours`.
     - Tarif per jam (`hourlyRate`) diambil dari kontrak kerja aktif.
     - Upah jam kerja dihitung secara presisi: `Math.round(totalHours * hourlyRate)` dan dimasukkan ke baris slip gaji (`PayslipLine`) bertipe `EARNING`: _"Upah Jam Kerja Timesheet (X jam @ Rp Y)"_.
     - ID Periode Payroll otomatis ditautkan ke `TimesheetSubmission.payrollPeriodId`.
     - Link dokumen Google Spreadsheet timesheet resmi disimpan pada kolom `Payslip.timesheetKey`.
  3. **Antarmuka Detail Penggajian HR ([`payroll-detail-view.tsx`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/components/payroll/payroll-detail-view.tsx))**:
     - Menambahkan **Widget Validasi Timesheet Freelance**:
       - Status Terverifikasi (Hijau): Menampilkan lencana ACC lengkap jika seluruh staf freelance telah disetujui.
       - Status Peringatan Blocker (Kuning/Amber): Menampilkan daftar staf yang belum mengumpulkan atau masih tertahan di atasan penilai tertentu, lengkap dengan tombol langsung ke _"Halaman Persetujuan"_.
     - Pada baris slip gaji staf per jam, tautan `timesheetKey` kini mendeteksi tautan Google Spreadsheet eksternal dan menampilkan tombol langsung _"Buka Google Sheet"_.
  4. **Slip Gaji Cetak & Resepsi Pegawai ([`payslip-printable-modal.tsx`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/components/slip-gaji/payslip-printable-modal.tsx))**:
     - Slip gaji resmi menampilkan rincian total jam disetujui, tarif kontrak per jam, dan komponen pendapatan berbasis timesheet.
- **Hasil Verifikasi**:
  - `pnpm --filter @pspk/hris typecheck`: 0 error.
  - `pnpm --filter @pspk/hris lint`: 0 error.
  - `pnpm test`: 47/47 unit test lolos 100%.
  - `pnpm --filter @pspk/hris build`: Berhasil 100% tanpa error.

---

## Modul Timesheet Freelance — Penyelarasan Peran & Alur Kerja Manajer vs Staf Lepas

- **Latar Belakang & Masalah**:
  - Pada pengujian sebagai akun Manajer/Atasan (`Dr. Budi Rahardjo`), di menu personal sidebar sebelumnya muncul tautan _"Timesheet Saya"_. Saat dibuka, manajer diarahkan ke halaman pengajuan timesheet kosong dengan tombol _"Ajukan Timesheet Baru"_.
  - Sesuai regulasi ketenagakerjaan dan SOP PSPK, manajer dan pegawai bulanan tetap **tidak menyetor timesheet jam kerja**, melainkan bertindak sebagai **Reviewer / Approver** atas timesheet staf freelance bawahan/proyek.
- **Penyempurnaan yang Diimplementasikan**:
  1. **Penyelarasan Menu Navigasi Sidebar ([`app-sidebar.tsx`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/components/shell/app-sidebar.tsx))**:
     - Menu _"Timesheet Saya"_ disembunyikan dari Menu Personal Manajer dan Menu Karyawan Staf Bulanan Tetap. Menu ini sekarang **hanya tampil jika pegawai memiliki kontrak aktif bertipe PKWT Per Jam / Freelance (`wageType === "HOURLY"`)**.
     - Menambahkan lencana (badge) indikator jumlah antrean pada menu _"Persetujuan Timesheet"_ (Manajer) dan _"Timesheet Freelance"_ (Admin HR) jika terdapat pengajuan yang berstatus `PENDING` atau `IN_REVIEW`.
  2. **Smart Redirect & Proteksi Halaman ([`/timesheet/page.tsx`](<file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/app/(app)/timesheet/page.tsx>))**:
     - Jika pengguna dengan peran Manajer / Lead / Reviewer mengakses rute `/timesheet`, sistem secara otomatis me-redirect ke `/timesheet/persetujuan` (pusat tugas persetujuan atasan).
     - Jika pegawai bulanan tetap non-reviewer mengakses rute `/timesheet`, sistem menampilkan kartu informasi edukatif bahwa pencatatan kehadiran mereka dilakukan melalui Absensi Harian (bukan timesheet).
  3. **Integrasi Dashboard Tim Manajer ([`manager-dashboard.tsx`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/components/dashboard/manager-dashboard.tsx), [`manager-dashboard.ts`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/server/queries/dashboard/manager-dashboard.ts))**:
     - Menambahkan kartu statistik ke-4: _"Antrean Timesheet Freelance"_ yang menampilkan jumlah timesheet tim yang menunggu ACC manajer.
     - Menambahkan banner/kartu peringatan aksi cepat jika terdapat timesheet staf freelance yang tertunda, lengkap dengan nama pegawai, total jam, judul tugas, dan tombol langsung _"Buka & Berikan ACC"_.
  4. **Shell Props & Layout ([`layout.tsx`](<file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/app/(app)/layout.tsx>), [`shell-container.tsx`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/components/shell/shell-container.tsx))**:
     - Menghitung `pendingTimesheetsCount` dan `isHourlyEmployee` secara dinamis dari database untuk sesi aktif.

---

## Modul Penggajian (Slip Gaji) — Perapian Tata Letak Identitas Pegawai & Rekening

- **Masalah Visual**:
  - Pada modal pratinjau dan cetak slip gaji ([`payslip-printable-modal.tsx`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/components/slip-gaji/payslip-printable-modal.tsx)), baris identitas pegawai dan rekening menggunakan `flex justify-between` tanpa lebar label yang terkunci.
  - Nilai yang panjang (misalnya jabatan _"Kepala Divisi Kebijakan Kurikulum"_ atau divisi _"Divisi Lingkar Studi Kebijakan Pendidikan (LSKP)"_) menyebabkan label _"Posisi / Jabatan:"_ dan _"Divisi Kerja:"_ terhimpit serta terpotong patah menjadi 2 baris terpisah secara canggung. Posisi titik dua (`:`) juga melompat-lompat tidak lurus vertikal.
- **Penyempurnaan**:
  1. Mengubah struktur kartu data menjadi **tata letak tabel kunci-nilai murni** dengan sel label berkategori `whitespace-nowrap w-1` dan perataan `align-top`.
  2. Seluruh tanda titik dua (`:`) kini sejajar lurus secara vertikal dalam satu kolom rapi.
  3. Seluruh nilai teks rata kiri secara alami di kolom yang sama. Jika nilai teks panjang, baris tambahan akan terbungkus rapi di bawah nilai tanpa menggeser atau merusak posisi label.
  4. Menyelaraskan CSS cetak pada [`globals.css`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/app/globals.css) agar proporsional dan presisi saat diunduh menjadi PDF atau dicetak ke kertas A4.

---

## Pembersihan Total Database untuk Pengujian Input Manual Awal

- **Tindakan**:
  - Berdasarkan konfirmasi pengguna, seluruh data operasional dan master data di PostgreSQL lokal telah dibersihkan secara total (`TRUNCATE TABLE ... CASCADE`).
  - Data yang dikosongkan meliputi: Pegawai, Kontrak, Riwayat, Tipe Ikatan Kerja, Departemen, Jabatan, Absensi, Cuti & Kuota, Komponen Gaji, Payroll & Slip Gaji, Timesheet, Kinerja, Rekrutmen, Pelatihan, Aset & Lisensi, Dokumen SOP, Audit Log, Notifikasi, Sesi, dan seluruh Akun Pengguna Dummy.
  - **Data yang Dipertahankan**:
    1. Sistem Role & Permission RBAC (5 peran sistem: `super_admin`, `admin_hr`, `admin_it`, `manager`, `staff` serta 61 permission).
    2. Akun tunggal **Super Administrator**:
       - Email: `superadmin@pspk.id`
       - Password: `Superadmin321!`
       - Role: `super_admin`
  - Sistem sekarang berada dalam kondisi _clean-slate_ murni untuk pengujian input manual satu per satu dari antarmuka web.

---

## Modul Organisasi — Perbaikan Tombol 'Tambah Jabatan' yang Terpotong / Lewat

- **Masalah Visual**:
  - Pada halaman Struktur Organisasi & Kepegawaian ([`organization-management.tsx`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/components/karyawan/organization-management.tsx)), saat nama divisi panjang (contoh: `(KATALIS) Kemitraan Advokasi dan Tenaga Ahli untuk Akselerasi Kebijakan Strategis`), judul divisi mendominasi seluruh lebar kolom kanan tanpa batas penyusutan (`min-w-0`).
  - Karena kontainer utama memiliki properti `overflow-hidden`, tombol **"+ Tambah Jabatan"** terdorong keluar batas kanan kartu sehingga terpotong dan hanya menyisakan teks `+ T`.
- **Penyempurnaan**:
  1. Menambahkan `min-w-0 flex-1` pada kontainer pembungkus judul divisi agar ruang teks dapat disesuaikan dan dibatasi secara proporsional.
  2. Memberikan kelas `line-clamp-2 sm:line-clamp-1 break-words` pada elemen `<h2>` serta atribut `title` lengkap agar nama divisi panjang tetap dapat dibaca secara elegan tanpa merusak struktur visual.
  3. Menambahkan properti `shrink-0 whitespace-nowrap` pada tombol **"+ Tambah Jabatan"** dan **"+ Tambah Divisi"** sehingga tombol terkunci kokoh pada posisinya, tidak dapat terhimpit, dan selalu terlihat utuh 100%.

---

## Pembersihan Kode Uji Coba, Skrip Scratch, dan Kode Seed Dummy

- **Tindakan**:
  - **Pembersihan `seed.ts` ([`seed.ts`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/packages/db/prisma/seed.ts))**:
    - Menghapus lebih dari 800 baris kode data dummy (akun dummy `hr@pspk.id`, `manajer@pspk.id`, `aris@pspk.id`, divisi & jabatan dummy, pegawai dummy, kontrak, absensi, cuti, payroll dummy, review kinerja dummy, timesheet dummy, aset dummy, dan dokumen dummy).
    - Mempertahankan hanya fondasi esensial sistem: 61 permissions, 5 system roles (`super_admin`, `admin_hr`, `admin_it`, `manager`, `staff`), akun utama Super Administrator (`superadmin@pspk.id`), master jenis cuti default, tipe ikatan kerja master default, serta konfigurasi standar jadwal kerja dan kop surat.
  - **Pembersihan Skrip Uji Coba**:
    - Menghapus skrip coba-coba di folder `scratch/` (`test-timesheet-payroll.ts`, `seed-performance.ts`, `test-organization-flow.ts`, `seed-notifications.ts`, `verify_dashboards.ts`).
    - Menghapus skrip sementara `scripts/wipe-data.ts`.
  - Repo kini berstatus _clean-slate_, rapi, dan siap untuk penginputan data produksi secara manual dari UI oleh administrator.

## Modul Karyawan & Kontrak — Pengaturan Master Tipe Ikatan Kerja (CRUD)

- **Latar Belakang**:
  - Tim HR memerlukan fleksibilitas penuh untuk menyesuaikan skema ikatan kerja (Pegawai Tetap, PKWT Berjangka, Freelance Jam Kerja/Timesheet, Magang, atau skema baru lainnya) secara mandiri lewat antarmuka web tanpa bergantung pada pengembang teknis.
- **Penyempurnaan & Fitur yang Diimplementasikan**:
  1. **Halaman Master Khusus (`/karyawan/ikatan-kerja`)**:
     - Menyediakan dasbor tersendiri ([`ikatan-kerja/page.tsx`](<file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/app/(app)/karyawan/ikatan-kerja/page.tsx>)) yang dilengkapi kartu metrik (Total Ikatan Kerja, Skema Per Jam, Skema Bulanan Tetap) dan tabel interaktif CRUD lengkap.
     - HR dapat mencari, menambah tipe baru (kode, nama, kategori, skema upah, tarif acuan per jam, deskripsi), mengubah data, mengaktifkan/menonaktifkan status (_toggle_), serta menghapus tipe ikatan kerja (dilengkapi proteksi otomatis: jika sudah memiliki kontrak aktif, sistem akan mengarsipkan/menonaktifkan tipe tersebut tanpa menghapus data historis pegawai).
  2. **Aksesibilitas Menu & Navigasi**:
     - **Sidebar HR Admin**: Ditambahkan menu **Tipe Ikatan Kerja** dengan ikon _Briefcase_ di bawah kelompok _Manajemen Organisasi_ ([`app-sidebar.tsx`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/components/shell/app-sidebar.tsx)).
     - **Direktori Pegawai (`/karyawan`)**: Ditambahkan tombol pintas **Tipe Ikatan Kerja** di bilah aksi atas berdampingan dengan Struktur Organisasi ([`karyawan/page.tsx`](<file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/app/(app)/karyawan/page.tsx>)).
     - **Struktur Organisasi (`/karyawan/organisasi`)**: Mendukung _deep-link_ `?tab=employmentTypes` untuk langsung membuka tab Master Ikatan Kerja ([`organisasi/page.tsx`](<file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/app/(app)/karyawan/organisasi/page.tsx>)).
  3. **Integrasi Form Pendaftaran Pegawai (`/karyawan/baru` & `/karyawan/[id]/ubah`)**:
     - Pada Langkah 3 (_Kontrak Kerja & Kompensasi_) di [`wizard-employee-form.tsx`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/components/karyawan/wizard-employee-form.tsx):
       - Ditambahkan tombol **"+ Tambah Tipe Baru"**: Membuka modal ringkas _in-place_. Setelah disimpan, tipe baru langsung muncul pada daftar pilihan kartu dan tercentang otomatis tanpa mereset atau kehilangan input form yang telah diisi sebelumnya.
       - Ditambahkan tautan cepat **"Pengaturan Ikatan Kerja ↗"** ke tab baru agar HR dapat mengelola seluruh daftar master kapan saja.
  4. **Penyempurnaan Backend & Relasi Data**:
     - Memperbaiki sinkronisasi data kontrak aktif pegawai pada fungsi `updateEmployee` di [`employee.service.ts`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/server/services/employee.service.ts) agar perubahan tipe ikatan kerja, tarif, dan gaji pada mode ubah pegawai langsung tersimpan ke tabel `employment_contracts`.
     - Menyertakan relasi `employmentTypeMaster` pada query `getEmployeesDirectory` dan `getEmployeeById` di [`employee.queries.ts`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/server/queries/employee.queries.ts).
     - Menjamin serialisasi tanggal ISO aman lintas batasan _Server Action_ di [`employment-type.actions.ts`](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/server/actions/employment-type.actions.ts).

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
pnpm test          # Menjalankan 47 unit test (Vitest)
pnpm lint          # ESLint
pnpm typecheck     # TypeScript check di seluruh workspace
pnpm build         # Next.js standalone build
```
