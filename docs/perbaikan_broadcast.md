# Broadcast Pengumuman & Email PSPK: Pekerjaan Lanjutan

Dokumen instruksi untuk agent Antigravity. Berisi perbaikan dan fitur yang **belum** dikerjakan pada modul Broadcast (`/komunikasi/baru`, `/komunikasi/riwayat`).

---

## 0. Aturan Kerja (wajib dibaca)

1. Ikuti `AGENTS.md`, termasuk prinsip **"Cek Dulu, Perbaiki Nanti"**: sebelum mengubah file, baca kondisi terkini file dan skema terkait. Dokumen ini ditulis tanpa melihat `hris.prisma`, `@pspk/storage`, `can.ts`, dan `riwayat/page.tsx`. Verifikasi semua asumsi di bawah terhadap kode asli, dan laporkan jika ada yang berbeda.
2. Kerjakan **per fase** (Bagian 2 sampai 10), satu fase satu commit/PR. Jangan mencampur fase.
3. Setiap fase selesai hanya jika:
   - `pnpm typecheck` dan `pnpm lint` bersih,
   - seluruh tes broadcast lama tetap lulus (jangan mengubah tes lama diam-diam; jika harus berubah, jelaskan alasannya),
   - ada tes baru untuk perilaku baru (vitest, pola yang sama dengan `broadcast.*.test.ts`).
4. Otorisasi **berbasis permission** lewat `can(authCtx, "...")`, bukan string role hardcoded. Fallback role bawaan (`super_admin`, `admin_hr`, `manager`) boleh dipertahankan selama transisi.
5. Setiap server action baru: cek sesi, validasi Zod, cek otorisasi, `writeAudit(...)`, dan `revalidatePath` bila perlu.
6. Migrasi Prisma lewat `prisma migrate dev --name <deskriptif>`. Skema ada di `hris.prisma` (multi-schema). Semua migrasi harus **additive** (kolom nullable atau punya default) supaya data lama tetap valid.
7. Teks UI memakai Bahasa Indonesia, konsisten dengan yang sudah ada.
8. Ukuran teks UI baru: minimal `text-xs` (12px) untuk teks bantu dan `text-sm` untuk isi utama. Jangan memakai `text-[10px]` atau `text-[11px]`, dan jangan memakai `text-slate-400` untuk teks yang harus dibaca.

### Prasyarat (diasumsikan sudah diterapkan)

Perbaikan tahap 1 sampai 3 sebelumnya: `canSendAll` / `canSendTeam` di `BroadcastSenderContext`, `hasDeliverableEmail()`, `absolutizeImageUrls()`, pembatasan persona untuk non-`canSendAll`, `departmentId` di `BroadcastFormData.employees`, sanitizer tanpa `data:` untuk `href`. Jika belum ada, hentikan dan laporkan.

### Urutan dan ketergantungan

| Fase | Isi | Bergantung pada |
| :-- | :-- | :-- |
| 1 | Batch UX di form | Tidak ada |
| 2 | Riwayat: pagination dan filter dari server | Tidak ada |
| 3 | Email uji dan kirim ulang yang gagal | Fase 4 sebaiknya dulu, lihat catatan |
| 4 | Pengiriman di background (antrean) | Tidak ada |
| 5 | Picker penerima fleksibel | Tidak ada |
| 6 | Draf dan template | Fase 5 (field penerima baru) |
| 7 | Lampiran PDF | Fase 4 |
| 8 | Jadwal kirim | Fase 4, 5 |
| 9 | Kategori/prioritas, ekspor CSV, konfirmasi dibaca | Fase 2, 4 |

Catatan: kirim ulang (Fase 3) paling bersih jika memakai prosesor antrean dari Fase 4. Rekomendasi urutan eksekusi: **1 → 2 → 4 → 3 → 5 → 6 → 7 → 8 → 9**.

---

## 1. Batch UX di Form (`broadcast-create-form.tsx`)

Semua perubahan hanya di komponen form (dan satu komponen baru untuk pratinjau). Tidak ada perubahan skema.

### 1.1 Ringkas bagian "Identitas Pengirim"

**Masalah:** Section 2 terlalu besar padahal kasus umumnya "Atas nama PSPK, tanpa balasan".

**Spesifikasi:**
- State baru: `const [senderExpanded, setSenderExpanded] = useState(false)`.
- Mode ringkas (default): satu baris kartu berisi `Dikirim sebagai: {previewSender.displayName} • {label reply-to}` dan tombol teks **"Ubah"**.
  - Label reply-to: `NO_REPLY` → "tanpa balasan", `ORGANIZATION_HR` → "balasan ke hr@pspk.id", `SENDER_PERSONAL` → "balasan ke email Anda", `CUSTOM` → alamat kustom.
- Klik "Ubah" membuka panel lengkap yang sudah ada (pilihan persona + reply-to). Tombol "Selesai" menutupnya.
- Untuk non-`canSendAll`: tampilkan baris terkunci (seperti blok "Pengirim Terkunci" sekarang), tanpa tombol "Ubah".
- Buka panel otomatis (`setSenderExpanded(true)`) jika validasi `handleOpenConfirm` gagal karena `customSenderName` atau `customReplyToEmail` kosong, supaya error terlihat.
- Default tidak berubah: `canSendAll` → `ORGANIZATION` + `NO_REPLY`; lainnya → `PERSONAL`.

**Kriteria selesai:** pada kondisi default HR melihat satu baris, bukan empat kartu; semua opsi lama tetap bisa diakses.

### 1.2 Pratinjau berdampingan dengan editor

**Spesifikasi:**
- Ekstrak pratinjau email (blok "SIMULATED GMAIL/OUTLOOK PREVIEW FRAME") ke komponen baru `components/broadcast/broadcast-email-preview.tsx` dengan props: `subject`, `contentHtml`, `targetScope`, `previewSender`, `recipientCount`.
- Pratinjau menampilkan baris header gaya inbox di atas kop email: `Subjek: [PSPK HRIS] {subject}`, `Dari: {displayName} <no-reply@pspk.id>`, `Balas ke: ...`.
- Layout section 3:
  - Layar `lg` ke atas: grid 2 kolom, editor di kiri, pratinjau di kanan (`lg:sticky lg:top-4`, `max-h-[calc(100vh-2rem)] overflow-y-auto`). Tab "Tulis/Pratinjau" disembunyikan (`lg:hidden`).
  - Di bawah `lg`: perilaku tab yang sekarang dipertahankan.
- Konten pratinjau di-render dari `contentHtml` yang sama; sanitasi client memakai `sanitize-html` yang sama dengan server (atau DOMPurify) sebelum `dangerouslySetInnerHTML`. Jika menambah dependensi, tulis alasannya.
- Pratinjau memakai `absolutizeImageUrls`-setara di client (prefix `window.location.origin` hanya untuk pratinjau, tidak mengubah state).
- Lebar container halaman (`max-w-5xl` di `baru/page.tsx`) dinaikkan ke `max-w-7xl` agar dua kolom tidak sempit.

### 1.3 Sticky bar kirim

**Spesifikasi:**
- Ganti blok "ACTION BUTTONS" dengan bar `sticky bottom-0 z-30` (latar putih/blur, border atas, `pb-[env(safe-area-inset-bottom)]`).
- Isi bar kiri: `Ke: {recipientSummary.count} orang • Dari: {previewSender.displayName}` (truncate di layar kecil). Isi kanan: tautan "Riwayat" (disembunyikan di mobile), tombol **"Kirim Email Uji"** (aktif di Fase 3; sebelum itu jangan dirender) dan tombol submit utama.
- Tombol submit tetap `type="submit"` agar validasi HTML5 jalan.
- Pastikan bar tidak menutupi konten terakhir: beri `pb-24` pada wrapper form.

### 1.4 Ukuran font minimal

- Di `broadcast-create-form.tsx`, `broadcast-history-view.tsx`, `rich-text-editor.tsx`: ganti `text-[10px]` dan `text-[11px]` menjadi `text-xs`; `text-[11.5px]` menjadi `text-xs`.
- Teks bantu bertambah dari `text-slate-400` / `text-slate-500` menjadi `text-slate-600` (kontras minimal 4.5:1 pada latar putih).
- Pengecualian: badge uppercase kecil (misalnya badge scope) boleh `text-[11px]` hanya bila `font-bold` dan kontras terpenuhi; jelaskan di PR jika dipertahankan.
- Jangan mengubah isi template email HTML di `renderBroadcastEmailHtml` (itu CSS inline email, bukan UI aplikasi).

### 1.5 Empty state manajer tanpa bawahan

**Spesifikasi:**
- Jika `!canSendAll && teamMembers.length === 0`: render kartu empty state di atas form ("Belum ada anggota tim di bawah Anda. Hubungi HR jika ini keliru.") dan bungkus seluruh form dengan `<fieldset disabled>` (tombol kirim dan uji ikut nonaktif).
- Hapus validasi runtime "Tidak ada anggota tim bawahan aktif..." dari `handleOpenConfirm` hanya jika empty state sudah menutup jalurnya; validasi server tetap dipertahankan.

### 1.6 Konfirmasi kirim massal yang lebih kuat

**Spesifikasi:**
- Konstanta `BULK_CONFIRM_THRESHOLD = 20`. Mode massal berlaku jika `targetScope === "ALL_EMPLOYEES"` atau `recipientSummary.count >= BULK_CONFIRM_THRESHOLD`.
- Di modal konfirmasi tambahkan:
  - **Cuplikan isi:** teks polos dari `contentHtml` (ambil lewat `DOMParser` → `textContent`), dipotong 280 karakter, plus jumlah gambar (`<img>`) bila ada.
  - **Checkbox** "Saya sudah memeriksa isi pengumuman dan daftar penerima". Pada mode massal, tombol "Ya, Kirim Sekarang" `disabled` sampai dicentang. Reset ke `false` setiap modal dibuka.
- Tampilkan jumlah penerima dengan huruf besar di modal pada mode massal.

### Tes Fase 1

Tes komponen (React Testing Library, bila sudah ada di repo) atau minimal tes unit untuk helper murni yang diekstrak (label reply-to, ekstraksi cuplikan, penentuan mode massal). Jangan menambah library tes baru tanpa alasan.

---

## 2. Riwayat: Filter dan Pencarian dari Server

**Masalah:** `BroadcastHistoryView` memfilter di client dari `initialItems` (maksimal 15 data pertama) dan tidak punya kontrol halaman. Pengumuman lama tidak pernah bisa ditemukan.

### 2.1 Query (`broadcast.queries.ts`)

- Tambah parameter `status?: string` pada `getBroadcastHistory`, validasi ke nilai enum `BroadcastStatus` yang valid; nilai lain atau `"ALL"` diabaikan.
- Pertahankan filter `search` dan `scope` yang sudah ada. Batasi panjang `search` (maks 100 karakter) dan escape tidak diperlukan (Prisma sudah parameterized).
- Hasil mengembalikan `total`, `page`, `totalPages` (sudah ada). Statistik KPI tetap dihitung dari `roleWhere` saja (seluruh riwayat yang boleh dilihat user), bukan dari filter.

### 2.2 Halaman (`komunikasi/riwayat/page.tsx`)

- Baca `searchParams` (di Next versi terbaru berupa `Promise`; sesuaikan dengan versi yang dipakai): `q`, `scope`, `status`, `page`.
- Panggil `getBroadcastHistory(userId, { search: q, scope, status, page, pageSize: 15 })` dan teruskan `items`, `stats`, `canCreate`, `total`, `page`, `totalPages`, serta filter aktif ke view.
- Pertahankan redirect staf biasa ke `/notifikasi`.

### 2.3 View (`broadcast-history-view.tsx`)

- Hapus `useState(initialItems)` dan filter `useMemo` client. Pakai `items` dari props langsung (state lama tidak ikut update saat props berubah).
- Filter bersifat **URL-driven**: ubah `q`, `scope`, `status` lewat `router.replace` dengan `URLSearchParams`; reset `page` ke 1 saat filter berubah. Pencarian teks di-debounce 400 ms.
- Tambah kontrol halaman: "Sebelumnya / Berikutnya", teks "Halaman X dari Y • Z pengumuman", dan tombol nonaktif di ujung.
- Empty state memakai kondisi filter aktif dari props.
- Gunakan `useTransition` untuk indikator loading ringan saat navigasi.

### Kriteria selesai

- Mencari kata dari pengumuman yang sudah berada di halaman 3 tetap menemukannya.
- Refresh halaman mempertahankan filter dan halaman.
- Tes query: filter `status`, kombinasi `search` + `scope` + `status`, dan batas `pageSize`.

---

## 3. Pengiriman di Background (Antrean)

**Masalah:** `executeSendBroadcast` mengirim sinkron di dalam server action (batch 5, jeda 200 ms). Untuk ratusan penerima bisa timeout; HR hanya melihat spinner; proses mati jika server restart di tengah jalan.

### 3.1 Perubahan skema

```prisma
enum BroadcastStatus {
  QUEUED      // baru: sudah dibuat, menunggu dieksekusi
  SCHEDULED   // baru: dipakai Fase 8
  SENDING
  SENT
  PARTIALLY_FAILED
  FAILED
  CANCELED    // baru: dipakai Fase 8
}

enum BroadcastDeliveryStatus {
  PENDING
  SENDING     // baru: sedang di-claim worker
  SENT
  FAILED
}
```

Tambahkan di `EmailBroadcast` (semua nullable/berdefault): `startedAt DateTime?`, `finishedAt DateTime?`, `lockedAt DateTime?` (lease), `inAppDispatchedAt DateTime?`, `senderPersona String?`, `replyToMode String?`, `senderDisplayTitle String?`. Tambahkan di `EmailBroadcastRecipient`: `attempts Int @default(0)`, `lastAttemptAt DateTime?`.

> Kolom `senderPersona`, `replyToMode`, `senderDisplayTitle` dibutuhkan agar kirim ulang (Fase 4) dan pengiriman terjadwal dapat merender email identik dengan aslinya. Untuk record lama yang kolomnya `null`, gunakan fallback: persona = `PERSONAL` jika `senderName` sama dengan nama pengirim, selain itu `ORGANIZATION`; reply-to mode diturunkan dari `replyToEmail`.

### 3.2 Service

Refactor `broadcast-email.service.ts`:

1. **`enqueueBroadcast(userId, input, reqMeta)`**: lakukan semua validasi, otorisasi, sanitasi, resolusi penerima, dan buat record `EmailBroadcast` (status `QUEUED`) + recipient `PENDING`. Simpan persona/reply mode. Tulis audit `BROADCAST_EMAIL_QUEUED`. **Tidak mengirim email.** Mengembalikan `broadcastId`.
2. **`processBroadcast(broadcastId)`**: prosesor idempoten.
   - Claim lease: `updateMany` pada broadcast dengan `status in (QUEUED, SENDING)` dan (`lockedAt` null atau lebih lama dari 5 menit) → set `status=SENDING`, `lockedAt=now`, `startedAt` jika kosong. Jika tidak ada baris terpengaruh, keluar (sudah diproses worker lain).
   - Loop: ambil chunk recipient `PENDING` (ukuran dari env `BROADCAST_BATCH_SIZE`, default 5), claim atomik (`updateMany where id in (...) and status=PENDING` → `SENDING`, `attempts+1`), kirim, update `SENT` atau `FAILED` (dengan `errorMessage`). Perbarui `lockedAt` di tiap chunk (heartbeat). Jeda dari env `BROADCAST_BATCH_DELAY_MS` (default 200).
   - Recipient berstatus `SENDING` yang `lastAttemptAt`-nya lebih lama dari 5 menit dikembalikan ke `PENDING` (recovery crash).
   - Hitung `sentCount` / `failedCount` dengan **menghitung ulang dari tabel recipient** (`groupBy status`), bukan increment manual.
   - Saat tidak ada `PENDING` tersisa: set status akhir (`SENT` / `PARTIALLY_FAILED` / `FAILED`), `finishedAt`, lepas `lockedAt`, tulis audit `BROADCAST_EMAIL_COMPLETED`.
   - Notifikasi in-app: buat sekali saja, di awal pemrosesan, jika `sendInApp` dan `inAppDispatchedAt` null, lalu set `inAppDispatchedAt`.
   - Mode simulasi (SMTP belum diset) tetap didukung.
3. Ekstrak helper yang dipakai bersama: `createTransporter()`, `buildEmailForRecipient(broadcast, recipient)` (merender HTML + teks), dan `sendOne(...)`. Dipakai juga oleh email uji (Fase 4).

### 3.3 Pemicu eksekusi

- Segera setelah `enqueueBroadcast` di server action, jalankan `processBroadcast` lewat `after()` dari `next/server` (jika tersedia di versi Next yang dipakai) agar respons ke HR langsung kembali.
- Tambah route `POST /api/cron/broadcast-dispatch` (dilindungi header `Authorization: Bearer ${CRON_SECRET}`; tolak jika env tidak diset). Route ini memproses broadcast `QUEUED`, `SENDING` yang lease-nya kedaluwarsa, dan (Fase 8) `SCHEDULED` yang jatuh tempo. Dokumentasikan cara memanggilnya dari cron host/VPS (misalnya crontab tiap menit memanggil curl).
- Karena deploy ke VPS Docker dengan proses Node yang hidup terus, `after()` + cron sebagai jaring pengaman sudah cukup; **jangan** menambah dependensi antrean eksternal (Redis/BullMQ) tanpa persetujuan.

### 3.4 UI

- `sendBroadcastAction` kini memanggil `enqueueBroadcast`; pesan sukses: "Pengumuman masuk antrean dan sedang dikirim ke N penerima." dengan tombol ke riwayat.
- Action baru `getBroadcastProgressAction(broadcastId)` mengembalikan `{ status, totalRecipients, sentCount, failedCount }` (otorisasi sama seperti detail).
- Di riwayat: badge status baru (`QUEUED` abu, `SENDING` biru dengan animasi, `CANCELED` abu), progress bar `sentCount+failedCount / total`, dan polling tiap 3 detik **hanya** selama ada item berstatus `QUEUED`/`SENDING` di halaman (hentikan polling saat tidak ada atau tab tidak terlihat). Setelah selesai, `router.refresh()`.
- Perbarui filter status di riwayat: tambah "Dalam Antrean", "Sedang Dikirim", "Dibatalkan".

### 3.5 Catatan batas kirim SMTP

- Tampilkan peringatan di form bila jumlah penerima > 400 dan `SMTP_HOST` mengandung `gmail` (akun Gmail biasa dibatasi sekitar 500 email per hari; Workspace lebih tinggi). Bacalah nilai batas dari env opsional `BROADCAST_DAILY_LIMIT` bila ada; jangan menulis angka ke dalam kode tanpa konfigurasi.

### Tes

- `processBroadcast` idempoten: dijalankan dua kali paralel tidak menghasilkan email ganda (uji dengan mock transporter dan hitung pemanggilan `sendMail`).
- Recovery: recipient `SENDING` kedaluwarsa kembali diproses.
- Status akhir benar untuk skenario semua sukses, sebagian gagal, semua gagal.
- Route cron menolak tanpa secret.

---

## 4. Email Uji dan Kirim Ulang yang Gagal

### 4.1 Email uji ke diri sendiri

**Action:** `sendTestBroadcastAction(rawInput)` di `broadcast.actions.ts`.

- Input: sama dengan `sendBroadcastSchema` untuk `subject`, `contentHtml`, `senderPersona`, `customSenderName`, `replyToMode`, `customReplyToEmail`. Target scope dan penerima **tidak** dipakai.
- Otorisasi: `getBroadcastSenderContext` (minimal `canSendTeam`) dan aturan persona/reply-to yang sama dengan pengiriman sungguhan.
- Penerima: hanya `senderCtx.userEmail`. Jika `!hasDeliverableEmail(...)`, kembalikan error jelas ("Akun Anda belum punya email kerja").
- Render lewat helper yang sama dengan pengiriman asli (`buildEmailForRecipient`), `recipientName` = nama pengirim, subjek `[TES] [PSPK HRIS] {subject}`, banner kecil "Ini email uji, tidak dikirim ke penerima lain" di bagian atas.
- **Tidak** membuat record `EmailBroadcast` dan tidak membuat notifikasi in-app.
- Audit: `BROADCAST_EMAIL_TEST` (tanpa isi pesan penuh; cukup subjek, persona, dan hasil).
- Rate limit: maksimal 5 email uji per user per 10 menit (hitung dari audit log atau penghitung sederhana). Lewat batas → error "Terlalu sering mengirim email uji, coba lagi beberapa menit lagi."
- Mode simulasi: kembalikan pesan "SMTP belum dikonfigurasi, email uji hanya disimulasikan."

**UI:** tombol "Kirim Email Uji ke Saya" di sticky bar (dan dekat tab pratinjau). Validasi subjek dan isi sama dengan `handleOpenConfirm`. Tampilkan hasil di banner `feedback` (bukan `alert`).

### 4.2 Kirim ulang yang gagal

**Action:** `resendFailedBroadcastAction(broadcastId)`.

- Otorisasi: penulis broadcast (`senderUserId`) atau pemegang `canSendAll`. Tolak jika status broadcast `QUEUED`/`SENDING`.
- Cari recipient berstatus `FAILED`. Jika kosong → error.
- Setel recipient tersebut kembali ke `PENDING` (hapus `errorMessage`), set broadcast `status=QUEUED`, lalu panggil `processBroadcast` lewat `after()`. Karena prosesor (Bagian 3) mengonstruksi ulang email dari kolom tersimpan, kirim ulang menghasilkan email yang sama dengan aslinya.
- Jangan kirim ulang notifikasi in-app (`inAppDispatchedAt` sudah terisi).
- Audit: `BROADCAST_EMAIL_RESEND` dengan jumlah recipient yang diulang.
- Validasi ulang: jika karyawan sudah tidak `ACTIVE` atau emailnya tidak valid lagi, tandai `FAILED` dengan pesan "Karyawan tidak aktif" alih-alih dikirim.

**UI (modal rincian di riwayat):**
- Tombol "Kirim Ulang yang Gagal (N)" tampil jika `failedCount > 0` dan user berhak (server mengembalikan flag `canResend` di `BroadcastDetailItem`).
- Konfirmasi singkat sebelum menjalankan; setelah berhasil, muat ulang detail dan `router.refresh()`.
- Kolom "Status" untuk recipient gagal menampilkan `errorMessage` terlihat (bukan hanya `title` tooltip), karena HR perlu tahu penyebabnya.

### Tes

- Email uji hanya memanggil `sendMail` sekali dengan alamat pengirim, tidak membuat record broadcast.
- Rate limit menolak setelah batas.
- Kirim ulang: hanya recipient `FAILED` yang diproses; recipient `SENT` tidak dikirim lagi; user tanpa hak ditolak.

---

## 5. Picker Penerima yang Lebih Fleksibel

### 5.1 Perubahan skema dan schema Zod

- `EmailBroadcast`: tambahkan `targetDepartmentIds String[] @default([])`, `customEmployeeIds String[] @default([])`, `excludedEmployeeIds String[] @default([])`. Pertahankan `targetDepartmentId` lama (untuk data lama); saat menulis baru, isi keduanya (`targetDepartmentId` = elemen pertama) agar riwayat lama tetap terbaca.
- `sendBroadcastSchema`: tambah `targetDepartmentIds: z.array(z.string().trim()).optional().default([])` dan `excludedEmployeeIds: z.array(z.string().trim()).optional().default([])`. Perlakukan `targetDepartmentId` lama sebagai fallback (jika `targetDepartmentIds` kosong).
- Batasi ukuran array (misalnya maksimal 1000 elemen) untuk mencegah payload berlebih.

### 5.2 Service

- `getBroadcastRecipients`: untuk `DEPARTMENT` pakai `currentDepartmentId: { in: departmentIds }`; terapkan `excludedEmployeeIds` pada **semua** scope (`id: { notIn: excluded }`). Pengecualian pengirim sendiri dan filter email valid tetap berlaku.
- Untuk non-`canSendAll`: `excludedEmployeeIds` boleh dipakai pada scope `TEAM`, tetapi tetap hanya di dalam bawahan langsung.
- Simpan daftar yang dipakai ke record broadcast (kolom baru di atas) agar bisa ditampilkan di riwayat.

### 5.3 Komponen `RecipientPicker`

Komponen baru `components/broadcast/recipient-picker.tsx` menggantikan sub-selector departemen dan daftar checkbox kustom.

- **Departemen:** multi-select (checkbox atau chip) dengan jumlah pegawai per departemen (hitung dari `employees` dengan aturan `deliverable`).
- **Kustom:** kolom pencarian (nama atau email, case-insensitive), filter departemen, tombol "Pilih semua hasil pencarian" / "Batal pilih hasil pencarian" (hanya memengaruhi item yang tampil), dan penghitung terpilih.
- **Kecualikan orang:** untuk scope `ALL_EMPLOYEES`, `DEPARTMENT`, dan `TEAM`, tombol "Kecualikan orang tertentu" membuka daftar yang sama untuk memilih yang dikecualikan; tampilkan sebagai chip yang bisa dihapus.
- Daftar panjang: `max-h-64 overflow-y-auto`; jika pegawai lebih dari 300, render dibatasi (misalnya 200 teratas hasil pencarian dengan petunjuk "persempit pencarian").
- Pembaruan `getRecipientSummary` di form: ikut memperhitungkan multi-departemen dan pengecualian, dengan fungsi hitung yang **sama** (`hasDeliverableEmail`, kecualikan pengirim) seperti di server.

### 5.4 Riwayat

- Label scope `DEPARTMENT` menampilkan beberapa nama divisi (potong dengan "+N lainnya" bila panjang).
- Modal rincian menampilkan "Dikecualikan: N orang" bila ada.

### Tes

- Multi-departemen mengembalikan gabungan yang benar tanpa duplikat.
- Pengecualian bekerja di semua scope, dan manajer tidak bisa mengecualikan/memasukkan orang di luar timnya.
- Data lama (hanya `targetDepartmentId`) tetap diproses benar.

---

## 6. Draf dan Template

### 6.1 Skema

```prisma
model BroadcastDraft {
  id                  String   @id @default(cuid())
  ownerUserId         String
  title               String   @default("")
  subject             String   @default("")
  contentHtml         String   @default("")
  targetScope         BroadcastScope @default(TEAM)
  targetDepartmentIds String[] @default([])
  customEmployeeIds   String[] @default([])
  excludedEmployeeIds String[] @default([])
  senderPersona       String   @default("ORGANIZATION")
  customSenderName    String?
  replyToMode         String   @default("NO_REPLY")
  customReplyToEmail  String?
  sendInApp           Boolean  @default(true)
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@index([ownerUserId, updatedAt(sort: Desc)])
  @@map("broadcast_drafts")
  @@schema("hris")
}

model BroadcastTemplate {
  id              String   @id @default(cuid())
  name            String
  category        String?
  subject         String
  contentHtml     String
  isShared        Boolean  @default(false)
  createdByUserId String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([isShared, updatedAt(sort: Desc)])
  @@index([createdByUserId])
  @@map("broadcast_templates")
  @@schema("hris")
}
```

Sesuaikan dengan konvensi `@@map`/`@@schema`/tipe ID yang dipakai model lain di `hris.prisma` (periksa `EmailBroadcast`).

### 6.2 Action

- `saveBroadcastDraftAction`, `listBroadcastDraftsAction`, `loadBroadcastDraftAction`, `deleteBroadcastDraftAction`: draf **privat milik pembuat** (semua query difilter `ownerUserId = session.user.id`).
- `saveBroadcastTemplateAction`, `listBroadcastTemplatesAction`, `deleteBroadcastTemplateAction`: template pribadi (`isShared=false`, hanya pemilik); template **bersama** (`isShared=true`) hanya boleh dibuat/dihapus oleh `canSendAll`, dibaca semua pengirim broadcast.
- `contentHtml` draf/template disanitasi dengan `sanitizeBroadcastContent` saat disimpan.
- Batas: maksimal 50 draf per user dan 100 template; ukuran `contentHtml` maksimal 500 KB.
- Audit hanya untuk template bersama (buat/hapus).

### 6.3 UI

- Tombol di bar atas form: **"Draf & Template"** membuka panel samping (drawer) dengan dua tab: "Draf Saya" dan "Template".
- Tombol "Simpan sebagai Draf" (judul opsional; default dari subjek) dan "Simpan sebagai Template" (nama, kategori, opsi "bagikan ke semua pengirim" hanya untuk `canSendAll`).
- Muat draf: mengisi seluruh state form. Jika draf berisi `customEmployeeIds` / `excludedEmployeeIds` yang sudah tidak ada atau tidak aktif, buang yang tidak valid dan tampilkan peringatan "N penerima dihapus karena tidak aktif".
- Muat template: hanya mengisi `subject` dan `contentHtml` (tanpa penerima). Konfirmasi bila isi editor saat ini tidak kosong ("Ganti isi saat ini?").
- Setelah draf berhasil dikirim, tawarkan menghapus draf asalnya (state `activeDraftId`).
- Simpan otomatis (autosave) **opsional**: debounce 3 detik ke draf aktif hanya setelah user pernah menyimpan draf manual; jangan membuat draf baru otomatis.

### 6.4 Variabel personalisasi (kecil, opsional)

- Dukung `{{nama}}` dan `{{nama_depan}}` di isi/subjek. Ganti **di server per penerima** setelah sanitasi, dengan `escapeHtml(nilai)`. Di pratinjau ganti dengan contoh ("Budi Santoso"/"Budi").
- Tampilkan petunjuk variabel di editor. Variabel tak dikenal dibiarkan apa adanya.

### Tes

- Isolasi: user A tidak bisa membaca/menghapus draf user B.
- Template bersama: non-`canSendAll` ditolak saat membuat; semua pengirim bisa membaca.
- Penggantian variabel: nama berisi karakter HTML (`<`, `&`) ter-escape.

---

## 7. Lampiran PDF

### 7.1 Skema

```prisma
model EmailBroadcastAttachment {
  id          String   @id @default(cuid())
  broadcastId String?
  draftId     String?
  uploadedBy  String
  key         String
  fileName    String
  mimeType    String
  sizeBytes   Int
  sha256      String
  createdAt   DateTime @default(now())

  broadcast EmailBroadcast? @relation(fields: [broadcastId], references: [id], onDelete: Cascade)

  @@index([broadcastId])
  @@index([draftId])
  @@map("email_broadcast_attachments")
  @@schema("hris")
}
```

Tambahkan relasi balik `attachments EmailBroadcastAttachment[]` di `EmailBroadcast`. Lampiran yang sudah diunggah tapi belum dipakai (`broadcastId` dan `draftId` null) dibersihkan oleh job pembersih (hapus yang lebih dari 24 jam).

### 7.2 Endpoint upload

`POST /api/broadcast/upload-attachment`, mengikuti pola `upload-image/route.ts`:

- Otorisasi sama (`hris.broadcast.send` atau role bawaan).
- Hanya `application/pdf`. Validasi **magic bytes** (`%PDF-` di 5 byte pertama), jangan hanya percaya `file.type`.
- Batas: 5 MB per file, maksimal 3 file dan 10 MB total per broadcast (batas total diverifikasi lagi saat `enqueue`).
- Nama file: sanitasi (buang path, karakter kontrol, batasi 120 karakter); kunci penyimpanan `broadcast-attachments/<uuid>.pdf`.
- **Jangan** daftarkan `broadcast-attachments/` sebagai aset publik di route `/api/documents/[...path]`. Akses unduh hanya untuk user terautentikasi yang berhak (penulis, `canSendAll`, atau penerima tercatat). Periksa dan, bila perlu, tambahkan aturan otorisasi untuk prefix ini di route tersebut.
- Audit `UPLOAD` dengan `entityType: "BroadcastAttachment"`.
- Gunakan API `@pspk/storage` yang ada (cek apakah tersedia metode baca/`get` untuk mengambil `Buffer`; jika belum, tambahkan di provider dengan pola yang konsisten).

### 7.3 Pengiriman

- `sendBroadcastSchema`: tambah `attachmentIds: z.array(z.string()).max(3).default([])`. Saat `enqueueBroadcast`, verifikasi semua lampiran milik user yang sama, belum terpakai, lalu kaitkan ke broadcast.
- `buildEmailForRecipient` menambahkan `attachments: [{ filename, content: Buffer, contentType: "application/pdf" }]` ke `sendMail`. Muat `Buffer` sekali per proses `processBroadcast` (cache dalam memori selama satu eksekusi), bukan per penerima.
- Email uji juga membawa lampiran yang sama.
- Daftarkan lampiran di bagian bawah email HTML ("Lampiran: nama-file.pdf") agar jelas bagi penerima.

### 7.4 UI

- Section 3 form: area "Lampiran PDF" dengan tombol unggah, daftar file (nama, ukuran, tombol hapus), indikator total ukuran, dan pesan error dari server.
- Riwayat (modal rincian): daftar lampiran dengan tautan unduh (hanya untuk yang berhak).
- Tampilkan di modal konfirmasi: "Lampiran: N file (X MB)".

### Tes

- Upload menolak file non-PDF yang MIME-nya dipalsukan (isi bukan `%PDF-`).
- Batas ukuran dan jumlah.
- `sendMail` menerima `attachments` yang benar; lampiran milik user lain ditolak.

---

## 8. Jadwal Kirim

Bergantung pada Fase 3 (antrean + cron) dan Fase 5 (field penerima).

### 8.1 Skema

- `EmailBroadcast`: tambah `scheduledAt DateTime?`. Index `@@index([status, scheduledAt])`.
- Status `SCHEDULED` dan `CANCELED` sudah ditambahkan di Fase 3.
- Untuk broadcast terjadwal, `totalRecipients` awal boleh perkiraan; nilai final diisi saat dispatch.

### 8.2 Perilaku

- `sendBroadcastSchema`: tambah `scheduledAt: z.coerce.date().optional().nullable()`. Validasi: minimal 5 menit dari sekarang, maksimal 90 hari ke depan.
- `enqueueBroadcast`: jika `scheduledAt` ada, simpan broadcast dengan status `SCHEDULED` dan **parameter target** (scope, departemen, kustom, pengecualian) tanpa membuat recipient. Penerima di-resolve **saat jatuh tempo**, sehingga pegawai baru/keluar ikut diperhitungkan.
- Dispatch (di route cron): untuk `SCHEDULED` dengan `scheduledAt <= now`, claim atomik (`updateMany` status `SCHEDULED` → `QUEUED`), **evaluasi ulang otorisasi pengirim** (`getBroadcastSenderContext(senderUserId)`; jika sudah kehilangan hak, set `FAILED` dengan alasan dan tulis audit), resolve penerima, buat recipient, lalu `processBroadcast`.
- Batalkan: `cancelScheduledBroadcastAction(broadcastId)` hanya untuk status `SCHEDULED`, oleh penulis atau `canSendAll`; set `CANCELED`; audit `BROADCAST_EMAIL_CANCELED`.
- Ubah jadwal: batal lalu buat ulang cukup untuk iterasi ini (tidak perlu fitur edit).

### 8.3 Zona waktu

- Simpan UTC. Input form memakai `datetime-local` dan dikonversi ke UTC di client **dengan zona waktu eksplisit** dari konfigurasi `NEXT_PUBLIC_APP_TIMEZONE` (default `Asia/Jakarta`; ganti sesuai lokasi kantor, mis. `Asia/Makassar`). Selalu tampilkan label zona di UI ("WIB"/"WITA") dan di riwayat.
- **Konfirmasi ke pemilik proyek zona waktu yang benar sebelum implementasi.**

### 8.4 UI

- Section baru "Waktu Pengiriman": radio "Kirim sekarang" / "Jadwalkan", `datetime-local` bila dijadwalkan, dengan teks ringkasan ("Akan dikirim Senin, 24 Nov 2026 08.00 WIB").
- Modal konfirmasi menampilkan waktu jadwal; tombol berganti "Ya, Jadwalkan".
- Riwayat: badge "Terjadwal" dengan waktu, tombol "Batalkan Jadwal".
- Sticky bar: label tombol utama menyesuaikan ("Kirim Pengumuman" / "Jadwalkan Pengumuman").

### Tes

- Validasi batas waktu minimum dan maksimum.
- Dispatch hanya memproses `SCHEDULED` yang jatuh tempo dan tidak dua kali (claim atomik).
- Pengirim kehilangan hak → broadcast gagal dengan audit, tidak terkirim.
- Pembatalan tidak mungkin setelah status berubah dari `SCHEDULED`.

---

## 9. Kategori/Prioritas, Ekspor CSV, Konfirmasi Dibaca

### 9.1 Kategori dan prioritas

- Skema: `EmailBroadcast.category String?` (nilai: `UMUM`, `KEPEGAWAIAN`, `PAYROLL`, `ACARA`, `KEBIJAKAN`, `DARURAT`) dan `priority String @default("NORMAL")` (`NORMAL` | `PENTING`). Validasi dengan `z.enum` di schema, bukan string bebas.
- Email: prioritas `PENTING` → subjek diawali `[PENTING]`, header `X-Priority: 1` dan `Importance: high`, badge merah di header email. Kategori tampil sebagai badge kedua di email dan riwayat.
- `DARURAT` hanya boleh oleh `canSendAll` (validasi server).
- Form: dua select kecil di section 3. Riwayat: filter kategori ke query server (Fase 2).

### 9.2 Ekspor CSV log penerima

- Route `GET /api/broadcast/[id]/export` (atau server action yang mengembalikan string) dengan otorisasi yang sama seperti `getBroadcastDetail` ditambah syarat **penulis atau `canSendAll`** (manajer/staf penerima biasa tidak boleh mengekspor log seluruh penerima).
- Kolom: `Nama, Email, Departemen, Status, Waktu Kirim, Percobaan, Pesan Error, Dibaca Pada`.
- **Proteksi CSV injection:** sel yang diawali `=`, `+`, `-`, `@`, tab, atau CR diberi awalan `'`. Escape tanda kutip ganda dan bungkus sel yang berisi koma/baris baru.
- Tambahkan BOM UTF-8 agar Excel membaca karakter dengan benar. Nama file `broadcast-<id>-<yyyymmdd>.csv`. Audit `BROADCAST_EXPORT`.
- Tombol "Ekspor CSV" di modal rincian.

### 9.3 Konfirmasi dibaca

**Keputusan desain: jangan memakai tracking pixel.** Pixel tidak andal (diblokir klien email, atau dibuka otomatis oleh proxy) dan bermasalah dari sisi privasi karyawan. Gunakan konfirmasi **di dalam aplikasi**:

- Skema: `EmailBroadcastRecipient.readAt DateTime?`.
- Halaman pembaca `/pengumuman/[id]` (reader view) untuk penerima: menampilkan naskah lengkap (`contentHtml` sudah tersanitasi) dan lampiran; saat dibuka oleh penerima tercatat, set `readAt` jika masih kosong (idempoten). Otorisasi: penerima tercatat (via `employee.userId`), penulis, atau `canSendAll`.
- Notifikasi in-app diarahkan ke `/pengumuman/[id]` (bukan `/notifikasi`). Email juga menyertakan tautan "Baca di portal HRIS" bila `sendInApp` aktif.
- Opsi per broadcast "Minta konfirmasi dibaca" (`requireReadReceipt Boolean @default(false)`): bila aktif, halaman pembaca menampilkan tombol "Saya sudah membaca" yang mengisi `readAt` secara eksplisit (lebih bermakna daripada sekadar membuka halaman).
- Riwayat/modal rincian: kolom "Dibaca" dan ringkasan "X dari Y sudah membaca", filter "Belum membaca", dan (bila diinginkan) tombol "Ingatkan yang belum membaca" yang mengirim notifikasi in-app lagi (tidak mengirim ulang email).
- Fase ini sekaligus menutup temuan agent: karyawan bisa membaca naskah lengkap meski email gagal/masuk spam.

### Tes

- CSV: sel berbahaya diberi awalan, kutip ter-escape, BOM ada, user tanpa hak ditolak.
- `readAt` hanya terisi sekali; non-penerima ditolak di halaman pembaca.
- `DARURAT` ditolak untuk non-`canSendAll`.

---

## 10. Checklist Akhir per Fase (salin ke deskripsi PR)

- [ ] Migrasi Prisma additive dan sudah dijalankan; `prisma generate` ulang
- [ ] Zod schema, tipe TS, dan UI konsisten (tidak ada field yang hanya ada di satu sisi)
- [ ] Otorisasi berbasis `can()` + audit untuk setiap aksi baru
- [ ] Tes baru ditulis; `pnpm typecheck`, `pnpm lint`, dan `vitest` bersih
- [ ] Tidak ada `text-[10px]`/`text-[11px]` baru dan tidak ada `text-slate-400` untuk teks penting
- [ ] Dokumentasi env baru (`CRON_SECRET`, `BROADCAST_BATCH_SIZE`, `BROADCAST_BATCH_DELAY_MS`, `BROADCAST_DAILY_LIMIT`, `NEXT_PUBLIC_APP_TIMEZONE`, base URL aplikasi) di `.env.example`
- [ ] Laporan singkat: apa yang diubah, asumsi yang ternyata berbeda dari dokumen ini, dan hal yang sengaja ditunda