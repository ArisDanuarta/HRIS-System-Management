# PSPK HRIS & System Management — Spesifikasi Implementasi

> **Sumber:** *Dokumen Analisis & Blueprint — Perancangan Sistem HRIS & System Management* (September 2026), disusun oleh I Made Aris Danuarta, IT Administrator PSPK.
>
> **Perubahan utama dari blueprint:** tidak memakai Vercel dan Supabase. Sistem di-deploy ke **VPS dengan Docker**. Database memakai **PostgreSQL lokal dulu** (development di mesin sendiri), lalu dipindah ke container PostgreSQL di VPS saat siap deploy.
>
> **Cara memakai file ini:** taruh di root repo sebagai `AGENTS.md` (dibaca Antigravity dan agent coding lain). Jika versi Antigravity yang dipakai membaca rules dari folder tertentu (mis. `.agents/rules/`), salin file ini ke sana. Kerjakan **satu fase per sesi** dan gunakan prompt di Bagian 15.

---

## Daftar Isi

0. Aturan kerja untuk agent
1. Ringkasan proyek
2. Perubahan dari blueprint awal
3. Stack teknologi
4. Struktur monorepo
5. **Fase 1 — Setup awal monorepo (langkah demi langkah)**
6. Desain database
7. Autentikasi & RBAC
8. Spesifikasi modul (HRIS Core & System Management)
9. Storage, audit log, dan keamanan
10. Docker, VPS, dan deployment
11. Migrasi data dari Excel / aplikasi pihak ketiga
12. Testing & kualitas kode
13. UI, brand, dan konvensi kode
14. Roadmap & Definition of Done per fase
15. Prompt siap pakai untuk Antigravity
16. Pertanyaan terbuka
17. Lampiran (env, perintah)

---

## 0. Aturan kerja untuk agent

Aturan ini **wajib** dipatuhi di seluruh proyek.

1. **Bahasa.** Teks yang dilihat pengguna (UI, pesan error, email) memakai **Bahasa Indonesia**. Kode, nama variabel/tabel/kolom, komentar teknis, dan commit message memakai **Bahasa Inggris** (Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`).
2. **Tanpa Vercel dan Supabase.** Jangan memakai Supabase client/auth/storage/RLS-sebagai-auth, Vercel-specific API (`@vercel/*`, Edge Config, Vercel Blob, dsb.), atau layanan cloud berbayar lain. Semua komponen harus berjalan di Docker pada VPS biasa.
3. **Verifikasi terhadap dokumentasi resmi.** Versi library bergerak cepat (Next.js, Prisma, Better Auth, Tailwind, Turborepo). Sebelum menulis konfigurasi, cek dokumentasi versi yang terpasang atau jalankan `<cli> --help`. Jangan mengarang sintaks, flag, atau nama API. Snippet di dokumen ini adalah titik awal, bukan kebenaran mutlak: jika berbeda dari dokumentasi versi terpasang, ikuti dokumentasi dan catat perbedaannya di `docs/DECISIONS.md`.
4. **Jangan commit secret.** Hanya `.env.example` yang boleh masuk Git. `.env`, `.env.production`, dump database, dan folder upload harus ada di `.gitignore`.
5. **Perintah destruktif butuh konfirmasi manusia:** `docker compose down -v`, `prisma migrate reset`, `DROP`/`TRUNCATE`, `rm -rf` pada folder data, `git push --force`, dan semua perintah yang menyentuh database selain database development/test.
6. **Otorisasi selalu di server.** Menyembunyikan menu atau tombol di UI bukan kontrol akses. Setiap server action, route handler, dan query data sensitif harus memanggil pemeriksaan permission (Bagian 7).
7. **Audit log** wajib untuk setiap mutasi data penting dan setiap akses ke data sensitif (Bagian 9.2).
8. **Data sensitif** (gaji, NIK, NPWP, rekening bank) tidak boleh masuk log aplikasi, tidak dikirim ke client kecuali memang perlu ditampilkan, dan tidak dimasukkan ke URL.
9. **Perubahan skema hanya lewat Prisma migration.** Jangan ubah database manual. Migration yang sudah di-commit tidak diedit; buat migration baru.
10. **Definition of Done.** Sebelum menyatakan suatu tugas/fase selesai, `pnpm lint`, `pnpm typecheck`, `pnpm test`, dan `pnpm build` harus lolos, dan semua item checklist fase tercentang.
11. **Ruang lingkup.** Hanya kerjakan fase yang diminta. Jangan menambah fitur di luar spesifikasi tanpa mencatatnya di `docs/OPEN_QUESTIONS.md`.
12. **Jangan menebak aturan bisnis.** Aturan payroll, pajak (PPh 21), BPJS, kebijakan cuti, dan THR harus dikonfirmasi ke Admin HR/keuangan PSPK. Jika belum ada jawaban, buat komponennya *configurable*, tulis asumsi eksplisit di `docs/OPEN_QUESTIONS.md`, dan jangan hard-code angka.
13. **Progress.** Setelah tiap fase, perbarui `docs/PROGRESS.md` (yang selesai, yang tertunda, keputusan penting, cara menjalankan).

---

## 1. Ringkasan proyek

PSPK (Pusat Studi Pendidikan dan Kebijakan) adalah organisasi nonprofit independen di bidang riset dan advokasi kebijakan pendidikan. Pengelolaan SDM saat ini manual (Excel + aplikasi pihak ketiga yang terpisah), sehingga konsolidasi data dan pelaporan sulit. Proyek ini membangun **satu platform terpadu** yang terdiri dari dua aplikasi web dalam **satu monorepo** dan **satu database PostgreSQL**:

| Aplikasi | Isi |
| --- | --- |
| **HRIS** (`apps/hris`) | Data karyawan, absensi & cuti (dengan approval), payroll, kinerja, rekrutmen, pelatihan (opsional) |
| **System Management** (`apps/sysmgmt`) | Manajemen user & role (RBAC), manajemen aset, dokumen/SOP dengan versi, audit log |

Kedua aplikasi memakai identitas (user), RBAC, dan audit log yang sama.

**Prinsip desain (dari blueprint):**

- Pola arsitektur mengikuti Pemantik: Next.js + Prisma + Turborepo/pnpm.
- Satu database, dipisah per skema (`hris`, `sysmgmt`) plus skema kecil `core` untuk identitas, RBAC, dan audit.
- RBAC dirancang generik agar bisa dipakai ulang sistem PSPK lain di masa depan.
- Brand PSPK konsisten: navy `#102E50`, gold `#F2AF3E`, maroon `#A8281C`; heading **Lora**, body **Rubik**.
- Migrasi dari Excel/aplikasi pihak ketiga dilakukan bertahap (Bagian 11).

**Di luar lingkup repo ini:** platform Pemantik. Pemantik memiliki infrastruktur sendiri; rencana menggabungkan hosting atau berbagi package dengan Pemantik dibahas terpisah.

---

## 2. Perubahan dari blueprint awal

| Aspek | Blueprint awal | Spesifikasi ini |
| --- | --- | --- |
| Hosting web | Vercel | **VPS + Docker** (Next.js `output: "standalone"`) |
| Database | Supabase Postgres (managed) | **PostgreSQL 17 di Docker**; lokal dulu → container di VPS |
| Autentikasi | Supabase Auth | **Better Auth** (`@pspk/auth`), sesi disimpan di database |
| Otorisasi | Row Level Security (RLS) | **RBAC di application layer** (`@pspk/rbac`); RLS PostgreSQL opsional sebagai lapisan tambahan |
| File storage | Supabase Storage | **Filesystem (Docker volume)** lewat abstraksi `StorageProvider`; MinIO/S3-compatible opsional nanti |
| TLS / reverse proxy | Otomatis oleh Vercel | **Caddy** (HTTPS otomatis) |
| Backup | Otomatis (Supabase Pro) | **`pg_dump` terjadwal** + salinan di luar VPS |
| Analisis biaya (Bagian 7 blueprint) | Vercel + Supabase, skenario A/B | **Tidak berlaku.** Biaya VPS belum dihitung, tergantung penyedia dan spesifikasi |
| Struktur data | 2 aplikasi, 1 database, 2 skema | Tetap 2 aplikasi & 1 database; **tambah skema kecil `core`** untuk user/RBAC/audit yang dipakai bersama |
| Modul, RBAC 5 peran, rencana migrasi, roadmap, brand | — | **Tetap** (roadmap disesuaikan di Bagian 14) |

---

## 3. Stack teknologi

| Komponen | Pilihan | Catatan |
| --- | --- | --- |
| Runtime | Node.js LTS (≥ 22) | Kunci di `.nvmrc` dan `engines` |
| Package manager | pnpm (via Corepack) | Workspace monorepo |
| Monorepo | Turborepo 2.x | `turbo.json` memakai kunci `tasks` |
| Framework web | Next.js (App Router, TypeScript strict) | Server Components + Server Actions |
| Styling | Tailwind CSS + komponen gaya shadcn/ui (Radix) | Token brand di `@pspk/ui` |
| Database | PostgreSQL 17 | Docker (dev & prod) |
| ORM | Prisma (multi-schema) | Migration dikelola di `@pspk/db` |
| Auth | Better Auth (email + password) | Alternatif: Auth.js. Dipakai hanya untuk identitas & sesi, otorisasi tetap di `@pspk/rbac` |
| Validasi | Zod | Dipakai di server action dan form |
| Form | react-hook-form + `@hookform/resolvers` | |
| Testing | Vitest (unit/integrasi), Playwright (E2E) | |
| Reverse proxy | Caddy 2 | Hanya untuk produksi/VPS |
| Container | Docker + Docker Compose | Dev: hanya PostgreSQL. Prod: seluruh stack |

> Versi paket **tidak dikunci di dokumen ini**. Pasang versi stabil terbaru saat setup, lalu biarkan `pnpm-lock.yaml` mengunci versinya.

---

## 4. Struktur monorepo

```
pspk-platform/
├─ AGENTS.md                         # dokumen ini
├─ package.json
├─ pnpm-workspace.yaml
├─ turbo.json
├─ .nvmrc
├─ .gitignore
├─ .prettierrc
├─ .env.example
├─ docker-compose.dev.yml            # dev: PostgreSQL (+ Adminer, profile "tools")
├─ docker-compose.prod.yml           # prod/VPS: postgres, migrate, hris, sysmgmt, caddy
├─ docker/
│  ├─ Dockerfile.next                # 1 Dockerfile untuk kedua app (ARG APP)
│  ├─ Dockerfile.migrate             # job prisma migrate deploy
│  ├─ caddy/Caddyfile
│  └─ postgres/init/01-schemas.sql
├─ scripts/
│  ├─ backup.sh
│  └─ restore.md
├─ docs/
│  ├─ PROGRESS.md
│  ├─ DECISIONS.md
│  ├─ OPEN_QUESTIONS.md
│  └─ data-audit.md                  # hasil audit data existing (Fase 1)
├─ apps/
│  ├─ hris/                          # @pspk/hris     — port dev 3001
│  └─ sysmgmt/                       # @pspk/sysmgmt  — port dev 3002
└─ packages/
   ├─ config/                        # @pspk/config   — tsconfig & eslint bersama
   ├─ db/                            # @pspk/db       — Prisma schema, migration, seed, client, audit helper
   ├─ auth/                          # @pspk/auth     — konfigurasi Better Auth + helper sesi
   ├─ rbac/                          # @pspk/rbac     — daftar permission, mapping role, can()/assertCan()
   ├─ storage/                       # @pspk/storage  — StorageProvider (local disk; S3/MinIO nanti)
   ├─ shared/                        # @pspk/shared   — util, format id-ID, enkripsi kolom, Zod umum
   └─ ui/                            # @pspk/ui       — komponen UI, token brand, font, app switcher
```

**Tanggung jawab package**

| Package | Isi utama | Boleh bergantung ke |
| --- | --- | --- |
| `@pspk/config` | `tsconfig/*.json`, preset ESLint | — |
| `@pspk/shared` | Formatter tanggal/rupiah, helper Zod, enkripsi AES-256-GCM, konstanta | — |
| `@pspk/db` | Prisma schema (`core`, `hris`, `sysmgmt`), migration, seed, `prisma` singleton, `audit.ts` | `shared` |
| `@pspk/rbac` | `PERMISSIONS`, `ROLE_PERMISSIONS`, `can()`, `assertCan()`, resolusi scope (`own`/`team`/`all`) | `db`, `shared` |
| `@pspk/auth` | Instance Better Auth, `getSession()`, `requireSession()` | `db`, `rbac` |
| `@pspk/storage` | `StorageProvider`, `LocalDiskStorage`, factory dari env | `shared` |
| `@pspk/ui` | Komponen, `brand.css`, font lokal, `AppSwitcher` | `shared` |

Package internal memakai pola **Just-in-Time**: `exports` menunjuk langsung ke `src/index.ts`, dan tiap app mendaftarkannya di `transpilePackages`.

---
## 5. Fase 1 — Setup awal monorepo (langkah demi langkah)

Tujuan fase ini: repo berjalan lokal dengan dua aplikasi Next.js kosong, terhubung ke PostgreSQL lokal, skema `core` + migration pertama + seed role/permission, dan Dockerfile produksi yang sudah terverifikasi build-nya. **Belum ada fitur bisnis.**

### 5.1 Prasyarat (mesin development)

| Kebutuhan | Cek |
| --- | --- |
| Node.js LTS ≥ 22 | `node -v` |
| Corepack (bawaan Node) | `corepack --version` |
| Docker Desktop / Docker Engine + Compose v2 | `docker compose version` |
| Git | `git --version` |

> **PostgreSQL lokal.** Default dokumen ini: PostgreSQL berjalan sebagai container Docker (`docker-compose.dev.yml`) di `localhost:5432`. Jika lebih suka PostgreSQL yang terpasang langsung di OS, lewati langkah 5.6 dan cukup arahkan `DATABASE_URL` ke instance tersebut (buat database `pspk_platform`). Seluruh langkah lain sama.
> Jika port 5432 sudah dipakai, ubah mapping port menjadi `5433:5432` dan sesuaikan `DATABASE_URL`.

### 5.2 Inisialisasi repo dan workspace

```bash
mkdir pspk-platform && cd pspk-platform
git init
corepack enable
corepack use pnpm@latest        # menulis field "packageManager" di package.json
echo "22" > .nvmrc
```

**`pnpm-workspace.yaml`**

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

**`package.json` (root)** — sesuaikan dengan hasil `corepack use`, pertahankan field `packageManager` yang dibuatnya:

```json
{
  "name": "pspk-platform",
  "private": true,
  "engines": { "node": ">=22" },
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck",
    "test": "turbo run test",
    "format": "prettier --write \"**/*.{ts,tsx,js,json,md,yml,yaml}\"",
    "db:up": "docker compose -f docker-compose.dev.yml up -d postgres",
    "db:down": "docker compose -f docker-compose.dev.yml down",
    "db:tools": "docker compose -f docker-compose.dev.yml --profile tools up -d adminer",
    "db:generate": "pnpm --filter @pspk/db generate",
    "db:migrate": "pnpm --filter @pspk/db migrate:dev",
    "db:deploy": "pnpm --filter @pspk/db migrate:deploy",
    "db:seed": "pnpm --filter @pspk/db seed",
    "db:studio": "pnpm --filter @pspk/db studio"
  },
  "devDependencies": {
    "prettier": "^3",
    "turbo": "^2",
    "typescript": "^5"
  }
}
```

```bash
pnpm add -D -w turbo typescript prettier    # pastikan versi terbaru terpasang
```

**`turbo.json`**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "ui": "tui",
  "tasks": {
    "generate": { "cache": false },
    "build": {
      "dependsOn": ["^build", "^generate"],
      "outputs": [".next/**", "!.next/cache/**"]
    },
    "dev": {
      "dependsOn": ["^generate"],
      "cache": false,
      "persistent": true
    },
    "lint": { "dependsOn": ["^generate"] },
    "typecheck": { "dependsOn": ["^generate"] },
    "test": { "dependsOn": ["^generate"] }
  }
}
```

> Turborepo secara default memakai *strict env mode*: variabel environment tidak otomatis diteruskan ke task. Karena env dimuat di dalam script tiap app lewat `dotenv-cli` (5.4), ini tidak jadi masalah. Jika suatu task butuh env dari shell, daftarkan lewat `passThroughEnv`/`globalPassThroughEnv`.

**`.gitignore`**

```gitignore
node_modules/
.next/
.turbo/
dist/
coverage/
.env
.env.*
!.env.example
!.env.production.example
.data/
*.dump
*.log
.DS_Store
```

**`.prettierrc`**

```json
{ "semi": true, "singleQuote": false, "trailingComma": "all", "printWidth": 100 }
```

### 5.3 `packages/config` — tsconfig & ESLint bersama

```bash
mkdir -p packages/config/tsconfig
```

`packages/config/package.json`

```json
{
  "name": "@pspk/config",
  "version": "0.0.0",
  "private": true,
  "files": ["tsconfig", "eslint"]
}
```

`packages/config/tsconfig/base.json`

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true
  }
}
```

`packages/config/tsconfig/nextjs.json` — extends `base.json`, tambahkan `"lib": ["dom", "dom.iterable", "ES2023"]`, `"jsx": "preserve"`, `"plugins": [{ "name": "next" }]`, `"allowJs": true`, `"incremental": true`.

`packages/config/tsconfig/library.json` — extends `base.json`, tambahkan `"jsx": "react-jsx"` untuk package yang berisi React.

Buat juga preset ESLint bersama di `packages/config/eslint/` (flat config; gunakan `eslint-config-next` untuk app, aturan TypeScript untuk package). Ikuti panduan ESLint dan Next.js versi terpasang.

### 5.4 Buat dua aplikasi Next.js

```bash
pnpm dlx create-next-app@latest apps/hris \
  --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-pnpm --skip-install

pnpm dlx create-next-app@latest apps/sysmgmt \
  --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-pnpm --skip-install
```

> Jika flag berbeda pada versi terpasang, jalankan `pnpm dlx create-next-app@latest --help`. Jika ada prompt tambahan, pilih default. Hapus file yang tidak perlu (`pnpm-lock.yaml`/`.git` di dalam app bila terbentuk, aset contoh, halaman demo).

Lalu untuk **masing-masing app**:

1. Ubah `name` di `package.json` menjadi `@pspk/hris` / `@pspk/sysmgmt`.
2. Ubah script (port berbeda, env dimuat dari root `.env`):

   ```json
   {
     "scripts": {
       "dev": "dotenv -e ../../.env -- next dev -p 3001",
       "build": "dotenv -e ../../.env -- next build",
       "start": "next start -p 3001",
       "lint": "eslint .",
       "typecheck": "tsc --noEmit"
     }
   }
   ```

   (`3002` untuk `sysmgmt`.) Tambahkan `dotenv-cli` sebagai devDependency. Jika file `.env` tidak ada, `dotenv-cli` dapat gagal; untuk build Docker dipakai `next build` langsung tanpa script ini (lihat Bagian 10.3).
3. Ganti `tsconfig.json` agar `extends` ke `@pspk/config/tsconfig/nextjs.json` (pertahankan `paths` `@/*`).
4. `next.config.ts`:

   ```ts
   import path from "node:path";
   import type { NextConfig } from "next";

   const config: NextConfig = {
     output: "standalone",
     // Wajib di monorepo agar file workspace ikut ter-trace saat build standalone.
     outputFileTracingRoot: path.join(process.cwd(), "../../"),
     transpilePackages: [
       "@pspk/ui",
       "@pspk/shared",
       "@pspk/db",
       "@pspk/auth",
       "@pspk/rbac",
       "@pspk/storage",
     ],
   };

   export default config;
   ```

   Jika Prisma bermasalah saat di-bundle, tambahkan ke `serverExternalPackages` sesuai dokumentasi.
5. Tambahkan dependency workspace: `pnpm --filter @pspk/hris add @pspk/ui@workspace:* @pspk/db@workspace:* @pspk/auth@workspace:* @pspk/rbac@workspace:* @pspk/shared@workspace:* @pspk/storage@workspace:*` (ulangi untuk `sysmgmt`).
6. Buat endpoint health `src/app/api/health/route.ts`:

   ```ts
   import { prisma } from "@pspk/db";

   export const dynamic = "force-dynamic";

   export async function GET() {
     try {
       await prisma.$queryRaw`SELECT 1`;
       return Response.json({ status: "ok" });
     } catch {
       return Response.json({ status: "error" }, { status: 503 });
     }
   }
   ```

> **Penting untuk build Docker:** halaman yang membaca database harus dinamis (`export const dynamic = "force-dynamic"` atau memakai `cookies()`/`headers()`), supaya `next build` tidak mencoba query database saat build.

### 5.5 `packages/db` — Prisma multi-schema

```bash
mkdir -p packages/db/prisma/schema packages/db/src
```

`packages/db/package.json` (ringkas):

```json
{
  "name": "@pspk/db",
  "version": "0.0.0",
  "private": true,
  "exports": { ".": "./src/index.ts" },
  "scripts": {
    "generate": "prisma generate",
    "migrate:dev": "dotenv -e ../../.env -- prisma migrate dev",
    "migrate:deploy": "prisma migrate deploy",
    "seed": "dotenv -e ../../.env -- tsx prisma/seed.ts",
    "studio": "dotenv -e ../../.env -- prisma studio",
    "typecheck": "tsc --noEmit"
  },
  "prisma": { "seed": "tsx prisma/seed.ts" }
}
```

Dependency: `@prisma/client`, dan devDependency `prisma`, `tsx`, `dotenv-cli`. (Pada Prisma versi terbaru, konfigurasi CLI, lokasi schema, dan driver adapter mungkin diatur lewat `prisma.config.ts` — ikuti panduan resmi versi terpasang.)

Pakai **schema multi-file** (`prisma/schema/`): `base.prisma`, `core.prisma`, `hris.prisma`, `sysmgmt.prisma`.

`prisma/schema/base.prisma`

```prisma
generator client {
  provider = "prisma-client-js" // gunakan generator yang direkomendasikan untuk versi terpasang
  // previewFeatures = ["multiSchema"] // hanya jika versi Prisma masih menganggapnya preview
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL") // pada Prisma versi baru, URL dipindah ke prisma.config.ts
  schemas  = ["core", "hris", "sysmgmt"]
}
```

Contoh model di `core.prisma` (lengkapi sesuai Bagian 6):

```prisma
model Role {
  id          String   @id @default(uuid())
  key         String   @unique
  name        String
  description String?
  isSystem    Boolean  @default(false) @map("is_system")
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz(6)

  permissions RolePermission[]
  users       UserRole[]

  @@map("roles")
  @@schema("core")
}
```

`src/index.ts` — singleton Prisma:

```ts
import { PrismaClient } from "@prisma/client"; // sesuaikan dengan lokasi output generator versi terpasang

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export * from "@prisma/client";
```

`docker/postgres/init/01-schemas.sql` (dijalankan otomatis hanya saat volume database pertama kali dibuat):

```sql
CREATE SCHEMA IF NOT EXISTS core;
CREATE SCHEMA IF NOT EXISTS hris;
CREATE SCHEMA IF NOT EXISTS sysmgmt;
```

### 5.6 PostgreSQL lokal via Docker

**`docker-compose.dev.yml`**

```yaml
name: pspk-dev

services:
  postgres:
    image: postgres:17-alpine
    container_name: pspk-postgres-dev
    restart: unless-stopped
    environment:
      POSTGRES_DB: pspk_platform
      POSTGRES_USER: pspk
      POSTGRES_PASSWORD: pspk_dev_password
    ports:
      - "127.0.0.1:5432:5432"   # hanya bisa diakses dari mesin ini
    volumes:
      - pspk_pgdata_dev:/var/lib/postgresql/data
      - ./docker/postgres/init:/docker-entrypoint-initdb.d:ro
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U pspk -d pspk_platform"]
      interval: 5s
      timeout: 5s
      retries: 10

  adminer:
    image: adminer
    profiles: ["tools"]
    ports:
      - "127.0.0.1:8080:8080"
    depends_on:
      postgres:
        condition: service_healthy

volumes:
  pspk_pgdata_dev:
```

### 5.7 Environment

**`.env.example`** (salin menjadi `.env`, jangan commit `.env`):

```dotenv
# --- Database (dev lokal) ---
DATABASE_URL="postgresql://pspk:pspk_dev_password@localhost:5432/pspk_platform"

# --- URL aplikasi ---
HRIS_URL="http://localhost:3001"
SYSMGMT_URL="http://localhost:3002"

# --- Auth ---
AUTH_SECRET="ganti-dengan-hasil-openssl-rand-base64-32"
AUTH_COOKIE_DOMAIN=""            # kosong di lokal; produksi mis. ".domain-pspk.example"

# --- Enkripsi kolom sensitif (NIK, NPWP, rekening) ---
DATA_ENCRYPTION_KEY="ganti-dengan-hasil-openssl-rand-base64-32"

# --- Storage ---
STORAGE_DRIVER="local"
STORAGE_LOCAL_DIR="./.data/uploads"
MAX_UPLOAD_MB="25"

# --- Lain-lain ---
APP_TIMEZONE="Asia/Jakarta"      # zona waktu operasional; lihat Bagian 16
NODE_ENV="development"

# --- Seed (hanya untuk dev) ---
SEED_ADMIN_EMAIL="admin@pspk.example"
SEED_ADMIN_PASSWORD="ganti-saat-seed"
SEED_DEMO="false"
```

> Cookie tidak terisolasi per port. Saat dev, `localhost:3001` dan `localhost:3002` berbagi cookie sehingga satu login berlaku untuk kedua app. Di produksi, gunakan subdomain dengan `AUTH_COOKIE_DOMAIN` (Bagian 7.2).

### 5.8 Kerangka package lain

Buat kerangka (belum lengkap) supaya import antar package sudah valid:

- `@pspk/shared`: `formatRupiah()`, `formatDate()` (locale `id-ID`, zona waktu dari `APP_TIMEZONE`), `encryptField()/decryptField()` (AES-256-GCM dari `DATA_ENCRYPTION_KEY`), `env.ts` (validasi env dengan Zod).
- `@pspk/ui`: `brand.css` (token warna + font), `AppSwitcher`, `Button`, `Input`, layout dasar (lihat Bagian 13).
- `@pspk/rbac`: `permissions.ts` (konstanta), `roles.ts` (mapping default), `can.ts` (Bagian 7.3).
- `@pspk/auth`: konfigurasi Better Auth memakai adapter Prisma (Bagian 7.2).
- `@pspk/storage`: interface `StorageProvider` + `LocalDiskStorage` (Bagian 9.1).

### 5.9 Migration pertama, seed, dan verifikasi

```bash
cp .env.example .env
pnpm install
pnpm db:up                              # PostgreSQL lokal jalan
pnpm db:generate
pnpm db:migrate --name init_core        # buat migration pertama (skema core saja)
pnpm db:seed                            # role, permission, mapping, super admin dari env
pnpm dev                                # hris :3001, sysmgmt :3002
```

Verifikasi:

```bash
curl -s http://localhost:3001/api/health    # {"status":"ok"}
curl -s http://localhost:3002/api/health    # {"status":"ok"}
```

**Seed (`packages/db/prisma/seed.ts`)** harus **idempotent** (aman dijalankan berulang, memakai `upsert`) dan berisi:

1. Semua `Permission` dari `@pspk/rbac`.
2. Lima `Role` sistem (`isSystem = true`) dan mapping `RolePermission` default (Bagian 7.4).
3. Satu user super admin dari `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` (password di-hash lewat library auth, bukan disimpan polos).
4. Jenis cuti default dan data referensi lain hanya jika sudah disepakati (Bagian 16); data demo hanya jika `SEED_DEMO=true`.

### 5.10 Validasi Docker produksi secara lokal (akhir Fase 1)

Tulis `docker/Dockerfile.next`, `docker/Dockerfile.migrate`, `docker-compose.prod.yml`, dan `docker/caddy/Caddyfile` sesuai Bagian 10, lalu uji di mesin lokal dengan `HRIS_DOMAIN=hris.localhost` dan `SYSMGMT_DOMAIN=sistem.localhost`. Tujuannya menemukan masalah build (Prisma engine, standalone tracing, permission volume) **sekarang**, bukan saat deploy ke VPS.

### 5.11 Checklist Fase 1

- [ ] Repo, workspace, Turborepo, Prettier, ESLint, `tsconfig` bersama berjalan; `pnpm lint`, `typecheck`, `build` hijau.
- [ ] `apps/hris` (3001) dan `apps/sysmgmt` (3002) berjalan dengan `pnpm dev`; `/api/health` OK di keduanya.
- [ ] PostgreSQL 17 lokal berjalan (Docker atau native); `DATABASE_URL` dari `.env`.
- [ ] Migration `init_core` + seed idempotent berhasil; skema `core`, `hris`, `sysmgmt` ada di database.
- [ ] Kerangka semua package (`config`, `db`, `auth`, `rbac`, `storage`, `shared`, `ui`) terhubung dan ter-import dari kedua app.
- [ ] Brand (warna + font Lora/Rubik) tampil di halaman kosong kedua app.
- [ ] Login dasar berfungsi untuk super admin hasil seed (kerangka Bagian 7).
- [ ] Stack produksi (`docker-compose.prod.yml`) terbukti naik di lokal dan `/api/health` lewat Caddy OK.
- [ ] `docs/PROGRESS.md`, `docs/DECISIONS.md`, `docs/OPEN_QUESTIONS.md` dibuat; `docs/data-audit.md` diisi hasil audit awal data existing (Bagian 11).

---
## 6. Desain database

> Ini rancangan awal. **Finalisasi skema dilakukan di Fase 1 setelah audit data existing** (Bagian 11): kolom harus berdasarkan field yang benar-benar dipakai di lapangan, bukan asumsi generik.

### 6.1 Konvensi

- Nama model `PascalCase`; nama tabel/kolom `snake_case` lewat `@@map` / `@map`.
- Setiap model: `@@schema("core" | "hris" | "sysmgmt")`.
- Primary key `String @id @default(uuid())`. Kolom `createdAt`, `updatedAt` (`@db.Timestamptz(6)`) di semua tabel.
- Tanggal tanpa jam (tanggal lahir, tanggal cuti, tanggal libur) memakai `@db.Date`. Timestamp disimpan **UTC**; konversi zona waktu hanya di lapisan tampilan.
- Uang memakai `Decimal @db.Decimal(15, 2)`; hitung dengan aritmetika desimal, bukan `number`.
- Data karyawan **tidak di-hard-delete**; gunakan `status` dan `deletedAt`.
- Relasi lintas skema diperbolehkan (mis. `hris.Employee.userId` → `core.User`). Definisikan index pada semua foreign key dan kolom filter utama (status, tanggal, period).
- Semua enum juga diberi `@@schema(...)`.

### 6.2 Skema `core` (identitas, RBAC, audit — dipakai bersama)

| Model | Kolom utama | Catatan |
| --- | --- | --- |
| `User` | id, email (unique), name, emailVerified, image?, isActive | `isActive=false` → tidak bisa login. Dikelola bersama library auth |
| `Account`, `Session`, `Verification` | mengikuti skema Better Auth | Hasilkan dengan generator library, lalu pindahkan ke skema `core` |
| `Role` | id, key (unique), name, description, isSystem | key: `super_admin`, `admin_hr`, `admin_it`, `manager`, `staff` |
| `Permission` | id, key (unique), module, description | Contoh: `hris.leave.approve:team` |
| `RolePermission` | roleId, permissionId | PK gabungan |
| `UserRole` | userId, roleId, assignedById?, assignedAt | User boleh punya lebih dari satu role |
| `AuditLog` | id, occurredAt, actorUserId?, actorEmail, app (`hris`/`sysmgmt`/`system`), action, entityType, entityId?, before Json?, after Json?, ip?, userAgent?, requestId? | **Append-only**; lihat Bagian 9.2 |

### 6.3 Skema `hris`

| Model | Kolom utama | Catatan |
| --- | --- | --- |
| `Department` | id, name, parentId? | Hierarki opsional |
| `Position` | id, title, departmentId | |
| `Employee` | id, employeeNo (unique), userId? (unique → `core.User`), fullName, nickname?, workEmail, personalEmail?, phone?, birthDate, birthPlace?, gender, maritalStatus?, address?, emergencyContactName?, emergencyContactPhone?, nikEnc?, npwpEnc?, bankName?, bankAccountEnc?, bankAccountName?, joinDate, endDate?, status, managerId? (self-relation), currentPositionId?, currentDepartmentId?, photoKey?, deletedAt? | Kolom `*Enc` dienkripsi aplikasi (Bagian 9.3). `managerId` menentukan atasan langsung & tim |
| `EmploymentHistory` | id, employeeId, positionId, departmentId, startDate, endDate?, notes? | Riwayat jabatan |
| `EmploymentContract` | id, employeeId, type, startDate, endDate?, baseSalary? (Decimal), documentKey?, status, notes? | `type`: `PERMANENT` (tetap), `FIXED_TERM`, `PART_TIME_PROJECT` |
| `Attendance` | id, employeeId, date, checkInAt?, checkOutAt?, status, source, notes?, correctedById?, correctionReason? | Unique `(employeeId, date)` |
| `Holiday` | id, date (unique), name, isCollectiveLeave | Untuk hitung hari kerja |
| `LeaveType` | id, name, defaultQuotaDays, isPaid, requiresAttachment, isActive | Data awal disepakati dengan HR |
| `LeaveBalance` | id, employeeId, leaveTypeId, year, quotaDays, usedDays | Unique `(employeeId, leaveTypeId, year)` |
| `LeaveRequest` | id, employeeId, leaveTypeId, startDate, endDate, days (Decimal), reason?, attachmentKey?, status, approverId?, decidedAt?, decisionNote? | Alur di Bagian 8.2 |
| `PayrollPeriod` | id, year, month, kind (`REGULAR`/`THR`), status, cutoffDate?, lockedAt? | Unique `(year, month, kind)` |
| `SalaryComponent` | id, code (unique), name, type (`EARNING`/`DEDUCTION`), calcType (`FIXED`/`PERCENT_OF_BASE`/`MANUAL`), defaultValue?, isActive | Configurable; jangan hard-code |
| `EmployeeSalaryComponent` | id, employeeId, componentId, amount (Decimal), effectiveFrom, effectiveTo? | Komponen gaji per karyawan |
| `Payslip` | id, periodId, employeeId, grossAmount, totalDeduction, netAmount, status, publishedAt?, pdfKey? | Unique `(periodId, employeeId)` |
| `PayslipLine` | id, payslipId, componentId?, label, type, amount | Snapshot komponen saat dihitung |
| `PerformancePeriod` | id, name, startDate, endDate, status | |
| `PerformanceGoal` | id, employeeId, periodId, title, description?, weight (Decimal), target?, unit?, actual? | KPI/OKR sederhana |
| `PerformanceReview` | id, employeeId, periodId, reviewerId, selfScore?, managerScore?, finalScore?, selfComment?, managerComment?, status | Alur di Bagian 8.5 |
| `JobOpening` | id, title, departmentId?, description?, status, openedAt, closedAt? | |
| `Candidate` | id, fullName, email, phone?, cvKey?, source? | |
| `Application` | id, jobOpeningId, candidateId, stage, notes? | Stage: `APPLIED`, `SCREENING`, `INTERVIEW`, `OFFER`, `HIRED`, `REJECTED` |
| `Interview` | id, applicationId, scheduledAt, interviewerId, notes?, score? | |
| `OnboardingTask` | id, employeeId, title, dueDate?, doneAt?, assigneeId? | Checklist onboarding |
| `TrainingRecord` | id, employeeId, title, provider?, startDate, endDate?, certificateKey?, expiresAt? | Opsional |

Enum `hris`: `EmployeeStatus` (`ACTIVE`, `PROBATION`, `ON_LEAVE`, `RESIGNED`, `TERMINATED`), `Gender`, `MaritalStatus`, `EmploymentType`, `ContractStatus`, `AttendanceStatus` (`PRESENT`, `LATE`, `ABSENT`, `LEAVE`, `HOLIDAY`, `WFH`), `AttendanceSource` (`WEB`, `MANUAL_HR`, `IMPORT`), `LeaveStatus` (`DRAFT`, `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`), `PayrollStatus` (`DRAFT`, `CALCULATED`, `APPROVED`, `PUBLISHED`, `LOCKED`), `PayrollKind`, `SalaryComponentType`, `SalaryCalcType`, `ReviewStatus` (`DRAFT`, `SELF_REVIEW`, `MANAGER_REVIEW`, `FINALIZED`), `ApplicationStage`.

### 6.4 Skema `sysmgmt`

| Model | Kolom utama | Catatan |
| --- | --- | --- |
| `Asset` | id, assetTag (unique), category (`IT`/`NON_IT`), type, name, brand?, model?, serialNumber?, purchaseDate?, purchasePrice?, status, location?, notes? | Status: `IN_STOCK`, `ASSIGNED`, `MAINTENANCE`, `RETIRED`, `LOST` |
| `AssetAssignment` | id, assetId, employeeId (→ `hris.Employee`), assignedAt, returnedAt?, conditionOut?, conditionIn?, notes? | Riwayat pemegang aset; hanya satu assignment aktif per aset |
| `SoftwareLicense` | id, name, vendor?, licenseKeyEnc?, seatsTotal, seatsUsed, purchaseDate?, expiresAt?, notes? | Kunci lisensi dienkripsi |
| `Document` | id, code (unique, mis. `SOP-001`), title, category, visibility, status, ownerId?, currentVersionId? | Visibility: `ALL_STAFF`, `HR_ONLY`, `IT_ONLY`, `MANAGERS` |
| `DocumentVersion` | id, documentId, versionNo, fileKey, fileName, mimeType, sizeBytes, sha256, changeNote?, effectiveDate?, createdById, createdAt | Versi lama read-only |

---

## 7. Autentikasi & RBAC

### 7.1 Prinsip

- **Autentikasi** (siapa kamu) ditangani library auth; **otorisasi** (boleh apa) ditangani `@pspk/rbac`. Jangan memakai fitur role bawaan library auth agar satu sumber kebenaran tetap di tabel `core.Role/Permission`.
- Tanpa Supabase RLS, keamanan data bertumpu pada pemeriksaan di server. Karena itu **semua akses data lewat service layer** yang menerima `AuthContext` (user, roles, employeeId) dan memanggil `assertCan()` sebelum query.
- Lapisan pengaman tambahan di database (Bagian 10.7): role PostgreSQL terpisah untuk aplikasi (tanpa hak DDL) dan pencabutan `UPDATE/DELETE` pada `audit_logs`. RLS PostgreSQL bisa ditambahkan belakangan jika dibutuhkan, tetapi bukan syarat go-live.

### 7.2 Autentikasi (Better Auth)

- Metode awal: **email + password**. Sesi disimpan di database (`core.Session`), cookie `httpOnly`, `secure` di produksi, `sameSite=lax`.
- Konfigurasi di `@pspk/auth`: adapter Prisma, `secret` dari `AUTH_SECRET`, `baseURL` sesuai app. Untuk Next.js App Router, ikuti panduan integrasi (handler `api/auth/[...all]`, plugin cookie untuk server action).
- **Satu login untuk dua app.** Produksi: kedua app berada di subdomain yang sama induknya (mis. `hris.<domain>` dan `sistem.<domain>`) dan cookie sesi memakai domain induk lewat `AUTH_COOKIE_DOMAIN` (aktifkan opsi cross-subdomain cookies sesuai dokumentasi). Kedua app memakai `AUTH_SECRET` dan database yang sama.
- Kebijakan: password minimum 12 karakter, rate limit login, sesi kedaluwarsa (mis. 8 jam idle / 7 hari absolut, dapat dikonfigurasi), `isActive=false` langsung memutus akses, halaman "ganti password", dan "lupa password" hanya diaktifkan setelah email (SMTP) siap.
- Opsi lanjutan (bukan Fase 1): 2FA untuk peran admin, SSO Google/Microsoft jika PSPK memakai salah satunya (Bagian 16).

### 7.3 Desain `@pspk/rbac`

Format permission: `<modul>.<resource>.<aksi>:<scope>`. Scope: `own` (milik sendiri), `team` (bawahan langsung berdasarkan `Employee.managerId`), `all`.

```ts
// packages/rbac/src/can.ts  (sketsa — sesuaikan tipe dengan schema Prisma)
export type AuthContext = {
  userId: string;
  employeeId: string | null;
  roles: string[];
  permissions: ReadonlySet<string>; // dimuat dari DB, di-cache per request
};

export type Resource = { ownerEmployeeId?: string; managerEmployeeId?: string | null };

export function can(ctx: AuthContext, permission: string, resource?: Resource): boolean {
  // "permission" tanpa scope, mis. "hris.leave.read"
  if (ctx.permissions.has(`${permission}:all`)) return true;
  if (resource?.managerEmployeeId && ctx.employeeId === resource.managerEmployeeId
      && ctx.permissions.has(`${permission}:team`)) return true;
  if (resource?.ownerEmployeeId && ctx.employeeId === resource.ownerEmployeeId
      && ctx.permissions.has(`${permission}:own`)) return true;
  return false;
}

export function assertCan(ctx: AuthContext, permission: string, resource?: Resource): void {
  if (!can(ctx, permission, resource)) throw new ForbiddenError(permission);
}
```

Ketentuan implementasi:

- Untuk **daftar** data (mis. list cuti), jangan filter di client. Service menurunkan *filter query* dari scope tertinggi yang dimiliki user (`all` → tanpa filter; `team` → `employee.managerId = ctx.employeeId` atau milik sendiri; `own` → milik sendiri).
- `requireSession()` di layout/route mengarahkan ke login bila sesi tidak ada dan menolak user nonaktif.
- Permission user dimuat sekali per request (`React.cache`) dari `UserRole → RolePermission → Permission`.
- Tidak boleh menghapus/menonaktifkan **super admin terakhir**; perubahan role selalu masuk audit log; hanya `super_admin` yang boleh memberi/mencabut role `super_admin`.
- Super admin tetap diaudit (tidak ada "bypass diam-diam").

### 7.4 Peran & matriks akses awal

Peran mengikuti blueprint: **Super Admin**, **Admin HR**, **Admin IT/System**, **Manajer/Atasan**, **Karyawan (Staff)**. Satu user bisa memegang beberapa peran (mis. `manager` + `staff`).

| Area | Staff | Manajer | Admin HR | Admin IT | Super Admin |
| --- | --- | --- | --- | --- | --- |
| Profil karyawan | own: baca + ubah data pribadi terbatas | team: baca | all: CRUD | all: baca direktori dasar | all |
| Kontrak & riwayat jabatan | own: baca | — | all: CRUD | — | all |
| Absensi | own: baca + check-in/out | team: baca | all: baca + koreksi | — | all |
| Cuti | own: ajukan/baca/batalkan | team: baca + setujui/tolak | all: baca + override + konfigurasi | — | all |
| Payroll & slip gaji | own: baca slip yang sudah dipublikasi | — (tidak melihat gaji tim) | all: kelola | — | all |
| Kinerja | own: isi self-review | team: review | all: kelola periode & finalisasi | — | all |
| Rekrutmen | — | pewawancara: input hasil wawancara | all: CRUD | — | all |
| Pelatihan | own: baca | team: baca | all: CRUD | — | all |
| User & role | — | — | — | all (kecuali role `super_admin`) | all |
| Aset & lisensi | own: lihat aset yang dipegang | — | baca | all: CRUD | all |
| Dokumen/SOP | baca dokumen sesuai visibility | baca sesuai visibility | unggah/kelola kategori HR | all: CRUD | all |
| Audit log | — | — | — | all: baca | all: baca |

Matriks ini adalah **mapping default** (`ROLE_PERMISSIONS`) yang di-seed ke database dan dapat disesuaikan lewat UI Role & Access Management (Fase 3). Daftar `PERMISSIONS` dibuat lengkap per modul berdasarkan tabel ini.

---

## 8. Spesifikasi modul

Struktur folder di setiap app:

```
src/
├─ app/
│  ├─ (auth)/login/
│  ├─ (app)/                 # layout terproteksi: sesi, sidebar sesuai permission
│  │  └─ <modul>/...
│  └─ api/
│     ├─ health/route.ts
│     ├─ auth/[...all]/route.ts
│     └─ files/[...key]/route.ts   # unduh file terautentikasi (Bagian 9.1)
├─ server/
│  ├─ services/              # logika bisnis; menerima AuthContext; TIDAK bergantung pada Next/React
│  ├─ actions/               # server actions: validasi Zod → assertCan → service → audit → revalidate
│  └─ queries/               # query baca untuk Server Components
├─ components/
└─ lib/
```

### 8.1 HRIS — Data Karyawan (Fase 2)

- Halaman: daftar karyawan (cari nama/no. pegawai, filter status/departemen), detail (tab: profil, kontrak, riwayat jabatan, dokumen), form tambah/ubah, struktur organisasi sederhana.
- Tipe kepegawaian mengikuti pola PSPK: **tetap, fixed-term, part-time/project-based**. Kontrak fixed-term memiliki `endDate` dan penanda "akan berakhir" (mis. ≤ 30 hari) di dashboard HR.
- Nomor pegawai: format ditentukan HR (Bagian 16); buat generator yang dapat dikonfigurasi.
- Membuat karyawan dapat sekaligus membuat akun user (undangan) dan menautkan `Employee.userId`.
- Field sensitif (NIK, NPWP, rekening) hanya tampil untuk permission yang sesuai, di-mask secara default (mis. `••••1234`), dan tiap "tampilkan penuh" dicatat sebagai `VIEW_SENSITIVE` di audit log.
- Impor massal dari Excel (Bagian 11).
- **Acceptance:** Admin HR dapat CRUD karyawan & kontrak; staff hanya melihat dan mengubah data pribadi terbatas miliknya; manajer hanya melihat bawahan langsung; setiap perubahan tercatat di audit log.

### 8.2 HRIS — Absensi & Cuti (Fase 2)

**Absensi**

- Default: tombol check-in/check-out via web (waktu server, bukan waktu client), rekap harian/bulanan per karyawan dan per tim, koreksi oleh HR dengan alasan wajib (tercatat audit). Metode lain (geolokasi, impor dari mesin absensi) menunggu keputusan di Bagian 16.
- Status harian dihitung dari check-in, jadwal kerja, hari libur (`Holiday`), dan cuti yang disetujui.

**Cuti — alur persetujuan**

1. Staff mengajukan (`PENDING`): jenis cuti, rentang tanggal, alasan, lampiran bila `requiresAttachment`.
2. Sistem menghitung `days` = hari kerja (tidak termasuk akhir pekan dan `Holiday`), memvalidasi **saldo cukup** dan **tidak overlap** dengan cuti lain.
3. Approver = `Employee.managerId`; jika kosong, jatuh ke Admin HR. Approver menyetujui/menolak dengan catatan.
4. Saat `APPROVED`: saldo (`usedDays`) dipotong dan status absensi pada rentang tersebut menjadi `LEAVE`. Saat `REJECTED`/`CANCELLED`: tidak ada pemotongan (atau pengembalian bila sudah dipotong).
5. Staff boleh membatalkan pengajuan `PENDING`, atau `APPROVED` yang belum dimulai. Admin HR dapat override dengan alasan.
6. Notifikasi in-app untuk approver dan pemohon; email opsional setelah SMTP tersedia.

- Admin HR mengelola `LeaveType`, kuota tahunan, dan kalender libur/cuti bersama.
- Perhitungan hari kerja, saldo, dan overlap ditulis sebagai **fungsi murni** di service dan wajib punya unit test.
- **Acceptance:** alur ajukan → setujui → saldo berkurang → absensi terisi berjalan end-to-end (E2E Playwright); pengajuan melebihi saldo/overlap ditolak dengan pesan jelas.

### 8.3 System Management — Role & Access (Fase 3)

- Halaman: daftar user (undang, aktif/nonaktif, reset password oleh admin), daftar role, editor mapping role ↔ permission, penugasan role ke user.
- Role sistem (`isSystem`) tidak dapat dihapus; permission tidak bisa dibuat lewat UI (berasal dari kode `@pspk/rbac`).
- Perubahan role/permission langsung berlaku pada request berikutnya dan diaudit.
- **Acceptance:** Admin IT dapat memberi/mencabut role selain `super_admin`; upaya menghapus super admin terakhir ditolak.

### 8.4 System Management — Aset & Dokumen/SOP (Fase 3)

**Aset**

- CRUD aset IT dan non-IT, label `assetTag` unik (generator dapat dikonfigurasi), status siklus hidup, serah-terima ke karyawan (`AssetAssignment`) dan pengembalian dengan kondisi, riwayat per aset dan per karyawan.
- Lisensi software: jumlah seat terpakai vs total, tanggal kedaluwarsa (peringatan ≤ 30 hari), kunci lisensi terenkripsi.
- Impor aset dari Excel.

**Dokumen/SOP**

- Unggah dokumen (PDF/DOCX/XLSX; batas ukuran dari `MAX_UPLOAD_MB`), setiap unggah baru membuat `DocumentVersion` baru dengan nomor versi naik dan catatan perubahan; hanya satu versi "saat ini"; versi lama read-only dan tetap dapat diunduh oleh yang berhak.
- Pencarian berdasarkan kode/judul/kategori; visibility per dokumen (`ALL_STAFF`, `HR_ONLY`, `IT_ONLY`, `MANAGERS`).
- Unduhan selalu lewat route terautentikasi (Bagian 9.1), tidak pernah URL publik.
- **Acceptance:** aset hanya dapat memiliki satu assignment aktif; dokumen menyimpan riwayat versi lengkap; staff tidak dapat mengakses dokumen `HR_ONLY`.

### 8.5 HRIS — Payroll & Kinerja (Fase 4)

**Payroll**

- Alur periode: `DRAFT` → `CALCULATED` → `APPROVED` → `PUBLISHED` → `LOCKED`. Periode `LOCKED` tidak dapat diubah kecuali lewat prosedur koreksi yang tercatat.
- Perhitungan: gaji pokok (dari kontrak aktif) + komponen `EmployeeSalaryComponent` (tunjangan/potongan) ± penyesuaian absensi/cuti tak berbayar bila disepakati. Hasil disimpan sebagai snapshot di `Payslip` + `PayslipLine` (perubahan komponen di masa depan tidak mengubah slip lama).
- **THR** diproses sebagai periode `kind = THR` dengan aturan yang dikonfirmasi HR.
- **Jangan mengarang aturan pajak/BPJS.** Sediakan mekanisme komponen yang dapat dikonfigurasi (fixed / persen dari gaji pokok / manual) dan titik ekstensi untuk kalkulator PPh 21/BPJS setelah aturannya dikonfirmasi (Bagian 16).
- Slip gaji: halaman staff untuk slip yang berstatus `PUBLISHED` + unduh PDF (dibuat di server; gunakan pustaka PDF ringan seperti `@react-pdf/renderer`, hindari headless browser di container kecil). PDF disimpan di storage dan diunduh lewat route terautentikasi.
- Setiap `CALCULATE`, `APPROVE`, `PUBLISH`, `LOCK`, dan ekspor tercatat di audit log. Manajer **tidak** dapat melihat gaji tim.
- Ekspor rekap payroll (CSV/XLSX) untuk Admin HR; ekspor juga diaudit.
- **Acceptance:** perhitungan punya unit test dengan kasus dari HR; validasi berlapis sebelum `PUBLISHED` (checklist: total per periode, selisih vs periode sebelumnya, karyawan tanpa komponen).

**Kinerja (KPI/OKR sederhana)**

- Admin HR membuat `PerformancePeriod`; tiap karyawan punya `PerformanceGoal` (bobot total = 100%).
- Alur `PerformanceReview`: `DRAFT` → `SELF_REVIEW` (karyawan isi capaian/skor) → `MANAGER_REVIEW` (atasan menilai) → `FINALIZED` (skor akhir berbobot; HR mengunci).
- Karyawan melihat hasil finalnya sendiri; manajer melihat tim; HR melihat semua.

### 8.6 HRIS — Rekrutmen & Pelatihan (akhir Fase 4 / opsional)

> Blueprint tidak menjadwalkan Rekrutmen dan Pelatihan secara eksplisit di roadmap. Di sini keduanya ditempatkan di akhir Fase 4 dan boleh digeser ke pasca go-live tanpa memengaruhi modul lain.

- **Rekrutmen:** lowongan → kandidat & lamaran (unggah CV) → papan tahap (Kanban: Applied → Screening → Interview → Offer → Hired/Rejected) → jadwal & catatan wawancara → tombol "jadikan karyawan" yang membuat `Employee` dan `OnboardingTask` dari template checklist.
- **Pelatihan:** riwayat pelatihan/sertifikasi per karyawan dengan tanggal kedaluwarsa dan pengingat.

---

## 9. Storage, audit log, dan keamanan

### 9.1 Storage (`@pspk/storage`)

Semua file (kontrak, lampiran cuti, CV, slip gaji PDF, dokumen/SOP, foto) disimpan lewat abstraksi sehingga pindah ke MinIO/S3-compatible nanti tidak mengubah kode aplikasi.

```ts
export interface StorageProvider {
  put(key: string, body: Buffer | NodeJS.ReadableStream, opts: { contentType: string }):
    Promise<{ key: string; size: number; sha256: string }>;
  get(key: string): Promise<{ stream: NodeJS.ReadableStream; size: number; contentType?: string }>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}
```

- `LocalDiskStorage`: menulis ke `STORAGE_LOCAL_DIR` (dev: `./.data/uploads`; produksi: volume Docker `/app/uploads`).
- Layout key: `<app>/<kategori>/<entityId>/<uuid>-<namaFileAman>`. **Cegah path traversal**: normalisasi key, tolak `..` dan path absolut, pastikan hasil resolve tetap di dalam root (wajib ada unit test).
- Validasi upload: allowlist MIME + ekstensi, batas `MAX_UPLOAD_MB`, hitung SHA-256. Jangan mempercayai nama file/MIME dari client.
- Unduhan lewat `GET /api/files/[...key]` yang memeriksa sesi dan permission terhadap entitas pemilik file, lalu men-stream; tidak ada URL publik statis.
- Tambahkan batas ukuran body Server Action / route handler yang sesuai `MAX_UPLOAD_MB`.

### 9.2 Audit log

- Tulis lewat helper `writeAudit()` di `@pspk/db`, dipanggil dari service layer setelah mutasi berhasil, **dalam transaksi yang sama** dengan mutasinya bila memungkinkan.
- Catat: aktor, aplikasi, aksi (`CREATE`, `UPDATE`, `DELETE`, `LOGIN`, `LOGOUT`, `LOGIN_FAILED`, `EXPORT`, `VIEW_SENSITIVE`, `PERMISSION_CHANGE`, …), entitas, `before`/`after` (**tanpa** nilai sensitif — simpan hanya nama field yang berubah untuk kolom sensitif), IP, user agent, request id.
- Append-only: di produksi, role PostgreSQL aplikasi **tidak** diberi `UPDATE`/`DELETE` pada `core.audit_logs` (Bagian 10.7).
- Viewer di System Management: filter tanggal/aktor/aplikasi/entitas/aksi, pagination, ekspor CSV (yang juga dicatat). Kebijakan retensi dapat dikonfigurasi.

### 9.3 Keamanan aplikasi

- Data pribadi karyawan tunduk pada **UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi**: kumpulkan seperlunya, batasi akses, tetapkan retensi, dan catat akses ke data sensitif.
- **Enkripsi kolom** NIK, NPWP, nomor rekening, dan kunci lisensi di level aplikasi (AES-256-GCM, kunci dari `DATA_ENCRYPTION_KEY`, format `iv:tag:ciphertext`). Konsekuensi: kolom ini tidak bisa dicari dengan `LIKE`; pencarian karyawan memakai nama/nomor pegawai. Kunci harus dibackup terpisah dari database, karena kehilangan kunci = kehilangan data terenkripsi. Siapkan mekanisme rotasi kunci (versi kunci di prefix ciphertext).
- Validasi semua input dengan Zod di server. Query hanya lewat Prisma (parameterized); hindari `$queryRawUnsafe`.
- Header keamanan (di Caddy dan/atau `next.config.ts`): HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`/`frame-ancestors`, CSP dasar.
- Server Actions memiliki proteksi origin bawaan Next.js; tetap batasi `allowedOrigins` ke domain PSPK di produksi.
- Rate limit pada login dan endpoint sensitif; catat percobaan gagal.
- Jangan log body request, token, atau field sensitif. Error ke pengguna berupa pesan umum; detail hanya di log server.
- Dependensi: jalankan `pnpm audit` berkala dan perbarui patch keamanan.

---
## 10. Docker, VPS, dan deployment

### 10.1 Gambaran

```
Internet ──► Caddy (80/443, HTTPS otomatis)
              ├─► hris     :3001  (Next.js standalone)
              └─► sysmgmt  :3002  (Next.js standalone)
                     │
                     └─► postgres :5432  (hanya di jaringan internal Docker, tidak dipublish)
Volume: pgdata, uploads, caddy_data, caddy_config
```

- **Dev (lokal):** hanya PostgreSQL di Docker; kedua app dijalankan dengan `pnpm dev` di host.
- **Produksi (VPS):** seluruh stack dengan `docker-compose.prod.yml`. Hanya Caddy yang mempublish port (80/443).
- Tahap awal: build image langsung di VPS (`docker compose up -d --build`). Registry container dan CI/CD (mis. GitHub Actions → build → SSH deploy) dapat ditambahkan setelah go-live.

### 10.2 `.dockerignore`

```
node_modules
**/node_modules
.next
**/.next
.turbo
.git
.env
.env.*
.data
*.dump
docs
```

### 10.3 `docker/Dockerfile.next` (dipakai kedua app)

```dockerfile
# syntax=docker/dockerfile:1
ARG NODE_VERSION=22

FROM node:${NODE_VERSION}-alpine AS base
RUN apk add --no-cache libc6-compat openssl && corepack enable
WORKDIR /app

# 1) Pangkas monorepo menjadi hanya yang dibutuhkan app target
FROM base AS pruner
ARG APP
RUN npm install -g turbo@^2
COPY . .
RUN turbo prune @pspk/${APP} --docker

# 2) Install dependency + build
FROM base AS builder
ARG APP
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile
COPY --from=pruner /app/out/full/ .
RUN pnpm --filter @pspk/db generate \
 && pnpm --filter @pspk/${APP} exec next build

# 3) Runtime minimal
FROM node:${NODE_VERSION}-alpine AS runner
ARG APP
ARG PORT=3001
RUN apk add --no-cache openssl \
 && addgroup -S nodejs && adduser -S nextjs -G nodejs
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=${PORT} \
    APP=${APP}
COPY --from=builder --chown=nextjs:nodejs /app/apps/${APP}/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/${APP}/.next/static ./apps/${APP}/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/${APP}/public ./apps/${APP}/public
RUN mkdir -p /app/uploads && chown nextjs:nodejs /app/uploads
USER nextjs
EXPOSE ${PORT}
CMD ["sh", "-c", "node apps/${APP}/server.js"]
```

Catatan:

- Pastikan `apps/hris/public` dan `apps/sysmgmt/public` ada (isi `.gitkeep`) agar `COPY` tidak gagal.
- Build memakai `next build` langsung (bukan script `build` yang memuat `.env`), karena `.env` tidak ikut ke image.
- Jika Prisma masih memakai engine biner, tambahkan `binaryTargets = ["native", "linux-musl-openssl-3.0.x"]` pada generator agar berjalan di Alpine. Jika file engine tidak ikut ter-trace pada output standalone, ikuti panduan Prisma untuk monorepo/Next.js standalone.
- Jangan menaruh secret di `ARG`/`ENV` saat build; secret hanya diberikan saat runtime lewat Compose.

### 10.4 `docker/Dockerfile.migrate`

```dockerfile
# syntax=docker/dockerfile:1
ARG NODE_VERSION=22

FROM node:${NODE_VERSION}-alpine AS base
RUN apk add --no-cache libc6-compat openssl && corepack enable
WORKDIR /app

FROM base AS pruner
RUN npm install -g turbo@^2
COPY . .
RUN turbo prune @pspk/db --docker

FROM base AS runner
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile
COPY --from=pruner /app/out/full/ .
RUN pnpm --filter @pspk/db generate
CMD ["pnpm", "--filter", "@pspk/db", "migrate:deploy"]
```

Seed produksi (sekali, manual): `docker compose -f docker-compose.prod.yml run --rm migrate pnpm --filter @pspk/db seed` dengan `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD` diberikan sementara lewat environment perintah tersebut, lalu **ganti password super admin segera** setelah login pertama.

### 10.5 `docker-compose.prod.yml`

```yaml
name: pspk-platform

x-logging: &default-logging
  driver: json-file
  options:
    max-size: "10m"
    max-file: "5"

x-app-env: &app-env
  NODE_ENV: production
  DATABASE_URL: postgresql://${APP_DB_USER}:${APP_DB_PASSWORD}@postgres:5432/${POSTGRES_DB}
  AUTH_SECRET: ${AUTH_SECRET}
  AUTH_COOKIE_DOMAIN: ${AUTH_COOKIE_DOMAIN}
  DATA_ENCRYPTION_KEY: ${DATA_ENCRYPTION_KEY}
  HRIS_URL: https://${HRIS_DOMAIN}
  SYSMGMT_URL: https://${SYSMGMT_DOMAIN}
  STORAGE_DRIVER: local
  STORAGE_LOCAL_DIR: /app/uploads
  MAX_UPLOAD_MB: ${MAX_UPLOAD_MB:-25}
  APP_TIMEZONE: ${APP_TIMEZONE:-Asia/Jakarta}

services:
  postgres:
    image: postgres:17-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      APP_DB_USER: ${APP_DB_USER}
      APP_DB_PASSWORD: ${APP_DB_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./docker/postgres/init:/docker-entrypoint-initdb.d:ro
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 10
    networks: [internal]
    logging: *default-logging
    # TIDAK ada "ports:" — database tidak boleh terbuka ke internet.

  migrate:
    build:
      context: .
      dockerfile: docker/Dockerfile.migrate
    restart: "no"
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
    depends_on:
      postgres:
        condition: service_healthy
    networks: [internal]

  hris:
    build:
      context: .
      dockerfile: docker/Dockerfile.next
      args:
        APP: hris
        PORT: "3001"
    restart: unless-stopped
    environment: *app-env
    volumes:
      - uploads:/app/uploads
    depends_on:
      migrate:
        condition: service_completed_successfully
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://127.0.0.1:3001/api/health"]
      interval: 30s
      timeout: 5s
      retries: 5
      start_period: 20s
    networks: [internal, web]
    logging: *default-logging

  sysmgmt:
    build:
      context: .
      dockerfile: docker/Dockerfile.next
      args:
        APP: sysmgmt
        PORT: "3002"
    restart: unless-stopped
    environment: *app-env
    volumes:
      - uploads:/app/uploads
    depends_on:
      migrate:
        condition: service_completed_successfully
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://127.0.0.1:3002/api/health"]
      interval: 30s
      timeout: 5s
      retries: 5
      start_period: 20s
    networks: [internal, web]
    logging: *default-logging

  caddy:
    image: caddy:2-alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    environment:
      HRIS_DOMAIN: ${HRIS_DOMAIN}
      SYSMGMT_DOMAIN: ${SYSMGMT_DOMAIN}
    volumes:
      - ./docker/caddy/Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      - hris
      - sysmgmt
    networks: [web]
    logging: *default-logging

networks:
  internal:
    internal: true      # postgres tidak punya akses keluar/masuk dari internet
  web: {}

volumes:
  pgdata:
  uploads:
  caddy_data:
  caddy_config:
```

Catatan: volume `uploads` dipakai bersama oleh kedua app (keduanya menulis/membaca file yang sama). Jika kelak salah satu app dipindah ke server lain, storage harus dipindah ke MinIO/S3-compatible.

### 10.6 `docker/caddy/Caddyfile`

```caddyfile
(common) {
  encode zstd gzip
  header {
    Strict-Transport-Security "max-age=31536000; includeSubDomains"
    X-Content-Type-Options "nosniff"
    Referrer-Policy "strict-origin-when-cross-origin"
    X-Frame-Options "SAMEORIGIN"
  }
  request_body {
    max_size 30MB
  }
}

{$HRIS_DOMAIN} {
  import common
  reverse_proxy hris:3001
}

{$SYSMGMT_DOMAIN} {
  import common
  reverse_proxy sysmgmt:3002
}
```

### 10.7 Role database untuk aplikasi (pengaman tambahan)

Tanpa RLS, batasi kerusakan jika aplikasi terkompromi: aplikasi berjalan dengan role PostgreSQL **terpisah** dari role pemilik skema.

`docker/postgres/init/02-app-role.sh` (dijalankan otomatis hanya saat volume `pgdata` pertama kali dibuat; hindari karakter kutip pada password):

```sh
#!/bin/sh
set -e
psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" <<-EOSQL
  CREATE ROLE ${APP_DB_USER} LOGIN PASSWORD '${APP_DB_PASSWORD}';
  GRANT CONNECT ON DATABASE ${POSTGRES_DB} TO ${APP_DB_USER};
  GRANT USAGE ON SCHEMA core, hris, sysmgmt TO ${APP_DB_USER};
  ALTER DEFAULT PRIVILEGES FOR ROLE ${POSTGRES_USER} IN SCHEMA core, hris, sysmgmt
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${APP_DB_USER};
  ALTER DEFAULT PRIVILEGES FOR ROLE ${POSTGRES_USER} IN SCHEMA core, hris, sysmgmt
    GRANT USAGE, SELECT ON SEQUENCES TO ${APP_DB_USER};
EOSQL
```

Lalu buat satu Prisma migration (SQL manual) yang mencabut hak ubah/hapus pada audit log **hanya bila role tersebut ada** (agar tidak error di database dev yang tidak punya role app):

```sql
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'pspk_app') THEN
    REVOKE UPDATE, DELETE, TRUNCATE ON core.audit_logs FROM pspk_app;
  END IF;
END $$;
```

(Sesuaikan nama role dengan `APP_DB_USER`. Nama role dalam migration harus sama dengan yang dipakai di produksi.)

### 10.8 Provisioning VPS (sekali)

Distro yang disarankan: Ubuntu LTS. Spesifikasi awal **indikatif**: 2 vCPU, 4 GB RAM, SSD 40–80 GB untuk dua app Next.js + PostgreSQL + Caddy pada puluhan–ratusan pengguna internal. Build image memakan RAM cukup besar; jika RAM kecil, tambahkan swap atau build di mesin lain lalu kirim image lewat registry. Sesuaikan setelah uji beban dan pemantauan.

1. Buat user non-root dengan sudo; login **hanya dengan SSH key**, nonaktifkan login password dan login root.
2. Firewall (mis. `ufw`): izinkan hanya SSH, 80, dan 443. **Perhatian:** port yang dipublish Docker melewati aturan `ufw`, karena itu jangan pernah mem-publish port PostgreSQL.
3. Aktifkan pembaruan keamanan otomatis (`unattended-upgrades`); pertimbangkan `fail2ban` untuk SSH.
4. Pasang Docker Engine + plugin Compose dari repositori resmi Docker; tambahkan user deploy ke grup `docker`.
5. Atur DNS: record A untuk `HRIS_DOMAIN` dan `SYSMGMT_DOMAIN` ke IP VPS (dan AAAA jika IPv6). Caddy akan menerbitkan sertifikat otomatis setelah DNS mengarah.
6. Sinkronkan waktu server (NTP) dan set zona waktu server ke UTC.

### 10.9 Deploy, update, rollback

**Deploy pertama**

```bash
git clone <url-repo> /opt/pspk-platform && cd /opt/pspk-platform
cp .env.production.example .env          # isi semua secret: openssl rand -base64 32
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml ps
# seed sekali (lihat 10.4), lalu cek https://<HRIS_DOMAIN>/api/health
```

**`.env.production.example`**

```dotenv
HRIS_DOMAIN=hris.domain-pspk.example
SYSMGMT_DOMAIN=sistem.domain-pspk.example
AUTH_COOKIE_DOMAIN=.domain-pspk.example

POSTGRES_DB=pspk_platform
POSTGRES_USER=pspk_owner
POSTGRES_PASSWORD=
APP_DB_USER=pspk_app
APP_DB_PASSWORD=

AUTH_SECRET=
DATA_ENCRYPTION_KEY=

MAX_UPLOAD_MB=25
APP_TIMEZONE=Asia/Jakarta
```

**Update rutin**

```bash
./scripts/backup.sh                                   # SELALU backup sebelum deploy
git pull --ff-only
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml logs -f --tail=100 hris sysmgmt
```

**Rollback:** `git checkout <tag/commit sebelumnya>` lalu `up -d --build`. Migration bersifat **forward-only**; jika migration baru merusak data, pulihkan dari backup yang diambil sebelum deploy. Beri tag Git pada setiap rilis produksi.

### 10.10 Backup & restore

**`scripts/backup.sh`**

```bash
#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

BACKUP_DIR="${BACKUP_DIR:-/var/backups/pspk}"
STAMP="$(date +%Y%m%d-%H%M%S)"
COMPOSE="docker compose -f docker-compose.prod.yml"
mkdir -p "$BACKUP_DIR"

# Database (format custom, bisa di-restore selektif)
$COMPOSE exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' \
  > "$BACKUP_DIR/db-$STAMP.dump"

# File upload
docker run --rm -v pspk-platform_uploads:/data:ro -v "$BACKUP_DIR":/backup alpine \
  tar czf "/backup/uploads-$STAMP.tar.gz" -C /data .

# Retensi lokal 14 hari
find "$BACKUP_DIR" -type f -mtime +14 -delete
```

- Jadwalkan lewat cron harian (mis. dini hari). **Salin hasilnya ke lokasi di luar VPS** (object storage atau server lain, mis. dengan `rclone`); backup yang hanya ada di VPS yang sama tidak melindungi dari kegagalan VPS.
- Backup `DATA_ENCRYPTION_KEY` dan `.env` di tempat aman **terpisah** dari backup database.
- **Uji restore** ke database kosong secara berkala dan catat prosedurnya di `scripts/restore.md` (`pg_restore --clean --if-exists -d <db> <file.dump>`).

### 10.11 Monitoring dasar

- `/api/health` di kedua app + Docker `healthcheck` (sudah di compose). Pantau dari luar dengan layanan uptime (mis. Uptime Kuma yang di-host sendiri, atau layanan gratis).
- Rotasi log Docker sudah diatur (`max-size`/`max-file`). Pantau ruang disk (`df -h`, ukuran volume) dan kegagalan backup.
- Pantau masa berlaku sertifikat (Caddy memperbarui otomatis; cek log jika gagal).

---

## 11. Migrasi data dari Excel / aplikasi pihak ketiga

Migrasi bertahap agar operasional harian tidak terganggu (sesuai blueprint):

1. **Audit data existing (Fase 1).** Petakan setiap file Excel dan fungsi aplikasi pihak ketiga (payroll, absensi, dll.). Hasilnya di `docs/data-audit.md`: nama sumber, kolom, contoh nilai (anonim), kualitas data, dan pemetaan ke kolom database. **Jangan commit data karyawan asli ke Git.**
2. **Rancang skema dari field yang benar-benar dipakai**, bukan asumsi generik; revisi Bagian 6 sesuai hasil audit.
3. **Bangun HRIS Core dulu** (karyawan + absensi/cuti), lalu Payroll & Kinerja (lebih sensitif, butuh validasi berlapis sebelum go-live).
4. **System Management** (akses & aset) dapat berjalan paralel karena tidak bergantung pada kelengkapan data HR.

**Skrip impor** (`packages/db/scripts/import/`):

- Baca `.xlsx`/`.csv`; validasi tiap baris dengan Zod; laporkan error per baris ke file CSV laporan.
- Mode `--dry-run` (default) yang hanya memvalidasi dan menampilkan ringkasan; `--commit` untuk menulis.
- **Idempotent:** upsert dengan kunci alami (mis. `employeeNo`, `assetTag`) sehingga aman dijalankan ulang.
- Tulis dalam transaksi per batch; catat ringkasan impor (jumlah dibuat/diubah/dilewati) ke audit log dengan `action = IMPORT`.
- Normalisasi: format tanggal Indonesia, nomor telepon, nama; petakan tipe kepegawaian ke `PERMANENT`/`FIXED_TERM`/`PART_TIME_PROJECT`.
- Data historis payroll dari sumber lama diimpor sebagai `Payslip` berstatus `LOCKED` (hanya baca) agar riwayat tetap dapat dilihat karyawan.
- Selalu jalankan dulu di database lokal/staging dan cocokkan hasilnya dengan sumber (jumlah baris, total gaji, sampel manual) sebelum menyentuh produksi.

---
## 12. Testing & kualitas kode

| Jenis | Alat | Cakupan wajib |
| --- | --- | --- |
| Unit | Vitest | `can()`/scope RBAC, hitung hari kerja & saldo cuti, deteksi overlap cuti, kalkulasi payroll, enkripsi/dekripsi kolom, sanitasi key storage (path traversal), formatter id-ID |
| Integrasi | Vitest + PostgreSQL nyata | Service layer terhadap database `pspk_platform_test`: alur cuti, versi dokumen, satu assignment aktif per aset, append-only audit |
| E2E | Playwright | Login; ajukan cuti → setujui → saldo berkurang; unggah SOP versi baru; staff ditolak mengakses halaman/dokumen terlarang |
| Statis | ESLint, `tsc --noEmit`, Prettier | Berjalan di `pnpm lint` / `pnpm typecheck` |

- **Database test terpisah** (`pspk_platform_test`). Skrip test yang mereset database **wajib memeriksa** nama database berakhiran `_test` sebelum menjalankan `prisma migrate reset --force`, dan menolak berjalan jika tidak.
- Uji otorisasi secara negatif: untuk setiap server action sensitif harus ada test bahwa peran yang tidak berhak ditolak.
- Logika bisnis ditulis sebagai fungsi murni di `server/services` supaya mudah diuji tanpa Next.js.
- Opsional setelah Fase 1: CI (GitHub Actions) yang menjalankan lint, typecheck, test dengan service PostgreSQL, dan build.
- Pre-commit hook (husky + lint-staged) untuk format & lint file yang berubah.

---

## 13. UI, brand, dan konvensi kode

### 13.1 Brand PSPK

| Token | Nilai | Pemakaian |
| --- | --- | --- |
| `navy` | `#102E50` | Warna utama: sidebar, header, teks judul, tombol utama |
| `gold` | `#F2AF3E` | Aksen: tombol sekunder/CTA, highlight, indikator aktif |
| `maroon` | `#A8281C` | Aksi berbahaya/hapus, error, peringatan penting |
| Heading | **Lora** | `h1`–`h3`, judul kartu |
| Body | **Rubik** | Teks, tabel, form |

`packages/ui/src/brand.css` (Tailwind v4, konfigurasi berbasis CSS; untuk Tailwind v3 buat preset `tailwind.config` yang setara):

```css
@theme {
  --color-navy: #102e50;
  --color-gold: #f2af3e;
  --color-maroon: #a8281c;
  --font-heading: "Lora", ui-serif, Georgia, serif;
  --font-body: "Rubik", ui-sans-serif, system-ui, sans-serif;
}
```

- Muat font dengan `next/font/google` (Lora, Rubik) di `layout.tsx` tiap app; font di-self-host saat build. Jika build harus berjalan tanpa internet, ganti ke `next/font/local`.
- **Kontras:** teks emas di atas putih tidak memenuhi kontras; pakai emas sebagai latar dengan teks navy, atau sebagai aksen non-teks. Periksa semua kombinasi warna terhadap WCAG AA.
- Sediakan turunan warna (tint/shade) untuk state hover/disabled dan latar netral yang selaras.

### 13.2 Pola UI

- Layout: sidebar (menu difilter sesuai permission) + header dengan `AppSwitcher` (pindah HRIS ↔ System Management memakai `HRIS_URL`/`SYSMGMT_URL`, hanya menampilkan app yang boleh diakses) + area konten. Responsif (desktop utama, tetap layak di tablet/ponsel untuk absensi, cuti, dan slip gaji).
- Komponen bersama di `@pspk/ui`: `Button`, `Input`, `Select`, `DatePicker`, `DataTable` (sort, filter, pagination sisi server), `Dialog`, `Toast`, `EmptyState`, `PageHeader`, `StatusBadge`, `ConfirmDialog` (wajib untuk aksi destruktif).
- Form: react-hook-form + Zod, skema Zod yang sama dipakai ulang di server action. Tampilkan pesan error Bahasa Indonesia yang spesifik.
- Format: tanggal `id-ID` (mis. `21 September 2026`), mata uang `Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" })`, zona waktu dari `APP_TIMEZONE`.
- Aksesibilitas dasar: label form, fokus terlihat, navigasi keyboard, teks alternatif.

### 13.3 Konvensi kode

- TypeScript `strict`; hindari `any`; batasi `as` cast.
- Alur mutasi: **Server Action → validasi Zod → `requireSession()` → `assertCan()` → service (transaksi) → `writeAudit()` → `revalidatePath`**. Return `{ ok: true, data } | { ok: false, error }` alih-alih melempar error mentah ke UI.
- Server Components mengambil data lewat `server/queries`; komponen client hanya untuk interaksi.
- Environment divalidasi sekali di `@pspk/shared/env.ts` (Zod); app gagal start bila env wajib tidak ada.
- Penamaan file `kebab-case`; komponen React `PascalCase`; satu concern per file.
- Git: branch `main` (stabil), `feat/<nama>`, `fix/<nama>`; Conventional Commits; rilis produksi diberi tag semver.
- Dependency baru: jelaskan alasan di commit; utamakan yang aktif dipelihara dan berlisensi permisif.

---

## 14. Roadmap & Definition of Done per fase

Roadmap mengikuti blueprint, disesuaikan untuk VPS + Docker. Estimasi bersifat indikatif dan perlu disesuaikan dengan ketersediaan tim serta hasil audit data pada Fase 1.

| Fase | Fokus | Estimasi |
| --- | --- | --- |
| **1** | Audit data existing, finalisasi skema database, setup monorepo & environment (**Docker + PostgreSQL lokal**, pengganti Vercel + Supabase), kerangka auth & RBAC, validasi Docker produksi di lokal | 2–3 minggu |
| **2** | HRIS Core: data karyawan, absensi & cuti | 4–6 minggu |
| **3** | System Management: RBAC UI, manajemen aset, dokumen/SOP, viewer audit log (**paralel dengan Fase 2**) | 3–4 minggu |
| **4** | Payroll & Kinerja, migrasi data historis; Rekrutmen & Pelatihan di akhir fase atau pasca go-live | 4–6 minggu |
| **5** | UAT, pelatihan pengguna, **provisioning & deploy VPS produksi**, go-live bertahap | 2–3 minggu |

### Fase 1
Checklist di Bagian 5.11.

### Fase 2 — HRIS Core
- [ ] Skema `hris` (karyawan, departemen/jabatan, kontrak, absensi, libur, cuti) ter-migrate; seed jenis cuti sesuai kesepakatan HR.
- [ ] CRUD karyawan + kontrak + riwayat jabatan; field sensitif terenkripsi, di-mask, dan `VIEW_SENSITIVE` diaudit.
- [ ] Absensi check-in/out + rekap + koreksi HR beralasan.
- [ ] Alur cuti lengkap (Bagian 8.2) dengan unit test perhitungan & E2E.
- [ ] Scope `own`/`team`/`all` terbukti lewat test otorisasi negatif.
- [ ] Impor karyawan dari Excel (dry-run + commit) berjalan.
- [ ] Semua mutasi tercatat di audit log; `pnpm lint/typecheck/test/build` hijau.

### Fase 3 — System Management
- [ ] Skema `sysmgmt` ter-migrate.
- [ ] UI user & role: undang, nonaktifkan, tugaskan role, edit mapping role↔permission; proteksi super admin terakhir.
- [ ] Aset & lisensi: CRUD, assignment/return, riwayat, peringatan kedaluwarsa, impor Excel.
- [ ] Dokumen/SOP: unggah, versioning, visibility, unduhan terautentikasi (uji path traversal & akses lintas visibility).
- [ ] Viewer audit log dengan filter, pagination, ekspor CSV (diaudit).
- [ ] `StorageProvider` lokal teruji.

### Fase 4 — Payroll, Kinerja, (Rekrutmen/Pelatihan)
- [ ] Aturan payroll dikonfirmasi tertulis oleh HR/keuangan (`docs/OPEN_QUESTIONS.md` terjawab) sebelum implementasi.
- [ ] Alur periode payroll, slip snapshot, PDF slip, halaman slip staff; manajer tidak bisa melihat gaji tim (teruji).
- [ ] Kalkulasi payroll punya unit test dengan kasus nyata dari HR; validasi berlapis sebelum `PUBLISHED`.
- [ ] Kinerja: periode, goal berbobot, review berjenjang, skor akhir.
- [ ] Impor data historis; rekonsiliasi dengan sumber lama terdokumentasi.
- [ ] (Opsional) Rekrutmen & Pelatihan.

### Fase 5 — UAT & go-live
- [ ] VPS diprovisioning sesuai Bagian 10.8; DNS & HTTPS aktif; PostgreSQL tidak terekspos publik.
- [ ] Role database aplikasi terpisah + pencabutan `UPDATE/DELETE` audit log terverifikasi.
- [ ] Backup harian otomatis + salinan di luar VPS; **restore berhasil diuji**.
- [ ] Seed produksi, ganti password super admin, akun awal pengguna dibuat.
- [ ] UAT dengan perwakilan HR, manajer, dan staff; daftar temuan ditutup atau dijadwalkan.
- [ ] Pelatihan pengguna + panduan singkat (Bahasa Indonesia).
- [ ] Go-live bertahap (mis. HR dulu, lalu seluruh staff); rencana rollback tertulis; monitoring uptime aktif.

---

## 15. Prompt siap pakai untuk Antigravity

Buka folder repo sebagai workspace, pastikan file ini terbaca sebagai instruksi proyek, lalu gunakan prompt berikut satu per satu. Jika tersedia, gunakan mode Planning dan review rencana sebelum agent mengeksekusi.

**Fase 1**

```
Baca AGENTS.md sepenuhnya. Kerjakan HANYA Fase 1 (Bagian 5). Sebelum menjalankan
perintah, tulis rencana kerja singkat dan tunggu persetujuan saya. Ikuti Bagian 0
(aturan kerja). PostgreSQL lokal via docker-compose.dev.yml. Jangan gunakan Vercel
atau Supabase. Setelah selesai, jalankan lint, typecheck, test, build, perbarui
docs/PROGRESS.md, lalu laporkan status tiap item di checklist 5.11 (selesai / belum
+ alasan). Catat asumsi dan versi yang dipakai di docs/DECISIONS.md.
```

**Fase 2**

```
Fase 1 sudah selesai. Baca AGENTS.md, lalu kerjakan HANYA Fase 2 (Bagian 6.3, 7,
8.1, 8.2, 9, dan checklist Fase 2 di Bagian 14). Mulai dari migration skema hris,
permission baru di @pspk/rbac, service layer, lalu UI. Tulis unit test untuk
perhitungan hari kerja/saldo/overlap cuti dan test otorisasi negatif. Berhenti
setelah checklist Fase 2 selesai dan laporkan.
```

**Fase 3**

```
Baca AGENTS.md. Kerjakan HANYA Fase 3 (Bagian 6.4, 7, 8.3, 8.4, 9.1, 9.2 dan
checklist Fase 3). Implementasikan StorageProvider lokal dengan test path traversal
sebelum fitur dokumen. Pastikan audit log append-only dan viewer-nya berfungsi.
Laporkan setelah checklist selesai.
```

**Fase 4** *(jalankan hanya setelah aturan payroll dikonfirmasi)*

```
Baca AGENTS.md dan docs/OPEN_QUESTIONS.md. Kerjakan HANYA Fase 4 (Bagian 8.5, 8.6,
11 dan checklist Fase 4). Jangan menebak aturan pajak/BPJS/THR: pakai komponen
configurable dan titik ekstensi kalkulator. Tulis unit test kalkulasi dengan kasus
dari HR. Laporkan setelah selesai.
```

**Fase 5**

```
Baca AGENTS.md. Bantu Fase 5 (Bagian 10 dan checklist Fase 5): siapkan skrip dan
dokumentasi deploy ke VPS, backup/restore, hardening role database, dan panduan
UAT/go-live. Jangan menjalankan perintah pada server produksi tanpa konfirmasi saya
untuk tiap perintah.
```

---

## 16. Pertanyaan terbuka (catat jawabannya di `docs/OPEN_QUESTIONS.md`)

| # | Pertanyaan | Dibutuhkan sebelum |
| --- | --- | --- |
| 1 | Domain/subdomain final, penyedia VPS, dan spesifikasi VPS? | Fase 5 |
| 2 | Metode absensi: check-in web saja, geolokasi, atau impor dari mesin absensi? Jadwal kerja/jam masuk standar? | Fase 2 |
| 3 | Kebijakan cuti: jenis, kuota, carry-over, aturan cuti bersama/hari libur nasional? | Fase 2 |
| 4 | Struktur organisasi & atasan: cukup satu tingkat approval, atau bertingkat? | Fase 2 |
| 5 | Format nomor pegawai dan nomor aset? | Fase 2/3 |
| 6 | Aturan payroll: komponen gaji/tunjangan/potongan, BPJS, PPh 21, tanggal cut-off, pembulatan, aturan THR, potongan cuti tak berbayar? | Fase 4 |
| 7 | Hasil audit data existing: format Excel dan fungsi aplikasi pihak ketiga yang perlu diganti? | Fase 1 |
| 8 | Perlu notifikasi email (SMTP)? Penyedia SMTP apa? Perlu "lupa password" via email? | Fase 2 |
| 9 | Perlu SSO (Google Workspace/Microsoft 365) atau cukup email + password? 2FA untuk admin? | Fase 1/2 |
| 10 | Kebijakan retensi data (karyawan resign, audit log, slip gaji) dan kebutuhan kepatuhan UU PDP? | Fase 2 |
| 11 | Zona waktu operasional (kantor/staf tersebar di lebih dari satu zona)? Default `Asia/Jakarta`. | Fase 1 |
| 12 | Apakah Pemantik akan dipindah ke VPS yang sama atau tetap terpisah? Apakah RBAC/UI akan dipakai bersama? | Pasca Fase 3 |
| 13 | Rekrutmen & Pelatihan: masuk sebelum go-live atau pasca go-live? | Fase 4 |

---

## 17. Lampiran

### 17.1 Variabel environment

| Variabel | Dev | Prod | Keterangan |
| --- | --- | --- | --- |
| `DATABASE_URL` | ✔ | ✔ | Prod: memakai role `APP_DB_USER`; job migrate memakai role pemilik |
| `HRIS_URL`, `SYSMGMT_URL` | ✔ | ✔ | URL publik tiap app |
| `AUTH_SECRET` | ✔ | ✔ | ≥ 32 byte acak; sama untuk kedua app |
| `AUTH_COOKIE_DOMAIN` | kosong | `.domain-pspk.example` | Berbagi sesi antar subdomain |
| `DATA_ENCRYPTION_KEY` | ✔ | ✔ | Kunci AES-256 (base64, 32 byte); **backup terpisah** |
| `STORAGE_DRIVER` | `local` | `local` | `s3` di masa depan |
| `STORAGE_LOCAL_DIR` | `./.data/uploads` | `/app/uploads` | |
| `MAX_UPLOAD_MB` | `25` | `25` | Selaraskan dengan Caddy `request_body` |
| `APP_TIMEZONE` | `Asia/Jakarta` | `Asia/Jakarta` | Zona waktu tampilan |
| `POSTGRES_DB/USER/PASSWORD` | — | ✔ | Kredensial pemilik database (compose prod) |
| `APP_DB_USER/PASSWORD` | — | ✔ | Role aplikasi non-owner |
| `HRIS_DOMAIN`, `SYSMGMT_DOMAIN` | — | ✔ | Untuk Caddy dan URL publik |
| `SEED_ADMIN_EMAIL/PASSWORD`, `SEED_DEMO` | ✔ | sementara | Jangan disimpan permanen di server |

### 17.2 Ringkasan perintah

```bash
# Development
pnpm install
pnpm db:up                        # PostgreSQL lokal (Docker)
pnpm db:generate                  # prisma generate
pnpm db:migrate --name <nama>     # migration baru (dev)
pnpm db:seed                      # seed idempotent
pnpm db:studio                    # lihat data
pnpm db:tools                     # Adminer di http://localhost:8080
pnpm dev                          # hris :3001, sysmgmt :3002

# Kualitas
pnpm lint && pnpm typecheck && pnpm test && pnpm build

# Produksi (di VPS)
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f --tail=100 hris sysmgmt
./scripts/backup.sh
```

### 17.3 Referensi

Struktur modul, peran, rencana migrasi, roadmap, dan brand bersumber dari dokumen *Analisis & Blueprint HRIS & System Management PSPK* (September 2026). Bagian 7 blueprint (analisis biaya Vercel & Supabase) tidak dipakai lagi karena hosting berpindah ke VPS + Docker; perhitungan biaya VPS dilakukan terpisah setelah penyedia dan spesifikasi ditentukan.