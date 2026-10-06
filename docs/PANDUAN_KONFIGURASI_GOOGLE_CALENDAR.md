# Panduan Lengkap Konfigurasi Google Cloud & Environment (.env) — Modul Kalender Kerja HRIS PSPK

> **Dokumen Panduan Administrator:** Konfigurasi Google Calendar API (Libur Nasional Otomatis) & Google OAuth 2.0 (Integrasi Google Meet Karyawan) untuk Sistem HRIS PSPK.  
> **Terakhir Diperbarui:** 6 Oktober 2026

---

## 1. Ringkasan Kebutuhan

Modul Kalender Kerja terpadu di HRIS PSPK membutuhkan dua jenis integrasi Google:

| Jenis Integrasi | Tujuan | Kredensial yang Dibutuhkan | Pengguna yang Terlibat |
|---|---|---|---|
| **Google Calendar Public API** | Mengambil & menyinkronkan hari libur nasional Indonesia resmi secara otomatis | `GOOGLE_CALENDAR_API_KEY` | Server-to-server (tanpa login akun Google) |
| **Google OAuth 2.0** | Menghubungkan akun Google `@pspk.is` / `@pspk.id` milik karyawan agar meeting Google Meet pribadi muncul di kalender HRIS | `GOOGLE_CLIENT_ID`<br>`GOOGLE_CLIENT_SECRET`<br>`GOOGLE_OAUTH_REDIRECT_URI` | Karyawan perorangan yang login |

---

## 2. Langkah Demi Langkah di Google Cloud Console

### Langkah 1: Buka & Pilih Project di Google Cloud Console
1. Buka browser dan kunjungi [Google Cloud Console](https://console.cloud.google.com).
2. Masuk (**Sign in**) menggunakan akun Google Workspace organisasi PSPK (disarankan akun IT Administrator, misalnya `admin@pspk.id` atau akun Google Workspace resmi).
3. Di bilah atas (*top bar*), pastikan project yang dipilih adalah project sistem HRIS (misalnya **"Hris and system managemen"** atau nama project yang sedang aktif).

---

### Langkah 2: Mengaktifkan Google Calendar API
1. Buka menu navigasi utama (ikon tiga garis di kiri atas) > **APIs & Services** > **Library** (atau kunjungi langsung: [API Library](https://console.cloud.google.com/apis/library)).
2. Di kotak pencarian, ketik:
   ```text
   Google Calendar API
   ```
   *(Pastikan **tidak** menyertakan kata "mcp").*
3. Klik kartu bertuliskan **Google Calendar API** (oleh Google).
4. Klik tombol biru **Enable** (Aktifkan).
5. Tunggu beberapa detik hingga statusnya berubah menjadi *API Enabled*.

---

### Langkah 3: Membuat API Key untuk Sinkronisasi Libur Nasional (Fase B)
API Key digunakan untuk membaca kalender hari libur publik Indonesia tanpa perlu meminta karyawan login.

1. Di menu kiri, buka **APIs & Services** > **Credentials**.
2. Klik tombol **+ CREATE CREDENTIALS** di bagian atas, lalu pilih **API key**.
3. Sebuah modal akan muncul menampilkan API Key Anda (misalnya berawalan `AIzaSy...`).
4. **Penting: Batasi Penggunaan API Key (Restriksi):**
   - Pada modal tersebut, klik **Edit API key** (atau klik ikon pensil di sebelah API key yang baru dibuat).
   - Di bagian **Name**, ubah menjadi: `PSPK HRIS - Holiday Sync API Key`.
   - Di bagian **API restrictions**:
     - Pilih **Restrict key**.
     - Centang hanya **Google Calendar API**.
   - Klik **Save**.
5. Salin nilai API key tersebut. Kunci ini akan dimasukkan ke variabel `GOOGLE_CALENDAR_API_KEY` di file `.env`.

---

### Langkah 4: Mengonfigurasi OAuth Consent Screen (Layar Persetujuan)
Sebelum membuat OAuth Client ID, Google mewajibkan pengaturan *OAuth Consent Screen*.

1. Di menu kiri, klik **APIs & Services** > **OAuth consent screen**.
2. **User Type:**
   - Pilih **Internal** *(Sangat direkomendasikan karena sistem ini internal PSPK. Dengan memilih Internal, hanya pemilik akun Google Workspace berdomain PSPK seperti `@pspk.id` atau `@pspk.is` yang dapat menghubungkan akun, dan aplikasi **tidak memerlukan proses verifikasi publik Google yang rumit**).*
   - Klik **Create**.
3. **App Information:**
   - **App name:** `PSPK HRIS Work Calendar`
   - **User support email:** Pilih email admin Anda (misalnya `admin@pspk.id` atau email yang sedang login).
   - **Developer contact information:** Masukkan email IT Admin PSPK.
   - Klik **Save and Continue**.
4. **Scopes:**
   - Klik tombol **Add or Remove Scopes**.
   - Filter atau cari scope:
     ```text
     https://www.googleapis.com/auth/calendar.events.readonly
     ```
   - Centang scope tersebut:
     - `.../auth/calendar.events.readonly` *(Melihat event di Google Calendar)*
     - `.../auth/userinfo.email` *(Melihat alamat email primer Google)*
     - `openid` *(Identitas dasar)*
   - Klik **Update**, lalu klik **Save and Continue**.
5. Di halaman ringkasan, klik **Back to Dashboard**. Layar consent sekarang siap digunakan!

---

### Langkah 5: Membuat OAuth 2.0 Client ID (Web Application)
1. Di menu kiri, klik **APIs & Services** > **Credentials**.
2. Klik tombol **+ CREATE CREDENTIALS**, lalu pilih **OAuth client ID**.
3. Di formulir yang muncul:
   - **Application type:** Pilih **Web application**.
   - **Name:** `PSPK HRIS Web OAuth Client`.
   - **Authorized JavaScript origins** (Opsional tapi baik diisi):
     - Development: `http://localhost:3001`
     - Production (saat di VPS): `https://hris.domain-pspk.example`
   - **Authorized redirect URIs** *(SANGAT PENTING: Harus sama persis termasuk port dan path)*:
     - Untuk Development Lokal:
       ```text
       http://localhost:3001/api/calendar/google/callback
       ```
     - Untuk Production VPS (jika sudah dideploy):
       ```text
       https://hris.domain-pspk.example/api/calendar/google/callback
       ```
4. Klik tombol biru **CREATE**.
5. Sebuah jendela *OAuth client created* akan muncul menampilkan:
   - **Client ID** (berakhir dengan `.apps.googleusercontent.com`)
   - **Client Secret** (berawalan `GOCSPX-...`)
6. Salin kedua nilai tersebut.

---

## 3. Konfigurasi File `.env` di Komputer / Server

Buka file `.env` di root direktori project (`system_hris-system_management/hris_system_management/.env`).

Tambahkan atau sesuaikan baris-baris berikut:

```dotenv
# ==============================================================================
# GOOGLE CALENDAR & OAUTH (MODUL KALENDER KERJA HRIS)
# ==============================================================================

# 1. API Key untuk sinkronisasi otomatis libur nasional (dari Langkah 3)
GOOGLE_CALENDAR_API_KEY="AIzaSyD-isi-dengan-api-key-anda"

# 2. OAuth Client ID untuk integrasi Google Meet karyawan (dari Langkah 5)
GOOGLE_CLIENT_ID="1234567890-abcdefg.apps.googleusercontent.com"

# 3. OAuth Client Secret (dari Langkah 5)
GOOGLE_CLIENT_SECRET="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a"

# 4. Redirect URI callback OAuth (harus sama persis dengan yang didaftarkan di Google Cloud)
# Untuk dev lokal:
GOOGLE_OAUTH_REDIRECT_URI="http://localhost:3001/api/calendar/google/callback"
# Untuk produksi di VPS nanti (ganti sesuai domain):
# GOOGLE_OAUTH_REDIRECT_URI="https://hris.domain-pspk.example/api/calendar/google/callback"

# 5. Secret token untuk webhook cron trigger auto-sync tahunan libur nasional (bebas, string acak)
CRON_SECRET="pspk-calendar-cron-secret-super-aman-2026"
```

> [!IMPORTANT]
> **Enkripsi Kredensial:** Sistem HRIS secara otomatis mengenkripsi `access_token` dan `refresh_token` Google karyawan menggunakan algoritma **AES-256-GCM** sebelum disimpan ke database menggunakan kunci `DATA_ENCRYPTION_KEY` yang sudah ada di file `.env`. Jangan pernah mengubah `DATA_ENCRYPTION_KEY` setelah data tersimpan, karena akan menyebabkan token lama tidak bisa didekripsi.

---

## 4. Panduan Verifikasi & Pengujian Fitur

Setelah file `.env` disimpan, restart dev server jika perlu (`pnpm dev`).

### Uji Coba 1: Sinkronisasi Hari Libur Nasional
1. Masuk ke aplikasi HRIS: `http://localhost:3001`.
2. Login sebagai akun berhak akses Admin HR atau Superadmin (`superadmin@pspk.id`).
3. Buka menu **Kalender Kerja** di sidebar.
4. Klik tombol **"Sync Libur Nasional"** di toolbar filter.
5. Indikator loading spinner akan berputar dan menampilkan pesan sukses:
   `"Berhasil menyinkronkan N hari libur nasional & cuti bersama tahun 2026 dari Google Calendar!"`
6. Tanggal-tanggal merah resmi akan langsung muncul di kalender.

### Uji Coba 2: Menghubungkan Google Calendar & Google Meet Pribadi
1. Login sebagai karyawan (bisa Staff, Manager, atau HR).
2. Buka menu **Kalender Kerja**.
3. Di bagian atas kalender, terdapat banner:
   *"Ingin melihat Google Meet & event dari akun @pspk.is?"*
4. Klik tombol **"Hubungkan Google Calendar"**.
5. Anda akan dialihkan ke layar persetujuan Google (*Google Sign-In*).
6. Pilih akun Google Workspace Anda (misal `nama@pspk.id` atau `nama@pspk.is`).
7. Klik **Izinkan / Allow**.
8. Browser otomatis kembali ke HRIS dengan pesan sukses:
   *"Akun Google Calendar berhasil terhubung! Agenda rapat Anda telah disinkronkan."*
9. Di header kalender akan muncul badge akun Google Anda (misal `Google: nama@pspk.id`), dan filter baru **"Meeting Saya"** akan aktif.
10. Rapat koordinasi / Google Meet Anda akan tampil di kalender dengan warna biru gelap/indigo. Klik pada meeting tersebut untuk melihat rincian dan tombol **"Buka Google Meet"**.

### Uji Coba 3: Sinkronisasi Ulang & Putus Sambungan
- Jika ada meeting baru yang baru dibuat di Google Calendar, klik tombol **"Sync Meeting"** untuk menarik jadwal terbaru seketika.
- Jika ingin memutuskan sambungan akun, klik tombol **Putuskan Sambungan** (ikon rantai terputus). Token dan data event Google akan langsung dibersihkan dari database HRIS.

---

## 5. Pertanyaan Umum & Troubleshooting

### Q1: Muncul error `redirect_uri_mismatch` saat menghubungkan Google.
**Penyebab:** Nilai `GOOGLE_OAUTH_REDIRECT_URI` di file `.env` tidak sama persis (huruf besar/kecil, tanda garis miring di akhir, atau port) dengan yang didaftarkan di Google Cloud Console.  
**Solusi:** Pastikan di Google Cloud Console pada bagian **Authorized redirect URIs** tertulis persis:
`http://localhost:3001/api/calendar/google/callback`

### Q2: Muncul error `access_denied` atau akun tidak diizinkan.
**Penyebab:** OAuth Consent Screen disetel ke *Internal*, namun Anda mencoba login menggunakan akun Gmail pribadi (`@gmail.com`) bukan akun Google Workspace organisasi PSPK.  
**Solusi:** Gunakan akun resmi berdomain PSPK (`@pspk.id` / `@pspk.is`), atau tambahkan email tersebut di Google Workspace Admin.

### Q3: Apakah karyawan lain bisa melihat judul meeting pribadi saya?
**Jawaban:** **Tidak.** Modul Kalender Kerja didesain dengan prinsip privasi ketat. Query database kalender memfilter `employeeId` secara spesifik hanya untuk karyawan yang sedang login. Rekan kerja atau karyawan lain di organisasi hanya dapat melihat cuti tim dan hari libur nasional bersama.
