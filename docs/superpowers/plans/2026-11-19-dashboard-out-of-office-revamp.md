# Dashboard HRIS: Daftar Karyawan Cuti & Perjalanan Dinas Lintas Divisi (Staf, Lead, HR) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menampilkan daftar karyawan yang sedang Cuti dan sedang Perjalanan Dinas (dari seluruh divisi & seluruh karyawan aktif) secara transparan, responsif, dan performan pada Dashboard Staf, Lead (Manajer), dan HR (Admin HR / Super Admin).

**Architecture:** 
1. Satu query layer terpadu `getTodayOutOfOfficeData()` yang memanfaatkan indeks komposit PostgreSQL (`Attendance[date, status]` dan `LeaveRequest[status, startDate, endDate]`) untuk performa tinggi tanpa N+1 query.
2. Satu komponen UI shared `OutOfOfficePanel` dengan tab switching interaktif (Cuti vs Perjalanan Dinas), touch target $\ge 44\text{px}$, filter pencarian cepat, empty state, dan tampilan avatar/divisi yang konsisten dengan brand PSPK.
3. Integrasi ke `staff-dashboard`, `manager-dashboard`, dan `hr-dashboard` dengan penyesuaian metrik kehadiran organisasi agar presensi `BUSINESS_TRIP` dihitung secara tepat.

**Tech Stack:** Next.js 15 (App Router, Server Components + Client Islands), TypeScript Strict, Prisma ORM, Tailwind CSS + Radix/Lucide icons, Vitest.

---

## Global Constraints
- Dilarang push / commit git otomatis tanpa instruksi pengguna (Rule 0.1).
- Eksekusi wajib dilakukan **1 Task per respons** dengan pre-check dan post-check (`pnpm typecheck`, `pnpm lint`, `pnpm test`).
- Bahasa UI dan pesan error dalam Bahasa Indonesia, kode dan variabel dalam Bahasa Inggris.
- Alasan cuti pribadi (`reason`) disembunyikan demi privasi karyawan, hanya menampilkan nama, divisi, tipe cuti, dan rentang tanggal.
- Agenda/kota tujuan perjalanan dinas (`notes` presensi) ditampilkan secara informatif dengan ikon pesawat (`Plane`) dan aksen warna indigo.

---

## File Structure

- **Create:** `apps/hris/src/server/queries/dashboard/out-of-office.queries.ts` — Query terpusat untuk mengambil personil cuti & perjalanan dinas hari ini.
- **Create:** `apps/hris/src/server/queries/dashboard/out-of-office.queries.test.ts` — Unit test query layer.
- **Create:** `apps/hris/src/components/dashboard/out-of-office-panel.tsx` — Komponen UI interaktif daftar karyawan cuti & dinas luar.
- **Modify:** `apps/hris/src/server/queries/dashboard/staff-dashboard.ts` — Memuat data out-of-office untuk staf.
- **Modify:** `apps/hris/src/components/dashboard/staff-dashboard.tsx` — Menampilkan panel pada sidebar staf.
- **Modify:** `apps/hris/src/server/queries/dashboard/manager-dashboard.ts` — Memuat data out-of-office dan update hitungan kehadiran tim.
- **Modify:** `apps/hris/src/components/dashboard/manager-dashboard.tsx` — Menampilkan panel pada sidebar manager.
- **Modify:** `apps/hris/src/server/queries/dashboard/hr-dashboard.ts` — Memuat data out-of-office dan update formula kehadiran HR.
- **Modify:** `apps/hris/src/components/dashboard/hr-dashboard.tsx` — Mengganti panel lama dengan panel terpadu baru.

---

## Implementation Tasks

### Task 1: Server Query Layer (`out-of-office.queries.ts` & Dashboard Data Loaders)

**Files:**
- Create: `apps/hris/src/server/queries/dashboard/out-of-office.queries.ts`
- Create: `apps/hris/src/server/queries/dashboard/out-of-office.queries.test.ts`
- Modify: `apps/hris/src/server/queries/dashboard/staff-dashboard.ts`
- Modify: `apps/hris/src/server/queries/dashboard/manager-dashboard.ts`
- Modify: `apps/hris/src/server/queries/dashboard/hr-dashboard.ts`

**Steps:**
- [x] Buat interface `OutOfOfficePerson` dan `TodayOutOfOfficeData`:
  ```ts
  export interface OutOfOfficePerson {
    id: string;
    employeeId: string;
    fullName: string;
    nickname?: string | null;
    employeeNo: string;
    photoKey?: string | null;
    department: string;
    position: string;
    kind: "LEAVE" | "BUSINESS_TRIP";
    typeLabel: string; // Misal: "Cuti Tahunan" atau "Perjalanan Dinas"
    info: string; // Misal: "18 Nov – 21 Nov 2026" atau "Riset Lapangan Lombok"
    startDate?: Date;
    endDate?: Date;
    checkInAt?: Date | null;
  }
  ```
- [x] Implementasikan fungsi `getTodayOutOfOfficeData()`:
  - Query 1: `LeaveRequest` dengan `status: "APPROVED"`, `startDate <= today && endDate >= today`, include data pegawai (`status: { in: ["ACTIVE", "PROBATION"] }`, `deletedAt: null`).
  - Query 2: `Attendance` dengan `date: today`, `status: "BUSINESS_TRIP"`, include data pegawai (`status: { in: ["ACTIVE", "PROBATION"] }`, `deletedAt: null`).
- [x] Hubungkan ke loader `getStaffDashboard`, `getManagerDashboard`, dan `getHrDashboard`.
- [x] Perbarui formula penghitungan kehadiran di `manager-dashboard.ts` dan `hr-dashboard.ts` agar menyertakan `BUSINESS_TRIP` sebagai bagian dari presensi aktif.
- [x] Tulis unit test di `out-of-office.queries.test.ts` untuk menguji skenario cuti dan dinas.
- [x] Jalankan verifikasi: `pnpm typecheck` dan `pnpm test`.

---

### Task 2: Komponen UI Shared (`out-of-office-panel.tsx`) & Integrasi di Dashboard Staf

**Files:**
- Create: `apps/hris/src/components/dashboard/out-of-office-panel.tsx`
- Modify: `apps/hris/src/components/dashboard/staff-dashboard.tsx`

**Steps:**
- [x] Implementasikan `OutOfOfficePanel`:
  - Tab 1: **Cuti Hari Ini** (badge pill jumlah cuti, ikon `CalendarDays` / `Palmtree`).
  - Tab 2: **Perjalanan Dinas** (badge pill jumlah dinas, ikon `Plane`, palet indigo).
  - Quick Search input (otomatis muncul jika salah satu list $> 3$ pegawai untuk memfilter nama/divisi dengan cepat).
  - Kartu Karyawan:
    - Avatar bulat (menampilkan gambar profil jika ada, atau fallback 2 inisial nama).
    - Nama lengkap pegawai & badge divisi/departemen.
    - Sub-keterangan: tanggal cuti untuk Cuti; teks agenda/tujuan dari `notes` untuk Perjalanan Dinas.
  - Empty state ramah ketika tidak ada yang cuti/dinas.
  - Scrollable container dengan `max-h-[360px] overflow-y-auto` agar tidak memakan ruang berlebih.
- [x] Integrasikan `OutOfOfficePanel` ke `staff-dashboard.tsx` di kolom samping antara "Atasan langsung" dan "Dokumen & panduan".
- [x] Jalankan verifikasi: `pnpm typecheck`, `pnpm lint`, `pnpm test`.

---

### Task 3: Integrasi & Refinement UI pada Dashboard Lead / Manager (`manager-dashboard.tsx`)

**Files:**
- Modify: `apps/hris/src/components/dashboard/manager-dashboard.tsx`

**Steps:**
- [x] Pasang `OutOfOfficePanel` pada kolom samping `manager-dashboard.tsx` (di bawah "Jadwal tim pekan ini").
- [x] Sesuaikan heading kolom samping agar jelas membedakan antara:
  1. *Jadwal tim pekan ini* (khusus bawahan langsung manajer).
  2. *Di luar kantor hari ini* (seluruh divisi & seluruh karyawan PSPK).
- [x] Periksa responsivitas pada layar smartphone, tablet, dan desktop.
- [x] Jalankan verifikasi: `pnpm typecheck`, `pnpm lint`, `pnpm test`.

---

### Task 4: Integrasi & Modernisasi UI pada Dashboard HR (`hr-dashboard.tsx`) & Verifikasi Komprehensif

**Files:**
- Modify: `apps/hris/src/components/dashboard/hr-dashboard.tsx`

**Steps:**
- [x] Ganti panel lama *"Sedang cuti hari ini"* (yang tadinya dibatasi 6 baris) dengan `OutOfOfficePanel` yang baru dan komprehensif.
- [x] Pastikan badge metrik persentase kehadiran HR di strip atas merefleksikan jumlah hadir termasuk dinas secara akurat.
- [x] Lakukan pengujian multi-peran pada role preview switch Super Admin (`pspk_role_view` cookie: staff, manager, admin_hr).
- [x] Jalankan verifikasi akhir:
  - `pnpm typecheck` (9/9 packages lolos)
  - `pnpm lint` (0 error, 0 warning)
  - `pnpm test` (seluruh suite test lolos)
