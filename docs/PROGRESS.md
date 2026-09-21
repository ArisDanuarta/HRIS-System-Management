# Status Kemajuan Pengembangan PSPK Platform

Dokumen ini diperbarui secara berkala pada setiap akhir fase/tugas.

---

## Fase 1 — Setup Awal Monorepo & Fondasi Sistem
- **Status:** Sedang Berjalan (In Progress)
- **Target:** Menyiapkan struktur monorepo, 7 packages bersama, konfigurasi Next.js, skema Prisma multi-schema (core, hris, sysmgmt), Docker, dan dokumentasi.

### Checklist Item:
- [x] Repo, workspace, Turborepo, Prettier, ESLint, `tsconfig` bersama.
- [ ] `apps/hris` (3001) dan `apps/sysmgmt` (3002) berjalan dengan `pnpm dev`; `/api/health` OK di keduanya.
- [x] PostgreSQL 18 lokal (Postgres.app) terhubung; database `pspk_platform` dan skema `core`, `hris`, `sysmgmt` dibuat.
- [ ] Migration `init_core` + seed idempotent berhasil.
- [ ] Kerangka 7 packages (`config`, `db`, `auth`, `rbac`, `storage`, `shared`, `ui`) terhubung.
- [ ] Brand (warna navy `#102E50`, gold `#F2AF3E`, maroon `#A8281C` + font Lora/Rubik) aktif.
- [ ] Login dasar untuk super admin hasil seed berfungsi.
- [ ] Stack produksi Dockerfile teruji.
- [x] `docs/PROGRESS.md`, `docs/DECISIONS.md`, `docs/OPEN_QUESTIONS.md`, `docs/data-audit.md` dibuat.

---

## Cara Menjalankan Lingkungan Lokal

```bash
# 1. Pastikan Postgres.app atau PostgreSQL lokal aktif di port 5432
# Database: pspk_platform, User: pspk, Password: pspk_dev_password

# 2. Instalasi dependensi
pnpm install

# 3. Generate prisma client & jalankan migrasi
pnpm db:generate
pnpm db:migrate
pnpm db:seed

# 4. Jalankan aplikasi
pnpm dev
# HRIS: http://localhost:3001
# System Management: http://localhost:3002
```
