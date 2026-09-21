# PSPK Platform — Kumpulan Prompt Google Stitch

> Pasangan dari `AGENTS.md` (Spesifikasi Implementasi HRIS & System Management PSPK). Dokumen ini berisi prompt siap tempel untuk membuat seluruh desain UI di **Google Stitch**, lalu prompt untuk mengonversinya menjadi kode lewat **Antigravity + Stitch MCP**.
>
> Prompt desain ditulis dalam **Bahasa Inggris** agar instruksi layout lebih presisi; **semua teks yang tampil di desain tetap Bahasa Indonesia**. Anda boleh menerjemahkan prompt ke Bahasa Indonesia jika hasilnya lebih Anda sukai.

---

## Daftar Isi

1. Cara memakai (urutan kerja)
2. Global Context Block
3. Prompt 0 — Design System
4. Prompt 1 — App Shell (HRIS, System Management, tampilan per peran)
5. Layar bersama (login, dashboard, state kosong/error)
6. Layar HRIS
7. Layar System Management
8. Varian mobile (Staff)
9. Prompt iterasi & perbaikan
10. Prompt konversi untuk Antigravity (Stitch MCP → kode)
11. Checklist QA desain
12. Peta layar → route → permission → fase
13. Lampiran A: template `DESIGN.md` · Lampiran B: data dummy konsisten

---

## 1. Cara memakai (urutan kerja)

1. Buka Stitch, buat **satu project** bernama `PSPK Platform`, tipe **Web**. Pilih model dengan kualitas tertinggi yang tersedia di akun Anda.
2. Jalankan berurutan: **Prompt 0** (design system) → **Prompt 1** (app shell) → layar satu per satu. **Satu layar per prompt**; jangan meminta banyak layar sekaligus.
3. Tetap di project yang sama agar Stitch menjaga konsistensi. Jika memulai project/percakapan baru, awali prompt dengan **Global Context Block** (Bagian 2).
4. Setelah setiap layar, cek dengan **Checklist QA** (Bagian 11) dan perbaiki dengan prompt iterasi (Bagian 9).
5. Setelah design system final, ambil/ekspor `DESIGN.md` dari Stitch dan simpan di `docs/DESIGN.md` di repo. Jika Stitch tidak menyediakannya, pakai template di Lampiran A.
6. Hubungkan Stitch MCP di Antigravity (Bagian 10), lalu konversi layar per fase sesuai roadmap di `AGENTS.md`.

**Aturan emas**

- **Data dummy saja.** Pakai dataset di Lampiran B. Jangan memasukkan data karyawan, gaji, atau dokumen asli ke Stitch.
- Nama layar di Stitch memakai ID prompt (mis. `H4 Daftar Karyawan`) supaya mudah dipetakan ke route di Bagian 12.
- Desain tidak menentukan logika bisnis. Aturan cuti, payroll, dan RBAC mengikuti `AGENTS.md`; angka di desain hanyalah contoh.

---

## 2. Global Context Block

Tempel di awal prompt pertama pada project/percakapan baru (atau jika hasil mulai keluar dari brand).

```text
PROJECT CONTEXT (apply to every screen):
Product: "PSPK Platform" — internal web apps for PSPK (Pusat Studi Pendidikan dan
Kebijakan), an independent education-policy research nonprofit in Indonesia.
Two apps: (1) HRIS, (2) System Management. Used by 20–200 internal staff.
Desktop-first, fully responsive down to tablet and phone.

LANGUAGE: ALL visible UI text in Bahasa Indonesia. Dates like "21 September 2026",
currency like "Rp 8.500.000", 24-hour time (e.g. 08.30).

DESIGN SYSTEM: navy #102E50 = primary (sidebar, headers, primary buttons);
gold #F2AF3E = accent / secondary CTA (always with navy text on gold, never gold
text on white); maroon #A8281C = destructive actions and errors. Neutrals: warm gray
scale, white surfaces, very light gray-blue page background (#F5F7FA).
Headings: Lora (serif). Body/UI: Rubik. Radius 8px, subtle shadows, generous
whitespace, body 14–16px, table rows ~48px.

TONE: professional, calm, trustworthy. No stock photos, no gradients, no
glassmorphism, no playful illustrations. Minimal line icons.

STATUS COLORS: success = muted green; pending/warning = amber tinted from gold;
danger/rejected = maroon; info/neutral = navy tint. Never rely on color alone:
always pair with a text label or icon.

DATA: dummy only, fictional Indonesian names. Never use real people or real data.

ACCESSIBILITY: WCAG AA contrast, visible focus ring, labels on all inputs,
touch targets >= 44px on mobile.
```

---

## 3. Prompt 0 — Design System

```text
Create the design system for "PSPK Platform" as a reference board plus reusable
components. Use the PROJECT CONTEXT above.

Show:
1. Color palette: navy #102E50, gold #F2AF3E, maroon #A8281C, each with a tint/shade
   scale (50–900), plus neutral grays, page background #F5F7FA, and status colors
   (success green, warning amber, danger maroon, info navy-tint) with soft
   background + strong text variants for badges.
2. Typography scale: Lora for h1–h3 (page title, section title, card title),
   Rubik for body, labels, table text, captions, and numbers. Include sizes,
   weights, and line heights.
3. Spacing scale (4px base), radius (8px default, 12px cards), shadows (2 levels),
   focus ring style.
4. Components with all states (default, hover, focus, disabled, error):
   - Buttons: primary (navy), secondary (gold with navy text), outline, ghost,
     destructive (maroon), icon button, loading state.
   - Inputs: text, textarea, select, date picker, date-range picker, file upload
     dropzone, search field, checkbox, radio, switch, masked sensitive field
     ("••••1234" with a "Tampilkan" button and small note "Aksi ini dicatat").
   - Data table: header, sortable columns, row hover, selected row, row actions
     menu, pagination, filter bar, bulk-action bar, empty table state.
   - Status badges: Aktif, Nonaktif, Menunggu, Disetujui, Ditolak, Dibatalkan,
     Draf, Dikunci, Dipublikasikan.
   - Cards: stat card, list card, info card with icon.
   - Tabs, breadcrumbs, stepper, timeline, avatar with initials, tooltip.
   - Dialog, side drawer, confirm dialog (destructive variant with maroon button),
     toast (success/error/info), inline alert banner, skeleton loader.
   - Empty state (icon + title + helper text + CTA) and error state.
5. Iconography: consistent line icon set, 1.5px stroke.
Keep it clean, professional, and compact.
```

---

## 4. Prompt 1 — App Shell

### P-1A — Shell HRIS (tampilan Admin HR)

```text
Design the HRIS application shell, desktop 1440px, Admin HR view.
Left sidebar (navy, 264px, collapsible to icons) with the PSPK wordmark placeholder
at top and menu items (icon + label): Beranda, Karyawan, Absensi, Cuti, Payroll,
Kinerja, Rekrutmen, Pelatihan, Pengaturan. Active item highlighted with a gold left
indicator.
Top bar (white): breadcrumb on the left; on the right an APP SWITCHER dropdown
("HRIS" active, "System Management" as the other option), a notification bell with
a badge, and a user menu (avatar initials "RA", name "Ratna Aprilia", role
"Admin HR", items: Profil Saya, Ganti Password, Keluar).
Content area: page title in Lora, subtitle, primary action button on the right, and
an empty content placeholder. Page background #F5F7FA.
```

### P-1B — Shell HRIS tampilan Karyawan (Staff)

```text
Same HRIS shell, but the Staff (Karyawan) view. Sidebar items: Beranda, Profil Saya,
Absensi Saya, Cuti Saya, Slip Gaji, Kinerja Saya, Pelatihan Saya. No admin items.
User menu shows name "Made Wirawan", role "Karyawan".
```

### P-1C — Shell HRIS tampilan Manajer

```text
Same HRIS shell, Manager (Manajer) view. Sidebar: Beranda, Tim Saya, Persetujuan
Cuti (with a count badge "3"), Absensi Tim, Kinerja Tim, then a divider and the
personal items: Profil Saya, Absensi Saya, Cuti Saya, Slip Gaji.
User menu shows name "Agus Prasetyo", role "Manajer".
```

### P-1D — Shell System Management (Admin IT)

```text
Design the System Management application shell, same visual language and layout as
the HRIS shell, desktop 1440px, Admin IT view. Sidebar: Beranda, Pengguna,
Role & Akses, Aset, Lisensi Software, Dokumen & SOP, Audit Log, Pengaturan.
App switcher shows "System Management" active. User menu: "Dewi Lestari",
role "Admin IT".
```

### P-1E — Shell System Management tampilan Karyawan

```text
System Management shell, Staff view: sidebar only has Beranda, Dokumen & SOP,
Aset Saya. App switcher lets the user go back to HRIS.
```

---

## 5. Layar bersama

### P-C1 — Login

```text
Design the login page (desktop, split layout). Left: navy panel with the PSPK
wordmark placeholder, a short tagline in Lora "Satu platform untuk pengelolaan SDM
dan sistem PSPK", and a subtle abstract pattern using navy tints (no photos).
Right: white card with title "Masuk", fields Email and Password (show/hide toggle),
link "Lupa password?", primary button "Masuk", inline error banner example state
"Email atau password salah". Small footer "© PSPK". Include a second frame with the
loading state of the button.
```

### P-C2 — Ganti Password & Profil Saya

```text
Design a "Profil Saya" page with two sections: account info (name, email, role
badges, read-only) and "Ganti Password" form (password lama, password baru, konfirmasi
password) with a password strength meter and a requirements checklist (minimal 12
karakter). Primary button "Simpan Password". Success toast state.
```

### P-C3 — Notifikasi

```text
Design a notifications dropdown panel (from the bell icon) and a full page
"Notifikasi": list grouped by "Hari ini" and "Sebelumnya", each item with icon, text
(e.g. "Made Wirawan mengajukan Cuti Tahunan 3 hari"), relative time, unread dot, and
a link to the related item. Filter tabs: Semua, Belum dibaca. Button "Tandai semua
dibaca".
```

### P-C4 — State khusus (403, 404, kosong, error)

```text
Design four small full-content-area states in the shell: 403 "Anda tidak memiliki
akses ke halaman ini" (with button "Kembali ke Beranda"), 404 "Halaman tidak
ditemukan", a generic empty state for a list ("Belum ada data"), and a server error
state "Terjadi kesalahan. Coba lagi." with a retry button. Friendly but professional,
line-icon only.
```

---

## 6. Layar HRIS

> Awali tiap prompt dengan: *"Continue in the PSPK design system and the HRIS shell."* (untuk layar Staff/Manajer, sebut tampilan peran yang dimaksud).

### P-H1 — Dashboard Admin HR

```text
Design the Admin HR dashboard "Beranda". Top row of 4 stat cards: Total Karyawan
(48), Hadir Hari Ini (41), Cuti Menunggu Persetujuan (5), Kontrak Berakhir ≤ 30 Hari
(3). Below, two columns: left "Kehadiran 7 Hari Terakhir" bar chart and "Karyawan
per Tipe Kepegawaian" donut (Tetap, Kontrak, Paruh Waktu/Proyek); right "Perlu
Tindakan" list (cuti menunggu, kontrak akan berakhir, periode payroll berjalan) with
quick action links, and "Sedang Cuti Hari Ini" list with avatars. Use restrained
chart colors from the palette.
```

### P-H2 — Beranda Karyawan (Staff)

```text
Design the Staff home "Beranda" (Staff shell). Greeting in Lora "Selamat pagi, Made".
Large "Absensi Hari Ini" card with current time, status ("Belum check-in"), primary
button "Check-in" (and the checked-in variant showing "Masuk 08.12" with "Check-out"
button). Row of cards: Sisa Cuti Tahunan (8 hari), Cuti Menunggu (1), Slip Gaji
Terbaru (Agustus 2026, "Lihat"). Below: "Pengajuan Terakhir" list with status badges
and "Dokumen & SOP Terbaru" list linking to System Management.
```

### P-H3 — Beranda Manajer

```text
Design the Manager home "Beranda" (Manager shell). Top: stat cards Anggota Tim (6),
Hadir Hari Ini (5), Persetujuan Menunggu (3). Main: "Persetujuan Cuti Menunggu" list
with requester avatar, leave type, dates, duration, and inline buttons "Setujui" /
"Tolak"; side: "Kalender Tim Minggu Ini" compact week view showing who is on leave.
```

### P-H4 — Daftar Karyawan

```text
Design "Karyawan" list page (Admin HR). Header with title, buttons "Impor dari Excel"
(outline) and "Tambah Karyawan" (primary). Filter bar: search (nama / no. pegawai),
select Status, select Departemen, select Tipe Kepegawaian. Data table columns:
avatar+Nama, No. Pegawai, Jabatan, Departemen, Tipe Kepegawaian (badge), Tanggal
Bergabung, Status (badge), row action menu. 10 dummy rows, pagination, "Menampilkan
1–10 dari 48". Include a bulk-selection state with an action bar.
```

### P-H5 — Detail Karyawan

```text
Design "Detail Karyawan" page. Header card: large avatar, name, position,
department, employee number, status badge, buttons "Ubah" and a more-menu. Tabs:
Profil, Kontrak, Riwayat Jabatan, Dokumen. Show the Profil tab: sections "Data
Pribadi", "Kontak & Darurat", "Data Sensitif" and "Rekening Bank". In "Data Sensitif"
NIK, NPWP and nomor rekening are masked (••••••••3412) each with a "Tampilkan"
button and a small helper note "Setiap akses dicatat di audit log". Right sidebar
card: Atasan Langsung, Tanggal Bergabung, Masa Kerja.
```

### P-H6 — Form Tambah/Ubah Karyawan

```text
Design "Tambah Karyawan" as a multi-section form page with a left step list
(Data Pribadi, Kepegawaian, Kontrak Awal, Data Sensitif & Rekening, Akun Login)
and a sticky footer with "Batal" and "Simpan". Fields: nama lengkap, nama panggilan,
tanggal lahir, tempat lahir, jenis kelamin, status pernikahan, alamat, telepon,
email kerja, kontak darurat; departemen, jabatan, atasan langsung (searchable
select), tanggal bergabung, tipe kepegawaian; NIK, NPWP, bank, nomor rekening;
toggle "Buat akun login & kirim undangan". Show one field-level validation error.
```

### P-H7 — Tab Kontrak (dan dialog kontrak)

```text
Design the "Kontrak" tab of an employee: table of contracts (Tipe: Tetap / Kontrak
(Fixed-term) / Paruh Waktu/Proyek, Mulai, Berakhir, Status badge, Dokumen link) with
the fixed-term contract highlighted by a warning badge "Berakhir dalam 24 hari".
Also design the "Tambah Kontrak" dialog: tipe kontrak, tanggal mulai, tanggal
berakhir (hidden for Tetap), gaji pokok, unggah dokumen, catatan.
```

### P-H8 — Struktur Organisasi

```text
Design "Struktur Organisasi": a tidy org chart tree (top-down) with person cards
(avatar, name, position), collapsible branches, zoom controls, and a search box.
Side toggle to switch to "Daftar Departemen" list view.
```

### P-H9 — Absensi Saya

```text
Design "Absensi Saya" (Staff). Top: today card with live clock and Check-in /
Check-out button. Below: month selector, summary chips (Hadir 18, Terlambat 2, Cuti 1,
Alpa 0) and a month calendar where each day is marked by a status dot with legend.
Next to it, a table "Riwayat Bulan Ini": tanggal, masuk, pulang, durasi, status badge.
```

### P-H10 — Rekap Absensi (HR/Manajer)

```text
Design "Rekap Absensi" for HR: filters (periode bulan, departemen, karyawan), a
summary row, and a data table with employee rows and daily columns (compact matrix
with colored status cells: H, T, C, A) plus totals per employee. Include a side
drawer "Koreksi Absensi" with fields tanggal, jam masuk, jam pulang, status and a
REQUIRED "Alasan koreksi" textarea with a note "Perubahan dicatat di audit log".
```

### P-H11 — Cuti Saya

```text
Design "Cuti Saya" (Staff). Top: balance cards per leave type (Cuti Tahunan 8 dari
12 hari, Cuti Sakit, Cuti Lainnya) with progress bars. Primary button "Ajukan Cuti".
Below: table "Riwayat Pengajuan" (jenis, tanggal, durasi, alasan, status badge,
disetujui oleh) with row action "Batalkan" for pending items and a detail drawer
showing the approval timeline (Diajukan → Disetujui/Ditolak + catatan).
```

### P-H12 — Form Ajukan Cuti

```text
Design the "Ajukan Cuti" dialog/page: select Jenis Cuti, date-range picker, an
auto-calculated line "Durasi: 3 hari kerja (akhir pekan dan libur tidak dihitung)",
balance preview "Sisa setelah pengajuan: 5 hari", textarea Alasan, file upload
Lampiran (shown when the leave type requires it), read-only "Atasan yang menyetujui:
Agus Prasetyo". Buttons "Batal" / "Ajukan". Show error states: "Saldo cuti tidak
cukup" and "Tanggal bertabrakan dengan cuti lain".
```

### P-H13 — Persetujuan Cuti (Manajer/HR)

```text
Design "Persetujuan Cuti": tabs Menunggu (3), Disetujui, Ditolak; table with
requester, jenis, tanggal, durasi, saldo tersisa, tanggal diajukan. Clicking a row
opens a right drawer with full details, attachment preview, the requester's other
leave in the same period, and a decision area: textarea "Catatan" and buttons
"Tolak" (destructive outline) and "Setujui" (primary).
```

### P-H14 — Kalender Cuti Tim

```text
Design "Kalender Cuti": month calendar with colored bars for each person's leave
(legend by leave type), national/collective holidays shaded and labeled, filters
for tim/departemen, and a toggle Bulan / Minggu / Daftar.
```

### P-H15 — Pengaturan Cuti (HR)

```text
Design "Pengaturan Cuti" with tabs: Jenis Cuti (table with nama, kuota default,
berbayar, wajib lampiran, aktif switch, edit), Kalender Libur (year selector, list +
add holiday dialog with "Cuti bersama" checkbox), and Saldo Karyawan (table to adjust
quotas per employee per year). Include the "Tambah Jenis Cuti" dialog.
```

### P-H16 — Payroll: Daftar Periode

```text
Design "Payroll" list of periods: cards or table with Periode (Agustus 2026), Jenis
(Reguler / THR), jumlah karyawan, total bersih, and a horizontal status stepper per
row (Draf → Dihitung → Disetujui → Dipublikasikan → Dikunci) with the current step
highlighted. Button "Buat Periode Baru" and filter by tahun. Sensitive totals shown
with a small lock icon note "Hanya Admin HR".
```

### P-H17 — Payroll: Detail Periode

```text
Design "Detail Periode Payroll — Agustus 2026". Top: status stepper and action
buttons that depend on status ("Hitung Ulang", "Setujui", "Publikasikan", "Kunci").
Left: table of payslips (karyawan, gaji pokok, tunjangan, potongan, gaji bersih,
status, row action "Lihat slip"). Right card "Validasi Sebelum Publikasi" checklist
(total per periode, selisih vs bulan lalu, karyawan tanpa komponen gaji) with
pass/warn icons. Include an export button "Ekspor Rekap" and a confirm dialog for
"Publikasikan" describing that staff will be able to see their slips.
```

### P-H18 — Komponen Gaji Karyawan

```text
Design "Komponen Gaji" edit screen for one employee: header with employee summary;
two tables "Pendapatan" and "Potongan" (komponen, tipe hitung: Tetap / Persen dari
gaji pokok / Manual, nilai, berlaku dari, berlaku sampai) with add/edit rows inline;
a live summary card "Estimasi Gaji Bersih". Warning banner: "Perubahan berlaku mulai
periode berikutnya".
```

### P-H19 — Slip Gaji Saya (Staff)

```text
Design "Slip Gaji" (Staff): left list of months (Agustus 2026, Juli 2026, ...), right
a payslip document view: header with PSPK wordmark placeholder, employee name and
number, periode; two columns Pendapatan and Potongan with line items; total bruto,
total potongan, GAJI BERSIH highlighted; footer note. Button "Unduh PDF". Also design
the print/PDF version of the slip on A4, clean and monochrome-friendly.
```

### P-H20 — Kinerja

```text
Design the Performance module screens as separate frames:
(a) "Periode Kinerja" list (HR): nama periode, tanggal, status, progress penilaian.
(b) "Sasaran Saya" (Staff): list of KPI/OKR cards with title, bobot (%), target,
capaian, progress bar; a warning if total bobot != 100%; button "Tambah Sasaran".
(c) "Penilaian" form with a stepper (Self-Review → Penilaian Atasan → Final) showing
self score + comment on the left and manager score + comment on the right, computed
weighted final score at the bottom.
(d) "Hasil Kinerja" summary with final score and per-goal breakdown.
```

### P-H21 — Rekrutmen

```text
Design the Recruitment module: (a) "Lowongan" list with status, jumlah pelamar,
tanggal dibuka; (b) a Kanban pipeline for one opening with columns Melamar,
Seleksi, Wawancara, Penawaran, Diterima, Ditolak, each with candidate cards (avatar,
name, source, days in stage) and drag affordance; (c) candidate detail drawer with
CV preview, riwayat tahap, interview schedule + notes + score, and buttons
"Pindah Tahap" and "Jadikan Karyawan" (with confirm dialog that creates an
onboarding checklist).
```

### P-H22 — Pelatihan & Onboarding

```text
Design (a) "Pelatihan" table: karyawan, nama pelatihan, penyelenggara, tanggal,
sertifikat link, kedaluwarsa with warning badge for < 30 hari; add dialog with
sertifikat upload. (b) "Checklist Onboarding" for a new employee: task list with
assignee, due date, checkbox, progress bar.
```

### P-H23 — Wizard Impor Excel (dipakai HRIS & System Management)

```text
Design a 4-step "Impor dari Excel" wizard: 1) Unggah file (dropzone, download
template link), 2) Petakan kolom (source column ↔ system field with auto-match
badges), 3) Validasi (summary chips: 45 valid, 3 error; table of error rows with
message per cell; toggle "Simulasi (dry-run)"), 4) Konfirmasi & hasil (counts:
dibuat, diperbarui, dilewati; button "Unduh laporan error"). Clear stepper at top.
```

---
## 7. Layar System Management

> Awali tiap prompt dengan: *"Continue in the PSPK design system and the System Management shell."*

### P-S1 — Dashboard System Management

```text
Design the System Management "Beranda" (Admin IT). Stat cards: Pengguna Aktif (46),
Total Aset (132), Aset Dipakai (98), Lisensi Segera Berakhir (2). Below: "Aset per
Status" donut (Tersedia, Dipakai, Perbaikan, Pensiun, Hilang), "Lisensi Akan
Berakhir" list with days remaining, "Dokumen Terbaru Diperbarui" list, and "Aktivitas
Terbaru (Audit Log)" compact feed with actor, action, entity, and time.
```

### P-S2 — Daftar Pengguna

```text
Design "Pengguna" list: header buttons "Undang Pengguna" (primary). Filters: search,
Role, Status. Table: avatar+nama, email, role badges (multiple allowed), karyawan
tertaut, terakhir login, status switch (Aktif/Nonaktif), row menu (Ubah Role, Reset
Password, Nonaktifkan). Include the "Undang Pengguna" dialog: email, pilih karyawan
(searchable), pilih role(s), tombol "Kirim Undangan".
```

### P-S3 — Detail Pengguna & Penugasan Role

```text
Design "Detail Pengguna": profile header, tab "Role" with checkboxes for the five
roles (Super Admin, Admin HR, Admin IT, Manajer, Karyawan) each with a one-line
description, and a read-only preview panel "Izin efektif" grouped by modul. Show a
warning banner when trying to remove the last Super Admin ("Tidak dapat menghapus
Super Admin terakhir"). Tab "Sesi & Aktivitas" listing recent logins.
```

### P-S4 — Role & Permission Editor

```text
Design "Role & Akses": left list of roles (system roles have a lock icon "Bawaan"),
right a permission matrix: rows = izin grouped by modul (Karyawan, Absensi, Cuti,
Payroll, Kinerja, Rekrutmen, Aset, Dokumen, Pengguna, Audit Log), columns = scope
(Milik sendiri, Tim, Semua) with checkboxes. Sticky footer "Simpan Perubahan" with a
summary of changes and a note "Perubahan berlaku pada permintaan berikutnya dan
dicatat di audit log".
```

### P-S5 — Daftar Aset

```text
Design "Aset" list: tabs Semua / IT / Non-IT, filters (kategori, status, lokasi,
pemegang), search by kode/serial. Table: Kode Aset, Nama, Kategori, Merek/Model,
Pemegang (avatar+nama or "—"), Lokasi, Status badge. Buttons "Impor dari Excel" and
"Tambah Aset". Include a compact grid/card view toggle.
```

### P-S6 — Detail Aset & Serah-Terima

```text
Design "Detail Aset" for a laptop: header (kode, nama, status badge, buttons "Serahkan
ke Karyawan"/"Terima Pengembalian"), info card (serial, tanggal beli, harga, lokasi),
and a vertical timeline "Riwayat Pemegang" (tanggal serah, karyawan, kondisi saat
serah, tanggal kembali, kondisi saat kembali). Also design the "Serahkan Aset" dialog
(pilih karyawan, tanggal, kondisi, catatan) and "Terima Pengembalian" dialog.
```

### P-S7 — Lisensi Software

```text
Design "Lisensi Software": table with nama, vendor, seat terpakai/total (progress
bar), tanggal kedaluwarsa (warning/danger badges when < 30 / expired), kunci lisensi
masked with "Tampilkan" (logged), row menu. Add/edit dialog including seat count and
kunci lisensi field.
```

### P-S8 — Dokumen & SOP (repository)

```text
Design "Dokumen & SOP" repository: left column category tree (Kebijakan, SOP HR,
SOP IT, Keuangan, Umum), main area with search and a table or card list: kode
(SOP-001), judul, kategori, versi saat ini (v3), visibilitas badge (Semua Staf, Hanya
HR, Hanya IT, Manajer), terakhir diperbarui, pemilik, row actions Unduh / Lihat.
Button "Unggah Dokumen" (for Admin).
```

### P-S9 — Detail Dokumen & Riwayat Versi

```text
Design "Detail Dokumen": header (kode, judul, badges, "Unduh Versi Saat Ini"), file
preview area, and a right column "Riwayat Versi" timeline (v3 saat ini, v2, v1 each
with tanggal berlaku, pengunggah, catatan perubahan, unduh). Design the "Unggah
Versi Baru" dialog: file dropzone (PDF/DOCX/XLSX, maks 25 MB), nomor versi otomatis,
catatan perubahan (required), tanggal berlaku, and a notice that older versions stay
read-only.
```

### P-S10 — Audit Log

```text
Design "Audit Log" viewer: filter bar (rentang tanggal, aplikasi HRIS/System
Management, aktor, jenis aksi, entitas), an "Ekspor CSV" button (with note that
exports are logged), and a dense table: waktu, aktor, aplikasi, aksi badge (BUAT,
UBAH, HAPUS, MASUK, LIHAT DATA SENSITIF, EKSPOR, UBAH IZIN), entitas, ID, IP. Row
click opens a right drawer with a before/after diff view where sensitive values are
shown as "[disembunyikan]", plus user agent and request ID. Read-only, no edit
controls, with a visible label "Log ini tidak dapat diubah".
```

### P-S11 — Aset Saya & Dokumen (tampilan Karyawan)

```text
Design the Staff views in System Management: (a) "Aset Saya": cards for assets held
(nama, kode, tanggal serah, kondisi) with a "Laporkan Masalah" secondary button;
(b) "Dokumen & SOP" read-only list filtered to documents visible to all staff, with
search and download only (no upload/edit controls).
```

---

## 8. Varian mobile (Staff)

Buat sebagai project Stitch tipe **Mobile** (atau frame ponsel di project yang sama). Gunakan Global Context Block.

### P-M1 — Beranda & Check-in

```text
Mobile 390px. PSPK Platform Staff home: top bar with app name, notification bell,
avatar. Large "Absensi Hari Ini" card with live time and a big full-width Check-in
button (44px+ height). Below: horizontally scrollable cards Sisa Cuti, Cuti
Menunggu, Slip Gaji Terbaru. Bottom tab bar: Beranda, Absensi, Cuti, Slip Gaji,
Profil. Same brand, Lora heading, Rubik body.
```

### P-M2 — Ajukan Cuti (mobile)

```text
Mobile 390px full-screen form "Ajukan Cuti": jenis cuti select, date-range picker
(bottom sheet calendar), duration and balance preview chips, alasan textarea,
lampiran upload, sticky bottom button "Ajukan". Include the validation error state
"Saldo cuti tidak cukup".
```

### P-M3 — Riwayat Cuti & Detail (mobile)

```text
Mobile 390px "Cuti Saya": balance cards carousel, filter chips (Semua, Menunggu,
Disetujui, Ditolak), list of request cards with status badges; tapping opens a
bottom sheet with the approval timeline and a "Batalkan Pengajuan" destructive
button for pending items.
```

### P-M4 — Slip Gaji (mobile)

```text
Mobile 390px "Slip Gaji": month list, and a payslip detail view with collapsible
sections Pendapatan and Potongan, a highlighted GAJI BERSIH card, and a sticky
"Unduh PDF" button. Include a small privacy note "Jangan bagikan slip gaji Anda".
```

### P-M5 — Persetujuan Cuti (mobile, Manajer)

```text
Mobile 390px manager "Persetujuan Cuti": tabs Menunggu / Riwayat, cards with
requester, leave dates, duration, and two buttons Tolak / Setujui; tapping a card
opens a full-screen detail with catatan input.
```

---

## 9. Prompt iterasi & perbaikan

Tempel setelah sebuah layar jadi. Ubah bagian dalam kurung.

**Konsistensi brand**

```text
Fix brand consistency on this screen: primary buttons and sidebar must use navy
#102E50, secondary CTA gold #F2AF3E with navy text, destructive actions maroon
#A8281C. Headings must be Lora and everything else Rubik. Remove any gradients,
shadows heavier than the design system, and any purple/blue tones not in the
palette.
```

**Kontras & aksesibilitas**

```text
Audit contrast and accessibility on this screen. Ensure WCAG AA contrast for all
text, no gold text on white, visible focus rings, labels on every input, status
badges with text (not color only), and touch targets of at least 44px on mobile.
Apply the fixes without changing the layout.
```

**Kepadatan tabel**

```text
Make the data table denser and easier to scan: 48px rows, sticky header, right-align
numeric columns, truncate long text with tooltip, and keep the row action menu on
the far right. Keep the same columns.
```

**Bahasa & format**

```text
Make sure all visible text is natural Bahasa Indonesia (no English labels), dates as
"21 September 2026", currency as "Rp 8.500.000", 24-hour time with a dot (08.30),
and consistent terms: Karyawan, Cuti, Absensi, Payroll, Slip Gaji, Aset, Dokumen &
SOP, Audit Log.
```

**State lengkap untuk satu layar**

```text
For this screen, add frames for: loading (skeleton), empty (with helpful CTA), error
(with retry), and no-permission (403). Keep the same layout and components.
```

**Responsif**

```text
Show this screen at tablet 768px and phone 390px. Sidebar collapses to a drawer,
tables become stacked cards (or horizontally scrollable with a fixed first column),
and primary actions move to a sticky bottom bar.
```

**Varian peran**

```text
Show the same screen for the [Karyawan / Manajer / Admin HR] role: hide or disable
controls that role cannot use, and keep the layout otherwise identical.
```

**Data lebih realistis**

```text
Replace placeholder text with realistic but entirely fictional dummy data in
Indonesian (names, positions, dates in 2026). Keep row counts and content lengths
varied so the layout is stress-tested with long names and empty optional fields.
```

---

## 10. Prompt konversi untuk Antigravity (Stitch MCP → kode)

### 10.1 Koneksi (sekali)

Langkah umum (dapat sedikit berbeda antar versi Antigravity — cek codelab resmi Google *Design-to-Code with Antigravity and Stitch MCP*): buat API key di Stitch → di Antigravity buka Agent Manager → MCP Servers → cari "Google Stitch" → pasang dan masukkan API key. **Jangan commit API key**; simpan di konfigurasi lokal Antigravity, bukan di repo.

Verifikasi:

```text
List my Google Stitch projects.
```

Pastikan project `PSPK Platform` muncul. Jika tidak, periksa API key dan akun Google yang dipakai.

### 10.2 Design system → token & komponen dasar (jalankan sekali, di Fase 1/2)

```text
Baca AGENTS.md dan docs/DESIGN.md. Ambil design system dari project Stitch
"PSPK Platform" (Prompt 0) lewat Stitch MCP. Terapkan ke monorepo:
1. Perbarui packages/ui/src/brand.css (token warna navy/gold/maroon, font Lora &
   Rubik, radius, bayangan, warna status) agar cocok dengan desain.
2. Buat komponen dasar di packages/ui: Button (primary/secondary/outline/ghost/
   destructive/loading), Input, Textarea, Select, DatePicker, Checkbox, Switch,
   Badge status, Card, Tabs, Dialog, Drawer, Toast, Skeleton, EmptyState,
   DataTable, Stepper, Timeline, MaskedField.
Aturan: hanya Tailwind + token dari brand.css (tanpa CDN, tanpa inline style, tanpa
class warna acak dari hasil Stitch); komponen aksesibel (label, fokus, keyboard);
tidak menambah dependency besar tanpa alasan (catat di docs/DECISIONS.md). Jalankan
lint, typecheck, build. Berhenti dan laporkan.
```

### 10.3 App shell

```text
Ambil layar P-1A sampai P-1E dari project Stitch "PSPK Platform". Implementasikan
sebagai layout di apps/hris dan apps/sysmgmt: sidebar, topbar, AppSwitcher (memakai
HRIS_URL/SYSMGMT_URL dari env), user menu. Menu sidebar harus difilter berdasarkan
permission user memakai @pspk/rbac (bukan hard-code per role), dan halaman tanpa
izin menampilkan state 403 (P-C4). Komponen shell bersama diletakkan di
packages/ui. Jangan ubah tampilan dari desain kecuali untuk memenuhi token.
```

### 10.4 Template konversi per layar

Ganti bagian dalam kurung siku.

```text
Ambil layar [ID + nama, mis. "H4 Daftar Karyawan"] dari project Stitch "PSPK
Platform" lewat Stitch MCP, dan implementasikan di [apps/hris | apps/sysmgmt] pada
route [route dari Bagian 12 dokumen prompt Stitch ini].

Aturan konversi:
1. Gunakan komponen dari @pspk/ui dan token dari brand.css. Jika komponen belum ada,
   buat di packages/ui (bukan di dalam halaman). Buang CDN, font link, dan style
   inline dari HTML hasil Stitch.
2. Halaman adalah Server Component; data diambil lewat server/queries yang memakai
   service layer + assertCan(). Komponen client hanya untuk interaksi. JANGAN
   memanggil Prisma langsung dari komponen.
3. Mutasi lewat Server Action: validasi Zod → requireSession() → assertCan() →
   service (transaksi) → writeAudit() → revalidatePath, sesuai Bagian 13.3 AGENTS.md.
4. Data dummy dari desain diganti data nyata dari database. Untuk data yang modulnya
   belum dibangun, tampilkan EmptyState — jangan menyisakan data dummy di kode.
5. Semua teks Bahasa Indonesia; format tanggal/rupiah memakai helper @pspk/shared.
6. Tangani state: loading (Skeleton), kosong, error, dan 403.
7. Responsif sesuai desain (desktop, tablet, ponsel); semantic HTML dan aksesibilitas
   (label, fokus, aria seperlunya).
8. Field sensitif memakai MaskedField dan mencatat VIEW_SENSITIVE ke audit log.
9. Tulis test yang relevan (unit untuk logika, E2E untuk alur utama bila layar ini
   bagian dari alur di checklist fase).

Setelah selesai: jalankan lint, typecheck, test, build; buka halaman di browser
terintegrasi dan bandingkan dengan desain Stitch (layout, warna, font, spasi), lalu
laporkan perbedaan yang tersisa. Hanya kerjakan layar ini.
```

### 10.5 Konversi per fase (kelompok layar)

| Fase | Layar yang dikonversi | Catatan prompt |
| --- | --- | --- |
| 1 | Prompt 0, P-1A–P-1E, P-C1, P-C2, P-C4 | Token, komponen dasar, shell, login |
| 2 | P-H1–P-H15, P-H23, P-C3, P-M1–P-M3 | Data karyawan, absensi, cuti + wizard impor |
| 3 | P-S1–P-S11, P-H23 (impor aset) | RBAC UI, aset, dokumen, audit log |
| 4 | P-H16–P-H22, P-M4, P-M5 | Payroll, kinerja, rekrutmen, pelatihan |
| 5 | Semua | Penyempurnaan visual saat UAT |

Contoh prompt kelompok (Fase 2):

```text
Fase 1 selesai. Baca AGENTS.md dan docs/DESIGN.md. Kerjakan Fase 2 dengan desain
Stitch: konversi layar P-H1 sampai P-H15 (satu per satu, urut), mengikuti aturan
konversi di Bagian 10.4 dokumen prompt Stitch dan checklist Fase 2 di AGENTS.md.
Setelah tiap layar: lint + typecheck + build. Berhenti bila ada layar yang butuh
keputusan bisnis yang belum ada di docs/OPEN_QUESTIONS.md dan tanyakan.
```

### 10.6 Bila desain berubah setelah kode ada

```text
Desain layar [ID] di Stitch telah diperbarui. Ambil versi terbaru lewat Stitch MCP,
bandingkan dengan implementasi saat ini di [route], dan terapkan HANYA perubahan
visual/layout. Jangan mengubah logika, permission, atau query. Laporkan daftar
perubahan file.
```

---

## 11. Checklist QA desain (sebelum konversi)

- [ ] Hanya warna brand + warna status yang dipakai; tidak ada warna liar (ungu/biru terang, dsb.).
- [ ] Heading Lora, teks lain Rubik; ukuran mengikuti skala di design system.
- [ ] Tidak ada teks emas di atas putih; kontras AA terpenuhi.
- [ ] Semua teks Bahasa Indonesia; format tanggal, rupiah, jam konsisten.
- [ ] Setiap layar punya state: normal, kosong, loading, error, dan 403 (bila relevan).
- [ ] Field sensitif ter-mask dengan catatan "dicatat di audit log".
- [ ] Aksi destruktif memakai warna maroon dan dialog konfirmasi.
- [ ] Tabel: kolom penting terlihat, aksi di kanan, pagination, filter jelas.
- [ ] Versi tablet/ponsel tersedia untuk Beranda, Absensi, Cuti, Slip Gaji.
- [ ] Tampilan per peran (Karyawan, Manajer, Admin HR, Admin IT) sudah dicek; menu tidak menampilkan akses yang tidak dimiliki peran itu.
- [ ] Tidak ada data asli; dataset dummy konsisten antar layar (Lampiran B).
- [ ] Nama layar di Stitch memakai ID (mis. `H4 Daftar Karyawan`).

---

## 12. Peta layar → route → permission → fase

Route adalah usulan awal; sesuaikan dengan struktur `src/app/(app)/...` di `AGENTS.md` Bagian 8. Permission memakai format `<modul>.<resource>.<aksi>:<scope>`; scope minimum yang membuka halaman tercantum.

**HRIS (`apps/hris`)**

| ID | Layar | Route | Permission minimum | Fase |
| --- | --- | --- | --- | --- |
| C1 | Login | `/login` | publik | 1 |
| C2 | Profil Saya & ganti password | `/profil` | sesi valid | 1 |
| C3 | Notifikasi | `/notifikasi` | sesi valid | 2 |
| H1 | Dashboard Admin HR | `/dashboard` | `hris.employee.read:all` | 2 |
| H2 | Beranda Karyawan | `/dashboard` | `hris.attendance.read:own` | 2 |
| H3 | Beranda Manajer | `/dashboard` | `hris.leave.approve:team` | 2 |
| H4 | Daftar Karyawan | `/karyawan` | `hris.employee.read:all` | 2 |
| H5 | Detail Karyawan | `/karyawan/[id]` | `hris.employee.read:all` / `:team` / `:own` | 2 |
| H6 | Form Karyawan | `/karyawan/baru`, `/karyawan/[id]/ubah` | `hris.employee.write:all` | 2 |
| H7 | Kontrak | `/karyawan/[id]?tab=kontrak` | `hris.contract.read:all` | 2 |
| H8 | Struktur Organisasi | `/karyawan/struktur` | `hris.employee.read:all` | 2 |
| H9 | Absensi Saya | `/absensi` | `hris.attendance.read:own` | 2 |
| H10 | Rekap Absensi | `/absensi/rekap` | `hris.attendance.read:team` / `:all` | 2 |
| H11 | Cuti Saya | `/cuti` | `hris.leave.read:own` | 2 |
| H12 | Ajukan Cuti | `/cuti/ajukan` | `hris.leave.create:own` | 2 |
| H13 | Persetujuan Cuti | `/cuti/persetujuan` | `hris.leave.approve:team` / `:all` | 2 |
| H14 | Kalender Cuti | `/cuti/kalender` | `hris.leave.read:team` | 2 |
| H15 | Pengaturan Cuti | `/cuti/pengaturan` | `hris.leave.configure:all` | 2 |
| H16 | Payroll: periode | `/payroll` | `hris.payroll.read:all` | 4 |
| H17 | Payroll: detail periode | `/payroll/[periodId]` | `hris.payroll.manage:all` | 4 |
| H18 | Komponen gaji | `/payroll/komponen/[employeeId]` | `hris.payroll.manage:all` | 4 |
| H19 | Slip Gaji Saya | `/slip-gaji` | `hris.payslip.read:own` | 4 |
| H20 | Kinerja | `/kinerja/...` | `hris.performance.read:own` / `:team` / `:all` | 4 |
| H21 | Rekrutmen | `/rekrutmen/...` | `hris.recruitment.read:all` | 4 (opsional) |
| H22 | Pelatihan & Onboarding | `/pelatihan`, `/onboarding` | `hris.training.read:own` / `:all` | 4 (opsional) |
| H23 | Wizard impor Excel | `/karyawan/impor` | `hris.employee.import:all` | 2 |

**System Management (`apps/sysmgmt`)**

| ID | Layar | Route | Permission minimum | Fase |
| --- | --- | --- | --- | --- |
| S1 | Dashboard | `/dashboard` | `sysmgmt.dashboard.read:all` | 3 |
| S2 | Daftar Pengguna | `/pengguna` | `sysmgmt.user.read:all` | 3 |
| S3 | Detail Pengguna & Role | `/pengguna/[id]` | `sysmgmt.user.manage:all` | 3 |
| S4 | Role & Akses | `/role` | `sysmgmt.role.manage:all` | 3 |
| S5 | Daftar Aset | `/aset` | `sysmgmt.asset.read:all` | 3 |
| S6 | Detail Aset | `/aset/[id]` | `sysmgmt.asset.read:all` | 3 |
| S7 | Lisensi Software | `/lisensi` | `sysmgmt.license.read:all` | 3 |
| S8 | Dokumen & SOP | `/dokumen` | `sysmgmt.document.read` (menurut visibility) | 3 |
| S9 | Detail Dokumen | `/dokumen/[id]` | `sysmgmt.document.read` | 3 |
| S10 | Audit Log | `/audit-log` | `sysmgmt.audit.read:all` | 3 |
| S11 | Aset Saya & Dokumen (Staff) | `/aset-saya`, `/dokumen` | `sysmgmt.asset.read:own` | 3 |

> Nama permission di atas adalah usulan; daftar final ditetapkan di `@pspk/rbac` (`AGENTS.md` Bagian 7). Bila berbeda, agent mengikuti `@pspk/rbac`.

---

## Lampiran A — Template `DESIGN.md`

Gunakan bila Stitch tidak menghasilkan `DESIGN.md`, atau sebagai patokan untuk memeriksa hasilnya. Simpan di `docs/DESIGN.md`.

```markdown
# PSPK Platform — Design System

## Prinsip
Profesional, tenang, terpercaya. Padat informasi namun lega. Tanpa gradien,
glassmorphism, atau foto stok. Seluruh teks UI dalam Bahasa Indonesia.

## Warna
| Token | Hex | Pemakaian |
| --- | --- | --- |
| navy | #102E50 | Utama: sidebar, header, tombol utama, judul |
| gold | #F2AF3E | Aksen/CTA sekunder; teks di atasnya wajib navy |
| maroon | #A8281C | Aksi destruktif, error |
| bg-page | #F5F7FA | Latar halaman |
| surface | #FFFFFF | Kartu, tabel, dialog |
| text-primary | #1B2430 | Teks utama |
| text-muted | #5B6675 | Teks sekunder |
| border | #E1E6ED | Garis, pemisah |
| success | (hijau redup, tentukan saat desain final) | Disetujui, Aktif |
| warning | (amber turunan gold) | Menunggu, akan berakhir |
| danger | maroon | Ditolak, error |
| info | (tint navy) | Informasi, netral |

Seluruh nilai netral/semantik di atas adalah usulan awal; final mengikuti hasil
desain yang disetujui. Semua kombinasi teks/latar harus lolos WCAG AA.

## Tipografi
- Heading: Lora (h1 28–32, h2 22–24, h3 18–20; weight 600)
- Body & UI: Rubik (14–16; label 13–14 weight 500; caption 12)
- Angka pada tabel: tabular-nums, rata kanan

## Spasi, bentuk, bayangan
- Basis 4px; radius 8px (kontrol), 12px (kartu)
- Bayangan: 2 level (kartu, overlay); fokus ring 2px gold dengan offset

## Layout
- Sidebar navy 264px (ciut 72px), topbar putih 64px, konten max-width 1280px
- Tabel: baris 48px, header sticky, aksi di kanan
- Breakpoint: 640 / 768 / 1024 / 1280

## Komponen wajib
Button (primary, secondary, outline, ghost, destructive, loading), Input, Textarea,
Select, DatePicker, DateRange, FileDropzone, Checkbox, Switch, MaskedField, Badge
status, Card, StatCard, Tabs, Breadcrumb, Stepper, Timeline, DataTable, Dialog,
Drawer, ConfirmDialog, Toast, Alert, Skeleton, EmptyState, ErrorState, Avatar,
Tooltip, AppSwitcher.

## Status badge
Aktif · Nonaktif · Menunggu · Disetujui · Ditolak · Dibatalkan · Draf ·
Dihitung · Dipublikasikan · Dikunci — selalu dengan teks (tidak hanya warna).

## Aksesibilitas
Kontras AA, fokus terlihat, label pada semua input, target sentuh ≥ 44px di mobile.

## Larangan
Teks emas di atas putih; warna di luar palet; ikon berbeda gaya; teks Inggris di UI.
```

---

## Lampiran B — Data dummy konsisten (fiktif)

Pakai data yang sama di semua layar agar desain koheren. **Seluruhnya fiktif.**

| Tokoh | Peran | Keterangan |
| --- | --- | --- |
| Ratna Aprilia | Admin HR | Departemen SDM & Umum |
| Dewi Lestari | Admin IT | Departemen TI |
| Agus Prasetyo | Manajer | Atasan langsung Made Wirawan (tim 6 orang) |
| Made Wirawan | Karyawan | Peneliti, Tipe: Tetap, no. pegawai `PSPK-0042` |
| Siti Rahmawati | Karyawan | Analis Kebijakan, Tipe: Kontrak, kontrak berakhir dalam 24 hari |
| Ni Luh Ayu Kartika | Karyawan | Asisten Riset, Tipe: Paruh Waktu/Proyek |
| Budi Santoso | Karyawan | Staf Keuangan, Tipe: Tetap |
| Rizky Ramadhan | Kandidat | Melamar posisi Peneliti Junior |

| Data | Contoh |
| --- | --- |
| Departemen | Riset & Kebijakan, SDM & Umum, TI, Keuangan |
| Jenis cuti (dummy) | Cuti Tahunan (12 hari), Cuti Sakit, Cuti Melahirkan, Cuti Penting |
| Periode payroll | Agustus 2026 (Reguler), Juli 2026 (Dikunci) |
| Angka gaji | Pembulatan dummy, mis. Rp 8.500.000 (bersih) — hanya untuk tampilan |
| Aset | `LPT-0007` Laptop Lenovo ThinkPad (Dipakai, pemegang Made Wirawan); `MON-0012` Monitor 24" (Tersedia) |
| Lisensi | Microsoft 365 Business (40/45 seat, berakhir 12 Oktober 2026) |
| Dokumen | `SOP-001` Pengajuan Cuti (v3); `KBJ-002` Kebijakan Keamanan Informasi (v1) |
| Tanggal acuan | 21 September 2026 |

Data ini hanya contoh tampilan. Jenis cuti, kuota, dan angka payroll sebenarnya ditetapkan HR (lihat `docs/OPEN_QUESTIONS.md`).