---
description: Standar identitas brand PSPK, token warna institusi, tipografi resmi (Lora dan Rubik), serta format pelokalan antarmuka.
globs: "apps/**/*.{ts,tsx,jsx,js,css},packages/ui/**/*.{ts,tsx,jsx,js,css}"
---

# Aturan Brand & Tipografi Antarmuka PSPK

Aturan ini wajib dipatuhi dalam setiap pengembangan antarmuka (UI) pada seluruh aplikasi web dalam monorepo (`apps/hris`, `apps/sysmgmt`) dan paket antarmuka bersama (`packages/ui`).

---

## 1. Filosofi & Karakter Visual Lembaga

PSPK (Pusat Studi Pendidikan dan Kebijakan) adalah organisasi nonprofit independen di bidang riset dan advokasi kebijakan pendidikan di Indonesia. Karakter visual antarmuka harus mencerminkan:
* **Wibawa & Kredibilitas Akademis:** Rapi, terstruktur, presisi tinggi, dan tepercaya.
* **Modernitas & Efisiensi Sistem:** Segar, responsif, intuitif, dan tidak kaku.
* **Fokus pada Data Kebijakan:** Data pegawai, riset, presensi, dan kinerja harus mudah dibaca tanpa distraksi ornamen berlebihan.

---

## 2. Palet Warna & Token Brand Resmi

| Token Brand | Kode Hex | Peran & Konteks Penggunaan | Aturan Kontras & Pembatasan |
| :--- | :--- | :--- | :--- |
| **Navy PSPK** | `#102E50` | Warna identitas utama: Sidebar, judul halaman utama, header tabel, tombol primer, batas pembatas tegas. | Warna dasar teks dan elemen kontras tinggi. |
| **Navy Deep** | `#0C233D` | Nuansa pendukung: Header sidebar, header kartu penting, latar belakang gelap institusi. | Digunakan untuk kedalaman hierarki visual. |
| **Gold PSPK** | `#F2AF3E` / `#FEBA48` | Aksen institusi: Badge aktif, highlight status penting, kartu metrik unggulan, border sorotan. | **DILARANG:** Teks warna gold di atas latar putih/abu-abu terang (gagal kontras WCAG). Teks di atas latar gold WAJIB menggunakan Navy `#102E50`. |
| **Maroon PSPK** | `#A8281C` | Status kritis / bahaya: Tombol aksi destruktif (hapus/batalkan), status ditolak, peringatan keterlambatan, pesan error validasi form. | Kontras tinggi terhadap latar putih dan krem muda. |
| **Neutral Slate Canvas** | `#F8FAFC` / `#FFFFFF` | Latar belakang halaman kerja (*workspace*), panel konten, dan kartu data. | Memberikan kenyamanan visual bagi operator yang bekerja berjam-jam di depan layar. |
| **Border & Divider** | `#E2E8F0` / `#CBD5E1` | Garis pemisah sel tabel, kartu data, dan pembatas seksi formulir. | Garis harus halus dan tidak mencolok. |

---

## 3. Hirarki Tipografi Resmi

### 3.1 Font Heading: Lora (`font-heading`)
* **Jenis:** Serif modern berwibawa.
* **Digunakan untuk:** `h1`, `h2`, `h3`, judul kartu metrik, dan nama modul halaman.
* **Aturan Khusus Descender Miring (Italic):** Jika judul menggunakan font italic dengan huruf ber-descender (`g, j, p, q, y`), wajib memberikan `leading-[1.1]` dan padding bawah cadangan (`pb-1`) agar ekor huruf tidak terpotong.

### 3.2 Font Body & UI: Rubik (`font-body`)
* **Jenis:** Sans-serif geometris dengan sudut lembut dan keterbacaan sangat tinggi.
* **Digunakan untuk:** Seluruh teks paragraf, tabel data, formulir input, badge status, tombol, navigasi, dan angka metrik.
* **Angka Tabular (*Tabular Numerals*):** Kolom angka, mata uang, NIP, dan tanggal pada tabel wajib menggunakan format `tabular-nums` agar sejajar vertikal secara sempurna.

---

## 4. Standar Bahasa & Pelokalan Indonesia

1. **Bahasa Antarmuka Pengguna (UI):**
   * **100% Bahasa Indonesia** untuk seluruh elemen yang dilihat pengguna: label form, placeholder, judul tabel, nama status, tombol aksi, konfirmasi modal dialog, tooltip, empty state, dan toast notifikasi.
   * Gunakan istilah baku yang lazim di lingkungan kepegawaian Indonesia (contoh: *Unduh*, *Unggah*, *Simpan*, *Batal*, *Hapus*, *Disetujui*, *Menunggu Persetujuan*, *Ditolak*, *Riwayat Presensi*).

2. **Format Mata Uang Rupiah:**
   * Wajib menggunakan format Indonesia: `Rp 12.500.000` via `Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" })` atau utilitas `@pspk/shared`.

3. **Format Tanggal & Waktu:**
   * Locale: `id-ID` (contoh: `22 September 2026`).
   * Zona Waktu Resmi: Seluruh kalkulasi tanggal dan jam menggunakan zona waktu **`Asia/Jakarta` (WIB)**.
