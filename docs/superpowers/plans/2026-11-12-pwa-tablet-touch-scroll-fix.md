# Rencana Perbaikan Masalah Touch Scroll Tablet PWA HRIS PSPK

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Memulihkan kemampuan gestur gulir layar vertikal (*vertical touch scroll*) pada perangkat tablet/iPad di aplikasi PWA HRIS PSPK dengan menghapus class CSS `touch-pan-x` dari seluruh kontainer tabel, kalender, dan subnav tanpa merusak responsivitas gulir horizontal.

**Architecture:** Memperbaiki lapisan presentasi antarmuka komponen React Client Components di `apps/hris` dengan meniadakan utilitas `touch-pan-x` (yang mengaktifkan `touch-action: pan-x;` dan memblokir propagasi sentuh vertikal pada level peramban) dan memastikan kontainer tetap memakai `overflow-x-auto` standar dan `[overscroll-behavior-x:contain]` untuk isolasi riwayat navigasi swipe peramban.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript strict, Tailwind CSS 4, `@pspk/ui`.

**Spec:** Dokumen Analisis Audit Sentuh Tablet PWA HRIS & AGENTS.md (November 2026).

## Global Constraints

- Sesuai instruksi pengguna: rencana dibagi menjadi beberapa task, **maksimal 2 file per task**, dan dieksekusi **1 task per respon**.
- Warna & brand: Tetap mempertahankan palet institusi PSPK (Navy `#102E50`, Gold `#F2AF3E`, Maroon `#A8281C`).
- Bahasa teks antarmuka: Bahasa Indonesia yang baku dan profesional.
- Dilarang menjalankan `git push` atau `git commit` otomatis tanpa persetujuan eksplisit pengguna (Rule 0.1).
- Seluruh verifikasi wajib lolos typecheck (`pnpm --filter @pspk/hris typecheck`) dan linting.

## Review Focus

1. **Gestur Sentuh Dua Arah di Tablet:** Usapan jari ke atas/bawah pada tabel dan grid tanggal kalender harus menggulir halaman secara mulus, sedangkan usapan ke kiri/kanan tetap menggulir tabel jika konten melebihi lebar layar.
2. **Tidak Ada Regresi Desktop & Ponsel:** Tampilan desktop dengan mousewheel dan tampilan ponsel dengan touch layout kartu (`sm:hidden`) tetap berfungsi normal tanpa perubahan visual.
3. **Penyelarasan Sticky Header:** Kolom `sticky left-0` (seperti nama pegawai di matriks absensi) tetap menempel rapi saat tabel digeser horizontal.
4. **Isolasi Riwayat Navigasi Peramban:** Mempertahankan `[overscroll-behavior-x:contain]` pada kontainer horizontal agar tarikan jari hingga batas ujung tidak memicu gestur "back/forward swipe" di Safari iOS/iPadOS atau Chrome Android.
5. **Integritas Tipe TypeScript:** Tidak ada kesalahan kompilasi atau regresi antarmuka properti komponen.

---

### Task 1: Kalender Kerja & Tabel Riwayat Kehadiran Staf (2 File)

**Files:**
- Modify: `apps/hris/src/components/kalender/work-calendar-view.tsx:505,693`
- Modify: `apps/hris/src/components/absensi/attendance-table.tsx:252`

**Detail Perubahan:**
1. Di `work-calendar-view.tsx`:
   - Baris 505 (Bilah Filter Pill Kategori): Hapus `touch-pan-x`.
   - Baris 693 (Kontainer Grid Kalender Tanggal): Hapus `touch-pan-x` dari `<div className="p-4 md:p-6 w-full min-w-0 max-w-full overflow-x-auto [overscroll-behavior-x:contain] touch-pan-x scrollbar-none">`.
2. Di `attendance-table.tsx`:
   - Baris 252 (Kontainer Tabel Riwayat Kehadiran Desktop/Tablet `sm:block`): Hapus `touch-pan-x` dari `<div className="hidden sm:block overflow-x-auto w-full min-w-0 max-w-full [overscroll-behavior-x:contain] touch-pan-x">`.

- [x] **Step 1: Hapus `touch-pan-x` di `work-calendar-view.tsx`**
- [x] **Step 2: Hapus `touch-pan-x` di `attendance-table.tsx`**
- [x] **Step 3: Verifikasi typecheck task 1**
  Run: `pnpm --filter @pspk/hris typecheck`
  Expected: PASS tanpa error.

---

### Task 2: Rekap Presensi & Persetujuan Cuti Manajer/HR (2 File)

**Files:**
- Modify: `apps/hris/src/components/absensi/attendance-rekap-view.tsx:627,864`
- Modify: `apps/hris/src/components/cuti/leave-approval-view.tsx:209,413`

**Detail Perubahan:**
1. Di `attendance-rekap-view.tsx`:
   - Baris 627 (Kontainer Matriks Kalender Presensi Bulanan Pegawai): Hapus `touch-pan-x` dari `<div className="overflow-x-auto w-full min-w-0 [overscroll-behavior-x:contain] touch-pan-x">`.
   - Baris 864 (Kontainer Tabel Ringkasan Log Presensi Pegawai `sm:block`): Hapus `touch-pan-x` dari `<div className="hidden sm:block overflow-x-auto w-full min-w-0 max-w-full [overscroll-behavior-x:contain] touch-pan-x">`.
2. Di `leave-approval-view.tsx`:
   - Baris 209 (Bilah Tabs Swipeable Status Permohonan Cuti): Hapus `touch-pan-x`.
   - Baris 413 (Kontainer Tabel Permohonan Cuti `sm:block`): Hapus `touch-pan-x` dari `<div className="hidden sm:block w-full min-w-0 max-w-full overflow-x-auto [overscroll-behavior-x:contain] touch-pan-x">`.

- [x] **Step 1: Hapus `touch-pan-x` di `attendance-rekap-view.tsx`**
- [x] **Step 2: Hapus `touch-pan-x` di `leave-approval-view.tsx`**
- [x] **Step 3: Verifikasi typecheck task 2**
  Run: `pnpm --filter @pspk/hris typecheck`
  Expected: PASS tanpa error.

---

### Task 3: Tabel Periode & Detail Penggajian HR (2 File)

**Files:**
- Modify: `apps/hris/src/components/payroll/payroll-period-table.tsx:269`
- Modify: `apps/hris/src/components/payroll/payroll-detail-view.tsx:785`

**Detail Perubahan:**
1. Di `payroll-period-table.tsx`:
   - Baris 269 (Kontainer Tabel Periode Penggajian `sm:block`): Hapus `touch-pan-x` dari `<div className="hidden sm:block w-full min-w-0 max-w-full overflow-x-auto [overscroll-behavior-x:contain] touch-pan-x">`.
2. Di `payroll-detail-view.tsx`:
   - Baris 785 (Kontainer Tabel Daftar Slip Gaji Pegawai Per Periode `sm:block`): Hapus `touch-pan-x` dari `<div className="hidden sm:block w-full min-w-0 max-w-full overflow-x-auto [overscroll-behavior-x:contain] touch-pan-x">`.

- [ ] **Step 1: Hapus `touch-pan-x` di `payroll-period-table.tsx`**
- [ ] **Step 2: Hapus `touch-pan-x` di `payroll-detail-view.tsx`**
- [ ] **Step 3: Verifikasi typecheck task 3**
  Run: `pnpm --filter @pspk/hris typecheck`
  Expected: PASS tanpa error.

---

### Task 4: Subnav Header & Tab Navigasi Profil Pegawai (2 File)

**Files:**
- Modify: `apps/hris/src/components/shell/attendance-leave-subnav.tsx:76`
- Modify: `apps/hris/src/components/profil/profile-view.tsx:288`

**Detail Perubahan:**
1. Di `attendance-leave-subnav.tsx`:
   - Baris 76 (Bilah Subnav Menu Atas Absensi & Cuti): Hapus `touch-pan-x` dari class list nav wrapper horizontal.
2. Di `profile-view.tsx`:
   - Baris 288 (Bilah Sub-tab Navigasi Profil Pegawai): Hapus `touch-pan-x` dari kontainer horizontal sub-tab.

- [ ] **Step 1: Hapus `touch-pan-x` di `attendance-leave-subnav.tsx`**
- [ ] **Step 2: Hapus `touch-pan-x` di `profile-view.tsx`**
- [ ] **Step 3: Verifikasi typecheck task 4**
  Run: `pnpm --filter @pspk/hris typecheck`
  Expected: PASS tanpa error.

---

### Task 5: Bilah Filter Pusat Notifikasi & Verifikasi Akhir (1 File + Full Suite)

**Files:**
- Modify: `apps/hris/src/components/notifications/notification-center-view.tsx:378`

**Detail Perubahan:**
1. Di `notification-center-view.tsx`:
   - Baris 378 (Bilah Kategori Filter Notifikasi): Hapus `touch-pan-x` dari wrapper kontainer filter.
2. Pengujian & Verifikasi Menyeluruh:
   - Verifikasi tidak ada lagi kemunculan `touch-pan-x` di seluruh kode sumber `apps/hris/src`.
   - Jalankan `pnpm --filter @pspk/hris typecheck`.
   - Jalankan `pnpm --filter @pspk/hris lint`.
   - Jalankan `pnpm test`.

- [ ] **Step 1: Hapus `touch-pan-x` di `notification-center-view.tsx`**
- [ ] **Step 2: Cek sweep pencarian `touch-pan` pada workspace**
  Run: `grep -rn --exclude-dir={node_modules,.next,dist,.turbo} "touch-pan" apps/ packages/`
  Expected: Bersih / tidak ada lagi utilitas pemblokir scroll.
- [ ] **Step 3: Jalankan verifikasi menyeluruh (typecheck, lint, test)**
  Run: `pnpm --filter @pspk/hris typecheck && pnpm --filter @pspk/hris lint && pnpm test`
  Expected: Seluruh suite lolos tanpa kesalahan.

