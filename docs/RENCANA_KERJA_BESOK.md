# Rencana Kerja Harian — PSPK HRIS & System Management

**Target Pengerjaan:** Sesi Berikutnya / Besok  
**Fokus Utama:** Penyempurnaan Fitur Fase 2 (HRIS Core Backlog) & Persiapan Fase 3 (System Management)

---

## 1. Prioritas Utama: Penyempurnaan Modul HRIS Core (Fase 2 Backlog)

Berdasarkan audit komprehensif role Admin HR dan manajemen kepegawaian, terdapat beberapa fitur penyempurnaan yang perlu diselesaikan sebelum beralih penuh ke Fase 3:

### A. Manajemen Karyawan (`/karyawan`)
1. **Tab Dokumen Karyawan di `/karyawan/[id]`:**
   - Menambahkan tab "Dokumen" pada profil pegawai.
   - Fitur unggah dan pratinjau dokumen penting: KTP, NPWP, Ijazah, dan Kontrak Kerja fisik/PDF.
   - Integrasi langsung dengan `StorageProvider` lokal (`.data/uploads/documents/`).
   - Validasi batas ukuran file (maks 25 MB) dan pembatasan tipe MIME (PDF, JPG, PNG).
2. **Aksi "Tautkan / Undang Akun Login":**
   - Menambahkan tombol aksi pada halaman detail karyawan bagi pegawai yang belum memiliki user terhubung (`userId: null`).
   - Mengenerate akun login pengguna baru, memberikan role default `staff`, dan menautkan `Employee.userId`.
3. **Visualisasi Struktur Organisasi (`/karyawan/struktur`):**
   - Membangun halaman bagan hierarki organisasi sederhana yang menampilkan hubungan divisi, unit kerja riset, jabatan, serta atasan dan bawahan langsung.

### B. Modul Absensi & Cuti (`/absensi`, `/cuti`)
1. **Fitur Ekspor Data CSV di Rekap Absensi (`/absensi/rekap`):**
   - Mengaktifkan tombol "Ekspor Data (CSV)" di header rekap absensi agar menghasilkan file CSV unduhan secara dinamis sesuai filter tahun, bulan, dan divisi yang dipilih.
   - Mencatat aktivitas ekspor ke dalam `audit_logs` (`EVENT: EXPORT_ATTENDANCE`).
2. **Override Keputusan Cuti oleh Admin HR (`/cuti/persetujuan`):**
   - Memberikan hak kepada Admin HR / Super Admin pada tab "Semua Pengajuan" untuk mengubah (*override*) status permohonan yang sudah diputuskan (`APPROVED` / `REJECTED`).
   - Mewajibkan pengisian alasan override minimal 5 karakter demi kepatuhan audit trail.
3. **Penyesuaian Saldo Cuti Individu (`/cuti/pengaturan`):**
   - Menambahkan tab/antarmuka penyesuaian saldo cuti tahunan per karyawan di `/cuti/pengaturan` (untuk hak cuti istimewa atau carry-over tahun sebelumnya).

---

## 2. Rencana Kerja Alternatif: Memulai Fase 3 (System Management — `apps/sysmgmt`)

Jika sisa backlog Fase 2 dianggap cukup dan ingin langsung membuka modul System Management:

1. **Aplikasi System Management (`apps/sysmgmt` di port 3002):**
   - Menghubungkan sesi terpadu (shared session/cookie) dengan `apps/hris`.
   - Setup layout shell dan navigasi modul: User & Role, Aset & Lisensi, Dokumen/SOP, Audit Log.
2. **Modul Pengguna & Role (RBAC Management):**
   - Halaman daftar pengguna: undang user baru, aktif/nonaktifkan akun, reset password.
   - Matriks permission ↔ role editor.
   - Proteksi keamanan: pencegahan penghapusan / penonaktifan Super Admin terakhir.
3. **Audit Log Viewer:**
   - Halaman pemantau aktivitas sistem (`/audit`): pencarian, filter tanggal, modul, dan aktor.
   - Ekspor audit log ke format CSV.

---

## 3. Checklist Kesiapan & Definisi Selesai (DoD)

- [ ] Seluruh mutasi data sensitif tercatat di tabel `core.audit_logs`.
- [ ] Otorisasi server-side selalu aktif via `assertCan()` dengan `AuthContext`.
- [ ] `pnpm typecheck` lulus 100% di seluruh 9 paket workspace.
- [ ] `pnpm test` suite unit test lulus tanpa regresi.
- [ ] `pnpm --filter @pspk/hris build` terkompilasi optimal (0 error, 0 warning).
