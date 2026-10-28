# Catatan Keputusan Teknis & Arsitektur (DECISIONS)

Dokumen ini mencatat keputusan penting, arsitektur, dan versi dependensi proyek.

---

## 1. Lingkungan Database Lokal (September 2026)

- **Keputusan:** Menggunakan `Postgres.app` yang sudah berjalan di port 5432 mesin pengembang, dengan database `pspk_platform`, user `pspk`, dan password `pspk_dev_password`.
- **Alasan:** Memudahkan development lokal tanpa ketergantungan Docker Desktop di mesin pengembang, sambil tetap menyediakan `docker-compose.dev.yml` dan `docker-compose.prod.yml` untuk lingkungan container/VPS.

## 2. Struktur Schema Prisma

- **Keputusan:** Menggunakan multi-file schema Prisma di `packages/db/prisma/schema/` (`base.prisma`, `core.prisma`, `hris.prisma`, `sysmgmt.prisma`).
- **Alasan:** Memisahkan concern domain secara bersih antara modul identitas & akses (`core`), kepegawaian (`hris`), dan manajemen sistem/aset (`sysmgmt`).

## 3. Autentikasi & RBAC

- **Keputusan:** Better Auth untuk identitas & sesi, sedangkan otorisasi hak akses (RBAC) murni diatur oleh `@pspk/rbac` pada application layer menggunakan pola `<modul>.<resource>.<aksi>:<scope>`.
- **Alasan:** Memberikan fleksibilitas penuh, mendukung scope (`own`, `team`, `all`), dan mencegah vendor lock-in.

## 4. UI Brand & Styling

- **Keputusan:** Tailwind CSS + custom CSS theme tokens di `packages/ui/src/brand.css`, font Google `Lora` (heading) & `Rubik` (body). Komponen antarmuka visual spesifik akan dibuat setelah hasil prompt Google Stitch AI (`md/design_stitch.md`) diserahkan oleh pengguna.

## 5. Konfigurasi Jadwal Kerja & Toleransi Keterlambatan Presensi

- **Keputusan:** Menghilangkan hardcoded jam operasional ("08:30 - 17:30" / "09:00"). Menyimpan konfigurasi jam kerja masuk, jam pulang, toleransi keterlambatan (_grace period_), dan hari kerja aktif ke dalam model `hris.work_schedule_settings` dengan relasi opsional per departemen dan flag `isDefault: true`. Perhitungan status kehadiran (`PRESENT` vs `LATE`) dikalkulasi secara dinamis di server saat `checkIn` berdasarkan waktu stempel WIB. Setiap perubahan konfigurasi oleh Admin HR atau Super Admin wajib mencatat rekam jejak audit (_audit trail_) di tabel `core.audit_logs`.
- **Alasan:** Mematuhi aturan `AGENTS.md` (Aturan 12: dilarang melakukan hardcoding aturan bisnis) dan standar industri HR digital, di mana kebijakan waktu kerja lembaga bersifat dinamis dan dapat berubah sewaktu-waktu sesuai keputusan manajemen organisasi tanpa harus mengubah kode sumber atau _re-deploy_ aplikasi.

## 6. Penanganan Zona Waktu Dinamis untuk Tim Tersebar (WIB, WITA, WIT)

- **Keputusan:**
  1. Kantor pusat PSPK berlokasi di Jakarta (`Asia/Jakarta`, WIB / UTC+7) sebagai acuan jadwal kerja operasional lembaga (`09:00 — 17:00 WIB`).
  2. Modul jam digital (`TodayAttendanceCard`) dan tabel presensi mendeteksi zona waktu browser pengguna secara dinamis (`Intl.DateTimeFormat().resolvedOptions().timeZone`), seperti `Asia/Makassar` (WITA, UTC+8) atau `Asia/Jayapura` (WIT, UTC+9).
  3. Modul menyediakan pemilih zona waktu interaktif (_dropdown switcher_) dengan opsi Otomatis (Lokal Browser), WIB (Jakarta), WITA (Tengah), dan WIT (Timur) yang tersimpan persisten di `localStorage`.
  4. Jam digital menampilkan waktu real-time sesuai zona aktif, disertai lencana penjelas (_Waktu Lokal_ atau _Kantor Pusat_) dan indikator sinkronisasi waktu ganda (_dual-clock_: misal staf di Bali menampilkan jam utama `12:50 WITA` dan jam pembanding `Kantor Pusat: 11:50 WIB`).
  5. Konversi jam kerja otomatis: jadwal kantor `09:00 — 17:00 WIB` dikonversi ke zona waktu lokal pengguna (misal `10:00 — 18:00 WITA`), sehingga karyawan remote tidak perlu menghitung manual batas jam kerja dan keterlambatan.
  6. Penyimpanan stempel waktu di database tetap menggunakan `TIMESTAMPTZ` (UTC absolute point in time), dan fungsi pembentukan string tanggal harian (`toDateStringInTimezone`) di `@pspk/shared` diselaraskan agar tidak terjadi pergeseran tanggal akibat UTC midnight pada server container Docker.
  7. Metadata zona waktu asal disematkan otomatis ke catatan absensi (misal `[WITA]`) saat tombol check-in/out ditekan. Pada tabel riwayat kehadiran, waktu ditampilkan secara dual-time (waktu lokal + padanan WIB di kantor pusat) agar admin/HR di Jakarta tidak salah paham mengenai ketepatan waktu staf remote.
- **Alasan:** Menyelesaikan masalah ambiguitas waktu di mana staf di luar pulau Jawa (seperti Bali, Makassar, Papua) melihat jam lokal mereka namun sebelumnya secara keliru diberi label 'WIB (Jakarta)' dan 'Waktu Server'. Dengan pendekatan ini, baik staf lokal maupun manajemen HR di kantor pusat Jakarta memiliki transparansi waktu 100% akurat tanpa kebingungan.

## 7. Penyesuaian Kebijakan Panjang Minimal Kata Sandi (Password Minimum Length)

- **Keputusan:** Mengubah batas minimal panjang kata sandi dari 12 karakter menjadi 6 karakter di seluruh sistem:
  1. Konfigurasi Better Auth (`@pspk/auth`): menetapkan `minPasswordLength: 6` pada modul `emailAndPassword`.
  2. Skema Validasi Server (`changePasswordSchema` di `profile.actions.ts`): menetapkan `.min(6, "Kata sandi baru minimal 6 karakter")`.
  3. Formulir Ganti Kata Sandi (`change-password-tab.tsx`): memperbarui checklist validasi dan placeholder ke minimal 6 karakter, dengan tombol simpan aktif saat panjang ≥ 6 dan konfirmasi cocok. Kriteria tambahan (huruf besar/kecil, angka, simbol) dijadikan panduan/rekomendasi visual pada pengukur kekuatan (_strength meter_).
  4. Dokumen Kebijakan (`AGENTS.md`): menyelaraskan batas minimal sandi menjadi 6 karakter.
- **Alasan:** Penyesuaian berdasarkan instruksi langsung dari pengguna/pengelola sistem karena batas 12 karakter dirasa terlalu panjang dan membebani pengguna sehari-hari, sementara batas 6 karakter tetap memberikan fleksibilitas dan keamanan yang memadai untuk operasional internal.

## 8. Unifikasi Kalender Kerja & Konsolidasi Rute Kalender Cuti (Oktober 2026)

- **Keputusan:** Menghapus tab redundan "Kalender Cuti" dari navigasi sub-menu cuti (`AttendanceLeaveSubnav`) dan mengkonsolidasikan seluruh visibilitas jadwal kerja, libur, dan cuti ke dalam modul tunggal **Kalender Kerja** (`/kalender`). Rute `/cuti/kalender` dialihkan (_redirected_) secara otomatis ke `/kalender` dengan mempertahankan parameter tahun/bulan jika ada.
- **Alasan:** Kalender Kerja (`/kalender`) telah mencakup seluruh kebutuhan visibilitas cuti tim dan diri sendiri yang telah disetujui, dilengkapi fitur tambahan yang jauh lebih komprehensif (hari peringatan nasional, libur bersama, sinkronisasi Google Calendar/Meet, filter interaktif, dan aksi cepat ajukan cuti). Menghilangkan duplikasi antarmuka kalender meningkatkan kemudahan navigasi bagi staf dan mencegah pemborosan pemeliharaan kode ganda (_single source of truth_).

## 9. Penghapusan Modul Rekrutmen (ATS) & Pelatihan dari Cakupan Sistem (Oktober 2026)

- **Keputusan:** Menghapus modul **Rekrutmen & Pelacak Pelamar (ATS)** dan modul **Pelatihan & Pengembangan Kompetensi** secara permanen dari cakupan rancangan platform PSPK:
  1. **RBAC & Permissions:** Menghapus wewenang `hris.recruitment.read:all`, `hris.recruitment.manage:all`, `hris.recruitment.interview:team`, serta `hris.training.read:own`, `hris.training.read:team`, `hris.training.read:all`, `hris.training.manage:all` dari `@pspk/rbac/permissions.ts` dan pemetaan peran sistem `admin_hr`, `manager`, dan `staff` di `@pspk/rbac/roles.ts`.
  2. **Feature Flags & Tata Kelola Modul:** Menghapus `module.recruitment.enabled` dan `module.training.enabled` dari `SYSTEM_MODULE_DEFINITIONS` di `@pspk/db/src/modules.ts`, menyisakan 6 modul tata kelola aktif terstandarisasi.
  3. **Antarmuka System Management:** Menghapus kategori sumber daya `recruitment` dan `training` dari matriks peran (`role.queries.ts`, `role-matrix-view.tsx`, dan `module-governance-view.tsx`).
  4. **Database & Migrasi Prisma:** Menghapus model `TrainingRecord` dan relasinya pada `Employee` di `packages/db/prisma/schema/hris.prisma`, membuat dan menerapkan migrasi database `20261015110700_remove_training_and_recruitment` untuk melakukan drop tabel `hris.training_records`, menghapus data permission lama dari `core.permissions`, serta menghapus entri flag modul lama dari `core.system_settings`.
  5. **Dokumentasi Backlog & Roadmap:** Menutup pertanyaan terbuka #13 di `docs/OPEN_QUESTIONS.md` dengan status Selesai / Dihapus dari cakupan.
- **Alasan:** Berdasarkan arahan dan konfirmasi langsung dari pengguna/pengelola PSPK bahwa organisasi tidak membutuhkan modul rekrutmen/ATS maupun pelatihan mandiri, dan modul-modul tersebut tidak akan dibangun. Penghapusan ini memangkas kompleksitas kode, menyederhanakan antarmuka RBAC, menghemat beban database, dan memusatkan sistem pada modul inti yang benar-benar digunakan lembaga (Karyawan, Presensi, Cuti, Kalender Kerja, Timesheet, Kinerja, Penggajian, Aset, Dokumen, dan Tata Kelola Sistem).

## 10. Penerapan Komponen Animasi Logo PSPK & Pustaka `motion` (Oktober 2026)

- **Keputusan:**
  1. Menempatkan komponen animasi logo resmi lembaga (`PspkLogo`, `PspkLoader`, `PageReveal`) di dalam package shared UI `@pspk/ui` (`packages/ui/src/pspk-logo/`) dan mengeksposnya secara publik melalui `@pspk/ui`.
  2. Memasang dependensi resmi `motion` (Framer Motion v12 / `motion/react`) pada `@pspk/ui` untuk menggerakkan animasi stroke vector SVG logo PSPK (`variant="loop"`, `variant="draw"`, `variant="assemble"`).
  3. Memastikan bentuk dan warna identik 100% dengan panduan brand PSPK: stroke width 42, `viewBox="0 0 1000 1000"`, dan 4 warna resmi (`#133357` Deep Navy, `#B52B17` Crimson Red, `#F5A623` Amber Gold, `#959595` Slate Grey).
  4. Menerapkan `<PspkLoader />` (layar penuh) pada root loading (`app/loading.tsx`) dan `<PspkLoader fullScreen={false} />` pada layout internal (`app/(app)/loading.tsx`) di kedua aplikasi Next.js (`apps/hris` dan `apps/sysmgmt`).
  5. Menghormati preferensi aksesibilitas `prefers-reduced-motion` secara otomatis (beralih ke state static tanpa animasi ketika pengguna mengaktifkan preferensi kurangi gerak di sistem operasi).
- **Alasan:** Memberikan pengalaman loading terpadu yang profesional, konsisten dengan identitas brand resmi PSPK, menghilangkan inkonsistensi spinner generic browser, dan memastikan performa rendering tetap mulus serta aman terhadap aksesibilitas pengguna.

## 11. Kebijakan Penggantian Kata Sandi Wajib pada Login Pertama Kali & Reset Admin (Oktober 2026)

- **Keputusan:**
  1. Menambahkan kolom `mustChangePassword Boolean @default(false)` dan `passwordChangedAt DateTime?` pada model `core.users`.
  2. Mengaktifkan flag `mustChangePassword: true` secara otomatis ketika:
     - Karyawan baru didaftarkan dan akun login otomatis dibuat (`createEmployee` di `employee.service.ts`).
     - Akun login baru dibuatkan secara manual untuk pegawai eksisting (`createEmployeeLoginAccountAction` di `user-role.actions.ts`).
     - Kata sandi akun diatur ulang oleh Super Admin atau Administrator IT (`resetUserPasswordAction` di `user.actions.ts`).
  3. Memasang proteksi rute ketat (*strict route guarding*) di root dispatcher (`/`) dan shell layout `(app)/layout.tsx` pada kedua aplikasi (`hris` dan `sysmgmt`):
     - Jika `userProfile?.mustChangePassword === true`, server seketika membanting (*redirect*) pengguna ke `/ganti-password-wajib`.
     - Pengguna terkunci dan tidak dapat membuka halaman dashboard atau fitur internal lembaga apa pun sampai kata sandi baru berhasil disimpan.
  4. Halaman `/ganti-password-wajib` berdiri sendiri (*standalone*) di luar grup `(app)` tanpa merender sidebar atau navigasi dashboard untuk mencegah kebocoran data internal lembaga.
  5. Menerapkan aturan anti-reuse: kata sandi baru dilarang sama dengan kata sandi sementara (`newPassword !== currentPassword`), memiliki minimal 8 karakter, serta kombinasi huruf besar, huruf kecil, dan angka.
  6. Setiap keberhasilan penggantian kata sandi wajib langsung menonaktifkan status `mustChangePassword`, mengisi `passwordChangedAt = now()`, dan mencatat rekam jejak audit resmi bertipe `FIRST_LOGIN_PASSWORD_INITIALIZED` di tabel `core.audit_logs`.
- **Alasan:** Memenuhi standar kepatuhan tata kelola keamanan informasi (ISO 27001 & OWASP ASVS). Kata sandi sementara yang pernah dikirim melalui email pribadi atau dibuat oleh administrator berisiko tinggi disalahgunakan jika dibiarkan aktif permanen. Dengan kebijakan ini, integritas akun dijamin 100% karena pengguna pertama kali dipaksa mengamankan akun pribadi mereka sebelum dapat mengakses data organisasi.


