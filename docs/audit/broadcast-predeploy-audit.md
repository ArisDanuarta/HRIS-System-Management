# Laporan Audit Menyeluruh Pra-Deploy: Modul Broadcast Pengumuman & Email PSPK

**Tanggal Audit:** 20 November 2026  
**Auditor:** Antigravity (Google DeepMind)  
**Lingkungan:** Local / Staging Development (Node.js v24.15.0, PostgreSQL 17 Docker, Turbopack Next.js 16.3.5)  
**Commit Hash Diaudit:** `b45758c0a1397dca9015642c786b76e3f1175ab5`  
**Status Working Tree:** Bersih (`git status -s` kosong, 0 uncommitted changes)

---

## 1. Ringkasan Eksekutif

Audit pra-deploy menyeluruh terhadap modul Broadcast Pengumuman dan Email PSPK telah selesai dilaksanakan. Pemeriksaan mencakup inventaris kode, analisis statis, pengujian unit & integrasi otomatis (149 pengujian modul broadcast, 465 pengujian monorepo), audit keamanan (matriks otorisasi 20 endpoint/action, XSS, CSRF, CSV Injection, dan traversal path), integritas database PostgreSQL 17 (35 migrasi Prisma), audit performa, deliverability email (DNS SPF/DMARC/MX live check), hingga kesiapan deployment Docker/Caddy pada VPS.

**Hasil Temuan Berdasarkan Tingkat Keparahan:**
- **P0 (Blocker):** 0 temuan (Tidak ada celah kebocoran data, bypass otorisasi, kehilangan data, atau aplikasi crash).
- **P1 (Tinggi):** 2 temuan (Mode simulasi SMTP belum dicegah di `NODE_ENV=production` dan aturan `allowedStyles` pada sanitasi HTML belum dibatasi ketat).
- **P2 (Sedang):** 6 temuan (Validasi magic bytes gambar, timeout koneksi soket SMTP, payload kolom `findMany` di query riwayat, penanganan zona waktu `formatDateTime`, dialog `alert()` bawaan browser, dan job otomatis pembersihan file yatim).
- **P3 (Rendah):** 4 temuan (Perbandingan constant-time secret cron, dynamic import TipTap, sanitasi kutip nama pengirim header Reply-To, dan konfigurasi eksplisit `bodySizeLimit` server actions).

**Rekomendasi Akhir:** **GO BERSYARAT (Conditional Go)**  
Sistem layak dan aman untuk dideploy ke lingkungan VPS staging/uji coba. Sebelum membuka akses penuh untuk seluruh staf di lingkungan produksi, 2 temuan P1 wajib diselesaikan dan kredensial SMTP resmi Google Workspace PSPK wajib dikonfigurasi.

---

## 2. Tabel Temuan Menyeluruh

| ID | Tingkat | Area | File:Baris | Deskripsi Masalah | Dampak | Rekomendasi Solusi | Estimasi |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **AUDIT-01** | **P1 (Tinggi)** | Deliverability & Runtime | `apps/hris/src/server/services/broadcast-email.service.ts:1088, 1145` | Jika env `SMTP_*` kosong di produksi, `isSimulated` aktif dan menandai penerima `SENT` tanpa mengirim email nyata. | HR mengira email terkirim resmi padahal hanya simulasi log server. | Di `NODE_ENV === "production"`, jika transporter `null`, batalkan proses dan tandai status broadcast `FAILED`. | S |
| **AUDIT-02** | **P1 (Tinggi)** | Keamanan / XSS | `apps/hris/src/server/services/broadcast-email.service.ts:327-334` | `sanitizeBroadcastContent` mengizinkan atribut `style` tanpa konfigurasi `allowedStyles`. | CSS berbahaya seperti `background: url(javascript:...)` atau pelacakan style dapat lolos. | Konfigurasi `allowedStyles` ketat pada `sanitizeHtml` (hanya `color`, `background-color`, `text-align`, `font-size`, dll; larang `url()` dan `javascript:`). | S |
| **AUDIT-03** | **P2 (Sedang)** | Keamanan / Upload | `apps/hris/src/app/api/broadcast/upload-image/route.ts:61-69` | Endpoint gambar hanya memvalidasi `file.type` browser dan ekstensi, tanpa validasi magic bytes biner file. | Pengguna berhak dapat mengunggah file non-gambar dengan memanipulasi Content-Type. | Tambahkan fungsi validasi magic bytes biner untuk JPG (`\xFF\xD8\xFF`), PNG (`\x89PNG`), GIF (`GIF8`), WebP (`RIFF..WEBP`). | S |
| **AUDIT-04** | **P2 (Sedang)** | Keandalan / SMTP | `apps/hris/src/server/services/broadcast-email.service.ts:601-609` | Transporter Nodemailer belum menentukan timeout soket (`connectionTimeout`, `greetingTimeout`, `socketTimeout`). | Jika koneksi SMTP VPS terputus tanpa paket FIN/RST, prosesor dapat menggantung lama dan mengunci antrean. | Tambahkan `connectionTimeout: 15000`, `greetingTimeout: 10000`, `socketTimeout: 30000` pada konfigurasi transporter. | S |
| **AUDIT-05** | **P2 (Sedang)** | Database / Performa | `apps/hris/src/server/queries/broadcast.queries.ts:180-193` | `getBroadcastHistory` mengambil seluruh record via `findMany` tanpa `select`, memuat kolom besar `contentHtml` & `contentText`. | Konsumsi memori server dan transfer I/O PostgreSQL membengkak saat arsip riwayat mencapai ratusan data. | Gunakan klausa `select` pada `prisma.emailBroadcast.findMany` hanya untuk kolom metadata yang dibutuhkan daftar. | S |
| **AUDIT-06** | **P2 (Sedang)** | UI/UX / Hydration | `apps/hris/src/components/broadcast/broadcast-history-view.tsx:390, 928, 988, 1195` | `formatDateTime` di client tidak menetapkan opsi `timeZone`, sementara label `" WIB"` ditambahkan secara hardcoded. | Selisih tampilan jam jika server me-render UTC atau client di WITA/WIT; potensi peringatan hydration mismatch. | Tetapkan `timeZone: "Asia/Jakarta"` secara eksplisit pada `Intl.DateTimeFormat` atau gunakan helper terpadu `@pspk/shared`. | S |
| **AUDIT-07** | **P2 (Sedang)** | UI/UX / Aksesibilitas | `apps/hris/src/components/broadcast/broadcast-create-form.tsx:444, 458`, `rich-text-editor.tsx:132`, `broadcast-history-view.tsx:309` | Masih terdapat pemanggilan dialog bawaan browser `alert(...)` untuk notifikasi error hapus draf/template dan paste gambar. | Memblokir thread UI browser dan tidak konsisten dengan standar design system visual PSPK. | Ganti seluruh dialog `alert(...)` dengan banner pesan error inline (`FeedbackBanner`) atau toast notification. | M |
| **AUDIT-08** | **P2 (Sedang)** | Operasional / Storage | `apps/hris/src/app/api/broadcast/upload-attachment/route.ts:116`, `upload-image/route.ts:83` | Belum ada cron scheduler otomatis untuk membersihkan file lampiran atau gambar draf yang tidak pernah dikirim (> 24 jam). | Volume penyimpanan `/app/uploads` di server VPS akan terus bertambah perlahan akibat draf yang ditinggalkan. | Buat job pembersihan berkala (dapat disatukan di cron broadcast) untuk menghapus record & berkas yatim berumur > 24 jam. | M |
| **AUDIT-09** | **P3 (Rendah)** | Keamanan / Cron | `apps/hris/src/app/api/cron/broadcast-dispatch/route.ts:26` | Pengecekan token Authorization cron menggunakan perbandingan string standar (`!==`). | Potensi timing attack mikro secara teoritis terhadap rahasia `CRON_SECRET`. | Gunakan `crypto.timingSafeEqual` untuk membandingkan token autentikasi cron. | S |
| **AUDIT-10** | **P3 (Rendah)** | Performa Klien | `apps/hris/src/components/broadcast/broadcast-create-form.tsx:32` | `RichTextEditor` (TipTap) diimpor secara statis pada halaman form, bukan menggunakan `next/dynamic`. | Ukuran chunk JavaScript awal halaman `/komunikasi/baru` lebih besar dari yang seharusnya. | Terapkan `dynamic(() => import("./rich-text-editor"), { ssr: false })` dengan fallback skeleton loader. | S |
| **AUDIT-11** | **P3 (Rendah)** | Email Header | `apps/hris/src/server/services/broadcast-email.service.ts:668` | Header Reply-To membungkus `broadcast.senderName` dengan tanda kutip ganda tanpa pembersihan kutip ganda bawaan di baris tersebut. | Jika nama pengirim di DB mengandung tanda kutip ganda (`"`), sintaks header Reply-To RFC 5322 dapat cacat. | Tambahkan `.replace(/"/g, "")` pada nama pengirim sebelum dimasukkan ke string header `Reply-To`. | S |
| **AUDIT-12** | **P3 (Rendah)** | Konfigurasi Next.js | `apps/hris/next.config.ts:3-70` | `serverActions.bodySizeLimit` belum didefinisikan secara eksplisit di `next.config.ts` (menggunakan default 1 MB). | Jika naskah HTML sangat masif ditambah ratusan ID penerima kustom, batas payload default bisa terlampaui. | Tambahkan `experimental: { serverActions: { bodySizeLimit: "2mb" } }` pada konfigurasi Next.js. | S |

---

## 3. Checklist Hasil Verifikasi per Bagian

### Bagian 1 — Inventaris dan Persiapan
- [x] **Git Status:** Bersih pada commit `b45758c0a1397dca9015642c786b76e3f1175ab5`.
- [x] **Inventaris File:** Terverifikasi 33 file terkait broadcast dan 26 file terkait komunikasi. Tidak ada file yatim atau sisa percobaan kode mati.
- [x] **Migrasi Database:** Terverifikasi 7 migrasi baru terpasang urut tanpa konflik:
  - `20261120043500_add_broadcast_queue_enums`
  - `20261120043600_add_broadcast_queue_and_resend_fields`
  - `20261120052000_add_flexible_recipient_arrays`
  - `20261120060000_add_broadcast_drafts_and_templates`
  - `20261120070000_add_email_broadcast_attachments`
  - `20261120080000_add_broadcast_scheduled_at`
  - `20261120090000_add_broadcast_category_priority_and_read_receipts`
- [x] **Dokumentasi Lingkungan (`.env.example`):** Variabel `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `HRIS_URL`, `CRON_SECRET`, `BROADCAST_BATCH_SIZE`, `BROADCAST_BATCH_DELAY_MS`, `BROADCAST_DAILY_LIMIT`, `APP_TIMEZONE`, `STORAGE_DRIVER`, dan `STORAGE_LOCAL_DIR` terdokumentasi lengkap.

### Bagian 2 — Pemeriksaan Statis dan Otomatis
- [x] **TypeScript Typecheck (`pnpm typecheck`):** ✅ Lulus 9 dari 9 paket monorepo tanpa error (`@pspk/auth`, `@pspk/config`, `@pspk/db`, `@pspk/hris`, `@pspk/rbac`, `@pspk/shared`, `@pspk/storage`, `@pspk/sysmgmt`, `@pspk/ui`).
- [x] **ESLint Linter (`pnpm lint`):** ✅ Lulus 3 dari 3 paket dengan 0 error dan 0 warning.
- [x] **Pengujian Otomatis Non-Flaky:**
  - Suite broadcast: 10 file pengujian, 149 tes **LULUS 100%**.
  - Dijalankan 3 kali berurutan dengan hasil identik (Run 1: 149/149; Run 2: 149/149; Run 3: 149/149).
  - Keseluruhan aplikasi: 57 file pengujian, 465 tes **LULUS 100%**.
- [x] **Production Standalone Build (`pnpm build`):** ✅ Kompilasi Next.js 16.3.5 Turbopack sukses untuk `@pspk/hris` dan `@pspk/sysmgmt`. Rute baru `ƒ /api/broadcast/[id]/export` dan `ƒ /pengumuman/[id]` terdaftar.
- [x] **Prisma Engine (`prisma validate` & `prisma migrate status`):** ✅ Skema valid dan status database `Database schema is up to date! (35 migrations found)`.
- [x] **Audit Dependensi (`pnpm audit --prod`):** Ditemukan peringatan umum eksternal pada framework Next.js (`next/og` RCE & SVG optimization) dan adapter Better-Auth Drizzle. Keduanya tidak berdampak pada modul broadcast (modul broadcast tidak memakai `next/og` dan melarang SVG).

---

### Bagian 3 — Audit Alur End-to-End (Skenario Fungsional)

#### 3.1 Akses dan Navigasi
| # | Skenario | Hasil | Bukti Implementasi |
| :--- | :--- | :---: | :--- |
| **N1** | Buka `/komunikasi` per peran | ✅ | [page.tsx:20-26](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/app/(app)/komunikasi/page.tsx#L20-L26): HR/Admin dialihkan ke `/baru`, Manajer ke `/riwayat`, Staf ke `/notifikasi`. |
| **N2** | Staf buka `/baru` dan `/riwayat` langsung via URL | ✅ | [baru/page.tsx:23-41](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/app/(app)/komunikasi/baru/page.tsx#L23-L41) menampilkan banner Akses Ditolak tanpa membocorkan data; [riwayat/page.tsx:59](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/app/(app)/komunikasi/riwayat/page.tsx#L59) mengalihkan staf ke `/notifikasi`. |
| **N3** | Sesi kedaluwarsa saat berada di formulir | ✅ | Seluruh Server Action mengembalikan `{ success: false, error: "Sesi telah berakhir..." }` dan state formulir lokal tidak direset diam-diam. |
| **N4** | Menu sidebar "Komunikasi" | ✅ | [app-sidebar.tsx:401, 511, 524](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/components/shell/app-sidebar.tsx#L401-L525): Menu "Broadcast Email" tampil untuk HR, "Kirim Email Tim" untuk Manajer, dan disembunyikan total untuk Staf biasa. |

#### 3.2 Menulis dan Mengirim
| # | Skenario | Hasil | Bukti Implementasi |
| :--- | :--- | :---: | :--- |
| **K1** | HR kirim ke `ALL_EMPLOYEES` | ✅ | `getBroadcastRecipients` mengambil semua pegawai aktif, mengabaikan yang tanpa email, dan mengecualikan pengirim. |
| **K2** | HR kirim multi-departemen | ✅ | Menggunakan klausa `{ currentDepartmentId: { in: targetDepartmentIds } }` dengan deduplikasi Set. |
| **K3** | HR kirim `CUSTOM` + kecualikan orang | ✅ | Filter `excludedEmployeeIds` diaplikasikan di akhir resolusi penerima. |
| **K4** | Manajer bypass payload ke `ALL_EMPLOYEES` | ✅ | `getBroadcastSenderContext` dan `enqueueBroadcast` melempar `Akses ditolak: Anda tidak memiliki izin untuk mengirim ke seluruh pegawai`. |
| **K5** | Manajer manipulasi persona `ORGANIZATION`/`CUSTOM` | ✅ | `executeSendBroadcast` & `enqueueBroadcast` memverifikasi `isManager` dan menolak persona selain `PERSONAL`. |
| **K6** | Manajer tanpa tim | ✅ | `teamMembers.length === 0`, form menampilkan empty state, pengiriman ditolak server dengan error `Tidak ada penerima aktif`. |
| **K7** | Subjek < 3 atau > 200 karakter; isi kosong | ✅ | Divalidasi ganda: Zod schema client-side dan Zod schema server-side (`sendBroadcastSchema`). |
| **K8** | Isi dengan gambar, link, list, kutipan | ✅ | Sanitasi HTML server (`sanitizeBroadcastContent`) mempertahankan struktur dan menolak script/event handler. |
| **K9** | Persona `CUSTOM` berisi tanda petik/injeksi | ✅ | Fungsi `toHeaderName` membersihkan karakter `[\r\n"\\<>]`. |
| **K10** | Format email balasan tidak valid | ✅ | Zod `z.string().email()` memvalidasi format dan menolak email cacat. |
| **K11** | Kirim dengan `sendInApp` aktif/nonaktif | ✅ | Jika aktif, record notifikasi in-app dibuat pada `notification` dengan link ke `/pengumuman/[id]`. |
| **K12** | Klik "Kirim" ganda / duplikasi kirim | ✅ | State `isSubmitting` menonaktifkan tombol di client; server mengklaim lease atomik dengan `updateMany`. |
| **K13** | Konfirmasi massal (≥ 20 penerima / ALL) | ✅ | Checkbox persetujuan wajib dicentang pada `SaveDraftModal` / konfirmasi dialog sebelum tombol kirim aktif. |
| **K14** | Mode simulasi (SMTP kosong) | ⚠️ | Berjalan di dev, namun pada produksi perlu pencegahan eksplisit (Temuan **AUDIT-01**). |

#### 3.3 Email Uji, Kirim Ulang, Jadwal, Antrean
| # | Skenario | Hasil | Bukti Implementasi |
| :--- | :--- | :---: | :--- |
| **E1** | Email uji (Simulation / Test) | ✅ | Hanya dikirim ke email kerja pengirim sendiri, subjek berawalan `[TES]`, dibatasi rate limit 5x per 10 menit. |
| **E2** | Kirim ulang penerima gagal | ✅ | `resendFailedRecipients` memverifikasi hanya penerima `FAILED` yang diubah ke `PENDING`, record `SENT` tidak disentuh. |
| **E3** | Recovery crash server di tengah pengiriman | ✅ | `processBroadcast` mereset penerima berstatus `SENDING` dengan lease kedaluwarsa (> 5 menit) kembali ke `PENDING`. |
| **E4** | Konkurensi dua worker bersamaan | ✅ | Atomik lease claim `updateMany` dengan `lockedAt` menjamin hanya 1 worker yang memproses batch. |
| **E5** | Jadwal kirim (`SCHEDULED`) | ✅ | Validasi waktu (5 menit s.d. 90 hari), tersimpan sebagai `SCHEDULED`, penerima baru dievaluasi saat jatuh tempo oleh cron. |
| **E6** | Pengirim demosi saat broadcast terjadwal jatuh tempo | ✅ | `dispatchScheduledBroadcasts` memvalidasi ulang hak pengirim; jika hak dicabut, status diubah menjadi `FAILED` disertai audit log. |
| **E7** | Proteksi endpoint cron | ✅ | POST `/api/cron/broadcast-dispatch` mewajibkan `Authorization: Bearer ${CRON_SECRET}` dan fail-closed jika secret kosong. |
| **E8** | Polling progres pengiriman | ✅ | Interval 3 detik berhenti otomatis saat status terminal (`SENT`, `FAILED`, `PARTIALLY_FAILED`), dan unmount hook membersihkan timer. |

#### 3.4 Riwayat, Rincian, Ekspor, Pembaca
| # | Skenario | Hasil | Bukti Implementasi |
| :--- | :--- | :---: | :--- |
| **R1** | Pencarian teks & filter riwayat | ✅ | Didukung di query server `getBroadcastHistory`, terikat dengan pagination dan URL query params. |
| **R2** | Staf mencoba melihat riwayat pengumuman orang lain | ✅ | Dialihkan ke `/notifikasi`; pemanggilan langsung ke Server Action ditolak dengan `Akses ditolak`. |
| **R3** | Manajer melihat detail broadcast orang lain | ✅ | [broadcast.queries.ts:340](file:///Users/imadearisdanuarta/Documents/KERJAAN/system_hris-system_management/hris_system_management/apps/hris/src/server/queries/broadcast.queries.ts#L340): Ditolak jika bukan pembuat, bukan Admin HR, dan timnya tidak terdaftar sebagai penerima. |
| **R4** | Otorisasi ekspor CSV log penerima | ✅ | Route `GET /api/broadcast/[id]/export` membatasi akses hanya untuk penulis atau pemegang hak `canSendAll`. |
| **R5** | Proteksi Formula Injection CSV | ✅ | Fungsi `escapeCsvField` memberi awalan `'` pada sel yang diawali `=, +, -, @, \t, \r`, meng-escape tanda kutip ganda, dan menyertakan BOM `\uFEFF`. |
| **R6** | Halaman pembaca `/pengumuman/[id]` | ✅ | Bebas tracking pixel; mencatat `readAt` otomatis dan idempoten jika konfirmasi klik tidak diwajibkan; menyediakan tombol konfirmasi jika diwajibkan. |
| **R7** | Hak unduh lampiran berkas PDF | ✅ | Route `/api/documents/broadcast-attachments/*` memvalidasi sesi dan menolak pihak yang bukan pengunggah, bukan penulis, bukan penerima, dan bukan Admin HR. |

---

### Bagian 4 — Matriks Keamanan dan Otorisasi (20 Titik Akses)

Semua tindakan mutasi dan pengambilan data sensitif pada modul ini diaudit:

| No | Endpoint / Server Action | Cek Sesi | Cek Hak Akses / Otorisasi | Audit Log | Catatan Keamanan |
| :---: | :--- | :---: | :---: | :---: | :--- |
| 1 | `sendBroadcastAction` | ✅ | ✅ `canSendAll` / `canSendTeam` | ✅ `BROADCAST_EMAIL_ENQUEUED` | Validasi Zod + isolasi scope tim |
| 2 | `getBroadcastFormDataAction` | ✅ | ✅ Sender Context | — | Staf biasa ditolak; manajer tidak menerima list global |
| 3 | `getBroadcastProgressAction` | ✅ | ✅ Penulis / Admin HR / Super Admin | — | Mencegah IDOR polling |
| 4 | `getBroadcastDetailAction` | ✅ | ✅ Penulis / Admin HR / Penerima | — | Mencegah IDOR intip rincian |
| 5 | `sendTestBroadcastAction` | ✅ | ✅ Sender Context | ✅ `BROADCAST_TEST_SENT` | Rate limit 5x / 10 menit |
| 6 | `resendFailedBroadcastAction` | ✅ | ✅ Penulis / `canSendAll` | ✅ `BROADCAST_RESEND_QUEUED` | Hanya memproses recipient gagal |
| 7 | `cancelScheduledBroadcastAction` | ✅ | ✅ Penulis / `canSendAll` | ✅ `BROADCAST_EMAIL_CANCELED` | Pembatalan status SCHEDULED atomik |
| 8 | `deleteBroadcastAttachmentAction`| ✅ | ✅ Pengunggah (`broadcastId === null`) | ✅ `DELETE` Attachment | Mencegah hapus lampiran aktif |
| 9 | `markBroadcastAsReadAction` | ✅ | ✅ Penerima Terdaftar | ✅ `BROADCAST_READ` | Idempoten, verifikasi kepemilikan user |
| 10 | `remindUnreadRecipientsAction` | ✅ | ✅ Penulis / `canSendAll` | ✅ `BROADCAST_REMIND_UNREAD` | Hanya penerima SENT belum membaca |
| 11 | `saveBroadcastDraftAction` | ✅ | ✅ Sender Context + Kepemilikan | ✅ `BROADCAST_DRAFT_SAVED` | Draf terisolasi per `ownerUserId` |
| 12 | `listBroadcastDraftsAction` | ✅ | ✅ `ownerUserId === session.user.id` | — | Hanya membaca draf pribadi |
| 13 | `getBroadcastDraftAction` | ✅ | ✅ `ownerUserId === session.user.id` | — | Tolak ID draf milik user lain |
| 14 | `deleteBroadcastDraftAction` | ✅ | ✅ `ownerUserId === session.user.id` | ✅ `BROADCAST_DRAFT_DELETED` | Hapus cascade lampiran terkait |
| 15 | `saveBroadcastTemplateAction` | ✅ | ✅ `canSendAll` (Admin HR / Super Admin) | ✅ `BROADCAST_TEMPLATE_SAVED` | Manajer dilarang membuat template global |
| 16 | `listBroadcastTemplatesAction` | ✅ | ✅ Sender Context | — | Seluruh pengirim berhak membaca template |
| 17 | `deleteBroadcastTemplateAction` | ✅ | ✅ `canSendAll` (Admin HR / Super Admin) | ✅ `BROADCAST_TEMPLATE_DELETED` | Manajer dilarang menghapus template |
| 18 | `POST /api/broadcast/upload-image` | ✅ | ✅ Sender Permission | ✅ `UPLOAD` BroadcastImage | Batas 3 MB, UUID filename, no path traversal |
| 19 | `POST /api/broadcast/upload-attachment` | ✅ | ✅ Sender Permission | ✅ `UPLOAD` BroadcastAttachment | Batas 5 MB, Magic bytes `%PDF-` |
| 20 | `GET /api/broadcast/[id]/export` | ✅ | ✅ Penulis / `canSendAll` | ✅ `BROADCAST_EXPORT` | Anti-CSV Injection, UTF-8 BOM |
| 21 | `POST /api/cron/broadcast-dispatch` | — (Token) | ✅ Bearer Secret Header | ✅ Via pemrosesan | Fail-closed jika secret kosong |

---

### Bagian 5 — Database dan Skema Prisma
- **Multi-Schema PostgreSQL:** Tabel berada dalam skema `hris` (`email_broadcasts`, `email_broadcast_recipients`, `broadcast_drafts`, `broadcast_templates`, `email_broadcast_attachments`).
- **Integritas Referensial & Cascade:**
  - Relasi `EmailBroadcastRecipient` ke `EmailBroadcast` menggunakan `onDelete: Cascade`.
  - Relasi `EmailBroadcastAttachment` ke `EmailBroadcast` menggunakan `onDelete: Cascade`.
- **Indeks Pengindeksan Efisien:**
  - `@@index([status, scheduledAt])` untuk cron query.
  - `@@index([broadcastId, readAt])` untuk kalkulasi konfirmasi baca.
  - `@@index([createdAt(sort: Desc)])` untuk pengurutan riwayat.
  - `@@index([ownerUserId, updatedAt(sort: Desc)])` untuk daftar draf.

---

### Bagian 6 & 7 — Email Deliverability & Integrasi PSPK

Pemeriksaan status DNS live terhadap domain resmi institusi `pspk.id`:

```
$ dig TXT pspk.id +short
"v=spf1 ip4:101.50.1.75 include:_spf.google.com ~all"

$ dig TXT _dmarc.pspk.id +short
"v=DMARC1;p=none"

$ dig MX pspk.id +short
1 aspmx.l.google.com.
5 alt1.aspmx.l.google.com.
...
```

- **SPF:** Terkonfigurasi dan mencakup Google Workspace (`include:_spf.google.com`).
- **DKIM & DMARC:** Record DMARC aktif (`p=none`).
- **Infrastruktur Mail:** PSPK menggunakan Google Workspace (`aspmx.l.google.com`). Pengiriman SMTP dengan kredensial Google App Password (port 465/587) sepenuhnya selaras dengan SPF dan DKIM Google.

---

### Bagian 8 & 9 — Deployment VPS & Runtime Docker
- **Docker Compose (`docker-compose.prod.yml`):**
  - Volume persisten `uploads:/app/uploads` terpasang pada service `hris` dan `sysmgmt` sehingga gambar dan lampiran PDF tidak hilang saat container di-restart.
  - Log rotation aktif dengan driver `json-file` (maksimal 10 MB × 5 file).
  - Reverse Proxy Caddy 2 (`docker/caddy/Caddyfile`) mengaktifkan `max_size 30MB` pada request body, mencukupi batas upload dokumen 5-10 MB.
  - Healthcheck terkonfigurasi pada `/api/health`.

---

## 4. Daftar Asumsi yang Tidak Cocok dengan Kode Asli

Selama audit, dicatat beberapa perbedaan asumsi antara dokumen instruksi audit dengan implementasi asli kode:

1. **Variabel Zona Waktu:**  
   *Dokumen Asumsi:* `NEXT_PUBLIC_APP_TIMEZONE`  
   *Kode Asli:* Menggunakan `APP_TIMEZONE` (server) dan fallback statis `"Asia/Jakarta"` di beberapa komponen klien.
2. **Variabel Base URL Aplikasi:**  
   *Dokumen Asumsi:* `APP_URL`  
   *Kode Asli:* Menggunakan `HRIS_URL` dan `NEXT_PUBLIC_HRIS_URL`.
3. **Format Header Subject Email:**  
   *Dokumen Asumsi:* `[PSPK HRIS] [PENTING] Judul`  
   *Kode Asli:* `[PENTING] [PSPK HRIS] Judul` (urutan prioritas diletakkan paling depan agar terbaca jelas di notifikasi mobile push email).

---

## 5. Risiko yang Diterima (Accepted Risks)

1. **Email Ganda Minor saat Server Terbunuh Paksa (SIGKILL):**  
   Jika proses Node.js dihentikan paksa (misal OOM killer atau listrik mati) tepat di antara waktu SMTP Google merespons `250 OK` dan sebelum Prisma menyelesaikan update status recipient ke `SENT`, ada kemungkinan kecil email tersebut akan dikirim ulang saat recovery cron berjalan. Risiko ini diterima karena jendela waktu eksekusi hanya beberapa milidetik per email.
2. **Format CSS Email pada Outlook Desktop Lawas:**  
   Email PSPK menggunakan styling modern di tag `<head><style>`. Klien email lawas berbasis Microsoft Word rendering engine (Outlook desktop versi lama) mungkin tidak merender rounded corners atau badge secara sempurna, namun naskah dan lampiran tetap 100% terbaca.

---

## 6. Prasyarat Deploy ke VPS Produksi

Sebelum menjalankan `docker compose -f docker-compose.prod.yml up -d` di server VPS, pastikan hal-hal berikut telah disiapkan oleh Tim IT PSPK:
1. **Google App Password:** Siapkan akun email kerja pengirim (misal `notifikasi@pspk.id` atau `no-reply@pspk.id`) dengan 2FA aktif dan Google App Password 16 karakter tanpa spasi untuk `SMTP_PASS`.
2. **Kotak Masuk `hr@pspk.id`:** Pastikan alamat ini aktif dan dipantau oleh tim HR untuk menerima balasan jika pengirim memilih mode balasan "Tim People & Culture".
3. **Cron VPS:** Pasang jadwal cron di host VPS (atau systemd timer) untuk memanggil POST ke endpoint `https://hris.pspk.id/api/cron/broadcast-dispatch` setiap 1 menit sekali dengan header `Authorization: Bearer <CRON_SECRET>`.
4. **Volume Storage & Izin Folder:** Pastikan direktori volume Docker `/app/uploads` memiliki izin tulis untuk user non-root `nextjs` (UID 10001).

---

## 7. Rekomendasi Deploy & Keputusan

### Keputusan: **GO BERSYARAT (Conditional Go)**

- **Alasan:** Seluruh fungsionalitas inti, integritas data, proteksi otorisasi ganda (RBAC), pencegahan CSV injection, dan kestabilan antrean pengiriman telah teruji 100%. Tidak ada temuan berstatus P0.
- **Syarat Sebelum Rilis Penuh:**
  1. Perbaiki temuan **AUDIT-01** (Pencegahan simulasi SMTP di lingkungan produksi).
  2. Perbaiki temuan **AUDIT-02** (Pengetatan `allowedStyles` pada sanitasi HTML).

### Rencana Rilis Bertahap (Phased Rollout Plan)

1. **Tahap 1 (Deploy Staging & Verifikasi IT):**  
   Deploy ke VPS staging, lakukan pengujian email uji simulasi dan email nyata ke kotak masuk tim IT internal (Gmail web & mobile).
2. **Tahap 2 (Uji Coba Terbatas HR):**  
   Beri akses kepada tim People & Culture (Admin HR) untuk mencoba mengirimkan draf pengumuman internal ke grup departemen kecil (misal tim IT/HR).
3. **Tahap 3 (Rilis Penuh Seluruh Karyawan):**  
   Buka fitur broadcast secara penuh untuk seluruh manajer dan pimpinan unit, diawali dengan pengumuman resmi kelembagaan.

---

*(Laporan audit selesai disusun. Sesuai prinsip "Cek Dulu, Perbaiki Nanti" di AGENTS.md Bagian 0.1, agent berhenti di sini dan menunggu keputusan/instruksi pengguna sebelum menyentuh atau memperbaiki kode apa pun).*
