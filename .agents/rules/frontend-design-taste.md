---
description: Standar Anti-Slop Design Taste, eliminasi klise desain AI, kalibrasi kepadatan layout, dan disiplin antarmuka visual.
globs: "apps/**/*.{ts,tsx,jsx,js,css},packages/ui/**/*.{ts,tsx,jsx,js,css}"
---

# Aturan Anti-Slop Design Taste & Disiplin Visual

Aturan ini mengadaptasi prinsip-prinsip utama dari `@.agents/skills/design-taste-frontend/SKILL.md` untuk diterapkan pada aplikasi web organisasi (HRIS & System Management). Tujuannya adalah memastikan antarmuka terlihat profesional, premium, bebas dari klise desain AI murahan, dan berorientasi pada produktivitas operator lembaga.

---

## 1. Eliminasi Klise Desain AI (Anti-Default Discipline)

Keluaran desain AI sering kali terjebak dalam pola berulang yang generik. Larangan berikut berlaku mutlak:

1. **Larangan Gradien Generik AI ("AI Purple / Neon Mesh"):**
   * DILARANG menggunakan tombol atau latar belakang dengan gradien ungu, violet, atau cyan menyala secara acak.
   * DILARANG menggunakan bayangan *neon glow* di bawah tombol aksi.
   * Gunakan palet solid terkurasi: Navy `#102E50`, aksen Gold `#F2AF3E`, dan latar netral Slate.
2. **Larangan Fake-Screenshot Divs:**
   * DILARANG membuat elemen mockup dengan tumpukan div buatan yang meniru jendela browser atau daftar tugas palsu. Tampilkan komponen data riil yang fungsional.
3. **Larangan Campur-Aduk Font Tanpa Aturan:**
   * DILARANG menyisipkan kata ber-font serif acak di tengah kalimat sans-serif hanya demi terlihat "estetik".
   * Penekanan (*emphasis*) kata wajib menggunakan varian **bold** atau **italic** dari keluarga font yang sama.
4. **Larangan Emoji Berlebihan:**
   * DILARANG menaburkan emoji pada header tabel, label form, atau judul menu navigasi. Gunakan ikon resmi monokromatik dari pustaka `lucide-react` dengan `strokeWidth={1.5}` atau `2.0`.

---

## 2. Kalibrasi Tiga Dimensi Desain (Three Dials Calibration)

Untuk aplikasi produktivitas lembaga (HRIS & System Management), tiga dial desain dikunci pada nilai berikut:

* **`DESIGN_VARIANCE: 5` (Konsistensi Tinggi / Struktur Jelas):**
  * Hindari layout asimetris yang membingungkan alur kerja. Gunakan grid terstruktur, hierarki informasi atas-ke-bawah yang jelas, dan konsistensi pola di setiap modul.
* **`MOTION_INTENSITY: 3` (Animasi Tertahan & Fungsional):**
  * Tidak ada animasi berulang tanpa henti (*infinite loops*) yang mendistraksi.
  * Animasi hanya digunakan untuk transisi halus antar tab, dropdown, pembukaan modal, dan status loading skeleton.
* **`VISUAL_DENSITY: 7` (Enterprise Data Density):**
  * Ini adalah aplikasi kerja pengelola SDM, bukan landing page promosi yang kosong melompong.
  * Hindari padding raksasa yang memaksa pengguna terus-menerus melakukan scroll untuk melihat data. Berikan kerapatan data yang efisien namun tetap nyaman dibaca (*scannable*).

---

## 3. Disiplin Tombol Aksi (CTA) & Respon Taktil

1. **Larangan Pembungkusan Teks Tombol (CTA Button Wrap Ban):**
   * Teks pada tombol aksi **DILARANG TERPOTONG ATAU MEMBUNGKUS MENJADI 2 BARIS** pada layar desktop.
   * Gunakan label ringkas maksimal 2–3 kata (contoh: *"Tambah Pegawai"*, *"Ekspor Presensi"*, *"Simpan Perubahan"*).
2. **Satu Label untuk Satu Niat (No Duplicate Intent):**
   * Hindari menggunakan sinonim berbeda untuk aksi yang sama pada halaman yang sama (pilihlah secara konsisten, misal selalu gunakan *"Simpan Data"* atau *"Kirim Pengajuan"*).
3. **Umpan Balik Taktil Fisik (`:active`):**
   * Setiap tombol dan kartu yang dapat diklik wajib memiliki efek tekanan taktil saat ditekan:
     `active:scale-[0.98]` atau `active:translate-y-[0.5px]`.
4. **Kontras Tombol (WCAG AA):**
   * Tombol primer Navy (`bg-[#102E50]`): teks putih murni `text-white`.
   * Tombol aksen Gold (`bg-[#FEBA48]`): teks wajib Navy `text-[#102E50] font-semibold`.
   * Tombol destruktif Maroon (`bg-[#A8281C]`): teks putih murni `text-white`.

---

## 4. Konsistensi Bentuk & Radius Sudut (Shape Lock)

Pilihlah skala radius sudut yang seragam di seluruh aplikasi:
* **Kartu Data & Kontainer Utama:** `rounded-xl` (12px).
* **Komponen Interaktif (Tombol, Input Form, Dropdown):** `rounded-lg` (8px).
* **Badge Status, Tag Kategori, Indikator Angka:** `rounded-full` (pill).
* Dilarang mencampur kartu bersudut tajam kaku (0px) dengan tombol bulat penuh (pill) tanpa alasan sistematis yang terdokumentasi.

---

## 5. Mekanika Layout & Kestabilan Viewport

1. **Stabilitas Viewport Layar Penuh:**
   * DILARANG menggunakan `h-screen` untuk kontainer layar penuh yang memiliki scroll.
   * Selalu gunakan `min-h-[100dvh]` untuk mencegah lonjakan layout (*layout jumping*) pada perangkat seluler/tablet dengan address bar dinamis.
2. **Utamakan CSS Grid Dibandingkan Rumus Flexbox Manual:**
   * Hindari manipulasi persentase rumit seperti `w-[calc(33%-1rem)]`.
   * Selalu gunakan CSS Grid native: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4`.
3. **Breakpoints Standar:**
   * Ikuti skala standar Tailwind CSS: `sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px`, `2xl: 1536px`.
