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
  - Panel Kiri: Ornamen geometris vektor matematika SVG (`#feba48`, `#ffffff`), kartu monogram logo PSPK lokal (`/images/pspk-logo.png`), pill badge pulsasi *Portal Internal Lembaga*, headline Lora, metrik institusional (2014–Kini, 256-Bit TLS), dan lencana keamanan.
  - Panel Kanan: Header institusi & link bantuan, kartu autentikasi dengan badge lingkungan `ENV: ID-JKT-01`, tab penguji status form (*Formulir Aktif*, *Status Kesalahan*, *Status Memuat*), banner kesalahan maroon interaktif, input email domain `@pspk.or.id`, input kata sandi dengan toggle intip (show/hide), checkbox ingat saya (sesi 30 hari), tombol login dengan animasi spinner saat verifikasi, dan frame penguji siklus 3 detik.
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

## Cara Menjalankan Lingkungan Lokal

```bash
# 1. Pastikan PostgreSQL lokal (Postgres.app / service) aktif di port 5432
# Database: pspk_platform, User: pspk, Password: pspk_dev_password

# 2. Jalankan aplikasi pengembangan
pnpm dev
# HRIS: http://localhost:3001
# System Management: http://localhost:3002

# 3. Jalankan pengujian
pnpm test          # Menjalankan 14 unit test (Vitest)
pnpm lint          # ESLint
pnpm typecheck     # TypeScript check di seluruh workspace
pnpm build         # Next.js standalone build
```
