---
description: Standar aksesibilitas (WCAG AA), kepatuhan Reduced Motion, efisiensi Core Web Vitals, dan performa rendering DOM.
globs: "apps/**/*.{ts,tsx,jsx,js,css},packages/ui/**/*.{ts,tsx,jsx,js,css}"
---

# Aturan Aksesibilitas (A11y) & Performa Frontend

Aturan ini mengikat kualitas aksesibilitas bagi seluruh pengguna dan performa waktu muat aplikasi web PSPK monorepo (`apps/hris`, `apps/sysmgmt`).

---

## 1. Standar Aksesibilitas (WCAG AA Mandatory)

Setiap halaman dan komponen wajib memenuhi kriteria minimum **WCAG 2.1 Level AA**:

1. **Rasio Kontras Minimum:**
   * Teks normal (di bawah 18px): Rasio kontras minimal **4.5:1** terhadap warna latar belakang.
   * Teks besar (18px+ bold atau 24px+ regular) dan elemen interaktif (tombol, input border): Rasio kontras minimal **3:1**.
   * DILARANG menggunakan kombinasi teks abu-abu pudar di atas putih yang tidak terbaca oleh pengguna dengan keterbatasan penglihatan.
2. **Keterbacaan Pembaca Layar (*Screen Readers*):**
   * Seluruh ikon tombol yang tidak memiliki teks wajib dilengkapi atribut `aria-label` (contoh: `<button aria-label="Tutup Dialog">`).
   * Formulir input wajib memiliki asosiasi ID eksplisit antara `<label htmlFor="id">` dan `<input id="id">`.
   * Pesan kesalahan form wajib ditautkan dengan `aria-describedby` ke ID input terkait.
3. **Perangkap Fokus Modal Dialog (*Focus Trap*):**
   * Saat modal dialog terbuka, fokus keyboard wajib terkunci di dalam dialog.
   * Menekan tombol `Escape` wajib menutup dialog aktif.
   * Menggunakan komponen dialog berbasis Radix UI (`@radix-ui/react-dialog`) yang sudah teruji aksesibilitasnya.

---

## 2. Kepatuhan Gerakan Terbatas (Reduced Motion)

Aplikasi wajib menghormati preferensi pengguna yang sensitif terhadap mabuk visual atau gangguan vestibular:

1. **Pemeriksaan `prefers-reduced-motion`:**
   * Di Tailwind/CSS: Gunakan varian `motion-safe:` untuk animasi atau `motion-reduce:transition-none` / `motion-reduce:animate-none`.
   * Di pustaka Motion: Bungkus dengan hook `useReducedMotion()`.
2. **Degradasi Instan:**
   * Jika `prefers-reduced-motion: reduce` aktif di sistem operasi pengguna, seluruh animasi transisi modal, dropdown, dan kartu geser wajib langsung tampil instan tanpa animasi perpindahan (*zero duration transition*).

---

## 3. Target Metrik Performa (Core Web Vitals)

Antarmuka harus cepat diakses bahkan pada koneksi internet terbatas di lingkungan riset lapangan:

1. **LCP (Largest Contentful Paint) < 2.5 Detik:**
   * Gambar profil/logo pada bagian hero atau header wajib menggunakan komponen `next/image` dengan properti `priority`.
   * Font `Lora` dan `Rubik` dimuat secara lokal via `next/font/google` dengan `display: 'swap'` untuk mencegah teks hilang saat memuat (*FOIT*).
2. **INP (Interaction to Next Paint) < 200 Milidetik:**
   * Jangan menjalankan kalkulasi berat pada thread utama React saat pengguna mengetik pada input filter atau pencarian tabel.
   * Gunakan teknik debouncing (minimal 300ms) untuk pencarian instan pada tabel.
3. **CLS (Cumulative Layout Shift) < 0.1:**
   * Selalu tetapkan dimensi eksplisit (`width`, `height`, atau `aspect-ratio`) untuk avatar pengguna, logo, dan skeleton loader agar layout tidak melompat ketika aset selesai dimuat.

---

## 4. Efisiensi Rendering DOM & Biaya GPU (DOM Cost)

1. **Larangan Efek Berat pada Kontainer Bergulir (Scrollable Containers):**
   * DILARANG menerapkan filter grafis berat seperti `backdrop-blur-md` atau efek grain/noise pada kontainer yang memiliki *infinite scroll* atau tabel dengan ratusan baris. Repaint GPU terus-menerus akan merusak frame rate (FPS) browser.
2. **Penempatan Efek Noise/Tekstur (Jika Diperlukan):**
   * Efek tekstur halus atau noise hanya boleh ditempatkan pada elemen pseudo tunggal bertipe `fixed inset-0 z-0 pointer-events-none`.
3. **Pembersihan DOM Tree:**
   * Hindari pembungkus `div` bersarang yang tidak memiliki fungsi styling (*wrapper div hell*).
   * Gunakan React Fragment (`<>...</>`) jika hanya membutuhkan pengelompokan elemen semantik.
