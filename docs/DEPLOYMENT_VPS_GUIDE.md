# Panduan Lengkap Deployment PSPK Platform ke VPS (Docker)

Dokumen ini adalah panduan resmi langkah demi langkah (*end-to-end*) untuk mendeploy **PSPK HRIS & System Management** ke server Virtual Private Server (VPS) menggunakan **Docker Compose**, **PostgreSQL 17**, dan **Caddy Reverse Proxy (HTTPS Otomatis)**.

---

## Daftar Isi

1. [Spesifikasi & Kebutuhan VPS](#1-spesifikasi--kebutuhan-vps)
2. [Konfigurasi Domain & DNS](#2-konfigurasi-domain--dns)
3. [Setup Awal Server VPS](#3-setup-awal-server-vps)
4. [Instalasi Docker & Docker Compose](#4-instalasi-docker--docker-compose)
5. [Transfer Kode Proyek ke VPS](#5-transfer-kode-proyek-ke-vps)
6. [Konfigurasi Lingkungan (`.env.production`)](#6-konfigurasi-lingkungan-envproduction)
7. [Menjalankan Aplikasi (Build & Up)](#7-menjalankan-aplikasi-build--up)
8. [Inisialisasi Database & Akun Super Admin](#8-inisialisasi-database--akun-super-admin)
9. [Verifikasi Akses & Sertifikat SSL](#9-verifikasi-akses--sertifikat-ssl)
10. [Otomatisasi Backup Database & Uploads](#10-otomatisasi-backup-database--uploads)
11. [Alur Pembaruan Kode (Update / Maintenance)](#11-alur-pembaruan-kode-update--maintenance)
12. [Troubleshooting & Solusi Kendala Populer](#12-troubleshooting--solusi-kendala-populer)

---

## 1. Spesifikasi & Kebutuhan VPS

### Rekomendasi Penyedia: Jagoan Hosting (VPS Docker)
Platform PSPK sangat cocok menggunakan layanan **VPS Docker dari Jagoan Hosting** (`jagoanhosting.com/vps-docker`):
- **Datacenter Lokal Indonesia (Jakarta / Surabaya):** Latensi akses sangat rendah (< 15 ms), memastikan staf PSPK membuka portal HRIS dan System Management dengan sangat responsif.
- **Docker Pre-Installed:** Template VPS Docker umumnya telah menyertakan Docker Engine dan Docker Compose siap pakai.

#### Perbandingan Paket Jagoan Hosting untuk PSPK:
| Paket | Spesifikasi | Harga | Rekomendasi & Analisis |
| :--- | :--- | :--- | :--- |
| **Galaxy** | **4 Core CPU**, **4 GB RAM**, **100 GB Storage** (+100 GB Gratis) | **Rp 200.000 / bln** | ⭐ **Rekomendasi Utama (Sweet Spot!)**<br>• RAM 4 GB sangat stabil menjalankan PostgreSQL 17 + HRIS + Sysmgmt + Caddy.<br>• 4 Core CPU mempercepat proses build Next.js (hanya ~1–2 menit).<br>• Storage 100 GB sangat lega untuk ribuan arsip dokumen/kontrak/cuti. |
| **Nebula** | **2 Core CPU**, **2 GB RAM**, **40 GB Storage** (+100 GB Gratis) | **Rp 100.000 / bln** | **Alternatif Hemat** (jika anggaran terbatas).<br>• **Wajib** membuat Swap File 4 GB (Bagian 3.2) agar build Next.js tidak terkena *Out of Memory (OOM)*. |
| **Universe** | **6 Core CPU**, **6 GB RAM**, **200 GB Storage** (+100 GB Gratis) | **Rp 300.000 / bln** | *Overkill* untuk kebutuhan tahap awal PSPK. |

### Panduan Saat Melakukan Pemesanan (Checkout) di Jagoan Hosting:
1. **Pilihan Sistem Operasi (OS):** Pilih **Ubuntu 24.04 LTS** (atau template **Docker on Ubuntu** jika tersedia di menu pilihan OS).
2. **Lokasi Server:** Pilih **Indonesia (Datacenter Jakarta / Surabaya)**.
3. **Control Panel / Add-on:** Tidak perlu membeli lisensi cPanel/Plesk tambahan (hemat biaya), karena arsitektur PSPK telah mandiri menggunakan container Docker dan Caddy.
4. **Data Akun VPS:** Setelah pembayaran terkonfirmasi, Anda akan menerima email aktivasi berisi:
   - **IP Publik VPS** (contoh: `103.xxx.xxx.xxx`)
   - **Username:** `root`
   - **Password Root VPS** (atau private key SSH).

---

## 2. Konfigurasi Domain & DNS

Platform PSPK menggunakan arsitektur dua portal web dalam satu domain induk dengan Single Sign-On (SSO):
1. **Portal HRIS:** `https://hris.pspk.id`
2. **Portal System Management:** `https://sysmgmt.pspk.id`

### Pengaturan DNS Records
Masuk ke panel manajemen DNS domain Anda (Cloudflare, Niagahoster, Rumahweb, dll.) dan tambahkan 2 buah **A Record**:

| Tipe | Nama Host / Subdomain | Nilai (Value / Target) | TTL | Proxy Status (Cloudflare) |
| :---: | :--- | :--- | :---: | :---: |
| **A** | `hris` | `<IP_PUBLIK_VPS_ANDA>` | Auto / 300 | **DNS Only** (Abu-abu) |
| **A** | `sysmgmt` | `<IP_PUBLIK_VPS_ANDA>` | Auto / 300 | **DNS Only** (Abu-abu) |

> [!TIP]
> **Mengapa DNS Only di Cloudflare?**
> Caddy Reverse Proxy di VPS akan secara otomatis memverifikasi kepemilikan domain melalui Let's Encrypt (port 80 HTTP Challenge) dan menerbitkan sertifikat SSL TLS kelas A+ secara otomatis tanpa perlu sertifikat manual. Jika memakai Cloudflare Proxy (awan jingga), pastikan SSL mode di Cloudflare diatur ke **Full (Strict)**.

---

## 3. Setup Awal Server VPS

Hubungkan terminal komputer lokal Anda ke VPS menggunakan SSH:

```bash
ssh root@<IP_PUBLIK_VPS_ANDA>
```

### 3.1 Perbarui Paket Sistem Operasi
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git ufw htop ca-certificates gnupg lsb-release
```

### 3.2 Buat Swap File 4 GB (Sangat Disarankan)
Swap file berfungsi sebagai memori virtual darurat agar RAM tidak penuh saat kompilasi Docker:

```bash
# Periksa apakah swap sudah ada
sudo swapon --show

# Jika belum ada, buat swap 4 GB
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Pastikan swap aktif permanen saat server restart
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Optimalkan pengaturan swappiness
sudo sysctl vm.swappiness=20
echo 'vm.swappiness=20' | sudo tee -a /etc/sysctl.conf
```

### 3.3 Konfigurasi Firewall (UFW)
Buka hanya port yang diperlukan untuk keamanan server:

```bash
# Izinkan SSH (Port 22), HTTP (Port 80), dan HTTPS (Port 443)
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp comment 'SSH'
sudo ufw allow 80/tcp comment 'HTTP Caddy SSL Challenge'
sudo ufw allow 443/tcp comment 'HTTPS Caddy'

# Aktifkan firewall
sudo ufw enable
sudo ufw status verbose
```

---

## 4. Instalasi Docker & Docker Compose

> [!TIP]
> **Pemeriksaan Cepat untuk VPS Docker Jagoan Hosting:**
> Jika Anda memilih template OS *Docker* saat memesan di Jagoan Hosting, Docker Engine dan Docker Compose biasanya **sudah otomatis terpasang**. Periksa terlebih dahulu dengan perintah:
> ```bash
> docker --version
> docker compose version
> ```
> Jika kedua perintah di atas langsung menampilkan versinya (contoh: `Docker version 27.x` dan `Docker Compose version v2.x`), Anda dapat **langsung melompat ke Bagian 5**.

Jika Docker belum terpasang (misal Anda memilih OS Ubuntu polos), instalasi versi stabil resmi dari repositori Docker:

```bash
# 1. Hapus paket bawaan yang usang (jika ada)
sudo apt remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true

# 2. Tambahkan GPG key resmi Docker
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# 3. Tambahkan repositori ke APT sources
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 4. Instal Docker Engine, CLI, Containerd, dan Docker Compose Plugin
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 5. Verifikasi instalasi
docker --version
docker compose version

# 6. Pastikan service Docker berjalan otomatis saat boot
sudo systemctl enable docker
sudo systemctl start docker
```

---

## 5. Transfer Kode Proyek ke VPS

Buat direktori kerja di VPS (misalnya `/opt/pspk-platform`):

```bash
sudo mkdir -p /opt/pspk-platform
sudo chown $USER:$USER /opt/pspk-platform
cd /opt/pspk-platform
```

### Opsi A: Menggunakan Git Clone (Direkomendasikan)
Buat deploy key SSH di VPS untuk mengakses repositori GitHub secara aman:

```bash
# Buat SSH key baru di VPS
ssh-keygen -t ed25519 -C "deploy-vps-pspk" -f ~/.ssh/id_ed25519 -N ""

# Tampilkan public key
cat ~/.ssh/id_ed25519.pub
```
Salin output tersebut, buka repositori GitHub Anda -> **Settings** -> **Deploy keys** -> **Add deploy key** (centang *Allow write access* jika perlu).

Lalu lakukan clone:
```bash
git clone git@github.com:ArisDanuarta/HRIS-System-Management.git .
```

### Opsi B: Transfer Manual via RSYNC dari Laptop Lokal
Jika tidak ingin memakai GitHub Deploy Key, Anda bisa mengirim kode dari laptop lokal Anda (tanpa menyertakan `node_modules` atau data dev):

```bash
# Jalankan dari terminal laptop Anda (root repo):
rsync -avz --exclude 'node_modules' --exclude '.next' --exclude '.turbo' --exclude '.data' --exclude '.env' \
  ./ root@<IP_PUBLIK_VPS_ANDA>:/opt/pspk-platform/
```

---

## 6. Konfigurasi Lingkungan (`.env.production`)

Di dalam direktori `/opt/pspk-platform` di VPS:

```bash
cp .env.production.example .env.production
```

### 6.1 Hasilkan Kunci Enkripsi Rahasia
Jalankan perintah ini di VPS untuk menghasilkan 4 kunci rahasia yang unik:

```bash
echo "AUTH_SECRET: $(openssl rand -base64 32)"
echo "DATA_ENCRYPTION_KEY: $(openssl rand -base64 32)"
echo "CRON_SECRET: $(openssl rand -base64 32)"
echo "DB_OWNER_PASS: $(openssl rand -hex 16)"
echo "DB_APP_PASS: $(openssl rand -hex 16)"
```

### 6.2 Edit File `.env.production`
Buka file dengan editor teks `nano`:

```bash
nano .env.production
```

Isi dan sesuaikan nilainya:

```ini
# ==============================================================================
# PSPK Platform — Konfigurasi Lingkungan Produksi VPS
# ==============================================================================

# --- Domain & Routing Publik ---
HRIS_DOMAIN=hris.pspk.id
SYSMGMT_DOMAIN=sysmgmt.pspk.id
AUTH_COOKIE_DOMAIN=.pspk.id             # Wajib diawali titik (.) agar SSO lintas portal aktif

# --- Kredensial Database PostgreSQL (Container Docker) ---
POSTGRES_DB=pspk_platform
POSTGRES_USER=pspk_owner
POSTGRES_PASSWORD=<tempel_DB_OWNER_PASS_di_sini>
APP_DB_USER=pspk_app
APP_DB_PASSWORD=<tempel_DB_APP_PASS_di_sini>

# --- Kunci Rahasia & Enkripsi ---
AUTH_SECRET=<tempel_AUTH_SECRET_di_sini>
BETTER_AUTH_SECRET=<tempel_AUTH_SECRET_di_sini>
DATA_ENCRYPTION_KEY=<tempel_DATA_ENCRYPTION_KEY_di_sini>

# --- Penyimpanan Berkas Dokumen ---
STORAGE_DRIVER=local
STORAGE_LOCAL_DIR=/app/uploads
MAX_UPLOAD_MB=25

# --- Zona Waktu Operasional ---
APP_TIMEZONE=Asia/Jakarta

# --- Email / SMTP (Untuk kirim kredensial akun baru & notifikasi) ---
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=notifikasi@pspk.id
SMTP_PASS=xxxx xxxx xxxx xxxx          # 16 digit Google App Password
SMTP_FROM="PSPK HRIS <noreply@pspk.id>"

# --- Integrasi Google & Cron ---
GOOGLE_CALENDAR_API_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_OAUTH_REDIRECT_URI=https://hris.pspk.id/api/calendar/google/callback
CRON_SECRET=<tempel_CRON_SECRET_di_sini>
```

Simpan file dengan menekan `Ctrl + O` lalu `Enter`, dan keluar dengan `Ctrl + X`.

> [!CAUTION]
> Jangan pernah membagikan atau meng-commit file `.env.production` ke repositori publik Git!

---

## 7. Menjalankan Aplikasi (Build & Up)

Platform PSPK telah memiliki file orkestrasi siap pakai [docker-compose.prod.yml](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/docker-compose.prod.yml).

### 7.1 Lakukan Build Image Docker
Perintah ini akan mengompilasi image `postgres`, `migrate`, `hris`, `sysmgmt`, dan `caddy`:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production build
```
*(Proses build pertama kali memerlukan waktu sekitar 3–7 menit tergantung kecepatan CPU VPS).*

### 7.2 Jalankan Seluruh Layanan di Latar Belakang
```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d
```

### 7.3 Periksa Status Kontainer
```bash
docker compose -f docker-compose.prod.yml ps
```

Seluruh kontainer harus berada dalam status `running` atau `healthy`:
- `pspk-platform-postgres-1` (healthy)
- `pspk-platform-migrate-1` (exited 0 — sukses menjalankan migrasi Prisma ke database)
- `pspk-platform-hris-1` (healthy)
- `pspk-platform-sysmgmt-1` (healthy)
- `pspk-platform-caddy-1` (running — port 80 & 443)

### 7.4 Pantau Log Real-time
Jika ingin melihat log aplikasi:
```bash
# Pantau log seluruh kontainer
docker compose -f docker-compose.prod.yml logs -f

# Atau pantau kontainer tertentu saja:
docker compose -f docker-compose.prod.yml logs -f caddy
docker compose -f docker-compose.prod.yml logs -f hris
```

---

## 8. Inisialisasi Database & Akun Super Admin

Saat pertama kali dijalankan di database produksi baru, tabel-tabel PostgreSQL telah terbentuk berkat kontainer `migrate`. Namun, sistem memerlukan **data peran master (RBAC)** dan **akun Super Admin pertama** untuk dapat login.

Jalankan perintah seed resmi melalui kontainer `hris`:

```bash
docker compose -f docker-compose.prod.yml exec hris \
  node -e '
    const { PrismaClient } = require("@prisma/client");
    const { hashPassword } = require("better-auth/crypto");
    // Jalankan skrip inisialisasi akun super admin produksi
  '
```

Atau, cara paling mudah dan bersih adalah menjalankan seed dari CLI monorepo:

```bash
# Jalankan Prisma seed resmi di dalam kontainer:
docker compose -f docker-compose.prod.yml run --rm migrate \
  pnpm --filter @pspk/db seed
```

Perintah di atas akan secara otomatis:
1. Memasukkan 5 Role Standar: `super_admin`, `admin_hr`, `admin_it`, `manager`, `staff`.
2. Menghubungkan seluruh hak akses (56 permissions).
3. Membuat akun administrator awal:
   - **Email:** `superadmin@pspk.id`
   - **Password Awal:** `Admin123!` (Segera ubah kata sandi ini setelah berhasil login pertama kali di menu Profil).

---

## 9. Verifikasi Akses & Sertifikat SSL

1. Buka peramban di komputer Anda:
   - Akses **HRIS:** `https://hris.pspk.id`
   - Akses **System Management:** `https://sysmgmt.pspk.id`
2. Periksa ikon gembok di bilah alamat browser: Caddy secara otomatis telah mengaktifkan **Sertifikat SSL Let's Encrypt (HTTPS Valid)**.
3. Masuk dengan akun `superadmin@pspk.id` / `Admin123!`.
4. Coba berpindah antar-portal melalui menu **App Switcher** di pojok antarmuka — Anda akan langsung masuk tanpa perlu memasukkan kata sandi lagi (*Seamless SSO via Cross-Subdomain Cookies*).

---

## 10. Otomatisasi Backup Database & Uploads

Platform telah dilengkapi skrip pencadangan otomatis di [scripts/backup.sh](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/scripts/backup.sh). Skrip ini mencadangkan database PostgreSQL (format `.dump`) dan seluruh folder upload dokumen (`.tar.gz`) dengan retensi rotasi otomatis 14 hari.

### 10.1 Uji Coba Skrip Backup
Di VPS, pastikan skrip dapat dieksekusi:

```bash
chmod +x /opt/pspk-platform/scripts/backup.sh

# Jalankan uji coba backup manual
/opt/pspk-platform/scripts/backup.sh

# Periksa hasil backup di /var/backups/pspk
ls -lh /var/backups/pspk
```

### 10.2 Pasang Cron Job Harian
Buka editor crontab server:

```bash
crontab -e
```

Tambahkan baris berikut di paling bawah (otomatis dieksekusi setiap malam pukul 02:00 WIB):

```cron
0 2 * * * /opt/pspk-platform/scripts/backup.sh >> /var/log/pspk-backup.log 2>&1
```

Simpan dan keluar.

---

## 11. Alur Pembaruan Kode (Update / Maintenance)

Setiap kali Anda selesai mengembangkan fitur baru di komputer lokal dan meng-push perubahan ke GitHub, ikuti prosedur cepat ini di VPS untuk memperbarui aplikasi tanpa *downtime* lama:

```bash
# 1. Masuk ke direktori aplikasi di VPS
cd /opt/pspk-platform

# 2. Ambil perubahan kode terbaru dari Git
git pull origin main

# 3. Build ulang image kontainer yang berubah dan jalankan ulang
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build

# 4. Bersihkan image lama yang sudah tidak terpakai untuk menghemat ruang disk
docker image prune -f
```

---

## 12. Troubleshooting & Solusi Kendala Populer

### Kendala 1: Sertifikat SSL Gagal Terbit di Caddy
- **Penyebab:** DNS A record belum mengarah ke IP VPS Anda, atau port 80/443 terblokir firewall.
- **Solusi:**
  1. Jalankan `dig +short hris.pspk.id` di VPS. Pastikan IP yang muncul adalah IP publik VPS Anda.
  2. Periksa status firewall: `sudo ufw status`. Pastikan port 80 dan 443 `ALLOW`.
  3. Periksa log Caddy: `docker compose -f docker-compose.prod.yml logs caddy`.

### Kendala 2: Build Next.js Gagal / Server Freeze (OOM Killer)
- **Penyebab:** RAM VPS penuh saat proses `next build`.
- **Solusi:**
  Pastikan Swap File 4 GB telah aktif dengan mengecek `free -h` atau `swapon --show`. Jika belum, ikuti panduan Bagian 3.2.

### Kendala 3: Sesi Login Tidak Bertahan Saat Pindah Portal
- **Penyebab:** Nilai `AUTH_COOKIE_DOMAIN` di file `.env.production` tidak memiliki titik di depannya.
- **Solusi:**
  Pastikan di `.env.production` tertulis `AUTH_COOKIE_DOMAIN=.pspk.id` (harus ada titik sebelum nama domain). Lalu restart kontainer dengan `docker compose -f docker-compose.prod.yml restart hris sysmgmt`.

### Kendala 4: Ingin Melihat Log Error Aplikasi
```bash
# Melihat 100 baris log terakhir aplikasi HRIS:
docker compose -f docker-compose.prod.yml logs --tail=100 -f hris

# Melihat log database PostgreSQL:
docker compose -f docker-compose.prod.yml logs --tail=100 postgres
```
