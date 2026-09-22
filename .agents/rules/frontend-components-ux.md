---
description: Standar arsitektur komponen, tabel data enterprise, formulir multi-step, siklus status interaktif, dan penanganan data sensitif.
globs: "apps/**/*.{ts,tsx,jsx,js,css},packages/ui/**/*.{ts,tsx,jsx,js,css}"
---

# Aturan Komponen & Pola Antarmuka (UI/UX)

Aturan ini mengikat pembuatan tabel data, formulir masukan, komponen interaktif, dan penanganan data sensitif pada aplikasi `apps/hris` dan `apps/sysmgmt`.

---

## 1. Siklus Status Interaktif Lengkap (Interactive State Completeness)

Setiap elemen UI yang menerima interaksi pengguna WAJIB menangani 7 status siklus lengkap:

1. **Normal State:** Tampilan bersih, kontras teks memenuhi standar WCAG AA.
2. **Hover State:** Umpan balik visual halus (`transition-all duration-150`), tidak boleh menyebabkan lonjakan layout (*layout shift*).
3. **Active/Pressed State:** Respon tekanan fisik taktil (`active:scale-[0.98]`).
4. **Focus-Visible State:** Ring fokus jelas untuk aksesibilitas navigasi keyboard:
   `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#102E50] focus-visible:ring-offset-2`.
5. **Disabled State:** Tampilan jelas tidak aktif (`opacity-50 cursor-not-allowed pointer-events-none`).
6. **Loading State (Skeleton Loaders):**
   * DILARANG hanya menampilkan lingkaran spinner di tengah halaman kosong.
   * Wajib menampilkan *skeleton loader* (`animate-pulse bg-slate-200 rounded`) yang mencerminkan bentuk persis baris tabel, kartu metrik, atau blok form yang sedang diproses.
7. **Empty State:**
   * Jika tidak ada data yang ditemukan (baik karena tabel kosong atau hasil filter nihil), wajib menyediakan:
     - Ikon ilustrasi monokrom yang relevan.
     - Judul penjelasan ramah dalam Bahasa Indonesia (contoh: *"Belum Ada Data Pegawai"*).
     - Deskripsi singkat instruktif.
     - Tombol aksi pertama (contoh: *"Tambah Pegawai Baru"* atau *"Reset Filter"*).

---

## 2. Standar Tabel Data Enterprise (Enterprise Data Tables)

1. **Tata Letak & Navigasi Tabel:**
   * **Bilah Kontrol Atas:** Terdiri dari input pencarian instan (nama, NIP, email) dan filter multi-kriteria (departemen, status kerja, tipe kontrak).
   * **Informasi Paginasi:** Tampilkan teks jumlah baris yang terlihat (contoh: *"Menampilkan 1–10 dari 148 pegawai"*).
   * **Paginasi Bawah:** Tombol navigasi halaman (*Sebelumnya*, nomor halaman, *Berikutnya*) yang jelas.
2. **Struktur Kolom & Keterbacaan:**
   * Header tabel berlatar belakang lembut (`bg-slate-50` atau `bg-slate-100/70`) dengan teks tebal ringkas.
   * Gunakan garis pemisah halus antaris (`divide-y divide-slate-100`).
   * Gunakan efek baris sorot saat hover (`hover:bg-slate-50/80 transition-colors`).
   * Kolom angka, tanggal, dan NIP wajib berformat `tabular-nums font-mono text-sm`.
3. **Badge Status Terstandarisasi:**
   * `ACTIVE` / `APPROVED` / `PRESENT`: Hijau emerald lembut (`bg-emerald-50 text-emerald-700 border-emerald-200`).
   * `PENDING` / `PROBATION`: Kuning/Gold amber (`bg-amber-50 text-amber-800 border-amber-200`).
   * `LATE` / `REJECTED` / `TERMINATED`: Merah maroon lembut (`bg-red-50 text-[#A8281C] border-red-200`).
   * `ON_LEAVE` / `WFH`: Biru laut lembut (`bg-blue-50 text-blue-700 border-blue-200`).
4. **Indikator Peringatan Kontrak:**
   * Karyawan kontrak PKWT (fixed-term) yang masa berlakunya akan habis dalam tempo $\le 30$ hari WAJIB memiliki penanda visual (*warning indicator*) berwarna amber/maroon agar Admin HR dapat segera mengambil tindakan perpanjangan.

---

## 3. Standar Formulir & Validasi Zod

1. **Struktur Elemen Input:**
   * Label selalu diletakkan **di atas input field** (`block text-xs font-semibold text-slate-700 mb-1.5`).
   * Kolom wajib ditandai tanda bintang merah: `<span className="text-[#A8281C]">*</span>`.
   * DILARANG menggunakan placeholder sebagai pengganti label.
2. **Penanganan Pesan Error:**
   * Pesan error divalidasi melalui skema **Zod** dan disajikan dalam **Bahasa Indonesia**.
   * Pesan error tampil tepat di bawah input: `text-xs text-[#A8281C] mt-1 font-medium`.
   * Input yang mengalami error wajib mendapatkan border merah: `border-[#A8281C] focus:ring-[#A8281C]`.
3. **Formulir Kompleks (Multi-Step Wizard):**
   * Untuk entitas dengan banyak kolom data (seperti Tambah Karyawan Baru), formulir dipecah menjadi tahapan logis (*multi-step wizard*) dengan stepper visual:
     - *Tahap 1:* Identitas Pribadi & Kontak Darurat.
     - *Tahap 2:* Penempatan Kerja & Atasan Langsung.
     - *Tahap 3:* Kompensasi & Data Sensitif Terenkripsi.
     - *Tahap 4:* Unggah Berkas & Ringkasan.

---

## 4. Keamanan & Penyamaran Data Sensitif (Masking & Audit)

1. **Penyamaran Default (Masking):**
   * Data pribadi berisiko tinggi (NIK, NPWP, Nomor Rekening Bank) WAJIB disamarkan secara default saat ditampilkan di layar profil:
     `•••• •••• •••• 1234`.
2. **Prosedur Pembukaan Penyamaran (*Unmasking*):**
   * Tombol *"Lihat Lengkap"* / ikon mata hanya dapat diakses oleh role berizin (`hris.employee.read:all`).
   * Setiap tindakan pembukaan data sensitif WAJIB memicu aksi server yang mencatat audit log berkategori `VIEW_SENSITIVE` (merekam ID aktor, waktu server, IP, dan ID pegawai yang diakses).

---

## 5. Arsitektur Komponen Next.js App Router

1. **Server Components (RSC) sebagai Standar Pengambilan Data:**
   * Komponen halaman `page.tsx` default adalah Server Component.
   * Query database dieksekusi langsung di server melalui fungsi terisolasi di `server/queries/`.
2. **Isolasi Leaf Client Components (`'use client'`):**
   * Directive `'use client'` hanya ditaruh di komponen daun (*leaf components*) yang membutuhkan state interaktif (misal: modal dialog, form interaktif, filter bar, date picker).
3. **Kontrak Standar Server Actions:**
   * Semua Server Actions wajib mengembalikan respons terstruktur:
     ```ts
     type ActionResponse<T> =
       | { ok: true; data: T; message?: string }
       | { ok: false; error: string };
     ```
   * Tangkap hasil aksi di komponen klien dan tampilkan notifikasi toast sukses atau dialog error dalam Bahasa Indonesia yang komunikatif.
