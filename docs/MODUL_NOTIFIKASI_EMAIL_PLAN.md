# Dokumen Analisis & Rencana Pengembangan: Modul Komunikasi & Broadcast Email Internal

> **Lembaga:** Pusat Studi Pendidikan dan Kebijakan (PSPK)  
> **Aplikasi:** HRIS PSPK (`apps/hris`)  
> **Penulis:** Antigravity AI Assistant & I Made Aris Danuarta (IT Administrator PSPK)  
> **Status:** Draft Usulan Rancangan untuk Ditinjau  
> **Tanggal:** 21 Oktober 2026  

---

## 1. Pendahuluan & Latar Belakang

Pengelolaan komunikasi internal dan penyebaran pengumuman resmi di lingkungan Pusat Studi Pendidikan dan Kebijakan (PSPK) membutuhkan saluran formal yang terpusat, terstruktur, dan terpercaya. Selama ini, penyampaian informasi penting—seperti kebijakan lembaga, instruksi HR, pengumuman libur bersama, maupun arahan teknis dari manajer ke tim—sering kali dilakukan secara manual atau terpisah melalui aplikasi pesan instan pihak ketiga.

Modul ini dirancang untuk menghadirkan **Pusat Komunikasi & Broadcast Email Internal** yang terintegrasi langsung di dalam sistem HRIS PSPK dengan memanfaatkan akun pengirim resmi lembaga (`no-reply@pspk.id`). Modul ini memberikan kemudahan bagi manajemen (HR dan Lead/Manajer) untuk menyusun pengumuman yang rapi menggunakan penyunting teks kaya (*Rich Text Editor*) bergaya Microsoft Word yang simpel, menyematkan gambar dan tautan penting, serta mendistribusikannya secara tepat sasaran sesuai hierarki organisasi.

---

## 2. Analisis Kebutuhan Bisnis & Hak Akses (RBAC)

### 2.1 Peran Pengguna & Batasan Wilayah Pengiriman (*Target Scoping*)

Sesuai dengan prinsip keamanan dan tata kelola organisasi, hak pengiriman email dibedakan secara tegas berdasarkan peran pengguna dalam sistem:

| Peran (Role) | Hak Pengiriman (*Send Scope*) | Target Penerima yang Diizinkan | Catatan Tata Kelola |
| :--- | :--- | :--- | :--- |
| **Super Admin & Admin HR** | **Organisasi Penuh** (`hris.broadcast.send:all`) | 1. Seluruh Karyawan Aktif<br>2. Filter per Departemen/Divisi<br>3. Filter per Tipe Ketenagakerjaan (Tetap, Kontrak, Mitra)<br>4. Pilih Karyawan Tertentu (*Custom Selection*) | Digunakan untuk pengumuman lembaga, edaran direksi, sosialisasi tunjangan/BPJS, evaluasi kinerja tahunan, dsb. |
| **Lead / Manajer / Unit Head** | **Hanya Anggota Tim** (`hris.broadcast.send:team`) | **Terkunci Otomatis** ke anggota tim langsung (*direct reports* berdasar `Employee.managerId` dan/atau anggota di departemen yang dipimpin). | Digunakan untuk koordinasi kerja tim, jadwal rapat internal divisi, arahan proyek, dan pembagian tugas mingguan. |
| **Staf / Karyawan Biasa** | **Hanya Menerima** (`hris.broadcast.read:own`) | Tidak memiliki hak mengirim email broadcast / blast. Hanya dapat membaca email yang masuk di inbox Gmail masing-masing dan di notifikasi portal. | Mencegah penyalahgunaan pengiriman massal dan penumpukan email spam di lingkungan staf. |

### 2.2 Penegakan Validasi di Sisi Server (*Server-Side Authorization*)
Penyaringan hak akses tidak hanya dilakukan dengan menyembunyikan elemen antarmuka (UI), melainkan diproteksi secara ketat di sisi *Server Action*:
- Jika pengguna berstatus **Lead / Manajer**, server akan memvalidasi ulang seluruh ID karyawan penerima. Jika ditemukan ada email di luar daftar bawahan langsung atau departemennya, sistem secara otomatis menolak eksekusi dan mencatat upaya pelanggaran ke Audit Log.
- Jika pengguna berstatus **Staf**, pemanggilan endpoint pengiriman langsung memicu `ForbiddenError`.

---

## 3. Arsitektur Pengiriman Email & Akun Pengirim

### 3.1 Akun Pengirim Resmi: `no-reply@pspk.id`
- Seluruh pengumuman dikirimkan melalui satu gerbang identitas resmi:  
  **`PSPK HRIS <no-reply@pspk.id>`**
- Penggunaan alamat `no-reply@pspk.id` memberikan kesan formal, kredibel, dan mencegah kebingungan staf terkait apakah email tersebut merupakan email resmi institusi atau pesan pribadi.

### 3.2 Penanganan Balasan Cerdas (*Smart Reply-To Routing*)
Salah satu kendala umum email `no-reply` adalah staf sering menekan tombol **"Reply / Balas"** ketika ingin bertanya, yang berakibat balasan mental atau terbuang karena akun `no-reply` tidak dipantau secara rutin.
- **Solusi yang Diterapkan:**  
  Setiap email yang dikirim akan menyematkan header RFC-2822 `Reply-To` yang secara dinamis diisi dengan **alamat email asli pengguna yang mengirimkan pesan** (misal email pribadi kantor Admin HR atau email Manajer bersangkutan).
  - *Contoh:*
    ```http
    From: "PSPK HRIS" <no-reply@pspk.id>
    Reply-To: "Dian Sastro (Manajer Riset)" <dian.sastro@pspk.id>
    To: anggota.tim@pspk.id
    ```
  - **Dampaknya:** Saat anggota tim mengklik tombol "Reply" di aplikasi Gmail/Outlook mereka, pesan balasan secara otomatis tertuju langsung ke email sang Manajer/HR.

### 3.3 Penanganan Pengiriman Massal & Anti-Spam (*Delivery Engine*)
Mengirimkan 50–100+ email sekaligus dalam satu baris `To:` atau `BCC:` merupakan praktik buruk yang dapat membocorkan privasi staf dan langsung diblokir oleh filter spam Google Workspace.
1. **Pengiriman Terisolasi per Pegawai (*Individual Personalized Delivery*):**  
   Setiap karyawan menerima email tersendiri dengan nama mereka di salam pembuka (*"Halo [Nama Karyawan],"*), sehingga privasi terjaga dan reputasi pengiriman tinggi.
2. **Pengendalian Kecepatan & Antrean (*Concurrency & Rate Limiting*):**  
   Pengiriman dilakukan dalam kelompok (*batch chunks*) berukuran 5-10 email secara asinkron dengan jeda kecil (200–300 ms). Hal ini mencegah pemblokiran dari server SMTP Google/Workspace yang membatasi laju koneksi per menit.
3. **Resiliensi Pengiriman (*Error Tolerance*):**  
   Jika salah satu alamat email karyawan gagal (misal inbox penuh atau alamat tidak aktif), proses pengiriman tidak akan terhenti, melainkan melanjutkan sisa antrean dan menandai status pengiriman karyawan tersebut sebagai `GAGAL` di tabel riwayat.

---

## 4. Desain Penyunting Pesan (*Rich Text Editor* Simpel Mirip Word)

### 4.1 Pilihan Teknologi: Headless Editor (Tiptap v2)
Untuk memberikan pengalaman menulis seperti Microsoft Word atau Google Docs tanpa membuat aplikasi lambat atau penuh tombol rumit, sistem menggunakan pustaka **Tiptap v2** yang dipadukan dengan komponen styling **Tailwind CSS**.

**Keunggulan Tiptap:**
- Menghasilkan kode HTML semantik yang sangat bersih dan valid (aman dikonversi ke format email HTML).
- Kompatibel penuh dengan **React 19** dan **Next.js 16 (App Router)** yang digunakan dalam monorepo PSPK.
- Bobot ringan dan mudah disesuaikan (*headless*), sehingga tata letak tombol persis seperti toolbar Microsoft Word yang disederhanakan.

### 4.2 Tombol & Fitur Toolbar Minimalis
Toolbar diletakkan di bagian atas kotak teks dengan ikon-ikon yang familier:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [ Normal Teks ▾ ] | [B] [I] [U] [S] | [ • List ] [ 1. List ] | [ " Kutipan ] | [ 🔗 Tautan ] [ 🖼 Gambar ] | [ ↺ ] [ ↻ ] │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│ Tulis isi pengumuman atau pesan resmi di sini...                                       │
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

1. **Gaya Teks:** Paragraf (Normal), Judul Bab (`Heading 2`), Sub-Judul (`Heading 3`).
2. **Format Karakter:** Tebal (*Bold*), Miring (*Italic*), Garis Bawah (*Underline*), Coret (*Strikethrough*).
3. **Daftar Poin:** Daftar Butir (*Bullet List*) dan Daftar Berangka (*Numbered List*).
4. **Sorotan Pesan:** Kotak Kutipan / Peringatan (*Blockquote*).
5. **Sisipkan Tautan (Link):**  
   - Dialog popover sederhana: Masukkan URL tujuan (misal: link formulir Google Form, dokumen Google Drive, atau halaman portal) beserta teks yang ditampilkan.
   - Dilengkapi validasi keamanan (hanya menerima protokol `https://` atau `http://`).
6. **Sisipkan Gambar (Image):**  
   - **Opsi A (Unggah dari Komputer):** Memilih file gambar (JPG, PNG, WebP maks 2MB). Berkas otomatis diunggah ke storage sistem dan disematkan langsung ke dalam naskah.
   - **Opsi B (Tautan URL):** Menempelkan alamat URL gambar eksternal yang sudah ada.
7. **Pembersihan & Sanitasi Kode (Security Sanitization):**  
   Sebelum email dikirimkan atau disimpan ke basis data, konten HTML disanitasi menggunakan pustaka pembersih server-side untuk memastikan tidak ada kode berbahaya (*script injection / XSS*).

---

## 5. Desain Template Email Resmi PSPK

Tampilan email yang diterima di kotak masuk karyawan harus mencerminkan identitas visual resmi lembaga PSPK:

### 5.1 Spesifikasi Visual & Tipografi
- **Warna Utama:** Deep Navy (`#102E50`) pada header dan tombol aksi utama.
- **Warna Aksen:** Gold (`#F2AF3E`) sebagai garis pembatas elegan di bawah header.
- **Tipografi Email:** Menggunakan font *web-safe* standar industri email (Inter, Helvetica, Arial) agar teks terbaca tajam dan konsisten di seluruh perangkat (iOS Mail, Android Gmail, Windows Outlook, dan Web Browser).
- **Format Kotak Konten:** Kartu putih berbingkai tipis dengan bayangan lembut (*box shadow*), memastikan pesan nyaman dibaca di layar smartphone maupun monitor komputer.

### 5.2 Anatomi Email yang Dikirim
```
┌──────────────────────────────────────────────────────────────────────────────┐
│                  PUSAT STUDI PENDIDIKAN DAN KEBIJAKAN                        │
│                   Portal HRIS & Manajemen Organisasi                         │
├──────────────────────────────────────────────────────────────────────────────┤  <- Garis Aksen Emas (#F2AF3E)
│                                                                              │
│  [ BADGE: PENGUMUMAN DIVISI / LEMBAGA ]                                      │
│  Dari: Dian Sastro (Lead Peneliti Kebijakan)                                │
│                                                                              │
│  Halo Budi Santoso,                                                          │
│                                                                              │
│  [ ISI PESAN DARI RICH TEXT EDITOR ]                                         │
│  - Teks terformat rapi                                                       │
│  - Gambar bagan/alur kerja tim                                               │
│  - Tombol tautan dokumen pendukung:                                          │
│                                                                              │
│                 [ Buka Formulir Konfirmasi Tim → ]                           │
│                                                                              │
│  Jika ada hal yang ingin didiskusikan, silakan langsung membalas email ini   │
│  untuk terhubung langsung dengan pengirim.                                   │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│  Email ini dikirimkan secara otomatis dari no-reply@pspk.id                  │
│  melalui Sistem HRIS & Manajemen Organisasi PSPK.                            │
│  © 2026 Yayasan Pusat Studi Pendidikan dan Kebijakan (PSPK)                  │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Integrasi Ganda: Email + Notifikasi Aplikasi (*Dual Notification*)

Salah satu keunggulan rancangan ini adalah opsi integrasi dengan **Pusat Notifikasi Dalam Aplikasi (Lonceng Portal HRIS)**:
- Pada formulir pengiriman email, disediakan kotak centang opsi:  
  ☑ **Kirimkan juga sebagai Notifikasi di Portal HRIS** *(Default: Tercentang)*.
- **Mekanisme Kerja:**  
  Ketika email dikirim, sistem secara simultan membuat baris baru di tabel `core.Notification` untuk masing-masing penerima.  
  Dengan demikian, staf yang sedang membuka portal HRIS di komputernya akan langsung melihat badge merah angka baru di ikon lonceng navbar tanpa harus membuka aplikasi Gmail mereka terlebih dahulu.

---

## 7. Desain Basis Data (Prisma Multi-Schema)

Dua model baru akan ditambahkan pada skema `hris` (`packages/db/prisma/schema/hris.prisma`):

### 7.1 Model `EmailBroadcast` (Tabel Induk Pengumuman)
Mencatat informasi pokok pengumuman yang dibuat oleh HR atau Manajer:
```prisma
enum BroadcastScope {
  ALL_EMPLOYEES     // Seluruh karyawan aktif (Khusus HR / Super Admin)
  DEPARTMENT        // Departemen/Divisi tertentu (HR atau Unit Head)
  TEAM              // Tim bawahan langsung (Khusus Manajer / Lead)
  CUSTOM            // Karyawan terpilih

  @@schema("hris")
}

enum BroadcastStatus {
  DRAFT             // Draf belum terkirim
  SENDING           // Sedang dalam antrean pengiriman
  SENT              // Selesai dikirim
  PARTIALLY_FAILED  // Sebagian berhasil, sebagian gagal
  FAILED            // Gagal total

  @@schema("hris")
}

model EmailBroadcast {
  id                 String          @id @default(uuid())
  subject            String
  contentHtml        String          @db.Text
  contentText        String          @db.Text
  senderUserId       String          @map("sender_user_id")
  senderEmployeeId   String?         @map("sender_employee_id")
  senderName         String          @map("sender_name")
  senderEmail        String          @map("sender_email")
  replyToEmail       String          @map("reply_to_email")
  targetScope        BroadcastScope  @default(TEAM) @map("target_scope")
  targetDepartmentId String?         @map("target_department_id")
  totalRecipients    Int             @default(0) @map("total_recipients")
  sentCount          Int             @default(0) @map("sent_count")
  failedCount        Int             @default(0) @map("failed_count")
  sendInApp          Boolean         @default(true) @map("send_in_app")
  status             BroadcastStatus @default(SENT)
  createdAt          DateTime        @default(now()) @map("created_at") @db.Timestamptz(6)

  senderEmployee     Employee?       @relation("SenderBroadcasts", fields: [senderEmployeeId], references: [id])
  targetDepartment   Department?     @relation(fields: [targetDepartmentId], references: [id])
  recipients         EmailBroadcastRecipient[]

  @@index([senderUserId])
  @@index([createdAt(sort: Desc)])
  @@map("email_broadcasts")
  @@schema("hris")
}
```

### 7.2 Model `EmailBroadcastRecipient` (Log Rinci Penerima)
Mencatat status penerimaan masing-masing staf untuk transparansi dan audit:
```prisma
enum DeliveryStatus {
  PENDING
  SENT
  FAILED

  @@schema("hris")
}

model EmailBroadcastRecipient {
  id            String         @id @default(uuid())
  broadcastId   String         @map("broadcast_id")
  employeeId    String?        @map("employee_id")
  email         String
  recipientName String         @map("recipient_name")
  status        DeliveryStatus @default(PENDING)
  errorMessage  String?        @map("error_message")
  sentAt        DateTime?      @map("sent_at") @db.Timestamptz(6)

  broadcast     EmailBroadcast @relation(fields: [broadcastId], references: [id], onDelete: Cascade)
  employee      Employee?      @relation(fields: [employeeId], references: [id])

  @@index([broadcastId])
  @@index([email])
  @@map("email_broadcast_recipients")
  @@schema("hris")
}
```

---

## 8. Alur Pengalaman Pengguna (UI/UX Flow)

### 8.1 Letak Menu di Aplikasi HRIS
Menu baru diletakkan di navigasi bilah sisi (*sidebar*) aplikasi HRIS:
- **Komunikasi & Pengumuman** (`/komunikasi` atau `/pengumuman`)
  - Sub-menu 1: **Tulis Pengumuman** (`/komunikasi/baru`)
  - Sub-menu 2: **Riwayat Pengiriman** (`/komunikasi/riwayat`)

### 8.2 Layar Formulir Penulisan (`/komunikasi/baru`)
1. **Pilihan Target Penerima:**
   - *Jika yang login Admin HR:* Dropdown menampilkan opsi "Semua Karyawan Aktif", "Pilih Departemen", "Pilih Tim", dan "Pilih Pegawai Tertentu".
   - *Jika yang login Manajer / Lead:* Pilihan otomatis terkunci pada *"Anggota Tim Saya (X Orang)"* dengan daftar nama dan foto bawahan ditampilkan secara transparan dalam kartu ringkasan.
2. **Subjek Email:** Input teks yang jelas (contoh: *"[Pemberitahuan] Penyesuaian Jadwal Rapat Tim Riset"*).
3. **Penyunting Teks Kaya (Word-like):** Mengetik isi pesan, memformat teks tebal/miring, menyusun daftar poin, memasukkan link formulir, dan mengunggah gambar pendukung.
4. **Tab Pratinjau (*Live Preview Tab*):** Tombol tab untuk beralih antara tampilan "Edit Konten" dan "Pratinjau Email Resmi", menampilkan wujud asli email sebagaimana akan dilihat oleh staf di aplikasi Gmail.
5. **Tombol Kirim & Dialog Konfirmasi Keamanan:**
   - Sebelum email disemburkan ke puluhan staf, sistem menampilkan modal konfirmasi:  
     *"Apakah Anda yakin ingin mengirimkan pengumuman ini kepada 18 anggota tim? Email akan dikirimkan menggunakan akun no-reply@pspk.id dengan alamat balasan ke email Anda."*

### 8.3 Layar Riwayat Pengiriman (`/komunikasi/riwayat`)
- Tabel rekap pengumuman yang pernah dikirim:
  - Waktu Pengiriman
  - Judul / Subjek
  - Pengirim (Nama & Jabatan)
  - Target (Semua Karyawan / Divisi / Tim)
  - Status Pengiriman (misal: *18/18 Terkirim (100%)*)
- Tombol **"Lihat Detail"** untuk melihat kembali naskah yang dikirim serta daftar siapa saja penerima yang sukses atau gagal.

---

## 9. Keamanan, Kepatuhan & Audit Trail

1. **Pencatatan Audit Trail Wajib (`core.AuditLog`):**  
   Setiap kali pengiriman email broadcast dilakukan, sistem secara otomatis mencatat catatan audit dengan data:
   - `action`: `"BROADCAST_EMAIL"`
   - `app`: `"hris"`
   - `entityType`: `"EmailBroadcast"`
   - `actorEmail`: Email pengguna yang mengklik kirim
   - `after`: Rincian subjek, jumlah target, scope penerima, IP address, dan User Agent.
2. **Perlindungan Terhadap Kebocoran Data (Data Privacy):**  
   Informasi sensitif karyawan seperti NIK, nomor rekening bank, dan besaran gaji **dilarang keras** dijadikan variabel otomatis dalam modul pengumuman umum ini.
3. **Pembersihan Berkas Gambar (Image Lifecycle):**  
   Gambar yang diunggah untuk konten email disimpan di direktori terisolasi (`storage/broadcast-images/`) dengan penamaan berbasis UUID acak untuk mencegah penimpaan file atau manipulasi nama berkas (*path traversal*).

---

## 10. Rencana Pentahapan Implementasi (*Action Plan*)

Pekerjaan pengembangan modul ini dipecah ke dalam 5 tahap terstruktur:

```
[Tahap 1: Skema DB & RBAC] ──► [Tahap 2: Editor Tiptap & Upload] ──► [Tahap 3: Formulir & Preview] ──► [Tahap 4: Riwayat & Log] ──► [Tahap 5: Testing & Verifikasi]
```

### Tahap 1: Persiapan Skema Database & Izin RBAC
- Menambahkan model `EmailBroadcast` dan `EmailBroadcastRecipient` di `packages/db/prisma/schema/hris.prisma`.
- Membuat migrasi Prisma baru (`pnpm db:migrate`).
- Mendaftarkan *permission keys* baru di `packages/rbac`:
  - `hris.broadcast.send:all`
  - `hris.broadcast.send:team`
  - `hris.broadcast.read:all`
  - `hris.broadcast.read:team`
  - `hris.broadcast.read:own`
- Mengaitkan izin tersebut ke peran `super_admin`, `admin_hr`, dan `manager` di `roles.ts`.

### Tahap 2: Pustaka Rich Text Editor & Layanan Unggah Gambar
- Mengintegrasikan pustaka Tiptap v2 (`@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-link`, `@tiptap/extension-image`).
- Membuat komponen editor yang bersih dan elegan di `@pspk/ui` atau lokal `apps/hris`.
- Membuat endpoint API aman untuk mengunggah gambar sisipan pesan ke storage internal.

### Tahap 3: Layanan Pengiriman Email & Antarmuka Formulir
- Mengembangkan `apps/hris/src/server/services/broadcast-email.service.ts` untuk pengiriman email SMTP individual secara berurutan (*batched*), integrasi notifikasi lonceng in-app, dan pencatatan audit log.
- Membangun halaman `/komunikasi/baru` dengan selektor target cerdas, live preview email, dan modal konfirmasi sebelum pengiriman.

### Tahap 4: Halaman Riwayat Pengiriman & Rincian Log
- Membangun halaman `/komunikasi/riwayat` yang menampilkan daftar email yang telah dikirim.
- Menampilkan rincian status pengiriman per penerima (berhasil/gagal).

### Tahap 5: Pengujian Kualitas Kode (*Quality Assurance*)
- Menulis *unit test* untuk logika pemilihan penerima berdasarkan peran (Admin HR vs Manajer).
- Menguji pengiriman SMTP di lingkungan pengembangan (simulasi & uji akun real).
- Menjalankan `pnpm typecheck`, `pnpm lint`, `pnpm test`, dan `pnpm build` untuk memastikan tidak ada kesalahan kompilasi.

---

## 11. Kesimpulan & Rekomendasi Selanjutnya

Rancangan modul ini memberikan solusi lengkap atas kebutuhan komunikasi formal di PSPK:
1. **Resmi & Terpercaya:** Menggunakan alamat identitas lembaga `no-reply@pspk.id`.
2. **Komunikasi Dua Arah:** Menggunakan `Reply-To` ke email asli pengirim sehingga diskusi tim tetap dapat berlanjut secara alami.
3. **Mudah Digunakan:** Dilengkapi editor teks kaya sederhana seperti Word untuk menyusun pesan dengan format tebal, poin-poin, tautan penting, dan gambar.
4. **Aman & Terkendali:** Manajer hanya dapat mengirimkan pesan ke timnya sendiri, sementara Admin HR memiliki jangkauan menyeluruh ke seluruh institusi.

**Langkah Anda Saat Ini:**  
Silakan tinjau rancangan ini. Jika Anda menyetujui arah dan spesifikasi di atas, kita dapat segera melanjutkan ke **Tahap 1 (Skema Database & RBAC)**.
