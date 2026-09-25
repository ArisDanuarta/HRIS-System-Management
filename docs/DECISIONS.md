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
