# Dokumentasi Backlog & Roadmap Fitur HRIS PSPK (`apps/hris`)

> **Dokumen Referensi:**
> - *Dokumen Analisis & Blueprint Sistem HRIS & System Management PSPK*
> - `AGENTS.md` (Spesifikasi Teknis & Aturan Arsitektur)
> - `md/design_stitch.md` (Katalog Layar & Desain Google Stitch AI)
>
> **Status Proyek Saat Ini:**
> - **Fase 1 (Selesai):** Fondasi Monorepo, Database PostgreSQL Multi-schema, Better Auth, RBAC, Shared Packages.
> - **Login Portal (Selesai):** Screen P-C1 dengan animasi transisi antar portal.
> - **App Shell HRIS (Selesai):** Screen P-1A, P-1B, P-1C (Sidebar dinamis, Topbar, AppSwitcher, UserNav, dan Dashboard Multiperan Adaptif).

---

## Daftar Isi Backlog HRIS

1. [Status Fitur yang Sudah Selesai](#1-status-fitur-yang-sudah-selesai)
2. [Modul 1: Manajemen Data Karyawan (Core Employee)](#2-modul-1-manajemen-data-karyawan-core-employee)
3. [Modul 2: Absensi & Presensi Waktu Nyata (Attendance)](#3-modul-2-absensi--presensi-waktu-nyata-attendance)
4. [Modul 3: Manajemen Cuti & Izin (Leave Management)](#4-modul-3-manajemen-cuti--izin-leave-management)
5. [Modul 4: Penggajian & Slip Gaji (Payroll)](#5-modul-4-penggajian--slip-gaji-payroll)
6. [Modul 5: Evaluasi Kinerja & KPI (Performance)](#6-modul-5-evaluasi-kinerja--kpi-performance)
7. [Modul 6: Layanan Pendukung (Notifikasi & Profil Akun)](#7-modul-6-layanan-pendukung-notifikasi--profil-akun)
8. [Backend Services, API & Keamanan yang Perlu Dibangun](#8-backend-services-api--keamanan-yang-perlu-dibangun)
9. [Tabel Matriks Backlog, Rute, Permission & Prioritas](#9-tabel-matriks-backlog-rute-permission--prioritas)

---

## 1. Status Fitur yang Sudah Selesai

| Komponen / Layar | Rute | Status | Keterangan |
| :--- | :--- | :---: | :--- |
| **Login Bersama (P-C1)** | `/login` | ✅ Selesai | Autentikasi Better Auth, switch portal HRIS ↔ SysMgmt. |
| **App Shell HRIS** | `/(app)/*` | ✅ Selesai | Sidebar dinamis 3 peran, Topbar, AppSwitcher, UserNav. |
| **Dashboard HRIS (P-1A/B/C)** | `/dashboard` | ✅ Selesai | Tampilan adaptif Admin HR, Manajer Tim, dan Karyawan/Staff. |
| **RBAC Engine** | `@pspk/rbac` | ✅ Selesai | 56 permission, 5 peran sistem, helper `can()`, `assertCan()`. |
| **Database Schemas** | `@pspk/db` | ✅ Selesai | PostgreSQL multi-schema (`core`, `hris`, `sysmgmt`). |

---

## 2. Modul 1: Manajemen Data Karyawan (Core Employee)

> **Fokus Utama:** Mengelola siklus hidup data pegawai PSPK, arsip berkas digital, kontrak kerja, hierarki tim, dan data sensitif terenkripsi.

### 2.1 Daftar Karyawan (`/karyawan`) — Layar H4
* **Aktor:** Admin HR, Manajer (data tim saja), Super Admin.
* **Fitur yang Perlu Dibuat:**
  - [ ] Tabel data pegawai terintegrasi dengan tabel database `hris.employees`.
  - [ ] Server-side pagination & sorting (berdasarkan nama, NIP, tanggal masuk).
  - [ ] Bilah pencarian instan (nama lengkap, NIP, email, keahlian riset).
  - [ ] Filter multi-kriteria:
    - Status Kepegawaian: `ACTIVE`, `PROBATION`, `ON_LEAVE`, `RESIGNED`, `TERMINATED`.
    - Tipe Kerja: `PERMANENT` (Tetap), `FIXED_TERM` (PKWT Riset), `PART_TIME_PROJECT`.
    - Departemen / Divisi (Kebijakan Kurikulum, Tata Kelola Pendidikan, Advokasi, Operasional).
  - [ ] Indikator visual peringatan kontrak fixed-term yang akan berakhir dalam $\le 30$ hari.
  - [ ] Tombol ekspor daftar karyawan ke format Excel/CSV.

### 2.2 Detail Profil Karyawan (`/karyawan/[id]`) — Layar H5 & H7
* **Aktor:** Admin HR (penuh), Manajer (timnya), Staff (hanya ID miliknya sendiri).
* **Fitur yang Perlu Dibuat:**
  - [ ] **Tab 1: Profil Umum:**
    - Identitas pribadi: Nama lengkap & gelar, nama panggilan, jenis kelamin, tempat/tanggal lahir, status pernikahan, alamat domisili, nomor HP pribadi, kontak darurat.
  - [ ] **Tab 2: Data Sensitif Terenkripsi:**
    - NIK (Nomor Induk Kependudukan), NPWP, Nomor Rekening Bank & Nama Pemilik.
    - Nilai disimpan terenkripsi di database (`nikEnc`, `npwpEnc`, `bankAccountEnc`) via AES-256-GCM.
    - Tampilan default di-masking (contoh: `••••••••••••1234`).
    - Tombol "Lihat Lengkap" (Unmask) wajib memicu audit log `VIEW_SENSITIVE` dengan pencatatan `actorUserId`, IP, dan timestamp.
  - [ ] **Tab 3: Kontrak Kerja (`?tab=kontrak`):**
    - Riwayat kontrak kerja dari `hris.employment_contracts`.
    - Status kontrak: `ACTIVE`, `EXPIRED`, `TERMINATED`, `RENEWED`.
    - Nilai gaji pokok kontrak (`baseSalary`), tanggal mulai, tanggal selesai.
    - Unduh berkas digital kontrak kerja (.pdf) via secure authenticated route.
  - [ ] **Tab 4: Jabatan & Departemen:**
    - Posisi saat ini (`Position`), Divisi (`Department`), Atasan Langsung (`managerId`).
    - Riwayat mutasi/promosi (`hris.employment_histories`).
  - [ ] **Tab 5: Dokumen & Berkas Digital:**
    - Manajemen arsip: KTP, NPWP, Ijazah, CV, Sertifikat, SK Penugasan.
    - Pratinjau dokumen & unduhan aman.

### 2.3 Formulir Karyawan Baru & Edit (`/karyawan/baru`, `/karyawan/[id]/ubah`) — Layar H6
* **Aktor:** Admin HR.
* **Fitur yang Perlu Dibuat:**
  - [ ] Form bertahap (*multi-step wizard*) menggunakan `react-hook-form` + validasi `Zod`:
    - Langkah 1: Identitas Pribadi & Kontak.
    - Langkah 2: Data Penempatan (NIP, Departemen, Posisi, Manajer, Tipe Kontrak, Tanggal Masuk).
    - Langkah 3: Kompensasi & Data Sensitif (Gaji Pokok, NIK, NPWP, Rekening Bank).
    - Langkah 4: Unggah Dokumen Berkas.
  - [ ] Generator otomatis NIP (Nomor Induk Pegawai) sesuai konvensi HR PSPK.
  - [ ] Opsi otomatis mengundang akun pengguna (`User`), membuat kredensial, dan menautkan `Employee.userId`.

### 2.4 Struktur Organisasi Interaktif (`/karyawan/struktur`) — Layar H8
* **Aktor:** Seluruh pegawai (Read-only), Admin HR (Dapat mengubah atasan).
* **Fitur yang Perlu Dibuat:**
  - [ ] Visualisasi bagan pohon organisasi (*Org Chart*) PSPK secara interaktif.
  - [ ] Menampilkan hubungan hierarki dari Direktur Eksekutif $\to$ Kepala Divisi $\to$ Peneliti Utama $\to$ Peneliti Muda $\to$ Staf Teknis.
  - [ ] Pencarian pegawai langsung pada diagram bagan.

### 2.5 Wizard Impor Data Pegawai dari Excel (`/karyawan/impor`) — Layar H23
* **Aktor:** Admin HR.
* **Fitur yang Perlu Dibuat:**
  - [ ] Unggah file template spreadsheet Excel (.xlsx).
  - [ ] Validasi skema pra-impor (cek duplikasi NIP, format email valid, NIK valid).
  - [ ] Pratinjau tabel hasil bacaan file sebelum dieksekusi ke database.
  - [ ] Eksekusi transaksi database batch dengan pencatatan audit log `IMPORT_EMPLOYEES`.
  - [ ] Laporan detail baris yang berhasil diimpor dan baris yang gagal beserta alasannya.

---

## 3. Modul 2: Absensi & Presensi Waktu Nyata (Attendance)

> **Fokus Utama:** Pencatatan presensi kerja berbasis waktu server untuk integritas data, rekapitulasi kehadiran tim, serta koreksi presensi resmi.

### 3.1 Absensi Mandiri Pegawai (`/absensi`) — Layar H9
* **Aktor:** Seluruh Karyawan (Staff, Manajer, HR).
* **Fitur yang Perlu Dibuat:**
  - [ ] Tombol aksi cepat: **Check-in Masuk** dan **Check-out Pulang**.
  - [ ] Penggunaan **waktu server** (`now()` di PostgreSQL), memblokir manipulasi waktu dari jam lokal perangkat client.
  - [ ] Deteksi status kehadiran harian otomatis:
    - `PRESENT` (Tepat Waktu, misal: check-in $\le$ 09:00 WIB).
    - `LATE` (Terlambat).
    - `WFH` (Work From Home / Tugas Lapangan).
    - `LEAVE` (Otomatis terisi jika ada pengajuan cuti yang disetujui).
    - `HOLIDAY` (Hari libur nasional / cuti bersama).
  - [ ] Kalender bulanan presensi mandiri dengan indikator warna status per hari.
  - [ ] Ringkasan statistik kehadiran bulan berjalan (Total Hadir, Terlambat, Izin).

### 3.2 Rekapitulasi Presensi Lembaga & Tim (`/absensi/rekap`) — Layar H10
* **Aktor:** Admin HR (Seluruh lembaga), Manajer (Anggota timnya).
* **Fitur yang Perlu Dibuat:**
  - [ ] Tabel rekap kehadiran per hari atau per rentang periode tanggal (bulanan/mingguan).
  - [ ] Filter berdasarkan divisi, status kerja, atau nama pegawai.
  - [ ] Form **Koreksi Absensi Manual oleh HR**:
    - Perubahan status jam masuk/keluar pegawai.
    - Kolom **Alasan Koreksi Wajib Diisi** (contoh: "Lupa absen saat penugasan dinas luar ke Kemendikbud").
    - Seluruh koreksi tercatat di tabel `Attendance` (`correctedById`, `correctionReason`) dan `core.audit_logs`.
  - [ ] Ekspor rekapitulasi presensi ke format Excel (.xlsx) untuk kebutuhan penggajian.

---

## 4. Modul 3: Manajemen Cuti & Izin (Leave Management)

> **Fokus Utama:** Pengajuan cuti terotomasi, kalkulator hari kerja murni (tanpa akhir pekan/libur nasional), alur persetujuan manajerial, dan kalender bersama.

### 4.1 Saldo & Riwayat Cuti Pribadi (`/cuti`) — Layar H11
* **Aktor:** Seluruh Karyawan.
* **Fitur yang Perlu Dibuat:**
  - [ ] Tampilan kartu saldo cuti tahunan: Kuota Awal (12 hari), Terpakai (`usedDays`), Sisa Hari Aktif.
  - [ ] Kuota cuti khusus (Cuti Sakit, Cuti Menikah, Cuti Melahirkan).
  - [ ] Tabel riwayat permohonan cuti beserta badge status:
    - `PENDING` (Kuning/Amber - Menunggu Persetujuan).
    - `APPROVED` (Hijau/Navy - Disetujui).
    - `REJECTED` (Merah - Ditolak).
    - `CANCELLED` (Abu-abu - Dibatalkan).
  - [ ] Tombol batalkan cuti untuk pengajuan yang berstatus `PENDING` atau `APPROVED` sebelum tanggal cuti dimulai.

### 4.2 Formulir Pengajuan Cuti (`/cuti/ajukan`) — Layar H12
* **Aktor:** Seluruh Karyawan.
* **Fitur yang Perlu Dibuat:**
  - [ ] Pilihan jenis cuti (`LeaveType`): Cuti Tahunan, Cuti Sakit, Cuti Khusus.
  - [ ] Date picker rentang tanggal mulai (`startDate`) dan tanggal selesai (`endDate`).
  - [ ] **Kalkulator Hari Kerja Otomatis**:
    - Menghitung durasi hari cuti riil tanpa menghitung hari Sabtu, Minggu, dan Hari Libur Nasional (`hris.holidays`).
  - [ ] Validasi bisnis ketat di sisi server:
    - Memastikan sisa kuota cuti mencukupi.
    - Memastikan tanggal tidak bertabrakan (*overlap*) dengan pengajuan cuti lain.
  - [ ] Form unggah dokumen lampiran (wajib jika `requiresAttachment = true`, misal: surat sakit dokter jika $>1$ hari).
  - [ ] Kolom alasan pengajuan cuti dan rencana serah terima tugas (*handover task*).

### 4.3 Persetujuan Cuti Manajer & HR (`/cuti/persetujuan`) — Layar H13
* **Aktor:** Manajer Tim (Menyetujui cuti timnya), Admin HR (Persetujuan akhir / override).
* **Fitur yang Perlu Dibuat:**
  - [ ] Daftar antrean pengajuan cuti berstatus `PENDING`.
  - [ ] Kartu rincian permohonan: nama pemohon, jabatan, jenis cuti, durasi, tanggal, sisa saldo kuota, alasan, dan pratinjau lampiran surat dokter/handover.
  - [ ] Tombol aksi:
    - **Setujui (`APPROVED`):** Mengurangi saldo cuti (`usedDays`), mengupdate status presensi pada tanggal tersebut menjadi `LEAVE`.
    - **Tolak (`REJECTED`):** Wajib menyertakan catatan/alasan penolakan.
  - [ ] Pengiriman notifikasi in-app otomatis ke pemohon cuti.

### 4.4 Kalender Cuti Bersama (`/cuti/kalender`) — Layar H14
* **Aktor:** Seluruh Karyawan.
* **Fitur yang Perlu Dibuat:**
  - [ ] Tampilan kalender tim bulanan untuk memantau jadwal cuti rekan kerja.
  - [ ] Membantu koordinasi antar tim peneliti agar jadwal survei lapangan dan rapat kemitraan tidak terganggu.

### 4.5 Pengaturan Kebijakan Cuti & Kalender Libur (`/cuti/pengaturan`) — Layar H15
* **Aktor:** Admin HR.
* **Fitur yang Perlu Dibuat:**
  - [ ] CRUD Master Jenis Cuti (`LeaveType`): nama jenis cuti, kuota default per tahun, opsi berbayar/unpaid, opsi wajib lampiran.
  - [ ] CRUD Kalender Hari Libur Nasional & Cuti Bersama (`Holiday`).
  - [ ] Pengaturan carry-forward (kebijakan perpanjangan sisa cuti ke tahun berikutnya).

---

## 5. Modul 4: Penggajian & Slip Gaji (Payroll)

> **Fokus Utama:** Siklus payroll bulanan, komponen tunjangan/potongan yang dapat dikonfigurasi, dan penerbitan slip gaji PDF resmi.

### 5.1 Periode Penggajian (`/payroll`) — Layar H16
* **Aktor:** Admin HR, Super Admin (Manajer tidak memiliki akses ke modul ini).
* **Fitur yang Perlu Dibuat:**
  - [ ] Tabel siklus penggajian bulanan (`PayrollPeriod`).
  - [ ] Status periode penggajian:
    - `DRAFT` $\to$ `CALCULATED` $\to$ `APPROVED` $\to$ `PUBLISHED` $\to$ `LOCKED`.
  - [ ] Pilihan jenis penggajian: Gaji Reguler Bulanan atau THR (`REGULAR` / `THR`).
  - [ ] Rekap total beban penggajian lembaga (Gross, Potongan, Netto) dan perbandingan dengan bulan sebelumnya.

### 5.2 Detail & Kalkulasi Payroll Periode (`/payroll/[periodId]`) — Layar H17
* **Aktor:** Admin HR.
* **Fitur yang Perlu Dibuat:**
  - [ ] Tombol aksi **Kalkulasi Payroll Massal**:
    - Menghitung gaji pokok dari kontrak kerja aktif.
    - Menambahkan tunjangan (tunjangan fungsional riset, tunjangan komunikasi/transport).
    - Menghitung potongan (BPJS Ketenagakerjaan, BPJS Kesehatan, PPh 21, cuti tak berbayar jika ada).
    - Menyimpan snapshot hasil kalkulasi ke tabel `Payslip` dan `PayslipLine`.
  - [ ] Tombol aksi perubahan status siklus: `APPROVE`, `PUBLISH` (slip gaji muncul di akun staf), dan `LOCK` (penguncian final).
  - [ ] Ekspor rekap penggajian ke format spreadsheet perbankan untuk transfer payroll.

### 5.3 Komponen Gaji per Pegawai (`/payroll/komponen/[employeeId]`) — Layar H18
* **Aktor:** Admin HR.
* **Fitur yang Perlu Dibuat:**
  - [ ] Master komponen gaji: Tunjangan (*Earning*) dan Potongan (*Deduction*).
  - [ ] Konfigurasi nilai: Nominal Tetap (*Fixed*), Persentase dari Gaji Pokok, atau Perhitungan Manual.
  - [ ] Penugasan komponen gaji ke masing-masing karyawan beserta tanggal efektif berlakunya.

### 5.4 Slip Gaji Mandiri Pegawai (`/slip-gaji`) — Layar H19
* **Aktor:** Seluruh Karyawan (hanya dapat melihat slip miliknya sendiri).
* **Fitur yang Perlu Dibuat:**
  - [ ] Daftar slip gaji bulanan yang berstatus `PUBLISHED`.
  - [ ] Tampilan rincian take-home pay: Pendapatan, Potongan, Gaji Bersih.
  - [ ] Tombol **Unduh Slip Gaji PDF Resmi**:
    - Generator file PDF di sisi server (menggunakan `@react-pdf/renderer` yang ringan).
    - Berisi kop resmi PSPK, tanda tangan digital/verifikasi lembaga, dan rincian komponen terenkripsi.

---

## 6. Modul 5: Evaluasi Kinerja & KPI (Performance)

> **Fokus Utama:** Penetapan target sasaran riset/kerja (OKR/KPI) dan siklus evaluasi berkala.

### 6.1 Manajemen Kinerja Lembaga & Tim (`/kinerja`) — Layar H20
* **Aktor:** Admin HR (Konfigurasi siklus), Manajer (Menilai tim), Staff (Evaluasi diri).
* **Fitur yang Perlu Dibuat:**
  - [ ] Pembuatan periode evaluasi kinerja (`PerformancePeriod`, misal: Semester Ganjil 2026).
  - [ ] Penyusunan sasaran kerja / target OKR pegawai (`PerformanceGoal`):
    - Judul target, deskripsi, indikator keberhasilan, dan bobot (total bobot = 100%).
  - [ ] Alur Penilaian:
    - **Self-Review:** Pegawai mengisi capaian dan refleksi evaluasi diri.
    - **Manager-Review:** Manajer memberikan skor penilaian, evaluasi kualitatif, dan rekomendasi pengembangan.
    - **Finalisasi:** HR Lead dan Direksi mengunci hasil penilaian.

---

## 7. Modul 6: Layanan Pendukung (Notifikasi & Profil Akun)

### 7.1 Profil Saya & Keamanan Akun (`/profil`) — Layar C2
* **Aktor:** Seluruh Pegawai.
* **Fitur yang Perlu Dibuat:**
  - [ ] Halaman profil pribadi: melihat biodata resmi dan mengunggah foto avatar profil.
  - [ ] Tab Keamanan: Formulir ubah kata sandi akun (validasi kata sandi saat ini & konfirmasi kata sandi baru).
  - [ ] Riwayat sesi login aktif pada perangkat yang digunakan.

### 7.2 Pusat Notifikasi In-App (`/notifikasi`) — Layar C3
* **Aktor:** Seluruh Pegawai.
* **Fitur yang Perlu Dibuat:**
  - [ ] Halaman daftar seluruh notifikasi masuk (Persetujuan cuti, pengingat presensi, pengumuman payroll, pengingat kontrak).
  - [ ] Fitur tandai semua telah dibaca (*Mark all as read*).

---

## 8. Backend Services, API & Keamanan yang Perlu Dibangun

Untuk mendukung seluruh halaman di atas, arsitektur backend Next.js App Router pada `apps/hris` memerlukan:

```
apps/hris/src/
├─ server/
│  ├─ services/                  # Business Logic Murni (Bebas dari React/Next)
│  │  ├─ employee.service.ts     # CRUD pegawai, validasi NIP, enkripsi NIK/bank
│  │  ├─ attendance.service.ts   # Check-in/out waktu server, rekapitulasi, koreksi HR
│  │  ├─ leave.service.ts        # Hitung hari kerja, cek saldo, approval workflow
│  │  ├─ payroll.service.ts      # Kalkulasi gaji, snapshot slip gaji, locking
│  │  └─ performance.service.ts  # Penetapan OKR & form penilaian kinerja
│  ├─ actions/                   # Next.js Server Actions (Zod -> assertCan -> Service -> Audit)
│  │  ├─ employee.actions.ts
│  │  ├─ attendance.actions.ts
│  │  ├─ leave.actions.ts
│  │  └─ payroll.actions.ts
│  └─ queries/                   # Database Queries Cepat untuk Server Components
│     ├─ employee.queries.ts
│     ├─ attendance.queries.ts
│     ├─ leave.queries.ts
│     └─ payroll.queries.ts
└─ app/api/
   └─ files/[...key]/route.ts    # Secure authenticated file streaming (StorageProvider)
```

---

## 9. Tabel Matriks Backlog, Rute, Permission & Prioritas

| No | Modul & Fitur | Target Rute | Permission Minimum (`@pspk/rbac`) | Prioritas Pengerjaan |
| :---: | :--- | :--- | :--- | :---: |
| 1 | **Daftar Karyawan** | `/karyawan` | `hris.employee.read:all` / `:team` | **P1 (Fase 2)** |
| 2 | **Detail Profil Karyawan** | `/karyawan/[id]` | `hris.employee.read:own` / `:all` | **P1 (Fase 2)** |
| 3 | **Form Tambah & Edit Karyawan** | `/karyawan/baru` | `hris.employee.write:all` | **P1 (Fase 2)** |
| 4 | **Absensi Mandiri (Check-in/out)**| `/absensi` | `hris.attendance.read:own` | **P1 (Fase 2)** |
| 5 | **Rekap Presensi & Koreksi HR** | `/absensi/rekap` | `hris.attendance.read:team` / `:all` | **P1 (Fase 2)** |
| 6 | **Cuti Saya & Riwayat** | `/cuti` | `hris.leave.read:own` | **P1 (Fase 2)** |
| 7 | **Formulir Ajukan Cuti** | `/cuti/ajukan` | `hris.leave.create:own` | **P1 (Fase 2)** |
| 8 | **Persetujuan Cuti Manajer** | `/cuti/persetujuan` | `hris.leave.approve:team` / `:all` | **P1 (Fase 2)** |
| 9 | **Kalender Cuti Bersama** | `/cuti/kalender` | `hris.leave.read:team` | **P2 (Fase 2)** |
| 10 | **Pengaturan Tipe Cuti & Libur** | `/cuti/pengaturan` | `hris.leave.configure:all` | **P2 (Fase 2)** |
| 11 | **Struktur Organisasi (Org-Chart)**| `/karyawan/struktur` | `hris.employee.read:all` | **P2 (Fase 2)** |
| 12 | **Wizard Impor Excel Pegawai** | `/karyawan/impor` | `hris.employee.import:all` | **P2 (Fase 2)** |
| 13 | **Profil Akun & Keamanan** | `/profil` | Autentikasi Sesi Valid | **P2 (Fase 2)** |
| 14 | **Periode Payroll & Kalkulasi** | `/payroll` | `hris.payroll.read:all` | **P3 (Fase 4)** |
| 15 | **Komponen Gaji Pegawai** | `/payroll/komponen/[id]` | `hris.payroll.manage:all` | **P3 (Fase 4)** |
| 16 | **Slip Gaji Mandiri Staf (PDF)** | `/slip-gaji` | `hris.payslip.read:own` | **P3 (Fase 4)** |
| 17 | **Evaluasi Kinerja & KPI** | `/kinerja` | `hris.performance.read:own` | **P3 (Fase 4)** |
