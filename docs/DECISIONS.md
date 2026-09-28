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
- **Keputusan:** Menghilangkan hardcoded jam operasional ("08:30 - 17:30" / "09:00"). Menyimpan konfigurasi jam kerja masuk, jam pulang, toleransi keterlambatan (*grace period*), dan hari kerja aktif ke dalam model `hris.work_schedule_settings` dengan relasi opsional per departemen dan flag `isDefault: true`. Perhitungan status kehadiran (`PRESENT` vs `LATE`) dikalkulasi secara dinamis di server saat `checkIn` berdasarkan waktu stempel WIB. Setiap perubahan konfigurasi oleh Admin HR atau Super Admin wajib mencatat rekam jejak audit (*audit trail*) di tabel `core.audit_logs`.
- **Alasan:** Mematuhi aturan `AGENTS.md` (Aturan 12: dilarang melakukan hardcoding aturan bisnis) dan standar industri HR digital, di mana kebijakan waktu kerja lembaga bersifat dinamis dan dapat berubah sewaktu-waktu sesuai keputusan manajemen organisasi tanpa harus mengubah kode sumber atau *re-deploy* aplikasi.

## 6. Penanganan Zona Waktu Dinamis untuk Tim Tersebar (WIB, WITA, WIT)
- **Keputusan:**
  1. Kantor pusat PSPK berlokasi di Jakarta (`Asia/Jakarta`, WIB / UTC+7) sebagai acuan jadwal kerja operasional lembaga (`09:00 — 17:00 WIB`).
  2. Modul jam digital (`TodayAttendanceCard`) dan tabel presensi mendeteksi zona waktu browser pengguna secara dinamis (`Intl.DateTimeFormat().resolvedOptions().timeZone`), seperti `Asia/Makassar` (WITA, UTC+8) atau `Asia/Jayapura` (WIT, UTC+9).
  3. Modul menyediakan pemilih zona waktu interaktif (*dropdown switcher*) dengan opsi Otomatis (Lokal Browser), WIB (Jakarta), WITA (Tengah), dan WIT (Timur) yang tersimpan persisten di `localStorage`.
  4. Jam digital menampilkan waktu real-time sesuai zona aktif, disertai lencana penjelas (*Waktu Lokal* atau *Kantor Pusat*) dan indikator sinkronisasi waktu ganda (*dual-clock*: misal staf di Bali menampilkan jam utama `12:50 WITA` dan jam pembanding `Kantor Pusat: 11:50 WIB`).
  5. Konversi jam kerja otomatis: jadwal kantor `09:00 — 17:00 WIB` dikonversi ke zona waktu lokal pengguna (misal `10:00 — 18:00 WITA`), sehingga karyawan remote tidak perlu menghitung manual batas jam kerja dan keterlambatan.
  6. Penyimpanan stempel waktu di database tetap menggunakan `TIMESTAMPTZ` (UTC absolute point in time), dan fungsi pembentukan string tanggal harian (`toDateStringInTimezone`) di `@pspk/shared` diselaraskan agar tidak terjadi pergeseran tanggal akibat UTC midnight pada server container Docker.
- **Alasan:** Menyelesaikan masalah ambiguitas waktu di mana staf di luar pulau Jawa (seperti Bali, Makassar, Papua) melihat jam lokal mereka namun sebelumnya secara keliru diberi label 'WIB (Jakarta)' dan 'Waktu Server'. Dengan pendekatan ini, baik staf lokal maupun manajemen HR di kantor pusat Jakarta memiliki transparansi waktu 100% akurat tanpa kebingungan.

